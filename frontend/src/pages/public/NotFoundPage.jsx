import { ArrowLeft, Home } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function NotFoundPage() {
  return (
    <main className="min-h-screen bg-white text-slate-900 flex items-center justify-center px-6">
      <section className="w-full max-w-lg rounded-2xl bg-white border border-slate-200/80 shadow-sm p-8 md:p-10 text-center">
        <span className="inline-block px-3 py-1 rounded-full bg-[#FFCED2] text-slate-900 text-xs font-extrabold uppercase tracking-widest shadow-xs">
          404 ERROR
        </span>
        <h1 className="mt-4 text-3xl font-bold text-slate-900 tracking-tight">
          Không tìm thấy trang
        </h1>
        <p className="mt-3 text-sm text-slate-600 leading-relaxed max-w-md mx-auto">
          Địa chỉ này không tồn tại hoặc tính năng đã ngừng hoạt động.
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <button
            onClick={() => window.history.back()}
            className="px-5 py-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 font-semibold text-sm flex items-center gap-2 transition-all shadow-xs"
          >
            <ArrowLeft size={16} /> Quay lại
          </button>
          <Link
            to="/"
            className="px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-sm flex items-center gap-2 transition-all shadow-sm"
          >
            <Home size={16} /> Trang chủ
          </Link>
        </div>
      </section>
    </main>
  );
}
