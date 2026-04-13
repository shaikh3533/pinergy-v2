import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { FaEdit, FaTimes, FaSave, FaSearch, FaTrash, FaPlus, FaKey, FaEnvelope, FaUser } from 'react-icons/fa';
import { supabase } from '../../lib/supabase';
import type { User } from '../../lib/supabase';
import { getLevelBadgeColor, calculateLevel } from '../../utils/ratingSystem';
import AdminLayout from '../../components/Admin/AdminLayout';

const AdminUsers = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Edit modal state
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [editForm, setEditForm] = useState({
    name: '',
    email: '',
    phone: '',
    newPassword: '',
  });

  // Create user modal state
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createForm, setCreateForm] = useState({
    name: '',
    email: '',
    phone: '',
    password: '123456',
  });
  const [creating, setCreating] = useState(false);

  // Auto-generate email from name
  const generateEmailFromName = (name: string): string => {
    if (!name.trim()) return '';
    // Remove special characters, convert to lowercase, remove spaces
    const username = name.toLowerCase().replace(/[^a-z0-9]/g, '');
    return `${username}@gmail.com`;
  };

  // Handle name change and auto-generate email
  const handleNameChange = (name: string) => {
    const email = generateEmailFromName(name);
    setCreateForm({
      ...createForm,
      name,
      email,
    });
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error('Error fetching users:', error);
    } else {
      setUsers(data || []);
    }
    setLoading(false);
  };

  const handleApproveUser = async (userId: string, approved: boolean) => {
    const { error } = await supabase
      .from('users')
      .update({ approved })
      .eq('id', userId);

    if (error) {
      toast.error('Failed to update user');
    } else {
      fetchUsers();
      toast.success(approved ? 'User approved' : 'User approval revoked');
    }
  };

  const handleUpdateUserLevel = async (userId: string, ratingPoints: number) => {
    const level = calculateLevel(ratingPoints);
    const { error } = await supabase
      .from('users')
      .update({ rating_points: ratingPoints, level })
      .eq('id', userId);

    if (error) {
      toast.error('Failed to update user level');
    } else {
      fetchUsers();
    }
  };

  const openEditModal = (user: User) => {
    setEditingUser(user);
    setEditForm({
      name: user.name || '',
      email: user.email || '',
      phone: user.phone || '',
      newPassword: '',
    });
  };

  // Create new user with email/password
  const handleCreateUser = async () => {
    if (!createForm.name.trim()) {
      toast.error('Name is required');
      return;
    }
    if (!createForm.email.trim()) {
      toast.error('Email is required for login');
      return;
    }
    if (!createForm.password || createForm.password.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }

    setCreating(true);

    try {
      // Create auth user with signup
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: createForm.email.trim(),
        password: createForm.password,
        options: {
          data: {
            name: createForm.name.trim(),
          },
        },
      });

      if (authError) {
        toast.error(`Failed to create account: ${authError.message}`);
        setCreating(false);
        return;
      }

      if (authData.user) {
        // Create or update user profile in users table
        const { error: profileError } = await supabase.from('users').upsert({
          id: authData.user.id,
          name: createForm.name.trim(),
          email: createForm.email.trim(),
          phone: createForm.phone.trim() || null,
          approved: true,
          role: 'player',
          level: 'Noob',
          rating_points: 0,
          hours_played: 0,
        });

        if (profileError) {
          console.error('Profile error:', profileError);
          toast.error('Account created but profile setup failed');
        } else {
          toast.success(`User "${createForm.name}" created! Login: ${createForm.email} / ${createForm.password}`);
          setShowCreateModal(false);
          setCreateForm({ name: '', email: '', phone: '', password: '123456' });
          fetchUsers();
        }
      }
    } catch (err) {
      console.error('Error creating user:', err);
      toast.error('An unexpected error occurred');
    }

    setCreating(false);
  };

  // Send password reset email
  const handleSendPasswordReset = async (email: string) => {
    if (!email) {
      toast.error('User has no email address');
      return;
    }

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/reset-password`,
    });

    if (error) {
      toast.error(`Failed to send reset email: ${error.message}`);
    } else {
      toast.success(`Password reset email sent to ${email}`);
    }
  };

  const handleSaveEdit = async () => {
    if (!editingUser) return;
    
    if (!editForm.name.trim()) {
      toast.error('Name is required');
      return;
    }

    const { error } = await supabase
      .from('users')
      .update({
        name: editForm.name.trim(),
        email: editForm.email.trim() || null,
        phone: editForm.phone.trim() || null,
      })
      .eq('id', editingUser.id);

    if (error) {
      console.error('Error updating user:', error);
      toast.error('Failed to update user');
    } else {
      toast.success('User updated successfully');
      setEditingUser(null);
      fetchUsers();
    }
  };

  const handleDeleteUser = async (user: User) => {
    if (user.role === 'admin') {
      toast.error('Cannot delete admin users');
      return;
    }
    
    if (!confirm(`Delete user "${user.name}"? This action cannot be undone.`)) return;

    const { error } = await supabase
      .from('users')
      .delete()
      .eq('id', user.id);

    if (error) {
      toast.error('Failed to delete user');
    } else {
      toast.success('User deleted');
      fetchUsers();
    }
  };

  const filteredUsers = users.filter(u =>
    u.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.phone?.includes(searchTerm)
  );

  return (
    <AdminLayout title="User Management" subtitle="Manage player accounts and approvals">
      {/* Search */}
      <div className="mb-6">
        <div className="relative max-w-md">
          <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by name, email, or phone..."
            className="input-field pl-10"
          />
        </div>
      </div>

      {/* Header with Create Button */}
      <div className="flex justify-between items-center mb-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 flex-1 mr-4">
          <div className="bg-gray-800 rounded-xl p-4">
            <div className="text-2xl font-bold text-white">{users.length}</div>
            <div className="text-gray-400 text-sm">Total Users</div>
          </div>
          <div className="bg-gray-800 rounded-xl p-4">
            <div className="text-2xl font-bold text-green-400">{users.filter(u => u.approved).length}</div>
            <div className="text-gray-400 text-sm">Approved</div>
          </div>
          <div className="bg-gray-800 rounded-xl p-4">
            <div className="text-2xl font-bold text-yellow-400">{users.filter(u => !u.approved).length}</div>
            <div className="text-gray-400 text-sm">Pending</div>
          </div>
          <div className="bg-gray-800 rounded-xl p-4">
            <div className="text-2xl font-bold text-primary-blue">{users.filter(u => u.role === 'admin').length}</div>
            <div className="text-gray-400 text-sm">Admins</div>
          </div>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="px-4 py-3 bg-green-600 hover:bg-green-700 text-white rounded-xl flex items-center gap-2 transition font-semibold whitespace-nowrap"
        >
          <FaPlus /> Create User
        </button>
      </div>

      {/* Users Table */}
      <div className="card overflow-hidden">
        {loading ? (
          <div className="text-center text-gray-400 py-12">Loading users...</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-700 bg-gray-800/50">
                  <th className="text-left py-4 px-4 text-gray-400 font-semibold">Name</th>
                  <th className="text-left py-4 px-4 text-gray-400 font-semibold">Contact</th>
                  <th className="text-left py-4 px-4 text-gray-400 font-semibold">Level</th>
                  <th className="text-left py-4 px-4 text-gray-400 font-semibold">Points</th>
                  <th className="text-left py-4 px-4 text-gray-400 font-semibold">Hours</th>
                  <th className="text-left py-4 px-4 text-gray-400 font-semibold">Status</th>
                  <th className="text-left py-4 px-4 text-gray-400 font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map((user) => (
                  <tr key={user.id} className="border-b border-gray-800 hover:bg-gray-800/50">
                    <td className="py-4 px-4">
                      <div className="font-semibold text-white">{user.name}</div>
                      {user.role === 'admin' && (
                        <span className="text-xs text-primary-blue">Admin</span>
                      )}
                    </td>
                    <td className="py-4 px-4">
                      <div className="text-gray-400 text-sm">{user.email || '-'}</div>
                      <div className="text-gray-500 text-xs">{user.phone || '-'}</div>
                    </td>
                    <td className="py-4 px-4">
                      <span className={`${getLevelBadgeColor(user.level)} text-white px-2 py-1 rounded text-sm`}>
                        {user.level}
                      </span>
                    </td>
                    <td className="py-4 px-4">
                      <input
                        type="number"
                        value={user.rating_points}
                        onChange={(e) => handleUpdateUserLevel(user.id, parseInt(e.target.value) || 0)}
                        className="w-20 px-2 py-1 bg-gray-700 text-white rounded border border-gray-600 text-sm"
                      />
                    </td>
                    <td className="py-4 px-4 text-gray-300">
                      {user.total_hours_played.toFixed(1)}h
                    </td>
                    <td className="py-4 px-4">
                      <span className={`px-2 py-1 rounded text-xs font-semibold ${
                        user.approved ? 'bg-green-600 text-white' : 'bg-yellow-600 text-white'
                      }`}>
                        {user.approved ? 'Approved' : 'Pending'}
                      </span>
                    </td>
                    <td className="py-4 px-4">
                      <div className="flex gap-2">
                        <Link
                          to={`/players/${user.id}`}
                          className="p-2 bg-gray-700 hover:bg-gray-600 text-white rounded transition"
                          title="View player portfolio"
                        >
                          <FaUser />
                        </Link>
                        <button
                          onClick={() => openEditModal(user)}
                          className="p-2 bg-blue-600 hover:bg-blue-700 text-white rounded transition"
                          title="Edit user"
                        >
                          <FaEdit />
                        </button>
                        <button
                          onClick={() => handleApproveUser(user.id, !user.approved)}
                          className={`px-3 py-1 rounded text-sm ${
                            user.approved
                              ? 'bg-yellow-600 hover:bg-yellow-700'
                              : 'bg-green-600 hover:bg-green-700'
                          } text-white transition`}
                        >
                          {user.approved ? 'Revoke' : 'Approve'}
                        </button>
                        {user.role !== 'admin' && (
                          <button
                            onClick={() => handleDeleteUser(user)}
                            className="p-2 bg-red-600 hover:bg-red-700 text-white rounded transition"
                            title="Delete user"
                          >
                            <FaTrash />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {filteredUsers.length === 0 && (
              <div className="text-center text-gray-400 py-8">
                {searchTerm ? 'No users found matching your search' : 'No users found'}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Edit User Modal */}
      {editingUser && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-900 rounded-2xl w-full max-w-md">
            <div className="flex items-center justify-between p-6 border-b border-gray-800">
              <h3 className="text-xl font-bold text-white">Edit User</h3>
              <button
                onClick={() => setEditingUser(null)}
                className="p-2 text-gray-400 hover:text-white transition"
              >
                <FaTimes />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="label">Name *</label>
                <input
                  type="text"
                  value={editForm.name}
                  onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                  className="input-field"
                  placeholder="Full name"
                />
              </div>

              <div>
                <label className="label">Email</label>
                <input
                  type="email"
                  value={editForm.email}
                  onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                  className="input-field"
                  placeholder="email@example.com"
                />
              </div>

              <div>
                <label className="label">Phone</label>
                <input
                  type="tel"
                  value={editForm.phone}
                  onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                  className="input-field"
                  placeholder="03XX-XXXXXXX"
                />
              </div>

              {/* Password Reset Section */}
              <div className="pt-4 border-t border-gray-700">
                <label className="label flex items-center gap-2">
                  <FaKey className="text-yellow-500" /> Password Management
                </label>
                <p className="text-gray-500 text-sm mb-3">
                  Send a password reset email to the user so they can set a new password.
                </p>
                <button
                  type="button"
                  onClick={() => handleSendPasswordReset(editForm.email)}
                  disabled={!editForm.email}
                  className="w-full px-4 py-2 bg-yellow-600 hover:bg-yellow-700 disabled:bg-gray-700 disabled:text-gray-500 text-white rounded-lg flex items-center justify-center gap-2 transition"
                >
                  <FaEnvelope /> Send Password Reset Email
                </button>
              </div>
            </div>

            <div className="flex justify-end gap-3 p-6 border-t border-gray-800">
              <button
                onClick={() => setEditingUser(null)}
                className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveEdit}
                className="px-4 py-2 bg-primary-blue hover:bg-blue-600 text-white rounded-lg flex items-center gap-2 transition"
              >
                <FaSave /> Save Changes
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create User Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-900 rounded-2xl w-full max-w-md">
            <div className="flex items-center justify-between p-6 border-b border-gray-800">
              <h3 className="text-xl font-bold text-white flex items-center gap-2">
                <FaPlus className="text-green-500" /> Create New User
              </h3>
              <button
                onClick={() => setShowCreateModal(false)}
                className="p-2 text-gray-400 hover:text-white transition"
              >
                <FaTimes />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <p className="text-gray-400 text-sm mb-4">
                Create a new user account. Email and password are auto-generated but can be edited.
              </p>

              <div>
                <label className="label">Name *</label>
                <input
                  type="text"
                  value={createForm.name}
                  onChange={(e) => handleNameChange(e.target.value)}
                  className="input-field"
                  placeholder="Full name (email will be auto-generated)"
                />
              </div>

              <div>
                <label className="label">Email * (for login) - Auto-generated</label>
                <input
                  type="email"
                  value={createForm.email}
                  onChange={(e) => setCreateForm({ ...createForm, email: e.target.value })}
                  className="input-field"
                  placeholder="user@gmail.com"
                />
                <p className="text-gray-500 text-xs mt-1">
                  Auto-generated from name. Edit if needed.
                </p>
              </div>

              <div>
                <label className="label">Phone</label>
                <input
                  type="tel"
                  value={createForm.phone}
                  onChange={(e) => setCreateForm({ ...createForm, phone: e.target.value })}
                  className="input-field"
                  placeholder="03XX-XXXXXXX"
                />
              </div>

              <div>
                <label className="label flex items-center gap-2">
                  <FaKey className="text-yellow-500" /> Password (default: 123456)
                </label>
                <input
                  type="text"
                  value={createForm.password}
                  onChange={(e) => setCreateForm({ ...createForm, password: e.target.value })}
                  className="input-field"
                  placeholder="Password"
                />
                <p className="text-gray-500 text-xs mt-1">
                  Default is 123456. User can change it from their dashboard.
                </p>
              </div>

              {/* Login Info Summary */}
              {createForm.name && (
                <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
                  <h4 className="text-sm font-semibold text-white mb-2">Login Credentials to share:</h4>
                  <div className="text-sm space-y-1">
                    <p className="text-gray-300">
                      <span className="text-gray-500">Email:</span> {createForm.email || 'N/A'}
                    </p>
                    <p className="text-gray-300">
                      <span className="text-gray-500">Password:</span> {createForm.password}
                    </p>
                  </div>
                </div>
              )}
            </div>

            <div className="flex justify-end gap-3 p-6 border-t border-gray-800">
              <button
                onClick={() => setShowCreateModal(false)}
                className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateUser}
                disabled={creating}
                className="px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-600 text-white rounded-lg flex items-center gap-2 transition"
              >
                {creating ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white"></div>
                ) : (
                  <FaPlus />
                )}
                Create User
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
};

export default AdminUsers;
