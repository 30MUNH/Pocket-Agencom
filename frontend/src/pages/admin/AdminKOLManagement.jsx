import { useState } from 'react';
import { Search, Plus, Edit2, CreditCard, X } from 'lucide-react';

const INITIAL_KOLS = [
  {
    id: 1,
    name: 'Sarah Jenkins',
    handle: '@sarahstyles',
    niche: 'Thời trang & Đời sống',
    avatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDS05Gv_0-pH0K-UfGG1JjG10AyRgTS2JyqP2deiFT3hHxZ28kHYPuu-NAb9-P-v-rAP5fSS246Fj6HcIf2ZPcpfQxnX1Xn95XyA8nbTJ0YZLRxnH1ZiEEu6bvBW_BxtpKLJiQo0ga_zVNmIyjmfLdYCfl6bQ9xFp66BzyNnigbaCVifHr5SsFoVzXOy2rX0gYoxAdfcOLqtncLBdjOieFVW6glAwDqjTOTRC8AeLWXgwYou_1e9Z9TzBNNLrBmVEnVxuxn3TNSc68',
    platform: 'Instagram',
    followers: '125K',
    engagement: '4.2%',
    cpa: '$45',
    active: true,
    tier: 'Mid',
    sparkline: [30, 50, 40, 70, 60, 80, 90],
  },
  {
    id: 2,
    name: 'Marcus Chen',
    handle: '@marcus_tech',
    niche: 'Công nghệ & Tiện ích',
    avatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCVbDYacTa8Apw4FVb0l5N6kMn6eHHaz4WRpt64SmZW9yGWO3QLjWdLhxkQSfNQW9fApcxhs9hvGFffKrjtH7nfUUPYf8GhYo5P-lVIo1ANfmsU31yNbotBZMQbkQcYZ38DMRaLca2AFC29pOr_EvQCPhYcbz-NyLikBfxCCOLwG9ZkPWjC7noEy05KUh90uGf1oHCp0Efhj1xQgCUm8OqyOGEZ1flhKYHfdkQ6aKUAxQ0hWWck_x3XkuJ7x_97ZgDn2z_ODPcWo_s',
    platform: 'TikTok',
    followers: '450K',
    engagement: '2.8%',
    cpa: '$85',
    active: false,
    tier: 'Mid',
    sparkline: [10, 15, 10, 5, 0, 0, 0],
  },
];

