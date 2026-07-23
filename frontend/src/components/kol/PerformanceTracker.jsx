import { useState } from 'react';
import { TrendingUp, ExternalLink, Plus, Award, Target, BarChart2, X, Loader2 } from 'lucide-react';
import { kolApi } from '../../api/kolApi';
import { toast } from '../../store/toastStore';

export default function PerformanceTracker({ kolId, performances = [], isOwner = false, onRefresh }) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [postUrl, setPostUrl] = useState('');
  const [engagementRate, setEngagementRate] = useState('');
  const [conversions, setConversions] = useState('');
  const [platform, setPlatform] = useState('TikTok');
  const [loading, setLoading] = useState(false);

  const totalPerformances = performances.length;
  const avgEngagementRate =
    totalPerformances > 0
      ? (performances.reduce((acc, p) => acc + (p.engagementRate || 0), 0) / totalPerformances).toFixed(1)
      : '0.0';
  const totalConversions = performances.reduce((acc, p) => acc + (p.conversions || 0), 0);

  const handleAddPerformance = async (e) => {
    e.preventDefault();
    if (!postUrl || !engagementRate) return;

    try {
      setLoading(true);
      await kolApi.addPerformance(kolId, {
        postUrl,
        engagementRate: parseFloat(engagementRate),
        conversions: parseInt(conversions || 0, 10),
        platform,
      });
      toast.success('Thêm chỉ số hiệu suất thành công!');
      setIsModalOpen(false);
      setPostUrl('');
      setEngagementRate('');
      setConversions('');
      if (onRefresh) onRefresh();
    } catch (err) {
      console.error('Error adding performance:', err);
      toast.error(err?.message || 'Không thể thêm chỉ số hiệu suất');
    } finally {
      setLoading(false);
    }
  };

  const getPlatformBadge = (plat) => {
    const p = (plat || '').toLowerCase();
    if (p.includes('tiktok')) return 'bg-black text-white';
    if (p.includes('instagram')) return 'bg-gradient-to-r from-purple-500 to-pink-500 text-white';
    if (p.includes('youtube')) return 'bg-red-600 text-white';
    if (p.includes('facebook')) return 'bg-blue-600 text-white';
    return 'bg-secondary-container text-primary';
  };

  return (
    <div className="space-y-6">
      {/* KPI Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-surface-container-lowest dark:bg-tertiary-container rounded-[2rem] p-5 border border-surface-variant/30 flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center shrink-0">
            <TrendingUp size={22} />
          </div>
          <div>
            <span className="text-xs font-semibold text-on-surface-variant">Tỷ lệ tương tác TB (ER)</span>
            <h4 className="text-xl font-extrabold text-emerald-600 dark:text-emerald-400 mt-0.5">
              {avgEngagementRate}%
            </h4>
          </div>
        </div>

        <div className="bg-surface-container-lowest dark:bg-tertiary-container rounded-[2rem] p-5 border border-surface-variant/30 flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
            <Target size={22} />
          </div>
          <div>
            <span className="text-xs font-semibold text-on-surface-variant">Tổng lượt chuyển đổi</span>
            <h4 className="text-xl font-extrabold text-primary mt-0.5">
              {totalConversions.toLocaleString('vi-VN')}
            </h4>
          </div>
        </div>

        <div className="bg-surface-container-lowest dark:bg-tertiary-container rounded-[2rem] p-5 border border-surface-variant/30 flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-secondary-container text-on-secondary-container flex items-center justify-center shrink-0">
            <BarChart2 size={22} />
          </div>
          <div>
            <span className="text-xs font-semibold text-on-surface-variant">Bài viết theo dõi</span>
            <h4 className="text-xl font-extrabold text-primary mt-0.5">
              {totalPerformances} bài
            </h4>
          </div>
        </div>
      </div>

      {/* Header & Add Button */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-bold text-lg text-primary">Chỉ số hiệu suất chiến dịch (Performance Metrics)</h3>
          <p className="text-xs text-on-surface-variant mt-0.5">
            Dữ liệu đo lường thực tế từ các bài viết quảng bá sản phẩm đã phát hành.
          </p>
        </div>

        {isOwner && (
          <button
            onClick={() => setIsModalOpen(true)}
            className="px-5 py-2.5 rounded-full bg-primary hover:bg-primary/90 text-on-primary text-xs font-bold flex items-center gap-2 shadow-sm transition-all shrink-0"
          >
            <Plus size={16} /> Thêm chỉ số
          </button>
        )}
      </div>

      {/* Performance Table / List */}
      <div className="bg-surface-container-lowest dark:bg-tertiary-container rounded-[2rem] border border-surface-variant/30 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-surface-variant/15 text-on-surface-variant uppercase font-bold text-[11px] border-b border-surface-variant/20">
              <tr>
                <th className="py-3.5 px-6">Nền tảng</th>
                <th className="py-3.5 px-6">Đường dẫn bài viết</th>
                <th className="py-3.5 px-6">Engagement Rate</th>
                <th className="py-3.5 px-6">Conversions</th>
                <th className="py-3.5 px-6">Thời gian cập nhật</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-variant/10 font-medium">
              {performances.map((perf) => (
                <tr key={perf.id} className="hover:bg-surface-variant/5 transition-colors">
                  <td className="py-4 px-6">
                    <span className={`px-3 py-1 rounded-full text-[11px] font-bold ${getPlatformBadge(perf.platform)}`}>
                      {perf.platform}
                    </span>
                  </td>
                  <td className="py-4 px-6 max-w-xs truncate">
                    <a
                      href={perf.postUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary hover:underline font-semibold flex items-center gap-1.5"
                    >
                      <span className="truncate">{perf.postUrl}</span>
                      <ExternalLink size={12} className="shrink-0" />
                    </a>
                  </td>
                  <td className="py-4 px-6 text-emerald-600 font-extrabold text-sm">
                    {perf.engagementRate}%
                  </td>
                  <td className="py-4 px-6 font-bold text-on-surface">
                    {perf.conversions ? perf.conversions.toLocaleString('vi-VN') : '0'} đơn/lead
                  </td>
                  <td className="py-4 px-6 text-on-surface-variant text-[11px]">
                    {new Date(perf.createdAt).toLocaleDateString('vi-VN')}
                  </td>
                </tr>
              ))}

              {performances.length === 0 && (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-on-surface-variant">
                    <Award size={36} className="mx-auto mb-2 opacity-40 text-primary" />
                    <p className="font-bold text-sm">Chưa có chỉ số hiệu suất nào được ghi nhận</p>
                    <p className="text-xs mt-1">Cập nhật chỉ số giúp tăng độ tin cậy và thu hút nhãn hàng.</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Performance Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <div className="bg-surface-container-lowest dark:bg-tertiary-container rounded-[2rem] max-w-md w-full p-6 shadow-xl border border-surface-variant/40 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between pb-3 border-b border-surface-variant/20 mb-4">
              <h3 className="font-bold text-base text-primary">Thêm Chỉ Số Hiệu Suất</h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 rounded-full text-on-surface-variant hover:bg-surface-variant/20"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleAddPerformance} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-on-surface-variant mb-1">Nền tảng</label>
                <select
                  value={platform}
                  onChange={(e) => setPlatform(e.target.value)}
                  className="w-full p-3 rounded-xl bg-surface-container-lowest dark:bg-surface-container border border-surface-variant/40 text-xs focus:outline-none focus:ring-2 focus:ring-primary/50"
                >
                  <option value="TikTok">TikTok</option>
                  <option value="Instagram">Instagram</option>
                  <option value="YouTube">YouTube</option>
                  <option value="Facebook">Facebook</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-on-surface-variant mb-1">URL Bài viết / Video</label>
                <input
                  type="url"
                  required
                  placeholder="https://tiktok.com/@username/video/123456"
                  value={postUrl}
                  onChange={(e) => setPostUrl(e.target.value)}
                  className="w-full p-3 rounded-xl bg-surface-container-lowest dark:bg-surface-container border border-surface-variant/40 text-xs focus:outline-none focus:ring-2 focus:ring-primary/50"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-on-surface-variant mb-1">Engagement Rate (%)</label>
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    required
                    placeholder="e.g. 5.8"
                    value={engagementRate}
                    onChange={(e) => setEngagementRate(e.target.value)}
                    className="w-full p-3 rounded-xl bg-surface-container-lowest dark:bg-surface-container border border-surface-variant/40 text-xs focus:outline-none focus:ring-2 focus:ring-primary/50"
                  />
                </div>

                <div>
                  <label className="block font-bold text-on-surface-variant mb-1">Conversions (Đơn/Leads)</label>
                  <input
                    type="number"
                    min="0"
                    placeholder="e.g. 150"
                    value={conversions}
                    onChange={(e) => setConversions(e.target.value)}
                    className="w-full p-3 rounded-xl bg-surface-container-lowest dark:bg-surface-container border border-surface-variant/40 text-xs focus:outline-none focus:ring-2 focus:ring-primary/50"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-full font-bold text-on-surface-variant hover:bg-surface-variant/20"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-5 py-2 rounded-full bg-primary text-on-primary font-bold flex items-center gap-1.5 shadow-sm disabled:opacity-50"
                >
                  {loading ? <Loader2 size={14} className="animate-spin" /> : 'Lưu chỉ số'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
