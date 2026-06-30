import { useState } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import {
  ArrowLeft,
  Check,
  RotateCw,
  Flag,
  FileText,
  Play,
  Camera,
  CloudUpload,
  Upload,
  Tv,
  XCircle,
  CheckCircle,
} from 'lucide-react';

export default function BookingDetailPage() {
  const navigate = useNavigate();
  const { id } = useParams();

  // Mock states
  const [fulfillmentStep, setFulfillmentStep] = useState(3); // 1: Pending, 2: Reviewing, 3: In Progress, 4: Completed
  const [uploadedFile, setUploadedFile] = useState(null);
  const [isDragOver, setIsDragOver] = useState(false);

  const handleCancelBooking = () => {
    if (window.confirm('Bạn có chắc chắn muốn hủy đơn đặt này không?')) {
      alert('Đã gửi yêu cầu hủy đơn đặt.');
      navigate('/bookings');
    }
  };

  const handleMarkCompleted = () => {
    setFulfillmentStep(4);
    alert('Đã đánh dấu đơn đặt là hoàn thành.');
  };

  const handleFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      setUploadedFile(file.name);
      if (fulfillmentStep === 3) {
        setFulfillmentStep(4); // Move step forward
      }
    }
  };

  const simulateDrop = (e) => {
    e.preventDefault();
    setIsDragOver(false);
    setUploadedFile('campaign_proof_draft_v1.mp4');
    if (fulfillmentStep === 3) {
      setFulfillmentStep(4);
    }
  };

  return (
    <div className="bg-background text-on-background font-body-md min-h-screen flex flex-col selection:bg-secondary-container selection:text-on-secondary-container">
      {/* Dedicated Focused Top Bar Header */}
      <header className="fixed top-0 left-0 right-0 h-20 bg-surface/90 dark:bg-tertiary-container/90 backdrop-blur-xl flex justify-between items-center px-8 z-50 shadow-sm border-b border-surface-container-high dark:border-outline/20">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate('/bookings')}
            className="p-2 rounded-full hover:bg-surface-container-high dark:hover:bg-outline/20 transition-colors text-on-surface dark:text-inverse-primary"
            aria-label="Go Back"
          >
            <ArrowLeft size={20} />
          </button>
          <h1 className="font-headline-md text-headline-md font-bold text-primary dark:text-inverse-primary">
            Đơn đặt #{id || 'BK-84729'}
          </h1>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleCancelBooking}
            className="px-6 py-2.5 rounded-full bg-secondary-container text-on-secondary-container dark:bg-outline/20 dark:text-inverse-primary font-label-sm text-label-sm hover:opacity-90 transition-opacity"
          >
            Hủy Đơn đặt
          </button>
          <button
            onClick={handleMarkCompleted}
            className="px-6 py-2.5 rounded-full bg-primary text-on-primary font-label-sm text-label-sm hover:bg-primary/95 transition-colors shadow-md font-bold"
          >
            Đánh dấu Hoàn thành
          </button>
        </div>
      </header>

      {/* Main Container Canvas */}
      <main className="flex-1 mt-24 p-6 md:p-12 max-w-container-max mx-auto w-full relative z-10 space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-gutter">
          {/* Left Column: Primary Details (8 spans) */}
          <div className="lg:col-span-8 flex flex-col gap-6">
            
            {/* Status Tracker Stepper */}
            <section className="bg-surface-container-lowest dark:bg-tertiary-container rounded-[2rem] p-8 shadow-[0_4px_24px_rgba(255,143,163,0.08)] border border-surface-variant/50">
              <h2 className="font-label-sm text-label-sm text-on-surface-variant uppercase mb-8 tracking-wider font-semibold">
                Trạng thái Thực hiện
              </h2>

              <div className="relative flex justify-between items-center w-full px-2">
                {/* Connecting Line Background */}
                <div className="absolute left-0 right-0 top-1/2 -translate-y-1/2 h-[2px] bg-surface-container-highest dark:bg-outline/20 z-0" />
                {/* Connecting Line Progress */}
                <div
                  className="absolute left-0 top-1/2 -translate-y-1/2 h-[2px] bg-secondary dark:bg-secondary-fixed z-0 transition-all duration-500"
                  style={{
                    width: `${
                      fulfillmentStep === 1
                        ? '0%'
                        : fulfillmentStep === 2
                        ? '33%'
                        : fulfillmentStep === 3
                        ? '66%'
                        : '100%'
                    }`,
                  }}
                />

                {/* Step 1: Pending */}
                <div className="relative z-10 flex flex-col items-center gap-2">
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center border-4 border-surface dark:border-tertiary-container shadow-sm ${
                      fulfillmentStep >= 1
                        ? 'bg-secondary-container text-secondary'
                        : 'bg-surface-container-highest text-on-surface-variant'
                    }`}
                  >
                    <Check size={14} className="stroke-[3]" />
                  </div>
                  <span className="font-label-sm text-[12px] text-on-surface dark:text-inverse-primary">Chờ duyệt</span>
                </div>

                {/* Step 2: Reviewing */}
                <div className="relative z-10 flex flex-col items-center gap-2">
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center border-4 border-surface dark:border-tertiary-container shadow-sm ${
                      fulfillmentStep >= 2
                        ? 'bg-secondary-container text-secondary'
                        : 'bg-surface-container-highest text-on-surface-variant'
                    }`}
                  >
                    {fulfillmentStep > 2 ? (
                      <Check size={14} className="stroke-[3]" />
                    ) : (
                      <span className="text-[11px] font-bold">2</span>
                    )}
                  </div>
                  <span className="font-label-sm text-[12px] text-on-surface dark:text-inverse-primary">Đang đánh giá</span>
                </div>

                {/* Step 3: In Progress */}
                <div className="relative z-10 flex flex-col items-center gap-2">
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center border-4 border-surface dark:border-tertiary-container shadow-sm ${
                      fulfillmentStep === 3
                        ? 'bg-primary text-on-primary scale-110 shadow-md'
                        : fulfillmentStep > 3
                        ? 'bg-secondary-container text-secondary'
                        : 'bg-surface-container-highest text-on-surface-variant'
                    }`}
                  >
                    {fulfillmentStep === 3 ? (
                      <RotateCw size={12} className="animate-spin" />
                    ) : fulfillmentStep > 3 ? (
                      <Check size={14} className="stroke-[3]" />
                    ) : (
                      <span className="text-[11px] font-bold">3</span>
                    )}
                  </div>
                  <span
                    className={`font-label-sm text-[12px] ${
                      fulfillmentStep === 3 ? 'text-primary font-bold dark:text-inverse-primary' : 'text-on-surface-variant'
                    }`}
                  >
                    Đang thực hiện
                  </span>
                </div>

                {/* Step 4: Completed */}
                <div className="relative z-10 flex flex-col items-center gap-2">
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center border-4 border-surface dark:border-tertiary-container shadow-sm ${
                      fulfillmentStep === 4
                        ? 'bg-primary text-on-primary scale-110 shadow-md'
                        : 'bg-surface-container-highest text-on-surface-variant'
                    }`}
                  >
                    <Flag size={12} />
                  </div>
                  <span
                    className={`font-label-sm text-[12px] ${
                      fulfillmentStep === 4 ? 'text-primary font-bold dark:text-inverse-primary' : 'text-on-surface-variant'
                    }`}
                  >
                    Đã hoàn thành
                  </span>
                </div>
              </div>
            </section>

            {/* Campaign Brief */}
            <section className="bg-surface-container-lowest dark:bg-tertiary-container rounded-[2rem] p-8 shadow-[0_4px_24px_rgba(255,143,163,0.08)] border border-surface-variant/50 space-y-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-surface-container dark:bg-surface-variant/35 flex items-center justify-center text-primary dark:text-inverse-primary">
                  <FileText size={20} />
                </div>
                <h2 className="font-headline-md text-primary dark:text-inverse-primary font-bold">Thông tin Chiến dịch</h2>
              </div>

              <div className="space-y-6">
                <div>
                  <h3 className="font-label-sm text-xs text-on-surface-variant dark:text-outline-variant uppercase tracking-wider mb-2 font-semibold">
                    Mục tiêu Chiến dịch
                  </h3>
                  <p className="font-body-md text-on-surface dark:text-inverse-on-surface bg-surface dark:bg-surface-variant/20 p-4 rounded-xl leading-relaxed">
                    Tăng mức độ nhận biết cho dòng sản phẩm Chăm sóc da Mùa hè mới đối với đối tượng Gen-Z. KPI chính là tỷ lệ nhấp chuột vào trang đích sản phẩm, với mục tiêu phụ là tạo nội dung do người dùng tự tạo (UGC) cho các quảng cáo trong tương lai.
                  </p>
                </div>

                <div>
                  <h3 className="font-label-sm text-xs text-on-surface-variant dark:text-outline-variant uppercase tracking-wider mb-2 font-semibold">
                    Yêu cầu bàn giao
                  </h3>
                  <ul className="space-y-3 font-body-md text-on-surface">
                    <li className="flex items-start gap-4 p-4 bg-surface dark:bg-surface-variant/20 rounded-xl">
                      <div className="w-8 h-8 rounded-full bg-secondary-container/50 flex items-center justify-center text-secondary shrink-0">
                        <Play size={14} fill="currentColor" />
                      </div>
                      <div>
                        <p className="font-bold text-primary dark:text-inverse-primary">1x Video TikTok (15-30 giây)</p>
                        <p className="text-on-surface-variant text-sm mt-1">
                          Tập trung vào sản phẩm, kết hợp âm thanh thịnh hành được cung cấp trong thư mục tài nguyên.
                        </p>
                      </div>
                    </li>

                    <li className="flex items-start gap-4 p-4 bg-surface dark:bg-surface-variant/20 rounded-xl">
                      <div className="w-8 h-8 rounded-full bg-secondary-container/50 flex items-center justify-center text-secondary shrink-0">
                        <Camera size={14} />
                      </div>
                      <div>
                        <p className="font-bold text-primary dark:text-inverse-primary">2x Bài đăng Instagram Story</p>
                        <p className="text-on-surface-variant text-sm mt-1">
                          Trải nghiệm mở hộp với liên kết vuốt lên trực tiếp dẫn đến cửa hàng.
                        </p>
                      </div>
                    </li>
                  </ul>
                </div>
              </div>
            </section>

            {/* Delivery & Proof of upload */}
            <section className="bg-surface-container-lowest dark:bg-tertiary-container rounded-[2rem] p-8 shadow-[0_4px_24px_rgba(255,143,163,0.08)] border border-surface-variant/50 space-y-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-surface-container dark:bg-surface-variant/35 flex items-center justify-center text-primary dark:text-inverse-primary">
                    <CloudUpload size={20} />
                  </div>
                  <h2 className="font-headline-md text-primary dark:text-inverse-primary font-bold">Bàn giao &amp; Minh chứng</h2>
                </div>
                <span className="px-3 py-1 bg-surface-container dark:bg-outline/25 rounded-full font-label-sm text-xs text-on-surface-variant dark:text-inverse-on-surface font-semibold">
                  {uploadedFile ? 'Đã tải lên' : 'Đang chờ tải lên'}
                </span>
              </div>

              {uploadedFile ? (
                <div className="border border-emerald-500/30 bg-emerald-500/5 dark:bg-emerald-950/10 rounded-xl p-6 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <CheckCircle className="text-emerald-500" size={24} />
                    <div>
                      <p className="font-bold text-primary dark:text-inverse-primary text-sm">{uploadedFile}</p>
                      <p className="text-xs text-on-surface-variant mt-0.5">Vừa được gửi cho nhân viên đánh giá.</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setUploadedFile(null)}
                    className="text-xs text-error underline hover:text-error/85"
                  >
                    Gỡ bỏ
                  </button>
                </div>
              ) : (
                <div
                  onDragOver={(e) => {
                    e.preventDefault();
                    setIsDragOver(true);
                  }}
                  onDragLeave={() => setIsDragOver(false)}
                  onDrop={simulateDrop}
                  className={`border-2 border-dashed rounded-xl p-12 flex flex-col items-center justify-center text-center cursor-pointer group transition-all ${
                    isDragOver
                      ? 'border-secondary bg-secondary-container/10'
                      : 'border-outline-variant bg-surface dark:bg-surface-variant/5 hover:bg-surface-container-low'
                  }`}
                >
                  <label className="w-full flex flex-col items-center cursor-pointer">
                    <input type="file" className="hidden" onChange={handleFileUpload} />
                    <div className="w-16 h-16 rounded-full bg-surface-container dark:bg-outline/20 flex items-center justify-center mb-4 group-hover:scale-105 transition-transform shadow-sm">
                      <Upload className="text-primary dark:text-inverse-primary" size={24} />
                    </div>
                    <p className="font-body-lg text-primary dark:text-inverse-primary font-bold mb-1">
                      Tải lên Minh chứng Nội dung
                    </p>
                    <p className="font-body-md text-on-surface-variant text-sm max-w-sm">
                      Kéo và thả ảnh chụp màn hình, tệp video hoặc duyệt qua thư mục cục bộ của bạn để xác minh việc hoàn thành chiến dịch.
                    </p>
                  </label>
                </div>
              )}
            </section>
          </div>

          {/* Right Column: Contextual & Timeline sidebar (4 spans) */}
          <div className="lg:col-span-4 flex flex-col gap-6">
            {/* Creator profile card */}
            <aside className="bg-surface-container-lowest dark:bg-tertiary-container rounded-[2rem] p-6 shadow-sm border border-surface-variant/50 relative overflow-hidden flex flex-col items-center text-center">
              <div className="absolute top-0 left-0 w-full h-24 bg-gradient-to-r from-secondary-container/50 to-surface-container-highest dark:from-secondary/20 dark:to-outline/10 opacity-60 z-0 pointer-events-none" />
              
              <div className="relative z-10 flex flex-col items-center mt-6">
                <div className="w-24 h-24 rounded-full border-4 border-surface dark:border-tertiary-container shadow-md overflow-hidden mb-4 bg-surface-container">
                  <img
                    alt="Creator avatar"
                    className="w-full h-full object-cover"
                    src="https://lh3.googleusercontent.com/aida-public/AB6AXuBYd7VnGLUlmYtRxhs1pmEh9Z2LU-XHroQkLhyzZf5S-oLslCCEOTEs4UGKqe2jT0FzoRgeXZhZrK2C5SNqUgqVFoTbFrffgd5XtZv1ewfBVjaB_xb5CopaYJfPITUk8HW2DeUMyDQiOBbwPO79rQ5RDP86196dVtDl8OHxrx8qjXIcMqXmiRPPryTsk2zvnKAWG4lFkI92u_jucBQo_l67bhQEm6e6SgK_tp7KmqIs7AtEUj9Li55ln7_qBGbc_oJ5Or6trvuyuf8"
                  />
                </div>
                <h3 className="font-headline-md text-primary dark:text-inverse-primary font-bold mb-0.5">
                  Elena Rivera
                </h3>
                <p className="font-label-sm text-xs text-on-surface-variant mb-6">
                  @elenacreates • Làm đẹp &amp; Phong cách sống
                </p>

                <div className="flex gap-2 w-full mb-6">
                  <Link
                    to="/marketplace"
                    className="flex-1 py-2.5 rounded-full bg-surface dark:bg-surface-variant/20 text-primary dark:text-inverse-primary font-label-sm text-xs hover:bg-surface-container-high transition-colors text-center border border-surface-variant"
                  >
                    Chợ KOL/KOC
                  </Link>
                  <button
                    onClick={() => alert('Đang mở cuộc trò chuyện với Elena Rivera...')}
                    className="flex-1 py-2.5 rounded-full bg-primary text-on-primary font-label-sm text-xs hover:bg-primary/90 transition-colors text-center shadow-sm font-bold"
                  >
                    Nhắn tin
                  </button>
                </div>
              </div>

              <div className="border-t border-surface-variant/40 w-full pt-4 relative z-10">
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center border-r border-surface-variant/40">
                    <p className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider mb-1">Nền tảng</p>
                    <p className="font-body-md font-bold text-primary dark:text-inverse-primary flex items-center justify-center gap-1.5 text-sm">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="14"
                        height="14"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className="text-pink-500"
                      >
                        <rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
                        <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
                        <line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
                      </svg>
                      Instagram
                    </p>
                  </div>
                  <div className="text-center">
                    <p className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider mb-1">Người theo dõi</p>
                    <p className="font-body-md font-bold text-primary dark:text-inverse-primary text-sm">1.2M</p>
                  </div>
                </div>
              </div>
            </aside>

            {/* Booking Timeline */}
            <aside className="bg-surface-container-lowest dark:bg-tertiary-container rounded-[2rem] p-6 shadow-sm border border-surface-variant/50">
              <h3 className="font-label-sm text-label-sm text-on-surface-variant uppercase mb-6 tracking-wider font-semibold">
                Dòng thời gian Lịch đặt
              </h3>

              <div className="relative pl-6 space-y-6">
                {/* Vertical line background */}
                <div className="absolute left-2.5 top-2 bottom-2 w-[1px] bg-surface-container-highest dark:bg-outline/20" />
                
                <div className="relative">
                  <div className="absolute -left-6 w-3.5 h-3.5 rounded-full bg-secondary-container border-4 border-surface dark:border-tertiary-container shadow-sm mt-1" />
                  <p className="font-label-sm text-[11px] text-on-surface-variant">24 thg 10, 2023</p>
                  <p className="font-body-md font-bold text-primary dark:text-inverse-primary text-sm">Đã yêu cầu đơn đặt</p>
                </div>

                <div className="relative">
                  <div className="absolute -left-6 w-3.5 h-3.5 rounded-full bg-secondary-container border-4 border-surface dark:border-tertiary-container shadow-sm mt-1" />
                  <p className="font-label-sm text-[11px] text-on-surface-variant">26 thg 10, 2023</p>
                  <p className="font-body-md font-bold text-primary dark:text-inverse-primary text-sm">Đã chấp nhận điều khoản</p>
                  <p className="text-xs text-on-surface-variant mt-0.5">KOL đã xem và duyệt thông tin tóm tắt.</p>
                </div>

                <div className="relative">
                  <div
                    className={`absolute -left-6 w-3.5 h-3.5 rounded-full border-4 border-surface dark:border-tertiary-container shadow-sm mt-1 ${
                      fulfillmentStep >= 3 ? 'bg-primary animate-pulse' : 'bg-surface-container-highest'
                    }`}
                  />
                  <p className={`font-label-sm text-[11px] ${fulfillmentStep >= 3 ? 'text-primary font-bold' : 'text-on-surface-variant'}`}>
                    02 thg 11, 2023
                  </p>
                  <p className="font-body-md font-bold text-primary dark:text-inverse-primary text-sm">Hạn nộp bản nháp nội dung</p>
                </div>

                <div className={`relative ${fulfillmentStep < 4 ? 'opacity-40' : ''}`}>
                  <div className="absolute -left-6 w-3.5 h-3.5 rounded-full bg-surface-container-highest border-4 border-surface dark:border-tertiary-container mt-1" />
                  <p className="font-label-sm text-[11px] text-on-surface-variant">10 thg 11, 2023</p>
                  <p className="font-body-md font-bold text-on-surface dark:text-inverse-primary text-sm">Bàn giao cuối cùng</p>
                </div>
              </div>
            </aside>
          </div>
        </div>
      </main>
    </div>
  );
}
