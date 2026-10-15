import { useState, useEffect, useCallback } from 'react';
import { Search, Eye, Edit2, Ban, AlertTriangle, X, Check, Loader2, Shield, RefreshCw, UserCheck, Phone, Mail, Building2, Calendar } from 'lucide-react';
import { adminApi } from '../../api/adminApi';
import { toast } from '../../store/toastStore';
import AuthorizedMediaImage from '../../components/media/AuthorizedMediaImage';

export default function ManageUsers() {
  const [users, setUsers] = useState([]);
  const [totalUsers, setTotalUsers] = useState(0);
  const [loading, setLoading] = useState(true);
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
  }, [search, statusFilter]);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchUsers();
    }, 250);
    return () => clearTimeout(timer);
  }, [fetchUsers]);

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
    <div className="space-y-8 animate-fade-in">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h2 className="text-display-lg-mobile lg:text-display-lg font-display-lg text-primary dark:text-inverse-primary mb-2">
            Quản lý Người dùng
          </h2>
          <p className="text-body-lg font-body-lg text-on-surface-variant">
            Xem, phân quyền và quản lý trạng thái tài khoản trên toàn hệ thống.
          </p>
        </div>
        <button
          onClick={fetchUsers}
          className="inline-flex items-center gap-2 rounded-full border border-surface-variant/40 bg-surface-container-lowest dark:bg-tertiary-container px-4 py-2 text-xs font-bold text-primary dark:text-inverse-primary hover:bg-surface-container-high transition-colors shadow-sm self-start sm:self-auto"
        >
          <RefreshCw size={14} className={loading ? 'animate-spin' : ''} /> Tải lại
        </button>
      </div>

      {/* Data Table Card */}
      <div className="bg-surface-container-lowest dark:bg-tertiary-container rounded-3xl shadow-[0_4px_24px_rgba(255,143,163,0.08)] border border-surface-container/10 overflow-hidden flex flex-col">
        {/* Table Toolbar */}
        <div className="p-6 md:p-8 border-b border-surface-container dark:border-outline-variant/20 flex flex-col sm:flex-row gap-4 justify-between items-center bg-surface-container-lowest dark:bg-tertiary-container z-10">
          {/* Search */}
          <div className="relative w-full sm:w-96">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant" size={18} />
            <input
              type="text"
              placeholder="Tìm kiếm theo tên hoặc email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-surface-container-low dark:bg-surface-variant/20 border-none rounded-full py-3 pl-12 pr-4 text-body-md font-body-md text-on-surface dark:text-inverse-primary focus:ring-2 focus:ring-secondary-container placeholder:text-outline outline-none transition-all"
            />
          </div>
          {/* Filters */}
          <div className="flex gap-3 w-full sm:w-auto">
            <div className="relative w-full sm:w-48">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full appearance-none bg-surface-container-low dark:bg-surface-variant/20 border-none rounded-full py-3 pl-4 pr-10 text-body-md font-body-md text-on-surface focus:ring-2 focus:ring-secondary-container outline-none cursor-pointer dark:text-inverse-primary"
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
            <div className="flex flex-col items-center justify-center py-16 gap-3 text-on-surface-variant">
              <Loader2 className="animate-spin text-secondary" size={32} />
              <span className="text-sm font-medium">Đang tải dữ liệu người dùng từ máy chủ...</span>
            </div>
          ) : users.length === 0 ? (
            <div className="text-center py-16 text-on-surface-variant text-sm">
              Không tìm thấy tài khoản người dùng nào phù hợp.
            </div>
          ) : (
            <table className="w-full text-left min-w-[800px]">
              <thead className="bg-surface-container-low/50 dark:bg-surface-variant/10 border-b border-surface-container dark:border-outline-variant/10">
                <tr>
                  <th className="py-4 px-6 md:px-8 text-label-sm font-label-sm text-on-surface-variant uppercase tracking-wider font-semibold">
                    Người dùng
                  </th>
                  <th className="py-4 px-6 text-label-sm font-label-sm text-on-surface-variant uppercase tracking-wider font-semibold">
                    Địa chỉ Email
                  </th>
                  <th className="py-4 px-6 text-label-sm font-label-sm text-on-surface-variant uppercase tracking-wider font-semibold">
                    Vai trò
                  </th>
                  <th className="py-4 px-6 text-label-sm font-label-sm text-on-surface-variant uppercase tracking-wider font-semibold">
                    Trạng thái
                  </th>
                  <th className="py-4 px-6 text-label-sm font-label-sm text-on-surface-variant uppercase tracking-wider font-semibold">
                    Ngày tham gia
                  </th>
                  <th className="py-4 px-6 md:px-8 text-label-sm font-label-sm text-on-surface-variant uppercase tracking-wider font-semibold text-left">
                    Hành động
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-container dark:divide-outline-variant/10">
                {users.map((user) => (
                  <tr key={user.id} className="hover:bg-surface-container-low/30 dark:hover:bg-surface-variant/20 transition-colors group">
                    <td className="py-4 px-6 md:px-8">
                      <div className="flex items-center gap-3">
                        <AuthorizedMediaImage
                          assetId={user.avatarMediaAssetId ? user.id : null}
                          legacyUrl={user.avatarUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(user.name || 'user')}`}
                          accessRequest={adminApi.getUserAvatarAccess}
                          alt={user.name}
                          className="w-10 h-10 rounded-full object-cover shadow-sm border border-surface-container-high/15"
                        />
                        <div>
                          <span className="text-body-md font-body-md text-primary dark:text-inverse-primary font-semibold block">
                            {user.name}
                          </span>
                          {user.businessProfile?.businessName && (
                            <span className="text-xs text-on-surface-variant block">
                              {user.businessProfile.businessName}
                            </span>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-6 text-body-md font-body-md text-on-surface-variant">
                      {user.email}
                    </td>
                    <td className="py-4 px-6">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider ${
                        user.role === 'admin'
                          ? 'bg-purple-100 text-purple-800 dark:bg-purple-950/40 dark:text-purple-300'
                          : user.role === 'staff'
                          ? 'bg-blue-100 text-blue-800 dark:bg-blue-950/40 dark:text-blue-300'
                          : 'bg-surface-container text-on-surface-variant'
                      }`}>
                        {user.role}
                      </span>
                    </td>
                    <td className="py-4 px-6">
                      {user.status === 'active' ? (
                        <span className="inline-flex items-center px-3 py-1 rounded-full text-label-sm font-label-sm bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300 border border-emerald-300">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mr-2"></span>
                          Hoạt động
                        </span>
                      ) : user.status === 'banned' ? (
                        <span className="inline-flex items-center px-3 py-1 rounded-full text-label-sm font-label-sm bg-red-100 text-red-800 dark:bg-red-950/40 dark:text-red-300 border border-red-300">
                          <span className="w-1.5 h-1.5 rounded-full bg-red-500 mr-2"></span>
                          Bị cấm
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-3 py-1 rounded-full text-label-sm font-label-sm bg-surface-container-high text-on-surface-variant border border-surface-container-highest">
                          <span className="w-1.5 h-1.5 rounded-full bg-outline mr-2"></span>
                          Ngừng hoạt động
                        </span>
                      )}
                    </td>
                    <td className="py-4 px-6 text-body-md font-body-md text-on-surface-variant">
                      {user.createdAt ? new Date(user.createdAt).toLocaleDateString('vi-VN') : '—'}
                    </td>
                    <td className="py-4 px-6 md:px-8 text-left">
                      <div className="flex items-center justify-start gap-2">
                        <button
                          onClick={() => handleOpenDetail(user)}
                          title="Xem Chi tiết"
                          className="p-2 text-blue-500 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 hover:bg-blue-500/10 rounded-full transition-colors"
                        >
                          <Eye size={18} />
                        </button>
                        <button
                          onClick={() => handleOpenEdit(user)}
                          title="Chỉnh sửa Vai trò / Trạng thái"
                          className="p-2 text-amber-500 hover:text-amber-700 dark:text-amber-400 dark:hover:text-amber-300 hover:bg-amber-500/10 rounded-full transition-colors"
                        >
                          <Edit2 size={18} />
                        </button>
                        <button
                          onClick={() => handleDeactivateClick(user)}
                          title={user.status === 'active' ? 'Vô hiệu hóa' : 'Kích hoạt lại'}
                          className={`p-2 rounded-full transition-colors ${
                            user.status === 'active'
                              ? 'text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 hover:bg-red-500/10'
                              : 'text-emerald-500 hover:text-emerald-700 dark:text-emerald-400 dark:hover:text-emerald-300 hover:bg-emerald-500/10'
                          }`}
                        >
                          {user.status === 'active' ? <Ban size={18} /> : <Check size={18} />}
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
        <div className="p-4 md:p-6 border-t border-surface-container dark:border-outline-variant/20 bg-surface-container-lowest dark:bg-tertiary-container flex flex-col sm:flex-row justify-between items-center gap-4">
          <p className="text-label-sm font-label-sm text-on-surface-variant">
            Tổng cộng: <strong>{totalUsers}</strong> người dùng trong hệ thống
          </p>
        </div>
      </div>

      {/* User Detail Modal */}
      {detailModalOpen && selectedUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-primary/40 backdrop-blur-sm animate-fade-in">
          <div className="relative bg-surface-container-lowest dark:bg-tertiary-container rounded-[2.5rem] shadow-ambient max-w-lg w-full p-6 sm:p-8 overflow-hidden border border-surface-container/20 animate-scale-in text-primary dark:text-inverse-primary">
            <div className="flex items-center justify-between pb-4 border-b border-surface-variant/30 mb-5">
              <h3 className="text-xl font-bold flex items-center gap-2">
                <UserCheck size={20} className="text-secondary" />
                Thông tin Chi tiết Người dùng
              </h3>
              <button
                type="button"
                onClick={() => setDetailModalOpen(false)}
                className="rounded-full p-1.5 text-on-surface-variant hover:bg-surface-container-high transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            <div className="flex items-center gap-4 mb-6">
              <AuthorizedMediaImage
                assetId={selectedUser.avatarMediaAssetId ? selectedUser.id : null}
                legacyUrl={selectedUser.avatarUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(selectedUser.name || 'user')}`}
                accessRequest={adminApi.getUserAvatarAccess}
                alt={selectedUser.name}
                className="w-16 h-16 rounded-full object-cover ring-4 ring-secondary/20"
              />
              <div>
                <h4 className="text-lg font-bold">{selectedUser.name}</h4>
                <p className="text-xs text-on-surface-variant">ID: #{selectedUser.id}</p>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-[11px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-secondary-container text-secondary">
                    {selectedUser.role}
                  </span>
                  <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-surface-container text-on-surface-variant">
                    {selectedUser.status}
                  </span>
                </div>
              </div>
            </div>

            <div className="space-y-3 text-xs sm:text-sm bg-surface-container-low dark:bg-surface-variant/20 p-5 rounded-2xl border border-surface-variant/20">
              <div className="flex items-center gap-3">
                <Mail size={16} className="text-secondary shrink-0" />
                <span>Email: <strong>{selectedUser.email}</strong></span>
              </div>
              <div className="flex items-center gap-3">
                <Phone size={16} className="text-secondary shrink-0" />
                <span>Điện thoại: <strong>{selectedUser.phone || 'Chưa cập nhật'}</strong></span>
              </div>
              <div className="flex items-center gap-3">
                <Building2 size={16} className="text-secondary shrink-0" />
                <span>Doanh nghiệp: <strong>{selectedUser.businessProfile?.businessName || 'Chưa tạo hồ sơ'}</strong></span>
              </div>
              <div className="flex items-center gap-3">
                <Calendar size={16} className="text-secondary shrink-0" />
                <span>Ngày đăng ký: <strong>{selectedUser.createdAt ? new Date(selectedUser.createdAt).toLocaleString('vi-VN') : '—'}</strong></span>
              </div>
            </div>

            <div className="mt-6 flex justify-end">
              <button
                type="button"
                onClick={() => setDetailModalOpen(false)}
                className="px-6 py-2.5 rounded-full bg-primary text-on-primary text-xs font-bold shadow-sm hover:opacity-90 transition-opacity"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit User Role / Status Modal */}
      {editModalOpen && selectedUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-primary/40 backdrop-blur-sm animate-fade-in">
          <div className="relative bg-surface-container-lowest dark:bg-tertiary-container rounded-[2.5rem] shadow-ambient max-w-md w-full p-6 sm:p-8 overflow-hidden border border-surface-container/20 animate-scale-in text-primary dark:text-inverse-primary">
            <div className="flex items-center justify-between pb-4 border-b border-surface-variant/30 mb-5">
              <h3 className="text-xl font-bold flex items-center gap-2">
                <Shield size={20} className="text-secondary" />
                Phân quyền Người dùng
              </h3>
              <button
                type="button"
                onClick={() => setEditModalOpen(false)}
                className="rounded-full p-1.5 text-on-surface-variant hover:bg-surface-container-high transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="space-y-4">
              <p className="text-xs text-on-surface-variant">
                Chỉnh sửa vai trò phân quyền và trạng thái hoạt động cho tài khoản <strong>{selectedUser.name}</strong> ({selectedUser.email}).
              </p>

              <div>
                <label className="block text-xs font-bold uppercase text-on-surface-variant mb-1">Vai trò (Role)</label>
                <select
                  value={editForm.role}
                  onChange={(e) => setEditForm({ ...editForm, role: e.target.value })}
                  className="w-full rounded-2xl border border-surface-variant/40 bg-surface-container-low dark:bg-surface-variant/20 p-3 text-xs text-primary dark:text-inverse-primary focus:outline-none focus:ring-2 focus:ring-secondary/40"
                >
                  <option value="user">Doanh nghiệp (User)</option>
                  <option value="staff">Nhân viên kiểm duyệt (Staff)</option>
                  <option value="admin">Quản trị viên (Admin)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-on-surface-variant mb-1">Trạng thái (Status)</label>
                <select
                  value={editForm.status}
                  onChange={(e) => setEditForm({ ...editForm, status: e.target.value })}
                  className="w-full rounded-2xl border border-surface-variant/40 bg-surface-container-low dark:bg-surface-variant/20 p-3 text-xs text-primary dark:text-inverse-primary focus:outline-none focus:ring-2 focus:ring-secondary/40"
                >
                  <option value="active">Hoạt động (Active)</option>
                  <option value="inactive">Ngừng hoạt động (Inactive)</option>
                  <option value="banned">Cấm truy cập (Banned)</option>
                </select>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-surface-variant/30">
                <button
                  type="button"
                  onClick={() => setEditModalOpen(false)}
                  className="px-5 py-2.5 rounded-full text-xs font-bold text-on-surface-variant hover:bg-surface-container-high transition-colors"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingEdit}
                  className="px-6 py-2.5 rounded-full bg-primary text-on-primary text-xs font-bold shadow-sm hover:opacity-90 transition-opacity disabled:opacity-50"
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-primary/40 backdrop-blur-sm animate-fade-in">
          <div className="relative bg-surface-container-lowest dark:bg-tertiary-container rounded-3xl shadow-2xl max-w-md w-full p-8 overflow-hidden border border-surface-container/20 animate-scale-in">
            <div className="absolute top-0 left-0 w-full h-2 bg-error-container"></div>
            <div className="flex items-center justify-center w-12 h-12 rounded-full bg-error-container/50 text-error mb-6">
              <AlertTriangle size={24} />
            </div>
            <h3 className="text-headline-md font-headline-md text-primary dark:text-inverse-primary mb-2">
              {selectedUser.status === 'active' ? 'Vô hiệu hóa Người dùng?' : 'Kích hoạt lại Người dùng?'}
            </h3>
            <p className="text-body-md font-body-md text-on-surface-variant mb-8">
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
                className="px-6 py-2.5 rounded-full text-label-sm font-label-sm text-primary dark:text-inverse-primary hover:bg-surface-container transition-colors"
              >
                Hủy
              </button>
              <button
                type="button"
                onClick={confirmToggleStatus}
                className={`px-6 py-2.5 rounded-full text-on-error font-label-sm text-label-sm hover:opacity-90 hover:shadow-lg transition-all font-bold ${
                  selectedUser.status === 'active' ? 'bg-error' : 'bg-primary text-on-primary'
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
