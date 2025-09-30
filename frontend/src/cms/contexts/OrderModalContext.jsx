import React, { createContext, useContext, useState, useCallback } from 'react';
import { Clock, CheckCircle, XCircle } from 'lucide-react';
import { orderService } from '../services/orderService';
import OrderViewModal from '../components/OrderViewModal';
import toast from 'react-hot-toast';

const OrderModalContext = createContext();

export const useOrderModal = () => {
  const context = useContext(OrderModalContext);
  if (!context) {
    throw new Error('useOrderModal must be used within an OrderModalProvider');
  }
  return context;
};

export const OrderModalProvider = ({ children }) => {
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  // Status options and configurations
  const statusOptions = [
    { value: '', label: 'All Status' },
    { value: 'pending', label: 'Pending' },
    { value: 'confirmed', label: 'Confirmed' },
    { value: 'cancelled', label: 'Cancelled' },
    { value: 'ready_for_collection', label: 'Ready for Collection' },
    { value: 'delivered', label: 'Delivered' },
    { value: 'collected', label: 'Collected' }
  ];

  const paymentStatusIcons = {
    pending: Clock,
    paid: CheckCircle,
    refunded: XCircle,
    failed: XCircle,
    requires_payment_method: Clock,
    requires_confirmation: Clock
  };

  const paymentStatusColors = {
    pending: 'bg-yellow-100 text-yellow-800',
    paid: 'bg-green-100 text-green-800',
    refunded: 'bg-blue-100 text-blue-800',
    failed: 'bg-red-100 text-red-800',
    requires_payment_method: 'bg-orange-100 text-orange-800',
    requires_confirmation: 'bg-purple-100 text-purple-800'
  };

  const openOrderModal = useCallback(async (orderId) => {
    if (!orderId) return;
    
    setIsLoading(true);
    try {
      // Fetch the individual order by orderId
      const response = await orderService.getOrderById(orderId);
      setSelectedOrder(response.data);
    } catch (error) {
      console.error('Failed to fetch order:', error);
      toast.error('Failed to load order details');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const openOrderModalWithData = useCallback((orderData) => {
    setSelectedOrder(orderData);
  }, []);

  const closeOrderModal = useCallback(() => {
    setSelectedOrder(null);
  }, []);

  const handleStatusUpdate = useCallback(async (orderId, newStatus) => {
    try {
      await orderService.updateOrderStatus(orderId, { status: newStatus });
      toast.success('Order status updated');
      
      // Update the order in state
      setSelectedOrder(prev => prev ? { ...prev, status: newStatus } : null);
    } catch (error) {
      toast.error('Failed to update order status');
    }
  }, []);

  const handlePaymentStatusUpdate = useCallback(async (orderId, paymentStatus) => {
    try {
      await orderService.updatePaymentStatus(orderId, { paymentStatus });
      toast.success('Payment status updated successfully');
      
      // Update the order in state
      setSelectedOrder(prev => prev ? { 
        ...prev, 
        payment: { ...prev.payment, status: paymentStatus }
      } : null);
    } catch (error) {
      toast.error('Failed to update payment status');
    }
  }, []);

  const handleDeleteOrder = useCallback(async (orderId) => {
    if (window.confirm('Are you sure you want to delete this order? This action cannot be undone.')) {
      try {
        await orderService.deleteOrder(orderId);
        toast.success('Order deleted successfully');
        setSelectedOrder(null); // Close modal if open
      } catch (error) {
        toast.error('Failed to delete order');
      }
    }
  }, []);

  const handleCancelOrder = useCallback(async (orderId, reason) => {
    try {
      await orderService.cancelOrder(orderId, reason);
      toast.success('Order cancelled successfully');
      
      // Update the order in state
      setSelectedOrder(prev => prev ? { ...prev, status: 'cancelled' } : null);
    } catch (error) {
      toast.error('Failed to cancel order');
    }
  }, []);

  const handleStripeRefund = useCallback(async (orderId, amount, reason) => {
    try {
      await orderService.createStripeRefund(orderId, amount, reason);
      toast.success('Refund created successfully');
      setSelectedOrder(null); // Close modal after refund
    } catch (error) {
      toast.error('Failed to create refund');
    }
  }, []);

  const value = {
    selectedOrder,
    isLoading,
    openOrderModal,
    openOrderModalWithData,
    closeOrderModal,
    handleStatusUpdate,
    handlePaymentStatusUpdate,
    handleDeleteOrder,
    handleCancelOrder,
    handleStripeRefund,
    statusOptions,
    paymentStatusIcons,
    paymentStatusColors
  };

  return (
    <OrderModalContext.Provider value={value}>
      {children}
      
      {/* Global Order Modal */}
      {selectedOrder && (
        <OrderViewModal
          order={selectedOrder}
          onClose={closeOrderModal}
          onStatusUpdate={handleStatusUpdate}
          onPaymentStatusUpdate={handlePaymentStatusUpdate}
          onDelete={handleDeleteOrder}
          onCancel={handleCancelOrder}
          onStripeRefund={handleStripeRefund}
          statusOptions={statusOptions}
          paymentStatusIcons={paymentStatusIcons}
          paymentStatusColors={paymentStatusColors}
        />
      )}
    </OrderModalContext.Provider>
  );
};

export default OrderModalContext;
