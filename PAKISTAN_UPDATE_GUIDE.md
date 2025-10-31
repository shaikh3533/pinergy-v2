# 🇵🇰 SmashZone Pakistan - Complete Setup Guide

## 🎉 What's New - Pakistani Version

Your SmashZone app has been completely updated for Pakistan! Here's everything that changed:

### ✅ Major Updates Completed

1. **✅ No Approval Required** - Users auto-approved on signup
2. **✅ PKR Currency** - All prices in Pakistani Rupees
3. **✅ Pakistani Names** - Dummy data with Muslim/Pakistani names
4. **✅ WhatsApp Integration** - Direct messaging to admin WhatsApp
5. **✅ Time Slot System** - Proper half-hour slots with club timings
6. **✅ Enhanced Booking Form** - Shows from-to time clearly
7. **✅ Suggestions/Feedback** - New page for complaints and suggestions
8. **✅ Pakistani Contact Info** - Updated all contact details

---

## 📊 Database Changes

### New Schema: `supabase-schema-pakistan.sql`

#### What Changed:
- ✅ Users auto-approved (`approved = true` by default)
- ✅ New `suggestions` table for feedback
- ✅ Bookings table updated with `start_time`, `end_time`, `day_of_week`
- ✅ Pakistani sample data (Ahmed Ali, Fatima Khan, etc.)
- ✅ Admin role can only be set via Supabase (not through signup)

#### How to Apply:

**Option 1: Fresh Database (Recommended)**
```sql
-- Run the entire supabase-schema-pakistan.sql file
-- This will drop old tables and create new ones
```

**Option 2: Keep Existing Data**
```sql
-- Add new columns to bookings table
ALTER TABLE bookings 
  ADD COLUMN start_time TIME,
  ADD COLUMN end_time TIME,
  ADD COLUMN day_of_week TEXT,
  ADD COLUMN whatsapp_sent BOOLEAN DEFAULT false;

-- Update existing bookings (set start_time from old time column)
UPDATE bookings SET start_time = time WHERE start_time IS NULL;

-- Create suggestions table
CREATE TABLE suggestions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  type TEXT NOT NULL CHECK (type IN ('suggestion', 'complaint', 'feedback')),
  subject TEXT NOT NULL,
  message TEXT NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'reviewed', 'resolved')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Auto-approve all existing users
UPDATE users SET approved = true;
```

---

## 💰 Pricing (PKR)

| Service | 30 Minutes | 60 Minutes |
|---------|------------|------------|
| **Table Rental** | PKR 250 | PKR 500 |
| **Coaching (Optional)** | +PKR 500 | +PKR 1000 |

### Examples:
- 30 min table only: **PKR 250**
- 30 min with coaching: **PKR 750**
- 60 min table only: **PKR 500**
- 60 min with coaching: **PKR 1500**

---

## 🕐 Club Timings

### Weekdays (Monday - Friday)
- **2:00 PM to 2:00 AM** (next day)
- 12 hours of play time

### Weekends (Saturday - Sunday)
- **12:00 PM to 3:00 AM** (next day)
- 15 hours of play time

Time slots available in **30-minute intervals**.

---

## 📱 WhatsApp Integration

### How It Works:
1. User books a slot
2. WhatsApp message auto-opens with booking details
3. Message pre-filled to send to: **0341-3393533**
4. User clicks send (requires WhatsApp installed)

### Message Format:
```
🏓 SmashZone - New Booking

👤 Player: Ahmed Ali
📱 Phone: 03XX XXXXXXX
🎯 Table: Table A (DC-700)
📅 Date: 2024-01-15 (Monday)
⏰ Time: 6:00 PM - 7:00 PM
⏱️ Duration: 60 minutes
👨‍🏫 Coaching: Yes ✅

Booking confirmed! See you at SmashZone! 🏓
```

### WhatsApp Group:
- Group Link: https://chat.whatsapp.com/JCxLLXGZMSrBjoMSmpBq8m
- Admin Number: 0341-3393533

---

## 📝 New Features

### 1. Suggestions & Feedback Page (`/suggestions`)

Users can submit:
- 💡 **Suggestions** - Ideas to improve
- ⚠️ **Complaints** - Issues to resolve
- ⭐ **Feedback** - General comments

All submissions stored in `suggestions` table for admin review.

### 2. Enhanced Booking Form

New features:
- ✅ Proper time slot dropdown (30-min intervals)
- ✅ Shows "From - To" time clearly
- ✅ Club timings info displayed
- ✅ Phone number now required
- ✅ Displays weekday vs weekend timings
- ✅ WhatsApp notification on booking

