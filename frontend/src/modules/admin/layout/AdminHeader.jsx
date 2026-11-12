import React, { useState } from 'react';
import { useAuth } from '../../../hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import { CaretDown, List, SealCheck, SignOut } from '@phosphor-icons/react';

const AdminHeader = ({ onToggleSidebar }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [showUserMenu, setShowUserMenu] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <header className="admin-header">
      <div className="admin-header__left">
        <button 
          className="admin-header__menu-btn"
          onClick={onToggleSidebar}
        >
          <List />
        </button>

        <div className="admin-header__badge">
          <SealCheck />
        </div>
        
        <div className="admin-header__title-wrap">
          <div className="admin-header__title">Bảng điều hành quản trị</div>
          <div className="admin-header__subtitle">Quản lý toàn bộ hệ thống</div>
        </div>
      </div>

      <div className="admin-header__right">
        <span className="admin-header__role-chip">Quản trị viên</span>
        <div className="admin-header__user">
          <button 
            className="admin-header__user-btn"
            onClick={() => setShowUserMenu(!showUserMenu)}
          >
            <img 
              src={user?.avatar || '/images/placeholders/avatar-placeholder.svg'} 
              alt={user?.fullName}
              className="admin-header__user-avatar"
            />
            <span className="admin-header__user-name">{user?.fullName}</span>
            <CaretDown />
          </button>

          {showUserMenu && (
            <div className="admin-header__user-menu">
              <div className="admin-header__user-menu-header">
                <img 
                  src={user?.avatar || '/images/placeholders/avatar-placeholder.svg'} 
                  alt={user?.fullName}
                />
                <div>
                  <div className="admin-header__user-menu-name">{user?.fullName}</div>
                  <div className="admin-header__user-menu-role">Administrator</div>
                </div>
              </div>
              
              <div className="admin-header__user-menu-items">
                
                <button 
                  className="admin-header__user-menu-item admin-header__user-menu-item--danger"
                  onClick={handleLogout}
                >
                  <SignOut />
                  <span>Đăng xuất</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default AdminHeader;