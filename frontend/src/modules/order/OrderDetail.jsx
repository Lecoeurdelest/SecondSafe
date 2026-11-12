import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { getOrderById, cancelOrder, confirmDelivery } from '../../services/order.service';
import chatService from '../../services/chat.service';
import { canReviewOrder, getReviewByOrderId } from '../../services/review.service';
import { getDisputeByOrderId, addSellerResponse, addBuyerFollowUp, confirmSellerReturn, uploadEvidenceMedia } from '../../services/report.service';
import { getImageUrl } from '../../utils/imageHelper';
import { formatCategoryText } from '../../utils/categoryHelper';
import EvidencePicker from '../../components/EvidencePicker';
import ShipOrder from './ShipOrder';
import ConfirmReceipt from './ConfirmReceipt';
import RateSeller from '../review/RateSeller';
import Dispute from '../report/Dispute';
import { describeOrderStatus } from './orderStatus';
import './OrderDetail.css';
import { App as AntApp, Alert, Avatar, Button, Card, Descriptions, Flex, Form, Input, Modal, Rate, Spin, Tag, Timeline, Typography } from 'antd';
import { ArrowBendUpLeft, ArrowLeft, ChatCircle, Check, CheckCircle, Circle, CreditCard, Package, Paperclip, Star, Truck, Warning, X } from '@phosphor-icons/react';

const AVATAR_PLACEHOLDER = '/images/placeholders/avatar-placeholder.svg';

const UserAvatar = ({ avatar, fullName, userId }) => {
  const [imgError, setImgError] = useState(false);
  const src = (!avatar || imgError) ? AVATAR_PLACEHOLDER : getImageUrl(avatar);

  const image = (
    <Avatar
      size={56}
      src={src}
      alt={fullName || 'Người dùng'}
      onError={() => {
        setImgError(true);
        return false;
      }}
    />
  );

  if (!userId) return image;

  return (
    <Link to={`/user/${userId}`} className="user-avatar-link">
      {image}
    </Link>
  );
};

const conditionLabels = {
  new: 'Mới',
  like_new: 'Như mới',
  good: 'Tốt',
  fair: 'Khá',
  poor: 'Kém'
};

const OrderDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const { message, modal } = AntApp.useApp();

  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showShipModal, setShowShipModal] = useState(false);
  const [showReceiptModal, setShowReceiptModal] = useState(false);
  const [showRatingModal, setShowRatingModal] = useState(false);
  const [showDisputeModal, setShowDisputeModal] = useState(false);
  const [disputeMode, setDisputeMode] = useState('normal');
  const [canReview, setCanReview] = useState(false);
  const [existingReview, setExistingReview] = useState(null);
  const [dispute, setDispute] = useState(null);
  const [showSellerResponseModal, setShowSellerResponseModal] = useState(false);
  const [showBuyerFollowUpModal, setShowBuyerFollowUpModal] = useState(false);
  const [showConfirmReturnModal, setShowConfirmReturnModal] = useState(false);
  const [sellerResponseText, setSellerResponseText] = useState('');
  const [sellerEvidenceImages, setSellerEvidenceImages] = useState([]);
  const [buyerFollowUpText, setBuyerFollowUpText] = useState('');
  const [buyerFollowUpEvidence, setBuyerFollowUpEvidence] = useState([]);
  const [sellerResponseLoading, setSellerResponseLoading] = useState(false);
  const [buyerFollowUpLoading, setBuyerFollowUpLoading] = useState(false);
  const [confirmReturnLoading, setConfirmReturnLoading] = useState(false);
  const [sellerUploading, setSellerUploading] = useState(false);
  const [buyerUploading, setBuyerUploading] = useState(false);
  const [sellerResponseError, setSellerResponseError] = useState('');
  const [buyerFollowUpError, setBuyerFollowUpError] = useState('');
  const [cancelOpen, setCancelOpen] = useState(false);
  const [cancelReason, setCancelReason] = useState('');
  const [cancelling, setCancelling] = useState(false);

  const isVideoEvidence = (url = '') => /\.(mp4|mov|webm|avi|mkv)$/i.test(url);

  const extractReviewMediaFiles = (review) => {
    if (!review) return [];

    const candidates = [
      review.evidenceFiles,
      review.evidenceImages,
      review.media,
      review.attachments,
      review.data?.evidenceFiles,
      review.data?.evidenceImages
    ];

    const merged = candidates
      .filter(Array.isArray)
      .flat()
      .map((item) => String(item || '').trim())
      .filter(Boolean);

    return Array.from(new Set(merged));
  };

  const renderEvidencePreview = (files = []) => {
    if (!files.length) return null;

    const imageFiles = files.filter((file) => !isVideoEvidence(file));
    const videoFiles = files.filter((file) => isVideoEvidence(file));

    return (
      <div className="evidence-preview">
        {imageFiles.length > 0 && (
          <Flex wrap gap={10}>
            {imageFiles.map((file, index) => (
              <img key={`${file}-${index}`} src={getImageUrl(file)} alt={`evidence-${index}`} className="evidence-preview__media" />
            ))}
          </Flex>
        )}

        {videoFiles.length > 0 && (
          <Flex wrap gap={10}>
            {videoFiles.map((file, index) => (
              <video key={`${file}-${index}`} src={getImageUrl(file)} controls className="evidence-preview__video" />
            ))}
          </Flex>
        )}
      </div>
    );
  };

  const disputeReasonLabels = {
    not_as_described: 'Không đúng mô tả',
    damaged: 'Sản phẩm bị hỏng/hư hại',
    not_received: 'Không nhận được hàng',
    counterfeit: 'Hàng giả/hàng nhái',
    return_request: 'Yêu cầu hoàn hàng',
    other: 'Lý do khác'
  };

  const disputeResolutionLabels = {
    refund: 'Hoàn tiền cho người mua',
    release: 'Nhả tiền cho người bán'
  };

  const buildDisputeConversationEvents = (disputeData) => {
    if (!disputeData) return [];

    const roleLabelMap = {
      buyer: 'Người mua',
      seller: 'Người bán',
      moderator: 'Moderator',
      system: 'Hệ thống'
    };

    const events = Array.isArray(disputeData.disputeConversation)
      ? disputeData.disputeConversation.map((entry, index) => ({
          key: `conversation-${index}`,
          senderRole: entry?.senderRole || 'system',
          senderLabel: roleLabelMap[entry?.senderRole] || 'Cập nhật',
          content: entry?.content || '',
          evidenceFiles: entry?.evidenceFiles || [],
          createdAt: entry?.createdAt || null
        }))
      : [];

    // Fallback cho du lieu cu chua migrate.
    if (!events.length) {
      events.push({
        key: 'initial',
        senderRole: 'buyer',
        senderLabel: 'Người mua',
        content: disputeData.description || '',
        evidenceFiles: disputeData.evidenceImages || [],
        createdAt: disputeData.createdAt || null
      });

      if (disputeData.sellerResponse || disputeData.sellerEvidenceImages?.length) {
        events.push({
          key: 'seller-legacy',
          senderRole: 'seller',
          senderLabel: 'Người bán',
          content: disputeData.sellerResponse || 'Người bán đã gửi bằng chứng',
          evidenceFiles: disputeData.sellerEvidenceImages || [],
          createdAt: disputeData.sellerResponseUpdatedAt || null
        });
      }

      if (disputeData.buyerFollowUpNote || disputeData.buyerAdditionalEvidenceImages?.length) {
        events.push({
          key: 'buyer-legacy',
          senderRole: 'buyer',
          senderLabel: 'Người mua',
          content: disputeData.buyerFollowUpNote || 'Người mua đã bổ sung bằng chứng',
          evidenceFiles: disputeData.buyerAdditionalEvidenceImages || [],
          createdAt: disputeData.buyerFollowUpUpdatedAt || null
        });
      }
    }

    return events
      .map((event, index) => ({ ...event, __index: index }))
      .sort((a, b) => {
        const timeA = a.createdAt ? new Date(a.createdAt).getTime() : Number.MAX_SAFE_INTEGER;
        const timeB = b.createdAt ? new Date(b.createdAt).getTime() : Number.MAX_SAFE_INTEGER;
        if (timeA === timeB) return a.__index - b.__index;
        return timeA - timeB;
      });
  };

  const translateCancellationReason = (reason = '') => {
    if (!reason) return '';

    const normalized = String(reason).trim();
    const map = {
      'Dispute resolved: refund to buyer': 'Tranh chấp đã xử lý: Hoàn tiền cho người mua',
      'Dispute resolved: release to seller': 'Tranh chấp đã xử lý: Nhả tiền cho người bán',
      'Buyer confirmed receipt': 'Người mua đã xác nhận nhận hàng',
      'Auto-release after 10 days': 'Tự động nhả tiền sau 10 ngày',
      'Hủy bởi Moderator. Lý do:': 'Hủy bởi quản trị viên. Lý do:'
    };

    if (normalized.startsWith('Hủy bởi Moderator. Lý do:')) {
      return normalized.replace('Hủy bởi Moderator. Lý do:', 'Hủy bởi quản trị viên. Lý do:');
    }

    return map[normalized] || normalized;
  };

  useEffect(() => {
    fetchOrder();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  useEffect(() => {
    if (order) {
      checkReviewStatus();
      if (order.status === 'disputed') {
        fetchDispute();
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [order]);

  useEffect(() => {
    if (!order || !user) return;
    if (!isBuyer() || order.status !== 'shipped') return;

    const params = new URLSearchParams(location.search);
    const action = params.get('action');

    if (action === 'dispute') {
      setDisputeMode('normal');
      setShowDisputeModal(true);
    }

    if (action === 'return') {
      setDisputeMode('return');
      setShowDisputeModal(true);
    }

    if (action === 'confirm-receipt') {
      setShowReceiptModal(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [order, user, location.search]);

  useEffect(() => {
    if (!order || !user) return;
    if (!isBuyer() || order.status !== 'completed') return;

    const params = new URLSearchParams(location.search);
    const action = params.get('action');

    if (action === 'rate' && canReview && !existingReview) {
      setShowRatingModal(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [order, user, location.search, canReview, existingReview]);

  useEffect(() => {
    if (!order || !user || !dispute) return;
    if (!isBuyer() || order.status !== 'disputed') return;

    const params = new URLSearchParams(location.search);
    const action = params.get('action');

    if (action === 'followup' && dispute.status !== 'resolved') {
      setShowBuyerFollowUpModal(true);

      // Consume action param after first auto-open to avoid reopening modal on page reload.
      params.delete('action');
      const nextSearch = params.toString();
      navigate(
        {
          pathname: location.pathname,
          search: nextSearch ? `?${nextSearch}` : ''
        },
        { replace: true }
      );
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [order, user, dispute, location.search, navigate, location.pathname]);

  useEffect(() => {
    if (!order || !user || !dispute) return;
    if (!isSeller() || order.status !== 'disputed') return;

    const params = new URLSearchParams(location.search);
    const action = params.get('action');

    if (action === 'seller-evidence' && dispute.status !== 'resolved' && dispute.reason !== 'return_request') {
      setShowSellerResponseModal(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [order, user, dispute, location.search]);

  const fetchDispute = async () => {
    if (!order || !order._id) return;
    try {
      const response = await getDisputeByOrderId(order._id);
      setDispute(response.data);
    } catch (e) {
      // Dispute not yet created or no access
    }
  };

  const handleSellerResponseSubmit = async () => {
    if (!sellerResponseText.trim()) {
      setSellerResponseError('Vui lòng nhập phản hồi');
      return;
    }
    setSellerResponseLoading(true);
    setSellerResponseError('');
    try {
      await addSellerResponse(dispute._id, sellerResponseText.trim(), sellerEvidenceImages);
      setShowSellerResponseModal(false);
      setSellerResponseText('');
      setSellerEvidenceImages([]);
      fetchDispute();
      message.success('Đã gửi phản hồi khiếu nại thành công.');
    } catch (e) {
      setSellerResponseError(e.message || 'Có lỗi xảy ra');
    } finally {
      setSellerResponseLoading(false);
    }
  };

  const handleSellerEvidenceUpload = async (e) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
    setSellerUploading(true);
    try {
      const paths = await uploadEvidenceMedia(files.slice(0, 5 - sellerEvidenceImages.length));
      setSellerEvidenceImages(prev => [...prev, ...paths].slice(0, 5));
    } catch (err) {
      setSellerResponseError(err.message || 'Không thể upload bằng chứng');
    } finally {
      setSellerUploading(false);
    }
    e.target.value = '';
  };

  const handleBuyerFollowUpUpload = async (e) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;

    setBuyerUploading(true);
    try {
      const remainingSlots = Math.max(0, 5 - buyerFollowUpEvidence.length);
      const paths = await uploadEvidenceMedia(files.slice(0, remainingSlots));
      setBuyerFollowUpEvidence(prev => [...prev, ...paths].slice(0, 5));
    } catch (err) {
      setBuyerFollowUpError(err.message || 'Không thể upload bằng chứng');
    } finally {
      setBuyerUploading(false);
    }

    e.target.value = '';
  };

  const handleBuyerFollowUpSubmit = async () => {
    if (!buyerFollowUpText.trim() && buyerFollowUpEvidence.length === 0) {
      setBuyerFollowUpError('Vui lòng nhập ghi chú hoặc tải lên ít nhất 1 bằng chứng');
      return;
    }

    setBuyerFollowUpLoading(true);
    setBuyerFollowUpError('');
    try {
      await addBuyerFollowUp(dispute._id, buyerFollowUpText.trim(), buyerFollowUpEvidence);
      setShowBuyerFollowUpModal(false);
      setBuyerFollowUpText('');
      setBuyerFollowUpEvidence([]);
      await fetchDispute();
      message.success('Đã gửi bổ sung bằng chứng cho moderator.');
    } catch (e) {
      setBuyerFollowUpError(e.message || 'Có lỗi xảy ra');
    } finally {
      setBuyerFollowUpLoading(false);
    }
  };

  const handleConfirmReturn = async () => {
    setConfirmReturnLoading(true);
    try {
      await confirmSellerReturn(dispute._id);
      setShowConfirmReturnModal(false);
      fetchDispute();
      message.success('Đã xác nhận nhận lại hàng. Moderator sẽ tiến hành hoàn tiền cho người mua.');
    } catch (e) {
      message.error(e.message || 'Có lỗi xảy ra');
    } finally {
      setConfirmReturnLoading(false);
    }
  };

  const checkReviewStatus = async () => {
    if (!order || !order._id) return;
    try {
      // Kiem tra nguoi dung co the danh gia khong
      const canReviewResponse = await canReviewOrder(order._id);
      setCanReview(canReviewResponse.data.canReview);
      
      // Kiem tra da ton tai danh gia hay chua
      const existingReviewResponse = await getReviewByOrderId(order._id);
      setExistingReview(existingReviewResponse.data);
    } catch (error) {
      console.error('Error checking review status:', error);
    }
  };

  const fetchOrder = async () => {
    try {
      setLoading(true);
      const response = await getOrderById(id);
      setOrder(response.data);
      setError(null);
    } catch (err) {
      setError(err.message || 'Không thể tải thông tin đơn hàng');
    } finally {
      setLoading(false);
    }
  };

  const openCancelDialog = () => {
    setCancelReason('');
    setCancelOpen(true);
  };

  const closeCancelDialog = () => {
    if (cancelling) return;
    setCancelOpen(false);
    setCancelReason('');
  };

  const handleCancelOrder = async () => {
    try {
      setCancelling(true);
      await cancelOrder(order._id, cancelReason.trim() || 'Người mua hủy đơn');
      setCancelOpen(false);
      setCancelReason('');
      await fetchOrder();
      message.success('Hủy đơn hàng thành công và tiền đã được tự động hoàn lại (nếu có).');
    } catch (err) {
      message.error(err.message || 'Không thể hủy đơn hàng');
    } finally {
      setCancelling(false);
    }
  };

  const handleShipSuccess = () => {
    setShowShipModal(false);
    fetchOrder();
    message.success('Xác nhận giao hàng thành công!');
  };

  const handleConfirmDelivery = (orderId) => {
    modal.confirm({
      title: 'Xác nhận giao đến nơi',
      content: 'Bạn xác nhận đơn hàng này đã được giao đến tay người mua?',
      okText: 'Xác nhận',
      cancelText: 'Hủy',
      centered: true,
      onOk: async () => {
        try {
          setLoading(true);
          await confirmDelivery(orderId);
          await fetchOrder();
          message.success('Đã cập nhật trạng thái: Đã giao đến nơi');
        } catch (err) {
          message.error(err.message || 'Có lỗi xảy ra khi xác nhận giao đến nơi');
        } finally {
          setLoading(false);
        }
      }
    });
  };

  const handleReceiptSuccess = async (result = {}) => {
    setShowReceiptModal(false);
    await fetchOrder();
    await checkReviewStatus();

    if (result.reviewCreated) {
      message.success('Xác nhận nhận hàng và gửi đánh giá thành công!');
      return;
    }

    if (result.reviewError) {
      message.warning(`Xác nhận nhận hàng thành công nhưng chưa gửi được đánh giá: ${result.reviewError}`);
      return;
    }

    message.success('Xác nhận nhận hàng thành công! Tiền đã được chuyển cho người bán.');
  };

  const handleRatingSuccess = () => {
    setShowRatingModal(false);
    checkReviewStatus();
    message.success('Đánh giá thành công! Cảm ơn bạn đã chia sẻ trải nghiệm.');
  };

  const handleDisputeSuccess = () => {
    setShowDisputeModal(false);
    fetchOrder();
    if (disputeMode === 'return') {
      message.success('Yêu cầu hoàn hàng đã được tạo thành công. Moderator sẽ liên hệ và hướng dẫn các bước tiếp theo.');
      return;
    }
    message.success('Khiếu nại đã được tạo thành công. Chúng tôi sẽ xem xét và phản hồi trong 3-7 ngày làm việc.');
  };

  const formatPrice = (price) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(price);
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('vi-VN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getNormalizedUserId = (value) => {
    if (!value) return null;
    if (typeof value === 'string' || typeof value === 'number') return value.toString();
    if (value._id?.toString) return value._id.toString();
    if (value.id?.toString) return value.id.toString();
    if (value.userId?.toString) return value.userId.toString();

    if (typeof value?.toString === 'function') {
      const asString = value.toString();
      if (asString && asString !== '[object Object]') {
        return asString;
      }
    }

    return null;
  };

  const openOrderChat = async () => {
    if (!order) {
      navigate('/chat');
      return;
    }

    try {
      const orderId = getNormalizedUserId(order._id);
      if (!orderId) {
        navigate('/chat');
        return;
      }

      const conversation = await chatService.getOrCreateConversationByOrder(orderId);
      if (conversation?._id) {
        navigate(`/chat/${conversation._id}`);
        return;
      }

      navigate('/chat');
    } catch (error) {
      console.error('Error opening order chat:', error);
      navigate('/chat');
    }
  };

  const getStatusTimeline = () => {
    const timeline = [
      {
        key: 'created',
        label: 'Đơn hàng được tạo',
        date: order.createdAt,
        completed: true,
        isCurrent: false,
        variant: 'normal'
      },
      {
        key: 'pending-payment',
        label: 'Chờ thanh toán',
        date: order.createdAt,
        completed: true,
        isCurrent: ['pending', 'awaiting_payment'].includes(order.status),
        variant: 'normal'
      },
      {
        key: 'paid',
        label: 'Đã thanh toán',
        date: order.paidAt,
        completed: !!order.paidAt,
        isCurrent: order.status === 'paid',
        variant: 'normal'
      },
      {
        key: 'shipped',
        label: 'Đang giao hàng',
        date: order.shippedAt,
        completed: !!order.shippedAt,
        isCurrent: order.status === 'shipped',
        variant: 'normal'
      },
      {
        key: 'delivered',
        label: 'Đã giao đến nơi',
        date: order.deliveredAt,
        completed: !!order.deliveredAt,
        isCurrent: order.status === 'delivered',
        variant: 'normal'
      }
    ];

    // Dispute history events are injected directly into order timeline.
    if (order.status === 'disputed' || dispute) {
      timeline.push({
        key: 'dispute-created',
        label: dispute?.reason === 'return_request' ? 'Đã tạo yêu cầu hoàn hàng' : 'Đã tạo khiếu nại',
        date: dispute?.createdAt,
        completed: true,
        variant: 'dispute'
      });

      timeline.push({
        key: 'dispute-investigating',
        label: 'Quản trị viên tiếp nhận và điều tra',
        date: dispute?.investigatingAt,
        completed: dispute?.status === 'investigating' || dispute?.status === 'resolved',
        isCurrent: dispute?.status === 'pending',
        variant: 'dispute'
      });

      timeline.push({
        key: 'seller-evidence',
        label: 'Người bán bổ sung phản hồi/bằng chứng',
        date: dispute?.sellerResponse ? dispute?.updatedAt : null,
        completed: !!(dispute?.sellerResponse || dispute?.sellerEvidenceImages?.length),
        variant: 'dispute'
      });

      timeline.push({
        key: 'buyer-followup',
        label: 'Người mua bổ sung bằng chứng',
        date: dispute?.buyerFollowUpUpdatedAt,
        completed: !!(dispute?.buyerFollowUpNote || dispute?.buyerAdditionalEvidenceImages?.length),
        variant: 'dispute'
      });

      if (dispute?.reason === 'return_request') {
        timeline.push({
          key: 'seller-confirm-return',
          label: 'Người bán xác nhận đã nhận lại hàng',
          date: dispute?.sellerConfirmedReturnAt,
          completed: !!dispute?.sellerConfirmedReturnAt,
          variant: 'dispute'
        });
      }

      timeline.push({
        key: 'dispute-resolved',
        label: 'Khiếu nại đã được xử lý',
        date: dispute?.resolvedAt,
        completed: dispute?.status === 'resolved',
        isCurrent: dispute?.status === 'investigating',
        variant: 'dispute'
      });
    }

    if (order.status === 'cancelled') {
      timeline.push({
        key: 'cancelled',
        label: `Đơn hàng đã hủy${order.cancellationReason ? `: ${translateCancellationReason(order.cancellationReason)}` : ''}`,
        date: order.cancelledAt,
        completed: true,
        variant: 'cancelled',
        isCurrent: true
      });
    } else {
      timeline.push({
        key: 'completed',
        label: 'Hoàn thành',
        date: order.completedAt,
        completed: order.status === 'completed',
        isCurrent: order.status === 'completed',
        variant: 'normal'
      });
    }

    return timeline;
  };

  const canUserAccess = () => {
    if (!user || !order) return false;
    const currentUserId = getNormalizedUserId(user);
    return getNormalizedUserId(order.buyer) === currentUserId || getNormalizedUserId(order.seller) === currentUserId;
  };

  const isBuyer = () => {
    return user && order && getNormalizedUserId(order.buyer) === getNormalizedUserId(user);
  };

  const isSeller = () => {
    return user && order && getNormalizedUserId(order.seller) === getNormalizedUserId(user);
  };

  const getActionButtons = () => {
    if (!order || !user) return null;

    const buttons = [];

    buttons.push(
      <Button key="chat" icon={<ChatCircle />} onClick={openOrderChat}>
        Chat
      </Button>
    );

    if (isBuyer()) {
      switch (order.status) {
        case 'awaiting_payment':
        case 'pending':
          buttons.push(
            <Button key="pay" type="primary" icon={<CreditCard />} onClick={() => navigate(`/orders/${order._id}/pay`)}>
              Thanh toán
            </Button>,
            <Button key="cancel" danger icon={<X />} onClick={openCancelDialog}>
              Hủy đơn
            </Button>
          );
          break;
        case 'paid':
          buttons.push(
            <Button key="cancel" danger icon={<X />} onClick={openCancelDialog}>
              Hủy đơn (Hoàn tiền)
            </Button>
          );
          break;
        case 'shipped':
        case 'delivered':
          if (order.status === 'delivered') {
            buttons.push(
              <Button key="confirm-receipt" type="primary" icon={<CheckCircle weight="fill" />} onClick={() => setShowReceiptModal(true)}>
                Xác nhận nhận hàng
              </Button>
            );
          }
          buttons.push(
            <Button
              key="dispute"
              danger
              icon={<Warning />}
              onClick={() => {
                setDisputeMode('normal');
                setShowDisputeModal(true);
              }}
            >
              Khiếu nại và hoàn tiền
            </Button>
          );
          break;

        case 'completed':
          if (canReview && !existingReview) {
            buttons.push(
              <Button key="rate" icon={<Star weight="fill" />} onClick={() => setShowRatingModal(true)}>
                Đánh giá người bán
              </Button>
            );
          }
          break;
        case 'disputed':
          if (dispute && dispute.status === 'investigating') {
            buttons.push(
              <Button key="buyer-follow-up" icon={<Paperclip />} onClick={() => setShowBuyerFollowUpModal(true)}>
                Bổ sung bằng chứng
              </Button>
            );
          }
          break;
        default:
          break;
      }
    }

    if (isSeller()) {
      switch (order.status) {
        case 'paid':
          buttons.push(
            <Button key="ship" type="primary" icon={<Truck />} onClick={() => setShowShipModal(true)}>
              Xác nhận giao hàng
            </Button>
          );
          break;
        case 'shipped':
          buttons.push(
            <Button key="deliver" icon={<Package />} onClick={() => handleConfirmDelivery(order._id)}>
              Xác nhận giao đến nơi
            </Button>
          );
          break;
        case 'disputed':
          if (dispute && dispute.status === 'investigating' && dispute.reason !== 'return_request') {
            buttons.push(
              <Button key="seller-response" icon={<ArrowBendUpLeft />} onClick={() => setShowSellerResponseModal(true)}>
                Cung cấp bằng chứng cho mod
              </Button>
            );
          }
          if (dispute && dispute.reason === 'return_request' && dispute.status === 'investigating' && !dispute.sellerConfirmedReturnAt) {
            buttons.push(
              <Button key="confirm-return" type="primary" icon={<CheckCircle weight="fill" />} onClick={() => setShowConfirmReturnModal(true)}>
                Xác nhận nhận lại hàng
              </Button>
            );
          }
          break;
        default:
          break;
      }
    }

    return buttons;
  };

  if (loading) {
    return (
      <div className="order-detail-container container">
        <Flex justify="center" gap={12} className="order-detail-loading" role="status">
          <Spin />
          <Typography.Text type="secondary">Đang tải...</Typography.Text>
        </Flex>
      </div>
    );
  }

  if (error) {
    return (
      <div className="order-detail-container container">
        <Alert
          type="error"
          showIcon
          role="alert"
          title={error}
          action={<Button size="small" type="primary" onClick={() => navigate('/orders')}>Quay lại danh sách đơn hàng</Button>}
        />
      </div>
    );
  }

  if (!order) {
    return null;
  }

  if (!canUserAccess()) {
    return (
      <div className="order-detail-container container">
        <Alert
          type="error"
          showIcon
          role="alert"
          title="Bạn không có quyền truy cập đơn hàng này"
          action={<Button size="small" type="primary" onClick={() => navigate('/orders')}>Quay lại danh sách đơn hàng</Button>}
        />
      </div>
    );
  }

  const timelineSteps = getStatusTimeline();
  const status = describeOrderStatus(order.status);
  const counterpart = isBuyer() ? order.seller : order.buyer;

  const timeDetails = [{ key: 'created', label: 'Ngày tạo', children: formatDate(order.createdAt) }];
  if (order.paidAt) timeDetails.push({ key: 'paid', label: 'Ngày thanh toán', children: formatDate(order.paidAt) });
  if (order.shippedAt) timeDetails.push({ key: 'shipped', label: 'Ngày giao hàng', children: formatDate(order.shippedAt) });
  if (order.completedAt) timeDetails.push({ key: 'completed', label: 'Ngày hoàn thành', children: formatDate(order.completedAt) });
  if (order.cancelledAt) timeDetails.push({ key: 'cancelled', label: 'Ngày hủy', children: formatDate(order.cancelledAt) });
  if (order.cancellationReason) timeDetails.push({ key: 'reason', label: 'Lý do hủy', children: translateCancellationReason(order.cancellationReason) });

  const priceDetails = [{ key: 'price', label: 'Giá sản phẩm', children: formatPrice(order.agreedPrice) }];
  if (isSeller()) {
    priceDetails.push(
      { key: 'fee', label: 'Phí nền tảng (5%)', children: <Typography.Text type="danger">-{formatPrice(order.platformFee)}</Typography.Text> },
      { key: 'net', label: 'Tổng nhận được', children: <Typography.Text strong type="success">{formatPrice(order.agreedPrice - (order.platformFee || 0))}</Typography.Text> }
    );
  } else {
    priceDetails.push({ key: 'total', label: 'Tổng thanh toán', children: <Typography.Text strong className="order-detail-total">{formatPrice(order.totalAmount)}</Typography.Text> });
  }

  const timelineItems = timelineSteps.map((step) => {
    const color = step.variant === 'cancelled' ? 'red'
      : step.completed ? (step.variant === 'dispute' ? 'orange' : 'green')
        : step.isCurrent ? 'blue' : 'gray';

    return {
      key: step.key,
      color,
      icon: step.variant === 'cancelled' ? <X /> : step.completed ? <Check /> : <Circle weight="fill" />,
      content: (
        <div className="order-detail-step">
          <Typography.Text strong={step.isCurrent || step.completed}>{step.label}</Typography.Text>
          {step.date && <Typography.Text type="secondary">{formatDate(step.date)}</Typography.Text>}
        </div>
      )
    };
  });

  const reviewMedia = existingReview ? extractReviewMediaFiles(existingReview) : [];

  const disputeDetails = dispute ? [
    { key: 'reason', label: 'Lý do', children: disputeReasonLabels[dispute.reason] || dispute.reason },
    { key: 'status', label: 'Trạng thái', children: dispute.status === 'pending' ? 'Chờ xử lý' : dispute.status === 'investigating' ? 'Đang điều tra' : 'Đã xử lý' },
    { key: 'description', label: 'Mô tả ban đầu', span: 'filled', children: dispute.description },
    ...(dispute.moderatorNotes ? [{ key: 'notes', label: 'Ghi chú moderator', span: 'filled', children: dispute.moderatorNotes }] : []),
    ...(dispute.resolution ? [{ key: 'resolution', label: 'Kết quả xử lý', span: 'filled', children: disputeResolutionLabels[dispute.resolution] || dispute.resolution }] : [])
  ] : [];

  const listing = order.listing;

  return (
    <div className="order-detail-container container">
      <Flex align="center" justify="space-between" wrap gap={12} className="order-detail-header">
        <Button icon={<ArrowLeft />} onClick={() => navigate('/orders')}>Quay lại</Button>
        <div className="order-detail-title">
          <Typography.Title level={1}>Chi tiết đơn hàng</Typography.Title>
          <Typography.Text type="secondary" className="order-detail-code">#{order.orderCode || order._id.slice(-8).toUpperCase()}</Typography.Text>
        </div>
        <Tag color={status.color}>{status.label}</Tag>
      </Flex>

      <Flex vertical gap={20} className="order-detail-content">
        <Card className="detail-card" title={<Typography.Title level={2}>Thông tin sản phẩm</Typography.Title>}>
          <Flex gap={16} wrap>
            <img
              className="order-detail-image"
              src={getImageUrl(listing?.images?.[0]) || '/placeholder-image.jpg'}
              alt={listing?.title}
            />
            <div className="order-detail-product">
              <Typography.Title level={3}>{listing?.title}</Typography.Title>
              <Typography.Paragraph type="secondary">{listing?.description}</Typography.Paragraph>
              <Descriptions
                size="small"
                column={1}
                items={[
                  { key: 'condition', label: 'Tình trạng', children: <Tag color="success">{conditionLabels[listing?.condition] || listing?.condition || '—'}</Tag> },
                  { key: 'category', label: 'Danh mục', children: formatCategoryText(listing) },
                  { key: 'area', label: 'Khu vực', children: [listing?.location?.district, listing?.location?.city].filter(Boolean).join(', ') || '—' }
                ]}
              />
            </div>
          </Flex>
        </Card>

        <Card className="detail-card" title={<Typography.Title level={2}>Thông tin người {isBuyer() ? 'bán' : 'mua'}</Typography.Title>}>
          <Flex gap={12} align="center" className="order-detail-person">
            <UserAvatar
              avatar={counterpart?.avatar}
              fullName={counterpart?.fullName}
              userId={getNormalizedUserId(counterpart)}
            />
            <Typography.Text strong>{counterpart?.fullName}</Typography.Text>
          </Flex>

          <Typography.Title level={2} className="order-detail-subtitle">Chi tiết thời gian</Typography.Title>
          <Descriptions size="small" column={{ xs: 1, sm: 2 }} items={timeDetails} />
        </Card>

        <Card className="detail-card" title={<Typography.Title level={2}>Chi tiết thanh toán</Typography.Title>}>
          <Descriptions size="small" column={1} items={priceDetails} />
        </Card>

        {order.shipping && (
          <Card className="detail-card" title={<Typography.Title level={2}>Thông tin vận chuyển</Typography.Title>}>
            <Descriptions
              size="small"
              column={{ xs: 1, sm: 2 }}
              items={[
                { key: 'provider', label: 'Đơn vị vận chuyển', children: (order.shipping.provider || '—').toUpperCase() },
                { key: 'tracking', label: 'Mã vận đơn', children: order.shipping.trackingNumber },
                ...(order.shipping.estimatedDelivery ? [{ key: 'eta', label: 'Dự kiến giao hàng', children: formatDate(order.shipping.estimatedDelivery) }] : []),
                ...(order.shipping.notes ? [{ key: 'notes', label: 'Ghi chú', children: order.shipping.notes }] : [])
              ]}
            />
          </Card>
        )}

        <Card className="detail-card" title={<Typography.Title level={2}>Trạng thái đơn hàng</Typography.Title>}>
          <Timeline className="order-detail-timeline" items={timelineItems} />
        </Card>

        {existingReview && (
          <Card className="detail-card" title={<Typography.Title level={2}>{isBuyer() ? 'Đánh giá của bạn' : 'Đánh giá của người mua'}</Typography.Title>}>
            <Flex justify="space-between" align="center" wrap gap={8}>
              <Flex align="center" gap={10}>
                <Rate disabled value={existingReview.rating} />
                <Typography.Text strong>{existingReview.rating}/5</Typography.Text>
              </Flex>
              <Tag color="gold">{existingReview.rating}.0 điểm</Tag>
            </Flex>

            {existingReview.comment && (
              <Typography.Paragraph className="order-detail-quote">"{existingReview.comment}"</Typography.Paragraph>
            )}

            {reviewMedia.length > 0 && (
              <div className="order-detail-evidence">
                <Typography.Text type="secondary">Ảnh/video đính kèm:</Typography.Text>
                {renderEvidencePreview(reviewMedia)}
              </div>
            )}

            <Typography.Text type="secondary">Đánh giá vào {formatDate(existingReview.createdAt)}</Typography.Text>
          </Card>
        )}

        {dispute && (
          <Card className="detail-card" title={<Typography.Title level={2}>Thông tin tranh chấp</Typography.Title>}>
            <Descriptions size="small" column={{ xs: 1, sm: 2 }} items={disputeDetails} />

            <Typography.Title level={4} className="order-detail-subtitle">Hội thoại khiếu nại</Typography.Title>
            <Flex vertical gap={12}>
              {buildDisputeConversationEvents(dispute).map((event) => (
                <Card key={event.key} size="small" className="order-detail-event">
                  <Flex justify="space-between" align="center" wrap gap={8}>
                    <Tag color={event.senderRole === 'seller' ? 'blue' : event.senderRole === 'moderator' ? 'purple' : event.senderRole === 'system' ? 'default' : 'orange'}>{event.senderLabel}</Tag>
                    {event.createdAt && <Typography.Text type="secondary">{formatDate(event.createdAt)}</Typography.Text>}
                  </Flex>
                  <Typography.Paragraph className="order-detail-event__content">{event.content}</Typography.Paragraph>
                  {!!event.evidenceFiles?.length && renderEvidencePreview(event.evidenceFiles)}
                </Card>
              ))}
            </Flex>
          </Card>
        )}
      </Flex>

      <Flex wrap gap={10} className="order-actions">
        {getActionButtons()}
      </Flex>

      {showShipModal && (
        <ShipOrder
          order={order}
          onClose={() => setShowShipModal(false)}
          onSuccess={handleShipSuccess}
        />
      )}

      {showReceiptModal && (
        <ConfirmReceipt
          order={order}
          onClose={() => setShowReceiptModal(false)}
          onSuccess={handleReceiptSuccess}
        />
      )}

      {showRatingModal && (
        <RateSeller
          order={order}
          onSuccess={handleRatingSuccess}
          onCancel={() => setShowRatingModal(false)}
        />
      )}

      {showDisputeModal && (
        <Dispute
          order={order}
          initialReason={disputeMode === 'return' ? 'return_request' : ''}
          onSuccess={handleDisputeSuccess}
          onCancel={() => setShowDisputeModal(false)}
        />
      )}

      <Modal
        open={cancelOpen}
        title="Hủy đơn hàng"
        okText="Hủy đơn hàng"
        cancelText="Giữ đơn hàng"
        okButtonProps={{ danger: true, loading: cancelling }}
        cancelButtonProps={{ disabled: cancelling }}
        onOk={handleCancelOrder}
        onCancel={closeCancelDialog}
        centered
        mask={{ closable: false }}
      >
        <Form layout="vertical">
          <Form.Item label="Nhập lý do hủy đơn hàng của bạn:" htmlFor="cancel-order-reason">
            <Input.TextArea
              id="cancel-order-reason"
              rows={3}
              maxLength={300}
              showCount
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
            />
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        open={showSellerResponseModal}
        title="Phản hồi khiếu nại"
        footer={null}
        width={600}
        centered
        mask={{ closable: false }}
        onCancel={() => setShowSellerResponseModal(false)}
      >
        <Form layout="vertical" onFinish={handleSellerResponseSubmit}>
          {sellerResponseError && <Alert className="order-detail-error" type="error" showIcon role="alert" title={sellerResponseError} />}
          <Form.Item label="Phản hồi của bạn" htmlFor="seller-response" required>
            <Input.TextArea
              id="seller-response"
              value={sellerResponseText}
              onChange={(e) => setSellerResponseText(e.target.value)}
              placeholder="Mô tả phản hồi của bạn về khiếu nại này..."
              rows={5}
              maxLength={1000}
              showCount
            />
          </Form.Item>
          <Form.Item label="Bằng chứng (ảnh/video, tối đa 5)" htmlFor="seller-evidence">
            <EvidencePicker
              id="seller-evidence"
              files={sellerEvidenceImages}
              accept=".png,.jpg,.jpeg,.mp4,image/png,image/jpeg,video/mp4"
              buttonLabel="Chọn tệp"
              disabled={sellerResponseLoading}
              uploading={sellerUploading}
              isVideo={isVideoEvidence}
              notes={[
                'Chỉ nhận PNG/JPG/JPEG hoặc MP4 (H.264), ≤ 100MB, ≤ 3 phút, 720p-1080p.',
                'Video cần là bản quay mở hộp liên tục, không chỉnh sửa.'
              ]}
              onSelect={handleSellerEvidenceUpload}
              onRemove={(index) => setSellerEvidenceImages((prev) => prev.filter((_, i) => i !== index))}
            />
          </Form.Item>
          <Flex justify="flex-end" gap={12}>
            <Button onClick={() => setShowSellerResponseModal(false)}>Hủy</Button>
            <Button type="primary" htmlType="submit" loading={sellerResponseLoading}>
              {sellerResponseLoading ? 'Đang gửi...' : 'Gửi phản hồi'}
            </Button>
          </Flex>
        </Form>
      </Modal>

      <Modal
        open={Boolean(showBuyerFollowUpModal && dispute)}
        title="Gửi tin mới cho moderator"
        footer={null}
        width={600}
        centered
        mask={{ closable: false }}
        onCancel={() => setShowBuyerFollowUpModal(false)}
      >
        <Form layout="vertical" onFinish={handleBuyerFollowUpSubmit}>
          {buyerFollowUpError && <Alert className="order-detail-error" type="error" showIcon role="alert" title={buyerFollowUpError} />}
          <Form.Item label="Ghi chú bổ sung" htmlFor="buyer-follow-up">
            <Input.TextArea
              id="buyer-follow-up"
              value={buyerFollowUpText}
              onChange={(e) => setBuyerFollowUpText(e.target.value)}
              placeholder="Mô tả thêm tình trạng hàng, lý do khiếu nại hoặc thông tin bạn muốn moderator xem xét..."
              rows={5}
              maxLength={1000}
              showCount
            />
          </Form.Item>
          <Form.Item label="Bằng chứng bổ sung (ảnh/video, tối đa 5)" htmlFor="buyer-evidence">
            <EvidencePicker
              id="buyer-evidence"
              files={buyerFollowUpEvidence}
              accept=".png,.jpg,.jpeg,.mp4,image/png,image/jpeg,video/mp4"
              buttonLabel="Chọn tệp"
              disabled={buyerFollowUpLoading}
              uploading={buyerUploading}
              isVideo={isVideoEvidence}
              notes={[
                'Chỉ nhận PNG/JPG/JPEG hoặc MP4 (H.264), ≤ 100MB, ≤ 3 phút, 720p-1080p.',
                'Video cần là bản quay mở hộp liên tục, không chỉnh sửa.'
              ]}
              onSelect={handleBuyerFollowUpUpload}
              onRemove={(index) => setBuyerFollowUpEvidence((prev) => prev.filter((_, i) => i !== index))}
            />
          </Form.Item>
          <Flex justify="flex-end" gap={12}>
            <Button onClick={() => setShowBuyerFollowUpModal(false)}>Hủy</Button>
            <Button type="primary" htmlType="submit" loading={buyerFollowUpLoading}>
              {buyerFollowUpLoading ? 'Đang gửi...' : 'Gửi cho moderator'}
            </Button>
          </Flex>
        </Form>
      </Modal>

      <Modal
        open={showConfirmReturnModal}
        title="Xác nhận nhận lại hàng"
        okText={confirmReturnLoading ? 'Đang xử lý...' : 'Xác nhận đã nhận lại hàng'}
        cancelText="Hủy"
        okButtonProps={{ loading: confirmReturnLoading }}
        cancelButtonProps={{ disabled: confirmReturnLoading }}
        onOk={handleConfirmReturn}
        onCancel={() => setShowConfirmReturnModal(false)}
        centered
        mask={{ closable: false }}
      >
        <Typography.Paragraph>
          Bạn xác nhận đã nhận lại hàng từ người mua? Moderator sẽ tiến hành hoàn tiền cho người mua sau khi bạn xác nhận.
        </Typography.Paragraph>
      </Modal>
    </div>
  );
};

export default OrderDetail;
