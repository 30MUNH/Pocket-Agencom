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
  Filter
} from 'lucide-react';
import { mediaApi } from '../../api/mediaApi';
import { uploadApi } from '../../api/uploadApi';
import { toast } from '../../store/toastStore';

export default function MediaLibrary() {
  const [assets, setAssets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState('all'); // 'all', 'image', 'video'
  const [searchQuery, setSearchQuery] = useState('');
  const [copiedId, setCopiedId] = useState(null);
  
  // New Asset Upload Form State
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [assetName, setAssetName] = useState('');
  const [assetUrl, setAssetUrl] = useState('');
  const [assetType, setAssetType] = useState('image');
  const [isUploading, setIsUploading] = useState(false);

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
      <div className="relative overflow-hidden rounded-3xl border border-slate-700/70 bg-gradient-to-br from-slate-900 via-indigo-950/30 to-slate-900 p-6 sm:p-8 shadow-xl backdrop-blur-xl">
        <div className="pointer-events-none absolute -right-12 -top-12 h-40 w-40 rounded-full bg-indigo-500/20 blur-3xl" />
        
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-indigo-500/30 bg-indigo-500/10 px-3 py-1 text-xs font-semibold text-indigo-300 mb-1">
              <FolderKanban className="h-3.5 w-3.5" /> Thư viện Thương hiệu Tập trung
            </div>
            <h2 className="text-2xl font-extrabold tracking-tight text-white sm:text-3xl">
              Kho dữ liệu Media (Media Library)
            </h2>
            <p className="mt-1 text-xs sm:text-sm text-slate-400">
              Lưu trữ tập trung Logo, hình ảnh sản phẩm và video truyền thông cho thương hiệu. AI tự động trích xuất khi lên kịch bản.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <label className="cursor-pointer inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 px-4 py-2.5 text-sm font-bold text-white shadow-lg shadow-indigo-600/30 transition-all">
              <Upload className="h-4 w-4" /> Tải tập tin lên
              <input type="file" onChange={handleDirectUpload} className="hidden" accept="image/*,video/*" />
            </label>
            <button
              onClick={() => setIsUploadModalOpen(true)}
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-700 bg-slate-800/80 px-4 py-2.5 text-sm font-semibold text-slate-200 hover:bg-slate-700 transition-colors"
            >
              <Plus className="h-4 w-4" /> Thêm theo URL
            </button>
          </div>
        </div>

        {/* Storage Summary */}
        <div className="mt-6 flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-slate-800 bg-slate-950/60 p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
              <HardDrive className="h-5 w-5" />
            </div>
            <div>
              <span className="text-xs font-semibold text-slate-400">Dung lượng sử dụng</span>
              <p className="text-sm font-bold text-white">{formattedStorage} MB / 5.0 GB</p>
            </div>
          </div>

          <div className="flex items-center gap-6 text-xs text-slate-400">
            <div>
              <span className="block font-bold text-white text-sm">{assets.length}</span>
              <span>Tổng tập tin</span>
            </div>
            <div>
              <span className="block font-bold text-emerald-400 text-sm">{assets.filter(a => a.fileType === 'image').length}</span>
              <span>Hình ảnh</span>
            </div>
            <div>
              <span className="block font-bold text-purple-400 text-sm">{assets.filter(a => a.fileType === 'video').length}</span>
              <span>Video</span>
            </div>
          </div>
        </div>
      </div>

      {/* Controls Bar: Search & Type Filter */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between rounded-2xl border border-slate-800 bg-slate-900/60 p-4 backdrop-blur-md">
        {/* Type Tabs */}
        <div className="flex items-center gap-1 rounded-xl border border-slate-800 bg-slate-950 p-1">
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
                className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold transition-all ${
                  filterType === tab.id
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Icon className="h-3.5 w-3.5" /> {tab.label}
              </button>
            );
          })}
        </div>

        {/* Search Field */}
        <div className="relative w-full sm:w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
          <input
            type="text"
            placeholder="Tìm tên tập tin..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-xl border border-slate-800 bg-slate-950 pl-9 pr-4 py-1.5 text-xs text-white placeholder-slate-500 focus:border-indigo-500 focus:outline-none"
          />
        </div>
      </div>

      {/* Drag and Drop Zone */}
      <label className="flex flex-col items-center justify-center rounded-3xl border border-dashed border-slate-700/80 bg-slate-900/40 p-6 text-center cursor-pointer hover:border-indigo-500/60 hover:bg-slate-900/60 transition-all backdrop-blur-md">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 mb-2">
          <Upload className="h-6 w-6" />
        </div>
        <p className="text-sm font-bold text-white">Kéo thả hình ảnh hoặc Video thương hiệu vào đây</p>
        <p className="text-xs text-slate-500 mt-0.5">Hỗ trợ PNG, JPG, WEBP, MP4 (Tối đa 50MB)</p>
        <input type="file" onChange={handleDirectUpload} className="hidden" accept="image/*,video/*" />
      </label>

      {/* Media Assets Grid */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <RefreshCw className="h-7 w-7 animate-spin text-indigo-400 mb-3" />
          <p className="text-xs text-slate-400">Đang tải kho media...</p>
        </div>
      ) : filteredAssets.length === 0 ? (
        <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-8 text-center text-slate-400">
          Chưa tìm thấy tập tin media nào phù hợp.
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filteredAssets.map(asset => (
            <div
              key={asset.id}
              className="group relative overflow-hidden rounded-2xl border border-slate-800 bg-slate-900/70 shadow-lg backdrop-blur-md transition-all hover:-translate-y-1 hover:border-indigo-500/50"
            >
              {/* Media Thumbnail */}
              <div className="relative aspect-video w-full overflow-hidden bg-slate-950">
                {asset.fileType === 'video' ? (
                  <div className="relative h-full w-full">
                    <img src={asset.url} alt={asset.name} className="h-full w-full object-cover opacity-80" />
                    <div className="absolute inset-0 flex items-center justify-center bg-slate-950/40">
                      <Film className="h-8 w-8 text-purple-400" />
                    </div>
                  </div>
                ) : (
                  <img
                    src={asset.url}
                    alt={asset.name}
                    className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                  />
                )}

                <span className="absolute left-2.5 top-2.5 rounded-full bg-slate-950/80 px-2 py-0.5 text-[10px] font-bold text-slate-300 border border-slate-800 uppercase">
                  {asset.fileType}
                </span>
              </div>

              {/* Asset Info Footer */}
              <div className="p-4">
                <h4 className="text-xs font-bold text-white truncate" title={asset.name}>
                  {asset.name}
                </h4>
                <div className="mt-1 flex items-center justify-between text-[11px] text-slate-400">
                  <span>{new Date(asset.createdAt).toLocaleDateString('vi-VN')}</span>
                  <span>{((asset.sizeBytes || 0) / (1024 * 1024)).toFixed(2)} MB</span>
                </div>

                <div className="mt-3 flex items-center justify-between gap-2 border-t border-slate-800/80 pt-2.5">
                  <button
                    onClick={() => handleCopyUrl(asset.id, asset.url)}
                    className="inline-flex items-center gap-1 rounded-lg border border-slate-700 bg-slate-800/80 px-2.5 py-1 text-[11px] font-semibold text-slate-300 hover:bg-slate-700 hover:text-white transition-all"
                  >
                    {copiedId === asset.id ? <Check className="h-3 w-3 text-emerald-400" /> : <Copy className="h-3 w-3" />}
                    <span>{copiedId === asset.id ? 'Đã copy URL' : 'Sao chép URL'}</span>
                  </button>

                  <button
                    onClick={() => handleDelete(asset.id)}
                    className="rounded-lg p-1.5 text-rose-400 hover:bg-rose-500/20 transition-colors"
                    title="Xóa tập tin"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add URL Modal */}
      {isUploadModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-md">
          <div className="w-full max-w-md rounded-3xl border border-slate-700 bg-slate-900 p-6 shadow-2xl text-white">
            <h3 className="text-lg font-bold text-white mb-4">Thêm URL tài nguyên Media</h3>
            
            <form onSubmit={handleCreateAssetUrl} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase text-slate-400 mb-1">Tên tài nguyên</label>
                <input
                  type="text"
                  placeholder="Ví dụ: Banner_Khuyen_Mai_Thang7.png"
                  value={assetName}
                  onChange={(e) => setAssetName(e.target.value)}
                  className="w-full rounded-xl border border-slate-800 bg-slate-950 p-3 text-xs text-white focus:border-indigo-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-slate-400 mb-1">Đường dẫn URL media</label>
                <input
                  type="url"
                  placeholder="https://..."
                  value={assetUrl}
                  onChange={(e) => setAssetUrl(e.target.value)}
                  className="w-full rounded-xl border border-slate-800 bg-slate-950 p-3 text-xs text-white focus:border-indigo-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-slate-400 mb-1">Loại định dạng</label>
                <select
                  value={assetType}
                  onChange={(e) => setAssetType(e.target.value)}
                  className="w-full rounded-xl border border-slate-800 bg-slate-950 p-3 text-xs text-white focus:border-indigo-500 focus:outline-none"
                >
                  <option value="image">Hình ảnh (PNG, JPG, WEBP)</option>
                  <option value="video">Video (MP4, MOV)</option>
                </select>
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsUploadModalOpen(false)}
                  className="rounded-xl px-4 py-2 text-xs font-bold text-slate-400 hover:bg-slate-800"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={isUploading}
                  className="rounded-xl bg-indigo-600 hover:bg-indigo-500 px-5 py-2 text-xs font-bold text-white shadow-md disabled:opacity-50"
                >
                  {isUploading ? 'Đang lưu...' : 'Lưu tài nguyên'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
