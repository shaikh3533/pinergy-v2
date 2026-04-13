-- ================================================================
-- MIGRATION: ADD SPINGERGY SPECIALS / DAVIS CUP MODULE
-- ================================================================

-- 1. dc_tournaments
CREATE TABLE IF NOT EXISTS dc_tournaments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  date DATE,
  status TEXT DEFAULT 'upcoming' CHECK (status IN ('upcoming', 'group_stage', 'knockouts', 'completed', 'cancelled')),
  group_stage_rubbers INTEGER DEFAULT 3,
  knockout_rubbers INTEGER DEFAULT 5,
  num_groups INTEGER DEFAULT 4,
  qualifiers_per_group INTEGER DEFAULT 2,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. dc_teams
CREATE TABLE IF NOT EXISTS dc_teams (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tournament_id UUID NOT NULL REFERENCES dc_tournaments(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  group_number INTEGER,
  seed_number INTEGER,
  wins INTEGER DEFAULT 0,
  losses INTEGER DEFAULT 0,
  rubbers_won INTEGER DEFAULT 0,
  rubbers_lost INTEGER DEFAULT 0,
  sets_won INTEGER DEFAULT 0,
  sets_lost INTEGER DEFAULT 0,
  points_for INTEGER DEFAULT 0,
  points_against INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. dc_team_players (Roster)
CREATE TABLE IF NOT EXISTS dc_team_players (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id UUID NOT NULL REFERENCES dc_teams(id) ON DELETE CASCADE,
  player_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(team_id, player_id)
);

-- 4. dc_ties (The Encounter between two teams)
CREATE TABLE IF NOT EXISTS dc_ties (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tournament_id UUID NOT NULL REFERENCES dc_tournaments(id) ON DELETE CASCADE,
  team1_id UUID NOT NULL REFERENCES dc_teams(id) ON DELETE CASCADE,
  team2_id UUID NOT NULL REFERENCES dc_teams(id) ON DELETE CASCADE,
  winner_id UUID REFERENCES dc_teams(id),
  tie_type TEXT NOT NULL CHECK (tie_type IN ('group_stage', 'quarterfinal', 'semifinal', 'final', 'third_place')),
  group_number INTEGER,
  bracket_position TEXT,
  status TEXT DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'in_progress', 'completed', 'cancelled')),
  team1_rubbers_won INTEGER DEFAULT 0,
  team2_rubbers_won INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. dc_matches (The individual Rubbers inside a Tie)
CREATE TABLE IF NOT EXISTS dc_matches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tie_id UUID NOT NULL REFERENCES dc_ties(id) ON DELETE CASCADE,
  match_number INTEGER NOT NULL, -- e.g. 1 for Singles 1, 3 for Doubles
  rubber_type TEXT NOT NULL CHECK (rubber_type IN ('singles', 'doubles')),
  status TEXT DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'in_progress', 'completed', 'cancelled')),
  -- Team 1 Lineup
  team1_player1_id UUID REFERENCES users(id),
  team1_player2_id UUID REFERENCES users(id), -- Null if singles
  -- Team 2 Lineup
  team2_player1_id UUID REFERENCES users(id),
  team2_player2_id UUID REFERENCES users(id), -- Null if singles
  -- Scoring
  sets_to_win INTEGER DEFAULT 2,
  team1_sets_won INTEGER DEFAULT 0,
  team2_sets_won INTEGER DEFAULT 0,
  winner_team_id UUID REFERENCES dc_teams(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 6. dc_match_sets (Set-by-set 11 point scores)
CREATE TABLE IF NOT EXISTS dc_match_sets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  match_id UUID NOT NULL REFERENCES dc_matches(id) ON DELETE CASCADE,
  set_number INTEGER NOT NULL,
  team1_score INTEGER DEFAULT 0,
  team2_score INTEGER DEFAULT 0,
  winner_team_id UUID REFERENCES dc_teams(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Note: We intentionally avoid complex database trigger-based auto point aggregation here 
-- to allow the React Admin UI maximum flexibility in saving detailed scores perfectly 
-- without fighting PostgreSQL constraints. Admin will trigger final stats updates via code.
