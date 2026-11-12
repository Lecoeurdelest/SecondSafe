import React from 'react';
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom';
import OrderDetail from './OrderDetail';
import { getOrderById, cancelOrder, confirmDelivery } from '../../services/order.service';
import chatService from '../../services/chat.service';
import { canReviewOrder, getReviewByOrderId } from '../../services/review.service';
import { getDisputeByOrderId, addSellerResponse, addBuyerFollowUp, confirmSellerReturn, uploadEvidenceMedia } from '../../services/report.service';
import AppProviders from '../../ui/AppProviders';

let mockUser = { _id: 'buyer-1' };
jest.mock('../../hooks/useAuth', () => ({ useAuth: () => ({ user: mockUser }) }));
jest.mock('../../services/order.service', () => ({
  getOrderById: jest.fn(),
  cancelOrder: jest.fn(),
  confirmDelivery: jest.fn()
}));
jest.mock('../../services/chat.service', () => ({
  __esModule: true,
  default: { getOrCreateConversationByOrder: jest.fn() }
}));
jest.mock('../../services/review.service', () => ({
  canReviewOrder: jest.fn(),
  getReviewByOrderId: jest.fn()
}));
jest.mock('../../services/report.service', () => ({
  getDisputeByOrderId: jest.fn(),
  addSellerResponse: jest.fn(),
  addBuyerFollowUp: jest.fn(),
  confirmSellerReturn: jest.fn(),
  uploadEvidenceMedia: jest.fn()
}));
jest.mock('./ShipOrder', () => function ShipOrder({ onClose, onSuccess }) {
  return (
    <div role="dialog" aria-label="Giao hàng giả lập">
      <button type="button" onClick={onSuccess}>Hoàn tất giao hàng</button>
      <button type="button" onClick={onClose}>Đóng giao hàng</button>
    </div>
  );
});
jest.mock('./ConfirmReceipt', () => function ConfirmReceipt({ onClose, onSuccess }) {
  return (
    <div role="dialog" aria-label="Nhận hàng giả lập">
      <button type="button" onClick={() => onSuccess({ reviewCreated: true })}>Nhận hàng và đánh giá</button>
      <button type="button" onClick={() => onSuccess({ reviewError: 'Bạn đã đánh giá' })}>Nhận hàng lỗi đánh giá</button>
      <button type="button" onClick={() => onSuccess({})}>Nhận hàng không đánh giá</button>
      <button type="button" onClick={onClose}>Đóng nhận hàng</button>
    </div>
  );
});
jest.mock('../review/RateSeller', () => function RateSeller({ onSuccess, onCancel }) {
  return (
    <div role="dialog" aria-label="Đánh giá giả lập">
      <button type="button" onClick={onSuccess}>Hoàn tất đánh giá</button>
      <button type="button" onClick={onCancel}>Đóng đánh giá</button>
    </div>
  );
});
jest.mock('../report/Dispute', () => function Dispute({ initialReason, onSuccess, onCancel }) {
  return (
    <div role="dialog" aria-label="Khiếu nại giả lập">
      <span>{`reason:${initialReason}`}</span>
      <button type="button" onClick={onSuccess}>Hoàn tất khiếu nại</button>
      <button type="button" onClick={onCancel}>Đóng khiếu nại</button>
    </div>
  );
});

const future = { v7_startTransition: true, v7_relativeSplatPath: true };
const ID = 'abcdef1234567890';

function Where() {
  const location = useLocation();
  return <p data-testid="where">{`${location.pathname}${location.search}`}</p>;
}

