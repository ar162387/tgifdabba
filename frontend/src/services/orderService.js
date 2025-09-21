import apiClient from './apiClient';

const ORDER_API_BASE = '/orders';

export const orderService = {
  // Create a new order
  createOrder: async (orderData) => {
    try {
      const response = await apiClient.post(ORDER_API_BASE, orderData);
      return response.data;
    } catch (error) {
      console.error('Error creating order:', error);
      throw new Error(
        error.response?.data?.message || 
        'Failed to create order. Please try again.'
      );
    }
  },

  // Create order with successful payment (for Stripe payments)
  createOrderWithPayment: async (orderData, paymentIntentId, paymentIntentData, orderId) => {
    try {
      const response = await apiClient.post(`${ORDER_API_BASE}/with-payment`, {
        ...orderData,
        paymentIntentId,
        paymentIntentData,
        orderId
      });
      return response.data;
    } catch (error) {
      console.error('Error creating order with payment:', error);
      throw new Error(
        error.response?.data?.message || 
        'Failed to create order with payment. Please try again.'
      );
    }
  },

  // Confirm Stripe payment
  confirmStripePayment: async (orderId, paymentIntentId) => {
    try {
      const response = await apiClient.post(`${ORDER_API_BASE}/${orderId}/confirm-payment`, {
        paymentIntentId
      });
      return response.data;
    } catch (error) {
      console.error('Error confirming Stripe payment:', error);
      throw new Error(
        error.response?.data?.message || 
        'Failed to confirm payment. Please try again.'
      );
    }
  },

  // Create Stripe refund
  createStripeRefund: async (orderId, amount = null, reason = 'requested_by_customer') => {
    try {
      const response = await apiClient.post(`${ORDER_API_BASE}/${orderId}/refund`, {
        amount,
        reason
      });
      return response.data;
    } catch (error) {
      console.error('Error creating Stripe refund:', error);
      throw new Error(
        error.response?.data?.message || 
        'Failed to create refund. Please try again.'
      );
    }
  },

  // Get order by ID
  getOrderById: async (orderId) => {
    try {
      const response = await apiClient.get(`${ORDER_API_BASE}/${orderId}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching order:', error);
      throw new Error(
        error.response?.data?.message || 
        'Failed to fetch order details.'
      );
    }
  },

  // Get orders by customer email
  getOrdersByCustomer: async (email, options = {}) => {
    try {
      const params = new URLSearchParams();
      if (options.page) params.append('page', options.page);
      if (options.limit) params.append('limit', options.limit);
      if (options.status) params.append('status', options.status);

      const queryString = params.toString();
      const url = `${ORDER_API_BASE}/customer/${encodeURIComponent(email)}${queryString ? `?${queryString}` : ''}`;
      
      const response = await apiClient.get(url);
      return response.data;
    } catch (error) {
      console.error('Error fetching customer orders:', error);
      throw new Error(
        error.response?.data?.message || 
        'Failed to fetch your orders.'
      );
    }
  },

  // Update order status (admin only)
  updateOrderStatus: async (orderId, status, notes = null) => {
    try {
      const response = await apiClient.patch(`${ORDER_API_BASE}/${orderId}/status`, {
        status,
        notes
      });
      return response.data;
    } catch (error) {
      console.error('Error updating order status:', error);
      throw new Error(
        error.response?.data?.message || 
        'Failed to update order status.'
      );
    }
  },

  // Cancel order
  cancelOrder: async (orderId, reason = null) => {
    try {
      const response = await apiClient.patch(`${ORDER_API_BASE}/${orderId}/cancel`, {
        reason
      });
      return response.data;
    } catch (error) {
      console.error('Error cancelling order:', error);
      throw new Error(
        error.response?.data?.message || 
        'Failed to cancel order.'
      );
    }
  },

  // Get order statistics (admin only)
  getOrderStats: async (period = 'today') => {
    try {
      const response = await apiClient.get(`${ORDER_API_BASE}/stats/overview?period=${period}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching order stats:', error);
      throw new Error(
        error.response?.data?.message || 
        'Failed to fetch order statistics.'
      );
    }
  },

  // Get all orders (admin only)
  getAllOrders: async (options = {}) => {
    try {
      const params = new URLSearchParams();
      if (options.page) params.append('page', options.page);
      if (options.limit) params.append('limit', options.limit);
      if (options.status) params.append('status', options.status);
      if (options.deliveryType) params.append('deliveryType', options.deliveryType);
      if (options.customerEmail) params.append('customerEmail', options.customerEmail);
      if (options.sortBy) params.append('sortBy', options.sortBy);
      if (options.sortOrder) params.append('sortOrder', options.sortOrder);

      const queryString = params.toString();
      const url = `${ORDER_API_BASE}${queryString ? `?${queryString}` : ''}`;
      
      const response = await apiClient.get(url);
      return response.data;
    } catch (error) {
      console.error('Error fetching all orders:', error);
      throw new Error(
        error.response?.data?.message || 
        'Failed to fetch orders.'
      );
    }
  }
};

// Helper function to format order data for display
export const formatOrderData = (order) => {
  return {
    orderId: order.orderId,
    status: order.status,
    customer: order.customer,
    delivery: order.delivery,
    items: order.items,
    pricing: order.pricing,
    payment: order.payment,
    specialRequests: order.specialRequests,
    notes: order.notes,
    createdAt: order.createdAt,
    updatedAt: order.updatedAt,
    estimatedDeliveryTime: order.estimatedDeliveryTime,
    actualDeliveryTime: order.actualDeliveryTime
  };
};

// Helper function to get status display information
export const getStatusInfo = (status) => {
  const statusMap = {
    pending: {
      label: 'Pending',
      color: 'text-yellow-600',
      bgColor: 'bg-yellow-100',
      description: 'Your order is being processed'
    },
    confirmed: {
      label: 'Confirmed',
      color: 'text-blue-600',
      bgColor: 'bg-blue-100',
      description: 'Your order has been confirmed'
    },
    cancelled: {
      label: 'Cancelled',
      color: 'text-red-600',
      bgColor: 'bg-red-100',
      description: 'Your order has been cancelled'
    },
    ready_for_collection: {
      label: 'Ready for Collection',
      color: 'text-purple-600',
      bgColor: 'bg-purple-100',
      description: 'Your order is ready for collection'
    },
    delivered: {
      label: 'Delivered',
      color: 'text-green-600',
      bgColor: 'bg-green-100',
      description: 'Your order has been delivered'
    },
    collected: {
      label: 'Collected',
      color: 'text-green-600',
      bgColor: 'bg-green-100',
      description: 'Your order has been collected'
    }
  };

  return statusMap[status] || {
    label: status,
    color: 'text-gray-600',
    bgColor: 'bg-gray-100',
    description: 'Unknown status'
  };
};

// Helper function to get payment status display information
export const getPaymentStatusInfo = (status) => {
  const paymentStatusMap = {
    pending: {
      label: 'Pending',
      color: 'text-yellow-600',
      bgColor: 'bg-yellow-100',
      description: 'Payment is pending'
    },
    paid: {
      label: 'Paid',
      color: 'text-green-600',
      bgColor: 'bg-green-100',
      description: 'Payment completed successfully'
    },
    refunded: {
      label: 'Refunded',
      color: 'text-blue-600',
      bgColor: 'bg-blue-100',
      description: 'Payment has been refunded'
    },
    failed: {
      label: 'Failed',
      color: 'text-red-600',
      bgColor: 'bg-red-100',
      description: 'Payment failed'
    },
    requires_payment_method: {
      label: 'Payment Required',
      color: 'text-orange-600',
      bgColor: 'bg-orange-100',
      description: 'Please complete your payment'
    },
    requires_confirmation: {
      label: 'Confirmation Required',
      color: 'text-purple-600',
      bgColor: 'bg-purple-100',
      description: 'Payment confirmation required'
    }
  };

  return paymentStatusMap[status] || {
    label: status,
    color: 'text-gray-600',
    bgColor: 'bg-gray-100',
    description: 'Unknown payment status'
  };
};

// Helper function to get payment method display
export const getPaymentMethodInfo = (method) => {
  const paymentMap = {
    cash_on_delivery: {
      label: 'Cash on Delivery',
      description: 'Pay when your order arrives'
    },
    cash_on_collection: {
      label: 'Cash on Collection',
      description: 'Pay when you collect your order'
    },
    stripe: {
      label: 'Card Payment',
      description: 'Pay securely with your card'
    }
  };

  return paymentMap[method] || {
    label: method,
    description: 'Unknown payment method'
  };
};

// Helper function to calculate estimated delivery time
export const getEstimatedDeliveryTime = (order) => {
  if (order.estimatedDeliveryTime) {
    return new Date(order.estimatedDeliveryTime);
  }

  // Default estimation based on order type
  const now = new Date();
  const estimatedMinutes = order.delivery.type === 'delivery' ? 45 : 30;
  return new Date(now.getTime() + estimatedMinutes * 60 * 1000);
};

// Helper function to check if order can be cancelled
export const canCancelOrder = (order) => {
  return ['pending', 'confirmed'].includes(order.status);
};

// Helper function to check if order is ready for collection
export const isReadyForCollection = (order) => {
  return order.delivery.type === 'collection' && order.status === 'ready_for_collection';
};

export default orderService;
