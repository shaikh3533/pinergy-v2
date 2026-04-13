import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FaPlus, 
  FaUsers, 
  FaCalendarAlt, 
  FaTrophy, 
  FaArrowLeft, 
  FaTrash, 
  FaSave,
  FaCogs,
  FaCheckCircle,
  FaSkull,
  FaPlay,
  FaEdit,
  FaTimes
} from 'react-icons/fa';
import toast from 'react-hot-toast';
import { supabase } from '../../lib/supabase';
import type { DCTournament, DCTeam, User } from '../../lib/supabase';
import AdminLayout from '../../components/Admin/AdminLayout';

// Mock interface addition for local state until supabase.ts is refreshed
interface DCTie {
  id: string;
  tournament_id: string;
  team1_id: string;
  team2_id: string;
  winner_id?: string;
  tie_type: string;
  group_number?: number;
  status: string;
  team1_rubbers_won: number;
  team2_rubbers_won: number;
  team1?: DCTeam;
  team2?: DCTeam;
  winner?: DCTeam;
  matches?: DCMatch[];
}

interface DCMatch {
  id: string;
  tie_id: string;
  match_number: number;
  rubber_type: 'singles' | 'doubles';
  status: string;
  team1_player1_id?: string;
  team1_player2_id?: string;
  team2_player1_id?: string;
  team2_player2_id?: string;
  team1_sets_won: number;
  team2_sets_won: number;
  winner_team_id?: string;
  team1_player1?: User;
  team1_player2?: User;
  team2_player1?: User;
  team2_player2?: User;
}

