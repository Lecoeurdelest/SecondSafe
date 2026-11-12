import React, { useState } from 'react';
import { confirmReceipt } from '../../services/order.service';
import { createReview } from '../../services/review.service';
import { uploadEvidenceMedia } from '../../services/report.service';
import { getImageUrl } from '../../utils/imageHelper';
import EvidencePicker from '../../components/EvidencePicker';
import { formatOrderPrice } from './orderStatus';
import './ConfirmReceipt.css';
import { App as AntApp, Alert, Avatar, Button, Descriptions, Flex, Form, Input, Modal, Rate, Tag, Typography } from 'antd';
import { CheckCircle, ThumbsDown, ThumbsUp } from '@phosphor-icons/react';

const ConfirmReceipt = ({ order, onClose, onSuccess }) => {
  const { modal } = AntApp.useApp();
  const productImageSrc = getImageUrl(order.listing?.images?.[0]) || '/images/placeholder.png';
  const sellerAvatarSrc = getImageUrl(order.seller?.avatar, 'avatar');

  const highlightOptions = {
    positive: ['Đúng mô tả', 'Đóng gói cẩn thận', 'Giao tiếp tốt', 'Giao hàng nhanh', 'Sản phẩm chất lượng'],
    neutral: ['Tạm ổn', 'Đúng giá', 'Cần cải thiện đóng gói', 'Phản hồi chậm', 'Giao hàng lâu'],
    negative: ['Sai mô tả', 'Sản phẩm lỗi', 'Đóng gói sơ sài', 'Phản hồi kém', 'Trải nghiệm chưa tốt']
  };

  const [formData, setFormData] = useState({
    rating: 5,
    review: '',
    satisfied: true
  });
  const [selectedHighlights, setSelectedHighlights] = useState([]);
  const [reviewEvidenceFiles, setReviewEvidenceFiles] = useState([]);
  const [uploadingEvidence, setUploadingEvidence] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const reviewTone = formData.rating >= 4 ? 'positive' : formData.rating === 3 ? 'neutral' : 'negative';
  const currentHighlightOptions = highlightOptions[reviewTone];

  const buildReviewComment = () => {
    const trimmedReview = formData.review.trim();
    const highlightText = selectedHighlights.length ? `Điểm nổi bật: ${selectedHighlights.join(', ')}.` : '';

    if (highlightText && trimmedReview) {
      return `${highlightText}\n${trimmedReview}`;
    }

    return highlightText || trimmedReview;
  };

  const handleInputChange = (name, value) => {
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const handleRatingChange = (rating) => {
    setFormData(prev => ({
      ...prev,
      rating,
      satisfied: rating >= 4
    }));
    setSelectedHighlights([]);
    if (errors.rating || errors.review) {
      setErrors(prev => ({
        ...prev,
        rating: '',
        review: ''
      }));
    }
  };

  const handleSatisfiedChange = (satisfied) => {
    setFormData(prev => ({
      ...prev,
      satisfied,
      rating: satisfied ? Math.max(prev.rating, 4) : Math.min(prev.rating, 3)
    }));
    setSelectedHighlights([]);
  };

  const handleHighlightToggle = (highlight) => {
    setSelectedHighlights(prev => (
      prev.includes(highlight)
        ? prev.filter(item => item !== highlight)
        : [...prev, highlight].slice(0, 3)
    ));
  };

  const validateForm = () => {
    const newErrors = {};
    const finalReviewComment = buildReviewComment();

    if (!formData.rating || formData.rating < 1 || formData.rating > 5) {
      newErrors.rating = 'Vui lòng chọn đánh giá từ 1 đến 5 sao';
    }

    if (finalReviewComment.length > 500) {
      newErrors.review = 'Nhận xét không được quá 500 ký tự';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const isVideoEvidence = (url = '') => /\.(mp4)$/i.test(url);

  const handleReviewEvidenceUpload = async (e) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;

    const remainingSlots = Math.max(0, 5 - reviewEvidenceFiles.length);
    if (remainingSlots <= 0) {
      setErrors((prev) => ({
        ...prev,
        evidence: 'Tối đa 5 tệp bằng chứng cho mỗi đánh giá'
      }));
      e.target.value = '';
      return;
    }

    setUploadingEvidence(true);
    setErrors((prev) => ({ ...prev, evidence: '' }));
    try {
      const uploadedPaths = await uploadEvidenceMedia(files.slice(0, remainingSlots));
      setReviewEvidenceFiles((prev) => [...prev, ...uploadedPaths].slice(0, 5));
    } catch (error) {
      setErrors((prev) => ({
        ...prev,
        evidence: error.message || 'Không thể upload bằng chứng đánh giá'
      }));
    } finally {
      setUploadingEvidence(false);
      e.target.value = '';
    }
  };

  const removeReviewEvidence = (index) => {
    setReviewEvidenceFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const submitReceipt = async () => {
    setLoading(true);

    try {
      await confirmReceipt(order._id);

      let reviewCreated = false;
      let reviewError = '';

      try {
        await createReview(order._id, formData.rating, buildReviewComment(), reviewEvidenceFiles);
        reviewCreated = true;
      } catch (reviewSubmitError) {
        reviewError = reviewSubmitError.response?.data?.message || reviewSubmitError.message || 'Không thể gửi đánh giá';
      }

      if (onSuccess) {
        onSuccess({ reviewCreated, reviewError });
      }
    } catch (error) {
      console.error('Error confirming receipt:', error);
      setErrors({
        submit: error.message || 'Có lỗi xảy ra khi xác nhận nhận hàng'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = () => {
    if (!validateForm()) {
      return;
    }

    modal.confirm({
      title: 'Xác nhận nhận hàng',
      content: 'Bạn có chắc chắn đã nhận được hàng và muốn xác nhận? Sau khi xác nhận, tiền sẽ được chuyển cho người bán và không thể hoàn tác.',
      okText: 'Xác nhận',
      cancelText: 'Hủy',
      centered: true,
      onOk: submitReceipt
    });
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('vi-VN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getRatingText = (rating) => {
    const ratingTexts = {
      1: 'Rất không hài lòng',
      2: 'Không hài lòng',
      3: 'Bình thường',
      4: 'Hài lòng',
      5: 'Rất hài lòng'
    };
    return ratingTexts[rating] || '';
  };

  const orderCode = order.orderCode || order._id.slice(-8).toUpperCase();

  const satisfactionOptions = [
    { value: true, icon: <ThumbsUp />, title: 'Hài lòng', desc: 'Sản phẩm và trải nghiệm đúng kỳ vọng' },
    { value: false, icon: <ThumbsDown />, title: 'Chưa hài lòng', desc: 'Có điểm chưa ổn trong giao dịch hoặc sản phẩm' }
  ];

  const summary = [
    { key: 'code', label: 'Mã đơn hàng', children: `#${orderCode}` },
    { key: 'product', label: 'Sản phẩm', children: order.listing?.title },
    { key: 'seller', label: 'Người bán', children: order.seller?.fullName },
    { key: 'shipped', label: 'Ngày giao hàng', children: order.shippedAt ? formatDate(order.shippedAt) : 'Chưa xác định' }
  ];
  if (order.shipping) {
    summary.push(
      { key: 'provider', label: 'Đơn vị vận chuyển', children: order.shipping.provider },
      { key: 'tracking', label: 'Mã vận đơn', children: order.shipping.trackingNumber }
    );
  }

  return (
    <Modal open centered footer={null} title="Xác nhận nhận hàng" width={760} onCancel={onClose} mask={{ closable: false }}>
      <Typography.Title level={4} className="receipt-heading">Thông tin đơn hàng</Typography.Title>
      <Descriptions size="small" column={{ xs: 1, sm: 2 }} className="receipt-summary" items={summary} />

      <Form layout="vertical" onFinish={handleSubmit} className="confirm-receipt-form">
        <section className="review-stage" aria-labelledby="review-stage-title">
          <Flex justify="space-between" align="flex-start" wrap gap={8}>
            <div>
              <Typography.Title level={4} id="review-stage-title">Đánh giá trải nghiệm mua hàng</Typography.Title>
              <Typography.Text type="secondary">Hãy chia sẻ cảm nhận thực tế để người mua khác tham khảo dễ hơn.</Typography.Text>
            </div>
            <Tag>#{orderCode}</Tag>
          </Flex>

          <Flex gap={14} align="center" wrap className="review-product">
            <img
              src={productImageSrc}
              alt={order.listing?.title}
              className="review-product__image"
              onError={(e) => {
                e.currentTarget.onerror = null;
                e.currentTarget.src = '/images/placeholder.png';
              }}
            />
            <div className="review-product__text">
              <Typography.Text strong>{order.listing?.title}</Typography.Text>
              <Flex gap={6} wrap>
                <Tag color="blue">Giá đơn: {formatOrderPrice(order.agreedPrice || order.totalAmount || 0)}</Tag>
                <Tag>Mã vận đơn: {order.shipping?.trackingNumber || 'Chưa có'}</Tag>
              </Flex>
            </div>
            <Flex gap={8} align="center" className="review-seller">
              <Avatar src={sellerAvatarSrc} alt={order.seller?.fullName} />
              <div className="review-product__text">
                <Typography.Text type="secondary">Người bán</Typography.Text>
                <Typography.Text strong>{order.seller?.fullName}</Typography.Text>
              </div>
            </Flex>
          </Flex>

          <Form.Item label="Mức độ hài lòng" required>
            <Flex gap={10} wrap className="satisfaction-grid" role="group" aria-label="Mức độ hài lòng">
              {satisfactionOptions.map(({ value, icon, title, desc }) => (
                <Button
                  key={title}
                  className="satisfaction-option"
                  type={formData.satisfied === value ? 'primary' : 'default'}
                  aria-pressed={formData.satisfied === value}
                  onClick={() => handleSatisfiedChange(value)}
                >
                  <span className="satisfaction-option__icon">{icon}</span>
                  <span className="satisfaction-option__text">
                    <strong>{title}</strong>
                    <span>{desc}</span>
                  </span>
                </Button>
              ))}
            </Flex>
          </Form.Item>

          <Form.Item
            label="Đánh giá người bán"
            required
            validateStatus={errors.rating ? 'error' : undefined}
            help={errors.rating}
          >
            <Flex align="center" gap={12} wrap>
              <Rate value={formData.rating} allowClear={false} onChange={handleRatingChange} />
              <Typography.Text strong className="rating-text">{getRatingText(formData.rating)}</Typography.Text>
            </Flex>
          </Form.Item>

          <Form.Item label="Điểm nổi bật" extra="Chọn tối đa 3 điểm nổi bật để review ngắn gọn và dễ đọc hơn.">
            <Flex gap={8} wrap role="group" aria-label="Điểm nổi bật">
              {currentHighlightOptions.map((highlight) => (
                <Button
                  key={highlight}
                  size="small"
                  shape="round"
                  type={selectedHighlights.includes(highlight) ? 'primary' : 'default'}
                  aria-pressed={selectedHighlights.includes(highlight)}
                  onClick={() => handleHighlightToggle(highlight)}
                >
                  {highlight}
                </Button>
              ))}
            </Flex>
          </Form.Item>

          <Form.Item
            label="Nhận xét chi tiết (tùy chọn)"
            htmlFor="review"
            validateStatus={errors.review ? 'error' : undefined}
            help={errors.review}
          >
            <Input.TextArea
              id="review"
              value={formData.review}
              onChange={(e) => handleInputChange('review', e.target.value)}
              placeholder={formData.satisfied
                ? 'Ví dụ: Người bán phản hồi nhanh, sản phẩm đúng như mô tả và đóng gói rất cẩn thận.'
                : 'Ví dụ: Sản phẩm chưa đúng kỳ vọng ở điểm nào, người bán xử lý ra sao, bạn mong muốn cải thiện điều gì.'}
              rows={4}
              showCount={{ formatter: () => `${buildReviewComment().length}/500 ký tự` }}
            />
          </Form.Item>

          <Form.Item
            label="Ảnh/Video minh chứng (tùy chọn)"
            htmlFor="review-evidence"
            validateStatus={errors.evidence ? 'error' : undefined}
            help={errors.evidence}
          >
            <EvidencePicker
              id="review-evidence"
              files={reviewEvidenceFiles}
              accept=".png,.jpg,.jpeg,.mp4,image/png,image/jpeg,video/mp4"
              buttonLabel="Chọn tệp"
              disabled={loading}
              uploading={uploadingEvidence}
              isVideo={isVideoEvidence}
              imageAlt={(index) => `review-evidence-${index}`}
              notes={[
                'Chuẩn tốt nhất: MP4 (H.264). Ảnh bắt buộc PNG/JPEG/JPG. Tối đa 5 tệp.',
                'Giới hạn mỗi tệp: ≤ 100MB, video ≤ 3 phút, 720p-1080p.',
                'Video bắt buộc là quay mở hộp liên tục, không chỉnh sửa.'
              ]}
              onSelect={handleReviewEvidenceUpload}
              onRemove={removeReviewEvidence}
            />
          </Form.Item>
        </section>

        {errors.submit && <Alert className="receipt-error" type="error" showIcon role="alert" title={errors.submit} />}

        <Flex justify="flex-end" gap={12}>
          <Button onClick={onClose} disabled={loading}>Hủy</Button>
          <Button type="primary" htmlType="submit" loading={loading} icon={<CheckCircle weight="fill" />}>
            {loading ? 'Đang xử lý...' : 'Xác nhận nhận hàng'}
          </Button>
        </Flex>
      </Form>

      <Alert
        className="receipt-notice"
        type="info"
        showIcon
        role="note"
        title="Lưu ý quan trọng:"
        description={(
          <ul>
            <li>Sau khi xác nhận, tiền sẽ được chuyển ngay cho người bán</li>
            <li>Bạn không thể hoàn tác sau khi đã xác nhận nhận hàng</li>
            <li>Đánh giá của bạn sẽ giúp cộng đồng đưa ra quyết định mua hàng</li>
            <li>Nếu có vấn đề với sản phẩm, vui lòng liên hệ người bán trước khi xác nhận</li>
          </ul>
        )}
      />
    </Modal>
  );
};

export default ConfirmReceipt;
