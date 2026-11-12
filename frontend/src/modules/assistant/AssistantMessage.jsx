import React from 'react';
import { Link } from 'react-router-dom';
import { getProductImageUrl, handleImageError } from '../../utils/imageHelper';

const CONDITION_LABELS = { new: 'Mới', 'like-new': 'Như mới', good: 'Tốt', fair: 'Khá', poor: 'Cũ' };

function formatPrice(value) {
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(value || 0);
}

function inline(text) {
  return text.split(/(\*\*[^*]+\*\*)/g).map((part, index) => (
    part.length > 4 && part.startsWith('**') && part.endsWith('**')
      ? <strong key={index}>{part.slice(2, -2)}</strong>
      : part
  ));
}

export function renderRichText(text) {
  const blocks = [];
  let items = [];
  const flush = () => {
    if (!items.length) return;
    blocks.push(<ul key={`list-${blocks.length}`}>{items.map((item, index) => <li key={index}>{inline(item)}</li>)}</ul>);
    items = [];
  };
  text.split('\n').forEach(line => {
    const bullet = line.match(/^\s*[-*•]\s+(.*)$/);
    if (bullet) {
      items.push(bullet[1]);
      return;
    }
    flush();
    if (line.trim()) blocks.push(<p key={`text-${blocks.length}`}>{inline(line)}</p>);
  });
  flush();
  return blocks;
}

function ProductCard({ product }) {
  return (
    <Link to={`/product/${product.id}`} className="assistant-chat__product">
      <img
        src={getProductImageUrl({ images: product.image ? [product.image] : [] })}
        alt=""
        onError={event => handleImageError(event, 'product')}
      />
      <span>
        <strong>{product.title}</strong>
        <small>{product.category} · {CONDITION_LABELS[product.condition] || product.condition}</small>
        <b>{formatPrice(product.priceVnd)}</b>
      </span>
    </Link>
  );
}

export default function AssistantMessage({ message }) {
  const mine = message.role === 'user';
  const products = message.products || [];
  return (
    <li className={`assistant-chat__message${mine ? ' is-mine' : ''}`}>
      {!mine && <span className="assistant-chat__avatar" aria-hidden="true">✦</span>}
      <div className="assistant-chat__body">
        <div className="assistant-chat__bubble">{mine ? <p>{message.content}</p> : renderRichText(message.content)}</div>
        {message.degraded && <small className="assistant-chat__hint">Trợ lý AI đang bận nên đây là câu trả lời có sẵn.</small>}
        {products.length > 0 && (
          <div className="assistant-chat__products">
            {products.map(product => <ProductCard product={product} key={product.id} />)}
          </div>
        )}
      </div>
    </li>
  );
}
