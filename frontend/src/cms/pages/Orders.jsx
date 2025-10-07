import React, { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { Search, Eye, CheckCircle, Clock, XCircle, Truck, Package, Trash2 } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, TableCheckbox } from '../components/ui/Table';
import { OptimizedTable, OptimizedTableHeader, OptimizedTableBody, OptimizedTableHead, OptimizedTableRow, OptimizedTableCell } from '../components/ui/OptimizedTable';
import EmptyState from '../components/ui/EmptyState';
import { TableSkeleton, FormSkeleton } from '../components/ui/Skeleton';
import PerformanceMonitor from '../components/ui/PerformanceMonitor';
import { useOrderModal } from '../contexts/OrderModalContext';
import { useOrders, useBulkDeleteOrders } from '../hooks/useOrders';
import realtimeService from '../services/realtimeService';
import globalRealtimeManager from '../services/globalRealtimeManager';
import { realtimeDebug } from '../utils/realtimeDebug';
import toast from 'react-hot-toast';

const Orders = () => {
  const location = useLocation();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [sortBy, setSortBy] = useState('createdAt');
  const [sortOrder, setSortOrder] = useState('desc');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [filteredOrders, setFilteredOrders] = useState([]);
  const [allOrders, setAllOrders] = useState([]);
  const [selectedStatusCard, setSelectedStatusCard] = useState('');
  const ordersMapRef = useRef(new Map()); // For efficient order lookups
  const [realtimeConnectionStatus, setRealtimeConnectionStatus] = useState('disconnected');
  const manualUpdatesRef = useRef(new Set()); // Track manual updates to prevent real-time conflicts
  const processingEventsRef = useRef(new Set()); // Track processing events to prevent duplicates
  const [selectedOrders, setSelectedOrders] = useState(new Set());
  
  // Expose manualUpdatesRef globally so OrderModalContext can access it
  useEffect(() => {
    window.manualUpdatesRef = manualUpdatesRef;
    return () => {
      delete window.manualUpdatesRef;
    };
  }, []);

  // Use the global order modal context
  const { openOrderModalWithData } = useOrderModal();

  // Memoized configuration objects
  const statusOptions = useMemo(() => [
    { value: '', label: 'All Status' },
    { value: 'pending', label: 'Pending' },
    { value: 'confirmed', label: 'Confirmed' },
    { value: 'cancelled', label: 'Cancelled' },
    { value: 'ready_for_collection', label: 'Ready for Collection' },
    { value: 'delivered', label: 'Delivered' },
    { value: 'collected', label: 'Collected' }
  ], []);

  const statusColors = useMemo(() => ({
    pending: 'bg-yellow-100 text-yellow-800',
    confirmed: 'bg-blue-100 text-blue-800',
    cancelled: 'bg-red-100 text-red-800',
    ready_for_collection: 'bg-purple-100 text-purple-800',
    delivered: 'bg-green-100 text-green-800',
    collected: 'bg-green-100 text-green-800'
  }), []);

  const paymentStatusColors = useMemo(() => ({
    pending: 'bg-yellow-100 text-yellow-800',
    paid: 'bg-green-100 text-green-800',
    refunded: 'bg-blue-100 text-blue-800',
    failed: 'bg-red-100 text-red-800',
    requires_payment_method: 'bg-orange-100 text-orange-800',
    requires_confirmation: 'bg-purple-100 text-purple-800'
  }), []);

  const statusIcons = useMemo(() => ({
    pending: Clock,
    confirmed: CheckCircle,
    cancelled: XCircle,
    ready_for_collection: Truck,
    delivered: CheckCircle,
    collected: CheckCircle
  }), []);

  const paymentStatusIcons = useMemo(() => ({
    pending: Clock,
    paid: CheckCircle,
    refunded: XCircle,
    failed: XCircle,
    requires_payment_method: Clock,
    requires_confirmation: Clock
  }), []);

  // Status cards configuration - always show counts from allOrders, not filteredOrders
  const statusCards = useMemo(() => [
    {
      status: '',
      label: 'All Orders',
      icon: Package,
      color: 'bg-gray-500',
      count: allOrders.length
    },
    {
      status: 'pending',
      label: 'Pending',
      icon: Clock,
      color: 'bg-yellow-500',
      count: allOrders.filter(order => order.status === 'pending').length
    },
    {
      status: 'confirmed',
      label: 'Confirmed',
      icon: CheckCircle,
      color: 'bg-blue-500',
      count: allOrders.filter(order => order.status === 'confirmed').length
    },
    {
      status: 'ready_for_collection',
      label: 'Ready for Collection',
      icon: Truck,
      color: 'bg-purple-500',
      count: allOrders.filter(order => order.status === 'ready_for_collection').length
    },
    {
      status: 'delivered',
      label: 'Delivered',
      icon: CheckCircle,
      color: 'bg-green-500',
      count: allOrders.filter(order => order.status === 'delivered').length
    },
    {
      status: 'collected',
      label: 'Collected',
      icon: CheckCircle,
      color: 'bg-green-500',
      count: allOrders.filter(order => order.status === 'collected').length
    },
    {
      status: 'cancelled',
      label: 'Cancelled',
      icon: XCircle,
      color: 'bg-red-500',
      count: allOrders.filter(order => order.status === 'cancelled').length
    }
  ], [allOrders]);

  // Query parameters for fetching all orders (for status cards and table)
  const allOrdersQueryParams = useMemo(() => ({
    page: 1,
    limit: 1000, // Get all orders for client-side filtering
    sortBy,
    sortOrder
  }), [sortBy, sortOrder]);

  // TanStack Query hooks - only one query needed since we do client-side filtering
  const { data: ordersData, isLoading, error } = useOrders(allOrdersQueryParams);
  const bulkDeleteMutation = useBulkDeleteOrders();

  // Update allOrders when data changes and build orders map for efficient lookups
  useEffect(() => {
    if (ordersData?.orders) {
      setAllOrders(ordersData.orders);
      // Build orders map for O(1) lookups
      const newOrdersMap = new Map();
      ordersData.orders.forEach(order => {
        newOrdersMap.set(order._id, order);
        newOrdersMap.set(order.orderId, order); // Also index by orderId
      });
      ordersMapRef.current = newOrdersMap;
    }
  }, [ordersData?.orders]);

  // Handle pre-selected order from notification panel via location state
  useEffect(() => {
    const selectedOrderId = location.state?.selectedOrderId;
    const selectedOrderData = location.state?.selectedOrderData;
    if (selectedOrderId && allOrders.length > 0) {
      // Find the full order data by orderId
      const fullOrder = ordersMapRef.current.get(selectedOrderId) || 
                       allOrders.find(order => order.orderId === selectedOrderId);
      if (fullOrder) {
        openOrderModalWithData(fullOrder);
        // Clear the location state to prevent re-opening on page refresh
        window.history.replaceState({}, document.title, window.location.pathname);
      }
    } else if (selectedOrderData) {
      // Use the provided order data directly
      openOrderModalWithData(selectedOrderData);
      // Clear the location state to prevent re-opening on page refresh
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, [location.state?.selectedOrderId, location.state?.selectedOrderData, allOrders, openOrderModalWithData]);

  // Real-time updates integration with debouncing and deduplication
  useEffect(() => {
    // Unified event handler to prevent duplicate processing
    const handleRealtimeEvent = (eventType, data, eventId) => {
      // Prevent duplicate processing
      if (processingEventsRef.current.has(eventId)) {
        console.log(`Skipping duplicate event: ${eventType}`, eventId);
        return;
      }
      
      processingEventsRef.current.add(eventId);
      
      try {
        realtimeDebug.log(eventType, data);
        console.log(`Processing real-time event: ${eventType}`, data);
        
        if (eventType === 'order.created' && data.orderData) {
          setAllOrders(prevOrders => {
            // Check if order already exists to avoid duplicates
            const exists = prevOrders.some(order => 
              order._id === data.orderData._id || order.orderId === data.orderData.orderId
            );
            if (exists) return prevOrders;
            
            const newOrders = [data.orderData, ...prevOrders];
            
            // Update orders map
            ordersMapRef.current.set(data.orderData._id, data.orderData);
            ordersMapRef.current.set(data.orderData.orderId, data.orderData);
            
            return newOrders;
          });
          
          toast.success(`New order received: ${data.orderId}`, {
            duration: 3000,
            position: 'top-right',
            id: `order-created-${data.orderId}` // Prevent duplicate toasts
          });
        }
        
        else if (eventType === 'order.updated' && data.orderData) {
          // Check if this is a manual update we're already handling
          const manualUpdateKey = `${data.orderData.orderId}-${data.orderData.status}`;
          const manualPaymentUpdateKey = `payment-${data.orderData.orderId}-${data.orderData.payment?.status}`;
          
          if (manualUpdatesRef.current.has(manualUpdateKey) || manualUpdatesRef.current.has(manualPaymentUpdateKey)) {
            console.log(`Skipping real-time order.updated for manual update: ${manualUpdateKey} or ${manualPaymentUpdateKey}`);
            return;
          }
          
          setAllOrders(prevOrders => {
            const orderIndex = prevOrders.findIndex(order => 
              order._id === data.orderData._id || order.orderId === data.orderData.orderId
            );
            
            if (orderIndex === -1) {
              console.log(`Order not found for update: ${data.orderData.orderId}`);
              return prevOrders;
            }
            
            const currentOrder = prevOrders[orderIndex];
            const newOrders = [...prevOrders];
            newOrders[orderIndex] = data.orderData;
            
            // Update orders map
            ordersMapRef.current.set(data.orderData._id, data.orderData);
            ordersMapRef.current.set(data.orderData.orderId, data.orderData);
            
            console.log(`Real-time: Updated order ${data.orderData.orderId} with full data (status: ${data.orderData.status}, payment: ${data.orderData.payment?.status})`);
            
            return newOrders;
          });
        }
        
        else if (eventType === 'order.status_changed') {
          // Check if this is a manual update we're already handling
          const manualUpdateKey = `${data.orderId}-${data.newStatus}`;
          if (manualUpdatesRef.current.has(manualUpdateKey)) {
            console.log(`Skipping real-time update for manual update: ${manualUpdateKey}`);
            return;
          }
          
          setAllOrders(prevOrders => {
            const orderIndex = prevOrders.findIndex(order => order.orderId === data.orderId);
            
            if (orderIndex === -1) {
              console.log(`Order not found for status change: ${data.orderId}`);
              return prevOrders;
            }
            
            // Only update if the status is actually different
            const currentOrder = prevOrders[orderIndex];
            if (currentOrder.status === data.newStatus) {
              console.log(`Status already ${data.newStatus} for order ${data.orderId}, skipping update`);
              return prevOrders;
            }
            
            const newOrders = [...prevOrders];
            const updatedOrder = { ...newOrders[orderIndex], status: data.newStatus };
            newOrders[orderIndex] = updatedOrder;
            
            // Update orders map
            ordersMapRef.current.set(updatedOrder._id, updatedOrder);
            ordersMapRef.current.set(updatedOrder.orderId, updatedOrder);
            
            console.log(`Real-time: Updated order ${data.orderId} status from ${currentOrder.status} to ${data.newStatus}`);
            return newOrders;
          });
          
          // Show toast for status changes (but not for manual updates)
          toast.success(`Order status changed: ${data.orderId} → ${data.newStatus}`, {
            duration: 2000,
            position: 'top-right',
            id: `order-status-${data.orderId}-${data.newStatus}` // Prevent duplicate toasts
          });
        }
        
      } catch (error) {
        console.error(`Error processing ${eventType} event:`, error);
      } finally {
        // Remove from processing set after a delay
        setTimeout(() => {
          processingEventsRef.current.delete(eventId);
        }, 1000);
      }
    };

    // Subscribe to real-time order events using global manager
    const unsubscribeOrderCreated = globalRealtimeManager.subscribe('order.created', (data) => {
      const eventId = `created-${data.orderData?._id || data.orderId}-${Date.now()}`;
      handleRealtimeEvent('order.created', data, eventId);
    });

    const unsubscribeOrderUpdated = globalRealtimeManager.subscribe('order.updated', (data) => {
      const eventId = `updated-${data.orderData?._id || data.orderId}-${Date.now()}`;
      handleRealtimeEvent('order.updated', data, eventId);
    });

    const unsubscribeOrderStatusChanged = globalRealtimeManager.subscribe('order.status_changed', (data) => {
      const eventId = `status-${data.orderId}-${data.newStatus}-${Date.now()}`;
      handleRealtimeEvent('order.status_changed', data, eventId);
    });

    const unsubscribeConnectionStatus = globalRealtimeManager.subscribeToConnectionStatus((status) => {
      setRealtimeConnectionStatus(status.state);
      realtimeDebug.logConnection(status);
      console.log('Real-time connection status:', status);
    });

    // Listen for manual status update completion
    const handleManualStatusUpdateComplete = (event) => {
      const { orderId, newStatus } = event.detail;
      console.log(`Manual status update completed for ${orderId}: ${newStatus}`);
      
      // Force a small delay to ensure backend has processed the update
      setTimeout(() => {
        // Trigger a re-fetch of the specific order or refresh the list
        setAllOrders(prevOrders => {
          const orderIndex = prevOrders.findIndex(order => order.orderId === orderId);
          if (orderIndex !== -1) {
            const newOrders = [...prevOrders];
            // Mark the order as potentially updated - this will trigger a re-render
            newOrders[orderIndex] = { ...newOrders[orderIndex], _lastUpdated: Date.now() };
            console.log(`Forced update for order ${orderId} in table`);
            return newOrders;
          }
          return prevOrders;
        });
      }, 500);
    };

    // Listen for manual payment status update completion
    const handleManualPaymentStatusUpdateComplete = (event) => {
      const { orderId, paymentStatus } = event.detail;
      console.log(`Manual payment status update completed for ${orderId}: ${paymentStatus}`);
      
      // Force a small delay to ensure backend has processed the update
      setTimeout(() => {
        // Trigger a re-fetch of the specific order or refresh the list
        setAllOrders(prevOrders => {
          const orderIndex = prevOrders.findIndex(order => order.orderId === orderId);
          if (orderIndex !== -1) {
            const newOrders = [...prevOrders];
            // Mark the order as potentially updated - this will trigger a re-render
            newOrders[orderIndex] = { ...newOrders[orderIndex], _lastUpdated: Date.now() };
            console.log(`Forced payment status update for order ${orderId} in table`);
            return newOrders;
          }
          return prevOrders;
        });
      }, 500);
    };

    window.addEventListener('manualStatusUpdateComplete', handleManualStatusUpdateComplete);
    window.addEventListener('manualPaymentStatusUpdateComplete', handleManualPaymentStatusUpdateComplete);

    // Cleanup subscriptions on unmount
    return () => {
      unsubscribeOrderCreated();
      unsubscribeOrderUpdated();
      unsubscribeOrderStatusChanged();
      unsubscribeConnectionStatus();
      window.removeEventListener('manualStatusUpdateComplete', handleManualStatusUpdateComplete);
      window.removeEventListener('manualPaymentStatusUpdateComplete', handleManualPaymentStatusUpdateComplete);
    };
  }, []);

  // Client-side filtering - no re-renders that affect input focus
  useEffect(() => {
    let filtered = allOrders;
    
    // Apply status filter first
    if (statusFilter) {
      filtered = filtered.filter(order => order.status === statusFilter);
    }
    
    // Then apply search filter
    if (searchTerm.trim()) {
      const searchLower = searchTerm.toLowerCase();
      filtered = filtered.filter(order => 
        order.orderId.toLowerCase().includes(searchLower) ||
        order.customer.email.toLowerCase().includes(searchLower) ||
        (order.customer.phoneNumber && order.customer.phoneNumber.toLowerCase().includes(searchLower)) ||
        order.items.some(item => item.name.toLowerCase().includes(searchLower))
      );
    }
    
    setFilteredOrders(filtered);
    // Reset to first page when filters change
    setCurrentPage(1);
  }, [allOrders, searchTerm, statusFilter]);

  // Memoized orders and pagination data
  const orders = useMemo(() => filteredOrders, [filteredOrders]);
  const totalPages = useMemo(() => Math.ceil(filteredOrders.length / itemsPerPage), [filteredOrders.length, itemsPerPage]);


  // Handle view details - use the global modal context
  const handleViewDetails = useCallback((order) => {
    openOrderModalWithData(order);
  }, [openOrderModalWithData]);

  // Memoized utility functions
  const formatDate = useCallback((dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }, []);

  // Simple filter handlers - no useCallback to avoid re-render issues
  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
  };

  const handleStatusFilterChange = (e) => {
    const newStatus = e.target.value;
    setStatusFilter(newStatus);
    setSelectedStatusCard(newStatus);
  };

  // Handle status card click
  const handleStatusCardClick = useCallback((status) => {
    if (selectedStatusCard === status) {
      // If clicking the same card, deselect it
      setSelectedStatusCard('');
      setStatusFilter('');
    } else {
      // Select new status card
      setSelectedStatusCard(status);
      setStatusFilter(status);
    }
  }, [selectedStatusCard]);

  // Pagination handlers
  const handlePageChange = useCallback((page) => {
    setCurrentPage(page);
  }, []);

  const handleItemsPerPageChange = useCallback((newItemsPerPage) => {
    setItemsPerPage(newItemsPerPage);
    setCurrentPage(1); // Reset to first page when changing items per page
  }, []);

  // Bulk selection handlers
  const paginatedOrders = useMemo(() => 
    orders.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage),
    [orders, currentPage, itemsPerPage]
  );

  const handleSelectAll = useCallback((e) => {
    if (e.target.checked) {
      const newSelected = new Set(paginatedOrders.map(order => order._id));
      setSelectedOrders(newSelected);
    } else {
      setSelectedOrders(new Set());
    }
  }, [paginatedOrders]);

  const handleSelectOrder = useCallback((orderId) => {
    setSelectedOrders(prev => {
      const newSelected = new Set(prev);
      if (newSelected.has(orderId)) {
        newSelected.delete(orderId);
      } else {
        newSelected.add(orderId);
      }
      return newSelected;
    });
  }, []);

  const handleBulkDelete = useCallback(async () => {
    if (selectedOrders.size === 0) return;

    if (window.confirm(`Are you sure you want to delete ${selectedOrders.size} order(s)? This action cannot be undone.`)) {
      try {
        await bulkDeleteMutation.mutateAsync(Array.from(selectedOrders));
        toast.success(`${selectedOrders.size} order(s) deleted successfully`);
        setSelectedOrders(new Set());
      } catch (error) {
        toast.error('Failed to delete orders');
      }
    }
  }, [selectedOrders, bulkDeleteMutation]);

  const isAllSelected = useMemo(() => 
    paginatedOrders.length > 0 && paginatedOrders.every(order => selectedOrders.has(order._id)),
    [paginatedOrders, selectedOrders]
  );

  const isSomeSelected = useMemo(() => 
    paginatedOrders.some(order => selectedOrders.has(order._id)) && !isAllSelected,
    [paginatedOrders, selectedOrders, isAllSelected]
  );

  // Show skeleton loader while loading
  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-900">Orders</h1>
        </div>
        
        {/* Status Cards Skeleton */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
          {Array.from({ length: 7 }).map((_, index) => (
            <div key={index} className="p-4 rounded-lg border border-gray-200 bg-white">
              <div className="flex flex-col items-center space-y-2">
                <div className="w-12 h-12 bg-gray-200 rounded-full animate-pulse"></div>
                <div className="text-center">
                  <div className="h-4 w-16 bg-gray-200 rounded animate-pulse mb-1"></div>
                  <div className="h-6 w-8 bg-gray-200 rounded animate-pulse"></div>
                </div>
              </div>
            </div>
          ))}
        </div>
        
        <div className="bg-white p-4 rounded-lg shadow">
          <FormSkeleton />
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <TableSkeleton rows={8} columns={7} />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <p className="text-red-600 mb-4">Failed to load orders</p>
          <Button onClick={() => window.location.reload()}>
            Retry
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div className="flex items-center space-x-4">
          <h1 className="text-2xl font-bold text-gray-900">Orders</h1>
          {selectedOrders.size > 0 && (
            <Button
              variant="destructive"
              onClick={handleBulkDelete}
              disabled={bulkDeleteMutation.isPending}
            >
              <Trash2 size={16} className="mr-2" />
              Delete {selectedOrders.size} order{selectedOrders.size !== 1 ? 's' : ''}
            </Button>
          )}
          {/* Real-time connection status */}
          <div className="flex items-center space-x-2">
            <div className={`w-2 h-2 rounded-full ${
              realtimeConnectionStatus === 'connected' 
                ? 'bg-green-500' 
                : realtimeConnectionStatus === 'connecting'
                ? 'bg-yellow-500 animate-pulse'
                : 'bg-red-500'
            }`}></div>
            <span className="text-sm text-gray-600">
              {realtimeConnectionStatus === 'connected' 
                ? 'Live' 
                : realtimeConnectionStatus === 'connecting'
                ? 'Connecting...'
                : 'Offline'
              }
            </span>
          </div>
        </div>
      </div>

      {/* Status Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
        {statusCards.map((card) => {
          const Icon = card.icon;
          const isSelected = selectedStatusCard === card.status;
          
          return (
            <button
              key={card.status}
              onClick={() => handleStatusCardClick(card.status)}
              className={`p-4 rounded-lg border-2 transition-all duration-200 hover:shadow-md ${
                isSelected
                  ? 'border-orange-500 bg-orange-50 shadow-md'
                  : 'border-gray-200 bg-white hover:border-gray-300'
              }`}
            >
              <div className="flex flex-col items-center space-y-2">
                <div className={`p-3 rounded-full ${card.color}`}>
                  <Icon className="h-6 w-6 text-white" />
                </div>
                <div className="text-center">
                  <p className="text-sm font-medium text-gray-900">{card.label}</p>
                  <p className="text-2xl font-bold text-gray-900">{card.count}</p>
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-lg shadow">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <SearchInput
            value={searchTerm}
            onChange={handleSearchChange}
          />
          
          <select
            value={statusFilter}
            onChange={handleStatusFilterChange}
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
          >
            {statusOptions.map(option => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          
          <select
            value={`${sortBy}-${sortOrder}`}
            onChange={(e) => {
              const [field, order] = e.target.value.split('-');
              setSortBy(field);
              setSortOrder(order);
            }}
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
          >
            <option value="createdAt-desc">Newest First</option>
            <option value="createdAt-asc">Oldest First</option>
            <option value="pricing.total-desc">Highest Amount</option>
            <option value="pricing.total-asc">Lowest Amount</option>
            <option value="orderId-asc">Order ID A-Z</option>
            <option value="orderId-desc">Order ID Z-A</option>
          </select>
        </div>
      </div>

      {/* Table */}
      {orders.length > 0 ? (
        <OptimizedTable>
          <OptimizedTableHeader>
            <OptimizedTableHead className="w-[50px]">
              <TableCheckbox
                checked={isAllSelected}
                onChange={handleSelectAll}
                ref={(el) => {
                  if (el) el.indeterminate = isSomeSelected;
                }}
              />
            </OptimizedTableHead>
            <OptimizedTableHead>Order ID</OptimizedTableHead>
            <OptimizedTableHead>Customer</OptimizedTableHead>
            <OptimizedTableHead>Delivery Type</OptimizedTableHead>
            <OptimizedTableHead>Items</OptimizedTableHead>
            <OptimizedTableHead>Delivery Fee</OptimizedTableHead>
            <OptimizedTableHead>Total</OptimizedTableHead>
            <OptimizedTableHead>Status</OptimizedTableHead>
            <OptimizedTableHead>Payment Method</OptimizedTableHead>
            <OptimizedTableHead>Payment</OptimizedTableHead>
            <OptimizedTableHead>Date</OptimizedTableHead>
            <OptimizedTableHead>Actions</OptimizedTableHead>
          </OptimizedTableHeader>
          <OptimizedTableBody>
            {paginatedOrders.map((order) => (
                <OptimizedOrderTableRow
                  key={`${order._id}-${order.status}-${order.payment?.status || 'pending'}-${order._lastUpdated || order.updatedAt}`}
                  order={order}
                  selected={selectedOrders.has(order._id)}
                  onSelect={handleSelectOrder}
                  statusIcons={statusIcons}
                  statusColors={statusColors}
                  paymentStatusIcons={paymentStatusIcons}
                  paymentStatusColors={paymentStatusColors}
                  formatDate={formatDate}
                  onViewDetails={() => handleViewDetails(order)}
                />
              ))}
          </OptimizedTableBody>
        </OptimizedTable>
      ) : (
        <EmptyState
          type="orders"
          title="No orders found"
          description="Orders will appear here when customers place them."
        />
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex flex-col sm:flex-row justify-between items-center space-y-4 sm:space-y-0">
          {/* Pagination Info */}
          <div className="text-sm text-gray-600">
            Showing {((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, orders.length)} of {orders.length} results
          </div>

          {/* Pagination Controls */}
          <div className="flex flex-col sm:flex-row items-center space-y-2 sm:space-y-0 sm:space-x-4">
            {/* Size Selector */}
            <div className="flex items-center space-x-2">
              <span className="text-sm text-gray-600">Show:</span>
              <select
                value={itemsPerPage}
                onChange={(e) => handleItemsPerPageChange(Number(e.target.value))}
                className="px-2 py-1 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
              >
                <option value={5}>5</option>
                <option value={10}>10</option>
                <option value={25}>25</option>
                <option value={50}>50</option>
              </select>
              <span className="text-sm text-gray-600">per page</span>
            </div>

            {/* Pagination */}
            <div className="flex items-center space-x-1">
              <Button
                variant="outline"
                size="sm"
                disabled={currentPage === 1}
                onClick={() => handlePageChange(currentPage - 1)}
                className="h-8 w-8 p-0"
              >
                ←
              </Button>
              
              {/* Page Numbers */}
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                let pageNum;
                if (totalPages <= 5) {
                  pageNum = i + 1;
                } else if (currentPage <= 3) {
                  pageNum = i + 1;
                } else if (currentPage >= totalPages - 2) {
                  pageNum = totalPages - 4 + i;
                } else {
                  pageNum = currentPage - 2 + i;
                }
                
                return (
                  <Button
                    key={pageNum}
                    variant={currentPage === pageNum ? "default" : "outline"}
                    size="sm"
                    onClick={() => handlePageChange(pageNum)}
                    className="h-8 w-8 p-0"
                  >
                    {pageNum}
                  </Button>
                );
              })}
              
              <Button
                variant="outline"
                size="sm"
                disabled={currentPage === totalPages}
                onClick={() => handlePageChange(currentPage + 1)}
                className="h-8 w-8 p-0"
              >
                →
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Performance Monitor - Only in development */}
      <PerformanceMonitor 
        orders={allOrders} 
        realtimeConnectionStatus={realtimeConnectionStatus} 
      />

    </div>
  );
};

