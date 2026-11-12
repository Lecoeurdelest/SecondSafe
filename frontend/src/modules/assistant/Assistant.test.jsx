import React from 'react';
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import Assistant from './Assistant';
import assistantService from '../../services/assistant.service';
import { clearSession } from '../../services/session.service';

jest.mock('../../services/assistant.service', () => ({
  __esModule: true,
  default: {
    chat: jest.fn(),
    getModerationGuidance: jest.fn()
  }
}));

const future = { v7_startTransition: true, v7_relativeSplatPath: true };

function renderAssistant(props = {}) {
  return render(
    <MemoryRouter future={future}>
      <Assistant {...props} />
    </MemoryRouter>
  );
}

function type(text) {
  fireEvent.change(screen.getByLabelText('Câu hỏi'), { target: { value: text } });
}

beforeEach(() => {
  jest.clearAllMocks();
  window.sessionStorage.clear();
  window.localStorage.setItem('token', 'test-token');
  assistantService.chat.mockResolvedValue({
    answer: 'Bạn có thể xem các sản phẩm đang bán.',
    products: [],
    degraded: false
  });
});

test('signed-out visitors are asked to sign in', () => {
  window.localStorage.clear();
  renderAssistant();
  expect(screen.getByText('Vui lòng đăng nhập để sử dụng trợ lý AI.')).toBeInTheDocument();
  expect(screen.queryByLabelText('Câu hỏi')).not.toBeInTheDocument();
});

test('shows starters, the privacy notice and a disabled send button before anything is typed', () => {
  renderAssistant();
  expect(screen.getByText(/gửi tới Google Gemini để tạo câu trả lời/)).toBeInTheDocument();
  expect(screen.getByRole('button', { name: 'Mình cần balo đi học dưới 300.000đ' })).toBeEnabled();
  expect(screen.getByRole('button', { name: 'Gửi' })).toBeDisabled();
  expect(screen.getByRole('button', { name: 'Cuộc trò chuyện mới' })).toBeDisabled();
});

test('sends the whole conversation on every turn and renders the answer', async () => {
  assistantService.chat
    .mockResolvedValueOnce({ answer: 'Bạn muốn tầm giá nào?', products: [], degraded: false })
    .mockResolvedValueOnce({ answer: 'Có **một** lựa chọn.', products: [], degraded: false });
  renderAssistant();

  type('Mình cần balo');
  fireEvent.click(screen.getByRole('button', { name: 'Gửi' }));
  expect(await screen.findByText('Bạn muốn tầm giá nào?')).toBeInTheDocument();
  expect(assistantService.chat).toHaveBeenCalledWith({ messages: [{ role: 'user', content: 'Mình cần balo' }] });

  type('Dưới 300k');
  fireEvent.click(screen.getByRole('button', { name: 'Gửi' }));
  expect(await screen.findByText('một')).toBeInTheDocument();
  expect(assistantService.chat).toHaveBeenLastCalledWith({
    messages: [
      { role: 'user', content: 'Mình cần balo' },
      { role: 'assistant', content: 'Bạn muốn tầm giá nào?' },
      { role: 'user', content: 'Dưới 300k' }
    ]
  });
  expect(screen.getByLabelText('Câu hỏi')).toHaveValue('');
});

test('a starter sends its question straight away', async () => {
  renderAssistant();
  fireEvent.click(screen.getByRole('button', { name: 'Điện thoại cũ nào giá tốt?' }));
  await waitFor(() => expect(assistantService.chat).toHaveBeenCalledWith({
    messages: [{ role: 'user', content: 'Điện thoại cũ nào giá tốt?' }]
  }));
  expect(await screen.findByText('Bạn có thể xem các sản phẩm đang bán.')).toBeInTheDocument();
});

test('Enter sends, Shift+Enter does not and IME composition is respected', async () => {
  renderAssistant();
  type('Xin chào');
  const box = screen.getByLabelText('Câu hỏi');

  fireEvent.keyDown(box, { key: 'Enter', shiftKey: true });
  fireEvent.keyDown(box, { key: 'Enter', isComposing: true });
  expect(assistantService.chat).not.toHaveBeenCalled();

  fireEvent.keyDown(box, { key: 'Enter' });
  await waitFor(() => expect(assistantService.chat).toHaveBeenCalledTimes(1));
});

test('product recommendations rebase old image URLs, link to the listing and fall back on load failure', async () => {
  assistantService.chat.mockResolvedValue({
    answer: 'Sản phẩm phù hợp.',
    degraded: false,
    products: [{
      id: 'product-1',
      title: 'Sách cũ',
      image: 'http://127.0.0.1:5000/uploads/products/user/book.jpg',
      category: 'Sách',
      condition: 'good',
      priceVnd: 50000
    }]
  });
  renderAssistant();
  type('Tìm sách');
  fireEvent.click(screen.getByRole('button', { name: 'Gửi' }));

  const image = await screen.findByAltText('');
  expect(image).toHaveAttribute('src', 'http://localhost:5000/uploads/products/user/book.jpg');
  fireEvent.error(image);
  expect(image.getAttribute('src')).toBe('/images/placeholders/product-placeholder.svg');
  const card = screen.getByRole('link', { name: /Sách cũ/ });
  expect(card).toHaveAttribute('href', '/product/product-1');
  expect(within(card).getByText(/Sách · Tốt/)).toBeInTheDocument();
});

