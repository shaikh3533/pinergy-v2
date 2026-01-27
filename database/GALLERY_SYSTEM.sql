-- ================================================================
-- SPINERGY - GALLERY SYSTEM
-- Store images and videos from Google Cloud links
-- ================================================================

-- ================================================================
-- STEP 1: CREATE GALLERY TABLE
-- ================================================================

CREATE TABLE IF NOT EXISTS gallery (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  media_type TEXT NOT NULL CHECK (media_type IN ('image', 'video')),
  media_url TEXT NOT NULL, -- Google Cloud link
  thumbnail_url TEXT, -- Optional thumbnail for videos
  category TEXT DEFAULT 'general' CHECK (category IN ('general', 'match', 'event', 'club', 'tournament')),
  is_featured BOOLEAN DEFAULT false,
  display_order INTEGER DEFAULT 0,
  uploaded_by UUID REFERENCES users(id),
  -- Image display options
  object_fit TEXT DEFAULT 'cover' CHECK (object_fit IN ('cover', 'contain', 'fill', 'none')),
  object_position TEXT DEFAULT 'center', -- e.g., 'center', 'top', 'bottom', '50% 30%'
  aspect_ratio TEXT DEFAULT 'square' CHECK (aspect_ratio IN ('square', 'video', 'portrait', 'wide')),
  grid_size TEXT DEFAULT 'medium' CHECK (grid_size IN ('small', 'medium', 'large')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add new columns if table already exists
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'gallery' AND column_name = 'object_fit') THEN
    ALTER TABLE gallery ADD COLUMN object_fit TEXT DEFAULT 'cover' CHECK (object_fit IN ('cover', 'contain', 'fill', 'none'));
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'gallery' AND column_name = 'object_position') THEN
    ALTER TABLE gallery ADD COLUMN object_position TEXT DEFAULT 'center';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'gallery' AND column_name = 'aspect_ratio') THEN
    ALTER TABLE gallery ADD COLUMN aspect_ratio TEXT DEFAULT 'square' CHECK (aspect_ratio IN ('square', 'video', 'portrait', 'wide'));
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'gallery' AND column_name = 'grid_size') THEN
    ALTER TABLE gallery ADD COLUMN grid_size TEXT DEFAULT 'medium' CHECK (grid_size IN ('small', 'medium', 'large'));
  END IF;
END $$;

-- ================================================================
-- STEP 2: CREATE INDEXES
-- ================================================================

CREATE INDEX IF NOT EXISTS idx_gallery_category ON gallery(category);
CREATE INDEX IF NOT EXISTS idx_gallery_media_type ON gallery(media_type);
CREATE INDEX IF NOT EXISTS idx_gallery_featured ON gallery(is_featured) WHERE is_featured = true;
CREATE INDEX IF NOT EXISTS idx_gallery_order ON gallery(display_order);

-- ================================================================
-- STEP 3: DISABLE RLS (Enable later with proper policies)
-- ================================================================

ALTER TABLE gallery DISABLE ROW LEVEL SECURITY;

-- ================================================================
-- STEP 4: UPDATE LEAGUES TABLE - SINGLE DATE ONLY
-- ================================================================

-- Add single 'date' column if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'leagues' AND column_name = 'date') THEN
    ALTER TABLE leagues ADD COLUMN date DATE;
    
    -- Migrate from start_date if exists
    UPDATE leagues SET date = start_date WHERE date IS NULL AND start_date IS NOT NULL;
    
    RAISE NOTICE '✅ Added date column to leagues table';
  ELSE
    RAISE NOTICE 'ℹ️ date column already exists';
  END IF;
END $$;

-- ================================================================
-- SUCCESS MESSAGE
-- ================================================================

DO $$ 
BEGIN 
  RAISE NOTICE '';
  RAISE NOTICE '================================================================';
  RAISE NOTICE '✅ GALLERY SYSTEM CREATED!';
  RAISE NOTICE '================================================================';
  RAISE NOTICE '📸 Table: gallery';
  RAISE NOTICE '   - media_type: image, video';
  RAISE NOTICE '   - category: general, match, event, club, tournament';
  RAISE NOTICE '   - Supports Google Cloud links';
  RAISE NOTICE '';
  RAISE NOTICE '📅 Updated leagues table with single date field';
  RAISE NOTICE '================================================================';
END $$;
