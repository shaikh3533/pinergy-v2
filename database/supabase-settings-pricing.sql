-- =====================================================
-- SPINERGY - SETTINGS & PRICING MANAGEMENT
-- =====================================================
-- This script creates tables and functions for managing:
-- 1. Table names (editable by admin)
-- 2. Pricing (by duration, table type, coaching)
-- 3. Club settings
-- =====================================================

-- Step 0: Create is_admin() helper function (if not exists)
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN (
    SELECT role = 'admin'
    FROM users
    WHERE id = auth.uid()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 1: Create club_settings table
CREATE TABLE IF NOT EXISTS club_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  setting_key TEXT UNIQUE NOT NULL,
  setting_value JSONB NOT NULL,
  description TEXT,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_by UUID REFERENCES auth.users(id)
);

-- Step 2: Create pricing_rules table
CREATE TABLE IF NOT EXISTS pricing_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  table_type TEXT NOT NULL, -- 'table_a' or 'table_b'
  duration_minutes INTEGER NOT NULL, -- 30 or 60
  coaching BOOLEAN NOT NULL,
  price INTEGER NOT NULL, -- in PKR
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(table_type, duration_minutes, coaching)
);

-- Step 3: Create table_names table
CREATE TABLE IF NOT EXISTS table_names (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  table_id TEXT UNIQUE NOT NULL, -- 'table_a' or 'table_b'
  display_name TEXT NOT NULL,
  full_name TEXT NOT NULL,
  specs TEXT,
  image_url TEXT,
  active BOOLEAN DEFAULT true,
  display_order INTEGER DEFAULT 0,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Step 4: Enable RLS
ALTER TABLE club_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE pricing_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE table_names ENABLE ROW LEVEL SECURITY;

-- Step 5: Create RLS Policies

-- club_settings policies
DROP POLICY IF EXISTS "settings_select_all" ON club_settings;
CREATE POLICY "settings_select_all"
  ON club_settings FOR SELECT
  TO authenticated
  USING (true);

DROP POLICY IF EXISTS "settings_admin_all" ON club_settings;
CREATE POLICY "settings_admin_all"
  ON club_settings FOR ALL
  TO authenticated
  USING (is_admin())
  WITH CHECK (is_admin());

-- pricing_rules policies
DROP POLICY IF EXISTS "pricing_select_all" ON pricing_rules;
CREATE POLICY "pricing_select_all"
  ON pricing_rules FOR SELECT
  TO public
  USING (active = true);

DROP POLICY IF EXISTS "pricing_admin_all" ON pricing_rules;
CREATE POLICY "pricing_admin_all"
  ON pricing_rules FOR ALL
  TO authenticated
  USING (is_admin())
  WITH CHECK (is_admin());

-- table_names policies
DROP POLICY IF EXISTS "tables_select_all" ON table_names;
CREATE POLICY "tables_select_all"
  ON table_names FOR SELECT
  TO public
  USING (active = true);

DROP POLICY IF EXISTS "tables_admin_all" ON table_names;
CREATE POLICY "tables_admin_all"
  ON table_names FOR ALL
  TO authenticated
  USING (is_admin())
  WITH CHECK (is_admin());

-- Step 6: Insert default table names (CORRECTED: Tibhar = Table A, DC-700 = Table B)
INSERT INTO table_names (table_id, display_name, full_name, specs, display_order) VALUES
  ('table_a', 'Table A', 'Tibhar', 'Tibhar - 25mm ITTF approved professional table', 1),
  ('table_b', 'Table B', 'DC-700', 'Double Circle DC-700 - 25mm professional tournament table', 2)
ON CONFLICT (table_id) DO UPDATE SET
  display_name = EXCLUDED.display_name,
  full_name = EXCLUDED.full_name,
  specs = EXCLUDED.specs;

-- Step 7: Insert default pricing rules (in PKR)
-- Updated pricing: Table A (1000/hr, 500/30min), Table B (800/hr, 400/30min)
INSERT INTO pricing_rules (table_type, duration_minutes, coaching, price) VALUES
  -- Table A (Tibhar) - Half Hour
  ('table_a', 30, false, 500),
  ('table_a', 30, true, 700),  -- 500 + 200 coaching
  -- Table A (Tibhar) - Full Hour
  ('table_a', 60, false, 1000),
  ('table_a', 60, true, 1200),  -- 1000 + 200 coaching
  -- Table B (DC-700) - Half Hour
  ('table_b', 30, false, 400),
  ('table_b', 30, true, 600),  -- 400 + 200 coaching
  -- Table B (DC-700) - Full Hour
  ('table_b', 60, false, 800),
  ('table_b', 60, true, 1000)  -- 800 + 200 coaching
ON CONFLICT (table_type, duration_minutes, coaching) DO UPDATE SET
  price = EXCLUDED.price;

-- Step 8: Insert default club settings
INSERT INTO club_settings (setting_key, setting_value, description) VALUES
  ('coaching_base_price', '"200"', 'Base price for coaching (added to table price)'),
  ('weekday_hours', '{"start": "16:00", "end": "00:00"}', 'Monday-Friday operating hours (4 PM - 12 AM)'),
  ('weekend_hours', '{"start": "16:00", "end": "00:00"}', 'Saturday-Sunday operating hours (4 PM - 12 AM)'),
  ('booking_window_days', '"7"', 'Maximum days in advance for booking'),
  ('admin_phone', '"03259898900"', 'Admin contact number'),
  ('whatsapp_group_id', '"JCxLLXGZMSrBjoMSmpBq8m"', 'WhatsApp group for notifications')
ON CONFLICT (setting_key) DO NOTHING;

-- Step 9: Create function to get pricing
CREATE OR REPLACE FUNCTION get_price(
  p_table_type TEXT,
  p_duration_minutes INTEGER,
  p_coaching BOOLEAN
)
RETURNS INTEGER AS $$
DECLARE
  v_price INTEGER;
BEGIN
  SELECT price INTO v_price
  FROM pricing_rules
  WHERE 
    table_type = p_table_type
    AND duration_minutes = p_duration_minutes
    AND coaching = p_coaching
    AND active = true;
  
  RETURN COALESCE(v_price, 0);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 10: Create function to get all active pricing
CREATE OR REPLACE FUNCTION get_all_pricing()
RETURNS TABLE (
  table_type TEXT,
  table_display_name TEXT,
  duration_minutes INTEGER,
  coaching BOOLEAN,
  price INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    pr.table_type,
    tn.display_name,
    pr.duration_minutes,
    pr.coaching,
    pr.price
  FROM pricing_rules pr
  LEFT JOIN table_names tn ON pr.table_type = tn.table_id
  WHERE pr.active = true
  ORDER BY tn.display_order, pr.duration_minutes, pr.coaching;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 11: Create function to update pricing
CREATE OR REPLACE FUNCTION update_pricing(
  p_table_type TEXT,
  p_duration_minutes INTEGER,
  p_coaching BOOLEAN,
  p_new_price INTEGER
)
RETURNS BOOLEAN AS $$
BEGIN
  UPDATE pricing_rules
  SET 
    price = p_new_price,
    updated_at = NOW()
  WHERE 
    table_type = p_table_type
    AND duration_minutes = p_duration_minutes
    AND coaching = p_coaching;
  
  RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 12: Create function to update table name
CREATE OR REPLACE FUNCTION update_table_name(
  p_table_id TEXT,
  p_display_name TEXT,
  p_full_name TEXT,
  p_specs TEXT DEFAULT NULL
)
RETURNS BOOLEAN AS $$
BEGIN
  UPDATE table_names
  SET 
    display_name = p_display_name,
    full_name = p_full_name,
    specs = COALESCE(p_specs, specs),
    updated_at = NOW()
  WHERE table_id = p_table_id;
  
  RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 13: Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_pricing_rules_lookup ON pricing_rules(table_type, duration_minutes, coaching) WHERE active = true;
CREATE INDEX IF NOT EXISTS idx_table_names_lookup ON table_names(table_id) WHERE active = true;
CREATE INDEX IF NOT EXISTS idx_club_settings_key ON club_settings(setting_key);

-- Step 14: Create view for easy pricing lookup
CREATE OR REPLACE VIEW pricing_matrix AS
SELECT 
  tn.table_id,
  tn.display_name as table_name,
  tn.full_name as table_full_name,
  pr.duration_minutes,
  pr.coaching,
  pr.price,
  CASE 
    WHEN pr.duration_minutes = 30 THEN 'Half Hour'
    WHEN pr.duration_minutes = 60 THEN 'Full Hour'
    ELSE pr.duration_minutes || ' min'
  END as duration_label,
  CASE 
    WHEN pr.coaching THEN 'With Coaching'
    ELSE 'Without Coaching'
  END as coaching_label
FROM pricing_rules pr
JOIN table_names tn ON pr.table_type = tn.table_id
WHERE pr.active = true AND tn.active = true
ORDER BY tn.display_order, pr.duration_minutes, pr.coaching;

-- Step 15: Grant necessary permissions
GRANT SELECT ON pricing_matrix TO authenticated, anon;

-- =====================================================
-- MIGRATION: Update existing bookings table structure
-- =====================================================

-- Add table_id column to bookings if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'bookings' AND column_name = 'table_id') THEN
    ALTER TABLE bookings ADD COLUMN table_id TEXT;
    
    -- Migrate existing data (map old table_type to new table_id)
    UPDATE bookings SET table_id = CASE 
      WHEN table_type LIKE '%DC-700%' OR table_type LIKE '%DC 700%' THEN 'table_b'
      WHEN table_type LIKE '%Tibhar%' THEN 'table_a'
      ELSE 'table_a' -- default
    END
    WHERE table_id IS NULL;
  END IF;
END $$;

-- =====================================================
-- VERIFICATION QUERIES
-- =====================================================

-- View all tables and their names
-- SELECT * FROM table_names ORDER BY display_order;

-- View all pricing rules
-- SELECT * FROM pricing_matrix;

-- Test pricing function
-- SELECT get_price('table_a', 60, true); -- Should return Tibhar 1 hour with coaching price

-- View all settings
-- SELECT * FROM club_settings;

-- =====================================================
-- SUCCESS MESSAGE
-- =====================================================

DO $$ 
BEGIN 
  RAISE NOTICE '✅ SPINERGY PRICING & SETTINGS CONFIGURED!';
  RAISE NOTICE '📊 Tables Created: club_settings, pricing_rules, table_names';
  RAISE NOTICE '🏓 Table A = Tibhar (Premium)';
  RAISE NOTICE '🏓 Table B = DC-700 (Standard)';
  RAISE NOTICE '💰 Default pricing loaded (in PKR)';
  RAISE NOTICE '⚙️ Admin can now manage pricing and table names from dashboard';
  RAISE NOTICE '🔐 RLS policies enabled - Admin access only for updates';
END $$;

