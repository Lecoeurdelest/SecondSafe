import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getOrdersAsSeller } from '../../services/order.service';
import { getImageUrl } from '../../utils/imageHelper';
import { formatOrderDate, formatOrderPrice } from './orderStatus';
import './SellerOrders.css';
import { Alert, Avatar, Badge, Button, Card, Col, Empty, Flex, Row, Spin, Tabs, Tag, Typography } from 'antd';
import { ArrowRight, HourglassMedium, Package, Truck } from '@phosphor-icons/react';

const FILTERS = {
  pending_shipment: {
    statuses: ['awaiting_seller_confirmation', 'awaiting_payment', 'paid'],
    empty: 'Bạn không có đơn hàng nào chờ giao'
  },
  shipping: {
    statuses: ['shipped'],
    empty: 'Bạn không có đơn hàng nào đang giao'
  },
  completed: {
    statuses: ['delivered', 'completed', 'cancelled', 'disputed'],
    empty: 'Bạn không có đơn hàng nào ở trạng thái hoàn thành'
  }
};

const STATUS_TAGS = {
  awaiting_seller_confirmation: { text: 'Chưa thanh toán (Chờ mua)', color: 'orange' },
  awaiting_payment: { text: 'Chưa thanh toán (Chờ mua)', color: 'orange' },
  paid: { text: 'Đã thanh toán (Chờ giao)', color: 'blue' },
  shipped: { text: 'Đang giao hàng', color: 'geekblue' },
  delivered: { text: 'Đã giao (Chờ nhận)', color: 'geekblue' },
  completed: { text: 'Hoàn thành', color: 'success' },
  cancelled: { text: 'Đã hủy', color: 'default' },
  disputed: { text: 'Tranh chấp', color: 'error' }
};

const SellerOrders = () => {
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState('pending_shipment');

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const response = await getOrdersAsSeller();

      const ordersList = response?.orders || response?.data?.orders || [];
      setOrders(Array.isArray(ordersList) ? ordersList : []);
      setError(null);
    } catch (err) {
      setError(err.message || 'Không thể tải danh sách đơn hàng');
      setOrders([]);
    } finally {
      setLoading(false);
    }
  };

  const countOf = (key) => orders.filter(order => FILTERS[key].statuses.includes(order.status)).length;
  const filteredOrders = orders.filter(order => FILTERS[filter].statuses.includes(order.status));

  if (loading) {
    return (
      <div className="seller-orders-container container">
        <Flex justify="center" gap={12} className="seller-orders-loading" role="status">
          <Spin />
          <Typography.Text type="secondary">Đang tải danh sách đơn hàng...</Typography.Text>
        </Flex>
      </div>
    );
  }

  const tabLabel = (icon, text, key) => (
    <span className="seller-orders-tab">
      {icon}
      {text}
      <Badge count={countOf(key)} showZero overflowCount={999} />
    </span>
  );

  return (
    <div className="seller-orders-container container">
      <div className="seller-orders-header">
        <Typography.Title level={1}>Đơn Hàng Của Tôi</Typography.Title>
        <Typography.Paragraph type="secondary">Quản lý các đơn hàng từ khách hàng</Typography.Paragraph>
      </div>

      <Tabs
        className="seller-orders-tabs"
        activeKey={filter}
        onChange={setFilter}
        tabBarGutter={18}
        items={[
          { key: 'pending_shipment', label: tabLabel(<HourglassMedium />, 'Chờ giao', 'pending_shipment') },
          { key: 'shipping', label: tabLabel(<Truck />, 'Đang giao', 'shipping') },
          { key: 'completed', label: tabLabel(<Package />, 'Hoàn thành', 'completed') }
        ]}
      />

      {error && (
        <Alert
          className="seller-orders-alert"
          type="error"
          showIcon
          title={error}
          action={<Button size="small" type="primary" onClick={fetchOrders}>Thử lại</Button>}
        />
      )}

      {filteredOrders.length === 0 ? (
        <Empty
          className="seller-orders-empty"
          image={Empty.PRESENTED_IMAGE_SIMPLE}
          description={(
            <>
              <Typography.Title level={3}>Không có đơn hàng</Typography.Title>
              <Typography.Paragraph type="secondary">{FILTERS[filter].empty}</Typography.Paragraph>
            </>
          )}
        />
      ) : (
        <Flex vertical gap={14} className="seller-orders-list">
          {filteredOrders.map(order => {
            const statusTag = STATUS_TAGS[order.status] || { text: '', color: 'default' };
            const productImage = order.productId?.images?.[0]
              ? getImageUrl(order.productId.images[0])
              : '/images/placeholders/product-placeholder.png';
            const buyerAvatar = order.buyerId?.avatar
              ? getImageUrl(order.buyerId.avatar)
              : '/images/placeholders/avatar-placeholder.svg';

            return (
              <Card key={order._id} className="seller-order-item">
                <Row gutter={[{ xs: 10, md: 20 }, 12]} align="middle">
                  <Col xs={24} md={10}>
                    <Flex gap={14} align="center" className="seller-order-item__product">
                      <img
                        className="seller-order-item__image"
                        src={productImage}
                        alt={order.productId?.name || 'Sản phẩm'}
                        onError={(e) => { e.target.src = '/images/placeholders/product-placeholder.png'; }}
                      />
                      <div className="seller-order-item__text">
                        <Typography.Title level={3}>
                          {order.productId?.title || order.productId?.name || 'N/A'}
                        </Typography.Title>
                        <Typography.Text strong className="seller-order-item__price">
                          {formatOrderPrice(order.agreedPrice)}
                        </Typography.Text>
                      </div>
                    </Flex>
                  </Col>

                  <Col xs={24} md={8}>
                    <Flex gap={10} align="center">
                      <Avatar
                        src={buyerAvatar}
                        alt={order.buyerId?.username || 'Khách hàng'}
                      />
                      <div className="seller-order-item__text">
                        <Typography.Text strong>
                          {order.buyerId?.fullName || order.buyerId?.username || 'N/A'}
                        </Typography.Text>
                        <Typography.Text type="secondary">{formatOrderDate(order.createdAt)}</Typography.Text>
                      </div>
                    </Flex>
                  </Col>

                  <Col xs={24} md={6}>
                    <Flex vertical align="flex-start" gap={8} className="seller-order-item__side">
                      <Tag color={statusTag.color}>{statusTag.text}</Tag>
                      <Button
                        size="small"
                        icon={<ArrowRight />}
                        title="Xem chi tiết đơn hàng"
                        onClick={() => navigate(`/order-detail/${order._id}`)}
                      >
                        Chi tiết
                      </Button>
                    </Flex>
                  </Col>
                </Row>
              </Card>
            );
          })}
        </Flex>
      )}
    </div>
  );
};

export default SellerOrders;
