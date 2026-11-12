import React from 'react';
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import ConfirmReceipt from './ConfirmReceipt';
import { confirmReceipt } from '../../services/order.service';
import { createReview } from '../../services/review.service';
import { uploadEvidenceMedia } from '../../services/report.service';
import AppProviders from '../../ui/AppProviders';

jest.mock('../../services/order.service', () => ({ confirmReceipt: jest.fn() }));
jest.mock('../../services/review.service', () => ({ createReview: jest.fn() }));
jest.mock('../../services/report.service', () => ({ uploadEvidenceMedia: jest.fn() }));

const ORDER = {
  _id: 'abcdef1234567890',
  orderCode: 'SS2001',
  agreedPrice: 500000,
  totalAmount: 520000,
  shippedAt: '2026-11-03T08:00:00.000Z',
  listing: { title: 'Máy ảnh film cũ', images: [] },
  seller: { fullName: 'Trần Thị Bích' },
  shipping: { provider: 'ghn', trackingNumber: 'GHN-SS2001-ABC123' }
};

function renderDialog(order = ORDER) {
  const handlers = { onClose: jest.fn(), onSuccess: jest.fn() };
  render(
    <AppProviders language="vi" themeMode="light">
      <ConfirmReceipt order={order} {...handlers} />
    </AppProviders>
  );
  return handlers;
}

function stars() {
  return screen.getAllByRole('radio');
}

async function confirmation() {
  const text = await screen.findByText('Bạn có chắc chắn đã nhận được hàng và muốn xác nhận? Sau khi xác nhận, tiền sẽ được chuyển cho người bán và không thể hoàn tác.');
  return text.closest('[role="dialog"]');
}

beforeEach(() => {
  jest.clearAllMocks();
  confirmReceipt.mockResolvedValue({});
  createReview.mockResolvedValue({});
});

test('shows the order, the shipping details, the product card and starts at five satisfied stars', () => {
  renderDialog();

  const dialog = screen.getByRole('dialog');
  expect(within(dialog).getByText('Xác nhận nhận hàng', { selector: '.ant-modal-title' })).toBeInTheDocument();
  expect(within(dialog).getAllByText('#SS2001')).toHaveLength(2);
  expect(within(dialog).getAllByText('Máy ảnh film cũ').length).toBeGreaterThan(0);
  expect(within(dialog).getAllByText('Trần Thị Bích').length).toBeGreaterThan(0);
  expect(within(dialog).getByText('ghn')).toBeInTheDocument();
  expect(within(dialog).getByText(/Giá đơn: 500\.000/)).toBeInTheDocument();
  expect(within(dialog).getByText('Mã vận đơn: GHN-SS2001-ABC123')).toBeInTheDocument();
  expect(within(dialog).getByText('Rất hài lòng')).toBeInTheDocument();
  expect(within(dialog).getByRole('button', { name: /^Hài lòng/ })).toHaveAttribute('aria-pressed', 'true');
  expect(within(dialog).getByRole('button', { name: /^Chưa hài lòng/ })).toHaveAttribute('aria-pressed', 'false');
  expect(within(dialog).getByRole('button', { name: 'Đóng gói cẩn thận' })).toBeInTheDocument();
  expect(within(dialog).getByText('0/500 ký tự')).toBeInTheDocument();
});

test('the stars, the satisfaction choice and the highlight options follow each other', () => {
  renderDialog();

  fireEvent.click(stars()[1]);
  expect(screen.getByText('Không hài lòng')).toBeInTheDocument();
  expect(screen.getByRole('button', { name: /^Chưa hài lòng/ })).toHaveAttribute('aria-pressed', 'true');
  expect(screen.getByRole('button', { name: 'Sai mô tả' })).toBeInTheDocument();
  expect(screen.queryByRole('button', { name: 'Đóng gói cẩn thận' })).not.toBeInTheDocument();

  fireEvent.click(screen.getByRole('button', { name: /^Hài lòng/ }));
  expect(screen.getByText('Hài lòng', { selector: '.rating-text strong' })).toBeInTheDocument();

  fireEvent.click(stars()[2]);
  expect(screen.getByText('Bình thường')).toBeInTheDocument();
  expect(screen.getByRole('button', { name: 'Tạm ổn' })).toBeInTheDocument();
});

test('at most three highlights can be picked and they lead the comment and its counter', () => {
  renderDialog();

  for (const name of ['Đúng mô tả', 'Giao tiếp tốt', 'Giao hàng nhanh', 'Sản phẩm chất lượng']) {
    fireEvent.click(screen.getByRole('button', { name }));
  }
  expect(screen.getByRole('button', { name: 'Đúng mô tả' })).toHaveAttribute('aria-pressed', 'true');
  expect(screen.getByRole('button', { name: 'Sản phẩm chất lượng' })).toHaveAttribute('aria-pressed', 'false');

  fireEvent.change(screen.getByRole('textbox', { name: /Nhận xét chi tiết/ }), { target: { value: 'Rất ổn' } });
  const expected = 'Điểm nổi bật: Đúng mô tả, Giao tiếp tốt, Giao hàng nhanh.\nRất ổn';
  expect(screen.getByText(`${expected.length}/500 ký tự`)).toBeInTheDocument();

  fireEvent.click(screen.getByRole('button', { name: 'Đúng mô tả' }));
  expect(screen.getByRole('button', { name: 'Đúng mô tả' })).toHaveAttribute('aria-pressed', 'false');
});

