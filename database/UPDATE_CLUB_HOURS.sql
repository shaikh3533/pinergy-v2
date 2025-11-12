-- ⏰ UPDATE CLUB HOURS TO 4 PM - 12 AM FOR ALL DAYS
-- Run this in Supabase SQL Editor

-- Update club hours for all days
UPDATE club_settings 
SET setting_value = '{"start": "16:00", "end": "00:00"}'
WHERE setting_key = 'weekday_hours';

UPDATE club_settings 
SET setting_value = '{"start": "16:00", "end": "00:00"}'
WHERE setting_key = 'weekend_hours';

-- Verify the update
SELECT 
  setting_key,
  setting_value,
  description
FROM club_settings
WHERE setting_key IN ('weekday_hours', 'weekend_hours');

-- ✅ Expected result:
-- weekday_hours  | {"start": "16:00", "end": "00:00"} | Monday-Friday operating hours (4 PM - 12 AM)
-- weekend_hours  | {"start": "16:00", "end": "00:00"} | Saturday-Sunday operating hours (4 PM - 12 AM)

