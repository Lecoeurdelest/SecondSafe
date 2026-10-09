import { createApiClient } from './api';
import { makeNetworkConfig } from './network.config';

function fixture(status, data, url = '/products') {
  const storage = { getItem: jest.fn(() => 'session-token'), removeItem: jest.fn() };
  const onUnauthorized = jest.fn();
  const adapter = jest.fn(config => status >= 400
    ? Promise.reject({ config, response: { status, data } })
    : Promise.resolve({ config, status, data }));
  return { client: createApiClient({ storage, onUnauthorized, adapter }), storage, onUnauthorized, adapter, url };
}

test('network configuration normalizes trailing slashes and supports a separate socket origin', () => {
  expect(makeNetworkConfig('https://api.example///', 'https://socket.example/')).toEqual({
    API_ORIGIN: 'https://api.example', API_BASE_URL: 'https://api.example/api', SOCKET_URL: 'https://socket.example'
  });
});

test('requests attach the latest stored token and have a bounded timeout', async () => {
  const { client, adapter } = fixture(200, { success: true });
  await client.get('/products');
  expect(adapter.mock.calls[0][0].headers.Authorization).toBe('Bearer session-token');
  expect(adapter.mock.calls[0][0].timeout).toBe(15000);
});

test('an expired protected request clears the token and updates the session without a forced page reload', async () => {
  const { client, storage, onUnauthorized } = fixture(401, { message: 'Token đã hết hạn' });
  await expect(client.get('/products')).rejects.toMatchObject({ message: 'Token đã hết hạn', status: 401 });
  expect(storage.removeItem).toHaveBeenCalledWith('token');
  expect(onUnauthorized).toHaveBeenCalledTimes(1);
});

test('invalid public authentication input remains available to its form', async () => {
  const { client, storage, onUnauthorized } = fixture(401, { message: 'Thông tin đăng nhập không hợp lệ' });
  await expect(client.post('/auth/login', {})).rejects.toThrow('Thông tin đăng nhập không hợp lệ');
  expect(storage.removeItem).not.toHaveBeenCalled();
  expect(onUnauthorized).not.toHaveBeenCalled();
});

test('private browser storage failure still allows public requests', async () => {
  const storage = { getItem() { throw new Error('storage disabled'); } };
  const client = createApiClient({ storage, adapter: config => Promise.resolve({ status: 200, data: {}, config }) });
  await expect(client.get('/products')).resolves.toMatchObject({ status: 200 });
});

test('network and SMTP failures use Vietnamese messages', async () => {
  const client = createApiClient({ adapter: () => Promise.reject({ request: {}, code: 'ECONNABORTED' }) });
  await expect(client.get('/products')).rejects.toMatchObject({ message: 'Không thể kết nối đến máy chủ. Vui lòng thử lại.', code: 'ECONNABORTED' });
  const smtp = fixture(503, { message: '535 5.7.3 Authentication unsuccessful' });
  await expect(smtp.client.post('/auth/register/request-otp')).rejects.toThrow('Không thể gửi email xác thực lúc này. Vui lòng thử lại sau.');
});
