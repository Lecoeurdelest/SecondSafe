import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Alert, Avatar, Button, Card, Flex, Form, Input, Spin, Typography } from 'antd';
import LinkButton from '../../ui/LinkButton';
import { getProfile, updateProfile, uploadAvatar } from '../../services/user.service';
import { useAuth } from '../../hooks/useAuth';
import { getImageUrl } from '../../utils/imageHelper';
import LocationSelector from '../../components/LocationSelector';
import './EditProfile.css';
import { ArrowLeft, Camera } from '@phosphor-icons/react';

const EditProfile = () => {
  const navigate = useNavigate();
  const { refreshUser } = useAuth();
  
  const [profile, setProfile] = useState({
    fullName: '',
    phone: '',
    address: '',
    specificAddress: '',
    location: {
      city: '',
      district: '',
      ward: '',
      provinceCode: null,
      districtCode: null,
      wardCode: null
    },
    avatar: ''
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [avatarFile, setAvatarFile] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState('');
  const avatarInput = useRef(null);

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const response = await getProfile();
      const userData = response.data;
      
      setProfile({
        fullName: userData.fullName || '',
        phone: userData.phone || '',
        address: userData.address || '',
        specificAddress: userData.specificAddress || '',
        location: userData.location || {
          city: '',
          district: '',
          ward: '',
          provinceCode: null,
          districtCode: null,
          wardCode: null
        },
        avatar: userData.avatar || ''
      });
      setAvatarPreview(userData.avatar ? getImageUrl(userData.avatar) : '');
      setError('');
    } catch (error) {
      setError('Không thể tải thông tin profile');
      console.error('Error fetching profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setProfile(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleLocationChange = (locationData) => {
    setProfile(prev => ({
      ...prev,
      location: locationData
    }));
  };

  const handleAvatarChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        setError('Vui lòng chọn file ảnh');
        return;
      }
      
      // Kiem tra kich thuoc file (toi da 5MB)
      if (file.size > 5 * 1024 * 1024) {
        setError('Kích thước ảnh không được vượt quá 5MB');
        return;
      }
      
      setAvatarFile(file);
      
      // Tao anh xem truoc
      const reader = new FileReader();
      reader.onload = (e) => {
        setAvatarPreview(e.target.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async () => {
    // Kiem tra cac truong bat buoc
    if (!profile.fullName.trim()) {
      setError('Vui lòng nhập họ tên');
      return;
    }
    
    if (profile.phone && !/^[0-9]{10,11}$/.test(profile.phone)) {
      setError('Số điện thoại không hợp lệ (10-11 số)');
      return;
    }

    setSaving(true);
    setError('');
    setSuccess('');

    try {
      if (avatarFile) {
        const formData = new FormData();
        formData.append('avatar', avatarFile);
        await uploadAvatar(formData);
      }

      // Cap nhat thong tin ca nhan
      await updateProfile({
        fullName: profile.fullName.trim(),
        phone: profile.phone.trim(),
        address: profile.address ? profile.address.trim() : '',
        specificAddress: profile.specificAddress ? profile.specificAddress.trim() : '',
        location: profile.location
      });

      setSuccess('Cập nhật thông tin thành công!');
      
      // Dong bo lai AuthContext de avatar moi hien thi ngay tren navbar
      try { await refreshUser(); } catch (_) {}

      // Chuyen huong sau 2 giay
      setTimeout(() => {
        navigate('/profile');
      }, 2000);
      
    } catch (error) {
      const errorMsg = 
        error.response?.data?.message || 
        error.message || 
        error.response?.data || 
        'Có lỗi xảy ra khi cập nhật thông tin';
        setError(typeof errorMsg === 'string' ? errorMsg : 'Có lỗi xảy ra');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="edit-profile-container container">
        <Flex justify="center" gap={12} className="edit-profile-loading" role="status">
          <Spin />
          <Typography.Text type="secondary">Đang tải...</Typography.Text>
        </Flex>
      </div>
    );
  }

  return (
    <div className="edit-profile-container container">
      <div className="edit-profile-header">
        <LinkButton type="link" to="/profile" icon={<ArrowLeft />} className="back-button">Quay lại</LinkButton>
        <Typography.Title level={1}>Chỉnh sửa thông tin</Typography.Title>
      </div>

      <div className="edit-profile-content">
        <Form layout="vertical" onFinish={handleSubmit} className="edit-profile-form">
          <Card className="edit-profile-section" title={<Typography.Title level={2}>Ảnh đại diện</Typography.Title>}>
            <Flex align="center" gap={20} wrap className="avatar-upload-section">
              {avatarPreview ? (
                <Avatar size={96} src={avatarPreview} alt="Avatar preview" />
              ) : (
                <Avatar size={96}>{profile.fullName.charAt(0).toUpperCase()}</Avatar>
              )}
              <Flex vertical gap={8} className="avatar-upload-controls">
                <input
                  ref={avatarInput}
                  type="file"
                  id="avatar"
                  accept="image/*"
                  aria-label="Chọn ảnh đại diện"
                  onChange={handleAvatarChange}
                  hidden
                />
                <Button icon={<Camera />} onClick={() => avatarInput.current.click()}>Chọn ảnh</Button>
                <Typography.Text type="secondary" className="upload-note">Định dạng: JPG, PNG. Tối đa 5MB.</Typography.Text>
              </Flex>
            </Flex>
          </Card>

          <Card className="edit-profile-section" title={<Typography.Title level={2}>Thông tin cơ bản</Typography.Title>}>
            <Form.Item label="Họ và tên" htmlFor="fullName" required>
              <Input
                id="fullName"
                name="fullName"
                value={profile.fullName}
                onChange={handleInputChange}
                maxLength={100}
                placeholder="Nhập họ và tên đầy đủ"
              />
            </Form.Item>

            <Form.Item label="Số điện thoại" htmlFor="phone">
              <Input
                id="phone"
                name="phone"
                type="tel"
                value={profile.phone}
                onChange={handleInputChange}
                placeholder="Nhập số điện thoại (10-11 số)"
              />
            </Form.Item>

            <Form.Item label="Địa chỉ khu vực">
              <LocationSelector
                value={profile.location}
                onChange={handleLocationChange}
                errors={{}}
              />
            </Form.Item>

            <Form.Item label="Địa chỉ cụ thể (Số nhà, tên đường...)" htmlFor="specificAddress">
              <Input.TextArea
                id="specificAddress"
                name="specificAddress"
                value={profile.specificAddress}
                onChange={handleInputChange}
                rows={2}
                maxLength={200}
                showCount
                placeholder="Ví dụ: Số 10 Ngõ 20, Phố X"
              />
            </Form.Item>
          </Card>

          {error && <Alert type="error" showIcon role="alert" title={error} />}
          {success && <Alert type="success" showIcon role="status" title={success} />}

          <Flex justify="flex-end" gap={12} className="edit-profile-actions">
            <Button size="large" onClick={() => navigate('/profile')} disabled={saving}>Hủy</Button>
            <Button type="primary" size="large" htmlType="submit" disabled={saving}>
              {saving ? 'Đang lưu...' : 'Lưu thay đổi'}
            </Button>
          </Flex>
        </Form>
      </div>
    </div>
  );
};

export default EditProfile;
