import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import Support from './Support';
import supportService from '../../services/support.service';
import { connectChatSocket } from '../../services/chat.service';

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
  subject: 'Cần trợ giúp đơn hàng',
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
  render(
    <MemoryRouter
      initialEntries={[path]}
      future={{ v7_startTransition: true, v7_relativeSplatPath: true }}
    >
      <Routes>
        <Route path="/support" element={<Support />} />
        <Route path="/support/:conversationId" element={<Support />} />
      </Routes>
    </MemoryRouter>
  );
}

test('customers can create a support request', async () => {
  renderSupport('/support');
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
