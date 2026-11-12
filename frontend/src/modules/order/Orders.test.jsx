import React from 'react';
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom';
import Orders from './Orders';
import { getOrdersAsBuyer, getOrdersAsSeller, confirmOrderBySeller, cancelOrder } from '../../services/order.service';
import chatService from '../../services/chat.service';
import AppProviders from '../../ui/AppProviders';

jest.mock('../../services/order.service', () => ({
  getOrdersAsBuyer: jest.fn(),
  getOrdersAsSeller: jest.fn(),
  confirmOrderBySeller: jest.fn(),
  cancelOrder: jest.fn()
}));
jest.mock('../../services/chat.service', () => ({
  __esModule: true,
  default: { getOrCreateConversationByOrder: jest.fn() }
}));
jest.mock('../report/Dispute', () => function Dispute({ order, initialReason, onSuccess, onCancel }) {
  return (
    <div role="dialog" aria-label="Khiếu nại giả lập">
      <span>{`dispute:${order._id}:${initialReason}`}</span>
      <button type="button" onClick={onSuccess}>Hoàn tất khiếu nại</button>
      <button type="button" onClick={onCancel}>Đóng khiếu nại</button>
    </div>
  );
});
jest.mock('./ShipOrder', () => function ShipOrder({ order, onClose, onSuccess }) {
  return (
    <div role="dialog" aria-label="Giao hàng giả lập">
      <span>{`ship:${order._id}`}</span>
      <button type="button" onClick={onSuccess}>Hoàn tất giao hàng</button>
      <button type="button" onClick={onClose}>Đóng giao hàng</button>
    </div>
  );
});

const future = { v7_startTransition: true, v7_relativeSplatPath: true };

function Where() {
  const location = useLocation();
  return <p data-testid="where">{`${location.pathname}${location.search}`}</p>;
}

function order(id, status, overrides = {}) {
  return {
    _id: `${id}`.padEnd(12, '0'),
    orderCode: `DH${id}`,
    status,
    agreedPrice: 100000,
    totalAmount: 120000,
    createdAt: '2026-11-01T08:00:00.000Z',
    listing: { title: `Tin ${id}`, images: [] },
    seller: { fullName: 'Người bán A' },
    buyer: { fullName: 'Người mua B' },
    ...overrides
  };
}

function reply(orders, extra = {}) {
  return { data: { orders, currentPage: 1, totalPages: 1, totalOrders: orders.length, ...extra } };
}

function renderPage() {
  return render(
    <AppProviders language="vi" themeMode="light">
      <MemoryRouter future={future} initialEntries={['/orders']}>
        <Where />
        <Routes>
          <Route path="/orders" element={<Orders />} />
          <Route path="*" element={<p>Trang khác</p>} />
        </Routes>
      </MemoryRouter>
    </AppProviders>
  );
}

function cardOf(title) {
  return screen.getByText(title, { selector: '.ant-typography' }).closest('.order-item');
}

function dialogWithTitle(title) {
  return screen.getByText(title, { selector: '.ant-modal-title' }).closest('[role="dialog"]');
}

async function choose(selectName, optionText) {
  fireEvent.mouseDown(screen.getByRole('combobox', { name: selectName }));
  fireEvent.click(await screen.findByText(optionText, { selector: '.ant-select-item-option-content' }));
}

beforeEach(() => {
  jest.clearAllMocks();
  getOrdersAsBuyer.mockResolvedValue(reply([order('a1', 'awaiting_payment'), order('b2', 'completed')]));
  getOrdersAsSeller.mockResolvedValue(reply([order('s1', 'awaiting_seller_confirmation')], { totalOrders: 7 }));
  cancelOrder.mockResolvedValue({});
  confirmOrderBySeller.mockResolvedValue({});
});

