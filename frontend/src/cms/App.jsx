import React, { useState } from 'react';
import { Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
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
import { OrderModalProvider } from './contexts/OrderModalContext';

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

const CMSAppContent = () => {
  const navigate = useNavigate();
  const location = useLocation();

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
    navigate('profile');
  };


  return (
    <OrderModalProvider>
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
        <Route path="login" element={<Login />} />
        
        {/* Protected Routes */}
        <Route path="" element={
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
          <Route index element={<Navigate to="dashboard" replace />} />
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="items" element={<Items />} />
          <Route path="daily-menu" element={<DailyMenu />} />
          <Route path="orders" element={<Orders />} />
          <Route path="contacts" element={<Contacts />} />
          <Route path="profile" element={<Profile />} />
        </Route>
        
        {/* Catch all route */}
        <Route path="*" element={<Navigate to="dashboard" replace />} />
      </Routes>
      </div>
    </OrderModalProvider>
  );
};

const CMSApp = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <CMSAppContent />
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  );
};

export default CMSApp;
