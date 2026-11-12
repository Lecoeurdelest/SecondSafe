import React, { useEffect, useRef, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import assistantService from '../../services/assistant.service';
import AssistantMessage from './AssistantMessage';
import { loadThread, newMessageId, saveThread, toPayload } from './assistantThread';
import LinkButton from '../../ui/LinkButton';
import './Assistant.css';
import { Alert, Avatar, Button, Card, Flex, Form, Input, Spin, Typography } from 'antd';
import { ArrowLeft, Sparkle } from '@phosphor-icons/react';

const STARTERS = [
  'Mình cần balo đi học dưới 300.000đ',
  'Điện thoại cũ nào giá tốt?',
  'Mua hàng trên SecondSafe an toàn thế nào?',
  'Làm sao để đăng bán một món đồ?'
];

function isSignedIn() {
  try { return Boolean(window.localStorage.getItem('token')); } catch { return false; }
}

function ModerationGuidance() {
  const { reportId } = useParams();
  const [guidance, setGuidance] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!reportId) return undefined;
    let active = true;
    setLoading(true);
    assistantService.getModerationGuidance(reportId)
      .then(result => { if (active) setGuidance(result.guidance); })
      .catch(failure => { if (active) setError(failure.message || 'Không thể tạo checklist kiểm duyệt.'); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [reportId]);

  return (
    <section className="assistant-page container">
      <LinkButton type="link" to="/staff" icon={<ArrowLeft />} className="assistant-page__back">Quay lại dashboard nhân viên</LinkButton>
      <Typography.Text strong className="assistant-page__eyebrow">CÔNG CỤ HỖ TRỢ KIỂM DUYỆT</Typography.Text>
      <Typography.Title level={1}>Checklist tham khảo</Typography.Title>
      <Typography.Paragraph>AI chỉ nhận mã loại, lý do và trạng thái báo cáo. Không gửi mô tả, bằng chứng hoặc thông tin cá nhân.</Typography.Paragraph>
      <Alert className="assistant-page__notice" type="info" showIcon role="note" title="Đây chỉ là gợi ý chung. Nhân viên phải tự xem xét hồ sơ nội bộ và đưa ra quyết định cuối cùng." />
      {loading && (
        <Flex gap={12} role="status">
          <Spin />
          <Typography.Text type="secondary">Đang tạo checklist...</Typography.Text>
        </Flex>
      )}
      {error && <Alert type="error" showIcon role="alert" title={error} />}
      {guidance && <Card className="assistant-page__answer">{guidance}</Card>}
    </section>
  );
}

function AssistantChat() {
  const [messages, setMessages] = useState(loadThread);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const threadRef = useRef(null);
  const inputRef = useRef(null);
  const requestRef = useRef(0);

  useEffect(() => { saveThread(messages); }, [messages]);

  useEffect(() => {
    const thread = threadRef.current;
    if (thread) thread.scrollTop = thread.scrollHeight;
  }, [messages, loading, error]);

  async function ask(history) {
    const requestId = requestRef.current + 1;
    requestRef.current = requestId;
    setLoading(true);
    setError('');
    try {
      const result = await assistantService.chat({ messages: toPayload(history) });
      if (requestRef.current !== requestId) return;
      setMessages([...history, {
        id: newMessageId(),
        role: 'assistant',
        content: result.answer,
        products: result.products || [],
        degraded: Boolean(result.degraded)
      }]);
    } catch (failure) {
      if (requestRef.current === requestId) setError(failure.message || 'Không thể nhận phản hồi từ trợ lý lúc này.');
    } finally {
      if (requestRef.current === requestId) setLoading(false);
    }
  }

  function send(text) {
    const content = text.trim();
    if (!content || loading) return;
    const history = [...messages, { id: newMessageId(), role: 'user', content }];
    setMessages(history);
    setInput('');
    ask(history);
  }

  function reset() {
    requestRef.current += 1;
    setMessages([]);
    setInput('');
    setError('');
    setLoading(false);
    inputRef.current?.focus();
  }

  function handleKeyDown(event) {
    if (event.key !== 'Enter' || event.shiftKey || event.nativeEvent?.isComposing) return;
    event.preventDefault();
    send(input);
  }

  return (
    <section className="assistant-chat container">
      <Flex justify="space-between" align="center" gap={12} className="assistant-chat__header">
        <Flex align="center" gap={12} className="assistant-chat__identity">
          <Avatar size={44} className="assistant-chat__avatar assistant-chat__avatar--large" icon={<Sparkle weight="fill" />} aria-hidden="true" />
          <div>
            <Typography.Title level={1}>Trợ lý SecondSafe</Typography.Title>
            <Typography.Text type="secondary">Tư vấn chọn đồ, giải đáp cách mua bán và thanh toán trên SecondSafe.</Typography.Text>
          </div>
        </Flex>
        <Button onClick={reset} disabled={!messages.length && !input}>Cuộc trò chuyện mới</Button>
      </Flex>

      <Alert
        className="assistant-chat__notice"
        type="info"
        showIcon
        role="note"
        title="Tin nhắn của bạn được ẩn email, số điện thoại, dãy số dài và liên kết rồi gửi tới Google Gemini để tạo câu trả lời. Không nhập mật khẩu, OTP, thông tin ngân hàng hay địa chỉ nhà."
      />

      <div className="assistant-chat__thread" ref={threadRef} role="log" aria-live="polite" aria-label="Cuộc trò chuyện với trợ lý">
        {messages.length === 0 && (
          <Flex vertical align="center" gap={12} className="assistant-chat__welcome">
            <Typography.Paragraph>Xin chào! Bạn đang tìm món đồ nào, hay cần hỏi gì về cách mua bán?</Typography.Paragraph>
            <Flex wrap justify="center" gap={8} className="assistant-chat__starters">
              {STARTERS.map(starter => (
                <Button key={starter} shape="round" disabled={loading} onClick={() => send(starter)}>{starter}</Button>
              ))}
            </Flex>
          </Flex>
        )}
        {messages.length > 0 && (
          <ul className="assistant-chat__messages">
            {messages.map(message => <AssistantMessage message={message} key={message.id} />)}
          </ul>
        )}
        {loading && (
          <Flex align="center" gap={10} className="assistant-chat__typing" role="status">
            <Spin size="small" />
            <Typography.Text type="secondary">Trợ lý đang soạn câu trả lời...</Typography.Text>
          </Flex>
        )}
        {error && (
          <Alert
            className="assistant-chat__error"
            type="error"
            showIcon
            role="alert"
            title={error}
            action={<Button size="small" disabled={loading} onClick={() => ask(messages)}>Thử lại</Button>}
          />
        )}
      </div>

      <Form className="assistant-chat__composer" onFinish={() => send(input)}>
        <label htmlFor="assistant-input" className="assistant-chat__label">Câu hỏi</label>
        <Input.TextArea
          id="assistant-input"
          ref={inputRef}
          value={input}
          maxLength={600}
          autoSize={{ minRows: 1, maxRows: 5 }}
          onChange={event => setInput(event.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Nhập câu hỏi cho trợ lý..."
        />
        <Button type="primary" htmlType="submit" disabled={loading || !input.trim()}>Gửi</Button>
      </Form>
      <Flex justify="space-between" wrap gap={8} className="assistant-chat__footer">
        <Typography.Text type="secondary">{input.length}/600</Typography.Text>
        <Typography.Text type="secondary">Cần nhân viên hỗ trợ? <Link to="/support">Mở cuộc trò chuyện hỗ trợ</Link></Typography.Text>
      </Flex>
    </section>
  );
}

export default function Assistant({ moderation = false }) {
  if (!isSignedIn()) {
    return (
      <section className="assistant-page container">
        <Typography.Title level={1}>Trợ lý SecondSafe</Typography.Title>
        <Typography.Paragraph>Vui lòng đăng nhập để sử dụng trợ lý AI.</Typography.Paragraph>
        <LinkButton type="primary" to="/login">Đăng nhập</LinkButton>
      </section>
    );
  }
  return moderation ? <ModerationGuidance /> : <AssistantChat />;
}
