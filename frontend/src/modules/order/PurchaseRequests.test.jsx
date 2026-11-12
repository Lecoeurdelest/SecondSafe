import React from 'react';
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import PurchaseRequests from './PurchaseRequests';
import { getReceivedPurchaseRequests, acceptPurchaseRequest, rejectPurchaseRequest } from '../../services/order.service';
import AppProviders from '../../ui/AppProviders';

jest.mock('../../services/order.service', () => ({
  getReceivedPurchaseRequests: jest.fn(),
  acceptPurchaseRequest: jest.fn(),
  rejectPurchaseRequest: jest.fn()
}));

function request(id, overrides = {}) {
  return {
    _id: id,
    status: 'pending',
    agreedPrice: 550000,
    message: 'Tôi muốn mua máy này',
    createdAt: '2026-11-01T08:00:00.000Z',
    listing: { title: `Tin ${id}`, price: 500000, images: [] },
    buyer: { fullName: 'Nguyễn Văn An' },
    ...overrides
  };
}

function renderPage() {
  return render(
    <AppProviders language="vi" themeMode="light">
      <PurchaseRequests />
    </AppProviders>
  );
}

function cardOf(title) {
  return screen.getByText(title, { selector: '.ant-typography' }).closest('.request-item');
}

function confirmation(title) {
  return screen.getByText(title, { selector: '.ant-modal-title' }).closest('[role="dialog"]');
}

beforeEach(() => {
  jest.clearAllMocks();
  getReceivedPurchaseRequests.mockResolvedValue({ data: { requests: [request('r1'), request('r2', { status: 'accepted', agreedPrice: 500000 })] } });
  acceptPurchaseRequest.mockResolvedValue({});
  rejectPurchaseRequest.mockResolvedValue({});
});

