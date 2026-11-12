import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import productService from '../../services/product.service';
import api from '../../services/api';
import { getProfile } from '../../services/user.service';
import LocationSelector from '../../components/LocationSelector';
import ProductImagePicker from './ProductImagePicker';
import './CreateProduct.css';
import { Alert, App as AntApp, Button, Card, Descriptions, Flex, Form, Input, Progress, Select, Statistic, Tag, Typography } from 'antd';
import { Check, MapPin } from '@phosphor-icons/react';
import CategoryIcon from '../../utils/categoryIcons';

const CONDITION_OPTIONS = [
  { value: 'new', label: 'Mới' },
  { value: 'like-new', label: 'Như mới' },
  { value: 'good', label: 'Tốt' },
  { value: 'fair', label: 'Khá' },
  { value: 'poor', label: 'Cũ' }
];

const CONDITION_LABELS = {
  new: 'Mới',
  'like-new': 'Như mới',
  good: 'Tốt',
  fair: 'Khá',
  poor: 'Cũ'
};

const MAX_PRICE_VALUE = 100000000;
const MAX_PRICE_DIGITS = 9;
const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png'];

const CreateProduct = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { message } = AntApp.useApp();

  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    price: '',
    categories: [],
    condition: 'like-new',
    images: [],
    location: {
      city: '',
      district: '',
      ward: '',
      provinceCode: null,
      districtCode: null,
      wardCode: null
    }
  });

  const [useProfileLocation, setUseProfileLocation] = useState(true);
  const [profileLocation, setProfileLocation] = useState(null);

  const [imageFiles, setImageFiles] = useState([]);
  const [imagePreviews, setImagePreviews] = useState([]);

  const fetchCategories = async () => {
    try {
      const response = await api.get('/categories');
      const categoriesData = response.data.data || response.data || [];
      const sanitizedCategories = categoriesData.filter((category) => {
        const slug = String(category?.slug || '').toLowerCase();
        const name = String(category?.name || '').toLowerCase();
        return slug !== 'other' && name !== 'khác' && name !== 'khac';
      });
      setCategories(sanitizedCategories);
    } catch (error) {
      console.error('Error fetching categories:', error);
      setCategories([]);
    }
  };

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }

    fetchCategories();

    // Pre-fill location from seller's profile
    getProfile().then(res => {
      const profile = res?.data || {};
      const loc = profile?.location || {};
      if (loc.city) {
        setProfileLocation(loc);
        setFormData(prev => ({ ...prev, location: loc }));
      }
    }).catch(() => {});
  }, [user, navigate]);

  const handleLocationChange = (locationData) => {
    setFormData(prev => ({
      ...prev,
      location: locationData
    }));

    // Clear location errors
    if (errors['location.city']) {
      setErrors(prev => ({ ...prev, 'location.city': '' }));
    }
    if (errors['location.district']) {
      setErrors(prev => ({ ...prev, 'location.district': '' }));
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    
    if (name.startsWith('location.')) {
      const locationField = name.split('.')[1];
      setFormData(prev => ({
        ...prev,
        location: {
          ...prev.location,
          [locationField]: value
        }
      }));
    } else if (name === 'price') {
      const rawNumericValue = String(value || '').replace(/\D/g, '');
      const exceededMaxPrice = Number(rawNumericValue || 0) > MAX_PRICE_VALUE;

      const numericValue = String(value || '')
        .replace(/\D/g, '')
        .slice(0, MAX_PRICE_DIGITS);

      setFormData(prev => ({
        ...prev,
        [name]: numericValue
      }));

      setErrors(prev => ({
        ...prev,
        price: exceededMaxPrice ? 'Giá tối đa là 100.000.000 VND' : ''
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }

    // Clear error for this field
    if (name !== 'price' && errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const handleCategoryToggle = (categoryId) => {
    setFormData(prev => {
      const isSelected = prev.categories.includes(categoryId);
      return {
        ...prev,
        categories: isSelected
          ? prev.categories.filter(id => id !== categoryId)
          : [...prev.categories, categoryId]
      };
    });

    if (errors.categories || errors.category) {
      setErrors(prev => ({ ...prev, categories: '', category: '' }));
    }
  };

  const handleImageChange = (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) {
      return;
    }

    setErrors(prev => ({ ...prev, images: '' }));
    
    if (files.length + imageFiles.length > 5) {
      setErrors(prev => ({ ...prev, images: 'Bạn chỉ có thể tải lên tối đa 5 ảnh.' }));
      return;
    }

    const invalidTypeFiles = files.filter(file => !ALLOWED_IMAGE_TYPES.includes(String(file.type || '').toLowerCase()));
    if (invalidTypeFiles.length > 0) {
      setErrors(prev => ({ ...prev, images: 'Chỉ cho phép tải lên ảnh JPG/JPEG hoặc PNG.' }));
    }

    // Kiem tra kich thuoc file (toi da 5MB moi anh)
    const invalidSizeFiles = files.filter(file => file.size > 5 * 1024 * 1024);
    if (invalidSizeFiles.length > 0) {
      setErrors(prev => ({ ...prev, images: 'Có ảnh vượt quá 5MB, vui lòng chọn lại.' }));
    }

    const validFiles = files.filter(file => {
      const isImage = ALLOWED_IMAGE_TYPES.includes(String(file.type || '').toLowerCase());
      const isWithinSize = file.size <= 5 * 1024 * 1024;
      return isImage && isWithinSize;
    });

    if (validFiles.length === 0) {
      return;
    }

    // Tao anh xem truoc
    const newPreviews = validFiles.map(file => URL.createObjectURL(file));
    
    setImageFiles(prev => [...prev, ...validFiles]);
    setImagePreviews(prev => [...prev, ...newPreviews]);
    
    if (errors.images) {
      setErrors(prev => ({ ...prev, images: '' }));
    }
  };

  const removeImage = (index) => {
    setImageFiles(prev => prev.filter((_, i) => i !== index));
    setImagePreviews(prev => {
      URL.revokeObjectURL(prev[index]);
      return prev.filter((_, i) => i !== index);
    });
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.title.trim()) {
      newErrors.title = 'Vui lòng nhập tiêu đề';
    }

    if (!formData.description.trim()) {
      newErrors.description = 'Vui lòng nhập mô tả';
    }

    if (!formData.price || formData.price <= 0) {
      newErrors.price = 'Vui lòng nhập giá hợp lệ';
    }
    if (Number(formData.price || 0) > MAX_PRICE_VALUE) {
      newErrors.price = 'Giá tối đa là 100.000.000 VND';
    }

    if (formData.categories.length === 0) {
      newErrors.categories = 'Vui lòng chọn ít nhất 1 danh mục';
    }

    if (imageFiles.length === 0) {
      newErrors.images = 'Vui lòng tải lên ít nhất 1 ảnh';
    }

    if (!formData.location.city) {
      newErrors['location.city'] = 'Vui lòng nhập thành phố';
    }

    if (!formData.location.district) {
      newErrors['location.district'] = 'Vui lòng nhập quận/huyện';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const uploadImages = async () => {
    if (imageFiles.length === 0) return [];
    
    const formData = new FormData();
    imageFiles.forEach(file => {
      formData.append('images', file);
    });
    
    try {
      const response = await api.post('/upload/images', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      
      // Lay duong dan anh tu response
      const files = response.data.data;
      if (Array.isArray(files)) {
        return files.map(f => f.path);
      }
      return [];
    } catch (error) {
      console.error('Upload error:', error);
      throw new Error('Không thể tải ảnh lên. Vui lòng thử lại.');
    }
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      return;
    }

    setLoading(true);

    try {
      // Upload anh truoc
      const imageUrls = await uploadImages();

      // Tao san pham - chi gui cac truong backend can
      const productData = {
        title: formData.title,
        description: formData.description,
        price: parseFloat(formData.price),
        category: formData.categories[0],
        categories: formData.categories,
        otherCategory: '',
        condition: formData.condition,
        images: imageUrls,
        location: {
          city: formData.location.city,
          district: formData.location.district,
          ward: formData.location.ward || ''
        }
      };

      await productService.createProduct(productData);

      const createdAtMarker = String(Date.now());
      localStorage.setItem('products:lastCreatedAt', createdAtMarker);
      window.dispatchEvent(new CustomEvent('products:updated', { detail: { createdAt: createdAtMarker } }));
      
      message.success('Đăng tin thành công. Bạn sẽ thấy thông báo mới trong mục thông báo.');
      navigate('/my-products');
    } catch (error) {
      console.error('Create product error:', error);
      message.error(error.response?.data?.message || error.message || 'Không thể tạo sản phẩm');
    } finally {
      setLoading(false);
    }
  };

  const selectedCategories = categories.filter(cat => formData.categories.includes(cat._id));
  const selectedCategoryLabel = selectedCategories.map(category => category.name).join(', ');
  const categoryPreviewLabel = selectedCategoryLabel;
  const formattedPrice = formData.price
    ? Number(formData.price).toLocaleString('vi-VN')
    : 'Chưa nhập';
  const locationPreview = [formData.location.ward, formData.location.district, formData.location.city]
    .filter(Boolean)
    .join(', ');
  const completedFieldCount = [
    formData.title.trim(),
    formData.description.trim(),
    formData.price,
    formData.categories.length > 0,
    formData.location.city,
    formData.location.district,
    imageFiles.length > 0
  ].filter(Boolean).length;
  const completionPercent = Math.round((completedFieldCount / 7) * 100);

  const toggleProfileLocation = () => {
    const next = !useProfileLocation;
    setUseProfileLocation(next);
    if (next && profileLocation) {
      setFormData(prev => ({ ...prev, location: profileLocation }));
    } else {
      setFormData(prev => ({ ...prev, location: { city: '', district: '', ward: '', provinceCode: null, districtCode: null, wardCode: null } }));
    }
  };

  return (
    <div className="create-product-container">
      <Flex justify="space-between" align="flex-start" wrap gap={16} className="create-product-header">
        <div className="create-product-header-copy">
          <Typography.Text strong className="create-product-eyebrow">Đăng bán sản phẩm</Typography.Text>
          <Typography.Title level={1}>Đăng tin mới</Typography.Title>
          <Typography.Paragraph type="secondary">Tạo một bài đăng rõ ràng, đẹp mắt để tăng độ tin cậy và giúp người mua ra quyết định nhanh hơn.</Typography.Paragraph>
        </div>
        <Flex gap={12} className="create-product-header-stats">
          <Card size="small"><Statistic title="Ảnh đã thêm" value={`${imageFiles.length}/5`} /></Card>
          <Card size="small"><Statistic title="Mức hoàn thiện" value={`${completionPercent}%`} /></Card>
        </Flex>
      </Flex>
      <Progress percent={completionPercent} showInfo={false} className="create-product-progress" aria-label="Mức hoàn thiện" />

      <Form layout="vertical" onFinish={handleSubmit} className="create-product-form" requiredMark>
        <div className="create-product-grid">
          <div className="create-product-main">
            <Card className="product-form-section" title={<Typography.Title level={2}>Hình ảnh sản phẩm</Typography.Title>}>
              <Typography.Paragraph type="secondary">Ảnh sáng rõ, nhiều góc chụp sẽ giúp tin đăng chuyên nghiệp và tăng độ tin cậy.</Typography.Paragraph>
              <ProductImagePicker
                images={imagePreviews.map((src, index) => ({ key: src, src, alt: `Preview ${index + 1}` }))}
                canAdd={imageFiles.length < 5}
                accept=".jpg,.jpeg,.png,image/jpeg,image/png"
                hint="1-5 ảnh, tối đa 5MB mỗi ảnh. Ưu tiên ảnh thật của sản phẩm."
                error={errors.images}
                onAdd={handleImageChange}
                onRemove={(_, index) => removeImage(index)}
              />
            </Card>

            <Card className="product-form-section" title={<Typography.Title level={2}>Thông tin cơ bản</Typography.Title>}>
              <Typography.Paragraph type="secondary">Trình bày rõ ràng để người mua hiểu nhanh tình trạng, giá bán và danh mục sản phẩm.</Typography.Paragraph>

              <Form.Item
                label="Tiêu đề"
                htmlFor="title"
                required
                validateStatus={errors.title ? 'error' : undefined}
                help={errors.title}
                extra="Tiêu đề càng cụ thể càng dễ tiếp cận đúng người mua."
              >
                <Input
                  id="title"
                  name="title"
                  value={formData.title}
                  onChange={handleChange}
                  placeholder="VD: iPhone 13 Pro Max 256GB, đầy đủ phụ kiện"
                  maxLength={100}
                  showCount
                />
              </Form.Item>

              <Form.Item
                label="Danh mục"
                required
                validateStatus={errors.categories ? 'error' : undefined}
                help={errors.categories}
                extra="Bạn có thể chọn nhiều danh mục để tăng khả năng tiếp cận người mua."
              >
                <Flex wrap gap={8} role="group" aria-label="Chọn nhiều danh mục">
                  {categories && categories.length > 0 ? (
                    categories.map(cat => {
                      const isSelected = formData.categories.includes(cat._id);
                      return (
                        <Button
                          key={cat._id}
                          shape="round"
                          type={isSelected ? 'primary' : 'default'}
                          aria-pressed={isSelected}
                          icon={isSelected ? <Check /> : <CategoryIcon slug={cat.slug} />}
                          onClick={() => handleCategoryToggle(cat._id)}
                        >
                          {cat.name}
                        </Button>
                      );
                    })
                  ) : (
                    <Typography.Text type="secondary">Đang tải danh mục...</Typography.Text>
                  )}
                </Flex>
              </Form.Item>

              <Form.Item label="Tình trạng" htmlFor="condition" required>
                <Select
                  id="condition"
                  value={formData.condition}
                  options={CONDITION_OPTIONS}
                  onChange={(value) => handleChange({ target: { name: 'condition', value } })}
                />
              </Form.Item>

              <Form.Item
                label="Giá bán (VNĐ)"
                htmlFor="price"
                required
                validateStatus={errors.price ? 'error' : undefined}
                help={errors.price}
                extra="Giá tối đa cho phép: 100.000.000 VND."
              >
                <Input
                  id="price"
                  name="price"
                  inputMode="numeric"
                  value={formData.price}
                  onChange={handleChange}
                  placeholder="VD: 25000000"
                  maxLength={MAX_PRICE_DIGITS}
                  suffix="VND"
                />
              </Form.Item>

              <Form.Item
                label="Mô tả chi tiết"
                htmlFor="description"
                required
                validateStatus={errors.description ? 'error' : undefined}
                help={errors.description}
              >
                <Input.TextArea
                  id="description"
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  placeholder="Mô tả rõ ngoại hình, phụ kiện đi kèm, thời gian sử dụng, lỗi nếu có và lý do bán..."
                  rows={7}
                />
              </Form.Item>
            </Card>

            <Card className="product-form-section" title={<Typography.Title level={2}>Địa chỉ đăng bán</Typography.Title>}>
              <Typography.Paragraph type="secondary">Thông tin địa điểm rõ ràng sẽ giúp người mua yên tâm hơn khi trao đổi và nhận hàng.</Typography.Paragraph>
              {profileLocation && (
                <Alert
                  className="create-product-profile-location"
                  type="info"
                  icon={<MapPin />}
                  showIcon
                  title={<>Mặc định từ hồ sơ: <strong>{[profileLocation.ward, profileLocation.district, profileLocation.city].filter(Boolean).join(', ')}</strong></>}
                  action={<Button size="small" onClick={toggleProfileLocation}>{useProfileLocation ? 'Tùy chỉnh' : 'Dùng hồ sơ'}</Button>}
                />
              )}
              {(!profileLocation || !useProfileLocation) && (
                <LocationSelector
                  value={formData.location}
                  onChange={handleLocationChange}
                  errors={{
                    city: errors['location.city'],
                    district: errors['location.district']
                  }}
                />
              )}
            </Card>
          </div>

          <aside className="create-product-sidebar">
            <Card className="product-sidebar-card" title={<Typography.Title level={3}>Tóm tắt tin đăng</Typography.Title>} extra={<Typography.Text type="secondary">Xem trước</Typography.Text>}>
              <div className="listing-preview-media">
                {imagePreviews[0] ? (
                  <img src={imagePreviews[0]} alt="Ảnh xem trước sản phẩm" />
                ) : (
                  <Typography.Text type="secondary">Chưa có ảnh</Typography.Text>
                )}
              </div>
              <Tag className="listing-preview-condition">{CONDITION_LABELS[formData.condition]}</Tag>
              <Typography.Title level={4} className="listing-preview-title">
                {formData.title.trim() || 'Tiêu đề tin đăng sẽ hiển thị tại đây'}
              </Typography.Title>
              <Typography.Text strong className="listing-preview-price">
                {formattedPrice === 'Chưa nhập' ? formattedPrice : `${formattedPrice} đ`}
              </Typography.Text>
              <Descriptions
                size="small"
                column={1}
                items={[
                  { key: 'category', label: 'Danh mục', children: categoryPreviewLabel || 'Chưa chọn' },
                  { key: 'area', label: 'Khu vực', children: locationPreview || 'Chưa cập nhật' },
                  { key: 'images', label: 'Số ảnh', children: `${imageFiles.length} ảnh` }
                ]}
              />
            </Card>

            <Card className="product-sidebar-card" title={<Typography.Title level={3}>Mẹo để tin đăng đẹp hơn</Typography.Title>} extra={<Typography.Text type="secondary">Gợi ý</Typography.Text>}>
              <ul className="tips-list">
                <li>Chụp đủ mặt trước, mặt sau, viền và phụ kiện đi kèm.</li>
                <li>Tiêu đề nên gồm tên sản phẩm, phiên bản và dung lượng nếu có.</li>
                <li>Mô tả trung thực tình trạng để giảm trao đổi qua lại không cần thiết.</li>
                <li>Đặt giá rõ ràng để tăng tỷ lệ được liên hệ đúng nhu cầu.</li>
              </ul>
            </Card>
          </aside>
        </div>

        <Flex justify="flex-end" gap={12} className="product-form-actions">
          <Button size="large" onClick={() => navigate(-1)} disabled={loading}>Hủy</Button>
          <Button type="primary" size="large" htmlType="submit" disabled={loading}>
            {loading ? 'Đang đăng...' : 'Đăng tin'}
          </Button>
        </Flex>
      </Form>
    </div>
  );
};

export default CreateProduct;
