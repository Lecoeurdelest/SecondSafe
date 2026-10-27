jest.mock('../src/modules/products/product.model', () => ({ find: jest.fn() }));
jest.mock('../src/modules/reports/report.model', () => ({ findById: jest.fn() }));
jest.mock('../src/modules/products/product-availability.service', () => ({
  getEligibleSellerIds: jest.fn()
}));
jest.mock('../src/modules/assistant/gemini.service', () => ({ generateText: jest.fn() }));

const Product = require('../src/modules/products/product.model');
const Report = require('../src/modules/reports/report.model');
const { getEligibleSellerIds } = require('../src/modules/products/product-availability.service');
const gemini = require('../src/modules/assistant/gemini.service');
const { ask, getModerationGuidance } = require('../src/modules/assistant/assistant.service');

const REPORT_ID = '507f1f77bcf86cd799439011';

function productQuery(products) {
  const query = {
    select: jest.fn(() => query),
    populate: jest.fn(() => query),
    sort: jest.fn(() => query),
    limit: jest.fn(() => query),
    lean: jest.fn().mockResolvedValue(products)
  };
  return query;
}

beforeEach(() => {
  jest.clearAllMocks();
  gemini.generateText.mockResolvedValue('Câu trả lời tham khảo.');
  getEligibleSellerIds.mockResolvedValue(['507f1f77bcf86cd799439012']);
});

test('FAQ sends only a fixed topic to Gemini, not the customer question or identifying details', async () => {
  const privateQuestion = 'Tôi cần hỗ trợ, nhà ở 12 Nguyễn Trãi, email person@example.test, số 0912345678.';
  await ask({ message: privateQuestion, mode: 'faq' });

  const providerPrompt = gemini.generateText.mock.calls[0][0];
  expect(providerPrompt).toContain('Chủ đề câu hỏi: messaging_support');
  expect(providerPrompt).not.toContain(privateQuestion);
  expect(providerPrompt).not.toContain('person@example.test');
  expect(providerPrompt).not.toContain('Nguyễn Trãi');
  expect(providerPrompt).not.toContain('0912345678');
});

test('product advice sends only non-identifying public attributes to Gemini', async () => {
  const privateQuestion = 'Tìm sách, địa chỉ nhà 12 Nguyễn Trãi, email person@example.test.';
  Product.find.mockReturnValue(productQuery([{
    _id: REPORT_ID,
    title: 'Sách tại nhà 12 Nguyễn Trãi',
    description: 'Liên hệ person@example.test',
    price: 50000,
    condition: 'good',
    images: [],
    location: { district: 'Ba Đình', city: 'Hà Nội' },
    category: { name: 'Sách' }
  }]));

  const result = await ask({ message: privateQuestion, mode: 'products' });

  expect(Product.find).toHaveBeenCalledWith(expect.objectContaining({
    status: 'active',
    $text: { $search: expect.stringContaining('Tìm sách') }
  }));
  const providerPrompt = gemini.generateText.mock.calls[0][0];
  expect(providerPrompt).toContain('"category":"Sách"');
  expect(providerPrompt).toContain('"priceVnd":50000');
  expect(providerPrompt).not.toContain('12 Nguyễn Trãi');
  expect(providerPrompt).not.toContain('person@example.test');
  expect(providerPrompt).not.toContain('Ba Đình');
  expect(result.products).toHaveLength(1);
});

test('moderation guidance sends only report classification metadata to Gemini', async () => {
  const query = {
    select: jest.fn(() => query),
    lean: jest.fn().mockResolvedValue({
      reportType: 'product',
      reason: 'counterfeit',
      status: 'pending',
      description: 'Customer name and private address',
      evidence: ['private image reference']
    })
  };
  Report.findById.mockReturnValue(query);

  const result = await getModerationGuidance(REPORT_ID);

  expect(query.select).toHaveBeenCalledWith('reportType reason status');
  const providerPrompt = gemini.generateText.mock.calls[0][0];
  expect(providerPrompt).toContain('Loại đối tượng: product. Lý do: counterfeit. Trạng thái: pending.');
  expect(providerPrompt).not.toContain('Customer name');
  expect(providerPrompt).not.toContain('private address');
  expect(providerPrompt).not.toContain('private image reference');
  expect(result.humanDecisionRequired).toBe(true);
});
