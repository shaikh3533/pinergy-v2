-- ================================================================
-- SPINERGY - CLEANUP FAKE USERS
-- Remove users without proper emails/phones
-- Keep admins and users with valid contact info
-- ================================================================

-- ⚠️ WARNING: This will delete users! Review carefully before running.

-- ================================================================
-- STEP 1: VIEW USERS TO BE DELETED (Preview)
-- ================================================================

-- Preview fake users that will be deleted
SELECT id, name, email, phone, role, created_at
FROM users
WHERE 
  -- Not an admin
  (role IS NULL OR role != 'admin')
  AND (
    -- No email AND no phone
    ((email IS NULL OR email = '') AND (phone IS NULL OR phone = ''))
    -- OR email is example.com domain
    OR email LIKE '%@example.com'
    OR email LIKE '%@test.com'
    OR email LIKE '%@fake.com'
    -- OR email doesn't look valid (no @ or no domain)
    OR (email IS NOT NULL AND email != '' AND email NOT LIKE '%@%.%')
  )
  AND (
    -- Phone doesn't start with valid Pakistani numbers
    phone IS NULL 
    OR phone = ''
    OR (phone NOT LIKE '+923%' AND phone NOT LIKE '03%' AND phone NOT LIKE '923%')
  )
ORDER BY created_at DESC;

-- ================================================================
-- STEP 2: DELETE FAKE USERS
-- ================================================================

-- First delete related records to avoid foreign key issues

-- Delete bookings for fake users
DELETE FROM bookings 
WHERE user_id IN (
  SELECT id FROM users
  WHERE 
    (role IS NULL OR role != 'admin')
    AND (
      ((email IS NULL OR email = '') AND (phone IS NULL OR phone = ''))
      OR email LIKE '%@example.com'
      OR email LIKE '%@test.com'
      OR email LIKE '%@fake.com'
      OR (email IS NOT NULL AND email != '' AND email NOT LIKE '%@%.%')
    )
    AND (
      phone IS NULL 
      OR phone = ''
      OR (phone NOT LIKE '+923%' AND phone NOT LIKE '03%' AND phone NOT LIKE '923%')
    )
);

-- Delete league_players for fake users
DELETE FROM league_players 
WHERE player_id IN (
  SELECT id FROM users
  WHERE 
    (role IS NULL OR role != 'admin')
    AND (
      ((email IS NULL OR email = '') AND (phone IS NULL OR phone = ''))
      OR email LIKE '%@example.com'
      OR email LIKE '%@test.com'
      OR email LIKE '%@fake.com'
      OR (email IS NOT NULL AND email != '' AND email NOT LIKE '%@%.%')
    )
    AND (
      phone IS NULL 
      OR phone = ''
      OR (phone NOT LIKE '+923%' AND phone NOT LIKE '03%' AND phone NOT LIKE '923%')
    )
);

-- Delete league_matches for fake users
DELETE FROM league_matches 
WHERE player1_id IN (
  SELECT id FROM users WHERE (role IS NULL OR role != 'admin') AND (((email IS NULL OR email = '') AND (phone IS NULL OR phone = '')) OR email LIKE '%@example.com')
) OR player2_id IN (
  SELECT id FROM users WHERE (role IS NULL OR role != 'admin') AND (((email IS NULL OR email = '') AND (phone IS NULL OR phone = '')) OR email LIKE '%@example.com')
);

-- Delete player_tournament_stats for fake users
DELETE FROM player_tournament_stats 
WHERE player_id IN (
  SELECT id FROM users
  WHERE 
    (role IS NULL OR role != 'admin')
    AND (
      ((email IS NULL OR email = '') AND (phone IS NULL OR phone = ''))
      OR email LIKE '%@example.com'
      OR email LIKE '%@test.com'
      OR email LIKE '%@fake.com'
    )
    AND (
      phone IS NULL 
      OR phone = ''
      OR (phone NOT LIKE '+923%' AND phone NOT LIKE '03%' AND phone NOT LIKE '923%')
    )
);

-- Delete head to head records for fake users
DELETE FROM player_head_to_head 
WHERE player1_id IN (
  SELECT id FROM users WHERE (role IS NULL OR role != 'admin') AND email LIKE '%@example.com'
) OR player2_id IN (
  SELECT id FROM users WHERE (role IS NULL OR role != 'admin') AND email LIKE '%@example.com'
);

-- Finally delete the fake users
DELETE FROM users
WHERE 
  (role IS NULL OR role != 'admin')
  AND (
    ((email IS NULL OR email = '') AND (phone IS NULL OR phone = ''))
    OR email LIKE '%@example.com'
    OR email LIKE '%@test.com'
    OR email LIKE '%@fake.com'
    OR (email IS NOT NULL AND email != '' AND email NOT LIKE '%@%.%')
  )
  AND (
    phone IS NULL 
    OR phone = ''
    OR (phone NOT LIKE '+923%' AND phone NOT LIKE '03%' AND phone NOT LIKE '923%')
  );

-- ================================================================
-- STEP 3: VERIFY REMAINING USERS
-- ================================================================

SELECT id, name, email, phone, role, created_at
FROM users
ORDER BY 
  CASE WHEN role = 'admin' THEN 0 ELSE 1 END,
  created_at DESC;

-- ================================================================
-- SUCCESS MESSAGE
-- ================================================================

DO $$ 
BEGIN 
  RAISE NOTICE '';
  RAISE NOTICE '================================================================';
  RAISE NOTICE '✅ FAKE USERS CLEANUP COMPLETE!';
  RAISE NOTICE '================================================================';
  RAISE NOTICE 'Removed users with:';
  RAISE NOTICE '  - @example.com, @test.com, @fake.com emails';
  RAISE NOTICE '  - No email AND no phone';
  RAISE NOTICE '  - Invalid phone numbers (not starting with +923 or 03)';
  RAISE NOTICE '';
  RAISE NOTICE 'Kept users with:';
  RAISE NOTICE '  - Admin role';
  RAISE NOTICE '  - Valid email (gmail.com, yahoo.com, etc.)';
  RAISE NOTICE '  - Valid Pakistani phone (+923xxx or 03xxx)';
  RAISE NOTICE '================================================================';
END $$;
