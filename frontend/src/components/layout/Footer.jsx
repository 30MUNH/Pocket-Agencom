import { Link } from 'react-router-dom';

export default function Footer() {
  return (
    <footer className="bg-white full-width py-5 mt-auto border-t border-slate-200/80">
      <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-4">
        <div className="flex flex-col items-center md:items-start">
          <span className="text-xs font-bold text-slate-900 mb-0.5">Pocket <span className="text-slate-900">Agencom</span></span>
          <span className="text-xs text-slate-500">
            © {new Date().getFullYear()} Pocket Agencom. Bảo lưu mọi quyền.
          </span>
        </div>
        <div className="flex gap-6">
          <Link
            to="/privacy"
            className="inline-flex min-h-6 items-center text-xs text-slate-500 hover:text-slate-900 transition-colors"
          >
            Chính sách Bảo mật
          </Link>
          <Link
            to="/terms"
            className="inline-flex min-h-6 items-center text-xs text-slate-500 hover:text-slate-900 transition-colors"
          >
            Điều khoản Dịch vụ
          </Link>
          <Link
            to="/contact"
            className="inline-flex min-h-6 items-center text-xs text-slate-500 hover:text-slate-900 transition-colors"
          >
            Liên hệ chúng tôi
          </Link>
        </div>
      </div>
    </footer>
  );
}
