import useSWR from "swr";
import { useEffect, useState } from "react";
import { 
  Search, 
  Filter, 
  UserPlus, 
  Download, 
  Trash2, 
  Edit,
  MoreVertical,
  ChevronLeft,
  ChevronRight,
  Mail,
  Shield,
  Users as UsersIcon,
  CheckCircle,
  XCircle
} from "lucide-react";

/* =======================
   Types
======================= */
interface UsersListViewProps {
  initialPage?: number;
}

interface User {
  id: string;
  email: string;
  fullname: string | null;
  role: "admin" | "member";
  created_at?: string;
  status?: "active" | "inactive";
}

interface UsersApiResponse {
  data: User[];
  meta: {
    total: number;
    page: number;
    limit: number;
  };
}

/* =======================
   Utils
======================= */
const fetcher = async (url: string) => {
  const res = await fetch(url);
  if (!res.ok) throw new Error("Failed to fetch users");
  return res.json();
};

/* =======================
   Component
======================= */
export default function UsersListView({ initialPage = 1 }: UsersListViewProps) {
  const [page, setPage] = useState(initialPage);
  const [searchInput, setSearchInput] = useState("");
  const [role, setRole] = useState("");
  const [search, setSearch] = useState("");
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);

  /* Debounce search */
  useEffect(() => {
    const timer = setTimeout(() => {
      setSearch(searchInput);
      setPage(1);
    }, 500);
    return () => clearTimeout(timer);
  }, [searchInput]);

  /* Fetch users */
  const { data, isLoading, error, mutate } = useSWR<UsersApiResponse>(
    `/api/admin/users?page=${page}&search=${encodeURIComponent(search)}&role=${role}`,
    fetcher,
    {
      keepPreviousData: true,
      revalidateOnFocus: false,
    }
  );

  const users = data?.data ?? [];
  const total = data?.meta?.total ?? 0;
  const limit = data?.meta?.limit ?? 10;
  const totalPages = Math.ceil(total / limit);

  /* Select handlers */
  const toggleSelectAll = () => {
    if (selectedUsers.length === users.length) {
      setSelectedUsers([]);
    } else {
      setSelectedUsers(users.map(u => u.id));
    }
  };

  const toggleSelectUser = (id: string) => {
    setSelectedUsers(prev => 
      prev.includes(id) ? prev.filter(uid => uid !== id) : [...prev, id]
    );
  };

  /* Action handlers */
  const handleDeleteSelected = async () => {
    if (selectedUsers.length === 0) return;
    if (!confirm(`Delete ${selectedUsers.length} user(s)?`)) return;
    
    try {
      await fetch('/api/admin/users/bulk-delete', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids: selectedUsers }),
      });
      setSelectedUsers([]);
      mutate();
    } catch (error) {
      console.error('Delete failed:', error);
    }
  };

  const handleExport = () => {
    const csv = [
      ['Email', 'Name', 'Role'],
      ...users.map(u => [u.email, u.fullname || '-', u.role])
    ].map(row => row.join(',')).join('\n');
    
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'users.csv';
    a.click();
  };

  const getRoleBadgeColor = (role: string) => {
    return role === 'admin' 
      ? 'bg-purple-100 text-purple-700 border-purple-200' 
      : 'bg-blue-100 text-blue-700 border-blue-200';
  };

  const getRoleIcon = (role: string) => {
    return role === 'admin' ? <Shield className="w-3 h-3" /> : <UsersIcon className="w-3 h-3" />;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Users Management</h1>
          <p className="text-gray-500 mt-1">Manage and monitor all users in your system</p>
        </div>
        <button className="flex items-center gap-2 bg-gradient-to-r from-indigo-600 cursor-pointer to-purple-600 text-white px-6 py-3 rounded-xl font-semibold hover:shadow-lg hover:scale-105 transition-all duration-200">
          <UserPlus className="w-5 h-5" />
          Add User
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl border border-gray-100 p-5 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500 font-medium">Total Users</p>
              <p className="text-3xl font-bold text-gray-900 mt-1">{total}</p>
            </div>
            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center">
              <UsersIcon className="w-6 h-6 text-white" />
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-xl border border-gray-100 p-5 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500 font-medium">Admins</p>
              <p className="text-3xl font-bold text-gray-900 mt-1">
                {users.filter(u => u.role === 'admin').length}
              </p>
            </div>
            <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-600 rounded-lg flex items-center justify-center">
              <Shield className="w-6 h-6 text-white" />
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-xl border border-gray-100 p-5 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500 font-medium">Members</p>
              <p className="text-3xl font-bold text-gray-900 mt-1">
                {users.filter(u => u.role === 'member').length}
              </p>
            </div>
            <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-600 rounded-lg flex items-center justify-center">
              <CheckCircle className="w-6 h-6 text-white" />
            </div>
          </div>
        </div>
      </div>

      {/* Filters & Actions */}
      <div className="bg-white rounded-xl border border-gray-100 p-6 space-y-4">
        <div className="flex flex-wrap items-center gap-3">
          {/* Search */}
          <div className="flex-1 min-w-[300px] relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search by email or name..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              className="w-full pl-10 pr-4 py-3 bg-gray-50 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-indigo-500 focus:bg-white transition-all"
            />
          </div>

          {/* Role Filter */}
          <select
            value={role}
            onChange={(e) => {
              setRole(e.target.value);
              setPage(1);
            }}
            className="px-4 py-3 bg-gray-50 border-2 border-gray-200 rounded-xl cursor-pointer focus:outline-none focus:border-indigo-500 transition-all"
          >
            <option value="">All Roles</option>
            <option value="admin">Admin</option>
            <option value="member">Member</option>
          </select>

          {/* Action Buttons */}
          <div className="flex items-center gap-2 ml-auto">
            <button
              onClick={handleExport}
              className="flex items-center gap-2 px-4 py-3 border-2 border-gray-200 cursor-pointer rounded-xl hover:bg-gray-50 transition-all"
              title="Export to CSV"
            >
              <Download className="w-5 h-5 text-gray-600" />
              <span className="hidden md:inline text-sm font-medium text-gray-700">Export</span>
            </button>

            {selectedUsers.length > 0 && (
              <button
                onClick={handleDeleteSelected}
                className="flex items-center gap-2 px-4 py-3 bg-red-50 text-red-600 border-2 border-red-200 rounded-xl hover:bg-red-100 transition-all"
              >
                <Trash2 className="w-5 h-5" />
                <span className="text-sm font-medium">Delete ({selectedUsers.length})</span>
              </button>
            )}
          </div>
        </div>

        {/* Selected count */}
        {selectedUsers.length > 0 && (
          <div className="flex items-center gap-2 px-4 py-2 bg-indigo-50 border border-indigo-200 rounded-lg">
            <CheckCircle className="w-4 h-4 text-indigo-600" />
            <span className="text-sm font-medium text-indigo-700">
              {selectedUsers.length} user(s) selected
            </span>
            <button
              onClick={() => setSelectedUsers([])}
              className="ml-auto text-sm text-indigo-600 hover:text-indigo-700 font-medium"
            >
              Clear
            </button>
          </div>
        )}
      </div>

      {/* Loading State */}
      {isLoading && (
        <div className="bg-white rounded-xl border border-gray-100 p-12 text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-gray-500 font-medium">Loading users...</p>
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-6 flex items-center gap-3">
          <XCircle className="w-6 h-6 text-red-500 flex-shrink-0" />
          <div>
            <p className="font-semibold text-red-700">Failed to load users</p>
            <p className="text-sm text-red-600 mt-1">Please try again or contact support</p>
          </div>
        </div>
      )}

      {/* Table */}
      {!isLoading && !error && (
        <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-4 text-left">
                    <input
                      type="checkbox"
                      checked={users.length > 0 && selectedUsers.length === users.length}
                      onChange={toggleSelectAll}
                      className="w-4 h-4 rounded border-gray-300 text-indigo-600 focus:ring-2 focus:ring-indigo-500"
                    />
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">User</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Role</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Status</th>
                  <th className="px-6 py-4 text-right text-sm font-semibold text-gray-700">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {users.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-12 text-center">
                      <UsersIcon className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                      <p className="text-gray-500 font-medium">No users found</p>
                      <p className="text-sm text-gray-400 mt-1">Try adjusting your filters</p>
                    </td>
                  </tr>
                ) : (
                  users.map((user) => (
                    <tr
                      key={user.id}
                      className="hover:bg-gray-50 transition-colors"
                    >
                      <td className="px-6 py-4">
                        <input
                          type="checkbox"
                          checked={selectedUsers.includes(user.id)}
                          onChange={() => toggleSelectUser(user.id)}
                          className="w-4 h-4 rounded border-gray-300 text-indigo-600 focus:ring-2 focus:ring-indigo-500"
                        />
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg flex items-center justify-center flex-shrink-0">
                            <span className="text-white font-semibold text-sm">
                              {(user.fullname || user.email).charAt(0).toUpperCase()}
                            </span>
                          </div>
                          <div>
                            <p className="font-semibold text-gray-900">{user.fullname || 'No name'}</p>
                            <p className="text-sm text-gray-500 flex items-center gap-1">
                              <Mail className="w-3 h-3" />
                              {user.email}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold border ${getRoleBadgeColor(user.role)}`}>
                          {getRoleIcon(user.role)}
                          {user.role}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-700 border border-green-200">
                          <CheckCircle className="w-3 h-3" />
                          Active
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-end gap-2">
                          <button className="p-2 hover:bg-gray-100 cursor-pointer rounded-lg transition-colors group" title="Edit">
                            <Edit className="w-4 h-4 text-gray-500 group-hover:text-indigo-600" />
                          </button>
                          <button className="p-2 hover:bg-gray-100 cursor-pointer rounded-lg transition-colors group" title="Delete">
                            <Trash2 className="w-4 h-4 text-gray-500 group-hover:text-red-600" />
                          </button>
                          <button className="p-2 hover:bg-gray-100 cursor-pointer rounded-lg transition-colors group" title="More">
                            <MoreVertical className="w-4 h-4 text-gray-500 group-hover:text-gray-700" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {users.length > 0 && (
            <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between bg-gray-50">
              <div className="text-sm text-gray-600">
                Showing <span className="font-semibold">{(page - 1) * limit + 1}</span> to{' '}
                <span className="font-semibold">{Math.min(page * limit, total)}</span> of{' '}
                <span className="font-semibold">{total}</span> users
              </div>

              <div className="flex items-center gap-2">
                <button
                  disabled={page === 1}
                  onClick={() => setPage(p => p - 1)}
                  className="flex items-center gap-2 px-4 py-2 border-2 border-gray-200 rounded-lg text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition-all"
                >
                  <ChevronLeft className="w-4 h-4" />
                  Previous
                </button>
                
                <div className="flex items-center gap-1">
                  {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                    const pageNum = i + 1;
                    return (
                      <button
                        key={pageNum}
                        onClick={() => setPage(pageNum)}
                        className={`w-10 h-10 rounded-lg text-sm font-medium transition-all ${
                          page === pageNum
                            ? 'bg-indigo-600 text-white'
                            : 'hover:bg-gray-100 text-gray-700'
                        }`}
                      >
                        {pageNum}
                      </button>
                    );
                  })}
                </div>

                <button
                  disabled={page >= totalPages}
                  onClick={() => setPage(p => p + 1)}
                  className="flex items-center gap-2 px-4 py-2 border-2 border-gray-200 rounded-lg text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition-all"
                >
                  Next
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}