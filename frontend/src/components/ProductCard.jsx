import React from 'react';
import { Link } from 'react-router-dom';
import { Card, Flex, Tag, Typography } from 'antd';
import { Camera } from '@phosphor-icons/react';
import { getProductImageUrl, handleImageError } from '../utils/imageHelper';
import './ProductComponents.css';

const PRICE_FORMAT = new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' });

function formatDate(date) {
  const diffDays = Math.floor(Math.abs(new Date() - new Date(date)) / (1000 * 60 * 60 * 24));
  if (diffDays === 0) return 'Hôm nay';
  if (diffDays === 1) return 'Hôm qua';
  if (diffDays < 7) return `${diffDays} ngày trước`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)} tuần trước`;
  return `${Math.floor(diffDays / 30)} tháng trước`;
}

function ProductCard({ product }) {
  if (!product) return null;

  const { _id, title, price, images, location, createdAt } = product;
  const isIllustration = !images?.some(image => (
    typeof image === 'string'
    && image.trim()
    && !image.endsWith('/placeholders/product-placeholder.svg')
  ));

  const cover = (
    <div className="listing-card__image">
      <img
        src={getProductImageUrl(product)}
        alt={isIllustration ? `${title} (ảnh minh họa)` : title}
        onError={(event) => handleImageError(event, 'product')}
      />
      {isIllustration && <Tag className="listing-card__badge listing-card__badge--label" variant="solid">Ảnh minh họa</Tag>}
      {images && images.length > 1 && (
        <Tag className="listing-card__badge listing-card__badge--count" variant="solid" icon={<Camera />}>{images.length}</Tag>
      )}
    </div>
  );

  return (
    <Link id={`product-${_id}`} to={`/product/${_id}`} className="listing-link">
      <Card hoverable className="listing-card" cover={cover}>
        <Typography.Title level={3} className="listing-card__title">{title}</Typography.Title>
        <Typography.Text strong className="listing-card__price">{PRICE_FORMAT.format(price)}</Typography.Text>
        <Flex justify="space-between" align="center" gap={8} className="listing-card__meta">
          <Typography.Text type="secondary" className="listing-card__city">{location?.city}</Typography.Text>
          <Typography.Text type="secondary" className="listing-card__date">{formatDate(createdAt)}</Typography.Text>
        </Flex>
      </Card>
    </Link>
  );
}

export default ProductCard;
