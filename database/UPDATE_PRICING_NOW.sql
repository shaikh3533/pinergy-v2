-- ⚡ QUICK PRICING UPDATE
-- Run this in Supabase SQL Editor to update pricing immediately

-- Updated pricing: 
-- Table A: 1000 PKR/hour, 500 PKR/30min
-- Table B: 800 PKR/hour, 400 PKR/30min

UPDATE pricing_rules SET price = 500 WHERE table_type = 'table_a' AND duration_minutes = 30 AND coaching = false;
UPDATE pricing_rules SET price = 700 WHERE table_type = 'table_a' AND duration_minutes = 30 AND coaching = true;
UPDATE pricing_rules SET price = 1000 WHERE table_type = 'table_a' AND duration_minutes = 60 AND coaching = false;
UPDATE pricing_rules SET price = 1200 WHERE table_type = 'table_a' AND duration_minutes = 60 AND coaching = true;
UPDATE pricing_rules SET price = 400 WHERE table_type = 'table_b' AND duration_minutes = 30 AND coaching = false;
UPDATE pricing_rules SET price = 600 WHERE table_type = 'table_b' AND duration_minutes = 30 AND coaching = true;
UPDATE pricing_rules SET price = 800 WHERE table_type = 'table_b' AND duration_minutes = 60 AND coaching = false;
UPDATE pricing_rules SET price = 1000 WHERE table_type = 'table_b' AND duration_minutes = 60 AND coaching = true;

-- Verify the updates
SELECT table_type, duration_minutes, coaching, price 
FROM pricing_rules 
ORDER BY table_type, duration_minutes, coaching;

