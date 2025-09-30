import Order from '../models/Order.js';
import Item from '../models/Item.js';
import logger from '../utils/logger.js';
import realtimeService from '../services/realtimeService.js';
import stripeService from '../services/stripeService.js';

// Create a new order
const createOrder = async (req, res) => {
  try {
    const {
      customer,
      delivery,
      items,
      specialRequests,
      paymentMethod = 'cash_on_delivery', // Default to COD, can be 'stripe'
      deliveryFee // Accept calculated delivery fee from frontend
    } = req.body;


    // Validate required fields
    if (!customer?.email || !customer?.phoneNumber) {
      return res.status(400).json({
        success: false,
        message: 'Customer email and phone number are required'
      });
    }

    if (!delivery?.type || !['delivery', 'collection'].includes(delivery.type)) {
      return res.status(400).json({
        success: false,
        message: 'Valid delivery type (delivery or collection) is required'
      });
    }

    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'At least one item is required'
      });
    }

    // Validate delivery address for delivery orders
    if (delivery.type === 'delivery' && (!delivery.address || !delivery.postcode)) {
      return res.status(400).json({
        success: false,
        message: 'Delivery address and postcode are required for delivery orders'
      });
    }

    // Validate items and get current prices
    const validatedItems = [];
    for (const cartItem of items) {
      const item = await Item.findById(cartItem.itemId);
      if (!item) {
        return res.status(400).json({
          success: false,
          message: `Item with ID ${cartItem.itemId} not found`
        });
      }

      if (!item.active) {
        return res.status(400).json({
          success: false,
          message: `Item "${item.name}" is currently not available`
        });
      }

      validatedItems.push({
        itemId: item._id,
        name: item.name,
        price: item.price,
        quantity: cartItem.quantity,
        imageUrl: item.imageUrl
      });
    }

    // Generate unique order ID
    let orderId;
    let isUnique = false;
    let attempts = 0;
    const maxAttempts = 10;

    while (!isUnique && attempts < maxAttempts) {
      orderId = Order.generateOrderId();
      const existingOrder = await Order.findOne({ orderId });
      if (!existingOrder) {
        isUnique = true;
      }
      attempts++;
    }

    if (!isUnique) {
      return res.status(500).json({
        success: false,
        message: 'Failed to generate unique order ID. Please try again.'
      });
    }

    // Calculate pricing
    const subtotal = validatedItems.reduce((total, item) => {
      return total + (item.price * item.quantity);
    }, 0);
    
    // Use provided delivery fee or calculate default (fallback for backwards compatibility)
    const finalDeliveryFee = deliveryFee !== undefined ? deliveryFee : (delivery.type === 'delivery' ? 2.0 : 0);
    const total = subtotal + finalDeliveryFee;

    
    // Determine payment method - use provided method or default based on delivery type
    let finalPaymentMethod = paymentMethod;
    if (paymentMethod === 'cash_on_delivery' || paymentMethod === 'cash_on_collection') {
      // Use provided COD/COC method
      finalPaymentMethod = paymentMethod;
    } else if (paymentMethod === 'stripe') {
      // Use Stripe
      finalPaymentMethod = 'stripe';
    } else {
      // Default based on delivery type
      finalPaymentMethod = delivery.type === 'delivery' ? 'cash_on_delivery' : 'cash_on_collection';
    }
    
    // Create order
    const orderData = {
      orderId,
      customer: {
        email: customer.email.toLowerCase().trim(),
        phoneNumber: customer.phoneNumber.trim()
      },
      delivery: {
        type: delivery.type,
        address: delivery.address?.trim(),
        postcode: delivery.postcode?.trim()
      },
      items: validatedItems,
      pricing: {
        subtotal,
        deliveryFee: finalDeliveryFee,
        total
      },
      payment: {
        method: finalPaymentMethod,
        status: 'pending',
        amount: total
      },
      specialRequests: specialRequests?.trim() || null
    };

    const order = new Order(orderData);
    await order.save();


    // Create Stripe payment intent if payment method is Stripe
    let stripePaymentIntent = null;
    if (finalPaymentMethod === 'stripe') {
      const stripeResult = await stripeService.createPaymentIntent(order, orderId, total);
      if (stripeResult.success) {
        // Update order with Stripe payment intent details
        order.payment.stripe.paymentIntentId = stripeResult.paymentIntent.id;
        order.payment.stripe.clientSecret = stripeResult.paymentIntent.clientSecret;
        order.payment.status = 'requires_payment_method';
        await order.save();
        
        stripePaymentIntent = stripeResult.paymentIntent;
      } else {
        // If Stripe payment intent creation fails, delete the order
        await Order.findByIdAndDelete(order._id);
        return res.status(500).json({
          success: false,
          message: 'Failed to create payment intent. Please try again.'
        });
      }
    }

    // Emit realtime notification for new order
    if (order.status === 'pending') {
      realtimeService.onOrderCreated(order);
    }

    logger.info(`New order created: ${orderId}`, {
      orderId,
      customerEmail: customer.email,
      deliveryType: delivery.type,
      itemCount: items.length,
      total: order.pricing.total
    });

    const responseData = {
      orderId: order.orderId,
      status: order.status,
      total: order.pricing.total,
      estimatedDeliveryTime: order.estimatedDeliveryTime,
      createdAt: order.createdAt,
      paymentMethod: order.payment.method
    };

    // Include Stripe payment intent data if applicable
    if (stripePaymentIntent) {
      responseData.stripe = {
        paymentIntentId: stripePaymentIntent.id,
        clientSecret: stripePaymentIntent.clientSecret,
        status: stripePaymentIntent.status
      };
    }


    res.status(201).json({
      success: true,
      message: 'Order created successfully',
      data: responseData
    });

  } catch (error) {
    logger.error('Error creating order:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error while creating order'
    });
  }
};

