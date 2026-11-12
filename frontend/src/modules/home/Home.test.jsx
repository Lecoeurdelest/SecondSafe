import React from 'react';
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import Home from './Home';
import productService from '../../services/product.service';
import AppProviders from '../../ui/AppProviders';

jest.mock('../../services/product.service', () => ({
  __esModule: true,
  default: { getProducts: jest.fn() }
}));

const future = { v7_startTransition: true, v7_relativeSplatPath: true };

function renderHome() {
  return render(
    <AppProviders language="vi" themeMode="light">
      <MemoryRouter future={future}>
        <Home />
      </MemoryRouter>
    </AppProviders>
  );
}

function makeProduct(index, overrides = {}) {
  return {
    _id: `p-${index}`,
    title: `Sản phẩm ${index}`,
    price: 150000,
    images: ['http://localhost:5000/uploads/products/user/photo.jpg'],
    location: { city: 'Hà Nội' },
    createdAt: new Date().toISOString(),
    ...overrides
  };
}

function lastParams() {
  const { calls } = productService.getProducts.mock;
  return calls[calls.length - 1][0];
}

async function choose(selectName, optionText) {
  fireEvent.mouseDown(screen.getByRole('combobox', { name: selectName }));
  const option = await screen.findByText(optionText, { selector: '.ant-select-item-option-content' });
  fireEvent.click(option);
}

beforeEach(() => {
  jest.clearAllMocks();
  productService.getProducts.mockResolvedValue({ products: [makeProduct(1)], total: 1, totalPages: 1, limit: 20 });
});

test('lists the products as cards that link to their page, with price, city and photo count', async () => {
  productService.getProducts.mockResolvedValue({
    products: [
      makeProduct(1, { images: ['http://localhost:5000/a.jpg', 'http://localhost:5000/b.jpg'] }),
      makeProduct(2, { images: ['/images/placeholders/product-placeholder.svg'] })
    ],
    total: 2,
    totalPages: 1,
    limit: 20
  });
  renderHome();

  const card = (await screen.findByRole('heading', { name: 'Sản phẩm 1' })).closest('a');
  expect(card).toHaveAttribute('href', '/product/p-1');
  expect(card).toHaveAttribute('id', 'product-p-1');
  expect(within(card).getByText(/150\.000/)).toBeInTheDocument();
  expect(within(card).getByText('Hà Nội')).toBeInTheDocument();
  expect(within(card).getByText('2')).toBeInTheDocument();
  expect(within(card).queryByText('Ảnh minh họa')).not.toBeInTheDocument();

  const illustrated = screen.getByRole('heading', { name: 'Sản phẩm 2' }).closest('a');
  expect(within(illustrated).getByText('Ảnh minh họa')).toBeInTheDocument();
  expect(within(illustrated).getByRole('img')).toHaveAttribute('alt', 'Sản phẩm 2 (ảnh minh họa)');
});

test('shows a status while loading and an empty state when nothing matches', async () => {
  let resolve;
  productService.getProducts.mockImplementationOnce(() => new Promise(done => { resolve = done; }));
  renderHome();

  expect(screen.getByRole('status')).toHaveTextContent('Đang tải sản phẩm...');
  resolve({ products: [], total: 0, totalPages: 0, limit: 20 });

  expect(await screen.findByText('Không tìm thấy sản phẩm nào')).toBeInTheDocument();
  expect(screen.getByText('Thử thay đổi bộ lọc hoặc từ khóa tìm kiếm')).toBeInTheDocument();
  expect(screen.queryByRole('button', { name: 'Xem thêm' })).not.toBeInTheDocument();
});

test('typing in the search form waits for the submit before asking the server', async () => {
  renderHome();
  await screen.findByRole('heading', { name: 'Sản phẩm 1' });
  expect(productService.getProducts).toHaveBeenCalledTimes(1);

  fireEvent.change(screen.getByRole('textbox', { name: 'Tìm sản phẩm' }), { target: { value: 'balo' } });
  fireEvent.change(screen.getByRole('textbox', { name: 'Lọc theo tỉnh/thành' }), { target: { value: ' Đà Nẵng ' } });
  expect(productService.getProducts).toHaveBeenCalledTimes(1);

  fireEvent.click(screen.getByRole('button', { name: 'Tìm kiếm' }));
  await waitFor(() => expect(productService.getProducts).toHaveBeenCalledTimes(2));
  expect(lastParams()).toMatchObject({ page: 1, search: 'balo', cities: ['Đà Nẵng'] });
});

test('category chips toggle the filter and report their pressed state', async () => {
  renderHome();
  await screen.findByRole('heading', { name: 'Sản phẩm 1' });
  const group = screen.getByRole('group', { name: 'Danh mục sản phẩm' });

  fireEvent.click(within(group).getByRole('button', { name: 'Sách' }));
  await waitFor(() => expect(lastParams()).toMatchObject({ category: 'books' }));
  expect(within(group).getByRole('button', { name: 'Sách' })).toHaveAttribute('aria-pressed', 'true');
  expect(within(group).getByRole('button', { name: 'Thú cưng' })).toHaveAttribute('aria-pressed', 'false');

  fireEvent.click(within(group).getByRole('button', { name: 'Sách' }));
  await waitFor(() => expect(lastParams()).not.toHaveProperty('category'));
  expect(within(group).getByRole('button', { name: 'Sách' })).toHaveAttribute('aria-pressed', 'false');
});

test('the category, condition and sort selects feed the same query', async () => {
  renderHome();
  await screen.findByRole('heading', { name: 'Sản phẩm 1' });

  await choose('Danh mục', 'Đồ điện tử');
  await waitFor(() => expect(lastParams()).toMatchObject({ category: 'electronics' }));
  expect(within(screen.getByRole('group', { name: 'Danh mục sản phẩm' })).getByRole('button', { name: 'Đồ điện tử' }))
    .toHaveAttribute('aria-pressed', 'true');

  await choose('Lọc theo tình trạng', 'Như mới');
  await waitFor(() => expect(lastParams()).toMatchObject({ category: 'electronics', condition: 'like-new' }));

  await choose('Sắp xếp sản phẩm', 'Giá: thấp đến cao');
  await waitFor(() => expect(lastParams()).toMatchObject({ condition: 'like-new', sort: 'price_asc' }));
});

test('a failed request shows an alert that retries the same page', async () => {
  const consoleError = jest.spyOn(console, 'error').mockImplementation(() => {});
  productService.getProducts
    .mockRejectedValueOnce(new Error('network'))
    .mockResolvedValueOnce({ products: [makeProduct(7)], total: 1, totalPages: 1, limit: 20 });
  renderHome();

  const alert = await screen.findByRole('alert');
  expect(alert).toHaveTextContent('Không thể tải sản phẩm. Vui lòng thử lại sau.');
  expect(screen.queryByRole('button', { name: 'Xem thêm' })).not.toBeInTheDocument();

  fireEvent.click(within(alert).getByRole('button', { name: 'Thử lại' }));
  expect(await screen.findByRole('heading', { name: 'Sản phẩm 7' })).toBeInTheDocument();
  expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  consoleError.mockRestore();
});
