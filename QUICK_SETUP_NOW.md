# 🚀 QUICK SETUP - RUN THIS NOW!

## ❌ ERROR YOU'RE SEEING:
```
Could not find the table 'public.pricing_rules' in the schema cache
Could not find the table 'public.table_names' in the schema cache
```

## ✅ SOLUTION: Run SQL Scripts in Order

---

## 📋 **STEP-BY-STEP (10 MINUTES):**

### **Step 1: Run Main Fix Script (2 min)**
```
1. Go to: https://app.supabase.com/project/mioxecluvalizougrstz/sql/new
2. Copy ENTIRE content from: supabase-final-fix.sql
3. Click "Run"
4. Wait for success messages
```

**What it does:**
- ✅ Fixes RLS policies
- ✅ Creates `is_admin()` function
- ✅ Creates `users` table structure
- ✅ Sets up authentication

---

### **Step 2: Run Pricing & Settings Script (2 min)** ⭐ IMPORTANT
```
1. Stay in Supabase SQL Editor
2. Click "New Query"
3. Copy ENTIRE content from: supabase-settings-pricing.sql
4. Click "Run"
5. Wait for: "✅ SPINERGY PRICING & SETTINGS CONFIGURED!"
```

**What it does:**
- ✅ Creates `pricing_rules` table ⭐
- ✅ Creates `table_names` table ⭐
- ✅ Creates `club_settings` table
- ✅ Inserts default pricing (8 rules)
- ✅ Inserts table names (Tibhar, DC-700)
- ✅ Creates RLS policies

---

### **Step 3: Run Storage Setup (1 min)**
```
1. Click "New Query"
2. Copy ENTIRE content from: supabase-storage-setup.sql
3. Click "Run"
4. Wait for success
```

**What it does:**
- ✅ Creates storage buckets
- ✅ Sets up RLS for uploads

---

### **Step 4: Enable pg_cron (1 min)**
```
1. Go to: Database → Extensions
2. Search: "pg_cron"
3. Click "Enable"
4. Wait for confirmation
```

---

### **Step 5: Run Booking Reports Script (2 min)**
```
1. Go back to SQL Editor
2. Click "New Query"
3. Copy ENTIRE content from: supabase-booking-report-service.sql
4. Click "Run"
5. Wait for success
```

**What it does:**
- ✅ Creates hourly booking reports
- ✅ Sets up cron job

---

### **Step 6: Disable Email Confirmation (1 min)**
```
1. Go to: Authentication → Providers
2. Click "Email"
3. Turn OFF: "Confirm email"
4. Click "Save"
```

---

## ✅ **VERIFICATION:**

### **Check Tables Exist:**
Run this in SQL Editor:
```sql
-- Should show 3 new tables
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('pricing_rules', 'table_names', 'club_settings');
```

**Expected Result:**
```
pricing_rules
table_names
club_settings
```

### **Check Pricing Data:**
```sql
-- Should show 8 pricing rules
SELECT * FROM pricing_rules ORDER BY table_type, duration_minutes, coaching;
```

**Expected Result:** 8 rows

### **Check Table Names:**
```sql
-- Should show 2 tables
SELECT * FROM table_names ORDER BY display_order;
```

**Expected Result:**
```
table_a | Table A | Tibhar
table_b | Table B | DC-700
```

---

## 🔍 **IF YOU STILL SEE ERRORS:**

### **Error: "function is_admin() does not exist"**
**Fix:** Run `supabase-final-fix.sql` first (Step 1)

### **Error: "table pricing_rules does not exist"**
**Fix:** Run `supabase-settings-pricing.sql` (Step 2)

### **Error: "relation users does not exist"**
**Fix:** Run `supabase-final-fix.sql` first (Step 1)

### **Error: Schema cache issue**
**Fix:** 
1. Run the SQL scripts
2. Wait 10 seconds
3. Refresh your browser
4. Try again

---

## 🎯 **AFTER RUNNING ALL SCRIPTS:**

### **Test Admin Settings Page:**
```
1. Go to: http://localhost:5173/admin
2. Click: ⚙️ Settings tab
3. You should see:
   - 💰 Pricing Rules (8 rows)
   - 🏓 Table Names (2 tables)
4. No errors! ✅
```

---

## 📁 **SCRIPTS TO RUN (IN ORDER):**

1. ✅ `supabase-final-fix.sql` - Main RLS & Auth fix
2. ✅ `supabase-settings-pricing.sql` - ⭐ Creates pricing tables (YOUR ERROR FIX!)
3. ✅ `supabase-storage-setup.sql` - Storage buckets
4. ✅ Enable pg_cron extension
5. ✅ `supabase-booking-report-service.sql` - Hourly reports

---

## 💡 **TIP:**

If you see any errors while running a script:
1. Read the error message
2. Check if you ran previous scripts first
3. Make sure you're logged in as the project owner
4. Try refreshing the Supabase dashboard

---

## ✅ **CHECKLIST:**

- [ ] Ran `supabase-final-fix.sql`
- [ ] Ran `supabase-settings-pricing.sql` ⭐ (Fixes your error!)
- [ ] Ran `supabase-storage-setup.sql`
- [ ] Enabled `pg_cron` extension
- [ ] Ran `supabase-booking-report-service.sql`
- [ ] Disabled email confirmation
- [ ] Tested admin settings page
- [ ] No errors! 🎉

---

## 🚀 **ESTIMATED TIME: 10 MINUTES TOTAL**

**Your error will be fixed after Step 2!** ✅

