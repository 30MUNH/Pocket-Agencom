export const BOOKING_STATUS_LABELS = {
  pending: { label: 'Chờ duyệt', filter: 'Pending', color: 'amber' },
  staff_reviewing: { label: 'Nhân viên đang duyệt', filter: 'Pending', color: 'amber' },
  need_more_info: { label: 'Cần thêm thông tin', filter: 'Pending', color: 'orange' },
  approved: { label: 'Đã duyệt', filter: 'Pending', color: 'blue' },
  confirmed: { label: 'Đã xác nhận', filter: 'In Progress', color: 'blue' },
  in_progress: { label: 'Đang thực hiện', filter: 'In Progress', color: 'blue' },
  content_submitted: { label: 'Đã nộp nội dung', filter: 'In Progress', color: 'purple' },
  completed: { label: 'Đã hoàn thành', filter: 'Completed', color: 'green' },
  cancelled: { label: 'Đã hủy', filter: 'Cancelled', color: 'red' },
};

export const PLAN_STATUS_LABELS = {
  draft: { label: 'Bản nháp', color: 'bg-outline' },
  saved: { label: 'Đã lưu', color: 'bg-blue-500' },
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
