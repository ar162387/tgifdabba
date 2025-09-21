# Basket Store with Zustand

This directory contains the Zustand-based basket store that provides persistent cart functionality.

## Features

- **Persistent Storage**: Cart data persists across browser sessions and page refreshes
- **Session Management**: Automatic cleanup after 24 hours of inactivity
- **Performance Optimized**: Individual selectors for better React re-render performance
- **Backward Compatible**: Existing `useBasket()` hook continues to work

## Usage

### Using the Context (Backward Compatible)

```jsx
import { useBasket } from '../contexts/BasketContext';

function MyComponent() {
  const { cart, addToCart, getCartTotal } = useBasket();
  
  return (
    <div>
      <p>Items in cart: {cart.length}</p>
      <p>Total: ${getCartTotal()}</p>
    </div>
  );
}
```

### Using Zustand Directly (Recommended for Performance)

```jsx
import { useCart, useCartActions, useCartTotals } from '../stores/basketStore';

function MyComponent() {
  const cart = useCart();
  const { addToCart } = useCartActions();
  const { getCartTotal } = useCartTotals();
  
  return (
    <div>
      <p>Items in cart: {cart.length}</p>
      <p>Total: ${getCartTotal()}</p>
    </div>
  );
}
```

### Using the Full Store

```jsx
import { useBasketStore } from '../stores/basketStore';

function MyComponent() {
  const { cart, addToCart, getCartTotal } = useBasketStore();
  
  return (
    <div>
      <p>Items in cart: {cart.length}</p>
      <p>Total: ${getCartTotal()}</p>
    </div>
  );
}
```

## Available Selectors

- `useCart()` - Get cart items
- `useDeliveryOption()` - Get delivery option
- `useSpecialRequests()` - Get special requests
- `useCartActions()` - Get all cart actions
- `useCartTotals()` - Get all computed totals

## Storage Details

- **Storage Key**: `tgifdabba_basket`
- **Session Duration**: 24 hours
- **Auto Cleanup**: Expired sessions are automatically cleared
- **Error Handling**: Corrupted data is automatically cleared

## Migration from useReducer

The store maintains the same API as the previous useReducer implementation, so no changes are needed in existing components that use `useBasket()`.
