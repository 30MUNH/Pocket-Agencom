import { Link } from 'react-router-dom';

export default function Footer() {
  return (
    <footer className="bg-surface-container-lowest dark:bg-tertiary-container full-width py-4 mt-auto border-t border-surface-container/20">
      <div className="max-w-7xl mx-auto px-gutter flex flex-col md:flex-row justify-between items-center gap-4">
        <div className="flex flex-col items-center md:items-start">
          <span className="text-xs font-bold text-primary mb-0.5">Pocket Agencom</span>
          <span className="text-[11px] text-on-surface-variant">
            © {new Date().getFullYear()} Pocket Agencom. Bảo lưu mọi quyền.
          </span>
        </div>
        <div className="flex gap-5">
          <Link
            to="/privacy"
            className="text-[11px] text-on-surface-variant hover:text-primary transition-colors"
          >
            Chính sách Bảo mật
          </Link>
          <Link
            to="/terms"
            className="text-[11px] text-on-surface-variant hover:text-primary transition-colors"
          >
            Điều khoản Dịch vụ
          </Link>
          <Link
            to="/contact"
            className="text-[11px] text-on-surface-variant hover:text-primary transition-colors"
          >
            Liên hệ chúng tôi
          </Link>
        </div>
      </div>
    </footer>
  );
}
