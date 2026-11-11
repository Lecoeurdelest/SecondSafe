import React, { useState } from 'react';

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

  return (
    <div className={`chat-offer is-${status}`}>
      <span className="chat-offer-label">{initiatedBy === 'seller' ? 'Người bán đề nghị' : 'Người mua đề nghị'}</span>
      <strong className="chat-offer-price">{formatPrice(agreedPrice)}</strong>
      {message.content && <span>{message.content}</span>}
      <span className="chat-offer-status">{STATUS_LABELS[status] || status}</span>
      {canRespond && (
        <span className="chat-offer-actions">
          <button type="button" disabled={busy} onClick={() => respond(true)}>Chấp nhận</button>
          <button type="button" disabled={busy} className="is-secondary" onClick={() => respond(false)}>Từ chối</button>
        </span>
      )}
    </div>
  );
}
