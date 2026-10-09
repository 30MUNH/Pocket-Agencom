import { ArrowLeft, Home } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function NotFoundPage() {
  return (
    <main className="min-h-screen bg-background text-on-background flex items-center justify-center px-gutter">
      <section className="w-full max-w-xl rounded-[2.5rem] bg-surface-container-lowest border border-surface-variant/30 shadow-ambient p-10 text-center">
        <span className="text-label-sm font-bold uppercase tracking-[0.2em] text-secondary">404</span>
        <h1 className="mt-3 text-display-lg-mobile md:text-display-lg font-display-lg text-primary">
          Không tìm thấy trang
        </h1>
        <p className="mt-4 text-body-lg text-on-surface-variant">
          Địa chỉ này không tồn tại hoặc tính năng đã ngừng hoạt động.
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <button onClick={() => window.history.back()} className="px-5 py-3 rounded-full border border-outline-variant text-primary font-bold flex items-center gap-2">
            <ArrowLeft size={16} /> Quay lại
          </button>
          <Link to="/" className="px-5 py-3 rounded-full bg-primary text-on-primary font-bold flex items-center gap-2">
            <Home size={16} /> Trang chủ
          </Link>
        </div>
      </section>
    </main>
  );
}
