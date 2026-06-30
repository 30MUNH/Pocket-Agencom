import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Calendar, DollarSign, Clock, AlertCircle, CheckCircle, MoreVertical, Compass } from 'lucide-react';

const INITIAL_BOOKINGS = [
  {
    id: 'BK-84729',
    creatorName: 'Mina Rose',
    campaignName: 'Ra mắt Mùa hè',
    packageName: 'Video Reels',
    date: '24 thg 10, 2024',
    price: '$450',
    status: 'Pending',
    statusLabel: 'Nhân viên đang duyệt',
    avatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAI7twdX_SV-6HCelpGUhLbpp_SuEkYqO15f432h6OslrzM9QmXi9zMRmvJk0oTUSwbCTY6Mt0LWeIONB3eqMv3PUNI_5IQmqO2aJ2Lemzy1R6FlK0s0D2hmwHvpPlEvDb37DjWtNJ1cYvM2kIWNKhYk2E3tXLGZDi40ygFCcJtH3LP5Dpgx5PJ3lxHtKz9boFTyNFNUiWILj2O8TMWFWyo4RoCghCKmiRhehIj7FuJzY3qwB_YQdKfMp0aaUGrhvIcTwxUt2xdhJ0',
  },
  {
    id: 'BK-84710',
    creatorName: 'Alex Chen',
    campaignName: 'Đánh giá Công nghệ',
    packageName: 'Video TikTok',
    date: '20 thg 10, 2024',
    price: '$850',
    status: 'In Progress',
    statusLabel: 'Đang thực hiện',
    avatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXu83kmbMFRVo4VRM-iExKBkFfpF5YN506o1MVvK2lU3VSSFrQ7KbqrUAfq8dA51lubmEI2nwKHsRSAVHiiCaNnNdqBYbnNEMJvzLCd7-vRO_3vimmM7HTXS9HlTjme2SSu1Yw6pNlVAdHNSOSpGfzatRc4XIr2It4Cn3gRyYxsi1PPA-8nyrX3n35ceum3CqUSqzStyaP2kiq5Ge5-lKAjjp_G4wCi6nFywBT1U_cy8UrWzvN8iikY4KQVXI5Nj3wPPxGFC0HmB6w',
  },
  {
    id: 'BK-84695',
    creatorName: 'Sarah Jenkins',
    campaignName: 'Thể hình Hàng ngày',
    packageName: 'Bài đăng Tin',
    date: '15 thg 10, 2024',
    price: '$150',
    status: 'Completed',
    statusLabel: 'Đã hoàn thành',
    avatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuC15MCZibaR8DyCi1J3dt4II4QbLP-0gVIOUrZeNhiiNI6G2M-3_zzRI3ry3yprPeqYKh3K1xrwwMm9jUYRLOHbr5r4PgQv-qV6VXiGfMU5ClD8uJowFoAvzqGdVAvaDkp0J3AhzBkc566kFQF1Yzp5ZgiUzeQ2rcFnRN3Jigb7KHhwbFTmIdxZRRZ8Fvk7q-IHPYT3E-ZbcQLAz2Bqt0NQiuVDNneFS6v9xJEQmci2GrF1Q0OJBJDa4v4uPR0V1Fjymz74KfEZ-t4',
  },
];

const FILTER_TABS = [
  { key: 'All', label: 'Tất cả' },
  { key: 'Pending', label: 'Chờ duyệt' },
  { key: 'In Progress', label: 'Đang thực hiện' },
  { key: 'Completed', label: 'Đã hoàn thành' },
];

