import React from 'react';
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import Favorites from './Favorites';
import favoriteService from '../../services/favorite.service';
import AppProviders from '../../ui/AppProviders';

const future = { v7_startTransition: true, v7_relativeSplatPath: true };

function renderFavorites() {
  return render(
    <AppProviders language="vi" themeMode="light">
      <MemoryRouter future={future}><Favorites /></MemoryRouter>
    </AppProviders>
  );
}

function favorite(index) {
  return {
    _id: `favorite-${index}`,
    product: { _id: `product-${index}`, title: `Sản phẩm ${index}`, price: 10000 * index, images: [], location: { city: 'Hà Nội' }, seller: { fullName: 'Người bán A' } }
  };
}

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

test('signed-out visitors are asked to sign in and no request is made', () => {
  window.localStorage.clear();
  renderFavorites();

  expect(screen.getByRole('heading', { name: 'Tin đã lưu' })).toBeInTheDocument();
  expect(screen.getByRole('status')).toHaveTextContent('Đăng nhập để xem danh sách sản phẩm yêu thích.');
  expect(favoriteService.getFavorites).not.toHaveBeenCalled();
});

test('an empty list shows its heading and a link to explore products', async () => {
  favoriteService.getFavorites.mockResolvedValue({ data: { favorites: [], total: 0, totalPages: 0 } });
  renderFavorites();

  expect(await screen.findByRole('heading', { name: 'Chưa có tin đã lưu' })).toBeInTheDocument();
  expect(screen.getByRole('link', { name: 'Khám phá sản phẩm' })).toHaveAttribute('href', '/');
});

test('a card links to the product and shows the saved count', async () => {
  favoriteService.getFavorites.mockResolvedValue({ data: { favorites: [favorite(1), favorite(2)], total: 2, totalPages: 1 } });
  renderFavorites();

  const links = await screen.findAllByRole('link', { name: /Sản phẩm 1/ });
  expect(links[0]).toHaveAttribute('href', '/product/product-1');
  expect(screen.getAllByText('Đã lưu')).toHaveLength(2);
  expect(screen.getByText('sản phẩm')).toBeInTheDocument();
});

test('removing a favorite asks for confirmation first and then reloads the list', async () => {
  favoriteService.getFavorites
    .mockResolvedValueOnce({ data: { favorites: [favorite(1), favorite(2)], total: 2, totalPages: 1 } })
    .mockResolvedValueOnce({ data: { favorites: [favorite(2)], total: 1, totalPages: 1 } });
  favoriteService.removeFavorite.mockResolvedValue({ success: true });
  renderFavorites();
  await screen.findAllByRole('link', { name: /Sản phẩm 1/ });

  fireEvent.click(screen.getAllByRole('button', { name: 'Bỏ lưu' })[0]);
  expect(favoriteService.removeFavorite).not.toHaveBeenCalled();
  const confirm = await screen.findByText('Xóa khỏi yêu thích?');
  fireEvent.click(within(confirm.closest('.ant-popover')).getByRole('button', { name: 'Bỏ lưu' }));

  await waitFor(() => expect(favoriteService.removeFavorite).toHaveBeenCalledWith('product-1'));
  await waitFor(() => expect(screen.queryByRole('link', { name: /Sản phẩm 1/ })).not.toBeInTheDocument());
  expect(favoriteService.getFavorites).toHaveBeenCalledTimes(2);
});

test('a failed removal shows an alert and keeps the card', async () => {
  favoriteService.getFavorites.mockResolvedValue({ data: { favorites: [favorite(1)], total: 1, totalPages: 1 } });
  favoriteService.removeFavorite.mockRejectedValue(new Error('Không thể xóa sản phẩm khỏi danh sách yêu thích.'));
  renderFavorites();
  await screen.findAllByRole('link', { name: /Sản phẩm 1/ });

  fireEvent.click(screen.getByRole('button', { name: 'Bỏ lưu' }));
  const confirm = await screen.findByText('Xóa khỏi yêu thích?');
  fireEvent.click(within(confirm.closest('.ant-popover')).getByRole('button', { name: 'Bỏ lưu' }));

  expect(await screen.findByRole('alert')).toHaveTextContent('Không thể xóa sản phẩm khỏi danh sách yêu thích.');
  expect(screen.getAllByRole('link', { name: /Sản phẩm 1/ }).length).toBeGreaterThan(0);
});

test('a long list is paged and the next page is requested', async () => {
  favoriteService.getFavorites
    .mockResolvedValueOnce({ data: { favorites: [favorite(1)], total: 45, totalPages: 3 } })
    .mockResolvedValueOnce({ data: { favorites: [favorite(21)], total: 45, totalPages: 3 } });
  renderFavorites();
  await screen.findAllByRole('link', { name: /Sản phẩm 1/ });

  fireEvent.click(screen.getByTitle('2'));
  await waitFor(() => expect(favoriteService.getFavorites).toHaveBeenLastCalledWith({ page: 2, limit: 20 }));
  expect((await screen.findAllByRole('link', { name: /Sản phẩm 21/ })).length).toBeGreaterThan(0);
});
