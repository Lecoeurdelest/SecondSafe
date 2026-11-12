import React from 'react';
import { Button, Result, Typography } from 'antd';

export default class AppErrorBoundary extends React.Component {
  state = { failed: false };

  static getDerivedStateFromError() {
    return { failed: true };
  }

  render() {
    if (this.state.failed) {
      return (
        <main className="container" role="alert">
          <Result
            status="error"
            title={<Typography.Title level={1}>Không thể hiển thị trang lúc này</Typography.Title>}
            subTitle="Vui lòng tải lại trang để thử lại."
            extra={<Button type="primary" href="/">Tải lại trang chủ</Button>}
          />
        </main>
      );
    }
    return this.props.children;
  }
}
