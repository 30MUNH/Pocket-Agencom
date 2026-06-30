import { useState } from 'react';
import { Search, MessageSquare, Check, X, UserPlus, FileText } from 'lucide-react';

const INITIAL_REQUESTS = [
  {
    id: 1,
    user: "Sarah's Boutique",
    avatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCkRTtashE7TyeiHSsz8kMX52HsN3R5oFHvxTSFHTlA97csmo9Cat7YUIttcFWOoEMmaDV_Jb5wv5AeIX_xZSAHqFlSUTl5pEwPkHz5XcIya1Ux2PJ30JY0qshQhDeB6HtvZ6KPchdy3Sf3Z526S3Yb21z06H-1La-NSiNdGjc2XDwmKIVrVlZ3I2XpYkrVEWJOH7G3j1tMcDXvQELcL-U3y3Zr7EL47EPbQGJkDxR3V_h4Lxba1PAftkjP2KKArg_ZjI2Edv3x_nk',
    kol: '@fashionista_mia',
    campaign: 'Ra mắt Bộ sưu tập Mùa hè',
    budget: '$1,500',
    status: 'Chờ Kiểm duyệt',
    date: '24 Th10, 2023',
  },
  {
    id: 2,
    user: 'TechGizmo Inc.',
    avatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBtBhYXewEwjr6pKFhq-uteBzjfAwBspnk3CgYdUW2NhP-EjX17kSZ4WK7x72yNokjGSZLdljRecWRuq8Wv2hy5m2j15mfke7hxv2mT8Jsb2dFbiLf7BYKXkq4L7ilHlJRFZQhEqimikX8G7dap23aJVyTjb_LIXkJguAfZZl6FFxTSXB09WE_HNz587MqL8zhL97JvWMs8u_nAlZSe0iwbQO9sFscXdWJuMxiA3qi62hwyDTrGKdecXm99uHaaTslKV4sOjlcJvaU',
    kol: '@gadget_guru',
    campaign: 'Quảng bá Ứng dụng mới',
    budget: '$3,200',
    status: 'Đã Xác nhận',
    date: '22 Th10, 2023',
    note: 'Hợp đồng đã ký, dự thảo hạn trong 3 ngày.',
  },
  {
    id: 3,
    user: 'VitaGlow Skincare',
    avatar: '',
    kol: 'Chưa xác định (Cần Phân bổ)',
    campaign: 'Khuyến mãi Gói Quà tặng Ngày lễ',
    budget: '$800',
    status: 'Chờ Kiểm duyệt',
    date: '21 Th10, 2023',
  },
];

