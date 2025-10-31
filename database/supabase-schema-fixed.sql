-- SmashZone Table Tennis Club - FIXED Supabase Database Schema
-- This version fixes the infinite recursion issue in RLS policies

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Drop existing tables if they exist (be careful in production!)
DROP TABLE IF EXISTS ads CASCADE;
DROP TABLE IF EXISTS matches CASCADE;
DROP TABLE IF EXISTS bookings CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- Users Table
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  email TEXT UNIQUE,
  phone TEXT,
  profile_pic TEXT,
  rating_points INTEGER DEFAULT 0,
  level TEXT DEFAULT 'Noob' CHECK (level IN ('Noob', 'Level 3', 'Level 2', 'Level 1', 'Top Player')),
  total_hours_played FLOAT DEFAULT 0,
  approved BOOLEAN DEFAULT false,
  role TEXT DEFAULT 'player' CHECK (role IN ('player', 'admin')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Bookings Table
CREATE TABLE bookings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  table_type TEXT NOT NULL CHECK (table_type IN ('Table A (DC-700)', 'Table B (Tibhar)')),
  slot_duration INTEGER NOT NULL CHECK (slot_duration IN (30, 60)),
  coaching BOOLEAN DEFAULT false,
  date DATE NOT NULL,
  time TIME NOT NULL,
  price INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Matches Table
CREATE TABLE matches (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  player1_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  player2_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  winner_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  video_url TEXT,
  played_on DATE NOT NULL DEFAULT CURRENT_DATE,
  rating_points_awarded INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Ads Table
CREATE TABLE ads (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  image TEXT,
  link TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for better query performance
CREATE INDEX idx_bookings_user_id ON bookings(user_id);
CREATE INDEX idx_bookings_date ON bookings(date);
CREATE INDEX idx_matches_player1_id ON matches(player1_id);
CREATE INDEX idx_matches_player2_id ON matches(player2_id);
CREATE INDEX idx_matches_played_on ON matches(played_on);
CREATE INDEX idx_users_rating_points ON users(rating_points DESC);
CREATE INDEX idx_users_approved ON users(approved);
CREATE INDEX idx_users_role ON users(role);

-- Function to increment hours played
CREATE OR REPLACE FUNCTION increment_hours_played(user_id UUID, hours FLOAT)
RETURNS VOID AS $$
BEGIN
  UPDATE users
  SET total_hours_played = total_hours_played + hours
  WHERE id = user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to update user level based on rating points
CREATE OR REPLACE FUNCTION update_user_level()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.rating_points >= 181 THEN
    NEW.level := 'Top Player';
  ELSIF NEW.rating_points >= 121 THEN
    NEW.level := 'Level 1';
  ELSIF NEW.rating_points >= 71 THEN
    NEW.level := 'Level 2';
  ELSIF NEW.rating_points >= 31 THEN
    NEW.level := 'Level 3';
  ELSE
    NEW.level := 'Noob';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically update level when rating points change
CREATE TRIGGER trigger_update_user_level
BEFORE INSERT OR UPDATE OF rating_points ON users
FOR EACH ROW
EXECUTE FUNCTION update_user_level();

-- Helper function to check if user is admin (bypasses RLS)
CREATE OR REPLACE FUNCTION is_admin(user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM users
    WHERE id = user_id AND role = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Row Level Security (RLS) Policies

-- Enable RLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE ads ENABLE ROW LEVEL SECURITY;

-- FIXED Users policies (no more infinite recursion!)
CREATE POLICY "Users can view approved users and themselves"
  ON users FOR SELECT
  USING (approved = true OR id = auth.uid()::uuid);

CREATE POLICY "Users can update their own profile"
  ON users FOR UPDATE
  USING (id = auth.uid()::uuid)
  WITH CHECK (id = auth.uid()::uuid);

CREATE POLICY "Anyone can insert users (for registration)"
  ON users FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Admins can view all users"
  ON users FOR SELECT
  USING (is_admin(auth.uid()::uuid));

CREATE POLICY "Admins can update all users"
  ON users FOR UPDATE
  USING (is_admin(auth.uid()::uuid));

CREATE POLICY "Admins can delete users"
  ON users FOR DELETE
  USING (is_admin(auth.uid()::uuid));

-- Bookings policies
CREATE POLICY "Users can view their own bookings"
  ON bookings FOR SELECT
  USING (user_id = auth.uid()::uuid OR is_admin(auth.uid()::uuid));

CREATE POLICY "Anyone can create bookings"
  ON bookings FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Users can update their own bookings"
  ON bookings FOR UPDATE
  USING (user_id = auth.uid()::uuid OR is_admin(auth.uid()::uuid));

CREATE POLICY "Admins can delete bookings"
  ON bookings FOR DELETE
  USING (is_admin(auth.uid()::uuid));

-- Matches policies
CREATE POLICY "Users can view their own matches"
  ON matches FOR SELECT
  USING (
    player1_id = auth.uid()::uuid OR 
    player2_id = auth.uid()::uuid OR
    is_admin(auth.uid()::uuid)
  );

CREATE POLICY "Admins can manage matches"
  ON matches FOR ALL
  USING (is_admin(auth.uid()::uuid));

-- Ads policies
CREATE POLICY "Anyone can view ads"
  ON ads FOR SELECT
  USING (true);

CREATE POLICY "Admins can create ads"
  ON ads FOR INSERT
  WITH CHECK (is_admin(auth.uid()::uuid));

CREATE POLICY "Admins can update ads"
  ON ads FOR UPDATE
  USING (is_admin(auth.uid()::uuid));

CREATE POLICY "Admins can delete ads"
  ON ads FOR DELETE
  USING (is_admin(auth.uid()::uuid));

-- Seed Data (Sample players and ads)

-- Sample Players
INSERT INTO users (name, email, rating_points, level, total_hours_played, approved, role)
VALUES
  ('Rahul Sharma', 'rahul@example.com', 195, 'Top Player', 50.5, true, 'player'),
  ('Priya Patel', 'priya@example.com', 165, 'Level 1', 42.0, true, 'player'),
  ('Amit Kumar', 'amit@example.com', 145, 'Level 1', 38.5, true, 'player'),
  ('Sneha Reddy', 'sneha@example.com', 95, 'Level 2', 28.0, true, 'player'),
  ('Vikram Singh', 'vikram@example.com', 85, 'Level 2', 25.5, true, 'player'),
  ('Anjali Gupta', 'anjali@example.com', 55, 'Level 3', 18.0, true, 'player'),
  ('Rohan Mehta', 'rohan@example.com', 45, 'Level 3', 15.5, true, 'player'),
  ('Kavya Iyer', 'kavya@example.com', 25, 'Noob', 10.0, true, 'player'),
  ('Arjun Nair', 'arjun@example.com', 18, 'Noob', 8.5, true, 'player'),
  ('Divya Rao', 'divya@example.com', 12, 'Noob', 6.0, true, 'player')
ON CONFLICT (email) DO NOTHING;

-- Sample Ads
INSERT INTO ads (title, description, image, link)
VALUES
  (
    'Grand Opening Special',
    'Join us for our grand opening week! Get 20% off on all bookings. Limited time offer!',
    'https://images.unsplash.com/photo-1534158914592-062992fbe900?q=80&w=800',
    NULL
  ),
  (
    'Monthly Championship',
    'Register now for the SmashZone Monthly Championship. Prize pool: ₹50,000! Open to all levels.',
    'https://images.unsplash.com/photo-1609710228159-0fa9bd7c0827?q=80&w=800',
    NULL
  ),
  (
    'Professional Coaching Available',
    'Learn from the best! Our certified coaches are now available for one-on-one sessions.',
    'https://images.unsplash.com/photo-1626224583764-f87db24ac4ea?q=80&w=800',
    NULL
  )
ON CONFLICT DO NOTHING;

-- IMPORTANT NOTES:
-- 1. After running this SQL, create storage buckets manually in Supabase Dashboard:
--    - profile_pics (public)
--    - match_videos (public)
--
-- 2. To create an admin user after signup:
--    UPDATE users SET role = 'admin', approved = true WHERE email = 'your-email@example.com';
--
-- 3. Enable Email authentication in Supabase Auth settings
--
-- 4. (Optional) Set up Google OAuth in Supabase Authentication settings


