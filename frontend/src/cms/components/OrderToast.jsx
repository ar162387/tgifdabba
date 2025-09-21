import React from 'react';
import { ShoppingCart, Clock, User, CreditCard } from 'lucide-react';
import toast from 'react-hot-toast';

// Custom toast component for new orders
export const OrderToast = ({ order }) => {
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-GB', {
      style: 'currency',
      currency: 'GBP'
    }).format(amount);
  };

  const formatRelativeTime = (timestamp) => {
    const now = new Date();
    const orderTime = new Date(timestamp);
    const diffMs = now - orderTime;
    const diffMins = Math.floor(diffMs / 60000);
    const diffSecs = Math.floor(diffMs / 1000);

    if (diffSecs < 10) return 'Just now';
    if (diffSecs < 60) return `${diffSecs}s ago`;
    if (diffMins < 60) return `${diffMins}m ago`;
    return 'Just now';
  };

  const formatCustomerName = (order) => {
    return order.customerName || order.customerPhone || 'Unknown Customer';
  };

  const formatPaymentMethod = (method) => {
    const methodMap = {
      cash_on_delivery: 'COD',
      cash_on_collection: 'COC',
      card: 'Card'
    };
    return methodMap[method] || method;
  };

  return (
    <div className="order-toast flex items-start space-x-3 p-3 bg-white rounded-lg shadow-lg border border-gray-200">
      <div className="flex-shrink-0">
        <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center">
          <ShoppingCart size={20} className="text-orange-600" />
        </div>
      </div>
      
      <div className="flex-1 min-w-0">
        <div className="flex items-center space-x-2 mb-1">
          <h4 className="text-sm font-medium text-gray-900">
            New Order #{order.orderId}
          </h4>
          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
            Pending
          </span>
        </div>
        
        <div className="space-y-1">
          <div className="flex items-center space-x-2 text-sm text-gray-600">
            <User size={14} />
            <span className="truncate">{formatCustomerName(order)}</span>
          </div>
          
          <div className="flex items-center space-x-4 text-sm text-gray-600">
            <div className="flex items-center space-x-1">
              <ShoppingCart size={14} />
              <span>{order.itemsCount} item{order.itemsCount !== 1 ? 's' : ''}</span>
            </div>
            <div className="flex items-center space-x-1">
              <CreditCard size={14} />
              <span className="font-medium">{formatCurrency(order.total)}</span>
            </div>
          </div>
          
          <div className="flex items-center space-x-2 text-xs text-gray-500">
            <Clock size={12} />
            <span>{formatRelativeTime(order.placedAt)}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

// Toast notification service
class ToastNotificationService {
  constructor() {
    this.toastQueue = [];
    this.isProcessing = false;
    this.batchTimeout = null;
  }

  // Show order notification toast
  showOrderNotification(order, options = {}) {
    const toastOptions = {
      duration: 8000, // 8 seconds
      position: 'top-right',
      className: 'order-toast',
      style: {
        background: '#fff',
        border: '1px solid #e5e7eb',
        borderRadius: '8px',
        boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
        maxWidth: '400px',
        minWidth: '320px',
      },
      ...options
    };

    // Add to queue for potential batching
    this.toastQueue.push({ order, options: toastOptions });
    
    // Process queue
    this.processToastQueue();
  }

  // Process toast queue with batching for multiple orders
  processToastQueue() {
    if (this.isProcessing) return;
    
    this.isProcessing = true;

    // Clear any existing batch timeout
    if (this.batchTimeout) {
      clearTimeout(this.batchTimeout);
    }

    // Set timeout to batch multiple orders
    this.batchTimeout = setTimeout(() => {
      this.flushToastQueue();
    }, 1000); // Wait 1 second to batch multiple orders
  }

  // Flush the toast queue
  flushToastQueue() {
    if (this.toastQueue.length === 0) {
      this.isProcessing = false;
      return;
    }

    const toasts = [...this.toastQueue];
    this.toastQueue = [];

    if (toasts.length === 1) {
      // Single order - show individual toast
      const { order, options } = toasts[0];
      toast.custom((t) => (
        <div onClick={() => toast.dismiss(t.id)} className="cursor-pointer">
          <OrderToast order={order} />
        </div>
      ), options);
    } else {
      // Multiple orders - show batched toast
      const batchToast = this.createBatchToast(toasts);
      toast.custom((t) => (
        <div onClick={() => toast.dismiss(t.id)} className="cursor-pointer">
          {batchToast}
        </div>
      ), {
        duration: 10000, // Longer duration for batch
        position: 'top-right',
        className: 'order-toast',
        style: {
          background: '#fff',
          border: '1px solid #e5e7eb',
          borderRadius: '8px',
          boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
          maxWidth: '400px',
          minWidth: '320px',
        }
      });
    }

    this.isProcessing = false;
  }

  // Create batch toast for multiple orders
  createBatchToast(toasts) {
    return (
      <div className="order-toast p-3 bg-white rounded-lg shadow-lg border border-gray-200">
        <div className="flex items-center space-x-2 mb-3">
          <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center">
            <ShoppingCart size={16} className="text-orange-600" />
          </div>
          <h4 className="text-sm font-medium text-gray-900">
            {toasts.length} New Orders
          </h4>
        </div>
        
        <div className="space-y-2">
          {toasts.slice(0, 3).map(({ order }, index) => (
            <div key={order.orderId} className="flex items-center justify-between text-sm">
              <div className="flex items-center space-x-2">
                <span className="font-medium">#{order.orderId}</span>
                <span className="text-gray-600 truncate">
                  {order.customerName || order.customerPhone || 'Unknown Customer'}
                </span>
              </div>
              <span className="font-medium text-gray-900">
                {new Intl.NumberFormat('en-GB', {
                  style: 'currency',
                  currency: 'GBP'
                }).format(order.total)}
              </span>
            </div>
          ))}
          
          {toasts.length > 3 && (
            <div className="text-xs text-gray-500 text-center pt-1">
              +{toasts.length - 3} more orders
            </div>
          )}
        </div>
      </div>
    );
  }

  // Dismiss all toasts
  dismissAll() {
    toast.dismiss();
  }

  // Dismiss specific toast
  dismiss(toastId) {
    toast.dismiss(toastId);
  }
}

// Create singleton instance
const toastNotificationService = new ToastNotificationService();

export default toastNotificationService;
