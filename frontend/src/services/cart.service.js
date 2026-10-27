import api from './api';

async function getCart(params = {}) {
  const response = await api.get('/cart', { params });
  return response.data.data;
}

async function addToCart(productId) {
  const response = await api.post('/cart', { productId });
  return response.data.data;
}

async function removeFromCart(productId) {
  const response = await api.delete(`/cart/${productId}`);
  return response.data.data;
}

const cartService = { getCart, addToCart, removeFromCart };

export default cartService;
