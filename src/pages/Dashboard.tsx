import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { FaEdit, FaTimes, FaSave, FaTrophy, FaKey, FaEye, FaEyeSlash } from 'react-icons/fa';
import { supabase } from '../lib/supabase';
import type { Booking, Match, LeagueMatch } from '../lib/supabase';
import { useAuthStore } from '../store/authStore';
import { formatDate } from '../utils/dateUtils';
import { getLevelBadgeColor } from '../utils/ratingSystem';

interface TournamentRegistration {
  id: string;
  league_id: string;
  league: {
    id: string;
    name: string;
    status: string;
    date?: string;
  };
}

const Dashboard = () => {
  const { user, updateProfile } = useAuthStore();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [matches, setMatches] = useState<Match[]>([]);
  const [leagueMatches, setLeagueMatches] = useState<LeagueMatch[]>([]);
  const [registeredTournaments, setRegisteredTournaments] = useState<TournamentRegistration[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  
  // Profile editing state
  const [showEditModal, setShowEditModal] = useState(false);
  const [editForm, setEditForm] = useState({
    name: '',
    email: '',
    phone: '',
  });
  const [saving, setSaving] = useState(false);

  // Password change state
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [changingPassword, setChangingPassword] = useState(false);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);

  useEffect(() => {
    if (user) {
      fetchData();
    }
  }, [user]);

  const fetchData = async () => {
    if (!user) return;

    try {
      // Fetch bookings
      const { data: bookingsData, error: bookingsError } = await supabase
        .from('bookings')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(10);

      if (bookingsError) throw bookingsError;
      setBookings(bookingsData || []);

      // Fetch casual matches
      const { data: matchesData, error: matchesError } = await supabase
        .from('matches')
        .select('*, player1:player1_id(name), player2:player2_id(name), winner:winner_id(name)')
        .or(`player1_id.eq.${user.id},player2_id.eq.${user.id}`)
        .order('played_on', { ascending: false })
        .limit(10);

      if (matchesError) throw matchesError;
      setMatches(matchesData || []);

      // Fetch tournament registrations
      const { data: tournamentsData } = await supabase
        .from('league_players')
        .select('id, league_id, league:league_id(id, name, status, date)')
        .eq('player_id', user.id)
        .order('created_at', { ascending: false });

      if (tournamentsData) {
        setRegisteredTournaments(tournamentsData as unknown as TournamentRegistration[]);
      }

      // Fetch tournament matches
      const { data: leagueMatchesData } = await supabase
        .from('league_matches')
        .select('*, player1:player1_id(id, name), player2:player2_id(id, name), winner:winner_id(id, name), league:league_id(id, name)')
        .or(`player1_id.eq.${user.id},player2_id.eq.${user.id}`)
        .order('created_at', { ascending: false })
        .limit(10);

      if (leagueMatchesData) {
        setLeagueMatches(leagueMatchesData as unknown as LeagueMatch[]);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const openEditModal = () => {
    if (user) {
      setEditForm({
        name: user.name || '',
        email: user.email || '',
        phone: user.phone || '',
      });
      setShowEditModal(true);
    }
  };

  const handleSaveProfile = async () => {
    if (!user) return;
    
    if (!editForm.name.trim()) {
      toast.error('Name is required');
      return;
    }

    setSaving(true);

    try {
      const { error } = await supabase
        .from('users')
        .update({
          name: editForm.name.trim(),
          email: editForm.email.trim() || null,
          phone: editForm.phone.trim() || null,
        })
        .eq('id', user.id);

      if (error) throw error;

      // Update local state
      await updateProfile({
        name: editForm.name.trim(),
        email: editForm.email.trim() || undefined,
        phone: editForm.phone.trim() || undefined,
      });

      toast.success('Profile updated successfully!');
      setShowEditModal(false);
    } catch (error) {
      console.error('Error updating profile:', error);
      toast.error('Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword = async () => {
    if (!passwordForm.newPassword || passwordForm.newPassword.length < 6) {
      toast.error('New password must be at least 6 characters');
      return;
    }

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    setChangingPassword(true);

    try {
      const { error } = await supabase.auth.updateUser({
        password: passwordForm.newPassword,
      });

      if (error) {
        toast.error(`Failed to change password: ${error.message}`);
      } else {
        toast.success('Password changed successfully!');
        setShowPasswordModal(false);
        setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
      }
    } catch (err) {
      console.error('Error changing password:', err);
      toast.error('An unexpected error occurred');
    }

    setChangingPassword(false);
  };

  const handleProfilePicUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || !e.target.files[0] || !user) return;

    const file = e.target.files[0];
    
    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error('Please upload an image file');
      return;
    }

    // Validate file size (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      toast.error('Image size should be less than 2MB');
      return;
    }

    setUploading(true);

    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `profile-${Date.now()}.${fileExt}`;
      // Store in user's folder: userId/filename
      const filePath = `${user.id}/${fileName}`;

      // Delete old profile picture if exists
      if (user.profile_pic) {
        const oldFilePath = user.profile_pic.split('/').slice(-2).join('/');
        await supabase.storage.from('profile_pics').remove([oldFilePath]);
      }

      // Upload new profile picture
      const { error: uploadError } = await supabase.storage
        .from('profile_pics')
        .upload(filePath, file, { 
          cacheControl: '3600',
          upsert: true 
        });

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: publicUrlData } = supabase.storage
        .from('profile_pics')
        .getPublicUrl(filePath);

      // Update user profile
      await updateProfile({ profile_pic: publicUrlData.publicUrl });
      
      toast.success('Profile picture updated! 🎉');
    } catch (error: any) {
      console.error('Error uploading profile picture:', error.message);
      toast.error(`Upload failed: ${error.message}`);
    } finally {
      setUploading(false);
    }
  };

  if (loading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-white text-xl">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-12 px-4">
      <div className="max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          {/* Profile Section */}
          <div className="card mb-8">
            <div className="flex flex-col md:flex-row items-center md:items-start gap-6">
              <div className="relative">
                <div className="w-32 h-32 rounded-full bg-primary-blue flex items-center justify-center overflow-hidden">
                  {user.profile_pic ? (
                    <img
                      src={user.profile_pic}
                      alt={user.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span className="text-5xl text-white font-bold">
                      {user.name.charAt(0).toUpperCase()}
                    </span>
                  )}
                </div>
                <label
                  htmlFor="profile-pic"
                  className={`absolute bottom-0 right-0 bg-primary-red rounded-full p-2 transition ${
                    uploading 
                      ? 'cursor-not-allowed opacity-50' 
                      : 'cursor-pointer hover:bg-red-600'
                  }`}
                  title={uploading ? 'Uploading...' : 'Change profile picture'}
                >
                  {uploading ? (
                    <svg className="w-5 h-5 text-white animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                  ) : (
                    <svg
                      className="w-5 h-5 text-white"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"
                      />
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"
                      />
                    </svg>
                  )}
                </label>
                <input
                  id="profile-pic"
                  type="file"
                  accept="image/*"
                  onChange={handleProfilePicUpload}
                  className="hidden"
                  disabled={uploading}
                />
                {uploading && (
                  <div className="absolute -bottom-8 left-1/2 transform -translate-x-1/2 whitespace-nowrap">
                    <span className="text-xs text-primary-blue font-semibold">Uploading...</span>
                  </div>
                )}
              </div>

              <div className="flex-1 text-center md:text-left">
                <div className="flex items-center justify-center md:justify-start gap-3 mb-2">
                  <h1 className="text-3xl font-bold text-white">{user.name}</h1>
                  <button
                    onClick={openEditModal}
                    className="p-2 bg-gray-700 hover:bg-gray-600 text-gray-300 hover:text-white rounded-lg transition"
                    title="Edit profile"
                  >
                    <FaEdit />
                  </button>
                  <button
                    onClick={() => setShowPasswordModal(true)}
                    className="p-2 bg-gray-700 hover:bg-yellow-600 text-gray-300 hover:text-white rounded-lg transition"
                    title="Change password"
                  >
                    <FaKey />
                  </button>
                </div>
                <p className="text-gray-400 mb-1">{user.email}</p>
                {user.phone && <p className="text-gray-500 text-sm mb-4">{user.phone}</p>}
                
                <div className="flex flex-wrap gap-4 justify-center md:justify-start">
                  <div className="bg-gray-800 rounded-lg px-4 py-2">
                    <div className="text-gray-400 text-sm">Rating Points</div>
                    <div className="text-2xl font-bold text-primary-blue">{user.rating_points}</div>
                  </div>
                  
                  <div className="bg-gray-800 rounded-lg px-4 py-2">
                    <div className="text-gray-400 text-sm">Level</div>
                    <div className={`text-lg font-bold ${getLevelBadgeColor(user.level)} px-3 py-1 rounded-full inline-block mt-1`}>
                      {user.level}
                    </div>
                  </div>
                  
                  <div className="bg-gray-800 rounded-lg px-4 py-2">
                    <div className="text-gray-400 text-sm">Total Hours</div>
                    <div className="text-2xl font-bold text-primary-red">{user.total_hours_played.toFixed(1)}h</div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Registered Tournaments */}
          {registeredTournaments.length > 0 && (
            <div className="card mb-8">
              <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
                <FaTrophy className="text-yellow-500" /> My Tournaments
              </h2>
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {registeredTournaments.map((reg) => (
                  <Link
                    key={reg.id}
                    to={`/leagues/${reg.league_id}`}
                    className="bg-gray-800 rounded-lg p-4 hover:bg-gray-750 transition border border-gray-700 hover:border-primary-blue"
                  >
                    <h3 className="font-semibold text-white mb-2">{reg.league?.name}</h3>
                    <div className="flex items-center justify-between">
                      <span className={`text-xs px-2 py-1 rounded ${
                        reg.league?.status === 'completed' ? 'bg-green-600' :
                        reg.league?.status === 'round_robin' || reg.league?.status === 'knockouts' ? 'bg-yellow-600' :
                        reg.league?.status === 'registration' ? 'bg-blue-600' :
                        'bg-gray-600'
                      } text-white`}>
                        {reg.league?.status}
                      </span>
                      {reg.league?.date && (
                        <span className="text-xs text-gray-400">{formatDate(reg.league.date)}</span>
                      )}
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* Tournament Matches */}
          {leagueMatches.length > 0 && (
            <div className="card mb-8">
              <h2 className="text-2xl font-bold text-white mb-6">Tournament Matches</h2>
              <div className="space-y-4">
                {leagueMatches.map((match) => {
                  const isWinner = match.winner_id === user?.id;
                  const opponent = match.player1_id === user?.id 
                    ? (match.player2 as any)?.name 
                    : (match.player1 as any)?.name;
                  return (
                    <div
                      key={match.id}
                      className="bg-gray-800 rounded-lg p-4 hover:bg-gray-750 transition"
                    >
                      <div className="flex justify-between items-center mb-2">
                        <div className="text-sm text-gray-400">
                          {(match.league as any)?.name} - {match.match_type}
                        </div>
                        {match.status === 'completed' && (
                          <div
                            className={`text-xs font-bold px-2 py-1 rounded ${
                              isWinner ? 'bg-green-600' : 'bg-red-600'
                            }`}
                          >
                            {isWinner ? 'WON' : 'LOST'}
                          </div>
                        )}
                        {match.status !== 'completed' && (
                          <div className="text-xs bg-yellow-600 px-2 py-1 rounded font-bold">
                            {match.status.toUpperCase()}
                          </div>
                        )}
                      </div>
                      <div className="text-white">
                        vs {opponent || 'TBD'}
                      </div>
                      {match.status === 'completed' && (
                        <div className="text-sm text-primary-blue mt-1">
                          Sets: {match.player1_sets_won} - {match.player2_sets_won}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          <div className="grid lg:grid-cols-2 gap-8">
            {/* Recent Bookings */}
            <div className="card">
              <h2 className="text-2xl font-bold text-white mb-6">Recent Bookings</h2>
              {bookings.length === 0 ? (
                <p className="text-gray-400 text-center py-8">No bookings yet</p>
              ) : (
                <div className="space-y-4">
                  {bookings.map((booking) => (
                    <div
                      key={booking.id}
                      className="bg-gray-800 rounded-lg p-4 hover:bg-gray-750 transition"
                    >
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <div className="text-white font-semibold">{booking.table_type}</div>
                          <div className="text-sm text-gray-400">
                            {formatDate(booking.date)} - {booking.day_of_week}
                          </div>
                          <div className="text-sm text-gray-500">
                            {booking.start_time} to {booking.end_time}
                          </div>
                        </div>
                        <div className="text-primary-blue font-bold">PKR {booking.price}</div>
                      </div>
                      <div className="flex gap-2 text-xs">
                        <span className="bg-gray-700 text-gray-300 px-2 py-1 rounded">
                          {booking.slot_duration} min
                        </span>
                        {booking.coaching && (
                          <span className="bg-primary-blue text-white px-2 py-1 rounded">
                            Coaching
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Match History */}
            <div className="card">
              <h2 className="text-2xl font-bold text-white mb-6">Match History</h2>
              {matches.length === 0 ? (
                <p className="text-gray-400 text-center py-8">No matches yet</p>
              ) : (
                <div className="space-y-4">
                  {matches.map((match) => {
                    const isWinner = match.winner_id === user.id;
                    return (
                      <div
                        key={match.id}
                        className="bg-gray-800 rounded-lg p-4 hover:bg-gray-750 transition"
                      >
                        <div className="flex justify-between items-center mb-2">
                          <div className="text-sm text-gray-400">
                            {formatDate(match.played_on)}
                          </div>
                          <div
                            className={`text-xs font-bold px-2 py-1 rounded ${
                              isWinner ? 'bg-green-600' : 'bg-red-600'
                            }`}
                          >
                            {isWinner ? 'WON' : 'LOST'}
                          </div>
                        </div>
                        <div className="text-white">
                          vs {match.player1_id === user.id 
                            ? (match.player2 as any)?.name 
                            : (match.player1 as any)?.name}
                        </div>
                        <div className="text-sm text-primary-blue mt-1">
                          +{match.rating_points_awarded} points
                        </div>
                        {match.video_url && (
                          <a
                            href={match.video_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs text-gray-400 hover:text-white mt-2 inline-block"
                          >
                            📹 Watch Video
                          </a>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </motion.div>
      </div>

      {/* Edit Profile Modal */}
      {showEditModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-gray-900 rounded-2xl w-full max-w-md"
          >
            <div className="flex items-center justify-between p-6 border-b border-gray-800">
              <h3 className="text-xl font-bold text-white">Edit Profile</h3>
              <button
                onClick={() => setShowEditModal(false)}
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
                  placeholder="Your full name"
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
                onClick={() => setShowEditModal(false)}
                className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveProfile}
                disabled={saving}
                className="px-4 py-2 bg-primary-blue hover:bg-blue-600 disabled:bg-gray-600 text-white rounded-lg flex items-center gap-2 transition"
              >
                {saving ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white"></div>
                ) : (
                  <FaSave />
                )}
                Save Changes
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* Change Password Modal */}
      {showPasswordModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-gray-900 rounded-2xl w-full max-w-md"
          >
            <div className="flex items-center justify-between p-6 border-b border-gray-800">
              <h3 className="text-xl font-bold text-white flex items-center gap-2">
                <FaKey className="text-yellow-500" /> Change Password
              </h3>
              <button
                onClick={() => {
                  setShowPasswordModal(false);
                  setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
                }}
                className="p-2 text-gray-400 hover:text-white transition"
              >
                <FaTimes />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="label">New Password</label>
                <div className="relative">
                  <input
                    type={showNewPassword ? 'text' : 'password'}
                    value={passwordForm.newPassword}
                    onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                    className="input-field pr-10"
                    placeholder="Enter new password (min 6 characters)"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white"
                  >
                    {showNewPassword ? <FaEyeSlash /> : <FaEye />}
                  </button>
                </div>
              </div>

              <div>
                <label className="label">Confirm New Password</label>
                <input
                  type={showNewPassword ? 'text' : 'password'}
                  value={passwordForm.confirmPassword}
                  onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                  className="input-field"
                  placeholder="Re-enter new password"
                />
              </div>

              {passwordForm.newPassword && passwordForm.confirmPassword && 
                passwordForm.newPassword !== passwordForm.confirmPassword && (
                <p className="text-red-400 text-sm">Passwords do not match</p>
              )}

              {passwordForm.newPassword && passwordForm.newPassword.length < 6 && (
                <p className="text-yellow-400 text-sm">Password must be at least 6 characters</p>
              )}
            </div>

            <div className="flex justify-end gap-3 p-6 border-t border-gray-800">
              <button
                onClick={() => {
                  setShowPasswordModal(false);
                  setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
                }}
                className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition"
              >
                Cancel
              </button>
              <button
                onClick={handleChangePassword}
                disabled={changingPassword || passwordForm.newPassword.length < 6 || passwordForm.newPassword !== passwordForm.confirmPassword}
                className="px-4 py-2 bg-yellow-600 hover:bg-yellow-700 disabled:bg-gray-600 text-white rounded-lg flex items-center gap-2 transition"
              >
                {changingPassword ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white"></div>
                ) : (
                  <FaKey />
                )}
                Change Password
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;