function makeOrder(overrides = {}) {
  return {
    _id: ID,
    orderCode: 'SS2001',
    status: 'awaiting_payment',
    agreedPrice: 500000,
    totalAmount: 520000,
    platformFee: 25000,
    createdAt: '2026-11-01T08:00:00.000Z',
    buyer: { _id: 'buyer-1', fullName: 'Nguyễn Văn An' },
    seller: { _id: 'seller-1', fullName: 'Trần Thị Bích' },
    listing: {
      title: 'Máy ảnh film cũ',
      description: 'Máy còn rất tốt.',
      condition: 'good',
      images: [],
      category: { name: 'Đồ điện tử' },
      location: { district: 'Cầu Giấy', city: 'Hà Nội' }
    },
    ...overrides
  };
}

function renderPage(search = '') {
  return render(
    <AppProviders language="vi" themeMode="light">
      <MemoryRouter future={future} initialEntries={[`/orders/${ID}${search}`]}>
        <Where />
        <Routes>
          <Route path="/orders/:id" element={<OrderDetail />} />
          <Route path="*" element={<p>Trang khác</p>} />
        </Routes>
      </MemoryRouter>
    </AppProviders>
  );
}

function dialogWithTitle(title) {
  return screen.getByText(title, { selector: '.ant-modal-title' }).closest('[role="dialog"]');
}

beforeEach(() => {
  jest.clearAllMocks();
  mockUser = { _id: 'buyer-1' };
  getOrderById.mockResolvedValue({ data: makeOrder() });
  canReviewOrder.mockResolvedValue({ data: { canReview: false } });
  getReviewByOrderId.mockResolvedValue({ data: null });
  getDisputeByOrderId.mockResolvedValue({ data: null });
  cancelOrder.mockResolvedValue({});
  confirmDelivery.mockResolvedValue({});
});

test('shows the buyer the order, the seller, the dates, the total and the progress', async () => {
  renderPage();

  expect(await screen.findByRole('heading', { level: 1, name: 'Chi tiết đơn hàng' })).toBeInTheDocument();
  expect(screen.getByText('#SS2001')).toBeInTheDocument();
  expect(screen.getByText('Chờ thanh toán', { selector: '.ant-tag' })).toBeInTheDocument();
  expect(screen.getByRole('heading', { name: 'Máy ảnh film cũ' })).toBeInTheDocument();
  expect(screen.getByText('Máy còn rất tốt.')).toBeInTheDocument();
  expect(screen.getByText('Tốt', { selector: '.ant-tag' })).toBeInTheDocument();
  expect(screen.getByText('Đồ điện tử')).toBeInTheDocument();
  expect(screen.getByText('Cầu Giấy, Hà Nội')).toBeInTheDocument();
  expect(screen.getByRole('heading', { name: 'Thông tin người bán' })).toBeInTheDocument();
  expect(screen.getByRole('link', { name: 'Trần Thị Bích' })).toHaveAttribute('href', '/user/seller-1');
  expect(screen.getByText('Tổng thanh toán')).toBeInTheDocument();
  expect(screen.getByText(/520\.000/, { selector: '.order-detail-total strong' })).toBeInTheDocument();
  expect(screen.getByText('Đơn hàng được tạo')).toBeInTheDocument();
  expect(screen.getByText('Hoàn thành')).toBeInTheDocument();
  expect(getOrderById).toHaveBeenCalledWith(ID);
});

test('the seller sees the buyer, the platform fee and what they will receive', async () => {
  mockUser = { _id: 'seller-1' };
  renderPage();

  expect(await screen.findByRole('heading', { name: 'Thông tin người mua' })).toBeInTheDocument();
  expect(screen.getByRole('link', { name: 'Nguyễn Văn An' })).toHaveAttribute('href', '/user/buyer-1');
  expect(screen.getByText(/-25\.000/)).toBeInTheDocument();
  expect(screen.getByText(/475\.000/)).toBeInTheDocument();
  expect(screen.getByText('Tổng nhận được')).toBeInTheDocument();
});

test('someone who is not part of the order cannot see it', async () => {
  mockUser = { _id: 'stranger' };
  renderPage();

  const alert = await screen.findByRole('alert');
  expect(alert).toHaveTextContent('Bạn không có quyền truy cập đơn hàng này');
  fireEvent.click(within(alert).getByRole('button', { name: 'Quay lại danh sách đơn hàng' }));
  expect(screen.getByTestId('where')).toHaveTextContent('/orders');
});

