import React, { useState } from 'react';
import Button from './Button';
import PostcodeInput from './PostcodeInput';
import { validatePostalCode } from '../../services/geocodingService';

const PostalCodeModal = ({ isOpen, onClose, onPostcodeValidated, currentPostcode = '' }) => {
  const [postcode, setPostcode] = useState(currentPostcode);
  const [isCheckingDelivery, setIsCheckingDelivery] = useState(false);
  const [deliveryInfo, setDeliveryInfo] = useState(null);
  const [error, setError] = useState(null);

  // Update postcode when currentPostcode prop changes
  React.useEffect(() => {
    setPostcode(currentPostcode);
    setError(null); // Clear any previous errors
  }, [currentPostcode]);

  // Clear errors when modal opens
  React.useEffect(() => {
    if (isOpen) {
      setError(null);
      setDeliveryInfo(null);
    }
  }, [isOpen]);

  // Handle postal code check with specific postcode parameter
  const checkDeliveryWithPostcode = async (specificPostcode) => {
    if (!specificPostcode.trim()) {
      setError('Please enter a postal code');
      return;
    }

    setIsCheckingDelivery(true);
    setError(null);

    try {
      const result = await validatePostalCode(specificPostcode);
      
      setDeliveryInfo(result);
      
      // Scenario 1: Within 3.5 miles (inDeliveryRange = true)
      if (result.inDeliveryRange) {
        console.log('✅ Delivery available:', result);
        // Save postcode and close modal
        onPostcodeValidated({
          postcode: specificPostcode,
          deliveryInfo: result
        });
        onClose();
      } 
      // Scenario 2: Outside 3.5 miles but valid BR1-BR7 postcode
      else if (result.success && result.areaCode) {
        console.log('ℹ️ Delivery available outside range:', result);
        // Save postcode but don't close modal - show message
        onPostcodeValidated({
          postcode: specificPostcode,
          deliveryInfo: result
        });
        // Don't close modal, let user see the message
      }
      // Scenario 3: Invalid postcode or outside BR1-BR7
      else {
        console.log('❌ Invalid postcode or outside delivery area:', result);
        // Don't save postcode, just show error
        setError(result.message);
      }
    } catch (error) {
      console.error('Error checking delivery:', error);
      setError('We don\'t deliver there or wrong postcode');
    } finally {
      setIsCheckingDelivery(false);
    }
  };

  // Handle manual check delivery button
  const handleCheckDelivery = () => {
    checkDeliveryWithPostcode(postcode);
  };

  // Handle suggestion selection
  const handleSuggestionSelect = (trimmedPostcode) => {
    setPostcode(trimmedPostcode);
    setTimeout(() => checkDeliveryWithPostcode(trimmedPostcode), 100);
  };

  // Handle modal close with dismissal tracking
  const handleClose = () => {
    // Track dismissal time to prevent showing modal too frequently
    localStorage.setItem('postalCodeModalDismissed', Date.now().toString());
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white/95 backdrop-blur-md rounded-xl shadow-2xl border border-white/20 p-6 w-full max-w-md">
        <div className="text-center mb-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            📍 Enter Your Postal Code
          </h2>
          <p className="text-gray-600 text-sm">
            We need your postal code to calculate delivery options and pricing
          </p>
        </div>

        <div className="space-y-4">
          <div>
            <PostcodeInput
              value={postcode}
              onChange={setPostcode}
              onSelect={handleSuggestionSelect}
              placeholder="Enter your postal code (e.g., BR6 0AB)"
              className="w-full"
              disabled={isCheckingDelivery}
            />
          </div>

          <div className="flex justify-center">
            <Button
              onClick={handleCheckDelivery}
              variant="black"
              size="default"
              disabled={isCheckingDelivery || !postcode.trim()}
              className="px-6"
            >
              {isCheckingDelivery ? 'Checking...' : 'Check Delivery'}
            </Button>
          </div>

          {/* Continue button for out-of-range delivery - only for valid BR1-BR7 postcodes */}
          {deliveryInfo && !deliveryInfo.inDeliveryRange && deliveryInfo.success && deliveryInfo.areaCode && (
            <div className="flex justify-center">
              <Button
                onClick={() => {
                  onPostcodeValidated({
                    postcode: postcode,
                    deliveryInfo: deliveryInfo
                  });
                  onClose();
                }}
                variant="black"
                size="default"
                className="px-6"
              >
                Continue with Delivery
              </Button>
            </div>
          )}

          {isCheckingDelivery && (
            <div className="flex items-center justify-center gap-2">
              <div className="w-4 h-4 border-2 border-gray-300 border-t-blue-500 rounded-full animate-spin"></div>
              <p className="text-blue-600 text-sm">Checking delivery availability...</p>
            </div>
          )}

          {error && (
            <div className="p-3 bg-red-100 border border-red-300 rounded-lg">
              <p className="text-red-700 text-sm">{error}</p>
            </div>
          )}

          {deliveryInfo && deliveryInfo.inDeliveryRange && (
            <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
              <div className="text-center">
                <div className="text-2xl mb-2">🎉</div>
                <p className="text-green-800 font-semibold text-base">You got free delivery!</p>
                {deliveryInfo.distance && (
                  <p className="text-green-600 text-sm mt-1">
                    You're within {deliveryInfo.distance.toFixed(1)} miles of our location
                  </p>
                )}
              </div>
            </div>
          )}

          {deliveryInfo && !deliveryInfo.inDeliveryRange && deliveryInfo.success && deliveryInfo.areaCode && (
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="text-center">
                <div className="text-2xl mb-2">✅</div>
                <p className="text-blue-800 font-semibold text-base">Order more than £30 to get free delivery</p>
                {deliveryInfo.distance && (
                  <p className="text-blue-600 text-sm mt-1">
                    You're {deliveryInfo.distance.toFixed(1)} miles away - spend £30+ for free delivery
                  </p>
                )}
              </div>
            </div>
          )}
        </div>

        <div className="mt-6 pt-4 border-t border-gray-200">
          <div className="text-center text-sm text-gray-600">
            <p className="font-medium mb-1">Our Delivery Areas</p>
            <p className="mb-2">BR1 - BR7, Orpington</p>
            <p className="font-medium mb-1">Free Delivery Rules</p>
            <p>Within 3.5 miles: Always free</p>
            <p>Outside 3.5 miles: Free on orders £30+</p>
          </div>
        </div>

        <div className="mt-4 flex justify-end">
          <Button
            onClick={handleClose}
            variant="secondary"
            size="small"
            disabled={isCheckingDelivery}
          >
            Close
          </Button>
        </div>
      </div>
    </div>
  );
};

export default PostalCodeModal;
