import React, { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import productService from '../../services/product.service';
import favoriteService from '../../services/favorite.service';
import cartService from '../../services/cart.service';
import chatService from '../../services/chat.service';
import PurchaseRequest from '../order/PurchaseRequest';
import ReportProduct from '../report/ReportProduct';
import { getProductImageUrl, handleImageError } from '../../utils/imageHelper';
import LinkButton from '../../ui/LinkButton';
import './ProductDetail.css';
import { Alert, Button, Card, Col, Descriptions, Divider, Flex, Row, Spin, Typography } from 'antd';
import { ArrowLeft, Heart } from '@phosphor-icons/react';

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
    return (
      <Flex vertical align="center" justify="center" gap={12} className="product-detail-state" role="status">
        <Spin size="large" />
        <Typography.Text type="secondary">Đang tải thông tin sản phẩm...</Typography.Text>
      </Flex>
    );
  }

  if (error || !product) {
    const notFound = !error || error.status === 404;
    return (
      <Flex vertical align="center" justify="center" gap={12} className="product-detail-state" role={notFound ? 'status' : 'alert'}>
        <Typography.Title level={1}>{notFound ? 'Không tìm thấy sản phẩm' : 'Không thể tải sản phẩm'}</Typography.Title>
        <Typography.Paragraph type="secondary">
          {notFound ? 'Sản phẩm có thể đã bị gỡ hoặc không còn được bán.' : error.message}
        </Typography.Paragraph>
        <LinkButton type="primary" to="/">Quay lại danh sách sản phẩm</LinkButton>
      </Flex>
    );
  }

  const sellerName = product.seller?.fullName || 'Người bán SecondSafe';
  const sellerId = product.seller?._id;
  const isOwner = Boolean(sellerId) && String(currentUserId()) === String(sellerId);
  const facts = [
    product.condition && { key: 'condition', label: 'Tình trạng', children: CONDITION_LABELS[product.condition] || product.condition },
    (product.location?.district || product.location?.city) && {
      key: 'area',
      label: 'Khu vực',
      children: [product.location.district, product.location.city].filter(Boolean).join(', ')
    }
  ].filter(Boolean);

  return (
    <article className="product-detail container">
      <LinkButton className="product-detail__back" type="link" to="/" icon={<ArrowLeft />}>Quay lại danh sách</LinkButton>
      <Row gutter={[{ xs: 0, md: 32 }, 24]}>
        <Col xs={24} md={13}>
          <Card className="product-detail__image" styles={{ body: { padding: 0 } }}>
            <img
              src={getProductImageUrl(product)}
              alt={product.title}
              onError={event => handleImageError(event, 'product')}
            />
          </Card>
        </Col>
        <Col xs={24} md={11}>
          <Flex vertical gap={16} className="product-detail__information">
            <Typography.Text type="secondary">{product.category?.name || 'Sản phẩm'}</Typography.Text>
            <Typography.Title level={1}>{product.title}</Typography.Title>
            <Typography.Text className="product-detail__price">{formatPrice(product.price)}</Typography.Text>
            <Flex wrap gap={10} className="product-detail__actions">
              <Button
                type="primary"
                size="large"
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
              </Button>
              <Button size="large" disabled={actionLoading} onClick={handleAddToCart}>
                Thêm vào giỏ hàng
              </Button>
              <Button
                size="large"
                aria-pressed={isFavorite}
                disabled={actionLoading}
                icon={<Heart weight={isFavorite ? 'fill' : 'regular'} />}
                onClick={handleFavorite}
              >
                {isFavorite ? 'Đã yêu thích' : 'Thêm yêu thích'}
              </Button>
              <Button size="large" disabled={actionLoading} onClick={handleChatWithSeller}>
                Nhắn tin người bán
              </Button>
            </Flex>
            {actionError && <Alert type="error" showIcon role="alert" title={actionError} />}
            {notice && (
              <Alert
                type="success"
                showIcon
                role="status"
                title={<>{notice} {noticeDestination && <Link to={noticeDestination}>Mở danh sách</Link>}</>}
              />
            )}
            {facts.length > 0 && <Descriptions column={1} size="small" items={facts} />}
            <section className="product-detail__description">
              <Divider />
              <Typography.Title level={2}>Mô tả sản phẩm</Typography.Title>
              <Typography.Paragraph>{product.description}</Typography.Paragraph>
            </section>
            <section className="product-detail__seller">
              <Divider />
              <Typography.Title level={2}>Người bán</Typography.Title>
              <Typography.Paragraph>{sellerId ? <Link to={`/user/${sellerId}`}>{sellerName}</Link> : sellerName}</Typography.Paragraph>
              {isOwner ? (
                <Flex wrap gap={8}>
                  <LinkButton type="default" to={`/product/${product._id}/edit`}>Chỉnh sửa tin đăng</LinkButton>
                  <LinkButton type="default" to="/my-products">Quản lý tin của tôi</LinkButton>
                </Flex>
              ) : (
                <Button
                  type="link"
                  danger
                  className="product-detail__report"
                  onClick={() => { if (requireSession()) setReportOpen(true); }}
                >
                  Báo cáo tin đăng này
                </Button>
              )}
            </section>
          </Flex>
        </Col>
      </Row>
      {purchaseOpen && (
        <PurchaseRequest
          product={product}
          isQuickBuy
          onClose={() => setPurchaseOpen(false)}
          onSuccess={result => {
            setPurchaseOpen(false);
            const orderId = result?.data?._id;
            // A quick buy starts the payment window immediately, so the buyer goes straight to payment.
            navigate(orderId ? `/orders/${orderId}/pay` : '/orders');
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
