import React, { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import cartService from '../../services/cart.service';
import PurchaseRequest from '../order/PurchaseRequest';
import { getProductImageUrl, handleImageError } from '../../utils/imageHelper';
import LinkButton from '../../ui/LinkButton';
import './Cart.css';
import { Alert, Button, Card, Empty, Flex, Pagination, Spin, Typography } from 'antd';

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
        <Typography.Title level={1}>Giỏ hàng</Typography.Title>
        <Alert type="info" showIcon role="status" title="Đăng nhập để xem giỏ hàng đã lưu trên tài khoản của bạn." />
        <LinkButton type="link" to="/">Tiếp tục xem sản phẩm</LinkButton>
      </section>
    );
  }

  if (loading) {
    return (
      <Flex vertical align="center" gap={12} className="cart-page container" role="status">
        <Spin size="large" />
        <Typography.Text type="secondary">Đang tải giỏ hàng...</Typography.Text>
      </Flex>
    );
  }

  return (
    <section className="cart-page container">
      <Flex justify="space-between" align="center" wrap gap={16} className="cart-page__heading">
        <div>
          <Typography.Title level={1}>Giỏ hàng</Typography.Title>
          <Typography.Text type="secondary">{pagination.total} sản phẩm</Typography.Text>
        </div>
        <LinkButton to="/">Tiếp tục mua sắm</LinkButton>
      </Flex>

      {error && <Alert className="cart-page__feedback" type="error" showIcon role="alert" title={error} />}
      {notice && <Alert className="cart-page__feedback" type="success" showIcon role="status" title={notice} />}

      {items.length === 0 ? (
        <Empty
          image={Empty.PRESENTED_IMAGE_SIMPLE}
          description={(
            <Flex vertical gap={4}>
              <Typography.Title level={2}>Giỏ hàng đang trống</Typography.Title>
              <Typography.Text type="secondary">Thêm sản phẩm bạn quan tâm để xem lại tại đây.</Typography.Text>
            </Flex>
          )}
        >
          <LinkButton type="primary" to="/">Khám phá sản phẩm</LinkButton>
        </Empty>
      ) : (
        <Flex vertical gap={12} className="cart-page__items">
          {items.map(item => {
            const product = item.product;
            if (!product) return null;
            return (
              <Card className="cart-item" key={item._id}>
                <Flex align="center" gap={16} className="cart-item__body">
                  <Link className="cart-item__image" to={`/product/${product._id}`}>
                    <img
                      src={getProductImageUrl(product)}
                      alt={product.title}
                      onError={event => handleImageError(event, 'product')}
                    />
                  </Link>
                  <Flex vertical gap={4} className="cart-item__details">
                    <Link to={`/product/${product._id}`}><Typography.Title level={2}>{product.title}</Typography.Title></Link>
                    <Typography.Text className="cart-item__price">{formatPrice(product.price)}</Typography.Text>
                    <Typography.Text type="secondary">Người bán: {product.seller?.fullName || 'SecondSafe'}</Typography.Text>
                  </Flex>
                  <Flex gap={8} className="cart-item__actions">
                    <Button
                      type="primary"
                      onClick={() => setPurchaseProduct(product)}
                      disabled={busyProductId === product._id}
                    >
                      Mua ngay
                    </Button>
                    <Button
                      danger
                      onClick={() => handleRemove(product._id)}
                      disabled={busyProductId === product._id}
                    >
                      Xóa
                    </Button>
                  </Flex>
                </Flex>
              </Card>
            );
          })}
          <Pagination
            className="cart-page__pagination"
            align="center"
            hideOnSinglePage
            showSizeChanger={false}
            current={pagination.page}
            pageSize={pagination.limit}
            total={pagination.total}
            onChange={loadCart}
          />
          <Typography.Text type="secondary" className="cart-page__note">Mỗi sản phẩm được tạo thành một đơn hàng riêng khi mua.</Typography.Text>
        </Flex>
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
