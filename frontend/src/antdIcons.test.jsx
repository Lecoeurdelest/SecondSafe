import React from 'react';
import { act, render, screen } from '@testing-library/react';
import { Alert, Input, Modal, Pagination, Popconfirm, Select, Table, message } from 'antd';

beforeAll(() => {
  window.matchMedia = window.matchMedia || (query => ({ matches: false, media: query, addListener() {}, removeListener() {}, addEventListener() {}, removeEventListener() {}, dispatchEvent: () => false }));
  global.ResizeObserver = global.ResizeObserver || class { observe() {} unobserve() {} disconnect() {} };
  const computedStyle = window.getComputedStyle.bind(window);
  window.getComputedStyle = (...args) => {
    try { return computedStyle(...args); } catch { return { getPropertyValue: () => '' }; }
  };
});

const ANT_DESIGN_VIEWBOX = '64 64 896 896';
const PHOSPHOR_VIEWBOX = '0 0 256 256';

function glyphs(container) {
  return [...container.querySelectorAll('.anticon svg')].map(svg => svg.getAttribute('viewBox'));
}

test('icons that Ant Design draws itself are Phosphor glyphs', () => {
  const { container } = render(
    <>
      {['success', 'info', 'warning', 'error'].map(type => <Alert key={type} type={type} showIcon closable title={type} />)}
      <Select defaultValue="a" allowClear options={[{ value: 'a', label: 'A' }]} />
      <Pagination total={100} />
      <Input.Password defaultValue="secret" />
      <Table columns={[{ title: 'Tên', dataIndex: 'name', sorter: true }]} dataSource={[{ key: 1, name: 'A' }]} pagination={{ pageSize: 1, total: 3 }} />
    </>
  );
  const found = glyphs(container);
  expect(found.length).toBeGreaterThan(10);
  expect(found).not.toContain(ANT_DESIGN_VIEWBOX);
  expect(new Set(found)).toEqual(new Set([PHOSPHOR_VIEWBOX]));
});

test('message, modal and popconfirm icons are Phosphor glyphs too', async () => {
  render(
    <Popconfirm open title="Xoá?" okText="Có" cancelText="Không">
      <button type="button">Xoá</button>
    </Popconfirm>
  );
  await act(async () => {
    message.success('Đã lưu');
    message.error('Lỗi');
    message.loading('Đang xử lý');
    Modal.confirm({ title: 'Xác nhận' });
    await new Promise(resolve => setTimeout(resolve, 50));
  });
  expect(await screen.findByText('Đã lưu')).toBeInTheDocument();
  const found = glyphs(document.body);
  expect(found.length).toBeGreaterThan(4);
  expect(found).not.toContain(ANT_DESIGN_VIEWBOX);
  expect(new Set(found)).toEqual(new Set([PHOSPHOR_VIEWBOX]));
});
