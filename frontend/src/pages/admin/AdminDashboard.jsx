
import { Users, BadgeCheck, ClipboardList, Wallet, Minus, MoreHorizontal } from 'lucide-react';
import PageHeader from '../../components/ui/PageHeader';

export default function AdminDashboard() {
  const weeklyActivity = [
    { day: 'Thứ 2', height: 'h-[12%]', value: '6' },
    { day: 'Thứ 3', height: 'h-[16%]', value: '8' },
    { day: 'Thứ 4', height: 'h-[34%]', value: '18' },
    { day: 'Thứ 5', height: 'h-[42%]', value: '22' },
    { day: 'Thứ 6', height: 'h-[12%]', value: '6' },
    { day: 'Thứ 7', height: 'h-[0%]', value: '0' },
    { day: 'Chủ nhật', height: 'h-[0%]', value: '0' },
  ];
  const currentDate = new Date();
  const mondayOffset = (currentDate.getDay() + 6) % 7;
  const weekStart = new Date(currentDate);
  weekStart.setDate(currentDate.getDate() - mondayOffset);
  const weeklyPeak = Math.max(...weeklyActivity.map((item) => Number(item.value)));
  const chartData = weeklyActivity.map((item, index) => {
    const date = new Date(weekStart);
    date.setDate(weekStart.getDate() + index);
    return {
      ...item,
      date: date.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' }),
      isPeak: Number(item.value) === weeklyPeak,
    };
  });

  const recentActivity = [
    {
      id: 1,
      name: 'Nguyễn Lan Anh',
      detail: 'Đã đăng nhập và sử dụng công cụ',
      time: '1 ngày trước',
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=NguyenLanAnh',
    },
    {
      id: 2,
      name: 'Trần Minh Đức',
      detail: 'Vừa tạo nội dung mới',
      time: '2 ngày trước',
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=TranMinhDuc',
    },
    {
      id: 3,
      name: 'Phạm Thu Hạnh',
      detail: 'Đang sử dụng công cụ viết bài',
      time: '1 ngày trước',
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=PhamThuHanh',
    },
    {
      id: 4,
      name: 'Bùi Phương Thảo',
      detail: 'Đã mua gói Chuyên nghiệp · 499.000 VND',
      time: '2 ngày trước',
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=BuiPhuongThao',
    },
    {
      id: 5,
      name: 'Vũ Hải Đăng',
      detail: 'Vừa đăng nhập',
      time: '1 ngày trước',
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=VuHaiDang',
    },
    {
      id: 6,
      name: 'Đỗ Mỹ Linh',
      detail: 'Đang chỉnh sửa nội dung',
      time: '2 ngày trước',
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=DoMyLinh',
    },
    {
      id: 7,
      name: 'Đặng Tiến Dũng',
      detail: 'Vừa sử dụng công cụ viết bài',
      time: '1 ngày trước',
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=DangTienDung',
    },
  ];

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Page Header */}
      <PageHeader title="Tổng quan Quản trị" description="Quản lý hệ thống, phân quyền và theo dõi hoạt động." >
        <div className="rounded-xl border border-slate-200 bg-[#FFCED2] px-3.5 py-2 text-xs font-bold text-slate-900">
          Tuần này
        </div>
      </PageHeader>

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
              52
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
              4
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
              Người mua gói
            </span>
            <div className="w-10 h-10 rounded-xl bg-[#FFCED2] flex items-center justify-center text-slate-900 shadow-xs">
              <ClipboardList size={20} />
            </div>
          </div>
          <div>
            <div className="text-2xl font-bold text-slate-900 tracking-tight">
              1
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
              <Wallet size={20} />
            </div>
          </div>
          <div className="relative z-10">
            <div className="text-2xl font-bold text-white tracking-tight">
              499.000 VND
            </div>
            <div className="flex items-center gap-1 text-xs font-semibold text-slate-400 mt-1">
              <Minus size={14} />
              <span>1 gói Chuyên nghiệp đã bán</span>
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
                Người dùng hoạt động trong tuần này.
              </p>
            </div>
            <button className="text-slate-400 hover:text-slate-900 transition-colors p-2 rounded-full">
              <MoreHorizontal size={20} />
            </button>
          </div>

          {/* Stylized CSS Chart Representation */}
          <div className="h-64 flex items-end justify-between gap-1 sm:gap-2 w-full px-2 border-b border-slate-200 pb-2">
            {chartData.map((item, idx) => (
              <div
                key={idx}
                className={`w-5 sm:w-8 shrink-0 ${item.height} rounded-t-lg transition-all duration-300 cursor-pointer relative group ${
                  'bg-[#FFCED2] hover:bg-[#ffb8c0]'
                }`}
                title={`${item.day} (${item.date}): ${item.value} người dùng`}
              >
                <span className="absolute -top-5 left-1/2 -translate-x-1/2 text-[10px] font-semibold text-slate-600 whitespace-nowrap">{item.value}</span>
                {/* Floating Tooltip on Hover */}
                <div className="absolute -top-10 left-1/2 -translate-x-1/2 bg-slate-900 text-white text-[11px] font-semibold py-1 px-2.5 rounded-lg shadow-md opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-20">
                  {item.value} {item.isPeak && '(Đỉnh điểm)'}
                </div>
              </div>
            ))}
          </div>

          <div className="flex justify-between text-xs text-slate-400 mt-3 font-semibold tracking-wider">
            {chartData.map((item) => (
              <span key={item.date}>{item.day}</span>
            ))}
          </div>
        </div>

        {/* Recently Active Users */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200/80 flex flex-col justify-between">
          <div>
            <h3 className="text-lg font-bold text-slate-900 tracking-tight mb-6">
              Người dùng hoạt động gần đây
            </h3>
            <div className="flex flex-col gap-3">
              {recentActivity.map((item) => (
                <div key={item.id} className="flex items-center gap-3.5">
                  <div className="w-10 h-10 rounded-full overflow-hidden bg-slate-100 flex items-center justify-center shrink-0 border border-slate-200">
                    {item.avatar ? (
                      <img
                        alt={item.name}
                        className="w-full h-full object-cover"
                        src={item.avatar}
                      />
                    ) : (
                      <span className="text-sm font-bold text-slate-700">{item.name.charAt(0)}</span>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-slate-900 truncate">
                      {item.name}
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
