import React, { useState, useEffect } from 'react';
import { 
  FolderKanban, 
  Upload, 
  Image as ImageIcon, 
  Film, 
  FileText, 
  Copy, 
  Check, 
  Trash2, 
  Plus, 
  ExternalLink, 
  HardDrive, 
  Sparkles, 
  RefreshCw,
  Search,
  Filter,
  X,
  Eye,
  Download
} from 'lucide-react';
import { mediaApi } from '../../api/mediaApi';
import { uploadApi } from '../../api/uploadApi';
import { toast } from '../../store/toastStore';
import SocialImageGeneratorModal from '../../components/media/SocialImageGeneratorModal';

export default function MediaLibrary() {
  const [assets, setAssets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState('all'); // 'all', 'image', 'video'
  const [searchQuery, setSearchQuery] = useState('');
  const [copiedId, setCopiedId] = useState(null);
  const [previewAsset, setPreviewAsset] = useState(null);
  
  // New Asset Upload Form State
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [assetName, setAssetName] = useState('');
  const [assetUrl, setAssetUrl] = useState('');
  const [assetType, setAssetType] = useState('image');
  const [isUploading, setIsUploading] = useState(false);
  const [isAiModalOpen, setIsAiModalOpen] = useState(false);

  const fetchAssets = async () => {
    try {
      setLoading(true);
      const res = await mediaApi.getAssets();
      setAssets(res || []);
    } catch (err) {
      console.error('[Media Fetch Error]', err);
      toast.error('Không thể tải kho tài nguyên Media.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAssets();
  }, []);

  const handleCopyUrl = async (id, url) => {
    try {
      await navigator.clipboard.writeText(url);
      setCopiedId(id);
      toast.success('Đã sao chép liên kết media vào bộ nhớ tạm!');
      setTimeout(() => setCopiedId(null), 2000);
    } catch (err) {
      toast.error('Không thể sao chép liên kết.');
    }
  };

  const handleDelete = async (id) => {
    try {
      await mediaApi.deleteAsset(id);
      setAssets(prev => prev.filter(a => a.id !== id));
      toast.success('Đã xóa tập tin media.');
    } catch (err) {
      toast.error('Không thể xóa tập tin.');
    }
  };

  const handleDirectUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setIsUploading(true);
      const uploadRes = await uploadApi.uploadSingle(file);
      const fileUrl = uploadRes?.url || URL.createObjectURL(file);
      const detectedType = file.type.startsWith('video') ? 'video' : 'image';

      const newAsset = await mediaApi.uploadAsset({
        name: file.name,
        url: fileUrl,
        fileType: detectedType,
        sizeBytes: file.size
      });

      setAssets(prev => [newAsset, ...prev]);
      toast.success(`Tải lên ${file.name} thành công!`);
    } catch (err) {
      console.error('[Upload Error]', err);
      toast.error('Tải lên thất bại. Đã thêm với định dạng preview.');
    } finally {
      setIsUploading(false);
    }
  };

  const handleCreateAssetUrl = async (e) => {
    e.preventDefault();
    if (!assetName.trim() || !assetUrl.trim()) {
      toast.error('Vui lòng nhập tên tập tin và URL.');
      return;
    }

    try {
      setIsUploading(true);
      const newAsset = await mediaApi.uploadAsset({
        name: assetName,
        url: assetUrl,
        fileType: assetType,
        sizeBytes: 1500000
      });

      setAssets(prev => [newAsset, ...prev]);
      toast.success('Đã thêm tài nguyên media mới!');
      setAssetName('');
      setAssetUrl('');
      setIsUploadModalOpen(false);
    } catch (err) {
      toast.error('Không thể lưu tài nguyên media.');
    } finally {
      setIsUploading(false);
    }
  };

  // Filter & Search Logic
  const filteredAssets = assets.filter(asset => {
    const matchesType = filterType === 'all' || asset.fileType === filterType;
    const matchesSearch = asset.name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesType && matchesSearch;
  });

  const totalBytes = assets.reduce((sum, item) => sum + Number(item.sizeBytes || 0), 0);
  const formattedStorage = (totalBytes / (1024 * 1024)).toFixed(1);

  return (
    <div className="space-y-6">
      
      {/* Header Banner */}
      <div className="bg-surface-container-lowest dark:bg-tertiary-container rounded-[2.5rem] p-6 sm:p-8 shadow-ambient border border-surface-variant/40 relative overflow-hidden">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <span className="inline-flex items-center gap-1.5 text-xs font-bold text-secondary uppercase tracking-wider mb-1 bg-secondary-container px-3 py-1 rounded-full">
              <FolderKanban size={14} /> Thư viện Thương hiệu Tập trung
            </span>
            <h2 className="text-2xl font-bold tracking-tight text-primary dark:text-inverse-primary sm:text-3xl">
              Kho dữ liệu Media (Media Library)
            </h2>
            <p className="mt-1 text-xs sm:text-sm text-on-surface-variant">
              Lưu trữ tập trung Logo, hình ảnh sản phẩm và video truyền thông cho thương hiệu. AI tự động trích xuất khi lên kịch bản.
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <button
              onClick={() => setIsAiModalOpen(true)}
              className="inline-flex items-center justify-center gap-2 rounded-full bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-600 hover:to-rose-600 px-4 py-2.5 text-xs font-bold text-white shadow-sm transition-opacity"
            >
              <Sparkles size={16} /> Tạo ảnh AI
            </button>
            <label className="cursor-pointer inline-flex items-center justify-center gap-2 rounded-full bg-primary text-on-primary hover:opacity-90 px-4 py-2.5 text-xs font-bold shadow-sm transition-opacity">
              <Upload size={16} /> Tải tập tin lên
              <input type="file" onChange={handleDirectUpload} className="hidden" accept="image/*,video/*" />
            </label>
            <button
              onClick={() => setIsUploadModalOpen(true)}
              className="inline-flex items-center justify-center gap-2 rounded-full border border-surface-variant/50 bg-secondary-container hover:bg-secondary-container/80 px-4 py-2.5 text-xs font-bold text-primary transition-colors"
            >
              <Plus size={16} /> Thêm theo URL
            </button>
          </div>
        </div>

        {/* Storage Summary */}
        <div className="mt-6 flex flex-wrap items-center justify-between gap-4 rounded-3xl bg-surface-container-low dark:bg-surface-variant/20 p-4 border border-surface-variant/30">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-secondary-container text-secondary flex items-center justify-center shrink-0">
              <HardDrive size={20} />
            </div>
            <div>
              <span className="text-xs font-medium text-on-surface-variant">Dung lượng sử dụng</span>
              <p className="text-sm font-bold text-primary dark:text-inverse-primary">{formattedStorage} MB / 5.0 GB</p>
            </div>
          </div>

          <div className="flex items-center gap-6 text-xs text-on-surface-variant">
            <div>
              <span className="block font-bold text-primary dark:text-inverse-primary text-sm">{assets.length}</span>
              <span>Tổng tập tin</span>
            </div>
            <div>
              <span className="block font-bold text-emerald-600 dark:text-emerald-400 text-sm">{assets.filter(a => a.fileType === 'image').length}</span>
              <span>Hình ảnh</span>
            </div>
            <div>
              <span className="block font-bold text-purple-600 dark:text-purple-400 text-sm">{assets.filter(a => a.fileType === 'video').length}</span>
              <span>Video</span>
            </div>
          </div>
        </div>
      </div>

      {/* Controls Bar: Search & Type Filter */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between rounded-[2.5rem] bg-surface-container-lowest dark:bg-tertiary-container p-4 shadow-ambient border border-surface-variant/40">
        {/* Type Tabs */}
        <div className="flex items-center gap-1 overflow-x-auto rounded-full border border-surface-variant/40 bg-surface-container-low dark:bg-surface-variant/20 p-1">
          {[
            { id: 'all', label: 'Tất cả media', icon: FolderKanban },
            { id: 'image', label: 'Hình ảnh', icon: ImageIcon },
            { id: 'video', label: 'Video Teaser', icon: Film },
          ].map(tab => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setFilterType(tab.id)}
                className={`inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-xs font-bold transition-all whitespace-nowrap ${
                  filterType === tab.id
                    ? 'bg-primary text-on-primary shadow-sm'
                    : 'text-on-surface-variant hover:text-primary'
                }`}
              >
                <Icon size={14} /> {tab.label}
              </button>
            );
          })}
        </div>

        {/* Search Field */}
        <div className="relative w-full sm:w-64">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-on-surface-variant/60" />
          <input
            type="text"
            placeholder="Tìm tên tập tin..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-full border border-surface-variant/40 bg-surface-container-low dark:bg-surface-variant/20 pl-10 pr-4 py-2 text-xs text-primary dark:text-inverse-primary placeholder:text-on-surface-variant/50 focus:outline-none focus:ring-2 focus:ring-secondary/40"
          />
        </div>
      </div>

      {/* Drag and Drop Zone */}
      <label className="flex flex-col items-center justify-center rounded-[2.5rem] border border-dashed border-surface-variant bg-surface-container-lowest dark:bg-tertiary-container p-8 text-center cursor-pointer hover:border-secondary transition-all shadow-ambient">
        <div className="w-12 h-12 rounded-full bg-secondary-container text-secondary flex items-center justify-center mb-2">
          <Upload size={22} />
        </div>
        <p className="text-sm font-bold text-primary dark:text-inverse-primary">Kéo thả hình ảnh hoặc Video thương hiệu vào đây</p>
        <p className="text-xs text-on-surface-variant mt-0.5">Hỗ trợ PNG, JPG, WEBP, MP4 (Tối đa 50MB)</p>
        <input type="file" onChange={handleDirectUpload} className="hidden" accept="image/*,video/*" />
      </label>

      {/* Media Assets Grid */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-16 text-center text-on-surface-variant bg-surface-container-lowest dark:bg-tertiary-container rounded-[2.5rem] border border-surface-variant/30">
          <RefreshCw className="h-7 w-7 animate-spin text-primary mb-3" />
          <p className="text-xs font-medium">Đang tải kho media...</p>
        </div>
      ) : filteredAssets.length === 0 ? (
        <div className="rounded-[2.5rem] border border-surface-variant/30 bg-surface-container-lowest dark:bg-tertiary-container p-8 text-center text-on-surface-variant shadow-ambient">
          Chưa tìm thấy tập tin media nào phù hợp.
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filteredAssets.map(asset => (
            <div
              key={asset.id}
              className="group relative overflow-hidden rounded-3xl border border-surface-variant/40 bg-surface-container-lowest dark:bg-tertiary-container p-4 shadow-ambient hover:shadow-ambient-hover transition-all duration-300 hover:-translate-y-1"
            >
              {/* Media Thumbnail */}
              <div
                onClick={() => setPreviewAsset(asset)}
                className="relative aspect-video w-full overflow-hidden rounded-2xl bg-surface-container-high cursor-pointer group/thumb"
                title="Nhấp để xem trước kích thước lớn"
              >
                {asset.fileType === 'video' ? (
                  <div className="relative h-full w-full">
                    <img src={asset.url} alt={asset.name} className="h-full w-full object-cover opacity-80" />
                    <div className="absolute inset-0 flex items-center justify-center bg-primary/40">
                      <Film className="h-8 w-8 text-white" />
                    </div>
                  </div>
                ) : (
                  <img
                    src={asset.url}
                    alt={asset.name}
                    className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                  />
                )}

                <div className="absolute inset-0 bg-primary/30 opacity-0 group-hover/thumb:opacity-100 flex items-center justify-center transition-opacity">
                  <span className="p-2 rounded-full bg-white/80 dark:bg-black/60 text-primary dark:text-white shadow-sm">
                    <Eye size={18} />
                  </span>
                </div>

                <span className="absolute left-2.5 top-2.5 rounded-full bg-primary/80 px-2.5 py-0.5 text-[10px] font-bold text-on-primary uppercase">
                  {asset.fileType}
                </span>
              </div>

              {/* Asset Info Footer */}
              <div className="pt-3">
                <h4 className="text-xs font-bold text-primary dark:text-inverse-primary truncate" title={asset.name}>
                  {asset.name}
                </h4>
                <div className="mt-1 flex items-center justify-between text-[11px] text-on-surface-variant">
                  <span>{new Date(asset.createdAt).toLocaleDateString('vi-VN')}</span>
                  <span>{((asset.sizeBytes || 0) / (1024 * 1024)).toFixed(2)} MB</span>
                </div>

                <div className="mt-3 flex items-center justify-between gap-2 border-t border-surface-variant/20 pt-2.5">
                  <button
                    onClick={() => handleCopyUrl(asset.id, asset.url)}
                    className="inline-flex items-center gap-1 rounded-full border border-surface-variant/40 bg-secondary-container px-3 py-1 text-[11px] font-bold text-secondary hover:bg-secondary-container/80 transition-colors"
                  >
                    {copiedId === asset.id ? <Check size={12} className="text-emerald-600" /> : <Copy size={12} />}
                    <span>{copiedId === asset.id ? 'Đã copy URL' : 'Sao chép URL'}</span>
                  </button>

                  <button
                    onClick={() => handleDelete(asset.id)}
                    className="rounded-full p-1.5 text-error hover:bg-error-container/40 transition-colors"
                    title="Xóa tập tin"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add URL Modal */}
      {isUploadModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-primary/40 backdrop-blur-sm animate-fade-in">
          <div className="relative w-full max-w-md overflow-hidden rounded-[2.5rem] border border-surface-variant/40 bg-surface-container-lowest dark:bg-tertiary-container p-6 sm:p-8 shadow-ambient text-primary dark:text-inverse-primary">
            
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-primary dark:text-inverse-primary">Thêm URL tài nguyên Media</h3>
              <button
                onClick={() => setIsUploadModalOpen(false)}
                className="rounded-full p-1 text-on-surface-variant hover:bg-surface-container-high"
              >
                <X size={20} />
              </button>
            </div>
            
            <form onSubmit={handleCreateAssetUrl} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase text-on-surface-variant mb-1">Tên tài nguyên</label>
                <input
                  type="text"
                  placeholder="Ví dụ: Banner_Khuyen_Mai_Thang7.png"
                  value={assetName}
                  onChange={(e) => setAssetName(e.target.value)}
                  className="w-full rounded-2xl border border-surface-variant/40 bg-surface-container-low dark:bg-surface-variant/20 p-3 text-xs text-primary dark:text-inverse-primary focus:outline-none focus:ring-2 focus:ring-secondary/40"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-on-surface-variant mb-1">Đường dẫn URL media</label>
                <input
                  type="url"
                  placeholder="https://..."
                  value={assetUrl}
                  onChange={(e) => setAssetUrl(e.target.value)}
                  className="w-full rounded-2xl border border-surface-variant/40 bg-surface-container-low dark:bg-surface-variant/20 p-3 text-xs text-primary dark:text-inverse-primary focus:outline-none focus:ring-2 focus:ring-secondary/40"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-on-surface-variant mb-1">Loại định dạng</label>
                <select
                  value={assetType}
                  onChange={(e) => setAssetType(e.target.value)}
                  className="w-full rounded-2xl border border-surface-variant/40 bg-surface-container-low dark:bg-surface-variant/20 p-3 text-xs text-primary dark:text-inverse-primary focus:outline-none focus:ring-2 focus:ring-secondary/40"
                >
                  <option value="image">Hình ảnh (PNG, JPG, WEBP)</option>
                  <option value="video">Video (MP4, MOV)</option>
                </select>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-surface-variant/30">
                <button
                  type="button"
                  onClick={() => setIsUploadModalOpen(false)}
                  className="rounded-full px-4 py-2 text-xs font-bold text-on-surface-variant hover:bg-surface-container-high"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={isUploading}
                  className="rounded-full bg-primary text-on-primary hover:opacity-90 px-5 py-2 text-xs font-bold shadow-sm disabled:opacity-50"
                >
                  {isUploading ? 'Đang lưu...' : 'Lưu tài nguyên'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* AI Image Generation Studio Modal */}
      <SocialImageGeneratorModal
        isOpen={isAiModalOpen}
        onClose={() => {
          setIsAiModalOpen(false);
          fetchAssets();
        }}
        onAttach={() => {
          fetchAssets();
        }}
      />

      {/* Media Lightbox Preview Modal */}
      {previewAsset && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-primary/60 backdrop-blur-md animate-fade-in">
          <div className="relative w-full max-w-3xl max-h-[90vh] overflow-y-auto rounded-[2.5rem] border border-surface-variant/40 bg-surface-container-lowest dark:bg-tertiary-container p-6 sm:p-8 shadow-ambient text-primary dark:text-inverse-primary animate-scale-in">
            
            <div className="flex items-center justify-between pb-4 border-b border-surface-variant/30 mb-4">
              <div>
                <span className="inline-block bg-secondary-container text-on-secondary-container px-3 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider mb-1">
                  {previewAsset.fileType}
                </span>
                <h3 className="text-lg font-bold text-primary dark:text-inverse-primary truncate max-w-md sm:max-w-lg">
                  {previewAsset.name}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setPreviewAsset(null)}
                className="rounded-full p-2 text-on-surface-variant hover:bg-surface-container-high transition-colors"
                aria-label="Đóng"
              >
                <X size={20} />
              </button>
            </div>

            {/* Preview Display */}
            <div className="rounded-2xl overflow-hidden bg-black/5 dark:bg-black/40 border border-surface-variant/30 flex items-center justify-center min-h-[300px] max-h-[500px] mb-4">
              {previewAsset.fileType === 'video' ? (
                <video src={previewAsset.url} controls className="max-h-[480px] w-full rounded-2xl" autoPlay />
              ) : (
                <img
                  src={previewAsset.url}
                  alt={previewAsset.name}
                  className="max-h-[480px] w-auto max-w-full object-contain rounded-2xl"
                />
              )}
            </div>

            {/* Details & Actions */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-2 border-t border-surface-variant/30">
              <div className="text-xs text-on-surface-variant space-y-0.5">
                <p>Kích thước: <strong>{((previewAsset.sizeBytes || 0) / (1024 * 1024)).toFixed(2)} MB</strong></p>
                <p>Ngày tải lên: <strong>{new Date(previewAsset.createdAt).toLocaleString('vi-VN')}</strong></p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleCopyUrl(previewAsset.id, previewAsset.url)}
                  className="inline-flex items-center gap-1.5 rounded-full border border-surface-variant/40 bg-secondary-container px-4 py-2 text-xs font-bold text-secondary hover:bg-secondary-container/80 transition-colors"
                >
                  {copiedId === previewAsset.id ? <Check size={14} className="text-emerald-600" /> : <Copy size={14} />}
                  <span>{copiedId === previewAsset.id ? 'Đã copy URL' : 'Sao chép URL'}</span>
                </button>

                <a
                  href={previewAsset.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  download={previewAsset.name}
                  className="inline-flex items-center gap-1.5 rounded-full bg-primary text-on-primary hover:opacity-90 px-4 py-2 text-xs font-bold shadow-sm transition-opacity"
                >
                  <Download size={14} />
                  <span>Tải xuống</span>
                </a>
              </div>
            </div>

          </div>
        </div>
      )}
    </div>
  );
}
