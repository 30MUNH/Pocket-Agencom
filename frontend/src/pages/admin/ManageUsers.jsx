import { useState } from 'react';
import { Search, Eye, Edit2, Ban, AlertTriangle, X, Check } from 'lucide-react';

const INITIAL_USERS = [
  {
    id: 1,
    name: 'Sarah Anderson',
    initials: 'SA',
    email: 'sarah.a@marketingpro.co',
    status: 'Hoạt động',
    joined: '12 Th10, 2023',
  },
  {
    id: 2,
    name: 'James Miller',
    email: 'james.miller@creative.inc',
    avatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDSPUS9_-VZHkn6LxMvRBe1TA5y1d4id-yyp0RP9jDLpWypRGDQnPntfqX3dwhGmQU4soBQSIi17ZXt3lWWfWuDR70AL21ZffvBbAeM1oQ7HMNJjWiXCjcyWm_3Ho_j-_feFXc-tOsArrhI2FtbeJv46SFBZaNEkJR3j3CXs8H0JojVRKay4EenDVcXytcZSJRZCnlZAhEkKjRfw1MikfU2xCkytYY86wgPM4p630p_Q7juqluDKaq_S7EKwppt7kkJzuwFLm1Gm1o',
    status: 'Ngừng hoạt động',
    joined: '05 Th9, 2023',
  },
  {
    id: 3,
    name: 'Emily Wong',
    initials: 'EW',
    email: 'ewong@stellar-design.com',
    status: 'Hoạt động',
    joined: '22 Th11, 2023',
  },
];

