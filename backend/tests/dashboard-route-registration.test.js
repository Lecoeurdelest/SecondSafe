const expressApp = require('../src/app');
const request = require('supertest');

test.each(['/api/users/admin/dashboard', '/api/moderator/dashboard'])('%s is mounted and requires authentication', async route => {
  const response = await request(expressApp).get(route);
  expect(response.status).toBe(401);
});
