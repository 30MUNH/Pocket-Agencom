import { useState } from 'react';
import { Users, BadgeCheck, ClipboardList, DollarSign, TrendingUp, Minus, MoreHorizontal, Building2 } from 'lucide-react';

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState('30days');

  // Daily active user trends (last 14 days)
  const chartData = [
    { day: 'Ngày 1', height: 'h-[40%]', value: '4.8k' },
    { day: 'Ngày 2', height: 'h-[55%]', value: '6.2k' },
    { day: 'Ngày 3', height: 'h-[45%]', value: '5.1k' },
    { day: 'Ngày 4', height: 'h-[70%]', value: '7.8k' },
    { day: 'Ngày 5', height: 'h-[60%]', value: '6.9k' },
    { day: 'Ngày 6', height: 'h-[50%]', value: '5.8k' },
    { day: 'Ngày 7', height: 'h-[80%]', value: '9.2k' },
    { day: 'Ngày 8', height: 'h-[65%]', value: '7.4k' },
    { day: 'Ngày 9', height: 'h-[55%]', value: '6.3k' },
    { day: 'Ngày 10', height: 'h-[75%]', value: '8.7k' },
    { day: 'Ngày 11', height: 'h-[90%]', value: '10.2k' },
    { day: 'Ngày 12', height: 'h-[100%]', value: '11.5k', isPeak: true },
    { day: 'Ngày 13', height: 'h-[85%]', value: '9.8k' },
    { day: 'Ngày 14', height: 'h-[70%]', value: '8.1k' },
  ];

  const recentUpgrades = [
    {
      id: 1,
      company: 'Acme Corp',
      detail: 'Đã nâng cấp lên Gói Premium',
      time: '2 giờ trước',
      avatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBYCYt8JbosNot16MJyOoJ2VYKpDRHXNg2DUPi3Vii45EqmJLLF0-pI4gUsEfWg_A7znnJOWBM9CnESMY_eQ68uRfOpcXrgIjWXKKuuCS_M-RnGvyx0lZ2GqfVk1RPgMOmBNL2F-bGEXdU2pkE3VS7PDkBfjfhRLbY59zyi73R4ZoF_ew2FvJhZ2nxpTdiZOyZsM8DuuAG2QU5oAf9ZEYazUV3AawkW2NVdC_jkVIR_mve7h7DFU_CcmPec5XXEs_kugQtn47jVvFI',
    },
    {
      id: 2,
      company: 'Studio Zenith',
      detail: 'Đã mua Bộ công cụ Marketing',
      time: '5 giờ trước',
      avatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDW-Lyt8N3PXHcx1XPaVjbgnUgksURjhe0IApFKb7lJWo5ue3-ZRkbe6OK0_U3nnRxlLuMR_nR2yJFGPGpxfWOVkAOO-qnRo-JR9wbkQtAWLCNrjeZIa-DwzUnxltmfhhZyGGBpSTYUnkB0zNpaSHNCQMyfiYHe2hd7pvhfU8xPMeTYrxsqG22_gO8BsyEq9BUQSWBmGKNkmXnmDSau8O4sFjhuQYokqG9FBGL1jBo9HwUdXxA4mFUar9zs1UJ7V0uPRgw07FuOkfw',
    },
    {
      id: 3,
      company: 'Global Tech',
      detail: 'Đã thêm 5 thành viên',
      time: '1 ngày trước',
      icon: Building2,
    },
    {
      id: 4,
      company: 'Bloom Boutique',
      detail: 'Đã bắt đầu Dùng thử Miễn phí',
      time: '2 ngày trước',
      avatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDMS0h7JwJxB7kASVuQgtIgAq9VASzYjY_CXVRLYjCwIcIdh9enGIZRCUXm48FtVzmXCdej1TYTf9CrBIUKWItJ4kkBfqFPfz_d-p7BuoWrTCxL1kesnsNHcE6K5NmOsXQGapuqL7Pnb91TSsk6V7IVVHV47ZMxZZKmvSbzuYhIpvAuXwPQ3n43Qc7fxbb3C6mwzqi74wyCB6vtHCcVZrOS5cPMMn6PAbrcecgzMszW4h3p-lcBEH37OjbUnQeJ9JI2cD8sGb6-DP8',
    },
  ];

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h2 className="text-display-lg-mobile md:text-display-lg font-display-lg text-primary dark:text-inverse-primary">
            Tổng quan
          </h2>
          <p className="text-body-lg font-body-lg text-surface-tint mt-2">
            Giao diện quản lý cấp cao và phân tích hệ thống.
          </p>
        </div>
        <div className="flex items-center gap-2 bg-surface-container-lowest dark:bg-tertiary-container rounded-full p-1 shadow-sm border border-surface-container/20">
          <button
            onClick={() => setActiveTab('30days')}
            className={`px-5 py-2 rounded-full font-label-sm text-label-sm transition-all duration-200 ${
              activeTab === '30days'
                ? 'bg-secondary-container text-on-secondary-container font-semibold shadow-sm'
                : 'text-on-surface-variant hover:bg-surface-container-low'
            }`}
          >
            30 Ngày qua
          </button>
          <button
            onClick={() => setActiveTab('year')}
            className={`px-5 py-2 rounded-full font-label-sm text-label-sm transition-all duration-200 ${
              activeTab === 'year'
                ? 'bg-secondary-container text-on-secondary-container font-semibold shadow-sm'
                : 'text-on-surface-variant hover:bg-surface-container-low'
            }`}
          >
            Năm nay
          </button>
        </div>
      </div>

      {/* Key Metrics Bento Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Widget 1: User Count */}
        <div className="bg-surface-container-lowest dark:bg-tertiary-container rounded-3xl p-6 shadow-[0_4px_24px_rgba(255,143,163,0.08)] border border-surface-container/10 flex flex-col justify-between h-40 hover:-translate-y-1 transition-all duration-300">
          <div className="flex justify-between items-start">
            <span className="text-label-sm font-label-sm text-surface-tint uppercase tracking-wider">
              Tổng Người dùng
            </span>
            <div className="w-10 h-10 rounded-full bg-secondary-fixed flex items-center justify-center text-primary">
              <Users size={20} />
            </div>
          </div>
          <div>
            <div className="text-headline-md font-headline-md text-primary dark:text-inverse-primary">
              12,450
            </div>
            <div className="flex items-center gap-1 text-sm text-secondary mt-1">
              <TrendingUp size={14} />
              <span>+12% tháng này</span>
            </div>
          </div>
        </div>

        {/* Widget 2: Staff Count */}
        <div className="bg-surface-container-lowest dark:bg-tertiary-container rounded-3xl p-6 shadow-[0_4px_24px_rgba(255,143,163,0.08)] border border-surface-container/10 flex flex-col justify-between h-40 hover:-translate-y-1 transition-all duration-300">
          <div className="flex justify-between items-start">
            <span className="text-label-sm font-label-sm text-surface-tint uppercase tracking-wider">
              Nhân viên Hoạt động
            </span>
            <div className="w-10 h-10 rounded-full bg-primary-fixed flex items-center justify-center text-primary">
              <BadgeCheck size={20} />
            </div>
          </div>
          <div>
            <div className="text-headline-md font-headline-md text-primary dark:text-inverse-primary">
              142
            </div>
            <div className="flex items-center gap-1 text-sm text-surface-tint mt-1">
              <Minus size={14} />
              <span>Không thay đổi</span>
            </div>
          </div>
        </div>

        {/* Widget 3: Total Plans */}
        <div className="bg-surface-container-lowest dark:bg-tertiary-container rounded-3xl p-6 shadow-[0_4px_24px_rgba(255,143,163,0.08)] border border-surface-container/10 flex flex-col justify-between h-40 hover:-translate-y-1 transition-all duration-300">
          <div className="flex justify-between items-start">
            <span className="text-label-sm font-label-sm text-surface-tint uppercase tracking-wider">
              Gói dịch vụ Hoạt động
            </span>
            <div className="w-10 h-10 rounded-full bg-secondary-container flex items-center justify-center text-primary">
              <ClipboardList size={20} />
            </div>
          </div>
          <div>
            <div className="text-headline-md font-headline-md text-primary dark:text-inverse-primary">
              8,920
            </div>
            <div className="flex items-center gap-1 text-sm text-secondary mt-1">
              <TrendingUp size={14} />
              <span>+5% tháng này</span>
            </div>
          </div>
        </div>

        {/* Widget 4: Revenue */}
        <div className="bg-primary dark:bg-primary-container text-on-primary rounded-3xl p-6 shadow-xl flex flex-col justify-between h-40 hover:-translate-y-1 transition-all duration-300 relative overflow-hidden group">
          <div className="absolute inset-0 opacity-10 bg-cover bg-center mix-blend-overlay bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-secondary-fixed via-primary to-black pointer-events-none" />
          <div className="flex justify-between items-start relative z-10">
            <span className="text-label-sm font-label-sm text-surface-dim uppercase tracking-wider">
              Doanh thu hàng tháng (MRR)
            </span>
            <div className="w-10 h-10 rounded-full bg-on-primary/20 flex items-center justify-center text-on-primary">
              <DollarSign size={20} />
            </div>
          </div>
          <div className="relative z-10">
            <div className="text-headline-md font-headline-md text-on-primary">
              $142,500
            </div>
            <div className="flex items-center gap-1 text-sm text-secondary-container mt-1">
              <TrendingUp size={14} />
              <span>+18% tháng này</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Grid (Charts and Lists) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Chart Section */}
        <div className="lg:col-span-2 bg-surface-container-lowest dark:bg-tertiary-container rounded-3xl p-8 shadow-[0_4px_24px_rgba(255,143,163,0.08)] border border-surface-container/10">
          <div className="flex justify-between items-center mb-8">
            <div>
              <h3 className="text-headline-md font-headline-md text-primary dark:text-inverse-primary">
                Xu hướng Hoạt động Người dùng
              </h3>
              <p className="text-body-md font-body-md text-surface-tint mt-1">
                Người dùng hoạt động hàng ngày trong 14 ngày qua.
              </p>
            </div>
            <button className="text-surface-tint hover:text-primary dark:hover:text-inverse-primary transition-colors p-2 rounded-full">
              <MoreHorizontal size={20} />
            </button>
          </div>

          {/* Stylized CSS Chart Representation */}
          <div className="h-64 flex items-end gap-2 sm:gap-4 w-full px-2 border-b border-surface-container dark:border-outline-variant/30 pb-2">
            {chartData.map((item, idx) => (
              <div
                key={idx}
                className={`w-full ${item.height} rounded-t-lg transition-all duration-300 hover:opacity-80 cursor-pointer relative group ${
                  item.isPeak
                    ? 'bg-primary dark:bg-inverse-primary'
                    : 'bg-secondary-fixed-dim dark:bg-secondary-fixed/30 hover:bg-secondary-container'
                }`}
                title={`${item.day}: ${item.value}`}
              >
                {/* Floating Tooltip on Hover */}
                <div className="absolute -top-10 left-1/2 -translate-x-1/2 bg-surface-variant dark:bg-surface-container-high text-on-surface text-[10px] font-bold py-1 px-2 rounded shadow-md opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-20">
                  {item.value} {item.isPeak && '(Đỉnh điểm)'}
                </div>
              </div>
            ))}
          </div>

          <div className="flex justify-between text-xs text-surface-tint mt-3 font-label-sm font-semibold tracking-wider">
            <span>01 Tháng 5</span>
            <span>07 Tháng 5</span>
            <span>14 Tháng 5</span>
          </div>
        </div>

        {/* Recent Activity List */}
        <div className="bg-surface-container-lowest dark:bg-tertiary-container rounded-3xl p-8 shadow-[0_4px_24px_rgba(255,143,163,0.08)] border border-surface-container/10 flex flex-col justify-between">
          <div>
            <h3 className="text-headline-md font-headline-md text-primary dark:text-inverse-primary mb-6">
              Nâng cấp Gần đây
            </h3>
            <div className="flex flex-col gap-6">
              {recentUpgrades.map((item) => (
                <div key={item.id} className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full overflow-hidden bg-surface-container dark:bg-surface-variant flex items-center justify-center shrink-0 shadow-sm border border-surface-container-high/10">
                    {item.avatar ? (
                      <img
                        alt={item.company}
                        className="w-full h-full object-cover"
                        src={item.avatar}
                      />
                    ) : (
                      <item.icon size={20} className="text-primary dark:text-inverse-primary" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-body-md font-body-md text-primary dark:text-inverse-primary truncate font-semibold">
                      {item.company}
                    </p>
                    <p className="text-sm text-surface-tint truncate">
                      {item.detail}
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <span className="text-label-sm font-label-sm text-secondary font-medium">
                      {item.time}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <button className="w-full mt-6 py-3 rounded-full border border-outline-variant dark:border-outline-variant/30 text-primary dark:text-inverse-primary hover:bg-surface-container-low transition-colors text-label-sm font-label-sm font-bold">
            Xem toàn bộ Hoạt động
          </button>
        </div>
      </div>
    </div>
  );
}
