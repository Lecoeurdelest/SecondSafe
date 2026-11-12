import React, { useState } from 'react';
import { Button, Card, Flex, Tag, Typography } from 'antd';

const STATUS_LABELS = { pending: 'Đang chờ phản hồi', accepted: 'Đã chấp nhận', rejected: 'Đã từ chối' };

export function formatPrice(value) {
  return `${Number(value || 0).toLocaleString('vi-VN')}đ`;
}

/**
 * The hien tin nhan de nghi gia. Chi ben nhan (khong phai nguoi gui) moi duoc
 * chap nhan/tu choi khi de nghi con dang cho.
 */
export default function OfferCard({ message, mine, onRespond }) {
  const [busy, setBusy] = useState(false);
  const { agreedPrice, status = 'pending', initiatedBy, purchaseRequestId } = message.metadata || {};
  const canRespond = !mine && status === 'pending' && Boolean(purchaseRequestId);

  async function respond(accept) {
    setBusy(true);
    try {
      await onRespond(message, accept);
    } finally {
      setBusy(false);
    }
  }

  const tagColor = status === 'accepted' ? 'success' : status === 'rejected' ? 'error' : 'warning';

  return (
    <Card size="small" className={`chat-offer is-${status}`}>
      <Flex vertical gap={4}>
        <Typography.Text type="secondary" className="chat-offer-label">{initiatedBy === 'seller' ? 'Người bán đề nghị' : 'Người mua đề nghị'}</Typography.Text>
        <Typography.Text strong className="chat-offer-price">{formatPrice(agreedPrice)}</Typography.Text>
        {message.content && <span>{message.content}</span>}
        <Tag color={tagColor} className="chat-offer-status">{STATUS_LABELS[status] || status}</Tag>
        {canRespond && (
          <Flex gap={8} className="chat-offer-actions">
            <Button type="primary" size="small" disabled={busy} onClick={() => respond(true)}>Chấp nhận</Button>
            <Button size="small" disabled={busy} onClick={() => respond(false)}>Từ chối</Button>
          </Flex>
        )}
      </Flex>
    </Card>
  );
}
