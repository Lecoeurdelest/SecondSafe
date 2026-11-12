import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import Support from './Support';
import supportService from '../../services/support.service';
import { connectChatSocket } from '../../services/chat.service';
import AppProviders from '../../ui/AppProviders';

jest.mock('../../services/support.service', () => ({
  __esModule: true,
  default: {
    getConversations: jest.fn(),
    createConversation: jest.fn(),
    getMessages: jest.fn(),
    sendMessage: jest.fn(),
    updateStatus: jest.fn()
  }
}));

jest.mock('../../services/chat.service', () => ({
  __esModule: true,
  connectChatSocket: jest.fn(() => ({
    connected: false,
    on: jest.fn(),
    off: jest.fn(),
    emit: jest.fn(),
    disconnect: jest.fn()
  }))
}));

const conversation = {
  _id: 'support-1',
  subject: 'Đơn hàng và thanh toán',
  status: 'open',
  lastMessageAt: '2026-10-27T00:00:00.000Z'
};

beforeEach(() => {
  jest.clearAllMocks();
  connectChatSocket.mockReturnValue({
    connected: false,
    on: jest.fn(),
    off: jest.fn(),
    emit: jest.fn(),
    disconnect: jest.fn()
  });
  window.localStorage.setItem('token', 'test-token');
  window.localStorage.setItem('secondsafe:role', 'user');
  supportService.getConversations.mockResolvedValue({ conversations: [conversation] });
  supportService.createConversation.mockResolvedValue({ conversation });
  supportService.getMessages.mockResolvedValue({ messages: [] });
  supportService.sendMessage.mockResolvedValue({
    _id: 'message-1',
    senderId: 'user-1',
    senderRole: 'user',
    content: 'Tôi cần kiểm tra đơn hàng.',
    createdAt: '2026-10-27T00:00:00.000Z'
  });
});

function renderSupport(path) {
  return render(
    <AppProviders language="vi" themeMode="light">
      <MemoryRouter
        initialEntries={[path]}
        future={{ v7_startTransition: true, v7_relativeSplatPath: true }}
      >
        <Routes>
          <Route path="/support" element={<Support />} />
          <Route path="/support/:conversationId" element={<Support />} />
        </Routes>
      </MemoryRouter>
    </AppProviders>
  );
}

test('customers can create a support request', async () => {
  renderSupport('/support');
  fireEvent.mouseDown(screen.getByLabelText('Chủ đề hỗ trợ'));
  expect(await screen.findAllByRole('option')).toHaveLength(7);
  fireEvent.change(screen.getByLabelText('Chủ đề hỗ trợ'), {
    target: { value: conversation.subject }
  });
  fireEvent.change(screen.getByLabelText('Mô tả vấn đề'), {
    target: { value: 'Tôi cần kiểm tra đơn hàng.' }
  });
  fireEvent.click(screen.getByRole('button', { name: 'Tạo yêu cầu hỗ trợ' }));

  await waitFor(() => expect(supportService.createConversation).toHaveBeenCalledWith({
    subject: conversation.subject,
    message: 'Tôi cần kiểm tra đơn hàng.'
  }));
  await waitFor(() => expect(supportService.getMessages).toHaveBeenCalledWith(conversation._id));
  expect(await screen.findByLabelText('Tin nhắn hỗ trợ')).toBeInTheDocument();
});

test('customers can enter a custom support subject', async () => {
  renderSupport('/support');
  fireEvent.change(screen.getByLabelText('Chủ đề hỗ trợ'), {
    target: { value: 'Tôi cần hỗ trợ về vấn đề khác' }
  });
  fireEvent.change(screen.getByLabelText('Mô tả vấn đề'), {
    target: { value: 'Vui lòng liên hệ với tôi.' }
  });
  fireEvent.click(screen.getByRole('button', { name: 'Tạo yêu cầu hỗ trợ' }));

  await waitFor(() => expect(supportService.createConversation).toHaveBeenCalledWith({
    subject: 'Tôi cần hỗ trợ về vấn đề khác',
    message: 'Vui lòng liên hệ với tôi.'
  }));
});

test('customers can send a reply in an existing support conversation', async () => {
  renderSupport(`/support/${conversation._id}`);
  expect(await screen.findByLabelText('Tin nhắn hỗ trợ')).toBeInTheDocument();
  fireEvent.change(screen.getByLabelText('Tin nhắn hỗ trợ'), {
    target: { value: 'Tôi cần kiểm tra đơn hàng.' }
  });
  fireEvent.click(screen.getByRole('button', { name: 'Gửi tin nhắn' }));

  await waitFor(() => expect(supportService.sendMessage).toHaveBeenCalledWith(
    conversation._id,
    'Tôi cần kiểm tra đơn hàng.'
  ));
  expect(await screen.findByText('Tôi cần kiểm tra đơn hàng.')).toBeInTheDocument();
  expect(connectChatSocket).toHaveBeenCalledWith('test-token');
});

