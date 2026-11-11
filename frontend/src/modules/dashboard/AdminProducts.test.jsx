import React from 'react';
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import AdminProducts from './AdminProducts';
import dashboardService from '../../services/dashboard.service';

jest.mock('../../services/dashboard.service', () => ({
  __esModule: true,
  default: {
    getAdminProducts: jest.fn(),
    getAdminProductCategories: jest.fn(),
    updateAdminProduct: jest.fn(),
    uploadAdminProductImages: jest.fn(),
    updateAdminProductVisibility: jest.fn()
  }
}));

beforeEach(() => {
  jest.clearAllMocks();
  dashboardService.getAdminProducts.mockResolvedValue({
    products: [{
      _id: 'product-1',
      title: 'Sách đã qua sử dụng',
      description: 'Mô tả sản phẩm',
      price: 50000,
      status: 'active',
      condition: 'good',
      images: ['/uploads/products/seller-1/book.jpg'],
      category: { _id: 'category-1', name: 'Sách' },
      location: { city: 'Hà Nội', district: 'Cầu Giấy' },
      seller: { fullName: 'Người bán A' }
    }],
    total: 1,
    totalPages: 1
  });
  dashboardService.getAdminProductCategories.mockResolvedValue([
    { _id: 'category-1', name: 'Sách' },
    { _id: 'category-2', name: 'Đồ điện tử' }
  ]);
  dashboardService.uploadAdminProductImages.mockResolvedValue([]);
  dashboardService.updateAdminProduct.mockResolvedValue({ _id: 'product-1' });
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

test('admin can edit listing details and upload an additional image', async () => {
  dashboardService.uploadAdminProductImages.mockResolvedValue(['/uploads/products/admin/image.png']);
  render(
    <MemoryRouter initialEntries={['/admin/products']} future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <AdminProducts />
    </MemoryRouter>
  );

  fireEvent.click(await screen.findByRole('button', { name: 'Chỉnh sửa' }));
  const dialog = await screen.findByRole('dialog', { name: 'Chỉnh sửa sản phẩm' });
  fireEvent.change(screen.getByLabelText('Tên sản phẩm'), { target: { value: 'Sách đã chỉnh sửa' } });
  fireEvent.change(screen.getByLabelText('Giá (VND)'), { target: { value: '65000' } });
  const file = new File(['image'], 'cover.png', { type: 'image/png' });
  fireEvent.change(screen.getByLabelText('Thêm ảnh sản phẩm'), { target: { files: [file] } });

  fireEvent.click(within(dialog).getByRole('button', { name: 'Lưu thay đổi' }));

  await waitFor(() => expect(dashboardService.uploadAdminProductImages).toHaveBeenCalledWith([file]));
  await waitFor(() => expect(dashboardService.updateAdminProduct).toHaveBeenCalledWith('product-1', expect.objectContaining({
    title: 'Sách đã chỉnh sửa',
    price: 65000,
    category: 'category-1',
    images: ['/uploads/products/seller-1/book.jpg', '/uploads/products/admin/image.png']
  })));
});

test('admin cannot start editing a sold product', async () => {
  dashboardService.getAdminProducts.mockResolvedValue({
    products: [{
      _id: 'product-sold',
      title: 'Sản phẩm đã bán',
      price: 50000,
      status: 'sold',
      images: [],
      category: { name: 'Sách' },
      seller: { fullName: 'Người bán A' }
    }],
    total: 1,
    totalPages: 1
  });
  render(
    <MemoryRouter initialEntries={['/admin/products']} future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <AdminProducts />
    </MemoryRouter>
  );

  expect(await screen.findByText('Sản phẩm đã bán')).toBeInTheDocument();
  expect(screen.queryByRole('button', { name: 'Chỉnh sửa' })).not.toBeInTheDocument();
});
