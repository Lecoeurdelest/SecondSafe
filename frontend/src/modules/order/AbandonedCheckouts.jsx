import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import abandonedCheckoutService from '../../services/abandonedCheckout.service';
import { getProductImageUrl, handleImageError } from '../../utils/imageHelper';
import LinkButton from '../../ui/LinkButton';
import './AbandonedCheckouts.css';
import { Alert, Button, Card, Flex, Typography } from 'antd';

function hasSession() {
  try {
    return Boolean(window.localStorage.getItem('token'));
  } catch {
    return false;
  }
}

function formatPrice(price) {
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(price || 0);
}

function timeLabel(value) {
  return new Intl.DateTimeFormat('vi-VN', { timeStyle: 'short', dateStyle: 'short' }).format(new Date(value));
}

function describe(checkout) {
  if (checkout.action === 'resume_payment') return `Đơn hàng sẽ tự hủy lúc ${timeLabel(checkout.paymentDeadline)} nếu chưa thanh toán.`;
  if (checkout.source === 'cart') return 'Sản phẩm vẫn đang chờ trong giỏ hàng của bạn.';
  return 'Đơn hàng đã hủy vì quá hạn thanh toán. Sản phẩm vẫn còn bán.';
}

// Lists the buyer's unfinished checkouts with the one step that completes each of them.
export default function AbandonedCheckouts() {
  const [checkouts, setCheckouts] = useState([]);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    if (!hasSession()) return undefined;
    abandonedCheckoutService.getMine()
      .then(result => { if (active) setCheckouts(result); })
      .catch(() => { /* The list is a convenience; the page below still works without it. */ });
    return () => { active = false; };
  }, []);

  async function handleDismiss(id) {
    setError('');
    try {
      await abandonedCheckoutService.dismiss(id);
      setCheckouts(current => current.filter(checkout => checkout._id !== id));
    } catch (failure) {
      setError(failure.message || 'Không thể ẩn mục này.');
    }
  }

  if (!checkouts.length) return null;

  return (
    <section className="abandoned-checkouts container" aria-labelledby="abandoned-checkouts-title">
      <Card className="abandoned-checkouts__card">
        <Typography.Title level={2} id="abandoned-checkouts-title">Thanh toán dang dở</Typography.Title>
        {error && <Alert className="abandoned-checkouts__error" type="error" showIcon role="alert" title={error} />}
        <ul className="abandoned-checkouts__list">
          {checkouts.map(checkout => (
            <li className="abandoned-checkouts__item" key={checkout._id}>
              <Flex gap={14} align="center" wrap>
                <img className="abandoned-checkouts__image" src={getProductImageUrl(checkout.product)} alt="" onError={event => handleImageError(event, 'product')} />
                <div className="abandoned-checkouts__body">
                  <Link to={`/product/${checkout.product._id}`}>{checkout.product.title}</Link>
                  <Typography.Text strong>{formatPrice(checkout.amount)}</Typography.Text>
                  <Typography.Text type="secondary">{describe(checkout)}</Typography.Text>
                </div>
                <Flex gap={8} wrap className="abandoned-checkouts__actions">
                  {checkout.action === 'resume_payment'
                    ? <LinkButton type="primary" to={`/orders/${checkout.orderId}/pay`}>Tiếp tục thanh toán</LinkButton>
                    : <LinkButton type="primary" to={`/product/${checkout.product._id}`}>Mua lại</LinkButton>}
                  <Button onClick={() => handleDismiss(checkout._id)}>Bỏ qua</Button>
                </Flex>
              </Flex>
            </li>
          ))}
        </ul>
      </Card>
    </section>
  );
}
