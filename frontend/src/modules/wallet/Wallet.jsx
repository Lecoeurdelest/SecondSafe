import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import walletService from '../../services/wallet.service';
import LinkButton from '../../ui/LinkButton';
import './Wallet.css';
import { Alert, Avatar, Button, Card, Col, Empty, Flex, Input, Pagination, Row, Select, Spin, Statistic, Tag, Typography } from 'antd';
import { ArrowDownLeft, ArrowUUpLeft, ArrowUpRight, Bank, Coins, CreditCard, CurrencyCircleDollar } from '@phosphor-icons/react';

const TYPE_OPTIONS = [
  { value: '', label: 'Tất cả loại' },
  { value: 'deposit', label: 'Nạp tiền' },
  { value: 'withdrawal', label: 'Rút tiền' },
  { value: 'payment', label: 'Thanh toán' },
  { value: 'refund', label: 'Hoàn tiền' },
  { value: 'earning', label: 'Thu nhập' }
];

const STATUS_TAGS = {
  completed: { text: 'Hoàn thành', color: 'success' },
  pending: { text: 'Đang xử lý', color: 'warning' },
  failed: { text: 'Thất bại', color: 'error' },
  cancelled: { text: 'Đã hủy', color: 'default' }
};

const DEBIT_TYPES = new Set(['withdrawal', 'payment', 'fee']);
const CREDIT_TYPES = new Set(['deposit', 'refund', 'earning']);

function describeAmount(transaction) {
  const rawAmount = Math.abs(Number(transaction?.amount) || 0);
  const type = transaction?.type;
  const isCompleted = transaction?.status === 'completed';
  let result = { amount: rawAmount, sign: '', tone: undefined, suffix: '' };

  if (CREDIT_TYPES.has(type)) {
    result = isCompleted && rawAmount > 0
      ? { amount: rawAmount, sign: '+', tone: 'success', suffix: '' }
      : { amount: 0, sign: '', tone: undefined, suffix: '' };
  }

  if (DEBIT_TYPES.has(type)) {
    result = isCompleted && rawAmount > 0
      ? { amount: rawAmount, sign: '-', tone: 'danger', suffix: '' }
      : { amount: rawAmount, sign: '', tone: undefined, suffix: ' ( không thành công)' };
  }

  return result;
}

