import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Upload, Loader2 } from 'lucide-react';
import { useKol, mapKolToCreator } from '../../hooks/useKols';
import { useCreateBooking } from '../../hooks/useBookings';
import { toast } from '../../store/toastStore';
import CampaignBookingCard from '../../components/marketplace/CampaignBookingCard';

export default function BookCampaignPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { data: kolData, isLoading } = useKol(id);
  const creator = mapKolToCreator(kolData);
  const createBooking = useCreateBooking();

  const [campaignName, setCampaignName] = useState('');
  const [campaignGoal, setCampaignGoal] = useState('Brand Awareness');
  const [productName, setProductName] = useState('');
  const [productCategory, setProductCategory] = useState('Beauty & Skincare');
  const [productDesc, setProductDesc] = useState('');
  const [targetCustomer, setTargetCustomer] = useState('');
  const [platform, setPlatform] = useState('TikTok');
  const [targetDate, setTargetDate] = useState('');
  const [dosDonts, setDosDonts] = useState('');
  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [referenceLinks, setReferenceLinks] = useState('');
  const [budget, setBudget] = useState(0);
  const [packageId, setPackageId] = useState(null);

  useEffect(() => {
    if (creator?.servicePackages?.length) {
      const pkg = creator.servicePackages[0];
      setPackageId(pkg.id);
      setBudget(Number(pkg.price));
    } else if (creator?.startingPrice) {
      setBudget(creator.startingPrice);
    }
  }, [creator]);

  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    if (!campaignName || !productName) {
      toast.error('Vui lòng điền đầy đủ các trường bắt buộc có dấu *');
      return;
    }
    if (!packageId) {
      toast.error('Không tìm thấy gói dịch vụ cho KOL này');
      return;
    }

    try {
      const booking = await createBooking.mutateAsync({
        kolId: Number(id),
        packageId,
        campaignName,
        campaignGoal,
        productName,
        productDescription: productDesc,
        productCategory,
        targetCustomer,
        campaignPlatform: platform,
        campaignDate: targetDate || undefined,
        budget,
        doAndDontNotes: dosDonts,
        deliveryAddress,
        referenceLink: referenceLinks || undefined,
      });
      toast.success('Đặt lịch chiến dịch thành công!');
      navigate(`/bookings/confirmation?bookingId=${booking.id}`);
    } catch (err) {
      toast.error(err.message || 'Không thể gửi yêu cầu đặt lịch');
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20 gap-2 text-on-surface-variant">
        <Loader2 className="animate-spin" size={24} />
        Đang tải thông tin KOL...
      </div>
    );
  }

  if (!creator) {
    return (
      <div className="text-center py-20">
        <p className="text-on-surface-variant mb-4">Không tìm thấy KOL.</p>
        <Link to="/marketplace" className="text-primary font-bold">Quay lại Chợ KOL</Link>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center gap-4">
        <Link to={`/marketplace/kol/${id}`} className="p-2 bg-surface-container-low hover:bg-surface-container-high rounded-full text-on-surface transition-colors inline-flex">
          <ArrowLeft size={16} />
        </Link>
        <div>
          <h1 className="text-display-lg-mobile md:text-display-lg font-bold text-primary dark:text-inverse-primary leading-tight">
            Đặt lịch Chiến dịch
          </h1>
          <p className="text-on-surface-variant font-body-md text-sm mt-1">
            Hoàn tất các chi tiết cho chiến dịch hợp tác của bạn với {creator.name}.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-gutter">
        <form onSubmit={handleSubmit} className="lg:col-span-8 space-y-8">
          <section className="bg-surface-container-lowest dark:bg-tertiary-container rounded-[2rem] p-8 shadow-[4px_24px_40px_rgba(255,143,163,0.08)] border border-surface-variant/50">
            <h2 className="font-headline-md text-base text-primary dark:text-inverse-primary font-bold mb-6">Tổng quan Chiến dịch</h2>
            <div className="space-y-6">
              <div>
                <label className="block font-label-sm text-xs text-on-surface mb-2 font-semibold">Tên Chiến dịch *</label>
                <input className="w-full bg-surface-container dark:bg-surface-variant/20 border-none rounded-xl px-4 py-3 text-body-md focus:ring-2 focus:ring-secondary" required value={campaignName} onChange={(e) => setCampaignName(e.target.value)} placeholder="Ra mắt Sản phẩm Mùa hè 2026" />
              </div>
              <div>
                <label className="block font-label-sm text-xs text-on-surface mb-2 font-semibold">Gói dịch vụ *</label>
                <select className="w-full bg-surface-container border-none rounded-xl px-4 py-3" value={packageId || ''} onChange={(e) => { const pid = Number(e.target.value); setPackageId(pid); const pkg = creator.servicePackages.find((p) => p.id === pid); if (pkg) setBudget(Number(pkg.price)); }}>
                  {creator.servicePackages.map((pkg) => (
                    <option key={pkg.id} value={pkg.id}>{pkg.packageName} — {Number(pkg.price).toLocaleString()} VNĐ</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block font-label-sm text-xs text-on-surface mb-2 font-semibold">Mục tiêu Chính</label>
                <select className="w-full bg-surface-container border-none rounded-xl px-4 py-3" value={campaignGoal} onChange={(e) => setCampaignGoal(e.target.value)}>
                  <option value="Brand Awareness">Nhận diện Thương hiệu</option>
                  <option value="Lead Generation">Thu hút Khách hàng Tiềm năng</option>
                  <option value="Sales Conversion">Chuyển đổi Doanh số</option>
                  <option value="Product Launch">Ra mắt Sản phẩm</option>
                </select>
              </div>
            </div>
          </section>

          <section className="bg-surface-container-lowest dark:bg-tertiary-container rounded-[2rem] p-8 border border-surface-variant/50">
            <h2 className="font-bold text-primary mb-6">Thông tin Sản phẩm</h2>
            <div className="space-y-4">
              <input className="w-full bg-surface-container border-none rounded-xl px-4 py-3" required placeholder="Tên sản phẩm *" value={productName} onChange={(e) => setProductName(e.target.value)} />
              <input className="w-full bg-surface-container border-none rounded-xl px-4 py-3" placeholder="Danh mục" value={productCategory} onChange={(e) => setProductCategory(e.target.value)} />
              <textarea className="w-full bg-surface-container border-none rounded-xl px-4 py-3 resize-none" rows={3} placeholder="Mô tả sản phẩm" value={productDesc} onChange={(e) => setProductDesc(e.target.value)} />
              <input className="w-full bg-surface-container border-none rounded-xl px-4 py-3" placeholder="Khách hàng mục tiêu" value={targetCustomer} onChange={(e) => setTargetCustomer(e.target.value)} />
            </div>
          </section>

          <section className="bg-surface-container-lowest dark:bg-tertiary-container rounded-[2rem] p-8 border border-surface-variant/50">
            <h2 className="font-bold text-primary mb-6">Hậu cần</h2>
            <div className="space-y-4">
              <select className="w-full bg-surface-container border-none rounded-xl px-4 py-3" value={platform} onChange={(e) => setPlatform(e.target.value)}>
                <option value="TikTok">TikTok</option>
                <option value="Instagram">Instagram</option>
              </select>
              <input type="date" className="w-full bg-surface-container border-none rounded-xl px-4 py-3" value={targetDate} onChange={(e) => setTargetDate(e.target.value)} />
              <textarea className="w-full bg-surface-container border-none rounded-xl px-4 py-3 resize-none" rows={3} placeholder="Nên và Không nên làm" value={dosDonts} onChange={(e) => setDosDonts(e.target.value)} />
              <textarea className="w-full bg-surface-container border-none rounded-xl px-4 py-3 resize-none" rows={2} placeholder="Địa chỉ gửi sản phẩm mẫu" value={deliveryAddress} onChange={(e) => setDeliveryAddress(e.target.value)} />
              <input type="url" className="w-full bg-surface-container border-none rounded-xl px-4 py-3" placeholder="Liên kết tham chiếu" value={referenceLinks} onChange={(e) => setReferenceLinks(e.target.value)} />
              <div className="border-2 border-dashed border-outline-variant rounded-2xl p-8 text-center cursor-pointer">
                <Upload size={32} className="mx-auto text-on-surface-variant mb-2" />
                <p className="text-xs text-on-surface-variant">Tải lên tài nguyên thương hiệu (JPG, PNG, PDF)</p>
              </div>
            </div>
          </section>
        </form>

        <div className="lg:col-span-4">
          <CampaignBookingCard creator={creator} budget={budget} onBudgetChange={setBudget} onSubmit={handleSubmit} isSubmitting={createBooking.isPending} />
        </div>
      </div>
    </div>
  );
}
