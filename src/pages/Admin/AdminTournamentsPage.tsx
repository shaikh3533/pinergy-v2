import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { 
  FaTrophy, 
  FaPlus, 
  FaUsers, 
  FaCalendarAlt,
  FaTrash,
  FaPlay,
  FaCheck,
  FaSearch,
  FaChevronRight,
  FaTableTennis,
  FaEdit
} from 'react-icons/fa';
import { supabase } from '../../lib/supabase';
import type { League, LeaguePlayer, User, LeagueStatus } from '../../lib/supabase';
import { format } from 'date-fns';
import AdminLayout from '../../components/Admin/AdminLayout';

import type { LeagueType } from '../../lib/supabase';

interface CreateLeagueForm {
  name: string;
  league_type: LeagueType;
  date: string;
  rules: string;
  max_players: number;
  // Match format
  group_stage_sets: number;
  quarterfinal_sets: number;
  semifinal_sets: number;
  final_sets: number;
  // Qualification
  top_qualifiers: number;
  // Group settings
  num_groups: number;
  qualifiers_per_group: number;
  // Knockout settings
  has_third_place_match: boolean;
  has_quarterfinals: boolean;
}

const TOURNAMENT_TYPES = [
  { 
    value: 'round_robin' as LeagueType, 
    label: 'Round Robin Only',
    description: 'Every player plays every other player. Best for 4-8 players.',
    icon: '🔄'
  },
  { 
    value: 'round_robin_knockouts' as LeagueType, 
    label: 'Round Robin + Knockouts',
    description: 'Round robin stage, then top players compete in knockout bracket.',
    icon: '🏆'
  },
  { 
    value: 'group_stage_knockouts' as LeagueType, 
    label: 'Group Stage + Knockouts',
    description: 'Players divided into groups. Top from each group advance to knockouts.',
    icon: '👥'
  },
  { 
    value: 'single_elimination' as LeagueType, 
    label: 'Single Elimination',
    description: 'Direct knockout bracket. Lose once and you\'re out.',
    icon: '⚡'
  },
  { 
    value: 'double_elimination' as LeagueType, 
    label: 'Double Elimination',
    description: 'Knockout with losers bracket. Must lose twice to be eliminated.',
    icon: '🔥'
  },
];

const getDefaultRules = (type: LeagueType): string => {
  const baseRules = `Match Format:
- Games to 11 points (win by 2)
- Players alternate serves every 2 points

Points System:
- Participation: 5 pts
- Top 6: +5 pts
- Top 4: +5 pts
- Runner-Up: +5 pts
- Champion: +10 pts`;

  switch (type) {
    case 'round_robin':
      return `Tournament Format: Round Robin
- Every player plays every other player once
- Rankings based on wins, then point difference
- Winner is player with most wins

${baseRules}`;
    
    case 'round_robin_knockouts':
      return `Tournament Format: Round Robin + Knockouts
- Round Robin: Each player plays every other player
- Top 4 qualify for knockout stage
- Semi-Finals: 1st vs 4th, 2nd vs 3rd
- Final: Winners compete for championship

${baseRules}`;
    
    case 'group_stage_knockouts':
      return `Tournament Format: Group Stage + Knockouts
- Players divided into groups
- Each player plays others in their group
- Top players from each group advance
- Knockout stage determines champion

${baseRules}`;
    
    case 'single_elimination':
      return `Tournament Format: Single Elimination
- Direct knockout bracket
- Lose one match and you're eliminated
- Winner advances to next round
- Final determines champion

${baseRules}`;
    
    case 'double_elimination':
      return `Tournament Format: Double Elimination
- Two brackets: Winners and Losers
- First loss moves you to Losers bracket
- Second loss eliminates you
- Grand Final: Winners bracket champion vs Losers bracket champion

${baseRules}`;
    
    default:
      return baseRules;
  }
};

