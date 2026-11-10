import React, { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import productService from '../../services/product.service';
import favoriteService from '../../services/favorite.service';
import cartService from '../../services/cart.service';
import chatService from '../../services/chat.service';
import PurchaseRequest from '../order/PurchaseRequest';
import ReportProduct from '../report/ReportProduct';
import { getProductImageUrl, handleImageError } from '../../utils/imageHelper';
import './ProductDetail.css';

const CONDITION_LABELS = {
  new: 'Mới',
  'like-new': 'Như mới',
  good: 'Tốt',
  fair: 'Khá',
  poor: 'Đã qua sử dụng'
};

function formatPrice(price) {
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND'
  }).format(price);
}

function hasSession() {
  try {
    return Boolean(window.localStorage.getItem('token'));
  } catch {
    return false;
  }
}

function currentUserId() {
  try {
    const user = JSON.parse(window.localStorage.getItem('user'));
    return user?._id || user?.id || null;
  } catch {
    return null;
  }
}

export default function ProductDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isFavorite, setIsFavorite] = useState(false);
  const [actionError, setActionError] = useState('');
  const [notice, setNotice] = useState('');
  const [noticeDestination, setNoticeDestination] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [purchaseOpen, setPurchaseOpen] = useState(false);
  const [reportOpen, setReportOpen] = useState(false);

  useEffect(() => {
    let active = true;
    setProduct(null);
    setLoading(true);
    setError(null);

    productService.getProductById(id)
      .then(result => {
        if (active) setProduct(result);
      })
      .catch(failure => {
        if (active) setError(failure);
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => { active = false; };
  }, [id]);

  useEffect(() => {
    let active = true;
    if (!product || !hasSession()) {
      setIsFavorite(false);
      return () => { active = false; };
    }

    favoriteService.checkFavorite(product._id)
      .then(result => {
        if (active) setIsFavorite(Boolean(result.data?.isFavorite));
      })
      .catch(() => {
        if (active) setIsFavorite(false);
      });

    return () => { active = false; };
  }, [product]);

  function requireSession() {
    if (hasSession()) return true;
    setActionError('Vui lòng đăng nhập để mua, lưu yêu thích hoặc thêm sản phẩm vào giỏ hàng.');
    return false;
  }

  async function handleAddToCart() {
    if (!requireSession()) return;
    setActionLoading(true);
    setActionError('');
    setNotice('');
    setNoticeDestination('');
    try {
      await cartService.addToCart(product._id);
      setNotice('Đã thêm sản phẩm vào giỏ hàng.');
      setNoticeDestination('/cart');
    } catch (failure) {
      setActionError(failure.message || 'Không thể thêm sản phẩm vào giỏ hàng.');
    } finally {
      setActionLoading(false);
    }
  }

  async function handleFavorite() {
    if (!requireSession()) return;
    setActionLoading(true);
    setActionError('');
    setNotice('');
    setNoticeDestination('');
    try {
      if (isFavorite) {
        await favoriteService.removeFavorite(product._id);
        setIsFavorite(false);
        setNotice('Đã xóa sản phẩm khỏi danh sách yêu thích.');
      } else {
        await favoriteService.addFavorite(product._id);
        setIsFavorite(true);
        setNotice('Đã thêm sản phẩm vào danh sách yêu thích.');
        setNoticeDestination('/favorites');
      }
    } catch (failure) {
      setActionError(failure.message || 'Không thể cập nhật danh sách yêu thích.');
    } finally {
      setActionLoading(false);
    }
  }

  async function handleChatWithSeller() {
    if (!requireSession()) return;
    setActionLoading(true);
    setActionError('');
    setNotice('');
    setNoticeDestination('');
    try {
      const sellerId = product.seller?._id;
      if (!sellerId) throw new Error('Không thể xác định người bán của sản phẩm này.');
      const result = await chatService.openConversation(sellerId, product._id);
      const conversationId = result?.conversation?._id || result?._id;
      if (!conversationId) throw new Error('Máy chủ chưa trả về cuộc trò chuyện.');
      navigate(`/chat/${conversationId}`);
    } catch (failure) {
      setActionError(failure.message || 'Không thể mở cuộc trò chuyện với người bán.');
    } finally {
      setActionLoading(false);
    }
  }

  if (loading) {
    return <section className="product-detail-state" role="status">Đang tải thông tin sản phẩm...</section>;
  }

  if (error || !product) {
    const notFound = error?.status === 404 || !product;
    return (
      <section className="product-detail-state" role={notFound ? 'status' : 'alert'}>
        <h1>{notFound ? 'Không tìm thấy sản phẩm' : 'Không thể tải sản phẩm'}</h1>
        <p>{notFound ? 'Sản phẩm có thể đã bị gỡ hoặc không còn được bán.' : error.message}</p>
        <Link to="/">Quay lại danh sách sản phẩm</Link>
      </section>
    );
  }

  const sellerName = product.seller?.fullName || 'Người bán SecondSafe';
  const sellerId = product.seller?._id;
  const isOwner = Boolean(sellerId) && String(currentUserId()) === String(sellerId);

  return (
    <article className="product-detail container">
      <Link className="product-detail__back" to="/">← Quay lại danh sách</Link>
      <div className="product-detail__layout">
        <div className="product-detail__image">
          <img
            src={getProductImageUrl(product)}
            alt={product.title}
            onError={event => handleImageError(event, 'product')}
          />
        </div>
        <section className="product-detail__information">
          <p className="product-detail__category">{product.category?.name || 'Sản phẩm'}</p>
          <h1>{product.title}</h1>
          <p className="product-detail__price">{formatPrice(product.price)}</p>
          <div className="product-detail__actions">
            <button
              type="button"
              className="product-detail__button product-detail__button--primary"
              disabled={actionLoading}
              onClick={() => {
                if (requireSession()) {
                  setActionError('');
                  setNotice('');
                  setNoticeDestination('');
                  setPurchaseOpen(true);
                }
              }}
            >
              Mua ngay
            </button>
            <button
              type="button"
              className="product-detail__button"
              disabled={actionLoading}
              onClick={handleAddToCart}
            >
              Thêm vào giỏ hàng
            </button>
            <button
              type="button"
              className="product-detail__button"
              aria-pressed={isFavorite}
              disabled={actionLoading}
              onClick={handleFavorite}
            >
              {isFavorite ? '♥ Đã yêu thích' : '♡ Thêm yêu thích'}
            </button>
            <button
              type="button"
              className="product-detail__button"
              disabled={actionLoading}
              onClick={handleChatWithSeller}
            >
              Nhắn tin người bán
            </button>
          </div>
          {actionError && <p className="product-detail__feedback product-detail__feedback--error" role="alert">{actionError}</p>}
          {notice && (
            <p className="product-detail__feedback" role="status">
              {notice} {noticeDestination && <Link to={noticeDestination}>Mở danh sách</Link>}
            </p>
          )}
          <dl className="product-detail__facts">
            {product.condition && (
              <>
                <dt>Tình trạng</dt>
                <dd>{CONDITION_LABELS[product.condition] || product.condition}</dd>
              </>
            )}
            {(product.location?.district || product.location?.city) && (
              <>
                <dt>Khu vực</dt>
                <dd>{[product.location.district, product.location.city].filter(Boolean).join(', ')}</dd>
              </>
            )}
          </dl>
          <section className="product-detail__description">
            <h2>Mô tả sản phẩm</h2>
            <p>{product.description}</p>
          </section>
          <section className="product-detail__seller">
            <h2>Người bán</h2>
            <p>{sellerId ? <Link to={`/user/${sellerId}`}>{sellerName}</Link> : sellerName}</p>
            {isOwner ? (
              <p><Link to={`/product/${product._id}/edit`}>Chỉnh sửa tin đăng</Link> · <Link to="/my-products">Quản lý tin của tôi</Link></p>
            ) : (
              <button
                type="button"
                className="product-detail__report"
                onClick={() => { if (requireSession()) setReportOpen(true); }}
              >
                Báo cáo tin đăng này
              </button>
            )}
          </section>
        </section>
      </div>
      {purchaseOpen && (
        <PurchaseRequest
          product={product}
          isQuickBuy
          onClose={() => setPurchaseOpen(false)}
          onSuccess={result => {
            setPurchaseOpen(false);
            const orderId = result?.data?._id;
            setNotice(orderId
              ? `Đã tạo đơn hàng ${orderId}.`
              : 'Đã tạo đơn hàng thành công.');
            setNoticeDestination('');
          }}
        />
      )}
      {reportOpen && (
        <ReportProduct
          product={product}
          onSuccess={() => {
            setReportOpen(false);
            setActionError('');
            setNotice('Báo cáo đã được gửi. Chúng tôi sẽ xem xét trong thời gian sớm nhất.');
            setNoticeDestination('');
          }}
          onCancel={() => setReportOpen(false)}
        />
      )}
    </article>
  );
}
