import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import productService from '../../services/product.service';
import api from '../../services/api';
import { getImageUrl, handleImageError } from '../../utils/imageHelper';
import ProductImagePicker from './ProductImagePicker';
import './CreateProduct.css';
import { App as AntApp, Button, Card, Flex, Form, Input, Select, Spin, Typography } from 'antd';

const CONDITION_OPTIONS = [
  { value: 'new', label: 'Mới' },
  { value: 'like-new', label: 'Như mới' },
  { value: 'good', label: 'Tốt' },
  { value: 'fair', label: 'Khá' },
  { value: 'poor', label: 'Cũ' }
];

const EditProduct = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { message } = AntApp.useApp();

  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [fetchingProduct, setFetchingProduct] = useState(true);
  const [errors, setErrors] = useState({});

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    price: '',
    category: '',
    condition: 'like-new',
    images: [],
    location: {
      city: '',
      district: '',
      ward: ''
    }
  });

  const [existingImages, setExistingImages] = useState([]);
  const [newImageFiles, setNewImageFiles] = useState([]);
  const [newImagePreviews, setNewImagePreviews] = useState([]);

  const fetchCategories = useCallback(async () => {
    try {
      const response = await api.get('/categories');
      setCategories(response.data.data || []);
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  }, []);

  const fetchProduct = useCallback(async () => {
    if (!user) {
      return;
    }

    try {
      setFetchingProduct(true);
      const product = await productService.getProductById(id);
      
      // Kiem tra quyen so huu
      const sellerId = String(product?.seller?._id || product?.seller || '');
      const currentUserId = String(user?._id || user?.id || user?.userId || '');
      if (!sellerId || !currentUserId || sellerId !== currentUserId) {
        message.error('Bạn không có quyền chỉnh sửa sản phẩm này');
        navigate('/');
        return;
      }

      setFormData({
        title: product.title,
        description: product.description,
        price: product.price,
        category: product.category?._id || product.category || '',
        condition: product.condition,
        images: product.images || [],
        location: product.location || { city: '', district: '', ward: '' }
      });
      
      setExistingImages(Array.isArray(product.images) ? product.images : []);
    } catch (error) {
      message.error('Không thể tải thông tin sản phẩm');
      navigate('/');
    } finally {
      setFetchingProduct(false);
    }
  }, [id, message, navigate, user]);

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }
    fetchCategories();
    fetchProduct();
  }, [fetchCategories, fetchProduct, navigate, user]);

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
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }

    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const handleNewImageChange = (e) => {
    const files = Array.from(e.target.files);
    
    const totalImages = existingImages.length + newImageFiles.length + files.length;
    if (totalImages > 5) {
      setErrors(prev => ({ ...prev, images: 'Bạn chỉ có thể có tối đa 5 ảnh' }));
      return;
    }

    const invalidFiles = files.filter(file => file.size > 5 * 1024 * 1024);
    if (invalidFiles.length > 0) {
      setErrors(prev => ({ ...prev, images: 'Mỗi ảnh không được vượt quá 5MB' }));
      return;
    }

    setErrors(prev => ({ ...prev, images: '' }));
    const newPreviews = files.map(file => URL.createObjectURL(file));
    
    setNewImageFiles(prev => [...prev, ...files]);
    setNewImagePreviews(prev => [...prev, ...newPreviews]);
  };

  const removeExistingImage = (index) => {
    setExistingImages(prev => prev.filter((_, i) => i !== index));
  };

  const removeNewImage = (index) => {
    setNewImageFiles(prev => prev.filter((_, i) => i !== index));
    setNewImagePreviews(prev => {
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

    const totalImages = existingImages.length + newImageFiles.length;
    if (totalImages === 0) {
      newErrors.images = 'Vui lòng có ít nhất 1 ảnh';
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

  const uploadNewImages = async () => {
    if (newImageFiles.length === 0) {
      return [];
    }

    const formData = new FormData();
    newImageFiles.forEach(file => {
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
      // Upload anh moi
      const newImageUrls = await uploadNewImages();

      // Gop anh cu va anh moi
      const allImages = [...existingImages, ...newImageUrls];

      // Cap nhat san pham
      const updateData = {
        title: formData.title,
        description: formData.description,
        price: parseFloat(formData.price),
        condition: formData.condition,
        images: allImages,
        location: formData.location
      };

      await productService.updateProduct(id, updateData);
      
      message.success('Sản phẩm đã được cập nhật thành công!');
      navigate(`/product/${id}`);
    } catch (error) {
      message.error(error.response?.data?.message || error.message || 'Không thể cập nhật sản phẩm');
    } finally {
      setLoading(false);
    }
  };

  if (fetchingProduct) {
    return (
      <div className="create-product-container">
        <Flex justify="center" gap={12} className="create-product-loading" role="status">
          <Spin />
          <Typography.Text type="secondary">Đang tải...</Typography.Text>
        </Flex>
      </div>
    );
  }

  const pictureTiles = [
    ...existingImages.map((image, index) => ({
      key: `existing-${image}-${index}`,
      src: getImageUrl(image) || '/images/placeholders/product-placeholder.svg',
      alt: `Existing ${index + 1}`,
      onError: (event) => handleImageError(event, 'product'),
      existing: true,
      index
    })),
    ...newImagePreviews.map((src, index) => ({ key: `new-${src}`, src, alt: `New ${index + 1}`, existing: false, index }))
  ];

  return (
    <div className="create-product-container">
      <div className="create-product-header">
        <div className="create-product-header-copy">
          <Typography.Title level={1}>Chỉnh sửa tin đăng</Typography.Title>
          <Typography.Paragraph type="secondary">Cập nhật thông tin sản phẩm của bạn</Typography.Paragraph>
        </div>
      </div>

      <Form layout="vertical" onFinish={handleSubmit} className="create-product-form" requiredMark>
        <Card className="product-form-section" title={<Typography.Title level={2}>Hình ảnh sản phẩm</Typography.Title>}>
          <ProductImagePicker
            images={pictureTiles}
            canAdd={(existingImages.length + newImageFiles.length) < 5}
            accept="image/*"
            hint="Tối đa 5 ảnh (tối đa 5MB mỗi ảnh)"
            error={errors.images}
            onAdd={handleNewImageChange}
            onRemove={(image) => (image.existing ? removeExistingImage(image.index) : removeNewImage(image.index))}
          />
        </Card>

        <Card className="product-form-section" title={<Typography.Title level={2}>Thông tin cơ bản</Typography.Title>}>
          <Form.Item
            label="Tiêu đề"
            htmlFor="title"
            required
            validateStatus={errors.title ? 'error' : undefined}
            help={errors.title}
          >
            <Input id="title" name="title" value={formData.title} onChange={handleChange} maxLength={100} showCount />
          </Form.Item>

          <Form.Item label="Danh mục" htmlFor="category" extra="Không thể thay đổi danh mục">
            <Select
              id="category"
              disabled
              placeholder="Chọn danh mục"
              value={formData.category || undefined}
              options={categories.map(cat => ({ value: cat._id, label: cat.name }))}
            />
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
            label="Giá (VNĐ)"
            htmlFor="price"
            required
            validateStatus={errors.price ? 'error' : undefined}
            help={errors.price}
          >
            <Input id="price" name="price" type="number" min="0" value={formData.price} onChange={handleChange} suffix="VND" />
          </Form.Item>

          <Form.Item
            label="Mô tả chi tiết"
            htmlFor="description"
            required
            validateStatus={errors.description ? 'error' : undefined}
            help={errors.description}
          >
            <Input.TextArea id="description" name="description" value={formData.description} onChange={handleChange} rows={6} />
          </Form.Item>
        </Card>

        <Card className="product-form-section" title={<Typography.Title level={2}>Địa chỉ</Typography.Title>}>
          <Form.Item
            label="Thành phố"
            htmlFor="city"
            required
            validateStatus={errors['location.city'] ? 'error' : undefined}
            help={errors['location.city']}
          >
            <Input id="city" name="location.city" value={formData.location.city} onChange={handleChange} />
          </Form.Item>

          <Form.Item
            label="Quận/Huyện"
            htmlFor="district"
            required
            validateStatus={errors['location.district'] ? 'error' : undefined}
            help={errors['location.district']}
          >
            <Input id="district" name="location.district" value={formData.location.district} onChange={handleChange} />
          </Form.Item>

          <Form.Item label="Phường/Xã" htmlFor="ward">
            <Input id="ward" name="location.ward" value={formData.location.ward} onChange={handleChange} />
          </Form.Item>
        </Card>

        <Flex justify="flex-end" gap={12} className="product-form-actions">
          <Button size="large" onClick={() => navigate(`/product/${id}`)} disabled={loading}>Hủy</Button>
          <Button type="primary" size="large" htmlType="submit" disabled={loading}>
            {loading ? 'Đang cập nhật...' : 'Cập nhật'}
          </Button>
        </Flex>
      </Form>
    </div>
  );
};

export default EditProduct;
