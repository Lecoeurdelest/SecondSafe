import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { connectChatSocket } from '../../services/chat.service';
import supportService from '../../services/support.service';
import './Support.css';

function getToken() {
  try { return window.localStorage.getItem('token'); } catch { return null; }
}

function getRole() {
  try { return window.localStorage.getItem('secondsafe:role') || 'user'; } catch { return 'user'; }
}

function userIdFromToken(token) {
  try { return JSON.parse(atob(token.split('.')[1])).userId || ''; } catch { return ''; }
}

function idOf(value) {
  return String(value?._id || value || '');
}

function formatTime(value) {
  if (!value) return '';
  return new Date(value).toLocaleString('vi-VN', { dateStyle: 'short', timeStyle: 'short' });
}

function replaceMessage(messages, message) {
  const index = messages.findIndex(item => idOf(item) === idOf(message));
  if (index < 0) return [...messages, message];
  return messages.map((item, position) => position === index ? { ...item, ...message } : item);
}

export default function Support() {
  const { conversationId } = useParams();
  const navigate = useNavigate();
  const token = getToken();
  const role = getRole();
  const isStaff = role === 'moderator' || role === 'admin';
  const myId = token ? userIdFromToken(token) : '';
  const [conversations, setConversations] = useState([]);
  const [messages, setMessages] = useState([]);
  const [draft, setDraft] = useState('');
  const [subject, setSubject] = useState('');
  const [initialMessage, setInitialMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [statusFilter, setStatusFilter] = useState('open');
  const socketRef = useRef(null);
  const endRef = useRef(null);
  const loadConversationsRef = useRef(() => {});

  const loadConversations = useCallback(async () => {
    try {
      const result = await supportService.getConversations(isStaff ? statusFilter : undefined);
      setConversations(result.conversations);
    } catch (failure) {
      setError(failure.message || 'Không thể tải cuộc trò chuyện hỗ trợ.');
    }
  }, [isStaff, statusFilter]);
  loadConversationsRef.current = loadConversations;

  const loadMessages = useCallback(async (isCurrent = () => true) => {
    if (!conversationId) return;
    try {
      const result = await supportService.getMessages(conversationId);
      if (isCurrent()) {
        setMessages(current => {
          const received = current.filter(message => !result.messages.some(item => idOf(item) === idOf(message)));
          return [...result.messages, ...received];
        });
      }
    } catch (failure) {
      if (isCurrent()) setError(failure.message || 'Không thể tải tin nhắn hỗ trợ.');
    }
  }, [conversationId]);

  useEffect(() => {
    if (token) loadConversations();
  }, [token, loadConversations]);

  useEffect(() => {
    if (!token) return undefined;
    const socket = connectChatSocket(token);
    socketRef.current = socket;
    const refreshConversations = () => loadConversationsRef.current();
    socket.on('support_inbox_updated', refreshConversations);
    socket.on('support_conversation_updated', refreshConversations);
    return () => {
      socket.off('support_inbox_updated', refreshConversations);
      socket.off('support_conversation_updated', refreshConversations);
      socket.disconnect();
      socketRef.current = null;
    };
  }, [token]);

  useEffect(() => {
    const socket = socketRef.current;
    if (!token || !conversationId || !socket) return undefined;
    let active = true;
    setMessages([]);
    loadMessages(() => active);
    const join = () => socket.emit('join_support_conversation', { conversationId });
    if (socket.connected) join();
    const onConnect = () => {
      join();
      loadMessages(() => active);
    };
    const onReceive = payload => {
      if (payload.conversationId === conversationId) {
        setMessages(current => replaceMessage(current, payload.message));
      }
    };
    socket.on('connect', onConnect);
    socket.on('support_receive_message', onReceive);
    return () => {
      active = false;
      socket.emit('leave_support_conversation', { conversationId });
      socket.off('connect', onConnect);
      socket.off('support_receive_message', onReceive);
    };
  }, [token, conversationId, loadMessages]);

  useEffect(() => {
    endRef.current?.scrollIntoView?.({ block: 'end' });
  }, [messages]);

  async function createConversation(event) {
    event.preventDefault();
    setLoading(true);
    setError('');
    try {
      const result = await supportService.createConversation({ subject, message: initialMessage });
      setSubject('');
      setInitialMessage('');
      await loadConversations();
      navigate(`/support/${idOf(result.conversation)}`);
    } catch (failure) {
      setError(failure.message || 'Không thể mở yêu cầu hỗ trợ.');
    } finally {
      setLoading(false);
    }
  }

  async function sendMessage(event) {
    event.preventDefault();
    const content = draft.trim();
    if (!content || !conversationId || loading) return;
    setLoading(true);
    setError('');
    setDraft('');
    try {
      const socket = socketRef.current;
      if (socket?.connected) {
        socket.emit('send_support_message', { conversationId, content }, async acknowledgement => {
          if (!acknowledgement?.success) setError(acknowledgement?.message || 'Không thể gửi tin nhắn.');
          await loadConversations();
          setLoading(false);
        });
        return;
      }
      const message = await supportService.sendMessage(conversationId, content);
      setMessages(current => replaceMessage(current, message));
      await loadConversations();
    } catch (failure) {
      setError(failure.message || 'Không thể gửi tin nhắn.');
      setDraft(content);
    } finally {
      if (!socketRef.current?.connected) setLoading(false);
    }
  }

  async function changeStatus(status) {
    setLoading(true);
    setError('');
    try {
      await supportService.updateStatus(conversationId, status);
      await loadConversations();
    } catch (failure) {
      setError(failure.message || 'Không thể cập nhật yêu cầu hỗ trợ.');
    } finally {
      setLoading(false);
    }
  }

  if (!token) {
    return (
      <section className="support-page container">
        <h1>Hỗ trợ khách hàng</h1>
        <p>Vui lòng đăng nhập để trò chuyện với nhân viên hỗ trợ.</p>
        <Link to="/login">Đăng nhập</Link>
      </section>
    );
  }

  const active = conversations.find(item => idOf(item) === conversationId);
  return (
    <section className={`support-page container${isStaff ? ' support-page--staff' : ''}`}>
      <header className="support-page__heading">
        <div>
          <p>SECOND SAFE · HỖ TRỢ</p>
          <h1>{isStaff ? 'Hộp thư hỗ trợ' : 'Trò chuyện với chúng tôi'}</h1>
        </div>
        {isStaff && (
          <label>
            Lọc trạng thái
            <select value={statusFilter} onChange={event => setStatusFilter(event.target.value)}>
              <option value="open">Đang mở</option>
              <option value="closed">Đã đóng</option>
            </select>
          </label>
        )}
      </header>
      {error && <p className="support-page__error" role="alert">{error}</p>}
      <div className="support-layout">
        <aside className="support-inbox">
          <div className="support-inbox__heading"><strong>{isStaff ? 'Yêu cầu hỗ trợ' : 'Cuộc trò chuyện'}</strong><span>{conversations.length}</span></div>
          {!isStaff && (
            <form className="support-new" onSubmit={createConversation}>
              <label htmlFor="support-subject">Chủ đề hỗ trợ</label>
              <input id="support-subject" value={subject} maxLength={120} required onChange={event => setSubject(event.target.value)} placeholder="Ví dụ: Cần trợ giúp về đơn hàng" />
              <label htmlFor="support-initial-message">Mô tả vấn đề</label>
              <textarea id="support-initial-message" value={initialMessage} maxLength={2000} required onChange={event => setInitialMessage(event.target.value)} placeholder="Không nhập mật khẩu, OTP hay thông tin ngân hàng." />
              <button type="submit" disabled={loading}>{loading ? 'Đang gửi...' : 'Tạo yêu cầu hỗ trợ'}</button>
            </form>
          )}
          {isStaff && conversations.length === 0 && <p className="support-muted">Không có yêu cầu trong bộ lọc này.</p>}
          <ul>
            {conversations.map(item => (
              <li key={idOf(item)}>
                <button
                  type="button"
                  className={idOf(item) === conversationId ? 'is-active' : ''}
                  onClick={() => navigate(`/support/${idOf(item)}`)}
                >
                  <strong>{isStaff ? item.customerId?.fullName || 'Khách hàng' : item.subject}</strong>
                  {isStaff && <span>{item.subject}</span>}
                  <small>{item.status === 'closed' ? 'Đã đóng' : 'Đang mở'} · {formatTime(item.lastMessageAt)}</small>
                </button>
              </li>
            ))}
          </ul>
        </aside>
        <div className="support-thread">
          {!conversationId ? (
            <div className="support-thread__empty"><span aria-hidden="true">✦</span><strong>Trao đổi cùng đội ngũ hỗ trợ</strong><p>Chọn một yêu cầu hoặc mở yêu cầu mới để bắt đầu.</p></div>
          ) : (
            <>
              <header className="support-thread__header">
                <div><strong>{active?.subject || 'Yêu cầu hỗ trợ'}</strong><span>{active?.status === 'closed' ? 'Đã đóng' : 'Đang tiếp nhận'}</span></div>
                {isStaff && active?.status === 'open' && <button type="button" disabled={loading} onClick={() => changeStatus('closed')}>Đóng yêu cầu</button>}
                {isStaff && active?.status === 'closed' && <button type="button" disabled={loading} onClick={() => changeStatus('open')}>Mở lại</button>}
              </header>
              <ol className="support-messages" aria-live="polite">
                {messages.map(message => {
                  const mine = idOf(message.senderId) === myId;
                  return (
                    <li key={idOf(message)} className={mine ? 'is-mine' : ''}>
                      <span className="support-message__sender">{mine ? 'Bạn' : message.senderRole === 'user' ? 'Khách hàng' : 'Nhân viên hỗ trợ'}</span>
                      <p>{message.content}</p>
                      <time>{formatTime(message.createdAt)}</time>
                    </li>
                  );
                })}
                <li ref={endRef} aria-hidden="true" />
              </ol>
              {active?.status !== 'closed' && (
                <form className="support-compose" onSubmit={sendMessage}>
                  <label className="visually-hidden" htmlFor="support-reply">Tin nhắn hỗ trợ</label>
                  <textarea id="support-reply" value={draft} maxLength={2000} onChange={event => setDraft(event.target.value)} placeholder="Viết tin nhắn..." />
                  <button type="submit" disabled={loading || !draft.trim()}>{loading ? 'Đang gửi...' : 'Gửi tin nhắn'}</button>
                </form>
              )}
            </>
          )}
        </div>
      </div>
      <p className="support-page__privacy">Tin nhắn được mã hóa khi lưu trong cơ sở dữ liệu. Tránh gửi mật khẩu, mã OTP hoặc thông tin thanh toán.</p>
    </section>
  );
}
