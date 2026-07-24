import { useState } from 'react';
import { MessageSquare, Lock, Unlock, ShieldCheck, Send, Image, Video, CheckCircle2, DollarSign, Download, Eye, AlertCircle, FileText, Sparkles, Building, User } from 'lucide-react';
import { toast } from '../../store/toastStore';
import { useAuthStore } from '../../store/authStore';

const MOCK_CONTACTS = [
  {
    id: 'c1',
    name: 'Cosmetics Glow Vietnam',
    role: 'SME Brand',
    avatar: 'https://api.dicebear.com/7.x/identicon/svg?seed=glow',
    campaign: 'Chiến dịch Serum Dưỡng Da Căng Bóng',
    lastMessage: 'Vui lòng gửi bản demo video review sản phẩm.',
    time: '10:42 AM',
    unread: 1,
  },
  {
    id: 'c2',
    name: 'TechGear Official Store',
    role: 'SME Brand',
    avatar: 'https://api.dicebear.com/7.x/identicon/svg?seed=techgear',
    campaign: 'Quảng bá Tai Nghe Bluetooth ANC',
    lastMessage: 'Đã nhận được bản video nháp, đang chuẩn bị thanh toán.',
    time: 'Hôm qua',
    unread: 0,
  },
];

const INITIAL_MESSAGES = [
  {
    id: 'm1',
    sender: 'sme',
    senderName: 'Cosmetics Glow Vietnam',
    text: 'Chào bạn! Nhãn hàng đã nhận được kịch bản video. Bạn có thể gửi trước video nháp để team biên tập kiểm tra nội dung không?',
    timestamp: '10:30 AM',
    type: 'TEXT',
  },
  {
    id: 'm2',
    sender: 'kol',
    senderName: 'Minh Anh (KOL)',
    text: 'Dạ chào anh/chị! Em đã hoàn thành bản dựng video review Serum Glow C++. Em gửi bản demo đính kèm bên dưới ạ.',
    timestamp: '10:35 AM',
    type: 'TEXT',
  },
  {
    id: 'm3',
    sender: 'kol',
    senderName: 'Minh Anh (KOL)',
    type: 'DELIVERABLE',
    mediaUrl: 'https://picsum.photos/seed/skincare_demo/800/600',
    mediaType: 'IMAGE',
    title: 'Bản Demo Video Review Serum Glow C++ 30ml',
    timestamp: '10:40 AM',
    isUnlocked: false,
  },
];

