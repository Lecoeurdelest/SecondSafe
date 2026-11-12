import React from 'react';
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import CreateProduct from './CreateProduct';
import productService from '../../services/product.service';
import api from '../../services/api';
import { getProfile } from '../../services/user.service';
import AppProviders from '../../ui/AppProviders';

const mockUser = { _id: 'user-1' };
jest.mock('../../hooks/useAuth', () => ({ useAuth: () => ({ user: mockUser }) }));
jest.mock('../../services/product.service', () => ({ __esModule: true, default: { createProduct: jest.fn() } }));
jest.mock('../../services/api', () => ({ __esModule: true, default: { get: jest.fn(), post: jest.fn() } }));
jest.mock('../../services/user.service', () => ({ getProfile: jest.fn() }));
jest.mock('../../components/LocationSelector', () => ({
  __esModule: true,
  default: ({ onChange, errors }) => (
    <div>
      <button type="button" onClick={() => onChange({ city: 'Hà Nội', district: 'Ba Đình', ward: '', provinceCode: 1, districtCode: 10, wardCode: null })}>
        Chọn Ba Đình
      </button>
      {errors.city && <span>{errors.city}</span>}
      {errors.district && <span>{errors.district}</span>}
    </div>
  )
}));

const future = { v7_startTransition: true, v7_relativeSplatPath: true };
const CATEGORIES = [{ _id: 'cat-1', name: 'Sách', slug: 'books' }, { _id: 'cat-2', name: 'Đồ điện tử', slug: 'electronics' }, { _id: 'cat-3', name: 'Khác', slug: 'other' }];

function renderForm() {
  return render(
    <AppProviders language="vi" themeMode="light">
      <MemoryRouter future={future} initialEntries={['/product/create']}>
        <Routes>
          <Route path="/product/create" element={<CreateProduct />} />
          <Route path="/my-products" element={<h1>Tin của tôi</h1>} />
        </Routes>
      </MemoryRouter>
    </AppProviders>
  );
}

function pick(files) {
  fireEvent.change(screen.getByLabelText('Chọn ảnh sản phẩm', { selector: 'input' }), { target: { files } });
}

const png = (name = 'a.png') => new File(['x'], name, { type: 'image/png' });

beforeEach(() => {
  jest.clearAllMocks();
  global.URL.createObjectURL = jest.fn(() => 'blob:preview');
  global.URL.revokeObjectURL = jest.fn();
  api.get.mockResolvedValue({ data: { data: CATEGORIES } });
  getProfile.mockResolvedValue({ data: {} });
});

test('shows the form with the categories (without "Khác") and a disabled-looking empty summary', async () => {
  renderForm();

  expect(screen.getByRole('heading', { level: 1, name: 'Đăng tin mới' })).toBeInTheDocument();
  const group = screen.getByRole('group', { name: 'Chọn nhiều danh mục' });
  expect(await within(group).findByRole('button', { name: 'Sách' })).toHaveAttribute('aria-pressed', 'false');
  expect(within(group).getByRole('button', { name: 'Đồ điện tử' })).toBeInTheDocument();
  expect(within(group).queryByRole('button', { name: 'Khác' })).not.toBeInTheDocument();
  expect(screen.getByText('Tiêu đề tin đăng sẽ hiển thị tại đây')).toBeInTheDocument();
  expect(screen.getByText('0/5')).toBeInTheDocument();
  expect(screen.getByText('0%')).toBeInTheDocument();
});

test('submitting an empty form shows every inline error and sends nothing', async () => {
  renderForm();
  await screen.findByRole('button', { name: 'Sách' });

  fireEvent.click(screen.getByRole('button', { name: 'Đăng tin' }));

  expect(await screen.findByText('Vui lòng nhập tiêu đề')).toBeInTheDocument();
  expect(screen.getByText('Vui lòng nhập mô tả')).toBeInTheDocument();
  expect(screen.getByText('Vui lòng nhập giá hợp lệ')).toBeInTheDocument();
  expect(screen.getByText('Vui lòng chọn ít nhất 1 danh mục')).toBeInTheDocument();
  expect(screen.getByText('Vui lòng tải lên ít nhất 1 ảnh')).toBeInTheDocument();
  expect(screen.getByText('Vui lòng nhập thành phố')).toBeInTheDocument();
  expect(screen.getByText('Vui lòng nhập quận/huyện')).toBeInTheDocument();
  expect(api.post).not.toHaveBeenCalled();
  expect(productService.createProduct).not.toHaveBeenCalled();
});

test('the price accepts digits only, stops at nine digits and flags a value above the maximum', async () => {
  renderForm();
  const price = screen.getByLabelText('Giá bán (VNĐ)');

  fireEvent.change(price, { target: { value: '12a3.4' } });
  expect(price).toHaveValue('1234');

  fireEvent.change(price, { target: { value: '1234567890' } });
  expect(price).toHaveValue('123456789');
  expect(await screen.findByText('Giá tối đa là 100.000.000 VND')).toBeInTheDocument();
});

