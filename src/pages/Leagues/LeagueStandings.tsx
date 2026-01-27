import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  FaTrophy, 
  FaMedal,
  FaArrowLeft,
  FaInfoCircle,
  FaChevronUp,
  FaChevronDown,
  FaMinus
} from 'react-icons/fa';
import { supabase } from '../../lib/supabase';
import type { League, LeaguePlayer, LeagueMatch } from '../../lib/supabase';

interface StandingPlayer extends LeaguePlayer {
  player: { id: string; name: string; level: string };
  matches_played: number;
  head_to_head: { [opponentId: string]: { wins: number; losses: number } };
}

const LeagueStandings = () => {
  const { leagueId } = useParams<{ leagueId: string }>();
  const [league, setLeague] = useState<League | null>(null);
  const [standings, setStandings] = useState<StandingPlayer[]>([]);
  const [matches, setMatches] = useState<LeagueMatch[]>([]);
  const [loading, setLoading] = useState(true);
  const [showTiebreakInfo, setShowTiebreakInfo] = useState(false);

  useEffect(() => {
    if (leagueId) {
      fetchData();
    }
  }, [leagueId]);

  const fetchData = async () => {
    setLoading(true);
    
    // Fetch league
    const { data: leagueData } = await supabase
      .from('leagues')
      .select('*')
      .eq('id', leagueId)
      .single();
    
    if (leagueData) setLeague(leagueData);

    // Fetch players
    const { data: playersData } = await supabase
      .from('league_players')
      .select('*, player:player_id(id, name, level)')
      .eq('league_id', leagueId)
      .eq('status', 'active');

    // Fetch completed matches for head-to-head calculation
    const { data: matchesData } = await supabase
      .from('league_matches')
      .select('*')
      .eq('league_id', leagueId)
      .eq('status', 'completed');

    setMatches(matchesData || []);

    // Calculate standings with tie-breakers
    if (playersData) {
      const standingsWithH2H = playersData.map(player => {
        // Calculate head-to-head records
        const h2h: { [opponentId: string]: { wins: number; losses: number } } = {};
        let matchesPlayed = 0;

        (matchesData || []).forEach(match => {
          if (match.player1_id === player.player_id || match.player2_id === player.player_id) {
            matchesPlayed++;
            const opponentId = match.player1_id === player.player_id ? match.player2_id : match.player1_id;
            
            if (!h2h[opponentId]) {
              h2h[opponentId] = { wins: 0, losses: 0 };
            }

            if (match.winner_id === player.player_id) {
              h2h[opponentId].wins++;
            } else {
              h2h[opponentId].losses++;
            }
          }
        });

        return {
          ...player,
          matches_played: matchesPlayed,
          head_to_head: h2h,
        } as StandingPlayer;
      });

      // Sort standings with tie-breaking rules
      standingsWithH2H.sort((a, b) => {
        // 1. Total Wins (descending)
        if (b.wins !== a.wins) return b.wins - a.wins;
        
        // 2. Point Difference / Run Rate (descending)
        if (b.point_difference !== a.point_difference) return b.point_difference - a.point_difference;
        
        // 3. Head-to-Head Result
        const aH2H = a.head_to_head[b.player.id];
        const bH2H = b.head_to_head[a.player.id];
        if (aH2H && bH2H) {
          if (aH2H.wins !== bH2H.wins) return bH2H.wins - aH2H.wins;
        }
        
        // 4. Lowest Points Conceded (ascending)
        if (a.points_against !== b.points_against) return a.points_against - b.points_against;
        
        // 5. Highest Points Scored (descending)
        return b.points_for - a.points_for;
      });

      setStandings(standingsWithH2H);
    }

    setLoading(false);
  };

  const getRankBadge = (rank: number) => {
    if (rank === 1) return <FaTrophy className="text-yellow-500" />;
    if (rank === 2) return <FaMedal className="text-gray-300" />;
    if (rank === 3) return <FaMedal className="text-amber-600" />;
    return <span className="text-gray-400">{rank}</span>;
  };

  const getQualificationStatus = (rank: number) => {
    if (!league) return null;
    if (rank <= league.top_qualifiers) {
      return <span className="px-2 py-0.5 bg-green-600/30 text-green-400 rounded text-xs">Qualified</span>;
    }
    return null;
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-white text-xl">Loading standings...</div>
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
          <div className="flex items-center justify-between mb-6">
            <div>
              <Link 
                to={`/leagues/${leagueId}`}
                className="text-primary-blue hover:text-blue-400 flex items-center gap-2 mb-2"
              >
                <FaArrowLeft /> Back to League
              </Link>
              <h1 className="text-3xl font-bold text-white flex items-center gap-3">
                <FaTrophy className="text-yellow-500" />
                {league?.name} - Standings
              </h1>
            </div>
            <button
              onClick={() => setShowTiebreakInfo(!showTiebreakInfo)}
              className="px-4 py-2 bg-gray-800 hover:bg-gray-700 text-white rounded-lg flex items-center gap-2 transition"
            >
              <FaInfoCircle /> Tie-Break Rules
            </button>
          </div>

          {/* Tie-Break Info */}
          {showTiebreakInfo && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className="card mb-6 bg-gradient-to-r from-blue-900/30 to-purple-900/30 border-primary-blue"
            >
              <h3 className="text-lg font-bold text-white mb-4">Tie-Breaking Rules (Applied in Order)</h3>
              <ol className="list-decimal list-inside space-y-2 text-gray-300">
                <li><strong>Total Wins</strong> - Player with more wins ranks higher</li>
                <li><strong>Point Difference (Run Rate)</strong> - Total points scored minus points conceded</li>
                <li><strong>Head-to-Head Result</strong> - Winner of direct match ranks higher</li>
                <li><strong>Lowest Points Conceded</strong> - Player who conceded fewer points ranks higher</li>
                <li><strong>Admin Decision</strong> - If still tied, admin makes final decision</li>
              </ol>
            </motion.div>
          )}

          {/* Qualification Info */}
          {league && (
            <div className="mb-6 p-4 bg-gray-800 rounded-lg">
              <div className="flex items-center justify-between">
                <span className="text-gray-300">
                  Top <strong className="text-white">{league.top_qualifiers}</strong> players qualify for knockouts
                </span>
                <div className="flex items-center gap-2 text-sm">
                  <span className="px-2 py-1 bg-green-600/30 text-green-400 rounded">Qualified Zone</span>
                </div>
              </div>
            </div>
          )}

          {/* Standings Table */}
          <div className="card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-gray-800">
                    <th className="text-left py-4 px-4 text-gray-400 font-semibold">#</th>
                    <th className="text-left py-4 px-4 text-gray-400 font-semibold">Player</th>
                    <th className="text-center py-4 px-4 text-gray-400 font-semibold">P</th>
                    <th className="text-center py-4 px-4 text-gray-400 font-semibold">W</th>
                    <th className="text-center py-4 px-4 text-gray-400 font-semibold">L</th>
                    <th className="text-center py-4 px-4 text-gray-400 font-semibold">PF</th>
                    <th className="text-center py-4 px-4 text-gray-400 font-semibold">PA</th>
                    <th className="text-center py-4 px-4 text-gray-400 font-semibold">PD</th>
                    <th className="text-center py-4 px-4 text-gray-400 font-semibold">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {standings.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="text-center py-12 text-gray-400">
                        No standings available yet. Matches need to be played first.
                      </td>
                    </tr>
                  ) : (
                    standings.map((player, index) => {
                      const rank = index + 1;
                      const isQualified = league && rank <= league.top_qualifiers;
                      
                      return (
                        <motion.tr
                          key={player.id}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: index * 0.05 }}
                          className={`border-b border-gray-800 ${
                            isQualified ? 'bg-green-900/10' : ''
                          } hover:bg-gray-800/50 transition`}
                        >
                          {/* Rank */}
                          <td className="py-4 px-4">
                            <div className="flex items-center justify-center w-8 h-8">
                              {getRankBadge(rank)}
                            </div>
                          </td>
                          
                          {/* Player Name */}
                          <td className="py-4 px-4">
                            <div className="font-semibold text-white">{player.player.name}</div>
                            <div className="text-xs text-gray-500">{player.player.level}</div>
                          </td>
                          
                          {/* Played */}
                          <td className="py-4 px-4 text-center text-gray-300">
                            {player.matches_played}
                          </td>
                          
                          {/* Wins */}
                          <td className="py-4 px-4 text-center">
                            <span className="text-green-400 font-semibold">{player.wins}</span>
                          </td>
                          
                          {/* Losses */}
                          <td className="py-4 px-4 text-center">
                            <span className="text-red-400">{player.losses}</span>
                          </td>
                          
                          {/* Points For */}
                          <td className="py-4 px-4 text-center text-gray-300">
                            {player.points_for}
                          </td>
                          
                          {/* Points Against */}
                          <td className="py-4 px-4 text-center text-gray-300">
                            {player.points_against}
                          </td>
                          
                          {/* Point Difference */}
                          <td className="py-4 px-4 text-center">
                            <span className={`font-semibold flex items-center justify-center gap-1 ${
                              player.point_difference > 0 
                                ? 'text-green-400' 
                                : player.point_difference < 0 
                                ? 'text-red-400' 
                                : 'text-gray-400'
                            }`}>
                              {player.point_difference > 0 ? (
                                <FaChevronUp className="text-xs" />
                              ) : player.point_difference < 0 ? (
                                <FaChevronDown className="text-xs" />
                              ) : (
                                <FaMinus className="text-xs" />
                              )}
                              {player.point_difference > 0 ? '+' : ''}{player.point_difference}
                            </span>
                          </td>
                          
                          {/* Qualification Status */}
                          <td className="py-4 px-4 text-center">
                            {getQualificationStatus(rank)}
                          </td>
                        </motion.tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* Legend */}
            <div className="p-4 bg-gray-800/50 border-t border-gray-700">
              <div className="flex flex-wrap gap-4 text-sm text-gray-400">
                <span><strong>P</strong> = Played</span>
                <span><strong>W</strong> = Wins</span>
                <span><strong>L</strong> = Losses</span>
                <span><strong>PF</strong> = Points For</span>
                <span><strong>PA</strong> = Points Against</span>
                <span><strong>PD</strong> = Point Difference</span>
              </div>
            </div>
          </div>

          {/* Top 4 Bracket Preview (if in knockouts) */}
          {league?.status === 'knockouts' && standings.length >= 4 && (
            <div className="card mt-6">
              <h3 className="text-xl font-bold text-white mb-4">Knockout Bracket</h3>
              <div className="grid md:grid-cols-2 gap-6">
                {/* Semi-Final 1 */}
                <div className="bg-gray-800 rounded-lg p-4">
                  <div className="text-sm text-gray-400 mb-2">Semi-Final 1</div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="w-6 h-6 bg-yellow-600 rounded-full flex items-center justify-center text-xs text-white">1</span>
                      <span className="text-white font-semibold">{standings[0]?.player.name}</span>
                    </div>
                    <span className="text-gray-500">vs</span>
                    <div className="flex items-center gap-2">
                      <span className="text-white font-semibold">{standings[3]?.player.name}</span>
                      <span className="w-6 h-6 bg-gray-600 rounded-full flex items-center justify-center text-xs text-white">4</span>
                    </div>
                  </div>
                </div>
                
                {/* Semi-Final 2 */}
                <div className="bg-gray-800 rounded-lg p-4">
                  <div className="text-sm text-gray-400 mb-2">Semi-Final 2</div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="w-6 h-6 bg-gray-300 rounded-full flex items-center justify-center text-xs text-gray-900">2</span>
                      <span className="text-white font-semibold">{standings[1]?.player.name}</span>
                    </div>
                    <span className="text-gray-500">vs</span>
                    <div className="flex items-center gap-2">
                      <span className="text-white font-semibold">{standings[2]?.player.name}</span>
                      <span className="w-6 h-6 bg-amber-600 rounded-full flex items-center justify-center text-xs text-white">3</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
};

export default LeagueStandings;
