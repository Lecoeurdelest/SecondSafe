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
  expect(screen.getByRole('link', { name: 'Quản lý sản phẩm' })).toHaveClass('dashboard-sidebar__item--active');

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
