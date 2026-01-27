import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { 
  FaTrophy, 
  FaPlus, 
  FaUsers, 
  FaCalendarAlt,
  FaEdit,
  FaTrash,
  FaPlay,
  FaCheck,
  FaSearch,
  FaChevronRight,
  FaTableTennis
} from 'react-icons/fa';
import { supabase } from '../../lib/supabase';
import type { League, LeaguePlayer, User, LeagueStatus } from '../../lib/supabase';
import { format } from 'date-fns';

interface CreateLeagueForm {
  name: string;
  league_type: 'round_robin_knockouts' | 'round_robin' | 'knockouts';
  schedule_days: string[];
  frequency: string;
  start_date: string;
  end_date: string;
  rules: string;
  max_players: number;
  round_robin_sets: number;
  semifinal_sets: number;
  final_sets: number;
  top_qualifiers: number;
}

const DEFAULT_RULES = `## League Rules

### Format
- Round Robin Stage: Each player plays every other player once
- Top 4 players qualify for knockout stage
- Semi-Finals: 1st vs 4th, 2nd vs 3rd
- Final: Winners of semi-finals

### Match Format
- Round Robin: Best of 1 set
- Semi-Finals: Best of 3 sets
- Final: Best of 5 sets

### Scoring
- Games are played to 11 points (win by 2)
- Deuce rules apply at 10-10

### Tie-Breaking Rules
1. Total Wins
2. Point Difference (Run Rate)
3. Head-to-Head Result
4. Lowest Points Conceded
5. Admin Decision

### Points System
- Participation: 5 points
- Top 6 Finish: +5 points
- Top 4 Finish: +5 points
- Runner-Up: +5 points
- Champion: +10 points`;

