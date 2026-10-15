import { useState } from 'react';
import { Users, BadgeCheck, ClipboardList, DollarSign, TrendingUp, Minus, MoreHorizontal, Building2 } from 'lucide-react';
import PageHeader from '../../components/ui/PageHeader';

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
      <PageHeader title="Tổng quan Quản trị" description="Quản lý hệ thống, phân quyền và theo dõi hoạt động." >
        <div className="flex items-center gap-1.5 bg-slate-100 rounded-xl p-1 border border-slate-200">
          <button
            onClick={() => setActiveTab('30days')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
              activeTab === '30days'
                ? 'bg-[#FFCED2] text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            30 Ngày qua
          </button>
          <button
            onClick={() => setActiveTab('year')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
              activeTab === 'year'
                ? 'bg-[#FFCED2] text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Năm nay
          </button>
        </div>
      </PageHeader>

      <p role="status" className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-xs font-medium text-amber-900">
        Số liệu và hoạt động bên dưới là dữ liệu minh họa; bảng điều khiển chưa kết nối với thống kê trực tiếp.
      </p>

      {/* Key Metrics Bento Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* Widget 1: User Count */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200/80 flex flex-col justify-between h-40 transition-all hover:border-slate-300">
          <div className="flex justify-between items-start">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Tổng Người dùng
            </span>
            <div className="w-10 h-10 rounded-xl bg-[#FFCED2] flex items-center justify-center text-slate-900 shadow-xs">
              <Users size={20} />
            </div>
          </div>
          <div>
            <div className="text-2xl font-bold text-slate-900 tracking-tight">
              12,450
            </div>
            <div className="flex items-center gap-1 text-xs font-semibold text-emerald-600 mt-1">
              <TrendingUp size={14} />
              <span>+12% tháng này</span>
            </div>
          </div>
        </div>

        {/* Widget 2: Staff Count */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200/80 flex flex-col justify-between h-40 transition-all hover:border-slate-300">
          <div className="flex justify-between items-start">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Nhân viên Hoạt động
            </span>
            <div className="w-10 h-10 rounded-xl bg-[#FFCED2] flex items-center justify-center text-slate-900 shadow-xs">
              <BadgeCheck size={20} />
            </div>
          </div>
          <div>
            <div className="text-2xl font-bold text-slate-900 tracking-tight">
              142
            </div>
            <div className="flex items-center gap-1 text-xs font-semibold text-slate-500 mt-1">
              <Minus size={14} />
              <span>Không thay đổi</span>
            </div>
          </div>
        </div>

        {/* Widget 3: Total Plans */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200/80 flex flex-col justify-between h-40 transition-all hover:border-slate-300">
          <div className="flex justify-between items-start">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Gói dịch vụ Hoạt động
            </span>
            <div className="w-10 h-10 rounded-xl bg-[#FFCED2] flex items-center justify-center text-slate-900 shadow-xs">
              <ClipboardList size={20} />
            </div>
          </div>
          <div>
            <div className="text-2xl font-bold text-slate-900 tracking-tight">
              8,920
            </div>
            <div className="flex items-center gap-1 text-xs font-semibold text-emerald-600 mt-1">
              <TrendingUp size={14} />
              <span>+5% tháng này</span>
            </div>
          </div>
        </div>

        {/* Widget 4: Revenue */}
        <div className="bg-slate-900 text-white rounded-2xl p-6 shadow-sm flex flex-col justify-between h-40 relative overflow-hidden group">
          <div className="flex justify-between items-start relative z-10">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              Doanh thu tháng (MRR)
            </span>
            <div className="w-10 h-10 rounded-xl bg-[#FFCED2] flex items-center justify-center text-slate-900 shadow-xs">
              <DollarSign size={20} />
            </div>
          </div>
          <div className="relative z-10">
            <div className="text-2xl font-bold text-white tracking-tight">
              $142,500
            </div>
            <div className="flex items-center gap-1 text-xs font-semibold text-emerald-400 mt-1">
              <TrendingUp size={14} />
              <span>+18% tháng này</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Grid (Charts and Lists) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Chart Section */}
        <div className="lg:col-span-2 bg-white rounded-2xl p-6 shadow-sm border border-slate-200/80">
          <div className="flex justify-between items-center mb-8">
            <div>
              <h3 className="text-lg font-bold text-slate-900 tracking-tight">
                Xu hướng Hoạt động Người dùng
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                Người dùng hoạt động hàng ngày trong 14 ngày qua.
              </p>
            </div>
            <button className="text-slate-400 hover:text-slate-900 transition-colors p-2 rounded-full">
              <MoreHorizontal size={20} />
            </button>
          </div>

          {/* Stylized CSS Chart Representation */}
          <div className="h-64 flex items-end gap-2 sm:gap-4 w-full px-2 border-b border-slate-200 pb-2">
            {chartData.map((item, idx) => (
              <div
                key={idx}
                className={`w-full ${item.height} rounded-t-lg transition-all duration-300 cursor-pointer relative group ${
                  item.isPeak
                    ? 'bg-slate-900 hover:bg-slate-800'
                    : 'bg-slate-200 hover:bg-[#FFCED2]'
                }`}
                title={`${item.day}: ${item.value}`}
              >
                {/* Floating Tooltip on Hover */}
                <div className="absolute -top-10 left-1/2 -translate-x-1/2 bg-slate-900 text-white text-[11px] font-semibold py-1 px-2.5 rounded-lg shadow-md opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-20">
                  {item.value} {item.isPeak && '(Đỉnh điểm)'}
                </div>
              </div>
            ))}
          </div>

          <div className="flex justify-between text-xs text-slate-400 mt-3 font-semibold tracking-wider">
            <span>01 Tháng 5</span>
            <span>07 Tháng 5</span>
            <span>14 Tháng 5</span>
          </div>
        </div>

        {/* Recent Activity List */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200/80 flex flex-col justify-between">
          <div>
            <h3 className="text-lg font-bold text-slate-900 tracking-tight mb-6">
              Nâng cấp Gần đây
            </h3>
            <div className="flex flex-col gap-5">
              {recentUpgrades.map((item) => (
                <div key={item.id} className="flex items-center gap-3.5">
                  <div className="w-10 h-10 rounded-full overflow-hidden bg-slate-100 flex items-center justify-center shrink-0 border border-slate-200">
                    {item.avatar ? (
                      <img
                        alt={item.company}
                        className="w-full h-full object-cover"
                        src={item.avatar}
                      />
                    ) : (
                      <item.icon size={20} className="text-slate-700" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-slate-900 truncate">
                      {item.company}
                    </p>
                    <p className="text-xs text-slate-500 truncate">
                      {item.detail}
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <span className="text-xs font-medium text-slate-400">
                      {item.time}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <button className="w-full mt-6 py-2.5 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50 hover:text-slate-900 transition-colors text-xs font-bold">
            Xem toàn bộ Hoạt động
          </button>
        </div>
      </div>
    </div>
  );
}
