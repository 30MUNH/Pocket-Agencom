import { useState, useEffect } from 'react';
import { 
  Users, 
  Activity, 
  Trash2, 
  RefreshCw, 
  Plus, 
  Loader2, 
  ExternalLink,
  MessageSquare,
  Globe
} from 'lucide-react';
import { socialApi } from '../../api/socialApi';
import { toast } from '../../store/toastStore';

function FacebookIcon({ className }) {
  return (
    <svg 
      className={className} 
      fill="currentColor" 
      viewBox="0 0 24 24" 
      xmlns="http://www.w3.org/2000/svg"
    >
      <path d="M22 12c0-5.52-4.48-10-10-10S2 6.48 2 12c0 4.84 3.44 8.87 8 9.8V15H8v-3h2V9.5C10 7.57 11.57 6 13.5 6H16v3h-2c-.55 0-1 .45-1 1v2h3v3h-3v6.95c4.56-.93 8-4.96 8-9.75z"/>
    </svg>
  );
}

function InstagramIcon({ className }) {
  return (
    <svg 
      className={className} 
      fill="none" 
      stroke="currentColor" 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round" 
      viewBox="0 0 24 24" 
      xmlns="http://www.w3.org/2000/svg"
    >
      <rect x="2" y="2" width="20" height="20" rx="5" ry="5"/>
      <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/>
      <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"/>
    </svg>
  );
}

// A simple local TikTok icon since lucide-react might not have a direct TikTok icon
function TikTokIcon({ className }) {
  return (
    <svg 
      className={className} 
      fill="currentColor" 
      viewBox="0 0 24 24" 
      xmlns="http://www.w3.org/2000/svg"
    >
      <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.17-2.89-.6-4.09-1.51-.71-.53-1.3-1.22-1.74-2v6.62c.04 2.87-1.39 5.86-3.99 7.06-2.58 1.25-6.02.9-8.15-1.14-2.28-2.26-2.47-6.27-.42-8.77 1.83-2.3 5.34-2.88 7.82-1.33v4.19c-1.41-.95-3.41-.74-4.57.51-.97 1.09-1.01 2.89-.08 4 .98 1.22 2.85 1.48 4.09.57.85-.59 1.28-1.63 1.25-2.67V.02z"/>
    </svg>
  );
}

