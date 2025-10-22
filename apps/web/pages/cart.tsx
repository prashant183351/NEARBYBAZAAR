import React from 'react';
import { useCart } from '../context/CartContext';

export default function CartPage() {
  const { cart, removeFromCart, clearCart } = useCart();
  return (
    <main style={{ padding: 32, maxWidth: 600, margin: '0 auto' }}>
      <h1>Your Cart</h1>
      {cart.length === 0 ? (
        <p>Your cart is empty.</p>
      ) : (
        <>
          <ul>
            {cart.map((item) => (
              <li key={item.slug}>
                {item.name} (x{item.qty}){' '}
                <button onClick={() => removeFromCart(item.slug)}>Remove</button>
              </li>
            ))}
          </ul>
          <button onClick={clearCart} style={{ marginTop: 16 }}>
            Clear Cart
          </button>
        </>
      )}
    </main>
  );
}
