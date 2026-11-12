import React from 'react';
import { Flex, Spin, Typography } from 'antd';

export default function PageLoading({ label = 'Đang tải...' }) {
  return (
    <Flex justify="center" align="center" gap={12} role="status" style={{ minHeight: 400 }}>
      <Spin />
      <Typography.Text type="secondary">{label}</Typography.Text>
    </Flex>
  );
}
