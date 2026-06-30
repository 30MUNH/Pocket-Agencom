import { useState } from 'react';
import { Calendar, ArrowRight, Edit3, Trash2, ChevronDown } from 'lucide-react';

const INITIAL_PLANS = [
  {
    id: 1,
    title: 'Chiến lược Chiến dịch Kỳ nghỉ Q4',
    desc: 'Triển khai toàn diện trên mạng xã hội và email cho các chương trình khuyến mãi cuối năm.',
    date: '12 thg 10, 2024',
    type: 'Mạng xã hội',
    status: 'Active',
    statusColor: 'bg-green-500',
  },
  {
    id: 2,
    title: 'Nội dung Làm mới Thương hiệu Mùa xuân',
    desc: 'Cập nhật tài sản hình ảnh và trụ cột thông điệp trên tất cả các nền tảng xã hội.',
    date: '05 thg 11, 2024',
    type: 'Chiến lược Nội dung',
    status: 'Draft',
    statusColor: 'bg-outline',
  },
  {
    id: 3,
    title: 'Chuỗi Bản tin Hàng tuần',
    desc: 'Chiến dịch nhỏ giọt tự động tập trung vào việc giữ chân khách hàng và bán thêm.',
    date: '28 thg 9, 2024',
    type: 'Chiến dịch Email',
    status: 'Active',
    statusColor: 'bg-green-500',
  },
];

export default function MyPlans() {
  const [plans, setPlans] = useState(INITIAL_PLANS);
  const [selectedDate, setSelectedDate] = useState('Tất cả Ngày');
  const [selectedType, setSelectedType] = useState('Tất cả Loại hình');

  const handleDelete = (id) => {
    setPlans((prev) => prev.filter((plan) => plan.id !== id));
  };

  const filteredPlans = plans.filter((plan) => {
    const matchesType = selectedType === 'Tất cả Loại hình' || plan.type === selectedType;
    return matchesType;
  });

  return (
    <div className="flex-1 w-full space-y-8">
      {/* Page Header & Filters */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
        <div>
          <h2 className="text-display-lg-mobile md:text-display-lg font-display-lg-mobile md:font-display-lg text-primary mb-2">
            Kế hoạch của tôi
          </h2>
          <p className="text-body-lg font-body-lg text-on-surface-variant">
            Quản lý và xem lại các chiến lược tiếp thị của bạn.
          </p>
        </div>
        <div className="flex flex-wrap gap-4 items-center w-full md:w-auto">
          {/* Date Filter */}
          <div className="relative w-full md:w-auto">
            <select
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="appearance-none bg-surface-container-low border-none rounded-full py-2.5 pl-6 pr-10 text-body-md font-body-md text-on-surface focus:ring-2 focus:ring-secondary-container cursor-pointer w-full md:w-auto focus:outline-none"
            >
              <option value="Tất cả Ngày">Tất cả Ngày</option>
              <option value="Tháng này">Tháng này</option>
              <option value="Tháng trước">Tháng trước</option>
              <option value="Quý 1 2024">Quý 1 2024</option>
            </select>
            <ChevronDown
              size={18}
              className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-on-surface-variant"
            />
          </div>

          {/* Type Filter */}
          <div className="relative w-full md:w-auto">
            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              className="appearance-none bg-surface-container-low border-none rounded-full py-2.5 pl-6 pr-10 text-body-md font-body-md text-on-surface focus:ring-2 focus:ring-secondary-container cursor-pointer w-full md:w-auto focus:outline-none"
            >
              <option value="Tất cả Loại hình">Tất cả Loại hình</option>
              <option value="Mạng xã hội">Mạng xã hội</option>
              <option value="Chiến dịch Email">Chiến dịch Email</option>
              <option value="Chiến lược Nội dung">Chiến lược Nội dung</option>
            </select>
            <ChevronDown
              size={18}
              className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-on-surface-variant"
            />
          </div>
        </div>
      </div>

      {/* Plans Bento Grid */}
      {filteredPlans.length === 0 ? (
        <div className="text-center py-20 bg-surface-container-lowest rounded-3xl border-2 border-dashed border-surface-container">
          <p className="text-body-lg text-on-surface-variant font-medium">Không có kế hoạch nào phù hợp với các bộ lọc đã chọn.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {filteredPlans.map((plan) => (
            <div
              key={plan.id}
              className="bg-surface-container-lowest rounded-3xl p-8 shadow-ambient hover:-translate-y-1 hover:shadow-ambient-hover transition-all duration-300 flex flex-col h-full group"
            >
              {/* Top Row with Status and Actions */}
              <div className="flex justify-between items-start mb-6">
                <span
                  className={`${
                    plan.status === 'Active'
                      ? 'bg-secondary-container/50 text-on-secondary-container'
                      : 'bg-surface-container-high text-on-surface-variant'
                  } px-3 py-1 rounded-full text-label-sm font-label-sm inline-flex items-center gap-1.5`}
                >
                  <span className={`w-2 h-2 rounded-full ${plan.statusColor}`} />
                  {plan.status === 'Active' ? 'Hoạt động' : 'Bản nháp'}
                </span>
                <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button className="p-2 text-on-surface-variant hover:text-primary hover:bg-surface-container-low rounded-full transition-colors">
                    <Edit3 size={16} />
                  </button>
                  <button
                    onClick={() => handleDelete(plan.id)}
                    className="p-2 text-on-surface-variant hover:text-error hover:bg-error-container/30 rounded-full transition-colors"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>

              {/* Title & Description */}
              <h3 className="text-headline-md font-headline-md text-primary mb-2 line-clamp-2">
                {plan.title}
              </h3>
              <p className="text-body-md font-body-md text-on-surface-variant mb-6 flex-1">
                {plan.desc}
              </p>

              {/* Date & CTA */}
              <div className="flex items-center justify-between border-t border-surface-container-high pt-4 mt-auto">
                <div className="flex items-center text-on-surface-variant text-label-sm font-label-sm gap-2">
                  <Calendar size={16} />
                  {plan.date}
                </div>
                <button className="text-primary hover:text-on-secondary-container text-label-sm font-label-sm flex items-center gap-1 transition-colors">
                  Xem Chi tiết
                  <ArrowRight size={16} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
