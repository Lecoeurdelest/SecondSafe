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
const CONDITION_OPTIONS = [
  ['new', 'Mới'],
  ['like-new', 'Như mới'],
  ['good', 'Tốt'],
  ['fair', 'Khá'],
  ['poor', 'Đã qua sử dụng']
];

function categoryId(category) {
  return typeof category === 'string' ? category : category?._id || '';
}

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
  const [editingProduct, setEditingProduct] = useState(null);
  const [editForm, setEditForm] = useState(null);
  const [categories, setCategories] = useState([]);
  const [editFiles, setEditFiles] = useState([]);
  const [editError, setEditError] = useState('');
  const [savingEdit, setSavingEdit] = useState(false);

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

  async function startEditing(product) {
    setEditingProduct(product);
    setEditForm({
      title: product.title || '',
      description: product.description || '',
      price: String(product.price ?? ''),
      category: categoryId(product.category),
      otherCategory: product.otherCategory || '',
      condition: product.condition || 'good',
      city: product.location?.city || '',
      district: product.location?.district || '',
      images: Array.isArray(product.images) ? product.images.filter(Boolean) : []
    });
    setEditFiles([]);
    setEditError('');
    try {
      setCategories(await dashboardService.getAdminProductCategories());
    } catch (failure) {
      setEditError(failure.message || 'Không thể tải danh mục sản phẩm.');
    }
  }

  function closeEditor() {
    if (savingEdit) return;
    setEditingProduct(null);
    setEditForm(null);
    setEditFiles([]);
    setEditError('');
  }

  function updateEditField(event) {
    const { name, value } = event.target;
    setEditForm(current => ({ ...current, [name]: value }));
  }

  function chooseEditImages(event) {
    const files = Array.from(event.target.files || []);
    if (files.length + editForm.images.length > 6) {
      setEditError('Mỗi sản phẩm được đăng tối đa 6 ảnh.');
      event.target.value = '';
      return;
    }
    setEditError('');
    setEditFiles(files);
  }

  async function saveProduct(event) {
    event.preventDefault();
    if (!editingProduct || !editForm) return;
    if (!editForm.images.length && !editFiles.length) {
      setEditError('Sản phẩm cần có ít nhất một ảnh.');
      return;
    }

    setSavingEdit(true);
    setEditError('');
    setError('');
    setNotice('');
    try {
      const uploadedImages = editFiles.length
        ? await dashboardService.uploadAdminProductImages(editFiles)
        : [];
      const { city, district, ...fields } = editForm;
      await dashboardService.updateAdminProduct(editingProduct._id, {
        ...fields,
        price: Number(fields.price),
        images: [...fields.images, ...uploadedImages],
        location: { city, district }
      });
      setNotice('Đã cập nhật thông tin sản phẩm.');
      setEditingProduct(null);
      setEditForm(null);
      setEditFiles([]);
      await loadProducts();
    } catch (failure) {
      setEditError(failure.message || 'Không thể cập nhật sản phẩm.');
    } finally {
      setSavingEdit(false);
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
                      {!['sold', 'expired', 'deleted'].includes(product.status) && (
                        <button
                          type="button"
                          className="admin-products__action admin-products__action--edit"
                          disabled={busyId === String(product._id)}
                          onClick={() => startEditing(product)}
                        >
                          Chỉnh sửa
                        </button>
                      )}
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
      {editingProduct && editForm && (
        <div className="admin-products__editor-backdrop">
          <section
            className="admin-products__editor"
            role="dialog"
            aria-modal="true"
            aria-labelledby="admin-product-editor-title"
          >
            <h2 id="admin-product-editor-title">Chỉnh sửa sản phẩm</h2>
            <p className="admin-products__editor-note">
              Không thể chỉnh sửa sản phẩm đã bán, hết hạn, đã xóa hoặc đang có giao dịch.
            </p>
            {editError && <p className="admin-products__feedback admin-products__feedback--error" role="alert">{editError}</p>}
            <form className="admin-products__edit-form" onSubmit={saveProduct}>
              <label>
                Tên sản phẩm
                <input name="title" value={editForm.title} maxLength={200} required onChange={updateEditField} />
              </label>
              <label className="admin-products__edit-wide">
                Mô tả
                <textarea name="description" value={editForm.description} maxLength={2000} rows={4} required onChange={updateEditField} />
              </label>
              <label>
                Giá (VND)
                <input name="price" type="number" min="0" step="1" value={editForm.price} required onChange={updateEditField} />
              </label>
              <label>
                Danh mục
                <select name="category" value={editForm.category} required onChange={updateEditField}>
                  <option value="">Chọn danh mục</option>
                  {[
                    ...categories,
                    ...(editingProduct.category && !categories.some(item => item._id === categoryId(editingProduct.category))
                      ? [editingProduct.category]
                      : [])
                  ].map(category => (
                    <option key={category._id} value={category._id}>{category.name}</option>
                  ))}
                </select>
              </label>
              <label>
                Tình trạng
                <select name="condition" value={editForm.condition} onChange={updateEditField}>
                  {CONDITION_OPTIONS.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
                </select>
              </label>
              <label>
                Danh mục khác
                <input name="otherCategory" value={editForm.otherCategory} maxLength={100} onChange={updateEditField} />
              </label>
              <label>
                Tỉnh/thành phố
                <input name="city" value={editForm.city} maxLength={100} required onChange={updateEditField} />
              </label>
              <label>
                Quận/huyện
                <input name="district" value={editForm.district} maxLength={100} required onChange={updateEditField} />
              </label>
              <fieldset className="admin-products__edit-wide admin-products__edit-images">
                <legend>Hình ảnh ({editForm.images.length + editFiles.length}/6)</legend>
                <div className="admin-products__edit-image-list">
                  {editForm.images.map((image, index) => (
                    <div className="admin-products__edit-image" key={`${image}-${index}`}>
                      <img src={getProductImageUrl({ images: [image] })} alt={`Ảnh sản phẩm ${index + 1}`} onError={event => handleImageError(event, 'product')} />
                      <button
                        type="button"
                        aria-label={`Xóa ảnh ${index + 1}`}
                        onClick={() => setEditForm(current => ({
                          ...current,
                          images: current.images.filter((_, imageIndex) => imageIndex !== index)
                        }))}
                      >
                        Xóa ảnh
                      </button>
                    </div>
                  ))}
                </div>
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/gif"
                  multiple
                  aria-label="Thêm ảnh sản phẩm"
                  onChange={chooseEditImages}
                />
                {editFiles.length > 0 && <small>{editFiles.map(file => file.name).join(', ')}</small>}
              </fieldset>
              <div className="admin-products__edit-actions admin-products__edit-wide">
                <button type="button" className="admin-products__edit-cancel" disabled={savingEdit} onClick={closeEditor}>Hủy</button>
                <button type="submit" disabled={savingEdit || Boolean(editError && !categories.length)}>
                  {savingEdit ? 'Đang lưu...' : 'Lưu thay đổi'}
                </button>
              </div>
            </form>
          </section>
        </div>
      )}
    </DashboardLayout>
  );
}
