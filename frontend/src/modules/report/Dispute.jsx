import React, { useEffect, useState } from 'react';
import { Alert, Button, Flex, Form, Input, Modal, Select, Typography } from 'antd';
import { createDispute, uploadEvidenceMedia } from '../../services/report.service';
import { getImageUrl } from '../../utils/imageHelper';
import EvidencePicker from '../../components/EvidencePicker';
import '../../components/ReportModal.css';
import { Warning } from '@phosphor-icons/react';

const REASON_OPTIONS = [
  { value: 'not_as_described', label: 'Sản phẩm không đúng mô tả' },
  { value: 'damaged', label: 'Sản phẩm bị hỏng/hư hại' },
  { value: 'not_received', label: 'Không nhận được hàng' },
  { value: 'counterfeit', label: 'Hàng giả, hàng nhái' },
  { value: 'return_request', label: 'Yêu cầu hoàn hàng' },
  { value: 'other', label: 'Khác' }
];

const isVideoEvidence = (url = '') => /\.(mp4|mov|webm|avi|mkv)$/i.test(url);

const Dispute = ({ order, onSuccess, onCancel, initialReason = '' }) => {
  const [reason, setReason] = useState(initialReason);
  const [description, setDescription] = useState('');
  const [evidenceImages, setEvidenceImages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [uploadingImages, setUploadingImages] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    setReason(initialReason || '');
  }, [initialReason]);

  const handleSubmit = async () => {
    if (!reason || !description.trim()) {
      setError('Vui lòng điền đầy đủ thông tin');
      return;
    }

    if (description.trim().length < 10) {
      setError('Mô tả phải có ít nhất 10 ký tự');
      return;
    }

    if (evidenceImages.length === 0) {
      setError('Vui lòng cung cấp ít nhất 1 tệp bằng chứng (ảnh hoặc video)');
      return;
    }

    setLoading(true);
    setError('');

    try {
      await createDispute(order._id, reason, description.trim(), evidenceImages);
      onSuccess && onSuccess();
    } catch (error) {
      setError(error.message || 'Có lỗi xảy ra khi tạo khiếu nại');
    } finally {
      setLoading(false);
    }
  };

  const handleImageUpload = async (e) => {
    const files = Array.from(e.target.files);
    const availableSlots = 5 - evidenceImages.length;

    if (!files.length || availableSlots <= 0) return;

    setUploadingImages(true);
    setError('');

    try {
      const uploadedPaths = await uploadEvidenceMedia(files.slice(0, availableSlots));
      setEvidenceImages(prev => [...prev, ...uploadedPaths].slice(0, 5));
    } catch (uploadError) {
      setError(uploadError.message || 'Không thể upload bằng chứng');
    } finally {
      setUploadingImages(false);
      e.target.value = '';
    }
  };

  const removeImage = (index) => {
    setEvidenceImages(prev => prev.filter((_, i) => i !== index));
  };

  return (
    <Modal open centered footer={null} title="Tạo khiếu nại" width={640} onCancel={onCancel} mask={{ closable: false }}>
      <Flex gap={12} align="center" className="report-subject">
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
          <br />
          <Typography.Text type="secondary">Mã đơn: {order._id}</Typography.Text>
          <br />
          <Typography.Text type="secondary">Người bán: {order.seller?.fullName}</Typography.Text>
        </div>
      </Flex>

      <Form layout="vertical" onFinish={handleSubmit} className="report-form">
        <Form.Item label="Lý do khiếu nại" htmlFor="reason" required>
          <Select id="reason" placeholder="Chọn lý do" value={reason || undefined} options={REASON_OPTIONS} onChange={setReason} />
        </Form.Item>

        <Form.Item label="Mô tả chi tiết vấn đề" htmlFor="description" required>
          <Input.TextArea
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Vui lòng mô tả chi tiết vấn đề bạn gặp phải với đơn hàng này. Thông tin càng chi tiết sẽ giúp chúng tôi xử lý khiếu nại nhanh hơn."
            rows={5}
            maxLength={1000}
            showCount
          />
        </Form.Item>

        <Form.Item label="Bằng chứng (ảnh/video)" htmlFor="evidence" required>
          <EvidencePicker
            id="evidence"
            files={evidenceImages}
            accept=".png,.jpg,.jpeg,.mp4,image/png,image/jpeg,video/mp4"
            buttonLabel="Chọn tệp"
            disabled={loading}
            uploading={uploadingImages}
            isVideo={isVideoEvidence}
            notes={[
              'Bắt buộc ít nhất 1 tệp, tối đa 5 tệp. Chỉ nhận ảnh PNG/JPG/JPEG và video MP4 (H.264), ≤ 100MB, ≤ 3 phút, 720p-1080p.',
              'Video cần là bản quay mở hộp liên tục, không chỉnh sửa.'
            ]}
            onSelect={handleImageUpload}
            onRemove={removeImage}
          />
        </Form.Item>

        <Alert
          className="report-warning"
          type="warning"
          showIcon
          role="note"
          icon={<Warning />}
          title="Lưu ý quan trọng"
          description={(
            <ul>
              <li>Khiếu nại chỉ được tạo cho đơn hàng đã được giao</li>
              <li>Vui lòng cung cấp bằng chứng rõ ràng và chính xác</li>
              <li>Khiếu nại sai sự thật có thể bị xử phạt</li>
              <li>Thời gian xử lý khiếu nại: 3-7 ngày làm việc</li>
            </ul>
          )}
        />

        {error && <Alert className="report-error" type="error" showIcon role="alert" title={error} />}

        <Flex justify="flex-end" gap={12} className="report-actions">
          <Button onClick={onCancel} disabled={loading}>Hủy</Button>
          <Button
            type="primary"
            htmlType="submit"
            disabled={loading || uploadingImages || !reason || !description.trim() || evidenceImages.length === 0}
          >
            {loading ? 'Đang gửi...' : 'Tạo khiếu nại'}
          </Button>
        </Flex>
      </Form>
    </Modal>
  );
};

export default Dispute;