test('images are checked for type, size and count; previews can be removed', async () => {
  renderForm();

  pick([new File(['x'], 'a.gif', { type: 'image/gif' })]);
  expect(await screen.findByText('Chỉ cho phép tải lên ảnh JPG/JPEG hoặc PNG.')).toBeInTheDocument();

  pick([new File([new ArrayBuffer(6 * 1024 * 1024)], 'big.png', { type: 'image/png' })]);
  expect(await screen.findByText('Có ảnh vượt quá 5MB, vui lòng chọn lại.')).toBeInTheDocument();

  pick([png('1.png'), png('2.png')]);
  expect(await screen.findAllByRole('img', { name: /Preview/ })).toHaveLength(2);
  expect(screen.getByText('2/5')).toBeInTheDocument();
  expect(screen.getByText('2 ảnh')).toBeInTheDocument();

  pick([png('3.png'), png('4.png'), png('5.png'), png('6.png')]);
  expect(await screen.findByText('Bạn chỉ có thể tải lên tối đa 5 ảnh.')).toBeInTheDocument();

  fireEvent.click(screen.getAllByRole('button', { name: 'Xóa ảnh' })[0]);
  expect(screen.getAllByRole('img', { name: /Preview/ })).toHaveLength(1);
  expect(global.URL.revokeObjectURL).toHaveBeenCalledWith('blob:preview');
});

test('a complete form uploads the photos, creates the listing and goes to my products', async () => {
  api.post.mockResolvedValue({ data: { data: [{ path: '/uploads/products/user/a.png' }] } });
  productService.createProduct.mockResolvedValue({ _id: 'new-product' });
  renderForm();
  await screen.findByRole('button', { name: 'Sách' });

  fireEvent.change(screen.getByLabelText('Tiêu đề'), { target: { value: 'Sách giáo khoa lớp 10' } });
  fireEvent.click(screen.getByRole('button', { name: 'Sách' }));
  fireEvent.click(screen.getByRole('button', { name: 'Chọn Ba Đình' }));
  fireEvent.change(screen.getByLabelText('Giá bán (VNĐ)'), { target: { value: '45000' } });
  fireEvent.change(screen.getByLabelText('Mô tả chi tiết'), { target: { value: 'Còn mới 90%, không viết vẽ.' } });
  pick([png()]);
  await screen.findByRole('img', { name: 'Preview 1' });
  expect(screen.getByRole('button', { name: 'Sách' })).toHaveAttribute('aria-pressed', 'true');
  expect(screen.getByText('100%')).toBeInTheDocument();

  fireEvent.click(screen.getByRole('button', { name: 'Đăng tin' }));

  expect(await screen.findByRole('heading', { name: 'Tin của tôi' })).toBeInTheDocument();
  expect(api.post).toHaveBeenCalledWith('/upload/images', expect.any(FormData), { headers: { 'Content-Type': 'multipart/form-data' } });
  expect(productService.createProduct).toHaveBeenCalledWith({
    title: 'Sách giáo khoa lớp 10',
    description: 'Còn mới 90%, không viết vẽ.',
    price: 45000,
    category: 'cat-1',
    categories: ['cat-1'],
    otherCategory: '',
    condition: 'like-new',
    images: ['/uploads/products/user/a.png'],
    location: { city: 'Hà Nội', district: 'Ba Đình', ward: '' }
  });
  expect(await screen.findByText(/Đăng tin thành công/)).toBeInTheDocument();
});

test('a failed upload shows the error and keeps the form', async () => {
  const consoleError = jest.spyOn(console, 'error').mockImplementation(() => {});
  api.post.mockRejectedValue(new Error('network'));
  renderForm();
  await screen.findByRole('button', { name: 'Sách' });

  fireEvent.change(screen.getByLabelText('Tiêu đề'), { target: { value: 'Sách giáo khoa' } });
  fireEvent.click(screen.getByRole('button', { name: 'Sách' }));
  fireEvent.click(screen.getByRole('button', { name: 'Chọn Ba Đình' }));
  fireEvent.change(screen.getByLabelText('Giá bán (VNĐ)'), { target: { value: '45000' } });
  fireEvent.change(screen.getByLabelText('Mô tả chi tiết'), { target: { value: 'Còn mới.' } });
  pick([png()]);
  await screen.findByRole('img', { name: 'Preview 1' });
  fireEvent.click(screen.getByRole('button', { name: 'Đăng tin' }));

  expect(await screen.findByText('Không thể tải ảnh lên. Vui lòng thử lại.')).toBeInTheDocument();
  expect(productService.createProduct).not.toHaveBeenCalled();
  expect(screen.getByRole('heading', { level: 1, name: 'Đăng tin mới' })).toBeInTheDocument();
  consoleError.mockRestore();
});

test('the profile location is offered first and can be replaced by a custom one', async () => {
  getProfile.mockResolvedValue({ data: { location: { city: 'Đà Nẵng', district: 'Hải Châu', ward: 'Thạch Thang' } } });
  renderForm();

  expect(await screen.findByText('Thạch Thang, Hải Châu, Đà Nẵng', { selector: 'strong' })).toBeInTheDocument();
  expect(screen.queryByRole('button', { name: 'Chọn Ba Đình' })).not.toBeInTheDocument();
  expect(screen.getByText('Thạch Thang, Hải Châu, Đà Nẵng', { selector: '.ant-descriptions-item-content' })).toBeInTheDocument();

  fireEvent.click(screen.getByRole('button', { name: 'Tùy chỉnh' }));
  expect(screen.getByRole('button', { name: 'Chọn Ba Đình' })).toBeInTheDocument();
  expect(screen.getByRole('button', { name: 'Dùng hồ sơ' })).toBeInTheDocument();
  await waitFor(() => expect(screen.getByText('Chưa cập nhật', { selector: '.ant-descriptions-item-content' })).toBeInTheDocument());
});
