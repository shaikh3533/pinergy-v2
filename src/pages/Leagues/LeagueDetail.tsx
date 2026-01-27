import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  FaTrophy, 
  FaCalendarAlt, 
  FaUsers, 
  FaTableTennis,
  FaChartLine,
  FaListOl,
  FaClock
} from 'react-icons/fa';
import { supabase } from '../../lib/supabase';
import type { League, LeaguePlayer } from '../../lib/supabase';
import { format } from 'date-fns';

const LeagueDetail = () => {
  const { leagueId } = useParams<{ leagueId: string }>();
  const [league, setLeague] = useState<League | null>(null);
  const [players, setPlayers] = useState<LeaguePlayer[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (leagueId) {
      fetchLeague();
      fetchPlayers();
    }
  }, [leagueId]);

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

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'upcoming': return 'bg-gray-600 text-gray-200';
      case 'registration': return 'bg-blue-600 text-white';
      case 'round_robin': return 'bg-yellow-600 text-white';
      case 'knockouts': return 'bg-orange-600 text-white';
      case 'completed': return 'bg-green-600 text-white';
      case 'cancelled': return 'bg-red-600 text-white';
      default: return 'bg-gray-600 text-gray-200';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'upcoming': return 'Upcoming';
      case 'registration': return 'Registration Open';
      case 'round_robin': return 'Round Robin in Progress';
      case 'knockouts': return 'Knockout Stage';
      case 'completed': return 'Completed';
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
              <div className="flex gap-3">
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
