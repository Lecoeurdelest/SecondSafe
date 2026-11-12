import React from 'react';
import { useParams } from 'react-router-dom';
import { Typography } from 'antd';
import ReviewList from '../review/ReviewList';
import './UserReviews.css';

const UserReviews = () => {
  const { userId } = useParams();

  return (
    <div className="user-reviews-container container">
      <div className="user-reviews__header">
        <Typography.Title level={1}>Đánh giá người bán</Typography.Title>
        <Typography.Paragraph type="secondary">Xem các đánh giá từ người mua khác</Typography.Paragraph>
      </div>
      
      <ReviewList userId={userId} showStats={true} />
    </div>
  );
};

export default UserReviews;