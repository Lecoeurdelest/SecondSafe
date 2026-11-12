import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getOrdersAsBuyer, getOrdersAsSeller, confirmOrderBySeller, cancelOrder } from '../../services/order.service';
import chatService from '../../services/chat.service';
import { getImageUrl } from '../../utils/imageHelper';
import Dispute from '../report/Dispute';
import ShipOrder from './ShipOrder';
import { ORDER_STATUSES, describeOrderStatus, formatOrderDate, formatOrderPrice } from './orderStatus';
import './Orders.css';
import { App as AntApp, Alert, Button, Card, Col, Descriptions, Empty, Flex, Form, Input, Modal, Pagination, Row, Select, Spin, Tabs, Tag, Typography } from 'antd';
import { ChatCircle, CreditCard, Package, ShoppingCart, Storefront, X } from '@phosphor-icons/react';

const STATUS_OPTIONS = [
  { value: '', label: 'Tất cả' },
  ...Object.entries(ORDER_STATUSES).map(([value, { label }]) => ({ value, label }))
];

const getEntityId = (value) => {
  if (!value) return null;
  if (typeof value === 'string' || typeof value === 'number') {
    return value.toString();
  }
  if (value._id?.toString) return value._id.toString();
  if (value.id?.toString) return value.id.toString();
  if (value.userId?.toString) return value.userId.toString();

  if (typeof value?.toString === 'function') {
    const asString = value.toString();
    if (asString && asString !== '[object Object]') {
      return asString;
    }
  }

  return null;
};

