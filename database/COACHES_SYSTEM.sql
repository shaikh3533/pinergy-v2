-- ================================================================
-- SPINERGY - COACHES SYSTEM
-- Coach profiles, sessions, media
-- ================================================================

-- ================================================================
-- STEP 1: CREATE COACHES TABLE
-- ================================================================

CREATE TABLE IF NOT EXISTS coaches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  title TEXT, -- e.g., "Head Coach", "Assistant Coach"
  bio TEXT,
  profile_pic TEXT, -- Google Cloud link
  experience_years INTEGER DEFAULT 0,
  specializations TEXT[], -- e.g., ['Spin Techniques', 'Footwork', 'Defense']
  achievements TEXT[], -- e.g., ['National Champion 2020', 'Certified PTT Coach']
  contact_phone TEXT,
  contact_email TEXT,
  is_active BOOLEAN DEFAULT true,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ================================================================
-- STEP 2: CREATE COACH MEDIA TABLE (Photos & Videos)
-- ================================================================

CREATE TABLE IF NOT EXISTS coach_media (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  coach_id UUID REFERENCES coaches(id) ON DELETE CASCADE,
  media_type TEXT NOT NULL CHECK (media_type IN ('photo', 'video')),
  media_url TEXT NOT NULL, -- Google Cloud/Drive link
  thumbnail_url TEXT,
  title TEXT,
  description TEXT,
  event_name TEXT, -- e.g., "National Championship 2024"
  event_date DATE,
  is_featured BOOLEAN DEFAULT false,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ================================================================
-- STEP 3: CREATE COACHING SESSIONS TABLE
-- ================================================================

CREATE TABLE IF NOT EXISTS coaching_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  coach_id UUID REFERENCES coaches(id) ON DELETE CASCADE,
  session_name TEXT NOT NULL, -- e.g., "Beginner Training", "Advanced Spin"
  session_type TEXT NOT NULL CHECK (session_type IN ('one_on_one', 'group')),
  duration_minutes INTEGER NOT NULL, -- 30, 60, 90, 120
  fee_pkr INTEGER NOT NULL, -- Fee in PKR
  max_participants INTEGER DEFAULT 1, -- For group sessions
  day_type TEXT NOT NULL CHECK (day_type IN ('weekday', 'weekend', 'all')),
  -- Specific days available
  available_days TEXT[], -- ['tuesday', 'wednesday', 'thursday'] or ['friday', 'saturday', 'sunday']
  available_times TEXT[], -- ['10:00', '14:00', '18:00']
  description TEXT,
  skill_level TEXT CHECK (skill_level IN ('beginner', 'intermediate', 'advanced', 'all')),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ================================================================
-- STEP 4: CREATE INDEXES
-- ================================================================

CREATE INDEX IF NOT EXISTS idx_coaches_active ON coaches(is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_coaches_order ON coaches(display_order);
CREATE INDEX IF NOT EXISTS idx_coach_media_coach ON coach_media(coach_id);
CREATE INDEX IF NOT EXISTS idx_coach_media_featured ON coach_media(is_featured) WHERE is_featured = true;
CREATE INDEX IF NOT EXISTS idx_coaching_sessions_coach ON coaching_sessions(coach_id);
CREATE INDEX IF NOT EXISTS idx_coaching_sessions_active ON coaching_sessions(is_active) WHERE is_active = true;

-- ================================================================
-- STEP 5: DISABLE RLS (Enable later with proper policies)
-- ================================================================

ALTER TABLE coaches DISABLE ROW LEVEL SECURITY;
ALTER TABLE coach_media DISABLE ROW LEVEL SECURITY;
ALTER TABLE coaching_sessions DISABLE ROW LEVEL SECURITY;

-- ================================================================
-- STEP 6: INSERT SAMPLE DATA (Optional - Remove in production)
-- ================================================================

-- Uncomment to add sample data
/*
INSERT INTO coaches (name, title, bio, experience_years, specializations, achievements) VALUES
(
  'Ahmad Khan',
  'Head Coach',
  'Former national player with 15 years of coaching experience. Specializes in developing young talent and competitive players.',
  15,
  ARRAY['Spin Techniques', 'Footwork', 'Match Strategy'],
  ARRAY['National Champion 2015', 'PTT Certified Level 3', 'Coached 5 National Players']
),
(
  'Sara Ahmed',
  'Assistant Coach',
  'Passionate coach focusing on beginners and intermediate players. Known for patient and effective teaching methods.',
  8,
  ARRAY['Basics', 'Defensive Play', 'Mental Training'],
  ARRAY['Provincial Champion 2019', 'PTT Certified Level 2', 'Youth Development Award']
);
*/

-- ================================================================
-- SUCCESS MESSAGE
-- ================================================================

DO $$ 
BEGIN 
  RAISE NOTICE '';
  RAISE NOTICE '================================================================';
  RAISE NOTICE '✅ COACHES SYSTEM CREATED!';
  RAISE NOTICE '================================================================';
  RAISE NOTICE '📋 Tables created:';
  RAISE NOTICE '   - coaches (profiles)';
  RAISE NOTICE '   - coach_media (photos & videos)';
  RAISE NOTICE '   - coaching_sessions (session types & fees)';
  RAISE NOTICE '';
  RAISE NOTICE '📅 Session Types:';
  RAISE NOTICE '   - one_on_one: Personal training';
  RAISE NOTICE '   - group: Group sessions';
  RAISE NOTICE '';
  RAISE NOTICE '📆 Day Types:';
  RAISE NOTICE '   - weekday: Tue, Wed, Thu';
  RAISE NOTICE '   - weekend: Fri, Sat, Sun';
  RAISE NOTICE '   - all: Any day';
  RAISE NOTICE '================================================================';
END $$;
