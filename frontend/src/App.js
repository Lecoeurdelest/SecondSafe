import React, { lazy, Suspense } from 'react';
import { BrowserRouter, Link, Route, Routes } from 'react-router-dom';
import AppErrorBoundary from './components/AppErrorBoundary';
import Home from './modules/home/Home';

const Chat = lazy(() => import('./modules/chat/Chat'));

function NotFound() {
  return <section className="welcome"><h1>Không tìm thấy trang</h1><p>Trang bạn đang tìm không tồn tại.</p><Link to="/">Về trang chủ</Link></section>;
}

export default function App() {
  return (
    <AppErrorBoundary>
      <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <a className="skip-link" href="#main-content">Chuyển đến nội dung chính</a>
        <header className="site-header"><div className="container"><Link className="site-brand" to="/" aria-label="SecondSafe — Trang chủ">SecondSafe</Link></div></header>
        <main id="main-content" tabIndex="-1">
          <Suspense fallback={<p role="status">Đang tải...</p>}>
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/chat" element={<Chat />} />
              <Route path="/chat/:conversationId" element={<Chat />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </Suspense>
        </main>
        <footer className="site-footer"><div className="container">SecondSafe · Trao đồ cũ, nhận giá trị mới.</div></footer>
      </BrowserRouter>
    </AppErrorBoundary>
  );
}
