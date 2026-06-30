import { useToastStore } from '../../store/toastStore';
import { X, CheckCircle, AlertCircle, Info } from 'lucide-react';

const icons = {
  error: AlertCircle,
  success: CheckCircle,
  info: Info,
};

const styles = {
  error: 'bg-error-container text-on-error-container border-error/20',
  success: 'bg-emerald-50 text-emerald-900 border-emerald-200 dark:bg-emerald-950 dark:text-emerald-200',
  info: 'bg-secondary-container text-on-secondary-container border-secondary/20',
};

export default function ToastContainer() {
  const toasts = useToastStore((s) => s.toasts);
  const removeToast = useToastStore((s) => s.removeToast);

  if (!toasts.length) return null;

  return (
    <div className="fixed top-4 right-4 z-[9999] flex flex-col gap-2 max-w-sm w-full pointer-events-none">
      {toasts.map((t) => {
        const Icon = icons[t.type] || Info;
        return (
          <div
            key={t.id}
            className={`pointer-events-auto flex items-start gap-3 p-4 rounded-2xl border shadow-lg animate-in slide-in-from-right ${styles[t.type] || styles.info}`}
          >
            <Icon size={18} className="shrink-0 mt-0.5" />
            <p className="text-sm font-medium flex-1">{t.message}</p>
            <button
              onClick={() => removeToast(t.id)}
              className="shrink-0 opacity-60 hover:opacity-100"
            >
              <X size={14} />
            </button>
          </div>
        );
      })}
    </div>
  );
}
