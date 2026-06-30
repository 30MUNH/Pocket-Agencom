import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Grid, List, SlidersHorizontal } from 'lucide-react';
import CreatorCard from '../../components/marketplace/CreatorCard';
import { CREATORS_DATA } from './mockData';

export default function KOLMarketplace() {
  const [selectedCategories, setSelectedCategories] = useState([]);
  const [selectedPlatform, setSelectedPlatform] = useState('All');
  const [maxPrice, setMaxPrice] = useState(1200);
  const [viewMode, setViewMode] = useState('grid'); // 'grid' or 'list'

  const categories = [
    'Làm đẹp & Phong cách sống',
    'Công nghệ & Đồ chơi Công nghệ',
    'Sức khỏe & Thể hình',
    'Thời trang & Phong cách sống',
    'Công nghệ & Đánh giá',
  ];

  const handleCategoryChange = (category) => {
    if (selectedCategories.includes(category)) {
      setSelectedCategories(selectedCategories.filter((c) => c !== category));
    } else {
      setSelectedCategories([...selectedCategories, category]);
    }
  };

  const filteredCreators = CREATORS_DATA.filter((creator) => {
    // Category check
    const matchesCategory =
      selectedCategories.length === 0 || selectedCategories.includes(creator.category);

    // Platform check
    const matchesPlatform =
      selectedPlatform === 'All' || creator.platforms.includes(selectedPlatform);

    // Price check
    const matchesPrice = creator.startingPrice <= maxPrice;

    return matchesCategory && matchesPlatform && matchesPrice;
  });

  return (
    <div className="space-y-8">
      {/* Title block */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
        <div>
          <h1 className="text-display-lg-mobile md:text-display-lg font-bold text-primary dark:text-inverse-primary leading-tight">
            Khám phá KOL/KOC
          </h1>
          <p className="text-on-surface-variant font-body-md text-sm mt-2">
            Tìm mảnh ghép hoàn hảo cho chiến dịch tiếp thị tiếp theo của bạn.
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setViewMode('grid')}
            className={`p-2 rounded-full transition-colors ${
              viewMode === 'grid'
                ? 'bg-secondary-container text-on-secondary-container shadow-sm'
                : 'text-on-surface-variant hover:bg-surface-container'
            }`}
          >
            <Grid size={18} />
          </button>
          <button
            onClick={() => setViewMode('list')}
            className={`p-2 rounded-full transition-colors ${
              viewMode === 'list'
                ? 'bg-secondary-container text-on-secondary-container shadow-sm'
                : 'text-on-surface-variant hover:bg-surface-container'
            }`}
          >
            <List size={18} />
          </button>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex border-b border-surface-variant/40 gap-6">
        <Link
          to="/marketplace"
          className="border-b-2 border-primary dark:border-inverse-primary font-bold text-sm pb-3 text-primary dark:text-inverse-primary"
        >
          Bản tin Tiêu chuẩn
        </Link>
        <Link
          to="/marketplace/explorer"
          className="text-on-surface-variant hover:text-primary font-medium text-sm pb-3 transition-colors"
        >
          Bộ lọc Nâng cao
        </Link>
      </div>

      {/* Main Split Layout */}
      <div className="flex flex-col lg:flex-row gap-gutter">
        {/* Left Side: Filters Column */}
        <aside className="w-full lg:w-64 shrink-0 space-y-6">
          <div className="bg-surface-container-lowest dark:bg-tertiary-container p-6 rounded-[2rem] shadow-[4px_24px_40px_rgba(255,143,163,0.08)] border border-surface-container/20">
            <h3 className="text-[11px] font-bold text-on-surface-variant mb-6 uppercase tracking-wider flex items-center gap-2">
              <SlidersHorizontal size={14} /> Bộ lọc
            </h3>
            
            <div className="space-y-6">
              {/* Category Filter */}
              <div>
                <label className="text-xs font-bold mb-3 block text-on-surface">Danh mục</label>
                <div className="space-y-2.5">
                  {categories.map((category) => (
                    <label key={category} className="flex items-center gap-3 cursor-pointer group">
                      <input
                        type="checkbox"
                        checked={selectedCategories.includes(category)}
                        onChange={() => handleCategoryChange(category)}
                        className="rounded border-outline-variant bg-surface-container text-primary focus:ring-secondary-container w-4 h-4 cursor-pointer"
                      />
                      <span className="text-xs text-on-surface-variant group-hover:text-primary transition-colors">
                        {category}
                      </span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Platform Filter */}
              <div>
                <label className="text-xs font-bold mb-3 block text-on-surface">Nền tảng</label>
                <div className="flex flex-wrap gap-2">
                  {['All', 'TT', 'IG', 'YT'].map((plat) => (
                    <button
                      key={plat}
                      onClick={() => setSelectedPlatform(plat)}
                      className={`px-3 py-1.5 rounded-full text-[11px] font-bold transition-all border ${
                        selectedPlatform === plat
                          ? 'bg-secondary-container text-on-secondary-container border-transparent'
                          : 'bg-surface-container dark:bg-surface-variant/20 text-on-surface-variant border-transparent hover:bg-surface-container-high'
                      }`}
                    >
                      {plat === 'All' ? 'Tất cả' : plat === 'TT' ? 'TikTok' : plat === 'IG' ? 'Instagram' : 'YouTube'}
                    </button>
                  ))}
                </div>
              </div>

              {/* Price Filter */}
              <div>
                <div className="flex justify-between text-xs font-bold text-on-surface mb-3">
                  <span>Giới hạn Giá</span>
                  <span className="text-primary dark:text-inverse-primary">${maxPrice}</span>
                </div>
                <input
                  type="range"
                  min="150"
                  max="1200"
                  step="50"
                  value={maxPrice}
                  onChange={(e) => setMaxPrice(Number(e.target.value))}
                  className="w-full accent-primary cursor-pointer"
                />
                <div className="flex justify-between text-[10px] text-on-surface-variant mt-2">
                  <span>$150</span>
                  <span>$1200+</span>
                </div>
              </div>
            </div>
          </div>
        </aside>

        {/* Right Side: Creator Grid */}
        <div className="flex-1">
          {filteredCreators.length === 0 ? (
            <div className="text-center p-12 bg-surface-container-lowest dark:bg-tertiary-container rounded-3xl border border-surface-container/20">
              <p className="text-on-surface-variant text-sm font-medium">
                Không tìm thấy nhà sáng tạo nào phù hợp với bộ lọc đã chọn. Hãy thử mở rộng tiêu chí của bạn.
              </p>
            </div>
          ) : (
            <div
              className={
                viewMode === 'grid'
                  ? 'grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6'
                  : 'flex flex-col gap-4'
              }
            >
              {filteredCreators.map((creator) => (
                <CreatorCard key={creator.id} creator={creator} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