const Orders = () => {
  const navigate = useNavigate();
  const { message, modal } = AntApp.useApp();

  const [activeTab, setActiveTab] = useState('buying');
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [confirmingOrderId, setConfirmingOrderId] = useState(null);
  const [showDisputeModal, setShowDisputeModal] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [disputeMode, setDisputeMode] = useState('normal');
  const [cancelTarget, setCancelTarget] = useState(null);
  const [cancelReason, setCancelReason] = useState('');
  const [cancelling, setCancelling] = useState(false);
  const [filters, setFilters] = useState({
    status: '',
    page: 1,
    limit: 10
  });
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalOrders: 0
  });

  useEffect(() => {
    fetchOrders();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, filters]);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      setError(null);

      const params = {
        page: filters.page,
        limit: filters.limit,
        ...(filters.status && { status: filters.status })
      };

      const response = activeTab === 'buying'
        ? await getOrdersAsBuyer(params)
        : await getOrdersAsSeller(params);

      setOrders(response.data.orders || []);
      setPagination({
        currentPage: response.data.currentPage || 1,
        totalPages: response.data.totalPages || 1,
        totalOrders: response.data.totalOrders || 0
      });
    } catch (err) {
      setError(err.message || 'Không thể tải danh sách đơn hàng');
    } finally {
      setLoading(false);
    }
  };

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    setFilters(prev => ({ ...prev, page: 1, status: '' }));
  };

  const handleStatusFilter = (status) => {
    setFilters(prev => ({ ...prev, status, page: 1 }));
  };

  const handlePageChange = (page) => {
    setFilters(prev => ({ ...prev, page }));
  };

  const handleOrderClick = (orderId) => {
    navigate(`/orders/${orderId}`);
  };

  const openOrderChat = async (order) => {
    try {
      const orderId = getEntityId(order?._id);
      if (!orderId) {
        navigate('/chat');
        return;
      }

      const conversation = await chatService.getOrCreateConversationByOrder(orderId);
      if (conversation?._id) {
        navigate(`/chat/${conversation._id}`);
        return;
      }

      navigate('/chat');
    } catch (err) {
      console.error('Error opening order chat:', err);
      navigate('/chat');
    }
  };

  const handleConfirmOrderBySeller = (order) => {
    modal.confirm({
      title: 'Xác nhận đơn hàng',
      content: 'Bạn xác nhận đơn hàng này và chuyển cho người mua thanh toán?',
      okText: 'Xác nhận đơn',
      cancelText: 'Hủy',
      centered: true,
      onOk: async () => {
        try {
          setConfirmingOrderId(order._id);
          await confirmOrderBySeller(order._id);
          await fetchOrders();
          message.success('Đã xác nhận đơn hàng. Người mua sẽ tiến hành thanh toán.');
        } catch (err) {
          message.error(err.message || 'Không thể xác nhận đơn hàng');
        } finally {
          setConfirmingOrderId(null);
        }
      }
    });
  };

  const openCancelDialog = (order) => {
    setCancelReason('');
    setCancelTarget(order);
  };

  const closeCancelDialog = () => {
    if (cancelling) return;
    setCancelTarget(null);
    setCancelReason('');
  };

  const handleCancelOrder = async () => {
    const order = cancelTarget;
    if (!order) return;

    try {
      setCancelling(true);
      await cancelOrder(order._id, cancelReason.trim() || 'Người mua hủy đơn');
      setCancelTarget(null);
      setCancelReason('');
      await fetchOrders();
      message.success('Hủy đơn hàng thành công và tiền đã được tự động hoàn lại (nếu có).');
    } catch (err) {
      message.error(err.message || 'Không thể hủy đơn hàng');
    } finally {
      setCancelling(false);
    }
  };

  const openDisputeModal = (order, mode = 'normal') => {
    setSelectedOrder(order);
    setDisputeMode(mode);
    setShowDisputeModal(true);
  };

  const closeDialogs = () => {
    setShowDisputeModal(false);
    setSelectedOrder(null);
  };

  const handleDisputeSuccess = async () => {
    const wasReturn = disputeMode === 'return';
    closeDialogs();
    await fetchOrders();

    message.success(wasReturn
      ? 'Yêu cầu hoàn hàng đã được tạo thành công. Bạn có thể theo dõi xử lý trong chi tiết đơn hàng.'
      : 'Khiếu nại đã được tạo thành công. Bạn có thể theo dõi xử lý trong chi tiết đơn hàng.');
  };

  const getActionButtons = (order) => {
    if (activeTab === 'buying') {
      switch (order.status) {
        case 'awaiting_payment':
        case 'pending':
          return (
            <>
              <Button type="primary" size="small" icon={<CreditCard />} onClick={() => navigate(`/orders/${order._id}/pay`)}>
                Thanh toán
              </Button>
              <Button danger size="small" icon={<X />} onClick={() => openCancelDialog(order)}>
                Hủy đơn
              </Button>
            </>
          );
        case 'paid':
          return (
            <Button danger size="small" icon={<X />} onClick={() => openCancelDialog(order)}>
              Hủy đơn (Hoàn tiền)
            </Button>
          );
        case 'delivered':
          return (
            <>
              <Button type="primary" size="small" onClick={() => navigate(`/orders/${order._id}?action=confirm-receipt`)}>
                Xác nhận nhận hàng
              </Button>
              <Button danger size="small" onClick={() => openDisputeModal(order, 'normal')}>
                Khiếu nại và hoàn tiền
              </Button>
            </>
          );
        case 'completed':
          return (
            <Button size="small" onClick={() => navigate(`/orders/${order._id}?action=rate`)}>
              Đánh giá người bán
            </Button>
          );
        case 'disputed':
          return (
            <Button size="small" onClick={() => navigate(`/orders/${order._id}?action=followup`)}>
              Bổ sung bằng chứng
            </Button>
          );
        default:
          return null;
      }
    }

    switch (order.status) {
      case 'awaiting_seller_confirmation':
        return (
          <Button
            type="primary"
            size="small"
            disabled={confirmingOrderId === order._id}
            onClick={() => handleConfirmOrderBySeller(order)}
          >
            {confirmingOrderId === order._id ? 'Đang xử lý...' : 'Xác nhận đơn'}
          </Button>
        );
      case 'paid':
        return (
          <Button type="primary" size="small" onClick={() => openDisputeModal(order, 'shipment')}>
            Xác nhận giao hàng
          </Button>
        );
      case 'shipped':
        return (
          <Button size="small" onClick={() => navigate(`/orders/${order._id}`)}>
            Xác nhận giao đến nơi
          </Button>
        );
      case 'disputed':
        return (
          <Button size="small" onClick={() => navigate(`/orders/${order._id}?action=seller-evidence`)}>
            Xử lý tranh chấp
          </Button>
        );
      default:
        return null;
    }
  };

  if (loading && orders.length === 0) {
    return (
      <div className="orders-container container">
        <Flex justify="center" gap={12} className="orders-loading" role="status">
          <Spin />
          <Typography.Text type="secondary">Đang tải...</Typography.Text>
        </Flex>
      </div>
    );
  }

  const isBuying = activeTab === 'buying';

  return (
    <div className="orders-container container">
      <div className="orders-header">
        <Typography.Title level={1}>Đơn hàng của tôi</Typography.Title>
        <Typography.Paragraph type="secondary">Quản lý và theo dõi các đơn hàng</Typography.Paragraph>
      </div>

      <Tabs
        className="orders-tabs"
        activeKey={activeTab}
        onChange={handleTabChange}
        items={[
          {
            key: 'buying',
            label: <span className="orders-tab"><ShoppingCart />Đơn mua ({isBuying ? pagination.totalOrders : '...'})</span>
          },
          {
            key: 'selling',
            label: <span className="orders-tab"><Storefront />Đơn bán ({!isBuying ? pagination.totalOrders : '...'})</span>
          }
        ]}
      />

      <Flex align="center" gap={10} className="orders-filter">
        <Typography.Text type="secondary">Trạng thái:</Typography.Text>
        <Select
          className="orders-filter__select"
          aria-label="Lọc theo trạng thái"
          value={filters.status}
          options={STATUS_OPTIONS}
          onChange={handleStatusFilter}
          virtual={false}
        />
      </Flex>

      {error && (
        <Alert
          className="orders-alert"
          type="error"
          showIcon
          title={error}
          action={<Button size="small" type="primary" onClick={fetchOrders}>Thử lại</Button>}
        />
      )}

      {orders.length === 0 ? (
        <Empty
          className="orders-empty"
          image={<Package size={56} />}
          description={(
            <>
              <Typography.Title level={3}>Chưa có đơn hàng nào</Typography.Title>
              <Typography.Paragraph type="secondary">
                {isBuying
                  ? 'Bạn chưa có đơn hàng mua nào. Hãy khám phá các sản phẩm và đặt hàng ngay!'
                  : 'Bạn chưa có đơn hàng bán nào. Hãy đăng sản phẩm để bắt đầu bán hàng!'}
              </Typography.Paragraph>
            </>
          )}
        >
          <Button type="primary" onClick={() => navigate(isBuying ? '/' : '/product/create')}>
            {isBuying ? 'Khám phá sản phẩm' : 'Đăng sản phẩm'}
          </Button>
        </Empty>
      ) : (
        <Spin spinning={loading} description="Đang tải...">
          <Flex vertical gap={16} className="orders-list">
            {orders.map((order) => {
              const status = describeOrderStatus(order.status);
              const counterpart = isBuying ? order.seller?.fullName : order.buyer?.fullName;
              const details = [
                { key: 'user', label: isBuying ? 'Người bán' : 'Người mua', children: counterpart },
                { key: 'created', label: 'Ngày tạo', children: formatOrderDate(order.createdAt) }
              ];
              if (order.shippedAt) {
                details.push({ key: 'shipped', label: 'Ngày giao', children: formatOrderDate(order.shippedAt) });
              }

              return (
                <Card
                  key={order._id}
                  hoverable
                  className="order-item"
                  onClick={() => handleOrderClick(order._id)}
                >
                  <Flex justify="space-between" align="center" wrap gap={8} className="order-item__head">
                    <Typography.Text>
                      Mã đơn hàng: <strong>#{order.orderCode || order._id.slice(-8).toUpperCase()}</strong>
                    </Typography.Text>
                    <Tag color={status.color}>{status.label}</Tag>
                  </Flex>

                  <Row gutter={[{ xs: 10, md: 20 }, 12]} className="order-item__body">
                    <Col xs={24} md={13}>
                      <Flex gap={14} className="order-item__product">
                        <img
                          className="order-item__image"
                          src={getImageUrl(order.listing?.images?.[0]) || '/placeholder-image.jpg'}
                          alt={order.listing?.title}
                          onError={(e) => { e.target.src = '/images/placeholders/product-placeholder.png'; }}
                        />
                        <div className="order-item__text">
                          <Typography.Title level={4}>{order.listing?.title}</Typography.Title>
                          <Typography.Text type="secondary">Giá: {formatOrderPrice(order.agreedPrice)}</Typography.Text>
                          <Typography.Text strong className="order-item__total">
                            Tổng tiền: {formatOrderPrice(order.totalAmount)}
                          </Typography.Text>
                        </div>
                      </Flex>
                    </Col>
                    <Col xs={24} md={11}>
                      <Descriptions size="small" column={1} items={details} />
                    </Col>
                  </Row>

                  <Flex wrap gap={8} justify="flex-end" className="order-item__actions" onClick={(e) => e.stopPropagation()}>
                    <Button size="small" icon={<ChatCircle />} onClick={() => openOrderChat(order)}>
                      Chat
                    </Button>
                    {getActionButtons(order)}
                    <Button size="small" type="link" onClick={() => handleOrderClick(order._id)}>
                      Xem chi tiết
                    </Button>
                  </Flex>
                </Card>
              );
            })}
          </Flex>

          <Pagination
            className="orders-pagination"
            align="center"
            hideOnSinglePage
            showSizeChanger={false}
            current={pagination.currentPage}
            pageSize={filters.limit}
            total={pagination.totalOrders || pagination.totalPages * filters.limit}
            showTotal={(total) => `${total} đơn hàng`}
            onChange={handlePageChange}
          />
        </Spin>
      )}

      <Modal
        open={Boolean(cancelTarget)}
        title="Hủy đơn hàng"
        okText="Hủy đơn hàng"
        cancelText="Giữ đơn hàng"
        okButtonProps={{ danger: true, loading: cancelling }}
        cancelButtonProps={{ disabled: cancelling }}
        onOk={handleCancelOrder}
        onCancel={closeCancelDialog}
        centered
        mask={{ closable: false }}
      >
        <Form layout="vertical">
          <Form.Item label="Nhập lý do hủy đơn hàng của bạn:" htmlFor="cancel-order-reason">
            <Input.TextArea
              id="cancel-order-reason"
              rows={3}
              maxLength={300}
              showCount
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
            />
          </Form.Item>
        </Form>
      </Modal>

      {showDisputeModal && selectedOrder && disputeMode === 'shipment' && (
        <ShipOrder
          order={selectedOrder}
          onClose={closeDialogs}
          onSuccess={async () => {
            closeDialogs();
            await fetchOrders();
          }}
        />
      )}
      {showDisputeModal && selectedOrder && disputeMode !== 'shipment' && (
        <Dispute
          order={selectedOrder}
          initialReason={disputeMode === 'return' ? 'return_request' : ''}
          onSuccess={handleDisputeSuccess}
          onCancel={closeDialogs}
        />
      )}
    </div>
  );
};

export default Orders;
