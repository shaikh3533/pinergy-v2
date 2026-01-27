-- ================================================================
-- SPINERGY - ADD BOOKING SOURCE COLUMN
-- This migration adds the booking_source column to track
-- how bookings were received (online, whatsapp, phone, walkin)
-- ================================================================

-- Step 1: Add booking_source column if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'bookings' AND column_name = 'booking_source') THEN
    ALTER TABLE bookings ADD COLUMN booking_source TEXT DEFAULT 'online';
    
    -- Add check constraint for valid values
    ALTER TABLE bookings ADD CONSTRAINT valid_booking_source 
      CHECK (booking_source IN ('online', 'whatsapp', 'phone', 'walkin'));
    
    RAISE NOTICE '✅ Added booking_source column to bookings table';
  ELSE
    RAISE NOTICE 'ℹ️ booking_source column already exists';
  END IF;
END $$;

-- Step 2: Add whatsapp_sent column if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'bookings' AND column_name = 'whatsapp_sent') THEN
    ALTER TABLE bookings ADD COLUMN whatsapp_sent BOOLEAN DEFAULT false;
    RAISE NOTICE '✅ Added whatsapp_sent column to bookings table';
  ELSE
    RAISE NOTICE 'ℹ️ whatsapp_sent column already exists';
  END IF;
END $$;

-- Step 3: Add start_time column if it doesn't exist (replacing time column)
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'bookings' AND column_name = 'start_time') THEN
    -- If old 'time' column exists, rename it to start_time
    IF EXISTS (SELECT 1 FROM information_schema.columns 
               WHERE table_name = 'bookings' AND column_name = 'time') THEN
      ALTER TABLE bookings RENAME COLUMN time TO start_time;
      RAISE NOTICE '✅ Renamed time column to start_time';
    ELSE
      ALTER TABLE bookings ADD COLUMN start_time TEXT NOT NULL DEFAULT '16:00';
      RAISE NOTICE '✅ Added start_time column to bookings table';
    END IF;
  ELSE
    RAISE NOTICE 'ℹ️ start_time column already exists';
  END IF;
END $$;

-- Step 4: Add end_time column if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'bookings' AND column_name = 'end_time') THEN
    ALTER TABLE bookings ADD COLUMN end_time TEXT NOT NULL DEFAULT '17:00';
    RAISE NOTICE '✅ Added end_time column to bookings table';
  ELSE
    RAISE NOTICE 'ℹ️ end_time column already exists';
  END IF;
END $$;

-- Step 5: Add day_of_week column if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'bookings' AND column_name = 'day_of_week') THEN
    ALTER TABLE bookings ADD COLUMN day_of_week TEXT;
    RAISE NOTICE '✅ Added day_of_week column to bookings table';
  ELSE
    RAISE NOTICE 'ℹ️ day_of_week column already exists';
  END IF;
END $$;

-- Step 6: Add table_id column if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'bookings' AND column_name = 'table_id') THEN
    ALTER TABLE bookings ADD COLUMN table_id TEXT;
    
    -- Migrate existing data if table_type column has values
    UPDATE bookings SET table_id = CASE 
      WHEN table_type LIKE '%DC-700%' OR table_type LIKE '%DC 700%' OR table_type = 'table_b' THEN 'table_b'
      WHEN table_type LIKE '%Tibhar%' OR table_type = 'table_a' THEN 'table_a'
      WHEN table_type = 'Table A' THEN 'table_a'
      WHEN table_type = 'Table B' THEN 'table_b'
      ELSE 'table_a'
    END
    WHERE table_id IS NULL;
    
    RAISE NOTICE '✅ Added table_id column and migrated data';
  ELSE
    RAISE NOTICE 'ℹ️ table_id column already exists';
  END IF;
END $$;

-- Step 7: Create index for faster booking queries
CREATE INDEX IF NOT EXISTS idx_bookings_date_table ON bookings(date, table_id);
CREATE INDEX IF NOT EXISTS idx_bookings_source ON bookings(booking_source);

-- Step 8: Update existing bookings with default source
UPDATE bookings SET booking_source = 'online' WHERE booking_source IS NULL;

-- ================================================================
-- VERIFICATION
-- ================================================================

-- Show bookings table structure
SELECT 
  column_name, 
  data_type, 
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_name = 'bookings'
ORDER BY ordinal_position;

-- ================================================================
-- SUCCESS MESSAGE
-- ================================================================

DO $$ 
BEGIN 
  RAISE NOTICE '';
  RAISE NOTICE '================================================================';
  RAISE NOTICE '✅ BOOKING SOURCE MIGRATION COMPLETE!';
  RAISE NOTICE '================================================================';
  RAISE NOTICE '📊 Columns added/verified:';
  RAISE NOTICE '   - booking_source (online, whatsapp, phone, walkin)';
  RAISE NOTICE '   - whatsapp_sent (boolean)';
  RAISE NOTICE '   - start_time, end_time, day_of_week';
  RAISE NOTICE '   - table_id (table_a, table_b)';
  RAISE NOTICE '';
  RAISE NOTICE '🎯 Admin can now add bookings with source tracking';
  RAISE NOTICE '📱 WhatsApp/Phone bookings will be properly tracked';
  RAISE NOTICE '================================================================';
END $$;
