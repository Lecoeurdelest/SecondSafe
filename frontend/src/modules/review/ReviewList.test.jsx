import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import ReviewList from './ReviewList';
import { getReviews, getRatingStats } from '../../services/review.service';
import AppProviders from '../../ui/AppProviders';

jest.mock('../../services/review.service', () => ({ getReviews: jest.fn(), getRatingStats: jest.fn() }));

function review(id, overrides = {}) {
  return {
    _id: id,
    rating: 4,
    comment: `Nhận xét ${id}`,
    createdAt: '2026-10-20T00:00:00Z',
    reviewerId: { fullName: `Người mua ${id}`, avatar: '' },
    ...overrides
  };
}

function renderList(props = {}) {
  return render(<AppProviders language="vi" themeMode="light"><ReviewList userId="seller-1" {...props} /></AppProviders>);
}

beforeEach(() => {
  jest.clearAllMocks();
  getReviews.mockResolvedValue({ data: { reviews: [review('a')], pagination: { totalPages: 1 } } });
  getRatingStats.mockResolvedValue({ data: { averageRating: 4.6, totalReviews: 8 } });
});

test('shows the average rating and each review with its reviewer, date and comment', async () => {
  renderList();

  expect(await screen.findByText('Nhận xét a')).toBeInTheDocument();
  expect(screen.getByText('Người mua a')).toBeInTheDocument();
  expect(screen.getByText('4.6')).toBeInTheDocument();
  expect(screen.getByText('(8 đánh giá)')).toBeInTheDocument();
  expect(screen.getByText(/20 tháng 10, 2026|tháng 10/)).toBeInTheDocument();
  expect(getReviews).toHaveBeenCalledWith('seller-1', {}, { page: 1, limit: 10 });
});

test('the summary can be hidden', async () => {
  renderList({ showStats: false });
  await screen.findByText('Nhận xét a');
  expect(screen.queryByText('(8 đánh giá)')).not.toBeInTheDocument();
  expect(getRatingStats).not.toHaveBeenCalled();
});

test('review photos, videos and the reviewed listing are shown', async () => {
  getReviews.mockResolvedValue({
    data: {
      reviews: [review('a', {
        evidenceFiles: ['/uploads/a.jpg', '/uploads/b.mp4', '/uploads/a.jpg'],
        productId: { title: 'Balo cũ', images: ['/uploads/p.jpg'] }
      })],
      pagination: { totalPages: 1 }
    }
  });
  const { container } = renderList();

  await screen.findByText('Nhận xét a');
  expect(container.querySelectorAll('img.review-evidence-media')).toHaveLength(1);
  expect(container.querySelectorAll('video.review-evidence-media')).toHaveLength(1);
  expect(screen.getByText('Balo cũ')).toBeInTheDocument();
});

test('an empty list says so, and a filter with no match names the stars', async () => {
  getReviews.mockResolvedValue({ data: { reviews: [], pagination: { totalPages: 1 } } });
  renderList();
  expect(await screen.findByText('Chưa có đánh giá nào')).toBeInTheDocument();

  fireEvent.mouseDown(screen.getByRole('combobox', { name: 'Lọc theo số sao' }));
  fireEvent.click(await screen.findByText('2 sao', { selector: '.ant-select-item-option-content' }));
  await waitFor(() => expect(getReviews).toHaveBeenLastCalledWith('seller-1', { rating: '2' }, { page: 1, limit: 10 }));
  expect(await screen.findByText('Không có đánh giá 2 sao')).toBeInTheDocument();
});

test('a long list is paged', async () => {
  getReviews
    .mockResolvedValueOnce({ data: { reviews: [review('a')], pagination: { totalPages: 3 } } })
    .mockResolvedValueOnce({ data: { reviews: [review('z')], pagination: { totalPages: 3 } } });
  renderList();
  await screen.findByText('Nhận xét a');

  fireEvent.click(screen.getByTitle('2'));
  await waitFor(() => expect(getReviews).toHaveBeenLastCalledWith('seller-1', {}, { page: 2, limit: 10 }));
  expect(await screen.findByText('Nhận xét z')).toBeInTheDocument();
});

test('a failed load shows an alert', async () => {
  getReviews.mockRejectedValue(new Error('x'));
  renderList();
  expect(await screen.findByRole('alert')).toHaveTextContent('Không thể tải đánh giá');
});