test('signed-out visitors are asked to sign in and nothing is requested', () => {
  window.localStorage.removeItem('token');
  renderSupport('/support');

  expect(screen.getByRole('heading', { name: 'Hỗ trợ khách hàng' })).toBeInTheDocument();
  expect(screen.getByRole('link', { name: 'Đăng nhập' })).toHaveAttribute('href', '/login');
  expect(supportService.getConversations).not.toHaveBeenCalled();
});

test('an empty request form shows inline errors and sends nothing', async () => {
  renderSupport('/support');

  fireEvent.click(screen.getByRole('button', { name: 'Tạo yêu cầu hỗ trợ' }));

  expect(await screen.findByText('Vui lòng nhập chủ đề hỗ trợ.')).toBeInTheDocument();
  expect(screen.getByText('Vui lòng mô tả vấn đề.')).toBeInTheDocument();
  expect(supportService.createConversation).not.toHaveBeenCalled();
});

test('a failed load and a failed creation show a dismissible alert', async () => {
  supportService.getConversations.mockRejectedValueOnce(new Error('Không thể tải cuộc trò chuyện hỗ trợ.'));
  renderSupport('/support');
  expect(await screen.findByRole('alert')).toHaveTextContent('Không thể tải cuộc trò chuyện hỗ trợ.');

  supportService.createConversation.mockRejectedValueOnce(new Error('Không thể mở yêu cầu hỗ trợ.'));
  fireEvent.change(screen.getByLabelText('Chủ đề hỗ trợ'), { target: { value: 'Chủ đề' } });
  fireEvent.change(screen.getByLabelText('Mô tả vấn đề'), { target: { value: 'Nội dung' } });
  fireEvent.click(screen.getByRole('button', { name: 'Tạo yêu cầu hỗ trợ' }));
  expect(await screen.findByText('Không thể mở yêu cầu hỗ trợ.')).toBeInTheDocument();
});

test('the conversation list opens a conversation and marks the open one', async () => {
  renderSupport('/support');

  const item = await screen.findByRole('button', { name: /Đơn hàng và thanh toán/ });
  expect(item).not.toHaveAttribute('aria-current');
  fireEvent.click(item);
  expect(await screen.findByLabelText('Tin nhắn hỗ trợ')).toBeInTheDocument();
  expect(screen.getByRole('button', { name: /Đơn hàng và thanh toán/ })).toHaveAttribute('aria-current', 'true');
  expect(screen.getByText('Đang tiếp nhận')).toBeInTheDocument();
});

test('staff see the inbox with a status filter and can close and reopen a request', async () => {
  window.localStorage.setItem('secondsafe:role', 'moderator');
  const staffConversation = { ...conversation, customerId: { fullName: 'Khách A' } };
  supportService.getConversations.mockResolvedValue({ conversations: [staffConversation] });
  supportService.updateStatus.mockResolvedValue({});
  renderSupport(`/support/${conversation._id}`);

  expect(await screen.findByRole('heading', { name: 'Hộp thư hỗ trợ' })).toBeInTheDocument();
  expect(await screen.findByText('Khách A')).toBeInTheDocument();
  expect(supportService.getConversations).toHaveBeenCalledWith('open');
  expect(screen.queryByLabelText('Chủ đề hỗ trợ')).not.toBeInTheDocument();

  fireEvent.click(await screen.findByRole('button', { name: 'Đóng yêu cầu' }));
  await waitFor(() => expect(supportService.updateStatus).toHaveBeenCalledWith(conversation._id, 'closed'));

  supportService.getConversations.mockResolvedValue({ conversations: [{ ...staffConversation, status: 'closed' }] });
  fireEvent.mouseDown(screen.getByRole('combobox', { name: 'Lọc trạng thái' }));
  fireEvent.click(await screen.findByText('Đã đóng', { selector: '.ant-select-item-option-content' }));
  await waitFor(() => expect(supportService.getConversations).toHaveBeenLastCalledWith('closed'));
  const reopen = await screen.findByRole('button', { name: 'Mở lại' });
  expect(screen.queryByLabelText('Tin nhắn hỗ trợ')).not.toBeInTheDocument();
  fireEvent.click(reopen);
  await waitFor(() => expect(supportService.updateStatus).toHaveBeenLastCalledWith(conversation._id, 'open'));
});
