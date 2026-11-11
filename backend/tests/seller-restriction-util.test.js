const {
  getSellingRestrictionMessage,
  refreshSellingRestriction
} = require('../src/common/utils/seller-restriction.util');

test('unrestricted sellers do not trigger a write', async () => {
  const save = jest.fn();
  expect(await refreshSellingRestriction({ isSellingRestricted: false, save })).toBe(false);
  expect(save).not.toHaveBeenCalled();
});

test('an active restriction remains enforced', async () => {
  const user = {
    isSellingRestricted: true,
    sellingRestrictedUntil: new Date(Date.now() + 60_000),
    save: jest.fn()
  };
  expect(await refreshSellingRestriction(user)).toBe(true);
  expect(user.save).not.toHaveBeenCalled();
  expect(getSellingRestrictionMessage({ sellingRestrictedReason: 'Lạm dụng tin đăng' }))
    .toContain('Lạm dụng tin đăng');
});

test('expired restrictions are cleared and persisted once', async () => {
  const user = {
    isSellingRestricted: true,
    sellingRestrictedUntil: new Date(Date.now() - 60_000),
    sellingRestrictedReason: 'Đã hết hạn',
    sellingRestrictionSource: 'moderation',
    save: jest.fn().mockResolvedValue(undefined)
  };
  expect(await refreshSellingRestriction(user)).toBe(false);
  expect(user.isSellingRestricted).toBe(false);
  expect(user.sellingRestrictedUntil).toBeUndefined();
  expect(user.sellingRestrictedReason).toBeUndefined();
  expect(user.sellingRestrictionSource).toBeUndefined();
  expect(user.save).toHaveBeenCalledTimes(1);
});
