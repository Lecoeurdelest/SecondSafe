import React from 'react';
import { useAuth } from '../../../hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import { Avatar, Button, Dropdown, Tag, Typography } from 'antd';
import { CaretDown, List, SealCheck, SignOut } from '@phosphor-icons/react';

const AVATAR_PLACEHOLDER = '/images/placeholders/avatar-placeholder.svg';

const AdminHeader = ({ onToggleSidebar }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const menu = {
    items: [
      {
        key: 'account',
        disabled: true,
        label: (
          <div className="admin-header__account">
            <Avatar src={user?.avatar || AVATAR_PLACEHOLDER} alt={user?.fullName} />
            <div>
              <Typography.Text strong>{user?.fullName}</Typography.Text>
              <Typography.Text type="secondary">Administrator</Typography.Text>
            </div>
          </div>
        )
      },
      { type: 'divider' },
      { key: 'logout', danger: true, icon: <SignOut />, label: 'Đăng xuất', onClick: handleLogout }
    ]
  };

  return (
    <header className="admin-header">
      <div className="admin-header__left">
        <Button className="admin-header__menu-btn" type="text" aria-label="Mở menu" icon={<List />} onClick={onToggleSidebar} />
        <Avatar className="admin-header__badge" shape="square" icon={<SealCheck />} />
        <div className="admin-header__title-wrap">
          <Typography.Text strong className="admin-header__title">Bảng điều hành quản trị</Typography.Text>
          <Typography.Text type="secondary" className="admin-header__subtitle">Quản lý toàn bộ hệ thống</Typography.Text>
        </div>
      </div>

      <div className="admin-header__right">
        <Tag className="admin-header__role-chip">Quản trị viên</Tag>
        <Dropdown menu={menu} trigger={['click']} placement="bottomRight">
          <Button className="admin-header__user-btn" type="text">
            <Avatar size={32} src={user?.avatar || AVATAR_PLACEHOLDER} alt={user?.fullName} />
            <span className="admin-header__user-name">{user?.fullName}</span>
            <CaretDown />
          </Button>
        </Dropdown>
      </div>
    </header>
  );
};

export default AdminHeader;
