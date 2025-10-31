# 🔧 Fix RLS Error Permanently - Step by Step

This guide will **permanently fix** the "new row violates row-level security policy" error.

---

## 🎯 **The Problem**

When users sign up, Supabase Auth creates an account in `auth.users`, but then our app tries to create a profile in `public.users`. The RLS (Row-Level Security) policies are blocking this.

---

## ✅ **The Solution**

Use a **database trigger** that automatically creates user profiles when they sign up. This trigger runs with elevated permissions and bypasses RLS completely.

---

## 📋 **Fix Steps (5 minutes)**

### **STEP 1: Go to Supabase SQL Editor**

1. Open your browser
2. Go to: https://app.supabase.com/project/mioxecluvalizougrstz
3. Click **"SQL Editor"** in the left sidebar
4. Click **"New Query"**

---

### **STEP 2: Run the Complete Fix Script**

1. Open the file: `supabase-complete-fix.sql` (in your project folder)
2. Copy **ALL** the SQL code
3. Paste it into the Supabase SQL Editor
4. Click **"Run"** (or press Ctrl+Enter)

**Expected output:**
```
✅ SPINERGY RLS policies updated successfully!
📋 Summary:
  - Automatic user profile creation enabled
  - RLS policies configured for users, bookings, suggestions
  - Guest bookings enabled
  - Admin-only actions protected
```

---

### **STEP 3: Disable Email Confirmation**

⚠️ **THIS IS CRITICAL - Don't skip this!**

1. In Supabase, click **"Authentication"** (left sidebar)
2. Click **"Providers"** tab
3. Find **"Email"** section
4. Find the toggle for **"Enable email confirmations"**
5. **Turn it OFF** (disable it)
6. Click **"Save"**

**Why?** By default, Supabase requires email confirmation before users can sign in. Disabling this allows immediate login after signup.

---

### **STEP 4: Test Signup**

1. Open your app: http://localhost:5173
2. **Sign out** if you're logged in
3. Go to **Sign Up** page
4. Use a **NEW** email (not one you've used before)
   - Name: Test User
   - Email: test@example.com
   - Password: test123
   - Confirm: test123
5. Click **"Sign Up"**

**Expected Result:** ✅ Immediately redirected to dashboard

---

### **STEP 5: Verify in Database**

1. Go back to Supabase
2. Click **"Table Editor"** → **"users"**
3. You should see your new user with:
   - ✅ `approved = true`
   - ✅ `role = 'player'`
   - ✅ `name` filled in
   - ✅ All other fields set

---

## 🧪 **Additional Tests**

### **Test 1: Sign In**
1. Sign out
2. Sign in with the account you just created
3. Should work immediately ✅

### **Test 2: Guest Booking**
1. Sign out (or use incognito window)
2. Go to `/book`
3. Make a booking without being logged in
4. Should work ✅

### **Test 3: Multiple Signups**
1. Try signing up with different emails
2. All should work without RLS errors ✅

---

## 🔍 **How It Works Now**

### **Old Flow (Broken):**
```
User Signs Up
    ↓
Supabase creates auth.users entry
    ↓
Frontend tries to insert into public.users ❌
    ↓
RLS blocks the insert ❌
    ↓
Error: "row-level security policy violated" ❌
```

### **New Flow (Fixed):**
```
User Signs Up
    ↓
Supabase creates auth.users entry
    ↓
Database TRIGGER automatically fires ✅
    ↓
Trigger creates public.users entry (bypasses RLS) ✅
    ↓
Frontend fetches the profile ✅
    ↓
User logged in successfully ✅
```

---

## 🛠️ **What the Fix Does**

1. **Creates a Database Trigger**
   - Automatically runs when a user signs up
   - Creates profile in `public.users`
   - Uses `SECURITY DEFINER` to bypass RLS

2. **Updates RLS Policies**
   - Allows everyone to view users (for leaderboard)
   - Allows users to update their own profile
   - Allows admins full access
   - Allows guest bookings

3. **Removes Manual Profile Creation**
   - Frontend no longer tries to insert into `users` table
   - Trigger handles everything automatically

---

## ⚠️ **Troubleshooting**

### **Issue: Still getting RLS error**

**Solution 1:** Make sure you ran the **entire** SQL script
```sql
-- Check if trigger exists
SELECT trigger_name FROM information_schema.triggers 
WHERE event_object_table = 'users' AND trigger_name = 'on_auth_user_created';
```
Should return: `on_auth_user_created`

**Solution 2:** Check if function exists
```sql
-- Check if function exists
SELECT routine_name FROM information_schema.routines 
WHERE routine_name = 'handle_new_user';
```
Should return: `handle_new_user`

**Solution 3:** Try signing up with a **brand new email** (not one used before)

---

### **Issue: Email confirmation still required**

**Solution:** Double-check Authentication → Providers → Email
- Make sure "Enable email confirmations" is **OFF** (unchecked)
- Click Save
- Try signing up again

---

### **Issue: "Cannot coerce result to single JSON object"**

This means the user exists in `auth.users` but not in `public.users`.

**Solution:**
```sql
-- Manually create missing profiles
INSERT INTO public.users (id, name, email, approved, role)
SELECT 
  au.id,
  COALESCE(au.raw_user_meta_data->>'name', 'User'),
  au.email,
  true,
  'player'
FROM auth.users au
LEFT JOIN public.users pu ON au.id = pu.id
WHERE pu.id IS NULL;
```

---

### **Issue: Existing users can't login**

If you have users created before the fix:

**Solution:** Run this to sync them:
```sql
-- Sync existing auth users to public users
INSERT INTO public.users (id, name, email, approved, role)
SELECT 
  id,
  COALESCE(raw_user_meta_data->>'name', email),
  email,
  true,
  'player'
FROM auth.users
ON CONFLICT (id) DO NOTHING;
```

---

## 📊 **Verify Everything Works**

Run these checks in Supabase SQL Editor:

### **Check 1: Trigger exists**
```sql
SELECT EXISTS (
  SELECT 1 FROM information_schema.triggers 
  WHERE trigger_name = 'on_auth_user_created'
);
```
Should return: `true`

### **Check 2: RLS is enabled**
```sql
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' AND tablename = 'users';
```
Should return: `rowsecurity = true`

### **Check 3: Policies exist**
```sql
SELECT policyname FROM pg_policies WHERE tablename = 'users';
```
Should return multiple policy names

---

## ✅ **Success Checklist**

- [ ] Ran `supabase-complete-fix.sql` in SQL Editor
- [ ] Disabled email confirmations in Auth settings
- [ ] Tested signup with new email - works!
- [ ] Tested signin - works!
- [ ] Tested guest booking - works!
- [ ] No more RLS errors!

---

## 🎉 **You're Done!**

Your authentication is now **bulletproof**:
- ✅ No more RLS errors
- ✅ Automatic profile creation
- ✅ Instant signup and login
- ✅ Guest bookings work
- ✅ Admin access protected

If you still face issues after following ALL steps, share:
1. The exact error message
2. Screenshot of the error
3. Which step you're on

The fix is comprehensive and should work 100% if all steps are followed! 🚀

