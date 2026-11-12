import React, { useState } from 'react';
import { confirmShipment } from '../../services/order.service';
import LocationSelector from '../../components/LocationSelector';
import { useAuth } from '../../hooks/useAuth';
import { formatOrderPrice } from './orderStatus';
import './ShipOrder.css';
import { Alert, Button, Checkbox, Descriptions, Flex, Form, Input, Modal, Select, Typography } from 'antd';
import { Truck } from '@phosphor-icons/react';

const ShipOrder = ({ order, onClose, onSuccess }) => {
  const { user } = useAuth();
  const getDisplayOrderCode = () => order?.orderCode || order?._id?.slice(-8)?.toUpperCase() || 'N/A';
  
  // Ưu tiên lấy địa chỉ từ bài đăng (listing), fallback sang profile người bán
  const listing = order?.listing || order?.productId || {};
  const listingLoc = listing?.location || {};
  
  const defaultRecipientName = String(user?.fullName || order?.seller?.fullName || '').trim();
  const defaultShippingPhone = String(user?.phone || order?.seller?.phone || '').trim();
  
  // Xây dựng địa chỉ mặc định từ địa chỉ đăng bán (listing)
  const listingLocParts = [listing?.specificAddress, listingLoc.ward, listingLoc.district, listingLoc.city].filter(Boolean);
  let defaultShippingAddress = listingLocParts.length > 0
    ? listingLocParts.join(', ')
    : String(user?.address || '').trim();
  
  // Nếu listing không có địa chỉ, dùng profile của người bán
  if (!defaultShippingAddress) {
    const userLoc = user?.location || {};
    const userParts = [user?.specificAddress, userLoc.ward, userLoc.district, userLoc.city].filter(Boolean);
    defaultShippingAddress = userParts.length > 0 ? userParts.join(', ') : '';
  }

  // Pre-fill location codes từ listing để mở đúng dropdown khi tùy chỉnh
  const defaultShippingLocation = {
    city: listingLoc.city || '',
    district: listingLoc.district || '',
    ward: listingLoc.ward || '',
    provinceCode: listingLoc.provinceCode || null,
    districtCode: listingLoc.districtCode || null,
    wardCode: listingLoc.wardCode || null
  };

  const buildTrackingNumber = (provider) => {
    const normalizedProvider = String(provider || 'sys').replace(/[^a-zA-Z0-9]/g, '').toUpperCase().slice(0, 4) || 'SYS';
    const code = getDisplayOrderCode().replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
    const orderSuffix = code.slice(-6) || Math.random().toString(36).slice(2, 8).toUpperCase();
    const randomSuffix = Math.random().toString(36).slice(2, 8).toUpperCase();
    return `${normalizedProvider}-${orderSuffix}-${randomSuffix}`;
  };

  const [formData, setFormData] = useState({
    trackingNumber: buildTrackingNumber('ghn'),
    shippingProvider: 'ghn',
    estimatedDelivery: '',
    notes: '',
    shippingRecipientName: defaultRecipientName,
    shippingPhone: defaultShippingPhone,
    shippingAddress: defaultShippingAddress,
    shippingLocation: defaultShippingLocation,
    shippingSpecificAddress: listing?.specificAddress || '',
    useCustomShippingAddress: false
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});


  const shippingProviders = [
    { value: 'ghn', label: 'Giao Hàng Nhanh (GHN)' },
    { value: 'ghtk', label: 'Giao Hàng Tiết Kiệm (GHTK)' },
    { value: 'vnpost', label: 'Bưu điện Việt Nam' },
    { value: 'viettel', label: 'Viettel Post' },
    { value: 'jnt', label: 'J&T Express' },
    { value: 'other', label: 'Khác' }
  ];

  const handleInputChange = (name, value) => {
    setFormData(prev => ({
      ...prev,
      [name]: value,
      ...(name === 'shippingProvider' ? { trackingNumber: buildTrackingNumber(value) } : {})
    }));
    
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const handleLocationChange = (locationData) => {
    setFormData(prev => ({
      ...prev,
      shippingLocation: locationData
    }));
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.trackingNumber.trim()) {
      newErrors.trackingNumber = 'Vui lòng nhập mã vận đơn';
    }

    if (!formData.shippingProvider) {
      newErrors.shippingProvider = 'Vui lòng chọn đơn vị vận chuyển';
    }

    if (!formData.shippingRecipientName.trim()) {
      newErrors.shippingRecipientName = 'Vui lòng nhập người nhận hàng';
    }

    if (!formData.shippingPhone.trim()) {
      newErrors.shippingPhone = 'Vui lòng nhập số điện thoại nhận hàng';
    }

    if (formData.useCustomShippingAddress) {
      if (!formData.shippingLocation.city || !formData.shippingLocation.district || !formData.shippingLocation.ward) {
        newErrors.shippingLocation = 'Vui lòng chọn đầy đủ cấp độ Khu vực';
      }
      if (!formData.shippingSpecificAddress.trim()) {
        newErrors.shippingSpecificAddress = 'Vui lòng nhập Địa chỉ cụ thể';
      }
    } else {
      if (!formData.shippingAddress.trim()) {
        newErrors.shippingAddress = 'Địa chỉ thiếu. Vui lòng bật Tùy chỉnh để thêm địa chỉ giao hàng.';
      }
    }

    if (!formData.estimatedDelivery) {
      newErrors.estimatedDelivery = 'Vui lòng chọn ngày dự kiến giao hàng';
    } else {
      const selectedDate = new Date(formData.estimatedDelivery);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      if (selectedDate < today) {
        newErrors.estimatedDelivery = 'Ngày giao hàng không thể là ngày trong quá khứ';
      }
    }

    if (formData.notes && formData.notes.length > 500) {
      newErrors.notes = 'Ghi chú không được quá 500 ký tự';
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
      let finalAddress = formData.shippingAddress;
      if (formData.useCustomShippingAddress) {
        const loc = formData.shippingLocation;
        const parts = [formData.shippingSpecificAddress, loc.ward, loc.district, loc.city].filter(Boolean);
        finalAddress = parts.join(', ');
      }

      const shipmentData = {
        trackingNumber: formData.trackingNumber.trim(),
        shippingProvider: formData.shippingProvider,
        estimatedDelivery: formData.estimatedDelivery,
        notes: formData.notes.trim(),
        shippingRecipientName: formData.shippingRecipientName.trim(),
        shippingPhone: formData.shippingPhone.trim(),
        shippingAddress: finalAddress.trim()
      };

      await confirmShipment(order._id, shipmentData);
      
      if (onSuccess) {
        onSuccess();
      }
    } catch (error) {
      console.error('Error confirming shipment:', error);
      setErrors({
        submit: error.message || 'Có lỗi xảy ra khi xác nhận giao hàng'
      });
    } finally {
      setLoading(false);
    }
  };

  const formatDateTime = (date) => {
    if (!date) return 'N/A';
    return new Date(date).toLocaleString('vi-VN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusLabel = (status) => {
    const labels = {
      awaiting_seller_confirmation: 'Chờ người bán xác nhận',
      awaiting_payment: 'Chờ thanh toán',
      paid: 'Đã thanh toán',
      shipped: 'Đang giao hàng',
      completed: 'Hoàn thành',
      cancelled: 'Đã hủy',
      disputed: 'Đang tranh chấp'
    };
    return labels[status] || status || 'N/A';
  };

  const today = new Date();
  const minDate = today.toISOString().split('T')[0];

  const fieldState = (name) => ({
    validateStatus: errors[name] ? 'error' : undefined,
    help: errors[name]
  });

  const toggleCustomAddress = (useCustomShippingAddress) => {
    setFormData((prev) => ({
      ...prev,
      useCustomShippingAddress,
      shippingRecipientName: useCustomShippingAddress ? prev.shippingRecipientName : defaultRecipientName,
      shippingPhone: useCustomShippingAddress ? prev.shippingPhone : defaultShippingPhone,
      shippingAddress: useCustomShippingAddress ? prev.shippingAddress : defaultShippingAddress
    }));
  };

  return (
    <Modal open centered footer={null} title="Xác nhận giao hàng" width={720} onCancel={onClose} mask={{ closable: false }}>
      <Typography.Title level={4} className="ship-order-heading">Thông tin đơn hàng</Typography.Title>
      <Descriptions
        size="small"
        column={{ xs: 1, sm: 2 }}
        className="ship-order-summary"
        items={[
          { key: 'code', label: 'Mã đơn hàng', children: `#${getDisplayOrderCode()}` },
          { key: 'product', label: 'Sản phẩm', children: order.listing?.title },
          { key: 'status', label: 'Trạng thái', children: getStatusLabel(order.status) },
          { key: 'value', label: 'Giá trị', children: formatOrderPrice(order.totalAmount) },
          { key: 'buyer', label: 'Người mua', children: order.buyer?.fullName },
          { key: 'phone', label: 'SĐT người mua', children: order.buyer?.phone || 'Chưa cập nhật' },
          { key: 'address', label: 'Địa chỉ giao đến', span: 'filled', children: order.shippingAddress || order.buyer?.address || 'Chưa cập nhật' },
          { key: 'created', label: 'Ngày tạo đơn', children: formatDateTime(order.createdAt) }
        ]}
      />

      <Form layout="vertical" onFinish={handleSubmit} className="ship-order-form">
        <Form.Item label="Đơn vị vận chuyển" htmlFor="shippingProvider" required {...fieldState('shippingProvider')}>
          <Select
            id="shippingProvider"
            placeholder="Chọn đơn vị vận chuyển"
            value={formData.shippingProvider || undefined}
            options={shippingProviders}
            onChange={(value) => handleInputChange('shippingProvider', value)}
            virtual={false}
          />
        </Form.Item>

        <Form.Item
          label="Mã vận đơn"
          htmlFor="trackingNumber"
          required
          extra="Mã vận đơn được tạo ngẫu nhiên theo đơn hàng và sẽ gửi cho người mua để theo dõi"
          {...fieldState('trackingNumber')}
        >
          <Input id="trackingNumber" value={formData.trackingNumber} readOnly placeholder="Mã vận đơn sẽ được hệ thống tự tạo" />
        </Form.Item>

        <Form.Item label="Ngày dự kiến giao hàng" htmlFor="estimatedDelivery" required {...fieldState('estimatedDelivery')}>
          <Input
            id="estimatedDelivery"
            type="date"
            min={minDate}
            value={formData.estimatedDelivery}
            onChange={(e) => handleInputChange('estimatedDelivery', e.target.value)}
          />
        </Form.Item>

        <section className="shipping-address-panel" aria-labelledby="shipping-address-title">
          <Flex justify="space-between" align="flex-start" wrap gap={12}>
            <div>
              <Typography.Title level={5} id="shipping-address-title">Thông tin điểm lấy hàng (Pickup)</Typography.Title>
              <Typography.Text type="secondary">Mặc định lấy từ địa chỉ bài đăng. Bạn có thể tùy chỉnh nếu giao từ nơi khác.</Typography.Text>
            </div>
            <Checkbox checked={formData.useCustomShippingAddress} onChange={(e) => toggleCustomAddress(e.target.checked)}>
              Tùy chỉnh điểm lấy hàng
            </Checkbox>
          </Flex>

          {!formData.useCustomShippingAddress && (
            <>
              <Descriptions
                size="small"
                column={{ xs: 1, sm: 2 }}
                className="shipping-default-preview"
                items={[
                  { key: 'name', label: 'Người gửi hàng', children: formData.shippingRecipientName || 'Chưa cập nhật' },
                  { key: 'phone', label: 'Số điện thoại', children: formData.shippingPhone || 'Chưa cập nhật' },
                  { key: 'address', label: 'Địa chỉ lấy hàng', span: 'filled', children: formData.shippingAddress || 'Chưa cập nhật' }
                ]}
              />
              {errors.shippingAddress && <Alert className="ship-order-error" type="error" showIcon role="alert" title={errors.shippingAddress} />}
            </>
          )}

          {formData.useCustomShippingAddress && (
            <div className="shipping-custom">
              <Form.Item label="Họ tên người gửi" htmlFor="shippingRecipientName" required {...fieldState('shippingRecipientName')}>
                <Input
                  id="shippingRecipientName"
                  value={formData.shippingRecipientName}
                  onChange={(e) => handleInputChange('shippingRecipientName', e.target.value)}
                  placeholder="Nhập tên người gửi"
                />
              </Form.Item>

              <Form.Item label="Số điện thoại gửi hàng" htmlFor="shippingPhone" required {...fieldState('shippingPhone')}>
                <Input
                  id="shippingPhone"
                  value={formData.shippingPhone}
                  onChange={(e) => handleInputChange('shippingPhone', e.target.value)}
                  placeholder="Nhập số điện thoại gửi hàng"
                />
              </Form.Item>

              <Form.Item label="Khu vực lấy hàng" required {...fieldState('shippingLocation')}>
                <LocationSelector value={formData.shippingLocation} onChange={handleLocationChange} errors={{}} />
              </Form.Item>

              <Form.Item label="Địa chỉ cụ thể (Số nhà, tên đường...)" htmlFor="shippingSpecificAddress" required {...fieldState('shippingSpecificAddress')}>
                <Input.TextArea
                  id="shippingSpecificAddress"
                  value={formData.shippingSpecificAddress}
                  onChange={(e) => handleInputChange('shippingSpecificAddress', e.target.value)}
                  placeholder="Ví dụ: Số 10 Ngõ 20, đường X..."
                  rows={2}
                />
              </Form.Item>
            </div>
          )}
        </section>

        <Form.Item label="Ghi chú thêm" htmlFor="notes" {...fieldState('notes')}>
          <Input.TextArea
            id="notes"
            value={formData.notes}
            onChange={(e) => handleInputChange('notes', e.target.value)}
            placeholder="Ghi chú về việc giao hàng (tùy chọn)"
            rows={3}
            showCount={{ formatter: ({ count }) => `${count}/500 ký tự` }}
          />
        </Form.Item>

        {errors.submit && <Alert className="ship-order-error" type="error" showIcon role="alert" title={errors.submit} />}

        <Flex justify="flex-end" gap={12}>
          <Button onClick={onClose} disabled={loading}>Hủy</Button>
          <Button type="primary" htmlType="submit" loading={loading} icon={<Truck />}>
            {loading ? 'Đang xử lý...' : 'Xác nhận giao hàng'}
          </Button>
        </Flex>
      </Form>

      <Alert
        className="shipping-notice"
        type="info"
        showIcon
        role="note"
        title="Lưu ý quan trọng:"
        description={(
          <ul>
            <li>Sau khi xác nhận giao hàng, người mua sẽ nhận được thông báo</li>
            <li>Tiền sẽ được giữ trong ký quỹ cho đến khi người mua xác nhận nhận hàng</li>
            <li>Nếu người mua không xác nhận trong 5 ngày, tiền sẽ tự động được chuyển cho bạn</li>
            <li>Vui lòng đảm bảo thông tin vận đơn chính xác để người mua có thể theo dõi</li>
          </ul>
        )}
      />
    </Modal>
  );
};

export default ShipOrder;
