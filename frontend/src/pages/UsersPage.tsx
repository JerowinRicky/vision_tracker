import React, { useState, useEffect } from 'react';
import {
  Users,
  Plus,
  Shield,
  Trash2,
  CheckCircle2,
  Mail,
  User as UserIcon,
  RefreshCw,
  Search,
  KeyRound,
  ShieldCheck,
  Eye,
  Sliders,
  Check
} from 'lucide-react';
import { api } from '../services/api';
import { User } from '../types';

export const UsersPage: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    first_name: '',
    last_name: '',
    role: 'operator' as User['role'],
  });

  const fetchUsers = () => {
    setLoading(true);
    api.get('/auth/users/')
      .then((res) => setUsers(res.data.results || res.data))
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/auth/users/', formData);
      setIsModalOpen(false);
      setFormData({
        username: '',
        email: '',
        password: '',
        first_name: '',
        last_name: '',
        role: 'operator',
      });
      fetchUsers();
    } catch (err: any) {
      alert(err.response?.data?.username?.[0] || 'Error creating user account.');
    }
  };

  const handleDelete = async (id: number, username: string) => {
    if (!window.confirm(`Delete user account "${username}"?`)) return;
    try {
      await api.delete(`/auth/users/${id}/`);
      fetchUsers();
    } catch (err) {
      console.error(err);
    }
  };

  const filteredUsers = users.filter((u) => {
    const matchesSearch =
      u.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (u.email && u.email.toLowerCase().includes(searchQuery.toLowerCase())) ||
      `${u.first_name} ${u.last_name}`.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesRole = roleFilter === 'all' || u.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  const adminCount = users.filter((u) => u.role === 'admin').length;
  const operatorCount = users.filter((u) => u.role === 'operator').length;
  const viewerCount = users.filter((u) => u.role === 'viewer').length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-[28px] font-bold text-[#0F172A] tracking-tight">
            User Accounts & Roles
          </h1>
          <p className="text-[14px] text-[#64748B] mt-0.5">
            Manage authorized operators, enforce role-based access control, and audit security credentials
          </p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-[#2563EB] hover:bg-[#1D4ED8] text-white font-medium text-[14px] shadow-sm transition-colors"
        >
          <Plus className="w-4 h-4" />
          Create User Account
        </button>
      </div>

      {/* Stats Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="bg-white border border-[#E2E8F0] rounded-xl p-4 shadow-sm flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-lg bg-[#EFF6FF] text-[#2563EB] flex items-center justify-center">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[12px] font-medium text-[#64748B] block">Total Accounts</span>
            <span className="text-[20px] font-bold text-[#0F172A]">{users.length}</span>
          </div>
        </div>

        <div className="bg-white border border-[#E2E8F0] rounded-xl p-4 shadow-sm flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-lg bg-[#F5F3FF] text-[#7C3AED] flex items-center justify-center">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[12px] font-medium text-[#64748B] block">Administrators</span>
            <span className="text-[20px] font-bold text-[#0F172A]">{adminCount}</span>
          </div>
        </div>

        <div className="bg-white border border-[#E2E8F0] rounded-xl p-4 shadow-sm flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-lg bg-[#EFF6FF] text-[#2563EB] flex items-center justify-center">
            <Sliders className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[12px] font-medium text-[#64748B] block">Operators</span>
            <span className="text-[20px] font-bold text-[#0F172A]">{operatorCount}</span>
          </div>
        </div>

        <div className="bg-white border border-[#E2E8F0] rounded-xl p-4 shadow-sm flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-lg bg-[#F8FAFC] text-[#64748B] flex items-center justify-center border border-[#E2E8F0]">
            <Eye className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[12px] font-medium text-[#64748B] block">Viewers</span>
            <span className="text-[20px] font-bold text-[#0F172A]">{viewerCount}</span>
          </div>
        </div>
      </div>

      {/* Role Permission Matrix Card */}
      <div className="bg-white border border-[#E2E8F0] rounded-xl p-5 shadow-sm">
        <h3 className="text-[16px] font-semibold text-[#0F172A] mb-3 flex items-center gap-2">
          <Shield className="w-4 h-4 text-[#2563EB]" />
          Platform Role Privilege Matrix
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div className="p-3.5 rounded-lg bg-[#F8FAFC] border border-[#E2E8F0]">
            <div className="flex items-center gap-2 mb-2">
              <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-[#F5F3FF] text-[#7C3AED] border border-[#DDD6FE] uppercase">
                Admin
              </span>
              <span className="text-[12px] font-semibold text-[#0F172A]">Full Control</span>
            </div>
            <ul className="text-[12px] text-[#64748B] space-y-1">
              <li className="flex items-center gap-1.5"><Check className="w-3.5 h-3.5 text-[#2563EB]" /> System configuration & AI engine tuning</li>
              <li className="flex items-center gap-1.5"><Check className="w-3.5 h-3.5 text-[#2563EB]" /> Manage user accounts & permissions</li>
              <li className="flex items-center gap-1.5"><Check className="w-3.5 h-3.5 text-[#2563EB]" /> Audit logs & security credentials</li>
            </ul>
          </div>

          <div className="p-3.5 rounded-lg bg-[#F8FAFC] border border-[#E2E8F0]">
            <div className="flex items-center gap-2 mb-2">
              <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-[#EFF6FF] text-[#2563EB] border border-[#BFDBFE] uppercase">
                Operator
              </span>
              <span className="text-[12px] font-semibold text-[#0F172A]">Operations & Analytics</span>
            </div>
            <ul className="text-[12px] text-[#64748B] space-y-1">
              <li className="flex items-center gap-1.5"><Check className="w-3.5 h-3.5 text-[#2563EB]" /> Add & configure RTSP / ONVIF streams</li>
              <li className="flex items-center gap-1.5"><Check className="w-3.5 h-3.5 text-[#2563EB]" /> Draw polygon zones & alert rules</li>
              <li className="flex items-center gap-1.5"><Check className="w-3.5 h-3.5 text-[#2563EB]" /> Upload recorded videos & run YOLO jobs</li>
            </ul>
          </div>

          <div className="p-3.5 rounded-lg bg-[#F8FAFC] border border-[#E2E8F0]">
            <div className="flex items-center gap-2 mb-2">
              <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-[#F1F5F9] text-[#64748B] border border-[#E2E8F0] uppercase">
                Viewer
              </span>
              <span className="text-[12px] font-semibold text-[#0F172A]">Read-Only Monitoring</span>
            </div>
            <ul className="text-[12px] text-[#64748B] space-y-1">
              <li className="flex items-center gap-1.5"><Check className="w-3.5 h-3.5 text-[#64748B]" /> Live camera stream multi-grid view</li>
              <li className="flex items-center gap-1.5"><Check className="w-3.5 h-3.5 text-[#64748B]" /> View detected objects & ReID history</li>
              <li className="flex items-center gap-1.5"><Check className="w-3.5 h-3.5 text-[#64748B]" /> Export analytics & security reports</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white border border-[#E2E8F0] rounded-xl p-4 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="flex flex-1 items-center gap-3 w-full sm:w-auto">
          <div className="relative flex-1 max-w-sm">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-[#64748B]" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by username or email..."
              className="w-full bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg pl-9 pr-3 py-2 text-[13px] text-[#0F172A] placeholder-[#64748B] focus:outline-none focus:border-[#2563EB] focus:ring-2 focus:ring-[#2563EB]/10 transition-colors"
            />
          </div>

          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg px-3 py-2 text-[13px] text-[#0F172A] focus:outline-none focus:border-[#2563EB] focus:ring-2 focus:ring-[#2563EB]/10 transition-colors"
          >
            <option value="all">All Roles</option>
            <option value="admin">Administrators</option>
            <option value="operator">Operators</option>
            <option value="viewer">Viewers</option>
          </select>
        </div>

        <button
          onClick={fetchUsers}
          className="inline-flex items-center gap-1.5 px-3 py-2 text-[13px] font-medium text-[#64748B] hover:text-[#0F172A] bg-[#F8FAFC] hover:bg-[#F1F5F9] border border-[#E2E8F0] rounded-lg transition-colors"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {/* Users Table */}
      <div className="bg-white border border-[#E2E8F0] rounded-xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-[14px]">
            <thead className="bg-[#F8FAFC] text-[#64748B] text-[12px] font-semibold uppercase tracking-wider border-b border-[#E2E8F0]">
              <tr>
                <th className="py-3 px-4">User</th>
                <th className="py-3 px-4">Email Address</th>
                <th className="py-3 px-4">Access Role</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Created Date</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E2E8F0]">
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-[14px] text-[#64748B]">
                    No user accounts match your filter criteria.
                  </td>
                </tr>
              ) : (
                filteredUsers.map((u) => (
                  <tr key={u.id} className="hover:bg-[#F8FAFC]/70 transition-colors">
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-3">
                        <div className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-[12px] uppercase ${
                          u.role === 'admin'
                            ? 'bg-[#F5F3FF] text-[#7C3AED] border border-[#DDD6FE]'
                            : u.role === 'operator'
                            ? 'bg-[#EFF6FF] text-[#2563EB] border border-[#BFDBFE]'
                            : 'bg-[#F1F5F9] text-[#64748B] border border-[#E2E8F0]'
                        }`}>
                          {u.username.slice(0, 2)}
                        </div>
                        <div>
                          <span className="font-semibold text-[#0F172A] block text-[14px]">
                            {u.first_name || u.last_name
                              ? `${u.first_name} ${u.last_name}`
                              : u.username}
                          </span>
                          <span className="text-[12px] text-[#64748B] font-mono">@{u.username}</span>
                        </div>
                      </div>
                    </td>

                    <td className="py-3.5 px-4 text-[13px] text-[#64748B] font-mono">
                      {u.email || <span className="text-[#CBD5E1]">Not provided</span>}
                    </td>

                    <td className="py-3.5 px-4">
                      <span
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[12px] font-semibold capitalize ${
                          u.role === 'admin'
                            ? 'bg-[#F5F3FF] text-[#7C3AED] border border-[#DDD6FE]'
                            : u.role === 'operator'
                            ? 'bg-[#EFF6FF] text-[#2563EB] border border-[#BFDBFE]'
                            : 'bg-[#F1F5F9] text-[#64748B] border border-[#E2E8F0]'
                        }`}
                      >
                        <Shield className="w-3 h-3" />
                        {u.role}
                      </span>
                    </td>

                    <td className="py-3.5 px-4">
                      <span className="inline-flex items-center gap-1.5 text-[12px] text-[#16A34A] font-medium">
                        <span className="w-2 h-2 rounded-full bg-[#16A34A]" />
                        Active
                      </span>
                    </td>

                    <td className="py-3.5 px-4 text-[13px] text-[#64748B] font-mono">
                      {new Date(u.date_joined).toLocaleDateString()}
                    </td>

                    <td className="py-3.5 px-4 text-right">
                      {u.username !== 'admin' ? (
                        <button
                          onClick={() => handleDelete(u.id, u.username)}
                          className="p-1.5 rounded-lg text-[#64748B] hover:text-[#DC2626] hover:bg-[#FEF2F2] transition-colors"
                          title="Delete User"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      ) : (
                        <span className="text-[11px] text-[#CBD5E1] italic">Default Superuser</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add User Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#0F172A]/40 backdrop-blur-sm">
          <div className="bg-white border border-[#E2E8F0] rounded-xl w-full max-w-md p-6 shadow-2xl">
            <div className="flex items-center justify-between pb-4 border-b border-[#E2E8F0]">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-[#EFF6FF] text-[#2563EB] flex items-center justify-center">
                  <UserIcon className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="text-[18px] font-bold text-[#0F172A]">Create User Account</h2>
                  <p className="text-[12px] text-[#64748B]">Add a security operator or administrator</p>
                </div>
              </div>
            </div>

            <form onSubmit={handleCreateUser} className="space-y-4 pt-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[12px] font-semibold text-[#0F172A] mb-1">First Name</label>
                  <input
                    type="text"
                    required
                    value={formData.first_name}
                    onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                    className="w-full bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg px-3 py-2 text-[13px] text-[#0F172A] focus:outline-none focus:border-[#2563EB] focus:ring-2 focus:ring-[#2563EB]/10"
                    placeholder="Jane"
                  />
                </div>
                <div>
                  <label className="block text-[12px] font-semibold text-[#0F172A] mb-1">Last Name</label>
                  <input
                    type="text"
                    value={formData.last_name}
                    onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                    className="w-full bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg px-3 py-2 text-[13px] text-[#0F172A] focus:outline-none focus:border-[#2563EB] focus:ring-2 focus:ring-[#2563EB]/10"
                    placeholder="Doe"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[12px] font-semibold text-[#0F172A] mb-1">Username</label>
                <input
                  type="text"
                  required
                  value={formData.username}
                  onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                  className="w-full bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg px-3 py-2 text-[13px] text-[#0F172A] focus:outline-none focus:border-[#2563EB] focus:ring-2 focus:ring-[#2563EB]/10"
                  placeholder="jdoe"
                />
              </div>

              <div>
                <label className="block text-[12px] font-semibold text-[#0F172A] mb-1">Email Address</label>
                <input
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg px-3 py-2 text-[13px] text-[#0F172A] focus:outline-none focus:border-[#2563EB] focus:ring-2 focus:ring-[#2563EB]/10"
                  placeholder="jdoe@security.org"
                />
              </div>

              <div>
                <label className="block text-[12px] font-semibold text-[#0F172A] mb-1">Initial Password</label>
                <input
                  type="password"
                  required
                  minLength={8}
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="w-full bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg px-3 py-2 text-[13px] text-[#0F172A] focus:outline-none focus:border-[#2563EB] focus:ring-2 focus:ring-[#2563EB]/10"
                  placeholder="Minimum 8 characters"
                />
              </div>

              <div>
                <label className="block text-[12px] font-semibold text-[#0F172A] mb-1">Access Role</label>
                <select
                  value={formData.role}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value as any })}
                  className="w-full bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg px-3 py-2 text-[13px] text-[#0F172A] focus:outline-none focus:border-[#2563EB] focus:ring-2 focus:ring-[#2563EB]/10"
                >
                  <option value="operator">Operator (Process videos, view live, configure cameras)</option>
                  <option value="viewer">Viewer (Read-only access to dashboards & reports)</option>
                  <option value="admin">Administrator (Full root access, modify system settings)</option>
                </select>
              </div>

              <div className="flex justify-end gap-2.5 pt-4 border-t border-[#E2E8F0]">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-lg bg-white hover:bg-[#F8FAFC] text-[#64748B] text-[13px] font-medium border border-[#E2E8F0] transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-[13px] font-medium shadow-sm transition-colors"
                >
                  Create Account
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
