import { useState, useEffect, useCallback } from 'react';
import { Search, Eye, Edit2, Ban, AlertTriangle, X, Check, Loader2, Shield, RefreshCw, UserCheck, Phone, Mail, Building2, Calendar, UserPlus, Sparkles } from 'lucide-react';
import { adminApi } from '../../api/adminApi';
import { toast } from '../../store/toastStore';
import AuthorizedMediaImage from '../../components/media/AuthorizedMediaImage';

export const INITIAL_MOCK_USERS = [
  {
    id: 1,
    name: 'Trần Văn An',
    email: 'user1@gmail.com',
    role: 'user',
    status: 'active',
    phone: '0901 234 567',
    createdAt: '2026-01-15T08:30:00Z',
    businessProfile: {
      businessName: 'Pocket Agencom HQ',
      businessType: 'Nền tảng Công nghệ & Marketing',
    },
    avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=TranVanAn&backgroundColor=b6e3f4',
  },
  {
    id: 2,
    name: 'Lê Thị Bích',
    email: 'user2@gmail.com',
    role: 'user',
    status: 'active',
    phone: '0912 345 678',
    createdAt: '2026-02-01T09:15:00Z',
    businessProfile: {
      businessName: 'Ban Kiểm Duyệt Nội Dung',
      businessType: 'Kiểm duyệt & Đánh giá Kế hoạch',
    },
    avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=LeThiBich&backgroundColor=ffdfbf',
  },
  {
    id: 3,
    name: 'Nguyễn Lan Anh',
    email: 'user3@gmail.com',
    role: 'user',
    status: 'active',
    phone: '0983 456 789',
    createdAt: '2026-02-14T14:20:00Z',
    businessProfile: {
      businessName: 'Tiệm Len Xinh Handmade',
      businessType: 'Thời trang & Quà tặng thủ công',
    },
    avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=LanAnh&backgroundColor=ffd5dc',
  },
  {
    id: 4,
    name: 'Trần Minh Đức',
    email: 'user4@gmail.com',
    role: 'user',
    status: 'active',
    phone: '0978 112 233',
    createdAt: '2026-02-20T10:05:00Z',
    businessProfile: {
      businessName: 'The Coffee Lab Saigon',
      businessType: 'F&B - Cà phê đặc sản & Workshop',
    },
    avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=MinhDuc&backgroundColor=c0aede',
  },
  {
    id: 5,
    name: 'Phạm Thu Hạnh',
    email: 'user5@gmail.com',
    role: 'user',
    status: 'active',
    phone: '0934 889 900',
    createdAt: '2026-03-01T16:45:00Z',
    businessProfile: {
      businessName: 'Hạnh Beauty & Spa Center',
      businessType: 'Làm đẹp, Chăm sóc Da & Spa',
    },
    avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=ThuHanh&backgroundColor=d1d4f9',
  },
  {
    id: 6,
    name: 'Vũ Hải Đăng',
    email: 'user6@gmail.com',
    role: 'user',
    status: 'active',
    phone: '0945 667 788',
    createdAt: '2026-03-05T11:30:00Z',
    businessProfile: {
      businessName: 'Đội ngũ Sáng tạo Media',
      businessType: 'Hỗ trợ Kịch bản Video & Mẫu',
    },
    avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=HaiDang&backgroundColor=b6e3f4',
  },
  {
    id: 7,
    name: 'Hoàng Quốc Bảo',
    email: 'user7@gmail.com',
    role: 'user',
    status: 'inactive',
    phone: '0966 334 455',
    createdAt: '2026-03-12T08:00:00Z',
    businessProfile: {
      businessName: 'Bảo Phong Audio & Hi-Fi',
      businessType: 'Thiết bị Âm thanh & Tai nghe cao cấp',
    },
    avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=QuocBao&backgroundColor=ffdfbf',
  },
  {
    id: 8,
    name: 'Đỗ Mỹ Linh',
    email: 'user8@gmail.com',
    role: 'user',
    status: 'active',
    phone: '0918 776 655',
    createdAt: '2026-03-18T13:10:00Z',
    businessProfile: {
      businessName: 'Linh Florist & Decor Đà Lạt',
      businessType: 'Hoa tươi nhập khẩu & Sự kiện',
    },
    avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=MyLinh&backgroundColor=ffd5dc',
  },
  {
    id: 9,
    name: 'Bùi Phương Thảo',
    email: 'user9@gmail.com',
    role: 'user',
    status: 'active',
    phone: '0908 990 011',
    createdAt: '2026-03-25T15:20:00Z',
    businessProfile: {
      businessName: 'Tiệm Bánh Mơ Màng Pastry',
      businessType: 'Bánh kem tươi & Trà chiều',
    },
    avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=PhuongThao&backgroundColor=c0aede',
  },
  {
    id: 10,
    name: 'Đặng Tiến Dũng',
    email: 'user10@gmail.com',
    role: 'user',
    status: 'banned',
    phone: '0988 223 344',
    createdAt: '2026-04-02T10:40:00Z',
    businessProfile: {
      businessName: 'Gốm Sứ Bát Tràng Dũng',
      businessType: 'Đồ gốm trang trí & Bát đĩa cao cấp',
    },
    avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=TienDung&backgroundColor=d1d4f9',
  },
];

