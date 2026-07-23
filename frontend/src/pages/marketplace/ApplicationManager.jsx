import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Check, X, Users, Star, MessageSquare, ArrowLeft, Loader2, Award, Calendar, ExternalLink } from 'lucide-react';
import { getCampaignApplications, updateApplicationStatus } from '../../api/marketplaceApi';
import { toast } from '../../store/toastStore';

export default function ApplicationManager({ campaignId: propCampaignId }) {
  const { id: urlCampaignId } = useParams();
  const campaignId = propCampaignId || urlCampaignId;

  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [updatingId, setUpdatingId] = useState(null);

  const fetchApplications = async () => {
    if (!campaignId) return;
    try {
      setLoading(true);
      setError(null);
      const data = await getCampaignApplications(campaignId);
      setApplications(data || []);
    } catch (err) {
      console.error('Error fetching campaign applications:', err);
      setError(err?.message || 'Không thể tải danh sách ứng viên');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchApplications();
  }, [campaignId]);

  const handleUpdateStatus = async (applicationId, newStatus) => {
    try {
      setUpdatingId(applicationId);
      await updateApplicationStatus(applicationId, newStatus);
      const statusText = newStatus === 'accepted' ? 'Đã chấp nhận' : 'Đã từ chối';
      toast.success(`${statusText} ứng viên thành công!`);
      
      setApplications((prev) =>
        prev.map((app) => (app.id === applicationId ? { ...app, status: newStatus } : app))
      );
    } catch (err) {
      console.error('Error updating application status:', err);
      toast.error(err?.message || 'Thao tác thất bại. Vui lòng thử lại.');
    } finally {
      setUpdatingId(null);
    }
  };

  const formatFollowers = (count) => {
    if (!count) return '0';
    if (count >= 1000000) return `${(count / 1000000).toFixed(1)}M`;
    if (count >= 1000) return `${(count / 1000).toFixed(0)}K`;
    return count.toString();
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'accepted':
        return (
          <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 flex items-center gap-1">
            <Check size={12} /> Đã chấp nhận
          </span>
        );
      case 'rejected':
        return (
          <span className="px-3 py-1 rounded-full text-xs font-bold bg-rose-100 dark:bg-rose-950/50 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800 flex items-center gap-1">
            <X size={12} /> Đã từ chối
          </span>
        );
      case 'pending':
      default:
        return (
          <span className="px-3 py-1 rounded-full text-xs font-bold bg-amber-100 dark:bg-amber-950/50 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
            Đang chờ duyệt
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link
            to="/plans"
            className="p-2.5 rounded-full bg-surface-container-lowest dark:bg-tertiary-container text-on-surface-variant hover:text-primary transition-colors border border-surface-variant/30"
          >
            <ArrowLeft size={20} />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-primary">Quản lý ứng viên KOL</h1>
            <p className="text-xs text-on-surface-variant mt-0.5">
              Danh sách các Creator đã ứng tuyển cho chiến dịch #{campaignId}
            </p>
          </div>
        </div>

        <button
          onClick={fetchApplications}
          className="px-4 py-2 rounded-full text-xs font-bold text-primary bg-secondary-container/50 hover:bg-secondary-container transition-colors"
        >
          Làm mới
        </button>
      </div>

      {/* Loading state */}
      {loading && (
        <div className="flex flex-col items-center justify-center py-20 text-on-surface-variant gap-3">
          <Loader2 className="animate-spin text-primary" size={32} />
          <p className="text-sm font-medium">Đang tải danh sách ứng viên...</p>
        </div>
      )}

      {/* Error state */}
      {error && (
        <div className="bg-error/10 border border-error/20 rounded-2xl p-6 text-center text-error text-sm">
          {error}
        </div>
      )}

      {/* Applications list */}
      {!loading && !error && (
        <div className="space-y-4">
          {applications.map((app) => (
            <div
              key={app.id}
              className="bg-surface-container-lowest dark:bg-tertiary-container rounded-[2rem] p-6 border border-surface-variant/30 shadow-sm flex flex-col lg:flex-row justify-between gap-6"
            >
              {/* Left Column: KOL Info */}
              <div className="flex items-start gap-4 flex-1">
                <img
                  src={app.kol.avatarUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(app.kol.name)}`}
                  alt={app.kol.name}
                  className="w-14 h-14 rounded-full object-cover border-2 border-primary/20 shrink-0"
                />
                <div className="space-y-2 flex-1">
                  <div className="flex items-center gap-3 flex-wrap">
                    <h3 className="font-bold text-base text-primary">{app.kol.name}</h3>
                    {getStatusBadge(app.status)}
                    <span className="text-xs text-on-surface-variant font-medium bg-surface-variant/20 px-2.5 py-0.5 rounded-full">
                      {app.kol.kolType?.replace('_', ' ').toUpperCase()}
                    </span>
                  </div>

                  {/* KOL Stats */}
                  <div className="flex items-center gap-4 text-xs text-on-surface-variant flex-wrap">
                    <span className="flex items-center gap-1 font-semibold text-on-surface">
                      <Users size={14} className="text-primary" /> {formatFollowers(app.kol.followerCount)} người theo dõi
                    </span>
                    <span className="flex items-center gap-1 font-semibold text-amber-600">
                      <Star size={14} className="fill-amber-400 text-amber-400" /> {app.kol.rating || '5.0'}
                    </span>
                    {app.kol.engagementRate > 0 && (
                      <span className="flex items-center gap-1 text-on-surface-variant">
                        <Award size={14} className="text-secondary" /> ER: {app.kol.engagementRate}%
                      </span>
                    )}
                    {app.kol.priceFrom && (
                      <span className="font-bold text-emerald-600">
                        Giá từ: {app.kol.priceFrom.toLocaleString('vi-VN')} VNĐ
                      </span>
                    )}
                  </div>

                  {/* Cover Letter */}
                  {app.coverLetter ? (
                    <div className="mt-3 bg-surface-variant/15 rounded-2xl p-4 text-xs text-on-surface leading-relaxed border border-surface-variant/20">
                      <div className="flex items-center gap-1.5 font-bold text-primary mb-1">
                        <MessageSquare size={13} /> Thư giới thiệu:
                      </div>
                      <p className="whitespace-pre-line">{app.coverLetter}</p>
                    </div>
                  ) : (
                    <p className="text-xs text-on-surface-variant/70 italic mt-2">
                      (Ứng viên không đính kèm thư giới thiệu)
                    </p>
                  )}

                  <div className="text-[11px] text-on-surface-variant flex items-center gap-1 pt-1">
                    <Calendar size={12} /> Ứng tuyển vào lúc: {new Date(app.createdAt).toLocaleString('vi-VN')}
                  </div>
                </div>
              </div>

              {/* Right Column: Action Buttons */}
              <div className="flex lg:flex-col items-center justify-end gap-3 shrink-0 pt-4 lg:pt-0 border-t lg:border-t-0 border-surface-variant/20">
                <Link
                  to={`/marketplace/kol/${app.kol.id}`}
                  target="_blank"
                  className="px-4 py-2 rounded-full text-xs font-bold text-primary bg-secondary-container/40 hover:bg-secondary-container transition-colors flex items-center gap-1.5"
                >
                  <ExternalLink size={13} /> Xem hồ sơ KOL
                </Link>

                {app.status === 'pending' && (
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleUpdateStatus(app.id, 'rejected')}
                      disabled={updatingId === app.id}
                      className="px-4 py-2 rounded-full bg-rose-50 dark:bg-rose-950/40 text-rose-600 hover:bg-rose-100 dark:hover:bg-rose-900/60 text-xs font-bold transition-all flex items-center gap-1 disabled:opacity-50"
                    >
                      {updatingId === app.id ? (
                        <Loader2 size={13} className="animate-spin" />
                      ) : (
                        <>
                          <X size={14} /> Từ chối
                        </>
                      )}
                    </button>
                    <button
                      onClick={() => handleUpdateStatus(app.id, 'accepted')}
                      disabled={updatingId === app.id}
                      className="px-4 py-2 rounded-full bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-sm transition-all flex items-center gap-1 disabled:opacity-50"
                    >
                      {updatingId === app.id ? (
                        <Loader2 size={13} className="animate-spin" />
                      ) : (
                        <>
                          <Check size={14} /> Chấp nhận
                        </>
                      )}
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}

          {applications.length === 0 && (
            <div className="py-16 text-center text-on-surface-variant bg-surface-container-lowest dark:bg-tertiary-container rounded-[2rem] border border-surface-variant/30">
              <Users size={48} className="mx-auto mb-3 opacity-40 text-primary" />
              <p className="font-bold text-base">Chưa có ứng viên nào cho chiến dịch này</p>
              <p className="text-xs mt-1">Các hồ sơ ứng tuyển từ KOL sẽ xuất hiện tại đây khi họ nộp đơn.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
