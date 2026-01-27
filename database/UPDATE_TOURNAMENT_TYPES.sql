-- ================================================================
-- SPINERGY - UPDATE TOURNAMENT TYPES
-- Add new tournament format options and group stage support
-- ================================================================

-- Add new columns to leagues table
DO $$ 
BEGIN
  -- Group stage sets (for group matches)
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'leagues' AND column_name = 'group_stage_sets') THEN
    ALTER TABLE leagues ADD COLUMN group_stage_sets INTEGER DEFAULT 1;
    UPDATE leagues SET group_stage_sets = round_robin_sets WHERE group_stage_sets IS NULL;
  END IF;

  -- Quarterfinal sets
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'leagues' AND column_name = 'quarterfinal_sets') THEN
    ALTER TABLE leagues ADD COLUMN quarterfinal_sets INTEGER DEFAULT 3;
  END IF;

  -- Number of groups (for group stage tournaments)
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'leagues' AND column_name = 'num_groups') THEN
    ALTER TABLE leagues ADD COLUMN num_groups INTEGER;
  END IF;

  -- Qualifiers per group
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'leagues' AND column_name = 'qualifiers_per_group') THEN
    ALTER TABLE leagues ADD COLUMN qualifiers_per_group INTEGER DEFAULT 2;
  END IF;

  -- Third place match flag
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'leagues' AND column_name = 'has_third_place_match') THEN
    ALTER TABLE leagues ADD COLUMN has_third_place_match BOOLEAN DEFAULT true;
  END IF;

  -- Quarterfinals flag
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'leagues' AND column_name = 'has_quarterfinals') THEN
    ALTER TABLE leagues ADD COLUMN has_quarterfinals BOOLEAN DEFAULT false;
  END IF;
END $$;

-- Add new columns to league_players table for group support
DO $$ 
BEGIN
  -- Group number
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'league_players' AND column_name = 'group_number') THEN
    ALTER TABLE league_players ADD COLUMN group_number INTEGER;
  END IF;

  -- Group rank
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'league_players' AND column_name = 'group_rank') THEN
    ALTER TABLE league_players ADD COLUMN group_rank INTEGER;
  END IF;

  -- Is eliminated flag
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'league_players' AND column_name = 'is_eliminated') THEN
    ALTER TABLE league_players ADD COLUMN is_eliminated BOOLEAN DEFAULT false;
  END IF;
END $$;

-- Add new columns to league_matches table for group/bracket support
DO $$ 
BEGIN
  -- Group number for match
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'league_matches' AND column_name = 'group_number') THEN
    ALTER TABLE league_matches ADD COLUMN group_number INTEGER;
  END IF;

  -- Bracket position (for double elimination)
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'league_matches' AND column_name = 'bracket_position') THEN
    ALTER TABLE league_matches ADD COLUMN bracket_position TEXT;
  END IF;
END $$;

-- Update match_type check constraint to include new types
-- First drop the old constraint if it exists
DO $$ 
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'league_matches_match_type_check' 
    AND table_name = 'league_matches'
  ) THEN
    ALTER TABLE league_matches DROP CONSTRAINT league_matches_match_type_check;
  END IF;
EXCEPTION
  WHEN undefined_object THEN NULL;
END $$;

-- Add the new constraint with additional match types
ALTER TABLE league_matches 
DROP CONSTRAINT IF EXISTS league_matches_match_type_check;

DO $$ 
BEGIN
  ALTER TABLE league_matches 
  ADD CONSTRAINT league_matches_match_type_check 
  CHECK (match_type IN ('round_robin', 'group_stage', 'quarterfinal', 'semifinal', 'final', 'third_place', 'losers_bracket'));
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- Update league_type check constraint
ALTER TABLE leagues 
DROP CONSTRAINT IF EXISTS leagues_league_type_check;

DO $$ 
BEGIN
  ALTER TABLE leagues 
  ADD CONSTRAINT leagues_league_type_check 
  CHECK (league_type IN ('round_robin', 'round_robin_knockouts', 'group_stage_knockouts', 'single_elimination', 'double_elimination'));
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- Update status check constraint
ALTER TABLE leagues 
DROP CONSTRAINT IF EXISTS leagues_status_check;

DO $$ 
BEGIN
  ALTER TABLE leagues 
  ADD CONSTRAINT leagues_status_check 
  CHECK (status IN ('upcoming', 'registration', 'group_stage', 'round_robin', 'knockouts', 'completed', 'cancelled'));
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- ================================================================
-- SUCCESS MESSAGE
-- ================================================================

DO $$ 
BEGIN 
  RAISE NOTICE '';
  RAISE NOTICE '================================================================';
  RAISE NOTICE '✅ TOURNAMENT TYPES UPDATED!';
  RAISE NOTICE '================================================================';
  RAISE NOTICE 'New Tournament Types:';
  RAISE NOTICE '  - round_robin: Every player plays every other';
  RAISE NOTICE '  - round_robin_knockouts: Round robin then knockout';
  RAISE NOTICE '  - group_stage_knockouts: Groups then knockout';
  RAISE NOTICE '  - single_elimination: Direct knockout';
  RAISE NOTICE '  - double_elimination: Knockout with losers bracket';
  RAISE NOTICE '';
  RAISE NOTICE 'New League Columns:';
  RAISE NOTICE '  - group_stage_sets, quarterfinal_sets';
  RAISE NOTICE '  - num_groups, qualifiers_per_group';
  RAISE NOTICE '  - has_third_place_match, has_quarterfinals';
  RAISE NOTICE '';
  RAISE NOTICE 'New Player Columns:';
  RAISE NOTICE '  - group_number, group_rank, is_eliminated';
  RAISE NOTICE '';
  RAISE NOTICE 'New Match Columns:';
  RAISE NOTICE '  - group_number, bracket_position';
  RAISE NOTICE '================================================================';
END $$;