export default function StaffBookingManagement() {
  const [requests, setRequests] = useState(INITIAL_REQUESTS);
  const [search, setSearch] = useState('');
  const [filterTab, setFilterTab] = useState('all');
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [noteText, setNoteText] = useState('');
  const [assigningId, setAssigningId] = useState(null);
  const [assignedKol, setAssignedKol] = useState('');

  const handleApprove = (id) => {
    setRequests(
      requests.map((r) => (r.id === id ? { ...r, status: 'Đã Xác nhận' } : r))
    );
  };

  const handleReject = (id) => {
    setRequests(
      requests.map((r) => (r.id === id ? { ...r, status: 'Đã Từ chối' } : r))
    );
  };

  const handleAssignSubmit = (e, id) => {
    e.preventDefault();
    if (!assignedKol) return;
    setRequests(
      requests.map((r) =>
        r.id === id
          ? {
              ...r,
              kol: assignedKol.startsWith('@') ? assignedKol : `@${assignedKol}`,
            }
          : r
      )
    );
    setAssigningId(null);
    setAssignedKol('');
  };

  const handleSaveNote = (e) => {
    e.preventDefault();
    if (!selectedRequest) return;
    setRequests(
      requests.map((r) =>
        r.id === selectedRequest.id ? { ...r, note: noteText } : r
      )
    );
    setSelectedRequest(null);
    setNoteText('');
  };

  const openNoteModal = (request) => {
    setSelectedRequest(request);
    setNoteText(request.note || '');
  };

  const filteredRequests = requests.filter((r) => {
    const matchesSearch =
      r.user.toLowerCase().includes(search.toLowerCase()) ||
      r.kol.toLowerCase().includes(search.toLowerCase()) ||
      r.campaign.toLowerCase().includes(search.toLowerCase());

    const matchesStatus =
      filterTab === 'all' ||
      (filterTab === 'pending' && r.status === 'Chờ Kiểm duyệt') ||
      (filterTab === 'confirmed' && r.status === 'Đã Xác nhận');

    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h2 className="font-display-lg text-display-lg text-primary dark:text-inverse-primary">
            Đặt lịch KOL/KOC
          </h2>
          <p className="text-on-surface-variant mt-2 font-body-lg text-body-lg">
            Quản lý các yêu cầu hợp tác với người ảnh hưởng mới gửi đến.
          </p>
        </div>
        <div className="relative max-w-xs w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant" size={16} />
          <input
            type="text"
            placeholder="Tìm kiếm yêu cầu..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-surface-container-low border-none rounded-full pl-10 pr-4 py-2 focus:ring-2 focus:ring-secondary-container text-body-md"
          />
        </div>
      </div>

      {/* Main Content Card */}
      <div className="bg-surface-container-lowest dark:bg-tertiary-container rounded-3xl p-8 shadow-[4px_24px_rgba(255,143,163,0.08)] border border-surface-container/10">
        {/* Filters Tabs */}
        <div className="flex justify-between items-center mb-6 border-b border-surface-container dark:border-outline-variant/10 pb-4">
          <div className="flex gap-2">
            <button
              onClick={() => setFilterTab('all')}
              className={`px-5 py-2 rounded-full font-label-sm text-label-sm transition-all duration-200 border-none cursor-pointer ${
                filterTab === 'all'
                  ? 'bg-secondary-container text-on-secondary-container font-semibold shadow-sm'
                  : 'bg-surface-container-low text-on-surface-variant hover:bg-surface-container-high'
              }`}
            >
              Mọi Trạng thái
            </button>
            <button
              onClick={() => setFilterTab('pending')}
              className={`px-5 py-2 rounded-full font-label-sm text-label-sm transition-all duration-200 border-none cursor-pointer ${
                filterTab === 'pending'
                  ? 'bg-secondary-container text-on-secondary-container font-semibold shadow-sm'
                  : 'bg-surface-container-low text-on-surface-variant hover:bg-surface-container-high'
              }`}
            >
              Chờ Kiểm duyệt
            </button>
            <button
              onClick={() => setFilterTab('confirmed')}
              className={`px-5 py-2 rounded-full font-label-sm text-label-sm transition-all duration-200 border-none cursor-pointer ${
                filterTab === 'confirmed'
                  ? 'bg-secondary-container text-on-secondary-container font-semibold shadow-sm'
                  : 'bg-surface-container-low text-on-surface-variant hover:bg-surface-container-high'
              }`}
            >
              Đã Xác nhận
            </button>
          </div>
        </div>

        {/* Data Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[800px]">
            <thead>
              <tr className="border-b border-surface-variant dark:border-outline-variant/10">
                <th className="py-4 px-4 font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider">
                  Người dùng
                </th>
                <th className="py-4 px-4 font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider">
                  KOL Yêu cầu
                </th>
                <th className="py-4 px-4 font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider">
                  Chiến dịch
                </th>
                <th className="py-4 px-4 font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider">
                  Ngân sách
                </th>
                <th className="py-4 px-4 font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider">
                  Trạng thái
                </th>
                <th className="py-4 px-4 font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider">
                  Ngày đặt
                </th>
                <th className="py-4 px-4 font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider text-right">
                  Hành động
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-variant dark:divide-outline-variant/10">
              {filteredRequests.map((r) => (
                <tr key={r.id} className="hover:bg-surface-container-low/50 transition-colors group">
                  <td className="py-4 px-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full overflow-hidden bg-surface-variant flex items-center justify-center shrink-0 shadow-sm border border-surface-container-high/15">
                        {r.avatar ? (
                          <img alt={r.user} className="w-full h-full object-cover" src={r.avatar} />
                        ) : (
                          <span className="font-bold text-on-surface-variant text-xs">
                            {r.user.charAt(0)}
                          </span>
                        )}
                      </div>
                      <span className="font-medium text-primary dark:text-inverse-primary">
                        {r.user}
                      </span>
                    </div>
                  </td>
                  <td className="py-4 px-4 text-on-surface-variant">
                    {assigningId === r.id ? (
                      <form
                        onSubmit={(e) => handleAssignSubmit(e, r.id)}
                        className="flex items-center gap-2"
                      >
                        <input
                          type="text"
                          required
                          value={assignedKol}
                          onChange={(e) => setAssignedKol(e.target.value)}
                          className="bg-surface-container-low border-none rounded-full px-3 py-1 text-xs focus:ring-1 focus:ring-secondary-container w-32"
                          placeholder="Ví dụ: @marcus_tech"
                        />
                        <button
                          type="submit"
                          className="p-1 bg-primary text-on-primary rounded-full hover:opacity-90"
                        >
                          <Check size={12} />
                        </button>
                      </form>
                    ) : (
                      <span className="flex items-center gap-1.5">
                        {r.kol}
                        {r.kol.includes('Cần Phân bổ') && (
                          <button
                            onClick={() => setAssigningId(r.id)}
                            className="p-1 text-secondary hover:text-primary hover:bg-surface-container rounded-full"
                            title="Phân bổ KOL"
                          >
                            <UserPlus size={14} />
                          </button>
                        )}
                      </span>
                    )}
                  </td>
                  <td className="py-4 px-4 text-on-surface-variant">{r.campaign}</td>
                  <td className="py-4 px-4 text-primary dark:text-inverse-primary font-medium">
                    {r.budget}
                  </td>
                  <td className="py-4 px-4">
                    {r.status === 'Đã Xác nhận' ? (
                      <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-primary-fixed text-on-primary-fixed-variant">
                        Đã Xác nhận
                      </span>
                    ) : r.status === 'Đã Từ chối' ? (
                      <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-error-container text-on-error-container">
                        Đã Từ chối
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-tertiary-fixed text-on-tertiary-fixed-variant">
                        Chờ Kiểm duyệt
                      </span>
                    )}
                  </td>
                  <td className="py-4 px-4 text-on-surface-variant text-sm">{r.date}</td>
                  <td className="py-4 px-4 text-right">
                    <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      {r.status === 'Chờ Kiểm duyệt' ? (
                        <>
                          <button
                            onClick={() => handleApprove(r.id)}
                            className="px-3 py-1.5 rounded-full bg-primary dark:bg-inverse-primary text-on-primary dark:text-on-primary-fixed font-label-sm text-[11px] hover:opacity-90 transition-opacity font-bold"
                          >
                            Duyệt
                          </button>
                          <button
                            onClick={() => handleReject(r.id)}
                            className="px-3 py-1.5 rounded-full bg-surface-container text-on-surface-variant font-label-sm text-[11px] hover:bg-surface-variant transition-colors font-bold"
                          >
                            Từ chối
                          </button>
                        </>
                      ) : (
                        <button
                          onClick={() => openNoteModal(r)}
                          className="px-3 py-1.5 rounded-full bg-surface-container hover:bg-surface-container-high text-on-surface-variant font-label-sm text-[11px] transition-colors flex items-center gap-1 font-bold"
                        >
                          <FileText size={12} /> {r.note ? 'Sửa Ghi chú' : 'Ghi chú Nội bộ'}
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Internal Note Modal */}
      {selectedRequest && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-tertiary-container/40 backdrop-blur-sm"
            onClick={() => setSelectedRequest(null)}
          />
          <div className="relative bg-surface-container-lowest dark:bg-tertiary-container rounded-3xl shadow-2xl max-w-md w-full p-8 overflow-hidden border border-surface-container/20 animate-scale-up">
            <button
              onClick={() => setSelectedRequest(null)}
              className="absolute top-6 right-6 text-on-surface-variant hover:text-primary p-1.5 rounded-full hover:bg-surface-container-high"
            >
              <X size={20} />
            </button>
            <h3 className="text-headline-md font-headline-md text-primary dark:text-inverse-primary mb-2">
              Ghi chú Nội bộ
            </h3>
            <p className="text-sm text-surface-tint mb-6">
              Thêm nhận xét và ghi chú nội bộ cho chiến dịch của {selectedRequest.user}.
            </p>
            <form onSubmit={handleSaveNote} className="space-y-4">
              <textarea
                value={noteText}
                onChange={(e) => setNoteText(e.target.value)}
                rows={4}
                className="w-full bg-surface-container-low border-none rounded-2xl px-4 py-3 focus:ring-2 focus:ring-secondary-container text-body-md"
                placeholder="Ví dụ: Hợp đồng đã được xác minh, chờ thanh toán tiền cọc..."
              />
              <div className="flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setSelectedRequest(null)}
                  className="px-6 py-2.5 rounded-full text-label-sm font-label-sm text-primary hover:bg-surface-container transition-colors"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-full bg-primary dark:bg-inverse-primary text-on-primary dark:text-on-primary-fixed font-label-sm text-label-sm hover:opacity-90 hover:shadow-lg transition-all font-bold"
                >
                  Lưu Ghi chú
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
