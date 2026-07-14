import { useState, useMemo, useEffect } from 'react';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import { Lightbulb, Heart, Mail, FileText, ClipboardCheck, Check, PlayCircle, Play, Video, Copy, BookOpen, RefreshCw, Download, Clock, Loader2 } from 'lucide-react';
import { useMarketingPlan, useSavePlan } from '../../hooks/useMarketingPlans';
import { toast } from '../../store/toastStore';

export default function MarketingResult() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const planId = searchParams.get('planId');
  const { data: plan, isLoading } = useMarketingPlan(planId);
  const savePlan = useSavePlan();

  const contentIdeas = plan?.contentIdeas || [];
  const videoScripts = plan?.videoScripts || [];
  const initialChecklist = useMemo(() => {
    if (Array.isArray(plan?.checklist)) {
      return plan.checklist.map((item, i) =>
        typeof item === 'string'
          ? { id: i + 1, title: item, desc: '', checked: false }
          : item
      );
    }
    return [];
  }, [plan]);

  const [checklist, setChecklist] = useState([]);
  const [copiedScript, setCopiedScript] = useState(null);

  useEffect(() => {
    if (initialChecklist.length) setChecklist(initialChecklist);
  }, [initialChecklist]);

  const handleSave = async () => {
    if (!planId) return;
    try {
      await savePlan.mutateAsync(planId);
      toast.success('Kế hoạch đã được lưu vào Bảng điều khiển!');
      navigate('/plans');
    } catch (err) {
      toast.error(err.message || 'Không thể lưu kế hoạch');
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20 gap-2 text-on-surface-variant">
        <Loader2 className="animate-spin" size={24} />
        Đang tải kế hoạch...
      </div>
    );
  }

  if (!plan) {
    return (
      <div className="text-center py-20">
        <p className="text-on-surface-variant mb-4">Không tìm thấy kế hoạch.</p>
        <Link to="/marketing-kit" className="text-primary font-bold">Tạo kế hoạch mới</Link>
      </div>
    );
  }

  const toggleCheck = (id) => {
    setChecklist(
      checklist.map((item) =>
        item.id === id ? { ...item, checked: !item.checked } : item
      )
    );
  };

  const copyToClipboard = (title, text) => {
    navigator.clipboard.writeText(text);
    setCopiedScript(title);
    setTimeout(() => setCopiedScript(null), 2000);
  };

  return (
    <div className="flex-1 w-full space-y-12">
      {/* Header bar */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-surface-variant/30 pb-8">
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <span className="bg-secondary-container text-on-secondary-container px-3 py-1 rounded-full text-[11px] uppercase tracking-wider font-bold">
              Kế hoạch Mới Đã được Tạo
            </span>
            <span className="text-on-surface-variant text-sm flex items-center gap-1.5 dark:text-outline-variant">
              <Clock size={14} /> Vừa xong
            </span>
          </div>
          <h2 className="text-display-lg-mobile md:text-display-lg font-display-lg text-primary dark:text-inverse-primary max-w-2xl leading-tight">
            {plan.goal}
          </h2>
          <p className="text-body-lg text-on-surface-variant max-w-3xl">
            {plan.playbook || plan.campaignType}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3 shrink-0">
          <Link
            to="/marketing-kit"
            className="px-5 py-3 rounded-full text-label-sm font-label-sm text-primary dark:text-inverse-primary hover:bg-secondary-container/40 transition-colors flex items-center gap-2 group border border-outline-variant/30"
          >
            <RefreshCw size={14} className="text-on-surface-variant group-hover:rotate-180 transition-transform duration-500" />
            Tạo lại
          </Link>
          <button
            onClick={() => alert('Xuất kế hoạch thành công!')}
            className="px-5 py-3 rounded-full text-label-sm font-label-sm text-primary dark:text-inverse-primary bg-surface-container-lowest dark:bg-tertiary-container border border-outline-variant hover:border-primary dark:hover:border-primary-fixed transition-colors shadow-sm flex items-center gap-2"
          >
            <Download size={14} />
            Xuất file
          </button>
          <button
            onClick={handleSave}
            disabled={savePlan.isPending}
            className="px-5 py-3 rounded-full text-label-sm font-label-sm text-on-primary bg-primary hover:bg-primary/90 transition-colors shadow-md hover:-translate-y-0.5 transform duration-200 disabled:opacity-60 flex items-center gap-2"
          >
            {savePlan.isPending ? <Loader2 size={14} className="animate-spin" /> : null}
            Lưu kế hoạch
          </button>
        </div>
      </div>

      {/* Bento Grid: Content Ideas */}
      <section className="space-y-6">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-secondary-container flex items-center justify-center">
            <Lightbulb className="text-on-secondary-container" size={16} />
          </div>
          <h3 className="text-headline-md font-bold text-primary dark:text-inverse-primary">Ý tưởng Nội dung</h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {contentIdeas.map((idea, index) => (
            <div
              key={index}
              className={`bg-surface-container-lowest dark:bg-tertiary-container rounded-[2rem] p-8 shadow-[0_4px_24px_rgba(255,143,163,0.08)] hover:-translate-y-1 hover:shadow-[0_8px_32px_rgba(255,143,163,0.12)] transition-all duration-300 flex flex-col h-full border border-transparent hover:border-secondary-container/50 ${
                index === contentIdeas.length - 1
                  ? 'bg-gradient-to-br from-surface-container-lowest to-secondary-container/10 dark:to-secondary-fixed-dim/5'
                  : ''
              }`}
            >
              <div className="flex justify-between items-start mb-6">
                <span className="text-label-sm font-label-sm text-secondary dark:text-secondary-fixed uppercase tracking-widest">
                  {idea.channel || 'Đa kênh'}
                </span>
                <Heart className="text-secondary-container dark:text-outline-variant cursor-pointer hover:fill-secondary" size={18} />
              </div>
              <h4 className="text-lg font-bold text-primary dark:text-inverse-primary mb-3">
                {idea.title}
              </h4>
              <p className="text-body-md text-on-surface-variant flex-1 mb-6">
                {idea.description}
              </p>
              <div className="flex flex-wrap gap-2 mt-auto">
                {idea.format && (
                  <span className="bg-surface-container dark:bg-surface-variant/40 px-3 py-1 rounded-md text-xs text-on-surface-variant dark:text-inverse-on-surface">
                    {idea.format}
                  </span>
                )}
                <span className="bg-surface-container dark:bg-surface-variant/40 px-3 py-1 rounded-md text-xs text-on-surface-variant dark:text-inverse-on-surface">
                  {idea.channel || 'Marketing'}
                </span>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Main Grid split: Left Column Checklist, Right Column Scripts + Playbook */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column Checklist (4 span) */}
        <div className="lg:col-span-4 space-y-8">
          <section className="bg-surface-container-lowest dark:bg-tertiary-container rounded-[2.5rem] p-8 shadow-[0_4px_24px_rgba(255,143,163,0.06)] border border-surface-variant/30 relative overflow-hidden">
            <div className="absolute -top-10 -right-10 w-32 h-32 bg-secondary-container/40 dark:bg-secondary-fixed-dim/5 rounded-full blur-2xl pointer-events-none" />
            
            <div className="flex items-center justify-between mb-8 relative z-10">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-secondary-container/60 dark:bg-secondary-fixed-dim/20 flex items-center justify-center">
                  <ClipboardCheck className="text-on-secondary-container dark:text-secondary-fixed" size={14} />
                </div>
                <h3 className="text-headline-md font-bold text-primary dark:text-inverse-primary text-xl">Danh sách Việc cần làm</h3>
              </div>
              <span className="text-xs font-bold text-secondary dark:text-secondary-fixed bg-secondary-container/50 dark:bg-outline/20 px-2 py-1 rounded">
                Tuần 1
              </span>
            </div>

            <ul className="space-y-4 relative z-10">
              {checklist.map((item) => (
                <li
                  key={item.id}
                  onClick={() => toggleCheck(item.id)}
                  className="group flex items-start gap-4 p-3 -mx-3 rounded-xl hover:bg-surface-container dark:hover:bg-surface-variant/20 transition-colors cursor-pointer"
                >
                  <div
                    className={`mt-1 w-5 h-5 rounded border-2 flex items-center justify-center transition-all relative shrink-0 ${
                      item.checked
                        ? 'border-secondary bg-secondary-container dark:bg-secondary/40'
                        : 'border-outline-variant group-hover:border-secondary bg-surface-container-lowest dark:bg-surface-variant/30'
                    }`}
                  >
                    {item.checked && <Check size={12} className="text-secondary dark:text-white" />}
                  </div>
                  <div>
                    <p
                      className={`text-body-md font-medium transition-all ${
                        item.checked
                          ? 'text-on-surface-variant line-through opacity-70'
                          : 'text-primary dark:text-inverse-primary'
                      }`}
                    >
                      {item.title}
                    </p>
                    <p
                      className={`text-xs mt-1 transition-all ${
                        item.checked ? 'text-outline line-through' : 'text-on-surface-variant'
                      }`}
                    >
                      {item.desc}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          </section>
        </div>

        {/* Right Column Scripts & Playbook (8 span) */}
        <div className="lg:col-span-8 space-y-12">
          {/* Section: Short Video Scripts */}
          <section className="space-y-6">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-secondary-container flex items-center justify-center">
                <PlayCircle className="text-on-secondary-container" size={16} />
              </div>
              <h3 className="text-headline-md font-bold text-primary dark:text-inverse-primary">Kịch bản Video ngắn</h3>
            </div>

            <div className="space-y-4">
              {videoScripts.map((script, index) => (
                <div
                  key={index}
                  className="bg-surface-container-lowest dark:bg-tertiary-container rounded-2xl p-6 shadow-sm border border-surface-variant/50 hover:shadow-[0_4px_16px_rgba(255,143,163,0.05)] transition-shadow flex flex-col sm:flex-row gap-6 items-start"
                >
                  <div className="w-full sm:w-32 h-24 rounded-xl overflow-hidden shrink-0 relative bg-surface-variant/30 dark:bg-surface-variant/10 flex items-center justify-center">
                    <Video className="text-outline" size={32} />
                    <div className="absolute inset-0 bg-primary/5 hover:bg-primary/10 transition-colors cursor-pointer flex items-center justify-center">
                      <span className="bg-white/80 dark:bg-surface/80 rounded-full p-1.5 shadow-sm text-primary dark:text-inverse-primary">
                        <Play size={14} fill="currentColor" />
                      </span>
                    </div>
                  </div>
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center justify-between">
                      <h4 className="text-lg font-bold text-primary dark:text-inverse-primary">
                        {script.scene}
                      </h4>
                      <span className="text-xs font-bold text-on-surface-variant bg-surface-container dark:bg-outline/20 px-2.5 py-1 rounded shrink-0 ml-2">
                        Cảnh {index + 1}
                      </span>
                    </div>
                    <p className="text-sm text-on-surface-variant font-medium">
                      {script.action}
                    </p>
                    {script.dialogue && (
                      <p className="text-sm text-on-surface-variant italic border-l-2 border-secondary/40 pl-3">
                        "{script.dialogue}"
                      </p>
                    )}
                    <button
                      onClick={() =>
                        copyToClipboard(
                          `scene-${index}`,
                          `[${script.scene}] ${script.action}\nLời thoại: ${script.dialogue || ''}`
                        )
                      }
                      className="text-label-sm font-label-sm text-secondary hover:text-primary dark:text-secondary-fixed-dim dark:hover:text-primary-fixed flex items-center gap-1.5 transition-colors"
                    >
                      <Copy size={14} />
                      {copiedScript === `scene-${index}` ? 'Đã sao chép!' : 'Sao chép Kịch bản'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Section: Marketing Playbook */}
          <section className="bg-surface-container-lowest dark:bg-tertiary-container rounded-[2.5rem] p-8 md:p-12 shadow-[0_4px_24px_rgba(255,143,163,0.08)] space-y-8">
            <div className="flex items-center gap-4 border-b border-surface-variant/50 pb-6">
              <div className="w-10 h-10 rounded-xl bg-primary text-on-primary flex items-center justify-center shadow-md">
                <BookOpen size={18} />
              </div>
              <div>
                <h3 className="text-headline-md font-bold text-primary dark:text-inverse-primary">Cẩm nang Tiếp thị</h3>
                <p className="text-sm text-on-surface-variant mt-1">Quy trình thực thi chi tiết từ A đến Z do AI thiết kế.</p>
              </div>
            </div>

            {plan.playbook ? (
              <div className="prose prose-sm max-w-none text-on-surface-variant dark:text-inverse-on-surface/80 leading-relaxed whitespace-pre-wrap">
                {plan.playbook.split('\n').map((line, i) => {
                  const trimmed = line.trim();
                  if (!trimmed) return <br key={i} />;
                  // Render lines starting with ## as section headers
                  if (trimmed.startsWith('##')) {
                    return (
                      <h4 key={i} className="font-bold text-primary dark:text-inverse-primary text-lg mt-6 mb-2">
                        {trimmed.replace(/^#+\s*/, '')}
                      </h4>
                    );
                  }
                  // Render lines starting with numbers or dashes as list items
                  if (/^(\d+\.|[-•])/.test(trimmed)) {
                    return (
                      <div key={i} className="flex gap-3 py-1">
                        <span className="text-secondary dark:text-secondary-fixed font-bold shrink-0">•</span>
                        <span>{trimmed.replace(/^(\d+\.\s*|[-•]\s*)/, '')}</span>
                      </div>
                    );
                  }
                  // Bold lines containing **text**
                  if (trimmed.startsWith('**') && trimmed.endsWith('**')) {
                    return (
                      <p key={i} className="font-bold text-primary dark:text-inverse-primary mt-4 mb-1">
                        {trimmed.replace(/\*\*/g, '')}
                      </p>
                    );
                  }
                  return <p key={i} className="mb-2">{line}</p>;
                })}
              </div>
            ) : (
              <p className="text-on-surface-variant text-body-md">Chưa có nội dung playbook.</p>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}
