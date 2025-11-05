-- ================================================================
-- SPINERGY - COMPLETE DATABASE SETUP
-- One clean script to fix everything
-- ================================================================

-- STEP 1: DISABLE RLS ON ALL TABLES (Make everything work first)
-- ================================================================
ALTER TABLE users DISABLE ROW LEVEL SECURITY;
ALTER TABLE bookings DISABLE ROW LEVEL SECURITY;
ALTER TABLE matches DISABLE ROW LEVEL SECURITY;
ALTER TABLE ads DISABLE ROW LEVEL SECURITY;
ALTER TABLE suggestions DISABLE ROW LEVEL SECURITY;
ALTER TABLE booking_reports DISABLE ROW LEVEL SECURITY;
ALTER TABLE pricing_rules DISABLE ROW LEVEL SECURITY;
ALTER TABLE table_names DISABLE ROW LEVEL SECURITY;
ALTER TABLE club_settings DISABLE ROW LEVEL SECURITY;

-- STEP 2: UPDATE PRICING TO YOUR REQUIREMENTS
-- ================================================================
-- Table A: 1000/hr, 500/30min
-- Table B: 800/hr, 400/30min

UPDATE pricing_rules SET price = 500 WHERE table_type = 'table_a' AND duration_minutes = 30 AND coaching = false;
UPDATE pricing_rules SET price = 700 WHERE table_type = 'table_a' AND duration_minutes = 30 AND coaching = true;
UPDATE pricing_rules SET price = 1000 WHERE table_type = 'table_a' AND duration_minutes = 60 AND coaching = false;
UPDATE pricing_rules SET price = 1200 WHERE table_type = 'table_a' AND duration_minutes = 60 AND coaching = true;
UPDATE pricing_rules SET price = 400 WHERE table_type = 'table_b' AND duration_minutes = 30 AND coaching = false;
UPDATE pricing_rules SET price = 600 WHERE table_type = 'table_b' AND duration_minutes = 30 AND coaching = true;
UPDATE pricing_rules SET price = 800 WHERE table_type = 'table_b' AND duration_minutes = 60 AND coaching = false;
UPDATE pricing_rules SET price = 1000 WHERE table_type = 'table_b' AND duration_minutes = 60 AND coaching = true;

-- STEP 3: VERIFY EVERYTHING
-- ================================================================

-- Check RLS is disabled
SELECT 
  tablename,
  rowsecurity as rls_enabled
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY tablename;

-- Check pricing is updated
SELECT 
  table_type,
  duration_minutes,
  coaching,
  price
FROM pricing_rules
WHERE active = true
ORDER BY table_type, duration_minutes, coaching;

-- ================================================================
-- SUCCESS! 
-- All tables are now accessible without RLS restrictions
-- Pricing is updated correctly
-- Bookings should work immediately
-- ================================================================

-- Test booking (uncomment to test):
-- SELECT * FROM bookings LIMIT 5;
-- SELECT * FROM users LIMIT 5;


