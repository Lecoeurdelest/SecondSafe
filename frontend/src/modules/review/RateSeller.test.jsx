import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import RateSeller from './RateSeller';
import { createReview } from '../../services/review.service';
import { uploadEvidenceMedia } from '../../services/report.service';
import AppProviders from '../../ui/AppProviders';

jest.mock('../../services/review.service', () => ({ createReview: jest.fn() }));
jest.mock('../../services/report.service', () => ({ uploadEvidenceMedia: jest.fn() }));

const ORDER = { _id: 'order-1', agreedPrice: 250000, listing: { title: 'Balo cũ', images: [] }, seller: { fullName: 'Người bán A' } };

function renderModal(props = {}) {
  const onSuccess = jest.fn();
  const onCancel = jest.fn();
  render(<AppProviders language="vi" themeMode="light"><RateSeller order={ORDER} onSuccess={onSuccess} onCancel={onCancel} {...props} /></AppProviders>);
  return { onSuccess, onCancel };
}

function dialog() {
  return screen.getByText('Đánh giá người bán', { selector: '.ant-modal-title' }).closest('[role="dialog"]');
}

beforeEach(() => jest.clearAllMocks());

test('shows the order and seller and keeps the send button disabled until a rating is chosen', () => {
  renderModal();

  expect(dialog()).toBeInTheDocument();
  expect(screen.getByText('Balo cũ')).toBeInTheDocument();
  expect(screen.getByText('250.000 VNĐ')).toBeInTheDocument();
  expect(screen.getByText('Người bán A')).toBeInTheDocument();
  expect(screen.getByRole('button', { name: 'Gửi đánh giá' })).toBeDisabled();
});

test('choosing stars names the rating and sends the review with the comment and evidence', async () => {
  createReview.mockResolvedValue({});
  uploadEvidenceMedia.mockResolvedValue(['/uploads/e1.jpg']);
  const { onSuccess } = renderModal();

  fireEvent.click(screen.getAllByRole('radio')[3]);
  expect(screen.getByText('Hài lòng')).toBeInTheDocument();
  fireEvent.change(screen.getByLabelText('Nhận xét (tùy chọn)'), { target: { value: 'Giao nhanh, đúng mô tả' } });
  fireEvent.change(screen.getByLabelText('Chọn tệp', { selector: 'input' }), { target: { files: [new File(['x'], 'a.jpg', { type: 'image/jpeg' })] } });
  expect(await screen.findByRole('img', { name: 'review-evidence-0' })).toBeInTheDocument();

  fireEvent.click(screen.getByRole('button', { name: 'Gửi đánh giá' }));
  await waitFor(() => expect(createReview).toHaveBeenCalledWith('order-1', 4, 'Giao nhanh, đúng mô tả', ['/uploads/e1.jpg']));
  expect(onSuccess).toHaveBeenCalledTimes(1);
});

test('a failed upload and a failed review each show an alert', async () => {
  uploadEvidenceMedia.mockRejectedValue(new Error('Tệp quá lớn'));
  createReview.mockRejectedValue({ response: { data: { message: 'Đơn hàng đã được đánh giá.' } } });
  renderModal();

  fireEvent.change(screen.getByLabelText('Chọn tệp', { selector: 'input' }), { target: { files: [new File(['x'], 'a.jpg', { type: 'image/jpeg' })] } });
  expect(await screen.findByRole('alert')).toHaveTextContent('Tệp quá lớn');

  fireEvent.click(screen.getAllByRole('radio')[4]);
  fireEvent.click(screen.getByRole('button', { name: 'Gửi đánh giá' }));
  await waitFor(() => expect(screen.getByRole('alert')).toHaveTextContent('Đơn hàng đã được đánh giá.'));
});

test('cancelling calls the handler', () => {
  const { onCancel } = renderModal();
  fireEvent.click(screen.getByRole('button', { name: 'Hủy' }));
  expect(onCancel).toHaveBeenCalledTimes(1);
});
