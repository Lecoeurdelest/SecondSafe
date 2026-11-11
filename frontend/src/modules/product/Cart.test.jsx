import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import Cart from './Cart';
import cartService from '../../services/cart.service';

jest.mock('../../services/cart.service', () => ({
  __esModule: true,
  default: { getCart: jest.fn(), removeFromCart: jest.fn() }
}));

beforeEach(() => {
  window.localStorage.setItem('token', 'test-token');
  cartService.getCart.mockResolvedValue({
    items: [{
      _id: 'cart-item-1',
      product: {
        _id: 'product-1',
        title: 'Sách cũ',
        price: 50000,
        images: ['http://127.0.0.1:5000/uploads/products/user/book.jpg']
      }
    }],
    total: 1,
    totalPages: 1
  });
});

afterEach(() => {
  window.localStorage.clear();
  jest.clearAllMocks();
});

test('cart products use the configured API origin for legacy upload URLs and fall back on error', async () => {
  render(<MemoryRouter><Cart /></MemoryRouter>);

  const image = await screen.findByRole('img', { name: 'Sách cũ' });
  expect(image).toHaveAttribute('src', 'http://localhost:5000/uploads/products/user/book.jpg');
  fireEvent.error(image);
  expect(image.getAttribute('src')).toBe('/images/placeholders/product-placeholder.svg');
});
