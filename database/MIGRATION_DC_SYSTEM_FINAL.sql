-- ================================================================
-- FINAL SPINERGERY SPECIALS & GLOBAL SETTINGS
-- ================================================================

-- 1. Create club_settings for persistent homepage configs
CREATE TABLE IF NOT EXISTS club_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    setting_key TEXT UNIQUE NOT NULL, -- e.g. 'live_stream'
    setting_value JSONB NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Add some sanity checks for Davis Cup tables
ALTER TABLE dc_teams ADD COLUMN IF NOT EXISTS logo_url TEXT;
ALTER TABLE dc_teams ADD COLUMN IF NOT EXISTS theme_color TEXT;

-- 3. Policy for club_settings (Admin only write)
-- Assuming common RLS patterns from the project
ALTER TABLE club_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public read access to club_settings" ON club_settings;
CREATE POLICY "Public read access to club_settings"
  ON club_settings FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Admin full access to club_settings" ON club_settings;
CREATE POLICY "Admin full access to club_settings"
  ON club_settings
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'admin'
    )
  );

-- 4. Helper function for DC Team Stats
CREATE OR REPLACE FUNCTION increment_dc_team_stats(
    p_team_id UUID,
    p_won BOOLEAN,
    p_rubbers_won INTEGER,
    p_rubbers_lost INTEGER
) RETURNS VOID AS $$
BEGIN
    UPDATE dc_teams
    SET 
        wins = wins + (CASE WHEN p_won THEN 1 ELSE 0 END),
        losses = losses + (CASE WHEN NOT p_won THEN 1 ELSE 0 END),
        rubbers_won = rubbers_won + p_rubbers_won,
        rubbers_lost = rubbers_lost + p_rubbers_lost,
        updated_at = NOW()
    WHERE id = p_team_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