// Get all orders (with pagination and filtering)
const getOrders = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      status,
      deliveryType,
      customerEmail,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;

    // Build filter object
    const filter = {};
    if (status) filter.status = status;
    if (deliveryType) filter['delivery.type'] = deliveryType;
    if (customerEmail) filter['customer.email'] = customerEmail.toLowerCase();

    // Build sort object
    const sort = {};
    sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const orders = await Order.find(filter)
      .sort(sort)
      .skip(skip)
      .limit(parseInt(limit))
      .lean(); // Removed .populate() - items data is already embedded

    const total = await Order.countDocuments(filter);

    res.json({
      success: true,
      data: {
        orders,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(total / parseInt(limit)),
          totalOrders: total,
          hasNext: skip + orders.length < total,
          hasPrev: parseInt(page) > 1
        }
      }
    });

  } catch (error) {
    logger.error('Error fetching orders:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error while fetching orders'
    });
  }
};

// Get order by ID
const getOrderById = async (req, res) => {
  try {
    const { orderId } = req.params;
    
    const order = await Order.findOne({ orderId })
      .populate('items.itemId', 'name price imageUrl description')
      .lean();

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }


    res.json({
      success: true,
      data: order
    });

  } catch (error) {
    logger.error('Error fetching order:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error while fetching order'
    });
  }
};

// Get orders by customer email
const getOrdersByCustomer = async (req, res) => {
  try {
    const { email } = req.params;
    const { page = 1, limit = 10, status } = req.query;

    const filter = { 'customer.email': email.toLowerCase() };
    if (status) filter.status = status;

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const orders = await Order.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .lean(); // Removed .populate() - items data is already embedded

    const total = await Order.countDocuments(filter);

    res.json({
      success: true,
      data: {
        orders,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(total / parseInt(limit)),
          totalOrders: total
        }
      }
    });

  } catch (error) {
    logger.error('Error fetching customer orders:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error while fetching customer orders'
    });
  }
};

