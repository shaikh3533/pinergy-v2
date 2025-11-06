# 🎾➡️🏓 Fix Professional Coaching Image

## ❌ PROBLEM

The "Professional Coaching Available" event is showing a **badminton image** instead of a **table tennis image**!

---

## ✅ SOLUTION

### **Run this SQL in Supabase:**

**Steps:**
1. Go to Supabase Dashboard
2. Click on **SQL Editor**
3. Copy and paste the SQL from `database/FIX_COACHING_IMAGE.sql`
4. Click **Run**
5. Done! ✅

### **Quick SQL:**

```sql
UPDATE ads 
SET image = 'https://images.unsplash.com/photo-1554068865-24cecd4e34b8?q=80&w=800'
WHERE title = 'Professional Coaching Available';
```

---

## 🎯 WHAT CHANGES

### **Before:** ❌
- Image: Badminton player (photo-1626224583764-f87db24ac4ea)

### **After:** ✅
- Image: Table tennis paddle & ball (photo-1554068865-24cecd4e34b8)

---

## 📸 IMAGE DETAILS

**New Image URL:**
```
https://images.unsplash.com/photo-1554068865-24cecd4e34b8?q=80&w=800
```

**Shows:**
- Table tennis paddle
- Table tennis ball
- Clean, professional look
- Perfect for coaching services

---

## ✅ VERIFY

After running the SQL, check your Events & Promotions page:
1. Go to `/ads` page
2. Find "Professional Coaching Available" card
3. Image should now show **table tennis equipment** ✅

---

## 🔄 QUICK FIX

**One-line command in Supabase SQL Editor:**

```sql
UPDATE ads SET image = 'https://images.unsplash.com/photo-1554068865-24cecd4e34b8?q=80&w=800' WHERE title = 'Professional Coaching Available';
```

**Done!** 🎯🏓✅

