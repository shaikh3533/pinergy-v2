import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { supabase } from '../../lib/supabase';
import type { User, Booking, Ad } from '../../lib/supabase';
import { formatDate } from '../../utils/dateUtils';
import { getLevelBadgeColor, calculateLevel } from '../../utils/ratingSystem';
import AdminSettings from './Settings';

const Admin = () => {
  const [activeTab, setActiveTab] = useState<'users' | 'bookings' | 'ads' | 'settings'>('users');
  const [users, setUsers] = useState<User[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [ads, setAds] = useState<Ad[]>([]);
  const [loading, setLoading] = useState(true);

  // Ad Form State
  const [adForm, setAdForm] = useState({
    title: '',
    description: '',
    image: '',
    link: '',
  });
  const [editingAd, setEditingAd] = useState<string | null>(null);

  useEffect(() => {
    fetchData();
  }, [activeTab]);

  const fetchData = async () => {
    setLoading(true);
    try {
      if (activeTab === 'users') {
        const { data, error } = await supabase
          .from('users')
          .select('*')
          .order('created_at', { ascending: false });
        if (error) throw error;
        setUsers(data || []);
      } else if (activeTab === 'bookings') {
        const { data, error } = await supabase
          .from('bookings')
          .select('*, user:user_id(name, email)')
          .order('created_at', { ascending: false });
        if (error) throw error;
        setBookings(data || []);
      } else if (activeTab === 'ads') {
        const { data, error } = await supabase
          .from('ads')
          .select('*')
          .order('created_at', { ascending: false });
        if (error) throw error;
        setAds(data || []);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleApproveUser = async (userId: string, approved: boolean) => {
    try {
      const { error } = await supabase
        .from('users')
        .update({ approved })
        .eq('id', userId);

      if (error) throw error;
      fetchData();
    } catch (error) {
      console.error('Error updating user:', error);
      toast.error('Failed to update user');
    }
  };

  const handleUpdateUserLevel = async (userId: string, ratingPoints: number) => {
    try {
      const level = calculateLevel(ratingPoints);
      const { error } = await supabase
        .from('users')
        .update({ rating_points: ratingPoints, level })
        .eq('id', userId);

      if (error) throw error;
      fetchData();
    } catch (error) {
      console.error('Error updating user level:', error);
      toast.error('Failed to update user level');
    }
  };

  const handleSaveAd = async () => {
    try {
      if (editingAd) {
        const { error } = await supabase
          .from('ads')
          .update(adForm)
          .eq('id', editingAd);
        if (error) throw error;
        toast.success('Ad updated successfully!');
      } else {
        const { error } = await supabase.from('ads').insert(adForm);
        if (error) throw error;
        toast.success('Ad created successfully!');
      }

      setAdForm({ title: '', description: '', image: '', link: '' });
      setEditingAd(null);
      fetchData();
    } catch (error) {
      console.error('Error saving ad:', error);
      toast.error('Failed to save ad');
    }
  };

  const handleEditAd = (ad: Ad) => {
    setEditingAd(ad.id);
    setAdForm({
      title: ad.title,
      description: ad.description,
      image: ad.image || '',
      link: ad.link || '',
    });
  };

  const handleDeleteAd = async (adId: string) => {
    try {
      const { error } = await supabase.from('ads').delete().eq('id', adId);
      if (error) throw error;
      toast.success('Ad deleted successfully! 🗑️');
      fetchData();
    } catch (error) {
      console.error('Error deleting ad:', error);
      toast.error('Failed to delete ad');
    }
  };

  return (
    <div className="min-h-screen py-12 px-4">
      <div className="max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-white mb-2">Admin Dashboard</h1>
            <p className="text-gray-400">Manage users, bookings, and advertisements</p>
          </div>

          {/* Tabs */}
          <div className="flex gap-4 mb-8 justify-center">
            <button
              onClick={() => setActiveTab('users')}
              className={`px-6 py-3 rounded-lg font-semibold transition ${
                activeTab === 'users'
                  ? 'bg-primary-blue text-white'
                  : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
              }`}
            >
              Users
            </button>
            <button
              onClick={() => setActiveTab('bookings')}
              className={`px-6 py-3 rounded-lg font-semibold transition ${
                activeTab === 'bookings'
                  ? 'bg-primary-blue text-white'
                  : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
              }`}
            >
              Bookings
            </button>
            <button
              onClick={() => setActiveTab('ads')}
              className={`px-6 py-3 rounded-lg font-semibold transition ${
                activeTab === 'ads'
                  ? 'bg-primary-blue text-white'
                  : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
              }`}
            >
              Ads & Events
            </button>
            <button
              onClick={() => setActiveTab('settings')}
              className={`px-6 py-3 rounded-lg font-semibold transition ${
                activeTab === 'settings'
                  ? 'bg-primary-blue text-white'
                  : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
              }`}
            >
              ⚙️ Settings
            </button>
          </div>

          {loading ? (
            <div className="text-center text-white py-12">Loading...</div>
          ) : (
            <>
              {/* Users Tab */}
              {activeTab === 'users' && (
                <div className="card">
                  <h2 className="text-2xl font-bold text-white mb-6">User Management</h2>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-gray-700">
                          <th className="text-left py-3 px-4 text-gray-400">Name</th>
                          <th className="text-left py-3 px-4 text-gray-400">Email</th>
                          <th className="text-left py-3 px-4 text-gray-400">Level</th>
                          <th className="text-left py-3 px-4 text-gray-400">Points</th>
                          <th className="text-left py-3 px-4 text-gray-400">Hours</th>
                          <th className="text-left py-3 px-4 text-gray-400">Status</th>
                          <th className="text-left py-3 px-4 text-gray-400">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {users.map((user) => (
                          <tr key={user.id} className="border-b border-gray-800 hover:bg-gray-800">
                            <td className="py-3 px-4 text-white">{user.name}</td>
                            <td className="py-3 px-4 text-gray-400">{user.email || 'N/A'}</td>
                            <td className="py-3 px-4">
                              <span className={`${getLevelBadgeColor(user.level)} text-white px-2 py-1 rounded text-sm`}>
                                {user.level}
                              </span>
                            </td>
                            <td className="py-3 px-4">
                              <input
                                type="number"
                                value={user.rating_points}
                                onChange={(e) => {
                                  const newPoints = parseInt(e.target.value) || 0;
                                  handleUpdateUserLevel(user.id, newPoints);
                                }}
                                className="w-20 px-2 py-1 bg-gray-700 text-white rounded border border-gray-600"
                              />
                            </td>
                            <td className="py-3 px-4 text-gray-300">
                              {user.total_hours_played.toFixed(1)}h
                            </td>
                            <td className="py-3 px-4">
                              <span
                                className={`px-2 py-1 rounded text-sm ${
                                  user.approved
                                    ? 'bg-green-600 text-white'
                                    : 'bg-red-600 text-white'
                                }`}
                              >
                                {user.approved ? 'Approved' : 'Pending'}
                              </span>
                            </td>
                            <td className="py-3 px-4">
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
                  </div>
                </div>
              )}

              {/* Bookings Tab */}
              {activeTab === 'bookings' && (
                <div className="card">
                  <h2 className="text-2xl font-bold text-white mb-6">All Bookings</h2>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-gray-700">
                          <th className="text-left py-3 px-4 text-gray-400">User</th>
                          <th className="text-left py-3 px-4 text-gray-400">Table</th>
                          <th className="text-left py-3 px-4 text-gray-400">Date & Time</th>
                          <th className="text-left py-3 px-4 text-gray-400">Duration</th>
                          <th className="text-left py-3 px-4 text-gray-400">Coaching</th>
                          <th className="text-left py-3 px-4 text-gray-400">Price</th>
                        </tr>
                      </thead>
                      <tbody>
                        {bookings.map((booking) => (
                          <tr key={booking.id} className="border-b border-gray-800 hover:bg-gray-800">
                            <td className="py-3 px-4 text-white">
                              {(booking.user as any)?.name || 'Unknown'}
                            </td>
                            <td className="py-3 px-4 text-gray-300">{booking.table_type}</td>
                            <td className="py-3 px-4 text-gray-300">
                              {formatDate(booking.date)}<br />
                              <span className="text-xs">{booking.start_time} - {booking.end_time}</span>
                            </td>
                            <td className="py-3 px-4 text-gray-300">
                              {booking.slot_duration} min
                            </td>
                            <td className="py-3 px-4">
                              {booking.coaching ? (
                                <span className="text-green-400">Yes</span>
                              ) : (
                                <span className="text-gray-500">No</span>
                              )}
                            </td>
                            <td className="py-3 px-4 text-primary-blue font-bold">
                              ₹{booking.price}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Ads Tab */}
              {activeTab === 'ads' && (
                <div className="space-y-8">
                  <div className="card">
                    <h2 className="text-2xl font-bold text-white mb-6">
                      {editingAd ? 'Edit Ad' : 'Create New Ad'}
                    </h2>
                    <div className="space-y-4">
                      <div>
                        <label className="label">Title</label>
                        <input
                          type="text"
                          value={adForm.title}
                          onChange={(e) => setAdForm({ ...adForm, title: e.target.value })}
                          className="input-field"
                          placeholder="Ad title"
                        />
                      </div>
                      <div>
                        <label className="label">Description</label>
                        <textarea
                          value={adForm.description}
                          onChange={(e) => setAdForm({ ...adForm, description: e.target.value })}
                          className="input-field"
                          rows={3}
                          placeholder="Ad description"
                        />
                      </div>
                      <div>
                        <label className="label">Image URL (Optional)</label>
                        <input
                          type="text"
                          value={adForm.image}
                          onChange={(e) => setAdForm({ ...adForm, image: e.target.value })}
                          className="input-field"
                          placeholder="https://example.com/image.jpg"
                        />
                      </div>
                      <div>
                        <label className="label">Link (Optional)</label>
                        <input
                          type="text"
                          value={adForm.link}
                          onChange={(e) => setAdForm({ ...adForm, link: e.target.value })}
                          className="input-field"
                          placeholder="https://example.com"
                        />
                      </div>
                      <div className="flex gap-4">
                        <button onClick={handleSaveAd} className="btn-primary">
                          {editingAd ? 'Update Ad' : 'Create Ad'}
                        </button>
                        {editingAd && (
                          <button
                            onClick={() => {
                              setEditingAd(null);
                              setAdForm({ title: '', description: '', image: '', link: '' });
                            }}
                            className="btn-secondary"
                          >
                            Cancel
                          </button>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="card">
                    <h2 className="text-2xl font-bold text-white mb-6">Current Ads</h2>
                    <div className="grid md:grid-cols-2 gap-4">
                      {ads.map((ad) => (
                        <div key={ad.id} className="bg-gray-800 rounded-lg p-4">
                          {ad.image && (
                            <img
                              src={ad.image}
                              alt={ad.title}
                              className="w-full h-40 object-cover rounded-lg mb-4"
                            />
                          )}
                          <h3 className="text-xl font-bold text-white mb-2">{ad.title}</h3>
                          <p className="text-gray-400 mb-4">{ad.description}</p>
                          {ad.link && (
                            <a
                              href={ad.link}
                              className="text-primary-blue hover:text-blue-400 text-sm"
                              target="_blank"
                              rel="noopener noreferrer"
                            >
                              View Link →
                            </a>
                          )}
                          <div className="flex gap-2 mt-4">
                            <button
                              onClick={() => handleEditAd(ad)}
                              className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded text-sm transition"
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => handleDeleteAd(ad.id)}
                              className="px-3 py-1 bg-red-600 hover:bg-red-700 text-white rounded text-sm transition"
                            >
                              Delete
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Settings Tab */}
              {activeTab === 'settings' && <AdminSettings />}
            </>
          )}
        </motion.div>
      </div>
    </div>
  );
};

export default Admin;

