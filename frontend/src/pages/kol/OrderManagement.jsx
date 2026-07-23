import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Package, Inbox, Send, Search, Filter, CheckCircle2, XCircle, Clock, MessageSquare, ArrowUpRight, DollarSign, Calendar, Building } from 'lucide-react';
import { toast } from '../../store/toastStore';

const MOCK_RECEIVED_INQUIRIES = [
  {
    id: 'INQ-101',
    campaignName: 'Chiến dịch Ra mắt Serum Dưỡng Da Căng Bóng',
    brandName: 'Cosmetics Glow Vietnam',
    brandLogo: 'https://api.dicebear.com/7.x/identicon/svg?seed=glow',
    productName: 'Serum Glow C++ 30ml',
    budget: 450000,
    status: 'pending',
    date: '2026-07-22',
    note: 'Cần 1 bài đăng Instagram Reels và 1 Story đính kèm link mua hàng trên Shopee.',
  },
  {
    id: 'INQ-102',
    campaignName: 'Quảng bá Tai Nghe Bluetooth Chống Ồn ANC',
    brandName: 'TechGear Official Store',
    brandLogo: 'https://api.dicebear.com/7.x/identicon/svg?seed=techgear',
    productName: 'Tai nghe TechGear X-Pro',
    budget: 550000,
    status: 'accepted',
    date: '2026-07-20',
    note: 'Yêu cầu unboxing trải nghiệm tính năng chống ồn chủ động.',
  },
  {
    id: 'INQ-103',
    campaignName: 'Trải nghiệm Thực đơn Mùa Hè 2026',
    brandName: 'Phở & Bistro Chain',
    brandLogo: 'https://api.dicebear.com/7.x/identicon/svg?seed=bistro',
    productName: 'Combo Ẩm Thực Mùa Hè',
    budget: 350000,
    status: 'rejected',
    date: '2026-07-18',
    note: 'Review món ăn trực tiếp tại chi nhánh Quận 1, TP.HCM.',
  },
];

const MOCK_SENT_APPLICATIONS = [
  {
    id: 'APP-201',
    campaignName: 'Chiến dịch Quảng báBST Thời trang Mùa Hè',
    brandName: 'UrbanStyle Vietnam',
    brandLogo: 'https://api.dicebear.com/7.x/identicon/svg?seed=urban',
    productName: 'BST Summer Breeze 2026',
    budget: 500000,
    status: 'pending',
    date: '2026-07-23',
    coverLetter: 'Mình sở hữu phong cách năng động, tệp người theo dõi 18-24 tuổi rất thích các trang phục dạo phố...',
  },
  {
    id: 'APP-202',
    campaignName: 'Review Dòng Bàn Phím Cơ Không Dây Custom',
    brandName: 'KeyLab Studio',
    brandLogo: 'https://api.dicebear.com/7.x/identicon/svg?seed=keylab',
    productName: 'Bàn phím cơ KeyLab 75%',
    budget: 580000,
    status: 'accepted',
    date: '2026-07-21',
    coverLetter: 'Kênh của mình chuyên review sản phẩm công nghệ và góc làm việc setup...',
  },
];