// Update order status
const updateOrderStatus = async (req, res) => {
  try {
    const { orderId } = req.params;
    const { status, notes } = req.body;

    console.log('Update order status request:', {
      orderId,
      body: req.body,
      status,
      notes
    });

    if (!status) {
      return res.status(400).json({
        success: false,
        message: 'Status is required'
      });
    }

    const validStatuses = ['pending', 'confirmed', 'cancelled', 'ready_for_collection', 'delivered', 'collected'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: `Invalid status. Must be one of: ${validStatuses.join(', ')}`
      });
    }

    // Try to find by custom orderId first, then by MongoDB _id as fallback
    let order = await Order.findOne({ orderId });
    if (!order) {
      order = await Order.findById(orderId);
    }
    
    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    // Validate status transitions based on delivery type
    const currentStatus = order.status;
    const deliveryType = order.delivery.type;
    
    // Define valid transitions based on delivery type
    let validTransitions = {};
    
    if (deliveryType === 'collection') {
      validTransitions = {
        'pending': ['confirmed', 'cancelled'],
        'confirmed': ['cancelled', 'ready_for_collection'],
        'ready_for_collection': ['collected', 'cancelled'],
        'cancelled': [],
        'collected': []
      };
    } else { // delivery
      validTransitions = {
        'pending': ['confirmed', 'cancelled'],
        'confirmed': ['cancelled', 'delivered'],
        'delivered': [],
        'cancelled': []
      };
    }

    if (!validTransitions[currentStatus]?.includes(status)) {
      return res.status(400).json({
        success: false,
        message: `Cannot change status from ${currentStatus} to ${status} for ${deliveryType} orders`
      });
    }

    // Prevent any changes to cancelled orders
    if (currentStatus === 'cancelled') {
      return res.status(400).json({
        success: false,
        message: 'Cannot update status of cancelled orders'
      });
    }

    // Special validation for collection orders
    if (status === 'ready_for_collection' && order.delivery.type !== 'collection') {
      return res.status(400).json({
        success: false,
        message: 'Ready for collection status is only valid for collection orders'
      });
    }

    // Update order
    if (notes) {
      order.notes = notes;
    }

    await order.updateStatus(status);

    // Emit realtime notifications for order status change
    realtimeService.onOrderUpdated(order, currentStatus);
    realtimeService.onOrderStatusChanged(order.orderId, status, currentStatus);

    logger.info(`Order status updated: ${orderId}`, {
      orderId,
      oldStatus: currentStatus,
      newStatus: status,
      updatedBy: req.user?.email || 'system'
    });

    res.json({
      success: true,
      message: 'Order status updated successfully',
      data: {
        orderId: order.orderId,
        status: order.status,
        updatedAt: order.updatedAt
      }
    });

  } catch (error) {
    logger.error('Error updating order status:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error while updating order status'
    });
  }
};

// Cancel order
const cancelOrder = async (req, res) => {
  try {
    const { orderId } = req.params;
    const { reason } = req.body;

    // Try to find by custom orderId first, then by MongoDB _id as fallback
    let order = await Order.findOne({ orderId });
    if (!order) {
      order = await Order.findById(orderId);
    }
    
    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    if (!order.canBeCancelled()) {
      return res.status(400).json({
        success: false,
        message: `Order cannot be cancelled. Current status: ${order.status}`
      });
    }

    const previousStatus = order.status;
    order.status = 'cancelled';
    if (reason) {
      order.notes = reason;
    }

    await order.save();

    // Emit realtime notification for order cancellation
    realtimeService.onOrderUpdated(order, previousStatus);

    logger.info(`Order cancelled: ${orderId}`, {
      orderId,
      reason,
      cancelledBy: req.user?.email || 'customer'
    });

    res.json({
      success: true,
      message: 'Order cancelled successfully',
      data: {
        orderId: order.orderId,
        status: order.status,
        cancelledAt: order.updatedAt
      }
    });

  } catch (error) {
    logger.error('Error cancelling order:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error while cancelling order'
    });
  }
};

