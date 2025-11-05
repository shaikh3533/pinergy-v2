-- ================================================================
-- FIX TABLE TYPE CHECK CONSTRAINT
-- ================================================================
-- This fixes the error:
-- "new row for relation \"bookings\" violates check constraint \"bookings_table_type_check\""
-- ================================================================

-- STEP 1: Drop the old check constraint
ALTER TABLE bookings 
DROP CONSTRAINT IF EXISTS bookings_table_type_check;

-- STEP 2: Add new check constraint (accepts lowercase values)
ALTER TABLE bookings 
ADD CONSTRAINT bookings_table_type_check 
CHECK (table_type IN ('table_a', 'table_b'));

-- STEP 3: Verify
DO $$
BEGIN
  RAISE NOTICE '✅ Check constraint updated!';
  RAISE NOTICE '   Allowed values: ''table_a'', ''table_b''';
  RAISE NOTICE '   Frontend now sends correct lowercase values';
END $$;

-- Test query (optional - uncomment to test)
-- INSERT INTO bookings (user_id, table_type, table_id, slot_duration, date, start_time, end_time, day_of_week, price, coaching, whatsapp_sent)
-- VALUES (
--   (SELECT id FROM users LIMIT 1),
--   'table_a',  -- ✅ This will work
--   'table_a',
--   60,
--   CURRENT_DATE,
--   '14:00',
--   '15:00',
--   'Monday',
--   500,
--   false,
--   false
-- );

