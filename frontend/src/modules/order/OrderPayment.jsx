import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { getOrderById, payOrder } from '../../services/order.service';
import walletService from '../../services/wallet.service';
import sePayService, { postToSepay } from '../../services/sepay.service';
import { getImageUrl } from '../../utils/imageHelper';
import { formatOrderPrice } from './orderStatus';
import './OrderPayment.css';
import { App as AntApp, Alert, Avatar, Button, Card, Col, Descriptions, Flex, Row, Spin, Typography } from 'antd';
import { Check, QrCode, ShieldCheck } from '@phosphor-icons/react';

const getUserId = (value) => value?._id || value?.id || value?.userId || value || null;

const formatLongDate = (date) => new Date(date).toLocaleDateString('vi-VN', {
  year: 'numeric',
  month: 'long',
  day: 'numeric',
  hour: '2-digit',
  minute: '2-digit'
});

const NOTICES = [
  'Tiền sẽ được giữ trong ký quỹ và chỉ chuyển cho người bán khi bạn xác nhận đã nhận hàng',
  'Nếu có tranh chấp, tiền sẽ được giữ cho đến khi giải quyết xong',
  'Sau 10 ngày kể từ khi người bán xác nhận giao hàng, tiền sẽ tự động được chuyển',
  'Bạn có thể liên hệ với người bán qua tính năng chat để thỏa thuận chi tiết'
];

