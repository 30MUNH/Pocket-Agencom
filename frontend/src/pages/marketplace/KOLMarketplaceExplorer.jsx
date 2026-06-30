import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Search, X, MapPin, Grid, List } from 'lucide-react';
import CreatorCard from '../../components/marketplace/CreatorCard';
import { CREATORS_DATA } from './mockData';

export default function KOLMarketplaceExplorer() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedLocation, setSelectedLocation] = useState('All');
  const [tier, setTier] = useState('All'); // 'All', 'Nano', 'Micro', 'Macro'
  const [sortBy, setSortBy] = useState('Highest Engagement');

  const categories = ['Thời trang & Phong cách sống', 'Làm đẹp & Phong cách sống', 'Công nghệ & Đồ chơi Công nghệ', 'Sức khỏe & Thể hình', 'Công nghệ & Đánh giá'];
  const locations = ['Hà Nội', 'TP. Hồ Chí Minh', 'Los Angeles, CA', 'San Francisco, CA', 'New York, NY'];

  // Active chips count helper
  const activeChips = useMemo(() => {
    const chips = [];
    if (selectedCategory !== 'All') chips.push({ type: 'category', value: selectedCategory });
    if (selectedLocation !== 'All') chips.push({ type: 'location', value: selectedLocation });
    if (tier !== 'All') {
      const tierLabel = tier === 'Nano' ? 'Nano (<100K)' : tier === 'Micro' ? 'Micro (100K-500K)' : 'Macro (500K+)';
      chips.push({ type: 'tier', value: tierLabel });
    }
    if (searchQuery) chips.push({ type: 'search', value: `Tìm kiếm: "${searchQuery}"` });
    return chips;
  }, [selectedCategory, selectedLocation, tier, searchQuery]);

  const clearFilter = (type) => {
    if (type === 'category') setSelectedCategory('All');
    if (type === 'location') setSelectedLocation('All');
    if (type === 'tier') setTier('All');
    if (type === 'search') setSearchQuery('');
  };

  const clearAllFilters = () => {
    setSelectedCategory('All');
    setSelectedLocation('All');
    setTier('All');
    setSearchQuery('');
  };

  const processedCreators = useMemo(() => {
    let result = [...CREATORS_DATA];

    // Search filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (c) =>
          c.name.toLowerCase().includes(q) ||
          c.category.toLowerCase().includes(q) ||
          c.location.toLowerCase().includes(q) ||
          c.handle.toLowerCase().includes(q)
      );
    }

    // Category filter
    if (selectedCategory !== 'All') {
      result = result.filter((c) => c.category === selectedCategory);
    }

    // Location filter
    if (selectedLocation !== 'All') {
      result = result.filter((c) => c.location === selectedLocation);
    }

    // Tier filter (followers based)
    if (tier === 'Nano') {
      result = result.filter((c) => c.followers < 100000); // <100K
    } else if (tier === 'Micro') {
      result = result.filter((c) => c.followers >= 100000 && c.followers <= 500000); // 100K-500K
    } else if (tier === 'Macro') {
      result = result.filter((c) => c.followers > 500000); // >500K
    }

    // Sorting
    if (sortBy === 'Highest Engagement' || sortBy === 'Tương tác cao nhất') {
      result.sort((a, b) => b.engagement - a.engagement);
    } else if (sortBy === 'Lowest Price' || sortBy === 'Giá thấp nhất') {
      result.sort((a, b) => a.startingPrice - b.startingPrice);
    } else if (sortBy === 'Most Followers' || sortBy === 'Nhiều theo dõi nhất') {
      result.sort((a, b) => b.followers - a.followers);
    }

    return result;
  }, [searchQuery, selectedCategory, selectedLocation, tier, sortBy]);

  return (
    <div className="space-y-8">
      {/* Navigation Tabs */}
      <div className="flex border-b border-surface-variant/40 gap-6">
        <Link
          to="/marketplace"
          className="text-on-surface-variant hover:text-primary font-medium text-sm pb-3 transition-colors"
        >
          Bản tin Tiêu chuẩn
        </Link>
        <Link
          to="/marketplace/explorer"
          className="border-b-2 border-primary dark:border-inverse-primary font-bold text-sm pb-3 text-primary dark:text-inverse-primary"
        >
          Bộ lọc Nâng cao
        </Link>
      </div>

      {/* Search Hero banner */}
      <div className="bg-surface-container-lowest dark:bg-tertiary-container rounded-[2rem] p-8 md:p-12 shadow-[4px_24px_40px_rgba(255,143,163,0.08)] flex flex-col items-center justify-center text-center border border-surface-container/20 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-tr from-secondary-container/10 via-transparent to-primary-container/10"></div>
        <h2 className="text-display-lg-mobile md:text-display-lg font-bold text-primary dark:text-inverse-primary mb-2 relative z-10">
          Tìm kiếm Tiếng nói Hoàn hảo
        </h2>
        <p className="text-body-lg text-on-surface-variant mb-8 max-w-2xl relative z-10">
          Khám phá các nhà sáng tạo hàng đầu được thiết kế riêng để thúc đẩy tăng trưởng thương hiệu SME của bạn.
        </p>
        <div className="w-full max-w-2xl relative z-10">
          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant flex items-center">
            <Search size={20} />
          </span>
          <input
            className="w-full pl-12 pr-4 py-4 rounded-full bg-surface-container dark:bg-surface-variant/20 text-on-surface font-body-md border-none focus:ring-2 focus:ring-secondary focus:bg-surface-container-lowest transition-all shadow-inner outline-none"
            placeholder="Tìm kiếm theo tên, lĩnh vực, nền tảng hoặc vị trí..."
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {/* Main split: Sidebar and grid */}
      <div className="flex flex-col lg:flex-row gap-gutter">
        {/* Filters Sidebar */}
        <aside className="w-full lg:w-64 shrink-0 flex flex-col gap-6">
          <div className="bg-surface-container-lowest dark:bg-tertiary-container rounded-[2rem] p-6 shadow-[4px_24px_40px_rgba(255,143,163,0.08)] border border-surface-container/20">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-[11px] font-bold text-primary dark:text-inverse-primary uppercase tracking-widest">
                Bộ lọc
              </h3>
              {activeChips.length > 0 && (
                <button
                  onClick={clearAllFilters}
                  className="text-on-surface-variant hover:text-primary transition-colors text-xs font-semibold"
                >
                  Xóa tất cả
                </button>
              )}
            </div>

            {/* Active Chips */}
            {activeChips.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-6">
                {activeChips.map((chip) => (
                  <span
                    key={chip.type}
                    className="inline-flex items-center gap-1 px-3 py-1 bg-secondary-container/60 text-on-secondary-container dark:bg-on-secondary-fixed-variant dark:text-secondary-fixed rounded-full text-xs font-bold"
                  >
                    {chip.value}
                    <button onClick={() => clearFilter(chip.type)}>
                      <X size={12} className="cursor-pointer" />
                    </button>
                  </span>
                ))}
              </div>
            )}

            <div className="space-y-6">
              {/* Category Filter */}
              <div>
                <h4 className="text-xs font-bold text-primary dark:text-inverse-primary mb-3">Danh mục</h4>
                <div className="space-y-2.5">
                  <label className="flex items-center gap-2 cursor-pointer group">
                    <input
                      type="radio"
                      name="explorer-category"
                      checked={selectedCategory === 'All'}
                      onChange={() => setSelectedCategory('All')}
                      className="text-primary focus:ring-secondary-container w-4 h-4 cursor-pointer"
                    />
                    <span className="text-xs text-on-surface-variant group-hover:text-primary transition-colors">
                      Tất cả lĩnh vực
                    </span>
                  </label>
                  {categories.map((category) => (
                    <label key={category} className="flex items-center gap-2 cursor-pointer group">
                      <input
                        type="radio"
                        name="explorer-category"
                        checked={selectedCategory === category}
                        onChange={() => setSelectedCategory(category)}
                        className="text-primary focus:ring-secondary-container w-4 h-4 cursor-pointer"
                      />
                      <span className="text-xs text-on-surface-variant group-hover:text-primary transition-colors">
                        {category}
                      </span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Location Filter */}
              <div>
                <h4 className="text-xs font-bold text-primary dark:text-inverse-primary mb-3">Vị trí</h4>
                <div className="space-y-2.5">
                  <label className="flex items-center gap-2 cursor-pointer group">
                    <input
                      type="radio"
                      name="explorer-location"
                      checked={selectedLocation === 'All'}
                      onChange={() => setSelectedLocation('All')}
                      className="text-primary focus:ring-secondary-container w-4 h-4 cursor-pointer"
                    />
                    <span className="text-xs text-on-surface-variant group-hover:text-primary transition-colors">
                      Tất cả thành phố
                    </span>
                  </label>
                  {locations.map((loc) => (
                    <label key={loc} className="flex items-center gap-2 cursor-pointer group">
                      <input
                        type="radio"
                        name="explorer-location"
                        checked={selectedLocation === loc}
                        onChange={() => setSelectedLocation(loc)}
                        className="text-primary focus:ring-secondary-container w-4 h-4 cursor-pointer"
                      />
                      <span className="text-xs text-on-surface-variant group-hover:text-primary transition-colors">
                        {loc}
                      </span>
                    </label>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </aside>

        {/* Content list & sort */}
        <div className="flex-1 space-y-6">
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4 bg-surface-container-lowest dark:bg-tertiary-container p-4 rounded-3xl border border-surface-container/20 shadow-sm">
            {/* Size Tabs */}
            <div className="flex gap-1 overflow-x-auto w-full sm:w-auto pb-2 sm:pb-0 scrollbar-none">
              {['All', 'Nano', 'Micro', 'Macro'].map((t) => (
                <button
                  key={t}
                  onClick={() => setTier(t)}
                  className={`px-4 py-2 rounded-full text-xs font-bold whitespace-nowrap transition-all ${
                    tier === t
                      ? 'bg-secondary-container text-on-secondary-container dark:bg-on-secondary-fixed-variant dark:text-secondary-fixed'
                      : 'bg-transparent text-on-surface-variant hover:bg-surface-container'
                  }`}
                >
                  {t === 'All' ? 'Tất cả các nhóm' : t === 'Nano' ? 'Nano (<100K)' : t === 'Micro' ? 'Micro (100K-500K)' : 'Macro (500K+)'}
                </button>
              ))}
            </div>

            {/* Sort Select */}
            <div className="flex items-center gap-2 w-full sm:w-auto shrink-0 justify-end">
              <span className="text-xs text-on-surface-variant whitespace-nowrap">Sắp xếp theo:</span>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="bg-surface-container dark:bg-surface-variant/20 border-none rounded-full py-2 pl-4 pr-10 text-xs font-bold text-primary dark:text-inverse-primary focus:ring-2 focus:ring-secondary outline-none cursor-pointer"
              >
                <option>Tương tác cao nhất</option>
                <option>Giá thấp nhất</option>
                <option>Nhiều theo dõi nhất</option>
              </select>
            </div>
          </div>

          {/* Explorer Grids */}
          {processedCreators.length === 0 ? (
            <div className="text-center p-12 bg-surface-container-lowest dark:bg-tertiary-container rounded-3xl border border-surface-container/20">
              <p className="text-on-surface-variant text-sm font-medium">
                Không tìm thấy nhà sáng tạo nào phù hợp với tìm kiếm hoặc bộ lọc của bạn.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {processedCreators.map((creator) => (
                <CreatorCard key={creator.id} creator={creator} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
