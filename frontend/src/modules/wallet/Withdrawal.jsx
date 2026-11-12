import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import walletService from '../../services/wallet.service';
import LinkButton from '../../ui/LinkButton';
import './Withdrawal.css';
import { App as AntApp, Alert, Button, Card, Descriptions, Empty, Flex, Form, Input, Select, Spin, Statistic, Tag, Typography } from 'antd';
import { ArrowLeft, Warning } from '@phosphor-icons/react';

const Withdrawal = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { message } = AntApp.useApp();

  const [balance, setBalance] = useState(null);
  const [recentWithdrawals, setRecentWithdrawals] = useState([]);
  const [loading, setLoading] = useState(false);
  const [fetchingBalance, setFetchingBalance] = useState(true);
  const [errors, setErrors] = useState({});

  const [formData, setFormData] = useState({
    amount: '',
    bankAccount: {
      bankName: '',
      accountNumber: '',
      accountName: ''
    }
  });

  // Popular banks in Vietnam
  const popularBanks = [
    'Vietcombank', 'VietinBank', 'BIDV', 'Agribank', 'Techcombank',
    'MBBank', 'ACB', 'VPBank', 'SHB', 'Sacombank', 'TPBank', 'HDBank'
  ];

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }
    fetchBalance();
  }, [user, navigate]);

  const fetchBalance = async () => {
    try {
      setFetchingBalance(true);
      const [balanceData, withdrawalData] = await Promise.all([
        walletService.getBalance(),
        walletService.getTransactions({ type: 'withdrawal', page: 1, limit: 10 }) // Tăng limit lên một chút để lọc cho chuẩn
      ]);
      setBalance(balanceData);
      setRecentWithdrawals(withdrawalData.transactions || []);
    } catch (error) {
      console.error('Error fetching balance:', error);
    } finally {
      setFetchingBalance(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    
    if (name.startsWith('bankAccount.')) {
      const field = name.split('.')[1];
      setFormData(prev => ({
        ...prev,
        bankAccount: {
          ...prev.bankAccount,
          [field]: value
        }
      }));
    } else if (name === 'amount') {
      const numericValue = value.replace(/[^0-9]/g, '');
      setFormData(prev => ({ ...prev, amount: numericValue }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }

    // Clear error for this field
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const validateForm = () => {
    const newErrors = {};
    const amount = parseInt(formData.amount);

    // Amount validation
    if (!formData.amount || amount <= 0) {
      newErrors.amount = 'Vui lòng nhập số tiền hợp lệ';
    } else if (amount < 50000) {
      newErrors.amount = 'Số tiền rút tối thiểu là 50,000 VNĐ';
    } else if (balance && amount > (balance.availableWithdrawalBalance || 0)) {
      newErrors.amount = 'Số tiền rút không được vượt quá số dư khả dụng';
    }

    // Bank account validation
    if (!formData.bankAccount.bankName) {
      newErrors['bankAccount.bankName'] = 'Vui lòng chọn ngân hàng';
    }

    if (!formData.bankAccount.accountNumber) {
      newErrors['bankAccount.accountNumber'] = 'Vui lòng nhập số tài khoản';
    } else if (formData.bankAccount.accountNumber.length < 6) {
      newErrors['bankAccount.accountNumber'] = 'Số tài khoản phải có ít nhất 6 ký tự';
    }

    if (!formData.bankAccount.accountName) {
      newErrors['bankAccount.accountName'] = 'Vui lòng nhập tên chủ tài khoản';
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
      const withdrawalData = {
        amount: parseInt(formData.amount),
        bankAccount: formData.bankAccount
      };

      await walletService.createWithdrawal(withdrawalData);
      navigate('/wallet');
    } catch (error) {
      message.error(error.response?.data?.message || 'Không thể tạo yêu cầu rút tiền. Vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  };

  const formatPrice = (price) => {
    return new Intl.NumberFormat('vi-VN').format(price);
  };

  const calculateFee = (amount) => {
    // For now, withdrawal is free
    return 0;
  };

  const calculateTotal = (amount) => {
    return amount - calculateFee(amount);
  };

  const formatDate = (date) => {
    if (!date) return 'Chưa cập nhật';

    return new Date(date).toLocaleDateString('vi-VN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusMeta = (status) => {
    const statusMap = {
      pending: { label: 'Đang xử lý', color: 'warning' },
      completed: { label: 'Đã chuyển khoản', color: 'success' },
      failed: { label: 'Từ chối', color: 'error' },
      cancelled: { label: 'Đã hủy', color: 'default' }
    };

    return statusMap[status] || { label: status, color: 'default' };
  };

  // LỌC BỎ GIAO DỊCH TRÙNG: Chỉ lấy những giao dịch có metadata ngân hàng
  const validWithdrawals = recentWithdrawals.filter(item => item.metadata?.bankName);

  const setField = (name, value) => handleChange({ target: { name, value } });
  const amountNumber = parseInt(formData.amount);
  const pendingAmount = Number(balance?.pendingWithdrawalAmount || 0);

  if (fetchingBalance) {
    return (
      <div className="withdrawal-container container">
        <Flex justify="center" gap={12} className="withdrawal-loading" role="status">
          <Spin />
          <Typography.Text type="secondary">Đang tải...</Typography.Text>
        </Flex>
      </div>
    );
  }

  return (
    <div className="withdrawal-container container">
      <div className="withdrawal-header">
        <LinkButton type="link" to="/wallet" icon={<ArrowLeft />} className="back-btn">Quay lại</LinkButton>
        <Typography.Title level={1}>Rút tiền từ ví</Typography.Title>
        <Typography.Paragraph type="secondary">Tạo yêu cầu rút tiền về tài khoản ngân hàng</Typography.Paragraph>
      </div>

      <div className="withdrawal-content">
        <Form layout="vertical" onFinish={handleSubmit} className="withdrawal-form">
          <Card className="withdrawal-section balance-info">
            <Statistic
              title="Số dư khả dụng"
              value={`${formatPrice(balance?.availableWithdrawalBalance || 0)} VNĐ`}
              formatter={(value) => value}
            />
            <Flex wrap gap={16} className="balance-submeta">
              <Typography.Text type="secondary">Số dư ví: {formatPrice(balance?.balance || 0)} VNĐ</Typography.Text>
              <Typography.Text type="secondary">Đang chờ rút: {formatPrice(pendingAmount)} VNĐ</Typography.Text>
            </Flex>
          </Card>

          <Card className="withdrawal-section" title={<Typography.Title level={2}>Số tiền rút</Typography.Title>}>
            <Form.Item
              label="Số tiền (VNĐ)"
              htmlFor="amount"
              required
              validateStatus={errors.amount ? 'error' : undefined}
              help={errors.amount}
              extra="Số tiền rút tối thiểu: 50,000 VNĐ"
            >
              <Input
                id="amount"
                name="amount"
                value={formData.amount}
                onChange={handleChange}
                placeholder="VD: 100000"
                suffix="VNĐ"
                inputMode="numeric"
              />
            </Form.Item>
            {pendingAmount > 0 && (
              <Alert
                className="warning-text"
                type="warning"
                showIcon
                title={`Hiện có ${formatPrice(pendingAmount)} VNĐ đang chờ xử lý nên chưa thể rút tiếp phần tiền này.`}
              />
            )}

            <Flex wrap gap={8} className="quick-amounts">
              <Button onClick={() => setFormData(prev => ({ ...prev, amount: '100000' }))}>100,000 VNĐ</Button>
              <Button onClick={() => setFormData(prev => ({ ...prev, amount: '500000' }))}>500,000 VNĐ</Button>
              <Button
                onClick={() => setFormData(prev => ({ ...prev, amount: (balance?.availableWithdrawalBalance || 0).toString() }))}
                disabled={!balance?.availableWithdrawalBalance}
              >
                Tất cả
              </Button>
            </Flex>
          </Card>

          <Card className="withdrawal-section" title={<Typography.Title level={2}>Thông tin tài khoản ngân hàng</Typography.Title>}>
            <Form.Item
              label="Ngân hàng"
              htmlFor="bankName"
              required
              validateStatus={errors['bankAccount.bankName'] ? 'error' : undefined}
              help={errors['bankAccount.bankName']}
            >
              <Select
                id="bankName"
                showSearch
                placeholder="Chọn ngân hàng"
                value={formData.bankAccount.bankName || undefined}
                options={popularBanks.map(bank => ({ value: bank, label: bank }))}
                onChange={(value) => setField('bankAccount.bankName', value)}
              />
            </Form.Item>

            <Form.Item
              label="Số tài khoản"
              htmlFor="accountNumber"
              required
              validateStatus={errors['bankAccount.accountNumber'] ? 'error' : undefined}
              help={errors['bankAccount.accountNumber']}
            >
              <Input
                id="accountNumber"
                name="bankAccount.accountNumber"
                value={formData.bankAccount.accountNumber}
                onChange={handleChange}
                placeholder="VD: 1234567890"
              />
            </Form.Item>

            <Form.Item
              label="Tên chủ tài khoản"
              htmlFor="accountName"
              required
              validateStatus={errors['bankAccount.accountName'] ? 'error' : undefined}
              help={errors['bankAccount.accountName']}
              extra="Tên phải khớp với tên trên tài khoản ngân hàng"
            >
              <Input
                id="accountName"
                name="bankAccount.accountName"
                value={formData.bankAccount.accountName}
                onChange={handleChange}
                placeholder="VD: NGUYEN VAN A"
              />
            </Form.Item>
          </Card>

          {formData.amount && amountNumber >= 50000 && (
            <Card className="withdrawal-section withdrawal-summary" title={<Typography.Title level={3}>Thông tin rút tiền</Typography.Title>}>
              <Descriptions
                column={1}
                size="small"
                items={[
                  { key: 'amount', label: 'Số tiền rút', children: `${formatPrice(amountNumber)} VNĐ` },
                  { key: 'fee', label: 'Phí giao dịch', children: 'Miễn phí' },
                  { key: 'total', label: 'Số tiền nhận được', children: <strong className="total-amount">{formatPrice(calculateTotal(amountNumber))} VNĐ</strong> }
                ]}
              />
            </Card>
          )}

          <Flex justify="flex-end" gap={12} className="withdrawal-actions">
            <Button size="large" onClick={() => navigate('/wallet')} disabled={loading}>Hủy</Button>
            <Button type="primary" size="large" htmlType="submit" disabled={loading || !formData.amount || amountNumber < 50000}>
              {loading ? 'Đang xử lý...' : 'Tạo yêu cầu rút tiền'}
            </Button>
          </Flex>
        </Form>

        <Card className="withdrawal-notice" title={<Typography.Title level={3}><Warning /> Lưu ý quan trọng</Typography.Title>}>
          <ul>
            <li>Thời gian xử lý: 1-3 ngày làm việc</li>
            <li>Kiểm tra kỹ thông tin tài khoản trước khi gửi</li>
            <li>Không thể hủy yêu cầu sau khi đã gửi</li>
            <li>Liên hệ hỗ trợ nếu có vấn đề</li>
          </ul>

          <LinkButton type="link" to="/wallet" className="withdrawal-notice__link">Xem toàn bộ lịch sử ví</LinkButton>

          <div className="withdrawal-history">
            <Flex justify="space-between" align="center" className="withdrawal-history__header">
              <Typography.Title level={4}>Yêu cầu gần đây</Typography.Title>
              <Typography.Text type="secondary">{validWithdrawals.length} giao dịch hợp lệ</Typography.Text>
            </Flex>

            {validWithdrawals.length === 0 ? (
              <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="Bạn chưa tạo yêu cầu rút tiền nào." />
            ) : (
              <Flex vertical gap={10} className="withdrawal-history__list">
                {validWithdrawals.map((item) => {
                  const statusMeta = getStatusMeta(item.status);
                  const isFailed = item.status === 'failed';
                  const isPending = item.status === 'pending';
                  const amountAbs = Math.abs(Number(item.amount || 0));

                  return (
                    <Card size="small" key={item._id} className="withdrawal-history__item">
                      <Flex justify="space-between" align="center" gap={8}>
                        <Typography.Text strong type={isPending ? 'warning' : undefined}>{formatPrice(amountAbs)} VNĐ</Typography.Text>
                        <Tag color={statusMeta.color}>{statusMeta.label}</Tag>
                      </Flex>
                      <Flex vertical gap={2} className="withdrawal-history__details">
                        <Typography.Text type="secondary">Ngân hàng: {item.metadata?.bankName || '---'} - {item.metadata?.bankAccount || '---'}</Typography.Text>
                        <Typography.Text type="secondary">Chủ TK: {item.metadata?.accountHolder || '---'}</Typography.Text>
                        <Typography.Text type="secondary" className="withdrawal-history__date">Gửi lúc: {formatDate(item.createdAt)}</Typography.Text>
                        {isPending && <Typography.Text type="warning" strong>Đang xử lý</Typography.Text>}
                        {isFailed && <Typography.Text type="danger" strong>Bạn rút tiền không thành công</Typography.Text>}
                        {isFailed && item.failureReason && <Typography.Text type="danger" strong>Lý do: {item.failureReason}</Typography.Text>}
                      </Flex>
                    </Card>
                  );
                })}
              </Flex>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
};

export default Withdrawal;
