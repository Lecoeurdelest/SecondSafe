import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import EditProfile from './EditProfile';
import { getProfile, updateProfile, uploadAvatar } from '../../services/user.service';
import AppProviders from '../../ui/AppProviders';

const mockRefresh = jest.fn();
jest.mock('../../hooks/useAuth', () => ({ useAuth: () => ({ refreshUser: mockRefresh }) }));
jest.mock('../../services/user.service', () => ({ getProfile: jest.fn(), updateProfile: jest.fn(), uploadAvatar: jest.fn() }));
jest.mock('../../components/LocationSelector', () => ({
  __esModule: true,
  default: ({ value, onChange }) => (
    <button type="button" onClick={() => onChange({ city: 'Đà Nẵng', district: 'Hải Châu', ward: '', provinceCode: 48, districtCode: 492, wardCode: null })}>
      Khu vực hiện tại: {value.city || 'chưa chọn'}
    </button>
  )
}));

const future = { v7_startTransition: true, v7_relativeSplatPath: true };
const PROFILE = {
  fullName: 'Nguyễn Văn An',
  phone: '0912345678',
  address: 'Hà Nội',
  specificAddress: 'Số 10 Ngõ 20',
  location: { city: 'Hà Nội', district: 'Ba Đình', ward: '', provinceCode: 1, districtCode: 10, wardCode: null },
  avatar: ''
};

function renderEdit() {
  return render(
    <AppProviders language="vi" themeMode="light">
      <MemoryRouter future={future} initialEntries={['/profile/edit']}>
        <Routes>
          <Route path="/profile/edit" element={<EditProfile />} />
          <Route path="/profile" element={<h1>Thông tin tài khoản</h1>} />
        </Routes>
      </MemoryRouter>
    </AppProviders>
  );
}

async function ready() {
  await screen.findByRole('heading', { level: 1, name: 'Chỉnh sửa thông tin' });
}

beforeEach(() => {
  jest.clearAllMocks();
  getProfile.mockResolvedValue({ data: PROFILE });
  updateProfile.mockResolvedValue({ success: true });
  uploadAvatar.mockResolvedValue({ success: true });
  mockRefresh.mockResolvedValue();
});

test('loads the saved details into the form', async () => {
  renderEdit();
  await ready();

  expect(screen.getByLabelText('Họ và tên')).toHaveValue('Nguyễn Văn An');
  expect(screen.getByLabelText('Số điện thoại')).toHaveValue('0912345678');
  expect(screen.getByLabelText('Địa chỉ cụ thể (Số nhà, tên đường...)')).toHaveValue('Số 10 Ngõ 20');
  expect(document.querySelector('.ant-input-data-count')).toHaveTextContent(/12\s*\/\s*200/);
  expect(screen.getByRole('button', { name: /Khu vực hiện tại: Hà Nội/ })).toBeInTheDocument();
});

test('an empty name and a malformed phone number are refused with a message', async () => {
  renderEdit();
  await ready();

  fireEvent.change(screen.getByLabelText('Họ và tên'), { target: { value: '  ' } });
  fireEvent.click(screen.getByRole('button', { name: 'Lưu thay đổi' }));
  expect(await screen.findByRole('alert')).toHaveTextContent('Vui lòng nhập họ tên');

  fireEvent.change(screen.getByLabelText('Họ và tên'), { target: { value: 'An' } });
  fireEvent.change(screen.getByLabelText('Số điện thoại'), { target: { value: '12ab' } });
  fireEvent.click(screen.getByRole('button', { name: 'Lưu thay đổi' }));
  await waitFor(() => expect(screen.getByRole('alert')).toHaveTextContent('Số điện thoại không hợp lệ (10-11 số)'));
  expect(updateProfile).not.toHaveBeenCalled();
});

test('only image files up to 5 MB are accepted as an avatar', async () => {
  renderEdit();
  await ready();
  const input = screen.getByLabelText('Chọn ảnh đại diện', { selector: 'input' });

  fireEvent.change(input, { target: { files: [new File(['x'], 'a.pdf', { type: 'application/pdf' })] } });
  expect(await screen.findByRole('alert')).toHaveTextContent('Vui lòng chọn file ảnh');

  fireEvent.change(input, { target: { files: [new File([new ArrayBuffer(6 * 1024 * 1024)], 'big.png', { type: 'image/png' })] } });
  await waitFor(() => expect(screen.getByRole('alert')).toHaveTextContent('Kích thước ảnh không được vượt quá 5MB'));
});

test('saving uploads the new avatar, sends the trimmed details with the chosen area and refreshes the session', async () => {
  renderEdit();
  await ready();

  fireEvent.change(screen.getByLabelText('Họ và tên'), { target: { value: '  Nguyễn Văn Bình ' } });
  fireEvent.change(screen.getByLabelText('Số điện thoại'), { target: { value: '0987654321' } });
  fireEvent.click(screen.getByRole('button', { name: /Khu vực hiện tại/ }));
  fireEvent.change(screen.getByLabelText('Chọn ảnh đại diện', { selector: 'input' }), { target: { files: [new File(['x'], 'a.png', { type: 'image/png' })] } });
  fireEvent.click(screen.getByRole('button', { name: 'Lưu thay đổi' }));

  expect(await screen.findByRole('status')).toHaveTextContent('Cập nhật thông tin thành công!');
  expect(uploadAvatar).toHaveBeenCalledTimes(1);
  expect(updateProfile).toHaveBeenCalledWith({
    fullName: 'Nguyễn Văn Bình',
    phone: '0987654321',
    address: 'Hà Nội',
    specificAddress: 'Số 10 Ngõ 20',
    location: { city: 'Đà Nẵng', district: 'Hải Châu', ward: '', provinceCode: 48, districtCode: 492, wardCode: null }
  });
  expect(mockRefresh).toHaveBeenCalled();
  expect(await screen.findByRole('heading', { name: 'Thông tin tài khoản' }, { timeout: 4000 })).toBeInTheDocument();
});

test('a rejected save shows the server message and keeps the form', async () => {
  updateProfile.mockRejectedValue({ response: { data: { message: 'Số điện thoại đã được sử dụng.' } } });
  renderEdit();
  await ready();

  fireEvent.click(screen.getByRole('button', { name: 'Lưu thay đổi' }));
  expect(await screen.findByRole('alert')).toHaveTextContent('Số điện thoại đã được sử dụng.');
  expect(screen.getByRole('heading', { level: 1, name: 'Chỉnh sửa thông tin' })).toBeInTheDocument();
});

test('a failed load shows an alert', async () => {
  const consoleError = jest.spyOn(console, 'error').mockImplementation(() => {});
  getProfile.mockRejectedValue(new Error('network'));
  renderEdit();
  expect(await screen.findByRole('alert')).toHaveTextContent('Không thể tải thông tin profile');
  consoleError.mockRestore();
});
