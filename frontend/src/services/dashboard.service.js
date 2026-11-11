import api from './api';

async function getData(request) {
  const response = await request;
  return response.data.data;
}

const dashboardService = {
  getAdminDashboard: () => getData(api.get('/users/admin/dashboard')),
  getStaffDashboard: () => getData(api.get('/moderator/dashboard')),
  getAdminProducts: params => getData(api.get('/products/admin', { params })),
  getAdminProductCategories: () => getData(api.get('/categories')),
  updateAdminProduct: (productId, payload) => getData(api.put(`/products/admin/${productId}`, payload)),
  uploadAdminProductImages: async files => {
    const formData = new FormData();
    files.forEach(file => formData.append('images', file));
    const result = await getData(api.post('/upload/admin-product', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    }));
    return result.imageUrls;
  },
  updateAdminProductVisibility: (productId, status) =>
    getData(api.patch(`/products/admin/${productId}/status`, { status }))
};

export default dashboardService;
