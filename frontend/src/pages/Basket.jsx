import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Button from '../components/ui/Button';
import { useBasket } from '../contexts/BasketContext';
import { validatePostalCode, getDeliveryAreaInfo } from '../services/geocodingService';
import { TIME_CONFIG, getMenuDay, isOrderingDisabled } from '../config/timeConfig';

const Basket = () => {
  const navigate = useNavigate();
  const {
    cart,
    deliveryOption,
    specialRequests,
    currentMenuDay,
    addToCart,
    removeFromCart,
    setDeliveryOption,
    setSpecialRequests,
    getCartTotal,
    getTotalItems,
    getItemQuantity,
    getDeliveryFee,
    getFinalTotal,
    validateCartForMenuDay,
    clearCartIfDifferentDay
  } = useBasket();

  const [postalCode, setPostalCode] = useState('');
  const [deliveryCheck, setDeliveryCheck] = useState(null);
  const [isCheckingDelivery, setIsCheckingDelivery] = useState(false);
  const [deliveryInfo, setDeliveryInfo] = useState(null);
  const [isOrderingAllowed, setIsOrderingAllowed] = useState(true);
  const [orderingStatusMessage, setOrderingStatusMessage] = useState('');
  const [showCartClearedModal, setShowCartClearedModal] = useState(false);

  // Check if ordering is currently disabled using global config
  const checkOrderingStatus = () => {
    const { disabled, message } = isOrderingDisabled();
    setIsOrderingAllowed(!disabled);
    setOrderingStatusMessage(message);
  };

  // Check cart validation on component mount
  useEffect(() => {
    checkOrderingStatus();
    
    // Get current menu day using global utility
    const currentDay = getMenuDay();
    
    // Validate cart against current menu day
    if (!validateCartForMenuDay(currentDay)) {
      // Cart contains items from different day, clear it
      clearCartIfDifferentDay(currentDay);
      setShowCartClearedModal(true);
    }
  }, [validateCartForMenuDay, clearCartIfDifferentDay]);

  // Collection address (dummy data)
  const collectionAddress = "123 High Street, Orpington, BR6 0AB";
  
  // Get delivery area info
  const deliveryAreaInfo = getDeliveryAreaInfo();

  // Handle postal code check using geocoding API
  const checkDelivery = async () => {
    if (!postalCode.trim()) {
      alert('Please enter a postal code');
      return;
    }

    setIsCheckingDelivery(true);
    setDeliveryCheck(null);
    setDeliveryInfo(null);

    try {
      const result = await validatePostalCode(postalCode);
      
      setDeliveryCheck(result.inDeliveryRange);
      setDeliveryInfo(result);
      
      // Show success/error message
      if (result.inDeliveryRange) {
        console.log('✅ Delivery available:', result);
      } else {
        console.log('❌ Delivery not available:', result);
      }
    } catch (error) {
      console.error('Error checking delivery:', error);
      setDeliveryCheck(false);
      setDeliveryInfo({
        success: false,
        message: 'Error checking delivery availability. Please try again.',
        inDeliveryRange: false
      });
    } finally {
      setIsCheckingDelivery(false);
    }
  };

  // Show empty cart state
  if (cart.length === 0) {
    return (
      <div className="min-h-screen bg-white text-black pt-20 sm:pt-24">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 sm:py-16">
          <div className="text-center">
            <h1 className="text-2xl sm:text-4xl font-bold mb-4">Your Basket</h1>
            <p className="text-lg sm:text-xl text-gray-600 mb-6 sm:mb-8">Your basket is empty</p>
            <Button 
              onClick={() => window.history.back()} 
              variant="primary"
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
    <div className="min-h-screen bg-white text-black pt-20 sm:pt-24">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 sm:py-16">
        {/* Header */}
        <div className="text-center mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-4xl md:text-5xl font-bold uppercase tracking-tight mb-3 sm:mb-4">
            Your Basket
          </h1>
          <p className="text-base sm:text-lg text-gray-600">
            Review your order and proceed to checkout
          </p>
          
          {/* Ordering Status Message */}
          {!isOrderingAllowed && (
            <div className="bg-red-500/20 border-2 border-red-500 rounded-lg p-4 mt-4 max-w-2xl mx-auto">
              <div className="text-center">
                <p className="text-red-700 font-bold text-lg mb-2">🚫 Ordering Temporarily Disabled</p>
                <p className="text-red-600 text-sm">{orderingStatusMessage}</p>
                <p className="text-red-600 text-xs mt-2 italic">
                  Orders for today will be taken and delivered until 12:00 PM
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Delivery Options - Mobile Responsive */}
        <div className="bg-gray-50 rounded-lg p-4 mb-6">
          <h2 className="text-lg font-bold mb-4">Delivery Options</h2>
          
          <div className="space-y-3">
            <div className="flex bg-white rounded-lg p-1 w-full max-w-sm mx-auto">
              <button
                onClick={() => setDeliveryOption('delivery')}
                className={`flex-1 py-2 px-2 sm:px-4 rounded-lg text-xs sm:text-sm font-medium transition-all ${
                  deliveryOption === 'delivery'
                    ? 'bg-black text-white'
                    : 'text-black hover:bg-gray-100'
                }`}
              >
                <span className="hidden sm:inline">🚚 </span>Delivery
              </button>
              <button
                onClick={() => setDeliveryOption('collection')}
                className={`flex-1 py-2 px-2 sm:px-4 rounded-lg text-xs sm:text-sm font-medium transition-all ${
                  deliveryOption === 'collection'
                    ? 'bg-black text-white'
                    : 'text-black hover:bg-gray-100'
                }`}
              >
                <span className="hidden sm:inline">🏪 </span>Collection
              </button>
            </div>

            {/* Delivery Information */}
            {deliveryOption === 'delivery' && (
              <div className="bg-white rounded-lg p-4 sm:p-6 border">
                <h3 className="text-lg sm:text-xl font-bold mb-4">Delivery Information</h3>
                
                <div className="space-y-4">
                  <div>
                    <p className="text-sm font-medium text-gray-600 mb-2">Our Delivery Areas</p>
                    <p className="text-sm sm:text-lg font-bold break-words">{deliveryAreaInfo.areas.join(', ')}, {deliveryAreaInfo.location}</p>
                  </div>
                  
                  <div>
                    <p className="text-sm font-medium text-gray-600 mb-2">Free Delivery Info</p>
                    <p className="text-sm sm:text-lg font-bold">£{deliveryAreaInfo.minimumOrder} minimum order within 3 miles</p>
                  </div>
                  
                  <div>
                    <p className="text-sm font-medium text-gray-600 mb-2">Check if we deliver to you</p>
                    <div className="flex flex-col sm:flex-row gap-2">
                      <input
                        type="text"
                        value={postalCode}
                        onChange={(e) => setPostalCode(e.target.value)}
                        placeholder="Enter your postal code"
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent text-sm"
                      />
                      <Button
                        onClick={checkDelivery}
                        variant="black"
                        size="small"
                        disabled={isCheckingDelivery}
                        className="w-full sm:w-auto"
                      >
                        {isCheckingDelivery ? 'Checking...' : 'Check'}
                      </Button>
                    </div>
                    
                    {isCheckingDelivery && (
                      <div className="flex items-center gap-2 mt-2">
                        <div className="w-4 h-4 border-2 border-gray-300 border-t-black rounded-full animate-spin"></div>
                        <p className="text-gray-600 text-sm">Checking delivery availability...</p>
                      </div>
                    )}
                    
                    {!isCheckingDelivery && deliveryCheck === true && deliveryInfo && (
                      <div className="mt-2">
                        <p className="text-green-600 font-medium">✓ {deliveryInfo.message}</p>
                        {deliveryInfo.areaCode && (
                          <p className="text-sm text-gray-600 mt-1">
                            Area: {deliveryInfo.areaCode}
                          </p>
                        )}
                        {deliveryInfo.address && (
                          <p className="text-sm text-gray-600 mt-1">
                            {deliveryInfo.address}
                          </p>
                        )}
                      </div>
                    )}
                    
                    {!isCheckingDelivery && deliveryCheck === false && deliveryInfo && (
                      <div className="mt-2">
                        <p className="text-red-600 font-medium">✗ {deliveryInfo.message}</p>
                        {deliveryInfo.address && (
                          <p className="text-sm text-gray-600 mt-1">
                            Location: {deliveryInfo.address}
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                  
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                    <p className="text-sm text-gray-700">
                      <strong>Delivery Times:</strong> 45-60 minutes<br/>
                      <strong>Time Slots:</strong> 11:00 AM - 1:00 PM, 6:00 PM - 8:00 PM
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Collection Information */}
            {deliveryOption === 'collection' && (
              <div className="bg-white rounded-lg p-4 sm:p-6 border">
                <h3 className="text-lg sm:text-xl font-bold mb-4">Collection Information</h3>
                
                <div className="space-y-4">
                  <div>
                    <p className="text-sm font-medium text-gray-600 mb-2">Collection Address</p>
                    <p className="text-sm sm:text-lg font-bold break-words">{collectionAddress}</p>
                  </div>
                  
                  <div>
                    <p className="text-sm font-medium text-gray-600 mb-2">Collection Time</p>
                    <p className="text-sm sm:text-lg font-bold">ASAP (15-20 minutes)</p>
                  </div>
                  
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                    <p className="text-sm text-gray-700">
                      <strong>Collection Hours:</strong> 11:00 AM - 1:00 PM, 6:00 PM - 8:00 PM<br/>
                      <strong>No delivery fee for collection orders!</strong>
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Vertical Layout - Single Column */}
        <div className="max-w-4xl mx-auto space-y-6">
          {/* Cart Items - Mobile Responsive */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h2 className="text-lg font-bold mb-4">Order Items</h2>
            
            {/* Desktop Table View */}
            <div className="hidden sm:block bg-white rounded-lg border overflow-hidden">
              <table className="w-full">
                <thead className="bg-gray-100">
                  <tr>
                    <th className="text-left py-2 px-3 text-sm font-medium text-gray-700">Item</th>
                    <th className="text-center py-2 px-3 text-sm font-medium text-gray-700">Price</th>
                    <th className="text-center py-2 px-3 text-sm font-medium text-gray-700">Qty</th>
                    <th className="text-right py-2 px-3 text-sm font-medium text-gray-700">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {cart.map((item, index) => (
                    <tr key={item._id} className={index !== cart.length - 1 ? 'border-b border-gray-200' : ''}>
                      <td className="py-3 px-3">
                        <div className="flex items-center gap-2">
                          {item.imageUrl || item.image ? (
                            <img
                              src={item.imageUrl || item.image}
                              alt={item.name}
                              className="w-8 h-8 object-cover rounded"
                              onError={(e) => {
                                e.target.style.display = 'none';
                                e.target.nextSibling.style.display = 'flex';
                              }}
                            />
                          ) : null}
                          <div 
                            className="w-8 h-8 bg-gray-200 rounded flex items-center justify-center text-center text-xs font-medium text-gray-600"
                            style={{ display: item.imageUrl || item.image ? 'none' : 'flex' }}
                          >
                            {item.name.charAt(0)}
                          </div>
                          <span className="text-sm font-medium">{item.name}</span>
                        </div>
                      </td>
                      <td className="py-3 px-3 text-center">
                        <span className="text-sm">£{item.price.toFixed(2)}</span>
                      </td>
                      <td className="py-3 px-3 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            onClick={() => removeFromCart(item._id)}
                            className="w-5 h-5 bg-black text-white rounded-full flex items-center justify-center text-xs font-bold hover:bg-gray-800 transition-colors"
                          >
                            -
                          </button>
                          <span className="w-6 text-center text-sm font-medium">
                            {item.quantity}
                          </span>
                          <button
                            onClick={() => addToCart(item)}
                            className="w-5 h-5 bg-black text-white rounded-full flex items-center justify-center text-xs font-bold hover:bg-gray-800 transition-colors"
                          >
                            +
                          </button>
                        </div>
                      </td>
                      <td className="py-3 px-3 text-right">
                        <span className="text-sm font-bold">£{(item.price * item.quantity).toFixed(2)}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile Card View */}
            <div className="sm:hidden space-y-3">
              {cart.map((item) => (
                <div key={item._id} className="bg-white rounded-lg border p-4">
                  <div className="flex items-start gap-3">
                    {/* Item Image */}
                    <div className="flex-shrink-0">
                      {item.imageUrl || item.image ? (
                        <img
                          src={item.imageUrl || item.image}
                          alt={item.name}
                          className="w-12 h-12 object-cover rounded"
                          onError={(e) => {
                            e.target.style.display = 'none';
                            e.target.nextSibling.style.display = 'flex';
                          }}
                        />
                      ) : null}
                      <div 
                        className="w-12 h-12 bg-gray-200 rounded flex items-center justify-center text-center text-sm font-medium text-gray-600"
                        style={{ display: item.imageUrl || item.image ? 'none' : 'flex' }}
                      >
                        {item.name.charAt(0)}
                      </div>
                    </div>
                    
                    {/* Item Details */}
                    <div className="flex-1 min-w-0">
                      <h3 className="text-sm font-medium text-gray-900 truncate">{item.name}</h3>
                      <p className="text-sm text-gray-500">£{item.price.toFixed(2)} each</p>
                      
                      {/* Quantity Controls */}
                      <div className="flex items-center justify-between mt-2">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => removeFromCart(item._id)}
                            className="w-6 h-6 bg-black text-white rounded-full flex items-center justify-center text-xs font-bold hover:bg-gray-800 transition-colors"
                          >
                            -
                          </button>
                          <span className="text-sm font-medium w-8 text-center">
                            {item.quantity}
                          </span>
                          <button
                            onClick={() => addToCart(item)}
                            className="w-6 h-6 bg-black text-white rounded-full flex items-center justify-center text-xs font-bold hover:bg-gray-800 transition-colors"
                          >
                            +
                          </button>
                        </div>
                        <span className="text-sm font-bold">£{(item.price * item.quantity).toFixed(2)}</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Order Summary - Mobile Responsive */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h2 className="text-lg font-bold mb-4">Your Order</h2>
            
            {/* Desktop Table View */}
            <div className="hidden sm:block bg-white rounded-lg border overflow-hidden">
              <table className="w-full">
                <tbody>
                  <tr className="border-b border-gray-200">
                    <td className="py-2 px-3 text-sm font-medium">SUB TOTAL</td>
                    <td className="py-2 px-3 text-center text-sm text-gray-500">-</td>
                    <td className="py-2 px-3 text-center text-sm text-gray-500">-</td>
                    <td className="py-2 px-3 text-right text-sm">£{getCartTotal().toFixed(2)}</td>
                  </tr>
                  
                  <tr className="border-b border-gray-200">
                    <td className="py-2 px-3 text-sm font-medium">
                      Delivery
                      {deliveryOption === 'delivery' && (
                        <span className="ml-1 w-4 h-4 bg-yellow-400 rounded-full inline-flex items-center justify-center text-xs font-bold text-black">
                          i
                        </span>
                      )}
                    </td>
                    <td className="py-2 px-3 text-center text-sm text-gray-500">-</td>
                    <td className="py-2 px-3 text-center text-sm text-gray-500">-</td>
                    <td className="py-2 px-3 text-right text-sm">£{getDeliveryFee().toFixed(2)}</td>
                  </tr>
                  
                  <tr className="bg-gray-50">
                    <td className="py-2 px-3 text-sm font-bold">NET TOTAL</td>
                    <td className="py-2 px-3 text-center text-sm text-gray-500">-</td>
                    <td className="py-2 px-3 text-center text-sm text-gray-500">-</td>
                    <td className="py-2 px-3 text-right text-sm font-bold">£{getFinalTotal().toFixed(2)}</td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Mobile Card View */}
            <div className="sm:hidden bg-white rounded-lg border overflow-hidden">
              <div className="p-4 space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">Sub Total</span>
                  <span className="text-sm font-medium">£{getCartTotal().toFixed(2)}</span>
                </div>
                
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium flex items-center gap-1">
                    Delivery
                    {deliveryOption === 'delivery' && (
                      <span className="w-4 h-4 bg-yellow-400 rounded-full inline-flex items-center justify-center text-xs font-bold text-black">
                        i
                      </span>
                    )}
                  </span>
                  <span className="text-sm font-medium">£{getDeliveryFee().toFixed(2)}</span>
                </div>
                
                <div className="border-t border-gray-200 pt-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-bold">Net Total</span>
                    <span className="text-sm font-bold">£{getFinalTotal().toFixed(2)}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Comments Section - Mobile Responsive */}
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="flex flex-col sm:flex-row sm:items-center gap-3">
              <label className="text-sm font-medium flex-shrink-0">Comments:</label>
              <input
                type="text"
                value={specialRequests}
                onChange={(e) => setSpecialRequests(e.target.value)}
                placeholder="Add any special requests"
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent"
              />
              <Button
                onClick={() => {}} // Placeholder for add functionality
                variant="black"
                size="small"
                className="w-full sm:w-auto"
              >
                Add
              </Button>
            </div>
          </div>

          {/* Action Buttons - Mobile Responsive */}
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
            <Button
              onClick={() => navigate('/checkout')}
              variant="black"
              size="large"
              className="flex-1 order-1"
              disabled={!isOrderingAllowed}
            >
              {!isOrderingAllowed ? 'Ordering Disabled' : 'Proceed to Checkout'}
            </Button>
            
            <Button
              onClick={() => window.history.back()}
              variant="secondary"
              size="large"
              className="flex-1 order-2"
            >
              Continue Shopping
            </Button>
          </div>

          {/* Free Delivery Notice */}
          {deliveryOption === 'delivery' && getCartTotal() < deliveryAreaInfo.minimumOrder && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
              <p className="text-sm text-center">
                Spend £{(deliveryAreaInfo.minimumOrder - getCartTotal()).toFixed(2)} more for free delivery!
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Cart Cleared Modal */}
      {showCartClearedModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white rounded-lg p-6 max-w-md mx-4">
            <div className="text-center">
              <div className="text-6xl mb-4">🔄</div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Cart Cleared</h3>
              <p className="text-gray-600 mb-4">
                Your cart contained items from a previous day's menu and has been cleared.
              </p>
              <p className="text-sm text-gray-500 mb-6">
                Please add items from today's menu to continue.
              </p>
              <button
                onClick={() => {
                  setShowCartClearedModal(false);
                  navigate('/menu');
                }}
                className="bg-primary-orange text-white px-6 py-2 rounded-lg font-medium hover:bg-primary-orange/90 transition-colors"
              >
                Go to Menu
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Basket;
