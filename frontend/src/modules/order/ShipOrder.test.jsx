import React from 'react';
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import ShipOrder from './ShipOrder';
import { confirmShipment } from '../../services/order.service';
import AppProviders from '../../ui/AppProviders';

jest.mock('../../hooks/useAuth', () => ({ useAuth: () => ({ user: { fullName: 'Người Bán', phone: '0900000000' } }) }));
jest.mock('../../services/order.service', () => ({ confirmShipment: jest.fn() }));
jest.mock('../../components/LocationSelector', () => function LocationSelector({ onChange }) {
  return (
    <button
      type="button"
      onClick={() => onChange({ city: 'TP HCM', district: 'Quận 1', ward: 'Phường 1', provinceCode: 79, districtCode: 760, wardCode: 26734 })}
    >
      Chọn khu vực giả lập
    </button>
  );
});

const tomorrow = new Date(Date.now() + 86400000).toISOString().slice(0, 10);

function makeOrder(overrides = {}) {
  return {
    _id: 'abcdef1234567890',
    orderCode: 'SS2001',
    status: 'paid',
    totalAmount: 520000,
    createdAt: '2026-11-01T08:00:00.000Z',
    listing: { title: 'Máy ảnh film cũ', specificAddress: 'Số 5 Xuân Thủy', location: { city: 'Hà Nội', district: 'Cầu Giấy', ward: 'Dịch Vọng' } },
    buyer: { fullName: 'Nguyễn Văn An', phone: '0911111111', address: '12 Lê Lợi' },
    ...overrides
  };
}

function renderDialog(order = makeOrder()) {
  const handlers = { onClose: jest.fn(), onSuccess: jest.fn() };
  render(
    <AppProviders language="vi" themeMode="light">
      <ShipOrder order={order} {...handlers} />
    </AppProviders>
  );
  return handlers;
}

function fillDate(value = tomorrow) {
  fireEvent.change(screen.getByLabelText(/Ngày dự kiến giao hàng/), { target: { value } });
}

async function chooseProvider(optionText) {
  fireEvent.mouseDown(screen.getByRole('combobox', { name: /Đơn vị vận chuyển/ }));
  fireEvent.click(await screen.findByText(optionText, { selector: '.ant-select-item-option-content' }));
}

beforeEach(() => {
  jest.clearAllMocks();
  confirmShipment.mockResolvedValue({});
});

test('shows the order, a generated tracking code and the default pickup point from the listing', () => {
  renderDialog();

  const dialog = screen.getByRole('dialog');
  expect(within(dialog).getByText('Xác nhận giao hàng', { selector: '.ant-modal-title' })).toBeInTheDocument();
  expect(within(dialog).getByText('#SS2001')).toBeInTheDocument();
  expect(within(dialog).getByText('Máy ảnh film cũ')).toBeInTheDocument();
  expect(within(dialog).getByText('Đã thanh toán')).toBeInTheDocument();
  expect(within(dialog).getByText('Nguyễn Văn An')).toBeInTheDocument();
  expect(within(dialog).getByText('0911111111')).toBeInTheDocument();
  expect(within(dialog).getByText('12 Lê Lợi')).toBeInTheDocument();
  expect(within(dialog).getByText('Số 5 Xuân Thủy, Dịch Vọng, Cầu Giấy, Hà Nội')).toBeInTheDocument();
  expect(within(dialog).getByText('Người Bán')).toBeInTheDocument();
  expect(within(dialog).getByText('0900000000')).toBeInTheDocument();
  expect(screen.getByLabelText(/Mã vận đơn/).value).toMatch(/^GHN-SS2001-[A-Z0-9]{6}$/);
  expect(screen.getByLabelText(/Mã vận đơn/)).toHaveAttribute('readonly');
});

test('choosing another carrier regenerates the tracking code with its prefix', async () => {
  renderDialog();

  await chooseProvider('Viettel Post');
  expect(screen.getByLabelText(/Mã vận đơn/).value).toMatch(/^VIET-SS2001-[A-Z0-9]{6}$/);
});

test('a missing or past delivery date is rejected and nothing is sent', async () => {
  renderDialog();

  fireEvent.click(screen.getByRole('button', { name: 'Xác nhận giao hàng' }));
  expect(await screen.findByText('Vui lòng chọn ngày dự kiến giao hàng')).toBeInTheDocument();

  fillDate('2000-01-01');
  fireEvent.click(screen.getByRole('button', { name: 'Xác nhận giao hàng' }));
  expect(await screen.findByText('Ngày giao hàng không thể là ngày trong quá khứ')).toBeInTheDocument();
  expect(confirmShipment).not.toHaveBeenCalled();
});

test('a listing without an address asks the seller to customise the pickup point', async () => {
  renderDialog(makeOrder({ listing: { title: 'Máy ảnh film cũ', location: {} } }));

  fillDate();
  fireEvent.click(screen.getByRole('button', { name: 'Xác nhận giao hàng' }));
  expect(await screen.findByRole('alert')).toHaveTextContent('Địa chỉ thiếu. Vui lòng bật Tùy chỉnh để thêm địa chỉ giao hàng.');
  expect(confirmShipment).not.toHaveBeenCalled();
});

