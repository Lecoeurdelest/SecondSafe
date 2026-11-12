export const ORDER_STATUSES = {
  awaiting_seller_confirmation: { label: 'Chờ xác nhận', color: 'gold' },
  awaiting_payment: { label: 'Chờ thanh toán', color: 'orange' },
  pending: { label: 'Chờ thanh toán', color: 'orange' },
  paid: { label: 'Đã thanh toán', color: 'blue' },
  shipped: { label: 'Đang giao hàng', color: 'geekblue' },
  delivered: { label: 'Đã giao đến nơi', color: 'cyan' },
  completed: { label: 'Hoàn thành', color: 'success' },
  cancelled: { label: 'Đã hủy', color: 'default' },
  disputed: { label: 'Tranh chấp', color: 'error' }
};

export function describeOrderStatus(status) {
  return ORDER_STATUSES[status] || { label: status || '', color: 'default' };
}

export function formatOrderPrice(price) {
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(price || 0);
}

export function formatOrderDate(date) {
  return new Date(date).toLocaleDateString('vi-VN', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}
