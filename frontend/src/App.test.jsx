import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import App from './App';
import AppErrorBoundary from './components/AppErrorBoundary';
import productService from './services/product.service';

jest.mock('./services/product.service', () => ({ __esModule: true, default: { getProducts: jest.fn() } }));

test('renders the Vietnamese catalog and accessible navigation', async () => {
  productService.getProducts.mockResolvedValue({ products: [], total: 0, totalPages: 0, limit: 20 });
  window.history.replaceState({}, '', '/');
  render(<App />);
  expect(screen.getByRole('heading', { name: 'Giá tốt, gần bạn, chốt nhanh!' })).toBeInTheDocument();
  expect(screen.getByRole('link', { name: 'Chuyển đến nội dung chính' })).toHaveAttribute('href', '#main-content');
  expect(screen.getByRole('main')).toHaveAttribute('id', 'main-content');
  expect(await screen.findByText('Không tìm thấy sản phẩm nào')).toBeInTheDocument();
});

test('loads and scrolls to the next product batch without removing the current listings', async () => {
  const makeProducts = (prefix, count) => Array.from({ length: count }, (_, index) => ({
    _id: `${prefix}-${index}`,
    title: `${prefix} product ${index}`,
    price: 10000,
    images: ['/images/placeholders/product-placeholder.svg'],
    category: { slug: 'books' },
    location: { city: 'Hà Nội' },
    createdAt: new Date().toISOString()
  }));
  const scrollIntoView = jest.fn();
  const originalScrollIntoView = Element.prototype.scrollIntoView;
  Element.prototype.scrollIntoView = scrollIntoView;
  let resolveNextPage;
  productService.getProducts
    .mockResolvedValueOnce({ products: makeProducts('first', 20), total: 40, totalPages: 2, limit: 20 })
    .mockImplementationOnce(() => new Promise(resolve => { resolveNextPage = resolve; }));
  window.history.replaceState({}, '', '/');
  try {
    render(<App />);

    expect(await screen.findByRole('heading', { name: 'first product 0' })).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Xem thêm' }));

    expect(screen.getAllByRole('heading', { level: 3 })).toHaveLength(20);
    expect(screen.getByRole('heading', { name: 'first product 0' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Đang tải sản phẩm...' })).toBeDisabled();
    resolveNextPage({ products: makeProducts('next', 20), total: 40, totalPages: 2, limit: 20 });

    expect(await screen.findByRole('heading', { name: 'next product 0' })).toBeInTheDocument();
    expect(screen.getAllByRole('heading', { level: 3 })).toHaveLength(40);
    await waitFor(() => expect(scrollIntoView).toHaveBeenCalledWith({ behavior: 'smooth', block: 'start' }));
  } finally {
    if (originalScrollIntoView) Element.prototype.scrollIntoView = originalScrollIntoView;
    else delete Element.prototype.scrollIntoView;
  }
});

test('unknown routes show an actionable Vietnamese error', () => {
  window.history.replaceState({}, '', '/missing-page');
  render(<App />);
  expect(screen.getByRole('heading', { name: 'Không tìm thấy trang' })).toBeInTheDocument();
  expect(screen.getByRole('link', { name: 'Về trang chủ' })).toHaveAttribute('href', '/');
});

test('a failed screen shows recovery copy without internal details', () => {
  function BrokenScreen() { throw new Error('private internal error'); }
  const errorOutput = jest.spyOn(console, 'error').mockImplementation(() => {});
  try {
    render(<AppErrorBoundary><BrokenScreen /></AppErrorBoundary>);
    expect(screen.getByRole('alert')).toHaveTextContent('Không thể hiển thị trang lúc này');
    expect(screen.getByRole('link', { name: 'Tải lại trang chủ' })).toHaveAttribute('href', '/');
    expect(screen.queryByText('private internal error')).not.toBeInTheDocument();
  } finally {
    errorOutput.mockRestore();
  }
});
