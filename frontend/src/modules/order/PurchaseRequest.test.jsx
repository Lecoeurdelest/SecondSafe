import React from 'react';
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import PurchaseRequest from './PurchaseRequest';
import { createPurchaseRequest } from '../../services/order.service';
import AppProviders from '../../ui/AppProviders';

jest.mock('../../services/order.service', () => ({
  createPurchaseRequest: jest.fn()
}));

const product = {
  _id: 'p1',
  title: 'Máy ảnh film cũ',
  price: 500000,
  images: [],
  seller: { fullName: 'Trần Thị Bích' }
};

function renderDialog(props = {}) {
  const handlers = { onClose: jest.fn(), onSuccess: jest.fn() };
  render(
    <AppProviders language="vi" themeMode="light">
      <PurchaseRequest product={product} {...handlers} {...props} />
    </AppProviders>
  );
  return handlers;
}

beforeEach(() => {
  jest.clearAllMocks();
  createPurchaseRequest.mockResolvedValue({ success: true, data: { _id: 'order-1' } });
});

test('shows the listing, the seller and the total, with the message and price fields to fill in', () => {
  renderDialog();

  const dialog = screen.getByRole('dialog');
  expect(within(dialog).getByText('Gửi yêu cầu mua hàng', { selector: '.ant-modal-title' })).toBeInTheDocument();
  expect(within(dialog).getByRole('heading', { name: 'Máy ảnh film cũ' })).toBeInTheDocument();
  expect(within(dialog).getAllByText('500.000 VND', { selector: 'strong' })).toHaveLength(2);
  expect(within(dialog).getByText('Trần Thị Bích')).toBeInTheDocument();
  expect(within(dialog).getByText('0/500 ký tự')).toBeInTheDocument();
  expect(within(dialog).getByText('Giá tối thiểu: 500.000 VND')).toBeInTheDocument();
  expect(within(dialog).getByRole('spinbutton', { name: /Giá đề nghị/ })).toHaveValue('500000');
});

test('empty, short and undervalued requests are rejected with the same messages and send nothing', async () => {
  renderDialog();

  fireEvent.click(screen.getByRole('button', { name: 'Gửi yêu cầu' }));
  expect(await screen.findByText('Vui lòng nhập tin nhắn')).toBeInTheDocument();
  expect(createPurchaseRequest).not.toHaveBeenCalled();

  fireEvent.change(screen.getByRole('textbox', { name: /Tin nhắn cho người bán/ }), { target: { value: 'Ngắn' } });
  expect(screen.queryByText('Vui lòng nhập tin nhắn')).not.toBeInTheDocument();
  fireEvent.click(screen.getByRole('button', { name: 'Gửi yêu cầu' }));
  expect(await screen.findByText('Tin nhắn phải có ít nhất 10 ký tự')).toBeInTheDocument();

  fireEvent.change(screen.getByRole('textbox', { name: /Tin nhắn cho người bán/ }), { target: { value: 'Tôi muốn mua máy này' } });
  fireEvent.change(screen.getByRole('spinbutton', { name: /Giá đề nghị/ }), { target: { value: '400000' } });
  fireEvent.click(screen.getByRole('button', { name: 'Gửi yêu cầu' }));
  expect(await screen.findByText('Giá đề nghị phải bằng hoặc cao hơn giá sản phẩm')).toBeInTheDocument();
  expect(createPurchaseRequest).not.toHaveBeenCalled();
});

test('a valid request sends the trimmed message and the offered price, then reports the result', async () => {
  const { onSuccess } = renderDialog();

  fireEvent.change(screen.getByRole('textbox', { name: /Tin nhắn cho người bán/ }), { target: { value: '  Tôi muốn mua máy này  ' } });
  fireEvent.change(screen.getByRole('spinbutton', { name: /Giá đề nghị/ }), { target: { value: '550000' } });
  fireEvent.click(screen.getByRole('button', { name: 'Gửi yêu cầu' }));

  await waitFor(() => expect(createPurchaseRequest).toHaveBeenCalledWith({
    listingId: 'p1',
    message: 'Tôi muốn mua máy này',
    agreedPrice: 550000
  }));
  await waitFor(() => expect(onSuccess).toHaveBeenCalledWith({ success: true, data: { _id: 'order-1' } }, { isQuickBuy: false }));
});

test('a quick purchase hides the fields and confirms at the listed price', async () => {
  const { onSuccess } = renderDialog({ isQuickBuy: true });

  expect(screen.queryByRole('textbox')).not.toBeInTheDocument();
  expect(screen.queryByRole('spinbutton')).not.toBeInTheDocument();
  fireEvent.click(screen.getByRole('button', { name: 'Xác nhận mua ngay' }));

  await waitFor(() => expect(createPurchaseRequest).toHaveBeenCalledWith({
    listingId: 'p1',
    message: 'Mua ngay',
    agreedPrice: 500000
  }));
  await waitFor(() => expect(onSuccess).toHaveBeenCalledWith(expect.anything(), { isQuickBuy: true }));
});

test('a failed request shows the reason and keeps the dialog open to try again', async () => {
  const consoleError = jest.spyOn(console, 'error').mockImplementation(() => {});
  createPurchaseRequest.mockRejectedValue(new Error('Sản phẩm đã có người đặt'));
  const { onSuccess } = renderDialog({ isQuickBuy: true });

  fireEvent.click(screen.getByRole('button', { name: 'Xác nhận mua ngay' }));

  expect(await screen.findByRole('alert')).toHaveTextContent('Sản phẩm đã có người đặt');
  expect(onSuccess).not.toHaveBeenCalled();
  await waitFor(() => expect(screen.getByRole('button', { name: 'Xác nhận mua ngay' })).toBeEnabled());
  consoleError.mockRestore();
});

test('cancel closes the dialog without sending anything', () => {
  const { onClose } = renderDialog();

  fireEvent.click(screen.getByRole('button', { name: 'Hủy' }));
  expect(onClose).toHaveBeenCalledTimes(1);
  expect(createPurchaseRequest).not.toHaveBeenCalled();
});
