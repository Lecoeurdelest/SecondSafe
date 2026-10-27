/**
 * Tiện ích xử lý ảnh
 * Xử lý URL ảnh, placeholder, và fallback
 */

import { NETWORK_CONFIG } from '../services/network.config';

const API_URL = NETWORK_CONFIG.API_ORIGIN;
const PRODUCT_PLACEHOLDER = '/images/placeholders/product-placeholder.svg';
const AVATAR_PLACEHOLDER = '/images/placeholders/avatar-placeholder.svg';
const CATEGORY_IMAGES = {
  books: '/images/products/books.jpg', fashion: '/images/products/fashion.jpg',
  electronics: '/images/products/electronics.jpg', home: '/images/products/home.jpg',
  beauty: '/images/products/beauty.jpg', sports: '/images/products/sports.jpg',
  toys: '/images/products/toys.svg', pets: '/images/products/pets.jpg'
};

/**
 * Lấy URL đầy đủ cho ảnh đã upload
 * @param {string} path - Đường dẫn tương đối từ backend (ví dụ: "/uploads/products/123/image.jpg")
 * @returns {string} URL đầy đủ
 */
export const getImageUrl = (path, type = 'product') => {
  const fallback = type === 'avatar' ? AVATAR_PLACEHOLDER : PRODUCT_PLACEHOLDER;
  if (!path) return fallback;

  // Ho tro du lieu anh dang object, vi du { url: '/uploads/...' }.
  const rawPath = typeof path === 'string'
    ? path
    : (path.url || path.path || path.src || '');
  if (!rawPath) return fallback;

  const normalizedRawPath = String(rawPath).trim().replace(/\\/g, '/');
  if (!normalizedRawPath) return fallback;

  // Giữ nguyên data/blob URL để hiển thị preview ảnh cục bộ.
  if (normalizedRawPath.startsWith('data:') || normalizedRawPath.startsWith('blob:')) {
    return normalizedRawPath;
  }
  
  // Nếu đã là URL đầy đủ thì trả về luôn.
  if (normalizedRawPath.startsWith('http://') || normalizedRawPath.startsWith('https://')) {
    return normalizedRawPath;
  }

  const normalizedPath = normalizedRawPath.startsWith('/') ? normalizedRawPath : `/${normalizedRawPath}`;
  if (normalizedPath.startsWith('/images/')) return encodeURI(normalizedPath);
  
  // Ghép với API URL để tạo đường dẫn ảnh hoàn chỉnh.
  return `${API_URL}${encodeURI(normalizedPath)}`;
};

/**
 * Lấy URL ảnh sản phẩm kèm fallback
 * @param {object} product - Đối tượng sản phẩm
 * @param {number} index - Vị trí ảnh (mặc định: 0)
 * @returns {string} URL ảnh hoặc ảnh placeholder
 */
export const getProductImageUrl = (product, index = 0) => {
  const images = Array.isArray(product?.images) ? product.images.slice(index) : [];
  const image = images.find(item => {
    const value = typeof item === 'string' ? item : item?.url || item?.path || item?.src;
    return typeof value === 'string' && value.trim() && !value.endsWith('/placeholders/product-placeholder.svg');
  });
  if (image) return getImageUrl(image);
  const category = typeof product?.category === 'string' ? product.category : product?.category?.slug;
  return CATEGORY_IMAGES[category] || PRODUCT_PLACEHOLDER;
};

/**
 * Lấy URL avatar người dùng kèm fallback
 * @param {object} user - Đối tượng người dùng
 * @returns {string} URL avatar hoặc ảnh placeholder
 */
export const getUserAvatarUrl = (user) => {
  const avatarSource =
    user?.avatar ||
    user?.profile?.avatar ||
    user?.photoURL ||
    user?.photoUrl ||
    user?.picture ||
    user?.user?.avatar;

  if (avatarSource) {
    return getImageUrl(avatarSource, 'avatar');
  }

  return '/images/placeholders/avatar-placeholder.svg';
};

