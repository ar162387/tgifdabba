import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { Search, Eye, CheckCircle, Clock, XCircle, Truck, Edit, Trash2, MapPin, Phone, Mail, CreditCard, Package } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/Table';
import EmptyState from '../components/ui/EmptyState';
import { TableSkeleton, FormSkeleton } from '../components/ui/Skeleton';
import OrderViewModal from '../components/OrderViewModal';
import { useOrders, useUpdateOrderStatus, useDeleteOrder, useCancelOrder, useUpdatePaymentStatus } from '../hooks/useOrders';
import { orderService } from '../services/orderService';
import toast from 'react-hot-toast';

const Orders = () => {
  const location = useLocation();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [sortBy, setSortBy] = useState('createdAt');
  const [sortOrder, setSortOrder] = useState('desc');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [filteredOrders, setFilteredOrders] = useState([]);
  const [allOrders, setAllOrders] = useState([]);
  const [selectedStatusCard, setSelectedStatusCard] = useState('');

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
  const updateStatusMutation = useUpdateOrderStatus();
  const updatePaymentStatusMutation = useUpdatePaymentStatus();
  const deleteOrderMutation = useDeleteOrder();
  const cancelOrderMutation = useCancelOrder();

  // Update allOrders when data changes (use ordersData for status cards and table)
  useEffect(() => {
    if (ordersData?.orders) {
      setAllOrders(ordersData.orders);
    }
  }, [ordersData?.orders]);

  // Handle pre-selected order from notification panel via location state
  useEffect(() => {
    const selectedOrderId = location.state?.selectedOrderId;
    if (selectedOrderId && allOrders.length > 0) {
      // Find the full order data by orderId
      const fullOrder = allOrders.find(order => order.orderId === selectedOrderId);
      if (fullOrder) {
        setSelectedOrder(fullOrder);
        // Clear the location state to prevent re-opening on page refresh
        window.history.replaceState({}, document.title, window.location.pathname);
      }
    }
  }, [location.state?.selectedOrderId, allOrders]);

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
        order.customer.phoneNumber.toLowerCase().includes(searchLower) ||
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

  // Memoized event handlers
  const handleStatusUpdate = useCallback(async (orderId, newStatus) => {
    try {
      await updateStatusMutation.mutateAsync({ id: orderId, status: newStatus });
      toast.success('Order status updated');
      setSelectedOrder(null); // Close modal after update
    } catch (error) {
      toast.error('Failed to update order status');
    }
  }, [updateStatusMutation]);

  const handleDeleteOrder = useCallback(async (orderId) => {
    if (window.confirm('Are you sure you want to delete this order? This action cannot be undone.')) {
      try {
        await deleteOrderMutation.mutateAsync(orderId);
        toast.success('Order deleted successfully');
        setSelectedOrder(null); // Close modal if open
      } catch (error) {
        toast.error('Failed to delete order');
      }
    }
  }, [deleteOrderMutation]);

  const handleCancelOrder = useCallback(async (orderId, reason) => {
    try {
      await cancelOrderMutation.mutateAsync({ id: orderId, reason });
      toast.success('Order cancelled successfully');
      setSelectedOrder(null); // Close modal after cancellation
    } catch (error) {
      toast.error('Failed to cancel order');
    }
  }, [cancelOrderMutation]);

  const handlePaymentStatusUpdate = useCallback(async (orderId, paymentStatus) => {
    try {
      await updatePaymentStatusMutation.mutateAsync({ id: orderId, paymentStatus });
      toast.success('Payment status updated successfully');
    } catch (error) {
      toast.error('Failed to update payment status');
    }
  }, [updatePaymentStatusMutation]);

  const handleStripeRefund = useCallback(async (orderId, amount, reason) => {
    try {
      await orderService.createStripeRefund(orderId, amount, reason);
      toast.success('Refund created successfully');
      setSelectedOrder(null); // Close modal after refund
    } catch (error) {
      toast.error('Failed to create refund');
    }
  }, []);

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
        <h1 className="text-2xl font-bold text-gray-900">Orders</h1>
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
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Order ID</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead>Delivery Type</TableHead>
                <TableHead>Items</TableHead>
                <TableHead>Total</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Payment Method</TableHead>
                <TableHead>Payment</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {orders
                .slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)
                .map((order) => (
                  <OrderTableRow
                    key={order._id}
                    order={order}
                    statusIcons={statusIcons}
                    statusColors={statusColors}
                    paymentStatusIcons={paymentStatusIcons}
                    paymentStatusColors={paymentStatusColors}
                    formatDate={formatDate}
                    onViewDetails={() => setSelectedOrder(order)}
                    onDelete={handleDeleteOrder}
                  />
                ))}
            </TableBody>
          </Table>
        </div>
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

      {/* Order Details Modal */}
      {selectedOrder && (
        <OrderViewModal
          order={selectedOrder}
          onClose={() => setSelectedOrder(null)}
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
    </div>
  );
};

