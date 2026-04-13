-- Run this in Supabase Dashboard → SQL Editor.
-- This migration adds the missing columns required for the advanced tournament features (Group Stages & Knockouts).

-- Add missing columns to leagues
ALTER TABLE leagues
ADD COLUMN IF NOT EXISTS num_groups INTEGER DEFAULT 2,
ADD COLUMN IF NOT EXISTS qualifiers_per_group INTEGER DEFAULT 2,
ADD COLUMN IF NOT EXISTS has_third_place_match BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS has_quarterfinals BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS group_stage_sets INTEGER DEFAULT 1,
ADD COLUMN IF NOT EXISTS quarterfinal_sets INTEGER DEFAULT 3;

-- Add missing column to league_players
ALTER TABLE league_players
ADD COLUMN IF NOT EXISTS group_number INTEGER;

-- Add missing columns to league_matches
ALTER TABLE league_matches
ADD COLUMN IF NOT EXISTS group_number INTEGER,
ADD COLUMN IF NOT EXISTS bracket_position TEXT;

-- Also update the check constraint for match_type to include group_stage and quarterfinal
ALTER TABLE league_matches DROP CONSTRAINT IF EXISTS league_matches_match_type_check;

DO $$
BEGIN
  ALTER TABLE league_matches
  ADD CONSTRAINT league_matches_match_type_check
  CHECK (match_type IN ('group_stage', 'round_robin', 'quarterfinal', 'semifinal', 'final', 'third_place'));
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;
