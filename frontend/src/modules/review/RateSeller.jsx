import React, { useState } from 'react';
import { Alert, Avatar, Button, Flex, Form, Input, Modal, Rate, Typography } from 'antd';
import { createReview } from '../../services/review.service';
import { uploadEvidenceMedia } from '../../services/report.service';
import { getImageUrl } from '../../utils/imageHelper';
import EvidencePicker from '../../components/EvidencePicker';
import '../../components/ReportModal.css';

const RATING_TEXTS = {
  1: 'Rất không hài lòng',
  2: 'Không hài lòng',
  3: 'Bình thường',
  4: 'Hài lòng',
  5: 'Rất hài lòng'
};

const isVideoEvidence = (url = '') => /\.(mp4)$/i.test(url);

const RateSeller = ({ order, onSuccess, onCancel }) => {
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [evidenceFiles, setEvidenceFiles] = useState([]);
  const [hoveredRating, setHoveredRating] = useState(0);
  const [uploadingEvidence, setUploadingEvidence] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleEvidenceUpload = async (e) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;

    const remainingSlots = Math.max(0, 5 - evidenceFiles.length);
    if (remainingSlots <= 0) {
      setError('Tối đa 5 tệp bằng chứng cho mỗi đánh giá');
      e.target.value = '';
      return;
    }

    setUploadingEvidence(true);
    setError('');
    try {
      const uploaded = await uploadEvidenceMedia(files.slice(0, remainingSlots));
      setEvidenceFiles((prev) => [...prev, ...uploaded].slice(0, 5));
    } catch (uploadError) {
      setError(uploadError.message || 'Không thể upload ảnh/video minh chứng');
    } finally {
      setUploadingEvidence(false);
      e.target.value = '';
    }
  };

  const removeEvidence = (index) => {
    setEvidenceFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    if (rating === 0) {
      setError('Vui lòng chọn số sao đánh giá');
      return;
    }

    setLoading(true);
    setError('');

    try {
      await createReview(order._id, rating, comment, evidenceFiles);
      onSuccess && onSuccess();
    } catch (error) {
      setError(error.response?.data?.message || 'Có lỗi xảy ra khi đánh giá');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal open centered footer={null} title="Đánh giá người bán" width={560} onCancel={onCancel} maskClosable={false}>
      <Flex vertical gap={12} className="report-subject">
        <Flex gap={12} align="center">
          <img
            src={getImageUrl(order?.listing?.images?.[0]) || '/images/placeholders/product-placeholder.svg'}
            alt={order.listing?.title}
            onError={(event) => {
              event.currentTarget.onerror = null;
              event.currentTarget.src = '/images/placeholders/product-placeholder.svg';
            }}
          />
          <div className="report-subject__body">
            <Typography.Title level={4}>{order.listing?.title}</Typography.Title>
            <Typography.Text strong>{order.agreedPrice?.toLocaleString('vi-VN')} VNĐ</Typography.Text>
          </div>
        </Flex>
        <Flex gap={8} align="center">
          <Avatar
            src={getImageUrl(order?.seller?.avatar) || '/images/placeholders/avatar-placeholder.svg'}
            alt={order.seller?.fullName}
          />
          <Typography.Text strong>{order.seller?.fullName}</Typography.Text>
        </Flex>
      </Flex>

      <Form layout="vertical" onFinish={handleSubmit} className="report-form">
        <Form.Item label="Đánh giá của bạn">
          <Flex align="center" gap={12} wrap>
            <Rate value={rating} onChange={setRating} onHoverChange={(value) => setHoveredRating(value || 0)} />
            <Typography.Text type="secondary">{RATING_TEXTS[hoveredRating || rating] || ''}</Typography.Text>
          </Flex>
        </Form.Item>

        <Form.Item label="Nhận xét (tùy chọn)" htmlFor="comment">
          <Input.TextArea
            id="comment"
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="Chia sẻ trải nghiệm của bạn về người bán này..."
            rows={4}
            maxLength={500}
            showCount
          />
        </Form.Item>

        <Form.Item label="Ảnh/Video minh chứng (tùy chọn)" htmlFor="review-evidence">
          <EvidencePicker
            id="review-evidence"
            files={evidenceFiles}
            accept=".png,.jpg,.jpeg,.mp4,image/png,image/jpeg,video/mp4"
            buttonLabel="Chọn tệp"
            disabled={loading}
            uploading={uploadingEvidence}
            isVideo={isVideoEvidence}
            imageAlt={(index) => `review-evidence-${index}`}
            notes={[
              'PNG/JPG/JPEG hoặc MP4 (H.264), ≤100MB, ≤3 phút, 720p-1080p.',
              'Video cần quay mở hộp liên tục, không chỉnh sửa.'
            ]}
            onSelect={handleEvidenceUpload}
            onRemove={removeEvidence}
          />
        </Form.Item>

        {error && <Alert className="report-error" type="error" showIcon role="alert" title={error} />}

        <Flex justify="flex-end" gap={12} className="report-actions">
          <Button onClick={onCancel} disabled={loading}>Hủy</Button>
          <Button type="primary" htmlType="submit" disabled={loading || rating === 0 || uploadingEvidence}>
            {loading ? 'Đang gửi...' : 'Gửi đánh giá'}
          </Button>
        </Flex>
      </Form>
    </Modal>
  );
};

export default RateSeller;
