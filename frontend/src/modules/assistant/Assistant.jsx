import React, { useEffect, useRef, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import assistantService from '../../services/assistant.service';
import AssistantMessage from './AssistantMessage';
import { loadThread, newMessageId, saveThread, toPayload } from './assistantThread';
import './Assistant.css';
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
      <Link to="/staff"><ArrowLeft /> Quay lại dashboard nhân viên</Link>
      <p className="assistant-page__eyebrow">CÔNG CỤ HỖ TRỢ KIỂM DUYỆT</p>
      <h1>Checklist tham khảo</h1>
      <p>AI chỉ nhận mã loại, lý do và trạng thái báo cáo. Không gửi mô tả, bằng chứng hoặc thông tin cá nhân.</p>
      <p className="assistant-page__notice">Đây chỉ là gợi ý chung. Nhân viên phải tự xem xét hồ sơ nội bộ và đưa ra quyết định cuối cùng.</p>
      {loading && <p role="status">Đang tạo checklist...</p>}
      {error && <p className="assistant-page__error" role="alert">{error}</p>}
      {guidance && <div className="assistant-page__answer">{guidance}</div>}
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
    if (inputRef.current) inputRef.current.style.height = 'auto';
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

  function handleChange(event) {
    setInput(event.target.value);
    event.target.style.height = 'auto';
    event.target.style.height = `${Math.min(event.target.scrollHeight, 140)}px`;
  }

  function handleKeyDown(event) {
    if (event.key !== 'Enter' || event.shiftKey || event.nativeEvent?.isComposing) return;
    event.preventDefault();
    send(input);
  }

  return (
    <section className="assistant-chat container">
      <header className="assistant-chat__header">
        <div className="assistant-chat__identity">
          <span className="assistant-chat__avatar assistant-chat__avatar--large" aria-hidden="true"><Sparkle weight="fill" /></span>
          <div>
            <h1>Trợ lý SecondSafe</h1>
            <p>Tư vấn chọn đồ, giải đáp cách mua bán và thanh toán trên SecondSafe.</p>
          </div>
        </div>
        <button type="button" className="assistant-chat__reset" onClick={reset} disabled={!messages.length && !input}>
          Cuộc trò chuyện mới
        </button>
      </header>

      <div className="assistant-chat__notice" role="note">
        Tin nhắn của bạn được ẩn email, số điện thoại, dãy số dài và liên kết rồi gửi tới Google Gemini để tạo câu trả lời. Không nhập mật khẩu, OTP, thông tin ngân hàng hay địa chỉ nhà.
      </div>

      <div className="assistant-chat__thread" ref={threadRef} role="log" aria-live="polite" aria-label="Cuộc trò chuyện với trợ lý">
        {messages.length === 0 && (
          <div className="assistant-chat__welcome">
            <p>Xin chào! Bạn đang tìm món đồ nào, hay cần hỏi gì về cách mua bán?</p>
            <div className="assistant-chat__starters">
              {STARTERS.map(starter => (
                <button type="button" key={starter} disabled={loading} onClick={() => send(starter)}>{starter}</button>
              ))}
            </div>
          </div>
        )}
        {messages.length > 0 && (
          <ul className="assistant-chat__messages">
            {messages.map(message => <AssistantMessage message={message} key={message.id} />)}
          </ul>
        )}
        {loading && (
          <p className="assistant-chat__typing" role="status">
            <span aria-hidden="true"><i /><i /><i /></span>
            Trợ lý đang soạn câu trả lời...
          </p>
        )}
        {error && (
          <div className="assistant-chat__error" role="alert">
            <span>{error}</span>
            <button type="button" onClick={() => ask(messages)} disabled={loading}>Thử lại</button>
          </div>
        )}
      </div>

      <form className="assistant-chat__composer" onSubmit={event => { event.preventDefault(); send(input); }}>
        <label htmlFor="assistant-input" className="assistant-chat__label">Câu hỏi</label>
        <textarea
          id="assistant-input"
          ref={inputRef}
          rows={1}
          value={input}
          maxLength={600}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          placeholder="Nhập câu hỏi cho trợ lý..."
        />
        <button type="submit" disabled={loading || !input.trim()}>Gửi</button>
      </form>
      <p className="assistant-chat__footer">
        <span>{input.length}/600</span>
        <span>Cần nhân viên hỗ trợ? <Link to="/support">Mở cuộc trò chuyện hỗ trợ</Link></span>
      </p>
    </section>
  );
}

export default function Assistant({ moderation = false }) {
  if (!isSignedIn()) {
    return (
      <section className="assistant-page container">
        <h1>Trợ lý SecondSafe</h1>
        <p>Vui lòng đăng nhập để sử dụng trợ lý AI.</p>
        <Link to="/login">Đăng nhập</Link>
      </section>
    );
  }
  return moderation ? <ModerationGuidance /> : <AssistantChat />;
}
