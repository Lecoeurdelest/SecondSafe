import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import Chat from './Chat';
import chatService, { connectChatSocket } from '../../services/chat.service';

jest.mock('../../services/chat.service', () => ({
  __esModule: true,
  connectChatSocket: jest.fn(),
  chatImageUrl: url => `http://api.test${url}`,
  default: { getConversations: jest.fn(), getMessages: jest.fn(), sendMessage: jest.fn(), uploadImage: jest.fn() }
}));

const ME = '507f1f77bcf86cd799439011';
const SELLER = '507f1f77bcf86cd799439012';
const CONVERSATION = '64b7f0000000000000000003';
const token = `header.${btoa(JSON.stringify({ userId: ME }))}.signature`;

function fakeSocket(connected) {
  return { connected, on: jest.fn(), off: jest.fn(), emit: jest.fn(), disconnect: jest.fn() };
}

function renderChat(path) {
  return render(
    <MemoryRouter initialEntries={[path]} future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <Routes>
        <Route path="/chat" element={<Chat />} />
        <Route path="/chat/:conversationId" element={<Chat />} />
      </Routes>
    </MemoryRouter>
  );
}

beforeEach(() => {
  window.localStorage.setItem('token', token);
  chatService.getConversations.mockResolvedValue({
    conversations: [{
      _id: CONVERSATION,
      buyerId: { _id: ME, fullName: 'Tôi' },
      sellerId: { _id: SELLER, fullName: 'Người bán A' },
      productId: { title: 'Xe đạp cũ' },
      lastMessage: 'Còn hàng không?',
      buyerUnreadCount: 2
    }]
  });
  chatService.getMessages.mockResolvedValue({
    messages: [{ _id: 'm1', senderId: { _id: SELLER }, content: 'Chào bạn', createdAt: '2026-10-14T08:00:00Z' }]
  });
});

afterEach(() => {
  window.localStorage.clear();
  jest.resetAllMocks();
});

test('asks guests to sign in and does not open a socket', () => {
  window.localStorage.clear();
  renderChat('/chat');
  expect(screen.getByText('Vui lòng đăng nhập để xem tin nhắn.')).toBeInTheDocument();
  expect(connectChatSocket).not.toHaveBeenCalled();
});

test('lists conversations with the counterpart, listing and unread badge', async () => {
  connectChatSocket.mockReturnValue(fakeSocket(true));
  renderChat('/chat');
  expect(await screen.findByText('Người bán A')).toBeInTheDocument();
  expect(screen.getByText('Xe đạp cũ')).toBeInTheDocument();
  expect(screen.getByLabelText('2 tin chưa đọc')).toBeInTheDocument();
});

test('loads history, joins the room and sends over the socket', async () => {
  const socket = fakeSocket(true);
  connectChatSocket.mockReturnValue(socket);
  renderChat(`/chat/${CONVERSATION}`);

  expect(await screen.findByText('Chào bạn')).toBeInTheDocument();
  expect(socket.emit).toHaveBeenCalledWith('join_conversation', { conversationId: CONVERSATION });

  fireEvent.change(screen.getByLabelText('Nội dung tin nhắn'), { target: { value: 'Giá bao nhiêu?' } });
  fireEvent.click(screen.getByRole('button', { name: 'Gửi' }));

  expect(socket.emit).toHaveBeenCalledWith('send_message', { conversationId: CONVERSATION, content: 'Giá bao nhiêu?' }, expect.any(Function));
});

test('falls back to REST when the socket is disconnected', async () => {
  connectChatSocket.mockReturnValue(fakeSocket(false));
  chatService.sendMessage.mockResolvedValue({ _id: 'm2', senderId: { _id: ME }, content: 'Gửi qua REST' });
  renderChat(`/chat/${CONVERSATION}`);
  await screen.findByText('Chào bạn');

  fireEvent.change(screen.getByLabelText('Nội dung tin nhắn'), { target: { value: 'Gửi qua REST' } });
  fireEvent.click(screen.getByRole('button', { name: 'Gửi' }));

  await waitFor(() => expect(chatService.sendMessage).toHaveBeenCalledWith(CONVERSATION, { content: 'Gửi qua REST' }));
  expect(await screen.findByText('Gửi qua REST')).toBeInTheDocument();
});

test('uploads a chosen image then sends it as an image message', async () => {
  const socket = fakeSocket(true);
  connectChatSocket.mockReturnValue(socket);
  const imageUrl = `/uploads/chat/${CONVERSATION}/a.png`;
  chatService.uploadImage.mockResolvedValue({ imageUrl });
  renderChat(`/chat/${CONVERSATION}`);
  await screen.findByText('Chào bạn');

  const file = new File(['png'], 'a.png', { type: 'image/png' });
  fireEvent.change(screen.getByLabelText('Gửi ảnh'), { target: { files: [file] } });

  await waitFor(() => expect(chatService.uploadImage).toHaveBeenCalledWith(CONVERSATION, file));
  await waitFor(() => expect(socket.emit).toHaveBeenCalledWith(
    'send_message', { conversationId: CONVERSATION, type: 'image', metadata: { imageUrl } }, expect.any(Function)
  ));
});

test('rejects non-image files without uploading', async () => {
  connectChatSocket.mockReturnValue(fakeSocket(true));
  renderChat(`/chat/${CONVERSATION}`);
  await screen.findByText('Chào bạn');

  fireEvent.change(screen.getByLabelText('Gửi ảnh'), { target: { files: [new File(['x'], 'a.pdf', { type: 'application/pdf' })] } });

  expect(await screen.findByRole('alert')).toHaveTextContent('Vui lòng chọn tệp ảnh');
  expect(chatService.uploadImage).not.toHaveBeenCalled();
});

test('renders image messages from the backend origin', async () => {
  connectChatSocket.mockReturnValue(fakeSocket(true));
  chatService.getMessages.mockResolvedValue({
    messages: [{ _id: 'm3', type: 'image', content: 'Đã gửi một ảnh', metadata: { imageUrl: '/uploads/chat/x/a.png' }, senderId: { _id: SELLER } }]
  });
  renderChat(`/chat/${CONVERSATION}`);
  expect(await screen.findByRole('img', { name: 'Đã gửi một ảnh' })).toHaveAttribute('src', 'http://api.test/uploads/chat/x/a.png');
});
