import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import SellerOrders from './SellerOrders';
import { getOrdersAsSeller } from '../../services/order.service';

jest.mock('../../services/order.service', () => ({
  getOrdersAsSeller: jest.fn()
}));

const order = (id, status, title) => ({
  _id: id,
  status,
  agreedPrice: 120000,
  createdAt: '2026-11-01T08:00:00.000Z',
  productId: { title, images: [] },
  buyerId: { fullName: 'Người mua' }
});

beforeEach(() => {
  getOrdersAsSeller.mockResolvedValue({
    orders: [
      order('o1', 'paid', 'Balo chờ giao'),
      order('o2', 'shipped', 'Giày đang giao'),
      order('o3', 'completed', 'Sách đã xong')
    ]
  });
});

function renderPage() {
  return render(
    <MemoryRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <SellerOrders />
    </MemoryRouter>
  );
}

test('opens on the awaiting-shipment tab and lists only those orders', async () => {
  renderPage();
  expect(await screen.findByText('Balo chờ giao')).toBeInTheDocument();
  expect(screen.queryByText('Giày đang giao')).not.toBeInTheDocument();
  expect(screen.queryByText('Sách đã xong')).not.toBeInTheDocument();
  expect(document.querySelectorAll('.filter-btn.active')).toHaveLength(1);
  expect(document.querySelector('.filter-btn.active')).toHaveTextContent(/Chờ giao/);
});

test('switching tabs shows the matching orders and keeps exactly one tab active', async () => {
  renderPage();
  await screen.findByText('Balo chờ giao');
  const tabs = document.querySelectorAll('.filter-btn');
  fireEvent.click(tabs[1]);
  expect(await screen.findByText('Giày đang giao')).toBeInTheDocument();
  expect(screen.queryByText('Balo chờ giao')).not.toBeInTheDocument();
  fireEvent.click(tabs[2]);
  expect(await screen.findByText('Sách đã xong')).toBeInTheDocument();
  expect(document.querySelectorAll('.filter-btn.active')).toHaveLength(1);
});
