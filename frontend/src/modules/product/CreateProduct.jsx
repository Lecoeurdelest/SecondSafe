import React, { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import productService from '../../services/product.service';
import './CreateProduct.css';

const EMPTY_FORM = {
  title: '', description: '', price: '', condition: 'good', category: '', otherCategory: '', city: '', district: ''
};

export default function CreateProduct() {
  const navigate = useNavigate();
  const fileInputRef = useRef(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [categories, setCategories] = useState([]);
  const [files, setFiles] = useState([]);
  const [previews, setPreviews] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let token;
    try { token = window.localStorage.getItem('token'); } catch { token = null; }
    if (!token) {
      navigate('/login', { replace: true, state: { returnTo: '/create-product' } });
      return;
    }
    productService.getCategories().then(setCategories).catch(failure => setError(failure.message));
  }, [navigate]);

  useEffect(() => () => previews.forEach(url => URL.revokeObjectURL(url)), [previews]);

  function updateField(event) {
    setForm(current => ({ ...current, [event.target.name]: event.target.value }));
  }

  function chooseFiles(event) {
    const selected = Array.from(event.target.files || []).slice(0, 6);
    previews.forEach(url => URL.revokeObjectURL(url));
    setFiles(selected);
    setPreviews(selected.map(file => URL.createObjectURL(file)));
  }

  async function submit(event) {
    event.preventDefault();
    setError('');
    setLoading(true);
    try {
      if (!files.length) throw new Error('Vui lòng chọn ít nhất một ảnh sản phẩm.');
      const imageUrls = await productService.uploadProductImages(files);
      await productService.createProduct({
        ...form,
        price: Number(form.price),
        images: imageUrls,
        location: { city: form.city, district: form.district }
      });
      try {
        window.localStorage.setItem('products:lastCreatedAt', String(Date.now()));
        window.dispatchEvent(new Event('products:updated'));
      } catch { /* Home refresh is best effort. */ }
      navigate('/');
    } catch (failure) {
      setError(failure.message || 'Không thể đăng bán sản phẩm. Vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="create-product-page">
      <div className="create-product-card">
        <div className="create-product-card__heading">
          <div>
            <span>SecondSafe Marketplace</span>
            <h1>Đăng bán sản phẩm</h1>
          </div>
          <Link className="create-product-card__back" to="/">Quay lại</Link>
        </div>
        {error && <p className="create-product-feedback create-product-feedback--error" role="alert">{error}</p>}
        <form className="create-product-form" onSubmit={submit}>
          <label className="create-product-field">Tên sản phẩm
            <input name="title" required maxLength="200" value={form.title} onChange={updateField} placeholder="Ví dụ: iPhone 13 128GB" />
          </label>
          <label className="create-product-field create-product-field--wide">Mô tả
            <textarea name="description" required maxLength="2000" rows="5" value={form.description} onChange={updateField} placeholder="Nêu tình trạng, nguồn gốc và thông tin người mua cần biết..." />
          </label>
          <div className="create-product-grid">
            <label className="create-product-field">Giá bán (VND)
              <input name="price" type="number" min="0" step="1" required value={form.price} onChange={updateField} placeholder="0" />
            </label>
            <label className="create-product-field">Tình trạng
              <select name="condition" value={form.condition} onChange={updateField}>
                <option value="new">Mới</option>
                <option value="like-new">Như mới</option>
                <option value="good">Tốt</option>
                <option value="fair">Khá</option>
                <option value="poor">Đã qua sử dụng</option>
              </select>
            </label>
            <label className="create-product-field">Danh mục
              <select name="category" required value={form.category} onChange={updateField}>
                <option value="">Chọn danh mục</option>
                {categories.map(category => <option key={category._id} value={category._id}>{category.name}</option>)}
              </select>
            </label>
            <label className="create-product-field">Danh mục khác (tuỳ chọn)
              <input name="otherCategory" maxLength="100" value={form.otherCategory} onChange={updateField} />
            </label>
            <label className="create-product-field">Tỉnh/thành phố
              <input name="city" required maxLength="100" value={form.city} onChange={updateField} placeholder="Ví dụ: Hà Nội" />
            </label>
            <label className="create-product-field">Quận/huyện
              <input name="district" required maxLength="100" value={form.district} onChange={updateField} placeholder="Ví dụ: Cầu Giấy" />
            </label>
          </div>
          <div className="create-product-images create-product-field--wide">
            <div className="create-product-images__head">
              <span>Hình ảnh sản phẩm</span>
              <small>Tối đa 6 ảnh, mỗi ảnh tối đa 10 MB</small>
            </div>
            <button type="button" className="create-product-upload" onClick={() => fileInputRef.current?.click()}>
              <span aria-hidden="true">＋</span>
              <strong>Thêm ảnh</strong>
            </button>
            <input ref={fileInputRef} className="create-product-file" type="file" accept="image/jpeg,image/png,image/webp,image/gif" multiple onChange={chooseFiles} aria-label="Ảnh sản phẩm" />
            {previews.length > 0 && (
              <div className="create-product-previews">
                {previews.map((preview, index) => <img key={preview} src={preview} alt={`Ảnh sản phẩm ${index + 1}`} />)}
              </div>
            )}
          </div>
          <button className="create-product-submit create-product-field--wide" type="submit" disabled={loading}>{loading ? 'Đang đăng bán...' : 'Đăng bán ngay'}</button>
        </form>
      </div>
    </section>
  );
}