const OrderPayment = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { message, modal } = AntApp.useApp();

  const [order, setOrder] = useState(null);
  const [balance, setBalance] = useState(0);
  const [loading, setLoading] = useState(true);
  const [paymentLoading, setPaymentLoading] = useState(false);
  const [error, setError] = useState(null);
  const [paymentMethod, setPaymentMethod] = useState('sepay');

  useEffect(() => {
    fetchOrderAndBalance();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const fetchOrderAndBalance = async () => {
    try {
      setLoading(true);
      const [orderData, balanceData] = await Promise.all([
        getOrderById(id),
        walletService.getBalance()
      ]);

      const normalizedOrder = orderData?.data || orderData;
      setOrder(normalizedOrder);
      setBalance(balanceData.balance);
      setPaymentMethod('sepay');
      setError(null);
    } catch (err) {
      setError(err.message || 'Không thể tải thông tin đơn hàng');
    } finally {
      setLoading(false);
    }
  };

  const payWithWallet = () => {
    if (balance < order.totalAmount) {
      modal.confirm({
        title: 'Số dư ví không đủ',
        content: 'Số dư ví không đủ để thanh toán. Bạn có muốn nạp tiền không?',
        okText: 'Nạp tiền',
        cancelText: 'Hủy',
        centered: true,
        onOk: () => navigate('/wallet/topup')
      });
      return;
    }

    modal.confirm({
      title: 'Xác nhận thanh toán',
      content: `Bạn có chắc chắn muốn thanh toán ${formatOrderPrice(order.totalAmount)} cho đơn hàng này bằng Ví Reflow?`,
      okText: 'Thanh toán',
      cancelText: 'Hủy',
      centered: true,
      onOk: async () => {
        setPaymentLoading(true);
        try {
          await payOrder(id);
          message.success('Thanh toán thành công! Tiền đã được chuyển vào ký quỹ và sẽ được chuyển cho người bán khi bạn xác nhận đã nhận hàng.');
          navigate('/orders');
        } catch (err) {
          message.error(err.message || 'Không thể thực hiện thanh toán');
        } finally {
          setPaymentLoading(false);
        }
      }
    });
  };

  const payWithSepay = async () => {
    setPaymentLoading(true);
    try {
      const response = await sePayService.createOrderPayment(id, {
        amount: order.totalAmount,
        orderInfo: `Thanh toan don hang ${order.orderCode || id.slice(-8)}`
      });

      if (response.checkoutUrl && response.fields) {
        postToSepay(response.checkoutUrl, response.fields);
      } else {
        throw new Error('Khong nhan duoc thong tin thanh toan tu SePay');
      }
    } catch (err) {
      message.error(err.message || 'Loi khi tao giao dich thanh toan qua SePay');
      setPaymentLoading(false);
    }
  };

  const handlePayment = () => {
    if (paymentMethod === 'wallet') {
      payWithWallet();
    } else if (paymentMethod === 'sepay') {
      payWithSepay();
    }
  };

  if (loading) {
    return (
      <div className="order-payment-container container">
        <Flex justify="center" gap={12} className="order-payment-loading" role="status">
          <Spin />
          <Typography.Text type="secondary">Đang tải...</Typography.Text>
        </Flex>
      </div>
    );
  }

  if (error) {
    return (
      <div className="order-payment-container container">
        <Alert
          type="error"
          showIcon
          role="alert"
          title={error}
          action={<Button size="small" type="primary" onClick={() => navigate('/orders')}>Quay lại danh sách đơn hàng</Button>}
        />
      </div>
    );
  }

  if (!order) {
    return null;
  }

  if (!user || String(getUserId(order.buyer)) !== String(getUserId(user))) {
    return (
      <div className="order-payment-container container">
        <Alert
          type="error"
          showIcon
          role="alert"
          title="Bạn không có quyền truy cập trang này"
          action={<Button size="small" type="primary" onClick={() => navigate('/')}>Quay lại trang chủ</Button>}
        />
      </div>
    );
  }

  if (order.status !== 'awaiting_payment' && order.status !== 'pending') {
    return (
      <div className="order-payment-container container">
        <Alert
          type="info"
          showIcon
          role="status"
          title="Đơn hàng này đã được thanh toán hoặc không thể thanh toán."
          action={<Button size="small" type="primary" onClick={() => navigate(`/orders/${id}`)}>Xem chi tiết đơn hàng</Button>}
        />
      </div>
    );
  }

  const seller = order.seller;

  return (
    <div className="order-payment-container container">
      <div className="order-payment-header">
        <Typography.Title level={1}>Thanh toán đơn hàng</Typography.Title>
        <Typography.Paragraph type="secondary">Xác nhận và thanh toán cho đơn hàng của bạn</Typography.Paragraph>
      </div>

      <Row gutter={[{ xs: 0, md: 24 }, 24]} className="payment-content">
        <Col xs={24} md={13}>
          <Card className="payment-card" title={<Typography.Title level={2}>Thông tin đơn hàng</Typography.Title>}>
            <Descriptions
              size="small"
              column={1}
              items={[
                { key: 'code', label: 'Mã đơn hàng', children: <strong>#{order.orderCode || order._id.slice(-8).toUpperCase()}</strong> },
                { key: 'date', label: 'Ngày tạo', children: formatLongDate(order.createdAt) }
              ]}
            />

            <Flex gap={14} className="payment-product">
              <img
                src={getImageUrl(order.listing?.images?.[0]) || '/placeholder-image.jpg'}
                alt={order.listing?.title}
              />
              <div className="payment-product__text">
                <Typography.Title level={3}>{order.listing?.title}</Typography.Title>
                <Typography.Text type="secondary">Tình trạng: {order.listing?.condition}</Typography.Text>
                <Typography.Text type="secondary">
                  Khu vực: {order.listing?.location?.district}, {order.listing?.location?.city}
                </Typography.Text>
              </div>
            </Flex>

            <Typography.Title level={4} className="payment-section-title">Thông tin người bán</Typography.Title>
            <Flex gap={12} align="center">
              <Avatar
                src={seller?.avatar ? getImageUrl(seller.avatar) : undefined}
                alt={seller?.fullName}
              >
                {seller?.fullName?.charAt(0).toUpperCase()}
              </Avatar>
              <div className="payment-product__text">
                <Typography.Text strong>{seller?.fullName}</Typography.Text>
                <Typography.Text type="secondary">{seller?.email}</Typography.Text>
              </div>
            </Flex>
          </Card>
        </Col>

        <Col xs={24} md={11}>
          <Card className="payment-card" title={<Typography.Title level={2}>Chi tiết thanh toán</Typography.Title>}>
            <Descriptions
              size="small"
              column={1}
              items={[
                { key: 'price', label: 'Giá sản phẩm', children: formatOrderPrice(order.agreedPrice) },
                { key: 'total', label: 'Tổng cần thanh toán', children: <strong className="payment-total">{formatOrderPrice(order.totalAmount)}</strong> }
              ]}
            />

            <Typography.Title level={4} className="payment-section-title">Chọn phương thức thanh toán</Typography.Title>
            <Flex align="center" gap={14} className="payment-method">
              <img
                src="/images/sepay-logo.png"
                alt="Bank Transfer"
                className="payment-method__logo"
                onError={(e) => {
                  e.currentTarget.onerror = null;
                  e.currentTarget.src = '/images/logo/logo.png';
                }}
              />
              <div className="payment-method__info">
                <Typography.Title level={5}>Chuyển khoản Ngân hàng</Typography.Title>
                <Typography.Text type="secondary">Xử lý tự động 24/7 qua mã QR</Typography.Text>
              </div>
              <Check className="payment-method__check" />
            </Flex>

            <Alert
              className="payment-secure"
              type="success"
              showIcon
              icon={<ShieldCheck />}
              role="note"
              title="Thanh toán An toàn:"
              description="Hệ thống sẽ chuyển bạn đến Cổng giao dịch tự động. Đơn hàng sẽ được xác nhận 24/7 ngay sau khi bạn quét mã QR chuyển khoản thành công."
            />

            <Flex justify="flex-end" gap={12} className="payment-actions">
              <Button onClick={() => navigate('/orders')} disabled={paymentLoading}>Hủy</Button>
              <Button type="primary" icon={<QrCode />} loading={paymentLoading} onClick={handlePayment}>
                {paymentLoading ? 'Đang xử lý...' : 'Quét mã QR thanh toán'}
              </Button>
            </Flex>
          </Card>
        </Col>
      </Row>

      <Alert
        className="payment-notice"
        type="info"
        showIcon
        role="note"
        title="Lưu ý quan trọng:"
        description={<ul>{NOTICES.map(notice => <li key={notice}>{notice}</li>)}</ul>}
      />
    </div>
  );
};

export default OrderPayment;
