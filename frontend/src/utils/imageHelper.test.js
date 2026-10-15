import { getImageUrl, getProductImageUrl } from './imageHelper';

test('uses local category sample photos instead of the generic seed placeholder', () => {
  expect(getProductImageUrl({
    images: ['/images/placeholders/product-placeholder.svg'],
    category: { slug: 'books' }
  })).toBe('/images/products/books.jpg');
  expect(getProductImageUrl({
    images: [],
    category: { slug: 'toys' }
  })).toBe('/images/products/toys.svg');
});

test('keeps uploaded images and falls back for unknown categories', () => {
  expect(getProductImageUrl({
    images: ['/uploads/products/book.jpg'],
    category: { slug: 'books' }
  })).toBe('http://localhost:5000/uploads/products/book.jpg');
  expect(getProductImageUrl({
    images: ['/images/custom-product.jpg'],
    category: { slug: 'books' }
  })).toBe('/images/custom-product.jpg');
  expect(getProductImageUrl({
    images: ['/images/placeholders/product-placeholder.svg'],
    category: { slug: 'unknown' }
  })).toBe('/images/placeholders/product-placeholder.svg');
});

test('uses the appropriate placeholder for missing images', () => {
  expect(getImageUrl(null, 'avatar')).toBe('/images/placeholders/avatar-placeholder.svg');
  expect(getImageUrl(null)).toBe('/images/placeholders/product-placeholder.svg');
});