export default function OrderManagement() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('RECEIVED'); // RECEIVED | SENT
  const [searchQuery, setSearchQuery] = useState('');
  const [receivedInquiries, setReceivedInquiries] = useState(MOCK_RECEIVED_INQUIRIES);
  const [sentApplications, setSentApplications] = useState(MOCK_SENT_APPLICATIONS);

  const handleUpdateStatus = (id, newStatus) => {
    setReceivedInquiries((prev) =>
      prev.map((item) => (item.id === id ? { ...item, status: newStatus } : item))
    );
    const msg = newStatus === 'accepted' ? 'Đã chấp nhận lời mời hợp tác' : 'Đã từ chối lời mời';
    toast.success(msg);
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'accepted':
        return (
          <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 flex items-center gap-1">
            <CheckCircle2 size={12} /> Đã nhận đơn
          </span>
        );
      case 'rejected':
        return (
          <span className="px-3 py-1 rounded-full text-xs font-bold bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800 flex items-center gap-1">
            <XCircle size={12} /> Đã từ chối
          </span>
        );
      case 'pending':
      default:
        return (
          <span className="px-3 py-1 rounded-full text-xs font-bold bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800 flex items-center gap-1">
            <Clock size={12} /> Đang chờ phản hồi
          </span>
        );
    }
  };

  const currentList = activeTab === 'RECEIVED' ? receivedInquiries : sentApplications;
  const filteredList = currentList.filter(
    (item) =>
      item.campaignName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.brandName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-8">
      {/* Header Banner */}
      <div className="bg-surface-container-lowest dark:bg-tertiary-container rounded-[2rem] p-8 border border-surface-variant/30 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-semibold mb-3">
            <Package size={14} /> Quản lý chiến dịch & Đơn hàng
          </div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-primary leading-tight">
            Đơn hàng & Lời mời hợp tác
          </h1>
          <p className="text-xs text-on-surface-variant mt-1.5">
            Theo dõi lời mời trực tiếp từ thương hiệu và các chiến dịch bạn đã ứng tuyển.
          </p>
        </div>

        <button
          onClick={() => navigate('/kol/chat')}
          className="px-6 py-3 rounded-full bg-primary hover:bg-primary/90 text-on-primary text-xs font-bold flex items-center gap-2 shadow-md transition-all shrink-0"
        >
          <MessageSquare size={16} /> Mở Chat thương lượng
        </button>
      </div>

      {/* Tabs & Search */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        {/* Navigation Tabs */}
        <div className="flex items-center gap-2 p-1.5 bg-surface-container-lowest dark:bg-tertiary-container rounded-full border border-surface-variant/30 text-xs font-bold">
          <button
            onClick={() => setActiveTab('RECEIVED')}
            className={`px-5 py-2.5 rounded-full transition-all flex items-center gap-2 ${
              activeTab === 'RECEIVED'
                ? 'bg-primary text-on-primary shadow-sm'
                : 'text-on-surface-variant hover:text-primary'
            }`}
          >
            <Inbox size={15} /> Lời mời được nhận ({receivedInquiries.length})
          </button>
          <button
            onClick={() => setActiveTab('SENT')}
            className={`px-5 py-2.5 rounded-full transition-all flex items-center gap-2 ${
              activeTab === 'SENT'
                ? 'bg-primary text-on-primary shadow-sm'
                : 'text-on-surface-variant hover:text-primary'
            }`}
          >
            <Send size={15} /> Ứng tuyển đã gửi ({sentApplications.length})
          </button>
        </div>

        {/* Search */}
        <div className="relative w-full sm:w-80">
          <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant" />
          <input
            type="text"
            placeholder="Tìm theo chiến dịch hoặc thương hiệu..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-full bg-surface-container-lowest dark:bg-tertiary-container border border-surface-variant/40 text-xs focus:outline-none focus:ring-2 focus:ring-primary/50"
          />
        </div>
      </div>

      {/* Orders List / Cards */}
      <div className="space-y-4">
        {filteredList.map((item) => (
          <div
            key={item.id}
            className="bg-surface-container-lowest dark:bg-tertiary-container rounded-[2rem] p-6 border border-surface-variant/30 shadow-sm hover:border-primary/30 transition-all flex flex-col md:flex-row items-start md:items-center justify-between gap-6"
          >
            {/* Order Details */}
            <div className="flex items-start gap-4 flex-1">
              <img
                src={item.brandLogo}
                alt={item.brandName}
                className="w-12 h-12 rounded-2xl bg-surface-variant/20 border border-surface-variant/30 object-cover shrink-0 p-1"
              />
              <div className="space-y-2 flex-1">
                <div className="flex items-center gap-3 flex-wrap">
                  <span className="text-[11px] font-bold text-on-surface-variant font-mono bg-surface-variant/20 px-2.5 py-0.5 rounded-full">
                    #{item.id}
                  </span>
                  {getStatusBadge(item.status)}
                  <span className="text-xs text-on-surface-variant flex items-center gap-1">
                    <Calendar size={12} /> {item.date}
                  </span>
                </div>

                <h3 className="font-bold text-base text-primary leading-tight">{item.campaignName}</h3>
                <div className="flex items-center gap-2 text-xs font-semibold text-on-surface-variant">
                  <Building size={14} className="text-primary shrink-0" />
                  <span>{item.brandName}</span>
                  <span>•</span>
                  <span>Sản phẩm: <strong className="text-on-surface">{item.productName}</strong></span>
                </div>

                {item.note && (
                  <p className="text-xs text-on-surface-variant/90 bg-surface-variant/10 p-3 rounded-xl border border-surface-variant/20 mt-2">
                    {item.note}
                  </p>
                )}
                {item.coverLetter && (
                  <p className="text-xs text-on-surface-variant/90 bg-surface-variant/10 p-3 rounded-xl border border-surface-variant/20 mt-2 line-clamp-2">
                    <span className="font-bold text-primary">Thư giới thiệu:</span> {item.coverLetter}
                  </p>
                )}
              </div>
            </div>

            {/* Budget & Actions */}
            <div className="flex md:flex-col items-center md:items-end justify-between w-full md:w-auto gap-3 pt-4 md:pt-0 border-t md:border-t-0 border-surface-variant/20 shrink-0">
              <div className="text-left md:text-right">
                <span className="text-[11px] text-on-surface-variant font-medium block">Thù lao đề xuất</span>
                <span className="text-base font-extrabold text-emerald-600 dark:text-emerald-400">
                  {item.budget.toLocaleString('vi-VN')} VNĐ
                </span>
              </div>

              <div className="flex items-center gap-2">
                {activeTab === 'RECEIVED' && item.status === 'pending' && (
                  <>
                    <button
                      onClick={() => handleUpdateStatus(item.id, 'rejected')}
                      className="px-4 py-2 rounded-full bg-rose-50 dark:bg-rose-950/40 text-rose-600 hover:bg-rose-100 text-xs font-bold transition-colors"
                    >
                      Từ chối
                    </button>
                    <button
                      onClick={() => handleUpdateStatus(item.id, 'accepted')}
                      className="px-4 py-2 rounded-full bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-sm transition-colors"
                    >
                      Chấp nhận
                    </button>
                  </>
                )}

                <button
                  onClick={() => navigate(`/kol/chat?campaign=${encodeURIComponent(item.campaignName)}`)}
                  className="px-4 py-2 rounded-full bg-primary/10 hover:bg-primary/20 text-primary text-xs font-bold flex items-center gap-1.5 transition-colors"
                >
                  <MessageSquare size={13} /> Chat thương lượng
                </button>
              </div>
            </div>
          </div>
        ))}

        {filteredList.length === 0 && (
          <div className="py-16 text-center text-on-surface-variant bg-surface-container-lowest dark:bg-tertiary-container rounded-[2rem] border border-surface-variant/30">
            <Inbox size={44} className="mx-auto mb-2 opacity-40 text-primary" />
            <p className="font-bold text-sm">Chưa có đơn hàng hoặc lời mời nào</p>
            <p className="text-xs mt-1">Các yêu cầu từ doanh nghiệp sẽ xuất hiện tại đây.</p>
          </div>
        )}
      </div>
    </div>
  );
}