const Wallet = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [balance, setBalance] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [transactionsLoading, setTransactionsLoading] = useState(false);
  const [error, setError] = useState(null);

  const [filters, setFilters] = useState({
    type: '',
    startDate: '',
    endDate: ''
  });

  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0
  });

  const fetchWalletData = useCallback(async () => {
    try {
      setLoading(true);
      const balanceData = await walletService.getBalance();
      setBalance(balanceData);
      setError(null);
    } catch (err) {
      setError(err.message || 'Không thể tải thông tin ví');
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchTransactions = useCallback(async () => {
    try {
      setTransactionsLoading(true);
      const params = {
        page: pagination.page,
        limit: pagination.limit,
        ...filters
      };

      const data = await walletService.getTransactions(params);
      setTransactions(data.transactions || []);
      setPagination(prev => ({
        ...prev,
        total: data.pagination?.total || 0,
        totalPages: data.pagination?.totalPages || 0
      }));
    } catch (err) {
      console.error('Error fetching transactions:', err);
    } finally {
      setTransactionsLoading(false);
    }
  }, [filters, pagination.page, pagination.limit]);

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }
    fetchWalletData();
  }, [user, navigate, fetchWalletData]);

  useEffect(() => {
    fetchTransactions();
  }, [fetchTransactions]);

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({ ...prev, [name]: value }));
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  const handlePageChange = (newPage) => {
    setPagination(prev => ({ ...prev, page: newPage }));
  };

  const formatPrice = (amount) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(Math.abs(amount));
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('vi-VN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getTransactionTypeText = (type) => {
    const types = {
      'deposit': 'Nạp tiền',
      'withdrawal': 'Rút tiền',
      'payment': 'Thanh toán',
      'refund': 'Hoàn tiền',
      'earning': 'Thu nhập',
      'fee': 'Phí nền tảng'
    };
    return types[type] || type;
  };

  const getTransactionIcon = (type) => {
    const icons = {
      'deposit': <ArrowUpRight />,
      'withdrawal': <ArrowDownLeft />,
      'payment': <CreditCard />,
      'refund': <ArrowUUpLeft />,
      'earning': <Coins />,
      'fee': <Bank />
    };
    return icons[type] || <CurrencyCircleDollar />;
  };

  const renderTransactionDetails = (transaction) => {
    if (transaction.type !== 'withdrawal') {
      return null;
    }

    return (
      <div className="transaction-extra">
        <Typography.Text type="secondary" className="bank-info">
          Ngân hàng: {transaction.metadata?.bankName || '---'} - {transaction.metadata?.bankAccount || '---'}
          {transaction.metadata?.accountHolder && (
            <span className="bank-info__holder">Chủ TK: {transaction.metadata.accountHolder}</span>
          )}
        </Typography.Text>
        {transaction.failureReason && (
          <Typography.Text type="danger" strong className="transaction-extra__error">Lý do: {transaction.failureReason}</Typography.Text>
        )}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="wallet-container container">
        <Flex justify="center" gap={12} className="wallet-loading" role="status">
          <Spin />
          <Typography.Text type="secondary">Đang tải...</Typography.Text>
        </Flex>
      </div>
    );
  }

  if (error) {
    return (
      <div className="wallet-container container">
        <Alert
          type="error"
          showIcon
          role="alert"
          title={error}
          action={<Button size="small" type="primary" onClick={fetchWalletData}>Thử lại</Button>}
        />
      </div>
    );
  }

  const stats = [
    { key: 'deposited', title: 'Tổng nạp:', value: balance?.totalDeposited },
    { key: 'withdrawn', title: 'Tổng rút:', value: balance?.totalWithdrawn },
    { key: 'pending', title: 'Đang chờ rút:', value: balance?.pendingWithdrawalAmount, highlight: true },
    { key: 'spent', title: 'Tổng chi:', value: balance?.totalSpent },
    { key: 'earned', title: 'Tổng thu:', value: balance?.totalEarned }
  ];
  const visibleTransactions = transactions.filter((transaction) => !(transaction.type === 'withdrawal' && !transaction.metadata?.bankName));

  return (
    <div className="wallet-container container">
      <Flex justify="space-between" align="center" wrap gap={16} className="wallet-header">
        <Typography.Title level={1}>Ví của tôi</Typography.Title>
        <LinkButton to="/wallet/withdraw">Rút tiền</LinkButton>
      </Flex>

      <Card className="balance-card">
        <Statistic
          className="balance-main"
          title="Số dư khả dụng"
          value={formatPrice(balance?.balance || 0)}
          formatter={(value) => value}
        />
        <Row gutter={[16, 16]} className="balance-stats">
          {stats.map(({ key, title, value, highlight }) => (
            <Col key={key} flex="1 1 180px">
              <Statistic
                className={highlight ? 'stat-item stat-item--highlight' : 'stat-item'}
                title={title}
                value={formatPrice(value || 0)}
                formatter={(text) => text}
              />
            </Col>
          ))}
        </Row>
      </Card>

      <Card
        className="transactions-section"
        title={<Typography.Title level={2}>Lịch sử giao dịch</Typography.Title>}
        extra={(
          <Flex wrap gap={8} className="transaction-filters">
            <Select
              className="filter-select"
              aria-label="Lọc theo loại giao dịch"
              value={filters.type}
              options={TYPE_OPTIONS}
              onChange={(value) => handleFilterChange({ target: { name: 'type', value } })}
            />
            <Input
              type="date"
              className="filter-input"
              aria-label="Từ ngày"
              value={filters.startDate}
              onChange={(event) => handleFilterChange({ target: { name: 'startDate', value: event.target.value } })}
            />
            <Input
              type="date"
              className="filter-input"
              aria-label="Đến ngày"
              value={filters.endDate}
              onChange={(event) => handleFilterChange({ target: { name: 'endDate', value: event.target.value } })}
            />
          </Flex>
        )}
      >
        {transactionsLoading ? (
          <Flex justify="center" gap={12} className="wallet-loading" role="status">
            <Spin />
            <Typography.Text type="secondary">Đang tải giao dịch...</Typography.Text>
          </Flex>
        ) : transactions.length === 0 ? (
          <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="Chưa có giao dịch nào" />
        ) : (
          <>
            <Flex vertical gap={12} className="transactions-list">
              {visibleTransactions.map((transaction) => {
                const type = transaction?.type;
                const status = transaction?.status;
                const isPending = status === 'pending';
                const isFailed = status === 'failed';
                const rawAmount = Math.abs(Number(transaction?.amount) || 0);
                const { amount, sign, tone, suffix } = describeAmount(transaction);
                const statusTag = STATUS_TAGS[status] || { text: status, color: 'default' };

                return (
                  <Card size="small" key={transaction._id} className="transaction-item">
                    <Flex align="flex-start" gap={16} className="transaction-item__body">
                      <Avatar className="transaction-icon" icon={getTransactionIcon(type)} />

                      <div className="transaction-info">
                        <Typography.Text strong className="transaction-type">{getTransactionTypeText(type)}</Typography.Text>
                        {type === 'deposit' && status === 'completed' && transaction.description && (
                          <Typography.Text type="secondary" className="transaction-description">{transaction.description}</Typography.Text>
                        )}
                        {renderTransactionDetails(transaction)}
                        <Typography.Text type="secondary" className="transaction-date">{formatDate(transaction.createdAt)}</Typography.Text>
                      </div>

                      <Flex vertical align="flex-end" gap={4} className="transaction-amount">
                        <Typography.Text strong type={tone} className="amount">
                          {sign}{formatPrice(amount)}{suffix}
                        </Typography.Text>
                        <Tag color={statusTag.color}>{statusTag.text}</Tag>
                        {type === 'withdrawal' && isPending && (
                          <Typography.Text type="warning" strong>Đang xử lý</Typography.Text>
                        )}
                        {type === 'withdrawal' && isFailed && (
                          <Typography.Text type="danger" strong>Bạn rút tiền không thành công</Typography.Text>
                        )}
                        {type === 'deposit' && (isFailed || isPending) && (
                          <Typography.Text type="danger" strong>{formatPrice(rawAmount)} nạp thất bại</Typography.Text>
                        )}
                      </Flex>
                    </Flex>
                  </Card>
                );
              })}
            </Flex>

            <Pagination
              className="wallet-pagination"
              align="center"
              hideOnSinglePage
              showSizeChanger={false}
              current={pagination.page}
              pageSize={pagination.limit}
              total={pagination.total}
              onChange={handlePageChange}
            />
          </>
        )}
      </Card>
    </div>
  );
};

export default Wallet;
