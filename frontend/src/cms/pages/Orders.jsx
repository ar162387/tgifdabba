import React, { useState, useMemo, useCallback, useTransition } from 'react';
import { Search, Filter, Eye, CheckCircle, Clock, XCircle, Truck } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/Table';
import EmptyState from '../components/ui/EmptyState';
import { TableSkeleton, FormSkeleton } from '../components/ui/Skeleton';
import { useOrders, useUpdateOrderStatus, useMarkOrderAsRead } from '../hooks/useOrders';
import { useDebounce } from '../hooks/useDebounce';
import toast from 'react-hot-toast';

const Orders = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [sortBy, setSortBy] = useState('createdAt');
  const [sortOrder, setSortOrder] = useState('desc');
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [isPending, startTransition] = useTransition();

  // Debounce search term
  const debouncedSearchTerm = useDebounce(searchTerm, 300);

  // Memoized configuration objects
  const statusOptions = useMemo(() => [
    { value: '', label: 'All Status' },
    { value: 'pending', label: 'Pending' },
    { value: 'preparing', label: 'Preparing' },
    { value: 'delivered', label: 'Delivered' },
    { value: 'canceled', label: 'Canceled' }
  ], []);

  const statusColors = useMemo(() => ({
    pending: 'bg-yellow-100 text-yellow-800',
    preparing: 'bg-blue-100 text-blue-800',
    delivered: 'bg-green-100 text-green-800',
    canceled: 'bg-red-100 text-red-800'
  }), []);

  const statusIcons = useMemo(() => ({
    pending: Clock,
    preparing: Truck,
    delivered: CheckCircle,
    canceled: XCircle
  }), []);

  // Memoized query parameters
  const queryParams = useMemo(() => ({
    page: currentPage,
    limit: 10,
    ...(debouncedSearchTerm && { search: debouncedSearchTerm }),
    ...(statusFilter && { status: statusFilter }),
    sortBy,
    sortOrder
  }), [currentPage, debouncedSearchTerm, statusFilter, sortBy, sortOrder]);

  // TanStack Query hooks
  const { data: ordersData, isLoading, error } = useOrders(queryParams);
  const updateStatusMutation = useUpdateOrderStatus();
  const markAsReadMutation = useMarkOrderAsRead();

  // Memoized orders and pagination data
  const orders = useMemo(() => ordersData?.orders || [], [ordersData?.orders]);
  const totalPages = useMemo(() => ordersData?.pagination?.pages || 1, [ordersData?.pagination?.pages]);

  // Memoized event handlers
  const handleStatusUpdate = useCallback(async (orderId, newStatus) => {
    try {
      await updateStatusMutation.mutateAsync({ id: orderId, status: newStatus });
      toast.success('Order status updated');
    } catch (error) {
      toast.error('Failed to update order status');
    }
  }, [updateStatusMutation]);

  const handleMarkAsRead = useCallback(async (orderId) => {
    try {
      await markAsReadMutation.mutateAsync(orderId);
      toast.success('Order marked as read');
    } catch (error) {
      toast.error('Failed to mark order as read');
    }
  }, [markAsReadMutation]);

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

  // Memoized filter handlers with useTransition
  const handleSearchChange = useCallback((e) => {
    startTransition(() => {
      setSearchTerm(e.target.value);
    });
  }, []);

  const handleStatusFilterChange = useCallback((e) => {
    startTransition(() => {
      setStatusFilter(e.target.value);
    });
  }, []);

  // Show skeleton loader while loading
  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-900">Orders</h1>
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

      {/* Filters */}
      <div className="bg-white p-4 rounded-lg shadow">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="relative">
            <Search size={20} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <Input
              placeholder="Search orders..."
              value={searchTerm}
              onChange={handleSearchChange}
              className="pl-10"
            />
          </div>
          
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
            <option value="totals.total-desc">Highest Amount</option>
            <option value="totals.total-asc">Lowest Amount</option>
          </select>
          
          <Button variant="outline" disabled={isPending}>
            <Filter size={20} className="mr-2" />
            {isPending ? 'Filtering...' : 'Apply Filters'}
          </Button>
        </div>
      </div>

      {/* Table */}
      {orders.length > 0 ? (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Order #</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead>Items</TableHead>
                <TableHead>Total</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {orders.map((order) => (
                <OrderTableRow
                  key={order._id}
                  order={order}
                  statusIcons={statusIcons}
                  statusColors={statusColors}
                  formatDate={formatDate}
                  onViewDetails={() => setSelectedOrder(order)}
                  onMarkAsRead={handleMarkAsRead}
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
        <div className="flex justify-center space-x-2">
          <Button
            variant="outline"
            disabled={currentPage === 1}
            onClick={() => setCurrentPage(currentPage - 1)}
          >
            Previous
          </Button>
          <span className="px-4 py-2 text-sm text-gray-600">
            Page {currentPage} of {totalPages}
          </span>
          <Button
            variant="outline"
            disabled={currentPage === totalPages}
            onClick={() => setCurrentPage(currentPage + 1)}
          >
            Next
          </Button>
        </div>
      )}

      {/* Order Details Modal */}
      {selectedOrder && (
        <OrderDetailsModal
          order={selectedOrder}
          onClose={() => setSelectedOrder(null)}
          onStatusUpdate={handleStatusUpdate}
        />
      )}
    </div>
  );
};

// Order Details Modal Component
const OrderDetailsModal = ({ order, onClose, onStatusUpdate }) => {
  const [newStatus, setNewStatus] = useState(order.status);

  const handleStatusChange = async () => {
    if (newStatus !== order.status) {
      await onStatusUpdate(order._id, newStatus);
    }
    onClose();
  };

  const statusOptions = [
    { value: 'pending', label: 'Pending' },
    { value: 'preparing', label: 'Preparing' },
    { value: 'delivered', label: 'Delivered' },
    { value: 'canceled', label: 'Canceled' }
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-gray-900 bg-opacity-20 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <h2 className="text-xl font-semibold mb-4">Order Details</h2>

          <div className="space-y-6">
            {/* Customer Info */}
            <div>
              <h3 className="text-lg font-medium mb-3">Customer Information</h3>
              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-600">Name</p>
                    <p className="font-medium">{order.customer.name}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Email</p>
                    <p className="font-medium">{order.customer.email}</p>
                  </div>
                  {order.customer.phone && (
                    <div>
                      <p className="text-sm text-gray-600">Phone</p>
                      <p className="font-medium">{order.customer.phone}</p>
                    </div>
                  )}
                  <div>
                    <p className="text-sm text-gray-600">Order Date</p>
                    <p className="font-medium">
                      {new Date(order.createdAt).toLocaleString()}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Items */}
            <div>
              <h3 className="text-lg font-medium mb-3">Order Items</h3>
              <div className="space-y-2">
                {order.items.map((item, index) => (
                  <div key={index} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                    <div>
                      <p className="font-medium">{item.item.name}</p>
                      <p className="text-sm text-gray-600">Quantity: {item.quantity}</p>
                    </div>
                    <p className="font-medium">${item.price.toFixed(2)}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Totals */}
            <div>
              <h3 className="text-lg font-medium mb-3">Order Summary</h3>
              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span>Subtotal:</span>
                    <span>${order.totals.subtotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Tax:</span>
                    <span>${order.totals.tax.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between font-bold text-lg border-t pt-2">
                    <span>Total:</span>
                    <span>${order.totals.total.toFixed(2)}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Status Update */}
            <div>
              <h3 className="text-lg font-medium mb-3">Update Status</h3>
              <div className="flex items-center space-x-4">
                <select
                  value={newStatus}
                  onChange={(e) => setNewStatus(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                >
                  {statusOptions.map(option => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
                <Button onClick={handleStatusChange}>
                  Update Status
                </Button>
              </div>
            </div>
          </div>

          <div className="flex justify-end space-x-3 mt-6 pt-4 border-t">
            <Button variant="outline" onClick={onClose}>
              Close
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

// Memoized Order Table Row Component
const OrderTableRow = React.memo(({ 
  order, 
  statusIcons, 
  statusColors, 
  formatDate, 
  onViewDetails, 
  onMarkAsRead 
}) => {
  const StatusIcon = statusIcons[order.status];
  
  return (
    <TableRow className={!order.read ? 'bg-blue-50' : ''}>
      <TableCell className="font-medium">
        #{order._id.slice(-8)}
      </TableCell>
      <TableCell>
        <div>
          <div className="font-medium">{order.customer.name}</div>
          <div className="text-sm text-gray-500">{order.customer.email}</div>
        </div>
      </TableCell>
      <TableCell>
        <div className="text-sm">
          {order.items.length} item{order.items.length !== 1 ? 's' : ''}
        </div>
      </TableCell>
      <TableCell className="font-medium">
        ${order.totals.total.toFixed(2)}
      </TableCell>
      <TableCell>
        <div className="flex items-center space-x-2">
          <StatusIcon size={16} />
          <span className={`px-2 py-1 rounded-full text-sm font-medium ${statusColors[order.status]}`}>
            {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
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
          {!order.read && (
            <button
              onClick={() => onMarkAsRead(order._id)}
              className="text-green-600 hover:text-green-800"
              title="Mark as Read"
            >
              <CheckCircle size={16} />
            </button>
          )}
        </div>
      </TableCell>
    </TableRow>
  );
});

export default Orders;
