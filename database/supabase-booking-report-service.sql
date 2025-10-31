-- ============================================
-- SPINERGY - Hourly Booking Report Service
-- Automatically generates booking reports every hour
-- Completely FREE using Supabase pg_cron
-- ============================================

-- Step 1: Enable pg_cron extension (if not already enabled)
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Step 2: Create the booking_reports table to store generated reports
CREATE TABLE IF NOT EXISTS booking_reports (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  report_date DATE NOT NULL,
  report_time TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  total_bookings INTEGER DEFAULT 0,
  total_revenue INTEGER DEFAULT 0,
  next_18h_bookings INTEGER DEFAULT 0,
  next_18h_revenue INTEGER DEFAULT 0,
  bookings_by_table JSONB,
  bookings_by_hour JSONB,
  upcoming_slots JSONB,
  report_summary TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_booking_reports_report_time ON booking_reports(report_time DESC);

-- Step 3: Create function to generate booking report
CREATE OR REPLACE FUNCTION generate_booking_report()
RETURNS UUID AS $$
DECLARE
  report_id UUID;
  current_datetime TIMESTAMP := NOW()::timestamp;
  next_18h TIMESTAMP := (NOW() + INTERVAL '18 hours')::timestamp;
  
  total_bookings_count INTEGER;
  total_revenue_amount INTEGER;
  next_18h_bookings_count INTEGER;
  next_18h_revenue_amount INTEGER;
  
  bookings_by_table_json JSONB;
  bookings_by_hour_json JSONB;
  upcoming_slots_json JSONB;
  summary_text TEXT;
BEGIN
  -- Calculate total bookings today
  SELECT COUNT(*), COALESCE(SUM(price), 0)
  INTO total_bookings_count, total_revenue_amount
  FROM bookings
  WHERE DATE(created_at) = CURRENT_DATE;
  
  -- Calculate bookings in next 18 hours
  SELECT COUNT(*), COALESCE(SUM(price), 0)
  INTO next_18h_bookings_count, next_18h_revenue_amount
  FROM bookings
  WHERE 
    (date::timestamp + start_time) >= current_datetime AND
    (date::timestamp + start_time) <= next_18h;
  
  -- Get bookings grouped by table for next 18 hours
  SELECT jsonb_agg(
    jsonb_build_object(
      'table', table_type,
      'count', count,
      'revenue', revenue
    )
  )
  INTO bookings_by_table_json
  FROM (
    SELECT 
      table_type,
      COUNT(*) as count,
      SUM(price) as revenue
    FROM bookings
    WHERE 
      (date::timestamp + start_time) >= current_datetime AND
      (date::timestamp + start_time) <= next_18h
    GROUP BY table_type
  ) t;
  
  -- Get bookings grouped by hour for next 18 hours
  SELECT jsonb_agg(
    jsonb_build_object(
      'hour', hour_slot,
      'count', count,
      'revenue', revenue
    )
  )
  INTO bookings_by_hour_json
  FROM (
    SELECT 
      TO_CHAR(date::timestamp + start_time, 'HH24:00') as hour_slot,
      COUNT(*) as count,
      SUM(price) as revenue
    FROM bookings
    WHERE 
      (date::timestamp + start_time) >= current_datetime AND
      (date::timestamp + start_time) <= next_18h
    GROUP BY hour_slot
    ORDER BY hour_slot
  ) h;
  
  -- Get upcoming slots details
  SELECT jsonb_agg(slot_data)
  INTO upcoming_slots_json
  FROM (
    SELECT 
      jsonb_build_object(
        'player_name', u.name,
        'player_phone', u.phone,
        'table', b.table_type,
        'date', b.date,
        'time', b.start_time || ' - ' || b.end_time,
        'duration', b.slot_duration,
        'coaching', b.coaching,
        'price', b.price
      ) as slot_data
    FROM bookings b
    LEFT JOIN users u ON b.user_id = u.id
    WHERE 
      (b.date::timestamp + b.start_time) >= current_datetime AND
      (b.date::timestamp + b.start_time) <= next_18h
    ORDER BY b.date, b.start_time
    LIMIT 50
  ) slots;
  
  -- Generate summary text
  summary_text := format(
    E'📊 SPINERGY BOOKING REPORT\n' ||
    E'Generated: %s\n\n' ||
    E'TODAY''S STATS:\n' ||
    E'  • Total bookings: %s\n' ||
    E'  • Total revenue: PKR %s\n\n' ||
    E'NEXT 18 HOURS:\n' ||
    E'  • Upcoming bookings: %s\n' ||
    E'  • Expected revenue: PKR %s\n\n' ||
    E'Available slots for promotion!',
    TO_CHAR(current_datetime, 'DD Mon YYYY HH24:MI'),
    total_bookings_count,
    total_revenue_amount,
    next_18h_bookings_count,
    next_18h_revenue_amount
  );
  
  -- Insert report into booking_reports table
  INSERT INTO booking_reports (
    report_date,
    report_time,
    total_bookings,
    total_revenue,
    next_18h_bookings,
    next_18h_revenue,
    bookings_by_table,
    bookings_by_hour,
    upcoming_slots,
    report_summary
  )
  VALUES (
    CURRENT_DATE,
    current_datetime,
    total_bookings_count,
    total_revenue_amount,
    next_18h_bookings_count,
    next_18h_revenue_amount,
    bookings_by_table_json,
    bookings_by_hour_json,
    upcoming_slots_json,
    summary_text
  )
  RETURNING id INTO report_id;
  
  -- Log the report generation
  RAISE NOTICE 'Booking report generated: % (ID: %)', summary_text, report_id;
  
  RETURN report_id;
END;
$$ LANGUAGE plpgsql;

-- Step 4: Schedule the function to run every hour
-- Remove existing cron job if it exists (safe to fail if doesn't exist)
DO $$
BEGIN
  PERFORM cron.unschedule('spinergy-hourly-booking-report');
EXCEPTION
  WHEN OTHERS THEN
    RAISE NOTICE 'No existing cron job to remove, continuing...';
END $$;

-- Schedule new cron job (runs every hour at minute 0)
SELECT cron.schedule(
  'spinergy-hourly-booking-report',        -- Job name
  '0 * * * *',                             -- Cron expression (every hour)
  'SELECT generate_booking_report();'      -- SQL to run
);

-- Step 5: Create a view for easy admin access to latest reports
CREATE OR REPLACE VIEW latest_booking_reports AS
SELECT 
  id,
  report_date,
  report_time,
  total_bookings,
  total_revenue,
  next_18h_bookings,
  next_18h_revenue,
  bookings_by_table,
  bookings_by_hour,
  report_summary,
  created_at
FROM booking_reports
ORDER BY report_time DESC
LIMIT 24; -- Last 24 hours of reports

-- Step 6: Create function to get current booking status (for admin dashboard)
CREATE OR REPLACE FUNCTION get_current_booking_status()
RETURNS TABLE (
  status TEXT,
  today_bookings INTEGER,
  today_revenue INTEGER,
  next_18h_bookings INTEGER,
  next_18h_revenue INTEGER,
  available_slots_message TEXT
) AS $$
DECLARE
  current_datetime TIMESTAMP := NOW()::timestamp;
  next_18h TIMESTAMP := (NOW() + INTERVAL '18 hours')::timestamp;
  today_bookings_count INTEGER;
  today_revenue_amount INTEGER;
  next_18h_bookings_count INTEGER;
  next_18h_revenue_amount INTEGER;
  available_message TEXT;
BEGIN
  -- Get today's stats
  SELECT COUNT(*), COALESCE(SUM(price), 0)
  INTO today_bookings_count, today_revenue_amount
  FROM bookings
  WHERE DATE(date) = CURRENT_DATE;
  
  -- Get next 18 hours stats
  SELECT COUNT(*), COALESCE(SUM(price), 0)
  INTO next_18h_bookings_count, next_18h_revenue_amount
  FROM bookings
  WHERE 
    (date::timestamp + start_time) >= current_datetime AND
    (date::timestamp + start_time) <= next_18h;
  
  -- Generate available slots message
  available_message := format(
    'Book now! %s slots available in next 18 hours. Total %s bookings today!',
    GREATEST(0, 20 - next_18h_bookings_count), -- Assuming max 20 slots per 18 hours
    today_bookings_count
  );
  
  RETURN QUERY
  SELECT 
    'active'::TEXT,
    today_bookings_count,
    today_revenue_amount,
    next_18h_bookings_count,
    next_18h_revenue_amount,
    available_message;
END;
$$ LANGUAGE plpgsql;

-- Step 7: Grant permissions
GRANT SELECT ON booking_reports TO authenticated;
GRANT SELECT ON latest_booking_reports TO authenticated;
GRANT EXECUTE ON FUNCTION get_current_booking_status() TO authenticated;
GRANT EXECUTE ON FUNCTION generate_booking_report() TO authenticated;

-- Step 8: Run the report generation immediately to test
SELECT generate_booking_report();

-- Success message
DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '========================================';
  RAISE NOTICE '✅ HOURLY BOOKING REPORT SERVICE ACTIVE!';
  RAISE NOTICE '========================================';
  RAISE NOTICE '';
  RAISE NOTICE '📊 What was created:';
  RAISE NOTICE '   • booking_reports table (stores all reports)';
  RAISE NOTICE '   • generate_booking_report() function';
  RAISE NOTICE '   • get_current_booking_status() function';
  RAISE NOTICE '   • latest_booking_reports view';
  RAISE NOTICE '   • Cron job scheduled (every hour)';
  RAISE NOTICE '';
  RAISE NOTICE '⏰ Schedule: Runs every hour at minute 0';
  RAISE NOTICE '   (1:00, 2:00, 3:00, etc.)';
  RAISE NOTICE '';
  RAISE NOTICE '📈 Report includes:';
  RAISE NOTICE '   • Today''s total bookings & revenue';
  RAISE NOTICE '   • Next 18 hours bookings & revenue';
  RAISE NOTICE '   • Bookings by table';
  RAISE NOTICE '   • Bookings by hour';
  RAISE NOTICE '   • List of upcoming slots';
  RAISE NOTICE '';
  RAISE NOTICE '💡 How to use:';
  RAISE NOTICE '   1. View reports in booking_reports table';
  RAISE NOTICE '   2. Or use latest_booking_reports view';
  RAISE NOTICE '   3. Call get_current_booking_status() anytime';
  RAISE NOTICE '';
  RAISE NOTICE '🎉 First report generated and ready!';
  RAISE NOTICE '========================================';
  RAISE NOTICE '';
END $$;

