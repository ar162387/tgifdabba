import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';


// Create the basket store with persistence
export const useBasketStore = create(
  persist(
    (set, get) => ({
      // State
      cart: [],
      deliveryOption: 'delivery',
      specialRequests: '',
      lastActivity: Date.now(),
      currentMenuDay: null, // Track which day's menu the cart belongs to
      postcode: '', // User's postcode for delivery calculation
      deliveryInfo: null, // Delivery information from geocoding service

      // Actions
      addToCart: (item, menuDay = null) => {
        set((state) => {
          // If menu day has changed, clear the cart first
          if (menuDay && state.currentMenuDay && state.currentMenuDay !== menuDay) {
            return {
              ...state,
              cart: [{ ...item, quantity: 1 }],
              currentMenuDay: menuDay,
              lastActivity: Date.now()
            };
          }
          
          const existingItem = state.cart.find(cartItem => cartItem._id === item._id);
          
          if (existingItem) {
            return {
              ...state,
              cart: state.cart.map(cartItem =>
                cartItem._id === item._id
                  ? { ...cartItem, quantity: cartItem.quantity + 1 }
                  : cartItem
              ),
              currentMenuDay: menuDay || state.currentMenuDay,
              lastActivity: Date.now()
            };
          } else {
            return {
              ...state,
              cart: [...state.cart, { ...item, quantity: 1 }],
              currentMenuDay: menuDay || state.currentMenuDay,
              lastActivity: Date.now()
            };
          }
        });
      },

      removeFromCart: (itemId) => {
        set((state) => {
          const existingItem = state.cart.find(item => item._id === itemId);
          
          if (existingItem && existingItem.quantity > 1) {
            return {
              ...state,
              cart: state.cart.map(item =>
                item._id === itemId
                  ? { ...item, quantity: item.quantity - 1 }
                  : item
              ),
              lastActivity: Date.now()
            };
          } else {
            return {
              ...state,
              cart: state.cart.filter(item => item._id !== itemId),
              lastActivity: Date.now()
            };
          }
        });
      },

      updateQuantity: (itemId, quantity) => {
        set((state) => {
          if (quantity <= 0) {
            return {
              ...state,
              cart: state.cart.filter(item => item._id !== itemId),
              lastActivity: Date.now()
            };
          }
          
          return {
            ...state,
            cart: state.cart.map(item =>
              item._id === itemId
                ? { ...item, quantity }
                : item
            ),
            lastActivity: Date.now()
          };
        });
      },

      clearCart: () => {
        set((state) => ({
          ...state,
          cart: [],
          currentMenuDay: null,
          lastActivity: Date.now()
        }));
      },

      // New method to validate cart against current menu day
      validateCartForMenuDay: (menuDay) => {
        const { cart, currentMenuDay } = get();
        if (currentMenuDay && currentMenuDay !== menuDay) {
          return false; // Cart contains items from different day
        }
        return true;
      },

      // Method to clear cart if it's from a different day
      clearCartIfDifferentDay: (menuDay) => {
        const { currentMenuDay } = get();
        if (currentMenuDay && currentMenuDay !== menuDay) {
          set((state) => ({
            ...state,
            cart: [],
            currentMenuDay: menuDay,
            lastActivity: Date.now()
          }));
          return true; // Cart was cleared
        }
        return false; // Cart was not cleared
      },

      setDeliveryOption: (option) => {
        set((state) => ({
          ...state,
          deliveryOption: option,
          lastActivity: Date.now()
        }));
      },

      setSpecialRequests: (requests) => {
        set((state) => ({
          ...state,
          specialRequests: requests,
          lastActivity: Date.now()
        }));
      },

      setPostcode: (postcode) => {
        set((state) => ({
          ...state,
          postcode: postcode,
          lastActivity: Date.now()
        }));
      },

      setDeliveryInfo: (deliveryInfo) => {
        set((state) => ({
          ...state,
          deliveryInfo: deliveryInfo,
          lastActivity: Date.now()
        }));
      },

      // Computed values (getters)
      getCartTotal: () => {
        const { cart } = get();
        return cart.reduce((total, item) => total + (item.price * item.quantity), 0);
      },

      getTotalItems: () => {
        const { cart } = get();
        return cart.reduce((total, item) => total + item.quantity, 0);
      },

      getItemQuantity: (itemId) => {
        const { cart } = get();
        const cartItem = cart.find(item => item._id === itemId);
        return cartItem ? cartItem.quantity : 0;
      },

      getDeliveryFee: () => {
        const { deliveryOption, deliveryInfo, getCartTotal } = get();
        
        // Collection is always free
        if (deliveryOption === 'collection') {
          return 0;
        }
        
        // For delivery, check the new FREE delivery rules
        if (deliveryOption === 'delivery') {
          const cartTotal = getCartTotal();
          
          // If no delivery info available, use default fee
          if (!deliveryInfo) {
            return 2.0; // Default delivery fee
          }
          
          // Check if within 3.5 miles radius (inDeliveryRange)
          if (deliveryInfo.inDeliveryRange) {
            // Within 3.5 miles - FREE delivery
            return 0;
          } else {
            // Outside 3.5 miles
            if (cartTotal >= 30) {
              // Order value £30 or more - FREE delivery
              return 0;
            } else {
              // Order value less than £30 - £2 delivery charge
              return 2.0;
            }
          }
        }
        
        return 0;
      },

      getFinalTotal: () => {
        const { getCartTotal, getDeliveryFee } = get();
        return getCartTotal() + getDeliveryFee();
      }
    }),
    {
      name: 'tgifdabba_basket', // unique name for localStorage key
      storage: createJSONStorage(() => localStorage),
      version: 1,
      // Only persist the essential data
      partialize: (state) => ({ 
        cart: state.cart, 
        deliveryOption: state.deliveryOption, 
        specialRequests: state.specialRequests,
        lastActivity: state.lastActivity,
        currentMenuDay: state.currentMenuDay,
        postcode: state.postcode,
        deliveryInfo: state.deliveryInfo
      }),
    }
  )
);

// Export individual selectors for better performance
export const useCart = () => useBasketStore((state) => state.cart);
export const useDeliveryOption = () => useBasketStore((state) => state.deliveryOption);
export const useSpecialRequests = () => useBasketStore((state) => state.specialRequests);
export const useCartActions = () => useBasketStore((state) => ({
  addToCart: state.addToCart,
  removeFromCart: state.removeFromCart,
  updateQuantity: state.updateQuantity,
  clearCart: state.clearCart,
  setDeliveryOption: state.setDeliveryOption,
  setSpecialRequests: state.setSpecialRequests
}));
export const useCartTotals = () => useBasketStore((state) => ({
  getCartTotal: state.getCartTotal,
  getTotalItems: state.getTotalItems,
  getItemQuantity: state.getItemQuantity,
  getDeliveryFee: state.getDeliveryFee,
  getFinalTotal: state.getFinalTotal
}));
