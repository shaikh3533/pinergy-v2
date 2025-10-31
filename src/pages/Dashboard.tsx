import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { supabase } from '../lib/supabase';
import type { Booking, Match } from '../lib/supabase';
import { useAuthStore } from '../store/authStore';
import { formatDate } from '../utils/dateUtils';
import { getLevelBadgeColor } from '../utils/ratingSystem';

const Dashboard = () => {
  const { user, updateProfile } = useAuthStore();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);

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

      // Fetch matches
      const { data: matchesData, error: matchesError } = await supabase
        .from('matches')
        .select('*, player1:player1_id(name), player2:player2_id(name), winner:winner_id(name)')
        .or(`player1_id.eq.${user.id},player2_id.eq.${user.id}`)
        .order('played_on', { ascending: false })
        .limit(10);

      if (matchesError) throw matchesError;
      setMatches(matchesData || []);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
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
                <h1 className="text-3xl font-bold text-white mb-2">{user.name}</h1>
                <p className="text-gray-400 mb-4">{user.email}</p>
                
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
    </div>
  );
};

export default Dashboard;

