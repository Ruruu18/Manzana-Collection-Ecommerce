import { renderHook, act } from '@testing-library/react-native';
import { useCartStore } from '../cartStore';

describe('Cart Store', () => {
  beforeEach(() => {
    // Reset store before each test
    const { result } = renderHook(() => useCartStore());
    act(() => {
      result.current.clearCart();
    });
  });

  it('initializes with empty cart', () => {
    const { result } = renderHook(() => useCartStore());

    expect(result.current.cart).toEqual([]);
    expect(result.current.cartCount).toBe(0);
    expect(result.current.loading).toBe(false);
  });

  it('adds item to cart', () => {
    const { result } = renderHook(() => useCartStore());

    const mockItem = {
      id: '1',
      user_id: 'user1',
      product_id: 'prod1',
      quantity: 2,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    act(() => {
      result.current.addToCart(mockItem);
    });

    expect(result.current.cart).toHaveLength(1);
    expect(result.current.cartCount).toBe(2);
    expect(result.current.cart[0].id).toBe('1');
  });

  it('updates quantity of existing item', () => {
    const { result } = renderHook(() => useCartStore());

    const mockItem = {
      id: '1',
      user_id: 'user1',
      product_id: 'prod1',
      quantity: 2,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    act(() => {
      result.current.addToCart(mockItem);
      result.current.addToCart({ ...mockItem, quantity: 3 });
    });

    expect(result.current.cart).toHaveLength(1);
    expect(result.current.cartCount).toBe(5);
    expect(result.current.cart[0].quantity).toBe(5);
  });

  it('removes item from cart', () => {
    const { result } = renderHook(() => useCartStore());

    const mockItem = {
      id: '1',
      user_id: 'user1',
      product_id: 'prod1',
      quantity: 2,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    act(() => {
      result.current.addToCart(mockItem);
      result.current.removeFromCart('1');
    });

    expect(result.current.cart).toHaveLength(0);
    expect(result.current.cartCount).toBe(0);
  });

  it('updates item quantity', () => {
    const { result } = renderHook(() => useCartStore());

    const mockItem = {
      id: '1',
      user_id: 'user1',
      product_id: 'prod1',
      quantity: 2,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    act(() => {
      result.current.addToCart(mockItem);
      result.current.updateQuantity('1', 5);
    });

    expect(result.current.cart[0].quantity).toBe(5);
    expect(result.current.cartCount).toBe(5);
  });

  it('clears cart', () => {
    const { result } = renderHook(() => useCartStore());

    const mockItems = [
      {
        id: '1',
        user_id: 'user1',
        product_id: 'prod1',
        quantity: 2,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      {
        id: '2',
        user_id: 'user1',
        product_id: 'prod2',
        quantity: 3,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
    ];

    act(() => {
      mockItems.forEach(item => result.current.addToCart(item));
      result.current.clearCart();
    });

    expect(result.current.cart).toEqual([]);
    expect(result.current.cartCount).toBe(0);
  });

  it('sets loading state', () => {
    const { result } = renderHook(() => useCartStore());

    act(() => {
      result.current.setLoading(true);
    });

    expect(result.current.loading).toBe(true);

    act(() => {
      result.current.setLoading(false);
    });

    expect(result.current.loading).toBe(false);
  });
});