export default function ManageUsers() {
  const [users, setUsers] = useState(INITIAL_USERS);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedUser, setSelectedUser] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);

  const handleDeactivateClick = (user) => {
    setSelectedUser(user);
    setModalOpen(true);
  };

  const confirmDeactivate = () => {
    if (!selectedUser) return;
    setUsers(
      users.map((u) =>
        u.id === selectedUser.id
          ? { ...u, status: u.status === 'Hoạt động' ? 'Ngừng hoạt động' : 'Hoạt động' }
          : u
      )
    );
    setModalOpen(false);
    setSelectedUser(null);
  };

  const filteredUsers = users.filter((user) => {
    const matchesSearch =
      user.name.toLowerCase().includes(search.toLowerCase()) ||
      user.email.toLowerCase().includes(search.toLowerCase());
    
    let matchesStatus = true;
    if (statusFilter === 'active') {
      matchesStatus = user.status === 'Hoạt động';
    } else if (statusFilter === 'inactive') {
      matchesStatus = user.status === 'Ngừng hoạt động';
    }
    
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Page Header */}
      <div>
        <h2 className="text-display-lg-mobile lg:text-display-lg font-display-lg text-primary mb-2">
          Quản lý Người dùng
        </h2>
        <p className="text-body-lg font-body-lg text-on-surface-variant">
          Xem, chỉnh sửa và quản lý quyền truy cập nền tảng cho tất cả tài khoản.
        </p>
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
              className="w-full bg-surface-container-low border-none rounded-full py-3 pl-12 pr-4 text-body-md font-body-md text-on-surface focus:ring-2 focus:ring-secondary-container placeholder:text-outline outline-none transition-all"
            />
          </div>
          {/* Filters */}
          <div className="flex gap-3 w-full sm:w-auto">
            <div className="relative w-full sm:w-48">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full appearance-none bg-surface-container-low border-none rounded-full py-3 pl-4 pr-10 text-body-md font-body-md text-on-surface focus:ring-2 focus:ring-secondary-container outline-none cursor-pointer dark:text-inverse-primary"
              >
                <option value="all">Mọi Trạng thái</option>
                <option value="active">Hoạt động</option>
                <option value="inactive">Ngừng hoạt động</option>
              </select>
            </div>
          </div>
        </div>

        {/* Table Content */}
        <div className="overflow-x-auto w-full">
          <table className="w-full text-left min-w-[800px]">
            <thead className="bg-surface-container-low/50 border-b border-surface-container dark:border-outline-variant/10">
              <tr>
                <th className="py-4 px-6 md:px-8 text-label-sm font-label-sm text-on-surface-variant uppercase tracking-wider font-semibold">
                  Người dùng
                </th>
                <th className="py-4 px-6 text-label-sm font-label-sm text-on-surface-variant uppercase tracking-wider font-semibold">
                  Địa chỉ Email
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
              {filteredUsers.map((user) => (
                <tr key={user.id} className="hover:bg-surface-container-low/30 transition-colors group">
                  <td className="py-4 px-6 md:px-8">
                    <div className="flex items-center gap-3">
                      {user.avatar ? (
                        <img
                          alt={user.name}
                          className="w-10 h-10 rounded-full object-cover shadow-sm border border-surface-container-high/15"
                          src={user.avatar}
                        />
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-secondary-container text-on-secondary-container flex items-center justify-center font-bold text-body-md">
                          {user.initials}
                        </div>
                      )}
                      <span className="text-body-md font-body-md text-primary dark:text-inverse-primary font-semibold">
                        {user.name}
                      </span>
                    </div>
                  </td>
                  <td className="py-4 px-6 text-body-md font-body-md text-on-surface-variant">
                    {user.email}
                  </td>
                  <td className="py-4 px-6">
                    {user.status === 'Hoạt động' ? (
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-label-sm font-label-sm bg-secondary-container/50 text-secondary border border-secondary-container dark:bg-secondary-container/20">
                        <span className="w-1.5 h-1.5 rounded-full bg-secondary mr-2"></span>
                        Hoạt động
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-label-sm font-label-sm bg-surface-container-high text-on-surface-variant border border-surface-container-highest">
                        <span className="w-1.5 h-1.5 rounded-full bg-outline mr-2"></span>
                        Ngừng hoạt động
                      </span>
                    )}
                  </td>
                  <td className="py-4 px-6 text-body-md font-body-md text-on-surface-variant">
                    {user.joined}
                  </td>
                  <td className="py-4 px-6 md:px-8 text-left">
                    <div className="flex items-center justify-start gap-2">
                      <button
                        onClick={() => alert(`Xem chi tiết người dùng: ${user.name}`)}
                        title="Xem Chi tiết"
                        className="p-2 text-blue-500 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 hover:bg-blue-500/10 rounded-full transition-colors"
                      >
                        <Eye size={18} />
                      </button>
                      <button
                        onClick={() => alert(`Chỉnh sửa người dùng: ${user.name}`)}
                        title="Chỉnh sửa"
                        className="p-2 text-amber-500 hover:text-amber-700 dark:text-amber-400 dark:hover:text-amber-300 hover:bg-amber-500/10 rounded-full transition-colors"
                      >
                        <Edit2 size={18} />
                      </button>
                      <button
                        onClick={() => handleDeactivateClick(user)}
                        title={user.status === 'Hoạt động' ? 'Vô hiệu hóa' : 'Kích hoạt lại'}
                        className={`p-2 rounded-full transition-colors ${
                          user.status === 'Hoạt động'
                            ? 'text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 hover:bg-red-500/10'
                            : 'text-emerald-500 hover:text-emerald-700 dark:text-emerald-400 dark:hover:text-emerald-300 hover:bg-emerald-500/10'
                        }`}
                      >
                        {user.status === 'Hoạt động' ? <Ban size={18} /> : <Check size={18} />}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        <div className="p-4 md:p-6 border-t border-surface-container dark:border-outline-variant/20 bg-surface-container-lowest dark:bg-tertiary-container flex flex-col sm:flex-row justify-between items-center gap-4">
          <p className="text-label-sm font-label-sm text-on-surface-variant">
            Hiển thị 1-{filteredUsers.length} trong số {users.length} người dùng
          </p>
          <div className="flex gap-2">
            <button
              disabled
              className="px-4 py-2 border border-outline-variant dark:border-outline-variant/30 rounded-full text-label-sm font-label-sm text-on-surface-variant hover:bg-surface-container hover:text-primary transition-colors disabled:opacity-50"
            >
              Trước
            </button>
            <button className="px-4 py-2 border border-outline-variant dark:border-outline-variant/30 rounded-full text-label-sm font-label-sm text-on-surface-variant hover:bg-surface-container hover:text-primary transition-colors">
              Sau
            </button>
          </div>
        </div>
      </div>

      {/* Deactivate Modal Overlay */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-tertiary-container/40 backdrop-blur-sm"
            onClick={() => {
              setModalOpen(false);
              setSelectedUser(null);
            }}
          />
          <div className="relative bg-surface-container-lowest dark:bg-tertiary-container rounded-3xl shadow-2xl max-w-md w-full p-8 overflow-hidden border border-surface-container/20 animate-scale-up">
            <div className="absolute top-0 left-0 w-full h-2 bg-error-container"></div>
            <div className="flex items-center justify-center w-12 h-12 rounded-full bg-error-container/50 text-error mb-6">
              <AlertTriangle size={24} />
            </div>
            <h3 className="text-headline-md font-headline-md text-primary dark:text-inverse-primary mb-2">
              {selectedUser?.status === 'Hoạt động' ? 'Vô hiệu hóa Người dùng?' : 'Kích hoạt Người dùng?'}
            </h3>
            <p className="text-body-md font-body-md text-on-surface-variant mb-8">
              {selectedUser?.status === 'Hoạt động'
                ? `Bạn có chắc chắn muốn vô hiệu hóa ${selectedUser?.name}? Họ sẽ ngay lập tức mất quyền truy cập vào hệ thống.`
                : `Bạn có chắc chắn muốn kích hoạt lại ${selectedUser?.name}? Họ sẽ lấy lại quyền truy cập vào hệ thống.`}
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => {
                  setModalOpen(false);
                  setSelectedUser(null);
                }}
                className="px-6 py-2.5 rounded-full text-label-sm font-label-sm text-primary hover:bg-surface-container transition-colors"
              >
                Hủy
              </button>
              <button
                onClick={confirmDeactivate}
                className={`px-6 py-2.5 rounded-full text-on-error font-label-sm text-label-sm hover:opacity-90 hover:shadow-lg transition-all font-bold ${
                  selectedUser?.status === 'Hoạt động' ? 'bg-error' : 'bg-primary dark:bg-inverse-primary text-on-primary dark:text-on-primary-fixed'
                }`}
              >
                {selectedUser?.status === 'Hoạt động' ? 'Vô hiệu hóa' : 'Kích hoạt'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
