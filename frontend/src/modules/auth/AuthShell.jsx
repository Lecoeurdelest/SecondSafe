import React from 'react';
import { Alert, Card, Flex, Typography } from 'antd';
import './Auth.css';

export default function AuthShell({ title, intro, notice, error, footer, children }) {
  return (
    <section className="auth-page">
      <Card className="auth-card">
        <Typography.Title level={1}>{title}</Typography.Title>
        {intro && <Typography.Paragraph type="secondary">{intro}</Typography.Paragraph>}
        {notice && <Alert className="auth-feedback" type="success" showIcon role="status" title={notice} />}
        {error && <Alert className="auth-feedback" type="error" showIcon role="alert" title={error} />}
        {children}
        {footer && <Flex className="auth-links" justify="space-between" wrap gap={8}>{footer}</Flex>}
      </Card>
    </section>
  );
}
