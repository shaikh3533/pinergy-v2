import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { 
  FaTrophy, 
  FaCalendarAlt, 
  FaUsers, 
  FaTableTennis,
  FaChartLine,
  FaListOl,
  FaClock,
  FaUserPlus,
  FaCheck
} from 'react-icons/fa';
import { supabase } from '../../lib/supabase';
import type { League, LeaguePlayer } from '../../lib/supabase';
import { format, isAfter, startOfDay, isEqual } from 'date-fns';
import { useAuthStore } from '../../store/authStore';

const LeagueDetail = () => {
  const { leagueId } = useParams<{ leagueId: string }>();
  const { user } = useAuthStore();
  const [league, setLeague] = useState<League | null>(null);
  const [players, setPlayers] = useState<LeaguePlayer[]>([]);
  const [loading, setLoading] = useState(true);
  const [registering, setRegistering] = useState(false);
  const [isRegistered, setIsRegistered] = useState(false);

  useEffect(() => {
    if (leagueId) {
      fetchLeague();
      fetchPlayers();
    }
  }, [leagueId]);

  // Check if user is already registered
  useEffect(() => {
    if (user && leagueId) {
      checkRegistration();
    }
  }, [user, leagueId, players]);

  const checkRegistration = () => {
    const registered = players.some(p => p.player_id === user?.id);
    setIsRegistered(registered);
  };

  const handleRegister = async () => {
    if (!user) {
      toast.error('Please sign in to register for tournaments');
      return;
    }
    if (!league) return;
    
    if (players.length >= league.max_players) {
      toast.error('This tournament is full');
      return;
    }

    if (league.status !== 'registration') {
      toast.error('Registration is not open for this tournament');
      return;
    }

    setRegistering(true);
    
    console.log('Attempting to register user:', user.id, 'for league:', leagueId);
    
    try {
      const { data, error } = await supabase
        .from('league_players')
        .insert({
          league_id: leagueId,
          player_id: user.id,
          status: 'active',
          wins: 0,
          losses: 0,
          points_for: 0,
          points_against: 0,
          point_difference: 0,
        })
        .select();

      if (error) {
        console.error('Registration error details:', {
          code: error.code,
          message: error.message,
          details: error.details,
          hint: error.hint,
        });
        if (error.code === '23505') {
          toast.error('You are already registered for this tournament');
          setIsRegistered(true);
        } else if (error.code === '42501') {
          toast.error('Permission denied. Please run FIX_TOURNAMENT_RLS.sql in Supabase.');
        } else {
          toast.error(`Registration failed: ${error.message}`);
        }
      } else {
        console.log('Registration successful:', data);
        toast.success('Successfully registered for the tournament!');
        setIsRegistered(true);
        fetchPlayers();
      }
    } catch (err) {
      console.error('Unexpected error:', err);
      toast.error('An unexpected error occurred');
    }
    
    setRegistering(false);
  };

  const handleUnregister = async () => {
    if (!user || !leagueId) return;
    
    if (!confirm('Are you sure you want to withdraw from this tournament?')) return;

    const { error } = await supabase
      .from('league_players')
      .delete()
      .eq('league_id', leagueId)
      .eq('player_id', user.id);

    if (error) {
      toast.error('Failed to withdraw. Please try again.');
    } else {
      toast.success('You have withdrawn from the tournament');
      setIsRegistered(false);
      fetchPlayers();
    }
  };

  const fetchLeague = async () => {
    const { data, error } = await supabase
      .from('leagues')
      .select('*')
      .eq('id', leagueId)
      .single();
    
    if (error) {
      console.error('Error fetching league:', error);
    } else {
      setLeague(data);
    }
    setLoading(false);
  };

  const fetchPlayers = async () => {
    const { data, error } = await supabase
      .from('league_players')
      .select('*, player:player_id(name, level)')
      .eq('league_id', leagueId)
      .eq('status', 'active')
      .order('seed_number');
    
    if (!error && data) {
      setPlayers(data);
    }
  };

  // Check if league date is in the future or today
  const isUpcomingDate = (): boolean => {
    if (!league) return false;
    const leagueDate = league.date || league.start_date;
    if (!leagueDate) return true; // No date set, consider upcoming
    const today = startOfDay(new Date());
    const date = startOfDay(new Date(leagueDate));
    return isAfter(date, today) || isEqual(date, today);
  };

  // Get effective status based on date
  const getEffectiveStatus = (status: string): string => {
    if (status === 'upcoming' && !isUpcomingDate()) {
      return 'past';
    }
    return status;
  };

  const getStatusColor = (status: string) => {
    const effectiveStatus = getEffectiveStatus(status);
    switch (effectiveStatus) {
      case 'upcoming': return 'bg-blue-600 text-white';
      case 'registration': return 'bg-green-600 text-white';
      case 'round_robin': return 'bg-yellow-600 text-white';
      case 'knockouts': return 'bg-orange-600 text-white';
      case 'completed': return 'bg-gray-600 text-gray-200';
      case 'past': return 'bg-gray-600 text-gray-200';
      case 'cancelled': return 'bg-red-600 text-white';
      default: return 'bg-gray-600 text-gray-200';
    }
  };

  const getStatusLabel = (status: string) => {
    const effectiveStatus = getEffectiveStatus(status);
    switch (effectiveStatus) {
      case 'upcoming': return 'Upcoming';
      case 'registration': return 'Registration Open';
      case 'round_robin': return 'Round Robin in Progress';
      case 'knockouts': return 'Knockout Stage';
      case 'completed': return 'Completed';
      case 'past': return 'Past';
      case 'cancelled': return 'Cancelled';
      default: return status;
    }
  };

  const getLeagueTypeLabel = (type: string) => {
    switch (type) {
      case 'round_robin_knockouts': return 'Round Robin + Knockouts';
      case 'round_robin': return 'Round Robin Only';
      case 'knockouts': return 'Knockout Only';
      default: return type;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-white text-xl">Loading league...</div>
      </div>
    );
  }

  if (!league) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <FaTrophy className="text-6xl text-gray-600 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-white mb-2">League Not Found</h2>
          <Link to="/leagues" className="text-primary-blue hover:underline">
            View All Leagues
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-8 px-4">
      <div className="max-w-5xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          {/* Registration Banner - Very Prominent */}
          {league.status === 'registration' && (
            <div className="mb-6 bg-gradient-to-r from-green-600 to-blue-600 rounded-xl p-6 text-center">
              <h2 className="text-2xl font-bold text-white mb-2 flex items-center justify-center gap-3">
                <FaUserPlus className="animate-bounce" />
                Registration is OPEN!
              </h2>
              <p className="text-white/90 mb-4">
                {players.length} / {league.max_players} players registered. 
                {league.max_players - players.length > 0 
                  ? ` ${league.max_players - players.length} spots remaining!`
                  : ' Tournament is full!'}
              </p>
              {!user ? (
                <Link
                  to="/auth/signin"
                  className="inline-block px-6 py-3 bg-yellow-500 hover:bg-yellow-400 text-black font-bold rounded-lg transition transform hover:scale-105"
                >
                  Sign In to Register
                </Link>
              ) : isRegistered ? (
                <span className="inline-block px-6 py-3 bg-white/20 text-white font-bold rounded-lg">
                  ✓ You are registered!
                </span>
              ) : players.length >= league.max_players ? (
                <span className="inline-block px-6 py-3 bg-gray-600 text-gray-300 font-bold rounded-lg">
                  Tournament Full
                </span>
              ) : (
                <button
                  onClick={handleRegister}
                  disabled={registering}
                  className="inline-block px-6 py-3 bg-yellow-500 hover:bg-yellow-400 disabled:bg-gray-600 text-black font-bold rounded-lg transition transform hover:scale-105"
                >
                  {registering ? 'Registering...' : 'Register Now!'}
                </button>
              )}
            </div>
          )}

          {/* Header */}
          <div className="card mb-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <FaTrophy className="text-3xl text-yellow-500" />
                  <h1 className="text-3xl font-bold text-white">{league.name}</h1>
                </div>
                <span className={`inline-block px-4 py-1 rounded-full text-sm font-semibold ${getStatusColor(league.status)}`}>
                  {getStatusLabel(league.status)}
                </span>
              </div>
              <div className="flex flex-wrap gap-3">
                {/* Registration Button - Show for registration status */}
                {league.status === 'registration' ? (
                  <>
                    {!user ? (
                      <Link
                        to="/auth/signin"
                        className="px-4 py-2 bg-yellow-500 hover:bg-yellow-600 text-black font-semibold rounded-lg flex items-center gap-2 transition animate-pulse"
                      >
                        <FaUserPlus /> Sign in to Register
                      </Link>
                    ) : isRegistered ? (
                      <button
                        onClick={handleUnregister}
                        className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg flex items-center gap-2 transition"
                      >
                        <FaCheck /> Registered (Click to Withdraw)
                      </button>
                    ) : players.length >= league.max_players ? (
                      <span className="px-4 py-2 bg-gray-700 text-gray-400 rounded-lg">
                        Tournament Full
                      </span>
                    ) : (
                      <button
                        onClick={handleRegister}
                        disabled={registering}
                        className="px-4 py-2 bg-yellow-500 hover:bg-yellow-600 disabled:bg-gray-600 text-black font-semibold rounded-lg flex items-center gap-2 transition animate-pulse"
                      >
                        {registering ? (
                          <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-black"></div>
                        ) : (
                          <FaUserPlus />
                        )}
                        Register Now
                      </button>
                    )}
                  </>
                ) : league.status === 'upcoming' && isUpcomingDate() ? (
                  <span className="px-4 py-2 bg-blue-900/50 text-blue-300 rounded-lg flex items-center gap-2 border border-blue-600">
                    <FaClock /> Registration Opening Soon
                  </span>
                ) : league.status === 'upcoming' && !isUpcomingDate() ? (
                  <span className="px-4 py-2 bg-gray-700 text-gray-400 rounded-lg flex items-center gap-2">
                    Event Date Passed
                  </span>
                ) : ['round_robin', 'knockouts', 'group_stage'].includes(league.status) ? (
                  <span className="px-4 py-2 bg-yellow-900/50 text-yellow-300 rounded-lg flex items-center gap-2 border border-yellow-600">
                    <FaTableTennis /> Tournament In Progress
                  </span>
                ) : league.status === 'completed' ? (
                  <span className="px-4 py-2 bg-green-900/50 text-green-300 rounded-lg flex items-center gap-2 border border-green-600">
                    <FaTrophy /> Tournament Completed
                  </span>
                ) : null}
                <Link
                  to={`/leagues/${leagueId}/matches`}
                  className="px-4 py-2 bg-primary-blue hover:bg-blue-700 text-white rounded-lg flex items-center gap-2 transition"
                >
                  <FaTableTennis /> Matches
                </Link>
                <Link
                  to={`/leagues/${leagueId}/standings`}
                  className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg flex items-center gap-2 transition"
                >
                  <FaListOl /> Standings
                </Link>
              </div>
            </div>
          </div>

          {/* League Info */}
          <div className="grid md:grid-cols-3 gap-6 mb-6">
            {/* Schedule */}
            <div className="card">
              <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                <FaCalendarAlt className="text-primary-blue" /> Schedule
              </h3>
              <div className="space-y-2 text-gray-300">
                <div>
                  <span className="text-gray-400">Date:</span>{' '}
                  {league.date 
                    ? format(new Date(league.date), 'EEEE, MMMM d, yyyy') 
                    : league.start_date 
                    ? format(new Date(league.start_date), 'MMMM d, yyyy')
                    : 'TBD'}
                </div>
                <div>
                  <span className="text-gray-400">Type:</span>{' '}
                  Single Day Tournament
                </div>
              </div>
            </div>

            {/* Format */}
            <div className="card">
              <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                <FaTableTennis className="text-yellow-500" /> Format
              </h3>
              <div className="space-y-2 text-gray-300">
                <div>
                  <span className="text-gray-400">Type:</span>{' '}
                  {getLeagueTypeLabel(league.league_type)}
                </div>
                <div>
                  <span className="text-gray-400">Round Robin:</span>{' '}
                  Best of {league.round_robin_sets}
                </div>
                <div>
                  <span className="text-gray-400">Semi-Finals:</span>{' '}
                  Best of {league.semifinal_sets}
                </div>
                <div>
                  <span className="text-gray-400">Final:</span>{' '}
                  Best of {league.final_sets}
                </div>
                <div>
                  <span className="text-gray-400">Top Qualifiers:</span>{' '}
                  {league.top_qualifiers}
                </div>
              </div>
            </div>

            {/* Players */}
            <div className="card">
              <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                <FaUsers className="text-green-500" /> Players ({players.length}/{league.max_players})
              </h3>
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {players.length === 0 ? (
                  <div className="text-gray-400 text-sm">No players registered yet</div>
                ) : (
                  players.map((lp, index) => (
                    <div key={lp.id} className="flex items-center gap-2 text-gray-300">
                      <span className="w-6 h-6 bg-gray-700 rounded-full flex items-center justify-center text-xs">
                        {index + 1}
                      </span>
                      <span>{(lp.player as any)?.name}</span>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* Points System */}
          <div className="card mb-6">
            <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
              <FaChartLine className="text-purple-500" /> Points System
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              <div className="bg-gray-800 rounded-lg p-4 text-center">
                <div className="text-2xl font-bold text-white">5</div>
                <div className="text-sm text-gray-400">Participation</div>
              </div>
              <div className="bg-gray-800 rounded-lg p-4 text-center">
                <div className="text-2xl font-bold text-blue-400">+5</div>
                <div className="text-sm text-gray-400">Top 6 Finish</div>
              </div>
              <div className="bg-gray-800 rounded-lg p-4 text-center">
                <div className="text-2xl font-bold text-green-400">+5</div>
                <div className="text-sm text-gray-400">Top 4 Finish</div>
              </div>
              <div className="bg-gray-800 rounded-lg p-4 text-center">
                <div className="text-2xl font-bold text-orange-400">+5</div>
                <div className="text-sm text-gray-400">Runner-Up</div>
              </div>
              <div className="bg-gray-800 rounded-lg p-4 text-center">
                <div className="text-2xl font-bold text-yellow-400">+10</div>
                <div className="text-sm text-gray-400">Champion</div>
              </div>
            </div>
            <p className="text-gray-400 text-sm mt-4 text-center">
              Maximum points per league: 30 (5 + 5 + 5 + 5 + 10 for champion)
            </p>
          </div>

          {/* Rules */}
          {league.rules && (
            <div className="card">
              <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                <FaClock className="text-red-500" /> League Rules
              </h3>
              <div className="text-gray-300 whitespace-pre-wrap text-sm leading-relaxed">
                {league.rules}
              </div>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
};

export default LeagueDetail;
