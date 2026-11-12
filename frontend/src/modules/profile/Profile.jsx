import React, { useState, useEffect } from "react";
import { useAuth } from "../../hooks/useAuth";
import { useNavigate, Link } from "react-router-dom";
import { Alert, Avatar, Button, Card, Col, Descriptions, Flex, Row, Spin, Tag, Typography } from "antd";
import LinkButton from "../../ui/LinkButton";
import { getProfile } from "../../services/user.service";
import { getImageUrl } from "../../utils/imageHelper";
import "./Profile.css";
import { ChatsCircle, Handshake, Key, Package, ShoppingCart, Wallet } from "@phosphor-icons/react";

function Profile() {
  const { user, logout, loading: authLoading } = useAuth();
  const navigate = useNavigate();

  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (user) {
      fetchProfileData();
    } else {
      setLoading(false);
    }
  }, [user]);

  const fetchProfileData = async () => {
    try {
      setLoading(true);

      const profileResponse = await getProfile();

      setProfile(profileResponse.data);
      setError("");
    } catch (error) {
      setError("Không thể tải thông tin profile");
      console.error("Error fetching profile:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString("vi-VN", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  if (authLoading || loading) {
    return (
      <div className="profile-container container">
        <Flex justify="center" gap={12} className="profile-loading" role="status">
          <Spin />
          <Typography.Text type="secondary">Đang tải...</Typography.Text>
        </Flex>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="profile-container container">
        <Alert type="warning" showIcon role="alert" title="Vui lòng đăng nhập để xem profile" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="profile-container container">
        <Alert
          type="error"
          showIcon
          role="alert"
          title={error}
          action={<Button size="small" type="primary" onClick={fetchProfileData}>Thử lại</Button>}
        />
      </div>
    );
  }

  const quickActions = [
    { to: "/my-products", icon: <Package />, label: "Quản lý sản phẩm" },
    { to: "/orders", icon: <ShoppingCart />, label: "Đơn hàng của tôi" },
    { to: "/wallet", icon: <Wallet />, label: "Ví của tôi" },
    { to: "/orders", icon: <Handshake />, label: "Yêu cầu mua hàng" },
    { to: "/chat", icon: <ChatsCircle />, label: "Tin nhắn" },
    { to: "/profile/change-password", icon: <Key />, label: "Đổi mật khẩu" },
  ];

  return (
    <div className="profile-container container">
      <Flex justify="space-between" align="center" wrap gap={16} className="profile-header">
        <Typography.Title level={1} className="profile-title">Thông tin tài khoản</Typography.Title>
        <Flex gap={8} className="profile-actions">
          <LinkButton type="primary" to="/profile/edit">Chỉnh sửa</LinkButton>
          <Button onClick={handleLogout}>Đăng xuất</Button>
        </Flex>
      </Flex>

      <div className="profile-content">
        <Card className="profile-card" title={<Typography.Title level={2}>Thông tin cơ bản</Typography.Title>}>
          <Flex gap={20} align="center" wrap className="profile-avatar-section">
            {profile?.avatar ? (
              <Avatar size={96} src={getImageUrl(profile.avatar)} alt={profile.fullName} />
            ) : (
              <Avatar size={96} className="avatar-placeholder">{profile?.fullName?.charAt(0).toUpperCase()}</Avatar>
            )}
            <div className="avatar-info">
              <Typography.Title level={3}>{profile?.fullName}</Typography.Title>
              <Typography.Text type="secondary" className="user-email">{profile?.email}</Typography.Text>
              <Flex vertical gap={6} className="profile-user-stats">
                <Flex align="center" wrap gap={8}>
                  <span className="profile-stat-label">Đánh giá:</span>
                  <strong className="profile-stat-value">
                    {profile?.rating > 0 ? `${profile.rating.toFixed(1)}/5` : "Chưa có"}
                    {profile?.totalReviews > 0 && (
                      <span className="profile-review-count"> ({profile.totalReviews} đánh giá)</span>
                    )}
                  </strong>
                  {profile?._id && (
                    <LinkButton size="small" to={`/user/${profile._id}/reviews`}>Xem chi tiết đánh giá</LinkButton>
                  )}
                </Flex>
                <Flex gap={8}>
                  <span className="profile-stat-label">Thành viên từ:</span>
                  <strong className="profile-stat-value">{formatDate(profile?.createdAt)}</strong>
                </Flex>
              </Flex>
            </div>
          </Flex>

          <Descriptions
            className="profile-info"
            column={1}
            size="small"
            items={[
              { key: "phone", label: "Số điện thoại", children: profile?.phone || "Chưa cập nhật" },
              { key: "address", label: "Địa chỉ", children: profile?.address || "Chưa cập nhật" },
              { key: "role", label: "Vai trò", children: <Tag className="role-badge">{profile?.role}</Tag> },
            ]}
          />
        </Card>

        <Card className="profile-card" title={<Typography.Title level={2}>Thao tác nhanh</Typography.Title>}>
          <Row gutter={[12, 12]} className="quick-actions">
            {quickActions.map((action) => (
              <Col key={action.label} xs={12} md={8}>
                <Link to={action.to} className="action-item">
                  <Card hoverable size="small">
                    <Flex vertical align="center" gap={8}>
                      {action.icon}
                      <span>{action.label}</span>
                    </Flex>
                  </Card>
                </Link>
              </Col>
            ))}
          </Row>
        </Card>
      </div>
    </div>
  );
}

export default Profile;
