jest.mock('../src/modules/products/product.model', () => ({ find: jest.fn() }));
jest.mock('../src/modules/reports/report.model', () => ({ findById: jest.fn() }));
jest.mock('../src/modules/products/product-availability.service', () => ({
  getEligibleSellerIds: jest.fn()
}));
jest.mock('../src/modules/assistant/gemini.service', () => ({
  generateText: jest.fn(),
  generateChat: jest.fn()
}));
jest.mock('../src/common/utils/logger.util', () => ({ warn: jest.fn() }));

const Product = require('../src/modules/products/product.model');
const { getEligibleSellerIds } = require('../src/modules/products/product-availability.service');
const gemini = require('../src/modules/assistant/gemini.service');
const { chat, sanitizeMessages } = require('../src/modules/assistant/assistant-chat.service');

const SELLER_ID = '507f1f77bcf86cd799439012';
const PRODUCT_ID = '507f1f77bcf86cd799439011';

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

const backpack = {
  _id: PRODUCT_ID,
  title: 'Balo đi học, gọi 0912345678',
  description: 'Còn mới, liên hệ person@example.test',
  price: 250000,
  condition: 'good',
  images: ['/uploads/balo.jpg'],
  location: { district: 'Ba Đình', city: 'Hà Nội' },
  category: { name: 'Túi xách' }
};

const textReply = text => ({ role: 'model', parts: [{ text }] });
const toolCall = args => ({ role: 'model', parts: [{ functionCall: { name: 'search_products', args } }] });

beforeEach(() => {
  jest.clearAllMocks();
  delete process.env.ASSISTANT_LLM_SEES_MESSAGES;
  getEligibleSellerIds.mockResolvedValue([SELLER_ID]);
  gemini.generateText.mockResolvedValue('Câu trả lời theo chủ đề.');
  gemini.generateChat.mockResolvedValue(textReply('Xin chào, mình giúp được gì cho bạn?'));
});

describe('sanitizeMessages', () => {
  test('rejects missing, empty and malformed input', () => {
    expect(() => sanitizeMessages(undefined)).toThrow('Vui lòng nhập câu hỏi.');
    expect(() => sanitizeMessages([])).toThrow('Vui lòng nhập câu hỏi.');
    expect(() => sanitizeMessages([{ role: 'system', content: 'x' }])).toThrow('Vai trò tin nhắn không hợp lệ.');
    expect(() => sanitizeMessages([{ role: 'user', content: 42 }])).toThrow('Tin nhắn không hợp lệ.');
    expect(() => sanitizeMessages([{ role: 'user', content: 'a'.repeat(601) }])).toThrow('không được vượt quá 600');
    expect(() => sanitizeMessages([{ role: 'user', content: '   ' }])).toThrow('không được để trống');
  });

  test('requires the conversation to end with a user message and start with one', () => {
    expect(() => sanitizeMessages([{ role: 'assistant', content: 'Xin chào' }])).toThrow('Vui lòng nhập câu hỏi.');
    const turns = sanitizeMessages([
      { role: 'assistant', content: 'Chào bạn' },
      { role: 'user', content: 'Tìm balo' }
    ]);
    expect(turns).toEqual([{ role: 'user', content: 'Tìm balo' }]);
    expect(() => sanitizeMessages([
      { role: 'user', content: 'Tìm balo' },
      { role: 'assistant', content: 'Bạn muốn giá nào?' }
    ])).toThrow('Vui lòng nhập câu hỏi.');
  });

  test('redacts contact details, merges consecutive turns and keeps only the latest turns', () => {
    const turns = sanitizeMessages([
      { role: 'user', content: 'Email tôi là person@example.test' },
      { role: 'user', content: 'Số 0912345678, xem https://example.test/x' }
    ]);
    expect(turns).toHaveLength(1);
    expect(turns[0].content).not.toMatch(/person@example\.test|0912345678|example\.test\/x/);
    expect(turns[0].content).toContain('[đã ẩn email]');

    const many = Array.from({ length: 30 }, (_, index) => ({ role: index % 2 ? 'assistant' : 'user', content: `Tin ${index}` }));
    many.push({ role: 'user', content: 'Câu cuối' });
    expect(sanitizeMessages(many).length).toBeLessThanOrEqual(12);
  });
});

