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
      // Prevent duplicate requests by checking if we're already updating this order
      const updateKey = `${orderId}-${newStatus}`;
      if (window.statusUpdateInProgress?.has(updateKey)) {
        console.log('Status update already in progress, skipping...');
        return;
      }
      
      // Initialize the set if it doesn't exist
      if (!window.statusUpdateInProgress) {
        window.statusUpdateInProgress = new Set();
      }
      
      // Mark this update as in progress
      window.statusUpdateInProgress.add(updateKey);
      
      // Track manual update to prevent real-time conflicts
      if (window.manualUpdatesRef) {
        window.manualUpdatesRef.current.add(updateKey);
      }
      
      console.log('Updating order status:', { orderId, newStatus });
      const response = await orderService.updateOrderStatus(orderId, { status: newStatus });
      
      // Update the order in state immediately for better UX
      setSelectedOrder(prev => prev ? { ...prev, status: newStatus } : null);
      
      // Clear manual update tracking immediately after successful API call
      if (window.manualUpdatesRef) {
        window.manualUpdatesRef.current.delete(updateKey);
      }
      
      // Emit a custom event to notify Orders component that manual update is complete
      window.dispatchEvent(new CustomEvent('manualStatusUpdateComplete', {
        detail: { orderId, newStatus }
      }));
      
      console.log('Manual update completed, real-time updates can proceed');
      
      // Don't show toast here - realtime will handle it with order ID
      
    } catch (error) {
      console.error('Status update error:', error);
      toast.error(`Failed to update order status: ${error.response?.data?.message || error.message}`, {
        id: `status-error-${orderId}`
      });
    } finally {
      // Remove from in-progress set after a delay
      setTimeout(() => {
        if (window.statusUpdateInProgress) {
          window.statusUpdateInProgress.delete(`${orderId}-${newStatus}`);
        }
      }, 2000);
    }
  }, []);

  const handlePaymentStatusUpdate = useCallback(async (orderId, paymentStatus) => {
    try {
      // Prevent duplicate requests by checking if we're already updating this order
      const updateKey = `payment-${orderId}-${paymentStatus}`;
      if (window.statusUpdateInProgress?.has(updateKey)) {
        console.log('Payment status update already in progress, skipping...');
        return;
      }
      
      // Initialize the set if it doesn't exist
      if (!window.statusUpdateInProgress) {
        window.statusUpdateInProgress = new Set();
      }
      
      // Mark this update as in progress
      window.statusUpdateInProgress.add(updateKey);
      
      // Track manual update to prevent real-time conflicts
      if (window.manualUpdatesRef) {
        window.manualUpdatesRef.current.add(updateKey);
      }
      
      console.log('Updating payment status:', { orderId, paymentStatus });
      await orderService.updatePaymentStatus(orderId, paymentStatus);
      
      // Update the order in state immediately for better UX
      setSelectedOrder(prev => prev ? { 
        ...prev, 
        payment: { ...prev.payment, status: paymentStatus }
      } : null);
      
      // Clear manual update tracking immediately after successful API call
      if (window.manualUpdatesRef) {
        window.manualUpdatesRef.current.delete(updateKey);
      }
      
      // Emit a custom event to notify Orders component that manual update is complete
      window.dispatchEvent(new CustomEvent('manualPaymentStatusUpdateComplete', {
        detail: { orderId, paymentStatus }
      }));
      
      console.log('Manual payment status update completed, real-time updates can proceed');
      
      // Don't show toast here - realtime will handle it with order ID
      
    } catch (error) {
      console.error('Payment status update error:', error);
      toast.error(`Failed to update payment status: ${error.response?.data?.message || error.message}`, {
        id: `payment-status-error-${orderId}`
      });
    } finally {
      // Remove from in-progress set after a delay
      setTimeout(() => {
        if (window.statusUpdateInProgress) {
          window.statusUpdateInProgress.delete(`payment-${orderId}-${paymentStatus}`);
        }
      }, 2000);
    }
  }, []);

  const handleDeleteOrder = useCallback(async (orderId) => {
    if (window.confirm('Are you sure you want to delete this order? This action cannot be undone.')) {
      try {
        await orderService.deleteOrder(orderId);
        // Don't show toast here - parent component will handle it
        setSelectedOrder(null); // Close modal if open
      } catch (error) {
        toast.error('Failed to delete order');
      }
    }
  }, []);

  const handleCancelOrder = useCallback(async (orderId, reason) => {
    try {
      await orderService.cancelOrder(orderId, reason);
      // Don't show toast here - realtime will handle it with order ID
      
      // Update the order in state
      setSelectedOrder(prev => prev ? { ...prev, status: 'cancelled' } : null);
    } catch (error) {
      toast.error('Failed to cancel order');
    }
  }, []);

  const handleStripeRefund = useCallback(async (orderId, amount, reason) => {
    try {
      await orderService.createStripeRefund(orderId, amount, reason);
      // Don't show toast here - parent component will handle it
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
