# Migration Guide: useReducer to Zustand

This document outlines the migration from the useReducer-based BasketContext to Zustand-based basket store.

## What Changed

### Before (useReducer)
- Complex state management with useReducer
- Manual localStorage handling with useEffect
- Session management with custom logic
- Context provider wrapping

### After (Zustand)
- Simple state management with Zustand
- Built-in persistence with automatic localStorage handling
- Automatic session management (24-hour expiry)
- Direct store access or context wrapper for compatibility

## Benefits

1. **Better Performance**: Zustand is more performant than useReducer for this use case
2. **Automatic Persistence**: No need for manual localStorage management
3. **Session Management**: Built-in session expiry handling
4. **Smaller Bundle**: Zustand is lighter than the previous implementation
5. **Better DevTools**: Zustand has excellent debugging tools

## API Compatibility

The public API remains exactly the same:

```jsx
// This still works exactly as before
const { cart, addToCart, getCartTotal } = useBasket();
```

## New Features Available

### Direct Store Access
```jsx
import { useBasketStore } from '../stores/basketStore';

// Access the full store
const { cart, addToCart, getCartTotal } = useBasketStore();
```

### Optimized Selectors
```jsx
import { useCart, useCartActions, useCartTotals } from '../stores/basketStore';

// Only re-render when cart changes
const cart = useCart();

// Only re-render when actions change
const { addToCart } = useCartActions();

// Only re-render when totals change
const { getCartTotal } = useCartTotals();
```

## Storage Changes

### Before
- Key: `tgifdabba_basket`
- Manual session tracking with `tgifdabba_last_activity`
- 30-minute session expiry
- Manual cleanup on page unload

### After
- Key: `tgifdabba_basket` (same)
- Automatic session tracking with `lastActivity` in state
- 24-hour session expiry
- Automatic cleanup on session expiry

## Migration Steps

1. ✅ Install Zustand: `npm install zustand`
2. ✅ Create basket store with persistence
3. ✅ Update BasketContext to use Zustand store
4. ✅ Maintain backward compatibility
5. ✅ Add session management
6. ✅ Test functionality

## Testing

The store includes comprehensive tests covering:
- Adding items to cart
- Removing items from cart
- Quantity updates
- Cart totals calculation
- Delivery options
- Cart clearing

## Future Improvements

1. **Offline Support**: Add service worker for offline cart persistence
2. **Sync with Server**: Add server-side cart synchronization
3. **Cart Analytics**: Add cart abandonment tracking
4. **Multi-tab Sync**: Add cross-tab synchronization
5. **Cart Recovery**: Add email-based cart recovery
