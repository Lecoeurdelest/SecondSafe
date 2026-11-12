import React, { useState } from 'react';
import { Alert, Button, Flex, Form, Input, Modal, Select, Typography } from 'antd';
import { createProductReport, uploadEvidenceImages } from '../../services/report.service';
import { getImageUrl } from '../../utils/imageHelper';
import EvidencePicker from '../../components/EvidencePicker';
import '../../components/ReportModal.css';

const REASON_OPTIONS = [
  { value: 'counterfeit', label: 'Hàng giả, hàng nhái' },
  { value: 'inappropriate', label: 'Nội dung không phù hợp' },
  { value: 'scam', label: 'Lừa đảo' },
  { value: 'spam', label: 'Spam' },
  { value: 'other', label: 'Khác' }
];

const ReportProduct = ({ product, onSuccess, onCancel }) => {
  const [reason, setReason] = useState('');
  const [description, setDescription] = useState('');
  const [evidenceImages, setEvidenceImages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [uploadingImages, setUploadingImages] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async () => {
    if (!reason || !description.trim()) {
      setError('Vui lòng điền đầy đủ thông tin');
      return;
    }

    if (description.trim().length < 10) {
      setError('Mô tả phải có ít nhất 10 ký tự');
      return;
    }

    setLoading(true);
    setError('');

    try {
      await createProductReport(product._id, reason, description.trim(), evidenceImages);
      onSuccess && onSuccess();
    } catch (error) {
      setError(error.message || 'Có lỗi xảy ra khi gửi báo cáo');
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
      const uploadedPaths = await uploadEvidenceImages(files.slice(0, availableSlots));
      setEvidenceImages(prev => [...prev, ...uploadedPaths].slice(0, 5));
    } catch (uploadError) {
      setError(uploadError.message || 'Không thể upload ảnh bằng chứng');
    } finally {
      setUploadingImages(false);
      e.target.value = '';
    }
  };

  const removeImage = (index) => {
    setEvidenceImages(prev => prev.filter((_, i) => i !== index));
  };

  return (
    <Modal open centered footer={null} title="Báo cáo sản phẩm" width={560} onCancel={onCancel} mask={{ closable: false }}>
      <Flex gap={12} align="center" className="report-subject">
        <img
          src={getImageUrl(product?.images?.[0]) || '/images/placeholders/product-placeholder.svg'}
          alt={product.title}
          onError={(event) => {
            event.currentTarget.onerror = null;
            event.currentTarget.src = '/images/placeholders/product-placeholder.svg';
          }}
        />
        <div className="report-subject__body">
          <Typography.Title level={4}>{product.title}</Typography.Title>
          <Typography.Text strong>{product.price?.toLocaleString('vi-VN')} VNĐ</Typography.Text>
          <br />
          <Typography.Text type="secondary">Người bán: {product.seller?.fullName}</Typography.Text>
        </div>
      </Flex>

      <Form layout="vertical" onFinish={handleSubmit} className="report-form">
        <Form.Item label="Lý do báo cáo" htmlFor="reason" required>
          <Select id="reason" placeholder="Chọn lý do" value={reason || undefined} options={REASON_OPTIONS} onChange={setReason} />
        </Form.Item>

        <Form.Item label="Mô tả chi tiết" htmlFor="description" required>
          <Input.TextArea
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Vui lòng mô tả chi tiết vấn đề bạn gặp phải với sản phẩm này..."
            rows={4}
            maxLength={1000}
            showCount
          />
        </Form.Item>

        <Form.Item label="Ảnh bằng chứng (tùy chọn)" htmlFor="evidence">
          <EvidencePicker
            id="evidence"
            files={evidenceImages}
            accept="image/*"
            buttonLabel="Chọn ảnh"
            disabled={loading}
            uploading={uploadingImages}
            notes={['Tối đa 5 ảnh. Ảnh bằng chứng sẽ giúp chúng tôi xử lý báo cáo nhanh hơn.']}
            onSelect={handleImageUpload}
            onRemove={removeImage}
          />
        </Form.Item>

        {error && <Alert className="report-error" type="error" showIcon role="alert" title={error} />}

        <Flex justify="flex-end" gap={12} className="report-actions">
          <Button onClick={onCancel} disabled={loading}>Hủy</Button>
          <Button type="primary" htmlType="submit" disabled={loading || uploadingImages || !reason || !description.trim()}>
            {loading ? 'Đang gửi...' : 'Gửi báo cáo'}
          </Button>
        </Flex>
      </Form>
    </Modal>
  );
};

export default ReportProduct;
