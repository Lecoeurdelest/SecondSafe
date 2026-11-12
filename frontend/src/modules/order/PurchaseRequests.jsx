import React, { useState, useEffect } from 'react';
import { getReceivedPurchaseRequests, acceptPurchaseRequest, rejectPurchaseRequest } from '../../services/order.service';
import { getImageUrl } from '../../utils/imageHelper';
import { formatOrderDate, formatOrderPrice } from './orderStatus';
import './PurchaseRequests.css';
import { App as AntApp, Alert, Avatar, Button, Card, Empty, Flex, Modal, Spin, Tag, Typography } from 'antd';
import { ClipboardText } from '@phosphor-icons/react';

const STATUS_TAGS = {
  pending: { text: 'Chờ xử lý', color: 'warning' },
  accepted: { text: 'Đã chấp nhận', color: 'success' },
  rejected: { text: 'Đã từ chối', color: 'error' }
};

const PurchaseRequests = () => {
  const { message } = AntApp.useApp();

  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [actionLoading, setActionLoading] = useState({});
  const [showConfirmModal, setShowConfirmModal] = useState(null);
  const [confirmOpen, setConfirmOpen] = useState(false);

  useEffect(() => {
    fetchRequests();
  }, []);

  const fetchRequests = async () => {
    try {
      setLoading(true);
      const data = await getReceivedPurchaseRequests();
      const rawRequests = Array.isArray(data)
        ? data
        : data?.data?.requests || data?.requests || [];

      const normalizedRequests = rawRequests.map((request) => ({
        ...request,
        listing: request.listing || request.listingId || null,
        buyer: request.buyer || request.buyerId || null,
        seller: request.seller || request.sellerId || null
      }));

      setRequests(normalizedRequests);
      setError(null);
    } catch (err) {
      setError(err.message || 'Không thể tải danh sách yêu cầu');
      setRequests([]);
    } finally {
      setLoading(false);
    }
  };

  const openConfirm = (id, action) => {
    setShowConfirmModal({ id, action });
    setConfirmOpen(true);
  };

  const handleAction = async (requestId, action) => {
    setActionLoading(prev => ({ ...prev, [requestId]: true }));

    try {
      if (action === 'accept') {
        await acceptPurchaseRequest(requestId);
      } else {
        await rejectPurchaseRequest(requestId);
      }

      await fetchRequests();

      setConfirmOpen(false);

      message.success(action === 'accept'
        ? 'Đã chấp nhận yêu cầu mua hàng thành công!'
        : 'Đã từ chối yêu cầu mua hàng!');
    } catch (err) {
      message.error(err.message || `Không thể ${action === 'accept' ? 'chấp nhận' : 'từ chối'} yêu cầu`);
    } finally {
      setActionLoading(prev => ({ ...prev, [requestId]: false }));
    }
  };

  if (loading) {
    return (
      <div className="purchase-requests-container container">
        <Flex justify="center" gap={12} className="purchase-requests-loading" role="status">
          <Spin />
          <Typography.Text type="secondary">Đang tải...</Typography.Text>
        </Flex>
      </div>
    );
  }

  if (error) {
    return (
      <div className="purchase-requests-container container">
        <Alert
          type="error"
          showIcon
          role="alert"
          title={error}
          action={<Button size="small" type="primary" onClick={fetchRequests}>Thử lại</Button>}
        />
      </div>
    );
  }

  const confirming = showConfirmModal?.action === 'accept';
  const confirmBusy = Boolean(showConfirmModal && actionLoading[showConfirmModal.id]);

  return (
    <div className="purchase-requests-container container">
      <div className="purchase-requests-header">
        <Typography.Title level={1}>Yêu cầu mua hàng</Typography.Title>
        <Typography.Paragraph type="secondary">Quản lý các yêu cầu mua hàng từ khách hàng</Typography.Paragraph>
      </div>

      {requests.length === 0 ? (
        <Empty
          className="purchase-requests-empty"
          image={<ClipboardText size={56} />}
          description={(
            <>
              <Typography.Title level={3}>Chưa có yêu cầu mua hàng nào</Typography.Title>
              <Typography.Paragraph type="secondary">
                Khi có khách hàng quan tâm đến sản phẩm của bạn, yêu cầu sẽ hiển thị ở đây.
              </Typography.Paragraph>
            </>
          )}
        />
      ) : (
        <Flex vertical gap={16} className="requests-list">
          {requests.map((request) => {
            const status = STATUS_TAGS[request.status] || { text: request.status, color: 'default' };
            const listedPrice = request.listing?.price;
            const difference = request.agreedPrice - listedPrice;
            const busy = Boolean(actionLoading[request._id]);

            return (
              <Card key={request._id} className="request-item">
                <Flex justify="space-between" align="flex-start" gap={12} wrap>
                  <Flex gap={14} className="request-item__product">
                    <img
                      className="request-item__image"
                      src={getImageUrl(request.listing?.images?.[0]) || '/placeholder-image.jpg'}
                      alt={request.listing?.title}
                    />
                    <div className="request-item__text">
                      <Typography.Title level={3}>{request.listing?.title}</Typography.Title>
                      <Typography.Text type="secondary">Giá niêm yết: {formatOrderPrice(listedPrice)}</Typography.Text>
                    </div>
                  </Flex>
                  <Tag color={status.color}>{status.text}</Tag>
                </Flex>

                <Flex gap={10} align="center" className="request-item__buyer">
                  <Avatar src={request.buyer?.avatar ? getImageUrl(request.buyer.avatar) : undefined} alt={request.buyer?.fullName}>
                    {request.buyer?.fullName?.charAt(0).toUpperCase()}
                  </Avatar>
                  <div className="request-item__text">
                    <Typography.Text strong>{request.buyer?.fullName}</Typography.Text>
                    <Typography.Text type="secondary">Gửi yêu cầu: {formatOrderDate(request.createdAt)}</Typography.Text>
                  </div>
                </Flex>

                <div className="request-item__offer">
                  <Typography.Text type="secondary">Giá đề nghị:</Typography.Text>{' '}
                  <Typography.Text strong className="request-item__price">{formatOrderPrice(request.agreedPrice)}</Typography.Text>
                  {request.agreedPrice !== listedPrice && (
                    <Typography.Text type="secondary" className="request-item__diff">
                      {' '}({difference < 0 ? '-' : '+'}{formatOrderPrice(Math.abs(difference))})
                    </Typography.Text>
                  )}
                  <Typography.Paragraph className="request-item__message">
                    <Typography.Text type="secondary">Tin nhắn:</Typography.Text>
                    <br />
                    {request.message}
                  </Typography.Paragraph>
                </div>

                {request.status === 'pending' && (
                  <Flex justify="flex-end" gap={10} className="request-item__actions">
                    <Button danger disabled={busy} onClick={() => openConfirm(request._id, 'reject')}>
                      {busy ? 'Đang xử lý...' : 'Từ chối'}
                    </Button>
                    <Button type="primary" disabled={busy} onClick={() => openConfirm(request._id, 'accept')}>
                      {busy ? 'Đang xử lý...' : 'Chấp nhận'}
                    </Button>
                  </Flex>
                )}
              </Card>
            );
          })}
        </Flex>
      )}

      <Modal
        open={confirmOpen}
        title={confirming ? 'Chấp nhận yêu cầu' : 'Từ chối yêu cầu'}
        okText={confirmBusy ? 'Đang xử lý...' : (confirming ? 'Chấp nhận' : 'Từ chối')}
        cancelText="Hủy"
        okButtonProps={{ danger: !confirming, loading: confirmBusy }}
        cancelButtonProps={{ disabled: confirmBusy }}
        onOk={() => handleAction(showConfirmModal.id, showConfirmModal.action)}
        onCancel={() => setConfirmOpen(false)}
        centered
        mask={{ closable: false }}
      >
        <Typography.Paragraph>
          {confirming
            ? 'Bạn có chắc chắn muốn chấp nhận yêu cầu mua hàng này? Một đơn hàng sẽ được tạo và khách hàng có thể thanh toán.'
            : 'Bạn có chắc chắn muốn từ chối yêu cầu mua hàng này?'}
        </Typography.Paragraph>
      </Modal>
    </div>
  );
};

export default PurchaseRequests;
