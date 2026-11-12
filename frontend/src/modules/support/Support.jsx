import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { connectChatSocket } from '../../services/chat.service';
import supportService from '../../services/support.service';
import LinkButton from '../../ui/LinkButton';
import './Support.css';
import { Alert, AutoComplete, Button, Card, Empty, Flex, Form, Input, Select, Tag, Typography } from 'antd';
import { Sparkle } from '@phosphor-icons/react';

const SUPPORT_SUBJECT_SUGGESTIONS = [
  'Đơn hàng và thanh toán',
  'Giao hàng và nhận hàng',
  'Đổi trả và hoàn tiền',
  'Sản phẩm và tình trạng sản phẩm',
  'Tài khoản và bảo mật',
  'Đăng bán và quản lý sản phẩm',
  'Khiếu nại hoặc tranh chấp'
];

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
  const [createForm] = Form.useForm();
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

  async function createConversation({ subject, message }) {
    setLoading(true);
    setError('');
    try {
      const result = await supportService.createConversation({ subject, message });
      createForm.resetFields();
      await loadConversations();
      navigate(`/support/${idOf(result.conversation)}`);
    } catch (failure) {
      setError(failure.message || 'Không thể mở yêu cầu hỗ trợ.');
    } finally {
      setLoading(false);
    }
  }

  async function sendMessage() {
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
        <Typography.Title level={1}>Hỗ trợ khách hàng</Typography.Title>
        <Typography.Paragraph>Vui lòng đăng nhập để trò chuyện với nhân viên hỗ trợ.</Typography.Paragraph>
        <LinkButton type="primary" to="/login">Đăng nhập</LinkButton>
      </section>
    );
  }

  const active = conversations.find(item => idOf(item) === conversationId);
  const closed = active?.status === 'closed';
  return (
    <section className={`support-page container${isStaff ? ' support-page--staff' : ''}`}>
      <Flex justify="space-between" align="flex-end" wrap gap={16} className="support-page__heading">
        <div>
          <Typography.Text strong className="support-page__eyebrow">SECOND SAFE · HỖ TRỢ</Typography.Text>
          <Typography.Title level={1}>{isStaff ? 'Hộp thư hỗ trợ' : 'Trò chuyện với chúng tôi'}</Typography.Title>
        </div>
        {isStaff && (
          <Flex vertical gap={4}>
            <label htmlFor="support-status-filter">Lọc trạng thái</label>
            <Select
              id="support-status-filter"
              value={statusFilter}
              onChange={setStatusFilter}
              options={[{ value: 'open', label: 'Đang mở' }, { value: 'closed', label: 'Đã đóng' }]}
            />
          </Flex>
        )}
      </Flex>
      {error && <Alert className="support-page__error" type="error" showIcon closable role="alert" title={error} onClose={() => setError('')} />}
      <div className="support-layout">
        <Card
          className="support-inbox"
          title={<Flex justify="space-between"><strong>{isStaff ? 'Yêu cầu hỗ trợ' : 'Cuộc trò chuyện'}</strong><Tag>{conversations.length}</Tag></Flex>}
        >
          {!isStaff && (
            <Form form={createForm} name="support-new" layout="vertical" onFinish={createConversation} className="support-new">
              <Form.Item name="subject" label="Chủ đề hỗ trợ" rules={[{ required: true, message: 'Vui lòng nhập chủ đề hỗ trợ.' }]}>
                <AutoComplete virtual={false} options={SUPPORT_SUBJECT_SUGGESTIONS.map(suggestion => ({ value: suggestion }))}>
                  <Input maxLength={120} placeholder="Chọn hoặc nhập chủ đề hỗ trợ" />
                </AutoComplete>
              </Form.Item>
              <Form.Item name="message" label="Mô tả vấn đề" rules={[{ required: true, message: 'Vui lòng mô tả vấn đề.' }]}>
                <Input.TextArea rows={4} maxLength={2000} placeholder="Không nhập mật khẩu, OTP hay thông tin ngân hàng." />
              </Form.Item>
              <Button type="primary" htmlType="submit" block disabled={loading}>{loading ? 'Đang gửi...' : 'Tạo yêu cầu hỗ trợ'}</Button>
            </Form>
          )}
          {isStaff && conversations.length === 0 && <Typography.Text type="secondary">Không có yêu cầu trong bộ lọc này.</Typography.Text>}
          <Flex vertical gap={8} className="support-inbox__list">
            {conversations.map(item => (
              <Button
                key={idOf(item)}
                block
                type={idOf(item) === conversationId ? 'primary' : 'default'}
                aria-current={idOf(item) === conversationId ? 'true' : undefined}
                className="support-inbox__item"
                onClick={() => navigate(`/support/${idOf(item)}`)}
              >
                <strong>{isStaff ? item.customerId?.fullName || 'Khách hàng' : item.subject}</strong>
                {isStaff && <span>{item.subject}</span>}
                <small>{item.status === 'closed' ? 'Đã đóng' : 'Đang mở'} · {formatTime(item.lastMessageAt)}</small>
              </Button>
            ))}
          </Flex>
        </Card>
        <Card className="support-thread">
          {!conversationId ? (
            <Empty
              image={<Sparkle weight="fill" size={48} />}
              description={(
                <Flex vertical gap={4}>
                  <Typography.Text strong>Trao đổi cùng đội ngũ hỗ trợ</Typography.Text>
                  <Typography.Text type="secondary">Chọn một yêu cầu hoặc mở yêu cầu mới để bắt đầu.</Typography.Text>
                </Flex>
              )}
            />
          ) : (
            <>
              <Flex justify="space-between" align="center" wrap gap={12} className="support-thread__header">
                <div>
                  <strong>{active?.subject || 'Yêu cầu hỗ trợ'}</strong>
                  <Tag color={closed ? 'default' : 'success'}>{closed ? 'Đã đóng' : 'Đang tiếp nhận'}</Tag>
                </div>
                {isStaff && active?.status === 'open' && <Button disabled={loading} onClick={() => changeStatus('closed')}>Đóng yêu cầu</Button>}
                {isStaff && closed && <Button disabled={loading} onClick={() => changeStatus('open')}>Mở lại</Button>}
              </Flex>
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
              {!closed && (
                <Form className="support-compose" onFinish={sendMessage}>
                  <label className="visually-hidden" htmlFor="support-reply">Tin nhắn hỗ trợ</label>
                  <Input.TextArea
                    id="support-reply"
                    value={draft}
                    maxLength={2000}
                    autoSize={{ minRows: 2, maxRows: 6 }}
                    onChange={event => setDraft(event.target.value)}
                    placeholder="Viết tin nhắn..."
                  />
                  <Button type="primary" htmlType="submit" disabled={loading || !draft.trim()}>{loading ? 'Đang gửi...' : 'Gửi tin nhắn'}</Button>
                </Form>
              )}
            </>
          )}
        </Card>
      </div>
      <Typography.Paragraph type="secondary" className="support-page__privacy">Tin nhắn được mã hóa khi lưu trong cơ sở dữ liệu. Tránh gửi mật khẩu, mã OTP hoặc thông tin thanh toán.</Typography.Paragraph>
    </section>
  );
}
