import { useState } from 'react';
import { Wallet, DollarSign, Clock, ArrowDownRight, ArrowUpRight, Building, CheckCircle2, AlertCircle, X, Loader2, CreditCard, ShieldCheck } from 'lucide-react';
import { toast } from '../../store/toastStore';

const MOCK_TRANSACTIONS = [
  {
    id: 'TX-9901',
    date: '2026-07-22',
    campaignName: 'Chiến dịch Serum Glow C++',
    brandName: 'Cosmetics Glow Vietnam',
    amount: 450000,
    type: 'Thù lao hợp tác',
    status: 'completed',
  },
  {
    id: 'TX-9902',
    date: '2026-07-20',
    campaignName: 'Quảng bá Tai Nghe Bluetooth ANC',
    brandName: 'TechGear Official Store',
    amount: 550000,
    type: 'Thù lao hợp tác',
    status: 'pending',
  },
  {
    id: 'TX-9903',
    date: '2026-07-15',
    campaignName: 'Review Bàn Phím Cơ Custom KeyLab',
    brandName: 'KeyLab Studio',
    amount: 580000,
    type: 'Thù lao hợp tác',
    status: 'completed',
  },
  {
    id: 'TX-9904',
    date: '2026-07-10',
    campaignName: 'Rút tiền về Tài khoản VCB',
    brandName: 'Hệ thống Pocket Agencom',
    amount: -1000000,
    type: 'Rút tiền',
    status: 'completed',
  },
];

