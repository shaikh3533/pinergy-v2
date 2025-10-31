# 🔧 Authentication Fix Guide

This guide will help you fix the signup/signin issues in SPINERGY.

---

## 🚨 **Issues Being Fixed:**

1. ✅ RLS policy violation during signup
2. ✅ Email confirmation requirement
3. ✅ User not able to login after signup
4. ✅ Auto-approve all new users

---

## 📝 **Step-by-Step Fix**

### **Step 1: Disable Email Confirmation in Supabase**

This is the **MOST IMPORTANT** step!

1. Go to your Supabase Dashboard: https://app.supabase.com/project/mioxecluvalizougrstz
2. Click on **"Authentication"** in the left sidebar
3. Click on **"Providers"** tab
4. Scroll down to **"Email"** section
5. Find **"Enable email confirmations"**
6. **TURN IT OFF** (toggle to disabled)
7. Click **"Save"**

**Why?** By default, Supabase requires users to confirm their email before they can sign in. Disabling this allows immediate login after signup.

---

### **Step 2: Run the Updated SQL Script**

1. Go to your Supabase Dashboard
2. Click on **"SQL Editor"** in the left sidebar
3. Click **"New Query"**
4. Copy and paste the contents of `supabase-auth-fix.sql` into the editor
5. Click **"Run"** (or press Ctrl+Enter)

**What this does:**
- Fixes RLS policies to allow users to create their own profiles
- Grants proper permissions to authenticated and anonymous users
- Allows guest bookings (for non-logged-in users)
- Maintains admin-only access for sensitive operations

---

### **Step 3: Test the Authentication Flow**

#### **Test Signup:**
1. Go to http://localhost:5173/auth/signup
2. Fill in the form:
   - Name: Ahmed Khan
   - Email: ahmed.khan@example.com
   - Password: test123
   - Confirm Password: test123
3. Click **"Sign Up"**
4. You should be **immediately redirected** to the dashboard
5. No email confirmation needed!

#### **Test Signin:**
1. Sign out first
2. Go to http://localhost:5173/auth/signin
3. Enter the same credentials:
   - Email: ahmed.khan@example.com
   - Password: test123
4. Click **"Sign In"**
5. You should be redirected to the dashboard

#### **Test Guest Booking:**
1. Sign out
2. Go to http://localhost:5173/book
3. Fill in the booking form (without being logged in)
4. Select slots and submit
5. Booking should be created successfully

---

## 🔍 **Verify the Fix**

### **Check User in Database:**
1. Go to Supabase Dashboard
2. Click **"Table Editor"** → **"users"**
3. You should see your user with:
   - ✅ `approved = true`
   - ✅ `role = 'player'`
   - ✅ All fields populated correctly

### **Check Authentication:**
1. Go to **"Authentication"** → **"Users"**
2. You should see the user listed
3. Email status should show **"Confirmed"** (because we disabled confirmation)

---

## 🛠️ **Alternative: Quick Fix via Supabase Dashboard**

If the SQL script doesn't work, you can manually fix the RLS policies:

### **Fix Users Table RLS:**
1. Go to **"Table Editor"** → **"users"**
2. Click the **lock icon** (View policies)
3. Delete the old "Anyone can insert users as players" policy
4. Create new INSERT policy:
   - **Policy Name**: "Users can create their own profile"
   - **Allowed Operation**: INSERT
   - **Target Roles**: authenticated
   - **USING expression**: (leave empty)
   - **WITH CHECK expression**: 
     ```sql
     auth.uid()::uuid = id AND role = 'player' AND approved = true
     ```

---

## 🎯 **Expected Behavior After Fix:**

✅ **Signup:**
- User enters name, email, password
- Account created immediately
- No email confirmation required
- User profile created in `users` table
- Automatically redirected to dashboard
- User is logged in

✅ **Signin:**
- User enters email and password
- Immediately logged in
- Redirected to dashboard

✅ **Guest Booking:**
- Non-logged-in users can book slots
- Guest profile created automatically
- WhatsApp notification sent

---

## 🚨 **Troubleshooting:**

### **Issue: Still getting RLS error**
**Solution:**
1. Make sure you ran the SQL script successfully
2. Check if RLS policies were actually updated (Table Editor → users → View policies)
3. Try refreshing your app (hard refresh: Ctrl+Shift+R)

### **Issue: Email confirmation still required**
**Solution:**
1. Double-check Authentication → Providers → Email → "Enable email confirmations" is OFF
2. If you have existing users, go to Authentication → Users → Click user → Click "Send confirmation email" manually

### **Issue: User created but can't login**
**Solution:**
1. Check if user exists in both:
   - Authentication → Users (auth.users)
   - Table Editor → users (public.users)
2. If missing from public.users, manually add them:
   ```sql
   INSERT INTO users (id, name, email, approved, role)
   VALUES (
     'user-auth-uuid-here',
     'User Name',
     'user@email.com',
     true,
     'player'
   );
   ```

### **Issue: "Cannot coerce result to single JSON object"**
**Solution:**
This means the user doesn't exist in the `users` table. After signup, check:
1. Go to Table Editor → users
2. If user is missing, the INSERT failed due to RLS
3. Run the `supabase-auth-fix.sql` script again
4. Try signing up with a new email

---

## 📋 **Checklist:**

- [ ] Email confirmation disabled in Supabase
- [ ] SQL script executed successfully
- [ ] RLS policies updated
- [ ] Test signup with new email
- [ ] Test signin with created account
- [ ] Test guest booking without login
- [ ] Verify user appears in both auth.users and public.users

---

## 🎉 **All Done!**

Once these steps are complete, your authentication should work perfectly:
- ✅ Users can sign up without email verification
- ✅ Users are auto-approved as players
- ✅ Users can login immediately after signup
- ✅ Guest bookings work without authentication
- ✅ All RLS policies properly configured

If you still face issues, check the browser console (F12) for detailed error messages and share them for further debugging.

