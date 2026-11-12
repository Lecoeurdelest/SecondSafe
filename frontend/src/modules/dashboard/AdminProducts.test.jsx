import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import AdminProducts from './AdminProducts';
import dashboardService from '../../services/dashboard.service';

jest.mock('../../services/dashboard.service', () => ({
  __esModule: true,
  default: {
    getAdminProducts: jest.fn(),
    updateAdminProductVisibility: jest.fn()
  }
}));

beforeEach(() => {
  jest.clearAllMocks();
  dashboardService.getAdminProducts.mockResolvedValue({
    products: [{
      _id: 'product-1',
      title: 'Sách đã qua sử dụng',
      price: 50000,
      status: 'active',
      images: [],
      category: { name: 'Sách' },
      seller: { fullName: 'Người bán A' }
    }],
    total: 1,
    totalPages: 1
  });
  dashboardService.updateAdminProductVisibility.mockResolvedValue({ status: 'hidden' });
});

test('admin can search products and hide an active listing', async () => {
  render(
    <MemoryRouter initialEntries={['/admin/products']} future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <AdminProducts />
    </MemoryRouter>
  );

  expect(await screen.findByText('Sách đã qua sử dụng')).toBeInTheDocument();
  expect(screen.getByText('Người bán A')).toBeInTheDocument();
  expect(screen.getByRole('link', { name: 'Quản lý sản phẩm' }).closest('li')).toHaveClass('ant-menu-item-selected');
  expect(screen.getByRole('link', { name: 'Tổng quan' }).closest('li')).not.toHaveClass('ant-menu-item-selected');

  fireEvent.change(screen.getByLabelText('Tìm theo tên sản phẩm'), { target: { value: 'sách' } });
  fireEvent.click(screen.getByRole('button', { name: 'Tìm kiếm' }));
  await waitFor(() => expect(dashboardService.getAdminProducts).toHaveBeenLastCalledWith({
    page: 1,
    limit: 20,
    search: 'sách',
    status: 'all'
  }));

  fireEvent.click(await screen.findByRole('button', { name: 'Ẩn tin' }));
  await waitFor(() => expect(dashboardService.updateAdminProductVisibility).toHaveBeenCalledWith('product-1', 'hidden'));
  expect(await screen.findByRole('status')).toHaveTextContent('Đã ẩn sản phẩm.');
});

function renderProducts() {
  return render(
    <MemoryRouter initialEntries={['/admin/products']} future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <AdminProducts />
    </MemoryRouter>
  );
}

test('the status filter reloads the first page with that status and a hidden listing can be restored', async () => {
  dashboardService.getAdminProducts.mockResolvedValue({
    products: [{ _id: 'product-2', title: 'Tin đã ẩn', price: 30000, status: 'hidden', images: [], category: null, seller: null }],
    total: 1,
    totalPages: 1
  });
  renderProducts();

  expect(await screen.findByText('Tin đã ẩn')).toBeInTheDocument();
  expect(screen.getByText('Chưa phân loại')).toBeInTheDocument();
  expect(screen.getByText('Không rõ')).toBeInTheDocument();
  expect(screen.getByText('Đang ẩn', { selector: '.ant-tag' })).toBeInTheDocument();

  fireEvent.mouseDown(screen.getByRole('combobox', { name: 'Trạng thái' }));
  fireEvent.click(await screen.findByText('Bị từ chối', { selector: '.ant-select-item-option-content' }));
  await waitFor(() => expect(dashboardService.getAdminProducts).toHaveBeenLastCalledWith({ page: 1, limit: 20, search: '', status: 'rejected' }));

  fireEvent.click(await screen.findByRole('button', { name: 'Khôi phục' }));
  await waitFor(() => expect(dashboardService.updateAdminProductVisibility).toHaveBeenCalledWith('product-2', 'active'));
  expect(await screen.findByText('Đã khôi phục sản phẩm.')).toBeInTheDocument();
});

test('sold and deleted listings have no actions, and an empty result says so', async () => {
  dashboardService.getAdminProducts.mockResolvedValue({
    products: [{ _id: 'product-3', title: 'Tin đã bán', price: 30000, status: 'sold', images: [], seller: { fullName: 'Người bán B' } }],
    total: 1,
    totalPages: 1
  });
  const { unmount } = renderProducts();
  expect(await screen.findByText('Tin đã bán')).toBeInTheDocument();
  expect(screen.queryByRole('button', { name: /Ẩn tin|Khôi phục/ })).not.toBeInTheDocument();
  unmount();

  dashboardService.getAdminProducts.mockResolvedValue({ products: [], total: 0, totalPages: 0 });
  renderProducts();
  expect(await screen.findByText('Không tìm thấy sản phẩm phù hợp.')).toBeInTheDocument();
});

test('a failed load and a failed update each show an alert', async () => {
  dashboardService.getAdminProducts.mockRejectedValueOnce(new Error('Mất kết nối'));
  const { unmount } = renderProducts();
  expect(await screen.findByRole('alert')).toHaveTextContent('Mất kết nối');
  unmount();

  dashboardService.updateAdminProductVisibility.mockRejectedValue(new Error('Không có quyền'));
  renderProducts();
  fireEvent.click(await screen.findByRole('button', { name: 'Ẩn tin' }));
  expect(await screen.findByRole('alert')).toHaveTextContent('Không có quyền');
});

test('more than one page shows a pager that loads the chosen page', async () => {
  dashboardService.getAdminProducts.mockResolvedValue({
    products: [{ _id: 'product-1', title: 'Sách đã qua sử dụng', price: 50000, status: 'active', images: [], seller: { fullName: 'Người bán A' } }],
    total: 45,
    totalPages: 3
  });
  renderProducts();

  await screen.findByText('Sách đã qua sử dụng');
  fireEvent.click(screen.getByTitle('2'));
  await waitFor(() => expect(dashboardService.getAdminProducts).toHaveBeenLastCalledWith({ page: 2, limit: 20, search: '', status: 'all' }));
});