const AdminTournaments = () => {
  const [activeView, setActiveView] = useState<'list' | 'create' | 'manage'>('list');
  const [leagues, setLeagues] = useState<League[]>([]);
  const [selectedLeague, setSelectedLeague] = useState<League | null>(null);
  const [leaguePlayers, setLeaguePlayers] = useState<LeaguePlayer[]>([]);
  const [allPlayers, setAllPlayers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  // Create league form
  const [formData, setFormData] = useState<CreateLeagueForm>({
    name: '',
    league_type: 'round_robin_knockouts',
    schedule_days: ['Saturday', 'Sunday'],
    frequency: 'weekly',
    start_date: '',
    end_date: '',
    rules: DEFAULT_RULES,
    max_players: 16,
    round_robin_sets: 1,
    semifinal_sets: 3,
    final_sets: 5,
    top_qualifiers: 4,
  });

  // Player search for adding to league
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
    
    if (error) {
      console.error('Error fetching leagues:', error);
      toast.error('Failed to load leagues');
    } else {
      setLeagues(data || []);
    }
    setLoading(false);
  };

  const fetchAllPlayers = async () => {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .order('name');
    
    if (!error && data) {
      setAllPlayers(data);
    }
  };

  const fetchLeaguePlayers = async (leagueId: string) => {
    const { data, error } = await supabase
      .from('league_players')
      .select('*, player:player_id(*)')
      .eq('league_id', leagueId)
      .order('seed_number', { ascending: true });
    
    if (error) {
      console.error('Error fetching league players:', error);
    } else {
      setLeaguePlayers(data || []);
    }
  };

  // Search players as user types
  useEffect(() => {
    if (playerSearchTerm.length >= 2) {
      const filtered = allPlayers.filter(p => 
        p.name.toLowerCase().includes(playerSearchTerm.toLowerCase()) ||
        p.phone?.includes(playerSearchTerm) ||
        p.email?.toLowerCase().includes(playerSearchTerm.toLowerCase())
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

    const { data, error } = await supabase
      .from('leagues')
      .insert({
        ...formData,
        status: 'upcoming',
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating league:', error);
      toast.error('Failed to create league');
    } else {
      toast.success(`League "${formData.name}" created successfully!`);
      setFormData({
        ...formData,
        name: '',
        start_date: '',
        end_date: '',
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

    // Check if player already in league
    const exists = leaguePlayers.some(lp => lp.player_id === player.id);
    if (exists) {
      toast.error(`${player.name} is already in this league`);
      return;
    }

    // Check max players
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
      console.error('Error adding player:', error);
      toast.error('Failed to add player');
    } else {
      toast.success(`${player.name} added to league`);
      fetchLeaguePlayers(selectedLeague.id);
      setPlayerSearchTerm('');
      setPlayerSearchResults([]);
    }
  };

  const handleCreateNewPlayer = async () => {
    if (!newPlayerName.trim()) {
      toast.error('Please enter player name');
      return;
    }

    // Check for duplicate
    const existingPlayer = allPlayers.find(
      p => p.name.toLowerCase() === newPlayerName.toLowerCase().trim()
    );

    if (existingPlayer) {
      toast.error(`Player "${existingPlayer.name}" already exists. Adding to league...`);
      handleAddPlayerToLeague(existingPlayer);
      setNewPlayerName('');
      setShowNewPlayerForm(false);
      return;
    }

    // Create new player
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
      console.error('Error creating player:', error);
      toast.error('Failed to create player');
    } else {
      toast.success(`Created new player: ${newPlayer.name}`);
      fetchAllPlayers();
      handleAddPlayerToLeague(newPlayer);
      setNewPlayerName('');
      setShowNewPlayerForm(false);
    }
  };

  const handleRemovePlayer = async (leaguePlayerId: string, playerName: string) => {
    if (!confirm(`Remove ${playerName} from this league?`)) return;

    const { error } = await supabase
      .from('league_players')
      .delete()
      .eq('id', leaguePlayerId);

    if (error) {
      toast.error('Failed to remove player');
    } else {
      toast.success(`${playerName} removed from league`);
      if (selectedLeague) fetchLeaguePlayers(selectedLeague.id);
    }
  };

  const handleUpdateLeagueStatus = async (status: LeagueStatus) => {
    if (!selectedLeague) return;

    const { error } = await supabase
      .from('leagues')
      .update({ status, updated_at: new Date().toISOString() })
      .eq('id', selectedLeague.id);

    if (error) {
      toast.error('Failed to update status');
    } else {
      toast.success(`League status updated to: ${status}`);
      setSelectedLeague({ ...selectedLeague, status });
      fetchLeagues();
    }
  };

  const handleDeleteLeague = async (leagueId: string, leagueName: string) => {
    if (!confirm(`Delete league "${leagueName}"? This will delete all matches and data.`)) return;

    const { error } = await supabase
      .from('leagues')
      .delete()
      .eq('id', leagueId);

    if (error) {
      toast.error('Failed to delete league');
    } else {
      toast.success('League deleted');
      setActiveView('list');
      setSelectedLeague(null);
      fetchLeagues();
    }
  };

  const handleGenerateRoundRobinMatches = async () => {
    if (!selectedLeague || leaguePlayers.length < 2) {
      toast.error('Need at least 2 players to generate matches');
      return;
    }

    const players = leaguePlayers.map(lp => lp.player_id);
    const matches: any[] = [];
    let matchNumber = 1;

    // Generate all round robin pairings
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

    const { error } = await supabase
      .from('league_matches')
      .insert(matches);

    if (error) {
      console.error('Error generating matches:', error);
      toast.error('Failed to generate matches');
    } else {
      toast.success(`Generated ${matches.length} round robin matches!`);
      handleUpdateLeagueStatus('round_robin');
    }
  };

  const getStatusColor = (status: LeagueStatus) => {
    switch (status) {
      case 'upcoming': return 'bg-gray-600';
      case 'registration': return 'bg-blue-600';
      case 'round_robin': return 'bg-yellow-600';
      case 'knockouts': return 'bg-orange-600';
      case 'completed': return 'bg-green-600';
      case 'cancelled': return 'bg-red-600';
      default: return 'bg-gray-600';
    }
  };

  const getStatusLabel = (status: LeagueStatus) => {
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

  // Filter leagues based on search
  const filteredLeagues = leagues.filter(l => 
    l.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-white flex items-center gap-3">
          <FaTrophy className="text-yellow-500" />
          Tournament Management
        </h2>
        <div className="flex gap-3">
          {activeView !== 'list' && (
            <button
              onClick={() => {
                setActiveView('list');
                setSelectedLeague(null);
              }}
              className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition"
            >
              Back to List
            </button>
          )}
          {activeView === 'list' && (
            <button
              onClick={() => setActiveView('create')}
              className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg flex items-center gap-2 transition"
            >
              <FaPlus /> Create League
            </button>
          )}
        </div>
      </div>

      {/* League List View */}
      {activeView === 'list' && (
        <div className="space-y-4">
          {/* Search */}
          <div className="relative">
            <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search leagues..."
              className="input-field pl-10"
            />
          </div>

          {loading ? (
            <div className="text-center text-gray-400 py-8">Loading leagues...</div>
          ) : filteredLeagues.length === 0 ? (
            <div className="card text-center py-12">
              <FaTrophy className="text-6xl text-gray-600 mx-auto mb-4" />
              <h3 className="text-xl font-bold text-white mb-2">No Leagues Yet</h3>
              <p className="text-gray-400 mb-6">Create your first league to get started!</p>
              <button
                onClick={() => setActiveView('create')}
                className="btn-primary inline-flex items-center gap-2"
              >
                <FaPlus /> Create League
              </button>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredLeagues.map((league) => (
                <motion.div
                  key={league.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="card hover:border-primary-blue cursor-pointer transition group"
                  onClick={() => handleSelectLeague(league)}
                >
                  <div className="flex items-start justify-between mb-3">
                    <h3 className="text-lg font-bold text-white group-hover:text-primary-blue transition">
                      {league.name}
                    </h3>
                    <span className={`px-2 py-1 rounded text-xs text-white ${getStatusColor(league.status)}`}>
                      {getStatusLabel(league.status)}
                    </span>
                  </div>
                  <div className="text-sm text-gray-400 space-y-1">
                    <div className="flex items-center gap-2">
                      <FaCalendarAlt />
                      {league.start_date ? format(new Date(league.start_date), 'MMM d, yyyy') : 'Date TBD'}
                    </div>
                    <div className="flex items-center gap-2">
                      <FaUsers />
                      Max {league.max_players} players
                    </div>
                    <div className="flex items-center gap-2">
                      <FaTableTennis />
                      {league.league_type === 'round_robin_knockouts' ? 'Round Robin + Knockouts' :
                       league.league_type === 'round_robin' ? 'Round Robin Only' : 'Knockouts Only'}
                    </div>
                  </div>
                  <div className="mt-4 flex items-center justify-end text-primary-blue text-sm">
                    Manage <FaChevronRight className="ml-1" />
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Create League View */}
      {activeView === 'create' && (
        <div className="space-y-6">
          <div className="card">
            <h3 className="text-xl font-bold text-white mb-6">Create New League</h3>
            
            <div className="grid md:grid-cols-2 gap-6">
              {/* League Name */}
              <div>
                <label className="label">League Name *</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="input-field"
                  placeholder="e.g. January League 2026"
                />
              </div>

              {/* League Type */}
              <div>
                <label className="label">League Type</label>
                <select
                  value={formData.league_type}
                  onChange={(e) => setFormData({ ...formData, league_type: e.target.value as any })}
                  className="input-field"
                >
                  <option value="round_robin_knockouts">Round Robin + Knockouts</option>
                  <option value="round_robin">Round Robin Only</option>
                  <option value="knockouts">Knockouts Only</option>
                </select>
              </div>

              {/* Schedule Days */}
              <div>
                <label className="label">Schedule Days</label>
                <div className="flex gap-3 flex-wrap">
                  {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].map(day => (
                    <label key={day} className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.schedule_days.includes(day)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setFormData({ ...formData, schedule_days: [...formData.schedule_days, day] });
                          } else {
                            setFormData({ ...formData, schedule_days: formData.schedule_days.filter(d => d !== day) });
                          }
                        }}
                        className="w-4 h-4 rounded"
                      />
                      <span className="text-gray-300 text-sm">{day.slice(0, 3)}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Frequency */}
              <div>
                <label className="label">Frequency</label>
                <select
                  value={formData.frequency}
                  onChange={(e) => setFormData({ ...formData, frequency: e.target.value })}
                  className="input-field"
                >
                  <option value="weekly">Weekly</option>
                  <option value="bi-weekly">Bi-Weekly</option>
                  <option value="monthly">Monthly</option>
                </select>
              </div>

              {/* Start Date */}
              <div>
                <label className="label">Start Date</label>
                <input
                  type="date"
                  value={formData.start_date}
                  onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                  className="input-field"
                />
              </div>

              {/* End Date */}
              <div>
                <label className="label">End Date</label>
                <input
                  type="date"
                  value={formData.end_date}
                  onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                  className="input-field"
                />
              </div>

              {/* Max Players */}
              <div>
                <label className="label">Max Players</label>
                <input
                  type="number"
                  value={formData.max_players}
                  onChange={(e) => setFormData({ ...formData, max_players: parseInt(e.target.value) || 16 })}
                  className="input-field"
                  min={2}
                  max={64}
                />
              </div>

              {/* Top Qualifiers */}
              <div>
                <label className="label">Top Qualifiers (for knockouts)</label>
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
            </div>

            {/* Match Format Settings */}
            <div className="mt-6 pt-6 border-t border-gray-700">
              <h4 className="text-lg font-semibold text-white mb-4">Match Format</h4>
              <div className="grid md:grid-cols-3 gap-4">
                <div>
                  <label className="label">Round Robin (Best of)</label>
                  <select
                    value={formData.round_robin_sets}
                    onChange={(e) => setFormData({ ...formData, round_robin_sets: parseInt(e.target.value) })}
                    className="input-field"
                  >
                    <option value={1}>Best of 1</option>
                    <option value={3}>Best of 3</option>
                    <option value={5}>Best of 5</option>
                  </select>
                </div>
                <div>
                  <label className="label">Semi-Finals (Best of)</label>
                  <select
                    value={formData.semifinal_sets}
                    onChange={(e) => setFormData({ ...formData, semifinal_sets: parseInt(e.target.value) })}
                    className="input-field"
                  >
                    <option value={1}>Best of 1</option>
                    <option value={3}>Best of 3</option>
                    <option value={5}>Best of 5</option>
                  </select>
                </div>
                <div>
                  <label className="label">Final (Best of)</label>
                  <select
                    value={formData.final_sets}
                    onChange={(e) => setFormData({ ...formData, final_sets: parseInt(e.target.value) })}
                    className="input-field"
                  >
                    <option value={1}>Best of 1</option>
                    <option value={3}>Best of 3</option>
                    <option value={5}>Best of 5</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Rules */}
            <div className="mt-6">
              <label className="label">League Rules (Markdown supported)</label>
              <textarea
                value={formData.rules}
                onChange={(e) => setFormData({ ...formData, rules: e.target.value })}
                className="input-field font-mono text-sm"
                rows={10}
                placeholder="Enter league rules..."
              />
            </div>

            <button
              onClick={handleCreateLeague}
              className="btn-primary mt-6 w-full text-lg"
            >
              Create League
            </button>
          </div>
        </div>
      )}

      {/* Manage League View */}
      {activeView === 'manage' && selectedLeague && (
        <div className="space-y-6">
          {/* League Header */}
          <div className="card">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-2xl font-bold text-white">{selectedLeague.name}</h3>
                <span className={`inline-block mt-2 px-3 py-1 rounded text-sm text-white ${getStatusColor(selectedLeague.status)}`}>
                  {getStatusLabel(selectedLeague.status)}
                </span>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => handleDeleteLeague(selectedLeague.id, selectedLeague.name)}
                  className="p-2 bg-red-600 hover:bg-red-700 text-white rounded transition"
                  title="Delete League"
                >
                  <FaTrash />
                </button>
              </div>
            </div>

            {/* Status Controls */}
            <div className="flex gap-2 flex-wrap">
              {selectedLeague.status === 'upcoming' && (
                <button
                  onClick={() => handleUpdateLeagueStatus('registration')}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg flex items-center gap-2 transition"
                >
                  <FaPlay /> Open Registration
                </button>
              )}
              {selectedLeague.status === 'registration' && leaguePlayers.length >= 2 && (
                <button
                  onClick={handleGenerateRoundRobinMatches}
                  className="px-4 py-2 bg-yellow-600 hover:bg-yellow-700 text-white rounded-lg flex items-center gap-2 transition"
                >
                  <FaTableTennis /> Start Round Robin
                </button>
              )}
              {selectedLeague.status === 'round_robin' && (
                <button
                  onClick={() => handleUpdateLeagueStatus('knockouts')}
                  className="px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-lg flex items-center gap-2 transition"
                >
                  <FaTrophy /> Start Knockouts
                </button>
              )}
              {selectedLeague.status === 'knockouts' && (
                <button
                  onClick={() => handleUpdateLeagueStatus('completed')}
                  className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg flex items-center gap-2 transition"
                >
                  <FaCheck /> Complete League
                </button>
              )}
            </div>
          </div>

          {/* Players Section */}
          <div className="card">
            <h4 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
              <FaUsers className="text-primary-blue" />
              Players ({leaguePlayers.length}/{selectedLeague.max_players})
            </h4>

            {/* Add Player Search */}
            {(selectedLeague.status === 'upcoming' || selectedLeague.status === 'registration') && (
              <div className="mb-6">
                <div className="relative">
                  <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    value={playerSearchTerm}
                    onChange={(e) => setPlayerSearchTerm(e.target.value)}
                    placeholder="Search players by name, phone, or email..."
                    className="input-field pl-10"
                  />
                </div>

                {/* Search Results */}
                {playerSearchResults.length > 0 && (
                  <div className="mt-2 bg-gray-800 rounded-lg max-h-48 overflow-y-auto">
                    {playerSearchResults.map(player => (
                      <button
                        key={player.id}
                        onClick={() => handleAddPlayerToLeague(player)}
                        className="w-full p-3 text-left hover:bg-gray-700 border-b border-gray-700 last:border-0 transition"
                      >
                        <div className="text-white font-semibold">{player.name}</div>
                        <div className="text-sm text-gray-400">
                          {player.phone || player.email || 'No contact info'}
                        </div>
                      </button>
                    ))}
                  </div>
                )}

                {/* Create New Player */}
                <div className="mt-4">
                  {!showNewPlayerForm ? (
                    <button
                      onClick={() => setShowNewPlayerForm(true)}
                      className="text-primary-blue hover:text-blue-400 flex items-center gap-2 text-sm"
                    >
                      <FaPlus /> Add New Player (not in system)
                    </button>
                  ) : (
                    <div className="bg-gray-800 rounded-lg p-4">
                      <div className="flex gap-3">
                        <input
                          type="text"
                          value={newPlayerName}
                          onChange={(e) => setNewPlayerName(e.target.value)}
                          placeholder="Enter player full name"
                          className="input-field flex-1"
                        />
                        <button
                          onClick={handleCreateNewPlayer}
                          className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition"
                        >
                          Add
                        </button>
                        <button
                          onClick={() => {
                            setShowNewPlayerForm(false);
                            setNewPlayerName('');
                          }}
                          className="px-4 py-2 bg-gray-600 hover:bg-gray-500 text-white rounded-lg transition"
                        >
                          Cancel
                        </button>
                      </div>
                      <p className="text-xs text-gray-400 mt-2">
                        System will check for duplicates before creating
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Player List */}
            {leaguePlayers.length === 0 ? (
              <div className="text-center text-gray-400 py-8">
                No players added yet. Search and add players above.
              </div>
            ) : (
              <div className="space-y-2">
                {leaguePlayers.map((lp, index) => (
                  <div
                    key={lp.id}
                    className="bg-gray-800 rounded-lg p-3 flex items-center justify-between"
                  >
                    <div className="flex items-center gap-3">
                      <span className="w-8 h-8 bg-gray-700 rounded-full flex items-center justify-center text-sm font-bold">
                        {index + 1}
                      </span>
                      <div>
                        <div className="text-white font-semibold">{(lp.player as any)?.name || 'Unknown'}</div>
                        <div className="text-sm text-gray-400">
                          W: {lp.wins} | L: {lp.losses} | PD: {lp.point_difference > 0 ? '+' : ''}{lp.point_difference}
                        </div>
                      </div>
                    </div>
                    {(selectedLeague.status === 'upcoming' || selectedLeague.status === 'registration') && (
                      <button
                        onClick={() => handleRemovePlayer(lp.id, (lp.player as any)?.name || 'Unknown')}
                        className="p-2 text-red-500 hover:bg-red-500/20 rounded transition"
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
            <a
              href={`/leagues/${selectedLeague.id}`}
              className="card hover:border-primary-blue transition text-center"
            >
              <FaTableTennis className="text-3xl text-primary-blue mx-auto mb-2" />
              <div className="text-white font-semibold">View League Page</div>
              <div className="text-sm text-gray-400">Public league info</div>
            </a>
            <a
              href={`/leagues/${selectedLeague.id}/matches`}
              className="card hover:border-yellow-500 transition text-center"
            >
              <FaEdit className="text-3xl text-yellow-500 mx-auto mb-2" />
              <div className="text-white font-semibold">Scoring Page</div>
              <div className="text-sm text-gray-400">Enter match scores</div>
            </a>
            <a
              href={`/leagues/${selectedLeague.id}/standings`}
              className="card hover:border-green-500 transition text-center"
            >
              <FaTrophy className="text-3xl text-green-500 mx-auto mb-2" />
              <div className="text-white font-semibold">Rankings Page</div>
              <div className="text-sm text-gray-400">View standings</div>
            </a>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminTournaments;