test('confirming asks first, then confirms the receipt and sends the review with its evidence', async () => {
  uploadEvidenceMedia.mockResolvedValue(['/uploads/a.png', '/uploads/b.mp4']);
  const { onSuccess } = renderDialog();

  fireEvent.click(screen.getByRole('button', { name: 'Đúng mô tả' }));
  fireEvent.change(screen.getByRole('textbox', { name: /Nhận xét chi tiết/ }), { target: { value: 'Giao nhanh' } });
  fireEvent.change(screen.getByLabelText('Chọn tệp', { selector: 'input' }), { target: { files: [new File(['x'], 'a.png', { type: 'image/png' })] } });
  expect(await screen.findByAltText('review-evidence-0')).toBeInTheDocument();
  expect(document.querySelector('video')).toHaveAttribute('src', expect.stringContaining('b.mp4'));

  fireEvent.click(screen.getByRole('button', { name: 'Xác nhận nhận hàng' }));
  const dialog = await confirmation();
  expect(confirmReceipt).not.toHaveBeenCalled();
  fireEvent.click(within(dialog).getByRole('button', { name: 'Xác nhận' }));

  await waitFor(() => expect(confirmReceipt).toHaveBeenCalledWith('abcdef1234567890'));
  await waitFor(() => expect(createReview).toHaveBeenCalledWith('abcdef1234567890', 5, 'Điểm nổi bật: Đúng mô tả.\nGiao nhanh', ['/uploads/a.png', '/uploads/b.mp4']));
  await waitFor(() => expect(onSuccess).toHaveBeenCalledWith({ reviewCreated: true, reviewError: '' }));
});

test('an evidence file can be removed before sending', async () => {
  uploadEvidenceMedia.mockResolvedValue(['/uploads/a.png']);
  renderDialog();

  fireEvent.change(screen.getByLabelText('Chọn tệp', { selector: 'input' }), { target: { files: [new File(['x'], 'a.png', { type: 'image/png' })] } });
  await screen.findByAltText('review-evidence-0');
  fireEvent.click(screen.getByRole('button', { name: 'Xóa tệp' }));
  expect(screen.queryByAltText('review-evidence-0')).not.toBeInTheDocument();
});

test('a failed upload shows its reason under the evidence field', async () => {
  uploadEvidenceMedia.mockRejectedValue(new Error('Tệp quá lớn'));
  renderDialog();

  fireEvent.change(screen.getByLabelText('Chọn tệp', { selector: 'input' }), { target: { files: [new File(['x'], 'a.png', { type: 'image/png' })] } });
  expect(await screen.findByText('Tệp quá lớn')).toBeInTheDocument();
});

test('a failed review still completes the receipt and reports why the review was not saved', async () => {
  createReview.mockRejectedValue({ response: { data: { message: 'Bạn đã đánh giá đơn này' } } });
  const { onSuccess } = renderDialog();

  fireEvent.click(screen.getByRole('button', { name: 'Xác nhận nhận hàng' }));
  fireEvent.click(within(await confirmation()).getByRole('button', { name: 'Xác nhận' }));

  await waitFor(() => expect(onSuccess).toHaveBeenCalledWith({ reviewCreated: false, reviewError: 'Bạn đã đánh giá đơn này' }));
});

test('a failed confirmation shows the reason, sends no review and keeps the dialog open', async () => {
  const consoleError = jest.spyOn(console, 'error').mockImplementation(() => {});
  confirmReceipt.mockRejectedValue(new Error('Đơn hàng chưa được giao'));
  const { onSuccess } = renderDialog();

  fireEvent.click(screen.getByRole('button', { name: 'Xác nhận nhận hàng' }));
  fireEvent.click(within(await confirmation()).getByRole('button', { name: 'Xác nhận' }));

  expect(await screen.findByText('Đơn hàng chưa được giao')).toBeInTheDocument();
  expect(createReview).not.toHaveBeenCalled();
  expect(onSuccess).not.toHaveBeenCalled();
  consoleError.mockRestore();
});

test('declining the question sends nothing', async () => {
  renderDialog();

  fireEvent.click(screen.getByRole('button', { name: 'Xác nhận nhận hàng' }));
  fireEvent.click(within(await confirmation()).getByRole('button', { name: 'Hủy' }));

  await waitFor(() => expect(screen.queryByText(/Bạn có chắc chắn đã nhận được hàng/)).not.toBeInTheDocument());
  expect(confirmReceipt).not.toHaveBeenCalled();
});

test('a comment that is too long is rejected before asking', async () => {
  renderDialog();

  fireEvent.change(screen.getByRole('textbox', { name: /Nhận xét chi tiết/ }), { target: { value: 'a'.repeat(501) } });
  fireEvent.click(screen.getByRole('button', { name: 'Xác nhận nhận hàng' }));

  expect(await screen.findByText('Nhận xét không được quá 500 ký tự')).toBeInTheDocument();
  expect(screen.queryByText(/Bạn có chắc chắn đã nhận được hàng/)).not.toBeInTheDocument();
});

test('cancel closes the dialog', () => {
  const { onClose } = renderDialog();

  fireEvent.click(screen.getByRole('button', { name: 'Hủy' }));
  expect(onClose).toHaveBeenCalledTimes(1);
});
