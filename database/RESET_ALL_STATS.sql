-- ================================================================
-- SPINERGY - RESET ALL STATS (KEEP USERS)
-- This script clears all booking and tournament data
-- but preserves user accounts
-- ================================================================

-- ⚠️ WARNING: This will delete all data except user accounts!
-- Run this only if you want to start fresh.

-- ================================================================
-- STEP 1: DELETE TOURNAMENT/LEAGUE DATA
-- ================================================================

-- Delete match sets first (child of matches)
DELETE FROM league_match_sets;

-- Delete matches (child of leagues)
DELETE FROM league_matches;

-- Delete league players (child of leagues)
DELETE FROM league_players;

-- Delete leagues
DELETE FROM leagues;

-- Delete head-to-head records
DELETE FROM player_head_to_head;

-- Delete tournament stats
DELETE FROM player_tournament_stats;

-- ================================================================
-- STEP 2: DELETE BOOKING DATA
-- ================================================================

-- Delete all bookings
DELETE FROM bookings;

-- ================================================================
-- STEP 3: DELETE OTHER DATA (if exists)
-- ================================================================

-- Delete matches (casual matches table if exists)
DELETE FROM matches;

-- Delete ads
DELETE FROM ads;

-- Delete suggestions
DELETE FROM suggestions;

-- ================================================================
-- STEP 4: RESET USER STATS (KEEP USERS)
-- ================================================================

-- Reset all user stats to zero but keep their accounts
UPDATE users SET
  rating_points = 0,
  level = 'Noob',
  total_hours_played = 0;

-- ================================================================
-- STEP 5: VERIFY CLEANUP
-- ================================================================

-- Show remaining data counts
SELECT 'users' as table_name, COUNT(*) as count FROM users
UNION ALL
SELECT 'bookings', COUNT(*) FROM bookings
UNION ALL
SELECT 'leagues', COUNT(*) FROM leagues
UNION ALL
SELECT 'league_players', COUNT(*) FROM league_players
UNION ALL
SELECT 'league_matches', COUNT(*) FROM league_matches
UNION ALL
SELECT 'league_match_sets', COUNT(*) FROM league_match_sets
UNION ALL
SELECT 'player_tournament_stats', COUNT(*) FROM player_tournament_stats
UNION ALL
SELECT 'player_head_to_head', COUNT(*) FROM player_head_to_head
UNION ALL
SELECT 'matches', COUNT(*) FROM matches
UNION ALL
SELECT 'ads', COUNT(*) FROM ads;

-- Show remaining users
SELECT id, name, email, phone, rating_points, level, total_hours_played, role 
FROM users 
ORDER BY name;

-- ================================================================
-- SUCCESS MESSAGE
-- ================================================================

DO $$ 
BEGIN 
  RAISE NOTICE '';
  RAISE NOTICE '================================================================';
  RAISE NOTICE '✅ ALL STATS RESET SUCCESSFULLY!';
  RAISE NOTICE '================================================================';
  RAISE NOTICE '🗑️  Deleted: bookings, leagues, matches, ads, suggestions';
  RAISE NOTICE '🔄  Reset: user stats (points, level, hours)';
  RAISE NOTICE '✅  Kept: user accounts';
  RAISE NOTICE '';
  RAISE NOTICE '📊 All users now have:';
  RAISE NOTICE '   - rating_points = 0';
  RAISE NOTICE '   - level = Noob';
  RAISE NOTICE '   - total_hours_played = 0';
  RAISE NOTICE '================================================================';
END $$;
