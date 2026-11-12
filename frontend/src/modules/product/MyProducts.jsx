import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import productService from '../../services/product.service';
import { getProductImageUrl, handleImageError } from '../../utils/imageHelper';
import { formatCategoryText } from '../../utils/categoryHelper';
import LinkButton from '../../ui/LinkButton';
import './MyProducts.css';
import { Alert, Button, Card, Col, Empty, Flex, Modal, Pagination, Row, Segmented, Spin, Tag, Typography } from 'antd';
import { MapPin, Plus } from '@phosphor-icons/react';

const STATUS_TAGS = {
  active: { text: 'Đang bán', color: 'success' },
  pending: { text: 'Đang giao dịch', color: 'warning' },
  sold: { text: 'Đã bán', color: 'processing' },
  hidden: { text: 'Đã ẩn', color: 'default' },
  deleted: { text: 'Đã xóa', color: 'error' }
};

const MyProducts = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0
  });
  const [deleteModal, setDeleteModal] = useState({
    show: false,
    productId: null,
    productTitle: ''
  });
  const [visibilityModal, setVisibilityModal] = useState({
    show: false,
    productId: null,
    productTitle: '',
    nextStatus: 'hidden'
  });
  const [processingAction, setProcessingAction] = useState(false);
  const [feedback, setFeedback] = useState({ type: '', message: '' });

  const isRestrictionActive = (account) => {
    const isRestricted = account?.isSellingRestricted === true || account?.isSellingRestricted === 'true';
    if (!isRestricted) return false;

    if (!account?.sellingRestrictedUntil) return true;

    const restrictedUntilTime = new Date(account.sellingRestrictedUntil).getTime();
    return Number.isFinite(restrictedUntilTime) && restrictedUntilTime > Date.now();
  };

  const buildRestrictionMessage = (account) => {
    const untilText = account?.sellingRestrictedUntil
      ? ` đến ${new Date(account.sellingRestrictedUntil).toLocaleString('vi-VN')}`
      : '';
    const reasonText = account?.sellingRestrictedReason
      ? ` Lý do: ${account.sellingRestrictedReason}`
      : '';

    return `Tài khoản của bạn đang bị hạn chế quyền bán${untilText}. Không thể hiện lại tin trong thời gian này.${reasonText}`;
  };

  const canShowProducts = !isRestrictionActive(user);

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }
    fetchMyProducts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, navigate, statusFilter, pagination.page]);

  const fetchMyProducts = async () => {
    try {
      setLoading(true);
      const params = {
        page: pagination.page,
        limit: pagination.limit
      };
      
      if (statusFilter) {
        params.status = statusFilter;
      }
      const data = await productService.getMyProducts(params);
      
      setProducts(data.products || []);
      setPagination(prev => ({
        ...prev,
        total: data.total || 0,
        totalPages: data.totalPages || 0
      }));
    } catch (error) {
      console.error('Error fetching products:', error);
      console.error('Error response:', error.response?.data);
      setFeedback({ type: 'error', message: error.response?.data?.message || 'Không thể tải danh sách tin đăng.' });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    try {
      setProcessingAction(true);
      await productService.deleteProduct(deleteModal.productId);
      setFeedback({ type: 'success', message: 'Đã xóa tin đăng thành công.' });
      setDeleteModal({ show: false, productId: null, productTitle: '' });
      fetchMyProducts();
    } catch (error) {
      setFeedback({ type: 'error', message: error.response?.data?.message || 'Không thể xóa sản phẩm' });
    } finally {
      setProcessingAction(false);
    }
  };

  const handleVisibilityChange = async () => {
    try {
      setProcessingAction(true);
      await productService.updateProductVisibility(visibilityModal.productId, visibilityModal.nextStatus);
      const isHidden = visibilityModal.nextStatus === 'hidden';
      setFeedback({
        type: 'success',
        message: isHidden ? 'Tin đăng đã được ẩn khỏi chợ.' : 'Tin đăng đã được hiển thị lại.'
      });
      setVisibilityModal({ show: false, productId: null, productTitle: '', nextStatus: 'hidden' });
      fetchMyProducts();
    } catch (error) {
      setFeedback({
        type: 'error',
        message: error.response?.data?.message || 'Không thể cập nhật trạng thái hiển thị'
      });
    } finally {
      setProcessingAction(false);
    }
  };

  const openDeleteModal = (product) => {
    setDeleteModal({
      show: true,
      productId: product._id,
      productTitle: product.title
    });
  };

  const closeDeleteModal = () => {
    setDeleteModal({ show: false, productId: null, productTitle: '' });
  };

  const openVisibilityModal = (product, nextStatus) => {
    setVisibilityModal({
      show: true,
      productId: product._id,
      productTitle: product.title,
      nextStatus
    });
  };

  const closeVisibilityModal = () => {
    setVisibilityModal({ show: false, productId: null, productTitle: '', nextStatus: 'hidden' });
  };

  const formatPrice = (price) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(price);
  };

  const handlePageChange = (newPage) => {
    setFeedback({ type: '', message: '' });
    setPagination(prev => ({ ...prev, page: newPage }));
    window.scrollTo(0, 0);
  };

  const applyFilter = (nextFilter) => {
    setFeedback({ type: '', message: '' });
    setStatusFilter(nextFilter);
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  const getVisibilityAction = (product) => {
    if (product.status === 'hidden') {
      return { label: 'Hiện', nextStatus: 'active' };
    }
    return { label: 'Ẩn', nextStatus: 'hidden' };
  };

  if (loading && products.length === 0) {
    return (
      <div className="my-products-container container">
        <Flex justify="center" gap={12} className="my-products-loading" role="status">
          <Spin />
          <Typography.Text type="secondary">Đang tải...</Typography.Text>
        </Flex>
      </div>
    );
  }

  const renderActions = (product) => {
    if (product.status === 'deleted') {
      return [<Typography.Text key="deleted" type="secondary">Tin đã xóa, không thể chỉnh sửa.</Typography.Text>];
    }

    const view = <LinkButton key="view" type="link" to={`/product/${product._id}`}>Xem</LinkButton>;
    const isLockedAction = product.status === 'sold' || product.status === 'pending' || Boolean(product.isInActiveOrder);
    if (isLockedAction) {
      const note = product.status === 'sold'
        ? 'Đã bán - chỉ xem'
        : product.status === 'pending'
          ? 'Đang giao dịch - chỉ xem'
          : 'Đang trong đơn hàng - chỉ xem';
      return [view, <Tag key="locked">{note}</Tag>];
    }

    const actions = [view, <LinkButton key="edit" type="link" to={`/product/${product._id}/edit`}>Sửa</LinkButton>];
    if (product.status === 'active' || product.status === 'hidden') {
      const action = getVisibilityAction(product);
      const blocked = action.nextStatus === 'active' && !canShowProducts;
      actions.push(
        <Button
          key="visibility"
          type="text"
          disabled={blocked}
          title={blocked ? 'Tài khoản đang bị hạn chế quyền bán' : ''}
          onClick={() => openVisibilityModal(product, action.nextStatus)}
        >
          {action.label}
        </Button>
      );
    }
    actions.push(<Button key="delete" type="text" danger onClick={() => openDeleteModal(product)}>Xóa</Button>);
    return actions;
  };

  return (
    <div className="my-products-container container">
      <Flex justify="space-between" align="center" wrap gap={16} className="my-products-header">
        <div>
          <Typography.Title level={1}>Quản lý tin đăng</Typography.Title>
          <Typography.Text type="secondary">Theo dõi trạng thái và chỉnh sửa tin đăng của bạn tại một nơi.</Typography.Text>
        </div>
        <LinkButton type="primary" to="/product/create" icon={<Plus />}>Tạo tin mới</LinkButton>
      </Flex>

      {!canShowProducts && (
        <Alert className="my-products-feedback" type="warning" showIcon title={buildRestrictionMessage(user)} />
      )}

      {feedback.message && (
        <Alert
          className="my-products-feedback"
          type={feedback.type === 'error' ? 'error' : 'success'}
          showIcon
          closable
          role={feedback.type === 'error' ? 'alert' : 'status'}
          title={feedback.message}
          onClose={() => setFeedback({ type: '', message: '' })}
        />
      )}

      <div className="my-products-filter">
        <Segmented
          aria-label="Lọc theo trạng thái"
          value={statusFilter || 'all'}
          onChange={(value) => applyFilter(value === 'all' ? '' : value)}
          options={[
            { value: 'all', label: `Tất cả (${pagination.total})` },
            { value: 'active', label: 'Đang bán' },
            { value: 'sold', label: 'Đã bán' },
            { value: 'hidden', label: 'Đã ẩn' },
            { value: 'deleted', label: 'Đã xóa' }
          ]}
        />
      </div>

      {products.length === 0 ? (
        <Empty
          image={Empty.PRESENTED_IMAGE_SIMPLE}
          description={(
            <Flex vertical gap={4}>
              <Typography.Title level={2}>Chưa có tin đăng nào</Typography.Title>
              <Typography.Text type="secondary">Đăng tin đầu tiên để bắt đầu tiếp cận người mua.</Typography.Text>
            </Flex>
          )}
        >
          <LinkButton type="primary" to="/product/create">Đăng tin ngay</LinkButton>
        </Empty>
      ) : (
        <>
          <Row gutter={[{ xs: 10, md: 20 }, { xs: 10, md: 20 }]} className="my-products-grid">
            {products.map(product => {
              const status = STATUS_TAGS[product.status] || { text: product.status, color: 'default' };
              return (
                <Col key={product._id} xs={24} sm={12} lg={8}>
                  <Card
                    className="my-product-card"
                    cover={(
                      <Link to={`/product/${product._id}`} className="my-product-card__image">
                        <img
                          src={getProductImageUrl(product)}
                          alt={product.title}
                          loading="lazy"
                          onError={(event) => handleImageError(event, 'product')}
                        />
                        <Tag className="my-product-card__status" color={status.color} variant="solid">{status.text}</Tag>
                      </Link>
                    )}
                    actions={renderActions(product)}
                  >
                    <Flex vertical gap={8}>
                      <div>
                        <Typography.Text type="secondary" className="my-product-card__label">Tiêu đề</Typography.Text>
                        <Link to={`/product/${product._id}`} className="my-product-card__title">{product.title}</Link>
                      </div>
                      <Flex justify="space-between" gap={12} wrap>
                        <div>
                          <Typography.Text type="secondary" className="my-product-card__label">Giá bán</Typography.Text>
                          <Typography.Text strong className="my-product-card__price">{formatPrice(product.price)}</Typography.Text>
                        </div>
                        <div>
                          <Typography.Text type="secondary" className="my-product-card__label">Danh mục</Typography.Text>
                          <Tag>{formatCategoryText(product)}</Tag>
                        </div>
                      </Flex>
                      <div>
                        <Typography.Text type="secondary" className="my-product-card__label">Địa chỉ</Typography.Text>
                        <Flex align="center" gap={6}>
                          <MapPin />
                          <span>{product.location?.city || 'Chưa cập nhật vị trí'}</span>
                        </Flex>
                      </div>
                    </Flex>
                  </Card>
                </Col>
              );
            })}
          </Row>

          <Pagination
            className="my-products-pagination"
            align="center"
            hideOnSinglePage
            showSizeChanger={false}
            current={pagination.page}
            pageSize={pagination.limit}
            total={pagination.total}
            onChange={handlePageChange}
          />
        </>
      )}

      <Modal
        open={deleteModal.show}
        title="Xác nhận xóa"
        okText="Xóa"
        cancelText="Hủy"
        okButtonProps={{ danger: true }}
        confirmLoading={processingAction}
        onOk={handleDelete}
        onCancel={closeDeleteModal}
      >
        <p>Bạn có chắc chắn muốn xóa sản phẩm "{deleteModal.productTitle}"?</p>
      </Modal>

      <Modal
        open={visibilityModal.show}
        title={visibilityModal.nextStatus === 'hidden' ? 'Ẩn tin đăng' : 'Hiện lại tin đăng'}
        okText="Xác nhận"
        cancelText="Hủy"
        confirmLoading={processingAction}
        onOk={handleVisibilityChange}
        onCancel={closeVisibilityModal}
      >
        <p>
          {visibilityModal.nextStatus === 'hidden'
            ? `Bạn có chắc muốn ẩn sản phẩm "${visibilityModal.productTitle}"?`
            : `Bạn có chắc muốn hiển thị lại sản phẩm "${visibilityModal.productTitle}"?`}
        </p>
      </Modal>
    </div>
  );
};

export default MyProducts;