// Get order statistics
const getOrderStats = async (req, res) => {
  try {
    const { period = 'today' } = req.query;
    
    let startDate, endDate;
    const now = new Date();
    
    switch (period) {
      case 'today':
        startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        endDate = new Date(startDate.getTime() + 24 * 60 * 60 * 1000);
        break;
      case 'week':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        endDate = now;
        break;
      case 'month':
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        endDate = now;
        break;
      default:
        startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        endDate = new Date(startDate.getTime() + 24 * 60 * 60 * 1000);
    }

    const stats = await Order.aggregate([
      {
        $match: {
          createdAt: { $gte: startDate, $lt: endDate }
        }
      },
      {
        $group: {
          _id: null,
          totalOrders: { $sum: 1 },
          totalRevenue: { $sum: '$pricing.total' },
          averageOrderValue: { $avg: '$pricing.total' },
          deliveryOrders: {
            $sum: { $cond: [{ $eq: ['$delivery.type', 'delivery'] }, 1, 0] }
          },
          collectionOrders: {
            $sum: { $cond: [{ $eq: ['$delivery.type', 'collection'] }, 1, 0] }
          },
          pendingOrders: {
            $sum: { $cond: [{ $eq: ['$status', 'pending'] }, 1, 0] }
          },
          confirmedOrders: {
            $sum: { $cond: [{ $eq: ['$status', 'confirmed'] }, 1, 0] }
          },
          completedOrders: {
            $sum: { $cond: [{ $in: ['$status', ['delivered', 'collected']] }, 1, 0] }
          }
        }
      }
    ]);

    const result = stats[0] || {
      totalOrders: 0,
      totalRevenue: 0,
      averageOrderValue: 0,
      deliveryOrders: 0,
      collectionOrders: 0,
      pendingOrders: 0,
      confirmedOrders: 0,
      completedOrders: 0
    };

    res.json({
      success: true,
      data: {
        period,
        ...result,
        averageOrderValue: Math.round(result.averageOrderValue * 100) / 100
      }
    });

  } catch (error) {
    logger.error('Error fetching order stats:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error while fetching order statistics'
    });
  }
};

// Delete an order (admin only)
const deleteOrder = async (req, res) => {
  try {
    const { orderId } = req.params;

    // Try to find by custom orderId first, then by MongoDB _id as fallback
    let order = await Order.findOne({ orderId });
    if (!order) {
      order = await Order.findById(orderId);
    }
    
    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    // Delete using the order's _id
    await Order.findByIdAndDelete(order._id);

    logger.info(`Order deleted: ${order.orderId}`, {
      deletedBy: req.user?.email || 'system',
      orderId: order.orderId,
      customerEmail: order.customer.email
    });

    res.json({
      success: true,
      message: 'Order deleted successfully',
      data: {
        orderId: order.orderId
      }
    });

  } catch (error) {
    logger.error('Error deleting order:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error while deleting order'
    });
  }
};

// Update payment status
const updatePaymentStatus = async (req, res) => {
  try {
    const { orderId } = req.params;
    const { paymentStatus } = req.body;

    console.log('Update payment status request:', {
      orderId,
      paymentStatus
    });

    if (!paymentStatus) {
      return res.status(400).json({
        success: false,
        message: 'Payment status is required'
      });
    }

    const validPaymentStatuses = ['pending', 'paid', 'refunded'];
    if (!validPaymentStatuses.includes(paymentStatus)) {
      return res.status(400).json({
        success: false,
        message: `Invalid payment status. Must be one of: ${validPaymentStatuses.join(', ')}`
      });
    }

    // Try to find by custom orderId first, then by MongoDB _id as fallback
    let order = await Order.findOne({ orderId });
    if (!order) {
      order = await Order.findById(orderId);
    }
    
    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    // Only allow payment status updates for COD/COC orders
    if (!['cash_on_delivery', 'cash_on_collection'].includes(order.payment.method)) {
      return res.status(400).json({
        success: false,
        message: 'Payment status can only be updated for COD/COC orders'
      });
    }

    const oldPaymentStatus = order.payment.status;
    order.payment.status = paymentStatus;
    await order.save();

    // Emit realtime notifications for payment status change
    realtimeService.onOrderUpdated(order, order.status);
    realtimeService.onOrderStatusChanged(order.orderId, order.status, order.status);

    logger.info(`Payment status updated: ${order.orderId}`, {
      orderId: order.orderId,
      oldPaymentStatus,
      newPaymentStatus: paymentStatus,
      updatedBy: req.user?.email || 'system'
    });

    res.json({
      success: true,
      message: 'Payment status updated successfully',
      data: {
        orderId: order.orderId,
        paymentStatus: order.payment.status
      }
    });

  } catch (error) {
    logger.error('Error updating payment status:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error while updating payment status'
    });
  }
};

