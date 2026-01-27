import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  FaTrophy, 
  FaCalendarAlt, 
  FaUsers, 
  FaTableTennis,
  FaSearch,
  FaChevronRight
} from 'react-icons/fa';
import { supabase } from '../../lib/supabase';
import type { League } from '../../lib/supabase';
import { format } from 'date-fns';

const LeaguesList = () => {
  const [leagues, setLeagues] = useState<League[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  useEffect(() => {
    fetchLeagues();
  }, []);

  const fetchLeagues = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('leagues')
      .select('*')
      .order('start_date', { ascending: false });
    
    if (error) {
      console.error('Error fetching leagues:', error);
    } else {
      setLeagues(data || []);
    }
    setLoading(false);
  };

  // Filter leagues
  const filteredLeagues = leagues.filter(l => {
    const matchesSearch = l.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || l.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  // Group by status for display
  const activeLeagues = filteredLeagues.filter(l => ['registration', 'round_robin', 'knockouts'].includes(l.status));
  const upcomingLeagues = filteredLeagues.filter(l => l.status === 'upcoming');
  const completedLeagues = filteredLeagues.filter(l => l.status === 'completed');

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-white text-xl">Loading leagues...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-8 px-4">
      <div className="max-w-6xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-white mb-2 flex items-center justify-center gap-3">
              <FaTrophy className="text-yellow-500" />
              Leagues & Tournaments
            </h1>
            <p className="text-gray-400">Compete, improve, and climb the rankings!</p>
          </div>

          {/* Search & Filter */}
          <div className="flex flex-col md:flex-row gap-4 mb-8">
            <div className="relative flex-1">
              <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search leagues..."
                className="input-field pl-10"
              />
            </div>
            <div className="flex gap-2">
              {['all', 'registration', 'round_robin', 'completed'].map(status => (
                <button
                  key={status}
                  onClick={() => setStatusFilter(status)}
                  className={`px-4 py-2 rounded-lg text-sm font-semibold transition ${
                    statusFilter === status
                      ? 'bg-primary-blue text-white'
                      : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                  }`}
                >
                  {status === 'all' ? 'All' : 
                   status === 'registration' ? 'Open' :
                   status === 'round_robin' ? 'Active' : 'Past'}
                </button>
              ))}
            </div>
          </div>

          {/* Active Leagues */}
          {activeLeagues.length > 0 && (
            <div className="mb-8">
              <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                <span className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></span>
                Active Leagues
              </h2>
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                {activeLeagues.map((league) => (
                  <LeagueCard key={league.id} league={league} />
                ))}
              </div>
            </div>
          )}

          {/* Upcoming Leagues */}
          {upcomingLeagues.length > 0 && (
            <div className="mb-8">
              <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                <FaCalendarAlt className="text-blue-500" />
                Upcoming Leagues
              </h2>
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                {upcomingLeagues.map((league) => (
                  <LeagueCard key={league.id} league={league} />
                ))}
              </div>
            </div>
          )}

          {/* Completed Leagues */}
          {completedLeagues.length > 0 && (
            <div className="mb-8">
              <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                <FaTrophy className="text-yellow-500" />
                Past Leagues
              </h2>
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                {completedLeagues.map((league) => (
                  <LeagueCard key={league.id} league={league} />
                ))}
              </div>
            </div>
          )}

          {/* No Results */}
          {filteredLeagues.length === 0 && (
            <div className="card text-center py-12">
              <FaTrophy className="text-6xl text-gray-600 mx-auto mb-4" />
              <h3 className="text-xl font-bold text-white mb-2">No Leagues Found</h3>
              <p className="text-gray-400">
                {searchTerm ? 'Try a different search term' : 'No leagues available at the moment'}
              </p>
            </div>
          )}

          {/* Global Rankings Link */}
          <div className="mt-8">
            <Link
              to="/rankings"
              className="card block hover:border-primary-blue transition text-center group"
            >
              <FaTrophy className="text-4xl text-yellow-500 mx-auto mb-3" />
              <h3 className="text-xl font-bold text-white group-hover:text-primary-blue transition">
                View Global Player Rankings
              </h3>
              <p className="text-gray-400 text-sm mt-1">
                See how players rank across all leagues
              </p>
            </Link>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

// League Card Component
const LeagueCard = ({ league }: { league: League }) => {
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
      case 'round_robin': return 'Round Robin';
      case 'knockouts': return 'Knockouts';
      case 'completed': return 'Completed';
      case 'cancelled': return 'Cancelled';
      default: return status;
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ scale: 1.02 }}
    >
      <Link
        to={`/leagues/${league.id}`}
        className="card block hover:border-primary-blue transition group h-full"
      >
        <div className="flex items-start justify-between mb-3">
          <h3 className="text-lg font-bold text-white group-hover:text-primary-blue transition line-clamp-2">
            {league.name}
          </h3>
          <span className={`px-2 py-1 rounded text-xs font-semibold whitespace-nowrap ${getStatusColor(league.status)}`}>
            {getStatusLabel(league.status)}
          </span>
        </div>
        <div className="text-sm text-gray-400 space-y-2">
          <div className="flex items-center gap-2">
            <FaCalendarAlt className="text-primary-blue" />
            {league.date 
              ? format(new Date(league.date), 'MMM d, yyyy') 
              : league.start_date 
              ? format(new Date(league.start_date), 'MMM d, yyyy')
              : 'Date TBD'}
          </div>
          <div className="flex items-center gap-2">
            <FaUsers className="text-green-500" />
            Max {league.max_players} players
          </div>
          <div className="flex items-center gap-2">
            <FaTableTennis className="text-yellow-500" />
            {league.league_type === 'round_robin_knockouts' ? 'Round Robin + Knockouts' :
             league.league_type === 'round_robin' ? 'Round Robin' : 'Knockouts'}
          </div>
        </div>
        <div className="mt-4 pt-3 border-t border-gray-700 flex items-center justify-end text-primary-blue text-sm group-hover:underline">
          View Details <FaChevronRight className="ml-1" />
        </div>
      </Link>
    </motion.div>
  );
};

export default LeaguesList;
