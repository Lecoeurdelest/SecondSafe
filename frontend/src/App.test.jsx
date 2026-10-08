import React from 'react';
import { render, screen } from '@testing-library/react';
import App from './App';
import AppErrorBoundary from './components/AppErrorBoundary';

test('renders the Vietnamese shell and accessible navigation', () => {
  window.history.replaceState({}, '', '/');
  render(<App />);
  expect(screen.getByRole('heading', { name: /Mua bán đồ cũ, an tâm mỗi giao dịch/ })).toBeInTheDocument();
  expect(screen.getByRole('link', { name: 'Chuyển đến nội dung chính' })).toHaveAttribute('href', '#main-content');
  expect(screen.getByRole('main')).toHaveAttribute('id', 'main-content');
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
