import React from 'react';
import { useLocation } from 'react-router-dom';
import { Result, Typography } from 'antd';
import LinkButton from '../../ui/LinkButton';
import './WalletResult.css';

function TopUpResult() {
  const location = useLocation();

  const params = new URLSearchParams(location.search);
  const success = params.get('success') === 'true';
  const message =
    params.get('message') || (success ? 'Nạp tiền thành công vào ví của bạn.' : 'Giao dịch không thành công.');
  const orderInfo = params.get('orderInfo');

  return (
    <div className="wallet-result container">
      <Result
        status={success ? 'success' : 'error'}
        title={<Typography.Title level={1}>{success ? 'Thanh toán thành công' : 'Thanh toán chưa thành công'}</Typography.Title>}
        subTitle={(
          <>
            {message}
            {orderInfo && <span className="wallet-result__info"><strong>Nội dung:</strong> {orderInfo}</span>}
          </>
        )}
        extra={[
          <LinkButton key="wallet" type="primary" to="/wallet">Về ví của tôi</LinkButton>,
          !success && <LinkButton key="retry" to="/wallet/topup">Thử nạp lại</LinkButton>
        ]}
      />
    </div>
  );
}

export default TopUpResult;