test('lists the buyer orders with code, status, seller, amounts and the tab count', async () => {
  renderPage();

  expect(await screen.findByRole('heading', { level: 1, name: 'Đơn hàng của tôi' })).toBeInTheDocument();
  expect(screen.getByRole('tab', { name: /Đơn mua \(2\)/ })).toHaveAttribute('aria-selected', 'true');
  expect(screen.getByRole('tab', { name: /Đơn bán \(\.\.\.\)/ })).toBeInTheDocument();

  const card = cardOf('Tin a1');
  expect(within(card).getByText('#DHa1')).toBeInTheDocument();
  expect(within(card).getByText('Chờ thanh toán', { selector: '.ant-tag' })).toBeInTheDocument();
  expect(within(card).getByText('Người bán A')).toBeInTheDocument();
  expect(within(card).getByText(/Giá: 100\.000/)).toBeInTheDocument();
  expect(within(card).getByText(/Tổng tiền: 120\.000/)).toBeInTheDocument();
  expect(within(cardOf('Tin b2')).getByText('Hoàn thành', { selector: '.ant-tag' })).toBeInTheDocument();
  expect(getOrdersAsBuyer).toHaveBeenCalledWith({ page: 1, limit: 10 });
});

test('a card opens the order and its buttons do not trigger that click', async () => {
  renderPage();
  await screen.findByText('Tin a1');

  fireEvent.click(within(cardOf('Tin a1')).getByRole('button', { name: /Thanh toán/ }));
  expect(screen.getByTestId('where')).toHaveTextContent('/orders/a1' + '0'.repeat(10) + '/pay');
});

test('clicking a card goes to the order detail page', async () => {
  renderPage();
  await screen.findByText('Tin b2');

  fireEvent.click(screen.getByText('Tin b2'));
  expect(screen.getByTestId('where')).toHaveTextContent('/orders/b2' + '0'.repeat(10));
});

test('completed orders offer the seller rating and disputed ones the evidence follow-up', async () => {
  getOrdersAsBuyer.mockResolvedValue(reply([order('c1', 'completed'), order('d1', 'disputed')]));
  renderPage();
  await screen.findByText('Tin c1');

  fireEvent.click(within(cardOf('Tin c1')).getByRole('button', { name: 'Đánh giá người bán' }));
  expect(screen.getByTestId('where')).toHaveTextContent('?action=rate');
});

test('the order chat opens the conversation for that order', async () => {
  chatService.getOrCreateConversationByOrder.mockResolvedValue({ _id: 'conv-1' });
  renderPage();
  await screen.findByText('Tin a1');

  fireEvent.click(within(cardOf('Tin a1')).getByRole('button', { name: /Chat/ }));
  await waitFor(() => expect(screen.getByTestId('where')).toHaveTextContent('/chat/conv-1'));
  expect(chatService.getOrCreateConversationByOrder).toHaveBeenCalledWith('a1' + '0'.repeat(10));
});

test('the order chat falls back to the chat list when the conversation cannot be opened', async () => {
  const consoleError = jest.spyOn(console, 'error').mockImplementation(() => {});
  chatService.getOrCreateConversationByOrder.mockRejectedValue(new Error('offline'));
  renderPage();
  await screen.findByText('Tin a1');

  fireEvent.click(within(cardOf('Tin a1')).getByRole('button', { name: /Chat/ }));
  await waitFor(() => expect(screen.getByTestId('where')).toHaveTextContent('/chat'));
  consoleError.mockRestore();
});

test('cancelling asks for a reason, sends it and reloads the list', async () => {
  renderPage();
  await screen.findByText('Tin a1');

  fireEvent.click(within(cardOf('Tin a1')).getByRole('button', { name: /Hủy đơn/ }));
  const dialog = dialogWithTitle('Hủy đơn hàng');
  fireEvent.change(within(dialog).getByRole('textbox', { name: 'Nhập lý do hủy đơn hàng của bạn:' }), { target: { value: ' Đổi ý ' } });
  fireEvent.click(within(dialog).getByRole('button', { name: 'Hủy đơn hàng' }));

  await waitFor(() => expect(cancelOrder).toHaveBeenCalledWith('a1' + '0'.repeat(10), 'Đổi ý'));
  expect(await screen.findByText(/Hủy đơn hàng thành công/)).toBeInTheDocument();
  await waitFor(() => expect(getOrdersAsBuyer).toHaveBeenCalledTimes(2));
  await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
});

