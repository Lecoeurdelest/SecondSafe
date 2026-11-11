import React, { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import cartService from '../../services/cart.service';
import PurchaseRequest from '../order/PurchaseRequest';
import { getProductImageUrl, handleImageError } from '../../utils/imageHelper';
import './Cart.css';

function hasSession() {
  try {
    return Boolean(window.localStorage.getItem('token'));
  } catch {
    return false;
  }
}

function formatPrice(price) {
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND'
  }).format(price);
}

export default function Cart() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [busyProductId, setBusyProductId] = useState('');
  const [purchaseProduct, setPurchaseProduct] = useState(null);
  const [pagination, setPagination] = useState({ page: 1, totalPages: 0, total: 0, limit: 20 });

  const loadCart = useCallback(async (page = 1) => {
    setLoading(true);
    setError('');
    try {
      const result = await cartService.getCart({ page, limit: pagination.limit });
      setItems(result.items || []);
      setPagination(current => ({
        ...current,
        page: result.page || page,
        total: result.total || 0,
        totalPages: result.totalPages || 0
      }));
    } catch (failure) {
      setError(failure.message || 'Không thể tải giỏ hàng.');
    } finally {
      setLoading(false);
    }
  }, [pagination.limit]);

  useEffect(() => {
    if (hasSession()) {
      loadCart();
    } else {
      setLoading(false);
    }
  }, [loadCart]);

  async function handleRemove(productId) {
    setBusyProductId(productId);
    setError('');
    setNotice('');
    try {
      await cartService.removeFromCart(productId);
      const nextPage = items.length === 1 && pagination.page > 1
        ? pagination.page - 1
        : pagination.page;
      await loadCart(nextPage);
      setNotice('Đã xóa sản phẩm khỏi giỏ hàng.');
    } catch (failure) {
      setError(failure.message || 'Không thể xóa sản phẩm khỏi giỏ hàng.');
    } finally {
      setBusyProductId('');
    }
  }

  if (!hasSession()) {
    return (
      <section className="cart-page container">
        <h1>Giỏ hàng</h1>
        <p role="status">Đăng nhập để xem giỏ hàng đã lưu trên tài khoản của bạn.</p>
        <Link to="/">Tiếp tục xem sản phẩm</Link>
      </section>
    );
  }

  if (loading) {
    return <section className="cart-page container" role="status">Đang tải giỏ hàng...</section>;
  }

  return (
    <section className="cart-page container">
      <div className="cart-page__heading">
        <div>
          <h1>Giỏ hàng</h1>
          <p>{pagination.total} sản phẩm</p>
        </div>
        <Link to="/">Tiếp tục mua sắm</Link>
      </div>

      {error && <p className="cart-page__feedback cart-page__feedback--error" role="alert">{error}</p>}
      {notice && <p className="cart-page__feedback" role="status">{notice}</p>}

      {items.length === 0 ? (
        <div className="cart-page__empty">
          <h2>Giỏ hàng đang trống</h2>
          <p>Thêm sản phẩm bạn quan tâm để xem lại tại đây.</p>
          <Link to="/">Khám phá sản phẩm</Link>
        </div>
      ) : (
        <div className="cart-page__items">
          {items.map(item => {
            const product = item.product;
            if (!product) return null;
            return (
              <article className="cart-item" key={item._id}>
                <Link className="cart-item__image" to={`/product/${product._id}`}>
                  <img
                    src={getProductImageUrl(product)}
                    alt={product.title}
                    onError={event => handleImageError(event, 'product')}
                  />
                </Link>
                <div className="cart-item__details">
                  <Link to={`/product/${product._id}`}><h2>{product.title}</h2></Link>
                  <p>{formatPrice(product.price)}</p>
                  <p className="cart-item__seller">Người bán: {product.seller?.fullName || 'SecondSafe'}</p>
                </div>
                <div className="cart-item__actions">
                  <button
                    type="button"
                    className="cart-item__buy"
                    onClick={() => setPurchaseProduct(product)}
                    disabled={busyProductId === product._id}
                  >
                    Mua ngay
                  </button>
                  <button
                    type="button"
                    onClick={() => handleRemove(product._id)}
                    disabled={busyProductId === product._id}
                  >
                    Xóa
                  </button>
                </div>
              </article>
            );
          })}
          {pagination.totalPages > 1 && (
            <div className="cart-page__pagination">
              <button
                type="button"
                disabled={pagination.page <= 1}
                onClick={() => loadCart(pagination.page - 1)}
              >
                Trang trước
              </button>
              <span>Trang {pagination.page} / {pagination.totalPages}</span>
              <button
                type="button"
                disabled={pagination.page >= pagination.totalPages}
                onClick={() => loadCart(pagination.page + 1)}
              >
                Trang sau
              </button>
            </div>
          )}
          <p className="cart-page__note">Mỗi sản phẩm được tạo thành một đơn hàng riêng khi mua.</p>
        </div>
      )}

      {purchaseProduct && (
        <PurchaseRequest
          product={purchaseProduct}
          isQuickBuy
          onClose={() => setPurchaseProduct(null)}
          onSuccess={async () => {
            setPurchaseProduct(null);
            await loadCart(pagination.page);
            setNotice('Đã tạo đơn hàng thành công.');
          }}
        />
      )}
    </section>
  );
}
