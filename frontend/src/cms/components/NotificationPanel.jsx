import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Bell, Clock, ShoppingCart, X } from 'lucide-react';
import realtimeService from '../services/realtimeService';
import { useOrders } from '../hooks/useOrders';

const NotificationPanel = ({ isOpen, onClose, onOrderClick }) => {
  const [pendingOrders, setPendingOrders] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const panelRef = useRef(null);
  const timeUpdateInterval = useRef(null);

  // Get orders hook for opening the modal
  const { data: ordersData } = useOrders({ status: 'pending', limit: 50 });

  // Load initial pending orders
  useEffect(() => {
    if (isOpen) {
      loadPendingOrders();
    }
  }, [isOpen]);

  // Set up realtime listeners
  useEffect(() => {
    const unsubscribeOrderCreated = realtimeService.subscribe('order.created', (orderData) => {
      setPendingOrders(prev => {
        // Avoid duplicates
        const exists = prev.some(order => order.orderId === orderData.orderId);
        if (exists) return prev;
        
        return [orderData, ...prev].slice(0, 10); // Keep only latest 10
      });
    });

    const unsubscribeOrderUpdated = realtimeService.subscribe('order.updated', (orderData) => {
      setPendingOrders(prev => 
        prev.filter(order => order.orderId !== orderData.orderId)
      );
    });

    const unsubscribePendingCount = realtimeService.subscribe('pending.count', (count) => {
      // Refresh the list when count changes
      if (count === 0) {
        setPendingOrders([]);
      }
    });

    return () => {
      unsubscribeOrderCreated();
      unsubscribeOrderUpdated();
      unsubscribePendingCount();
    };
  }, []);

  // Set up time update interval
  useEffect(() => {
    if (isOpen && pendingOrders.length > 0) {
      timeUpdateInterval.current = setInterval(() => {
        // Force re-render to update relative times
        setPendingOrders(prev => [...prev]);
      }, 60000); // Update every minute
    }

    return () => {
      if (timeUpdateInterval.current) {
        clearInterval(timeUpdateInterval.current);
      }
    };
  }, [isOpen, pendingOrders.length]);

  // Load pending orders from server
  const loadPendingOrders = useCallback(async () => {
    setIsLoading(true);
    try {
      const orders = await realtimeService.getPendingOrders(10);
      setPendingOrders(orders);
    } catch (error) {
      console.error('Failed to load pending orders:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Handle clicking outside to close
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (panelRef.current && !panelRef.current.contains(event.target)) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, onClose]);

  // Handle order click
  const handleOrderClick = useCallback((order) => {
    onOrderClick(order);
    onClose();
  }, [onOrderClick, onClose]);

  // Format relative time
  const formatRelativeTime = (timestamp) => {
    const now = new Date();
    const orderTime = new Date(timestamp);
    const diffMs = now - orderTime;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    return `${diffDays}d ago`;
  };

  // Format customer name
  const formatCustomerName = (order) => {
    return order.customerName || order.customerPhone || 'Unknown Customer';
  };

  // Format currency
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-GB', {
      style: 'currency',
      currency: 'GBP'
    }).format(amount);
  };

  if (!isOpen) return null;

  return (
    <div 
      ref={panelRef}
      className="absolute right-0 mt-2 w-96 bg-white rounded-lg shadow-xl border border-gray-200 py-1 z-50 max-h-96 overflow-hidden"
    >
      {/* Header */}
      <div className="px-4 py-3 border-b border-gray-100">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Bell size={16} className="text-gray-500" />
            <h3 className="text-sm font-medium text-gray-900">Pending Orders</h3>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X size={16} />
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="max-h-80 overflow-y-auto">
        {isLoading ? (
          <div className="px-4 py-8 text-center">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-orange-500 mx-auto"></div>
            <p className="text-sm text-gray-500 mt-2">Loading orders...</p>
          </div>
        ) : pendingOrders.length === 0 ? (
          <div className="px-4 py-8 text-center">
            <ShoppingCart size={32} className="text-gray-300 mx-auto mb-2" />
            <p className="text-sm text-gray-500">No pending orders</p>
          </div>
        ) : (
          <div className="py-1">
            {pendingOrders.map((order) => (
              <NotificationOrderItem
                key={order.orderId}
                order={order}
                onOrderClick={handleOrderClick}
                formatRelativeTime={formatRelativeTime}
                formatCustomerName={formatCustomerName}
                formatCurrency={formatCurrency}
              />
            ))}
          </div>
        )}
      </div>

      {/* Footer */}
      {pendingOrders.length > 0 && (
        <div className="px-4 py-2 border-t border-gray-100">
          <button
            onClick={() => onOrderClick(null)} // Open orders page
            className="w-full text-center text-sm text-orange-600 hover:text-orange-700 font-medium"
          >
            View all orders
          </button>
        </div>
      )}
    </div>
  );
};

// Individual notification order item
const NotificationOrderItem = React.memo(({ 
  order, 
  onOrderClick, 
  formatRelativeTime, 
  formatCustomerName, 
  formatCurrency 
}) => {
  return (
    <button
      onClick={() => onOrderClick(order)}
      className="w-full px-4 py-3 text-left hover:bg-gray-50 transition-colors border-b border-gray-50 last:border-b-0"
    >
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <div className="flex items-center space-x-2 mb-1">
            <span className="text-sm font-medium text-gray-900">
              #{order.orderId}
            </span>
            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
              Pending
            </span>
          </div>
          
          <p className="text-sm text-gray-600 truncate">
            {formatCustomerName(order)}
          </p>
          
          <div className="flex items-center space-x-4 mt-1">
            <span className="text-xs text-gray-500">
              {order.itemsCount} item{order.itemsCount !== 1 ? 's' : ''}
            </span>
            <span className="text-sm font-medium text-gray-900">
              {formatCurrency(order.total)}
            </span>
          </div>
        </div>
        
        <div className="flex items-center space-x-2 ml-3">
          <Clock size={14} className="text-gray-400" />
          <span className="text-xs text-gray-500 whitespace-nowrap">
            {formatRelativeTime(order.placedAt)}
          </span>
        </div>
      </div>
    </button>
  );
});

NotificationOrderItem.displayName = 'NotificationOrderItem';

export default NotificationPanel;