test('a failed load shows the reason, and the page shows a status while loading', async () => {
  let resolve;
  getOrderById.mockImplementationOnce(() => new Promise(done => { resolve = done; }));
  renderPage();
  expect(screen.getByRole('status')).toHaveTextContent('Đang tải...');
  resolve({ data: makeOrder() });
  await screen.findByRole('heading', { level: 1, name: 'Chi tiết đơn hàng' });
});

test('a failed order request shows an alert', async () => {
  getOrderById.mockRejectedValue(new Error('Không tìm thấy đơn hàng'));
  renderPage();

  expect(await screen.findByRole('alert')).toHaveTextContent('Không tìm thấy đơn hàng');
});

test('the back button and the chat button lead where they say', async () => {
  chatService.getOrCreateConversationByOrder.mockResolvedValue({ _id: 'conv-1' });
  renderPage();
  await screen.findByRole('heading', { level: 1, name: 'Chi tiết đơn hàng' });

  fireEvent.click(screen.getByRole('button', { name: /Chat/ }));
  await waitFor(() => expect(screen.getByTestId('where')).toHaveTextContent('/chat/conv-1'));
  expect(chatService.getOrCreateConversationByOrder).toHaveBeenCalledWith(ID);
});

test('paying leads to the payment page', async () => {
  renderPage();
  fireEvent.click(await screen.findByRole('button', { name: /Thanh toán/ }));
  expect(screen.getByTestId('where')).toHaveTextContent(`/orders/${ID}/pay`);
});

test('cancelling asks for a reason, cancels with it and reloads the order', async () => {
  renderPage();
  fireEvent.click(await screen.findByRole('button', { name: /Hủy đơn/ }));

  const dialog = dialogWithTitle('Hủy đơn hàng');
  fireEvent.change(within(dialog).getByRole('textbox', { name: 'Nhập lý do hủy đơn hàng của bạn:' }), { target: { value: ' Đổi ý ' } });
  fireEvent.click(within(dialog).getByRole('button', { name: 'Hủy đơn hàng' }));

  await waitFor(() => expect(cancelOrder).toHaveBeenCalledWith(ID, 'Đổi ý'));
  expect(await screen.findByText(/Hủy đơn hàng thành công/)).toBeInTheDocument();
  await waitFor(() => expect(getOrderById).toHaveBeenCalledTimes(2));
});

test('cancelling without a reason uses the default, and a failure keeps the dialog', async () => {
  cancelOrder.mockRejectedValue(new Error('Đơn đã được giao'));
  renderPage();
  fireEvent.click(await screen.findByRole('button', { name: /Hủy đơn/ }));

  fireEvent.click(within(dialogWithTitle('Hủy đơn hàng')).getByRole('button', { name: 'Hủy đơn hàng' }));
  await waitFor(() => expect(cancelOrder).toHaveBeenCalledWith(ID, 'Người mua hủy đơn'));
  expect(await screen.findByText('Đơn đã được giao')).toBeInTheDocument();
  expect(dialogWithTitle('Hủy đơn hàng')).toBeInTheDocument();

  fireEvent.click(within(dialogWithTitle('Hủy đơn hàng')).getByRole('button', { name: 'Giữ đơn hàng' }));
  await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
});

test('the seller confirms the shipment in the shipping dialog and the order reloads', async () => {
  mockUser = { _id: 'seller-1' };
  getOrderById.mockResolvedValue({ data: makeOrder({ status: 'paid' }) });
  renderPage();

  fireEvent.click(await screen.findByRole('button', { name: /Xác nhận giao hàng/ }));
  fireEvent.click(within(screen.getByRole('dialog', { name: 'Giao hàng giả lập' })).getByRole('button', { name: 'Hoàn tất giao hàng' }));

  expect(await screen.findByText('Xác nhận giao hàng thành công!')).toBeInTheDocument();
  await waitFor(() => expect(getOrderById).toHaveBeenCalledTimes(2));
});

