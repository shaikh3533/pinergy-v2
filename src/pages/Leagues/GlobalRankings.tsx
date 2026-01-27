import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  FaTrophy, 
  FaMedal,
  FaSearch,
  FaPercent,
  FaArrowUp,
  FaStar
} from 'react-icons/fa';
import { supabase } from '../../lib/supabase';
import type { PlayerTournamentStats, User } from '../../lib/supabase';

interface RankedPlayer extends PlayerTournamentStats {
  player: User;
  global_rank: number;
}

const GlobalRankings = () => {
  const [players, setPlayers] = useState<RankedPlayer[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchRankings();
  }, []);

  const fetchRankings = async () => {
    setLoading(true);
    
    // Fetch from the global_player_rankings view
    const { data, error } = await supabase
      .from('player_tournament_stats')
      .select('*, player:player_id(*)')
      .order('rating_points', { ascending: false });

    if (error) {
      console.error('Error fetching rankings:', error);
      // If view doesn't exist, try fetching directly
      await fetchDirectRankings();
    } else {
      // Add rank number
      const rankedPlayers = (data || []).map((p, index) => ({
        ...p,
        global_rank: index + 1,
      }));
      setPlayers(rankedPlayers);
    }
    setLoading(false);
  };

  const fetchDirectRankings = async () => {
    // Fallback: Calculate rankings from league_players
    const { data: leaguePlayers } = await supabase
      .from('league_players')
      .select('*, player:player_id(*)');

    if (!leaguePlayers) return;

    // Aggregate stats per player
    const playerStats: { [id: string]: RankedPlayer } = {};
    
    leaguePlayers.forEach(lp => {
      const playerId = lp.player_id;
      if (!playerStats[playerId]) {
        playerStats[playerId] = {
          id: playerId,
          player_id: playerId,
          player: lp.player,
          total_leagues_played: 0,
          total_matches_played: 0,
          total_wins: 0,
          total_losses: 0,
          total_points_for: 0,
          total_points_against: 0,
          total_point_difference: 0,
          total_championships: 0,
          total_runner_ups: 0,
          total_top_4_finishes: 0,
          total_top_6_finishes: 0,
          rating_points: 0,
          win_percentage: 0,
          avg_point_difference: 0,
          updated_at: '',
          global_rank: 0,
        };
      }

      const stats = playerStats[playerId];
      stats.total_leagues_played++;
      stats.total_wins += lp.wins || 0;
      stats.total_losses += lp.losses || 0;
      stats.total_points_for += lp.points_for || 0;
      stats.total_points_against += lp.points_against || 0;
      stats.total_point_difference += lp.point_difference || 0;

      // Calculate rating based on final_rank
      if (lp.final_rank) {
        stats.rating_points += 5; // Participation
        if (lp.final_rank <= 6) stats.rating_points += 5;
        if (lp.final_rank <= 4) stats.rating_points += 5;
        if (lp.final_rank === 2) stats.rating_points += 5;
        if (lp.final_rank === 1) stats.rating_points += 10;
        
        if (lp.final_rank === 1) stats.total_championships++;
        if (lp.final_rank === 2) stats.total_runner_ups++;
        if (lp.final_rank <= 4) stats.total_top_4_finishes++;
        if (lp.final_rank <= 6) stats.total_top_6_finishes++;
      }
    });

    // Calculate percentages and sort
    const rankedPlayers = Object.values(playerStats)
      .map(p => {
        const totalMatches = p.total_wins + p.total_losses;
        return {
          ...p,
          total_matches_played: totalMatches,
          win_percentage: totalMatches > 0 ? Math.round((p.total_wins / totalMatches) * 100) : 0,
          avg_point_difference: totalMatches > 0 ? Math.round(p.total_point_difference / totalMatches) : 0,
        };
      })
      .sort((a, b) => {
        // Sort by rating points, then win percentage, then point difference
        if (b.rating_points !== a.rating_points) return b.rating_points - a.rating_points;
        if (b.win_percentage !== a.win_percentage) return b.win_percentage - a.win_percentage;
        return b.avg_point_difference - a.avg_point_difference;
      })
      .map((p, index) => ({ ...p, global_rank: index + 1 }));

    setPlayers(rankedPlayers);
  };

  const getRankDisplay = (rank: number) => {
    if (rank === 1) return <FaTrophy className="text-2xl text-yellow-500" />;
    if (rank === 2) return <FaMedal className="text-2xl text-gray-300" />;
    if (rank === 3) return <FaMedal className="text-2xl text-amber-600" />;
    return <span className="text-xl font-bold text-gray-400">{rank}</span>;
  };

  const filteredPlayers = players.filter(p => 
    p.player?.name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-white text-xl">Loading rankings...</div>
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
              Global Player Rankings
            </h1>
            <p className="text-gray-400">Rankings based on league performance and achievements</p>
          </div>

          {/* Points System Info */}
          <div className="card mb-6 bg-gradient-to-r from-yellow-900/20 to-orange-900/20 border-yellow-600/50">
            <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
              <FaStar className="text-yellow-500" /> Rating Points System
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-center">
              <div>
                <div className="text-2xl font-bold text-white">5</div>
                <div className="text-xs text-gray-400">Participation</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-blue-400">+5</div>
                <div className="text-xs text-gray-400">Top 6</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-green-400">+5</div>
                <div className="text-xs text-gray-400">Top 4</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-orange-400">+5</div>
                <div className="text-xs text-gray-400">Runner-Up</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-yellow-400">+10</div>
                <div className="text-xs text-gray-400">Champion</div>
              </div>
            </div>
          </div>

          {/* Search */}
          <div className="relative mb-6">
            <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search players..."
              className="input-field pl-10"
            />
          </div>

          {/* Top 3 Podium */}
          {filteredPlayers.length >= 3 && !searchTerm && (
            <div className="mb-8">
              <div className="flex items-end justify-center gap-4 h-64">
                {/* 2nd Place */}
                <motion.div
                  initial={{ opacity: 0, y: 50 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                  className="flex flex-col items-center"
                >
                  <div className="text-center mb-2">
                    <div className="w-16 h-16 bg-gray-700 rounded-full flex items-center justify-center mb-2 mx-auto">
                      <span className="text-2xl">{filteredPlayers[1]?.player?.name?.[0]}</span>
                    </div>
                    <div className="text-white font-semibold">{filteredPlayers[1]?.player?.name}</div>
                    <div className="text-gray-400 text-sm">{filteredPlayers[1]?.rating_points} pts</div>
                  </div>
                  <div className="w-28 h-32 bg-gradient-to-t from-gray-500 to-gray-400 rounded-t-lg flex items-center justify-center">
                    <FaMedal className="text-5xl text-gray-200" />
                  </div>
                </motion.div>

                {/* 1st Place */}
                <motion.div
                  initial={{ opacity: 0, y: 50 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                  className="flex flex-col items-center"
                >
                  <div className="text-center mb-2">
                    <div className="w-20 h-20 bg-yellow-600 rounded-full flex items-center justify-center mb-2 mx-auto ring-4 ring-yellow-400">
                      <span className="text-3xl text-white">{filteredPlayers[0]?.player?.name?.[0]}</span>
                    </div>
                    <div className="text-white font-bold text-lg">{filteredPlayers[0]?.player?.name}</div>
                    <div className="text-yellow-400 font-semibold">{filteredPlayers[0]?.rating_points} pts</div>
                  </div>
                  <div className="w-32 h-44 bg-gradient-to-t from-yellow-600 to-yellow-500 rounded-t-lg flex items-center justify-center">
                    <FaTrophy className="text-6xl text-yellow-200" />
                  </div>
                </motion.div>

                {/* 3rd Place */}
                <motion.div
                  initial={{ opacity: 0, y: 50 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                  className="flex flex-col items-center"
                >
                  <div className="text-center mb-2">
                    <div className="w-16 h-16 bg-gray-700 rounded-full flex items-center justify-center mb-2 mx-auto">
                      <span className="text-2xl">{filteredPlayers[2]?.player?.name?.[0]}</span>
                    </div>
                    <div className="text-white font-semibold">{filteredPlayers[2]?.player?.name}</div>
                    <div className="text-gray-400 text-sm">{filteredPlayers[2]?.rating_points} pts</div>
                  </div>
                  <div className="w-28 h-24 bg-gradient-to-t from-amber-700 to-amber-600 rounded-t-lg flex items-center justify-center">
                    <FaMedal className="text-4xl text-amber-300" />
                  </div>
                </motion.div>
              </div>
            </div>
          )}

          {/* Rankings Table */}
          <div className="card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-gray-800">
                    <th className="text-center py-4 px-4 text-gray-400 font-semibold w-16">Rank</th>
                    <th className="text-left py-4 px-4 text-gray-400 font-semibold">Player</th>
                    <th className="text-center py-4 px-4 text-gray-400 font-semibold">
                      <FaStar className="inline text-yellow-500" /> Rating
                    </th>
                    <th className="text-center py-4 px-4 text-gray-400 font-semibold">Leagues</th>
                    <th className="text-center py-4 px-4 text-gray-400 font-semibold">W/L</th>
                    <th className="text-center py-4 px-4 text-gray-400 font-semibold">
                      <FaPercent className="inline" /> Win
                    </th>
                    <th className="text-center py-4 px-4 text-gray-400 font-semibold">
                      <FaArrowUp className="inline" /> Avg PD
                    </th>
                    <th className="text-center py-4 px-4 text-gray-400 font-semibold">
                      <FaTrophy className="inline text-yellow-500" />
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filteredPlayers.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="text-center py-12 text-gray-400">
                        {searchTerm ? 'No players found' : 'No rankings available yet. Complete some leagues first!'}
                      </td>
                    </tr>
                  ) : (
                    filteredPlayers.map((player, index) => (
                      <motion.tr
                        key={player.id}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.03 }}
                        className={`border-b border-gray-800 hover:bg-gray-800/50 transition ${
                          player.global_rank <= 3 ? 'bg-yellow-900/10' : ''
                        }`}
                      >
                        {/* Rank */}
                        <td className="py-4 px-4 text-center">
                          {getRankDisplay(player.global_rank)}
                        </td>
                        
                        {/* Player Name */}
                        <td className="py-4 px-4">
                          <div className="font-semibold text-white">{player.player?.name}</div>
                        </td>
                        
                        {/* Rating Points */}
                        <td className="py-4 px-4 text-center">
                          <span className="text-yellow-400 font-bold text-lg">{player.rating_points}</span>
                        </td>
                        
                        {/* Leagues Played */}
                        <td className="py-4 px-4 text-center text-gray-300">
                          {player.total_leagues_played}
                        </td>
                        
                        {/* Wins/Losses */}
                        <td className="py-4 px-4 text-center">
                          <span className="text-green-400">{player.total_wins}</span>
                          <span className="text-gray-500">/</span>
                          <span className="text-red-400">{player.total_losses}</span>
                        </td>
                        
                        {/* Win Percentage */}
                        <td className="py-4 px-4 text-center">
                          <span className={`font-semibold ${
                            player.win_percentage >= 70 ? 'text-green-400' :
                            player.win_percentage >= 50 ? 'text-yellow-400' :
                            'text-red-400'
                          }`}>
                            {player.win_percentage}%
                          </span>
                        </td>
                        
                        {/* Average Point Difference */}
                        <td className="py-4 px-4 text-center">
                          <span className={`font-semibold ${
                            player.avg_point_difference > 0 ? 'text-green-400' :
                            player.avg_point_difference < 0 ? 'text-red-400' :
                            'text-gray-400'
                          }`}>
                            {player.avg_point_difference > 0 ? '+' : ''}{player.avg_point_difference}
                          </span>
                        </td>
                        
                        {/* Championships */}
                        <td className="py-4 px-4 text-center">
                          {player.total_championships > 0 ? (
                            <span className="text-yellow-500 font-bold">{player.total_championships}</span>
                          ) : (
                            <span className="text-gray-600">-</span>
                          )}
                        </td>
                      </motion.tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Legend */}
            <div className="p-4 bg-gray-800/50 border-t border-gray-700">
              <div className="flex flex-wrap gap-4 text-sm text-gray-400">
                <span><FaStar className="inline text-yellow-500" /> Rating = Total earned points</span>
                <span><FaPercent className="inline" /> Win = Win percentage</span>
                <span><FaArrowUp className="inline" /> Avg PD = Average point difference per match</span>
                <span><FaTrophy className="inline text-yellow-500" /> = Championship wins</span>
              </div>
            </div>
          </div>

          {/* View Leagues Link */}
          <div className="mt-6 text-center">
            <Link
              to="/leagues"
              className="text-primary-blue hover:text-blue-400 transition"
            >
              View All Leagues
            </Link>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default GlobalRankings;