export default function SecureNegotiationChat() {
  const { user } = useAuthStore();
  const isKolRole = user?.role === 'kol';

  // Automatically lock perspective to the logged-in user role ('KOL' or 'SME')
  const perspective = isKolRole ? 'KOL' : 'SME';

  const [activeContact, setActiveContact] = useState(MOCK_CONTACTS[0]);
  const [messages, setMessages] = useState(INITIAL_MESSAGES);
  const [inputText, setInputText] = useState('');
  
  // Modal for payment
  const [payingMediaId, setPayingMediaId] = useState(null);
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (!inputText.trim()) return;

    const newMsg = {
      id: `m-${Date.now()}`,
      sender: perspective.toLowerCase(),
      senderName: perspective === 'SME' ? activeContact.name : 'Minh Anh (KOL)',
      text: inputText,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      type: 'TEXT',
    };

    setMessages((prev) => [...prev, newMsg]);
    setInputText('');
  };

  const handleSendDeliverableSample = () => {
    const newDeliverable = {
      id: `deliv-${Date.now()}`,
      sender: 'kol',
      senderName: 'Minh Anh (KOL)',
      type: 'DELIVERABLE',
      mediaUrl: 'https://picsum.photos/seed/sample_product/800/600',
      mediaType: 'IMAGE',
      title: 'Bản Dựng Ấn Phẩm Truyền Thống Sản Phẩm Mới',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      isUnlocked: false,
    };
    setMessages((prev) => [...prev, newDeliverable]);
    toast.success('Đã gửi ấn phẩm bảo vệ cho thương hiệu!');
  };

  const handleUnlockByKol = (messageId) => {
    setMessages((prev) =>
      prev.map((msg) => (msg.id === messageId ? { ...msg, isUnlocked: true } : msg))
    );
    toast.success('KOL đã thủ công mở khóa quyền truy cập ấn phẩm!');
  };

  const handlePayAndUnlock = (messageId) => {
    setIsProcessingPayment(true);
    setTimeout(() => {
      setMessages((prev) =>
        prev.map((msg) => (msg.id === messageId ? { ...msg, isUnlocked: true } : msg))
      );
      setIsProcessingPayment(false);
      setPayingMediaId(null);
      toast.success('Thanh toán thành công! Ấn phẩm đã được mở khóa và tải xuống.');
    }, 1200);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner & Logged-In Role Display */}
      <div className="bg-surface-container-lowest dark:bg-tertiary-container rounded-[2rem] p-6 border border-surface-variant/30 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-xs font-bold mb-2">
            <ShieldCheck size={14} /> Hệ thống Chat & Giao nộp Bảo vệ Tài sản KOL
          </div>
          <h1 className="text-xl md:text-2xl font-extrabold text-primary">
            Chat & Thương lượng Bảo mật
          </h1>
          <p className="text-xs text-on-surface-variant mt-0.5">
            Ấn phẩm demo được làm mờ và khóa bản quyền. Doanh nghiệp đặt cọc/thanh toán để mở khóa file gốc.
          </p>
        </div>

        {/* Logged in Role Indicator Badge */}
        <div className="flex items-center gap-2.5 bg-secondary-container/80 dark:bg-secondary-container/40 p-2 px-4 rounded-full text-xs font-bold border border-secondary-container">
          <span className="text-on-surface-variant font-medium">Giao diện tài khoản:</span>
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary text-on-primary font-bold shadow-sm">
            {isKolRole ? (
              <>
                <User size={13} /> KOL / Creator
              </>
            ) : (
              <>
                <Building size={13} /> Doanh nghiệp (SME)
              </>
            )}
          </span>
        </div>
      </div>

      {/* Main Chat Container */}
      <div className="bg-surface-container-lowest dark:bg-tertiary-container rounded-[2rem] border border-surface-variant/30 shadow-sm overflow-hidden grid grid-cols-1 lg:grid-cols-12 min-h-[580px]">
        {/* Left Contacts List */}
        <div className="lg:col-span-4 border-r border-surface-variant/20 flex flex-col">
          <div className="p-4 border-b border-surface-variant/20">
            <h3 className="font-bold text-sm text-primary">Hội thoại đang chạy</h3>
            <p className="text-[11px] text-on-surface-variant">Chọn thương hiệu hoặc KOL để trao đổi</p>
          </div>

          <div className="flex-1 overflow-y-auto divide-y divide-surface-variant/10">
            {MOCK_CONTACTS.map((contact) => (
              <div
                key={contact.id}
                onClick={() => setActiveContact(contact)}
                className={`p-4 flex items-start gap-3 cursor-pointer transition-colors ${
                  activeContact.id === contact.id
                    ? 'bg-secondary-container/40 dark:bg-secondary-container/20'
                    : 'hover:bg-surface-variant/10'
                }`}
              >
                <img
                  src={contact.avatar}
                  alt={contact.name}
                  className="w-10 h-10 rounded-xl bg-surface-variant/30 object-cover shrink-0 p-0.5"
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-1">
                    <h4 className="font-bold text-xs text-primary truncate">{contact.name}</h4>
                    <span className="text-[10px] text-on-surface-variant">{contact.time}</span>
                  </div>
                  <p className="text-[11px] text-primary/80 font-medium truncate mt-0.5">{contact.campaign}</p>
                  <p className="text-[11px] text-on-surface-variant truncate mt-1">{contact.lastMessage}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right Active Chat */}
        <div className="lg:col-span-8 flex flex-col h-full bg-surface-container-lowest/50 dark:bg-tertiary-container/50">
          {/* Active Contact Header */}
          <div className="p-4 border-b border-surface-variant/20 flex items-center justify-between bg-surface-container-lowest dark:bg-tertiary-container">
            <div className="flex items-center gap-3">
              <img
                src={activeContact.avatar}
                alt={activeContact.name}
                className="w-9 h-9 rounded-xl bg-surface-variant/30 object-cover"
              />
              <div>
                <h3 className="font-bold text-sm text-primary">{activeContact.name}</h3>
                <p className="text-[11px] text-on-surface-variant">{activeContact.campaign}</p>
              </div>
            </div>

            {perspective === 'KOL' && (
              <button
                onClick={handleSendDeliverableSample}
                className="px-3.5 py-1.5 rounded-full bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-sm transition-all"
              >
                <Sparkles size={13} /> Gửi mẫu ấn phẩm demo
              </button>
            )}
          </div>

          {/* Messages Feed */}
          <div className="flex-1 p-6 overflow-y-auto space-y-4">
            {messages.map((msg) => {
              const isMine =
                (perspective === 'SME' && msg.sender === 'sme') ||
                (perspective === 'KOL' && msg.sender === 'kol');

              if (msg.type === 'DELIVERABLE') {
                return (
                  <div
                    key={msg.id}
                    className={`flex flex-col ${isMine ? 'items-end' : 'items-start'} my-3`}
                  >
                    <span className="text-[10px] text-on-surface-variant mb-1 px-1 font-semibold">
                      {msg.senderName} • {msg.timestamp}
                    </span>

                    {/* CUSTOM DELIVERABLE BUBBLE */}
                    <div className="max-w-md w-full bg-surface-container-lowest dark:bg-tertiary-container rounded-[2rem] border border-surface-variant/40 shadow-md overflow-hidden">
                      {/* Card Header */}
                      <div className="p-3.5 bg-surface-variant/20 flex items-center justify-between border-b border-surface-variant/20 text-xs">
                        <span className="font-bold text-primary flex items-center gap-1.5">
                          <Image size={14} /> {msg.title}
                        </span>
                        {msg.isUnlocked ? (
                          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 flex items-center gap-1">
                            <Unlock size={10} /> ĐÃ MỞ KHÓA
                          </span>
                        ) : (
                          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 flex items-center gap-1">
                            <Lock size={10} /> ĐANG KHÓA BẢO VỆ
                          </span>
                        )}
                      </div>

                      {/* Media Display Container */}
                      <div
                        className="relative aspect-video bg-black overflow-hidden select-none"
                        onContextMenu={(e) => e.preventDefault()} // Disable right click
                      >
                        <img
                          src={msg.mediaUrl}
                          alt="Deliverable Sample"
                          draggable={false}
                          className={`w-full h-full object-cover transition-all duration-300 ${
                            msg.isUnlocked ? 'filter-none scale-100' : 'filter blur-md scale-105 opacity-60'
                          }`}
                        />

                        {/* Watermark & Lock Overlay when LOCKED */}
                        {!msg.isUnlocked && (
                          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm flex flex-col items-center justify-center text-white p-4 text-center">
                            <div className="w-12 h-12 rounded-full bg-amber-500/80 text-white flex items-center justify-center mb-2 shadow-lg animate-bounce">
                              <Lock size={24} />
                            </div>
                            <span className="font-black text-lg tracking-widest text-amber-300 uppercase">
                              LOCKED - ĐÃ KHÓA BẢN QUYỀN
                            </span>
                            <p className="text-[11px] text-white/80 max-w-xs mt-1">
                              Ấn phẩm được làm mờ để bảo vệ quyền sở hữu trí tuệ của KOL trước khi hoàn tất thanh toán.
                            </p>
                          </div>
                        )}
                      </div>

                      {/* Action Footer depending on Perspective & Lock status */}
                      <div className="p-4 bg-surface-container-lowest dark:bg-tertiary-container border-t border-surface-variant/20">
                        {!msg.isUnlocked ? (
                          perspective === 'SME' ? (
                            <div className="space-y-2">
                              <div className="flex items-center justify-between text-xs font-semibold text-on-surface-variant">
                                <span>Phí dịch vụ & Tải file gốc:</span>
                                <span className="font-extrabold text-emerald-600">450.000 VNĐ</span>
                              </div>
                              <button
                                onClick={() => setPayingMediaId(msg.id)}
                                className="w-full py-2.5 rounded-full bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center justify-center gap-2 shadow-md transition-all"
                              >
                                <DollarSign size={15} /> Thanh toán / Đặt cọc để mở khóa
                              </button>
                            </div>
                          ) : (
                            <div className="space-y-2">
                              <div className="flex items-center justify-between text-xs text-on-surface-variant">
                                <span className="font-medium">Trạng thái bản demo:</span>
                                <span className="font-bold text-amber-600">Đợi doanh nghiệp thanh toán</span>
                              </div>
                              <button
                                onClick={() => handleUnlockByKol(msg.id)}
                                className="w-full py-2 rounded-full bg-primary/10 hover:bg-primary/20 text-primary text-xs font-bold flex items-center justify-center gap-1.5 transition-colors"
                              >
                                <Unlock size={14} /> Mở khóa thủ công quyền truy cập
                              </button>
                            </div>
                          )
                        ) : (
                          <div className="flex items-center justify-between gap-2 text-xs">
                            <span className="text-emerald-600 dark:text-emerald-400 font-bold flex items-center gap-1">
                              <CheckCircle2 size={14} /> File gốc đã mở khóa an toàn
                            </span>
                            <a
                              href={msg.mediaUrl}
                              target="_blank"
                              download
                              className="px-3 py-1.5 rounded-full bg-secondary-container text-on-secondary-container font-bold text-[11px] flex items-center gap-1 hover:bg-secondary-container/80 transition-colors"
                            >
                              <Download size={12} /> Tải file HD
                            </a>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              }

              return (
                <div
                  key={msg.id}
                  className={`flex flex-col ${isMine ? 'items-end' : 'items-start'}`}
                >
                  <span className="text-[10px] text-on-surface-variant mb-1 px-1 font-semibold">
                    {msg.senderName} • {msg.timestamp}
                  </span>
                  <div
                    className={`max-w-md p-3.5 rounded-2xl text-xs leading-relaxed shadow-sm ${
                      isMine
                        ? 'bg-primary text-on-primary rounded-tr-none'
                        : 'bg-surface-container-lowest dark:bg-tertiary-container border border-surface-variant/30 text-on-surface rounded-tl-none'
                    }`}
                  >
                    {msg.text}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Input Area */}
          <form onSubmit={handleSendMessage} className="p-4 bg-surface-container-lowest dark:bg-tertiary-container border-t border-surface-variant/20 flex items-center gap-3">
            <input
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder={`Nhập tin nhắn với tư cách ${perspective === 'SME' ? 'Doanh nghiệp' : 'KOL'}...`}
              className="flex-1 p-3 rounded-full bg-surface-variant/15 border border-surface-variant/30 text-xs focus:outline-none focus:ring-2 focus:ring-primary/50"
            />
            <button
              type="submit"
              className="p-3 rounded-full bg-primary hover:bg-primary/90 text-on-primary shadow-sm transition-transform active:scale-95"
            >
              <Send size={16} />
            </button>
          </form>
        </div>
      </div>

      {/* Payment Modal for SME */}
      {payingMediaId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <div className="bg-surface-container-lowest dark:bg-tertiary-container rounded-[2rem] max-w-sm w-full p-6 shadow-xl border border-surface-variant/40 animate-in fade-in zoom-in-95 duration-200 text-center space-y-4">
            <div className="w-14 h-14 rounded-full bg-emerald-500/10 text-emerald-600 mx-auto flex items-center justify-center">
              <DollarSign size={28} />
            </div>
            <div>
              <h3 className="font-extrabold text-base text-primary">Thanh toán Mở khóa Ấn phẩm</h3>
              <p className="text-xs text-on-surface-variant mt-1">
                Số tiền 450.000 VNĐ sẽ được giữ an toàn trên hệ thống cho tới khi bạn nghiệm thu sản phẩm.
              </p>
            </div>

            <div className="bg-surface-variant/15 p-3 rounded-xl text-xs text-left space-y-1">
              <div className="flex justify-between">
                <span className="text-on-surface-variant">Chi phí dịch vụ:</span>
                <span className="font-bold text-on-surface">450.000 VNĐ</span>
              </div>
              <div className="flex justify-between">
                <span className="text-on-surface-variant">Phí giao dịch:</span>
                <span className="font-bold text-emerald-600">0 VNĐ (Miễn phí)</span>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setPayingMediaId(null)}
                className="w-full py-2.5 rounded-full font-bold text-xs text-on-surface-variant hover:bg-surface-variant/20"
              >
                Hủy
              </button>
              <button
                type="button"
                onClick={() => handlePayAndUnlock(payingMediaId)}
                disabled={isProcessingPayment}
                className="w-full py-2.5 rounded-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md transition-all disabled:opacity-50"
              >
                {isProcessingPayment ? 'Đang thanh toán...' : 'Xác nhận Thanh toán'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