// Memoized Order Table Row Component
const OrderTableRow = React.memo(({ 
  order, 
  statusIcons, 
  statusColors, 
  paymentStatusIcons,
  paymentStatusColors,
  formatDate, 
  onViewDetails, 
  onDelete 
}) => {
  const StatusIcon = statusIcons[order.status];
  const PaymentStatusIcon = paymentStatusIcons[order.payment?.status || 'pending'];
  
  const formatDeliveryType = (type) => {
    return type === 'delivery' ? 'Delivery' : 'Collection';
  };

  const formatStatus = (status) => {
    return status.split('_').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
  };

  const formatPaymentStatus = (status) => {
    return status.charAt(0).toUpperCase() + status.slice(1);
  };

  const formatPaymentMethod = (method) => {
    const methodMap = {
      cash_on_delivery: 'COD',
      cash_on_collection: 'COC',
      stripe: 'Card'
    };
    return methodMap[method] || method;
  };
  
  return (
    <TableRow>
      <TableCell className="font-medium">
        {order.orderId}
      </TableCell>
      <TableCell>
        <div>
          <div className="font-medium">{order.customer.email}</div>
          <div className="text-sm text-gray-500">{order.customer.phoneNumber}</div>
        </div>
      </TableCell>
      <TableCell>
        <span className={`px-2 py-1 rounded-full text-sm font-medium ${
          order.delivery.type === 'delivery' 
            ? 'bg-blue-100 text-blue-800' 
            : 'bg-green-100 text-green-800'
        }`}>
          {formatDeliveryType(order.delivery.type)}
        </span>
      </TableCell>
      <TableCell>
        <div className="text-sm">
          {order.items.length} item{order.items.length !== 1 ? 's' : ''}
        </div>
      </TableCell>
      <TableCell className="font-medium">
        £{order.pricing.total.toFixed(2)}
      </TableCell>
      <TableCell>
        <div className="flex items-center space-x-2">
          <StatusIcon size={16} />
          <span className={`px-2 py-1 rounded-full text-sm font-medium ${statusColors[order.status]}`}>
            {formatStatus(order.status)}
          </span>
        </div>
      </TableCell>
      <TableCell>
        <span className={`px-2 py-1 rounded-full text-sm font-medium ${
          order.payment?.method === 'cash_on_delivery' 
            ? 'bg-blue-100 text-blue-800' 
            : 'bg-green-100 text-green-800'
        }`}>
          {formatPaymentMethod(order.payment?.method)}
        </span>
      </TableCell>
      <TableCell>
        <div className="flex items-center space-x-2">
          <PaymentStatusIcon size={16} />
          <span className={`px-2 py-1 rounded-full text-sm font-medium ${paymentStatusColors[order.payment?.status || 'pending']}`}>
            {formatPaymentStatus(order.payment?.status || 'pending')}
          </span>
        </div>
      </TableCell>
      <TableCell className="text-sm text-gray-600">
        {formatDate(order.createdAt)}
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
          <button
            onClick={() => onDelete(order._id)}
            className="text-red-600 hover:text-red-800"
            title="Delete Order"
          >
            <Trash2 size={16} />
          </button>
        </div>
      </TableCell>
    </TableRow>
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
