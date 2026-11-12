import React from 'react';
import { Card, Col, Empty, Flex, Row, Spin, Typography } from 'antd';
import ProductCard from './ProductCard';
import './ProductComponents.css';

const GUTTER = [{ xs: 10, md: 20 }, { xs: 10, md: 20 }];

function ProductList({ products, loading }) {
  if (loading) {
    return (
      <Flex vertical align="center" gap={12} className="product-list__loading" role="status">
        <Spin size="large" />
        <Typography.Text type="secondary">Đang tải sản phẩm...</Typography.Text>
      </Flex>
    );
  }

  if (!products || products.length === 0) {
    return (
      <Card className="product-list__empty">
        <Empty
          image={Empty.PRESENTED_IMAGE_SIMPLE}
          description={(
            <Flex vertical gap={4}>
              <Typography.Text strong>Không tìm thấy sản phẩm nào</Typography.Text>
              <Typography.Text type="secondary">Thử thay đổi bộ lọc hoặc từ khóa tìm kiếm</Typography.Text>
            </Flex>
          )}
        />
      </Card>
    );
  }

  return (
    <Row gutter={GUTTER} className="product-list__grid">
      {products.map((product) => (
        <Col key={product._id} xs={12} md={8} lg={6}>
          <ProductCard product={product} />
        </Col>
      ))}
    </Row>
  );
}

export default ProductList;