export default function MyBookings() {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [activeFilter, setActiveFilter] = useState('All');

  // Filter bookings based on tab filter & search term
  const filteredBookings = INITIAL_BOOKINGS.filter((b) => {
    const matchesFilter = activeFilter === 'All' || b.status === activeFilter;
    const matchesSearch =
      b.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      b.creatorName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      b.campaignName.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  return (
    <div className="flex-1 w-full space-y-8">
      {/* Title Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
        <div>
          <h1 className="text-display-lg-mobile md:text-display-lg font-display-lg text-primary dark:text-inverse-primary mb-2">
            Đơn đặt campaign
          </h1>
          <p className="font-body-lg text-body-lg text-on-surface-variant">
            Quản lý và theo dõi các chiến dịch chợ sáng tạo KOL của bạn.
          </p>
        </div>

        {/* Filters & Search controls */}
        <div className="flex flex-col sm:flex-row gap-4 w-full md:w-auto items-stretch sm:items-center">
          {/* Search bar */}
          <div className="relative flex-1 sm:w-64">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant" size={16} />
            <input
              type="text"
              placeholder="Tìm kiếm lịch đặt..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-surface-container dark:bg-surface-variant/20 border-none rounded-full focus:ring-2 focus:ring-secondary text-body-md text-primary dark:text-inverse-primary outline-none"
            />
          </div>

          <button
            onClick={() => navigate('/marketplace')}
            className="px-6 py-2.5 rounded-full bg-primary text-on-primary font-label-sm text-label-sm uppercase hover:opacity-90 transition-opacity flex items-center justify-center gap-2"
          >
            <Compass size={14} />
            Đặt KOL
          </button>
        </div>
      </div>

      {/* Tab Filter row */}
      <div className="flex flex-wrap gap-2">
        {FILTER_TABS.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveFilter(tab.key)}
            className={`px-5 py-2 rounded-full font-label-sm text-label-sm uppercase transition-all border ${
              activeFilter === tab.key
                ? 'bg-secondary-container text-on-secondary-container border-secondary-container dark:bg-secondary dark:text-white'
                : 'bg-surface-container text-on-surface-variant border-surface-variant hover:bg-surface-variant/60 dark:bg-surface-variant/20'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Table grid container */}
      <div className="bg-surface-container-lowest dark:bg-tertiary-container rounded-3xl shadow-[0_4px_24px_rgba(255,143,163,0.08)] overflow-hidden border border-surface-variant/50">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-surface-variant/60 bg-surface-container-low/50 dark:bg-surface-variant/10">
                <th className="p-6 font-label-sm text-label-sm text-on-surface-variant dark:text-outline-variant uppercase tracking-wider whitespace-nowrap">
                  Mã Lịch đặt
                </th>
                <th className="p-6 font-label-sm text-label-sm text-on-surface-variant dark:text-outline-variant uppercase tracking-wider whitespace-nowrap">
                  Nhà sáng tạo
                </th>
                <th className="p-6 font-label-sm text-label-sm text-on-surface-variant dark:text-outline-variant uppercase tracking-wider whitespace-nowrap">
                  Chiến dịch
                </th>
                <th className="p-6 font-label-sm text-label-sm text-on-surface-variant dark:text-outline-variant uppercase tracking-wider whitespace-nowrap">
                  Gói
                </th>
                <th className="p-6 font-label-sm text-label-sm text-on-surface-variant dark:text-outline-variant uppercase tracking-wider whitespace-nowrap">
                  Ngày đặt
                </th>
                <th className="p-6 font-label-sm text-label-sm text-on-surface-variant dark:text-outline-variant uppercase tracking-wider whitespace-nowrap">
                  Chi phí
                </th>
                <th className="p-6 font-label-sm text-label-sm text-on-surface-variant dark:text-outline-variant uppercase tracking-wider whitespace-nowrap">
                  Trạng thái
                </th>
                <th className="p-6 font-label-sm text-label-sm text-on-surface-variant dark:text-outline-variant uppercase tracking-wider whitespace-nowrap text-right">
                  Hành động
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-variant/40">
              {filteredBookings.length === 0 ? (
                <tr>
                  <td colSpan={8} className="p-12 text-center text-on-surface-variant">
                    Không tìm thấy lịch đặt nào phù hợp với bộ lọc của bạn.
                  </td>
                </tr>
              ) : (
                filteredBookings.map((booking) => (
                  <tr
                    key={booking.id}
                    onClick={() => navigate(`/bookings/${booking.id}`)}
                    className="hover:bg-surface-container-low/30 dark:hover:bg-surface-variant/5 transition-colors cursor-pointer group"
                  >
                    <td className="p-6 font-body-md text-primary dark:text-inverse-primary font-medium">
                      #{booking.id}
                    </td>
                    <td className="p-6">
                      <div className="flex items-center gap-3">
                        <img
                          alt={booking.creatorName}
                          src={booking.avatar}
                          className="w-8 h-8 rounded-full object-cover bg-surface-container shrink-0"
                        />
                        <span className="font-body-md text-primary dark:text-inverse-primary">
                          {booking.creatorName}
                        </span>
                      </div>
                    </td>
                    <td className="p-6 font-body-md text-on-surface-variant dark:text-inverse-on-surface">
                      {booking.campaignName}
                    </td>
                    <td className="p-6 font-body-md text-on-surface-variant dark:text-inverse-on-surface">
                      {booking.packageName}
                    </td>
                    <td className="p-6 font-body-md text-on-surface-variant dark:text-outline-variant">
                      {booking.date}
                    </td>
                    <td className="p-6 font-body-md text-primary dark:text-inverse-primary font-medium">
                      {booking.price}
                    </td>
                    <td className="p-6">
                      {booking.status === 'Pending' && (
                        <span className="inline-flex items-center px-3 py-1 rounded-full bg-secondary-container text-on-secondary-container dark:bg-secondary/40 dark:text-white font-label-sm text-label-sm">
                          <Clock size={12} className="mr-1.5" />
                          {booking.statusLabel}
                        </span>
                      )}
                      {booking.status === 'In Progress' && (
                        <span className="inline-flex items-center px-3 py-1 rounded-full bg-primary-fixed text-primary-container dark:bg-primary-fixed-dim/20 dark:text-primary-fixed font-label-sm text-label-sm">
                          <AlertCircle size={12} className="mr-1.5" />
                          {booking.statusLabel}
                        </span>
                      )}
                      {booking.status === 'Completed' && (
                        <span className="inline-flex items-center px-3 py-1 rounded-full bg-surface-variant text-on-surface-variant dark:bg-surface-variant/40 dark:text-inverse-on-surface font-label-sm text-label-sm">
                          <CheckCircle size={12} className="mr-1.5" />
                          {booking.statusLabel}
                        </span>
                      )}
                    </td>
                    <td className="p-6 text-right" onClick={(e) => e.stopPropagation()}>
                      <button
                        onClick={() => navigate(`/bookings/${booking.id}`)}
                        className="px-4 py-1.5 rounded-full bg-surface-container dark:bg-surface-variant/30 text-primary dark:text-inverse-primary font-label-sm text-label-sm hover:bg-secondary-container/50 dark:hover:bg-secondary/30 transition-colors"
                      >
                        Xem
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Footer pagination info */}
        <div className="p-6 border-t border-surface-variant/40 flex justify-between items-center bg-surface/50 dark:bg-surface-variant/5">
          <span className="font-label-sm text-label-sm text-on-surface-variant">
            Hiển thị {filteredBookings.length} trên {filteredBookings.length} mục
          </span>
        </div>
      </div>
    </div>
  );
}