test('tells the customer when the answer is the built-in fallback', async () => {
  assistantService.chat.mockResolvedValue({ answer: 'Hướng dẫn có sẵn.', products: [], degraded: true });
  renderAssistant();
  type('Quên mật khẩu');
  fireEvent.click(screen.getByRole('button', { name: 'Gửi' }));
  expect(await screen.findByText('Hướng dẫn có sẵn.')).toBeInTheDocument();
  expect(screen.getByText(/đang bận nên đây là câu trả lời có sẵn/)).toBeInTheDocument();
});

test('shows a retryable error and keeps the question when the request fails', async () => {
  assistantService.chat
    .mockRejectedValueOnce(new Error('Không thể nhận phản hồi từ dịch vụ AI lúc này.'))
    .mockResolvedValueOnce({ answer: 'Đã trả lời lại.', products: [], degraded: false });
  renderAssistant();
  type('Tìm balo');
  fireEvent.click(screen.getByRole('button', { name: 'Gửi' }));

  expect(await screen.findByRole('alert')).toHaveTextContent('Không thể nhận phản hồi từ dịch vụ AI lúc này.');
  expect(screen.getByText('Tìm balo')).toBeInTheDocument();

  fireEvent.click(screen.getByRole('button', { name: 'Thử lại' }));
  expect(await screen.findByText('Đã trả lời lại.')).toBeInTheDocument();
  expect(assistantService.chat).toHaveBeenCalledTimes(2);
  expect(assistantService.chat.mock.calls[1][0]).toEqual(assistantService.chat.mock.calls[0][0]);
  expect(screen.queryByRole('alert')).not.toBeInTheDocument();
});

test('the conversation survives a reload and a new conversation clears it', async () => {
  const first = renderAssistant();
  type('Xin chào');
  fireEvent.click(screen.getByRole('button', { name: 'Gửi' }));
  expect(await screen.findByText('Bạn có thể xem các sản phẩm đang bán.')).toBeInTheDocument();
  first.unmount();

  renderAssistant();
  expect(screen.getByText('Xin chào')).toBeInTheDocument();
  expect(screen.getByText('Bạn có thể xem các sản phẩm đang bán.')).toBeInTheDocument();

  fireEvent.click(screen.getByRole('button', { name: 'Cuộc trò chuyện mới' }));
  expect(screen.queryByText('Xin chào')).not.toBeInTheDocument();
  expect(screen.getByRole('button', { name: 'Điện thoại cũ nào giá tốt?' })).toBeInTheDocument();
  expect(window.sessionStorage.getItem('secondsafe:assistant:thread')).toBeNull();
});

test('signing out removes the stored conversation', async () => {
  renderAssistant();
  type('Xin chào');
  fireEvent.click(screen.getByRole('button', { name: 'Gửi' }));
  await screen.findByText('Bạn có thể xem các sản phẩm đang bán.');
  expect(window.sessionStorage.getItem('secondsafe:assistant:thread')).not.toBeNull();

  clearSession();
  expect(window.sessionStorage.getItem('secondsafe:assistant:thread')).toBeNull();
});

test('moderators still get the report checklist view', async () => {
  assistantService.getModerationGuidance.mockResolvedValue({ guidance: 'Checklist: 1) Xem hồ sơ.' });
  render(
    <MemoryRouter future={future} initialEntries={['/staff/assistant/report-1']}>
      <Assistant moderation />
    </MemoryRouter>
  );
  expect(screen.getByRole('heading', { name: 'Checklist tham khảo' })).toBeInTheDocument();
  expect(screen.queryByLabelText('Câu hỏi')).not.toBeInTheDocument();
});

function renderModeration() {
  return render(
    <MemoryRouter future={future} initialEntries={['/staff/assistant/report-1']}>
      <Routes>
        <Route path="/staff/assistant/:reportId" element={<Assistant moderation />} />
      </Routes>
    </MemoryRouter>
  );
}

test('the moderation checklist shows the guidance and links back to the staff dashboard', async () => {
  assistantService.getModerationGuidance.mockResolvedValue({ guidance: 'Checklist: 1) Xem hồ sơ.' });
  renderModeration();

  expect(await screen.findByText('Checklist: 1) Xem hồ sơ.')).toBeInTheDocument();
  expect(assistantService.getModerationGuidance).toHaveBeenCalledWith('report-1');
  expect(screen.getByText('Đây chỉ là gợi ý chung. Nhân viên phải tự xem xét hồ sơ nội bộ và đưa ra quyết định cuối cùng.')).toBeInTheDocument();
  expect(screen.getByRole('link', { name: /Quay lại dashboard nhân viên/ })).toHaveAttribute('href', '/staff');
});

test('the moderation checklist shows a status while loading and an alert when it fails', async () => {
  assistantService.getModerationGuidance.mockRejectedValue(new Error('Không thể tạo checklist kiểm duyệt.'));
  renderModeration();

  expect(screen.getByRole('status')).toHaveTextContent('Đang tạo checklist...');
  expect(await screen.findByRole('alert')).toHaveTextContent('Không thể tạo checklist kiểm duyệt.');
});

test('the character counter follows what is typed', () => {
  renderAssistant();
  expect(screen.getByText('0/600')).toBeInTheDocument();
  type('Xin chào');
  expect(screen.getByText('8/600')).toBeInTheDocument();
  expect(screen.getByRole('link', { name: 'Mở cuộc trò chuyện hỗ trợ' })).toHaveAttribute('href', '/support');
});
