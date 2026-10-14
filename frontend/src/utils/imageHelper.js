import { NETWORK_CONFIG } from '../services/network.config';

const PRODUCT_PLACEHOLDER = '/images/placeholders/product-placeholder.svg';
const AVATAR_PLACEHOLDER = '/images/placeholders/avatar-placeholder.svg';
const CATEGORY_IMAGES = {
  books: '/images/products/books.jpg',
  fashion: '/images/products/fashion.jpg',
  electronics: '/images/products/electronics.jpg',
  home: '/images/products/home.jpg',
  beauty: '/images/products/beauty.jpg',
  sports: '/images/products/sports.jpg',
  toys: '/images/products/toys.svg',
  pets: '/images/products/pets.jpg'
};

export function getImageUrl(image, type = 'product') {
  if (typeof image !== 'string' || !image.trim()) {
    return type === 'avatar' ? AVATAR_PLACEHOLDER : PRODUCT_PLACEHOLDER;
  }
  if (/^(https?:|data:)/i.test(image)) return image;
  if (image.startsWith('/images/')) return image;
  return `${NETWORK_CONFIG.API_ORIGIN}/${image.replace(/^\/+/, '')}`;
}

export function getProductImageUrl(product) {
  const productImages = Array.isArray(product?.images) ? product.images : [];
  const actualImage = productImages.find(image => (
    typeof image === 'string'
    && image.trim()
    && !image.endsWith('/placeholders/product-placeholder.svg')
  ));
  if (actualImage) return getImageUrl(actualImage, 'product');

  const categorySlug = typeof product?.category === 'string'
    ? product.category
    : product?.category?.slug;
  return CATEGORY_IMAGES[categorySlug] || PRODUCT_PLACEHOLDER;
}

export function handleImageError(event, type = 'product') {
  const image = event.currentTarget;
  if (image.dataset.fallbackApplied === 'true') return;
  image.dataset.fallbackApplied = 'true';
  image.src = type === 'avatar' ? AVATAR_PLACEHOLDER : PRODUCT_PLACEHOLDER;
}
