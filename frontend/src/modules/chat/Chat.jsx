import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import chatService, { connectChatSocket } from '../../services/chat.service';
import './Chat.css';

const TYPING_IDLE_MS = 1500;

function sessionToken() {
  try { return window.localStorage.getItem('token'); } catch { return null; }
}

function idOf(value) {
  return String(value?._id || value || '');
}

function formatTime(value) {
  return value ? new Date(value).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }) : '';
}

// Nguoi dung hien tai suy ra tu conversation: ben nao khong phai "doi phuong".
function counterpart(conversation, myId) {
  return idOf(conversation.buyerId) === myId ? conversation.sellerId : conversation.buyerId;
}

function myIdFromToken(token) {
  try { return JSON.parse(atob(token.split('.')[1])).userId || ''; } catch { return ''; }
}

export default function Chat() {
  const { conversationId } = useParams();
  const navigate = useNavigate();
  const token = sessionToken();
  const myId = token ? myIdFromToken(token) : '';
  const [conversations, setConversations] = useState([]);
  const [messages, setMessages] = useState([]);
  const [draft, setDraft] = useState('');
  const [error, setError] = useState(null);
  const [typingUser, setTypingUser] = useState(null);
  const [online, setOnline] = useState(() => new Set());
  const socketRef = useRef(null);
  const typingTimer = useRef(null);
  const listEnd = useRef(null);

  const loadConversations = useCallback(async () => {
    try {
      setConversations((await chatService.getConversations()).conversations);
    } catch (failure) {
      setError(failure.message);
    }
  }, []);

  useEffect(() => {
    if (!token) return undefined;
    loadConversations();
    const socket = connectChatSocket(token);
    socketRef.current = socket;
    socket.on('online_users', ids => setOnline(new Set(ids)));
    socket.on('user_online', ({ userId }) => setOnline(current => new Set(current).add(userId)));
    socket.on('user_offline', ({ userId }) => setOnline(current => {
      const next = new Set(current);
      next.delete(userId);
      return next;
    }));
    socket.on('new_message_notification', loadConversations);
    socket.on('chat_error', ({ message }) => setError(message));
    return () => socket.disconnect();
  }, [token, loadConversations]);

  useEffect(() => {
    const socket = socketRef.current;
    if (!token || !conversationId || !socket) return undefined;
    let active = true;
    setMessages([]);
    setTypingUser(null);
    chatService.getMessages(conversationId)
      .then(result => { if (active) setMessages(result.messages); })
      .catch(failure => active && setError(failure.message));
    socket.emit('join_conversation', { conversationId });

    const onReceive = payload => {
      if (payload.conversationId !== conversationId) return;
      setMessages(current => (current.some(item => item._id === payload.message._id) ? current : [...current, payload.message]));
      socket.emit('mark_as_read', { conversationId });
    };
    const onTyping = payload => payload.conversationId === conversationId && setTypingUser(payload.userId);
    const onStopTyping = payload => payload.conversationId === conversationId && setTypingUser(null);
    socket.on('receive_message', onReceive);
    socket.on('user_typing', onTyping);
    socket.on('user_stop_typing', onStopTyping);
    return () => {
      active = false;
      socket.emit('leave_conversation', { conversationId });
      socket.off('receive_message', onReceive);
      socket.off('user_typing', onTyping);
      socket.off('user_stop_typing', onStopTyping);
    };
  }, [token, conversationId]);

  useEffect(() => {
    listEnd.current?.scrollIntoView?.({ block: 'end' });
  }, [messages]);

  function handleDraftChange(event) {
    setDraft(event.target.value);
    const socket = socketRef.current;
    if (!socket || !conversationId) return;
    socket.emit('typing', { conversationId });
    clearTimeout(typingTimer.current);
    typingTimer.current = setTimeout(() => socket.emit('stop_typing', { conversationId }), TYPING_IDLE_MS);
  }

  async function handleSubmit(event) {
    event.preventDefault();
    const content = draft.trim();
    if (!content || !conversationId) return;
    setDraft('');
    setError(null);
    const socket = socketRef.current;
    socket?.emit('stop_typing', { conversationId });
    if (socket?.connected) {
      socket.emit('send_message', { conversationId, content }, ack => {
        if (!ack?.success) setError(ack?.message || 'Không thể gửi tin nhắn');
        else loadConversations();
      });
      return;
    }
    try {
      const message = await chatService.sendMessage(conversationId, content);
      setMessages(current => [...current, message]);
      loadConversations();
    } catch (failure) {
      setError(failure.message);
    }
  }

  if (!token) {
    return <section className="chat-empty"><h1>Tin nhắn</h1><p>Vui lòng đăng nhập để xem tin nhắn.</p><Link to="/">Về trang chủ</Link></section>;
  }

  const active = conversations.find(item => idOf(item) === conversationId);
  const partner = active ? counterpart(active, myId) : null;

  return (
    <section className="chat container" aria-label="Tin nhắn">
      <aside className="chat-sidebar">
        <h1 className="chat-title">Tin nhắn</h1>
        {conversations.length === 0 && <p className="chat-muted">Chưa có cuộc trò chuyện nào.</p>}
        <ul className="chat-list">
          {conversations.map(item => {
            const other = counterpart(item, myId);
            const unread = idOf(item.buyerId) === myId ? item.buyerUnreadCount : item.sellerUnreadCount;
            return (
              <li key={idOf(item)}>
                <button type="button" className={`chat-list-item${idOf(item) === conversationId ? ' is-active' : ''}`}
                  onClick={() => navigate(`/chat/${idOf(item)}`)}>
                  <span className="chat-name">
                    {online.has(idOf(other)) && <span className="chat-online" aria-label="Đang hoạt động" />}
                    {other?.fullName || 'Người dùng'}
                  </span>
                  <span className="chat-product">{item.productId?.title}</span>
                  <span className="chat-preview">{item.lastMessage || 'Bắt đầu trò chuyện'}</span>
                  {unread > 0 && <span className="chat-badge" aria-label={`${unread} tin chưa đọc`}>{unread}</span>}
                </button>
              </li>
            );
          })}
        </ul>
      </aside>

      <div className="chat-panel">
        {!conversationId ? <p className="chat-muted chat-placeholder">Chọn một cuộc trò chuyện để bắt đầu.</p> : (
          <>
            <header className="chat-panel-header">
              <strong>{partner?.fullName || 'Cuộc trò chuyện'}</strong>
              {active?.productId?.title && <span className="chat-muted"> · {active.productId.title}</span>}
            </header>
            <ol className="chat-messages" aria-live="polite">
              {messages.map(message => {
                const mine = idOf(message.senderId) === myId;
                return (
                  <li key={message._id} className={`chat-bubble${mine ? ' is-mine' : ''}`}>
                    {message.type === 'image' && message.metadata?.imageUrl
                      ? <img src={message.metadata.imageUrl} alt={message.content} />
                      : <span>{message.content}</span>}
                    <time dateTime={message.createdAt}>{formatTime(message.createdAt)}</time>
                  </li>
                );
              })}
              <li ref={listEnd} aria-hidden="true" />
            </ol>
            {typingUser && <p className="chat-typing">{partner?.fullName || 'Đối phương'} đang nhập...</p>}
            <form className="chat-form" onSubmit={handleSubmit}>
              <label className="visually-hidden" htmlFor="chat-input">Nội dung tin nhắn</label>
              <input id="chat-input" value={draft} onChange={handleDraftChange} maxLength={1000}
                placeholder="Nhập tin nhắn..." autoComplete="off" />
              <button type="submit" disabled={!draft.trim()}>Gửi</button>
            </form>
          </>
        )}
        {error && <p role="alert" className="chat-error">{error}</p>}
      </div>
    </section>
  );
}
