import React, { useState, useEffect, useCallback } from 'react';
import { getReviews, getRatingStats } from '../../services/review.service';
import { getImageUrl } from '../../utils/imageHelper';
import './ReviewList.css';
import { Alert, Avatar, Card, Empty, Flex, Pagination, Rate, Select, Spin, Statistic, Typography } from 'antd';

const RATING_OPTIONS = [
  { value: '', label: 'Tất cả đánh giá' },
  { value: '5', label: '5 sao' },
  { value: '4', label: '4 sao' },
  { value: '3', label: '3 sao' },
  { value: '2', label: '2 sao' },
  { value: '1', label: '1 sao' }
];

const ReviewList = ({ userId, showStats = true }) => {
  const [reviews, setReviews] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedRating, setSelectedRating] = useState('');

  const fetchReviews = useCallback(async () => {
    try {
      setLoading(true);
      const filters = selectedRating ? { rating: selectedRating } : {};
      const pagination = { page: currentPage, limit: 10 };
      
      const response = await getReviews(userId, filters, pagination);
      setReviews(response.data.reviews);
      setTotalPages(response.data.pagination.totalPages);
    } catch (error) {
      setError('Không thể tải đánh giá');
    } finally {
      setLoading(false);
    }
  }, [userId, currentPage, selectedRating]);

  const fetchStats = useCallback(async () => {
    try {
      const response = await getRatingStats(userId);
      setStats(response.data);
    } catch (error) {
      console.error('Error fetching rating stats:', error);
    }
  }, [userId]);

  useEffect(() => {
    fetchReviews();
    if (showStats) fetchStats();
  }, [fetchReviews, fetchStats, showStats]);

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('vi-VN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const isVideoEvidence = (url = '') => /\.(mp4)$/i.test(url);

  const extractReviewMediaFiles = (review) => {
    const candidates = [
      review?.evidenceFiles,
      review?.evidenceImages,
      review?.media,
      review?.attachments,
      review?.data?.evidenceFiles,
      review?.data?.evidenceImages
    ];

    const merged = candidates
      .filter(Array.isArray)
      .flat()
      .map((item) => String(item || '').trim())
      .filter(Boolean);

    return Array.from(new Set(merged));
  };



  if (loading && currentPage === 1) {
    return (
      <Flex justify="center" gap={12} className="review-list__loading" role="status">
        <Spin />
        <Typography.Text type="secondary">Đang tải đánh giá...</Typography.Text>
      </Flex>
    );
  }

  return (
    <div className="review-list">
      {showStats && stats && (
        <Card className="rating-summary">
          <Flex vertical align="center" gap={8}>
            <Statistic className="score" value={stats.averageRating.toFixed(1)} formatter={(value) => value} />
            <Rate disabled value={Math.round(stats.averageRating)} aria-label={`${stats.averageRating.toFixed(1)} trên 5 sao`} />
            <Typography.Text type="secondary" className="total-reviews">({stats.totalReviews} đánh giá)</Typography.Text>
          </Flex>
        </Card>
      )}

      <Flex justify="flex-end" className="review-filters">
        <Select
          className="rating-filter"
          aria-label="Lọc theo số sao"
          value={selectedRating}
          options={RATING_OPTIONS}
          onChange={(value) => {
            setSelectedRating(value);
            setCurrentPage(1);
          }}
        />
      </Flex>

      {error && <Alert className="review-list__error" type="error" showIcon role="alert" title={error} />}

      <Flex vertical gap={12} className="reviews">
        {reviews.length === 0 ? (
          <Empty
            image={Empty.PRESENTED_IMAGE_SIMPLE}
            description={selectedRating ? `Không có đánh giá ${selectedRating} sao` : 'Chưa có đánh giá nào'}
          />
        ) : (
          reviews.map(review => {
            const media = extractReviewMediaFiles(review);
            return (
              <Card key={review._id} className="review-item">
                <Flex justify="space-between" align="flex-start" wrap gap={8} className="review-header">
                  <Flex align="center" gap={12} className="reviewer-info">
                    <Avatar
                      src={review.reviewerId?.avatar || '/default-avatar.png'}
                      alt={review.reviewerId?.fullName}
                    />
                    <div className="reviewer-details">
                      <Typography.Text strong className="reviewer-name">{review.reviewerId?.fullName}</Typography.Text>
                      <div><Rate disabled value={review.rating} className="review-rating" /></div>
                    </div>
                  </Flex>
                  <Typography.Text type="secondary" className="review-date">{formatDate(review.createdAt)}</Typography.Text>
                </Flex>

                {review.comment && <Typography.Paragraph className="review-comment">{review.comment}</Typography.Paragraph>}

                {media.length > 0 && (
                  <Flex wrap gap={10} className="review-evidence-grid">
                    {media.map((file, index) => (
                      <div key={`${file}-${index}`} className="review-evidence-item">
                        {isVideoEvidence(file) ? (
                          <video src={getImageUrl(file)} controls className="review-evidence-media" />
                        ) : (
                          <img src={getImageUrl(file)} alt={`review-evidence-${index}`} className="review-evidence-media" />
                        )}
                      </div>
                    ))}
                  </Flex>
                )}

                {review.productId && (
                  <Flex align="center" gap={10} className="reviewed-product">
                    <img
                      src={getImageUrl(review.productId.images?.[0]) || '/images/placeholder.png'}
                      alt={review.productId.title}
                      className="product-thumb"
                    />
                    <Typography.Text className="product-title">{review.productId.title}</Typography.Text>
                  </Flex>
                )}
              </Card>
            );
          })
        )}
      </Flex>

      <Pagination
        className="review-list__pagination"
        align="center"
        hideOnSinglePage
        showSizeChanger={false}
        current={currentPage}
        pageSize={10}
        total={totalPages * 10}
        onChange={setCurrentPage}
      />
    </div>
  );
};

export default ReviewList;