export default function SocialLinkManager() {
  const [platforms, setPlatforms] = useState([]);
  const [selectedPlatform, setSelectedPlatform] = useState('tiktok');
  const [url, setUrl] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(false);
  const [error, setError] = useState('');
  const [analyzingId, setAnalyzingId] = useState(null);

  const fetchPlatforms = async () => {
    setIsFetching(true);
    try {
      const response = await socialApi.getPlatforms();
      setPlatforms(response.data || []);
    } catch (err) {
      console.error('Failed to load platforms:', err);
      setError('Không thể tải danh sách liên kết mạng xã hội.');
    } finally {
      setIsFetching(false);
    }
  };

  useEffect(() => {
    fetchPlatforms();
  }, []);

  const handleAddPlatform = async (e) => {
    e.preventDefault();
    if (!url.trim()) return;

    setIsLoading(true);
    setError('');
    try {
      await socialApi.addPlatform({
        platform: selectedPlatform,
        url: url.trim()
      });
      setUrl('');
      await fetchPlatforms();
      toast.success('Phân tích và liên kết tài khoản thành công!');
    } catch (err) {
      console.error('Error adding platform:', err);
      setError(err.response?.data?.error?.message || 'Có lỗi xảy ra khi phân tích profile.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Bạn có chắc chắn muốn ngắt kết nối tài khoản này không?')) return;

    try {
      await socialApi.deletePlatform(id);
      setPlatforms(prev => prev.filter(p => p.id !== id));
      toast.success('Đã ngắt kết nối tài khoản mạng xã hội.');
    } catch (err) {
      console.error('Error deleting platform:', err);
      toast.error('Không thể ngắt kết nối tài khoản.');
    }
  };

  const handleReanalyze = async (id) => {
    setAnalyzingId(id);
    try {
      await socialApi.analyzePlatform(id);
      await fetchPlatforms();
      toast.success('Cập nhật phân tích tài khoản thành công!');
    } catch (err) {
      console.error('Error re-analyzing platform:', err);
      toast.error('Có lỗi xảy ra khi cập nhật phân tích.');
    } finally {
      setAnalyzingId(null);
    }
  };

  const getPlatformIcon = (platform, sizeClass = "w-5 h-5") => {
    switch (platform.toLowerCase()) {
      case 'tiktok':
        return <TikTokIcon className={sizeClass} />;
      case 'facebook':
        return <FacebookIcon className={sizeClass} />;
      case 'instagram':
        return <InstagramIcon className={sizeClass} />;
      default:
        return <Globe className={sizeClass} />;
    }
  };

  const getPlatformColor = (platform) => {
    switch (platform.toLowerCase()) {
      case 'tiktok':
        return 'bg-black text-white';
      case 'facebook':
        return 'bg-[#1877F2] text-white';
      case 'instagram':
        return 'bg-gradient-to-tr from-[#f9ce34] via-[#ee2a7b] to-[#6228d7] text-white';
      default:
        return 'bg-gray-500 text-white';
    }
  };

  const formatFollowers = (count) => {
    if (count >= 1000000) {
      return (count / 1000000).toFixed(1) + 'M';
    }
    if (count >= 1000) {
      return (count / 1000).toFixed(1) + 'K';
    }
    return count;
  };

  return (
    <div className="space-y-8">
      {/* Add New Platform Card */}
      <section className="bg-surface-container-lowest rounded-3xl shadow-ambient p-8 md:p-12 border border-surface-container/20">
        <div className="mb-6">
          <h3 className="text-headline-md font-headline-md text-primary">Liên kết Mạng xã hội</h3>
          <p className="text-body-md font-body-md text-on-surface-variant mt-2">
            Liên kết các kênh TikTok, Facebook, hoặc Instagram của bạn để AI phân tích hiệu suất và đề xuất chiến dịch tối ưu.
          </p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-rose-50 border border-rose-200 text-rose-800 rounded-2xl text-body-md">
            {error}
          </div>
        )}

        <form onSubmit={handleAddPlatform} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-2">
              <label className="block text-label-sm font-label-sm text-on-surface-variant">
                Nền tảng
              </label>
              <select
                value={selectedPlatform}
                onChange={(e) => setSelectedPlatform(e.target.value)}
                className="w-full bg-surface-container-lowest text-primary border border-surface-variant rounded-xl px-4 py-3 text-body-md focus:outline-none focus:ring-2 focus:ring-secondary-container focus:border-transparent transition-all"
              >
                <option value="tiktok">TikTok</option>
                <option value="facebook">Facebook</option>
                <option value="instagram">Instagram</option>
              </select>
            </div>

            <div className="md:col-span-2 space-y-2">
              <label className="block text-label-sm font-label-sm text-on-surface-variant">
                Đường dẫn URL hồ sơ
              </label>
              <input
                type="url"
                required
                placeholder="Ví dụ: https://www.tiktok.com/@my_brand"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                className="w-full bg-surface-container-lowest text-primary border border-surface-variant rounded-xl px-4 py-3 text-body-md focus:outline-none focus:ring-2 focus:ring-secondary-container focus:border-transparent transition-all"
              />
            </div>
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={isLoading}
              className="bg-secondary-container text-on-secondary-container hover:bg-secondary hover:text-on-secondary disabled:opacity-50 hover:shadow-ambient px-8 py-3 rounded-full text-label-sm font-label-sm font-bold transition-all flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Đang phân tích Profile...
                </>
              ) : (
                <>
                  <Plus className="w-4 h-4" />
                  Phân tích Profile
                </>
              )}
            </button>
          </div>
        </form>
      </section>

      {/* Linked Platforms List */}
      <section className="space-y-6">
        <h4 className="text-headline-sm font-headline-sm text-primary">Các tài khoản đã liên kết</h4>

        {isFetching ? (
          <div className="flex items-center justify-center py-12 gap-2 text-on-surface-variant">
            <Loader2 className="animate-spin" size={24} />
            Đang tải dữ liệu liên kết...
          </div>
        ) : platforms.length === 0 ? (
          <div className="text-center p-12 bg-surface-container-lowest rounded-3xl border border-dashed border-outline-variant/60">
            <p className="text-on-surface-variant text-body-md">Chưa có tài khoản mạng xã hội nào được liên kết.</p>
            <p className="text-on-surface-variant text-sm mt-1">Hãy nhập URL ở trên để bắt đầu phân tích.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6">
            {platforms.map((plat) => (
              <div 
                key={plat.id}
                className="bg-surface-container-lowest rounded-3xl p-6 md:p-8 shadow-ambient border border-surface-container/20 flex flex-col md:flex-row gap-6 justify-between"
              >
                {/* Platform Summary & Metrics */}
                <div className="flex-1 space-y-4">
                  <div className="flex items-center gap-3">
                    <div className={`p-2.5 rounded-2xl flex items-center justify-center ${getPlatformColor(plat.platform)}`}>
                      {getPlatformIcon(plat.platform, "w-6 h-6")}
                    </div>
                    <div>
                      <h5 className="text-label-lg font-bold text-primary capitalize flex items-center gap-2">
                        {plat.platform}
                        <a 
                          href={plat.url} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-on-surface-variant hover:text-primary transition-colors inline-block"
                        >
                          <ExternalLink className="w-4 h-4" />
                        </a>
                      </h5>
                      <span className="text-body-sm text-on-surface-variant truncate block max-w-xs md:max-w-md">
                        {plat.url}
                      </span>
                    </div>
                  </div>

                  {/* Micro Bento Metrics */}
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                    <div className="bg-surface-container-low rounded-2xl p-4 flex items-center gap-3">
                      <div className="p-2 bg-secondary-container rounded-xl text-primary">
                        <Users className="w-5 h-5" />
                      </div>
                      <div>
                        <span className="text-body-xs text-on-surface-variant block">Followers</span>
                        <span className="text-label-md font-bold text-primary">{formatFollowers(plat.followersCount)}</span>
                      </div>
                    </div>

                    <div className="bg-surface-container-low rounded-2xl p-4 flex items-center gap-3">
                      <div className="p-2 bg-secondary-container rounded-xl text-primary">
                        <Activity className="w-5 h-5" />
                      </div>
                      <div>
                        <span className="text-body-xs text-on-surface-variant block">Tương tác</span>
                        <span className="text-label-md font-bold text-primary">{plat.engagementRate}%</span>
                      </div>
                    </div>
                  </div>

                  {/* AI Insight Markdown Render */}
                  {plat.aiInsight && (
                    <div className="bg-surface-container-lowest border border-surface-variant/40 rounded-2xl p-5 space-y-3">
                      <div className="flex items-center gap-2 text-label-sm font-bold text-primary">
                        <MessageSquare className="w-4 h-4 text-secondary" />
                        Đánh giá phân tích AI
                      </div>
                      <div className="text-body-md text-on-surface-variant space-y-3 prose max-w-none">
                        {plat.aiInsight.split('\n\n').map((section, idx) => {
                          const lines = section.split('\n');
                          const title = lines[0].replace('### ', '');
                          const items = lines.slice(1).map(l => l.replace('- ', ''));
                          return (
                            <div key={idx}>
                              <span className="font-bold text-sm text-primary block mb-1">{title}</span>
                              <ul className="list-disc pl-4 space-y-1 text-sm">
                                {items.map((item, i) => (
                                  <li key={i}>{item}</li>
                                ))}
                              </ul>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>

                {/* Action Buttons */}
                <div className="flex md:flex-col justify-end md:justify-start gap-3 shrink-0">
                  <button
                    onClick={() => handleReanalyze(plat.id)}
                    disabled={analyzingId === plat.id}
                    className="flex-1 md:flex-none border border-outline text-primary hover:bg-secondary-container/50 disabled:opacity-50 px-5 py-2.5 rounded-full text-label-xs font-bold transition-all flex items-center justify-center gap-2"
                  >
                    {analyzingId === plat.id ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <RefreshCw className="w-4 h-4" />
                    )}
                    Phân tích lại
                  </button>

                  <button
                    onClick={() => handleDelete(plat.id)}
                    className="flex-1 md:flex-none border border-rose-200 text-rose-700 hover:bg-rose-50 px-5 py-2.5 rounded-full text-label-xs font-bold transition-all flex items-center justify-center gap-2"
                  >
                    <Trash2 className="w-4 h-4" />
                    Ngắt kết nối
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
