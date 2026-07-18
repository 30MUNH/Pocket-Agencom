import { Link, useOutletContext } from 'react-router-dom';
import {
  User,
  Eye,
  EyeOff,
  TrendingUp,
  Star,
  CheckCircle2,
  ArrowRight,
  Sparkles,
  Users,
  DollarSign,
} from 'lucide-react';
import { useMyKolProfile } from '../../hooks/useKols';

function getProfileCompletion(profile) {
  if (!profile) return { percent: 0, items: [] };

  const checks = [
    { label: 'Thêm tiểu sử (Bio)', done: !!profile.bio && profile.bio.trim().length > 0 },
    { label: 'Chọn lĩnh vực hoạt động', done: (profile.categories || []).length > 0 },
    { label: 'Thiết lập giá booking', done: !!profile.bookingPrice && profile.bookingPrice > 0 },
    { label: 'Thêm liên kết mạng xã hội', done: profile.platforms && Object.keys(profile.platforms).some(k => !!profile.platforms[k]) },
    { label: 'Bật hiển thị công khai', done: !!profile.isPublic },
  ];

  const doneCount = checks.filter((c) => c.done).length;
  const percent = Math.round((doneCount / checks.length) * 100);
  return { percent, items: checks };
}

export default function KolDashboard() {
  const { user } = useOutletContext();
  const { data: profile, isLoading } = useMyKolProfile();

  const { percent, items } = getProfileCompletion(profile);

  return (
    <div className="space-y-8">
      {/* Welcome Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-display-lg-mobile md:text-headline-md font-bold text-primary mb-1">
            Xin chào, {user?.name || 'KOL'} 👋
          </h1>
          <p className="text-body-md font-body-md text-on-surface-variant">
            Quản lý hồ sơ và theo dõi cơ hội hợp tác của bạn.
          </p>
        </div>
        <Link
          to="/kol/profile"
          className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-[#ff758f] to-[#c97aff] text-white rounded-full text-xs font-bold hover:from-[#ff5c7a] hover:to-[#b55eee] transition-all shadow-ambient hover:shadow-ambient-hover hover:-translate-y-0.5"
        >
          <Sparkles size={16} />
          Chỉnh sửa hồ sơ
        </Link>
      </div>

      {/* Stats Cards Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        <div className="bg-surface-container-lowest rounded-3xl border border-surface-container/20 p-6 shadow-ambient">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-xl bg-[#ff758f]/10 flex items-center justify-center">
              {profile?.isPublic ? <Eye size={20} className="text-[#ff758f]" /> : <EyeOff size={20} className="text-on-surface-variant" />}
            </div>
            <span className="text-[11px] font-bold text-on-surface-variant uppercase tracking-widest">Trạng thái</span>
          </div>
          <p className={`text-lg font-bold ${profile?.isPublic ? 'text-[#22c55e]' : 'text-on-surface-variant'}`}>
            {profile?.isPublic ? 'Đang hiển thị' : 'Ẩn'}
          </p>
          <p className="text-[11px] text-on-surface-variant mt-1">
            {profile?.isPublic ? 'Thương hiệu có thể tìm thấy bạn' : 'Chưa hiển thị trên danh bạ'}
          </p>
        </div>

        <div className="bg-surface-container-lowest rounded-3xl border border-surface-container/20 p-6 shadow-ambient">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-xl bg-[#c97aff]/10 flex items-center justify-center">
              <Users size={20} className="text-[#c97aff]" />
            </div>
            <span className="text-[11px] font-bold text-on-surface-variant uppercase tracking-widest">Followers</span>
          </div>
          <p className="text-lg font-bold text-primary">
            {profile?.followerCount ? Number(profile.followerCount).toLocaleString('vi-VN') : '0'}
          </p>
          <p className="text-[11px] text-on-surface-variant mt-1">Tổng số người theo dõi</p>
        </div>

        <div className="bg-surface-container-lowest rounded-3xl border border-surface-container/20 p-6 shadow-ambient">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-xl bg-secondary-container/40 flex items-center justify-center">
              <DollarSign size={20} className="text-primary" />
            </div>
            <span className="text-[11px] font-bold text-on-surface-variant uppercase tracking-widest">Giá Booking</span>
          </div>
          <p className="text-lg font-bold text-primary">
            {profile?.bookingPrice ? `${Number(profile.bookingPrice).toLocaleString('vi-VN')} VND` : 'Chưa thiết lập'}
          </p>
          <p className="text-[11px] text-on-surface-variant mt-1">Giá mỗi lượt booking</p>
        </div>
      </div>

      {/* Profile Completion Card */}
      {percent < 100 && (
        <div className="bg-gradient-to-br from-surface-container-lowest to-[#fff0f3]/50 rounded-3xl border border-[#F897A8]/20 p-8 shadow-ambient relative overflow-hidden">
          <div className="absolute top-0 right-0 w-40 h-40 bg-[#ff758f]/5 rounded-full -translate-y-1/2 translate-x-1/2 blur-2xl" />
          <div className="relative">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#ff758f] to-[#c97aff] flex items-center justify-center">
                <TrendingUp size={24} className="text-white" />
              </div>
              <div>
                <h2 className="text-sm font-bold text-primary">Hoàn thiện Profile</h2>
                <p className="text-[11px] text-on-surface-variant">Hoàn thành hồ sơ để xuất hiện trước thương hiệu</p>
              </div>
            </div>

            {/* Progress Bar */}
            <div className="mb-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] font-bold text-on-surface-variant">{percent}% hoàn thành</span>
                <span className="text-[11px] text-on-surface-variant">
                  {items.filter((i) => i.done).length}/{items.length} bước
                </span>
              </div>
              <div className="w-full h-2.5 bg-surface-container rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-[#ff758f] to-[#c97aff] rounded-full transition-all duration-500"
                  style={{ width: `${percent}%` }}
                />
              </div>
            </div>

            {/* Checklist */}
            <div className="space-y-3 mb-6">
              {items.map((item, idx) => (
                <div key={idx} className="flex items-center gap-3">
                  <CheckCircle2
                    size={18}
                    className={`shrink-0 transition-colors ${
                      item.done ? 'text-[#22c55e]' : 'text-surface-container-high'
                    }`}
                    fill={item.done ? 'currentColor' : 'none'}
                  />
                  <span
                    className={`text-xs ${
                      item.done ? 'text-on-surface-variant line-through' : 'text-primary font-medium'
                    }`}
                  >
                    {item.label}
                  </span>
                </div>
              ))}
            </div>

            <Link
              to="/kol/profile"
              className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-on-primary rounded-full text-xs font-bold hover:bg-primary/90 transition-all hover:-translate-y-0.5 shadow-ambient"
            >
              Hoàn thiện ngay
              <ArrowRight size={16} />
            </Link>
          </div>
        </div>
      )}

      {/* Completed State */}
      {percent === 100 && (
        <div className="bg-surface-container-lowest rounded-3xl border border-[#22c55e]/20 p-8 shadow-ambient text-center">
          <div className="w-16 h-16 rounded-full bg-[#22c55e]/10 flex items-center justify-center mx-auto mb-4">
            <CheckCircle2 size={32} className="text-[#22c55e]" fill="currentColor" />
          </div>
          <h2 className="text-sm font-bold text-primary mb-2">Hồ sơ đã hoàn thiện!</h2>
          <p className="text-xs text-on-surface-variant max-w-md mx-auto">
            Hồ sơ của bạn đang hiển thị trên danh bạ KOL/KOC. Thương hiệu có thể tìm thấy và liên hệ bạn bất kỳ lúc nào.
          </p>
          <Link
            to="/kols"
            className="inline-flex items-center gap-2 mt-6 px-5 py-2.5 bg-surface-container-low text-primary rounded-full text-xs font-bold hover:bg-surface-container transition-all"
          >
            Xem danh bạ
            <ArrowRight size={14} />
          </Link>
        </div>
      )}
    </div>
  );
}
