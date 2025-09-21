// Simple test to verify the basket store works correctly
import { useBasketStore } from '../basketStore';

// Mock localStorage
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
};
global.localStorage = localStorageMock;

describe('Basket Store', () => {
  beforeEach(() => {
    // Clear all mocks before each test
    jest.clearAllMocks();
    // Reset store state
    useBasketStore.getState().clearCart();
  });

  test('should add item to cart', () => {
    const { addToCart, cart } = useBasketStore.getState();
    
    const testItem = {
      _id: '1',
      name: 'Test Item',
      price: 10.99
    };

    addToCart(testItem);
    
    expect(cart).toHaveLength(1);
    expect(cart[0]).toEqual({ ...testItem, quantity: 1 });
  });

  test('should increment quantity when adding existing item', () => {
    const { addToCart, cart } = useBasketStore.getState();
    
    const testItem = {
      _id: '1',
      name: 'Test Item',
      price: 10.99
    };

    addToCart(testItem);
    addToCart(testItem);
    
    expect(cart).toHaveLength(1);
    expect(cart[0].quantity).toBe(2);
  });

  test('should remove item from cart', () => {
    const { addToCart, removeFromCart, cart } = useBasketStore.getState();
    
    const testItem = {
      _id: '1',
      name: 'Test Item',
      price: 10.99
    };

    addToCart(testItem);
    expect(cart).toHaveLength(1);
    
    removeFromCart('1');
    expect(cart).toHaveLength(0);
  });

  test('should calculate cart total correctly', () => {
    const { addToCart, getCartTotal } = useBasketStore.getState();
    
    const testItem1 = { _id: '1', name: 'Item 1', price: 10.99 };
    const testItem2 = { _id: '2', name: 'Item 2', price: 5.50 };

    addToCart(testItem1);
    addToCart(testItem2);
    addToCart(testItem1); // Should increment quantity
    
    const total = getCartTotal();
    expect(total).toBe(27.48); // (10.99 * 2) + 5.50
  });

  test('should set delivery option', () => {
    const { setDeliveryOption, deliveryOption } = useBasketStore.getState();
    
    setDeliveryOption('pickup');
    expect(deliveryOption).toBe('pickup');
  });

  test('should clear cart', () => {
    const { addToCart, clearCart, cart } = useBasketStore.getState();
    
    const testItem = { _id: '1', name: 'Test Item', price: 10.99 };
    addToCart(testItem);
    expect(cart).toHaveLength(1);
    
    clearCart();
    expect(cart).toHaveLength(0);
  });
});