// Memoized Order Table Row Component with optimized re-rendering
const OrderTableRow = React.memo(({ 
  order, 
  statusIcons, 
  statusColors, 
  paymentStatusIcons,
  paymentStatusColors,
  formatDate, 
  onViewDetails
}) => {
  // Memoize icon components to prevent unnecessary re-renders
  const StatusIcon = useMemo(() => statusIcons[order.status], [statusIcons, order.status]);
  const PaymentStatusIcon = useMemo(() => paymentStatusIcons[order.payment?.status || 'pending'], [paymentStatusIcons, order.payment?.status]);
  
  // Memoize formatted values
  const deliveryType = useMemo(() => 
    order.delivery.type === 'delivery' ? 'Delivery' : 'Collection', 
    [order.delivery.type]
  );

  const formattedStatus = useMemo(() => 
    order.status.split('_').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' '), 
    [order.status]
  );

  const formattedPaymentStatus = useMemo(() => 
    (order.payment?.status || 'pending').charAt(0).toUpperCase() + (order.payment?.status || 'pending').slice(1),
    [order.payment?.status]
  );

  const paymentMethod = useMemo(() => {
    const methodMap = {
      cash_on_delivery: 'COD',
      cash_on_collection: 'COC',
      stripe: 'Card'
    };
    return methodMap[order.payment?.method] || order.payment?.method;
  }, [order.payment?.method]);

  const formattedDate = useMemo(() => formatDate(order.createdAt), [formatDate, order.createdAt]);
  
  const deliveryFeeDisplay = useMemo(() => {
    if (order.delivery.type === 'delivery') {
      return order.pricing.deliveryFee === 0 ? (
        <span className="text-sm font-medium text-green-600">FREE</span>
      ) : (
        <span className="text-sm font-medium">£{order.pricing.deliveryFee.toFixed(2)}</span>
      );
    }
    return <span className="text-sm text-gray-500">N/A</span>;
  }, [order.delivery.type, order.pricing.deliveryFee]);

  const totalAmount = useMemo(() => `£${order.pricing.total.toFixed(2)}`, [order.pricing.total]);
  const itemsCount = useMemo(() => `${order.items.length} item${order.items.length !== 1 ? 's' : ''}`, [order.items.length]);
  
  return (
    <TableRow key={`${order._id}-${order.status}-${order.payment?.status}`}>
      <TableCell className="font-medium">
        {order.orderId}
      </TableCell>
      <TableCell>
        <div>
          <div className="font-medium">{order.customer.email}</div>
          {order.customer.phoneNumber && (
            <div className="text-sm text-gray-500">{order.customer.phoneNumber}</div>
          )}
        </div>
      </TableCell>
      <TableCell>
        <span className={`px-2 py-1 rounded-full text-sm font-medium ${
          order.delivery.type === 'delivery' 
            ? 'bg-blue-100 text-blue-800' 
            : 'bg-green-100 text-green-800'
        }`}>
          {deliveryType}
        </span>
      </TableCell>
      <TableCell>
        <div className="text-sm">
          {itemsCount}
        </div>
      </TableCell>
      <TableCell>
        {deliveryFeeDisplay}
      </TableCell>
      <TableCell className="font-medium">
        {totalAmount}
      </TableCell>
      <TableCell>
        <div className="flex items-center space-x-2">
          <StatusIcon size={16} />
          <span className={`px-2 py-1 rounded-full text-sm font-medium ${statusColors[order.status]}`}>
            {formattedStatus}
          </span>
        </div>
      </TableCell>
      <TableCell>
        <span className={`px-2 py-1 rounded-full text-sm font-medium ${
          order.payment?.method === 'cash_on_delivery' 
            ? 'bg-blue-100 text-blue-800' 
            : 'bg-green-100 text-green-800'
        }`}>
          {paymentMethod}
        </span>
      </TableCell>
      <TableCell>
        <div className="flex items-center space-x-2">
          <PaymentStatusIcon size={16} />
          <span className={`px-2 py-1 rounded-full text-sm font-medium ${paymentStatusColors[order.payment?.status || 'pending']}`}>
            {formattedPaymentStatus}
          </span>
        </div>
      </TableCell>
      <TableCell className="text-sm text-gray-600">
        {formattedDate}
      </TableCell>
      <TableCell>
        <div className="flex space-x-2">
          <button
            onClick={onViewDetails}
            className="text-blue-600 hover:text-blue-800"
            title="View Details"
          >
            <Eye size={16} />
          </button>
        </div>
      </TableCell>
    </TableRow>
  );
}, (prevProps, nextProps) => {
  // Custom comparison function for React.memo
  // Only re-render if critical properties have changed
  return (
    prevProps.order._id === nextProps.order._id &&
    prevProps.order.status === nextProps.order.status &&
    prevProps.order.payment?.status === nextProps.order.payment?.status &&
    prevProps.order.pricing.total === nextProps.order.pricing.total &&
    prevProps.order.pricing.deliveryFee === nextProps.order.pricing.deliveryFee &&
    prevProps.order.createdAt === nextProps.order.createdAt &&
    prevProps.order.customer.email === nextProps.order.customer.email &&
    prevProps.order.customer.phoneNumber === nextProps.order.customer.phoneNumber &&
    prevProps.order.delivery.type === nextProps.order.delivery.type &&
    prevProps.order.items.length === nextProps.order.items.length &&
    prevProps.order.payment?.method === nextProps.order.payment?.method &&
    prevProps.selected === nextProps.selected
  );
});