export default function IncomeDashboard() {
  const [balance, setBalance] = useState(1030000);
  const [monthlyEarnings, setMonthlyEarnings] = useState(1580000);
  const [pendingAmount, setPendingAmount] = useState(550000);
  const [transactions, setTransactions] = useState(MOCK_TRANSACTIONS);

  // Withdraw Modal State
  const [isWithdrawModalOpen, setIsWithdrawModalOpen] = useState(false);
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [bankName, setBankName] = useState('Vietcombank (VCB)');
  const [accountNumber, setAccountNumber] = useState('1019888777');
  const [accountHolder, setAccountHolder] = useState('LE MINH ANH');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleWithdrawSubmit = (e) => {
    e.preventDefault();
    const amountNum = parseInt(withdrawAmount, 10);

    if (isNaN(amountNum) || amountNum <= 0) {
      toast.error('Số tiền rút không hợp lệ');
      return;
    }

    if (amountNum > balance) {
      toast.error('Số dư ví không đủ để thực hiện giao dịch');
      return;
    }

    setIsSubmitting(true);
    setTimeout(() => {
      setBalance((prev) => prev - amountNum);
      const newTx = {
        id: `TX-${Math.floor(1000 + Math.random() * 9000)}`,
        date: new Date().toISOString().split('T')[0],
        campaignName: `Rút tiền về tài khoản ${bankName}`,
        brandName: 'Hệ thống Pocket Agencom',
        amount: -amountNum,
        type: 'Rút tiền',
        status: 'completed',
      };

      setTransactions((prev) => [newTx, ...prev]);
      setIsSubmitting(false);
      setIsWithdrawModalOpen(false);
      setWithdrawAmount('');
      toast.success('Yêu cầu rút tiền đã được xử lý thành công!');
    }, 1200);
  };

  return (
    <div className="space-y-8">
      {/* Header Banner */}
      <div className="bg-surface-container-lowest dark:bg-tertiary-container rounded-[2rem] p-8 border border-surface-variant/30 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-xs font-bold mb-3">
            <Wallet size={14} /> Ví thu nhập & Thanh toán
          </div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-primary leading-tight">
            Quản lý thu nhập KOL
          </h1>
          <p className="text-xs text-on-surface-variant mt-1">
            Theo dõi tổng thu nhập từ các hợp đồng tiếp thị và thực hiện rút tiền về ngân hàng.
          </p>
        </div>

        <button
          onClick={() => setIsWithdrawModalOpen(true)}
          className="px-6 py-3.5 rounded-full bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-extrabold flex items-center gap-2 shadow-md transition-all shrink-0 active:scale-98"
        >
          <ArrowDownRight size={18} /> Rút tiền về ngân hàng
        </button>
      </div>

      {/* Top Financial Metric Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Card 1: Available Balance */}
        <div className="bg-gradient-to-br from-emerald-600 to-teal-700 text-white rounded-[2rem] p-6 shadow-md relative overflow-hidden flex flex-col justify-between">
          <div className="relative z-10">
            <div className="flex items-center justify-between opacity-90 text-xs font-bold mb-2">
              <span>Số dư ví khả dụng</span>
              <Wallet size={18} />
            </div>
            <h3 className="text-3xl font-black tracking-tight">
              {balance.toLocaleString('vi-VN')} VNĐ
            </h3>
          </div>
          <div className="relative z-10 pt-4 mt-2 border-t border-white/20 flex items-center justify-between text-xs">
            <span className="opacity-90 font-medium">Trạng thái: Sẵn sàng rút</span>
            <span className="font-bold bg-white/20 px-2.5 py-0.5 rounded-full text-[10px]">An toàn</span>
          </div>
        </div>

        {/* Card 2: Monthly Earnings */}
        <div className="bg-surface-container-lowest dark:bg-tertiary-container rounded-[2rem] p-6 border border-surface-variant/30 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between text-xs font-semibold text-on-surface-variant mb-2">
              <span>Tổng thu nhập trong tháng</span>
              <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center">
                <DollarSign size={16} />
              </div>
            </div>
            <h3 className="text-2xl font-extrabold text-primary">
              {monthlyEarnings.toLocaleString('vi-VN')} VNĐ
            </h3>
          </div>
          <p className="text-[11px] text-on-surface-variant pt-3 border-t border-surface-variant/20 mt-2">
            Đã hoàn thành 3 chiến dịch truyền thông trong tháng.
          </p>
        </div>

        {/* Card 3: Pending Payments */}
        <div className="bg-surface-container-lowest dark:bg-tertiary-container rounded-[2rem] p-6 border border-surface-variant/30 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between text-xs font-semibold text-on-surface-variant mb-2">
              <span>Đơn đang chờ thanh toán</span>
              <div className="w-8 h-8 rounded-full bg-amber-500/10 text-amber-600 flex items-center justify-center">
                <Clock size={16} />
              </div>
            </div>
            <h3 className="text-2xl font-extrabold text-amber-600 dark:text-amber-400">
              {pendingAmount.toLocaleString('vi-VN')} VNĐ
            </h3>
          </div>
          <p className="text-[11px] text-on-surface-variant pt-3 border-t border-surface-variant/20 mt-2">
            Tiền sẽ về ví sau khi nhãn hàng duyệt ấn phẩm chính thức.
          </p>
        </div>
      </div>

      {/* Transaction History Table */}
      <div className="bg-surface-container-lowest dark:bg-tertiary-container rounded-[2rem] border border-surface-variant/30 shadow-sm overflow-hidden space-y-4">
        <div className="p-6 pb-2 border-b border-surface-variant/20 flex items-center justify-between">
          <div>
            <h3 className="font-bold text-base text-primary">Lịch sử giao dịch</h3>
            <p className="text-xs text-on-surface-variant">Chi tiết thù lao các chiến dịch & yêu cầu rút tiền</p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-surface-variant/15 text-on-surface-variant uppercase font-bold text-[11px]">
              <tr>
                <th className="py-3.5 px-6">Mã giao dịch</th>
                <th className="py-3.5 px-6">Ngày</th>
                <th className="py-3.5 px-6">Nội dung / Chiến dịch</th>
                <th className="py-3.5 px-6">Loại giao dịch</th>
                <th className="py-3.5 px-6">Số tiền</th>
                <th className="py-3.5 px-6">Trạng thái</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-variant/10 font-medium">
              {transactions.map((tx) => (
                <tr key={tx.id} className="hover:bg-surface-variant/5 transition-colors">
                  <td className="py-4 px-6 font-mono font-bold text-on-surface-variant">{tx.id}</td>
                  <td className="py-4 px-6 text-on-surface-variant">{tx.date}</td>
                  <td className="py-4 px-6 font-bold text-primary">{tx.campaignName}</td>
                  <td className="py-4 px-6 text-on-surface-variant">{tx.type}</td>
                  <td className="py-4 px-6 text-sm font-extrabold">
                    {tx.amount > 0 ? (
                      <span className="text-emerald-600 dark:text-emerald-400">
                        +{tx.amount.toLocaleString('vi-VN')} VNĐ
                      </span>
                    ) : (
                      <span className="text-rose-600 dark:text-rose-400">
                        {tx.amount.toLocaleString('vi-VN')} VNĐ
                      </span>
                    )}
                  </td>
                  <td className="py-4 px-6">
                    {tx.status === 'completed' ? (
                      <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300">
                        Hoàn thành
                      </span>
                    ) : (
                      <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300">
                        Đang xử lý
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Withdraw Modal */}
      {isWithdrawModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <div className="bg-surface-container-lowest dark:bg-tertiary-container rounded-[2rem] max-w-md w-full p-6 shadow-xl border border-surface-variant/40 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between pb-3 border-b border-surface-variant/20 mb-4">
              <div className="flex items-center gap-2">
                <CreditCard size={18} className="text-emerald-600" />
                <h3 className="font-bold text-base text-primary">Rút Tiền Về Ngân Hàng</h3>
              </div>
              <button
                onClick={() => setIsWithdrawModalOpen(false)}
                className="p-1.5 rounded-full text-on-surface-variant hover:bg-surface-variant/20"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleWithdrawSubmit} className="space-y-4 text-xs">
              <div className="bg-emerald-50 dark:bg-emerald-950/40 p-3 rounded-xl border border-emerald-200 dark:border-emerald-800/40">
                <span className="text-[11px] text-emerald-800 dark:text-emerald-300 font-semibold block">
                  Số dư khả dụng:
                </span>
                <span className="text-lg font-black text-emerald-600 dark:text-emerald-400">
                  {balance.toLocaleString('vi-VN')} VNĐ
                </span>
              </div>

              <div>
                <label className="block font-bold text-on-surface-variant mb-1">Số tiền cần rút (VNĐ)</label>
                <input
                  type="number"
                  required
                  min="50000"
                  max={balance}
                  placeholder="Nhập số tiền..."
                  value={withdrawAmount}
                  onChange={(e) => setWithdrawAmount(e.target.value)}
                  className="w-full p-3 rounded-xl bg-surface-container-lowest dark:bg-surface-container border border-surface-variant/40 text-xs focus:outline-none focus:ring-2 focus:ring-primary/50"
                />
              </div>

              <div>
                <label className="block font-bold text-on-surface-variant mb-1">Ngân hàng nhận tiền</label>
                <select
                  value={bankName}
                  onChange={(e) => setBankName(e.target.value)}
                  className="w-full p-3 rounded-xl bg-surface-container-lowest dark:bg-surface-container border border-surface-variant/40 text-xs focus:outline-none focus:ring-2 focus:ring-primary/50 font-semibold"
                >
                  <option value="Vietcombank (VCB)">Vietcombank (VCB)</option>
                  <option value="Techcombank (TCB)">Techcombank (TCB)</option>
                  <option value="MB Bank (MB)">MB Bank (MB)</option>
                  <option value="BIDV">BIDV</option>
                  <option value="VPBank">VPBank</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-on-surface-variant mb-1">Số tài khoản</label>
                <input
                  type="text"
                  required
                  value={accountNumber}
                  onChange={(e) => setAccountNumber(e.target.value)}
                  className="w-full p-3 rounded-xl bg-surface-container-lowest dark:bg-surface-container border border-surface-variant/40 text-xs focus:outline-none focus:ring-2 focus:ring-primary/50 font-mono font-bold"
                />
              </div>

              <div>
                <label className="block font-bold text-on-surface-variant mb-1">Tên chủ tài khoản (Viết hoa)</label>
                <input
                  type="text"
                  required
                  value={accountHolder}
                  onChange={(e) => setAccountHolder(e.target.value)}
                  className="w-full p-3 rounded-xl bg-surface-container-lowest dark:bg-surface-container border border-surface-variant/40 text-xs focus:outline-none focus:ring-2 focus:ring-primary/50 uppercase font-bold"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsWithdrawModalOpen(false)}
                  className="px-4 py-2.5 rounded-full font-bold text-on-surface-variant hover:bg-surface-variant/20"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-6 py-2.5 rounded-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold flex items-center gap-1.5 shadow-md disabled:opacity-50"
                >
                  {isSubmitting ? <Loader2 size={14} className="animate-spin" /> : 'Xác nhận rút tiền'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
