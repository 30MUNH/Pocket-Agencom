import { useState, useEffect } from 'react';
import { Briefcase, MapPin, DollarSign, Users, Send, CheckCircle2, Loader2, Search, Filter, Sparkles, X } from 'lucide-react';
import { getMarketCampaigns, applyToCampaign } from '../../api/marketplaceApi';
import { toast } from '../../store/toastStore';

export default function CampaignJobBoard() {
  const [campaigns, setCampaigns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Modal state for applying
  const [selectedCampaign, setSelectedCampaign] = useState(null);
  const [coverLetter, setCoverLetter] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const fetchCampaigns = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getMarketCampaigns();
      setCampaigns(data || []);
    } catch (err) {
      console.error('Error loading campaigns:', err);
      setError(err?.message || 'Không thể tải danh sách chiến dịch');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCampaigns();
  }, []);

  const handleOpenApplyModal = (campaign) => {
    setSelectedCampaign(campaign);
    setCoverLetter('');
  };

  const handleCloseModal = () => {
    if (submitting) return;
    setSelectedCampaign(null);
    setCoverLetter('');
  };

  const handleSubmitApplication = async (e) => {
    e.preventDefault();
    if (!selectedCampaign) return;

    try {
      setSubmitting(true);
      await applyToCampaign(selectedCampaign.id, { coverLetter });
      toast.success('Ứng tuyển chiến dịch thành công!');
      
      // Update local state to reflect applied status
      setCampaigns((prev) =>
        prev.map((c) =>
          c.id === selectedCampaign.id
            ? { ...c, hasApplied: true, applicationsCount: c.applicationsCount + 1 }
            : c
        )
      );
      handleCloseModal();
    } catch (err) {
      console.error('Error applying to campaign:', err);
      toast.error(err?.message || 'Ứng tuyển thất bại. Vui lòng thử lại.');
    } finally {
      setSubmitting(false);
    }
  };

  const filteredCampaigns = campaigns.filter((c) => {
    const query = searchQuery.toLowerCase();
    return (
      c.brandName?.toLowerCase().includes(query) ||
      c.goal?.toLowerCase().includes(query) ||
      c.campaignType?.toLowerCase().includes(query) ||
      c.location?.toLowerCase().includes(query)
    );
  });

  return (
    <div className="space-y-8">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-primary/10 via-secondary-container/40 to-primary/5 rounded-[2rem] p-8 border border-primary/10 relative overflow-hidden">
        <div className="relative z-10 max-w-2xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-semibold mb-3">
            <Sparkles size={14} /> Sàn việc làm KOL & KOC
          </div>
          <h1 className="text-display-lg-mobile md:text-3xl font-extrabold text-primary leading-tight">
            Khám phá chiến dịch & Ứng tuyển ngay
          </h1>
          <p className="text-on-surface-variant text-sm mt-2">
            Kết nối trực tiếp với các thương hiệu đang tìm kiếm KOL/KOC hợp tác truyền thông sản phẩm.
          </p>
        </div>
      </div>

      {/* Search & Filter Bar */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-center">
        <div className="relative w-full sm:w-96">
          <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant" />
          <input
            type="text"
            placeholder="Tìm kiếm nhãn hàng, mục tiêu, địa điểm..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-11 pr-4 py-3 rounded-full bg-surface-container-lowest dark:bg-tertiary-container border border-surface-variant/40 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
          />
        </div>

        <div className="flex items-center gap-2 text-sm text-on-surface-variant font-medium">
          <Filter size={16} />
          <span>{filteredCampaigns.length} chiến dịch đang mở</span>
        </div>
      </div>

      {/* Loading & Error States */}
      {loading && (
        <div className="flex flex-col items-center justify-center py-20 text-on-surface-variant gap-3">
          <Loader2 className="animate-spin text-primary" size={32} />
          <p className="text-sm font-medium">Đang tải các chiến dịch tiếp thị...</p>
        </div>
      )}

      {error && (
        <div className="bg-error/10 border border-error/20 rounded-2xl p-6 text-center text-error text-sm">
          {error}
          <button
            onClick={fetchCampaigns}
            className="mt-3 block mx-auto px-4 py-2 bg-error text-white rounded-full text-xs font-bold hover:bg-error/90"
          >
            Thử lại
          </button>
        </div>
      )}

      {/* Campaign Grid */}
      {!loading && !error && (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {filteredCampaigns.map((campaign) => (
            <div
              key={campaign.id}
              className="bg-surface-container-lowest dark:bg-tertiary-container rounded-[2rem] p-6 border border-surface-variant/30 hover:border-primary/30 transition-all shadow-sm hover:shadow-md flex flex-col justify-between"
            >
              <div>
                {/* Brand & Type Header */}
                <div className="flex items-start justify-between gap-3 mb-4">
                  <div>
                    <span className="text-xs font-semibold text-primary bg-secondary-container/60 px-3 py-1 rounded-full inline-block mb-1">
                      {campaign.campaignType || 'Chiến dịch tổng thể'}
                    </span>
                    <h3 className="font-bold text-lg text-primary line-clamp-1">
                      {campaign.brandName}
                    </h3>
                  </div>
                  <span className="text-xs text-on-surface-variant font-medium bg-surface-variant/20 px-2.5 py-1 rounded-full shrink-0 flex items-center gap-1">
                    <Users size={12} /> {campaign.applicationsCount} ứng viên
                  </span>
                </div>

                {/* Campaign Goal / Scope */}
                <div className="mb-4">
                  <h4 className="text-xs uppercase font-bold text-on-surface-variant mb-1">Mục tiêu chiến dịch</h4>
                  <p className="text-sm text-on-surface line-clamp-2 font-medium">
                    {campaign.goal}
                  </p>
                </div>

                {/* Details Pills */}
                <div className="space-y-2 mb-4 text-xs">
                  <div className="flex items-center gap-2 text-on-surface-variant">
                    <MapPin size={14} className="text-primary shrink-0" />
                    <span className="font-medium">Địa điểm:</span>
                    <span className="text-on-surface font-semibold">{campaign.location || 'Gần bạn'}</span>
                  </div>

                  <div className="flex items-center gap-2 text-on-surface-variant">
                    <DollarSign size={14} className="text-emerald-600 dark:text-emerald-400 shrink-0" />
                    <span className="font-medium">Ngân sách dự kiến:</span>
                    <span className="text-emerald-600 dark:text-emerald-400 font-extrabold text-sm">
                      {campaign.budget ? `${Number(campaign.budget).toLocaleString('vi-VN')} VNĐ` : 'Thỏa thuận'}
                    </span>
                  </div>
                </div>

                {/* Product Description */}
                {campaign.productDescription && (
                  <div className="bg-surface-variant/10 rounded-xl p-3 text-xs text-on-surface-variant mb-4 line-clamp-2">
                    <span className="font-semibold text-on-surface">Sản phẩm:</span> {campaign.productDescription}
                  </div>
                )}
              </div>

              {/* Action Button */}
              <div className="pt-4 border-t border-surface-variant/20">
                {campaign.hasApplied ? (
                  <button
                    disabled
                    className="w-full py-2.5 px-4 rounded-full bg-emerald-100 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 text-sm font-bold flex items-center justify-center gap-2 cursor-not-allowed"
                  >
                    <CheckCircle2 size={16} /> Đã ứng tuyển
                  </button>
                ) : (
                  <button
                    onClick={() => handleOpenApplyModal(campaign)}
                    className="w-full py-2.5 px-4 rounded-full bg-primary hover:bg-primary/90 text-on-primary text-sm font-bold flex items-center justify-center gap-2 shadow-sm transition-all active:scale-[0.98]"
                  >
                    <Send size={15} /> Ứng tuyển ngay
                  </button>
                )}
              </div>
            </div>
          ))}

          {filteredCampaigns.length === 0 && (
            <div className="col-span-full py-16 text-center text-on-surface-variant">
              <Briefcase size={48} className="mx-auto mb-3 opacity-40 text-primary" />
              <p className="font-bold text-base">Chưa có chiến dịch nào đang mở tuyển</p>
              <p className="text-xs mt-1">Hãy quay lại sau hoặc thử từ khóa tìm kiếm khác.</p>
            </div>
          )}
        </div>
      )}

      {/* Apply Modal */}
      {selectedCampaign && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <div className="bg-surface-container-lowest dark:bg-tertiary-container rounded-[2rem] max-w-lg w-full p-6 shadow-xl border border-surface-variant/40 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between pb-4 border-b border-surface-variant/20 mb-4">
              <div>
                <h3 className="font-bold text-lg text-primary">Ứng tuyển chiến dịch</h3>
                <p className="text-xs text-on-surface-variant font-medium">
                  {selectedCampaign.brandName} • {selectedCampaign.campaignType || 'Chiến dịch truyền thông'}
                </p>
              </div>
              <button
                onClick={handleCloseModal}
                disabled={submitting}
                className="p-2 rounded-full text-on-surface-variant hover:bg-surface-variant/20 transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmitApplication} className="space-y-4">
              <div className="bg-surface-variant/10 p-3.5 rounded-xl text-xs space-y-1">
                <p className="font-bold text-primary">{selectedCampaign.goal}</p>
                <p className="text-on-surface-variant">
                  Ngân sách: <span className="font-bold text-emerald-600">{selectedCampaign.budget ? `${Number(selectedCampaign.budget).toLocaleString('vi-VN')} VNĐ` : 'Thỏa thuận'}</span>
                </p>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-on-surface-variant mb-1.5">
                  Thư giới thiệu / Đề xuất cá nhân (Cover Letter)
                </label>
                <textarea
                  rows={4}
                  value={coverLetter}
                  onChange={(e) => setCoverLetter(e.target.value)}
                  placeholder="Giới thiệu bản thân, số lượng người theo dõi, kinh nghiệm và lý do bạn là KOL/KOC phù hợp nhất cho chiến dịch này..."
                  className="w-full p-3.5 rounded-2xl bg-surface-container-lowest dark:bg-surface-container border border-surface-variant/40 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 placeholder:text-on-surface-variant/50"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  disabled={submitting}
                  className="px-5 py-2.5 rounded-full text-sm font-bold text-on-surface-variant hover:bg-surface-variant/20 transition-colors"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-6 py-2.5 rounded-full bg-primary hover:bg-primary/90 text-on-primary text-sm font-bold flex items-center gap-2 shadow-md transition-all disabled:opacity-50"
                >
                  {submitting ? (
                    <>
                      <Loader2 size={16} className="animate-spin" /> Đang gửi...
                    </>
                  ) : (
                    <>
                      <Send size={16} /> Gửi hồ sơ ứng tuyển
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
