import { Menu, Search, Bell } from 'lucide-react';

export default function Header({ onMenuClick, userRole, onRoleChange, placeholder = "Tìm kiếm..." }) {
  return (
    <header className="flex justify-between items-center w-full px-gutter h-20 z-30 sticky top-0 backdrop-blur-xl bg-surface-container-lowest/80 dark:bg-surface-dim/80 shadow-[0_4px_24px_rgba(255,143,163,0.08)]">
      <div className="flex items-center flex-1 gap-6">
        {/* Mobile Menu Toggle */}
        <button
          onClick={onMenuClick}
          className="lg:hidden p-2 text-on-surface hover:bg-secondary-container/50 rounded-full transition-colors"
        >
          <Menu size={24} />
        </button>

        {/* Global Search Bar (hidden on mobile, visible on medium screens and up) */}
        <div className="relative w-full max-w-md hidden md:block">
          <Search
            size={20}
            className="absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant pointer-events-none"
          />
          <input
            className="w-full bg-surface-container-low border-none rounded-full py-2.5 pl-12 pr-4 text-body-md font-body-md focus:ring-2 focus:ring-secondary-container focus:outline-none transition-shadow"
            placeholder={placeholder}
            type="text"
          />
        </div>
      </div>

      {/* Utilities */}
      <div className="flex items-center gap-4 shrink-0">
        <button className="p-2 text-on-surface-variant hover:bg-secondary-container/50 hover:text-primary transition-all duration-200 rounded-full flex items-center justify-center">
          <Bell size={20} />
        </button>
        <button className="bg-secondary-container text-on-secondary-container text-label-sm font-label-sm px-6 py-2.5 rounded-full hover:bg-secondary-container/80 transition-colors hidden sm:block">
          Tạo nhanh
        </button>

        {/* Role Switcher Select Dropdown */}
        <div className="flex items-center gap-2 bg-surface-container-high rounded-full px-3.5 py-1.5 shadow-sm border border-surface-container/20">
          <span className="text-[10px] uppercase font-bold text-on-surface-variant tracking-wider hidden lg:inline">Vai trò:</span>
          <select
            value={userRole}
            onChange={(e) => onRoleChange(e.target.value)}
            className="bg-transparent border-none py-0 pl-1 pr-8 text-xs font-bold text-primary dark:text-inverse-primary focus:ring-0 outline-none cursor-pointer"
          >
            <option value="user">Người dùng (Thương hiệu)</option>
            <option value="admin">Quản trị viên</option>
            <option value="staff">Nhân viên</option>
          </select>
        </div>

        {/* User Profile Avatar */}
        <div className="w-10 h-10 rounded-full bg-secondary-container overflow-hidden cursor-pointer border-2 border-transparent hover:border-secondary-container transition-colors shrink-0">
          <img
            alt="User Profile Avatar"
            className="w-full h-full object-cover"
            src="https://lh3.googleusercontent.com/aida-public/AB6AXuCOUDnLmWAOQV6NtbBjIdMC0Atp2Fq82glvHLYIWbWXHHwaFsUc6-qgpTpdnmbSYf7cDUROB-0_qE2qUI89B5bdBoYqsfjsrD52AS8tGw6iNl-C2zGv5CXAXoSWhoW0alb1acrmmOOxQQFs16I5addBVnnphw6v6h0H0IOv5CpDyebhYgwe2bWTcPKh2oikDup2r_LgFCindm7trhIjcgtePhNmap_8mtvcWC3szUpOuk4aA9MZwtbU2U_B9RuQaqf32QehsdmE8cE"
          />
        </div>
      </div>
    </header>
  );
}
