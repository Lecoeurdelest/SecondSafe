import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import favoriteService from '../../services/favorite.service';
import { getProductImageUrl, handleImageError } from '../../utils/imageHelper';
import LinkButton from '../../ui/LinkButton';
import './Favorites.css';
import { Alert, Button, Card, Col, Empty, Flex, Pagination, Popconfirm, Row, Spin, Statistic, Tag, Typography } from 'antd';
import { Heart } from '@phosphor-icons/react';

function hasSession() {
  try {
    return Boolean(window.localStorage.getItem('token'));
  } catch {
    return false;
  }
}

const Favorites = () => {
  const [favorites, setFavorites] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0
  });

  // ✅ FIX: dùng useCallback
  const fetchFavorites = useCallback(async () => {
    try {
      setLoading(true);
      setError('');

      const res = await favoriteService.getFavorites({
        page: pagination.page,
        limit: pagination.limit
      });

      const data = res.data?.data || res.data;

      setFavorites(data.favorites || []);
      setPagination(prev => ({
        ...prev,
        total: data.total || 0,
        totalPages: data.totalPages || 0
      }));

    } catch (failure) {
      setError(failure.message || 'Không thể tải danh sách yêu thích.');
    } finally {
      setLoading(false);
    }
  }, [pagination.page, pagination.limit]);

  useEffect(() => {
    if (!hasSession()) {
      setLoading(false);
      return;
    }

    fetchFavorites();
  }, [fetchFavorites]);

  const handleRemoveFavorite = async (id) => {
    try {
      await favoriteService.removeFavorite(id);

      // reload lại data
      fetchFavorites();

    } catch (failure) {
      setError(failure.message || 'Không thể xóa sản phẩm khỏi danh sách yêu thích.');
    }
  };

  const formatPrice = (price) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(price);
  };

  if (loading && favorites.length === 0) {
    return (
      <div className="favorites-container container">
        <Flex vertical align="center" gap={12} className="favorites-loading" role="status">
          <Spin size="large" />
          <Typography.Text type="secondary">Đang tải danh sách tin đã lưu...</Typography.Text>
        </Flex>
      </div>
    );
  }

  if (!hasSession()) {
    return (
      <div className="favorites-container container">
        <Typography.Title level={1}>Tin đã lưu</Typography.Title>
        <Alert type="info" showIcon role="status" title="Đăng nhập để xem danh sách sản phẩm yêu thích." />
        <LinkButton type="link" to="/">Khám phá sản phẩm</LinkButton>
      </div>
    );
  }

  return (
    <div className="favorites-container container">
      <Flex justify="space-between" align="center" wrap gap={16} className="favorites-header">
        <div>
          <Typography.Title level={1}>Tin đã lưu</Typography.Title>
          <Typography.Text type="secondary">Quản lý nhanh các sản phẩm bạn đang quan tâm</Typography.Text>
        </div>
        <Statistic className="favorites-stat" title="sản phẩm" value={pagination.total} />
      </Flex>

      {error && <Alert className="favorites-error" type="error" showIcon role="alert" title={error} />}

      {favorites.length === 0 ? (
        <Empty
          className="favorites-empty"
          image={<Heart size={56} />}
          description={(
            <Flex vertical gap={4}>
              <Typography.Title level={2}>Chưa có tin đã lưu</Typography.Title>
              <Typography.Text type="secondary">Hãy khám phá sản phẩm và nhấn lưu để xem lại tại đây.</Typography.Text>
            </Flex>
          )}
        >
          <LinkButton type="primary" to="/">Khám phá sản phẩm</LinkButton>
        </Empty>
      ) : (
        <>
          <Row gutter={[{ xs: 10, md: 20 }, { xs: 10, md: 20 }]} className="favorites-grid">
            {favorites.map(fav => {
              const p = fav.product;
              if (!p) return null;

              return (
                <Col key={fav._id} xs={12} md={8} lg={6}>
                  <Card
                    className="favorite-card"
                    hoverable
                    cover={(
                      <Link to={`/product/${p._id}`} className="favorite-card__image">
                        <img
                          src={getProductImageUrl(p)}
                          alt={p.title}
                          loading="lazy"
                          onError={(e) => handleImageError(e, 'product')}
                        />
                        <Tag className="favorite-card__badge" variant="solid">Đã lưu</Tag>
                      </Link>
                    )}
                    actions={[
                      <Popconfirm
                        key="remove"
                        title="Xóa khỏi yêu thích?"
                        okText="Bỏ lưu"
                        cancelText="Hủy"
                        onConfirm={() => handleRemoveFavorite(p._id)}
                      >
                        <Button type="text" danger title="Xóa khỏi yêu thích">Bỏ lưu</Button>
                      </Popconfirm>
                    ]}
                  >
                    <Link to={`/product/${p._id}`} className="favorite-card__info">
                      <Typography.Text className="favorite-card__title">{p.title}</Typography.Text>
                      <Typography.Text strong className="favorite-card__price">{formatPrice(Number(p.price || 0))}</Typography.Text>
                      <Flex gap={8} className="favorite-card__meta">
                        <Typography.Text type="secondary">{p.location?.district || 'N/A'}</Typography.Text>
                        <Typography.Text type="secondary">{p.location?.city || 'N/A'}</Typography.Text>
                      </Flex>
                      <Typography.Text type="secondary">
                        Người bán: <strong>{p.seller?.fullName || 'N/A'}</strong>
                      </Typography.Text>
                    </Link>
                  </Card>
                </Col>
              );
            })}
          </Row>

          <Pagination
            className="favorites-pagination"
            align="center"
            hideOnSinglePage
            showSizeChanger={false}
            current={pagination.page}
            pageSize={pagination.limit}
            total={pagination.total}
            onChange={page => setPagination(prev => ({ ...prev, page }))}
          />
        </>
      )}
    </div>
  );
};

export default Favorites;