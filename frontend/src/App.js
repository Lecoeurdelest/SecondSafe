import React, { Suspense } from 'react';
import { BrowserRouter, Link, Route, Routes } from 'react-router-dom';
import AppErrorBoundary from './components/AppErrorBoundary';

function Welcome() {
  return (
    <section className="welcome" aria-labelledby="welcome-title">
      <p className="welcome__eyebrow">Cho món đồ một hành trình mới</p>
      <h1 id="welcome-title">Mua bán đồ cũ,<br />an tâm mỗi giao dịch.</h1>
      <p>Khám phá những món đồ còn nhiều giá trị và kết nối với người bán trên SecondSafe.</p>
    </section>
  );
}

function NotFound() {
  return <section className="welcome"><h1>Không tìm thấy trang</h1><p>Trang bạn đang tìm không tồn tại.</p><Link to="/">Về trang chủ</Link></section>;
}

export default function App() {
  return (
    <AppErrorBoundary>
      <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <a className="skip-link" href="#main-content">Chuyển đến nội dung chính</a>
        <header className="site-header"><div className="container"><Link className="site-brand" to="/" aria-label="SecondSafe — Trang chủ">SecondSafe</Link></div></header>
        <main id="main-content" className="container" tabIndex="-1">
          <Suspense fallback={<p role="status">Đang tải...</p>}>
            <Routes><Route path="/" element={<Welcome />} /><Route path="*" element={<NotFound />} /></Routes>
          </Suspense>
        </main>
        <footer className="site-footer"><div className="container">SecondSafe · Trao đồ cũ, nhận giá trị mới.</div></footer>
      </BrowserRouter>
    </AppErrorBoundary>
  );
}