describe('chat with the language model', () => {
  test('sends the redacted conversation, platform instructions and the search tool', async () => {
    const result = await chat({
      messages: [
        { role: 'user', content: 'Chào bạn, mình là Lan' },
        { role: 'assistant', content: 'Chào Lan, mình giúp được gì?' },
        { role: 'user', content: 'Gọi mình theo số 0912345678 nhé' }
      ]
    });

    expect(result).toEqual({ answer: 'Xin chào, mình giúp được gì cho bạn?', products: [], degraded: false });
    const request = gemini.generateChat.mock.calls[0][0];
    expect(request.systemInstruction).toContain('SecondSafe');
    expect(request.tools[0].functionDeclarations[0].name).toBe('search_products');
    expect(request.contents.map(item => item.role)).toEqual(['user', 'model', 'user']);
    const sent = JSON.stringify(request.contents);
    expect(sent).toContain('Chào Lan');
    expect(sent).not.toContain('0912345678');
    expect(gemini.generateText).not.toHaveBeenCalled();
  });

  test('runs the search tool on real listings and returns them as cards', async () => {
    Product.find.mockReturnValue(productQuery([backpack]));
    gemini.generateChat
      .mockResolvedValueOnce(toolCall({ query: 'balo đi học', maxPriceVnd: 300000, condition: 'good' }))
      .mockResolvedValueOnce(textReply('Có một chiếc balo giá 250.000đ.'));

    const result = await chat({ messages: [{ role: 'user', content: 'Mình cần balo đi học dưới 300.000đ' }] });

    expect(Product.find).toHaveBeenCalledWith(expect.objectContaining({
      status: 'active',
      seller: { $in: [SELLER_ID] },
      price: { $lte: 300000 },
      condition: 'good',
      $text: { $search: 'balo đi học' }
    }));
    expect(result.answer).toBe('Có một chiếc balo giá 250.000đ.');
    expect(result.degraded).toBe(false);
    expect(result.products).toEqual([expect.objectContaining({
      id: PRODUCT_ID,
      title: 'Balo đi học, gọi 0912345678',
      priceVnd: 250000,
      location: 'Ba Đình, Hà Nội',
      image: '/uploads/balo.jpg'
    })]);
  });

  test('gives the model only redacted public attributes, without seller identity or location', async () => {
    Product.find.mockReturnValue(productQuery([backpack]));
    gemini.generateChat
      .mockResolvedValueOnce(toolCall({ query: 'balo' }))
      .mockResolvedValueOnce(textReply('Đây là gợi ý.'));

    await chat({ messages: [{ role: 'user', content: 'Tìm balo' }] });

    const secondRequest = gemini.generateChat.mock.calls[1][0];
    expect(secondRequest.contents.map(item => item.role)).toEqual(['user', 'model', 'user']);
    const toolResult = secondRequest.contents[2].parts[0].functionResponse;
    expect(toolResult.name).toBe('search_products');
    expect(toolResult.response.count).toBe(1);
    expect(Object.keys(toolResult.response.products[0]).sort()).toEqual(['category', 'condition', 'description', 'priceVnd', 'title']);
    const sent = JSON.stringify(toolResult);
    expect(sent).not.toMatch(/0912345678|person@example\.test|Ba Đình|Hà Nội|uploads|seller/);
    expect(sent).toContain('[đã ẩn số điện thoại]');
    expect(sent).toContain('[đã ẩn email]');
  });

  test('falls back to a keyword search when the text index finds nothing', async () => {
    Product.find
      .mockReturnValueOnce(productQuery([]))
      .mockReturnValueOnce(productQuery([backpack]));
    gemini.generateChat
      .mockResolvedValueOnce(toolCall({ query: 'ba lô (xanh)' }))
      .mockResolvedValueOnce(textReply('Có kết quả.'));

    const result = await chat({ messages: [{ role: 'user', content: 'Tìm ba lô xanh' }] });

    expect(Product.find).toHaveBeenCalledTimes(2);
    expect(Product.find.mock.calls[1][0].title).toEqual({ $regex: 'ba|lô|\\(xanh\\)', $options: 'i' });
    expect(result.products).toHaveLength(1);
  });

  test('stops offering the tool after the round limit and rejects unknown tools safely', async () => {
    gemini.generateChat
      .mockResolvedValueOnce({ role: 'model', parts: [{ functionCall: { name: 'delete_everything', args: {} } }] })
      .mockResolvedValueOnce({ role: 'model', parts: [{ functionCall: { name: 'delete_everything', args: {} } }] })
      .mockResolvedValueOnce(textReply('Mình chưa làm được việc đó.'));

    const result = await chat({ messages: [{ role: 'user', content: 'Xoá hết dữ liệu' }] });

    expect(Product.find).not.toHaveBeenCalled();
    expect(gemini.generateChat).toHaveBeenCalledTimes(3);
    expect(gemini.generateChat.mock.calls[0][0].tools).toBeDefined();
    expect(gemini.generateChat.mock.calls[2][0].tools).toBeUndefined();
    expect(gemini.generateChat.mock.calls[1][0].contents[2].parts[0].functionResponse.response.error).toBeDefined();
    expect(result.answer).toBe('Mình chưa làm được việc đó.');
  });
});

describe('local answers', () => {
  test('answers a help question locally when the provider fails', async () => {
    gemini.generateChat.mockRejectedValue(new Error('Trợ lý AI chưa được cấu hình GEMINI_API_KEY trong backend/.env'));

    const result = await chat({ messages: [{ role: 'user', content: 'Tôi quên mật khẩu' }] });

    expect(result.degraded).toBe(true);
    expect(result.answer).toContain('khôi phục mật khẩu');
    expect(result.products).toEqual([]);
  });

  test('recommends listings locally when the provider fails on a shopping question', async () => {
    Product.find.mockReturnValue(productQuery([backpack]));
    gemini.generateChat.mockRejectedValue(new Error('Không thể kết nối dịch vụ AI.'));

    const result = await chat({ messages: [{ role: 'user', content: 'Mình cần mua balo' }] });

    expect(result.degraded).toBe(true);
    expect(result.products).toHaveLength(1);
    expect(result.answer).toContain('Túi xách');
  });

  test('does not hide validation errors behind a local answer', async () => {
    await expect(chat({ messages: [{ role: 'user', content: '   ' }] })).rejects.toMatchObject({ statusCode: 400 });
    expect(gemini.generateChat).not.toHaveBeenCalled();
  });

  test('keeps the earlier topic-only behaviour when the switch is off', async () => {
    process.env.ASSISTANT_LLM_SEES_MESSAGES = 'false';

    const result = await chat({ messages: [{ role: 'user', content: 'Tôi cần hỗ trợ, số 0912345678, nhà 12 Nguyễn Trãi' }] });

    expect(gemini.generateChat).not.toHaveBeenCalled();
    expect(result.answer).toBe('Câu trả lời theo chủ đề.');
    const prompt = gemini.generateText.mock.calls[0][0];
    expect(prompt).toContain('Chủ đề câu hỏi: messaging_support');
    expect(prompt).not.toContain('0912345678');
    expect(prompt).not.toContain('Nguyễn Trãi');
  });
});
