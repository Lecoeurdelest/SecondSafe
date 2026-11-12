import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import ProductDetail from './ProductDetail';
import productService from '../../services/product.service';
import favoriteService from '../../services/favorite.service';
import cartService from '../../services/cart.service';
import AppProviders from '../../ui/AppProviders';

jest.mock('../../services/product.service', () => ({ __esModule: true, default: { getProductById: jest.fn() } }));
jest.mock('../../services/favorite.service', () => ({
  __esModule: true,
  default: { checkFavorite: jest.fn(), addFavorite: jest.fn(), removeFavorite: jest.fn() }
}));
jest.mock('../../services/cart.service', () => ({ __esModule: true, default: { addToCart: jest.fn() } }));
jest.mock('../../services/chat.service', () => ({ __esModule: true, default: { openConversation: jest.fn() } }));
jest.mock('../order/PurchaseRequest', () => ({
  __esModule: true,
  default: ({ onClose }) => <div role="dialog" aria-label="Mua ngay"><button type="button" onClick={onClose}>Đóng mua ngay</button></div>
}));
jest.mock('../report/ReportProduct', () => ({
  __esModule: true,
  default: ({ onCancel }) => <div role="dialog" aria-label="Báo cáo"><button type="button" onClick={onCancel}>Đóng báo cáo</button></div>
}));

const future = { v7_startTransition: true, v7_relativeSplatPath: true };
const PRODUCT = {
  _id: 'product-1',
  title: 'Sách đã qua sử dụng',
  description: 'Sách còn tốt.\nKhông ghi chú.',
  price: 50000,
  condition: 'good',
  images: ['/images/placeholders/product-placeholder.svg'],
  category: { name: 'Sách' },
  location: { district: 'Ba Đình', city: 'Hà Nội' },
  seller: { _id: 'seller-1', fullName: 'Người bán thử' }
};

function renderDetail() {
  return render(
    <AppProviders language="vi" themeMode="light">
      <MemoryRouter future={future} initialEntries={['/product/product-1']}>
        <Routes>
          <Route path="/product/:id" element={<ProductDetail />} />
          <Route path="/" element={<p>Trang chủ</p>} />
        </Routes>
      </MemoryRouter>
    </AppProviders>
  );
}

beforeEach(() => {
  jest.clearAllMocks();
  window.localStorage.clear();
  productService.getProductById.mockResolvedValue(PRODUCT);
  favoriteService.checkFavorite.mockResolvedValue({ data: { isFavorite: false } });
});

test('shows the product with its category, price, facts, description and seller', async () => {
  renderDetail();

  expect(await screen.findByRole('heading', { level: 1, name: 'Sách đã qua sử dụng' })).toBeInTheDocument();
  expect(screen.getByText('Sách')).toBeInTheDocument();
  expect(screen.getByText(/50\.000/)).toBeInTheDocument();
  expect(screen.getByText('Tình trạng')).toBeInTheDocument();
  expect(screen.getByText('Tốt')).toBeInTheDocument();
  expect(screen.getByText('Ba Đình, Hà Nội')).toBeInTheDocument();
  expect(screen.getByRole('heading', { level: 2, name: 'Mô tả sản phẩm' })).toBeInTheDocument();
  expect(screen.getByText(/Sách còn tốt\./)).toBeInTheDocument();
  expect(screen.getByRole('link', { name: 'Người bán thử' })).toHaveAttribute('href', '/user/seller-1');
  expect(screen.getByRole('link', { name: /Quay lại danh sách/ })).toHaveAttribute('href', '/');
});

test('a missing product shows a recovery link and an unexpected failure shows an alert', async () => {
  productService.getProductById.mockRejectedValueOnce(Object.assign(new Error('x'), { status: 404 }));
  const missing = renderDetail();
  expect(await screen.findByRole('heading', { name: 'Không tìm thấy sản phẩm' })).toBeInTheDocument();
  expect(screen.getByRole('link', { name: 'Quay lại danh sách sản phẩm' })).toHaveAttribute('href', '/');
  missing.unmount();

  productService.getProductById.mockRejectedValueOnce(Object.assign(new Error('Máy chủ đang bận'), { status: 500 }));
  renderDetail();
  expect(await screen.findByRole('alert')).toHaveTextContent('Máy chủ đang bận');
  expect(screen.getByRole('heading', { name: 'Không thể tải sản phẩm' })).toBeInTheDocument();
});

