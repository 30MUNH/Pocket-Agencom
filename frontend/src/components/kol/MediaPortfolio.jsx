import { useState } from 'react';
import { Image, Video, CheckCircle2, AlertTriangle, Plus, Trash2, X, Play, Loader2, Sparkles } from 'lucide-react';
import { kolApi } from '../../api/kolApi';
import { toast } from '../../store/toastStore';

export default function MediaPortfolio({ kolId, media = [], completeness = null, isOwner = false, onRefresh }) {
  const [filter, setFilter] = useState('ALL'); // ALL | IMAGE | VIDEO | FULL_BODY
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [mediaUrl, setMediaUrl] = useState('');
  const [mediaType, setMediaType] = useState('IMAGE');
  const [isFullBody, setIsFullBody] = useState(false);
  const [loading, setLoading] = useState(false);
  const [deletingId, setDeletingId] = useState(null);

  const counts = completeness?.counts || {
    images: media.filter((m) => m.mediaType === 'IMAGE').length,
    videos: media.filter((m) => m.mediaType === 'VIDEO').length,
    fullBodyVideos: media.filter((m) => m.mediaType === 'VIDEO' && m.isFullBody).length,
  };

  const isComplete = completeness?.isComplete ?? (counts.images >= 5 && counts.videos >= 3 && counts.fullBodyVideos >= 1);

  const filteredMedia = media.filter((item) => {
    if (filter === 'IMAGE') return item.mediaType === 'IMAGE';
    if (filter === 'VIDEO') return item.mediaType === 'VIDEO';
    if (filter === 'FULL_BODY') return item.mediaType === 'VIDEO' && item.isFullBody;
    return true;
  });

  const handleAddMedia = async (e) => {
    e.preventDefault();
    if (!mediaUrl) return;

    try {
      setLoading(true);
      await kolApi.addMedia(kolId, { mediaUrl, mediaType, isFullBody });
      toast.success('Thêm ấn phẩm truyền thông thành công!');
      setIsModalOpen(false);
      setMediaUrl('');
      setIsFullBody(false);
      if (onRefresh) onRefresh();
    } catch (err) {
      console.error('Error adding media:', err);
      toast.error(err?.message || 'Không thể thêm ấn phẩm truyền thông');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteMedia = async (mediaId) => {
    if (!window.confirm('Xóa ấn phẩm này khỏi bộ sưu tập?')) return;
    try {
      setDeletingId(mediaId);
      await kolApi.deleteMedia(kolId, mediaId);
      toast.success('Đã xóa ấn phẩm');
      if (onRefresh) onRefresh();
    } catch (err) {
      console.error('Error deleting media:', err);
      toast.error(err?.message || 'Xóa ấn phẩm thất bại');
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Completeness Validation Banner */}
      <div
        className={`rounded-[2rem] p-6 border transition-all ${
          isComplete
            ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-900 dark:text-emerald-200'
            : 'bg-amber-500/10 border-amber-500/30 text-amber-900 dark:text-amber-200'
        }`}
      >
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            {isComplete ? (
              <CheckCircle2 size={24} className="text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
            ) : (
              <AlertTriangle size={24} className="text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
            )}
            <div>
              <h3 className="font-extrabold text-base flex items-center gap-2">
                {isComplete ? 'Hồ sơ truyền thông đã đạt chuẩn' : 'Yêu cầu hoàn thiện bộ sưu tập Media'}
              </h3>
              <p className="text-xs mt-1 leading-relaxed opacity-90">
                Quy định tiêu chuẩn hồ sơ KOL: Tối thiểu <span className="font-bold">5 hình ảnh</span> và{' '}
                <span className="font-bold">3 video</span> (trong đó có ít nhất <span className="font-bold">1 video quay toàn thân</span>).
              </p>
            </div>
          </div>

          {/* Progress Indicators */}
          <div className="flex items-center gap-2 text-xs flex-wrap">
            <span
              className={`px-3 py-1.5 rounded-full font-bold flex items-center gap-1.5 ${
                counts.images >= 5
                  ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300'
                  : 'bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300'
              }`}
            >
              <Image size={13} /> Ảnh: {counts.images}/5 {counts.images >= 5 ? '✓' : ''}
            </span>
            <span
              className={`px-3 py-1.5 rounded-full font-bold flex items-center gap-1.5 ${
                counts.videos >= 3
                  ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300'
                  : 'bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300'
              }`}
            >
              <Video size={13} /> Video: {counts.videos}/3 {counts.videos >= 3 ? '✓' : ''}
            </span>
            <span
              className={`px-3 py-1.5 rounded-full font-bold flex items-center gap-1.5 ${
                counts.fullBodyVideos >= 1
                  ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300'
                  : 'bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300'
              }`}
            >
              <Sparkles size={13} /> Video toàn thân: {counts.fullBodyVideos}/1 {counts.fullBodyVideos >= 1 ? '✓' : ''}
            </span>
          </div>
        </div>
      </div>

      {/* Gallery Header & Controls */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        {/* Filter Tabs */}
        <div className="flex items-center gap-2 p-1.5 bg-surface-container-lowest dark:bg-tertiary-container rounded-full border border-surface-variant/30 text-xs font-bold">
          <button
            onClick={() => setFilter('ALL')}
            className={`px-4 py-2 rounded-full transition-all ${
              filter === 'ALL'
                ? 'bg-primary text-on-primary shadow-sm'
                : 'text-on-surface-variant hover:text-primary'
            }`}
          >
            Tất cả ({media.length})
          </button>
          <button
            onClick={() => setFilter('IMAGE')}
            className={`px-4 py-2 rounded-full transition-all ${
              filter === 'IMAGE'
                ? 'bg-primary text-on-primary shadow-sm'
                : 'text-on-surface-variant hover:text-primary'
            }`}
          >
            Hình ảnh ({counts.images})
          </button>
          <button
            onClick={() => setFilter('VIDEO')}
            className={`px-4 py-2 rounded-full transition-all ${
              filter === 'VIDEO'
                ? 'bg-primary text-on-primary shadow-sm'
                : 'text-on-surface-variant hover:text-primary'
            }`}
          >
            Video ({counts.videos})
          </button>
          <button
            onClick={() => setFilter('FULL_BODY')}
            className={`px-4 py-2 rounded-full transition-all ${
              filter === 'FULL_BODY'
                ? 'bg-primary text-on-primary shadow-sm'
                : 'text-on-surface-variant hover:text-primary'
            }`}
          >
            Video Toàn Thân ({counts.fullBodyVideos})
          </button>
        </div>

        {/* Add Media Button */}
        {isOwner && (
          <button
            onClick={() => setIsModalOpen(true)}
            className="px-5 py-2.5 rounded-full bg-primary hover:bg-primary/90 text-on-primary text-xs font-bold flex items-center gap-2 shadow-sm transition-all"
          >
            <Plus size={16} /> Thêm ấn phẩm Media
          </button>
        )}
      </div>

      {/* Grid Gallery */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {filteredMedia.map((item) => (
          <div
            key={item.id}
            className="group relative aspect-[4/5] rounded-2xl overflow-hidden bg-surface-variant/20 border border-surface-variant/30 shadow-sm"
          >
            {item.mediaType === 'IMAGE' ? (
              <img
                src={item.mediaUrl}
                alt="KOL Media"
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              />
            ) : (
              <div className="relative w-full h-full bg-black">
                <video
                  src={item.mediaUrl}
                  className="w-full h-full object-cover opacity-80"
                />
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-12 h-12 rounded-full bg-primary/80 text-white flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                    <Play size={20} className="ml-0.5 fill-white" />
                  </div>
                </div>
              </div>
            )}

            {/* Badges */}
            <div className="absolute top-2 left-2 flex flex-col gap-1 z-10">
              <span className="px-2.5 py-1 rounded-full bg-black/60 backdrop-blur-md text-white text-[10px] font-bold flex items-center gap-1">
                {item.mediaType === 'IMAGE' ? <Image size={10} /> : <Video size={10} />}
                {item.mediaType}
              </span>
              {item.isFullBody && (
                <span className="px-2.5 py-1 rounded-full bg-emerald-600/90 backdrop-blur-md text-white text-[10px] font-bold">
                  Toàn thân
                </span>
              )}
            </div>

            {/* Delete Action Overlay */}
            {isOwner && (
              <button
                onClick={() => handleDeleteMedia(item.id)}
                disabled={deletingId === item.id}
                className="absolute top-2 right-2 p-2 rounded-full bg-rose-600/80 text-white opacity-0 group-hover:opacity-100 transition-opacity hover:bg-rose-600 z-10"
              >
                {deletingId === item.id ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
              </button>
            )}
          </div>
        ))}

        {filteredMedia.length === 0 && (
          <div className="col-span-full py-16 text-center text-on-surface-variant bg-surface-container-lowest dark:bg-tertiary-container rounded-[2rem] border border-surface-variant/30">
            <Image size={40} className="mx-auto mb-2 opacity-40 text-primary" />
            <p className="font-bold text-sm">Chưa có ấn phẩm media nào</p>
            <p className="text-xs mt-1">Tải lên hình ảnh và video của bạn để thu hút nhãn hàng.</p>
          </div>
        )}
      </div>

      {/* Modal Add Media */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <div className="bg-surface-container-lowest dark:bg-tertiary-container rounded-[2rem] max-w-md w-full p-6 shadow-xl border border-surface-variant/40 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between pb-3 border-b border-surface-variant/20 mb-4">
              <h3 className="font-bold text-base text-primary">Thêm Ấn Phẩm Media</h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 rounded-full text-on-surface-variant hover:bg-surface-variant/20"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleAddMedia} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-on-surface-variant mb-1">Loại Media</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setMediaType('IMAGE')}
                    className={`py-2.5 rounded-xl font-bold border transition-all flex items-center justify-center gap-2 ${
                      mediaType === 'IMAGE'
                        ? 'bg-primary text-on-primary border-primary'
                        : 'bg-surface-variant/10 text-on-surface border-surface-variant/30'
                    }`}
                  >
                    <Image size={14} /> Hình ảnh
                  </button>
                  <button
                    type="button"
                    onClick={() => setMediaType('VIDEO')}
                    className={`py-2.5 rounded-xl font-bold border transition-all flex items-center justify-center gap-2 ${
                      mediaType === 'VIDEO'
                        ? 'bg-primary text-on-primary border-primary'
                        : 'bg-surface-variant/10 text-on-surface border-surface-variant/30'
                    }`}
                  >
                    <Video size={14} /> Video
                  </button>
                </div>
              </div>

              <div>
                <label className="block font-bold text-on-surface-variant mb-1">Đường dẫn Media (URL)</label>
                <input
                  type="url"
                  required
                  placeholder="https://example.com/photo.jpg hoặc video.mp4"
                  value={mediaUrl}
                  onChange={(e) => setMediaUrl(e.target.value)}
                  className="w-full p-3 rounded-xl bg-surface-container-lowest dark:bg-surface-container border border-surface-variant/40 text-xs focus:outline-none focus:ring-2 focus:ring-primary/50"
                />
              </div>

              {mediaType === 'VIDEO' && (
                <label className="flex items-center gap-2 cursor-pointer pt-1">
                  <input
                    type="checkbox"
                    checked={isFullBody}
                    onChange={(e) => setIsFullBody(e.target.checked)}
                    className="rounded border-outline text-primary focus:ring-primary"
                  />
                  <span className="font-semibold text-on-surface">Video này là video quay toàn thân (Full Body)</span>
                </label>
              )}

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
                  {loading ? <Loader2 size={14} className="animate-spin" /> : 'Tải lên'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