// Confirm Stripe payment
const confirmStripePayment = async (req, res) => {
  try {
    const { orderId } = req.params;
    const { paymentIntentId } = req.body;

    if (!paymentIntentId) {
      return res.status(400).json({
        success: false,
        message: 'Payment intent ID is required'
      });
    }

    // Find order
    let order = await Order.findOne({ orderId });
    if (!order) {
      order = await Order.findById(orderId);
    }
    
    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    if (order.payment.method !== 'stripe') {
      return res.status(400).json({
        success: false,
        message: 'This order does not use Stripe payment'
      });
    }

    // Confirm payment intent with Stripe
    const confirmResult = await stripeService.confirmPaymentIntent(paymentIntentId);
    
    if (!confirmResult.success) {
      return res.status(400).json({
        success: false,
        message: confirmResult.error
      });
    }

    const paymentIntent = confirmResult.paymentIntent;

    // Update order based on payment status
    if (paymentIntent.status === 'succeeded') {
      order.payment.status = 'paid';
      order.status = 'confirmed'; // Auto-confirm paid orders
    } else if (paymentIntent.status === 'requires_payment_method') {
      order.payment.status = 'requires_payment_method';
    } else if (paymentIntent.status === 'requires_confirmation') {
      order.payment.status = 'requires_confirmation';
    } else {
      order.payment.status = 'failed';
    }

    await order.save();

    // Emit realtime notification
    realtimeService.onOrderUpdated(order, 'pending');

    logger.info(`Stripe payment confirmed for order ${orderId}`, {
      orderId,
      paymentIntentId,
      status: paymentIntent.status,
      amount: paymentIntent.amount
    });

    res.json({
      success: true,
      message: 'Payment confirmed successfully',
      data: {
        orderId: order.orderId,
        paymentStatus: order.payment.status,
        orderStatus: order.status,
        stripeStatus: paymentIntent.status
      }
    });

  } catch (error) {
    logger.error('Error confirming Stripe payment:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error while confirming payment'
    });
  }
};

