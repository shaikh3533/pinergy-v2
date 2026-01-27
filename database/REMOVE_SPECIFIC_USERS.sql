-- ================================================================
-- SPINERGY - REMOVE SPECIFIC FAKE USERS
-- ================================================================

-- Delete users by phone number (these are the fake/test users)
DELETE FROM users WHERE phone IN (
  '3893472393790',
  '38924u93032',
  '23435345343',
  '2992338201',
  '23982374991',
  '923212923987',
  '03478783289',
  '034133932334',
  '042310107346',
  '03000000000',
  '34592345'
);

-- Delete users by email patterns
DELETE FROM users WHERE email IN (
  '8382n@njm.ds',
  'mxjcnk@knj.sxi',
  'sndm@kj.com',
  'hzaxz@gmail.com',
  'hsh@gmail.com'
);

-- Delete users by name that have no proper contact info
DELETE FROM users WHERE name IN ('Imad', 'Azmat', 'nn', 'new', 'Test', 'asdf', 'Ham')
  AND (role IS NULL OR role != 'admin');

-- Verify remaining users
SELECT id, name, email, phone, role FROM users ORDER BY created_at DESC;

DO $$ 
BEGIN 
  RAISE NOTICE '✅ Specific fake users removed successfully!';
END $$;
