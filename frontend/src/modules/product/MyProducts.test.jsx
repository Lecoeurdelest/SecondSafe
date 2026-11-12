import React from 'react';
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import MyProducts from './MyProducts';
import productService from '../../services/product.service';
import AppProviders from '../../ui/AppProviders';

let mockUser = { _id: 'user-1' };
jest.mock('../../hooks/useAuth', () => ({ useAuth: () => ({ user: mockUser }) }));
jest.mock('../../services/product.service', () => ({
  __esModule: true,
  default: { getMyProducts: jest.fn(), deleteProduct: jest.fn(), updateProductVisibility: jest.fn() }
}));

const future = { v7_startTransition: true, v7_relativeSplatPath: true };

function product(id, overrides = {}) {
  return {
    _id: id,
    title: `Tin ${id}`,
    price: 120000,
    status: 'active',
    images: [],
    category: { name: 'Sách' },
    location: { city: 'Hà Nội' },
    ...overrides
  };
}

function reply(products, extra = {}) {
  return { products, total: products.length, totalPages: 1, ...extra };
}

function renderPage() {
  return render(
    <AppProviders language="vi" themeMode="light">
      <MemoryRouter future={future} initialEntries={['/my-products']}>
        <Routes>
          <Route path="/my-products" element={<MyProducts />} />
          <Route path="/login" element={<h1>Đăng nhập</h1>} />
        </Routes>
      </MemoryRouter>
    </AppProviders>
  );
}

function dialogWithTitle(title) {
  return screen.getByText(title, { selector: '.ant-modal-title' }).closest('[role="dialog"]');
}

beforeEach(() => {
  jest.clearAllMocks();
  mockUser = { _id: 'user-1' };
  window.scrollTo = jest.fn();
  productService.getMyProducts.mockResolvedValue(reply([product('a'), product('b', { status: 'hidden' })]));
});

test('signed-out visitors are sent to the sign-in page', async () => {
  mockUser = null;
  renderPage();
  expect(await screen.findByRole('heading', { name: 'Đăng nhập' })).toBeInTheDocument();
  expect(productService.getMyProducts).not.toHaveBeenCalled();
});

test('lists the listings with their status, price, category and city', async () => {
  renderPage();

  expect(await screen.findByRole('heading', { level: 1, name: 'Quản lý tin đăng' })).toBeInTheDocument();
  expect(screen.getByRole('radio', { name: 'Tất cả (2)' })).toBeChecked();
  expect(screen.getByText('Tin a')).toBeInTheDocument();
  expect(screen.getByText('Đang bán', { selector: '.ant-tag' })).toBeInTheDocument();
  expect(screen.getByText('Đã ẩn', { selector: '.ant-tag' })).toBeInTheDocument();
  expect(screen.getAllByText(/120\.000/)).toHaveLength(2);
  expect(screen.getAllByText('Sách')).toHaveLength(2);
  expect(screen.getAllByText('Hà Nội')).toHaveLength(2);
  expect(screen.getByRole('link', { name: 'Tạo tin mới' })).toHaveAttribute('href', '/product/create');
  expect(productService.getMyProducts).toHaveBeenCalledWith({ page: 1, limit: 20 });
});

test('an empty account shows its heading and a link to post the first listing', async () => {
  productService.getMyProducts.mockResolvedValue(reply([]));
  renderPage();

  expect(await screen.findByRole('heading', { name: 'Chưa có tin đăng nào' })).toBeInTheDocument();
  expect(screen.getByRole('link', { name: 'Đăng tin ngay' })).toHaveAttribute('href', '/product/create');
});

test('the status filter asks for that status from the first page', async () => {
  renderPage();
  await screen.findByText('Tin a');

  fireEvent.click(screen.getByRole('radio', { name: 'Đã bán' }));
  await waitFor(() => expect(productService.getMyProducts).toHaveBeenLastCalledWith({ page: 1, limit: 20, status: 'sold' }));
  expect(screen.getByRole('radio', { name: 'Đã bán' })).toBeChecked();
});

test('sold, in-transaction and deleted listings cannot be edited', async () => {
  productService.getMyProducts.mockResolvedValue(reply([
    product('s', { status: 'sold' }),
    product('p', { status: 'pending' }),
    product('o', { isInActiveOrder: true }),
    product('d', { status: 'deleted' })
  ]));
  renderPage();

  expect(await screen.findByText('Đã bán - chỉ xem')).toBeInTheDocument();
  expect(screen.getByText('Đang giao dịch - chỉ xem')).toBeInTheDocument();
  expect(screen.getByText('Đang trong đơn hàng - chỉ xem')).toBeInTheDocument();
  expect(screen.getByText('Tin đã xóa, không thể chỉnh sửa.')).toBeInTheDocument();
  expect(screen.queryByRole('button', { name: 'Xóa' })).not.toBeInTheDocument();
  expect(screen.queryByRole('link', { name: 'Sửa' })).not.toBeInTheDocument();
});

