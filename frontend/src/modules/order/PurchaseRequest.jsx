import React, { useState, useEffect } from 'react';
import { createPurchaseRequest } from '../../services/order.service';
import { getImageUrl } from '../../utils/imageHelper';
import './PurchaseRequest.css';
import { Alert, Button, Flex, Form, Input, InputNumber, Modal, Typography } from 'antd';
import { Check, PaperPlaneTilt } from '@phosphor-icons/react';

const formatPrice = (price) => new Intl.NumberFormat('vi-VN').format(price);

const PurchaseRequest = ({ product, onClose, onSuccess, isQuickBuy = false }) => {
  const [formData, setFormData] = useState({
    message: isQuickBuy ? 'Mua ngay' : '',
    agreedPrice: product?.price || 0
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (isQuickBuy && product) {
      setFormData({
        message: 'Mua ngay',
        agreedPrice: product.price
      });
    }
  }, [isQuickBuy, product]);

  const handleInputChange = (name, value) => {
    setFormData(prev => ({ ...prev, [name]: value }));

    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!isQuickBuy) {
      if (!formData.message.trim()) {
        newErrors.message = 'Vui lòng nhập tin nhắn';
      } else if (formData.message.trim().length < 10) {
        newErrors.message = 'Tin nhắn phải có ít nhất 10 ký tự';
      } else if (formData.message.trim().length > 500) {
        newErrors.message = 'Tin nhắn không được quá 500 ký tự';
      }

      if (!formData.agreedPrice || formData.agreedPrice <= 0) {
        newErrors.agreedPrice = 'Vui lòng nhập giá đề nghị hợp lệ';
      } else if (formData.agreedPrice < product.price) {
        newErrors.agreedPrice = 'Giá đề nghị phải bằng hoặc cao hơn giá sản phẩm';
      }
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
      const requestData = {
        listingId: product._id,
        message: formData.message.trim(),
        agreedPrice: formData.agreedPrice
      };

      const response = await createPurchaseRequest(requestData);

      if (onSuccess) {
        onSuccess(response, { isQuickBuy });
      }
    } catch (error) {
      console.error('Error creating purchase request:', error);
      setErrors({
        submit: error.message || 'Có lỗi xảy ra khi gửi yêu cầu'
      });
    } finally {
      setLoading(false);
    }
  };

  const submitLabel = loading
    ? (isQuickBuy ? 'Đang xác nhận...' : 'Đang gửi...')
    : (isQuickBuy ? 'Xác nhận mua ngay' : 'Gửi yêu cầu');

  return (
    <Modal open centered footer={null} title="Gửi yêu cầu mua hàng" width={560} onCancel={onClose} mask={{ closable: false }}>
      <Flex gap={14} align="center" className="purchase-request-product">
        <img
          src={getImageUrl(product?.images?.[0]) || '/placeholder-image.jpg'}
          alt={product?.title}
        />
        <div className="purchase-request-product__text">
          <Typography.Title level={4}>{product?.title}</Typography.Title>
          <Typography.Text type="secondary">Giá niêm yết: <strong>{formatPrice(product?.price)} VND</strong></Typography.Text>
          <Typography.Text type="secondary">Người bán: <strong>{product?.seller?.fullName}</strong></Typography.Text>
        </div>
      </Flex>

      <Flex justify="space-between" align="center" gap={12} className="purchase-request-total">
        <Typography.Text strong>Tổng tiền thanh toán:</Typography.Text>
        <Typography.Text strong className="purchase-request-total__value">{formatPrice(product?.price)} VND</Typography.Text>
      </Flex>

      <Form layout="vertical" onFinish={handleSubmit} className="purchase-request-form">
        {!isQuickBuy && (
          <>
            <Form.Item
              label="Tin nhắn cho người bán"
              htmlFor="message"
              required
              validateStatus={errors.message ? 'error' : undefined}
              help={errors.message}
            >
              <Input.TextArea
                id="message"
                value={formData.message}
                onChange={(e) => handleInputChange('message', e.target.value)}
                placeholder="Xin chào, tôi muốn mua sản phẩm này. Có thể thương lượng giá được không?"
                rows={4}
                showCount={{ formatter: ({ count }) => `${count}/500 ký tự` }}
              />
            </Form.Item>

            <Form.Item
              label="Giá đề nghị"
              htmlFor="agreedPrice"
              required
              validateStatus={errors.agreedPrice ? 'error' : undefined}
              help={errors.agreedPrice}
              extra={`Giá tối thiểu: ${formatPrice(product?.price)} VND`}
            >
              <InputNumber
                id="agreedPrice"
                className="purchase-request-price"
                value={formData.agreedPrice}
                onChange={(value) => handleInputChange('agreedPrice', Number(value) || 0)}
                min={0}
                step={1000}
                suffix="VND"
              />
            </Form.Item>
          </>
        )}

        {errors.submit && <Alert className="purchase-request-error" type="error" showIcon role="alert" title={errors.submit} />}

        <Flex justify="flex-end" gap={12}>
          <Button onClick={onClose} disabled={loading}>Hủy</Button>
          <Button type="primary" htmlType="submit" loading={loading} icon={isQuickBuy ? <Check /> : <PaperPlaneTilt />}>
            {submitLabel}
          </Button>
        </Flex>
      </Form>
    </Modal>
  );
};

export default PurchaseRequest;
