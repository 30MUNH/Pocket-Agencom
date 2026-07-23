import { useState } from 'react';
import { Star, MessageSquarePlus, X, Loader2, Building, Calendar } from 'lucide-react';
import { kolApi } from '../../api/kolApi';
import { toast } from '../../store/toastStore';

export default function ReviewSection({ kolId, reviews = [], rating = 0, onRefresh }) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newRating, setNewRating] = useState(5);
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(false);

  const totalReviews = reviews.length;

  const handleSubmitReview = async (e) => {
    e.preventDefault();
    if (!content.trim()) return;

    try {
      setLoading(true);
      await kolApi.addReview(kolId, { rating: newRating, content });
      toast.success('Gửi đánh giá thành công!');
      setIsModalOpen(false);
      setContent('');
      setNewRating(5);
      if (onRefresh) onRefresh();
    } catch (err) {
      console.error('Error submitting review:', err);
      toast.error(err?.message || 'Không thể gửi đánh giá');
    } finally {
      setLoading(false);
    }
  };

  const renderStars = (score) => {
    return (
      <div className="flex items-center gap-0.5">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            size={14}
            className={`${
              star <= Math.round(score)
                ? 'fill-amber-400 text-amber-400'
                : 'text-surface-variant/40'
            }`}
          />
        ))}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Review Summary Header */}
      <div className="bg-surface-container-lowest dark:bg-tertiary-container rounded-[2rem] p-6 border border-surface-variant/30 flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="flex items-center gap-6">
          <div className="text-center bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/40 p-4 rounded-2xl min-w-32">
            <span className="text-4xl font-extrabold text-amber-600 dark:text-amber-400">{rating || '5.0'}</span>
            <div className="flex justify-center mt-1 mb-1">{renderStars(rating || 5)}</div>
            <span className="text-[11px] font-bold text-on-surface-variant">{totalReviews} đánh giá</span>
          </div>

          <div>
            <h3 className="font-bold text-lg text-primary">Đánh giá từ Doanh nghiệp (SMEs)</h3>
            <p className="text-xs text-on-surface-variant mt-1">
              Phản hồi thực tế từ các thương hiệu đã từng hợp tác chạy chiến dịch cùng KOL.
            </p>
          </div>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="px-5 py-2.5 rounded-full bg-primary hover:bg-primary/90 text-on-primary text-xs font-bold flex items-center gap-2 shadow-sm shrink-0 transition-all"
        >
          <MessageSquarePlus size={16} /> Viết đánh giá
        </button>
      </div>

      {/* Reviews List */}
      <div className="space-y-4">
        {reviews.map((review) => {
          const brandName = review.sme?.businessProfile?.businessName || review.sme?.name || 'Doanh nghiệp ẩn danh';
          return (
            <div
              key={review.id}
              className="bg-surface-container-lowest dark:bg-tertiary-container rounded-[2rem] p-6 border border-surface-variant/30 shadow-sm space-y-3"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold overflow-hidden border border-primary/20 shrink-0">
                    {review.sme?.avatarUrl ? (
                      <img src={review.sme.avatarUrl} alt={brandName} className="w-full h-full object-cover" />
                    ) : (
                      <Building size={18} />
                    )}
                  </div>
                  <div>
                    <h4 className="font-bold text-sm text-primary">{brandName}</h4>
                    <div className="flex items-center gap-2 text-xs text-on-surface-variant mt-0.5">
                      {renderStars(review.rating)}
                      <span className="font-semibold text-amber-600">{review.rating}.0</span>
                    </div>
                  </div>
                </div>

                <span className="text-[11px] text-on-surface-variant flex items-center gap-1">
                  <Calendar size={12} /> {new Date(review.createdAt).toLocaleDateString('vi-VN')}
                </span>
              </div>

              <p className="text-xs text-on-surface leading-relaxed pl-13 whitespace-pre-line">
                {review.content}
              </p>
            </div>
          );
        })}

        {reviews.length === 0 && (
          <div className="py-16 text-center text-on-surface-variant bg-surface-container-lowest dark:bg-tertiary-container rounded-[2rem] border border-surface-variant/30">
            <Building size={40} className="mx-auto mb-2 opacity-40 text-primary" />
            <p className="font-bold text-sm">Chưa có nhận xét nào từ doanh nghiệp</p>
            <p className="text-xs mt-1">Hãy là thương hiệu đầu tiên đánh giá hiệu quả của KOL này!</p>
          </div>
        )}
      </div>

      {/* Review Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <div className="bg-surface-container-lowest dark:bg-tertiary-container rounded-[2rem] max-w-md w-full p-6 shadow-xl border border-surface-variant/40 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between pb-3 border-b border-surface-variant/20 mb-4">
              <h3 className="font-bold text-base text-primary">Đánh giá hiệu quả KOL</h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 rounded-full text-on-surface-variant hover:bg-surface-variant/20"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSubmitReview} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-on-surface-variant mb-2 text-center">
                  Số sao đánh giá (Rating)
                </label>
                <div className="flex justify-center gap-2 py-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setNewRating(star)}
                      className="p-1 transition-transform hover:scale-110"
                    >
                      <Star
                        size={28}
                        className={`${
                          star <= newRating
                            ? 'fill-amber-400 text-amber-400'
                            : 'text-surface-variant/40'
                        }`}
                      />
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block font-bold text-on-surface-variant mb-1">
                  Nội dung nhận xét / Feedback
                </label>
                <textarea
                  rows={4}
                  required
                  placeholder="Chia sẻ về thái độ làm việc, chất lượng bài viết/video, chỉ số chuyển đổi thực tế..."
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  className="w-full p-3 rounded-xl bg-surface-container-lowest dark:bg-surface-container border border-surface-variant/40 text-xs focus:outline-none focus:ring-2 focus:ring-primary/50"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
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
                  {loading ? <Loader2 size={14} className="animate-spin" /> : 'Gửi nhận xét'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
