-- Fix for error 23514:
-- new row for relation "leagues" violates check constraint "leagues_league_type_check"
--
-- Run this in Supabase Dashboard → SQL Editor.

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