const AdminSpecialEvents = () => {
  const [tournaments, setTournaments] = useState<DCTournament[]>([]);
  const [loading, setLoading] = useState(true);
  
  // View states
  const [activeView, setActiveView] = useState<'list' | 'create' | 'manage'>('list');
  const [selectedTournament, setSelectedTournament] = useState<DCTournament | null>(null);
  const [mgmtTab, setMgmtTab] = useState<'overview' | 'teams' | 'matches'>('overview');

  // DC Management State
  const [teams, setTeams] = useState<DCTeam[]>([]);
  const [ties, setTies] = useState<DCTie[]>([]);
  const [allPlayers, setAllPlayers] = useState<User[]>([]);
  const [isAddingTeam, setIsAddingTeam] = useState(false);
  const [newTeamName, setNewTeamName] = useState('');

  // Scoring/Tie Modal State
  const [selectedTie, setSelectedTie] = useState<DCTie | null>(null);
  const [scoringMatch, setScoringMatch] = useState<DCMatch | null>(null);
  const [activeTieGroup, setActiveTieGroup] = useState<number>(1);

  // Form states
  const [formData, setFormData] = useState({
    name: '',
    date: '',
    num_groups: 4,
    group_stage_rubbers: 3,
    knockout_rubbers: 5,
  });

  useEffect(() => {
    fetchTournaments();
    fetchUsers();
  }, []);

  const fetchTournaments = async () => {
    setLoading(true);
    const { data } = await supabase
      .from('dc_tournaments')
      .select('*')
      .order('created_at', { ascending: false });
    if (data) setTournaments(data);
    setLoading(false);
  };

  const fetchUsers = async () => {
    const { data } = await supabase.from('users').select('*').order('name');
    if (data) setAllPlayers(data);
  };

  const fetchTeams = async (tournamentId: string) => {
    const { data } = await supabase
      .from('dc_teams')
      .select('*, players:dc_team_players(*, player:users(*))')
      .eq('tournament_id', tournamentId)
      .order('group_number')
      .order('name');
    if (data) setTeams(data || []);
  };

  const fetchTies = async (tournamentId: string) => {
    const { data } = await supabase
      .from('dc_ties')
      .select('*, team1:dc_teams!team1_id(*), team2:dc_teams!team2_id(*), winner:dc_teams!winner_id(*), matches:dc_matches(*, team1_player1:users!team1_player1_id(name), team1_player2:users!team1_player2_id(name), team2_player1:users!team2_player1_id(name), team2_player2:users!team2_player2_id(name))')
      .eq('tournament_id', tournamentId)
      .order('group_number')
      .order('created_at');
    if (data) setTies(data || []);
  };

  const handleCreateTournament = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const { data, error } = await supabase
        .from('dc_tournaments')
        .insert([{
          name: formData.name,
          date: formData.date || null,
          num_groups: formData.num_groups,
          group_stage_rubbers: formData.group_stage_rubbers,
          knockout_rubbers: formData.knockout_rubbers,
          status: 'upcoming'
        }])
        .select()
        .single();
        
      if (error) throw error;
      toast.success('Davis Cup Event Created! 🏆');
      setTournaments([data, ...tournaments]);
      setActiveView('list');
      setFormData({ name: '', date: '', num_groups: 4, group_stage_rubbers: 3, knockout_rubbers: 5 });
    } catch (error) {
      console.error(error);
      toast.error('Failed to create event');
    }
  };

  const handleAddTeam = async () => {
    if (!newTeamName.trim() || !selectedTournament) return;
    try {
      const { data, error } = await supabase
        .from('dc_teams')
        .insert([{
          tournament_id: selectedTournament.id,
          name: newTeamName,
          group_number: 1 
        }])
        .select()
        .single();
      if (error) throw error;
      setTeams([...teams, { ...data, players: [] }]);
      setNewTeamName('');
      setIsAddingTeam(false);
      toast.success('Team added to roster');
    } catch (e) {
      toast.error('Error adding team');
    }
  };

  const handleDeleteTeam = async (teamId: string) => {
    if (!confirm('Are you sure you want to delete this team and its roster?')) return;
    try {
      await supabase.from('dc_teams').delete().eq('id', teamId);
      setTeams(teams.filter(t => t.id !== teamId));
      toast.success('Team removed');
    } catch (e) {
      toast.error('Error deleting team');
    }
  };

  const handleAddPlayerToTeam = async (teamId: string, playerId: string) => {
    try {
      const { data, error } = await supabase
        .from('dc_team_players')
        .insert([{ team_id: teamId, player_id: playerId }])
        .select('*, player:users(*)')
        .single();
      if (error) throw error;
      
      setTeams(teams.map(t => {
        if (t.id === teamId) {
          return { ...t, players: [...(t.players || []), data] };
        }
        return t;
      }));
      toast.success('Player added to roster');
    } catch (e) {
      toast.error('Player already in a team or error occurred');
    }
  };

  const handleRemovePlayer = async (teamId: string, rosterEntryId: string) => {
    try {
      await supabase.from('dc_team_players').delete().eq('id', rosterEntryId);
      setTeams(teams.map(t => {
        if (t.id === teamId) {
          return { ...t, players: (t.players || []).filter(p => p.id !== rosterEntryId) };
        }
        return t;
      }));
      toast.success('Player removed from roster');
    } catch (e) { e; }
  };

  const handleUpdateTeamGroup = async (teamId: string, groupNum: number) => {
    try {
      await supabase.from('dc_teams').update({ group_number: groupNum }).eq('id', teamId);
      setTeams(teams.map(t => t.id === teamId ? { ...t, group_number: groupNum } : t));
    } catch (e) { e; }
  };

  const handleGenerateGroupStage = async () => {
    if (!selectedTournament) return;
    
    // Check if enough teams
    const teamsByGroup = new Map<number, DCTeam[]>();
    teams.forEach(t => {
      const gn = t.group_number || 1;
      if (!teamsByGroup.has(gn)) teamsByGroup.set(gn, []);
      teamsByGroup.get(gn)!.push(t);
    });

    for (let g = 1; g <= selectedTournament.num_groups; g++) {
       const gTeams = teamsByGroup.get(g) || [];
       if (gTeams.length < 2) {
          toast.error(`Group ${String.fromCharCode(64+g)} needs at least 2 teams!`);
          return;
       }
    }

    if (!confirm('This will generate all Round Robin ties for the Group Stage. Proceed?')) return;

    try {
       setLoading(true);
       
       // 1. Update Tournament Status
       await supabase.from('dc_tournaments').update({ status: 'group_stage' }).eq('id', selectedTournament.id);
       setSelectedTournament({ ...selectedTournament, status: 'group_stage' });

       // 2. Generate Pairs
       for (const [groupNum, groupTeams] of teamsByGroup.entries()) {
          for (let i = 0; i < groupTeams.length; i++) {
             for (let j = i + 1; j < groupTeams.length; j++) {
                // Create Tie
                const { data: tie, error: tieError } = await supabase
                  .from('dc_ties')
                  .insert([{
                     tournament_id: selectedTournament.id,
                     team1_id: groupTeams[i].id,
                     team2_id: groupTeams[j].id,
                     tie_type: 'group_stage',
                     group_number: groupNum,
                     status: 'scheduled'
                  }])
                  .select()
                  .single();
                
                if (tieError) throw tieError;

                // Create Rubbers
                const rubbersCount = selectedTournament.group_stage_rubbers;
                const matchInserts = [];
                for (let r = 1; r <= rubbersCount; r++) {
                   // Logic: 3 rubbers -> 1:S, 2:S, 3:D
                   // 5 rubbers -> 1:S, 2:S, 3:D, 4:S, 5:S
                   let rubberType: 'singles' | 'doubles' = 'singles';
                   if (rubbersCount === 3 && r === 3) rubberType = 'doubles';
                   if (rubbersCount === 5 && r === 3) rubberType = 'doubles';

                   matchInserts.push({
                      tie_id: tie.id,
                      match_number: r,
                      rubber_type: rubberType,
                      status: 'scheduled',
                      sets_to_win: 2 // default best of 3
                   });
                }
                await supabase.from('dc_matches').insert(matchInserts);
             }
          }
       }

       toast.success('Group Stage Generated Successfully! 🎾');
       fetchTies(selectedTournament.id);
       setMgmtTab('matches');
    } catch (error) {
       console.error(error);
       toast.error('Error generating ties');
    } finally {
       setLoading(false);
    }
  };

  const handleUpdateMatchScore = async (match: DCMatch, team1Score: number, team2Score: number, lineup: any) => {
     try {
        const winnerId = team1Score > team2Score ? selectedTie?.team1_id : (team2Score > team1Score ? selectedTie?.team2_id : null);
        
        const { error } = await supabase
          .from('dc_matches')
          .update({
             team1_sets_won: team1Score,
             team2_sets_won: team2Score,
             winner_team_id: winnerId,
             status: winnerId ? 'completed' : (team1Score > 0 || team2Score > 0 ? 'in_progress' : 'scheduled'),
             ...lineup
          })
          .eq('id', match.id);
        
        if (error) throw error;
        toast.success('Stats updated!');
        
        if (selectedTournament) fetchTies(selectedTournament.id);
        setScoringMatch(null);
     } catch (e) {
        toast.error('Error saving stats');
     }
  };

  const handleSwapPlayers = () => {
     if (!scoringMatch) return;
     setScoringMatch({
        ...scoringMatch,
        team1_player1_id: scoringMatch.team2_player1_id,
        team2_player1_id: scoringMatch.team1_player1_id,
        team1_player2_id: scoringMatch.team2_player2_id,
        team2_player2_id: scoringMatch.team1_player2_id,
     });
     toast.success('Lineups Swapped! 🔄');
  };

  const handleFinalizeTie = async (tie: DCTie) => {
     const t1Wins = tie.matches?.filter(m => m.winner_team_id === tie.team1_id).length || 0;
     const t2Wins = tie.matches?.filter(m => m.winner_team_id === tie.team2_id).length || 0;
     
     if (t1Wins === t2Wins) {
        toast.error('Tie is currently a draw. Need a winner!');
        return;
     }

     const winnerId = t1Wins > t2Wins ? tie.team1_id : tie.team2_id;
     const loserId = t1Wins > t2Wins ? tie.team2_id : tie.team1_id;
     
     try {
        // 1. Update Tie Record
        await supabase
          .from('dc_ties')
          .update({
             winner_id: winnerId,
             status: 'completed',
             team1_rubbers_won: t1Wins,
             team2_rubbers_won: t2Wins
          })
          .eq('id', tie.id);
        
        // 2. Update Winner Standings
        await supabase.rpc('increment_dc_team_stats', {
           p_team_id: winnerId,
           p_won: true,
           p_rubbers_won: t1Wins > t2Wins ? t1Wins : t2Wins,
           p_rubbers_lost: t1Wins > t2Wins ? t2Wins : t1Wins
        });

        // 3. Update Loser Standings
        await supabase.rpc('increment_dc_team_stats', {
           p_team_id: loserId,
           p_won: false,
           p_rubbers_won: t1Wins < t2Wins ? t1Wins : t2Wins,
           p_rubbers_lost: t1Wins < t2Wins ? t2Wins : t1Wins
        });
        
        toast.success('Tie Finalized!');
        if (selectedTournament) fetchTies(selectedTournament.id);
     } catch (e) {
        toast.error('Error finalizing tie');
     }
  };

  return (
    <AdminLayout title="Special Events" subtitle="Manage Team Tournaments & Davis Cup Formats">
      
      {activeView === 'list' && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold text-white">Event Roster</h2>
            <button 
              onClick={() => setActiveView('create')}
              className="btn-primary flex items-center gap-2"
            >
              <FaPlus /> Build New Event
            </button>
          </div>

          {loading ? (
             <div className="text-white">Loading...</div>
          ) : tournaments.length === 0 ? (
            <div className="card text-center py-16">
              <FaTrophy className="text-6xl text-gray-600 mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-white mb-2">No Davis Cup Events</h2>
              <p className="text-gray-400">Click the button above to build your first team tournament.</p>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-6">
              {tournaments.map(t => (
                <div key={t.id} className="card border-gray-800 hover:border-blue-500/50 transition relative group">
                   <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition">
                      <button onClick={async (e) => {
                        e.stopPropagation();
                        if (confirm('Delete this entire event?')) {
                           await supabase.from('dc_tournaments').delete().eq('id', t.id);
                           fetchTournaments();
                        }
                      }} className="text-gray-500 hover:text-red-500 p-2"><FaTrash/></button>
                   </div>
                  <h3 className="text-xl font-bold text-white mb-2">{t.name}</h3>
                  <div className="flex items-center gap-2 text-gray-400 mb-4 text-sm">
                    <FaCalendarAlt /> {t.date || 'TBD'}
                  </div>
                  <div className="grid grid-cols-2 gap-4 mb-6">
                    <div className="bg-gray-800 p-3 rounded-lg text-center border border-gray-700">
                      <div className="text-2xl font-bold text-blue-400">{t.num_groups}</div>
                      <div className="text-xs text-gray-400 uppercase">Groups</div>
                    </div>
                    <div className="bg-gray-800 p-3 rounded-lg text-center border border-gray-700">
                      <div className="text-2xl font-bold text-yellow-400">{t.group_stage_rubbers}</div>
                      <div className="text-xs text-gray-400 uppercase">Rubbers</div>
                    </div>
                  </div>
                  <button 
                    onClick={() => {
                        setSelectedTournament(t);
                        fetchTeams(t.id);
                        fetchTies(t.id);
                        setActiveView('manage');
                        setMgmtTab('overview');
                    }}
                    className="w-full btn-secondary flex justify-center items-center gap-2"
                  >
                    <FaUsers /> Manage Event
                  </button>
                </div>
              ))}
            </div>
          )}
        </motion.div>
      )}

      {activeView === 'create' && (
        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}>
          <button 
            onClick={() => setActiveView('list')}
            className="flex items-center gap-2 text-gray-400 hover:text-white mb-6 transition"
          >
            <FaArrowLeft /> Back to Events
          </button>
          
          <div className="card max-w-2xl mx-auto">
            <h2 className="text-2xl font-bold text-white mb-6">Create Davis Cup Event</h2>
            <form onSubmit={handleCreateTournament} className="space-y-6">
              <div>
                <label className="label">Event Name</label>
                <input
                  required
                  type="text"
                  placeholder="e.g. Spinergy Summer Davis Cup 2026"
                  value={formData.name}
                  onChange={e => setFormData({...formData, name: e.target.value})}
                  className="input-field"
                />
              </div>
              <div>
                <label className="label">Start Date</label>
                <input
                  type="date"
                  value={formData.date}
                  onChange={e => setFormData({...formData, date: e.target.value})}
                  className="input-field"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label">Number of Groups</label>
                  <select 
                    className="input-field bg-gray-800"
                    value={formData.num_groups}
                    onChange={e => setFormData({...formData, num_groups: Number(e.target.value)})}
                  >
                    <option value={2}>2 Groups</option>
                    <option value={4}>4 Groups (Standard 16 Teams)</option>
                    <option value={8}>8 Groups</option>
                  </select>
                </div>
                <div>
                  <label className="label">Rubbers Per Group Tie</label>
                  <select 
                    className="input-field bg-gray-800"
                    value={formData.group_stage_rubbers}
                    onChange={e => setFormData({...formData, group_stage_rubbers: Number(e.target.value)})}
                  >
                    <option value={1}>1 Rubber (Standard Solo)</option>
                    <option value={3}>Best of 3 (2 Singles, 1 Doubles)</option>
                    <option value={5}>Best of 5 (4 Singles, 1 Doubles)</option>
                  </select>
                </div>
              </div>
              <button type="submit" className="w-full btn-primary py-3 text-lg mt-4">
                Deploy Framework
              </button>
            </form>
          </div>
        </motion.div>
      )}

      {activeView === 'manage' && selectedTournament && (
        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}>
          <div className="flex justify-between items-center mb-6">
            <button 
              onClick={() => setActiveView('list')}
              className="flex items-center gap-2 text-gray-400 hover:text-white transition"
            >
              <FaArrowLeft /> Back to Events
            </button>
            <div className="flex gap-2">
              <button 
                onClick={() => setMgmtTab('overview')}
                className={`px-4 py-2 rounded-lg text-sm font-semibold transition ${mgmtTab === 'overview' ? 'bg-blue-600 text-white' : 'bg-gray-800 text-gray-400 hover:bg-gray-700'}`}
              >
                Dashboard
              </button>
              <button 
                onClick={() => setMgmtTab('teams')}
                className={`px-4 py-2 rounded-lg text-sm font-semibold transition ${mgmtTab === 'teams' ? 'bg-blue-600 text-white' : 'bg-gray-800 text-gray-400 hover:bg-gray-700'}`}
              >
                Assemble Teams ({teams.length})
              </button>
              <button 
                onClick={() => setMgmtTab('matches')}
                className={`px-4 py-2 rounded-lg text-sm font-semibold transition ${mgmtTab === 'matches' ? 'bg-blue-600 text-white' : 'bg-gray-800 text-gray-400 hover:bg-gray-700'}`}
              >
                Ties & Matches ({ties.length})
              </button>
            </div>
          </div>
          
          <div className="card mb-6 bg-gradient-to-r from-blue-900/30 to-purple-900/30 border-blue-500/30">
            <h1 className="text-3xl font-black text-white">{selectedTournament.name}</h1>
            <p className="text-blue-400 mt-2 flex items-center gap-2 font-mono uppercase tracking-tighter text-sm">
              <FaTrophy /> {selectedTournament.status === 'upcoming' ? 'Registration Phase' : selectedTournament.status.replace('_', ' ')}
            </p>
          </div>

          {mgmtTab === 'overview' && (
            <div className="grid lg:grid-cols-3 gap-6">
               <div className="lg:col-span-2 space-y-6">
                  <div className="card border-blue-500/20 bg-blue-500/5">
                     <h3 className="text-xl font-bold text-white mb-2">Broadcast Center</h3>
                     <p className="text-gray-400 text-sm mb-4">
                        Link this Davis Cup event to the Homepage Live stream to show team points and rubber updates.
                     </p>
                     <div className="flex gap-4">
                        <div className="flex-1 bg-gray-800 rounded-lg p-3 text-center border border-gray-700">
                           <div className="text-xl font-bold text-white uppercase">{teams.length}</div>
                           <div className="text-[10px] text-gray-500 font-bold uppercase">Teams Ready</div>
                        </div>
                        <div className="flex-1 bg-gray-800 rounded-lg p-3 text-center border border-gray-700">
                           <div className="text-xl font-bold text-white uppercase">{ties.filter(t => t.status === 'in_progress').length}</div>
                           <div className="text-[10px] text-gray-500 font-bold uppercase">Active Ties</div>
                        </div>
                        <div className="flex-1 bg-gray-800 rounded-lg p-3 text-center border border-gray-700">
                           <div className="text-xl font-bold text-white uppercase">{selectedTournament.num_groups}</div>
                           <div className="text-[10px] text-gray-500 font-bold uppercase">Groups</div>
                        </div>
                     </div>
                  </div>
                  
                  <div className="card border-gray-800">
                     <h3 className="text-lg font-bold text-white mb-4">Live Track</h3>
                     <div className="space-y-3">
                        {teams.length === 0 ? (
                           <div className="text-gray-500 text-sm italic">No teams registered yet. Go to 'Assemble Teams' to begin.</div>
                        ) : (
                           teams.slice(0, 10).map(team => (
                             <div key={team.id} className="flex justify-between items-center py-2 border-b border-gray-800 last:border-0">
                                <div>
                                   <div className="text-white font-semibold">{team.name}</div>
                                   <div className="text-[10px] text-gray-500 font-bold uppercase">Group {String.fromCharCode(64+team.group_number!)}</div>
                                </div>
                                <div className="text-blue-400 font-bold">{team.players?.length || 0} Players</div>
                             </div>
                           ))
                        )}
                     </div>
                  </div>
               </div>
               <div className="space-y-6">
                  <div className="card bg-gray-900 border-gray-700">
                     <h3 className="text-lg font-bold text-white mb-4">Event Flow Tracker</h3>
                     <ul className="space-y-4">
                        <li className="flex items-center gap-3 text-green-400">
                          <FaCheckCircle className="text-green-500" />
                          <span className="font-semibold">Event Parameters Locked</span>
                        </li>
                        <li className={`flex items-center gap-3 ${teams.length > 0 ? 'text-green-400' : 'text-yellow-400 font-bold'}`}>
                          {teams.length > 0 ? <FaCheckCircle /> : <div className="w-4 h-4 rounded-full border-2 border-yellow-500"></div>}
                          <span>Assemble Teams ({teams.length}/{selectedTournament.num_groups * 4})</span>
                        </li>
                        <li className={`flex items-center gap-3 ${ties.length > 0 ? 'text-green-400' : 'text-gray-600'}`}>
                          {ties.length > 0 ? <FaCheckCircle /> : <div className="w-4 h-4 rounded-full border-2 border-gray-700"></div>}
                          <span>Generate Group Stage Ties ({ties.length})</span>
                        </li>
                        <li className="flex items-center gap-3 text-gray-600">
                          <div className="w-4 h-4 rounded-full border-2 border-gray-700"></div>
                          <span>Calculate Group Standings</span>
                        </li>
                        <li className="flex items-center gap-3 text-gray-600">
                          <div className="w-4 h-4 rounded-full border-2 border-gray-700"></div>
                          <span>Final Brackets Construction</span>
                        </li>
                     </ul>
                  </div>
               </div>
            </div>
          )}

          {mgmtTab === 'teams' && (
            <div className="space-y-6">
               <div className="flex justify-between items-center">
                  <h2 className="text-2xl font-bold text-white tracking-tight">Fleet Construction</h2>
                  <button 
                    onClick={() => setIsAddingTeam(true)}
                    className="btn-primary flex items-center gap-2"
                  >
                    <FaPlus /> New Team Entry
                  </button>
               </div>

               <AnimatePresence>
                 {isAddingTeam && (
                   <motion.div 
                     initial={{ opacity: 0, y: -10 }} 
                     animate={{ opacity: 1, y: 0 }}
                     exit={{ opacity: 0 }}
                     className="card border-blue-500 bg-blue-500/10"
                   >
                      <div className="flex gap-4">
                         <input 
                           autoFocus
                           placeholder="Enter Team Name..."
                           className="input-field flex-1"
                           value={newTeamName}
                           onChange={e => setNewTeamName(e.target.value)}
                           onKeyDown={e => e.key === 'Enter' && handleAddTeam()}
                         />
                         <button onClick={handleAddTeam} className="btn-primary flex items-center gap-2 px-8">
                            <FaSave /> Confirm Team
                         </button>
                         <button onClick={() => setIsAddingTeam(false)} className="btn-secondary">Cancel</button>
                      </div>
                   </motion.div>
                 )}
               </AnimatePresence>

               <div className="grid md:grid-cols-2 gap-6">
                  {teams.map(team => (
                    <div key={team.id} className="card border-gray-800 bg-gray-900/40">
                       <div className="flex justify-between items-start mb-4">
                          <div>
                             <h4 className="text-xl font-black text-white uppercase tracking-tighter italic">{team.name}</h4>
                             <div className="flex items-center gap-2 mt-1">
                                <span className="text-[10px] text-gray-500 font-black uppercase">Assign Group</span>
                                <select 
                                  value={team.group_number}
                                  onChange={e => handleUpdateTeamGroup(team.id, Number(e.target.value))}
                                  className="bg-gray-800 text-blue-400 text-xs font-bold px-1 rounded border border-gray-700"
                                >
                                   {Array.from({ length: selectedTournament.num_groups }, (_, i) => i + 1).map(g => (
                                      <option key={g} value={g}>Group {String.fromCharCode(64 + g)}</option>
                                   ))}
                                </select>
                             </div>
                          </div>
                          <button 
                            onClick={() => handleDeleteTeam(team.id)}
                            className="text-gray-600 hover:text-red-500 p-1 transition"
                          >
                             <FaSkull size={14} />
                          </button>
                       </div>

                       <div className="space-y-1 mb-4">
                          <div className="text-[10px] text-gray-600 font-bold uppercase tracking-widest mb-2 border-b border-gray-800 pb-1">Team Roster</div>
                          {team.players?.length === 0 ? (
                             <div className="text-xs text-gray-600 italic py-2">No players assigned.</div>
                          ) : (
                             team.players?.map(rosterEntry => (
                               <div key={rosterEntry.id} className="flex justify-between items-center bg-gray-800/50 p-2 rounded border border-gray-800 mb-1 group">
                                  <div className="flex items-center gap-2">
                                     <div className="w-5 h-5 bg-blue-500/20 text-blue-400 rounded-full flex items-center justify-center text-[10px] font-bold">
                                        {rosterEntry.player?.name?.[0] || 'P'}
                                     </div>
                                     <span className="text-sm text-gray-300 font-medium">{rosterEntry.player?.name}</span>
                                  </div>
                                  <button 
                                    onClick={() => handleRemovePlayer(team.id, rosterEntry.id)}
                                    className="text-gray-600 hover:text-red-500 opacity-0 group-hover:opacity-100 transition"
                                  >
                                     <FaTrash size={10} />
                                  </button>
                               </div>
                             ))
                          )}
                       </div>

                       <div className="relative pt-2">
                          <select 
                            className="w-full bg-gray-800 border border-gray-700 text-gray-300 text-xs rounded p-2 hover:border-blue-500 transition cursor-pointer"
                            value=""
                            onChange={e => handleAddPlayerToTeam(team.id, e.target.value)}
                          >
                             <option value="" disabled>+ Recruit Player to Roster</option>
                             {allPlayers
                               .filter(p => !teams.some(t => t.players?.some(tp => tp.player_id === p.id)))
                               .map(p => (
                                  <option key={p.id} value={p.id}>{p.name}</option>
                               ))
                             }
                          </select>
                       </div>
                    </div>
                  ))}
                  
                  {teams.length === 0 && !isAddingTeam && (
                    <div className="md:col-span-2 py-20 text-center border-2 border-dashed border-gray-800 rounded-xl">
                       <FaUsers className="text-5xl text-gray-800 mx-auto mb-4" />
                       <h3 className="text-xl font-bold text-gray-600 uppercase">Fleet Construction Required</h3>
                       <p className="text-gray-500 text-sm mt-2">Add your first team to begin building the Spinergy Specials rosters.</p>
                       <button 
                        onClick={() => setIsAddingTeam(true)}
                        className="mt-6 btn-primary px-8"
                      >
                         Initialize Fleet Entry
                      </button>
                    </div>
                  )}
               </div>
            </div>
          )}

          {mgmtTab === 'matches' && (
            <div className="space-y-6">
               {ties.length === 0 ? (
                 <div className="card text-center py-20">
                    <FaCogs className="text-6xl text-gray-700 mx-auto mb-6 animate-pulse" />
                    <h2 className="text-2xl font-black text-white uppercase tracking-tighter">Tie Generation Engine</h2>
                    <p className="text-gray-400 max-w-lg mx-auto mt-4">
                       Once your teams are fully assembled and group-assigned, hit the button below to scientifically generate the Round Robin ties for each group.
                    </p>
                    <button 
                      onClick={handleGenerateGroupStage}
                      className="mt-8 btn-primary px-12"
                    >
                       Generate Group Stage ties
                    </button>
                    <div className="mt-4 text-xs text-gray-600 font-mono">
                       Algorithm: Round Robin [ {selectedTournament.group_stage_rubbers} Rubbers / Tie ]
                    </div>
                 </div>
               ) : (
                 <div className="grid gap-6">
                    {/* Groups Filter/Header */}
                    <div className="flex gap-2 bg-gray-900 p-2 rounded-xl sticky top-0 z-20 border border-gray-800 flex-wrap">
                       {Array.from({ length: selectedTournament.num_groups }, (_, i) => i + 1).map(g => (
                          <button 
                            key={g} 
                            onClick={() => setActiveTieGroup(g)}
                            className={`px-4 py-2 rounded font-bold text-sm transition-all ${
                               activeTieGroup === g 
                               ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20' 
                               : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                            }`}
                          >
                             Group {String.fromCharCode(64+g)}
                          </button>
                       ))}
                    </div>

                    <div className="grid lg:grid-cols-2 gap-4">
                       {ties.filter(t => t.group_number === activeTieGroup).map(tie => (
                          <div key={tie.id} className="card border-gray-800 hover:border-gray-700 transition">
                             <div className="flex justify-between items-center mb-4 border-b border-gray-800 pb-3">
                                <div className="text-xs text-gray-500 font-bold uppercase">
                                   Group {String.fromCharCode(64+tie.group_number!)} Encounter
                                </div>
                                <div className={`text-[10px] font-black px-2 py-0.5 rounded ${
                                   tie.status === 'completed' ? 'bg-green-500/20 text-green-400' : 'bg-blue-500/20 text-blue-400'
                                }`}>
                                   {tie.status.toUpperCase()}
                                </div>
                             </div>

                             <div className="flex items-center justify-between gap-4 mb-6">
                                <div className="text-center flex-1">
                                   <div className="text-xl font-black text-white tracking-tighter">{tie.team1?.name}</div>
                                   <div className="text-3xl font-black text-blue-500 mt-1">{tie.team1_rubbers_won}</div>
                                </div>
                                <div className="text-gray-600 font-black italic">VS</div>
                                <div className="text-center flex-1">
                                   <div className="text-xl font-black text-white tracking-tighter">{tie.team2?.name}</div>
                                   <div className="text-3xl font-black text-blue-500 mt-1">{tie.team2_rubbers_won}</div>
                                </div>
                             </div>

                             <div className="space-y-2 mb-4">
                                {tie.matches?.map(m => (
                                   <div key={m.id} className="flex flex-col bg-gray-800/50 p-3 rounded-lg border border-gray-800 hover:border-blue-500/30 transition group">
                                      <div className="flex justify-between items-center mb-2">
                                         <div className="flex items-center gap-2">
                                            <span className="text-gray-500 font-bold text-[10px] uppercase">Rubber #{m.match_number}</span>
                                            <span className={`text-[10px] font-bold px-1.5 rounded ${m.rubber_type === 'singles' ? 'bg-purple-500/10 text-purple-400' : 'bg-orange-500/10 text-orange-400'}`}>
                                               {m.rubber_type.toUpperCase()}
                                            </span>
                                         </div>
                                         <div className="flex items-center gap-3">
                                            <span className={`text-sm font-black ${m.winner_team_id ? 'text-green-400' : 'text-gray-400'}`}>
                                               {m.team1_sets_won} - {m.team2_sets_won}
                                            </span>
                                            <button 
                                              onClick={() => {
                                                 setSelectedTie(tie);
                                                 setScoringMatch(m);
                                              }}
                                              className="text-blue-400 hover:text-white transition opacity-0 group-hover:opacity-100"
                                            >
                                               <FaEdit size={14} />
                                            </button>
                                         </div>
                                      </div>
                                      
                                      <div className="flex justify-between items-center text-[11px] font-medium">
                                         <div className="text-gray-300 truncate max-w-[120px]">
                                            {(m as any).team1_player1?.name || '(TBD)'}
                                            {m.rubber_type === 'doubles' && ` / ${(m as any).team1_player2?.name || '(TBD)'}`}
                                         </div>
                                         <div className="text-gray-600 italic">vs</div>
                                         <div className="text-gray-300 text-right truncate max-w-[120px]">
                                            {(m as any).team2_player1?.name || '(TBD)'}
                                            {m.rubber_type === 'doubles' && ` / ${(m as any).team2_player2?.name || '(TBD)'}`}
                                         </div>
                                      </div>
                                   </div>
                                ))}
                             </div>

                             {tie.status !== 'completed' && (
                                <button 
                                  onClick={() => handleFinalizeTie(tie)}
                                  className="w-full btn-secondary text-xs py-2 bg-gray-800 border-gray-700 hover:border-green-500/50 hover:text-green-400 transition"
                                >
                                   Finalize Tie Result
                                </button>
                             )}
                          </div>
                       ))}
                    </div>
                 </div>
               )}
            </div>
          )}
        </motion.div>
      )}

      {/* Scoring & Lineup Modal */}
      <AnimatePresence>
         {scoringMatch && selectedTie && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
               <motion.div 
                 initial={{ opacity: 0, scale: 0.9 }}
                 animate={{ opacity: 1, scale: 1 }}
                 exit={{ opacity: 0, scale: 0.9 }}
                 className="card w-full max-w-2xl border-blue-500/50 max-h-[90vh] overflow-y-auto"
               >
                  <div className="flex justify-between items-center mb-6">
                     <div>
                        <h2 className="text-xl font-bold text-white uppercase italic tracking-tighter">Rubber Management</h2>
                        <p className="text-xs text-blue-400 font-mono">#{scoringMatch.match_number} | {scoringMatch.rubber_type.toUpperCase()}</p>
                     </div>
                     <button onClick={() => setScoringMatch(null)} className="text-gray-400 hover:text-white p-2 flex items-center gap-2 transition hover:bg-white/5 rounded-lg border border-transparent hover:border-white/10">
                        <FaTimes />
                     </button>
                  </div>

                  <div className="space-y-6">
                     {/* Lineup Selection Section */}
                     <div className="grid md:grid-cols-2 gap-4 p-4 bg-gray-900/50 rounded-xl border border-gray-800 relative">
                        <button 
                          onClick={handleSwapPlayers}
                          className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-10 p-2 bg-gray-800 text-blue-400 rounded-full border border-gray-700 hover:bg-blue-600 hover:text-white transition shadow-xl"
                          title="Swap Team Positions"
                        >
                           <FaPlay className="rotate-90 scale-x-[-1]" />
                        </button>

                        <div className="space-y-3">
                           <div className="flex items-center gap-2 mb-2">
                              <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                              <span className="text-[10px] text-gray-400 font-black uppercase tracking-widest">{selectedTie.team1?.name} Lineup</span>
                           </div>
                           <select 
                             className="w-full bg-gray-800 text-white text-xs p-2 rounded border border-gray-700 focus:border-blue-500 outline-none"
                             value={scoringMatch.team1_player1_id || ''}
                             onChange={e => setScoringMatch({...scoringMatch, team1_player1_id: e.target.value})}
                           >
                              <option value="">Select Player 1</option>
                              {selectedTie.team1?.players?.map(p => (
                                 <option key={p.player_id} value={p.player_id}>{p.player?.name}</option>
                              ))}
                           </select>
                           {scoringMatch.rubber_type === 'doubles' && (
                              <select 
                                className="w-full bg-gray-800 text-white text-xs p-2 rounded border border-gray-700 focus:border-blue-500 outline-none"
                                value={scoringMatch.team1_player2_id || ''}
                                onChange={e => setScoringMatch({...scoringMatch, team1_player2_id: e.target.value})}
                              >
                                 <option value="">Select Player 2</option>
                                 {selectedTie.team1?.players?.map(p => (
                                    <option key={p.player_id} value={p.player_id}>{p.player?.name}</option>
                                 ))}
                              </select>
                           )}
                        </div>

                        <div className="space-y-3">
                           <div className="flex items-center gap-2 mb-2 justify-end">
                              <span className="text-[10px] text-gray-400 font-black uppercase tracking-widest">{selectedTie.team2?.name} Lineup</span>
                              <div className="w-2 h-2 rounded-full bg-red-500"></div>
                           </div>
                           <select 
                             className="w-full bg-gray-800 text-white text-xs p-2 rounded border border-gray-700 focus:border-blue-500 outline-none"
                             value={scoringMatch.team2_player1_id || ''}
                             onChange={e => setScoringMatch({...scoringMatch, team2_player1_id: e.target.value})}
                           >
                              <option value="">Select Player 1</option>
                              {selectedTie.team2?.players?.map(p => (
                                 <option key={p.player_id} value={p.player_id}>{p.player?.name}</option>
                              ))}
                           </select>
                           {scoringMatch.rubber_type === 'doubles' && (
                              <select 
                                className="w-full bg-gray-800 text-white text-xs p-2 rounded border border-gray-700 focus:border-blue-500 outline-none"
                                value={scoringMatch.team2_player2_id || ''}
                                onChange={e => setScoringMatch({...scoringMatch, team2_player2_id: e.target.value})}
                              >
                                 <option value="">Select Player 2</option>
                                 {selectedTie.team2?.players?.map(p => (
                                    <option key={p.player_id} value={p.player_id}>{p.player?.name}</option>
                                 ))}
                              </select>
                           )}
                        </div>
                     </div>

                     {/* Scoring Input Section */}
                     <div className="grid grid-cols-2 gap-8 text-center pt-4 border-t border-gray-800">
                        <div>
                           <div className="text-gray-500 text-[10px] mb-2 uppercase font-black tracking-widest">Sets Won</div>
                           <input 
                             type="number" 
                             className="w-full bg-gray-900 text-6xl font-black text-center py-6 rounded-2xl border-2 border-transparent focus:border-blue-500 text-white transition-all shadow-inner"
                             defaultValue={scoringMatch.team1_sets_won}
                             id="t1s"
                             min="0"
                             max="3"
                           />
                        </div>
                        <div>
                           <div className="text-gray-500 text-[10px] mb-2 uppercase font-black tracking-widest">Sets Won</div>
                           <input 
                             type="number" 
                             className="w-full bg-gray-900 text-6xl font-black text-center py-6 rounded-2xl border-2 border-transparent focus:border-red-500 text-white transition-all shadow-inner"
                             defaultValue={scoringMatch.team2_sets_won}
                             id="t2s"
                             min="0"
                             max="3"
                           />
                        </div>
                     </div>

                     <div className="flex gap-4">
                        <button 
                          onClick={() => setScoringMatch(null)}
                          className="flex-1 btn-secondary py-4 font-bold uppercase tracking-wider"
                        >
                           Discard
                        </button>
                        <button 
                          onClick={() => {
                             const s1 = parseInt((document.getElementById('t1s') as HTMLInputElement).value) || 0;
                             const s2 = parseInt((document.getElementById('t2s') as HTMLInputElement).value) || 0;
                             
                             const lineup = {
                                team1_player1_id: scoringMatch.team1_player1_id,
                                team1_player2_id: scoringMatch.team1_player2_id,
                                team2_player1_id: scoringMatch.team2_player1_id,
                                team2_player2_id: scoringMatch.team2_player2_id,
                             };

                             handleUpdateMatchScore(scoringMatch, s1, s2, lineup);
                          }}
                          className="flex-[2] btn-primary py-4 text-lg font-black uppercase tracking-widest shadow-xl shadow-blue-500/20 group"
                        >
                           Commit Victory & Stats
                        </button>
                     </div>
                  </div>
               </motion.div>
            </div>
         )}
      </AnimatePresence>

    </AdminLayout>
  );
};

export default AdminSpecialEvents;
