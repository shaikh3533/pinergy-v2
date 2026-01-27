import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { FaEdit, FaTimes, FaSave, FaSearch, FaTrash } from 'react-icons/fa';
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
  });

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
    });
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

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
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
    </AdminLayout>
  );
};

export default AdminUsers;