// Create Stripe refund
const createStripeRefund = async (req, res) => {
  try {
    const { orderId } = req.params;
    const { amount, reason = 'requested_by_customer' } = req.body;
    
    // Handle new refund data structure
    let stripeReason = reason;
    let customReason = '';
    
    if (typeof reason === 'object' && reason.stripeReason) {
      stripeReason = reason.stripeReason;
      customReason = reason.customReason || '';
    }

    // Find order
    let order = await Order.findOne({ orderId });
    if (!order) {
      order = await Order.findById(orderId);
    }
    
    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    if (order.payment.method !== 'stripe') {
      return res.status(400).json({
        success: false,
        message: 'This order does not use Stripe payment'
      });
    }

    if (!order.payment.stripe.paymentIntentId) {
      return res.status(400).json({
        success: false,
        message: 'No payment intent found for this order'
      });
    }

    if (order.payment.status !== 'paid') {
      return res.status(400).json({
        success: false,
        message: 'Can only refund paid orders'
      });
    }

    // Validate refund amount (with small tolerance for floating-point precision)
    if (amount && amount > order.payment.amount + 0.01) {
      return res.status(400).json({
        success: false,
        message: `Refund amount (£${amount.toFixed(2)}) cannot exceed original payment amount (£${order.payment.amount.toFixed(2)})`
      });
    }

    // Log amounts for debugging
    const refundAmount = amount || order.payment.amount;
    logger.info(`Creating refund for order ${orderId}`, {
      orderPaymentAmount: order.payment.amount,
      requestedRefundAmount: amount,
      finalRefundAmount: refundAmount,
      paymentIntentId: order.payment.stripe.paymentIntentId,
      stripeReason: stripeReason,
      customReason: customReason
    });

    // Create refund with Stripe
    const refundResult = await stripeService.createRefund(
      order.payment.stripe.paymentIntentId,
      refundAmount,
      stripeReason
    );

    if (!refundResult.success) {
      return res.status(400).json({
        success: false,
        message: refundResult.error
      });
    }

    // Update order with refund details
    order.payment.status = 'refunded';
    order.payment.stripe.refundId = refundResult.refund.id;
    order.payment.stripe.refundAmount = refundResult.refund.amount / 100; // Convert from pence
    order.payment.stripe.refundReason = stripeReason;
    order.payment.stripe.customRefundReason = customReason;
    await order.save();

    logger.info(`Stripe refund created for order ${orderId}`, {
      orderId,
      refundId: refundResult.refund.id,
      amount: refundResult.refund.amount,
      reason
    });

    res.json({
      success: true,
      message: 'Refund created successfully',
      data: {
        orderId: order.orderId,
        refundId: refundResult.refund.id,
        refundAmount: refundResult.refund.amount / 100,
        refundStatus: refundResult.refund.status,
        reason
      }
    });

  } catch (error) {
    logger.error('Error creating Stripe refund:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error while creating refund'
    });
  }
};

// Create order with successful payment (for Stripe payments)
const createOrderWithPayment = async (req, res) => {
  try {
    const {
      customer,
      delivery,
      items,
      specialRequests,
      paymentIntentId,
      paymentIntentData,
      orderId,
      deliveryFee // Accept calculated delivery fee from frontend
    } = req.body;

    // Validate required fields
    if (!customer?.email || !customer?.phoneNumber) {
      return res.status(400).json({
        success: false,
        message: 'Customer email and phone number are required'
      });
    }

    if (!delivery?.type || !['delivery', 'collection'].includes(delivery.type)) {
      return res.status(400).json({
        success: false,
        message: 'Valid delivery type (delivery or collection) is required'
      });
    }

    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'At least one item is required'
      });
    }

    if (!paymentIntentId || !paymentIntentData || !orderId) {
      return res.status(400).json({
        success: false,
        message: 'Payment intent ID, data, and order ID are required'
      });
    }

    // Validate order ID format
    const orderIdRegex = /^TGIF\d{8}\d{3}$/;
    if (!orderIdRegex.test(orderId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid order ID format'
      });
    }

    // Check if order ID already exists
    const existingOrder = await Order.findOne({ orderId });
    if (existingOrder) {
      return res.status(400).json({
        success: false,
        message: 'Order ID already exists. Please try again.'
      });
    }

    // Validate delivery address for delivery orders
    if (delivery.type === 'delivery' && (!delivery.address || !delivery.postcode)) {
      return res.status(400).json({
        success: false,
        message: 'Delivery address and postcode are required for delivery orders'
      });
    }

    // Validate items and get current prices
    const validatedItems = [];
    for (const cartItem of items) {
      const item = await Item.findById(cartItem.itemId);
      if (!item) {
        return res.status(400).json({
          success: false,
          message: `Item with ID ${cartItem.itemId} not found`
        });
      }
      validatedItems.push({
        itemId: item._id,
        name: item.name,
        price: item.price,
        quantity: cartItem.quantity,
        imageUrl: item.imageUrl
      });
    }

    // Use the provided order ID (already validated above)

    // Calculate pricing
    const subtotal = validatedItems.reduce((total, item) => {
      return total + (item.price * item.quantity);
    }, 0);
    
    // Use provided delivery fee or calculate default (fallback for backwards compatibility)
    const finalDeliveryFee = deliveryFee !== undefined ? deliveryFee : (delivery.type === 'delivery' ? 2.0 : 0);
    const total = subtotal + finalDeliveryFee;

    // Verify payment intent with Stripe
    const paymentVerification = await stripeService.verifyPaymentIntent(paymentIntentId, total);
    if (!paymentVerification.success) {
      return res.status(400).json({
        success: false,
        message: 'Payment verification failed: ' + paymentVerification.error
      });
    }

    // Create order with successful payment
    const order = new Order({
      orderId,
      customer: {
        email: customer.email.trim().toLowerCase(),
        phoneNumber: customer.phoneNumber.trim()
      },
      delivery: {
        type: delivery.type,
        address: delivery.type === 'delivery' ? delivery.address.trim() : undefined,
        postcode: delivery.type === 'delivery' ? delivery.postcode.trim() : undefined
      },
      items: validatedItems,
      specialRequests: specialRequests?.trim() || null,
      pricing: {
        subtotal,
        deliveryFee: finalDeliveryFee,
        total
      },
      payment: {
        method: 'stripe',
        status: 'paid', // Payment is already successful
        amount: total,
        stripe: {
          paymentIntentId: paymentIntentId,
          clientSecret: paymentIntentData.client_secret,
          refundId: null,
          refundAmount: 0,
          refundReason: null
        }
      },
      status: 'pending', // Keep Stripe orders in pending for manual review
      estimatedDeliveryTime: new Date(Date.now() + (delivery.type === 'delivery' ? 45 : 30) * 60 * 1000)
    });

    await order.save();

    // Emit realtime notification for new order
    realtimeService.onOrderCreated(order);

    logger.info(`New order created with successful payment: ${orderId}`, {
      orderId,
      customerEmail: customer.email,
      deliveryType: delivery.type,
      itemCount: items.length,
      total: order.pricing.total,
      paymentIntentId
    });

    const responseData = {
      orderId: order.orderId,
      status: order.status,
      total: order.pricing.total,
      estimatedDeliveryTime: order.estimatedDeliveryTime,
      createdAt: order.createdAt,
      paymentMethod: order.payment.method,
      paymentStatus: order.payment.status
    };

    res.status(201).json({
      success: true,
      message: 'Order created successfully with confirmed payment',
      data: responseData
    });

  } catch (error) {
    logger.error('Error creating order with payment:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error while creating order'
    });
  }
};

