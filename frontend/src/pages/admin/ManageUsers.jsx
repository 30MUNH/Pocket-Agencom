import { useState, useEffect, useCallback } from 'react';
import { Search, Eye, Edit2, Ban, AlertTriangle, X, Check, Loader2, Shield, RefreshCw, UserCheck, Phone, Mail, Building2, Calendar, ChevronLeft, ChevronRight } from 'lucide-react';
import { adminApi } from '../../api/adminApi';
import { toast } from '../../store/toastStore';
import AuthorizedMediaImage from '../../components/media/AuthorizedMediaImage';

export default function ManageUsers() {
  const [users, setUsers] = useState([]);
  const [totalUsers, setTotalUsers] = useState(0);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [roleFilter, setRoleFilter] = useState('all');

  // Modals state
  const [selectedUser, setSelectedUser] = useState(null);
  const [deactivateModalOpen, setDeactivateModalOpen] = useState(false);
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);

  // Edit form state
  const [editForm, setEditForm] = useState({ role: 'user', status: 'active' });
  const [isSubmittingEdit, setIsSubmittingEdit] = useState(false);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const fetchUsers = useCallback(async () => {
    try {
      setLoading(true);
      const res = await adminApi.getUsers({
        search: search.trim() || undefined,
        status: statusFilter !== 'all' ? statusFilter : undefined,
        role: roleFilter !== 'all' ? roleFilter : undefined,
      });

      if (res) {
        setUsers(res.users || []);
        setTotalUsers(res.total || (res.users || []).length);
      }
    } catch (err) {
      console.error('[Admin Fetch Users Error]', err);
      toast.error('Không thể tải danh sách người dùng.');
    } finally {
      setLoading(false);
    }
  }, [search, statusFilter, roleFilter]);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchUsers();
    }, 250);
    return () => clearTimeout(timer);
  }, [fetchUsers]);

  useEffect(() => {
    setCurrentPage(1);
  }, [search, statusFilter, roleFilter]);

  const totalPages = Math.max(1, Math.ceil(users.length / pageSize));
  const safeCurrentPage = Math.min(currentPage, totalPages);
  const startIndex = (safeCurrentPage - 1) * pageSize;
  const paginatedUsers = users.slice(startIndex, startIndex + pageSize);

  const getPageNumbers = () => {
    if (totalPages <= 5) {
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    }
    if (safeCurrentPage <= 3) {
      return [1, 2, 3, 4, '...', totalPages];
    }
    if (safeCurrentPage >= totalPages - 2) {
      return [1, '...', totalPages - 3, totalPages - 2, totalPages - 1, totalPages];
    }
    return [1, '...', safeCurrentPage - 1, safeCurrentPage, safeCurrentPage + 1, '...', totalPages];
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
      toast.success(
        targetStatus === 'active'
          ? `Đã kích hoạt lại tài khoản ${selectedUser.name}!`
          : `Đã vô hiệu hóa tài khoản ${selectedUser.name}!`
      );
      setUsers((prev) =>
        prev.map((u) => (u.id === selectedUser.id ? { ...u, status: targetStatus } : u))
      );
      setDeactivateModalOpen(false);
      setSelectedUser(null);
    } catch (err) {
      toast.error(err.response?.data?.error?.message || err.message || 'Không thể cập nhật trạng thái.');
    }
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
      if (editForm.role !== selectedUser.role) {
        await adminApi.updateUserRole(selectedUser.id, editForm.role);
      }
      if (editForm.status !== selectedUser.status) {
        await adminApi.updateUserStatus(selectedUser.id, editForm.status);
      }

      toast.success(`Cập nhật người dùng ${selectedUser.name} thành công!`);
      setUsers((prev) =>
        prev.map((u) =>
          u.id === selectedUser.id
            ? { ...u, role: editForm.role, status: editForm.status }
            : u
        )
      );
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
        <button
          onClick={fetchUsers}
          className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 hover:text-slate-900 transition-colors shadow-sm self-start sm:self-auto"
        >
          <RefreshCw size={14} className={loading ? 'animate-spin' : ''} /> Tải lại
        </button>
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
              placeholder="Tìm kiếm theo tên hoặc email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-white border border-slate-200 rounded-xl py-2.5 pl-9 pr-4 text-sm font-medium text-slate-900 placeholder:text-slate-400 focus:border-slate-900 focus:ring-2 focus:ring-slate-900/10 outline-none transition-all"
            />
          </div>
          {/* Filters */}
          <div className="flex flex-wrap sm:flex-nowrap gap-3 w-full sm:w-auto">
            {/* Role Filter */}
            <div className="relative w-full sm:w-48">
              <select
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
                className="w-full appearance-none bg-surface-container-low dark:bg-surface-variant/20 border-none rounded-full py-3 pl-4 pr-10 text-body-md font-body-md text-on-surface focus:ring-2 focus:ring-secondary-container outline-none cursor-pointer dark:text-inverse-primary"
              >
                <option value="all">Tất cả Vai trò</option>
                <option value="user">Khách hàng (User)</option>
                <option value="staff">Nhân viên (Staff)</option>
                <option value="admin">Quản trị viên (Admin)</option>
              </select>
            </div>

            {/* Status Filter */}
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
                {paginatedUsers.map((user) => (
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

        {/* Footer with Pagination */}
        <div className="p-4 md:p-6 border-t border-slate-100 bg-white flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex flex-wrap items-center gap-4 text-xs font-medium text-slate-500">
            <span>
              Hiển thị <strong className="text-slate-800">{users.length === 0 ? 0 : startIndex + 1}</strong> - <strong className="text-slate-800">{Math.min(startIndex + pageSize, users.length)}</strong> trên tổng số <strong className="text-slate-800">{users.length}</strong> người dùng
            </span>
            <div className="flex items-center gap-1.5">
              <span className="text-xs text-slate-500">Mỗi trang:</span>
              <select
                value={pageSize}
                onChange={(e) => {
                  setPageSize(Number(e.target.value));
                  setCurrentPage(1);
                }}
                className="bg-white border border-slate-200 rounded-lg px-2 py-1 text-xs text-slate-800 font-medium focus:outline-none focus:border-slate-900 cursor-pointer"
              >
                <option value={8}>8</option>
                <option value={10}>10</option>
                <option value={20}>20</option>
                <option value={50}>50</option>
              </select>
            </div>
          </div>

          {totalPages > 1 && (
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={safeCurrentPage === 1}
                className="p-2 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                title="Trang trước"
              >
                <ChevronLeft size={16} />
              </button>

              <div className="flex items-center gap-1">
                {getPageNumbers().map((page, idx) =>
                  page === '...' ? (
                    <span key={`dots-${idx}`} className="px-2 py-1 text-xs text-slate-400">
                      ...
                    </span>
                  ) : (
                    <button
                      key={page}
                      onClick={() => setCurrentPage(page)}
                      className={`min-w-[32px] h-8 rounded-lg text-xs font-semibold transition-all ${
                        safeCurrentPage === page
                          ? 'bg-slate-900 text-white shadow-xs'
                          : 'text-slate-600 hover:bg-slate-100'
                      }`}
                    >
                      {page}
                    </button>
                  )
                )}
              </div>

              <button
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={safeCurrentPage === totalPages}
                className="p-2 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                title="Trang sau"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          )}
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
