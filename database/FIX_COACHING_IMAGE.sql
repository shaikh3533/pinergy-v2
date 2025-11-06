-- ==========================================
-- FIX PROFESSIONAL COACHING IMAGE
-- Replace badminton image with table tennis
-- ==========================================

-- Update the Professional Coaching ad to use a table tennis coaching image
UPDATE ads 
SET image = 'https://images.unsplash.com/photo-1554068865-24cecd4e34b8?q=80&w=800'
WHERE title = 'Professional Coaching Available';

-- EXPLANATION:
-- Old image (photo-1626224583764-f87db24ac4ea) = Badminton ❌
-- New image (photo-1554068865-24cecd4e34b8) = Table Tennis Paddle & Ball ✅
--
-- This shows table tennis equipment which is perfect for coaching/training services
-- Clear, professional image that represents the sport correctly

-- Verify the change
SELECT id, title, image, description 
FROM ads 
WHERE title = 'Professional Coaching Available';

