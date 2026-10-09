import React from 'react';

export default class AppErrorBoundary extends React.Component {
  state = { failed: false };

  static getDerivedStateFromError() {
    return { failed: true };
  }

  render() {
    if (this.state.failed) {
      return <main className="container welcome" role="alert"><h1>Không thể hiển thị trang lúc này</h1><p>Vui lòng tải lại trang để thử lại.</p><a href="/">Tải lại trang chủ</a></main>;
    }
    return this.props.children;
  }
}