// Optimized Order Table Row Component using OptimizedTableRow
const OptimizedOrderTableRow = React.memo(({ 
  order,
  selected,
  onSelect,
  statusIcons, 
  statusColors, 
  paymentStatusIcons,
  paymentStatusColors,
  formatDate, 
  onViewDetails
}) => {
  // Memoize icon components to prevent unnecessary re-renders
  const StatusIcon = useMemo(() => statusIcons[order.status], [statusIcons, order.status]);
  const PaymentStatusIcon = useMemo(() => paymentStatusIcons[order.payment?.status || 'pending'], [paymentStatusIcons, order.payment?.status]);
  
  // Memoize formatted values
  const deliveryType = useMemo(() => 
    order.delivery.type === 'delivery' ? 'Delivery' : 'Collection', 
    [order.delivery.type]
  );

  const formattedStatus = useMemo(() => 
    order.status.split('_').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' '), 
    [order.status]
  );

  const formattedPaymentStatus = useMemo(() => 
    (order.payment?.status || 'pending').charAt(0).toUpperCase() + (order.payment?.status || 'pending').slice(1),
    [order.payment?.status]
  );

  const paymentMethod = useMemo(() => {
    const methodMap = {
      cash_on_delivery: 'COD',
      cash_on_collection: 'COC',
      stripe: 'Card'
    };
    return methodMap[order.payment?.method] || order.payment?.method;
  }, [order.payment?.method]);

  const formattedDate = useMemo(() => formatDate(order.createdAt), [formatDate, order.createdAt]);
  
  const deliveryFeeDisplay = useMemo(() => {
    if (order.delivery.type === 'delivery') {
      return order.pricing.deliveryFee === 0 ? (
        <span className="text-sm font-medium text-green-600">FREE</span>
      ) : (
        <span className="text-sm font-medium">£{order.pricing.deliveryFee.toFixed(2)}</span>
      );
    }
    return <span className="text-sm text-gray-500">N/A</span>;
  }, [order.delivery.type, order.pricing.deliveryFee]);

  const totalAmount = useMemo(() => `£${order.pricing.total.toFixed(2)}`, [order.pricing.total]);
  const itemsCount = useMemo(() => `${order.items.length} item${order.items.length !== 1 ? 's' : ''}`, [order.items.length]);
  
  return (
    <OptimizedTableRow 
      orderId={order._id}
      status={order.status}
      paymentStatus={order.payment?.status || 'pending'}
      selected={selected}
    >
      <TableCell>
        <TableCheckbox
          checked={selected}
          onChange={() => onSelect(order._id)}
        />
      </TableCell>
      <OptimizedTableCell className="font-medium">
        {order.orderId}
      </OptimizedTableCell>
      <OptimizedTableCell>
        <div>
          <div className="font-medium">{order.customer.email}</div>
          {order.customer.phoneNumber && (
            <div className="text-sm text-gray-500">{order.customer.phoneNumber}</div>
          )}
        </div>
      </OptimizedTableCell>
      <OptimizedTableCell>
        <span className={`px-2 py-1 rounded-full text-sm font-medium ${
          order.delivery.type === 'delivery' 
            ? 'bg-blue-100 text-blue-800' 
            : 'bg-green-100 text-green-800'
        }`}>
          {deliveryType}
        </span>
      </OptimizedTableCell>
      <OptimizedTableCell>
        <div className="text-sm">
          {itemsCount}
        </div>
      </OptimizedTableCell>
      <OptimizedTableCell>
        {deliveryFeeDisplay}
      </OptimizedTableCell>
      <OptimizedTableCell className="font-medium">
        {totalAmount}
      </OptimizedTableCell>
      <OptimizedTableCell>
        <div className="flex items-center space-x-2">
          <StatusIcon size={16} />
          <span className={`px-2 py-1 rounded-full text-sm font-medium ${statusColors[order.status]}`}>
            {formattedStatus}
          </span>
        </div>
      </OptimizedTableCell>
      <OptimizedTableCell>
        <span className={`px-2 py-1 rounded-full text-sm font-medium ${
          order.payment?.method === 'cash_on_delivery' 
            ? 'bg-blue-100 text-blue-800' 
            : 'bg-green-100 text-green-800'
        }`}>
          {paymentMethod}
        </span>
      </OptimizedTableCell>
      <OptimizedTableCell>
        <div className="flex items-center space-x-2">
          <PaymentStatusIcon size={16} />
          <span className={`px-2 py-1 rounded-full text-sm font-medium ${paymentStatusColors[order.payment?.status || 'pending']}`}>
            {formattedPaymentStatus}
          </span>
        </div>
      </OptimizedTableCell>
      <OptimizedTableCell className="text-sm text-gray-600">
        {formattedDate}
      </OptimizedTableCell>
      <OptimizedTableCell>
        <div className="flex space-x-2">
          <button
            onClick={onViewDetails}
            className="text-blue-600 hover:text-blue-800"
            title="View Details"
          >
            <Eye size={16} />
          </button>
        </div>
      </OptimizedTableCell>
    </OptimizedTableRow>
  );
});

// Simple search input - no complex focus management
const SearchInput = ({ value, onChange }) => {
  return (
    <div className="relative">
      <Search size={20} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
      <input
        type="text"
        placeholder="Search orders..."
        value={value}
        onChange={onChange}
        className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
      />
    </div>
  );
};

export default Orders;
