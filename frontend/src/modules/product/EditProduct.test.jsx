import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import EditProduct from './EditProduct';
import productService from '../../services/product.service';
import api from '../../services/api';
import AppProviders from '../../ui/AppProviders';

const mockUser = { _id: 'user-1' };
jest.mock('../../hooks/useAuth', () => ({ useAuth: () => ({ user: mockUser }) }));
jest.mock('../../services/product.service', () => ({
  __esModule: true,
  default: { getProductById: jest.fn(), updateProduct: jest.fn() }
}));
jest.mock('../../services/api', () => ({ __esModule: true, default: { get: jest.fn(), post: jest.fn() } }));

const future = { v7_startTransition: true, v7_relativeSplatPath: true };
const PRODUCT = {
  _id: 'product-1',
  title: 'Sách cũ',
  description: 'Còn tốt.',
  price: 50000,
  condition: 'good',
  category: { _id: 'cat-1' },
  seller: { _id: 'user-1' },
  images: ['http://localhost:5000/uploads/products/user/book.jpg', 'http://localhost:5000/uploads/products/user/book2.jpg'],
  location: { city: 'Hà Nội', district: 'Ba Đình', ward: 'Phúc Xá' }
};

function renderEdit() {
  return render(
    <AppProviders language="vi" themeMode="light">
      <MemoryRouter future={future} initialEntries={['/product/product-1/edit']}>
        <Routes>
          <Route path="/product/:id/edit" element={<EditProduct />} />
          <Route path="/product/:id" element={<h1>Chi tiết sản phẩm</h1>} />
          <Route path="/" element={<h1>Trang chủ</h1>} />
        </Routes>
      </MemoryRouter>
    </AppProviders>
  );
}

function pick(files) {
  fireEvent.change(screen.getByLabelText('Chọn ảnh sản phẩm', { selector: 'input' }), { target: { files } });
}

beforeEach(() => {
  jest.clearAllMocks();
  global.URL.createObjectURL = jest.fn(() => 'blob:new');
  global.URL.revokeObjectURL = jest.fn();
  api.get.mockResolvedValue({ data: { data: [{ _id: 'cat-1', name: 'Sách' }] } });
  productService.getProductById.mockResolvedValue(PRODUCT);
});

test('loads the listing into the form with the category locked', async () => {
  renderEdit();

  expect(await screen.findByRole('heading', { level: 1, name: 'Chỉnh sửa tin đăng' })).toBeInTheDocument();
  expect(screen.getByLabelText('Tiêu đề')).toHaveValue('Sách cũ');
  expect(screen.getByLabelText('Mô tả chi tiết')).toHaveValue('Còn tốt.');
  expect(screen.getByLabelText('Giá (VNĐ)')).toHaveValue(50000);
  expect(screen.getByLabelText('Thành phố')).toHaveValue('Hà Nội');
  expect(screen.getByLabelText('Quận/Huyện')).toHaveValue('Ba Đình');
  expect(screen.getByLabelText('Phường/Xã')).toHaveValue('Phúc Xá');
  expect(screen.getByRole('combobox', { name: 'Danh mục' })).toBeDisabled();
  expect(screen.getByText('Không thể thay đổi danh mục')).toBeInTheDocument();
  expect(screen.getAllByRole('img', { name: /Existing/ })).toHaveLength(2);
});

test('someone who does not own the listing is sent home with a message', async () => {
  productService.getProductById.mockResolvedValue({ ...PRODUCT, seller: { _id: 'someone-else' } });
  renderEdit();

  expect(await screen.findByRole('heading', { name: 'Trang chủ' })).toBeInTheDocument();
  expect(await screen.findByText('Bạn không có quyền chỉnh sửa sản phẩm này')).toBeInTheDocument();
});

