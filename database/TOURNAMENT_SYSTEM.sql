-- ================================================================
-- SPINERGY - TOURNAMENT / LEAGUE MANAGEMENT SYSTEM
-- Complete database schema for leagues, matches, and rankings
-- ================================================================

-- ================================================================
-- STEP 1: CREATE LEAGUES TABLE
-- ================================================================

CREATE TABLE IF NOT EXISTS leagues (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  league_type TEXT NOT NULL DEFAULT 'round_robin_knockouts' 
    CHECK (league_type IN ('round_robin', 'round_robin_knockouts', 'group_stage_knockouts', 'single_elimination', 'double_elimination')),
  schedule_days TEXT[] NOT NULL DEFAULT ARRAY['Saturday', 'Sunday'],
  frequency TEXT DEFAULT 'weekly', -- weekly, bi-weekly, monthly
  start_date DATE,
  end_date DATE,
  status TEXT NOT NULL DEFAULT 'upcoming' 
    CHECK (status IN ('upcoming', 'registration', 'group_stage', 'round_robin', 'knockouts', 'completed', 'cancelled')),
  rules TEXT, -- Custom rules text
  max_players INTEGER DEFAULT 16,
  round_robin_sets INTEGER DEFAULT 1, -- Best of 1 for round robin
  semifinal_sets INTEGER DEFAULT 3, -- Best of 3 for semifinals
  final_sets INTEGER DEFAULT 5, -- Best of 5 for finals
  top_qualifiers INTEGER DEFAULT 4, -- How many advance to knockouts
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ================================================================
-- STEP 2: CREATE LEAGUE PLAYERS (JOIN TABLE)
-- ================================================================

CREATE TABLE IF NOT EXISTS league_players (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  league_id UUID NOT NULL REFERENCES leagues(id) ON DELETE CASCADE,
  player_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  registration_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'withdrawn', 'disqualified')),
  seed_number INTEGER, -- Optional seeding
  -- League-specific stats (calculated)
  wins INTEGER DEFAULT 0,
  losses INTEGER DEFAULT 0,
  points_for INTEGER DEFAULT 0, -- Total points scored
  points_against INTEGER DEFAULT 0, -- Total points conceded
  point_difference INTEGER DEFAULT 0, -- points_for - points_against
  final_rank INTEGER, -- Final position in league
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(league_id, player_id)
);

-- ================================================================
-- STEP 3: CREATE LEAGUE MATCHES TABLE
-- ================================================================

CREATE TABLE IF NOT EXISTS league_matches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  league_id UUID NOT NULL REFERENCES leagues(id) ON DELETE CASCADE,
  player1_id UUID NOT NULL REFERENCES users(id),
  player2_id UUID NOT NULL REFERENCES users(id),
  winner_id UUID REFERENCES users(id),
  match_type TEXT NOT NULL CHECK (match_type IN ('round_robin', 'semifinal', 'final', 'third_place')),
  match_number INTEGER, -- Match order in round
  round_number INTEGER DEFAULT 1, -- For round robin rounds
  sets_to_win INTEGER NOT NULL, -- 1, 2, or 3 (best of 1, 3, or 5)
  player1_sets_won INTEGER DEFAULT 0,
  player2_sets_won INTEGER DEFAULT 0,
  status TEXT DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'in_progress', 'completed', 'cancelled', 'walkover')),
  scheduled_date DATE,
  scheduled_time TIME,
  played_at TIMESTAMP WITH TIME ZONE,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ================================================================
-- STEP 4: CREATE MATCH SETS TABLE (Individual set scores)
-- ================================================================

CREATE TABLE IF NOT EXISTS league_match_sets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  match_id UUID NOT NULL REFERENCES league_matches(id) ON DELETE CASCADE,
  set_number INTEGER NOT NULL,
  player1_score INTEGER NOT NULL DEFAULT 0,
  player2_score INTEGER NOT NULL DEFAULT 0,
  winner_id UUID REFERENCES users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(match_id, set_number)
);

-- ================================================================
-- STEP 5: CREATE GLOBAL PLAYER STATS TABLE
-- ================================================================