test('cancelling without a reason uses the default one, and keeping the order sends nothing', async () => {
  renderPage();
  await screen.findByText('Tin a1');

  fireEvent.click(within(cardOf('Tin a1')).getByRole('button', { name: /Hủy đơn/ }));
  fireEvent.click(within(dialogWithTitle('Hủy đơn hàng')).getByRole('button', { name: 'Giữ đơn hàng' }));
  await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
  expect(cancelOrder).not.toHaveBeenCalled();

  fireEvent.click(within(cardOf('Tin a1')).getByRole('button', { name: /Hủy đơn/ }));
  fireEvent.click(within(dialogWithTitle('Hủy đơn hàng')).getByRole('button', { name: 'Hủy đơn hàng' }));
  await waitFor(() => expect(cancelOrder).toHaveBeenCalledWith('a1' + '0'.repeat(10), 'Người mua hủy đơn'));
});

test('a failed cancellation shows the reason and keeps the dialog open', async () => {
  cancelOrder.mockRejectedValue(new Error('Đơn đã được giao'));
  renderPage();
  await screen.findByText('Tin a1');

  fireEvent.click(within(cardOf('Tin a1')).getByRole('button', { name: /Hủy đơn/ }));
  fireEvent.click(within(dialogWithTitle('Hủy đơn hàng')).getByRole('button', { name: 'Hủy đơn hàng' }));

  expect(await screen.findByText('Đơn đã được giao')).toBeInTheDocument();
  expect(dialogWithTitle('Hủy đơn hàng')).toBeInTheDocument();
  expect(getOrdersAsBuyer).toHaveBeenCalledTimes(1);
});

test('delivered orders can open a dispute, which reloads the list and confirms with a toast', async () => {
  getOrdersAsBuyer.mockResolvedValue(reply([order('e1', 'delivered')]));
  renderPage();
  await screen.findByText('Tin e1');

  fireEvent.click(within(cardOf('Tin e1')).getByRole('button', { name: 'Khiếu nại và hoàn tiền' }));
  const dialog = screen.getByRole('dialog', { name: 'Khiếu nại giả lập' });
  expect(within(dialog).getByText('dispute:e1' + '0'.repeat(10) + ':')).toBeInTheDocument();

  fireEvent.click(within(dialog).getByRole('button', { name: 'Hoàn tất khiếu nại' }));
  expect(await screen.findByText(/Khiếu nại đã được tạo thành công/)).toBeInTheDocument();
  expect(screen.queryByRole('dialog', { name: 'Khiếu nại giả lập' })).not.toBeInTheDocument();
  expect(getOrdersAsBuyer).toHaveBeenCalledTimes(2);

  fireEvent.click(within(cardOf('Tin e1')).getByRole('button', { name: 'Xác nhận nhận hàng' }));
  expect(screen.getByTestId('where')).toHaveTextContent('?action=confirm-receipt');
});

test('the selling tab loads the seller orders and asks the seller to confirm before sending', async () => {
  renderPage();
  await screen.findByText('Tin a1');

  fireEvent.click(screen.getByRole('tab', { name: /Đơn bán/ }));
  expect(await screen.findByText('Tin s1')).toBeInTheDocument();
  expect(screen.getByRole('tab', { name: /Đơn bán \(7\)/ })).toHaveAttribute('aria-selected', 'true');
  expect(getOrdersAsSeller).toHaveBeenCalledWith({ page: 1, limit: 10 });
  expect(within(cardOf('Tin s1')).getByText('Người mua B')).toBeInTheDocument();

  fireEvent.click(within(cardOf('Tin s1')).getByRole('button', { name: 'Xác nhận đơn' }));
  const confirmation = screen.getByText('Bạn xác nhận đơn hàng này và chuyển cho người mua thanh toán?').closest('[role="dialog"]');
  expect(confirmOrderBySeller).not.toHaveBeenCalled();
  fireEvent.click(within(confirmation).getByRole('button', { name: 'Xác nhận đơn' }));

  await waitFor(() => expect(confirmOrderBySeller).toHaveBeenCalledWith('s1' + '0'.repeat(10)));
  expect(await screen.findByText(/Đã xác nhận đơn hàng/)).toBeInTheDocument();
  await waitFor(() => expect(getOrdersAsSeller).toHaveBeenCalledTimes(2));
});

