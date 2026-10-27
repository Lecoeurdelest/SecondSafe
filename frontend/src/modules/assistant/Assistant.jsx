import React, { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import assistantService from '../../services/assistant.service';
import { getProductImageUrl } from '../../utils/imageHelper';
import './Assistant.css';

function isSignedIn() {
  try { return Boolean(window.localStorage.getItem('token')); } catch { return false; }
}

function formatPrice(value) {
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(value || 0);
}

export default function Assistant({ moderation = false }) {
  const { reportId } = useParams();
  const [mode, setMode] = useState('products');
  const [question, setQuestion] = useState('');
  const [answer, setAnswer] = useState('');
  const [products, setProducts] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!moderation || !reportId) return undefined;
    let active = true;
    setLoading(true);
    assistantService.getModerationGuidance(reportId)
      .then(result => { if (active) setAnswer(result.guidance); })
      .catch(failure => { if (active) setError(failure.message || 'Không thể tạo checklist kiểm duyệt.'); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [moderation, reportId]);

  async function handleSubmit(event) {
    event.preventDefault();
    if (!question.trim()) return;
    setLoading(true);
    setError('');
    setAnswer('');
    setProducts([]);
    try {
      const result = await assistantService.ask({ message: question, mode });
      setAnswer(result.answer);
      setProducts(result.products || []);
    } catch (failure) {
      setError(failure.message || 'Không thể nhận phản hồi từ trợ lý lúc này.');
    } finally {
      setLoading(false);
    }
  }

  if (!isSignedIn()) {
    return (
      <section className="assistant-page container">
        <h1>Trợ lý SecondSafe</h1>
        <p>Vui lòng đăng nhập để sử dụng trợ lý AI.</p>
        <Link to="/login">Đăng nhập</Link>
      </section>
    );
  }

  if (moderation) {
    return (
      <section className="assistant-page container">
        <Link to="/staff">← Quay lại dashboard nhân viên</Link>
        <p className="assistant-page__eyebrow">CÔNG CỤ HỖ TRỢ KIỂM DUYỆT</p>
        <h1>Checklist tham khảo</h1>
        <p>AI chỉ nhận mã loại, lý do và trạng thái báo cáo. Không gửi mô tả, bằng chứng hoặc thông tin cá nhân.</p>
        <p className="assistant-page__notice">Đây chỉ là gợi ý chung. Nhân viên phải tự xem xét hồ sơ nội bộ và đưa ra quyết định cuối cùng.</p>
        {loading && <p role="status">Đang tạo checklist...</p>}
        {error && <p className="assistant-page__error" role="alert">{error}</p>}
        {answer && <div className="assistant-page__answer">{answer}</div>}
      </section>
    );
  }

  return (
    <section className="assistant-page container">
      <p className="assistant-page__eyebrow">SECOND SAFE · TRỢ LÝ AI</p>
      <h1>Tìm món phù hợp, hỏi điều cần biết</h1>
      <p>Trợ lý dùng Gemini để tư vấn sản phẩm đang bán và trả lời câu hỏi chung về SecondSafe.</p>
      <div className="assistant-page__notice" role="note">
        Câu hỏi gốc được xử lý nội bộ; Google Gemini chỉ nhận chủ đề FAQ đã chuẩn hóa hoặc thuộc tính sản phẩm không định danh. Không nhập mật khẩu, OTP, thông tin ngân hàng, địa chỉ hoặc nội dung chat riêng.
      </div>
      <form className="assistant-page__form" onSubmit={handleSubmit}>
        <label htmlFor="assistant-mode">Bạn cần trợ giúp về</label>
        <select id="assistant-mode" value={mode} onChange={event => setMode(event.target.value)}>
          <option value="products">Tư vấn và tìm sản phẩm</option>
          <option value="faq">Câu hỏi thường gặp</option>
        </select>
        <label htmlFor="assistant-question">Câu hỏi</label>
        <textarea
          id="assistant-question"
          value={question}
          maxLength={600}
          onChange={event => setQuestion(event.target.value)}
          placeholder="Ví dụ: Mình cần balo đi học dưới 300.000đ..."
          required
        />
        <div className="assistant-page__form-footer">
          <span>{question.length}/600</span>
          <button type="submit" disabled={loading || !question.trim()}>{loading ? 'Đang tìm...' : 'Hỏi trợ lý'}</button>
        </div>
      </form>
      {error && <p className="assistant-page__error" role="alert">{error}</p>}
      {loading && <p role="status">Đang chuẩn bị câu trả lời...</p>}
      {answer && <div className="assistant-page__answer"><h2>Trợ lý trả lời</h2><p>{answer}</p></div>}
      {products.length > 0 && (
        <div className="assistant-page__products">
          {products.map(product => (
            <Link to={`/product/${product.id}`} className="assistant-page__product" key={product.id}>
              <img src={getProductImageUrl({ images: product.image ? [product.image] : [] })} alt="" />
              <span><strong>{product.title}</strong><small>{product.category} · {product.condition}</small><b>{formatPrice(product.priceVnd)}</b></span>
            </Link>
          ))}
        </div>
      )}
      <p className="assistant-page__support-link">Cần nhân viên hỗ trợ? <Link to="/support">Mở cuộc trò chuyện hỗ trợ</Link></p>
    </section>
  );
}
