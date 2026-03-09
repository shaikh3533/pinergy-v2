import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { 
  FaTrophy, 
  FaPlus, 
  FaUsers, 
  FaCalendarAlt,
  FaTrash,
  FaPlay,
  FaCheck,
  FaChevronRight,
  FaTableTennis,
  FaEdit,
  FaUndo,
  FaInfoCircle,
  FaCopy,
  FaChevronDown,
  FaChevronUp
} from 'react-icons/fa';
import { supabase } from '../../lib/supabase';
import type { League, LeaguePlayer, User, LeagueStatus } from '../../lib/supabase';
import { format, isAfter, startOfDay, isEqual } from 'date-fns';
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

  // Quick Add Results (bulk SQL generator)
  const [showQuickAddResults, setShowQuickAddResults] = useState(false);
  const [quickAddInput, setQuickAddInput] = useState('');
  const [generatedSql, setGeneratedSql] = useState('');
  const [quickAddError, setQuickAddError] = useState('');
  const [showQuickAddFormatInfo, setShowQuickAddFormatInfo] = useState(false);

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

    // Use only the core fields that exist in the database
    // Note: Run database/UPDATE_TOURNAMENT_TYPES.sql to enable advanced tournament features
    const leagueData = {
      name: formData.name,
      league_type: formData.league_type,
      date: formData.date,
      rules: formData.rules,
      max_players: formData.max_players,
      round_robin_sets: formData.group_stage_sets,
      semifinal_sets: formData.semifinal_sets,
      final_sets: formData.final_sets,
      top_qualifiers: formData.top_qualifiers,
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
      toast.success(`Status updated to ${status}`);
      setSelectedLeague({ ...selectedLeague, status });
      fetchLeagues();
    }
  };

  // Revert status to a previous stage (e.g. undo "Complete" or go back to edit)
  const handleRevertStatus = async (newStatus: LeagueStatus, label: string) => {
    if (!selectedLeague) return;
    if (!confirm(`Set tournament back to "${label}"? You can edit and move forward again when ready.`)) return;

    const { error } = await supabase
      .from('leagues')
      .update({ status: newStatus, updated_at: new Date().toISOString() })
      .eq('id', selectedLeague.id);

    if (!error) {
      toast.success(`Re-opened: back to ${label}`);
      setSelectedLeague({ ...selectedLeague, status: newStatus });
      fetchLeagues();
    } else {
      toast.error('Failed to update status');
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
      toast.error('Need at least 2 players to start');
      return;
    }

    const players = leaguePlayers.map(lp => lp.player_id);
    const matches: any[] = [];
    let matchNumber = 1;
    const setsToWin = Math.ceil((selectedLeague.round_robin_sets || selectedLeague.group_stage_sets || 1) / 2);

    for (let i = 0; i < players.length; i++) {
      for (let j = i + 1; j < players.length; j++) {
        matches.push({
          league_id: selectedLeague.id,
          player1_id: players[i],
          player2_id: players[j],
          match_type: 'round_robin',
          match_number: matchNumber++,
          round_number: 1,
          sets_to_win: setsToWin,
          status: 'scheduled',
        });
      }
    }

    const { error } = await supabase.from('league_matches').insert(matches);

    if (error) {
      toast.error('Failed to generate matches');
    } else {
      toast.success(`Generated ${matches.length} matches! You can proceed to knockouts anytime from the status button.`);
      handleUpdateLeagueStatus('round_robin');
    }
  };

  // Get current standings (refetches league_players so stats are up to date)
  const getStandingsForKnockouts = async (): Promise<LeaguePlayer[]> => {
    if (!selectedLeague) return [];

    const { data: freshPlayers } = await supabase
      .from('league_players')
      .select('*, player:player_id(*)')
      .eq('league_id', selectedLeague.id)
      .eq('status', 'active')
      .order('seed_number');

    if (!freshPlayers || freshPlayers.length === 0) return [];

    const { data: matchesData } = await supabase
      .from('league_matches')
      .select('*')
      .eq('league_id', selectedLeague.id)
      .eq('status', 'completed');

    const playersWithH2H = freshPlayers.map((lp: any) => {
      const h2h: { [key: string]: { wins: number; losses: number } } = {};
      (matchesData || []).forEach((match: any) => {
        if (match.player1_id === lp.player_id || match.player2_id === lp.player_id) {
          const opponentId = match.player1_id === lp.player_id ? match.player2_id : match.player1_id;
          if (!h2h[opponentId]) h2h[opponentId] = { wins: 0, losses: 0 };
          if (match.winner_id === lp.player_id) h2h[opponentId].wins++;
          else h2h[opponentId].losses++;
        }
      });
      return { ...lp, head_to_head: h2h };
    });

    playersWithH2H.sort((a: any, b: any) => {
      if (b.wins !== a.wins) return b.wins - a.wins;
      if (b.point_difference !== a.point_difference) return b.point_difference - a.point_difference;
      const aH2H = a.head_to_head[b.player_id];
      const bH2H = b.head_to_head[a.player_id];
      if (aH2H && bH2H && aH2H.wins !== bH2H.wins) return bH2H.wins - aH2H.wins;
      if (a.points_against !== b.points_against) return a.points_against - b.points_against;
      return b.points_for - a.points_for;
    });

    return playersWithH2H;
  };

  // Build knockout match rows from seeded player ids (does not insert)
  const buildKnockoutMatches = (seeded: string[]) => {
    if (!selectedLeague) return [];
    const topN = seeded.length;
    const semifinalSets = selectedLeague.semifinal_sets ?? 3;
    const finalSets = selectedLeague.final_sets ?? 5;
    const setsToWinSF = Math.ceil(semifinalSets / 2);
    const setsToWinF = Math.ceil(finalSets / 2);
    const knockoutMatches: any[] = [];

    if (topN === 2) {
      knockoutMatches.push({
        league_id: selectedLeague.id,
        player1_id: seeded[0],
        player2_id: seeded[1],
        match_type: 'final',
        match_number: 1,
        round_number: 2,
        sets_to_win: setsToWinF,
        status: 'scheduled',
      });
    } else if (topN >= 4) {
      knockoutMatches.push(
        {
          league_id: selectedLeague.id,
          player1_id: seeded[0],
          player2_id: seeded[3],
          match_type: 'semifinal',
          match_number: 1,
          round_number: 2,
          sets_to_win: setsToWinSF,
          status: 'scheduled',
        },
        {
          league_id: selectedLeague.id,
          player1_id: seeded[1],
          player2_id: seeded[2],
          match_type: 'semifinal',
          match_number: 2,
          round_number: 2,
          sets_to_win: setsToWinSF,
          status: 'scheduled',
        }
      );
    }
    return knockoutMatches;
  };

  // Generate knockout stage matches from current standings (always uses fresh data from DB)
  const handleGenerateKnockoutMatches = async () => {
    if (!selectedLeague) return;

    const standings = await getStandingsForKnockouts();
    const topN = selectedLeague.top_qualifiers || 4;

    if (standings.length < topN) {
      toast.error(`Need at least ${topN} players for knockouts (current: ${standings.length})`);
      return;
    }

    const seeded = standings.slice(0, topN).map(lp => lp.player_id);
    const knockoutMatches = buildKnockoutMatches(seeded);

    if (knockoutMatches.length === 0) {
      toast.error('Top qualifiers must be 2 or 4 (or 8 with quarterfinals later)');
      return;
    }

    const { error } = await supabase.from('league_matches').insert(knockoutMatches);
    if (error) {
      toast.error('Failed to generate knockout matches');
      return;
    }
    toast.success(`Generated ${knockoutMatches.length} knockout match(es) from current standings.`);
    setLeaguePlayers(standings);
    handleUpdateLeagueStatus('knockouts');
  };

  // Regenerate knockouts: only delete SEMIFINALS and recreate (preserves final/third place results)
  const handleRegenerateKnockouts = async () => {
    if (!selectedLeague) return;
    if (!confirm('This will replace semifinal matches only (final and 3rd place results are kept). Continue?')) return;

    const { data: existingSemis } = await supabase
      .from('league_matches')
      .select('id')
      .eq('league_id', selectedLeague.id)
      .eq('match_type', 'semifinal');

    if (existingSemis && existingSemis.length > 0) {
      const { error: deleteError } = await supabase
        .from('league_matches')
        .delete()
        .eq('league_id', selectedLeague.id)
        .eq('match_type', 'semifinal');

      if (deleteError) {
        toast.error('Failed to remove existing semifinals');
        return;
      }
    }

    const standings = await getStandingsForKnockouts();
    const topN = selectedLeague.top_qualifiers || 4;

    if (standings.length < topN) {
      toast.error(`Need at least ${topN} players (current: ${standings.length})`);
      return;
    }

    const seeded = standings.slice(0, topN).map(lp => lp.player_id);
    const knockoutMatches = buildKnockoutMatches(seeded);

    if (knockoutMatches.length === 0) {
      toast.error('Top qualifiers must be 2 or 4');
      return;
    }

    const { error } = await supabase.from('league_matches').insert(knockoutMatches);
    if (error) {
      toast.error('Failed to generate knockout matches');
      return;
    }
    toast.success('Knockouts regenerated from current standings.');
    setLeaguePlayers(standings);
  };

  // Create Final and Third Place matches once both semifinals are completed
  const handleGenerateFinalAndThirdPlace = async () => {
    if (!selectedLeague) return;

    const { data: existingFinal } = await supabase
      .from('league_matches')
      .select('id')
      .eq('league_id', selectedLeague.id)
      .eq('match_type', 'final')
      .maybeSingle();

    if (existingFinal) {
      toast.error('Final match already exists. Delete it first if you need to regenerate.');
      return;
    }

    const { data: semifinals } = await supabase
      .from('league_matches')
      .select('id, player1_id, player2_id, winner_id')
      .eq('league_id', selectedLeague.id)
      .eq('match_type', 'semifinal')
      .eq('status', 'completed');

    if (!semifinals || semifinals.length < 2) {
      toast.error('Complete both semifinals first');
      return;
    }

    const [sf1, sf2] = semifinals;
    const winner1 = sf1.winner_id;
    const winner2 = sf2.winner_id;
    const loser1 = winner1 === sf1.player1_id ? sf1.player2_id : sf1.player1_id;
    const loser2 = winner2 === sf2.player1_id ? sf2.player2_id : sf2.player1_id;

    if (!winner1 || !winner2) {
      toast.error('Semifinals must have a winner set');
      return;
    }

    const finalSets = selectedLeague.final_sets ?? 5;
    const setsToWin = Math.ceil(finalSets / 2);
    const inserts: any[] = [
      {
        league_id: selectedLeague.id,
        player1_id: winner1,
        player2_id: winner2,
        match_type: 'final',
        match_number: 1,
        round_number: 3,
        sets_to_win: setsToWin,
        status: 'scheduled',
      },
    ];

    if (selectedLeague.has_third_place_match) {
      const { data: existingThird } = await supabase
        .from('league_matches')
        .select('id')
        .eq('league_id', selectedLeague.id)
        .eq('match_type', 'third_place')
        .maybeSingle();
      if (!existingThird) {
        inserts.push({
          league_id: selectedLeague.id,
          player1_id: loser1,
          player2_id: loser2,
          match_type: 'third_place',
          match_number: 2,
          round_number: 3,
          sets_to_win: setsToWin,
          status: 'scheduled',
        });
      }
    }

    if (inserts.length === 0) {
      toast.error('Final and Third Place already exist.');
      return;
    }

    const { error } = await supabase.from('league_matches').insert(inserts);
    if (error) {
      toast.error('Failed to create final/third place');
      return;
    }
    toast.success(`Created Final and ${selectedLeague.has_third_place_match ? 'Third Place ' : ''}match(es).`);
  };

  // Quick Add Results: parse input and generate SQL for Supabase SQL Editor
  const handleGenerateQuickAddSql = async () => {
    if (!selectedLeague || !quickAddInput.trim()) {
      setQuickAddError('Select a league and enter results.');
      return;
    }
    setQuickAddError('');
    setGeneratedSql('');

    const lines = quickAddInput.trim().split('\n').filter(Boolean);
    if (lines.length === 0) {
      setQuickAddError('Enter at least one match result.');
      return;
    }

    const { data: matches } = await supabase
      .from('league_matches')
      .select('id, match_number, player1_id, player2_id, sets_to_win')
      .eq('league_id', selectedLeague.id)
      .order('match_number');

    const matchByNumber = new Map((matches || []).map((m: any) => [m.match_number, m]));
    const leagueId = selectedLeague.id;
    const now = new Date().toISOString();

    const sqlParts: string[] = [];
    const statsCalls: string[] = [];

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      const parts = line.split(/[|,\t]+/).map(p => p.trim()).filter(Boolean);
      if (parts.length < 2) {
        setQuickAddError(`Line ${i + 1}: Need match_number and at least one set score (e.g. 11-9).`);
        return;
      }

      const matchNum = parseInt(parts[0], 10);
      if (isNaN(matchNum)) {
        setQuickAddError(`Line ${i + 1}: First value must be match number.`);
        return;
      }

      const match = matchByNumber.get(matchNum);
      if (!match) {
        setQuickAddError(`Line ${i + 1}: Match #${matchNum} not found in this league.`);
        return;
      }

      const setScores: { p1: number; p2: number }[] = [];
      for (let j = 1; j < parts.length; j++) {
        const setPart = parts[j];
        const dash = setPart.indexOf('-');
        if (dash === -1) {
          setQuickAddError(`Line ${i + 1}: Set "${setPart}" must be in format 11-9.`);
          return;
        }
        const p1 = parseInt(setPart.slice(0, dash), 10);
        const p2 = parseInt(setPart.slice(dash + 1), 10);
        if (isNaN(p1) || isNaN(p2)) {
          setQuickAddError(`Line ${i + 1}: Invalid set score "${setPart}".`);
          return;
        }
        setScores.push({ p1, p2 });
      }

      let p1Sets = 0, p2Sets = 0, p1Points = 0, p2Points = 0;
      for (const s of setScores) {
        p1Points += s.p1;
        p2Points += s.p2;
        if (s.p1 > s.p2) p1Sets++;
        else if (s.p2 > s.p1) p2Sets++;
      }

      const winnerId = p1Sets >= match.sets_to_win ? match.player1_id
        : p2Sets >= match.sets_to_win ? match.player2_id : null;
      const loserId = winnerId === match.player1_id ? match.player2_id
        : winnerId === match.player2_id ? match.player1_id : null;

      sqlParts.push(`-- Match #${matchNum}`);
      sqlParts.push(`UPDATE league_matches SET player1_sets_won = ${p1Sets}, player2_sets_won = ${p2Sets}, winner_id = ${winnerId ? `'${winnerId}'` : 'NULL'}, status = 'completed', played_at = '${now}', updated_at = '${now}' WHERE id = '${match.id}';`);
      sqlParts.push(`DELETE FROM league_match_sets WHERE match_id = '${match.id}';`);

      const setInserts = setScores.map((s, idx) =>
        `INSERT INTO league_match_sets (match_id, set_number, player1_score, player2_score, winner_id) VALUES ('${match.id}', ${idx + 1}, ${s.p1}, ${s.p2}, ${s.p1 > s.p2 ? `'${match.player1_id}'` : s.p2 > s.p1 ? `'${match.player2_id}'` : 'NULL'});`
      );
      sqlParts.push(...setInserts);

      if (winnerId && loserId) {
        const wp = winnerId === match.player1_id ? p1Points : p2Points;
        const lp = winnerId === match.player1_id ? p2Points : p1Points;
        statsCalls.push(`SELECT update_league_player_match_stats('${leagueId}', '${winnerId}', true, ${wp}, ${lp});`);
        statsCalls.push(`SELECT update_league_player_match_stats('${leagueId}', '${loserId}', false, ${lp}, ${wp});`);
      }
    }

    const fullSql = [
      '-- Quick Add Results: Copy and run in Supabase SQL Editor',
      `-- League: ${selectedLeague.name} (${leagueId})`,
      '-- Generated at ' + now,
      '',
      ...sqlParts,
      '',
      '-- Update league player stats',
      ...statsCalls,
    ].join('\n');

    setGeneratedSql(fullSql);
    toast.success('SQL generated. Copy and run in Supabase SQL Editor.');
  };

  const handleCopyGeneratedSql = () => {
    if (generatedSql) {
      navigator.clipboard.writeText(generatedSql);
      toast.success('SQL copied to clipboard');
    }
  };

  // Check if a league date is in the future
  const isLeagueDateUpcoming = (league: League): boolean => {
    const leagueDate = league.date || league.start_date;
    if (!leagueDate) return true;
    const today = startOfDay(new Date());
    const date = startOfDay(new Date(leagueDate));
    return isAfter(date, today) || isEqual(date, today);
  };

  const getStatusColor = (status: LeagueStatus, league?: League) => {
    // If status is upcoming but date has passed, show as past
    if (status === 'upcoming' && league && !isLeagueDateUpcoming(league)) {
      return 'bg-gray-500';
    }
    switch (status) {
      case 'upcoming': return 'bg-blue-600';
      case 'registration': return 'bg-green-600';
      case 'group_stage': return 'bg-purple-600';
      case 'round_robin': return 'bg-yellow-600';
      case 'knockouts': return 'bg-orange-600';
      case 'completed': return 'bg-gray-600';
      case 'cancelled': return 'bg-red-600';
      default: return 'bg-gray-600';
    }
  };

  const getStatusLabel = (status: LeagueStatus, league?: League): string => {
    // If status is upcoming but date has passed, show as past
    if (status === 'upcoming' && league && !isLeagueDateUpcoming(league)) {
      return 'Date Passed';
    }
    switch (status) {
      case 'upcoming': return 'Upcoming';
      case 'registration': return 'Registration Open';
      case 'group_stage': return 'Group Stage';
      case 'round_robin': return 'Round Robin';
      case 'knockouts': return 'Knockouts';
      case 'completed': return 'Completed';
      case 'cancelled': return 'Cancelled';
      default: return status;
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
                    <span className={`px-2 py-1 rounded text-xs text-white ${getStatusColor(league.status, league)}`}>
                      {getStatusLabel(league.status, league)}
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
              <p className="text-xs text-gray-500 mb-2">League can start with 2 or more players (e.g. 8 minimum recommended).</p>
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
                <span className={`inline-block mt-2 px-3 py-1 rounded text-sm text-white ${getStatusColor(selectedLeague.status, selectedLeague)}`}>
                  {getStatusLabel(selectedLeague.status, selectedLeague)}
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
            <div className="flex flex-col gap-2">
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
                  onClick={handleGenerateKnockoutMatches}
                  className="px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-lg flex items-center gap-2"
                  title="Generate knockout matches from current standings (round robin need not be fully completed)"
                >
                  <FaTrophy /> Generate & Start Knockouts
                </button>
              )}
              {selectedLeague.status === 'knockouts' && (
                <>
                  <button
                    onClick={handleRegenerateKnockouts}
                    className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-lg flex items-center gap-2"
                    title="Re-seed knockouts from current round robin standings (replaces existing semifinals)"
                  >
                    <FaTableTennis /> Regenerate Knockouts
                  </button>
                  <button
                    onClick={handleGenerateFinalAndThirdPlace}
                    className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg flex items-center gap-2"
                    title="Create Final and Third Place after both semifinals are completed"
                  >
                    <FaTrophy /> Generate Final & Third Place
                  </button>
                  <button
                    onClick={() => handleUpdateLeagueStatus('completed')}
                    className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg flex items-center gap-2"
                  >
                    <FaCheck /> Complete
                  </button>
                </>
              )}
              {selectedLeague.status === 'completed' && (
                <button
                  onClick={() => handleRevertStatus('knockouts', 'Knockouts')}
                  className="px-4 py-2 bg-gray-600 hover:bg-gray-500 text-white rounded-lg flex items-center gap-2 border border-gray-500"
                  title="Re-open tournament to fix or update knockout stage"
                >
                  <FaUndo /> Re-open (back to Knockouts)
                </button>
              )}
              </div>
              {/* Revert / Back buttons - allow admin to undo status and edit again */}
              <div className="flex gap-2 flex-wrap items-center pt-2 border-t border-gray-700 mt-2">
                <span className="text-xs text-gray-500 mr-2">Revert status:</span>
                {selectedLeague.status === 'knockouts' && (
                  <button
                    onClick={() => handleRevertStatus('round_robin', 'Round Robin')}
                    className="px-3 py-1.5 text-sm bg-gray-700 hover:bg-gray-600 text-gray-300 rounded-lg flex items-center gap-1.5"
                  >
                    <FaUndo /> Back to Round Robin
                  </button>
                )}
                {selectedLeague.status === 'round_robin' && (
                  <button
                    onClick={() => handleRevertStatus('registration', 'Registration')}
                    className="px-3 py-1.5 text-sm bg-gray-700 hover:bg-gray-600 text-gray-300 rounded-lg flex items-center gap-1.5"
                  >
                    <FaUndo /> Back to Registration
                  </button>
                )}
                {selectedLeague.status === 'registration' && (
                  <button
                    onClick={() => handleRevertStatus('upcoming', 'Upcoming')}
                    className="px-3 py-1.5 text-sm bg-gray-700 hover:bg-gray-600 text-gray-300 rounded-lg flex items-center gap-1.5"
                  >
                    <FaUndo /> Back to Upcoming
                  </button>
                )}
                {selectedLeague.status === 'completed' && (
                  <button
                    onClick={() => handleRevertStatus('round_robin', 'Round Robin')}
                    className="px-3 py-1.5 text-sm bg-gray-700 hover:bg-gray-600 text-gray-300 rounded-lg flex items-center gap-1.5"
                  >
                    <FaUndo /> Back to Round Robin
                  </button>
                )}
              </div>
              {selectedLeague.status === 'registration' && leaguePlayers.length >= 2 && (
                <p className="text-xs text-gray-500">You can start with 2+ players. Proceed to knockouts anytime from round robin.</p>
              )}
              {selectedLeague.status === 'round_robin' && (
                <p className="text-xs text-gray-500">Knockouts are seeded from current standings. You don’t need to complete all round robin matches first.</p>
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

          {/* Quick Add Results (optional bulk SQL generator) */}
          <div className="card">
            <button
              onClick={() => setShowQuickAddResults(!showQuickAddResults)}
              className="w-full flex items-center justify-between text-left"
            >
              <div className="flex items-center gap-2">
                <FaEdit className="text-primary-blue" />
                <span className="font-semibold text-white">Quick Add Results</span>
                <span className="text-xs text-gray-500">(Bulk add scores via SQL)</span>
              </div>
              {showQuickAddResults ? <FaChevronUp /> : <FaChevronDown />}
            </button>
            {showQuickAddResults && (
              <div className="mt-4 pt-4 border-t border-gray-700 space-y-4">
                <div className="flex items-start gap-2">
                  <button
                    onClick={() => setShowQuickAddFormatInfo(!showQuickAddFormatInfo)}
                    className="p-1.5 rounded hover:bg-gray-700 text-primary-blue flex-shrink-0 mt-0.5"
                    title="Query format help"
                  >
                    <FaInfoCircle className="text-lg" />
                  </button>
                  <div className="flex-1">
                    <label className="label text-sm">Paste results (one match per line)</label>
                    <textarea
                      value={quickAddInput}
                      onChange={(e) => { setQuickAddInput(e.target.value); setQuickAddError(''); }}
                      placeholder={'1|11-9|11-7|11-5\n2|9-11|11-8|11-6|11-4'}
                      className="input-field font-mono text-sm min-h-[120px]"
                      rows={6}
                    />
                    {showQuickAddFormatInfo && (
                      <div className="mt-2 p-3 bg-gray-800 rounded-lg text-sm text-gray-300 space-y-2">
                        <p className="font-semibold text-white">Format: <code className="bg-gray-700 px-1 rounded">match_number|set1|set2|...</code></p>
                        <p>• One match per line. Use <code className="bg-gray-700 px-1 rounded">|</code> or <code className="bg-gray-700 px-1 rounded">,</code> to separate.</p>
                        <p>• Set scores: <code className="bg-gray-700 px-1 rounded">player1-player2</code> (e.g. 11-9, 9-11).</p>
                        <p className="text-gray-400">Example:</p>
                        <pre className="bg-gray-900 p-2 rounded text-xs overflow-x-auto">1|11-9|11-7|11-5
2|9-11|11-8|11-6|11-4</pre>
                        <p className="text-amber-400">Copy the generated SQL and run it in Supabase Dashboard → SQL Editor.</p>
                      </div>
                    )}
                  </div>
                </div>
                {quickAddError && <p className="text-red-400 text-sm">{quickAddError}</p>}
                <button
                  onClick={handleGenerateQuickAddSql}
                  className="px-4 py-2 bg-primary-blue hover:bg-blue-700 text-white rounded-lg flex items-center gap-2"
                >
                  Generate SQL
                </button>
                {generatedSql && (
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-gray-400">Generated SQL (copy and run in Supabase SQL Editor)</span>
                      <button
                        onClick={handleCopyGeneratedSql}
                        className="px-3 py-1.5 bg-gray-700 hover:bg-gray-600 text-white rounded-lg flex items-center gap-2 text-sm"
                      >
                        <FaCopy /> Copy
                      </button>
                    </div>
                    <pre className="p-3 bg-gray-900 rounded-lg text-xs text-gray-300 overflow-x-auto max-h-64 overflow-y-auto font-mono whitespace-pre-wrap break-words">
                      {generatedSql}
                    </pre>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </AdminLayout>
  );
};

export default AdminTournamentsPage;