### 3. Auto-Approval

- ✅ No admin approval needed
- ✅ Users can book immediately after signup
- ✅ Only email verification required (Supabase handles this)

---

## 🇵🇰 Pakistani Context Updates

### Contact Information
- **Email**: info@smashzone.pk, bookings@smashzone.pk
- **Phone**: 0341-3393533
- **WhatsApp**: 0341-3393533
- **Location**: DHA Phase 5, Lahore, Sindh, Pakistan

### Sample Player Names
- Ahmed Ali
- Fatima Khan
- Hassan Raza
- Ayesha Malik
- Bilal Ahmed
- Zainab Shah
- Usman Tariq
- Mariam Siddiqui
- Ali Haider
- Hira Iqbal

### Currency Symbol
- Changed from ₹ (Indian Rupee) to **PKR** (Pakistani Rupee)
- All prices updated throughout the app

---

## 🔐 Admin Access

### Creating Admin Users

Admins can ONLY be created via Supabase (not through app signup).

**Steps:**
1. User signs up normally through the app
2. Go to Supabase Dashboard → Authentication → Users
3. Copy the user's UUID
4. Go to SQL Editor and run:
```sql
UPDATE users 
SET role = 'admin' 
WHERE id = 'USER_UUID_HERE';
```

**Note:** Users cannot change their own role to admin through the app.

---

## 🚀 Deployment Checklist

### Before Going Live:

1. **Update Supabase Database**
   - [ ] Run `supabase-schema-pakistan.sql`
   - [ ] Create storage buckets (`profile_pics`, `match_videos`)
   - [ ] Verify RLS policies are working

2. **Environment Variables**
   ```env
   VITE_SUPABASE_URL=your-supabase-url
   VITE_SUPABASE_ANON_KEY=your-anon-key
   VITE_WHATSAPP_WEBHOOK_URL=https://example.com (optional)
   ```

3. **Test Key Features**
   - [ ] User signup (no approval needed)
   - [ ] Booking system with time slots
   - [ ] WhatsApp notification
   - [ ] Suggestions form submission
   - [ ] Admin panel access

4. **Create Admin Account**
   - [ ] Sign up through app
   - [ ] Set role to 'admin' in Supabase

5. **Deploy**
   ```bash
   npm run build
   # Deploy dist/ folder to Vercel/Netlify
   ```

---

## 📄 New Files Created

1. **`supabase-schema-pakistan.sql`** - Updated database schema
2. **`src/pages/Suggestions.tsx`** - Feedback form page
3. **`src/utils/timeSlots.ts`** - Time slot generation logic
4. **`FIX_DATABASE.md`** - Database fix instructions
5. **`PAKISTAN_UPDATE_GUIDE.md`** - This file

---

## 🐛 Troubleshooting

### Issue: "infinite recursion detected"
**Solution:** Use `supabase-schema-pakistan.sql` which has fixed RLS policies

### Issue: WhatsApp not opening
**Solution:** Make sure user has WhatsApp installed. Works on mobile browsers best.

### Issue: Time slots not showing
**Solution:** Select a date first. Time slots are generated based on the selected date.

### Issue: Users can't book
**Solution:** Check that `approved = true` for all users in database

---

## 📞 Support

### Contact Details
- **Email**: info@smashzone.pk
- **WhatsApp**: 0341-3393533
- **Location**: DHA Phase 5, Lahore

### For Developers
- Check `README.md` for general setup
- Check `SETUP_GUIDE.md` for detailed instructions
- Check `PROJECT_SUMMARY.md` for project overview

---

## ✨ Features Summary

### User Features
- ✅ Sign up without approval
- ✅ Book slots with proper time selection
- ✅ View bookings and match history
- ✅ Submit feedback/complaints
- ✅ View leaderboard
- ✅ WhatsApp notifications

### Admin Features
- ✅ View all bookings
- ✅ Manage users and ratings
- ✅ View suggestions/complaints
- ✅ Create ads and events
- ✅ Full CRUD operations

---

## 🎯 Quick Start

1. **Update Database**: Run `supabase-schema-pakistan.sql`
2. **Build Project**: `npm run build`
3. **Test Locally**: `npm run dev`
4. **Create Admin**: Update user role in Supabase
5. **Deploy**: Push `dist/` folder to hosting

---

**🇵🇰 Your SmashZone Pakistan app is ready! 🏓**

Made with ❤️ for the Pakistani table tennis community


