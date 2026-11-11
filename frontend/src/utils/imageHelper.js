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
  const source = image.trim();
  if (/^(data:|blob:)/i.test(source)) return source;
  if (/^(https?:)?\/\//i.test(source)) {
    try {
      const url = new URL(source, NETWORK_CONFIG.API_ORIGIN);
      if (['localhost', '127.0.0.1', '0.0.0.0'].includes(url.hostname) && url.pathname.startsWith('/uploads/')) {
        return `${NETWORK_CONFIG.API_ORIGIN}${url.pathname}${url.search}${url.hash}`;
      }
    } catch {
      return source;
    }
    return source;
  }
  if (source.startsWith('/images/')) return source;
  return `${NETWORK_CONFIG.API_ORIGIN}/${source.replace(/^\/+/, '')}`;
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