test('an editable listing links to its page and edit form', async () => {
  renderPage();
  await screen.findByText('Tin a');

  expect(screen.getAllByRole('link', { name: 'Xem' })[0]).toHaveAttribute('href', '/product/a');
  expect(screen.getAllByRole('link', { name: 'Sửa' })[0]).toHaveAttribute('href', '/product/a/edit');
});

test('deleting asks for confirmation, then removes the listing and reloads with a notice', async () => {
  productService.deleteProduct.mockResolvedValue({ success: true });
  productService.getMyProducts
    .mockResolvedValueOnce(reply([product('a'), product('b')]))
    .mockResolvedValueOnce(reply([product('b')]));
  renderPage();
  await screen.findByText('Tin a');

  fireEvent.click(screen.getAllByRole('button', { name: 'Xóa' })[0]);
  const dialog = await waitFor(() => dialogWithTitle('Xác nhận xóa'));
  expect(within(dialog).getByText('Bạn có chắc chắn muốn xóa sản phẩm "Tin a"?')).toBeInTheDocument();
  expect(productService.deleteProduct).not.toHaveBeenCalled();

  fireEvent.click(within(dialog).getByRole('button', { name: 'Xóa' }));
  expect(await screen.findByText('Đã xóa tin đăng thành công.')).toBeInTheDocument();
  expect(productService.deleteProduct).toHaveBeenCalledWith('a');
  await waitFor(() => expect(screen.queryByText('Tin a')).not.toBeInTheDocument());
  expect(screen.getByText('Đã xóa tin đăng thành công.')).toBeInTheDocument();
});

test('a failed deletion shows the server message', async () => {
  productService.deleteProduct.mockRejectedValue({ response: { data: { message: 'Tin đang trong đơn hàng.' } } });
  renderPage();
  await screen.findByText('Tin a');

  fireEvent.click(screen.getAllByRole('button', { name: 'Xóa' })[0]);
  const dialog = await waitFor(() => dialogWithTitle('Xác nhận xóa'));
  fireEvent.click(within(dialog).getByRole('button', { name: 'Xóa' }));

  expect(await screen.findByRole('alert')).toHaveTextContent('Tin đang trong đơn hàng.');
});

test('hiding and showing a listing both go through a confirmation', async () => {
  productService.updateProductVisibility.mockResolvedValue({ success: true });
  renderPage();
  await screen.findByText('Tin a');

  fireEvent.click(screen.getByRole('button', { name: 'Ẩn' }));
  const hide = await waitFor(() => dialogWithTitle('Ẩn tin đăng'));
  fireEvent.click(within(hide).getByRole('button', { name: 'Xác nhận' }));
  expect(await screen.findByText('Tin đăng đã được ẩn khỏi chợ.')).toBeInTheDocument();
  expect(productService.updateProductVisibility).toHaveBeenLastCalledWith('a', 'hidden');

  fireEvent.click(screen.getByRole('button', { name: 'Hiện' }));
  const show = await waitFor(() => dialogWithTitle('Hiện lại tin đăng'));
  fireEvent.click(within(show).getByRole('button', { name: 'Xác nhận' }));
  expect(await screen.findByText('Tin đăng đã được hiển thị lại.')).toBeInTheDocument();
  expect(productService.updateProductVisibility).toHaveBeenLastCalledWith('b', 'active');
});

test('a seller under a selling restriction cannot show a hidden listing again', async () => {
  mockUser = { _id: 'user-1', isSellingRestricted: true, sellingRestrictedReason: 'Vi phạm' };
  renderPage();
  await screen.findByText('Tin a');

  expect(screen.getByText(/Tài khoản của bạn đang bị hạn chế quyền bán\. Không thể hiện lại tin trong thời gian này\. Lý do: Vi phạm/)).toBeInTheDocument();
  expect(screen.getByRole('button', { name: 'Hiện' })).toBeDisabled();
  expect(screen.getByRole('button', { name: 'Hiện' })).toHaveAttribute('title', 'Tài khoản đang bị hạn chế quyền bán');
  expect(screen.getByRole('button', { name: 'Ẩn' })).toBeEnabled();
});

test('a long list is paged and the next page is requested', async () => {
  productService.getMyProducts
    .mockResolvedValueOnce(reply([product('a')], { total: 45, totalPages: 3 }))
    .mockResolvedValueOnce(reply([product('z')], { total: 45, totalPages: 3 }));
  renderPage();
  await screen.findByText('Tin a');

  fireEvent.click(screen.getByTitle('2'));
  await waitFor(() => expect(productService.getMyProducts).toHaveBeenLastCalledWith({ page: 2, limit: 20 }));
  expect(await screen.findByText('Tin z')).toBeInTheDocument();
});

test('a failed load shows an alert', async () => {
  const consoleError = jest.spyOn(console, 'error').mockImplementation(() => {});
  productService.getMyProducts.mockRejectedValue(new Error('network'));
  renderPage();

  expect(await screen.findByRole('alert')).toHaveTextContent('Không thể tải danh sách tin đăng.');
  consoleError.mockRestore();
});
