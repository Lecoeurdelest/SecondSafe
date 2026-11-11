import React, { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import DashboardLayout from './DashboardLayout';
import dashboardService from '../../services/dashboard.service';
import { getProductImageUrl, handleImageError } from '../../utils/imageHelper';
import './AdminProducts.css';

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

  function submitSearch(event) {
    event.preventDefault();
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

  return (
    <DashboardLayout
      role="admin"
      title="Quản lý sản phẩm"
      description="Tìm kiếm, theo dõi và kiểm soát trạng thái tin đăng trên nền tảng."
    >
      <section className="admin-products">
        <form className="admin-products__filters" onSubmit={submitSearch}>
          <label>
            Tìm theo tên sản phẩm
            <input
              value={searchInput}
              maxLength={100}
              onChange={event => setSearchInput(event.target.value)}
              placeholder="Nhập tên sản phẩm..."
            />
          </label>
          <label>
            Trạng thái
            <select value={status} onChange={event => { setPage(1); setStatus(event.target.value); }}>
              {STATUS_OPTIONS.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
            </select>
          </label>
          <button type="submit">Tìm kiếm</button>
        </form>

        {error && <p className="admin-products__feedback admin-products__feedback--error" role="alert">{error}</p>}
        {notice && <p className="admin-products__feedback" role="status">{notice}</p>}
        {loading ? (
          <p className="admin-products__state" role="status">Đang tải sản phẩm...</p>
        ) : products.length === 0 ? (
          <p className="admin-products__state">Không tìm thấy sản phẩm phù hợp.</p>
        ) : (
          <div className="admin-products__table-wrap">
            <table className="admin-products__table">
              <thead>
                <tr><th>Sản phẩm</th><th>Người bán</th><th>Giá</th><th>Trạng thái</th><th>Thao tác</th></tr>
              </thead>
              <tbody>
                {products.map(product => (
                  <tr key={product._id}>
                    <td>
                      <div className="admin-products__item">
                        <img
                          src={getProductImageUrl(product)}
                          alt=""
                          onError={event => handleImageError(event, 'product')}
                        />
                        <div>
                          <Link to={`/product/${product._id}`}>{product.title}</Link>
                          <small>{product.category?.name || 'Chưa phân loại'}</small>
                        </div>
                      </div>
                    </td>
                    <td>{product.seller?.fullName || 'Không rõ'}</td>
                    <td>{formatPrice(product.price)}</td>
                    <td>{STATUS_LABELS[product.status] || product.status}</td>
                    <td>
                      {['active', 'hidden'].includes(product.status) && (
                        <button
                          type="button"
                          className="admin-products__action"
                          disabled={busyId === String(product._id)}
                          onClick={() => changeVisibility(product)}
                        >
                          {product.status === 'active' ? 'Ẩn tin' : 'Khôi phục'}
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {totalPages > 1 && (
          <nav className="admin-products__pagination" aria-label="Phân trang sản phẩm">
            <button type="button" disabled={page <= 1 || loading} onClick={() => setPage(current => current - 1)}>Trước</button>
            <span>Trang {page} / {totalPages}</span>
            <button type="button" disabled={page >= totalPages || loading} onClick={() => setPage(current => current + 1)}>Sau</button>
          </nav>
        )}
      </section>
    </DashboardLayout>
  );
}
