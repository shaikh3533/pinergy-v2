-- ================================================================
-- FIX EXISTING DATA + TABLE TYPE CONSTRAINT
-- ================================================================
-- This fixes existing bookings with wrong table_type values
-- Then adds the correct constraint
-- ================================================================

-- STEP 1: Drop the old constraint first (so we can update data)
ALTER TABLE bookings 
DROP CONSTRAINT IF EXISTS bookings_table_type_check;

-- STEP 2: Fix existing data - Convert "Table A" to "table_a"
UPDATE bookings 
SET table_type = 'table_a' 
WHERE table_type ILIKE '%table%a%' OR table_type = 'Table A' OR table_type = 'TABLE_A';

-- STEP 3: Fix existing data - Convert "Table B" to "table_b"
UPDATE bookings 
SET table_type = 'table_b' 
WHERE table_type ILIKE '%table%b%' OR table_type = 'Table B' OR table_type = 'TABLE_B';

-- STEP 4: Now add the new constraint (after data is fixed)
ALTER TABLE bookings 
ADD CONSTRAINT bookings_table_type_check 
CHECK (table_type IN ('table_a', 'table_b'));

-- STEP 5: Verify
DO $$
DECLARE
  table_a_count INTEGER;
  table_b_count INTEGER;
  invalid_count INTEGER;
BEGIN
  -- Count valid bookings
  SELECT COUNT(*) INTO table_a_count FROM bookings WHERE table_type = 'table_a';
  SELECT COUNT(*) INTO table_b_count FROM bookings WHERE table_type = 'table_b';
  SELECT COUNT(*) INTO invalid_count FROM bookings WHERE table_type NOT IN ('table_a', 'table_b');
  
  RAISE NOTICE '';
  RAISE NOTICE '================================================';
  RAISE NOTICE '✅ DATA FIXED + CONSTRAINT ADDED!';
  RAISE NOTICE '================================================';
  RAISE NOTICE '';
  RAISE NOTICE '📊 Booking Statistics:';
  RAISE NOTICE '  - Table A bookings: %', table_a_count;
  RAISE NOTICE '  - Table B bookings: %', table_b_count;
  RAISE NOTICE '  - Invalid bookings: % (should be 0)', invalid_count;
  RAISE NOTICE '';
  
  IF invalid_count > 0 THEN
    RAISE NOTICE '⚠️  WARNING: Still have invalid bookings!';
    RAISE NOTICE '   Run this query to see them:';
    RAISE NOTICE '   SELECT * FROM bookings WHERE table_type NOT IN (''table_a'', ''table_b'');';
  ELSE
    RAISE NOTICE '✅ All bookings have correct table_type values!';
  END IF;
  
  RAISE NOTICE '';
  RAISE NOTICE '✅ Constraint added: table_type IN (''table_a'', ''table_b'')';
  RAISE NOTICE '================================================';
END $$;

-- Optional: See all bookings with their table types
-- SELECT id, table_type, table_id, date, start_time, end_time 
-- FROM bookings 
-- ORDER BY created_at DESC 
-- LIMIT 10;

