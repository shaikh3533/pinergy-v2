# 📊 Database SQL Scripts

This folder contains all Supabase SQL scripts for the 15-Commercial SPINERGY Club Management System.

## ⚙️ **Setup Order (Run in This Order):**

### **1. Core Setup (Required)**
Run these first to set up the basic database structure:

#### **`supabase-final-fix.sql`** ⭐ **RUN FIRST**
- Creates core `users` table
- Sets up `is_admin()` helper function
- Fixes RLS (Row Level Security) policies
- Creates automatic user profile trigger
- **Status:** Required before all other scripts

---

### **2. Pricing & Settings System** ⭐ **IMPORTANT**
#### **`supabase-settings-pricing.sql`**
- Creates `pricing_rules` table (8 pricing combinations)
- Creates `table_names` table (Table A: Tibhar, Table B: DC-700)
- Creates `club_settings` table
- Sets up admin pricing management
- **Status:** Required for admin settings page

---

### **3. Storage Setup**
#### **`supabase-storage-setup.sql`**
- Creates `profile_pics` storage bucket
- Creates `match_videos` storage bucket
- Sets up RLS policies for uploads
- **Status:** Required for profile pictures and match videos

---

### **4. Booking Reports (Optional)**
First enable `pg_cron` extension in Supabase Dashboard:
- Go to: Database → Extensions
- Search: "pg_cron"
- Click "Enable"

Then run:
#### **`supabase-booking-report-service.sql`**
- Creates hourly booking report system
- Generates reports for next 18 hours
- Saves reports to `booking_reports` table
- Sets up automated cron job
- **Status:** Optional but recommended

---

## 📋 **Legacy Scripts (Not Needed):**

These are older versions kept for reference:
- ❌ `supabase-schema.sql` - Original schema (use final-fix instead)
- ❌ `supabase-schema-fixed.sql` - First fix attempt
- ❌ `supabase-schema-pakistan.sql` - Pakistani localization (merged into final-fix)
- ❌ `supabase-auth-fix.sql` - Auth fix (merged into final-fix)
- ❌ `supabase-complete-fix.sql` - Intermediate fix (use final-fix instead)

**Recommendation:** Only use the 4 "Setup Order" scripts above.

---

## ✅ **Quick Setup Checklist:**

```
[ ] 1. Run supabase-final-fix.sql
[ ] 2. Run supabase-settings-pricing.sql
[ ] 3. Run supabase-storage-setup.sql
[ ] 4. Enable pg_cron extension
[ ] 5. Run supabase-booking-report-service.sql
[ ] 6. Disable email confirmation in Supabase Auth settings
```

---

## 🔍 **Verification Queries:**

After running all scripts, verify everything works:

```sql
-- Check tables exist
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' 
ORDER BY table_name;

-- Check pricing rules (should be 8 rows)
SELECT * FROM pricing_rules;

-- Check table names (should be 2 rows)
SELECT * FROM table_names;

-- Check if is_admin() function exists
SELECT proname FROM pg_proc WHERE proname = 'is_admin';

-- Test pricing function
SELECT get_price('table_a', 60, true); -- Should return 1100
```

---

## 📖 **Detailed Guides:**

See the `/docs` folder for comprehensive setup guides:
- `QUICK_SETUP_NOW.md` - Step-by-step setup
- `PRICING_AND_SETTINGS_UPDATE.md` - Pricing system details
- `STORAGE_SETUP_GUIDE.md` - Storage configuration
- `HOURLY_REPORT_SETUP.md` - Booking reports setup

---

## ⚠️ **Common Errors:**

### **"function is_admin() does not exist"**
→ Run `supabase-final-fix.sql` first

### **"table pricing_rules does not exist"**
→ Run `supabase-settings-pricing.sql`

### **"Could not find the table in schema cache"**
→ Wait 10 seconds after running script, then refresh browser

### **"invalid input syntax for type json"**
→ Already fixed in latest version of scripts

---

## 🚀 **Need Help?**

Check the documentation in `/docs` folder or:
1. Review the error message
2. Check if you ran scripts in order
3. Verify you're logged in as project owner
4. Try refreshing Supabase dashboard

---

**All scripts are production-ready and tested! 🎉**


