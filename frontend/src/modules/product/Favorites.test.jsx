import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import Favorites from './Favorites';
import favoriteService from '../../services/favorite.service';

jest.mock('../../services/favorite.service', () => ({
  __esModule: true,
  default: { getFavorites: jest.fn(), removeFavorite: jest.fn() }
}));

beforeEach(() => {
  window.localStorage.setItem('token', 'test-token');
  favoriteService.getFavorites.mockResolvedValue({
    data: {
      favorites: [{
        _id: 'favorite-1',
        product: {
          _id: 'product-1',
          title: 'Sách cũ',
          price: 50000,
          images: ['http://127.0.0.1:5000/uploads/products/user/book.jpg'],
          location: { district: 'Ba Đình', city: 'Hà Nội' },
          seller: { fullName: 'Người bán A' }
        }
      }],
      total: 1,
      totalPages: 1
    }
  });
});

afterEach(() => {
  window.localStorage.clear();
  jest.clearAllMocks();
});

test('favorite products use the configured API origin for legacy upload URLs and fall back on error', async () => {
  render(<MemoryRouter><Favorites /></MemoryRouter>);

  const image = await screen.findByRole('img', { name: 'Sách cũ' });
  expect(image).toHaveAttribute('src', 'http://localhost:5000/uploads/products/user/book.jpg');
  expect(screen.getByText('Sách cũ')).toBeInTheDocument();
  expect(screen.getByText(/50\.000/)).toBeInTheDocument();
  expect(screen.getByText('Ba Đình')).toBeInTheDocument();
  expect(screen.getByText('Hà Nội')).toBeInTheDocument();
  expect(screen.getByText('Người bán A')).toBeInTheDocument();
  fireEvent.error(image);
  expect(image.getAttribute('src')).toBe('/images/placeholders/product-placeholder.svg');
});