/**
 * Lấy URL icon danh mục
 * @param {string} categorySlug - Slug danh mục
 * @returns {string} URL icon
 */
export const getCategoryIconUrl = (categorySlug) => {
  return `/images/icons/category-${categorySlug}.png`;
};

/**
 * Xử lý lỗi tải ảnh và gán ảnh placeholder
 * @param {Event} e - Sự kiện lỗi
 * @param {string} type - Loại placeholder ('product', 'avatar', 'category')
 */
export const handleImageError = (e, type = 'product') => {
  const placeholders = {
    product: '/images/placeholders/product-placeholder.svg',
    avatar: '/images/placeholders/avatar-placeholder.svg',
    category: '/images/placeholders/product-placeholder.svg',
  };
  
  e.target.src = placeholders[type] || placeholders.product;
  e.target.onerror = null; // Tránh lặp vô hạn khi ảnh fallback cũng lỗi.
};

/**
 * Kiểm tra file ảnh trước khi upload
 * @param {File} file - Đối tượng file
 * @param {object} options - Tùy chọn kiểm tra
 * @returns {object} { valid: boolean, error: string }
 */
export const validateImageFile = (file, options = {}) => {
  const {
    maxSize = 5 * 1024 * 1024, // Mặc định giới hạn 5MB.
    allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif'],
  } = options;

  // Kiểm tra đã chọn file hay chưa.
  if (!file) {
    return { valid: false, error: 'Vui lòng chọn file' };
  }

  // Kiểm tra kích thước file.
  if (file.size > maxSize) {
    const maxSizeMB = (maxSize / (1024 * 1024)).toFixed(1);
    return { valid: false, error: `Kích thước file không được vượt quá ${maxSizeMB}MB` };
  }

  // Kiểm tra định dạng file.
  if (!allowedTypes.includes(file.type)) {
    return { valid: false, error: 'Chỉ chấp nhận file ảnh (JPG, PNG, GIF)' };
  }

  return { valid: true, error: null };
};

/**
 * Tạo URL preview ảnh
 * @param {File} file - Đối tượng file
 * @returns {string} Object URL dùng để preview
 */
export const createImagePreview = (file) => {
  return URL.createObjectURL(file);
};

/**
 * Thu hồi URL preview để giải phóng bộ nhớ
 * @param {string} url - Object URL
 */
export const revokeImagePreview = (url) => {
  if (url && url.startsWith('blob:')) {
    URL.revokeObjectURL(url);
  }
};

/**
 * Nén ảnh trước khi upload (phía client)
 * @param {File} file - File ảnh
 * @param {object} options - Tùy chọn nén
 * @returns {Promise<Blob>} Blob ảnh sau khi nén
 */
export const compressImage = async (file, options = {}) => {
  const {
    maxWidth = 1200,
    maxHeight = 1200,
    quality = 0.8,
  } = options;

  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      const img = new Image();
      
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;

        // Tính kích thước mới theo giới hạn maxWidth/maxHeight.
        if (width > height) {
          if (width > maxWidth) {
            height *= maxWidth / width;
            width = maxWidth;
          }
        } else {
          if (height > maxHeight) {
            width *= maxHeight / height;
            height = maxHeight;
          }
        }

        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);

        canvas.toBlob(
          (blob) => {
            resolve(blob);
          },
          file.type,
          quality
        );
      };

      img.onerror = reject;
      img.src = e.target.result;
    };

    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
};

/**
 * Định dạng kích thước file để hiển thị
 * @param {number} bytes - Kích thước file (byte)
 * @returns {string} Chuỗi kích thước đã định dạng (ví dụ: "2.5 MB")
 */
export const formatFileSize = (bytes) => {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
};

const imageHelper = {
  getImageUrl,
  getProductImageUrl,
  getUserAvatarUrl,
  getCategoryIconUrl,
  handleImageError,
  validateImageFile,
  createImagePreview,
  revokeImagePreview,
  compressImage,
  formatFileSize,
};

export default imageHelper;
