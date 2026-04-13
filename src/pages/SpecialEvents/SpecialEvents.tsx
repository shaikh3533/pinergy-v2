import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FaTrophy, 
  FaCalendarAlt, 
  FaUsers, 
  FaArrowLeft, 
  FaMedal, 
  FaChevronRight, 
  FaTableTennis,
  FaTimes,
  FaPlay,
  FaEdit
} from 'react-icons/fa';
import { supabase } from '../../lib/supabase';
import type { DCTournament, DCTeam } from '../../lib/supabase';

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
  matches?: DCMatch[];
}

interface DCMatch {
  id: string;
  tie_id: string;
  match_number: number;
  rubber_type: 'singles' | 'doubles';
  status: string;
  team1_player1: { name: string };
  team1_player2?: { name: string };
  team2_player1: { name: string };
  team2_player2?: { name: string };
  team1_sets_won: number;
  team2_sets_won: number;
  winner_team_id?: string;
}

const SpecialEvents = () => {
  const [tournaments, setTournaments] = useState<DCTournament[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Drill-down states
  const [selectedTournament, setSelectedTournament] = useState<DCTournament | null>(null);
  const [teams, setTeams] = useState<DCTeam[]>([]);
  const [ties, setTies] = useState<DCTie[]>([]);
  const [activeGroup, setActiveGroup] = useState<number>(1);
  const [viewingTie, setViewingTie] = useState<DCTie | null>(null);

  useEffect(() => {
    fetchTournaments();
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

  const fetchTournamentPool = async (id: string) => {
    setLoading(true);
    // Fetch Teams
    const { data: teamData } = await supabase
      .from('dc_teams')
      .select('*')
      .eq('tournament_id', id);
    if (teamData) setTeams(teamData);

    // Fetch Ties & Matches
    const { data: tieData } = await supabase
      .from('dc_ties')
      .select('*, team1:dc_teams!team1_id(name), team2:dc_teams!team2_id(name), matches:dc_matches(*, team1_player1:users!team1_player1_id(name), team1_player2:users!team1_player2_id(name), team2_player1:users!team2_player1_id(name), team2_player2:users!team2_player2_id(name))')
      .eq('tournament_id', id)
      .order('group_number');
    if (tieData) setTies(tieData);
    
    setLoading(false);
  };

  const handleSelectTournament = (t: DCTournament) => {
    setSelectedTournament(t);
    fetchTournamentPool(t.id);
  };

  return (
    <div className="min-h-screen py-12 px-4 bg-[#0a0f18]">
      <div className="max-w-7xl mx-auto">
        <AnimatePresence mode="wait">
          {!selectedTournament ? (
            <motion.div 
              key="list"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
            >
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
                <div>
                  <h1 className="text-5xl md:text-6xl font-black uppercase text-white tracking-widest leading-none style-glow">
                    Spinergy <span className="text-blue-500">Specials</span>
                  </h1>
                  <p className="text-gray-400 mt-4 text-lg font-medium tracking-tight">
                    Premium Team Formats & International Davis Cup Glory
                  </p>
                </div>
                <div className="flex items-center gap-4 bg-gray-900/50 p-4 rounded-2xl border border-gray-800">
                   <div className="text-right">
                      <div className="text-2xl font-black text-white">2026</div>
                      <div className="text-[10px] text-blue-400 uppercase font-black tracking-widest">Tournament Season</div>
                   </div>
                   <FaTrophy className="text-4xl text-yellow-500" />
                </div>
              </div>

              {loading ? (
                <div className="flex items-center justify-center py-20">
                   <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                </div>
              ) : tournaments.length === 0 ? (
                <div className="card text-center py-20 bg-gray-900/40 border-gray-800">
                  <FaCalendarAlt className="text-7xl text-gray-700 mx-auto mb-6" />
                  <h2 className="text-3xl font-black text-white uppercase mb-2">Dark Schedule</h2>
                  <p className="text-gray-500">No special events are currently active. Check back for the Lahore Open.</p>
                </div>
              ) : (
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                  {tournaments.map((tournament) => (
                    <motion.div 
                      key={tournament.id}
                      whileHover={{ y: -10 }}
                      className="group relative"
                    >
                      <div className="absolute inset-0 bg-gradient-to-br from-blue-600/20 to-purple-600/20 rounded-3xl blur-xl opacity-0 group-hover:opacity-100 transition duration-500"></div>
                      <div className="card h-full bg-[#111827] border-gray-800 hover:border-blue-500/50 transition relative overflow-hidden flex flex-col">
                        <div className="p-2 mb-4">
                           <div className={`inline-block px-3 py-1 rounded-full text-[10px] font-black tracking-widest uppercase ${
                              tournament.status === 'completed' ? 'bg-green-500/10 text-green-400' :
                              tournament.status === 'upcoming' ? 'bg-blue-500/10 text-blue-400' :
                              'bg-yellow-500/10 text-yellow-400'
                           }`}>
                              {tournament.status.replace('_', ' ')}
                           </div>
                        </div>
                        
                        <h3 className="text-2xl font-black text-white mb-2 leading-tight uppercase italic">{tournament.name}</h3>
                        
                        <div className="space-y-3 mb-8">
                           <div className="flex items-center gap-2 text-gray-400 text-sm">
                              <FaCalendarAlt size={14} className="text-blue-500" />
                              <span className="font-medium text-gray-300">{tournament.date || 'To Be Announced'}</span>
                           </div>
                           <div className="flex items-center gap-2 text-gray-400 text-sm">
                              <FaUsers size={14} className="text-purple-500" />
                              <span className="font-medium text-gray-300">{tournament.num_groups} Groups • {tournament.group_stage_rubbers} Rubbers</span>
                           </div>
                        </div>

                        <div className="mt-auto">
                           <button 
                             onClick={() => handleSelectTournament(tournament)}
                             className="w-full bg-blue-600 hover:bg-blue-500 text-white font-black py-4 rounded-xl transition flex items-center justify-center gap-2 uppercase tracking-widest text-xs"
                           >
                              Enter Arena <FaChevronRight size={10} />
                           </button>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </motion.div>
          ) : (
            <motion.div 
              key="details"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
            >
              <button 
                onClick={() => setSelectedTournament(null)}
                className="flex items-center gap-2 text-gray-400 hover:text-white mb-8 transition font-bold uppercase text-xs tracking-widest"
              >
                <FaArrowLeft /> Exit Tournament
              </button>

              <div className="flex flex-col lg:flex-row justify-between items-start gap-8 mb-12">
                 <div className="flex-1">
                    <h1 className="text-4xl md:text-6xl font-black text-white uppercase italic tracking-tighter leading-none mb-4">
                       {selectedTournament.name}
                    </h1>
                    <div className="flex flex-wrap gap-4">
                       <span className="bg-blue-500 text-white px-3 py-1 rounded text-xs font-black uppercase tracking-widest italic flex items-center gap-2">
                          <FaTrophy /> {selectedTournament.status === 'group_stage' ? 'Round Robin Live' : selectedTournament.status.replace('_', ' ')}
                       </span>
                       <span className="bg-gray-800 text-gray-400 px-3 py-1 rounded text-xs font-bold uppercase flex items-center gap-2 border border-gray-700">
                          <FaTableTennis /> {selectedTournament.group_stage_rubbers} Rubbers Format
                       </span>
                    </div>
                 </div>

                 <div className="flex gap-2 bg-gray-900/50 p-2 rounded-2xl border border-gray-800">
                    {Array.from({ length: selectedTournament.num_groups }, (_, i) => i + 1).map(g => (
                       <button
                         key={g}
                         onClick={() => setActiveGroup(g)}
                         className={`px-6 py-3 rounded-xl text-sm font-black transition uppercase tracking-widest ${
                           activeGroup === g 
                             ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20' 
                             : 'text-gray-500 hover:text-gray-300 hover:bg-white/5'
                         }`}
                       >
                          Pool {String.fromCharCode(64+g)}
                       </button>
                    ))}
                 </div>
              </div>

              <div className="grid lg:grid-cols-3 gap-12">
                 {/* Standings Table */}
                 <div className="lg:col-span-1">
                    <h2 className="text-xl font-black text-white uppercase tracking-widest mb-6 flex items-center gap-3 italic">
                       <FaMedal className="text-yellow-500" /> Group Standing
                    </h2>
                    <div className="card p-0 overflow-hidden border-gray-800 bg-[#111827]/50 backdrop-blur-md">
                       <table className="w-full text-left">
                          <thead className="bg-gray-800/80">
                             <tr className="text-[10px] text-gray-400 uppercase font-black tracking-widest">
                                <th className="px-4 py-4">Fleet</th>
                                <th className="px-2 py-4 text-center">Ties</th>
                                <th className="px-2 py-4 text-center text-blue-400">Pts</th>
                             </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-800">
                             {teams.filter(t => t.group_number === activeGroup).sort((a,b) => (b.wins || 0) - (a.wins || 0)).map((team, idx) => (
                                <tr key={team.id} className="hover:bg-white/[0.02] transition">
                                   <td className="px-4 py-4">
                                      <div className="flex items-center gap-3">
                                         <span className={`text-xs font-black ${idx < 2 ? 'text-blue-500' : 'text-gray-600'}`}>0{idx+1}</span>
                                         <span className="text-white font-bold text-sm uppercase tracking-tight">{team.name}</span>
                                      </div>
                                   </td>
                                   <td className="px-2 py-4 text-center text-gray-300 font-mono text-xs">
                                      {team.wins || 0}W - {team.losses || 0}L
                                   </td>
                                   <td className="px-2 py-4 text-center">
                                      <span className="text-blue-400 font-black text-sm">{(team.wins || 0) * 2}</span>
                                   </td>
                                </tr>
                             ))}
                          </tbody>
                       </table>
                    </div>
                    <p className="mt-4 text-[10px] text-gray-500 font-medium uppercase tracking-widest leading-relaxed">
                       Top 2 teams from this pool advance to the traditional Best-of-5 Knockout Brackets.
                    </p>
                 </div>

                 {/* Ties / Matches */}
                 <div className="lg:col-span-2">
                    <h2 className="text-xl font-black text-white uppercase tracking-widest mb-6 flex items-center gap-3 italic">
                       <FaPlay className="text-blue-500" /> Match Ledger
                    </h2>
                    
                    <div className="grid gap-4">
                       {ties.filter(t => t.group_number === activeGroup).length === 0 ? (
                          <div className="p-12 text-center bg-gray-900/20 border-2 border-dashed border-gray-800 rounded-3xl">
                             <p className="text-gray-500 uppercase font-black tracking-widest italic">Encounters Not Yet Drawn</p>
                          </div>
                       ) : (
                          ties.filter(t => t.group_number === activeGroup).map(tie => (
                             <div key={tie.id} className="card bg-[#111827] border-gray-800 hover:border-gray-700 transition relative group/tie">
                                <div className="flex justify-between items-center gap-8">
                                   <div className="flex-1 flex items-center justify-between gap-4">
                                      <div className="text-right flex-1">
                                         <div className={`text-lg font-black uppercase tracking-tighter transition ${tie.winner_id === tie.team1_id ? 'text-blue-400 scale-105' : 'text-white font-medium opacity-80'}`}>
                                            {tie.team1?.name}
                                         </div>
                                         <div className="text-4xl font-black text-white mt-1">{tie.team1_rubbers_won}</div>
                                      </div>
                                      
                                      <div className="flex flex-col items-center gap-2">
                                         <div className="px-3 py-1 bg-gray-800 rounded-full text-[8px] font-black tracking-[0.2em] text-gray-500 uppercase">VS</div>
                                      </div>

                                      <div className="text-left flex-1">
                                         <div className={`text-lg font-black uppercase tracking-tighter transition ${tie.winner_id === tie.team2_id ? 'text-blue-400 scale-105' : 'text-white font-medium opacity-80'}`}>
                                            {tie.team2?.name}
                                         </div>
                                         <div className="text-4xl font-black text-white mt-1">{tie.team2_rubbers_won}</div>
                                      </div>
                                   </div>

                                   <button 
                                     onClick={() => setViewingTie(tie)}
                                     className="bg-gray-800 hover:bg-blue-600 text-white p-4 rounded-2xl transition shadow-xl"
                                   >
                                      <FaEdit size={18} />
                                   </button>
                                </div>
                                <div className="mt-4 pt-4 border-t border-gray-800 flex justify-center">
                                   <div className="text-[10px] text-gray-500 uppercase font-black tracking-widest italic">
                                      {tie.status === 'completed' ? 'Final Result Verified' : 'Live Scoreboard Active'}
                                   </div>
                                </div>
                             </div>
                          ))
                       )}
                    </div>
                 </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Detailed Scorecard Modal */}
        <AnimatePresence>
           {viewingTie && (
              <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/90 backdrop-blur-xl">
                 <motion.div 
                   initial={{ opacity: 0, y: 50, scale: 0.9 }}
                   animate={{ opacity: 1, y: 0, scale: 1 }}
                   exit={{ opacity: 0, y: 50, scale: 0.9 }}
                   className="w-full max-w-4xl bg-[#0f172a] rounded-[2rem] border border-white/10 shadow-2xl overflow-hidden max-h-[90vh] flex flex-col"
                 >
                    <div className="p-8 border-b border-white/5 bg-gradient-to-r from-blue-900/20 to-purple-900/20 flex justify-between items-center">
                       <div>
                          <h2 className="text-3xl font-black text-white uppercase italic tracking-tighter">Tie <span className="text-blue-500">Breakdown</span></h2>
                          <div className="flex items-center gap-2 mt-2">
                             <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
                             <span className="text-[10px] text-gray-400 font-black uppercase tracking-[0.2em]">Verified Rubber Stats</span>
                          </div>
                       </div>
                       <button 
                         onClick={() => setViewingTie(null)}
                         className="p-3 bg-white/5 hover:bg-white/10 text-white rounded-2xl transition border border-white/5"
                       >
                          <FaTimes size={20} />
                       </button>
                    </div>

                    <div className="p-8 overflow-y-auto space-y-6">
                       <div className="flex justify-around items-center py-8 bg-gray-900/40 rounded-[2rem] border border-gray-800">
                          <div className="text-center">
                             <div className="text-xs text-gray-500 uppercase font-black mb-2">Challenger A</div>
                             <div className="text-2xl font-black text-white uppercase tracking-tighter">{viewingTie.team1?.name}</div>
                          </div>
                          <div className="text-6xl font-black text-blue-500 italic">{viewingTie.team1_rubbers_won} <span className="text-xl text-gray-700 mx-2">VS</span> {viewingTie.team2_rubbers_won}</div>
                          <div className="text-center">
                             <div className="text-xs text-gray-500 uppercase font-black mb-2">Challenger B</div>
                             <div className="text-2xl font-black text-white uppercase tracking-tighter">{viewingTie.team2?.name}</div>
                          </div>
                       </div>

                       <div className="grid gap-4">
                          {viewingTie.matches?.map(match => (
                             <div key={match.id} className="bg-[#1e293b]/50 p-6 rounded-3xl border border-white/5 flex items-center justify-between group">
                                <div className="flex-1">
                                   <div className="text-[10px] text-blue-400 uppercase font-black mb-3 italic tracking-widest">
                                      Rubber #{match.match_number} | {match.rubber_type.toUpperCase()}
                                   </div>
                                   <div className="flex items-center justify-between gap-4">
                                      <div className="flex-1">
                                         <div className="text-white font-black text-lg truncate tracking-tight transition group-hover:text-blue-400 uppercase italic">
                                            {match.team1_player1?.name || '(TBD)'}
                                            {match.rubber_type === 'doubles' && ` & ${match.team1_player2?.name || '(TBD)'}`}
                                         </div>
                                      </div>
                                      <div className="bg-gray-800/80 px-4 py-2 rounded-xl text-xl font-black text-white italic border border-gray-700">
                                         {match.team1_sets_won} - {match.team2_sets_won}
                                      </div>
                                      <div className="flex-1 text-right">
                                         <div className="text-white font-black text-lg truncate tracking-tight transition group-hover:text-blue-400 uppercase italic">
                                            {match.team2_player1?.name || '(TBD)'}
                                            {match.rubber_type === 'doubles' && ` & ${match.team2_player2?.name || '(TBD)'}`}
                                         </div>
                                      </div>
                                   </div>
                                </div>
                             </div>
                          ))}
                       </div>
                    </div>

                    <div className="p-8 bg-gray-900/50 border-t border-white/5 text-center">
                       <p className="text-[10px] text-gray-500 font-bold uppercase tracking-[0.3em]">
                          Spinergy Professional Tournament Series • 2026 Season
                       </p>
                    </div>
                 </motion.div>
              </div>
           )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default SpecialEvents;