const AdminTournamentsPage = () => {
  const [activeView, setActiveView] = useState<'list' | 'create' | 'manage'>('list');
  const [leagues, setLeagues] = useState<League[]>([]);
  const [selectedLeague, setSelectedLeague] = useState<League | null>(null);
  const [leaguePlayers, setLeaguePlayers] = useState<LeaguePlayer[]>([]);
  const [allPlayers, setAllPlayers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  const [formData, setFormData] = useState<CreateLeagueForm>({
    name: '',
    league_type: 'round_robin_knockouts',
    date: '',
    rules: getDefaultRules('round_robin_knockouts'),
    max_players: 16,
    group_stage_sets: 1,
    quarterfinal_sets: 3,
    semifinal_sets: 3,
    final_sets: 5,
    top_qualifiers: 4,
    num_groups: 2,
    qualifiers_per_group: 2,
    has_third_place_match: true,
    has_quarterfinals: false,
  });

  const [playerSearchTerm, setPlayerSearchTerm] = useState('');
  const [playerSearchResults, setPlayerSearchResults] = useState<User[]>([]);
  const [newPlayerName, setNewPlayerName] = useState('');
  const [showNewPlayerForm, setShowNewPlayerForm] = useState(false);

  useEffect(() => {
    fetchLeagues();
    fetchAllPlayers();
  }, []);

  const fetchLeagues = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('leagues')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (!error) setLeagues(data || []);
    setLoading(false);
  };

  const fetchAllPlayers = async () => {
    const { data } = await supabase.from('users').select('*').order('name');
    if (data) setAllPlayers(data);
  };

  const fetchLeaguePlayers = async (leagueId: string) => {
    const { data } = await supabase
      .from('league_players')
      .select('*, player:player_id(*)')
      .eq('league_id', leagueId)
      .order('seed_number');
    
    setLeaguePlayers(data || []);
  };

  useEffect(() => {
    if (playerSearchTerm.length >= 2) {
      const filtered = allPlayers.filter(p => 
        p.name.toLowerCase().includes(playerSearchTerm.toLowerCase()) ||
        p.phone?.includes(playerSearchTerm)
      );
      setPlayerSearchResults(filtered.slice(0, 10));
    } else {
      setPlayerSearchResults([]);
    }
  }, [playerSearchTerm, allPlayers]);

  const handleCreateLeague = async () => {
    if (!formData.name.trim()) {
      toast.error('Please enter a league name');
      return;
    }
    if (!formData.date) {
      toast.error('Please select a date');
      return;
    }

    const leagueData = {
      name: formData.name,
      league_type: formData.league_type,
      date: formData.date,
      rules: formData.rules,
      max_players: formData.max_players,
      group_stage_sets: formData.group_stage_sets,
      round_robin_sets: formData.group_stage_sets, // Legacy field
      quarterfinal_sets: formData.quarterfinal_sets,
      semifinal_sets: formData.semifinal_sets,
      final_sets: formData.final_sets,
      top_qualifiers: formData.top_qualifiers,
      num_groups: formData.league_type === 'group_stage_knockouts' ? formData.num_groups : null,
      qualifiers_per_group: formData.league_type === 'group_stage_knockouts' ? formData.qualifiers_per_group : null,
      has_third_place_match: formData.has_third_place_match,
      has_quarterfinals: formData.has_quarterfinals,
      schedule_days: [],
      frequency: 'single',
      status: 'upcoming' as const,
    };

    const { error } = await supabase.from('leagues').insert(leagueData);

    if (error) {
      console.error('Error creating league:', error);
      toast.error('Failed to create league');
    } else {
      toast.success(`Tournament "${formData.name}" created!`);
      setFormData({
        ...formData,
        name: '',
        date: '',
        rules: getDefaultRules(formData.league_type),
      });
      fetchLeagues();
      setActiveView('list');
    }
  };

  const handleSelectLeague = async (league: League) => {
    setSelectedLeague(league);
    await fetchLeaguePlayers(league.id);
    setActiveView('manage');
  };

  const handleAddPlayerToLeague = async (player: User) => {
    if (!selectedLeague) return;

    const exists = leaguePlayers.some(lp => lp.player_id === player.id);
    if (exists) {
      toast.error(`${player.name} is already in this league`);
      return;
    }

    if (leaguePlayers.length >= selectedLeague.max_players) {
      toast.error(`League is full (max ${selectedLeague.max_players} players)`);
      return;
    }

    const { error } = await supabase
      .from('league_players')
      .insert({
        league_id: selectedLeague.id,
        player_id: player.id,
        seed_number: leaguePlayers.length + 1,
      });

    if (error) {
      toast.error('Failed to add player');
    } else {
      toast.success(`${player.name} added`);
      fetchLeaguePlayers(selectedLeague.id);
      setPlayerSearchTerm('');
    }
  };

  const handleCreateNewPlayer = async () => {
    if (!newPlayerName.trim()) {
      toast.error('Please enter player name');
      return;
    }

    const existingPlayer = allPlayers.find(
      p => p.name.toLowerCase() === newPlayerName.toLowerCase().trim()
    );

    if (existingPlayer) {
      toast.error(`Player "${existingPlayer.name}" already exists`);
      handleAddPlayerToLeague(existingPlayer);
      setNewPlayerName('');
      setShowNewPlayerForm(false);
      return;
    }

    const { data: newPlayer, error } = await supabase
      .from('users')
      .insert({
        name: newPlayerName.trim(),
        rating_points: 0,
        level: 'Noob',
        total_hours_played: 0,
        approved: true,
        role: 'player',
      })
      .select()
      .single();

    if (error) {
      toast.error('Failed to create player');
    } else {
      toast.success(`Created: ${newPlayer.name}`);
      fetchAllPlayers();
      handleAddPlayerToLeague(newPlayer);
      setNewPlayerName('');
      setShowNewPlayerForm(false);
    }
  };

  const handleRemovePlayer = async (leaguePlayerId: string, playerName: string) => {
    if (!confirm(`Remove ${playerName}?`)) return;

    const { error } = await supabase.from('league_players').delete().eq('id', leaguePlayerId);

    if (!error) {
      toast.success(`${playerName} removed`);
      if (selectedLeague) fetchLeaguePlayers(selectedLeague.id);
    }
  };

  const handleUpdateLeagueStatus = async (status: LeagueStatus) => {
    if (!selectedLeague) return;

    const { error } = await supabase
      .from('leagues')
      .update({ status, updated_at: new Date().toISOString() })
      .eq('id', selectedLeague.id);

    if (!error) {
      toast.success(`Status: ${status}`);
      setSelectedLeague({ ...selectedLeague, status });
      fetchLeagues();
    }
  };

  const handleDeleteLeague = async (leagueId: string, leagueName: string) => {
    if (!confirm(`Delete "${leagueName}"?`)) return;

    const { error } = await supabase.from('leagues').delete().eq('id', leagueId);

    if (!error) {
      toast.success('League deleted');
      setActiveView('list');
      setSelectedLeague(null);
      fetchLeagues();
    }
  };

  const handleGenerateRoundRobinMatches = async () => {
    if (!selectedLeague || leaguePlayers.length < 2) {
      toast.error('Need at least 2 players');
      return;
    }

    const players = leaguePlayers.map(lp => lp.player_id);
    const matches: any[] = [];
    let matchNumber = 1;

    for (let i = 0; i < players.length; i++) {
      for (let j = i + 1; j < players.length; j++) {
        matches.push({
          league_id: selectedLeague.id,
          player1_id: players[i],
          player2_id: players[j],
          match_type: 'round_robin',
          match_number: matchNumber++,
          sets_to_win: Math.ceil(selectedLeague.round_robin_sets / 2),
          status: 'scheduled',
        });
      }
    }

    const { error } = await supabase.from('league_matches').insert(matches);

    if (error) {
      toast.error('Failed to generate matches');
    } else {
      toast.success(`Generated ${matches.length} matches!`);
      handleUpdateLeagueStatus('round_robin');
    }
  };

  const getStatusColor = (status: LeagueStatus) => {
    switch (status) {
      case 'upcoming': return 'bg-gray-600';
      case 'registration': return 'bg-blue-600';
      case 'group_stage': return 'bg-purple-600';
      case 'round_robin': return 'bg-yellow-600';
      case 'knockouts': return 'bg-orange-600';
      case 'completed': return 'bg-green-600';
      case 'cancelled': return 'bg-red-600';
      default: return 'bg-gray-600';
    }
  };

  const getTournamentTypeLabel = (type: LeagueType): { label: string; icon: string } => {
    const found = TOURNAMENT_TYPES.find(t => t.value === type);
    return found ? { label: found.label, icon: found.icon } : { label: type, icon: '🏆' };
  };

  const filteredLeagues = leagues.filter(l => 
    l.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <AdminLayout 
      title="Tournament Management" 
      subtitle="Create and manage leagues and tournaments"
    >
      {/* Header Actions */}
      <div className="flex justify-between items-center mb-6">
        <div>
          {activeView !== 'list' && (
            <button
              onClick={() => { setActiveView('list'); setSelectedLeague(null); }}
              className="text-primary-blue hover:text-blue-400 text-sm"
            >
              ← Back to List
            </button>
          )}
        </div>
        {activeView === 'list' && (
          <button
            onClick={() => setActiveView('create')}
            className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg flex items-center gap-2 transition"
          >
            <FaPlus /> Create Tournament
          </button>
        )}
      </div>

      {/* List View */}
      {activeView === 'list' && (
        <div className="space-y-4">
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search leagues..."
            className="input-field max-w-md"
          />

          {loading ? (
            <div className="text-center text-gray-400 py-12">Loading...</div>
          ) : filteredLeagues.length === 0 ? (
            <div className="card text-center py-12">
              <FaTrophy className="text-6xl text-gray-600 mx-auto mb-4" />
              <h3 className="text-xl font-bold text-white mb-2">No Tournaments Yet</h3>
              <button onClick={() => setActiveView('create')} className="btn-primary">
                <FaPlus className="inline mr-2" /> Create First Tournament
              </button>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredLeagues.map((league) => (
                <div
                  key={league.id}
                  onClick={() => handleSelectLeague(league)}
                  className="card hover:border-primary-blue cursor-pointer transition"
                >
                  <div className="flex justify-between items-start mb-3">
                    <h3 className="font-bold text-white">{league.name}</h3>
                    <span className={`px-2 py-1 rounded text-xs text-white ${getStatusColor(league.status)}`}>
                      {league.status}
                    </span>
                  </div>
                  <div className="text-sm text-gray-400 space-y-1">
                    <div className="flex items-center gap-2">
                      <span>{getTournamentTypeLabel(league.league_type).icon}</span>
                      <span className="text-gray-300">{getTournamentTypeLabel(league.league_type).label}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <FaCalendarAlt />
                      {league.date ? format(new Date(league.date), 'MMM d, yyyy') : 'TBD'}
                    </div>
                    <div className="flex items-center gap-2">
                      <FaUsers /> Max {league.max_players} players
                    </div>
                  </div>
                  <div className="mt-3 text-primary-blue text-sm flex items-center">
                    Manage <FaChevronRight className="ml-1" />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Create View */}
      {activeView === 'create' && (
        <div className="card max-w-3xl">
          <h3 className="text-xl font-bold text-white mb-6">Create New Tournament</h3>
          
          <div className="space-y-6">
            {/* Basic Info */}
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="label">Tournament Name *</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="input-field"
                  placeholder="e.g. January Championship 2026"
                />
              </div>
              <div>
                <label className="label">Date *</label>
                <input
                  type="date"
                  value={formData.date}
                  onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                  className="input-field"
                />
              </div>
            </div>

            {/* Tournament Type Selection */}
            <div>
              <label className="label">Tournament Format *</label>
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3 mt-2">
                {TOURNAMENT_TYPES.map((type) => (
                  <button
                    key={type.value}
                    type="button"
                    onClick={() => setFormData({ 
                      ...formData, 
                      league_type: type.value,
                      rules: getDefaultRules(type.value)
                    })}
                    className={`p-4 rounded-xl border-2 text-left transition ${
                      formData.league_type === type.value
                        ? 'border-primary-blue bg-primary-blue/10'
                        : 'border-gray-700 hover:border-gray-600'
                    }`}
                  >
                    <div className="text-2xl mb-2">{type.icon}</div>
                    <h4 className={`font-semibold ${formData.league_type === type.value ? 'text-white' : 'text-gray-300'}`}>
                      {type.label}
                    </h4>
                    <p className="text-xs text-gray-500 mt-1">{type.description}</p>
                  </button>
                ))}
              </div>
            </div>

            {/* Max Players */}
            <div>
              <label className="label">Maximum Players</label>
              <div className="flex gap-2 flex-wrap">
                {[4, 8, 12, 16, 24, 32].map((num) => (
                  <button
                    key={num}
                    type="button"
                    onClick={() => setFormData({ ...formData, max_players: num })}
                    className={`px-4 py-2 rounded-lg transition ${
                      formData.max_players === num
                        ? 'bg-primary-blue text-white'
                        : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                    }`}
                  >
                    {num}
                  </button>
                ))}
                <input
                  type="number"
                  value={formData.max_players}
                  onChange={(e) => setFormData({ ...formData, max_players: parseInt(e.target.value) || 16 })}
                  className="input-field w-20"
                  min={2}
                  max={64}
                />
              </div>
            </div>

            {/* Group Stage Settings (for group_stage_knockouts) */}
            {formData.league_type === 'group_stage_knockouts' && (
              <div className="bg-gray-800/50 rounded-xl p-4 border border-gray-700">
                <h4 className="font-semibold text-white mb-4 flex items-center gap-2">
                  👥 Group Stage Settings
                </h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="label text-sm">Number of Groups</label>
                    <select
                      value={formData.num_groups}
                      onChange={(e) => setFormData({ ...formData, num_groups: parseInt(e.target.value) })}
                      className="input-field"
                    >
                      <option value={2}>2 Groups</option>
                      <option value={4}>4 Groups</option>
                      <option value={8}>8 Groups</option>
                    </select>
                  </div>
                  <div>
                    <label className="label text-sm">Qualify per Group</label>
                    <select
                      value={formData.qualifiers_per_group}
                      onChange={(e) => setFormData({ ...formData, qualifiers_per_group: parseInt(e.target.value) })}
                      className="input-field"
                    >
                      <option value={1}>Top 1</option>
                      <option value={2}>Top 2</option>
                      <option value={4}>Top 4</option>
                    </select>
                  </div>
                </div>
                <p className="text-xs text-gray-500 mt-3">
                  {formData.num_groups} groups × {formData.qualifiers_per_group} qualifiers = {formData.num_groups * formData.qualifiers_per_group} players in knockouts
                </p>
              </div>
            )}

            {/* Round Robin Settings (for round_robin and round_robin_knockouts) */}
            {(formData.league_type === 'round_robin' || formData.league_type === 'round_robin_knockouts') && (
              <div className="bg-gray-800/50 rounded-xl p-4 border border-gray-700">
                <h4 className="font-semibold text-white mb-4 flex items-center gap-2">
                  🔄 Round Robin Settings
                </h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="label text-sm">Match Format</label>
                    <select
                      value={formData.group_stage_sets}
                      onChange={(e) => setFormData({ ...formData, group_stage_sets: parseInt(e.target.value) })}
                      className="input-field"
                    >
                      <option value={1}>Best of 1</option>
                      <option value={3}>Best of 3</option>
                      <option value={5}>Best of 5</option>
                    </select>
                  </div>
                  {formData.league_type === 'round_robin_knockouts' && (
                    <div>
                      <label className="label text-sm">Top Qualifiers</label>
                      <select
                        value={formData.top_qualifiers}
                        onChange={(e) => setFormData({ ...formData, top_qualifiers: parseInt(e.target.value) })}
                        className="input-field"
                      >
                        <option value={2}>Top 2</option>
                        <option value={4}>Top 4</option>
                        <option value={8}>Top 8</option>
                      </select>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Knockout Settings (for types with knockouts) */}
            {formData.league_type !== 'round_robin' && (
              <div className="bg-gray-800/50 rounded-xl p-4 border border-gray-700">
                <h4 className="font-semibold text-white mb-4 flex items-center gap-2">
                  ⚔️ Knockout Stage Settings
                </h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <label className="label text-sm">Quarter-Finals</label>
                    <select
                      value={formData.quarterfinal_sets}
                      onChange={(e) => setFormData({ ...formData, quarterfinal_sets: parseInt(e.target.value) })}
                      className="input-field"
                    >
                      <option value={1}>Best of 1</option>
                      <option value={3}>Best of 3</option>
                      <option value={5}>Best of 5</option>
                    </select>
                  </div>
                  <div>
                    <label className="label text-sm">Semi-Finals</label>
                    <select
                      value={formData.semifinal_sets}
                      onChange={(e) => setFormData({ ...formData, semifinal_sets: parseInt(e.target.value) })}
                      className="input-field"
                    >
                      <option value={3}>Best of 3</option>
                      <option value={5}>Best of 5</option>
                    </select>
                  </div>
                  <div>
                    <label className="label text-sm">Final</label>
                    <select
                      value={formData.final_sets}
                      onChange={(e) => setFormData({ ...formData, final_sets: parseInt(e.target.value) })}
                      className="input-field"
                    >
                      <option value={5}>Best of 5</option>
                      <option value={7}>Best of 7</option>
                    </select>
                  </div>
                  <div>
                    <label className="label text-sm">3rd Place Match</label>
                    <select
                      value={formData.has_third_place_match ? 'yes' : 'no'}
                      onChange={(e) => setFormData({ ...formData, has_third_place_match: e.target.value === 'yes' })}
                      className="input-field"
                    >
                      <option value="yes">Yes</option>
                      <option value="no">No</option>
                    </select>
                  </div>
                </div>
              </div>
            )}

            {/* Rules */}
            <div>
              <label className="label">Tournament Rules</label>
              <textarea
                value={formData.rules}
                onChange={(e) => setFormData({ ...formData, rules: e.target.value })}
                className="input-field text-sm"
                rows={6}
              />
            </div>

            {/* Create Button */}
            <button onClick={handleCreateLeague} className="btn-primary w-full py-3 text-lg">
              <FaTrophy className="inline mr-2" /> Create Tournament
            </button>
          </div>
        </div>
      )}

      {/* Manage View */}
      {activeView === 'manage' && selectedLeague && (
        <div className="space-y-6">
          {/* League Header */}
          <div className="card">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="text-2xl font-bold text-white">{selectedLeague.name}</h3>
                <p className="text-gray-400 mt-1">
                  {selectedLeague.date 
                    ? format(new Date(selectedLeague.date), 'EEEE, MMMM d, yyyy')
                    : 'Date TBD'}
                </p>
                <span className={`inline-block mt-2 px-3 py-1 rounded text-sm text-white ${getStatusColor(selectedLeague.status)}`}>
                  {selectedLeague.status}
                </span>
              </div>
              <button
                onClick={() => handleDeleteLeague(selectedLeague.id, selectedLeague.name)}
                className="p-2 bg-red-600 hover:bg-red-700 text-white rounded transition"
              >
                <FaTrash />
              </button>
            </div>

            {/* Status Actions */}
            <div className="flex gap-2 flex-wrap">
              {selectedLeague.status === 'upcoming' && (
                <button
                  onClick={() => handleUpdateLeagueStatus('registration')}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg flex items-center gap-2"
                >
                  <FaPlay /> Open Registration
                </button>
              )}
              {selectedLeague.status === 'registration' && leaguePlayers.length >= 2 && (
                <button
                  onClick={handleGenerateRoundRobinMatches}
                  className="px-4 py-2 bg-yellow-600 hover:bg-yellow-700 text-white rounded-lg flex items-center gap-2"
                >
                  <FaTableTennis /> Start Round Robin
                </button>
              )}
              {selectedLeague.status === 'round_robin' && (
                <button
                  onClick={() => handleUpdateLeagueStatus('knockouts')}
                  className="px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-lg flex items-center gap-2"
                >
                  <FaTrophy /> Start Knockouts
                </button>
              )}
              {selectedLeague.status === 'knockouts' && (
                <button
                  onClick={() => handleUpdateLeagueStatus('completed')}
                  className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg flex items-center gap-2"
                >
                  <FaCheck /> Complete
                </button>
              )}
            </div>
          </div>

          {/* Players */}
          <div className="card">
            <h4 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
              <FaUsers className="text-primary-blue" />
              Players ({leaguePlayers.length}/{selectedLeague.max_players})
            </h4>

            {(selectedLeague.status === 'upcoming' || selectedLeague.status === 'registration') && (
              <div className="mb-4 space-y-3">
                <input
                  type="text"
                  value={playerSearchTerm}
                  onChange={(e) => setPlayerSearchTerm(e.target.value)}
                  placeholder="Search players..."
                  className="input-field"
                />

                {playerSearchResults.length > 0 && (
                  <div className="bg-gray-800 rounded-lg max-h-40 overflow-y-auto">
                    {playerSearchResults.map(player => (
                      <button
                        key={player.id}
                        onClick={() => handleAddPlayerToLeague(player)}
                        className="w-full p-3 text-left hover:bg-gray-700 border-b border-gray-700 last:border-0"
                      >
                        <div className="text-white font-medium">{player.name}</div>
                        <div className="text-sm text-gray-400">{player.phone || 'No phone'}</div>
                      </button>
                    ))}
                  </div>
                )}

                {!showNewPlayerForm ? (
                  <button
                    onClick={() => setShowNewPlayerForm(true)}
                    className="text-primary-blue hover:text-blue-400 text-sm flex items-center gap-2"
                  >
                    <FaPlus /> Add New Player
                  </button>
                ) : (
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={newPlayerName}
                      onChange={(e) => setNewPlayerName(e.target.value)}
                      placeholder="Player name"
                      className="input-field flex-1"
                    />
                    <button
                      onClick={handleCreateNewPlayer}
                      className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg"
                    >
                      Add
                    </button>
                    <button
                      onClick={() => { setShowNewPlayerForm(false); setNewPlayerName(''); }}
                      className="px-4 py-2 bg-gray-600 hover:bg-gray-500 text-white rounded-lg"
                    >
                      Cancel
                    </button>
                  </div>
                )}
              </div>
            )}

            {leaguePlayers.length === 0 ? (
              <div className="text-center text-gray-400 py-6">No players added yet</div>
            ) : (
              <div className="space-y-2">
                {leaguePlayers.map((lp, index) => (
                  <div key={lp.id} className="bg-gray-800 rounded-lg p-3 flex justify-between items-center">
                    <div className="flex items-center gap-3">
                      <span className="w-8 h-8 bg-gray-700 rounded-full flex items-center justify-center text-sm font-bold">
                        {index + 1}
                      </span>
                      <div>
                        <div className="text-white font-medium">{(lp.player as any)?.name}</div>
                        <div className="text-xs text-gray-500">
                          W: {lp.wins} | L: {lp.losses} | PD: {lp.point_difference > 0 ? '+' : ''}{lp.point_difference}
                        </div>
                      </div>
                    </div>
                    {(selectedLeague.status === 'upcoming' || selectedLeague.status === 'registration') && (
                      <button
                        onClick={() => handleRemovePlayer(lp.id, (lp.player as any)?.name)}
                        className="p-2 text-red-500 hover:bg-red-500/20 rounded"
                      >
                        <FaTrash />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Quick Links */}
          <div className="grid md:grid-cols-3 gap-4">
            <a href={`/leagues/${selectedLeague.id}`} className="card hover:border-primary-blue text-center">
              <FaTableTennis className="text-3xl text-primary-blue mx-auto mb-2" />
              <div className="text-white font-semibold">View League Page</div>
            </a>
            <a href={`/leagues/${selectedLeague.id}/matches`} className="card hover:border-yellow-500 text-center">
              <FaEdit className="text-3xl text-yellow-500 mx-auto mb-2" />
              <div className="text-white font-semibold">Scoring Page</div>
            </a>
            <a href={`/leagues/${selectedLeague.id}/standings`} className="card hover:border-green-500 text-center">
              <FaTrophy className="text-3xl text-green-500 mx-auto mb-2" />
              <div className="text-white font-semibold">Standings</div>
            </a>
          </div>
        </div>
      )}
    </AdminLayout>
  );
};

export default AdminTournamentsPage;
