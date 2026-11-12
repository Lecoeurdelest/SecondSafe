import React, { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import DashboardLayout from './DashboardLayout';
import dashboardService from '../../services/dashboard.service';
import { getProductImageUrl, handleImageError } from '../../utils/imageHelper';
import './AdminProducts.css';
import { Alert, Button, Card, Empty, Flex, Form, Input, Pagination, Select, Spin, Table, Tag, Typography } from 'antd';

const STATUS_OPTIONS = [
  ['all', 'Tất cả trạng thái'],
  ['pending', 'Chờ duyệt'],
  ['active', 'Đang bán'],
  ['hidden', 'Đang ẩn'],
  ['sold', 'Đã bán'],
  ['rejected', 'Bị từ chối'],
  ['expired', 'Hết hạn'],
  ['deleted', 'Đã xóa']
];

const STATUS_LABELS = Object.fromEntries(STATUS_OPTIONS);

const STATUS_COLORS = { pending: 'warning', active: 'success', hidden: 'default', sold: 'processing', rejected: 'error', expired: 'default', deleted: 'error' };

function formatPrice(value) {
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(value || 0);
}

export default function AdminProducts() {
  const [products, setProducts] = useState([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('all');
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState('');
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  const loadProducts = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const result = await dashboardService.getAdminProducts({ page, limit: 20, search, status });
      setProducts(result.products);
      setTotalPages(result.totalPages);
    } catch (failure) {
      setError(failure.message || 'Không thể tải danh sách sản phẩm.');
    } finally {
      setLoading(false);
    }
  }, [page, search, status]);

  useEffect(() => {
    loadProducts();
  }, [loadProducts]);

  function submitSearch() {
    setPage(1);
    setSearch(searchInput.trim());
  }

  async function changeVisibility(product) {
    const nextStatus = product.status === 'active' ? 'hidden' : 'active';
    setBusyId(String(product._id));
    setError('');
    setNotice('');
    try {
      await dashboardService.updateAdminProductVisibility(product._id, nextStatus);
      setNotice(nextStatus === 'hidden' ? 'Đã ẩn sản phẩm.' : 'Đã khôi phục sản phẩm.');
      await loadProducts();
    } catch (failure) {
      setError(failure.message || 'Không thể cập nhật sản phẩm.');
    } finally {
      setBusyId('');
    }
  }

  const columns = [
    {
      title: 'Sản phẩm',
      key: 'product',
      render: (_, product) => (
        <Flex gap={12} align="center" className="admin-products__item">
          <img
            src={getProductImageUrl(product)}
            alt=""
            onError={event => handleImageError(event, 'product')}
          />
          <div>
            <Link to={`/product/${product._id}`}>{product.title}</Link>
            <Typography.Text type="secondary" className="admin-products__category">{product.category?.name || 'Chưa phân loại'}</Typography.Text>
          </div>
        </Flex>
      )
    },
    { title: 'Người bán', key: 'seller', render: (_, product) => product.seller?.fullName || 'Không rõ' },
    { title: 'Giá', key: 'price', render: (_, product) => formatPrice(product.price) },
    { title: 'Trạng thái', key: 'status', render: (_, product) => <Tag color={STATUS_COLORS[product.status]}>{STATUS_LABELS[product.status] || product.status}</Tag> },
    {
      title: 'Thao tác',
      key: 'actions',
      render: (_, product) => ['active', 'hidden'].includes(product.status) && (
        <Button
          size="small"
          disabled={busyId === String(product._id)}
          onClick={() => changeVisibility(product)}
        >
          {product.status === 'active' ? 'Ẩn tin' : 'Khôi phục'}
        </Button>
      )
    }
  ];

  return (
    <DashboardLayout
      role="admin"
      title="Quản lý sản phẩm"
      description="Tìm kiếm, theo dõi và kiểm soát trạng thái tin đăng trên nền tảng."
    >
      <section className="admin-products">
        <Card className="admin-products__filters">
          <Form layout="vertical" onFinish={submitSearch}>
            <Flex wrap gap={16} align="flex-end">
              <Form.Item label="Tìm theo tên sản phẩm" htmlFor="admin-product-search" className="admin-products__field">
                <Input
                  id="admin-product-search"
                  value={searchInput}
                  maxLength={100}
                  onChange={event => setSearchInput(event.target.value)}
                  placeholder="Nhập tên sản phẩm..."
                />
              </Form.Item>
              <Form.Item label="Trạng thái" htmlFor="admin-product-status" className="admin-products__field">
                <Select
                  id="admin-product-status"
                  value={status}
                  options={STATUS_OPTIONS.map(([value, label]) => ({ value, label }))}
                  onChange={value => { setPage(1); setStatus(value); }}
                  virtual={false}
                />
              </Form.Item>
              <Form.Item>
                <Button type="primary" htmlType="submit">Tìm kiếm</Button>
              </Form.Item>
            </Flex>
          </Form>
        </Card>

        {error && <Alert className="admin-products__feedback" type="error" showIcon role="alert" title={error} />}
        {notice && <Alert className="admin-products__feedback" type="success" showIcon role="status" title={notice} />}
        {loading ? (
          <Flex justify="center" gap={12} className="admin-products__state" role="status">
            <Spin />
            <Typography.Text type="secondary">Đang tải sản phẩm...</Typography.Text>
          </Flex>
        ) : products.length === 0 ? (
          <Empty className="admin-products__state" image={Empty.PRESENTED_IMAGE_SIMPLE} description="Không tìm thấy sản phẩm phù hợp." />
        ) : (
          <Table
            className="admin-products__table"
            rowKey="_id"
            columns={columns}
            dataSource={products}
            pagination={false}
            scroll={{ x: 'max-content' }}
          />
        )}

        {totalPages > 1 && (
          <Pagination
            className="admin-products__pagination"
            align="center"
            showSizeChanger={false}
            current={page}
            pageSize={20}
            total={totalPages * 20}
            disabled={loading}
            onChange={setPage}
          />
        )}
      </section>
    </DashboardLayout>
  );
}
