import React, { useState } from 'react';
import { MapPin, Phone, Mail, CreditCard, Edit, XCircle, Trash2 } from 'lucide-react';
import { Button } from './ui/Button';
import Modal from './ui/Modal';
import toast from 'react-hot-toast';

const OrderViewModal = ({ 
  order, 
  onClose, 
  onStatusUpdate, 
  onPaymentStatusUpdate, 
  onDelete, 
  onCancel, 
  onStripeRefund, 
  statusOptions, 
  paymentStatusIcons, 
  paymentStatusColors 
}) => {
  const [newStatus, setNewStatus] = useState(order.status);
  const [newPaymentStatus, setNewPaymentStatus] = useState(order.payment?.status || 'pending');
  const [cancelReason, setCancelReason] = useState('');
  const [showCancelForm, setShowCancelForm] = useState(false);
  const [showRefundForm, setShowRefundForm] = useState(false);
  const [refundAmount, setRefundAmount] = useState('');
  const [refundReason, setRefundReason] = useState('requested_by_customer');
  const [customRefundReason, setCustomRefundReason] = useState('');
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  const [isUpdatingPayment, setIsUpdatingPayment] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);
  const [isRefunding, setIsRefunding] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleStatusChange = async () => {
    if (newStatus !== order.status) {
      setIsUpdatingStatus(true);
      try {
        await onStatusUpdate(order._id, newStatus);
      } finally {
        setIsUpdatingStatus(false);
      }
    } else {
      onClose();
    }
  };

  const handlePaymentStatusChange = async () => {
    if (newPaymentStatus !== (order.payment?.status || 'pending')) {
      setIsUpdatingPayment(true);
      try {
        await onPaymentStatusUpdate(order._id, newPaymentStatus);
      } finally {
        setIsUpdatingPayment(false);
      }
    }
  };

  const handleCancelOrder = async () => {
    if (!cancelReason.trim()) {
      toast.error('Please provide a reason for cancellation');
      return;
    }
    setIsCancelling(true);
    try {
      await onCancel(order._id, cancelReason);
      setShowCancelForm(false);
    } finally {
      setIsCancelling(false);
    }
  };

  const handleRefundOrder = async () => {
    const amount = refundAmount.trim() ? parseFloat(refundAmount) : null;
    if (amount && (amount <= 0 || amount > order.payment.amount)) {
      toast.error('Invalid refund amount');
      return;
    }
    
    // Combine Stripe reason with custom reason for backend storage
    const refundData = {
      stripeReason: refundReason,
      customReason: customRefundReason.trim()
    };
    
    setIsRefunding(true);
    try {
      await onStripeRefund(order._id, amount, refundData);
      setShowRefundForm(false);
      setRefundAmount('');
      setRefundReason('requested_by_customer');
      setCustomRefundReason('');
    } finally {
      setIsRefunding(false);
    }
  };

  const formatDeliveryType = (type) => {
    return type === 'delivery' ? 'Delivery' : 'Collection';
  };

  const formatPaymentMethod = (method) => {
    const methodMap = {
      cash_on_delivery: 'COD',
      cash_on_collection: 'COC',
      stripe: 'Card'
    };
    return methodMap[method] || method;
  };

  const formatPaymentStatus = (status) => {
    return status.charAt(0).toUpperCase() + status.slice(1);
  };


  const PaymentStatusIcon = paymentStatusIcons[order.payment?.status || 'pending'];

  // Function to get available status options based on delivery type
  const getAvailableStatusOptions = (deliveryType) => {
    if (deliveryType === 'collection') {
      return [
        { value: 'pending', label: 'Pending' },
        { value: 'confirmed', label: 'Confirmed' },
        { value: 'ready_for_collection', label: 'Ready for Collection' },
        { value: 'collected', label: 'Collected' }
      ];
    } else { // delivery
      return [
        { value: 'pending', label: 'Pending' },
        { value: 'confirmed', label: 'Confirmed' },
        { value: 'delivered', label: 'Delivered' }
      ];
    }
  };

  return (
    <Modal isOpen={true} onClose={onClose} className="max-w-4xl">
      <div className="p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold">Order Details - {order.orderId}</h2>
          <div className="flex space-x-2">
            {order.status !== 'cancelled' && order.status !== 'delivered' && order.status !== 'collected' && (
              <Button
                variant="destructive"
                size="sm"
                onClick={() => setShowCancelForm(!showCancelForm)}
                disabled={isCancelling || isUpdatingStatus || isRefunding || isDeleting}
              >
                Cancel Order
              </Button>
            )}
            {order.payment?.method === 'stripe' && order.payment?.status === 'paid' && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowRefundForm(!showRefundForm)}
                disabled={isCancelling || isUpdatingStatus || isRefunding || isDeleting}
              >
                Create Refund
              </Button>
            )}
            <Button
              variant="destructive"
              size="sm"
              onClick={async () => {
                setIsDeleting(true);
                try {
                  await onDelete(order._id);
                } finally {
                  setIsDeleting(false);
                }
              }}
              disabled={isDeleting || isCancelling || isUpdatingStatus || isRefunding}
            >
              {isDeleting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-1"></div>
                  Deleting...
                </>
              ) : (
                <>
                  <Trash2 size={16} className="mr-1" />
                  Delete
                </>
              )}
            </Button>
          </div>
        </div>

        <div className="space-y-6">
          {/* Cancel Order Form */}
          {showCancelForm && order.status !== 'cancelled' && order.status !== 'delivered' && order.status !== 'collected' && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <h3 className="text-lg font-medium text-red-800 mb-3">Cancel Order</h3>
              <div className="space-y-3">
                <textarea
                  value={cancelReason}
                  onChange={(e) => setCancelReason(e.target.value)}
                  placeholder="Please provide a reason for cancellation..."
                  className="w-full px-3 py-2 border border-red-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                  rows={3}
                />
                <div className="flex justify-end space-x-2">
                  <Button 
                    variant="outline" 
                    onClick={() => setShowCancelForm(false)}
                    disabled={isCancelling}
                  >
                    Cancel
                  </Button>
                  <Button 
                    variant="destructive" 
                    onClick={handleCancelOrder}
                    disabled={isCancelling}
                  >
                    {isCancelling ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Cancelling...
                      </>
                    ) : (
                      'Confirm Cancellation'
                    )}
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* Stripe Refund Form */}
          {showRefundForm && order.payment?.method === 'stripe' && order.payment?.status === 'paid' && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h3 className="text-lg font-medium text-blue-800 mb-3">Create Refund</h3>
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Refund Amount (optional - leave empty for full refund)
                  </label>
                  <input
                    type="number"
                    value={refundAmount}
                    onChange={(e) => setRefundAmount(e.target.value)}
                    placeholder={`Max: £${order.payment.amount.toFixed(2)}`}
                    min="0"
                    max={order.payment.amount}
                    step="0.01"
                    className="w-full px-3 py-2 border border-blue-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Refund Reason (Stripe)
                  </label>
                  <select
                    value={refundReason}
                    onChange={(e) => setRefundReason(e.target.value)}
                    className="w-full px-3 py-2 border border-blue-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="requested_by_customer">Requested by Customer</option>
                    <option value="duplicate">Duplicate Payment</option>
                    <option value="fraudulent">Fraudulent</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Additional Details (Optional)
                  </label>
                  <textarea
                    value={customRefundReason}
                    onChange={(e) => setCustomRefundReason(e.target.value)}
                    placeholder="Additional details about the refund..."
                    className="w-full px-3 py-2 border border-blue-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    rows={3}
                  />
                </div>
                <div className="flex justify-end space-x-2">
                  <Button 
                    variant="outline" 
                    onClick={() => setShowRefundForm(false)}
                    disabled={isRefunding}
                  >
                    Cancel
                  </Button>
                  <Button 
                    variant="default" 
                    onClick={handleRefundOrder}
                    disabled={isRefunding}
                  >
                    {isRefunding ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Processing...
                      </>
                    ) : (
                      'Create Refund'
                    )}
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* Customer Info */}
          <div>
            <h3 className="text-lg font-medium mb-3 flex items-center">
              <Mail size={20} className="mr-2" />
              Customer Information
            </h3>
            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-600">Email</p>
                  <p className="font-medium">{order.customer.email}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Phone</p>
                  <p className="font-medium flex items-center">
                    <Phone size={16} className="mr-1" />
                    {order.customer.phoneNumber}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Order Date</p>
                  <p className="font-medium">
                    {new Date(order.createdAt).toLocaleString()}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Payment Method</p>
                  <p className="font-medium">{formatPaymentMethod(order.payment.method)}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Payment Status</p>
                  <div className="flex items-center space-x-2">
                    <PaymentStatusIcon size={16} />
                    <span className={`px-2 py-1 rounded-full text-sm font-medium ${paymentStatusColors[order.payment?.status || 'pending']}`}>
                      {formatPaymentStatus(order.payment?.status || 'pending')}
                    </span>
                  </div>
                </div>
                {order.payment?.method === 'stripe' && order.payment?.stripe?.paymentIntentId && (
                  <div>
                    <p className="text-sm text-gray-600">Stripe Payment Intent</p>
                    <p className="font-medium text-xs font-mono">{order.payment.stripe.paymentIntentId}</p>
                  </div>
                )}
                {order.payment?.method === 'stripe' && order.payment?.stripe?.refundId && (
                  <div>
                    <p className="text-sm text-gray-600">Refund ID</p>
                    <p className="font-medium text-xs font-mono">{order.payment.stripe.refundId}</p>
                    <p className="text-xs text-gray-500">
                      Amount: £{order.payment.stripe.refundAmount?.toFixed(2) || '0.00'}
                    </p>
                    {order.payment.stripe.refundReason && (
                      <p className="text-xs text-gray-500">
                        Reason: {order.payment.stripe.refundReason.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                      </p>
                    )}
                    {order.payment.stripe.customRefundReason && (
                      <p className="text-xs text-gray-500">
                        Details: {order.payment.stripe.customRefundReason}
                      </p>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Delivery Information */}
          <div>
            <h3 className="text-lg font-medium mb-3 flex items-center">
              <MapPin size={20} className="mr-2" />
              Delivery Information
            </h3>
            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-600">Type</p>
                  <p className="font-medium">{formatDeliveryType(order.delivery.type)}</p>
                </div>
                {order.delivery.type === 'delivery' && (
                  <>
                <div>
                  <p className="text-sm text-gray-600">Delivery Fee</p>
                  {order.pricing.deliveryFee === 0 ? (
                    <p className="font-medium text-green-600">FREE</p>
                  ) : (
                    <p className="font-medium">£{order.pricing.deliveryFee.toFixed(2)}</p>
                  )}
                </div>
                    <div className="col-span-2">
                      <p className="text-sm text-gray-600">Address</p>
                      <p className="font-medium">{order.delivery.address}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Postcode</p>
                      <p className="font-medium">{order.delivery.postcode}</p>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Items */}
          <div>
            <h3 className="text-lg font-medium mb-3">Order Items</h3>
            <div className="space-y-2">
              {order.items.map((item, index) => (
                <div key={index} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    {item.imageUrl && (
                      <img
                        src={item.imageUrl}
                        alt={item.name}
                        className="w-12 h-12 object-cover rounded-lg"
                      />
                    )}
                    <div>
                      <p className="font-medium">{item.name}</p>
                      <p className="text-sm text-gray-600">
                        £{item.price.toFixed(2)} × {item.quantity}
                      </p>
                    </div>
                  </div>
                  <p className="font-medium">£{(item.price * item.quantity).toFixed(2)}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Pricing Summary */}
          <div>
            <h3 className="text-lg font-medium mb-3">Order Summary</h3>
            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span>Subtotal:</span>
                  <span>£{order.pricing.subtotal.toFixed(2)}</span>
                </div>
                {order.delivery.type === 'delivery' && (
                  <div className="flex justify-between">
                    <span>Delivery Fee:</span>
                    {order.pricing.deliveryFee === 0 ? (
                      <span className="text-green-600 font-medium">FREE</span>
                    ) : (
                      <span>£{order.pricing.deliveryFee.toFixed(2)}</span>
                    )}
                  </div>
                )}
                <div className="flex justify-between font-bold text-lg border-t pt-2">
                  <span>Total:</span>
                  <span>£{order.pricing.total.toFixed(2)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Special Requests */}
          {order.specialRequests && (
            <div>
              <h3 className="text-lg font-medium mb-3">Special Requests</h3>
              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="whitespace-pre-wrap">{order.specialRequests}</p>
              </div>
            </div>
          )}

          {/* Status Update */}
          {order.status !== 'cancelled' && (
            <div>
              <h3 className="text-lg font-medium mb-3 flex items-center">
                <Edit size={20} className="mr-2" />
                Update Status
              </h3>
              <div className="flex items-center space-x-4">
                <select
                  value={newStatus}
                  onChange={(e) => setNewStatus(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                >
                  {getAvailableStatusOptions(order.delivery.type).map(option => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
                <Button 
                  onClick={handleStatusChange}
                  disabled={newStatus === order.status || isUpdatingStatus}
                >
                  {isUpdatingStatus ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Updating...
                    </>
                  ) : (
                    newStatus === order.status ? 'No Change' : 'Update Status'
                  )}
                </Button>
              </div>
            </div>
          )}

          {/* Show message for cancelled orders */}
          {order.status === 'cancelled' && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <h3 className="text-lg font-medium text-red-800 mb-2 flex items-center">
                <XCircle size={20} className="mr-2" />
                Order Cancelled
              </h3>
              <p className="text-red-600">
                This order has been cancelled and cannot be updated further.
              </p>
            </div>
          )}

          {/* Payment Status Update - Only for COD/COC orders */}
          {['cash_on_delivery', 'cash_on_collection'].includes(order.payment?.method) && (
            <div>
              <h3 className="text-lg font-medium mb-3 flex items-center">
                <CreditCard size={20} className="mr-2" />
                Update Payment Status
              </h3>
              <div className="flex items-center space-x-4">
                <select
                  value={newPaymentStatus}
                  onChange={(e) => setNewPaymentStatus(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                >
                  <option value="pending">Pending</option>
                  <option value="paid">Paid</option>
                  <option value="refunded">Refunded</option>
                </select>
                <Button 
                  onClick={handlePaymentStatusChange}
                  disabled={newPaymentStatus === (order.payment?.status || 'pending') || isUpdatingPayment}
                >
                  {isUpdatingPayment ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Updating...
                    </>
                  ) : (
                    newPaymentStatus === (order.payment?.status || 'pending') ? 'No Change' : 'Update Payment Status'
                  )}
                </Button>
              </div>
            </div>
          )}
        </div>

        <div className="flex justify-end space-x-3 mt-6 pt-4 border-t">
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
        </div>
      </div>
    </Modal>
  );
};

export default OrderViewModal;
