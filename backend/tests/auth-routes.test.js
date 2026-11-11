const authRouter = require('../src/modules/auth/auth.route');
const userRouter = require('../src/modules/users/user.route');
const { authenticate } = require('../src/common/middlewares/auth.middleware');
const { changePassword } = require('../src/modules/auth/auth.controller');

function postHandlers(router, path) {
  const layer = router.stack.find(entry => entry.route?.path === path && entry.route.methods.post);
  return layer?.route.stack.map(handler => handler.handle);
}

test('both authenticated password-change routes use the same guard and handler', () => {
  expect(postHandlers(authRouter, '/change-password')).toEqual([authenticate, changePassword]);
  expect(postHandlers(userRouter, '/change-password')).toEqual([authenticate, changePassword]);
});
