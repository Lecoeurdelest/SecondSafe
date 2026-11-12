import React from 'react';
import { Link } from 'react-router-dom';
import { Avatar, Card, Flex, Typography } from 'antd';
import { getProductImageUrl, handleImageError } from '../../utils/imageHelper';
import { Sparkle } from '@phosphor-icons/react';

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
      <Card size="small" hoverable>
        <Flex gap={12} align="center">
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
        </Flex>
      </Card>
    </Link>
  );
}

export default function AssistantMessage({ message }) {
  const mine = message.role === 'user';
  const products = message.products || [];
  return (
    <li className={`assistant-chat__message${mine ? ' is-mine' : ''}`}>
      {!mine && <Avatar className="assistant-chat__avatar" icon={<Sparkle weight="fill" />} aria-hidden="true" />}
      <div className="assistant-chat__body">
        <div className="assistant-chat__bubble">{mine ? <p>{message.content}</p> : renderRichText(message.content)}</div>
        {message.degraded && <Typography.Text type="secondary" className="assistant-chat__hint">Trợ lý AI đang bận nên đây là câu trả lời có sẵn.</Typography.Text>}
        {products.length > 0 && (
          <div className="assistant-chat__products">
            {products.map(product => <ProductCard product={product} key={product.id} />)}
          </div>
        )}
      </div>
    </li>
  );
}
