import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import Button from '../components/ui/Button';
import { orderService, getStatusInfo } from '../services/orderService';

const OrderConfirmation = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const orderId = searchParams.get('orderId');

  useEffect(() => {
    if (orderId) {
      fetchOrderDetails();
    } else {
      setError('No order ID provided');
      setLoading(false);
    }
  }, [orderId]);

  const fetchOrderDetails = async () => {
    try {
      const response = await orderService.getOrderById(orderId);
      if (response.success) {
        setOrder(response.data);
      } else {
        setError(response.message || 'Failed to fetch order details');
      }
    } catch (err) {
      setError(err.message || 'Failed to fetch order details');
    } finally {
      setLoading(false);
    }
  };

  const getEstimatedTime = () => {
    if (order?.estimatedDeliveryTime) {
      return new Date(order.estimatedDeliveryTime);
    }
    
    // Default estimation
    const now = new Date();
    const estimatedMinutes = order?.delivery?.type === 'delivery' ? 45 : 30;
    return new Date(now.getTime() + estimatedMinutes * 60 * 1000);
  };

  const formatTime = (date) => {
    return date.toLocaleTimeString('en-GB', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-light-grey flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-orange mx-auto mb-4"></div>
          <p className="text-gray-600">Loading order details...</p>
        </div>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="min-h-screen bg-light-grey">
        <div className="max-w-4xl mx-auto px-4 py-16">
          <div className="text-center">
            <div className="mb-6">
              <svg className="w-16 h-16 text-red-500 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-charcoal mb-4">Order Not Found</h1>
            <p className="text-gray-600 mb-6">{error || 'The order you are looking for could not be found.'}</p>
            <Button onClick={() => navigate('/')} variant="black" size="large">
              Back to Home
            </Button>
          </div>
        </div>
      </div>
    );
  }

  const statusInfo = getStatusInfo(order.status);
  const estimatedTime = getEstimatedTime();

  return (
    <div className="min-h-screen bg-light-grey">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center">
          <button
            onClick={() => navigate('/')}
            className="mr-4 p-2 hover:bg-gray-100 rounded-full"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <h1 className="text-xl font-bold text-charcoal">Order Confirmation</h1>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Success Message */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <div className="text-center">
            <div className="mb-4">
              <svg className="w-16 h-16 text-green-500 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-charcoal mb-2">Order Placed Successfully!</h1>
            <p className="text-gray-600 mb-4">Thank you for your order. We'll send you a confirmation email shortly.</p>
            
            {/* Order ID */}
            <div className="bg-gray-50 rounded-lg p-4 mb-4">
              <p className="text-sm text-gray-600 mb-1">Order ID</p>
              <p className="text-lg font-bold text-charcoal font-mono">{order.orderId}</p>
            </div>

            {/* Status */}
            <div className="flex items-center justify-center gap-2 mb-4">
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${statusInfo.bgColor} ${statusInfo.color}`}>
                {statusInfo.label}
              </span>
            </div>
            <p className="text-sm text-gray-600">{statusInfo.description}</p>
          </div>
        </div>

        <div className="grid lg:grid-cols-2 gap-6">
          {/* Order Details */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-xl font-bold text-charcoal mb-4">Order Details</h2>
            
            <div className="space-y-4">
              {/* Customer Info */}
              <div>
                <h3 className="font-medium text-gray-900 mb-2">Customer Information</h3>
                <div className="text-sm text-gray-600 space-y-1">
                  <p><span className="font-medium">Email:</span> {order.customer.email}</p>
                  <p><span className="font-medium">Phone:</span> {order.customer.phoneNumber}</p>
                </div>
              </div>

              {/* Delivery Info */}
              <div>
                <h3 className="font-medium text-gray-900 mb-2">
                  {order.delivery.type === 'delivery' ? 'Delivery Information' : 'Collection Information'}
                </h3>
                <div className="text-sm text-gray-600 space-y-1">
                  <p><span className="font-medium">Type:</span> {order.delivery.type === 'delivery' ? 'Delivery' : 'Collection'}</p>
                  {order.delivery.address && (
                    <p><span className="font-medium">Address:</span> {order.delivery.address}</p>
                  )}
                  {order.delivery.postcode && (
                    <p><span className="font-medium">Postcode:</span> {order.delivery.postcode}</p>
                  )}
                </div>
              </div>

              {/* Payment Info */}
              <div>
                <h3 className="font-medium text-gray-900 mb-2">Payment Information</h3>
                <div className="text-sm text-gray-600 space-y-1">
                  <p><span className="font-medium">Method:</span> {
                    order.payment.method === 'cash_on_delivery' ? 'Cash on Delivery' : 
                    order.payment.method === 'cash_on_collection' ? 'Cash on Collection' : 
                    order.payment.method === 'stripe' ? 'Card Payment' : 
                    order.payment.method
                  }</p>
                  <p><span className="font-medium">Amount:</span> £{order.payment.amount.toFixed(2)}</p>
                  <p><span className="font-medium">Status:</span> {
                    order.payment.status === 'paid' ? 'Paid' :
                    order.payment.status === 'pending' ? 'Pending' :
                    order.payment.status === 'failed' ? 'Failed' :
                    order.payment.status === 'refunded' ? 'Refunded' :
                    order.payment.status
                  }</p>
                  {order.payment.stripe?.paymentIntentId && (
                    <p><span className="font-medium">Payment ID:</span> {order.payment.stripe.paymentIntentId}</p>
                  )}
                </div>
              </div>

              {/* Special Requests */}
              {order.specialRequests && (
                <div>
                  <h3 className="font-medium text-gray-900 mb-2">Special Requests</h3>
                  <p className="text-sm text-gray-600 bg-gray-50 p-3 rounded-lg">
                    {order.specialRequests}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Order Items & Timing */}
          <div className="space-y-6">
            {/* Order Items */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h2 className="text-xl font-bold text-charcoal mb-4">Order Items</h2>
              
              <div className="space-y-3">
                {order.items.map((item, index) => (
                  <div key={index} className="flex items-center gap-3 pb-3 border-b border-gray-200 last:border-b-0">
                    <div className="flex-shrink-0">
                      {item.imageUrl ? (
                        <img
                          src={item.imageUrl}
                          alt={item.name}
                          className="w-12 h-12 object-cover rounded-lg"
                        />
                      ) : (
                        <div className="w-12 h-12 bg-gray-200 rounded-lg flex items-center justify-center text-xs font-medium text-gray-600">
                          {item.name.charAt(0)}
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-medium text-gray-900 text-sm">{item.name}</h3>
                      <p className="text-xs text-gray-500">Qty: {item.quantity}</p>
                    </div>
                    <span className="text-sm font-bold">£{(item.price * item.quantity).toFixed(2)}</span>
                  </div>
                ))}
              </div>

              {/* Order Total */}
              <div className="mt-4 pt-4 border-t border-gray-200">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Subtotal</span>
                    <span>£{order.pricing.subtotal.toFixed(2)}</span>
                  </div>
                  {order.pricing.deliveryFee > 0 && (
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Delivery</span>
                      <span>£{order.pricing.deliveryFee.toFixed(2)}</span>
                    </div>
                  )}
                  <div className="flex justify-between font-bold text-lg">
                    <span>Total</span>
                    <span>£{order.pricing.total.toFixed(2)}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Estimated Time */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h2 className="text-xl font-bold text-charcoal mb-4">
                {order.delivery.type === 'delivery' ? 'Estimated Delivery Time' : 'Estimated Collection Time'}
              </h2>
              
              <div className="text-center">
                <div className="text-3xl font-bold text-primary-orange mb-2">
                  {formatTime(estimatedTime)}
                </div>
                <p className="text-sm text-gray-600">
                  {order.delivery.type === 'delivery' 
                    ? 'We\'ll deliver your order to your address' 
                    : 'Your order will be ready for collection'
                  }
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="mt-8 text-center">
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button
              onClick={() => navigate('/menu')}
              variant="outline"
              size="large"
            >
              Order Again
            </Button>
            <Button
              onClick={() => navigate('/')}
              variant="black"
              size="large"
            >
              Back to Home
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrderConfirmation;
