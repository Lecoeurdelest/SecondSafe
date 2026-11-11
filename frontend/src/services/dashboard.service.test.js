import api from './api';
import dashboardService from './dashboard.service';

jest.mock('./api', () => ({
  __esModule: true,
  default: {
    get: jest.fn(),
    post: jest.fn(),
    put: jest.fn(),
    patch: jest.fn()
  }
}));

test('admin image upload returns the uploaded image URL list', async () => {
  const imageUrls = ['/uploads/products/admin/image.png'];
  api.post.mockResolvedValue({ data: { data: { imageUrls } } });

  await expect(dashboardService.uploadAdminProductImages([
    new File(['image'], 'image.png', { type: 'image/png' })
  ])).resolves.toEqual(imageUrls);

  expect(api.post).toHaveBeenCalledWith(
    '/upload/admin-product',
    expect.any(FormData),
    { headers: { 'Content-Type': 'multipart/form-data' } }
  );
});