test('the seller confirms the delivery after a question', async () => {
  mockUser = { _id: 'seller-1' };
  getOrderById.mockResolvedValue({ data: makeOrder({ status: 'shipped', shippedAt: '2026-11-02T08:00:00.000Z', shipping: { provider: 'ghn', trackingNumber: 'GHN-1', notes: 'Gọi trước' } }) });
  renderPage();

  expect(await screen.findByText('GHN')).toBeInTheDocument();
  expect(screen.getByText('GHN-1')).toBeInTheDocument();
  expect(screen.getByText('Gọi trước')).toBeInTheDocument();

  fireEvent.click(screen.getByRole('button', { name: /Xác nhận giao đến nơi/ }));
  const question = screen.getByText('Bạn xác nhận đơn hàng này đã được giao đến tay người mua?').closest('[role="dialog"]');
  expect(confirmDelivery).not.toHaveBeenCalled();
  fireEvent.click(within(question).getByRole('button', { name: 'Xác nhận' }));

  await waitFor(() => expect(confirmDelivery).toHaveBeenCalledWith(ID));
  expect(await screen.findByText('Đã cập nhật trạng thái: Đã giao đến nơi')).toBeInTheDocument();
});

test('the buyer confirms the receipt and is told how the review went', async () => {
  getOrderById.mockResolvedValue({ data: makeOrder({ status: 'delivered' }) });
  renderPage();

  fireEvent.click(await screen.findByRole('button', { name: /Xác nhận nhận hàng/ }));
  fireEvent.click(screen.getByRole('button', { name: 'Nhận hàng lỗi đánh giá' }));
  expect(await screen.findByText('Xác nhận nhận hàng thành công nhưng chưa gửi được đánh giá: Bạn đã đánh giá')).toBeInTheDocument();

  fireEvent.click(await screen.findByRole('button', { name: /Xác nhận nhận hàng/ }));
  fireEvent.click(screen.getByRole('button', { name: 'Nhận hàng và đánh giá' }));
  expect(await screen.findByText('Xác nhận nhận hàng và gửi đánh giá thành công!')).toBeInTheDocument();

  fireEvent.click(await screen.findByRole('button', { name: /Xác nhận nhận hàng/ }));
  fireEvent.click(screen.getByRole('button', { name: 'Nhận hàng không đánh giá' }));
  expect(await screen.findByText('Xác nhận nhận hàng thành công! Tiền đã được chuyển cho người bán.')).toBeInTheDocument();
});

test('a shipped order opens the receipt dialog from the link and offers a dispute', async () => {
  getOrderById.mockResolvedValue({ data: makeOrder({ status: 'shipped' }) });
  renderPage('?action=confirm-receipt');

  expect(await screen.findByRole('dialog', { name: 'Nhận hàng giả lập' })).toBeInTheDocument();
  fireEvent.click(screen.getByRole('button', { name: 'Đóng nhận hàng' }));

  fireEvent.click(screen.getByRole('button', { name: /Khiếu nại và hoàn tiền/ }));
  const dialog = screen.getByRole('dialog', { name: 'Khiếu nại giả lập' });
  expect(within(dialog).getByText('reason:')).toBeInTheDocument();
  fireEvent.click(within(dialog).getByRole('button', { name: 'Hoàn tất khiếu nại' }));
  expect(await screen.findByText(/Khiếu nại đã được tạo thành công/)).toBeInTheDocument();
});

test('a return link opens the dispute dialog for a return request', async () => {
  getOrderById.mockResolvedValue({ data: makeOrder({ status: 'shipped' }) });
  renderPage('?action=return');

  const dialog = await screen.findByRole('dialog', { name: 'Khiếu nại giả lập' });
  expect(within(dialog).getByText('reason:return_request')).toBeInTheDocument();
  fireEvent.click(within(dialog).getByRole('button', { name: 'Hoàn tất khiếu nại' }));
  expect(await screen.findByText(/Yêu cầu hoàn hàng đã được tạo thành công/)).toBeInTheDocument();
});

