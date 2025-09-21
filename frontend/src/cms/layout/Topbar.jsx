import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { Bell, User, LogOut, Settings, ChevronDown } from 'lucide-react';
import { authService } from '../services/authService';
import { notificationService } from '../services/notificationService';
import realtimeService from '../services/realtimeService';
import soundManager from '../utils/soundUtils';
import NotificationPanel from '../components/NotificationPanel';
import toastNotificationService from '../components/OrderToast';

const Topbar = ({ onProfileClick, onLogout, onOrderClick }) => {
  const [user, setUser] = useState(null);
  const [notifications, setNotifications] = useState({ ordersNew: 0, contactsNew: 0 });
  const [pendingOrdersCount, setPendingOrdersCount] = useState(0);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isNotificationPanelOpen, setIsNotificationPanelOpen] = useState(false);
  const dropdownRef = useRef(null);
  const notificationRef = useRef(null);

  useEffect(() => {
    const userData = authService.getUser();
    setUser(userData);
    
    // Initialize persistent realtime connection
    realtimeService.initialize();
    
    // Fetch notification counters
    fetchNotifications();
    
    // Get initial pending orders count (will use cache if available)
    realtimeService.getPendingOrdersCount().then(count => {
      console.log('Mount - pending count loaded:', count);
      setPendingOrdersCount(count);
    });
    
    // Set up polling for notifications every 60 seconds (less frequent)
    const interval = setInterval(fetchNotifications, 60000);
    
    return () => {
      clearInterval(interval);
    };
  }, []);

  // Set up realtime listeners for pending orders
  useEffect(() => {
    const unsubscribeOrderCreated = realtimeService.subscribe('order.created', (orderData) => {
      setPendingOrdersCount(prev => {
        const newCount = prev + 1;
        console.log('Order created - updating count from', prev, 'to', newCount);
        return newCount;
      });
      
      // Show toast notification for new orders
      toastNotificationService.showOrderNotification(orderData);
      
      // Play notification sound
      soundManager.playNotificationSound();
    });

    const unsubscribeOrderUpdated = realtimeService.subscribe('order.updated', (orderData) => {
      if (orderData.previousStatus === 'pending' && orderData.newStatus !== 'pending') {
        setPendingOrdersCount(prev => {
          const newCount = Math.max(0, prev - 1);
          console.log('Order updated - updating count from', prev, 'to', newCount);
          return newCount;
        });
      }
    });

    const unsubscribePendingCount = realtimeService.subscribe('pending.count', (count) => {
      console.log('Received pending count update:', count);
      setPendingOrdersCount(prev => {
        // Only update if the count actually changed
        if (prev !== count) {
          console.log('Pending count changed from', prev, 'to', count);
          return count;
        }
        return prev;
      });
    });

    // Listen for connection established to refresh pending orders count
    const unsubscribeConnectionEstablished = realtimeService.subscribe('connection.established', () => {
      console.log('Connection established, loading pending count...');
      // Only refresh if we don't have a recent count
      realtimeService.getPendingOrdersCount().then(count => {
        console.log('Connection established - pending count loaded:', count);
        setPendingOrdersCount(count);
      });
    });

    // Load initial pending orders count (will use cache if available)
    realtimeService.getPendingOrdersCount().then(count => {
      console.log('Initial pending orders count:', count);
      setPendingOrdersCount(count);
    });

    // Set up periodic connection check
    const connectionCheckInterval = setInterval(() => {
      const status = realtimeService.getConnectionStatus();
      if (!status.isConnected && !status.isPolling) {
        console.log('Connection lost, attempting to reconnect...');
        realtimeService.forceReconnect();
      }
    }, 60000); // Check every 60 seconds (less frequent)

    return () => {
      unsubscribeOrderCreated();
      unsubscribeOrderUpdated();
      unsubscribePendingCount();
      unsubscribeConnectionEstablished();
      clearInterval(connectionCheckInterval);
    };
  }, []);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
      if (notificationRef.current && !notificationRef.current.contains(event.target)) {
        setIsNotificationPanelOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const fetchNotifications = useCallback(async () => {
    try {
      const response = await notificationService.getNotificationCounters();
      setNotifications(response.data);
    } catch (error) {
      console.error('Failed to fetch notifications:', error);
    }
  }, []);

  const totalNotifications = useMemo(() => 
    notifications.ordersNew + notifications.contactsNew, 
    [notifications.ordersNew, notifications.contactsNew]
  );
  
  // Debug log for pending orders count (only in development)
  if (process.env.NODE_ENV === 'development') {
    console.log('Current pendingOrdersCount state:', pendingOrdersCount);
  }

  const toggleDropdown = useCallback(() => {
    setIsDropdownOpen(prev => !prev);
  }, []);

  const toggleNotificationPanel = useCallback(() => {
    setIsNotificationPanelOpen(prev => !prev);
  }, []);

  const handleProfileClick = useCallback(() => {
    setIsDropdownOpen(false);
    onProfileClick();
  }, [onProfileClick]);

  const handleLogoutClick = useCallback(() => {
    setIsDropdownOpen(false);
    onLogout();
  }, [onLogout]);

  const handleNotificationOrderClick = useCallback((order) => {
    if (onOrderClick) {
      onOrderClick(order);
    }
  }, [onOrderClick]);

  return (
    <header className="bg-white border-b border-gray-200 px-6 py-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">TGIF Dabba CMS</h1>
        </div>
        
        <div className="flex items-center space-x-4">
          {/* Notifications */}
          <div className="relative" ref={notificationRef}>
            <button 
              onClick={toggleNotificationPanel}
              className="relative p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <Bell size={20} />
              {pendingOrdersCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center min-w-[20px]">
                  {pendingOrdersCount > 99 ? '99+' : pendingOrdersCount}
                </span>
              )}
            </button>
            
            {/* Notification Panel */}
            <NotificationPanel
              isOpen={isNotificationPanelOpen}
              onClose={() => setIsNotificationPanelOpen(false)}
              onOrderClick={handleNotificationOrderClick}
            />
          </div>
          
          {/* User Menu */}
          <div className="flex items-center space-x-3">
            <div className="text-right">
              <p className="text-sm font-medium text-gray-900">{user?.email}</p>
              <p className="text-xs text-gray-500 capitalize">{user?.role}</p>
            </div>
            
            <div className="relative" ref={dropdownRef}>
              <button
                onClick={toggleDropdown}
                className="flex items-center space-x-2 p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
                title="User Menu"
              >
                <User size={20} />
                <ChevronDown size={16} className={`transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`} />
              </button>
              
              {/* Dropdown Menu */}
              {isDropdownOpen && (
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-50">
                  <button
                    onClick={handleProfileClick}
                    className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 flex items-center space-x-2"
                  >
                    <User size={16} />
                    <span>Profile</span>
                  </button>
                  
                  <button
                    onClick={handleLogoutClick}
                    className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-red-50 hover:text-red-600 flex items-center space-x-2"
                  >
                    <LogOut size={16} />
                    <span>Logout</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Topbar;
