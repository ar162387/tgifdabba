import React, { useState, useEffect } from 'react';
import { Bell, User, LogOut, Settings } from 'lucide-react';
import { authService } from '../services/authService';
import { notificationService } from '../services/notificationService';

const Topbar = ({ onProfileClick, onLogout }) => {
  const [user, setUser] = useState(null);
  const [notifications, setNotifications] = useState({ ordersNew: 0, contactsNew: 0 });

  useEffect(() => {
    const userData = authService.getUser();
    setUser(userData);
    
    // Fetch notification counters
    fetchNotifications();
    
    // Set up polling for notifications every 15 seconds
    const interval = setInterval(fetchNotifications, 15000);
    
    return () => clearInterval(interval);
  }, []);

  const fetchNotifications = async () => {
    try {
      const response = await notificationService.getNotificationCounters();
      setNotifications(response.data);
    } catch (error) {
      console.error('Failed to fetch notifications:', error);
    }
  };

  const totalNotifications = notifications.ordersNew + notifications.contactsNew;

  return (
    <header className="bg-white border-b border-gray-200 px-6 py-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">TGIF Dabba CMS</h1>
        </div>
        
        <div className="flex items-center space-x-4">
          {/* Notifications */}
          <button className="relative p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors">
            <Bell size={20} />
            {totalNotifications > 0 && (
              <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                {totalNotifications}
              </span>
            )}
          </button>
          
          {/* User Menu */}
          <div className="flex items-center space-x-3">
            <div className="text-right">
              <p className="text-sm font-medium text-gray-900">{user?.email}</p>
              <p className="text-xs text-gray-500 capitalize">{user?.role}</p>
            </div>
            
            <div className="flex items-center space-x-2">
              <button
                onClick={onProfileClick}
                className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
                title="Profile"
              >
                <User size={20} />
              </button>
              
              <button
                onClick={onLogout}
                className="p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                title="Logout"
              >
                <LogOut size={20} />
              </button>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Topbar;
