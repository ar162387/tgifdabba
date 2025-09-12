import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { User, LogOut } from 'lucide-react';
import Sidebar from './layout/Sidebar';
import Topbar from './layout/Topbar';
import MainContent from './layout/MainContent';
import ProtectedRoute from './layout/ProtectedRoute';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Items from './pages/Items';
import DailyMenu from './pages/DailyMenu';
import Orders from './pages/Orders';
import Contacts from './pages/Contacts';
import Profile from './pages/Profile';
import { authService } from './services/authService';

// Create a client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      cacheTime: 10 * 60 * 1000, // 10 minutes
      retry: 3,
      refetchOnWindowFocus: false,
    },
  },
});

const CMSApp = () => {
  const [showProfile, setShowProfile] = useState(false);

  const handleLogout = async () => {
    try {
      await authService.logout();
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      authService.clearAuth();
      window.location.href = '/cms/login';
    }
  };

  const handleProfileClick = () => {
    setShowProfile(true);
  };

  return (
    <QueryClientProvider client={queryClient}>
      <Router>
      <div className="min-h-screen bg-gray-50">
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 4000,
            style: {
              background: '#363636',
              color: '#fff',
            },
            success: {
              duration: 3000,
              iconTheme: {
                primary: '#10B981',
                secondary: '#fff',
              },
            },
            error: {
              duration: 5000,
              iconTheme: {
                primary: '#EF4444',
                secondary: '#fff',
              },
            },
          }}
        />
        
        <Routes>
          {/* Public Routes */}
          <Route path="/cms/login" element={<Login />} />
          
          {/* Protected Routes */}
          <Route path="/cms" element={
            <ProtectedRoute>
              <div className="flex">
                <Sidebar />
                <div className="flex-1 flex flex-col">
                  <Topbar 
                    onProfileClick={handleProfileClick}
                    onLogout={handleLogout}
                  />
                  <MainContent />
                </div>
              </div>
            </ProtectedRoute>
          }>
            <Route index element={<Navigate to="/cms/dashboard" replace />} />
            <Route path="dashboard" element={<Dashboard />} />
            <Route path="items" element={<Items />} />
            <Route path="daily-menu" element={<DailyMenu />} />
            <Route path="orders" element={<Orders />} />
            <Route path="contacts" element={<Contacts />} />
            <Route path="profile" element={<Profile />} />
          </Route>
          
          {/* Catch all route */}
          <Route path="*" element={<Navigate to="/cms/dashboard" replace />} />
        </Routes>

        {/* Profile Modal */}
        {showProfile && (
          <div className="fixed inset-0 z-50 flex items-center justify-center">
            <div className="absolute inset-0 bg-gray-900 bg-opacity-20 backdrop-blur-sm" onClick={() => setShowProfile(false)} />
            <div className="relative bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
              <div className="p-6">
                <h2 className="text-xl font-semibold mb-4">Profile</h2>
                <div className="space-y-4">
                  <button
                    onClick={() => {
                      setShowProfile(false);
                      window.location.href = '/cms/profile';
                    }}
                    className="w-full text-left p-3 hover:bg-gray-50 rounded-lg transition-colors"
                  >
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">
                        <User size={16} className="text-gray-600" />
                      </div>
                      <div>
                        <p className="font-medium">View Profile</p>
                        <p className="text-sm text-gray-500">Manage your account settings</p>
                      </div>
                    </div>
                  </button>
                  
                  <button
                    onClick={handleLogout}
                    className="w-full text-left p-3 hover:bg-red-50 rounded-lg transition-colors text-red-600"
                  >
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center">
                        <LogOut size={16} className="text-red-600" />
                      </div>
                      <div>
                        <p className="font-medium">Sign Out</p>
                        <p className="text-sm text-red-500">Logout from your account</p>
                      </div>
                    </div>
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
      </Router>
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  );
};

export default CMSApp;