test('lists the requests with the buyer, the offer, the difference, the message and the status', async () => {
  renderPage();

  expect(await screen.findByRole('heading', { level: 1, name: 'Yêu cầu mua hàng' })).toBeInTheDocument();
  const pending = cardOf('Tin r1');
  expect(within(pending).getByText('Chờ xử lý', { selector: '.ant-tag' })).toBeInTheDocument();
  expect(within(pending).getByText('Nguyễn Văn An')).toBeInTheDocument();
  expect(within(pending).getByText(/Giá niêm yết: 500\.000/)).toBeInTheDocument();
  expect(within(pending).getByText(/550\.000/, { selector: '.request-item__price strong' })).toBeInTheDocument();
  expect(within(pending).getByText(/\(\+50\.000/)).toBeInTheDocument();
  expect(within(pending).getByText('Tôi muốn mua máy này')).toBeInTheDocument();
  expect(within(pending).getByRole('button', { name: 'Chấp nhận' })).toBeInTheDocument();

  const accepted = cardOf('Tin r2');
  expect(within(accepted).getByText('Đã chấp nhận', { selector: '.ant-tag' })).toBeInTheDocument();
  expect(within(accepted).queryByText(/\(\+/)).not.toBeInTheDocument();
  expect(within(accepted).queryByRole('button', { name: 'Chấp nhận' })).not.toBeInTheDocument();
});

test('also reads the list from a bare array and from the populated listing and buyer ids', async () => {
  getReceivedPurchaseRequests.mockResolvedValue([
    { _id: 'r9', status: 'rejected', agreedPrice: 450000, createdAt: '2026-11-01T08:00:00.000Z', message: 'Giảm giá được không', listingId: { title: 'Tin từ id', price: 500000, images: [] }, buyerId: { fullName: 'Lê Thị Cúc' } }
  ]);
  renderPage();

  const card = await screen.findByText('Tin từ id', { selector: '.ant-typography' });
  expect(within(card.closest('.request-item')).getByText('Lê Thị Cúc')).toBeInTheDocument();
  expect(within(card.closest('.request-item')).getByText(/\(-50\.000/)).toBeInTheDocument();
  expect(within(card.closest('.request-item')).getByText('Đã từ chối', { selector: '.ant-tag' })).toBeInTheDocument();
});

test('accepting asks first, then accepts, reloads the list and confirms with a toast', async () => {
  renderPage();
  await screen.findByText('Tin r1');

  fireEvent.click(within(cardOf('Tin r1')).getByRole('button', { name: 'Chấp nhận' }));
  const dialog = confirmation('Chấp nhận yêu cầu');
  expect(within(dialog).getByText(/Một đơn hàng sẽ được tạo/)).toBeInTheDocument();
  expect(acceptPurchaseRequest).not.toHaveBeenCalled();

  fireEvent.click(within(dialog).getByRole('button', { name: 'Chấp nhận' }));
  await waitFor(() => expect(acceptPurchaseRequest).toHaveBeenCalledWith('r1'));
  expect(await screen.findByText('Đã chấp nhận yêu cầu mua hàng thành công!')).toBeInTheDocument();
  expect(getReceivedPurchaseRequests).toHaveBeenCalledTimes(2);
});

test('rejecting asks first and then rejects', async () => {
  renderPage();
  await screen.findByText('Tin r1');

  fireEvent.click(within(cardOf('Tin r1')).getByRole('button', { name: 'Từ chối' }));
  const dialog = confirmation('Từ chối yêu cầu');
  expect(within(dialog).getByText('Bạn có chắc chắn muốn từ chối yêu cầu mua hàng này?')).toBeInTheDocument();
  fireEvent.click(within(dialog).getByRole('button', { name: 'Từ chối' }));

  await waitFor(() => expect(rejectPurchaseRequest).toHaveBeenCalledWith('r1'));
  expect(await screen.findByText('Đã từ chối yêu cầu mua hàng!')).toBeInTheDocument();
});

test('cancelling the question sends nothing, and a failed action reports why and keeps the question', async () => {
  renderPage();
  await screen.findByText('Tin r1');

  fireEvent.click(within(cardOf('Tin r1')).getByRole('button', { name: 'Từ chối' }));
  fireEvent.click(within(confirmation('Từ chối yêu cầu')).getByRole('button', { name: 'Hủy' }));
  await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
  expect(rejectPurchaseRequest).not.toHaveBeenCalled();

  acceptPurchaseRequest.mockRejectedValue(new Error('Sản phẩm đã bán'));
  fireEvent.click(within(cardOf('Tin r1')).getByRole('button', { name: 'Chấp nhận' }));
  fireEvent.click(within(confirmation('Chấp nhận yêu cầu')).getByRole('button', { name: 'Chấp nhận' }));
  expect(await screen.findByText('Sản phẩm đã bán')).toBeInTheDocument();
  expect(confirmation('Chấp nhận yêu cầu')).toBeInTheDocument();
  expect(getReceivedPurchaseRequests).toHaveBeenCalledTimes(1);
});

test('an empty inbox explains when requests will show up', async () => {
  getReceivedPurchaseRequests.mockResolvedValue({ data: { requests: [] } });
  renderPage();

  expect(await screen.findByText('Chưa có yêu cầu mua hàng nào')).toBeInTheDocument();
  expect(screen.getByText(/Khi có khách hàng quan tâm/)).toBeInTheDocument();
});

test('a failed load shows an alert that retries, and a status while loading', async () => {
  let resolve;
  getReceivedPurchaseRequests.mockImplementationOnce(() => new Promise(done => { resolve = done; }));
  renderPage();
  expect(screen.getByRole('status')).toHaveTextContent('Đang tải...');
  resolve({ data: { requests: [] } });
  await screen.findByText('Chưa có yêu cầu mua hàng nào');
});

test('retrying after a failed load shows the requests', async () => {
  getReceivedPurchaseRequests
    .mockRejectedValueOnce(new Error('Mất kết nối'))
    .mockResolvedValueOnce({ data: { requests: [request('r1')] } });
  renderPage();

  const alert = await screen.findByRole('alert');
  expect(alert).toHaveTextContent('Mất kết nối');
  fireEvent.click(within(alert).getByRole('button', { name: 'Thử lại' }));
  expect(await screen.findByText('Tin r1')).toBeInTheDocument();
});