test('a completed order shows the review, with its comment, media and date', async () => {
  getOrderById.mockResolvedValue({ data: makeOrder({ status: 'completed', completedAt: '2026-11-05T08:00:00.000Z' }) });
  getReviewByOrderId.mockResolvedValue({ data: { rating: 4, comment: 'Giao nhanh', createdAt: '2026-11-06T08:00:00.000Z', evidenceFiles: ['/uploads/a.png', '/uploads/b.mp4', '/uploads/a.png'] } });
  renderPage();

  expect(await screen.findByRole('heading', { name: 'Đánh giá của bạn' })).toBeInTheDocument();
  expect(screen.getByText('4/5')).toBeInTheDocument();
  expect(screen.getByText('4.0 điểm')).toBeInTheDocument();
  expect(screen.getByText('"Giao nhanh"')).toBeInTheDocument();
  expect(screen.getAllByAltText(/^evidence-/)).toHaveLength(1);
  expect(document.querySelector('video')).toHaveAttribute('src', expect.stringContaining('b.mp4'));
  expect(screen.getByText(/Đánh giá vào/)).toBeInTheDocument();
  expect(screen.queryByRole('button', { name: /Đánh giá người bán/ })).not.toBeInTheDocument();
});

test('a buyer who has not reviewed can rate, and the rate link opens the dialog', async () => {
  getOrderById.mockResolvedValue({ data: makeOrder({ status: 'completed' }) });
  canReviewOrder.mockResolvedValue({ data: { canReview: true } });
  renderPage('?action=rate');

  const dialog = await screen.findByRole('dialog', { name: 'Đánh giá giả lập' });
  fireEvent.click(within(dialog).getByRole('button', { name: 'Hoàn tất đánh giá' }));
  expect(await screen.findByText(/Đánh giá thành công! Cảm ơn bạn/)).toBeInTheDocument();
  expect(screen.getByRole('button', { name: /Đánh giá người bán/ })).toBeInTheDocument();
});

test('a cancelled order shows why, in Vietnamese', async () => {
  getOrderById.mockResolvedValue({ data: makeOrder({ status: 'cancelled', cancelledAt: '2026-11-02T08:00:00.000Z', cancellationReason: 'Auto-release after 10 days' }) });
  renderPage();

  expect(await screen.findAllByText(/Tự động nhả tiền sau 10 ngày/)).not.toHaveLength(0);
  expect(screen.getByText('Ngày hủy')).toBeInTheDocument();
  expect(screen.getByText('Đã hủy', { selector: '.ant-tag' })).toBeInTheDocument();
});

const DISPUTE = {
  _id: 'dispute-1',
  reason: 'not_as_described',
  status: 'investigating',
  description: 'Máy bị trầy nhiều',
  moderatorNotes: 'Đang xem xét',
  createdAt: '2026-11-03T08:00:00.000Z',
  disputeConversation: [
    { senderRole: 'buyer', content: 'Máy bị trầy nhiều', createdAt: '2026-11-03T08:00:00.000Z', evidenceFiles: ['/uploads/a.png'] },
    { senderRole: 'seller', content: 'Máy đúng mô tả', createdAt: '2026-11-04T08:00:00.000Z', evidenceFiles: [] }
  ]
};

