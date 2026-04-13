import { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FaArrowLeft, FaChartLine, FaTableTennis, FaTrophy, FaUser } from 'react-icons/fa';
import toast from 'react-hot-toast';
import { supabase } from '../../lib/supabase';
import type { LeagueMatch, Match, PlayerTournamentStats, User } from '../../lib/supabase';
import { ratingPointsFromFinalRank } from '../../utils/tournamentRatingPoints';

type TimeFilter = 'all' | '30' | '90';



const PlayerPortfolio = () => {
  const { playerId } = useParams<{ playerId: string }>();
  const [player, setPlayer] = useState<User | null>(null);
  const [stats, setStats] = useState<PlayerTournamentStats | null>(null);
  const [tournamentMatches, setTournamentMatches] = useState<LeagueMatch[]>([]);
  const [casualMatches, setCasualMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);
  const [timeFilter, setTimeFilter] = useState<TimeFilter>('all');
  const [tab, setTab] = useState<'tournaments' | 'casual'>('tournaments');
  const [windowPoints, setWindowPoints] = useState<number>(0);

  useEffect(() => {
    if (!playerId) return;
    fetchAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [playerId]);

  useEffect(() => {
    if (!playerId) return;
    if (timeFilter === 'all') {
      setWindowPoints(stats?.rating_points ?? 0);
      return;
    }
    fetchWindowPoints(parseInt(timeFilter, 10));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [timeFilter, playerId, stats?.rating_points]);

  const fetchAll = async () => {
    setLoading(true);
    try {
      const [{ data: userData }, { data: statsData }] = await Promise.all([
        supabase.from('users').select('*').eq('id', playerId).single(),
        supabase.from('player_tournament_stats').select('*').eq('player_id', playerId).maybeSingle(),
      ]);
      if (userData) setPlayer(userData as any);
      if (statsData) setStats(statsData as any);

      const { data: leagueMatchesData, error: lmError } = await supabase
        .from('league_matches')
        .select('*, player1:player1_id(id, name), player2:player2_id(id, name), winner:winner_id(id, name), league:league_id(id, name)')
        .or(`player1_id.eq.${playerId},player2_id.eq.${playerId}`)
        .order('created_at', { ascending: false })
        .limit(100);
      if (lmError) throw lmError;
      setTournamentMatches((leagueMatchesData || []) as any);

      const { data: matchesData, error: mError } = await supabase
        .from('matches')
        .select('*, player1:player1_id(name), player2:player2_id(name), winner:winner_id(name)')
        .or(`player1_id.eq.${playerId},player2_id.eq.${playerId}`)
        .order('played_on', { ascending: false })
        .limit(100);
      if (mError) throw mError;
      setCasualMatches((matchesData || []) as any);
    } catch (e: any) {
      console.error(e);
      toast.error('Failed to load player portfolio');
    } finally {
      setLoading(false);
    }
  };

  const fetchWindowPoints = async (days: number) => {
    if (!playerId) return;
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - days);
    const cutoffIso = cutoff.toISOString().slice(0, 10);

    const { data } = await supabase
      .from('league_players')
      .select('final_rank, league:league_id(status, date)')
      .eq('player_id', playerId)
      .eq('league.status', 'completed')
      .gte('league.date', cutoffIso);

    const pts = (data || []).reduce((sum: number, lp: any) => sum + ratingPointsFromFinalRank(lp.final_rank), 0);
    setWindowPoints(pts);
  };

  const tournamentSummary = useMemo(() => {
    const completed = tournamentMatches.filter((m: any) => m.status === 'completed');
    const wins = completed.filter((m: any) => m.winner_id === playerId).length;
    const losses = completed.filter((m: any) => m.winner_id && m.winner_id !== playerId).length;
    return { played: completed.length, wins, losses };
  }, [tournamentMatches, playerId]);

  const casualSummary = useMemo(() => {
    const completed = casualMatches;
    const wins = completed.filter((m: any) => m.winner_id === playerId).length;
    const losses = completed.filter((m: any) => m.winner_id && m.winner_id !== playerId).length;
    return { played: completed.length, wins, losses };
  }, [casualMatches, playerId]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-white text-xl">Loading player portfolio...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-8 px-4">
      <div className="max-w-6xl mx-auto">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <div className="flex items-center justify-between mb-6">
            <div>
              <Link to="/rankings" className="text-primary-blue hover:text-blue-400 flex items-center gap-2 mb-2">
                <FaArrowLeft /> Back to Rankings
              </Link>
              <h1 className="text-3xl font-bold text-white flex items-center gap-3">
                <FaUser className="text-primary-blue" />
                {player?.name || 'Player'} Portfolio
              </h1>
              <p className="text-gray-400 mt-1">Detailed tournament + match history</p>
            </div>
          </div>

          {/* Rating cards */}
          <div className="grid md:grid-cols-3 gap-4 mb-6">
            <div className="card">
              <div className="flex items-center gap-2 text-gray-400 text-sm mb-2">
                <FaChartLine /> Tournament Rating
              </div>
              <div className="text-3xl font-bold text-white">{stats?.rating_points ?? 0}</div>
              <div className="text-xs text-gray-500 mt-1">All time (tournaments)</div>
            </div>
            <div className="card">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-gray-400 text-sm">
                  <FaTrophy /> Filtered Rating
                </div>
                <select
                  value={timeFilter}
                  onChange={(e) => setTimeFilter(e.target.value as TimeFilter)}
                  className="bg-gray-800 text-gray-200 rounded px-2 py-1 text-sm border border-gray-700"
                >
                  <option value="all">All time</option>
                  <option value="30">Last 30 days</option>
                  <option value="90">Last 90 days</option>
                </select>
              </div>
              <div className="text-3xl font-bold text-white mt-2">{windowPoints}</div>
              <div className="text-xs text-gray-500 mt-1">Based on completed tournaments in range</div>
            </div>
            <div className="card">
              <div className="flex items-center gap-2 text-gray-400 text-sm mb-2">
                <FaTableTennis /> Matches
              </div>
              <div className="text-sm text-gray-300 space-y-1">
                <div className="flex justify-between"><span>Tournament</span><span className="text-white">{tournamentSummary.played} ({tournamentSummary.wins}W-{tournamentSummary.losses}L)</span></div>
                <div className="flex justify-between"><span>Casual</span><span className="text-white">{casualSummary.played} ({casualSummary.wins}W-{casualSummary.losses}L)</span></div>
              </div>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex gap-3 mb-4">
            <button
              onClick={() => setTab('tournaments')}
              className={`px-5 py-3 rounded-lg font-semibold transition ${
                tab === 'tournaments' ? 'bg-primary-blue text-white' : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
              }`}
            >
              Tournament Matches ({tournamentMatches.length})
            </button>
            <button
              onClick={() => setTab('casual')}
              className={`px-5 py-3 rounded-lg font-semibold transition ${
                tab === 'casual' ? 'bg-primary-blue text-white' : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
              }`}
            >
              Casual Matches ({casualMatches.length})
            </button>
          </div>

          <div className="space-y-3">
            {tab === 'tournaments' ? (
              tournamentMatches.length === 0 ? (
                <div className="card text-center py-10 text-gray-400">No tournament matches found.</div>
              ) : (
                tournamentMatches.map((m: any) => (
                  <div key={m.id} className="card">
                    <div className="flex items-center justify-between">
                      <div className="text-gray-400 text-sm">{m.league?.name || 'Tournament'} • {m.match_type}</div>
                      <div className={`text-xs px-2 py-1 rounded ${m.status === 'completed' ? 'bg-green-600 text-white' : 'bg-gray-700 text-gray-200'}`}>
                        {m.status}
                      </div>
                    </div>
                    <div className="mt-2 flex items-center justify-between">
                      <div className={`${m.winner_id === m.player1_id ? 'text-green-400 font-semibold' : 'text-white'}`}>{m.player1?.name}</div>
                      <div className="text-gray-400">
                        {m.status === 'completed' ? `${m.player1_sets_won} - ${m.player2_sets_won}` : 'vs'}
                      </div>
                      <div className={`${m.winner_id === m.player2_id ? 'text-green-400 font-semibold' : 'text-white'}`}>{m.player2?.name}</div>
                    </div>
                  </div>
                ))
              )
            ) : casualMatches.length === 0 ? (
              <div className="card text-center py-10 text-gray-400">No casual matches found.</div>
            ) : (
              casualMatches.map((m: any) => (
                <div key={m.id} className="card">
                  <div className="flex items-center justify-between">
                    <div className="text-gray-400 text-sm">{m.played_on}</div>
                    <div className="text-xs text-gray-500">+{m.rating_points_awarded} pts</div>
                  </div>
                  <div className="mt-2 flex items-center justify-between">
                    <div className={`${m.winner_id === m.player1_id ? 'text-green-400 font-semibold' : 'text-white'}`}>{m.player1?.name}</div>
                    <div className="text-gray-400">vs</div>
                    <div className={`${m.winner_id === m.player2_id ? 'text-green-400 font-semibold' : 'text-white'}`}>{m.player2?.name}</div>
                  </div>
                </div>
              ))
            )}
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default PlayerPortfolio;

