import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Button from '../components/ui/Button';
import { useBasket } from '../contexts/BasketContext';
import { orderService } from '../services/orderService';
import { stripeService } from '../services/stripeService';
import StripePaymentForm from '../components/payment/StripePaymentForm';
import { PAYMENT_METHODS } from '../config/stripe';
import { generateOrderId } from '../utils/orderUtils';
import PostcodeInput from '../components/ui/PostcodeInput';

const Checkout = () => {
  const navigate = useNavigate();
  const {
    cart,
    deliveryOption,
    specialRequests,
    postcode,
    deliveryInfo,
    addToCart,
    removeFromCart,
    clearCart,
    setDeliveryInfo,
    getCartTotal,
    getDeliveryFee,
    getFinalTotal
  } = useBasket();

  // Initialize form data from localStorage or default values
  const [email, setEmail] = useState(() => {
    return localStorage.getItem('checkout_email') || '';
  });
  const [deliveryAddress, setDeliveryAddress] = useState(() => {
    return localStorage.getItem('checkout_deliveryAddress') || '';
  });
  const [checkoutPostcode, setCheckoutPostcode] = useState(() => {
    return localStorage.getItem('checkout_postcode') || postcode || '';
  });
  const [phoneNumber, setPhoneNumber] = useState(() => {
    return localStorage.getItem('checkout_phoneNumber') || '';
  });
  const [currentStep, setCurrentStep] = useState(() => {
    return parseInt(localStorage.getItem('checkout_currentStep')) || 1;
  });
  const [completedSteps, setCompletedSteps] = useState(() => {
    const stored = localStorage.getItem('checkout_completedSteps');
    return stored ? new Set(JSON.parse(stored)) : new Set();
  });
  const [isPlacingOrder, setIsPlacingOrder] = useState(false);
  const [orderError, setOrderError] = useState(null);
  const [paymentMethod, setPaymentMethod] = useState(() => {
    return localStorage.getItem('checkout_paymentMethod') || PAYMENT_METHODS.CASH_ON_DELIVERY;
  });
  const [stripePaymentIntent, setStripePaymentIntent] = useState(null);
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const [generatedOrderId, setGeneratedOrderId] = useState(null);

  // Save form data to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('checkout_email', email);
  }, [email]);

  useEffect(() => {
    localStorage.setItem('checkout_deliveryAddress', deliveryAddress);
  }, [deliveryAddress]);

  useEffect(() => {
    localStorage.setItem('checkout_postcode', checkoutPostcode);
  }, [checkoutPostcode]);

  useEffect(() => {
    localStorage.setItem('checkout_phoneNumber', phoneNumber);
  }, [phoneNumber]);

  useEffect(() => {
    localStorage.setItem('checkout_currentStep', currentStep.toString());
  }, [currentStep]);

  useEffect(() => {
    localStorage.setItem('checkout_completedSteps', JSON.stringify([...completedSteps]));
  }, [completedSteps]);

  useEffect(() => {
    localStorage.setItem('checkout_paymentMethod', paymentMethod);
  }, [paymentMethod]);

  // Sync checkout postcode with basket postcode
  useEffect(() => {
    if (postcode && postcode !== checkoutPostcode) {
      setCheckoutPostcode(postcode);
    }
  }, [postcode]);

  const validateEmail = () => {
    if (!email.trim()) {
      alert('Please enter your email address');
      return false;
    }
    if (!email.includes('@')) {
      alert('Please enter a valid email address');
      return false;
    }
    return true;
  };

  const validateDelivery = () => {
    if (!phoneNumber.trim()) {
      alert('Please enter your phone number');
      return false;
    }
    if (deliveryOption === 'delivery') {
      if (!deliveryAddress.trim()) {
        alert('Please enter your delivery address');
        return false;
      }
      if (!checkoutPostcode.trim()) {
        alert('Please enter your postcode');
        return false;
      }
    }
    return true;
  };

  const handleContinue = () => {
    if (currentStep === 1) {
      if (validateEmail()) {
        setCompletedSteps(prev => new Set([...prev, 1]));
        setCurrentStep(2);
      }
    } else if (currentStep === 2) {
      if (validateDelivery()) {
        setCompletedSteps(prev => new Set([...prev, 2]));
        setCurrentStep(3);
      }
    }
  };

  const clearCheckoutData = () => {
    localStorage.removeItem('checkout_email');
    localStorage.removeItem('checkout_deliveryAddress');
    localStorage.removeItem('checkout_postcode');
    localStorage.removeItem('checkout_phoneNumber');
    localStorage.removeItem('checkout_currentStep');
    localStorage.removeItem('checkout_completedSteps');
    localStorage.removeItem('checkout_paymentMethod');
    localStorage.removeItem('lastCreatedOrderId');
  };

  const handlePlaceOrder = async () => {
    if (isPlacingOrder) return;
    
    setIsPlacingOrder(true);
    setOrderError(null);
    
    try {
      // Prepare order data
      const orderData = {
        customer: {
          email: email.trim(),
          phoneNumber: phoneNumber.trim()
        },
        delivery: {
          type: deliveryOption,
          address: deliveryOption === 'delivery' ? deliveryAddress.trim() : undefined,
          postcode: deliveryOption === 'delivery' ? checkoutPostcode.trim() : undefined
        },
        items: cart.map(item => ({
          itemId: item._id,
          quantity: item.quantity
        })),
        specialRequests: specialRequests?.trim() || null,
        paymentMethod: paymentMethod,
        deliveryFee: getDeliveryFee() // Send calculated delivery fee to backend
      };

      // For Stripe payments, create payment intent first
      if (paymentMethod === PAYMENT_METHODS.STRIPE) {
        // Generate order ID upfront to ensure consistency
        const orderId = generateOrderId();
        setGeneratedOrderId(orderId);
        
        // Create payment intent without creating order
        const paymentIntent = await stripeService.createPaymentIntent(orderData, getFinalTotal(), orderId);
        
        if (paymentIntent.success) {
          setStripePaymentIntent(paymentIntent.data);
          setIsPlacingOrder(false);
          return; // Don't redirect yet, wait for payment completion
        } else {
          throw new Error(paymentIntent.error || 'Failed to create payment intent');
        }
      }

      // For COD/COC orders, create order directly
      const response = await orderService.createOrder(orderData);
      
      if (response.success) {
        // Clear checkout data after successful order
        clearCheckoutData();
        
        // Clear the basket
        clearCart();
        
        // Redirect to order confirmation page
        navigate(`/order-confirmation?orderId=${response.data.orderId}`);
      } else {
        throw new Error(response.message || 'Failed to place order');
      }
    } catch (error) {
      console.error('Error placing order:', error);
      setOrderError(error.message || 'Failed to place order. Please try again.');
    } finally {
      setIsPlacingOrder(false);
    }
  };

  // Handle Stripe payment success
  const handleStripePaymentSuccess = async (paymentIntent) => {
    setIsProcessingPayment(true);
    try {
      console.log('Payment succeeded, payment intent:', paymentIntent);
      
      // For successful payments, create order with payment
      if (paymentIntent.status === 'succeeded') {
        // Prepare order data
        const orderData = {
          customer: {
            email: email.trim(),
            phoneNumber: phoneNumber.trim()
          },
          delivery: {
            type: deliveryOption,
            address: deliveryOption === 'delivery' ? deliveryAddress.trim() : undefined,
            postcode: deliveryOption === 'delivery' ? checkoutPostcode.trim() : undefined
          },
          items: cart.map(item => ({
            itemId: item._id,
            quantity: item.quantity
          })),
          specialRequests: specialRequests?.trim() || null,
          paymentMethod: PAYMENT_METHODS.STRIPE,
          deliveryFee: getDeliveryFee() // Send calculated delivery fee to backend
        };

        // Create order with successful payment using the pre-generated order ID
        const response = await orderService.createOrderWithPayment(
          orderData,
          paymentIntent.id,
          paymentIntent,
          generatedOrderId
        );
        
        if (response.success) {
          // Clear checkout data after successful order creation
          clearCheckoutData();
          
          // Clear the basket
          clearCart();
          
          // Redirect to order confirmation page
          navigate(`/order-confirmation?orderId=${response.data.orderId}&paymentIntent=${paymentIntent.id}`);
        } else {
          throw new Error(response.message || 'Failed to create order with payment');
        }
      } else {
        throw new Error(`Payment not completed. Status: ${paymentIntent.status}`);
      }
    } catch (error) {
      console.error('Error processing payment success:', error);
      setOrderError(error.message || 'Payment processing failed. Please contact support.');
    } finally {
      setIsProcessingPayment(false);
    }
  };

  // Handle Stripe payment error
  const handleStripePaymentError = (error) => {
    console.error('Stripe payment error:', error);
    setOrderError(error.message || 'Payment failed. Please try again.');
    setIsProcessingPayment(false);
  };

  // Show empty cart state
  if (cart.length === 0) {
    return (
      <div className="min-h-screen bg-light-grey">
        <div className="bg-white border-b border-gray-200">
          <div className="max-w-4xl mx-auto px-4 py-4 flex items-center">
            <button
              onClick={() => navigate(-1)}
              className="mr-4 p-2 hover:bg-gray-100 rounded-full"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <h1 className="text-xl font-bold text-charcoal">Checkout</h1>
          </div>
        </div>
        
        <div className="max-w-4xl mx-auto px-4 py-16">
          <div className="text-center">
            <h1 className="text-2xl font-bold mb-4">Your cart is empty</h1>
            <p className="text-gray-600 mb-6">Add some items to your cart to proceed with checkout</p>
            <Button 
              onClick={() => navigate('/menu')} 
              variant="black"
              size="large"
            >
              Continue Shopping
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-light-grey">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center">
          <button
            onClick={() => navigate(-1)}
            className="mr-4 p-2 hover:bg-gray-100 rounded-full"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <h1 className="text-xl font-bold text-charcoal">TGIF DABBA</h1>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-6xl mx-auto px-4 py-8 pb-24 lg:pb-8">
        <div className="grid lg:grid-cols-2 gap-8">
          {/* Left Column - Main Form */}
          <div className="space-y-6">
            {/* Email Section */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h2 className="text-2xl font-bold text-charcoal mb-4">Your Email</h2>
              <div className="space-y-4">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email address"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-orange focus:border-transparent text-lg"
                />
                <p className="text-sm text-gray-600">
                  You'll receive receipts and notifications at this email.
                </p>
                {!completedSteps.has(1) && (
                  <Button
                    onClick={handleContinue}
                    variant="black"
                    size="large"
                    className="w-full"
                  >
                    Continue
                  </Button>
                )}
              </div>
            </div>

            {/* Accordion Sections */}
            <div className="space-y-4">
              {/* Delivery Section */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                <div className={`w-full px-6 py-4 text-left transition-colors ${
                  currentStep >= 2 ? 'bg-gray-50' : 'bg-gray-100 opacity-50'
                }`}>
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-bold text-charcoal">Delivery</h3>
                    <svg
                      className={`w-5 h-5 transition-transform ${currentStep >= 2 ? 'rotate-180' : ''}`}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                </div>
                {currentStep >= 2 && (
                  <div className="px-6 py-4 border-t border-gray-200">
                    <div className="space-y-4">
                      {deliveryOption === 'delivery' && (
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Delivery Address
                          </label>
                          <textarea
                            value={deliveryAddress}
                            onChange={(e) => setDeliveryAddress(e.target.value)}
                            placeholder="Enter your delivery address"
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-orange focus:border-transparent"
                            rows="3"
                          />
                          {!postcode && (
                            <div className="mt-2 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                              <p className="text-sm text-yellow-700">
                                <strong>⚠️ Please enter your postcode in the basket to check delivery availability and pricing.</strong>
                              </p>
                            </div>
                          )}
                        </div>
                      )}
                      
                      {deliveryOption === 'delivery' && (
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Postcode
                            </label>
                            <PostcodeInput
                              value={checkoutPostcode}
                              onChange={(value) => {
                                setCheckoutPostcode(value);
                                setPostcode(value); // Sync with basket
                              }}
                              onSelect={(suggestion) => {
                                // Save the selected address in basket store
                                setCheckoutPostcode(suggestion.postcode);
                                setPostcode(suggestion.postcode); // Sync with basket
                                setDeliveryInfo({
                                  postcode: suggestion.postcode,
                                  address: suggestion.address,
                                  coordinates: { lat: suggestion.lat, lon: suggestion.lon },
                                  displayName: suggestion.displayName
                                });
                              }}
                              placeholder="BR6 0AB"
                              className="w-full"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Phone Number
                            </label>
                            <input
                              type="tel"
                              value={phoneNumber}
                              onChange={(e) => setPhoneNumber(e.target.value)}
                              placeholder="07123 456789"
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-orange focus:border-transparent"
                            />
                          </div>
                        </div>
                      )}
                      
                      {deliveryOption === 'collection' && (
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Phone Number
                          </label>
                          <input
                            type="tel"
                            value={phoneNumber}
                            onChange={(e) => setPhoneNumber(e.target.value)}
                            placeholder="07123 456789"
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-orange focus:border-transparent"
                          />
                        </div>
                      )}
                      {specialRequests && (
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Special Requests
                          </label>
                          <p className="text-sm text-gray-600 bg-gray-50 p-3 rounded-lg">
                            {specialRequests}
                          </p>
                        </div>
                      )}
                      
                      {!completedSteps.has(2) && (
                        <Button
                          onClick={handleContinue}
                          variant="black"
                          size="large"
                          className="w-full mt-4"
                        >
                          Continue
                        </Button>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Payment Section */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                <div className={`w-full px-6 py-4 text-left transition-colors ${
                  currentStep >= 3 ? 'bg-gray-50' : 'bg-gray-100 opacity-50'
                }`}>
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-bold text-charcoal">Payment</h3>
                    <svg
                      className={`w-5 h-5 transition-transform ${currentStep >= 3 ? 'rotate-180' : ''}`}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                </div>
                {currentStep >= 3 && (
                  <div className="px-6 py-4 border-t border-gray-200">
                    <div className="space-y-4">
                      {/* Payment Options */}
                      <div className="space-y-3">
                        <label className="block text-sm font-medium text-gray-700 mb-3">
                          Select Payment Method
                        </label>
                        
                        {/* Cash on Delivery/Collection Option */}
                        <label className="flex items-center p-4 border border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors">
                          <input
                            type="radio"
                            name="paymentMethod"
                            value={deliveryOption === 'delivery' ? PAYMENT_METHODS.CASH_ON_DELIVERY : PAYMENT_METHODS.CASH_ON_COLLECTION}
                            checked={paymentMethod === PAYMENT_METHODS.CASH_ON_DELIVERY || paymentMethod === PAYMENT_METHODS.CASH_ON_COLLECTION}
                            onChange={(e) => setPaymentMethod(e.target.value)}
                            className="w-4 h-4 text-primary-orange focus:ring-primary-orange border-gray-300"
                          />
                          <div className="ml-3 flex-1">
                            <div className="flex items-center justify-between">
                              <span className="text-sm font-medium text-gray-900">
                                {deliveryOption === 'delivery' ? 'Cash on Delivery' : 'Cash Upon Collection'}
                              </span>
                              <span className="text-xs text-gray-500">
                                {deliveryOption === 'delivery' 
                                  ? 'Pay when your order arrives' 
                                  : 'Pay when you collect your order'
                                }
                              </span>
                            </div>
                          </div>
                        </label>
                        
                        {/* Stripe Card Payment Option */}
                        <label className="flex items-center p-4 border border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors">
                          <input
                            type="radio"
                            name="paymentMethod"
                            value={PAYMENT_METHODS.STRIPE}
                            checked={paymentMethod === PAYMENT_METHODS.STRIPE}
                            onChange={(e) => setPaymentMethod(e.target.value)}
                            className="w-4 h-4 text-primary-orange focus:ring-primary-orange border-gray-300"
                          />
                          <div className="ml-3 flex-1">
                            <div className="flex items-center justify-between">
                              <span className="text-sm font-medium text-gray-900">
                                Card Payment
                              </span>
                              <span className="text-xs text-green-600 font-medium">
                                Secure Payment
                              </span>
                            </div>
                          </div>
                        </label>
                      </div>
                      
                      {/* Payment Method Details */}
                      <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                        <div className="flex items-center gap-2 mb-2">
                          <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          <span className="text-sm font-medium text-gray-700">Payment Information</span>
                        </div>
                        <p className="text-sm text-gray-600">
                          {paymentMethod === PAYMENT_METHODS.STRIPE 
                            ? 'Card Payment: Pay securely with your credit or debit card. Your payment information is encrypted and secure.'
                            : deliveryOption === 'delivery' 
                              ? 'Cash on Delivery: Pay with cash when your order is delivered. Please have the exact amount ready.'
                              : 'Cash Upon Collection: Pay with cash when you collect your order from our location. Please have the exact amount ready.'
                          }
                        </p>
                      </div>
                      
                      {/* Order Button or Stripe Payment Form */}
                      <div className="mt-6 pt-4 border-t border-gray-200">
                        {/* Error Message */}
                        {orderError && (
                          <div className="mb-4 p-3 bg-red-100 border border-red-300 rounded-lg">
                            <p className="text-sm text-red-600">{orderError}</p>
                          </div>
                        )}

                        {paymentMethod === PAYMENT_METHODS.STRIPE ? (
                          // Stripe Payment Form - Show immediately when card payment is selected
                          <div>
                            <p className="text-sm text-gray-600 mb-4 text-center">
                              Enter your card details to complete the payment.
                            </p>
                            <StripePaymentForm
                              clientSecret={stripePaymentIntent?.clientSecret}
                              onPaymentSuccess={handleStripePaymentSuccess}
                              onPaymentError={handleStripePaymentError}
                              isLoading={isProcessingPayment}
                              disabled={isProcessingPayment}
                              onPaymentIntentNeeded={handlePlaceOrder}
                            />
                          </div>
                        ) : (
                          // COD/COC Order Button
                          <div className="text-center">
                            <p className="text-sm text-gray-600 mb-4">
                              Please review your order details before placing your order.
                            </p>
                            
                            <Button
                              onClick={handlePlaceOrder}
                              variant="black"
                              size="large"
                              className="w-full"
                              disabled={isPlacingOrder}
                            >
                              {isPlacingOrder ? (
                                <div className="flex items-center justify-center gap-2">
                                  <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                  </svg>
                                  Placing Order...
                                </div>
                              ) : (
                                `Place Order - £${getFinalTotal().toFixed(2)}`
                              )}
                            </Button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>

            </div>
          </div>

          {/* Right Column - Order Summary */}
          <div className="lg:sticky lg:top-24 lg:h-fit">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h2 className="text-xl font-bold text-charcoal mb-6">Order Summary</h2>
              
              {/* Cart Items */}
              <div className="space-y-4 mb-6">
                {cart.map((item) => (
                  <div key={item._id} className="flex items-start gap-3 pb-4 border-b border-gray-200 last:border-b-0">
                    {/* Product Image */}
                    <div className="flex-shrink-0">
                      {item.imageUrl || item.image ? (
                        <img
                          src={item.imageUrl || item.image}
                          alt={item.name}
                          className="w-16 h-16 object-cover rounded-lg"
                          onError={(e) => {
                            e.target.style.display = 'none';
                            e.target.nextSibling.style.display = 'flex';
                          }}
                        />
                      ) : null}
                      <div 
                        className="w-16 h-16 bg-gray-200 rounded-lg flex items-center justify-center text-center text-xs font-medium text-gray-600"
                        style={{ display: item.imageUrl || item.image ? 'none' : 'flex' }}
                      >
                        {item.name.charAt(0)}
                      </div>
                    </div>
                    
                    {/* Product Details */}
                    <div className="flex-1 min-w-0">
                      <h3 className="font-medium text-gray-900 text-sm">{item.name}</h3>
                      <p className="text-xs text-gray-500 mt-1">
                        {deliveryOption === 'delivery' ? 'Delivery' : 'Collection'}
                      </p>
                      
                      {/* Quantity Controls */}
                      <div className="flex items-center justify-between mt-2">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => removeFromCart(item._id)}
                            className="w-6 h-6 bg-gray-200 text-gray-600 rounded-full flex items-center justify-center text-sm font-bold hover:bg-gray-300 transition-colors"
                          >
                            -
                          </button>
                          <span className="text-sm font-medium w-8 text-center">
                            {item.quantity}
                          </span>
                          <button
                            onClick={() => addToCart(item)}
                            className="w-6 h-6 bg-gray-200 text-gray-600 rounded-full flex items-center justify-center text-sm font-bold hover:bg-gray-300 transition-colors"
                          >
                            +
                          </button>
                        </div>
                        <span className="text-sm font-bold">£{(item.price * item.quantity).toFixed(2)}</span>
                      </div>
                      
                      {/* Remove Link */}
                      <button
                        onClick={() => removeFromCart(item._id)}
                        className="text-xs text-gray-500 underline hover:text-gray-700 mt-1"
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Order Totals */}
              <div className="space-y-2 mb-6">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Subtotal</span>
                  <span>£{getCartTotal().toFixed(2)}</span>
                </div>
                {getDeliveryFee() > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Delivery</span>
                    <span>£{getDeliveryFee().toFixed(2)}</span>
                  </div>
                )}
                {getDeliveryFee() === 0 && deliveryOption === 'delivery' && (
                  <div className="flex justify-between text-sm">
                    <span className="text-green-600 font-medium">Delivery</span>
                    <span className="text-green-600 font-medium">FREE</span>
                  </div>
                )}
                <div className="border-t border-gray-200 pt-2">
                  <div className="flex justify-between font-bold">
                    <span>Total</span>
                    <span>£{getFinalTotal().toFixed(2)}</span>
                  </div>
                </div>
              </div>

              {/* Delivery Information */}
              {deliveryOption === 'delivery' && deliveryInfo && (
                <div className="mb-6 p-4 bg-gray-50 rounded-lg">
                  <h3 className="text-sm font-bold text-gray-700 mb-2">Delivery Information</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center gap-2">
                      <span className="text-gray-600">Postcode:</span>
                      <span className="font-medium">{postcode}</span>
                    </div>
                    {deliveryInfo.address && (
                      <div className="flex items-start gap-2">
                        <span className="text-gray-600">Address:</span>
                        <span className="font-medium text-xs">{deliveryInfo.address}</span>
                      </div>
                    )}
                    {deliveryInfo.distance && (
                      <div className="flex items-center gap-2">
                        <span className="text-gray-600">Distance:</span>
                        <span className="font-medium">{deliveryInfo.distance.toFixed(1)} miles</span>
                      </div>
                    )}
                    <div className="pt-2 border-t border-gray-200">
                      <div className={`flex items-center gap-2 ${deliveryInfo.inDeliveryRange || getCartTotal() >= 30 ? 'text-green-600' : 'text-orange-600'}`}>
                        <span className="font-bold">
                          {deliveryInfo.inDeliveryRange 
                            ? '✓ FREE delivery (within 3.5 miles)'
                            : getCartTotal() >= 30 
                              ? '✓ FREE delivery (order £30+)'
                              : '£2 delivery fee (outside 3.5 miles, under £30)'
                          }
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* SSL Badge */}
              <div className="border-t border-gray-200 pt-4">
                <div className="flex items-center justify-center gap-2 text-xs text-gray-500">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                  <span>Secure SSL Checkout</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Sticky Footer */}
      {cart.length > 0 && (
        <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-4 z-20">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total</p>
              <p className="text-lg font-bold text-charcoal">£{getFinalTotal().toFixed(2)}</p>
            </div>
            <div className="flex items-center gap-2">
              <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
              <span className="text-xs text-gray-600 font-medium">SECURE SSL CHECKOUT</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Checkout;