test('a valid shipment sends the carrier, code, date, notes and the default pickup point', async () => {
  const { onSuccess } = renderDialog();

  fillDate();
  fireEvent.change(screen.getByLabelText(/Ghi chú thêm/), { target: { value: '  Gọi trước khi giao  ' } });
  expect(screen.getByText(`${'  Gọi trước khi giao  '.length}/500 ký tự`)).toBeInTheDocument();
  fireEvent.click(screen.getByRole('button', { name: 'Xác nhận giao hàng' }));

  await waitFor(() => expect(confirmShipment).toHaveBeenCalledWith('abcdef1234567890', {
    trackingNumber: expect.stringMatching(/^GHN-SS2001-[A-Z0-9]{6}$/),
    shippingProvider: 'ghn',
    estimatedDelivery: tomorrow,
    notes: 'Gọi trước khi giao',
    shippingRecipientName: 'Người Bán',
    shippingPhone: '0900000000',
    shippingAddress: 'Số 5 Xuân Thủy, Dịch Vọng, Cầu Giấy, Hà Nội'
  }));
  await waitFor(() => expect(onSuccess).toHaveBeenCalledTimes(1));
});

test('a custom pickup point needs a sender, a phone, an area and a street address', async () => {
  const { onSuccess } = renderDialog(makeOrder({ listing: { title: 'Máy ảnh film cũ', location: {} } }));

  fillDate();
  fireEvent.click(screen.getByRole('checkbox', { name: 'Tùy chỉnh điểm lấy hàng' }));
  fireEvent.change(screen.getByLabelText(/Họ tên người gửi/), { target: { value: ' ' } });
  fireEvent.change(screen.getByLabelText(/Số điện thoại gửi hàng/), { target: { value: '' } });
  fireEvent.click(screen.getByRole('button', { name: 'Xác nhận giao hàng' }));

  expect(await screen.findByText('Vui lòng nhập người nhận hàng')).toBeInTheDocument();
  expect(screen.getByText('Vui lòng nhập số điện thoại nhận hàng')).toBeInTheDocument();
  expect(screen.getByText('Vui lòng chọn đầy đủ cấp độ Khu vực')).toBeInTheDocument();
  expect(screen.getByText('Vui lòng nhập Địa chỉ cụ thể')).toBeInTheDocument();

  fireEvent.change(screen.getByLabelText(/Họ tên người gửi/), { target: { value: 'Kho Bích' } });
  fireEvent.change(screen.getByLabelText(/Số điện thoại gửi hàng/), { target: { value: '0922222222' } });
  fireEvent.click(screen.getByRole('button', { name: 'Chọn khu vực giả lập' }));
  fireEvent.change(screen.getByLabelText(/Địa chỉ cụ thể/), { target: { value: 'Số 10 Ngõ 20' } });
  fireEvent.click(screen.getByRole('button', { name: 'Xác nhận giao hàng' }));

  await waitFor(() => expect(confirmShipment).toHaveBeenCalledWith('abcdef1234567890', expect.objectContaining({
    shippingRecipientName: 'Kho Bích',
    shippingPhone: '0922222222',
    shippingAddress: 'Số 10 Ngõ 20, Phường 1, Quận 1, TP HCM'
  })));
  await waitFor(() => expect(onSuccess).toHaveBeenCalled());
});

test('switching the custom pickup point off restores the defaults', () => {
  renderDialog();

  fireEvent.click(screen.getByRole('checkbox', { name: 'Tùy chỉnh điểm lấy hàng' }));
  fireEvent.change(screen.getByLabelText(/Họ tên người gửi/), { target: { value: 'Kho Bích' } });
  fireEvent.click(screen.getByRole('checkbox', { name: 'Tùy chỉnh điểm lấy hàng' }));

  expect(screen.queryByLabelText(/Họ tên người gửi/)).not.toBeInTheDocument();
  expect(screen.getByText('Người Bán')).toBeInTheDocument();
});

test('notes longer than 500 characters are rejected', async () => {
  renderDialog();

  fillDate();
  fireEvent.change(screen.getByLabelText(/Ghi chú thêm/), { target: { value: 'a'.repeat(501) } });
  fireEvent.click(screen.getByRole('button', { name: 'Xác nhận giao hàng' }));

  expect(await screen.findByText('Ghi chú không được quá 500 ký tự')).toBeInTheDocument();
  expect(confirmShipment).not.toHaveBeenCalled();
});

test('a failed request shows the reason and keeps the dialog open', async () => {
  const consoleError = jest.spyOn(console, 'error').mockImplementation(() => {});
  confirmShipment.mockRejectedValue(new Error('Đơn hàng không còn ở trạng thái đã thanh toán'));
  const { onSuccess } = renderDialog();

  fillDate();
  fireEvent.click(screen.getByRole('button', { name: 'Xác nhận giao hàng' }));

  expect(await screen.findByRole('alert')).toHaveTextContent('Đơn hàng không còn ở trạng thái đã thanh toán');
  expect(onSuccess).not.toHaveBeenCalled();
  consoleError.mockRestore();
});

test('cancel closes the dialog without sending anything', () => {
  const { onClose } = renderDialog();

  fireEvent.click(screen.getByRole('button', { name: 'Hủy' }));
  expect(onClose).toHaveBeenCalledTimes(1);
  expect(confirmShipment).not.toHaveBeenCalled();
});
