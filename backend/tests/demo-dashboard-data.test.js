const { EXPORT_FILES, summarizeExports } = require('../src/common/utils/demo-dashboard-data.util');
const { demoDatabaseName, validateDemoUri } = require('../import-demo-dashboard-data');

function fixture() {
  const data = Object.fromEntries(EXPORT_FILES.map(name => [name, []]));
  data.categories = [{ _id: 'category-a', name: 'Sách' }];
  data.users = [
    { email: 'private@example.test', passwordHash: '$2b$secret', role: 'admin', status: 'active' },
    { role: 'user', status: 'active' }
  ];
  data.products = [
    { categoryId: 'category-a', status: 'available' },
    { categoryId: 'category-a', status: 'sold' }
  ];
  data.orders = [
    { createdAt: { $date: '2026-10-01T10:00:00Z' }, status: 'completed', totalAmount: 125000 },
    { createdAt: { $date: 1790935200000 }, status: 'paid', totalAmount: 50000 }
  ];
  data.purchaserequests = [{ status: 'pending' }];
  data.disputes = [{ status: 'under_review' }];
  data.transactions = [
    { type: 'fee', status: 'success', amount: 5000 },
    { type: 'deposit', status: 'success', amount: 20000 }
  ];
  data.wallets = [{ balance: 100000 }];
  data.reviews = [{ rating: 5 }, { rating: 3 }];
  data.deliveries = [{ status: 'in_transit' }];
  return data;
}

test('demo dashboard import stores only aggregate data and expected counts', () => {
  const snapshot = summarizeExports(fixture(), new Date('2026-10-27T00:00:00Z'));

  expect(snapshot.users).toEqual({
    total: 2,
    byRole: { admin: 1, user: 1 },
    byStatus: { active: 2 }
  });
  expect(snapshot.products.byCategory).toEqual([{ category: 'Sách', count: 2 }]);
  expect(snapshot.orders).toMatchObject({
    total: 2,
    byStatus: { completed: 1, paid: 1 },
    valueVnd: 175000,
    monthly: [{ month: '2026-10', count: 2 }]
  });
  expect(snapshot.transactions.feeRevenueVnd).toBe(5000);
  expect(snapshot.wallets.balanceVnd).toBe(100000);
  expect(snapshot.reviews.averageRating).toBe(4);
  expect(JSON.stringify(snapshot)).not.toContain('private@example.test');
  expect(JSON.stringify(snapshot)).not.toContain('passwordHash');
});

test('import requires all sixteen exports and rejects malformed records', () => {
  const data = fixture();
  delete data.messages;
  expect(() => summarizeExports(data)).toThrow('messages.json');
  const malformed = fixture();
  malformed.transactions = [{ type: 'fee', status: 'success', amount: 1.5 }];
  expect(() => summarizeExports(malformed)).toThrow('non-negative integer');
});

test('demo import target must use a separate database explicitly named demo', () => {
  expect(demoDatabaseName('mongodb://localhost:27017/secondsafe_demo')).toBe('secondsafe_demo');
  expect(() => validateDemoUri('mongodb://localhost:27017/secondsafe')).toThrow('ends with _demo or -demo');
  expect(() => validateDemoUri('mongodb://localhost:27017/secondsafe_demo')).not.toThrow();
});