test('sellers of paid orders confirm the shipment in the shipping dialog', async () => {
  getOrdersAsSeller.mockResolvedValue(reply([order('p1', 'paid')]));
  renderPage();
  await screen.findByText('Tin a1');
  fireEvent.click(screen.getByRole('tab', { name: /Đơn bán/ }));
  await screen.findByText('Tin p1');

  fireEvent.click(within(cardOf('Tin p1')).getByRole('button', { name: 'Xác nhận giao hàng' }));
  const dialog = screen.getByRole('dialog', { name: 'Giao hàng giả lập' });
  expect(within(dialog).getByText('ship:p1' + '0'.repeat(10))).toBeInTheDocument();

  fireEvent.click(within(dialog).getByRole('button', { name: 'Hoàn tất giao hàng' }));
  await waitFor(() => expect(screen.queryByRole('dialog', { name: 'Giao hàng giả lập' })).not.toBeInTheDocument());
  expect(getOrdersAsSeller).toHaveBeenCalledTimes(2);
});

test('the status filter reloads the first page with that status', async () => {
  renderPage();
  await screen.findByText('Tin a1');

  await choose('Lọc theo trạng thái', 'Đã hủy');
  await waitFor(() => expect(getOrdersAsBuyer).toHaveBeenLastCalledWith({ page: 1, limit: 10, status: 'cancelled' }));
});

test('more than one page shows a pager that loads the chosen page', async () => {
  getOrdersAsBuyer.mockResolvedValue(reply([order('a1', 'awaiting_payment')], { totalPages: 3, totalOrders: 25 }));
  renderPage();
  await screen.findByText('Tin a1');

  expect(screen.getByText('25 đơn hàng')).toBeInTheDocument();
  fireEvent.click(screen.getByTitle('2'));
  await waitFor(() => expect(getOrdersAsBuyer).toHaveBeenLastCalledWith({ page: 2, limit: 10 }));
});

test('an empty list explains itself and leads to the next step for each tab', async () => {
  getOrdersAsBuyer.mockResolvedValue(reply([]));
  getOrdersAsSeller.mockResolvedValue(reply([]));
  renderPage();

  expect(await screen.findByText('Chưa có đơn hàng nào')).toBeInTheDocument();
  expect(screen.getByText(/Bạn chưa có đơn hàng mua nào/)).toBeInTheDocument();
  fireEvent.click(screen.getByRole('button', { name: 'Khám phá sản phẩm' }));
  expect(screen.getByTestId('where')).toHaveTextContent(/^\/$/);
});

test('an empty selling tab offers to post a listing', async () => {
  getOrdersAsSeller.mockResolvedValue(reply([]));
  renderPage();
  await screen.findByText('Tin a1');

  fireEvent.click(screen.getByRole('tab', { name: /Đơn bán/ }));
  expect(await screen.findByText(/Bạn chưa có đơn hàng bán nào/)).toBeInTheDocument();
  fireEvent.click(screen.getByRole('button', { name: 'Đăng sản phẩm' }));
  expect(screen.getByTestId('where')).toHaveTextContent('/product/create');
});

test('a failed request shows an alert that retries the same query', async () => {
  getOrdersAsBuyer
    .mockRejectedValueOnce(new Error('Không thể kết nối'))
    .mockResolvedValueOnce(reply([order('a1', 'awaiting_payment')]));
  renderPage();

  const alert = await screen.findByRole('alert');
  expect(alert).toHaveTextContent('Không thể kết nối');
  fireEvent.click(within(alert).getByRole('button', { name: 'Thử lại' }));

  expect(await screen.findByText('Tin a1')).toBeInTheDocument();
  expect(screen.queryByRole('alert')).not.toBeInTheDocument();
});

test('shows a status while the first page loads', async () => {
  let resolve;
  getOrdersAsBuyer.mockImplementationOnce(() => new Promise(done => { resolve = done; }));
  renderPage();

  expect(screen.getByRole('status')).toHaveTextContent('Đang tải...');
  resolve(reply([]));
  expect(await screen.findByText('Chưa có đơn hàng nào')).toBeInTheDocument();
});