// Bulk delete orders (admin only)
const bulkDeleteOrders = async (req, res) => {
  try {
    const { orderIds } = req.body;

    if (!orderIds || !Array.isArray(orderIds) || orderIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Order IDs array is required'
      });
    }

    // Find all orders by their custom orderIds or MongoDB _ids
    const orders = await Order.find({
      $or: [
        { orderId: { $in: orderIds } },
        { _id: { $in: orderIds } }
      ]
    });

    if (orders.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'No orders found'
      });
    }

    // Delete all orders
    await Order.deleteMany({ _id: { $in: orders.map(o => o._id) } });

    logger.info(`Bulk orders deleted: ${orders.length}`, {
      deletedBy: req.user?.email || 'system',
      count: orders.length,
      orderIds: orders.map(o => o.orderId)
    });

    res.json({
      success: true,
      message: `${orders.length} order(s) deleted successfully`,
      data: {
        deletedCount: orders.length,
        orderIds: orders.map(o => o.orderId)
      }
    });

  } catch (error) {
    logger.error('Error bulk deleting orders:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error while deleting orders'
    });
  }
};

export {
  createOrder,
  createOrderWithPayment,
  getOrders,
  getOrderById,
  getOrdersByCustomer,
  updateOrderStatus,
  updatePaymentStatus,
  cancelOrder,
  getOrderStats,
  deleteOrder,
  bulkDeleteOrders,
  confirmStripePayment,
  createStripeRefund
};

export default {
  createOrder,
  createOrderWithPayment,
  getOrders,
  getOrderById,
  getOrdersByCustomer,
  updateOrderStatus,
  updatePaymentStatus,
  cancelOrder,
  getOrderStats,
  deleteOrder,
  bulkDeleteOrders,
  confirmStripePayment,
  createStripeRefund
};