export default function AdminKOLManagement() {
  const [kols, setKols] = useState(INITIAL_KOLS);
  const [search, setSearch] = useState('');
  const [platform, setPlatform] = useState('All');
  const [tier, setTier] = useState('All');
  const [sortBy, setSortBy] = useState('Engagement');
  const [modalOpen, setModalOpen] = useState(false);

  // New Creator Form State
  const [newName, setNewName] = useState('');
  const [newHandle, setNewHandle] = useState('');
  const [newNiche, setNewNiche] = useState('');
  const [newPlatform, setNewPlatform] = useState('Instagram');
  const [newFollowers, setNewFollowers] = useState('');
  const [newEngagement, setNewEngagement] = useState('');
  const [newCPA, setNewCPA] = useState('');

  const toggleActive = (id) => {
    setKols(kols.map(kol => (kol.id === id ? { ...kol, active: !kol.active } : kol)));
  };

  const handleAddCreator = (e) => {
    e.preventDefault();
    if (!newName || !newHandle) return;

    const newCreator = {
      id: kols.length + 1,
      name: newName,
      handle: newHandle.startsWith('@') ? newHandle : `@${newHandle}`,
      niche: newNiche || 'Đời sống',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80',
      platform: newPlatform,
      followers: newFollowers || '10K',
      engagement: newEngagement ? `${newEngagement}%` : '3.5%',
      cpa: newCPA ? `$${newCPA}` : '$25',
      active: true,
      tier: 'Micro',
      sparkline: [20, 30, 25, 45, 35, 55, 60],
    };

    setKols([newCreator, ...kols]);
    setModalOpen(false);

    // Reset Form
    setNewName('');
    setNewHandle('');
    setNewNiche('');
    setNewPlatform('Instagram');
    setNewFollowers('');
    setNewEngagement('');
    setNewCPA('');
  };

  const filteredKols = kols.filter((kol) => {
    const matchesSearch =
      kol.name.toLowerCase().includes(search.toLowerCase()) ||
      kol.handle.toLowerCase().includes(search.toLowerCase()) ||
      kol.niche.toLowerCase().includes(search.toLowerCase());
    const matchesPlatform = platform === 'All' || kol.platform === platform;
    const matchesTier = tier === 'All' || kol.tier === tier;
    return matchesSearch && matchesPlatform && matchesTier;
  });

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="font-display-lg text-display-lg text-primary dark:text-inverse-primary">
            Quản lý KOL/KOC
          </h2>
          <p className="font-body-lg text-body-lg text-on-surface-variant mt-2">
            Quản lý cơ sở dữ liệu nhà sáng tạo và theo dõi hiệu suất.
          </p>
        </div>
        <div className="flex gap-3">
          <button className="px-6 py-3 bg-secondary-container text-primary font-label-sm text-label-sm rounded-full hover:opacity-90 transition-opacity">
            Quản lý Danh mục
          </button>
          <button
            onClick={() => setModalOpen(true)}
            className="px-6 py-3 bg-primary dark:bg-inverse-primary text-on-primary dark:text-on-primary-fixed font-label-sm text-label-sm rounded-full hover:opacity-90 transition-opacity flex items-center gap-2 font-semibold"
          >
            <Plus size={18} /> Thêm Hồ sơ mới
          </button>
        </div>
      </div>

      {/* Filters Toolbar */}
      <div className="bg-surface-container-lowest dark:bg-tertiary-container rounded-3xl p-6 shadow-[4px_24px_rgba(255,143,163,0.08)] border border-surface-container/10">
        <div className="flex flex-wrap gap-4 items-center justify-between">
          <div className="flex flex-wrap gap-4 items-center">
            <span className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider">
              Bộ lọc:
            </span>
            <div className="relative">
              <select
                value={platform}
                onChange={(e) => setPlatform(e.target.value)}
                className="bg-surface-container-low border-none rounded-full font-body-md text-body-md px-4 py-2 pr-8 focus:ring-2 focus:ring-secondary-container dark:text-inverse-primary"
              >
                <option value="All">Nền tảng: Tất cả</option>
                <option value="Instagram">Instagram</option>
                <option value="TikTok">TikTok</option>
              </select>
            </div>
            <div className="relative">
              <select
                value={tier}
                onChange={(e) => setTier(e.target.value)}
                className="bg-surface-container-low border-none rounded-full font-body-md text-body-md px-4 py-2 pr-8 focus:ring-2 focus:ring-secondary-container dark:text-inverse-primary"
              >
                <option value="All">Phân cấp: Tất cả</option>
                <option value="Micro">Micro (10k-50k)</option>
                <option value="Mid">Mid (50k-500k)</option>
              </select>
            </div>
            <div className="relative">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant" size={16} />
                <input
                  type="text"
                  placeholder="Tìm kiếm hồ sơ..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="bg-surface-container-low border-none rounded-full font-body-md text-body-md pl-10 pr-4 py-2 focus:ring-2 focus:ring-secondary-container"
                />
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="font-label-sm text-label-sm text-on-surface-variant">Sắp xếp theo:</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="bg-transparent border-none py-0 pl-1 pr-8 font-body-md text-body-md text-primary dark:text-inverse-primary font-semibold focus:ring-0 outline-none cursor-pointer"
            >
              <option value="Engagement">Tỷ lệ Tương tác</option>
              <option value="Followers">Người theo dõi</option>
              <option value="CPA">CPA Trung bình</option>
            </select>
          </div>
        </div>
      </div>

      {/* Grid List */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {filteredKols.map((kol) => (
          <div
            key={kol.id}
            className={`bg-surface-container-lowest dark:bg-tertiary-container rounded-3xl p-8 shadow-[4px_24px_rgba(255,143,163,0.08)] border border-surface-container/10 flex flex-col gap-6 hover:-translate-y-1 transition-all duration-300 ${
              !kol.active ? 'opacity-70' : ''
            }`}
          >
            <div className="flex justify-between items-start">
              <div className="flex gap-4 items-center">
                <img
                  className="w-16 h-16 rounded-full object-cover shadow-sm border border-surface-container-high/20"
                  alt={kol.name}
                  src={kol.avatar}
                />
                <div>
                  <h3 className="font-headline-md text-headline-md text-primary dark:text-inverse-primary font-bold">
                    {kol.name}
                  </h3>
                  <p className="font-body-md text-body-md text-on-surface-variant">
                    {kol.handle} • {kol.niche}
                  </p>
                </div>
              </div>

              {/* Status Switcher Toggle */}
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={kol.active}
                  onChange={() => toggleActive(kol.id)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-surface-variant dark:bg-surface-container-low peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-secondary-container dark:peer-checked:bg-secondary-container/40"></div>
              </label>
            </div>

            {/* Metrics */}
            <div className="grid grid-cols-3 gap-4 py-4 border-y border-surface-variant/50 dark:border-outline-variant/20">
              <div>
                <p className="font-label-sm text-label-sm text-on-surface-variant uppercase">Theo dõi</p>
                <p className="font-headline-md text-headline-md text-primary dark:text-inverse-primary mt-1">
                  {kol.followers}
                </p>
              </div>
              <div>
                <p className="font-label-sm text-label-sm text-on-surface-variant uppercase">Tương tác</p>
                <p className="font-headline-md text-headline-md text-primary dark:text-inverse-primary mt-1">
                  {kol.engagement}
                </p>
              </div>
              <div>
                <p className="font-label-sm text-label-sm text-on-surface-variant uppercase">CPA TB</p>
                <p className="font-headline-md text-headline-md text-primary dark:text-inverse-primary mt-1">
                  {kol.cpa}
                </p>
              </div>
            </div>

            {/* Booking Analytics Sparkline */}
            <div>
              <p className="font-label-sm text-label-sm text-on-surface-variant uppercase mb-2">
                Phân tích Đặt lịch (30 ngày)
              </p>
              <div className="h-12 w-full bg-surface-container-low dark:bg-surface-variant/20 rounded-lg relative overflow-hidden flex items-end px-1 gap-1">
                {kol.sparkline.map((h, i) => (
                  <div
                    key={i}
                    style={{ height: `${h}%` }}
                    className={`w-full rounded-t-sm transition-all duration-200 ${
                      kol.active ? 'bg-secondary-container dark:bg-secondary-container/80' : 'bg-surface-variant dark:bg-outline-variant/40'
                    }`}
                  ></div>
                ))}
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-3 mt-auto">
              <button
                onClick={() => alert(`Chỉnh sửa hồ sơ của ${kol.name}`)}
                className="flex-1 py-2.5 bg-surface-container-low hover:bg-surface-container-high text-primary dark:text-inverse-primary font-label-sm text-label-sm rounded-full transition-colors flex justify-center items-center gap-1.5 font-bold shadow-sm"
              >
                <Edit2 size={14} /> Chỉnh sửa
              </button>
              <button
                onClick={() => alert(`Quản lý gói dịch vụ của ${kol.name}`)}
                className="flex-1 py-2.5 bg-surface-container-low hover:bg-surface-container-high text-primary dark:text-inverse-primary font-label-sm text-label-sm rounded-full transition-colors flex justify-center items-center gap-1.5 font-bold shadow-sm"
              >
                <CreditCard size={14} /> Gói dịch vụ
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Add New Profile Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-tertiary-container/40 backdrop-blur-sm"
            onClick={() => setModalOpen(false)}
          />
          <div className="relative bg-surface-container-lowest dark:bg-tertiary-container rounded-3xl shadow-2xl max-w-md w-full p-8 overflow-hidden border border-surface-container/20 animate-scale-up">
            <button
              onClick={() => setModalOpen(false)}
              className="absolute top-6 right-6 text-on-surface-variant hover:text-primary dark:hover:text-inverse-primary p-1.5 rounded-full hover:bg-surface-container-high"
            >
              <X size={20} />
            </button>
            <h3 className="text-headline-md font-headline-md text-primary dark:text-inverse-primary mb-6">
              Thêm Hồ sơ Nhà sáng tạo
            </h3>
            <form onSubmit={handleAddCreator} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-on-surface-variant uppercase mb-1">
                  Tên
                </label>
                <input
                  type="text"
                  required
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  className="w-full bg-surface-container-low border-none rounded-full px-4 py-2.5 focus:ring-2 focus:ring-secondary-container"
                  placeholder="Ví dụ: Linh Nguyen"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-on-surface-variant uppercase mb-1">
                  Tên tài khoản (Handle)
                </label>
                <input
                  type="text"
                  required
                  value={newHandle}
                  onChange={(e) => setNewHandle(e.target.value)}
                  className="w-full bg-surface-container-low border-none rounded-full px-4 py-2.5 focus:ring-2 focus:ring-secondary-container"
                  placeholder="Ví dụ: @linh_nguyen"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-on-surface-variant uppercase mb-1">
                    Nền tảng
                  </label>
                  <select
                    value={newPlatform}
                    onChange={(e) => setNewPlatform(e.target.value)}
                    className="w-full bg-surface-container-low border-none rounded-full px-4 py-2.5 focus:ring-2 focus:ring-secondary-container dark:text-inverse-primary"
                  >
                    <option value="Instagram">Instagram</option>
                    <option value="TikTok">TikTok</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-on-surface-variant uppercase mb-1">
                    Danh mục
                  </label>
                  <input
                    type="text"
                    value={newNiche}
                    onChange={(e) => setNewNiche(e.target.value)}
                    className="w-full bg-surface-container-low border-none rounded-full px-4 py-2.5 focus:ring-2 focus:ring-secondary-container"
                    placeholder="Ví dụ: Mỹ phẩm"
                  />
                </div>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-[10px] font-semibold text-on-surface-variant uppercase mb-1">
                    Người theo dõi
                  </label>
                  <input
                    type="text"
                    value={newFollowers}
                    onChange={(e) => setNewFollowers(e.target.value)}
                    className="w-full bg-surface-container-low border-none rounded-full px-3 py-2.5 focus:ring-2 focus:ring-secondary-container text-xs"
                    placeholder="Ví dụ: 85K"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-semibold text-on-surface-variant uppercase mb-1">
                    Tương tác
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    value={newEngagement}
                    onChange={(e) => setNewEngagement(e.target.value)}
                    className="w-full bg-surface-container-low border-none rounded-full px-3 py-2.5 focus:ring-2 focus:ring-secondary-container text-xs"
                    placeholder="Ví dụ: 3.8"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-semibold text-on-surface-variant uppercase mb-1">
                    CPA TB
                  </label>
                  <input
                    type="number"
                    value={newCPA}
                    onChange={(e) => setNewCPA(e.target.value)}
                    className="w-full bg-surface-container-low border-none rounded-full px-3 py-2.5 focus:ring-2 focus:ring-secondary-container text-xs"
                    placeholder="Ví dụ: 35"
                  />
                </div>
              </div>
              <div className="flex justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-6 py-2.5 rounded-full text-label-sm font-label-sm text-primary hover:bg-surface-container transition-colors"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-full bg-primary dark:bg-inverse-primary text-on-primary dark:text-on-primary-fixed font-label-sm text-label-sm hover:opacity-90 hover:shadow-lg transition-all font-bold"
                >
                  Lưu Hồ sơ
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