test('signed-out visitors are asked to sign in before any action', async () => {
  renderDetail();
  await screen.findByRole('heading', { name: 'Sách đã qua sử dụng' });

  fireEvent.click(screen.getByRole('button', { name: 'Thêm vào giỏ hàng' }));
  expect(await screen.findByRole('alert')).toHaveTextContent('Vui lòng đăng nhập để mua');
  expect(cartService.addToCart).not.toHaveBeenCalled();
  expect(favoriteService.checkFavorite).not.toHaveBeenCalled();

  fireEvent.click(screen.getByRole('button', { name: 'Mua ngay' }));
  expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
});

test('adding to the cart confirms it and links to the cart', async () => {
  window.localStorage.setItem('token', 'test-token');
  cartService.addToCart.mockResolvedValue({ _id: 'cart-1' });
  renderDetail();
  await screen.findByRole('heading', { name: 'Sách đã qua sử dụng' });

  fireEvent.click(screen.getByRole('button', { name: 'Thêm vào giỏ hàng' }));
  expect(await screen.findByRole('status')).toHaveTextContent('Đã thêm sản phẩm vào giỏ hàng.');
  expect(screen.getByRole('link', { name: 'Mở danh sách' })).toHaveAttribute('href', '/cart');
  expect(cartService.addToCart).toHaveBeenCalledWith('product-1');
});

test('the favorite button reports its state and toggles it', async () => {
  window.localStorage.setItem('token', 'test-token');
  favoriteService.addFavorite.mockResolvedValue({ success: true });
  favoriteService.removeFavorite.mockResolvedValue({ success: true });
  renderDetail();
  await screen.findByRole('heading', { name: 'Sách đã qua sử dụng' });

  const add = screen.getByRole('button', { name: 'Thêm yêu thích' });
  expect(add).toHaveAttribute('aria-pressed', 'false');
  fireEvent.click(add);
  const remove = await screen.findByRole('button', { name: 'Đã yêu thích' });
  expect(remove).toHaveAttribute('aria-pressed', 'true');
  expect(favoriteService.addFavorite).toHaveBeenCalledWith('product-1');

  fireEvent.click(remove);
  expect(await screen.findByRole('button', { name: 'Thêm yêu thích' })).toHaveAttribute('aria-pressed', 'false');
  expect(favoriteService.removeFavorite).toHaveBeenCalledWith('product-1');
  expect(screen.getByRole('status')).toHaveTextContent('Đã xóa sản phẩm khỏi danh sách yêu thích.');
});

test('buyers can open the purchase and report dialogs; owners get edit links instead of the report button', async () => {
  window.localStorage.setItem('token', 'test-token');
  renderDetail();
  await screen.findByRole('heading', { name: 'Sách đã qua sử dụng' });

  fireEvent.click(screen.getByRole('button', { name: 'Mua ngay' }));
  fireEvent.click(await screen.findByRole('button', { name: 'Đóng mua ngay' }));
  await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());

  fireEvent.click(screen.getByRole('button', { name: 'Báo cáo tin đăng này' }));
  expect(await screen.findByRole('dialog', { name: 'Báo cáo' })).toBeInTheDocument();
});

test('the owner of the listing sees links to edit it and no report button', async () => {
  window.localStorage.setItem('token', 'test-token');
  window.localStorage.setItem('user', JSON.stringify({ _id: 'seller-1' }));
  renderDetail();
  await screen.findByRole('heading', { name: 'Sách đã qua sử dụng' });

  expect(screen.getByRole('link', { name: 'Chỉnh sửa tin đăng' })).toHaveAttribute('href', '/product/product-1/edit');
  expect(screen.getByRole('link', { name: 'Quản lý tin của tôi' })).toHaveAttribute('href', '/my-products');
  expect(screen.queryByRole('button', { name: 'Báo cáo tin đăng này' })).not.toBeInTheDocument();
});
