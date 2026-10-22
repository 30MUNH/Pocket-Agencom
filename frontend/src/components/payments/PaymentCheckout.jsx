import { useEffect, useState } from 'react';
import { CheckCircle2, Copy, LoaderCircle, RefreshCw } from 'lucide-react';
import { Link } from 'react-router-dom';

const money = (amount) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
const date = (value) => new Date(value).toLocaleString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' });

export default function PaymentCheckout({ order, checking, error, onRefresh, onCancel, cancelling, cancelError }) {
  const [now, setNow] = useState(Date.now);
  const [copyMessage, setCopyMessage] = useState('');
  const [qrFailed, setQrFailed] = useState(false);
  const [confirmCancel, setConfirmCancel] = useState(false);
  useEffect(() => {
    if (order.status !== 'pending') return;
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, [order.status]);
  const seconds = Math.max(0, Math.ceil((new Date(order.expiresAt).getTime() - now) / 1000));
  const expired = order.status === 'expired' || (order.status !== 'paid' && seconds === 0);

  async function copy(value) {
    try {
      await navigator.clipboard.writeText(value);
      setCopyMessage('Đã sao chép.');
    } catch {
      setCopyMessage('Không thể sao chép tự động. Bạn có thể chọn và sao chép nội dung bên dưới.');
    }
  }

  return (
    <section aria-label="Thanh toán qua SePay" className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-7">
      <div role="status" aria-live="polite">
        {order.status === 'paid' ? (
          <div className="flex items-start gap-3 text-emerald-700">
            <CheckCircle2 aria-hidden="true" className="mt-1 shrink-0" />
            <div><h2 className="font-bold">Thanh toán thành công</h2><p className="mt-1 text-sm">Đã kích hoạt {order.planName}. Bạn có thể xem thời hạn gói ở đầu trang.</p><Link to="/marketing-kit" className="mt-3 inline-block text-sm font-semibold underline">Tạo bộ Marketing ngay</Link></div>
          </div>
        ) : order.status === 'cancelled' ? (
          <div><h2 className="font-bold text-slate-800">Đơn đã hủy</h2><p className="mt-1 text-sm text-slate-600">Không chuyển tiền theo mã này. Bạn có thể chọn gói và tạo đơn mới.</p></div>
        ) : expired ? (
          <div><h2 className="font-bold text-amber-800">Đơn đã hết hạn</h2><p className="mt-1 text-sm text-slate-600">Vui lòng không chuyển tiền theo mã này. Chọn gói và tạo đơn mới. Nếu đã chuyển, kiểm tra lại trạng thái hoặc liên hệ hỗ trợ kèm mã {order.paymentCode}.</p></div>
        ) : (
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div><h2 className="font-bold text-slate-900">Thanh toán {order.planName}</h2><p className="mt-1 text-sm text-slate-500">Quét QR bằng ứng dụng ngân hàng. Gói tự kích hoạt sau khi xác nhận tiền vào.</p></div>
            <span className="rounded-full bg-amber-50 px-3 py-1.5 font-mono text-sm font-semibold text-amber-800">{Math.floor(seconds / 60)}:{String(seconds % 60).padStart(2, '0')}</span>
          </div>
        )}
      </div>

      {order.review && <div role="alert" className="mt-5 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
        <p className="font-semibold">Giao dịch cần đối soát</p><p className="mt-1">{order.review.message}</p>
        <Link to={`/help?paymentCode=${encodeURIComponent(order.paymentCode)}`} className="mt-2 inline-block font-semibold underline">Gửi yêu cầu hỗ trợ thanh toán</Link>
      </div>}
      {order.status === 'pending' && !expired && !order.review && (
        <div className="mt-6 grid items-center gap-6 sm:grid-cols-[240px_1fr]">
          <div className="mx-auto w-60 rounded-xl border border-slate-100 bg-white p-2">
            {qrFailed ? <div className="p-5 text-center text-sm text-slate-600"><p>Chưa tải được QR. Bạn có thể chuyển khoản bằng thông tin bên cạnh.</p><button type="button" onClick={() => setQrFailed(false)} className="mt-3 font-semibold underline">Tải lại QR</button></div> :
              <img src={order.qrUrl} alt={`QR chuyển khoản ${money(order.amount)}, nội dung ${order.paymentCode}`} width="224" height="280" className="h-auto w-full" referrerPolicy="no-referrer" onError={() => setQrFailed(true)} />}
          </div>
          <div className="min-w-0 space-y-4">
            <dl className="space-y-3 text-sm">
              <div><dt className="text-slate-500">Ngân hàng</dt><dd className="mt-1 font-semibold text-slate-900">{order.bank}</dd></div>
              <div><dt className="text-slate-500">Số tài khoản nhận tiền (VA)</dt><dd className="mt-1 flex items-center gap-2 break-all font-mono font-semibold text-slate-900">{order.virtualAccount}<button type="button" aria-label="Sao chép số tài khoản VA" onClick={() => copy(order.virtualAccount)} className="rounded p-2 hover:bg-slate-100"><Copy size={16} /></button></dd></div>
              <div><dt className="text-slate-500">Chủ tài khoản</dt><dd className="mt-1 font-semibold text-slate-900">{order.accountName}</dd></div>
              <div><dt className="text-slate-500">Số tiền chính xác</dt><dd className="mt-1 text-2xl font-bold text-slate-900">{money(order.amount)}</dd></div>
              <div><dt className="text-slate-500">Nội dung chuyển khoản</dt><dd className="mt-1 flex items-center gap-2 break-all font-mono text-lg font-bold text-slate-900">{order.paymentCode}<button type="button" aria-label="Sao chép nội dung chuyển khoản" onClick={() => copy(order.paymentCode)} className="rounded p-2 hover:bg-slate-100"><Copy size={16} /></button></dd></div>
            </dl>
            <p className="text-xs leading-5 text-slate-500">Giữ nguyên nội dung và chuyển đúng số tiền trong một giao dịch trước {date(order.expiresAt)}. Không chuyển thêm nếu đã thanh toán.</p>
            <p role="status" className="text-xs text-slate-600">{copyMessage}</p>
          </div>
        </div>
      )}
      {error && <p role="alert" className="mt-4 text-sm text-red-600">{error.message} Chưa xác nhận được trạng thái; vui lòng không chuyển tiền lần nữa.</p>}
      {order.status !== 'paid' && order.status !== 'cancelled' && (
        <button type="button" disabled={checking} onClick={onRefresh} className="mt-5 inline-flex min-h-11 items-center gap-2 rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50">
          {checking ? <LoaderCircle size={16} className="animate-spin" aria-hidden="true" /> : <RefreshCw size={16} aria-hidden="true" />} Kiểm tra trạng thái
        </button>
      )}
      {order.status === 'pending' && !order.review && onCancel && (
        <div className="mt-4 text-sm">
          {confirmCancel ? <div className="space-y-3 rounded-xl border border-amber-200 bg-amber-50 p-4">
            <p className="text-amber-900">Chỉ hủy nếu bạn chưa chuyển tiền. Nếu đã chuyển, hãy kiểm tra trạng thái hoặc liên hệ hỗ trợ.</p>
            <div className="flex flex-wrap gap-4"><button type="button" disabled={cancelling} onClick={onCancel} className="font-semibold text-red-700 underline">{cancelling ? 'Đang hủy…' : 'Tôi chưa chuyển tiền, hủy đơn'}</button>
              <button type="button" onClick={() => setConfirmCancel(false)} className="text-slate-600 underline">Giữ đơn</button></div>
          </div> : <button type="button" onClick={() => setConfirmCancel(true)} className="text-slate-500 underline">Hủy đơn để đổi gói</button>}
          {cancelError && <p role="alert" className="mt-2 text-red-600">{cancelError.message}</p>}
        </div>
      )}
    </section>
  );
}
