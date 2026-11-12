import React from 'react';
import { useLocation } from 'react-router-dom';
import { Descriptions, Result, Typography } from 'antd';
import LinkButton from '../../ui/LinkButton';
import './WalletResult.css';

const formatMoney = (value) => {
  const number = Number(value || 0);
  if (!Number.isFinite(number) || number <= 0) return null;
  return `${number.toLocaleString('vi-VN')} VND`;
};

function VNPaySuccess() {
  const location = useLocation();

  const params = new URLSearchParams(location.search);
  const message = params.get('message') || 'Nạp tiền thành công vào ví của bạn.';
  const amount = params.get('amount');
  const transactionId = params.get('transactionId');
  const orderInfo = params.get('orderInfo');

  const details = [
    formatMoney(amount) && { key: 'amount', label: 'Số tiền nạp', children: <strong className="wallet-result__amount">{formatMoney(amount)}</strong> },
    orderInfo && { key: 'info', label: 'Nội dung', children: orderInfo },
    transactionId && { key: 'transaction', label: 'Mã giao dịch', children: <code>{transactionId}</code> }
  ].filter(Boolean);

  return (
    <div className="wallet-result container">
      <Result
        status="success"
        title={<Typography.Title level={1}>Thanh toán thành công</Typography.Title>}
        subTitle={message}
        extra={[
          <LinkButton key="wallet" type="primary" to="/wallet">Về ví của tôi</LinkButton>,
          <LinkButton key="more" to="/wallet/topup">Nạp thêm</LinkButton>
        ]}
      >
        {details.length > 0 && <Descriptions className="wallet-result__details" bordered column={1} size="small" items={details} />}
      </Result>
    </div>
  );
}

export default VNPaySuccess;
