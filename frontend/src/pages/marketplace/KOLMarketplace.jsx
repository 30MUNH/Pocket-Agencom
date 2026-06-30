import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Grid, List, SlidersHorizontal, Loader2 } from 'lucide-react';
import CreatorCard from '../../components/marketplace/CreatorCard';
import { useKols, mapKolToCreator } from '../../hooks/useKols';

export default function KOLMarketplace() {
  const [selectedCategories, setSelectedCategories] = useState([]);
  const [selectedPlatform, setSelectedPlatform] = useState('All');
  const [maxPrice, setMaxPrice] = useState(50000000);
  const [viewMode, setViewMode] = useState('grid');

  const { data, isLoading, error } = useKols({ limit: 50 });
  const creators = (data?.data || []).map(mapKolToCreator);

  const categories = [
    'Thời trang & Lối sống',
    'Công nghệ & Đồ chơi số',
    'Mỹ phẩm & Làm đẹp',
    'Ẩm thực & Du lịch',
    'Giáo dục & Phát triển bản thân',
    'Sức khỏe & Thể thao',
  ];

  const handleCategoryChange = (category) => {
    setSelectedCategories((prev) =>
      prev.includes(category) ? prev.filter((c) => c !== category) : [...prev, category]
    );
  };

  const filteredCreators = creators.filter((creator) => {
    const matchesCategory =
      selectedCategories.length === 0 || selectedCategories.includes(creator.category);
    const matchesPlatform =
      selectedPlatform === 'All' || creator.platforms.includes(selectedPlatform);
    const matchesPrice = creator.startingPrice <= maxPrice;
    return matchesCategory && matchesPlatform && matchesPrice;
  });

  return (
    <div className="space-y-8">
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
          <button onClick={() => setViewMode('grid')} className={`p-2 rounded-full transition-colors ${viewMode === 'grid' ? 'bg-secondary-container text-on-secondary-container shadow-sm' : 'text-on-surface-variant hover:bg-surface-container'}`}>
            <Grid size={18} />
          </button>
          <button onClick={() => setViewMode('list')} className={`p-2 rounded-full transition-colors ${viewMode === 'list' ? 'bg-secondary-container text-on-secondary-container shadow-sm' : 'text-on-surface-variant hover:bg-surface-container'}`}>
            <List size={18} />
          </button>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-gutter">
        <aside className="lg:w-72 shrink-0 space-y-6">
          <div className="bg-surface-container-lowest dark:bg-tertiary-container rounded-[2rem] p-6 border border-surface-variant/30">
            <div className="flex items-center gap-2 mb-4">
              <SlidersHorizontal size={16} className="text-primary" />
              <h3 className="font-bold text-primary text-sm">Bộ lọc</h3>
            </div>
            <div className="space-y-4">
              <div>
                <p className="text-xs font-bold text-on-surface-variant uppercase mb-2">Danh mục</p>
                {categories.map((cat) => (
                  <label key={cat} className="flex items-center gap-2 py-1 cursor-pointer">
                    <input type="checkbox" checked={selectedCategories.includes(cat)} onChange={() => handleCategoryChange(cat)} className="rounded border-outline" />
                    <span className="text-sm text-on-surface">{cat}</span>
                  </label>
                ))}
              </div>
              <div>
                <p className="text-xs font-bold text-on-surface-variant uppercase mb-2">Nền tảng</p>
                {['All', 'IG', 'TT', 'YT'].map((p) => (
                  <label key={p} className="flex items-center gap-2 py-1 cursor-pointer">
                    <input type="radio" name="platform" checked={selectedPlatform === p} onChange={() => setSelectedPlatform(p)} />
                    <span className="text-sm">{p === 'All' ? 'Tất cả' : p}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>
        </aside>

        <div className="flex-1">
          {isLoading && (
            <div className="flex items-center justify-center py-20 text-on-surface-variant gap-2">
              <Loader2 className="animate-spin" size={24} />
              Đang tải KOL...
            </div>
          )}
          {error && (
            <div className="text-center py-20 text-error">Không thể tải danh sách KOL: {error.message}</div>
          )}
          {!isLoading && !error && (
            <div className={viewMode === 'grid' ? 'grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6' : 'space-y-4'}>
              {filteredCreators.map((creator) => (
                <CreatorCard key={creator.id} creator={creator} viewMode={viewMode} />
              ))}
              {filteredCreators.length === 0 && (
                <p className="col-span-full text-center py-12 text-on-surface-variant">Không tìm thấy KOL phù hợp.</p>
              )}
            </div>
          )}
        </div>
      </div>

      <div className="text-center">
        <Link to="/marketplace/explorer" className="text-primary font-bold hover:underline text-sm">
          Xem chế độ Explorer →
        </Link>
      </div>
    </div>
  );
}
