-- ================================================================
-- FIX TOURNAMENT RLS POLICIES
-- Allow users to register themselves for tournaments
-- ================================================================

-- First, enable RLS on the tables
ALTER TABLE leagues ENABLE ROW LEVEL SECURITY;
ALTER TABLE league_players ENABLE ROW LEVEL SECURITY;
ALTER TABLE league_matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE league_match_sets ENABLE ROW LEVEL SECURITY;

-- ================================================================
-- LEAGUES POLICIES
-- ================================================================

-- Everyone can view leagues
DROP POLICY IF EXISTS "Leagues are viewable by everyone" ON leagues;
CREATE POLICY "Leagues are viewable by everyone" ON leagues
  FOR SELECT USING (true);

-- Admins can manage leagues
DROP POLICY IF EXISTS "Admins can manage leagues" ON leagues;
CREATE POLICY "Admins can manage leagues" ON leagues
  FOR ALL USING (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')
  );

-- ================================================================
-- LEAGUE PLAYERS POLICIES (IMPORTANT FOR REGISTRATION)
-- ================================================================

-- Everyone can view league players
DROP POLICY IF EXISTS "League players are viewable by everyone" ON league_players;
CREATE POLICY "League players are viewable by everyone" ON league_players
  FOR SELECT USING (true);

-- Users can register themselves (INSERT their own record)
DROP POLICY IF EXISTS "Users can register themselves" ON league_players;
CREATE POLICY "Users can register themselves" ON league_players
  FOR INSERT WITH CHECK (
    auth.uid() = player_id
  );

-- Users can withdraw themselves (DELETE their own record)
DROP POLICY IF EXISTS "Users can withdraw themselves" ON league_players;
CREATE POLICY "Users can withdraw themselves" ON league_players
  FOR DELETE USING (
    auth.uid() = player_id
  );

-- Admins can manage all league players
DROP POLICY IF EXISTS "Admins can manage league players" ON league_players;
CREATE POLICY "Admins can manage league players" ON league_players
  FOR ALL USING (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')
  );

-- ================================================================
-- LEAGUE MATCHES POLICIES
-- ================================================================

-- Everyone can view league matches
DROP POLICY IF EXISTS "League matches are viewable by everyone" ON league_matches;
CREATE POLICY "League matches are viewable by everyone" ON league_matches
  FOR SELECT USING (true);

-- Admins can manage league matches
DROP POLICY IF EXISTS "Admins can manage league matches" ON league_matches;
CREATE POLICY "Admins can manage league matches" ON league_matches
  FOR ALL USING (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')
  );

-- ================================================================
-- LEAGUE MATCH SETS POLICIES
-- ================================================================

-- Everyone can view match sets
DROP POLICY IF EXISTS "Match sets are viewable by everyone" ON league_match_sets;
CREATE POLICY "Match sets are viewable by everyone" ON league_match_sets
  FOR SELECT USING (true);

-- Admins can manage match sets
DROP POLICY IF EXISTS "Admins can manage match sets" ON league_match_sets;
CREATE POLICY "Admins can manage match sets" ON league_match_sets
  FOR ALL USING (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')
  );

-- ================================================================
-- PLAYER TOURNAMENT STATS POLICIES
-- ================================================================

ALTER TABLE player_tournament_stats ENABLE ROW LEVEL SECURITY;

-- Everyone can view stats
DROP POLICY IF EXISTS "Stats are viewable by everyone" ON player_tournament_stats;
CREATE POLICY "Stats are viewable by everyone" ON player_tournament_stats
  FOR SELECT USING (true);

-- System can update stats (via triggers)
DROP POLICY IF EXISTS "System can manage stats" ON player_tournament_stats;
CREATE POLICY "System can manage stats" ON player_tournament_stats
  FOR ALL USING (true);

-- ================================================================
-- PLAYER HEAD TO HEAD POLICIES
-- ================================================================

ALTER TABLE player_head_to_head ENABLE ROW LEVEL SECURITY;

-- Everyone can view head to head
DROP POLICY IF EXISTS "Head to head viewable by everyone" ON player_head_to_head;
CREATE POLICY "Head to head viewable by everyone" ON player_head_to_head
  FOR SELECT USING (true);

-- System can manage head to head
DROP POLICY IF EXISTS "System can manage head to head" ON player_head_to_head;
CREATE POLICY "System can manage head to head" ON player_head_to_head
  FOR ALL USING (true);

-- ================================================================
-- GRANT PERMISSIONS
-- ================================================================

-- Grant usage on sequences if any
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO authenticated;
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO anon;

-- ================================================================
-- SUCCESS MESSAGE
-- ================================================================

DO $$ 
BEGIN 
  RAISE NOTICE '';
  RAISE NOTICE '================================================================';
  RAISE NOTICE '✅ TOURNAMENT RLS POLICIES FIXED!';
  RAISE NOTICE '================================================================';
  RAISE NOTICE 'Users can now:';
  RAISE NOTICE '  - View all leagues and matches';
  RAISE NOTICE '  - Register themselves for tournaments';
  RAISE NOTICE '  - Withdraw from tournaments';
  RAISE NOTICE '';
  RAISE NOTICE 'Admins can:';
  RAISE NOTICE '  - Manage all leagues, players, and matches';
  RAISE NOTICE '================================================================';
END $$;