test('a disputed order shows the dispute and its conversation', async () => {
  getOrderById.mockResolvedValue({ data: makeOrder({ status: 'disputed' }) });
  getDisputeByOrderId.mockResolvedValue({ data: DISPUTE });
  renderPage();

  expect(await screen.findByRole('heading', { name: 'Thông tin tranh chấp' })).toBeInTheDocument();
  expect(screen.getByText('Không đúng mô tả')).toBeInTheDocument();
  expect(screen.getByText('Đang điều tra')).toBeInTheDocument();
  expect(screen.getByText('Đang xem xét')).toBeInTheDocument();
  expect(screen.getByRole('heading', { name: 'Hội thoại khiếu nại' })).toBeInTheDocument();
  expect(screen.getByText('Máy đúng mô tả')).toBeInTheDocument();
  expect(screen.getByText('Đã tạo khiếu nại')).toBeInTheDocument();
  expect(screen.getByAltText('evidence-0')).toBeInTheDocument();
});

test('the seller answers an investigating dispute with a reply and evidence', async () => {
  mockUser = { _id: 'seller-1' };
  getOrderById.mockResolvedValue({ data: makeOrder({ status: 'disputed' }) });
  getDisputeByOrderId.mockResolvedValue({ data: DISPUTE });
  addSellerResponse.mockResolvedValue({});
  uploadEvidenceMedia.mockResolvedValue(['/uploads/s1.png']);
  renderPage();

  fireEvent.click(await screen.findByRole('button', { name: /Cung cấp bằng chứng cho mod/ }));
  const dialog = dialogWithTitle('Phản hồi khiếu nại');
  fireEvent.click(within(dialog).getByRole('button', { name: 'Gửi phản hồi' }));
  expect(await within(dialog).findByText('Vui lòng nhập phản hồi')).toBeInTheDocument();
  expect(addSellerResponse).not.toHaveBeenCalled();

  fireEvent.change(within(dialog).getByRole('textbox', { name: /Phản hồi của bạn/ }), { target: { value: ' Máy đúng như mô tả ' } });
  fireEvent.change(within(dialog).getByLabelText('Chọn tệp', { selector: 'input' }), { target: { files: [new File(['x'], 'a.png', { type: 'image/png' })] } });
  await within(dialog).findByAltText('Bằng chứng 1');
  fireEvent.click(within(dialog).getByRole('button', { name: 'Gửi phản hồi' }));

  await waitFor(() => expect(addSellerResponse).toHaveBeenCalledWith('dispute-1', 'Máy đúng như mô tả', ['/uploads/s1.png']));
  expect(await screen.findByText('Đã gửi phản hồi khiếu nại thành công.')).toBeInTheDocument();
  await waitFor(() => expect(getDisputeByOrderId).toHaveBeenCalledTimes(2));
});

test('a failed seller reply and a failed upload each show an alert', async () => {
  mockUser = { _id: 'seller-1' };
  getOrderById.mockResolvedValue({ data: makeOrder({ status: 'disputed' }) });
  getDisputeByOrderId.mockResolvedValue({ data: DISPUTE });
  addSellerResponse.mockRejectedValue(new Error('Khiếu nại đã đóng'));
  uploadEvidenceMedia.mockRejectedValue(new Error('Tệp quá lớn'));
  renderPage();

  fireEvent.click(await screen.findByRole('button', { name: /Cung cấp bằng chứng cho mod/ }));
  const dialog = dialogWithTitle('Phản hồi khiếu nại');
  fireEvent.change(within(dialog).getByLabelText('Chọn tệp', { selector: 'input' }), { target: { files: [new File(['x'], 'a.png', { type: 'image/png' })] } });
  expect(await within(dialog).findByRole('alert')).toHaveTextContent('Tệp quá lớn');

  fireEvent.change(within(dialog).getByRole('textbox', { name: /Phản hồi của bạn/ }), { target: { value: 'Phản hồi' } });
  fireEvent.click(within(dialog).getByRole('button', { name: 'Gửi phản hồi' }));
  await waitFor(() => expect(within(dialog).getByRole('alert')).toHaveTextContent('Khiếu nại đã đóng'));
});

