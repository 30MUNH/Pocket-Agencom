export const PLAN_STATUS_LABELS = {
  draft: { label: 'Bản nháp', color: 'bg-outline' },
  saved: { label: 'Đã lưu', color: 'bg-pink-500' },
  reviewed: { label: 'Đang duyệt', color: 'bg-amber-500' },
  approved: { label: 'Đã duyệt', color: 'bg-green-500' },
  need_revision: { label: 'Cần chỉnh sửa', color: 'bg-orange-500' },
};

export function formatCurrency(amount) {
  if (!amount) return '—';
  const num = Number(amount);
  return `${num.toLocaleString('vi-VN')} VND`;
}

export function formatDate(dateStr) {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleDateString('vi-VN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}
