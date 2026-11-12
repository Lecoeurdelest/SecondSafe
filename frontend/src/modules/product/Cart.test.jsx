import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import Cart from './Cart';
import cartService from '../../services/cart.service';
import AppProviders from '../../ui/AppProviders';

jest.mock('../../services/cart.service', () => ({
  __esModule: true,
  default: { getCart: jest.fn(), removeFromCart: jest.fn() }
}));
jest.mock('../order/PurchaseRequest', () => ({
  __esModule: true,
  default: ({ product, onClose, onSuccess }) => (
    <div role="dialog" aria-label={`Mua ${product.title}`}>
      <button type="button" onClick={onClose}>Đóng mua ngay</button>
      <button type="button" onClick={onSuccess}>Hoàn tất mua</button>
    </div>
  )
}));

const future = { v7_startTransition: true, v7_relativeSplatPath: true };

function renderCart() {
  return render(
    <AppProviders language="vi" themeMode="light">
      <MemoryRouter future={future}><Cart /></MemoryRouter>
    </AppProviders>
  );
}

function cartItem(index) {
  return {
    _id: `cart-item-${index}`,
    product: { _id: `product-${index}`, title: `Sản phẩm ${index}`, price: 50000 * index, images: [], seller: { fullName: 'Người bán A' } }
  };
}

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

test('signed-out visitors are asked to sign in and no request is made', () => {
  window.localStorage.clear();
  renderCart();

  expect(screen.getByRole('heading', { name: 'Giỏ hàng' })).toBeInTheDocument();
  expect(screen.getByRole('status')).toHaveTextContent('Đăng nhập để xem giỏ hàng');
  expect(screen.getByRole('link', { name: 'Tiếp tục xem sản phẩm' })).toHaveAttribute('href', '/');
  expect(cartService.getCart).not.toHaveBeenCalled();
});

test('an empty cart shows its heading and a link back to the products', async () => {
  cartService.getCart.mockResolvedValue({ items: [], total: 0, totalPages: 0 });
  renderCart();

  expect(await screen.findByRole('heading', { name: 'Giỏ hàng đang trống' })).toBeInTheDocument();
  expect(screen.getByRole('link', { name: 'Khám phá sản phẩm' })).toHaveAttribute('href', '/');
});

test('items show their price and seller and removing one reloads the cart with a notice', async () => {
  cartService.getCart
    .mockResolvedValueOnce({ items: [cartItem(1), cartItem(2)], total: 2, totalPages: 1 })
    .mockResolvedValueOnce({ items: [cartItem(2)], total: 1, totalPages: 1 });
  cartService.removeFromCart.mockResolvedValue({ inCart: false });
  renderCart();

  expect(await screen.findByRole('heading', { name: 'Sản phẩm 1' })).toBeInTheDocument();
  expect(screen.getByText('2 sản phẩm')).toBeInTheDocument();
  expect(screen.getAllByText('Người bán: Người bán A')).toHaveLength(2);

  fireEvent.click(screen.getAllByRole('button', { name: 'Xóa' })[0]);
  expect(await screen.findByText('Đã xóa sản phẩm khỏi giỏ hàng.')).toBeInTheDocument();
  expect(cartService.removeFromCart).toHaveBeenCalledWith('product-1');
  expect(screen.queryByRole('heading', { name: 'Sản phẩm 1' })).not.toBeInTheDocument();
  expect(screen.getByText('1 sản phẩm')).toBeInTheDocument();
});

test('a failed load shows an alert', async () => {
  cartService.getCart.mockRejectedValue(new Error('Không thể tải giỏ hàng.'));
  renderCart();
  expect(await screen.findByRole('alert')).toHaveTextContent('Không thể tải giỏ hàng.');
});

test('buying an item opens the purchase dialog and finishing it reloads the cart', async () => {
  cartService.getCart.mockResolvedValue({ items: [cartItem(1)], total: 1, totalPages: 1 });
  renderCart();

  fireEvent.click(await screen.findByRole('button', { name: 'Mua ngay' }));
  expect(await screen.findByRole('dialog', { name: 'Mua Sản phẩm 1' })).toBeInTheDocument();

  fireEvent.click(screen.getByRole('button', { name: 'Hoàn tất mua' }));
  expect(await screen.findByText('Đã tạo đơn hàng thành công.')).toBeInTheDocument();
  expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  expect(cartService.getCart).toHaveBeenCalledTimes(2);
});

test('a long cart is paged and the next page is requested', async () => {
  cartService.getCart
    .mockResolvedValueOnce({ items: [cartItem(1)], page: 1, total: 45, totalPages: 3 })
    .mockResolvedValueOnce({ items: [cartItem(21)], page: 2, total: 45, totalPages: 3 });
  renderCart();
  await screen.findByRole('heading', { name: 'Sản phẩm 1' });

  fireEvent.click(screen.getByTitle('2'));
  await waitFor(() => expect(cartService.getCart).toHaveBeenLastCalledWith({ page: 2, limit: 20 }));
  expect(await screen.findByRole('heading', { name: 'Sản phẩm 21' })).toBeInTheDocument();
});