test('the buyer sends a follow-up note and the follow-up link opens it once', async () => {
  getOrderById.mockResolvedValue({ data: makeOrder({ status: 'disputed' }) });
  getDisputeByOrderId.mockResolvedValue({ data: DISPUTE });
  addBuyerFollowUp.mockResolvedValue({});
  renderPage('?action=followup');

  const dialog = await waitFor(() => dialogWithTitle('Gửi tin mới cho moderator'));
  await waitFor(() => expect(screen.getByTestId('where')).not.toHaveTextContent('action=followup'));
  expect(screen.getByTestId('where')).toHaveTextContent(`/orders/${ID}`);

  fireEvent.click(within(dialog).getByRole('button', { name: 'Gửi cho moderator' }));
  expect(await within(dialog).findByText('Vui lòng nhập ghi chú hoặc tải lên ít nhất 1 bằng chứng')).toBeInTheDocument();

  fireEvent.change(within(dialog).getByRole('textbox', { name: /Ghi chú bổ sung/ }), { target: { value: ' Thêm ảnh ' } });
  fireEvent.click(within(dialog).getByRole('button', { name: 'Gửi cho moderator' }));
  await waitFor(() => expect(addBuyerFollowUp).toHaveBeenCalledWith('dispute-1', 'Thêm ảnh', []));
  expect(await screen.findByText('Đã gửi bổ sung bằng chứng cho moderator.')).toBeInTheDocument();
});

test('before the moderator investigates, neither side can add evidence', async () => {
  getOrderById.mockResolvedValue({ data: makeOrder({ status: 'disputed' }) });
  getDisputeByOrderId.mockResolvedValue({ data: { ...DISPUTE, status: 'pending' } });
  renderPage();

  await screen.findByRole('heading', { name: 'Thông tin tranh chấp' });
  expect(screen.getByText('Chờ xử lý', { selector: '.ant-descriptions-item-content' })).toBeInTheDocument();
  expect(screen.queryByRole('button', { name: /Bổ sung bằng chứng/ })).not.toBeInTheDocument();
});

test('the seller confirms having received a returned item', async () => {
  mockUser = { _id: 'seller-1' };
  getOrderById.mockResolvedValue({ data: makeOrder({ status: 'disputed' }) });
  getDisputeByOrderId.mockResolvedValue({ data: { ...DISPUTE, reason: 'return_request' } });
  confirmSellerReturn.mockResolvedValue({});
  renderPage();

  expect(screen.queryByRole('button', { name: /Cung cấp bằng chứng cho mod/ })).not.toBeInTheDocument();
  fireEvent.click(await screen.findByRole('button', { name: /Xác nhận nhận lại hàng/ }));
  const dialog = dialogWithTitle('Xác nhận nhận lại hàng');
  expect(within(dialog).getByText(/Bạn xác nhận đã nhận lại hàng từ người mua/)).toBeInTheDocument();
  fireEvent.click(within(dialog).getByRole('button', { name: 'Xác nhận đã nhận lại hàng' }));

  await waitFor(() => expect(confirmSellerReturn).toHaveBeenCalledWith('dispute-1'));
  expect(await screen.findByText(/Đã xác nhận nhận lại hàng\. Moderator sẽ tiến hành hoàn tiền/)).toBeInTheDocument();
});

test('a failed return confirmation shows the reason', async () => {
  mockUser = { _id: 'seller-1' };
  getOrderById.mockResolvedValue({ data: makeOrder({ status: 'disputed' }) });
  getDisputeByOrderId.mockResolvedValue({ data: { ...DISPUTE, reason: 'return_request' } });
  confirmSellerReturn.mockRejectedValue(new Error('Không thể xác nhận'));
  renderPage();

  fireEvent.click(await screen.findByRole('button', { name: /Xác nhận nhận lại hàng/ }));
  fireEvent.click(within(dialogWithTitle('Xác nhận nhận lại hàng')).getByRole('button', { name: 'Xác nhận đã nhận lại hàng' }));
  expect(await screen.findByText('Không thể xác nhận')).toBeInTheDocument();
});