test('clearing required fields shows inline errors and saves nothing', async () => {
  renderEdit();
  await screen.findByRole('heading', { name: 'Chỉnh sửa tin đăng' });

  fireEvent.change(screen.getByLabelText('Tiêu đề'), { target: { value: ' ' } });
  fireEvent.change(screen.getByLabelText('Mô tả chi tiết'), { target: { value: '' } });
  fireEvent.change(screen.getByLabelText('Giá (VNĐ)'), { target: { value: '' } });
  fireEvent.change(screen.getByLabelText('Thành phố'), { target: { value: '' } });
  fireEvent.change(screen.getByLabelText('Quận/Huyện'), { target: { value: '' } });
  fireEvent.click(screen.getByRole('button', { name: 'Cập nhật' }));

  expect(await screen.findByText('Vui lòng nhập tiêu đề')).toBeInTheDocument();
  expect(screen.getByText('Vui lòng nhập mô tả')).toBeInTheDocument();
  expect(screen.getByText('Vui lòng nhập giá hợp lệ')).toBeInTheDocument();
  expect(screen.getByText('Vui lòng nhập thành phố')).toBeInTheDocument();
  expect(screen.getByText('Vui lòng nhập quận/huyện')).toBeInTheDocument();
  expect(productService.updateProduct).not.toHaveBeenCalled();
});

test('removing the last photo is refused and the photo limit is explained', async () => {
  renderEdit();
  await screen.findAllByRole('img', { name: /Existing/ });

  pick([new File(['x'], 'a.png', { type: 'image/png' }), new File(['x'], 'b.png', { type: 'image/png' }), new File(['x'], 'c.png', { type: 'image/png' }), new File(['x'], 'd.png', { type: 'image/png' })]);
  expect(await screen.findByText('Bạn chỉ có thể có tối đa 5 ảnh')).toBeInTheDocument();

  pick([new File([new ArrayBuffer(6 * 1024 * 1024)], 'big.png', { type: 'image/png' })]);
  expect(await screen.findByText('Mỗi ảnh không được vượt quá 5MB')).toBeInTheDocument();

  fireEvent.click(screen.getAllByRole('button', { name: 'Xóa ảnh' })[0]);
  fireEvent.click(screen.getAllByRole('button', { name: 'Xóa ảnh' })[0]);
  fireEvent.click(screen.getByRole('button', { name: 'Cập nhật' }));
  expect(await screen.findByText('Vui lòng có ít nhất 1 ảnh')).toBeInTheDocument();
  expect(productService.updateProduct).not.toHaveBeenCalled();
});

test('saving uploads the new photo, keeps the old ones in order and returns to the listing', async () => {
  api.post.mockResolvedValue({ data: { data: [{ path: '/uploads/products/user/new.png' }] } });
  productService.updateProduct.mockResolvedValue({ _id: 'product-1' });
  renderEdit();
  await screen.findAllByRole('img', { name: /Existing/ });

  fireEvent.change(screen.getByLabelText('Tiêu đề'), { target: { value: 'Sách cũ, còn mới' } });
  fireEvent.change(screen.getByLabelText('Phường/Xã'), { target: { value: 'Liễu Giai' } });
  pick([new File(['x'], 'new.png', { type: 'image/png' })]);
  expect(await screen.findByRole('img', { name: 'New 1' })).toBeInTheDocument();
  fireEvent.click(screen.getAllByRole('button', { name: 'Xóa ảnh' })[1]);

  fireEvent.click(screen.getByRole('button', { name: 'Cập nhật' }));

  expect(await screen.findByRole('heading', { name: 'Chi tiết sản phẩm' })).toBeInTheDocument();
  expect(api.post).toHaveBeenCalledWith('/upload/images', expect.any(FormData), { headers: { 'Content-Type': 'multipart/form-data' } });
  expect(productService.updateProduct).toHaveBeenCalledWith('product-1', {
    title: 'Sách cũ, còn mới',
    description: 'Còn tốt.',
    price: 50000,
    condition: 'good',
    images: ['http://localhost:5000/uploads/products/user/book.jpg', '/uploads/products/user/new.png'],
    location: { city: 'Hà Nội', district: 'Ba Đình', ward: 'Liễu Giai' }
  });
  expect(await screen.findByText('Sản phẩm đã được cập nhật thành công!')).toBeInTheDocument();
});

test('a failed save shows the server message and stays on the form', async () => {
  productService.updateProduct.mockRejectedValue({ response: { data: { message: 'Tin đang trong đơn hàng, không thể sửa.' } } });
  renderEdit();
  await screen.findAllByRole('img', { name: /Existing/ });

  fireEvent.click(screen.getByRole('button', { name: 'Cập nhật' }));

  expect(await screen.findByText('Tin đang trong đơn hàng, không thể sửa.')).toBeInTheDocument();
  expect(screen.getByRole('heading', { level: 1, name: 'Chỉnh sửa tin đăng' })).toBeInTheDocument();
});
