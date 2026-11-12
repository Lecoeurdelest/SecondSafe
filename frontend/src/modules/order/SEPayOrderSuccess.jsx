import React, { useEffect, useState, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import sePayService from '../../services/sepay.service';
import './SEPayOrderSuccess.css';
import { Button, Descriptions, Flex, Result, Spin, Typography } from 'antd';

const SEPayOrderSuccess = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState('processing'); // 'processing', 'success', 'failed'
  const [message, setMessage] = useState('Đang kiểm tra kết quả giao dịch...');
  const [details, setDetails] = useState(null);
  
  const hasChecked = useRef(false);

  useEffect(() => {
    if (hasChecked.current) return;
    
    const transactionId = searchParams.get('transactionId');
    
    if (!transactionId) {
      setStatus('failed');
      setMessage('Không tìm thấy mã giao dịch cục bộ');
      hasChecked.current = true;
      return;
    }

    const checkStatus = async () => {
      hasChecked.current = true;
      try {
        const result = await sePayService.checkOrderTransactionStatus(transactionId);
        
        if (result.success && result.status === 'completed') {
          setStatus('success');
          setMessage(result.message || 'Thanh toán đơn hàng thành công!');
          setDetails({
            amount: result.amount,
            orderId: result.orderId,
            transactionId: result.transactionId
          });
        } else if (result.status === 'pending') {
          setStatus('processing');
          setMessage('Hệ thống đang xử lý giao dịch. Vui lòng chờ trong giây lát (có thể mất 1-2 phút tuỳ ngân hàng).');
          
          // Poll every 5s until success or failed (demo loop, max 15 times ~ 75s)
          let attempts = 0;
          const pollInterval = setInterval(async () => {
            attempts++;
            const pollResult = await sePayService.checkOrderTransactionStatus(transactionId);
            if (pollResult.status === 'completed') {
              clearInterval(pollInterval);
              setStatus('success');
              setMessage(pollResult.message || 'Thanh toán đơn hàng thành công!');
              setDetails({
                amount: pollResult.amount,
                orderId: pollResult.orderId,
                transactionId: pollResult.transactionId
              });
            } else if (pollResult.status === 'failed' || attempts >= 15) {
              clearInterval(pollInterval);
              if (pollResult.status !== 'completed') {
                setStatus('failed');
                setMessage('Hệ thống chưa nhận được tiền hoặc giao dịch thất bại.');
              }
            }
          }, 5000);

        } else {
          setStatus('failed');
          setMessage(result.message || 'Giao dịch thanh toán thất bại');
        }
      } catch (error) {
        setStatus('failed');
        setMessage(error.response?.data?.message || 'Có lỗi xảy ra khi kiểm tra giao dịch');
      }
    };

    checkStatus();
  }, [searchParams]);

  const formatPrice = (price) => {
    if (!price) return '0 ₫';
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(price);
  };

  if (status === 'processing') {
    return (
      <div className="payment-result container">
        <Flex vertical align="center" gap={16} className="payment-result__processing" role="status">
          <Spin size="large" />
          <Typography.Title level={1}>Đang kiểm tra...</Typography.Title>
          <Typography.Paragraph type="secondary">{message}</Typography.Paragraph>
        </Flex>
      </div>
    );
  }

  if (status === 'success') {
    return (
      <div className="payment-result container">
        <Result
          status="success"
          title={<Typography.Title level={1}>Thanh toán thành công!</Typography.Title>}
          subTitle={message}
          extra={<Button type="primary" size="large" onClick={() => navigate('/orders')}>Về danh sách đơn hàng</Button>}
        >
          {details && (
            <Descriptions
              bordered
              size="small"
              column={1}
              className="payment-result__details"
              items={[
                { key: 'amount', label: 'Số tiền', children: <strong className="payment-result__amount">{formatPrice(details.amount)}</strong> },
                { key: 'transaction', label: 'Mã giao dịch', children: <span className="payment-result__code">{details.transactionId.substring(0, 8).toUpperCase()}</span> }
              ]}
            />
          )}
        </Result>
      </div>
    );
  }

  return (
    <div className="payment-result container">
      <Result
        status="error"
        title={<Typography.Title level={1}>Thanh toán không thành công</Typography.Title>}
        subTitle={message}
        extra={<Button onClick={() => navigate('/orders')}>Về danh sách đơn hàng</Button>}
      />
    </div>
  );
};

export default SEPayOrderSuccess;
