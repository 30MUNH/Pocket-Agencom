import { useEffect, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Check, CheckCircle2, Crown, Rocket, Sparkles } from 'lucide-react';
import { PRICING_PLANS } from '../../data/pricingPlans';
import { paymentApi } from '../../api/paymentApi';
import { useAuthStore } from '../../store/authStore';
import PaymentCheckout from '../../components/payments/PaymentCheckout';
import { isPendingPayment, shouldPollPayment, paymentErrorMessage } from '../../utils/paymentState';

const PLAN_ICONS = [Sparkles, Rocket, Crown];
const PLAN_DESCRIPTIONS = [
  'Bắt đầu xây dựng nội dung và kế hoạch cho thương hiệu của bạn.',
  'Tăng tốc sáng tạo và tối ưu hoạt động marketing mỗi ngày.',
  'Phát triển chiến lược riêng và quản lý nội dung trên nhiều kênh.',
];

export default function UpgradePlan() {
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [createdOrder, setCreatedOrder] = useState(null);
  const userId = useAuthStore((state) => state.user?.id);
  const queryClient = useQueryClient();
  const catalog = useQuery({ queryKey: ['payment-catalog'], queryFn: paymentApi.catalog, staleTime: 60000, retry: false });
  const plans = catalog.data?.map((plan) => ({ ...plan, price: `${plan.amount.toLocaleString('vi-VN')} VND`, period: '/30 ngày' })) || PRICING_PLANS;
  const billing = useQuery({ queryKey: ['billing', userId], queryFn: paymentApi.billing, retry: false });
  const pendingOrder = billing.data?.orders.find((order) => isPendingPayment(order));
  const orderId = createdOrder?.id || pendingOrder?.id;
  const orderQuery = useQuery({
    queryKey: ['payment-order', userId, orderId],
    queryFn: () => paymentApi.getOrder(orderId),
    enabled: Boolean(orderId),
    refetchInterval: (query) => shouldPollPayment(query.state.data) ? 3000 : false,
    retry: false,
  });
  const order = orderQuery.data || createdOrder || pendingOrder;
  const activePendingOrder = isPendingPayment(order) ? order : pendingOrder;
  const hasPendingOrder = Boolean(activePendingOrder);
  const refreshBilling = () => {
    queryClient.invalidateQueries({ queryKey: ['billing', userId] });
    queryClient.invalidateQueries({ queryKey: ['subscription-access', userId] });
  };
  const checkout = useMutation({
    mutationFn: paymentApi.createOrder,
    onSuccess: (result) => {
      setCreatedOrder(result);
      refreshBilling();
    },
  });
  const cancelCheckout = useMutation({
    mutationFn: paymentApi.cancelOrder,
    onSuccess: (result) => {
      setCreatedOrder(result);
      queryClient.setQueryData(['payment-order', userId, result.id], result);
      refreshBilling();
    },
  });
  useEffect(() => {
    if (order?.status === 'paid' || order?.status === 'expired' || order?.status === 'cancelled') {
      queryClient.invalidateQueries({ queryKey: ['billing', userId] });
      queryClient.invalidateQueries({ queryKey: ['subscription-access', userId] });
    }
  }, [order?.status, queryClient, userId]);

  return (
    <div className="w-full space-y-10 pb-4">
      <div className="mx-auto max-w-2xl space-y-4 text-center">
        <span className="inline-flex items-center gap-2 rounded-full bg-mist-pink px-4 py-2 text-xs font-bold text-slate-700">
          <Crown size={16} aria-hidden="true" />
          Đồng hành cùng sự phát triển của bạn
        </span>
        <h1 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
          Chọn gói phù hợp với doanh nghiệp của bạn
        </h1>
        <p className="text-sm leading-7 text-slate-500 sm:text-base">
          Khám phá các công cụ giúp bạn sáng tạo nội dung, xây dựng chiến lược và phát triển thương hiệu cùng Pocket Agencom.
        </p>
        <p className="text-xs font-semibold text-slate-500">Mỗi kỳ sử dụng 30 ngày · Thanh toán chuyển khoản qua SePay</p>
      </div>

      {billing.isPending && <p role="status" className="text-center text-sm text-slate-500">Đang tải gói dịch vụ và đơn thanh toán…</p>}
      {billing.error && <div role="alert" className="rounded-xl bg-red-50 p-4 text-sm text-red-700">{paymentErrorMessage(billing.error)} <button type="button" onClick={() => billing.refetch()} className="ml-2 underline">Thử lại</button></div>}
      {billing.data?.subscription && (
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-5 text-sm text-emerald-900">
          <p className="font-bold">Gói đang sử dụng: {billing.data.subscription.planName}</p>
          <p className="mt-1">Có hiệu lực đến {new Date(billing.data.subscription.expiresAt).toLocaleString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' })}.</p>
          {billing.data.access && <p className="mt-2">Bộ Marketing trong kỳ: {billing.data.access.used} đã dùng{billing.data.access.kitLimit === null ? ' · Không giới hạn số bộ' : ` / ${billing.data.access.kitLimit} bộ`}. Hạn mức AI hằng ngày vẫn áp dụng.</p>}
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 pt-3 md:grid-cols-3">
        {plans.map((plan, index) => {
          const Icon = PLAN_ICONS[index];
          const isSelected = selectedPlan?.name === plan.name;

          return (
            <article
              key={plan.name}
              className={`relative flex flex-col rounded-2xl border-2 p-6 transition-colors lg:p-7 ${
                isSelected
                  ? 'border-slate-900 bg-slate-50'
                  : plan.isPopular
                    ? 'border-accent-pink bg-white shadow-ambient'
                    : 'border-slate-100 bg-white hover:border-slate-200'
              }`}
            >
              {plan.isPopular && (
                <span className="absolute -top-3.5 left-1/2 inline-flex -translate-x-1/2 items-center gap-1.5 whitespace-nowrap rounded-full bg-accent-pink px-4 py-1.5 text-xs font-bold text-slate-900">
                  <Sparkles size={13} aria-hidden="true" /> Phổ biến nhất
                </span>
              )}
              <div className={`mb-5 flex h-11 w-11 items-center justify-center rounded-xl ${plan.isPopular ? 'bg-mist-pink' : 'bg-slate-100'} text-slate-800`}>
                <Icon size={22} aria-hidden="true" />
              </div>
              <h2 className="text-lg font-bold text-slate-900">{plan.name}</h2>
              <p className="mt-2 min-h-16 text-sm leading-6 text-slate-500">{PLAN_DESCRIPTIONS[index]}</p>
              <div className="my-6">
                <span className="text-3xl font-extrabold tracking-tight text-slate-900">{plan.price.replace(' VND', 'đ')}</span>
                <span className="ml-1 text-sm text-slate-500">{plan.period}</span>
              </div>
              <div className="mb-6 h-px bg-slate-100" />
              <p className="mb-4 text-xs font-bold uppercase tracking-wider text-slate-500">Quyền lợi của bạn</p>
              <ul className="mb-8 flex-1 space-y-4">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-start gap-2.5 text-sm leading-6 text-slate-600">
                    <CheckCircle2 size={17} aria-hidden="true" className="mt-1 shrink-0 text-slate-700" />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
              <button
                type="button"
                aria-pressed={isSelected}
                onClick={() => setSelectedPlan(plan)}
                className={`flex min-h-11 w-full items-center justify-center gap-2 rounded-full px-4 py-3 text-sm font-bold transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-slate-900 ${
                  isSelected
                    ? 'bg-slate-900 text-white'
                    : plan.isPopular
                      ? 'bg-accent-pink text-slate-900 hover:bg-[#ffbcc2]'
                      : 'border border-slate-200 text-slate-800 hover:bg-slate-100'
                }`}
              >
                {isSelected && <Check size={16} aria-hidden="true" />}
                {isSelected ? 'Đã chọn gói' : 'Chọn gói này'}
              </button>
            </article>
          );
        })}
      </div>

      <div role="status" aria-live="polite" className="rounded-2xl border border-slate-200 bg-slate-50 p-5 sm:p-6">
        {selectedPlan ? (
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm font-bold text-slate-900">Gói đã chọn: {selectedPlan.name}</p>
              <p className="mt-1 text-sm text-slate-500">Thanh toán bằng QR vào tài khoản VA MBBank.</p>
            </div>
            <p className="shrink-0 text-lg font-bold text-slate-900">{selectedPlan.price.replace(' VND', 'đ')}<span className="text-sm font-normal text-slate-500">{selectedPlan.period}</span></p>
          </div>
        ) : (
          <p className="text-center text-sm leading-6 text-slate-500">
            Chọn gói dịch vụ để tạo QR thanh toán.
          </p>
        )}
      </div>
      {selectedPlan && (
        <div className="space-y-3 text-center">
          {billing.error && <div role="alert" className="mx-auto max-w-xl rounded-xl bg-red-50 p-4 text-sm text-red-700">{paymentErrorMessage(billing.error)} <button type="button" onClick={() => billing.refetch()} className="ml-2 font-semibold underline">Thử lại</button></div>}
          <button type="button" disabled={checkout.isPending || hasPendingOrder || billing.isPending || cancelCheckout.isPending} onClick={() => checkout.mutate(selectedPlan.id)} className="min-h-12 rounded-full bg-slate-900 px-7 py-3 text-sm font-bold text-white hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50">
            {checkout.isPending ? 'Đang tạo đơn…' : hasPendingOrder ? 'Bạn đang có đơn chờ thanh toán' : 'Tạo QR thanh toán'}
          </button>
          <p className="text-xs leading-5 text-slate-500">Gia hạn cùng gói cộng thêm 30 ngày. Khi đổi gói, chu kỳ 30 ngày mới bắt đầu ngay sau xác nhận thanh toán, thay thế thời hạn gói cũ.</p>
          {billing.isPending && <p role="status" className="text-sm text-slate-500">Đang kiểm tra đơn hiện tại…</p>}
          {hasPendingOrder && <p className="text-sm text-slate-600">Bạn có đơn {activePendingOrder.paymentCode} chờ thanh toán. <button type="button" onClick={() => setCreatedOrder(activePendingOrder)} className="font-semibold underline">Mở đơn đang chờ</button>. Nếu chưa chuyển tiền, bạn có thể hủy đơn để đổi gói.</p>}
          {checkout.error && <p role="alert" className="text-sm text-red-600">{paymentErrorMessage(checkout.error)}</p>}
        </div>
      )}
      {order && <PaymentCheckout key={order.id} order={order} checking={orderQuery.isFetching} error={orderQuery.error} onRefresh={() => orderQuery.refetch()}
        onCancel={() => cancelCheckout.mutate(order.id)} cancelling={cancelCheckout.isPending} cancelError={cancelCheckout.error} />}
      {billing.data?.orders.length > 0 && (
        <section aria-label="Đơn thanh toán gần đây" className="space-y-3">
          <h2 className="text-lg font-bold text-slate-900">Đơn thanh toán gần đây</h2>
          <ul className="divide-y divide-slate-100 rounded-2xl border border-slate-200 bg-white px-5">
            {billing.data.orders.map((item) => <li key={item.id} className="flex flex-wrap items-center justify-between gap-2 py-4 text-sm">
              <div><p className="font-semibold text-slate-900">{item.planName} · {item.amount.toLocaleString('vi-VN')}đ</p><p className="mt-1 font-mono text-xs text-slate-500">{item.paymentCode}</p></div>
              <div className="flex items-center gap-3"><span className={item.status === 'paid' ? 'text-emerald-700' : 'text-slate-600'}>{({ paid: 'Đã thanh toán', pending: 'Chờ thanh toán', expired: 'Hết hạn', cancelled: 'Đã hủy' })[item.status]}</span>
                <button type="button" onClick={() => { setCreatedOrder(item); queryClient.invalidateQueries({ queryKey: ['payment-order', userId, item.id] }); }} className="font-semibold text-slate-800 underline">Xem đơn</button></div>
            </li>)}
          </ul>
        </section>
      )}
    </div>
  );
}
