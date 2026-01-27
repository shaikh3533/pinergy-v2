import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { 
  FaTrophy, 
  FaTableTennis,
  FaCheck,
  FaEdit,
  FaTimes,
  FaArrowLeft,
  FaPlus
} from 'react-icons/fa';
import { supabase } from '../../lib/supabase';
import type { League, LeagueMatch, LeagueMatchSet, User } from '../../lib/supabase';
import { useAuthStore } from '../../store/authStore';

interface MatchWithDetails extends LeagueMatch {
  player1: User;
  player2: User;
  winner?: User;
  sets: LeagueMatchSet[];
}

const LeagueMatches = () => {
  const { leagueId } = useParams<{ leagueId: string }>();
  const { user } = useAuthStore();
  const isAdmin = user?.role === 'admin';
  
  const [league, setLeague] = useState<League | null>(null);
  const [matches, setMatches] = useState<MatchWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'round_robin' | 'knockouts'>('round_robin');
  
  // Scoring modal state
  const [scoringMatch, setScoringMatch] = useState<MatchWithDetails | null>(null);
  const [setScores, setSetScores] = useState<{ player1: number; player2: number }[]>([]);

  useEffect(() => {
    if (leagueId) {
      fetchLeague();
      fetchMatches();
    }
  }, [leagueId]);

  const fetchLeague = async () => {
    const { data, error } = await supabase
      .from('leagues')
      .select('*')
      .eq('id', leagueId)
      .single();
    
    if (!error && data) {
      setLeague(data);
    }
  };

  const fetchMatches = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('league_matches')
      .select(`
        *,
        player1:player1_id(id, name, level),
        player2:player2_id(id, name, level),
        winner:winner_id(id, name),
        sets:league_match_sets(*)
      `)
      .eq('league_id', leagueId)
      .order('match_number');
    
    if (error) {
      console.error('Error fetching matches:', error);
    } else {
      setMatches(data || []);
    }
    setLoading(false);
  };

  const openScoringModal = (match: MatchWithDetails) => {
    setScoringMatch(match);
    // Initialize set scores
    if (match.sets && match.sets.length > 0) {
      setSetScores(match.sets.map(s => ({ player1: s.player1_score, player2: s.player2_score })));
    } else {
      // Initialize empty sets based on sets_to_win
      const setsNeeded = match.sets_to_win * 2 - 1; // Max possible sets
      setSetScores(Array(setsNeeded).fill({ player1: 0, player2: 0 }));
    }
  };

  const updateSetScore = (setIndex: number, player: 'player1' | 'player2', score: number) => {
    setSetScores(prev => {
      const newScores = [...prev];
      newScores[setIndex] = { ...newScores[setIndex], [player]: score };
      return newScores;
    });
  };

  const saveMatchScore = async () => {
    if (!scoringMatch) return;

    // Calculate sets won
    let player1Sets = 0;
    let player2Sets = 0;
    let player1Points = 0;
    let player2Points = 0;
    
    const validSets = setScores.filter(s => s.player1 > 0 || s.player2 > 0);
    
    for (const set of validSets) {
      player1Points += set.player1;
      player2Points += set.player2;
      if (set.player1 > set.player2) player1Sets++;
      else if (set.player2 > set.player1) player2Sets++;
    }

    // Determine winner
    let winnerId: string | null = null;
    if (player1Sets >= scoringMatch.sets_to_win) {
      winnerId = scoringMatch.player1_id;
    } else if (player2Sets >= scoringMatch.sets_to_win) {
      winnerId = scoringMatch.player2_id;
    }

    // Update match
    const { error: matchError } = await supabase
      .from('league_matches')
      .update({
        player1_sets_won: player1Sets,
        player2_sets_won: player2Sets,
        winner_id: winnerId,
        status: winnerId ? 'completed' : 'in_progress',
        played_at: winnerId ? new Date().toISOString() : null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', scoringMatch.id);

    if (matchError) {
      toast.error('Failed to save match');
      return;
    }

    // Delete existing sets and insert new ones
    await supabase
      .from('league_match_sets')
      .delete()
      .eq('match_id', scoringMatch.id);

    const setsToInsert = validSets.map((set, index) => ({
      match_id: scoringMatch.id,
      set_number: index + 1,
      player1_score: set.player1,
      player2_score: set.player2,
      winner_id: set.player1 > set.player2 ? scoringMatch.player1_id : 
                 set.player2 > set.player1 ? scoringMatch.player2_id : null,
    }));

    if (setsToInsert.length > 0) {
      await supabase.from('league_match_sets').insert(setsToInsert);
    }

    // Update league player stats
    if (winnerId) {
      const loserId = winnerId === scoringMatch.player1_id ? scoringMatch.player2_id : scoringMatch.player1_id;
      const winnerPoints = winnerId === scoringMatch.player1_id ? player1Points : player2Points;
      const loserPoints = winnerId === scoringMatch.player1_id ? player2Points : player1Points;

      // Update winner stats
      await supabase.rpc('update_league_player_match_stats', {
        p_league_id: leagueId,
        p_player_id: winnerId,
        p_won: true,
        p_points_for: winnerPoints,
        p_points_against: loserPoints,
      });

      // Update loser stats
      await supabase.rpc('update_league_player_match_stats', {
        p_league_id: leagueId,
        p_player_id: loserId,
        p_won: false,
        p_points_for: loserPoints,
        p_points_against: winnerPoints,
      });
    }

    toast.success(winnerId ? 'Match completed!' : 'Scores saved');
    setScoringMatch(null);
    fetchMatches();
  };

  const getMatchStatusBadge = (status: string) => {
    switch (status) {
      case 'scheduled': return 'bg-gray-600 text-gray-200';
      case 'in_progress': return 'bg-yellow-600 text-white';
      case 'completed': return 'bg-green-600 text-white';
      case 'walkover': return 'bg-orange-600 text-white';
      case 'cancelled': return 'bg-red-600 text-white';
      default: return 'bg-gray-600 text-gray-200';
    }
  };

  const roundRobinMatches = matches.filter(m => m.match_type === 'round_robin');
  const knockoutMatches = matches.filter(m => ['semifinal', 'final', 'third_place'].includes(m.match_type));

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-white text-xl">Loading matches...</div>
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
                <FaTableTennis className="text-primary-blue" />
                {league?.name} - Matches
              </h1>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex gap-3 mb-6">
            <button
              onClick={() => setActiveTab('round_robin')}
              className={`px-5 py-3 rounded-lg font-semibold transition ${
                activeTab === 'round_robin'
                  ? 'bg-primary-blue text-white'
                  : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
              }`}
            >
              Round Robin ({roundRobinMatches.length})
            </button>
            <button
              onClick={() => setActiveTab('knockouts')}
              className={`px-5 py-3 rounded-lg font-semibold transition ${
                activeTab === 'knockouts'
                  ? 'bg-primary-blue text-white'
                  : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
              }`}
            >
              Knockouts ({knockoutMatches.length})
            </button>
          </div>

          {/* Matches List */}
          <div className="space-y-3">
            {(activeTab === 'round_robin' ? roundRobinMatches : knockoutMatches).length === 0 ? (
              <div className="card text-center py-12">
                <FaTableTennis className="text-6xl text-gray-600 mx-auto mb-4" />
                <h3 className="text-xl font-bold text-white mb-2">No Matches Yet</h3>
                <p className="text-gray-400">
                  {activeTab === 'round_robin' 
                    ? 'Round robin matches will appear here once generated'
                    : 'Knockout matches will appear after round robin completes'}
                </p>
              </div>
            ) : (
              (activeTab === 'round_robin' ? roundRobinMatches : knockoutMatches).map((match) => (
                <motion.div
                  key={match.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="card hover:border-primary-blue/50 transition"
                >
                  <div className="flex items-center justify-between">
                    {/* Match Number & Type */}
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-gray-700 rounded-lg flex items-center justify-center">
                        <span className="text-lg font-bold text-gray-300">#{match.match_number}</span>
                      </div>
                      <span className={`px-2 py-1 rounded text-xs uppercase ${getMatchStatusBadge(match.status)}`}>
                        {match.status}
                      </span>
                    </div>

                    {/* Players & Score */}
                    <div className="flex-1 mx-6">
                      <div className="flex items-center justify-center gap-4">
                        {/* Player 1 */}
                        <div className={`flex-1 text-right ${match.winner_id === match.player1_id ? 'text-green-400 font-bold' : 'text-gray-300'}`}>
                          {match.player1?.name}
                          {match.winner_id === match.player1_id && <FaTrophy className="inline ml-2 text-yellow-500" />}
                        </div>
                        
                        {/* Score */}
                        <div className="flex items-center gap-2 min-w-[100px] justify-center">
                          {match.status === 'completed' ? (
                            <span className="text-2xl font-bold text-white">
                              {match.player1_sets_won} - {match.player2_sets_won}
                            </span>
                          ) : (
                            <span className="text-gray-500">vs</span>
                          )}
                        </div>
                        
                        {/* Player 2 */}
                        <div className={`flex-1 text-left ${match.winner_id === match.player2_id ? 'text-green-400 font-bold' : 'text-gray-300'}`}>
                          {match.winner_id === match.player2_id && <FaTrophy className="inline mr-2 text-yellow-500" />}
                          {match.player2?.name}
                        </div>
                      </div>

                      {/* Set Scores */}
                      {match.sets && match.sets.length > 0 && (
                        <div className="flex items-center justify-center gap-3 mt-2">
                          {match.sets.sort((a, b) => a.set_number - b.set_number).map((set) => (
                            <span 
                              key={set.id} 
                              className={`text-sm px-2 py-1 rounded ${
                                set.player1_score > set.player2_score 
                                  ? 'bg-green-600/30 text-green-400'
                                  : set.player2_score > set.player1_score
                                  ? 'bg-red-600/30 text-red-400'
                                  : 'bg-gray-600/30 text-gray-400'
                              }`}
                            >
                              {set.player1_score}-{set.player2_score}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Actions */}
                    {isAdmin && match.status !== 'completed' && (
                      <button
                        onClick={() => openScoringModal(match)}
                        className="px-4 py-2 bg-primary-blue hover:bg-blue-700 text-white rounded-lg flex items-center gap-2 transition"
                      >
                        <FaEdit /> Score
                      </button>
                    )}
                    {isAdmin && match.status === 'completed' && (
                      <button
                        onClick={() => openScoringModal(match)}
                        className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg flex items-center gap-2 transition"
                      >
                        <FaEdit /> Edit
                      </button>
                    )}
                  </div>
                </motion.div>
              ))
            )}
          </div>
        </motion.div>

        {/* Scoring Modal */}
        {scoringMatch && (
          <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-gray-900 rounded-xl p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold text-white">
                  Match #{scoringMatch.match_number} - Enter Scores
                </h3>
                <button
                  onClick={() => setScoringMatch(null)}
                  className="p-2 text-gray-400 hover:text-white transition"
                >
                  <FaTimes />
                </button>
              </div>

              {/* Players */}
              <div className="flex items-center justify-around mb-6 text-lg">
                <div className="text-center">
                  <div className="font-bold text-white">{scoringMatch.player1?.name}</div>
                </div>
                <div className="text-gray-500">vs</div>
                <div className="text-center">
                  <div className="font-bold text-white">{scoringMatch.player2?.name}</div>
                </div>
              </div>

              {/* Set Scores */}
              <div className="space-y-4">
                <div className="text-sm text-gray-400 text-center mb-2">
                  Best of {scoringMatch.sets_to_win * 2 - 1} (First to {scoringMatch.sets_to_win} sets)
                </div>
                {setScores.map((set, index) => (
                  <div key={index} className="flex items-center justify-center gap-4">
                    <span className="text-gray-400 w-16">Set {index + 1}</span>
                    <input
                      type="number"
                      value={set.player1 || ''}
                      onChange={(e) => updateSetScore(index, 'player1', parseInt(e.target.value) || 0)}
                      className="w-20 px-3 py-2 bg-gray-800 text-white text-center rounded-lg border border-gray-700 focus:border-primary-blue focus:outline-none"
                      min={0}
                      max={15}
                    />
                    <span className="text-gray-500">-</span>
                    <input
                      type="number"
                      value={set.player2 || ''}
                      onChange={(e) => updateSetScore(index, 'player2', parseInt(e.target.value) || 0)}
                      className="w-20 px-3 py-2 bg-gray-800 text-white text-center rounded-lg border border-gray-700 focus:border-primary-blue focus:outline-none"
                      min={0}
                      max={15}
                    />
                    {set.player1 > 0 || set.player2 > 0 ? (
                      set.player1 > set.player2 ? (
                        <FaCheck className="text-green-500 w-5" />
                      ) : set.player2 > set.player1 ? (
                        <FaCheck className="text-green-500 w-5" />
                      ) : (
                        <span className="w-5" />
                      )
                    ) : (
                      <span className="w-5" />
                    )}
                  </div>
                ))}
              </div>

              {/* Summary */}
              <div className="mt-6 p-4 bg-gray-800 rounded-lg">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-400">Sets Won:</span>
                  <span className="text-white font-bold">
                    {setScores.filter(s => s.player1 > s.player2).length} - {setScores.filter(s => s.player2 > s.player1).length}
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm mt-2">
                  <span className="text-gray-400">Total Points:</span>
                  <span className="text-white">
                    {setScores.reduce((sum, s) => sum + (s.player1 || 0), 0)} - {setScores.reduce((sum, s) => sum + (s.player2 || 0), 0)}
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm mt-2">
                  <span className="text-gray-400">Point Difference:</span>
                  <span className={`font-bold ${
                    setScores.reduce((sum, s) => sum + (s.player1 || 0) - (s.player2 || 0), 0) > 0 
                      ? 'text-green-400' 
                      : setScores.reduce((sum, s) => sum + (s.player1 || 0) - (s.player2 || 0), 0) < 0
                      ? 'text-red-400'
                      : 'text-gray-400'
                  }`}>
                    {setScores.reduce((sum, s) => sum + (s.player1 || 0) - (s.player2 || 0), 0) > 0 ? '+' : ''}
                    {setScores.reduce((sum, s) => sum + (s.player1 || 0) - (s.player2 || 0), 0)}
                  </span>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-4 mt-6">
                <button
                  onClick={() => setScoringMatch(null)}
                  className="flex-1 px-4 py-3 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition"
                >
                  Cancel
                </button>
                <button
                  onClick={saveMatchScore}
                  className="flex-1 px-4 py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg flex items-center justify-center gap-2 transition"
                >
                  <FaCheck /> Save Score
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </div>
    </div>
  );
};

export default LeagueMatches;