CREATE TABLE IF NOT EXISTS player_tournament_stats (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  player_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE UNIQUE,
  -- Participation stats
  total_leagues_played INTEGER DEFAULT 0,
  total_matches_played INTEGER DEFAULT 0,
  total_wins INTEGER DEFAULT 0,
  total_losses INTEGER DEFAULT 0,
  -- Points stats
  total_points_for INTEGER DEFAULT 0,
  total_points_against INTEGER DEFAULT 0,
  total_point_difference INTEGER DEFAULT 0,
  -- Achievements
  total_championships INTEGER DEFAULT 0, -- League wins
  total_runner_ups INTEGER DEFAULT 0,
  total_top_4_finishes INTEGER DEFAULT 0,
  total_top_6_finishes INTEGER DEFAULT 0,
  -- Rating points (based on formula)
  rating_points INTEGER DEFAULT 0,
  -- Calculated fields
  win_percentage DECIMAL(5,2) DEFAULT 0.00,
  avg_point_difference DECIMAL(6,2) DEFAULT 0.00,
  -- Timestamps
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ================================================================
-- STEP 6: CREATE HEAD-TO-HEAD STATS TABLE
-- ================================================================

CREATE TABLE IF NOT EXISTS player_head_to_head (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  player1_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  player2_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  player1_wins INTEGER DEFAULT 0,
  player2_wins INTEGER DEFAULT 0,
  player1_sets_won INTEGER DEFAULT 0,
  player2_sets_won INTEGER DEFAULT 0,
  player1_points_for INTEGER DEFAULT 0,
  player2_points_for INTEGER DEFAULT 0,
  total_matches INTEGER DEFAULT 0,
  last_match_date TIMESTAMP WITH TIME ZONE,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(player1_id, player2_id),
  CHECK (player1_id < player2_id) -- Ensure consistent ordering
);

-- ================================================================
-- STEP 7: CREATE INDEXES FOR PERFORMANCE
-- ================================================================

CREATE INDEX IF NOT EXISTS idx_leagues_status ON leagues(status);
CREATE INDEX IF NOT EXISTS idx_leagues_dates ON leagues(start_date, end_date);
CREATE INDEX IF NOT EXISTS idx_league_players_league ON league_players(league_id);
CREATE INDEX IF NOT EXISTS idx_league_players_player ON league_players(player_id);
CREATE INDEX IF NOT EXISTS idx_league_matches_league ON league_matches(league_id);
CREATE INDEX IF NOT EXISTS idx_league_matches_players ON league_matches(player1_id, player2_id);
CREATE INDEX IF NOT EXISTS idx_league_matches_status ON league_matches(status);
CREATE INDEX IF NOT EXISTS idx_league_match_sets_match ON league_match_sets(match_id);
CREATE INDEX IF NOT EXISTS idx_player_stats_rating ON player_tournament_stats(rating_points DESC);

-- ================================================================
-- STEP 8: CREATE HELPER FUNCTIONS
-- ================================================================

-- Function to calculate player rating points
CREATE OR REPLACE FUNCTION calculate_player_rating(p_player_id UUID)
RETURNS INTEGER AS $$
DECLARE
  v_rating INTEGER := 0;
  v_league RECORD;
BEGIN
  -- Loop through all leagues the player participated in
  FOR v_league IN 
    SELECT 
      lp.final_rank,
      l.status,
      (SELECT COUNT(*) FROM league_players WHERE league_id = l.id) as player_count
    FROM league_players lp
    JOIN leagues l ON lp.league_id = l.id
    WHERE lp.player_id = p_player_id AND l.status = 'completed'
  LOOP
    -- Participation points: 5
    v_rating := v_rating + 5;
    
    -- Top 6 (or equivalent): +5
    IF v_league.final_rank <= 6 THEN
      v_rating := v_rating + 5;
    END IF;
    
    -- Top 4: +5
    IF v_league.final_rank <= 4 THEN
      v_rating := v_rating + 5;
    END IF;
    
    -- Runner-up: +5
    IF v_league.final_rank = 2 THEN
      v_rating := v_rating + 5;
    END IF;
    
    -- Winner: +10 (total 30 for winner)
    IF v_league.final_rank = 1 THEN
      v_rating := v_rating + 10;
    END IF;
  END LOOP;
  
  RETURN v_rating;
END;
$$ LANGUAGE plpgsql;

-- Function to update player tournament stats
CREATE OR REPLACE FUNCTION update_player_tournament_stats(p_player_id UUID)
RETURNS VOID AS $$
DECLARE
  v_stats RECORD;
BEGIN
  -- Calculate aggregated stats
  SELECT 
    COUNT(DISTINCT lp.league_id) as leagues_played,
    COALESCE(SUM(lp.wins), 0) as total_wins,
    COALESCE(SUM(lp.losses), 0) as total_losses,
    COALESCE(SUM(lp.points_for), 0) as total_points_for,
    COALESCE(SUM(lp.points_against), 0) as total_points_against,
    COALESCE(SUM(lp.point_difference), 0) as total_point_diff,
    COUNT(CASE WHEN lp.final_rank = 1 THEN 1 END) as championships,
    COUNT(CASE WHEN lp.final_rank = 2 THEN 1 END) as runner_ups,
    COUNT(CASE WHEN lp.final_rank <= 4 THEN 1 END) as top_4,
    COUNT(CASE WHEN lp.final_rank <= 6 THEN 1 END) as top_6
  INTO v_stats
  FROM league_players lp
  JOIN leagues l ON lp.league_id = l.id
  WHERE lp.player_id = p_player_id AND l.status = 'completed';
  
  -- Insert or update stats
  INSERT INTO player_tournament_stats (
    player_id,
    total_leagues_played,
    total_matches_played,
    total_wins,
    total_losses,
    total_points_for,
    total_points_against,
    total_point_difference,
    total_championships,
    total_runner_ups,
    total_top_4_finishes,
    total_top_6_finishes,
    rating_points,
    win_percentage,
    avg_point_difference,
    updated_at
  )
  VALUES (
    p_player_id,
    v_stats.leagues_played,
    v_stats.total_wins + v_stats.total_losses,
    v_stats.total_wins,
    v_stats.total_losses,
    v_stats.total_points_for,
    v_stats.total_points_against,
    v_stats.total_point_diff,
    v_stats.championships,
    v_stats.runner_ups,
    v_stats.top_4,
    v_stats.top_6,
    calculate_player_rating(p_player_id),
    CASE WHEN (v_stats.total_wins + v_stats.total_losses) > 0 
      THEN ROUND((v_stats.total_wins::DECIMAL / (v_stats.total_wins + v_stats.total_losses)) * 100, 2)
      ELSE 0 END,
    CASE WHEN (v_stats.total_wins + v_stats.total_losses) > 0 
      THEN ROUND(v_stats.total_point_diff::DECIMAL / (v_stats.total_wins + v_stats.total_losses), 2)
      ELSE 0 END,
    NOW()
  )
  ON CONFLICT (player_id) DO UPDATE SET
    total_leagues_played = EXCLUDED.total_leagues_played,
    total_matches_played = EXCLUDED.total_matches_played,
    total_wins = EXCLUDED.total_wins,
    total_losses = EXCLUDED.total_losses,
    total_points_for = EXCLUDED.total_points_for,
    total_points_against = EXCLUDED.total_points_against,
    total_point_difference = EXCLUDED.total_point_difference,
    total_championships = EXCLUDED.total_championships,
    total_runner_ups = EXCLUDED.total_runner_ups,
    total_top_4_finishes = EXCLUDED.total_top_4_finishes,
    total_top_6_finishes = EXCLUDED.total_top_6_finishes,
    rating_points = EXCLUDED.rating_points,
    win_percentage = EXCLUDED.win_percentage,
    avg_point_difference = EXCLUDED.avg_point_difference,
    updated_at = NOW();
END;
$$ LANGUAGE plpgsql;

-- Function to update league player stats after a match
CREATE OR REPLACE FUNCTION update_league_player_stats()
RETURNS TRIGGER AS $$
BEGIN
  -- Only process completed matches
  IF NEW.status = 'completed' AND NEW.winner_id IS NOT NULL THEN
    -- Update winner stats
    UPDATE league_players 
    SET wins = wins + 1
    WHERE league_id = NEW.league_id AND player_id = NEW.winner_id;
    
    -- Update loser stats
    UPDATE league_players 
    SET losses = losses + 1
    WHERE league_id = NEW.league_id 
      AND player_id = CASE 
        WHEN NEW.winner_id = NEW.player1_id THEN NEW.player2_id 
        ELSE NEW.player1_id 
      END;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for match completion
DROP TRIGGER IF EXISTS trigger_update_league_stats ON league_matches;
CREATE TRIGGER trigger_update_league_stats
AFTER UPDATE OF status ON league_matches
FOR EACH ROW
WHEN (NEW.status = 'completed')
EXECUTE FUNCTION update_league_player_stats();

-- ================================================================
-- STEP 8.5: FUNCTION TO UPDATE LEAGUE PLAYER STATS AFTER MATCH
-- ================================================================

CREATE OR REPLACE FUNCTION update_league_player_match_stats(
  p_league_id UUID,
  p_player_id UUID,
  p_won BOOLEAN,
  p_points_for INTEGER,
  p_points_against INTEGER
)
RETURNS VOID AS $$
BEGIN
  UPDATE league_players
  SET 
    wins = CASE WHEN p_won THEN wins + 1 ELSE wins END,
    losses = CASE WHEN NOT p_won THEN losses + 1 ELSE losses END,
    points_for = points_for + p_points_for,
    points_against = points_against + p_points_against,
    point_difference = point_difference + (p_points_for - p_points_against)
  WHERE league_id = p_league_id AND player_id = p_player_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to update head-to-head stats
CREATE OR REPLACE FUNCTION update_head_to_head(
  p_winner_id UUID,
  p_loser_id UUID,
  p_winner_sets INTEGER,
  p_loser_sets INTEGER,
  p_winner_points INTEGER,
  p_loser_points INTEGER
)
RETURNS VOID AS $$
DECLARE
  v_p1_id UUID;
  v_p2_id UUID;
BEGIN
  -- Ensure consistent ordering (smaller UUID first)
  IF p_winner_id < p_loser_id THEN
    v_p1_id := p_winner_id;
    v_p2_id := p_loser_id;
  ELSE
    v_p1_id := p_loser_id;
    v_p2_id := p_winner_id;
  END IF;

  -- Insert or update head-to-head record
  INSERT INTO player_head_to_head (
    player1_id, player2_id, 
    player1_wins, player2_wins,
    player1_sets_won, player2_sets_won,
    player1_points_for, player2_points_for,
    total_matches, last_match_date
  )
  VALUES (
    v_p1_id, v_p2_id,
    CASE WHEN p_winner_id = v_p1_id THEN 1 ELSE 0 END,
    CASE WHEN p_winner_id = v_p2_id THEN 1 ELSE 0 END,
    CASE WHEN p_winner_id = v_p1_id THEN p_winner_sets ELSE p_loser_sets END,
    CASE WHEN p_winner_id = v_p2_id THEN p_winner_sets ELSE p_loser_sets END,
    CASE WHEN p_winner_id = v_p1_id THEN p_winner_points ELSE p_loser_points END,
    CASE WHEN p_winner_id = v_p2_id THEN p_winner_points ELSE p_loser_points END,
    1, NOW()
  )
  ON CONFLICT (player1_id, player2_id) DO UPDATE SET
    player1_wins = player_head_to_head.player1_wins + 
      CASE WHEN p_winner_id = v_p1_id THEN 1 ELSE 0 END,
    player2_wins = player_head_to_head.player2_wins + 
      CASE WHEN p_winner_id = v_p2_id THEN 1 ELSE 0 END,
    player1_sets_won = player_head_to_head.player1_sets_won + 
      CASE WHEN p_winner_id = v_p1_id THEN p_winner_sets ELSE p_loser_sets END,
    player2_sets_won = player_head_to_head.player2_sets_won + 
      CASE WHEN p_winner_id = v_p2_id THEN p_winner_sets ELSE p_loser_sets END,
    player1_points_for = player_head_to_head.player1_points_for + 
      CASE WHEN p_winner_id = v_p1_id THEN p_winner_points ELSE p_loser_points END,
    player2_points_for = player_head_to_head.player2_points_for + 
      CASE WHEN p_winner_id = v_p2_id THEN p_winner_points ELSE p_loser_points END,
    total_matches = player_head_to_head.total_matches + 1,
    last_match_date = NOW(),
    updated_at = NOW();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to finalize league rankings
CREATE OR REPLACE FUNCTION finalize_league_rankings(p_league_id UUID)
RETURNS VOID AS $$
DECLARE
  v_player RECORD;
  v_rank INTEGER := 0;
BEGIN
  -- Update final ranks based on standings
  FOR v_player IN 
    SELECT 
      lp.id,
      ROW_NUMBER() OVER (
        ORDER BY 
          lp.wins DESC,
          lp.point_difference DESC,
          lp.points_against ASC,
          lp.points_for DESC
      ) as calculated_rank
    FROM league_players lp
    WHERE lp.league_id = p_league_id AND lp.status = 'active'
  LOOP
    UPDATE league_players
    SET final_rank = v_player.calculated_rank
    WHERE id = v_player.id;
  END LOOP;

  -- Update global tournament stats for all players in this league
  FOR v_player IN 
    SELECT player_id FROM league_players WHERE league_id = p_league_id
  LOOP
    PERFORM update_player_tournament_stats(v_player.player_id);
  END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ================================================================
-- STEP 9: DISABLE RLS FOR NOW (Enable later with proper policies)
-- ================================================================

ALTER TABLE leagues DISABLE ROW LEVEL SECURITY;
ALTER TABLE league_players DISABLE ROW LEVEL SECURITY;
ALTER TABLE league_matches DISABLE ROW LEVEL SECURITY;
ALTER TABLE league_match_sets DISABLE ROW LEVEL SECURITY;
ALTER TABLE player_tournament_stats DISABLE ROW LEVEL SECURITY;
ALTER TABLE player_head_to_head DISABLE ROW LEVEL SECURITY;

-- ================================================================
-- STEP 10: CREATE VIEWS FOR EASY QUERYING
-- ================================================================

-- League standings view with tie-breaking
CREATE OR REPLACE VIEW league_standings AS
SELECT 
  lp.league_id,
  lp.player_id,
  u.name as player_name,
  lp.wins,
  lp.losses,
  lp.points_for,
  lp.points_against,
  lp.point_difference,
  lp.final_rank,
  -- Ranking calculation with tie-breakers
  ROW_NUMBER() OVER (
    PARTITION BY lp.league_id 
    ORDER BY 
      lp.wins DESC,              -- 1. Total wins
      lp.point_difference DESC,   -- 2. Point difference (run rate)
      lp.points_against ASC,      -- 3. Lowest points conceded
      lp.points_for DESC          -- 4. Highest points scored
  ) as calculated_rank
FROM league_players lp
JOIN users u ON lp.player_id = u.id
WHERE lp.status = 'active';

-- Global player rankings view
CREATE OR REPLACE VIEW global_player_rankings AS
SELECT 
  pts.player_id,
  u.name as player_name,
  pts.rating_points,
  pts.total_leagues_played,
  pts.total_wins,
  pts.total_losses,
  pts.win_percentage,
  pts.avg_point_difference,
  pts.total_championships,
  pts.total_runner_ups,
  ROW_NUMBER() OVER (
    ORDER BY 
      pts.rating_points DESC,
      pts.win_percentage DESC,
      pts.avg_point_difference DESC,
      pts.total_leagues_played DESC
  ) as global_rank
FROM player_tournament_stats pts
JOIN users u ON pts.player_id = u.id
ORDER BY global_rank;

-- ================================================================
-- SUCCESS MESSAGE
-- ================================================================

DO $$ 
BEGIN 
  RAISE NOTICE '';
  RAISE NOTICE '================================================================';
  RAISE NOTICE '✅ TOURNAMENT SYSTEM DATABASE CREATED!';
  RAISE NOTICE '================================================================';
  RAISE NOTICE '📊 Tables created:';
  RAISE NOTICE '   - leagues (tournament/league info)';
  RAISE NOTICE '   - league_players (players in each league)';
  RAISE NOTICE '   - league_matches (match records)';
  RAISE NOTICE '   - league_match_sets (set scores)';
  RAISE NOTICE '   - player_tournament_stats (global stats)';
  RAISE NOTICE '   - player_head_to_head (h2h records)';
  RAISE NOTICE '';
  RAISE NOTICE '📈 Views created:';
  RAISE NOTICE '   - league_standings (with tie-breaking)';
  RAISE NOTICE '   - global_player_rankings';
  RAISE NOTICE '';
  RAISE NOTICE '⚡ Functions created:';
  RAISE NOTICE '   - calculate_player_rating()';
  RAISE NOTICE '   - update_player_tournament_stats()';
  RAISE NOTICE '================================================================';
END $$;
