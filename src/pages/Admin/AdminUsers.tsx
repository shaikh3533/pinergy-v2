import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { supabase } from '../../lib/supabase';
import type { User } from '../../lib/supabase';
import { getLevelBadgeColor, calculateLevel } from '../../utils/ratingSystem';
import AdminLayout from '../../components/Admin/AdminLayout';

const AdminUsers = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

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

  const filteredUsers = users.filter(u =>
    u.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.phone?.includes(searchTerm)
  );

  return (
    <AdminLayout title="User Management" subtitle="Manage player accounts and approvals">
      {/* Search */}
      <div className="mb-6">
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Search by name, email, or phone..."
          className="input-field max-w-md"
        />
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
                        user.approved ? 'bg-green-600 text-white' : 'bg-red-600 text-white'
                      }`}>
                        {user.approved ? 'Approved' : 'Pending'}
                      </span>
                    </td>
                    <td className="py-4 px-4">
                      <button
                        onClick={() => handleApproveUser(user.id, !user.approved)}
                        className={`px-3 py-1 rounded text-sm ${
                          user.approved
                            ? 'bg-red-600 hover:bg-red-700'
                            : 'bg-green-600 hover:bg-green-700'
                        } text-white transition`}
                      >
                        {user.approved ? 'Revoke' : 'Approve'}
                      </button>
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
    </AdminLayout>
  );
};

export default AdminUsers;
