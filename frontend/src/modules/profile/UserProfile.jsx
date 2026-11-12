import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Alert, App as AntApp, Avatar, Button, Card, Col, Empty, Flex, Row, Spin, Typography } from 'antd';
import LinkButton from '../../ui/LinkButton';
import { getPublicProfile, getUserStats } from '../../services/user.service';
import productService from '../../services/product.service';
import { getImageUrl, getUserAvatarUrl } from '../../utils/imageHelper';
import { useAuth } from '../../hooks/useAuth';
import ReportUser from '../report/ReportUser';
import './UserProfile.css';
import { MapPin, Package, Star, User } from '@phosphor-icons/react';

const PRODUCT_PLACEHOLDER = '/images/placeholders/product-placeholder.svg';

const UserProfile = () => {
  const { userId } = useParams();
  const navigate = useNavigate();
  const { user: currentUser } = useAuth();
  const { message } = AntApp.useApp();

  const [user, setUser] = useState(null);
  const [stats, setStats] = useState(null);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showReportModal, setShowReportModal] = useState(false);

  const fetchUserProfile = useCallback(async () => {
    try {
      setLoading(true);

      const [profileResponse, statsResponse, productsResponse] = await Promise.all([
        getPublicProfile(userId),
        getUserStats(userId),
        productService.getProducts({ seller: userId, limit: 12 })
      ]);

      setUser(profileResponse.data);
      setStats(statsResponse.data);
      setProducts(productsResponse.products || []);
      
      setError(null);
    } catch (err) {
      setError(err.response?.data?.message || 'Không thể tải thông tin người dùng');
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    fetchUserProfile();
  }, [fetchUserProfile]);

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('vi-VN', {
      year: 'numeric',
      month: 'long'
    });
  };

  const formatPrice = (price) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(price);
  };

  const handleOpenReport = () => {
    const currentUserId = String(currentUser?._id || currentUser?.id || currentUser?.userId || '');
    if (!currentUserId) {
      message.warning('Vui lòng đăng nhập để báo cáo người dùng');
      navigate('/login');
      return;
    }

    if (currentUserId === String(userId)) {
      message.warning('Bạn không thể báo cáo chính mình');
      return;
    }

    setShowReportModal(true);
  };

  const handleReportSuccess = () => {
    setShowReportModal(false);
    message.success('Báo cáo người dùng đã được gửi thành công. Chúng tôi sẽ kiểm tra sớm nhất.');
  };

  if (loading) {
    return (
      <div className="user-profile-container container">
        <Flex justify="center" gap={12} className="user-profile-loading" role="status">
          <Spin />
          <Typography.Text type="secondary">Đang tải...</Typography.Text>
        </Flex>
      </div>
    );
  }

  if (error) {
    return (
      <div className="user-profile-container container">
        <Alert type="error" showIcon role="alert" title={error} action={<Button size="small" onClick={() => navigate(-1)}>Quay lại</Button>} />
      </div>
    );
  }

  if (!user) {
    return null;
  }

  const isSelf = String(currentUser?._id || currentUser?.id || currentUser?.userId || '') === String(userId);

  return (
    <div className="user-profile-container container">
      <Card className="user-info-card">
        <Flex gap={20} align="center" wrap className="user-header">
          <Avatar
            size={96}
            src={getUserAvatarUrl(user)}
            alt={user.fullName}
            icon={<User />}
          />
          <div className="user-details">
            <Typography.Title level={1} className="user-name">{user.fullName}</Typography.Title>
            <Flex wrap gap={16} className="user-meta">
              <span className="meta-item"><User /> Thành viên từ {formatDate(user.createdAt)}</span>
              <span className="meta-item"><Package /> {products.length} sản phẩm đang bán</span>
              <span className="meta-item">
                <Star weight="fill" /> {Number(stats?.rating || user.rating || 0).toFixed(1)}/5 · {Number(stats?.totalReviews || user.totalReviews || 0)} đánh giá
              </span>
            </Flex>
          </div>
        </Flex>

        <Flex wrap gap={8} className="user-profile-actions">
          <LinkButton to={`/user/${userId}/reviews`}>Xem đánh giá người bán</LinkButton>
          {!isSelf && <Button danger onClick={handleOpenReport}>Báo cáo người dùng</Button>}
        </Flex>

        <div className="user-bio">
          <Typography.Title level={3}>Tổng quan</Typography.Title>
          <Typography.Paragraph>
            Người bán đang hoạt động trên ReFlow. Hãy xem thêm đánh giá và tin đăng trước khi giao dịch.
          </Typography.Paragraph>
        </div>
      </Card>

      <div className="user-products-section">
        <Typography.Title level={2}>Sản phẩm đang bán ({products.length})</Typography.Title>

        {products.length === 0 ? (
          <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="Người dùng chưa có sản phẩm nào" />
        ) : (
          <Row gutter={[{ xs: 10, md: 20 }, { xs: 10, md: 20 }]} className="user-products-grid">
            {products.map(product => (
              <Col key={product._id} xs={12} md={8} lg={6}>
                <Link to={`/product/${product._id}`} className="user-product-link">
                  <Card
                    hoverable
                    className="user-product-card"
                    cover={(
                      <div className="user-product-card__image">
                        <img
                          src={getImageUrl(product.images?.[0]) || PRODUCT_PLACEHOLDER}
                          alt={product.title}
                          onError={(event) => {
                            event.currentTarget.onerror = null;
                            event.currentTarget.src = PRODUCT_PLACEHOLDER;
                          }}
                        />
                      </div>
                    )}
                  >
                    <Typography.Title level={3} className="user-product-card__title">{product.title}</Typography.Title>
                    <Typography.Text strong className="user-product-card__price">{formatPrice(product.price)}</Typography.Text>
                    <Typography.Text type="secondary" className="user-product-card__location">
                      <MapPin /> {product.location?.district}, {product.location?.city}
                    </Typography.Text>
                  </Card>
                </Link>
              </Col>
            ))}
          </Row>
        )}
      </div>

      {showReportModal && user && (
        <ReportUser
          reportedUser={{ ...user, rating: stats?.rating || user.rating }}
          onSuccess={handleReportSuccess}
          onCancel={() => setShowReportModal(false)}
        />
      )}
    </div>
  );
};

export default UserProfile;
