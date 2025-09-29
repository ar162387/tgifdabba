import React, { createContext, useContext } from 'react';
import { useBasketStore } from '../stores/basketStore';

// Create context for backward compatibility
const BasketContext = createContext();

// Custom hook to use basket context (now using Zustand under the hood)
export function useBasket() {
  const context = useContext(BasketContext);
  if (!context) {
    throw new Error('useBasket must be used within a BasketProvider');
  }
  return context;
}

// Basket provider component - now just a wrapper around Zustand store
export function BasketProvider({ children }) {
  // Get all state and actions from Zustand store
  const store = useBasketStore();

  const value = {
    // State
    cart: store.cart,
    deliveryOption: store.deliveryOption,
    specialRequests: store.specialRequests,
    currentMenuDay: store.currentMenuDay,
    postcode: store.postcode,
    deliveryInfo: store.deliveryInfo,
    
    // Actions
    addToCart: store.addToCart,
    removeFromCart: store.removeFromCart,
    updateQuantity: store.updateQuantity,
    clearCart: store.clearCart,
    setDeliveryOption: store.setDeliveryOption,
    setSpecialRequests: store.setSpecialRequests,
    setPostcode: store.setPostcode,
    setDeliveryInfo: store.setDeliveryInfo,
    validateCartForMenuDay: store.validateCartForMenuDay,
    clearCartIfDifferentDay: store.clearCartIfDifferentDay,
    
    // Computed values
    getCartTotal: store.getCartTotal,
    getTotalItems: store.getTotalItems,
    getItemQuantity: store.getItemQuantity,
    getDeliveryFee: store.getDeliveryFee,
    getFinalTotal: store.getFinalTotal
  };

  return (
    <BasketContext.Provider value={value}>
      {children}
    </BasketContext.Provider>
  );
}