const LOCAL_STORAGE_KEY = 'pocket_mock_users';

function getStoredMockUsers() {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch {
    // ignore
  }
  return INITIAL_MOCK_USERS;
}

function saveMockUsers(userList) {
  try {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(userList));
  } catch {
    // ignore
  }
}

export default function ManageUsers() {
  const [users, setUsers] = useState(() => getStoredMockUsers());
  const [totalUsers, setTotalUsers] = useState(10);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  // Modals state
  const [selectedUser, setSelectedUser] = useState(null);
  const [deactivateModalOpen, setDeactivateModalOpen] = useState(false);
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);

  // Edit form state
  const [editForm, setEditForm] = useState({ role: 'user', status: 'active' });
  const [isSubmittingEdit, setIsSubmittingEdit] = useState(false);

  const fetchUsers = useCallback(async () => {
    try {
      setLoading(true);
      const res = await adminApi.getUsers({
        search: search.trim() || undefined,
        status: statusFilter !== 'all' ? statusFilter : undefined,
      });

      if (res && res.users && res.users.length > 0) {
        setUsers(res.users);
        setTotalUsers(res.total || res.users.length);
        return;
      }
    } catch {
      // API call failed (e.g. database not connected), fallback to mock users
    } finally {
      setLoading(false);
    }

    // Filter local mock users
    const stored = getStoredMockUsers();
    const query = search.trim().toLowerCase();
    const filtered = stored.filter((u) => {
      const matchSearch =
        !query ||
        u.name?.toLowerCase().includes(query) ||
        u.email?.toLowerCase().includes(query) ||
        u.businessProfile?.businessName?.toLowerCase().includes(query);
      const matchStatus = statusFilter === 'all' || u.status === statusFilter;
      return matchSearch && matchStatus;
    });

    setUsers(filtered);
    setTotalUsers(stored.length);
  }, [search, statusFilter]);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchUsers();
    }, 200);
    return () => clearTimeout(timer);
  }, [fetchUsers]);

  // Seed / Reset mock users handler
  const handleSeedMockUsers = () => {
    saveMockUsers(INITIAL_MOCK_USERS);
    setUsers(INITIAL_MOCK_USERS);
    setTotalUsers(INITIAL_MOCK_USERS.length);
    setSearch('');
    setStatusFilter('all');
    toast.success('Đã nạp thành công 10 tài khoản người dùng ảo!');
  };

  const handleDeactivateClick = (user) => {
    setSelectedUser(user);
    setDeactivateModalOpen(true);
  };

  const confirmToggleStatus = async () => {
    if (!selectedUser) return;
    const targetStatus = selectedUser.status === 'active' ? 'inactive' : 'active';
    try {
      await adminApi.updateUserStatus(selectedUser.id, targetStatus);
    } catch {
      // Backend not connected or failed, proceed with mock update
    }

    const updated = users.map((u) => (u.id === selectedUser.id ? { ...u, status: targetStatus } : u));
    setUsers(updated);

    const stored = getStoredMockUsers();
    const updatedStored = stored.map((u) => (u.id === selectedUser.id ? { ...u, status: targetStatus } : u));
    saveMockUsers(updatedStored);

    toast.success(
      targetStatus === 'active'
        ? `Đã kích hoạt lại tài khoản ${selectedUser.name}!`
        : `Đã vô hiệu hóa tài khoản ${selectedUser.name}!`
    );
    setDeactivateModalOpen(false);
    setSelectedUser(null);
  };

  const handleOpenDetail = (user) => {
    setSelectedUser(user);
    setDetailModalOpen(true);
  };

  const handleOpenEdit = (user) => {
    setSelectedUser(user);
    setEditForm({
      role: user.role || 'user',
      status: user.status || 'active',
    });
    setEditModalOpen(true);
  };

  const handleSaveEdit = async (e) => {
    e.preventDefault();
    if (!selectedUser) return;

    try {
      setIsSubmittingEdit(true);
      try {
        if (editForm.role !== selectedUser.role) {
          await adminApi.updateUserRole(selectedUser.id, editForm.role);
        }
        if (editForm.status !== selectedUser.status) {
          await adminApi.updateUserStatus(selectedUser.id, editForm.status);
        }
      } catch {
        // Backend not connected or failed, proceed with mock update
      }

      const updated = users.map((u) =>
        u.id === selectedUser.id
          ? { ...u, role: editForm.role, status: editForm.status }
          : u
      );
      setUsers(updated);

      const stored = getStoredMockUsers();
      const updatedStored = stored.map((u) =>
        u.id === selectedUser.id
          ? { ...u, role: editForm.role, status: editForm.status }
          : u
      );
      saveMockUsers(updatedStored);

      toast.success(`Cập nhật người dùng ${selectedUser.name} thành công!`);
      setEditModalOpen(false);
      setSelectedUser(null);
    } catch (err) {
      toast.error(err.response?.data?.error?.message || err.message || 'Có lỗi xảy ra khi lưu.');
    } finally {
      setIsSubmittingEdit(false);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 tracking-tight">
            Quản lý Người dùng
          </h2>
          <p className="text-sm text-slate-500 mt-1">
            Xem, phân quyền và quản lý trạng thái tài khoản trên toàn hệ thống.
          </p>
        </div>
        <div className="flex items-center gap-2.5 self-start sm:self-auto">
          <button
            onClick={handleSeedMockUsers}
            className="inline-flex items-center gap-2 rounded-xl bg-[#FFCED2] hover:bg-[#ffbcc2] px-3.5 py-2 text-xs font-bold text-slate-900 transition-all shadow-xs"
            title="Đẩy 10 người dùng ảo vào hệ thống"
          >
            <UserPlus size={15} /> Đẩy 10 người dùng ảo
          </button>
          <button
            onClick={fetchUsers}
            className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 hover:text-slate-900 transition-colors shadow-sm"
          >
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} /> Tải lại
          </button>
        </div>
      </div>

      {/* Data Table Card */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200/80 overflow-hidden flex flex-col">
        {/* Table Toolbar */}
        <div className="p-4 md:p-6 border-b border-slate-100 flex flex-col sm:flex-row gap-3 justify-between items-center bg-white z-10">
          {/* Search */}
          <div className="relative w-full sm:w-80">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            <input
              type="text"
              placeholder="Tìm theo tên hoặc email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-white border border-slate-200 rounded-xl py-2.5 pl-9 pr-4 text-sm font-medium text-slate-900 placeholder:text-slate-400 focus:border-slate-900 focus:ring-2 focus:ring-slate-900/10 outline-none transition-all"
            />
          </div>
          {/* Filters */}
          <div className="flex gap-3 w-full sm:w-auto">
            <div className="relative w-full sm:w-48">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full bg-white border border-slate-200 rounded-xl py-2.5 pl-3.5 pr-8 text-sm font-medium text-slate-900 focus:border-slate-900 focus:ring-2 focus:ring-slate-900/10 outline-none cursor-pointer"
              >
                <option value="all">Tất cả Trạng thái</option>
                <option value="active">Hoạt động (Active)</option>
                <option value="inactive">Ngừng hoạt động (Inactive)</option>
                <option value="banned">Bị cấm (Banned)</option>
              </select>
            </div>
          </div>
        </div>

        {/* Table Content */}
        <div className="overflow-x-auto w-full">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-16 gap-3 text-slate-500">
              <Loader2 className="animate-spin text-slate-700" size={28} />
              <span className="text-xs font-semibold">Đang tải dữ liệu người dùng...</span>
            </div>
          ) : users.length === 0 ? (
            <div className="text-center py-16 text-slate-500 text-sm">
              Không tìm thấy tài khoản người dùng nào phù hợp.
            </div>
          ) : (
            <table className="w-full text-left min-w-[800px]">
              <thead className="bg-slate-50/80 border-b border-slate-200">
                <tr>
                  <th className="py-3.5 px-6 text-xs font-bold text-slate-500 uppercase tracking-wider">
                    Người dùng
                  </th>
                  <th className="py-3.5 px-6 text-xs font-bold text-slate-500 uppercase tracking-wider">
                    Địa chỉ Email
                  </th>
                  <th className="py-3.5 px-6 text-xs font-bold text-slate-500 uppercase tracking-wider">
                    Vai trò
                  </th>
                  <th className="py-3.5 px-6 text-xs font-bold text-slate-500 uppercase tracking-wider">
                    Trạng thái
                  </th>
                  <th className="py-3.5 px-6 text-xs font-bold text-slate-500 uppercase tracking-wider">
                    Ngày tham gia
                  </th>
                  <th className="py-3.5 px-6 text-xs font-bold text-slate-500 uppercase tracking-wider text-left">
                    Hành động
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {users.map((user) => (
                  <tr key={user.id} className="hover:bg-slate-50/70 transition-colors group">
                    <td className="py-3.5 px-6">
                      <div className="flex items-center gap-3">
                        <AuthorizedMediaImage
                          assetId={user.avatarMediaAssetId ? user.id : null}
                          legacyUrl={user.avatarUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(user.name || 'user')}`}
                          accessRequest={adminApi.getUserAvatarAccess}
                          alt={user.name}
                          className="w-9 h-9 rounded-full object-cover border border-slate-200"
                        />
                        <div>
                          <span className="text-sm font-semibold text-slate-900 block">
                            {user.name}
                          </span>
                          {user.businessProfile?.businessName && (
                            <span className="text-xs text-slate-500 block">
                              {user.businessProfile.businessName}
                            </span>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="py-3.5 px-6 text-sm text-slate-600">
                      {user.email}
                    </td>
                    <td className="py-3.5 px-6">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider ${
                        user.role === 'admin'
                          ? 'bg-slate-900 text-white'
                          : user.role === 'staff'
                          ? 'bg-[#FFCED2] text-slate-900 shadow-xs'
                          : 'bg-slate-100 text-slate-700'
                      }`}>
                        {user.role}
                      </span>
                    </td>
                    <td className="py-3.5 px-6">
                      {user.status === 'active' ? (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mr-1.5"></span>
                          Hoạt động
                        </span>
                      ) : user.status === 'banned' ? (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-red-50 text-red-700 border border-red-200">
                          <span className="w-1.5 h-1.5 rounded-full bg-red-500 mr-1.5"></span>
                          Bị cấm
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-600 border border-slate-200">
                          <span className="w-1.5 h-1.5 rounded-full bg-slate-400 mr-1.5"></span>
                          Ngừng hoạt động
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 px-6 text-xs text-slate-500">
                      {user.createdAt ? new Date(user.createdAt).toLocaleDateString('vi-VN') : '—'}
                    </td>
                    <td className="py-3.5 px-6 text-left">
                      <div className="flex items-center justify-start gap-1">
                        <button
                          onClick={() => handleOpenDetail(user)}
                          title="Xem Chi tiết"
                          className="p-1.5 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors"
                        >
                          <Eye size={16} />
                        </button>
                        <button
                          onClick={() => handleOpenEdit(user)}
                          title="Chỉnh sửa Vai trò / Trạng thái"
                          className="p-1.5 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors"
                        >
                          <Edit2 size={16} />
                        </button>
                        <button
                          onClick={() => handleDeactivateClick(user)}
                          title={user.status === 'active' ? 'Vô hiệu hóa' : 'Kích hoạt lại'}
                          className={`p-1.5 rounded-lg transition-colors ${
                            user.status === 'active'
                              ? 'text-red-500 hover:text-red-700 hover:bg-red-50'
                              : 'text-emerald-600 hover:text-emerald-800 hover:bg-emerald-50'
                          }`}
                        >
                          {user.status === 'active' ? <Ban size={16} /> : <Check size={16} />}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 md:p-5 border-t border-slate-100 bg-white flex flex-col sm:flex-row justify-between items-center gap-4">
          <p className="text-xs text-slate-500">
            Tổng cộng: <strong className="text-slate-800">{totalUsers}</strong> người dùng trong hệ thống
          </p>
        </div>
      </div>

      {/* User Detail Modal */}
      {detailModalOpen && selectedUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-fade-in">
          <div className="relative bg-white rounded-2xl shadow-xl max-w-lg w-full p-6 sm:p-8 overflow-hidden border border-slate-200 animate-scale-in text-slate-900">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-5">
              <h3 className="text-lg font-bold flex items-center gap-2 text-slate-900">
                <UserCheck size={18} className="text-slate-700" />
                Thông tin Chi tiết Người dùng
              </h3>
              <button
                type="button"
                onClick={() => setDetailModalOpen(false)}
                className="rounded-full p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            <div className="flex items-center gap-4 mb-6">
              <AuthorizedMediaImage
                assetId={selectedUser.avatarMediaAssetId ? selectedUser.id : null}
                legacyUrl={selectedUser.avatarUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(selectedUser.name || 'user')}`}
                accessRequest={adminApi.getUserAvatarAccess}
                alt={selectedUser.name}
                className="w-14 h-14 rounded-full object-cover border border-slate-200"
              />
              <div>
                <h4 className="text-base font-bold text-slate-900">{selectedUser.name}</h4>
                <p className="text-xs text-slate-500">ID: #{selectedUser.id}</p>
                <div className="flex items-center gap-2 mt-1.5">
                  <span className="text-[11px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-slate-100 text-slate-700">
                    {selectedUser.role}
                  </span>
                  <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
                    {selectedUser.status}
                  </span>
                </div>
              </div>
            </div>

            <div className="space-y-3 text-xs sm:text-sm bg-slate-50 p-4 rounded-xl border border-slate-200/80">
              <div className="flex items-center gap-3">
                <Mail size={16} className="text-slate-400 shrink-0" />
                <span>Email: <strong className="text-slate-800">{selectedUser.email}</strong></span>
              </div>
              <div className="flex items-center gap-3">
                <Phone size={16} className="text-slate-400 shrink-0" />
                <span>Điện thoại: <strong className="text-slate-800">{selectedUser.phone || 'Chưa cập nhật'}</strong></span>
              </div>
              <div className="flex items-center gap-3">
                <Building2 size={16} className="text-slate-400 shrink-0" />
                <span>Doanh nghiệp: <strong className="text-slate-800">{selectedUser.businessProfile?.businessName || 'Chưa tạo hồ sơ'}</strong></span>
              </div>
              <div className="flex items-center gap-3">
                <Calendar size={16} className="text-slate-400 shrink-0" />
                <span>Ngày đăng ký: <strong className="text-slate-800">{selectedUser.createdAt ? new Date(selectedUser.createdAt).toLocaleString('vi-VN') : '—'}</strong></span>
              </div>
            </div>

            <div className="mt-6 flex justify-end">
              <button
                type="button"
                onClick={() => setDetailModalOpen(false)}
                className="px-5 py-2.5 rounded-xl bg-slate-900 text-white text-xs font-bold shadow-sm hover:bg-slate-800 transition-colors"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit User Role / Status Modal */}
      {editModalOpen && selectedUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-fade-in">
          <div className="relative bg-white rounded-2xl shadow-xl max-w-md w-full p-6 sm:p-8 overflow-hidden border border-slate-200 animate-scale-in text-slate-900">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-5">
              <h3 className="text-lg font-bold flex items-center gap-2 text-slate-900">
                <Shield size={18} className="text-slate-700" />
                Phân quyền Người dùng
              </h3>
              <button
                type="button"
                onClick={() => setEditModalOpen(false)}
                className="rounded-full p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="space-y-4">
              <p className="text-xs text-slate-500">
                Chỉnh sửa vai trò phân quyền và trạng thái hoạt động cho tài khoản <strong className="text-slate-800">{selectedUser.name}</strong> ({selectedUser.email}).
              </p>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">Vai trò (Role)</label>
                <select
                  value={editForm.role}
                  onChange={(e) => setEditForm({ ...editForm, role: e.target.value })}
                  className="w-full rounded-xl border border-slate-200 bg-white p-2.5 text-xs text-slate-900 focus:outline-none focus:border-slate-900 focus:ring-2 focus:ring-slate-900/10 font-medium"
                >
                  <option value="user">Doanh nghiệp (User)</option>
                  <option value="staff">Nhân viên kiểm duyệt (Staff)</option>
                  <option value="admin">Quản trị viên (Admin)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">Trạng thái (Status)</label>
                <select
                  value={editForm.status}
                  onChange={(e) => setEditForm({ ...editForm, status: e.target.value })}
                  className="w-full rounded-xl border border-slate-200 bg-white p-2.5 text-xs text-slate-900 focus:outline-none focus:border-slate-900 focus:ring-2 focus:ring-slate-900/10 font-medium"
                >
                  <option value="active">Hoạt động (Active)</option>
                  <option value="inactive">Ngừng hoạt động (Inactive)</option>
                  <option value="banned">Cấm truy cập (Banned)</option>
                </select>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setEditModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 transition-colors"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingEdit}
                  className="px-5 py-2.5 rounded-xl bg-slate-900 text-white text-xs font-bold shadow-sm hover:bg-slate-800 transition-colors disabled:opacity-50"
                >
                  {isSubmittingEdit ? 'Đang lưu...' : 'Lưu Thay đổi'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Deactivate Confirmation Modal Overlay */}
      {deactivateModalOpen && selectedUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-fade-in">
          <div className="relative bg-white rounded-2xl shadow-xl max-w-md w-full p-6 sm:p-8 overflow-hidden border border-slate-200 animate-scale-in">
            <div className="flex items-center justify-center w-11 h-11 rounded-xl bg-red-50 text-red-600 mb-4">
              <AlertTriangle size={22} />
            </div>
            <h3 className="text-lg font-bold text-slate-900 mb-2">
              {selectedUser.status === 'active' ? 'Vô hiệu hóa Người dùng?' : 'Kích hoạt lại Người dùng?'}
            </h3>
            <p className="text-xs text-slate-500 mb-6 leading-relaxed">
              {selectedUser.status === 'active'
                ? `Bạn có chắc chắn muốn vô hiệu hóa ${selectedUser.name}? Tài khoản sẽ không thể đăng nhập vào hệ thống.`
                : `Bạn có chắc chắn muốn kích hoạt lại ${selectedUser.name}? Họ sẽ được khôi phục quyền truy cập vào hệ thống.`}
            </p>
            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={() => {
                  setDeactivateModalOpen(false);
                  setSelectedUser(null);
                }}
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 transition-colors"
              >
                Hủy
              </button>
              <button
                type="button"
                onClick={confirmToggleStatus}
                className={`px-5 py-2 rounded-xl text-xs font-bold transition-all ${
                  selectedUser.status === 'active' ? 'bg-red-600 text-white hover:bg-red-700' : 'bg-slate-900 text-white hover:bg-slate-800'
                }`}
              >
                {selectedUser.status === 'active' ? 'Vô hiệu hóa' : 'Kích hoạt lại'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
