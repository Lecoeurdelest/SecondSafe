import React, { useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import sePayService from '../../services/sepay.service';
import LinkButton from '../../ui/LinkButton';
import './TopUp.css';
import { App as AntApp, Alert, Button, Card, Descriptions, Flex, Form, Input, Typography } from 'antd';
import { ArrowLeft, Check, Lock } from '@phosphor-icons/react';

const TopUp = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { message } = AntApp.useApp();

  const [amount, setAmount] = useState('');
  const [orderInfo, setOrderInfo] = useState('');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  // Predefined amounts
  const predefinedAmounts = [
    50000, 100000, 200000, 500000, 1000000, 2000000
  ];

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  const handleAmountChange = (e) => {
    const value = e.target.value.replace(/[^0-9]/g, '');
    setAmount(value);
    
    if (errors.amount) {
      setErrors(prev => ({ ...prev, amount: '' }));
    }
  };

  const handlePredefinedAmount = (value) => {
    setAmount(value.toString());
    if (errors.amount) {
      setErrors(prev => ({ ...prev, amount: '' }));
    }
  };

  const validateForm = () => {
    const newErrors = {};
    const amountNum = Number(amount);

    if (!amount || !Number.isFinite(amountNum) || amountNum <= 0) {
      newErrors.amount = 'Vui lòng nhập số tiền hợp lệ';
    } else if (!Number.isInteger(amountNum)) {
      newErrors.amount = 'Số tiền nạp phải là số nguyên VND';
    } else if (amountNum < 10000) {
      newErrors.amount = 'Số tiền nạp tối thiểu là 10,000 VNĐ';
    } else if (amountNum > 500000000) {
      newErrors.amount = 'Số tiền nạp tối đa là 500,000,000 VNĐ';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      return;
    }

    setLoading(true);

    try {
      const normalizedAmount = Number(amount);
      const paymentData = {
        amount: normalizedAmount,
        orderInfo: orderInfo?.trim() || `Nạp ${normalizedAmount.toLocaleString('vi-VN')} VNĐ vào ví`
      };

      // Gọi backend lấy thông tin form thanh toán SePay
      const result = await sePayService.createPayment(paymentData);
      const { checkoutUrl, fields } = result;

      // Tạo form ẩn và POST sang trang thanh toán SePay
      const form = document.createElement('form');
      form.method = 'POST';
      form.action = checkoutUrl;

      Object.entries(fields).forEach(([key, value]) => {
        const input = document.createElement('input');
        input.type = 'hidden';
        input.name = key;
        input.value = value;
        form.appendChild(input);
      });

      document.body.appendChild(form);
      form.submit();
    } catch (error) {
      message.error(error.message || 'Không thể tạo thanh toán. Vui lòng thử lại.');
      setLoading(false);
    }
  };

  const formatPrice = (price) => {
    return new Intl.NumberFormat('vi-VN').format(price);
  };

  const amountNumber = parseInt(amount);

  return (
    <div className="topup-container container">
      <div className="topup-header">
        <LinkButton type="link" to="/wallet" icon={<ArrowLeft />} className="back-btn">Quay lại</LinkButton>
        <Typography.Title level={1}>Nạp tiền vào ví</Typography.Title>
        <Typography.Paragraph type="secondary">Chọn số tiền bạn muốn nạp vào ví</Typography.Paragraph>
      </div>

      <div className="topup-content">
        <Form layout="vertical" onFinish={handleSubmit} className="topup-form">
          <Card className="topup-section" title={<Typography.Title level={2}>Chọn nhanh</Typography.Title>}>
            <Flex wrap gap={10} className="amount-grid">
              {predefinedAmounts.map(value => (
                <Button
                  key={value}
                  type={amount === value.toString() ? 'primary' : 'default'}
                  aria-pressed={amount === value.toString()}
                  onClick={() => handlePredefinedAmount(value)}
                >
                  {formatPrice(value)} VNĐ
                </Button>
              ))}
            </Flex>
          </Card>

          <Card className="topup-section" title={<Typography.Title level={2}>Hoặc nhập số tiền khác</Typography.Title>}>
            <Form.Item
              label="Số tiền (VNĐ)"
              htmlFor="amount"
              required
              validateStatus={errors.amount ? 'error' : undefined}
              help={errors.amount}
              extra="Số tiền nạp từ 10,000 VNĐ đến 500,000,000 VNĐ"
            >
              <Input id="amount" value={amount} onChange={handleAmountChange} placeholder="VD: 100000" suffix="VNĐ" inputMode="numeric" />
            </Form.Item>

            <Form.Item label="Ghi chú (tùy chọn)" htmlFor="orderInfo">
              <Input
                id="orderInfo"
                value={orderInfo}
                onChange={(e) => setOrderInfo(e.target.value)}
                placeholder="VD: Nạp tiền mua sản phẩm"
                maxLength={100}
              />
            </Form.Item>
          </Card>

          {amount && amountNumber >= 10000 && (
            <Card className="topup-section payment-summary" title={<Typography.Title level={3}>Thông tin thanh toán</Typography.Title>}>
              <Descriptions
                column={1}
                size="small"
                items={[
                  { key: 'amount', label: 'Số tiền nạp', children: `${formatPrice(amountNumber)} VNĐ` },
                  { key: 'fee', label: 'Phí giao dịch', children: 'Miễn phí' },
                  { key: 'total', label: 'Tổng thanh toán', children: <strong className="total-amount">{formatPrice(amountNumber)} VNĐ</strong> }
                ]}
              />
            </Card>
          )}

          <Card className="topup-section" title={<Typography.Title level={2}>Phương thức thanh toán</Typography.Title>}>
            <Flex align="center" gap={16} className="topup-method">
              <img
                src="/images/sepay-logo.png"
                alt="SePay"
                className="topup-method__logo"
                onError={(e) => {
                  e.currentTarget.onerror = null;
                  e.currentTarget.src = '/images/logo/logo.png';
                }}
              />
              <div className="topup-method__info">
                <Typography.Title level={4}>Chuyển khoản Ngân hàng</Typography.Title>
                <Typography.Text type="secondary">Xử lý tự động 24/7 qua mã QR (Nhanh chóng & An toàn)</Typography.Text>
              </div>
              <Check className="topup-method__check" />
            </Flex>
          </Card>

          <Flex justify="flex-end" gap={12} className="topup-actions">
            <Button size="large" onClick={() => navigate('/wallet')} disabled={loading}>Hủy</Button>
            <Button type="primary" size="large" htmlType="submit" disabled={loading || !amount || amountNumber < 10000}>
              {loading ? 'Đang xử lý...' : 'Thanh toán'}
            </Button>
          </Flex>
        </Form>

        <Alert
          className="security-notice"
          type="info"
          showIcon
          icon={<Lock />}
          title="Bảo mật thanh toán"
          description={(
            <ul>
              <li>Giao dịch được mã hóa SSL 256-bit</li>
              <li>Không lưu trữ thông tin thẻ ngân hàng</li>
              <li>Tuân thủ tiêu chuẩn bảo mật PCI DSS</li>
              <li>Hỗ trợ 24/7 cho mọi vấn đề thanh toán</li>
            </ul>
          )}
        />
      </div>
    </div>
  );
};

export default TopUp;
