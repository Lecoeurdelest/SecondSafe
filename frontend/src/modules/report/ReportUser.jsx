import React, { useState } from 'react';
import { Alert, Button, Flex, Form, Input, Modal, Select, Typography } from 'antd';
import { createUserReport, uploadEvidenceImages } from '../../services/report.service';
import { getImageUrl } from '../../utils/imageHelper';
import EvidencePicker from '../../components/EvidencePicker';
import '../../components/ReportModal.css';

const REASON_OPTIONS = [
  { value: 'scam', label: 'Lừa đảo' },
  { value: 'inappropriate', label: 'Hành vi không phù hợp' },
  { value: 'spam', label: 'Spam / làm phiền' },
  { value: 'counterfeit', label: 'Bán hàng giả / sai sự thật' },
  { value: 'other', label: 'Khác' }
];

const isVideoEvidence = (url = '') => /\.(mp4|mov|m4v|webm|avi|mkv)$/i.test(url);

const ReportUser = ({ reportedUser, onSuccess, onCancel }) => {
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
      await createUserReport(reportedUser._id, reason, description.trim(), evidenceImages);
      onSuccess && onSuccess();
    } catch (submitError) {
      setError(submitError.message || 'Có lỗi xảy ra khi gửi báo cáo');
    } finally {
      setLoading(false);
    }
  };

  const handleImageUpload = async (event) => {
    const files = Array.from(event.target.files || []);
    const availableSlots = 5 - evidenceImages.length;

    if (!files.length || availableSlots <= 0) return;

    setUploadingImages(true);
    setError('');

    try {
      const uploadedPaths = await uploadEvidenceImages(files.slice(0, availableSlots));
      setEvidenceImages((prev) => [...prev, ...uploadedPaths].slice(0, 5));
    } catch (uploadError) {
      setError(uploadError.message || 'Không thể upload ảnh bằng chứng');
    } finally {
      setUploadingImages(false);
      event.target.value = '';
    }
  };

  const removeImage = (index) => {
    setEvidenceImages((prev) => prev.filter((_, currentIndex) => currentIndex !== index));
  };

  return (
    <Modal open centered footer={null} title="Báo cáo người dùng" width={560} onCancel={onCancel} mask={{ closable: false }}>
      <Flex gap={12} align="center" className="report-subject">
        <img
          src={getImageUrl(reportedUser?.avatar) || '/images/placeholders/avatar-placeholder.svg'}
          alt={reportedUser?.fullName}
          onError={(event) => {
            event.currentTarget.onerror = null;
            event.currentTarget.src = '/images/placeholders/avatar-placeholder.svg';
          }}
        />
        <div className="report-subject__body">
          <Typography.Title level={4}>{reportedUser?.fullName || 'Người dùng'}</Typography.Title>
          <Typography.Text type="secondary">Vai trò: Thành viên ReFlow</Typography.Text>
          <br />
          <Typography.Text type="secondary">Đánh giá: {Number(reportedUser?.rating || 0).toFixed(1)}/5</Typography.Text>
        </div>
      </Flex>

      <Form layout="vertical" onFinish={handleSubmit} className="report-form">
        <Form.Item label="Lý do báo cáo" htmlFor="user-report-reason" required>
          <Select id="user-report-reason" placeholder="Chọn lý do" value={reason || undefined} options={REASON_OPTIONS} onChange={setReason} />
        </Form.Item>

        <Form.Item label="Mô tả chi tiết" htmlFor="user-report-description" required>
          <Input.TextArea
            id="user-report-description"
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            placeholder="Vui lòng mô tả rõ hành vi vi phạm của người dùng này..."
            rows={4}
            maxLength={1000}
            showCount
          />
        </Form.Item>

        <Form.Item label="Bằng chứng (ảnh/video, tùy chọn)" htmlFor="user-report-evidence">
          <EvidencePicker
            id="user-report-evidence"
            files={evidenceImages}
            accept="image/*,video/*"
            buttonLabel="Chọn tệp"
            disabled={loading}
            uploading={uploadingImages}
            isVideo={isVideoEvidence}
            notes={['Tối đa 5 tệp (ảnh hoặc video). Bằng chứng rõ ràng sẽ giúp xử lý nhanh hơn.']}
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

export default ReportUser;
