-- ================================================================
-- 🎯 SPINERGY - SIMPLE FIX (No Constraint Drops)
-- Run this if the full script gave constraint errors
-- ================================================================

-- ================================================================
-- STEP 1: DISABLE RLS ON ALL TABLES
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

-- ================================================================
-- STEP 2: UPDATE PRICING RULES
-- ================================================================

-- Table A (Tibhar): 500 PKR/30min, 1000 PKR/hour
-- Table B (DC-700): 400 PKR/30min, 800 PKR/hour

UPDATE pricing_rules SET price = 500 
WHERE table_type = 'table_a' AND duration_minutes = 30 AND coaching = false;

UPDATE pricing_rules SET price = 700 
WHERE table_type = 'table_a' AND duration_minutes = 30 AND coaching = true;

UPDATE pricing_rules SET price = 1000 
WHERE table_type = 'table_a' AND duration_minutes = 60 AND coaching = false;

UPDATE pricing_rules SET price = 1200 
WHERE table_type = 'table_a' AND duration_minutes = 60 AND coaching = true;

UPDATE pricing_rules SET price = 400 
WHERE table_type = 'table_b' AND duration_minutes = 30 AND coaching = false;

UPDATE pricing_rules SET price = 600 
WHERE table_type = 'table_b' AND duration_minutes = 30 AND coaching = true;

UPDATE pricing_rules SET price = 800 
WHERE table_type = 'table_b' AND duration_minutes = 60 AND coaching = false;

UPDATE pricing_rules SET price = 1000 
WHERE table_type = 'table_b' AND duration_minutes = 60 AND coaching = true;

-- ================================================================
-- STEP 3: UPDATE ADMIN PHONE
-- ================================================================

UPDATE club_settings 
SET setting_value = '"03413393533"'
WHERE setting_key = 'admin_phone';

-- ================================================================
-- VERIFICATION
-- ================================================================

-- Check RLS is disabled
SELECT 
  tablename,
  CASE WHEN rowsecurity THEN '❌ ENABLED' ELSE '✅ DISABLED' END as status
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename IN ('users', 'bookings', 'pricing_rules')
ORDER BY tablename;

-- Check pricing
SELECT 
  table_type,
  duration_minutes as "duration (min)",
  coaching,
  price as "price (PKR)"
FROM pricing_rules
WHERE active = true AND coaching = false
ORDER BY table_type, duration_minutes;

-- ================================================================
-- SUCCESS!
-- ================================================================
-- ✅ RLS disabled - Bookings will work
-- ✅ Pricing updated - Correct prices
-- ✅ Admin phone set - WhatsApp ready
-- ================================================================

