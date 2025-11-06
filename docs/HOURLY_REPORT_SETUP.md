# ⏰ Hourly Booking Report Service Setup

Automatically generate booking reports every hour - completely FREE using Supabase!

---

## 🎯 **What This Does:**

Every hour, the system automatically:
1. ✅ Counts today's bookings & revenue
2. ✅ Checks next 18 hours for upcoming slots
3. ✅ Groups bookings by table & time
4. ✅ Generates a detailed report
5. ✅ Stores report in database
6. ✅ Makes it available for admin to view

---

## 🚀 **Setup (2 Minutes):**

### **STEP 1: Enable pg_cron in Supabase**

1. Go to Supabase Dashboard:
   ```
   https://app.supabase.com/project/mioxecluvalizougrstz
   ```

2. Click **"Database"** → **"Extensions"**

3. Search for **"pg_cron"**

4. Click **"Enable"** if not already enabled

---

### **STEP 2: Run the Report Service Script**

1. Click **"SQL Editor"** (left sidebar)

2. Click **"New Query"**

3. Open file: **`supabase-booking-report-service.sql`**

4. Copy **ALL** code (Ctrl+A, Ctrl+C)

5. Paste into SQL Editor (Ctrl+V)

6. Click **"Run"** (or Ctrl+Enter)

7. Wait for: **"✅ HOURLY BOOKING REPORT SERVICE ACTIVE!"**

---

### **STEP 3: Verify It's Working**

1. Go to **"Table Editor"** → **"booking_reports"**

2. You should see the first report already generated!

3. Check these columns:
   - `report_date` - Today's date
   - `total_bookings` - Number of bookings today
   - `next_18h_bookings` - Upcoming bookings
   - `report_summary` - Text summary

---

## 📊 **How to View Reports:**

### **Method 1: Direct Database Query**

In SQL Editor:
```sql
-- View latest reports
SELECT * FROM latest_booking_reports;

-- View a specific report with details
SELECT 
  report_summary,
  next_18h_bookings,
  next_18h_revenue,
  upcoming_slots
FROM booking_reports
ORDER BY report_time DESC
LIMIT 1;
```

---

### **Method 2: Use the Status Function**

Get current status anytime:
```sql
SELECT * FROM get_current_booking_status();
```

Returns:
- Today's bookings count
- Today's revenue
- Next 18h bookings
- Next 18h revenue
- Available slots message (for social media!)

---

### **Method 3: View in Admin Dashboard** (Coming soon)

We can add a "Reports" tab in the admin panel to view:
- Latest report summary
- Graph of bookings by hour
- Revenue trends
- Available slots for promotion

---

## ⏰ **Report Schedule:**

The report runs **automatically every hour** at:
```
00:00 (midnight)
01:00
02:00
03:00
...
23:00
```

---

## 📈 **What Each Report Contains:**

### **1. Today's Stats:**
- Total bookings made today
- Total revenue earned today

### **2. Next 18 Hours Stats:**
- Number of upcoming bookings
- Expected revenue from upcoming bookings

### **3. Bookings by Table:**
```json
[
  {
    "table": "Table A (DC-700)",
    "count": 5,
    "revenue": 2500
  },
  {
    "table": "Table B (Tibhar)",
    "count": 3,
    "revenue": 1500
  }
]
```

### **4. Bookings by Hour:**
```json
[
  {
    "hour": "14:00",
    "count": 2,
    "revenue": 1000
  },
  {
    "hour": "18:00",
    "count": 3,
    "revenue": 1500
  }
]
```

### **5. Upcoming Slots Details:**
```json
[
  {
    "player_name": "Ahmed Khan",
    "player_phone": "03001234567",
    "table": "Table A (DC-700)",
    "date": "2025-11-01",
    "time": "14:00 - 15:00",
    "duration": 60,
    "coaching": true,
    "price": 1500
  }
]
```

### **6. Summary Text:**
```
📊 SPINERGY BOOKING REPORT
Generated: 31 Oct 2025 14:00

TODAY'S STATS:
  • Total bookings: 12
  • Total revenue: PKR 6,000

NEXT 18 HOURS:
  • Upcoming bookings: 5
  • Expected revenue: PKR 2,500

Available slots for promotion!
```

---

## 💡 **How to Use Reports for Social Media:**

### **Instagram Story / Facebook:**
```
🏓 SPINERGY UPDATE

✅ 12 bookings today!
💰 PKR 6,000 revenue

⏰ NEXT 18 HOURS:
5 slots booked
📍 Still available: Book now!

📱 Book: spinergy.pk
```

### **WhatsApp Group Message:**
```
📊 Hourly Update - 2 PM

Today: 12 bookings (PKR 6,000)
Next 18h: 5 slots booked

Available slots:
✅ Today 4 PM - 8 PM
✅ Tomorrow morning

Book now! 🏓
```

### **Twitter / X:**
```
⚡ SPINERGY Live Stats

12 bookings today
5 more coming up

Slots available NOW!
Book: [link]

#TableTennis #Lahore #SPINERGY
```

---

## 🔧 **Customize Report Timing:**

Want reports every 2 hours instead?

```sql
-- Unschedule existing job
SELECT cron.unschedule('spinergy-hourly-booking-report');

-- Schedule every 2 hours
SELECT cron.schedule(
  'spinergy-hourly-booking-report',
  '0 */2 * * *',  -- Every 2 hours
  'SELECT generate_booking_report();'
);
```

Want reports only during business hours?

```sql
-- Unschedule existing job
SELECT cron.unschedule('spinergy-hourly-booking-report');

-- Schedule 9 AM to 11 PM only
SELECT cron.schedule(
  'spinergy-hourly-booking-report',
  '0 9-23 * * *',  -- Every hour from 9 AM to 11 PM
  'SELECT generate_booking_report();'
);
```

---

## 📊 **Example Queries:**

### **Get today's performance:**
```sql
SELECT 
  total_bookings,
  total_revenue,
  report_time
FROM booking_reports
WHERE report_date = CURRENT_DATE
ORDER BY report_time DESC;
```

### **Compare revenue by hour:**
```sql
SELECT 
  report_time,
  next_18h_revenue
FROM booking_reports
WHERE report_date = CURRENT_DATE
ORDER BY report_time;
```

### **Find peak booking hours:**
```sql
SELECT 
  jsonb_array_elements(bookings_by_hour) as hour_data
FROM booking_reports
ORDER BY report_time DESC
LIMIT 1;
```

### **Get current available slots message:**
```sql
SELECT available_slots_message 
FROM get_current_booking_status();
```

---

## 💰 **Cost: 100% FREE!**

✅ Supabase Free Tier includes:
- ✅ pg_cron extension (unlimited cron jobs)
- ✅ Database storage (500 MB free)
- ✅ Unlimited reads/writes
- ✅ No time limits

This service costs **ZERO** money! 🎉

---

## 🎯 **Use Cases:**

### **For Admin:**
- Check revenue anytime
- See which tables are popular
- Know peak hours
- Plan staffing

### **For Marketing:**
- Post available slots to social media
- Share daily stats with followers
- Create urgency ("Only 3 slots left!")
- Show club popularity

### **For Operations:**
- Know when to prepare tables
- See upcoming coaching sessions
- Track revenue targets
- Optimize pricing

---

## 🚨 **Troubleshooting:**

### **Issue: No reports being generated**
**Check:**
```sql
-- Check if cron job exists
SELECT * FROM cron.job WHERE jobname = 'spinergy-hourly-booking-report';

-- Check cron job status
SELECT * FROM cron.job_run_details 
WHERE jobid = (SELECT jobid FROM cron.job WHERE jobname = 'spinergy-hourly-booking-report')
ORDER BY start_time DESC 
LIMIT 5;
```

### **Issue: Reports showing 0 bookings**
**Reason:** No bookings in the system yet!

**Solution:** Make some test bookings, wait for next hour, check again.

### **Issue: Can't see booking_reports table**
**Solution:** 
```sql
-- Verify table exists
SELECT * FROM information_schema.tables 
WHERE table_name = 'booking_reports';

-- If not exists, run the setup script again
```

---

## 📱 **Next Steps:**

1. ✅ Set up the service (run SQL script)
2. ✅ Wait for first report (within 1 hour)
3. ✅ View reports in database
4. ✅ Use summaries for social media posts
5. ✅ Track your club's performance!

---

## 🎉 **Benefits:**

✅ **Automated** - No manual work  
✅ **Free** - Uses Supabase free tier  
✅ **Hourly** - Always up-to-date  
✅ **Detailed** - All metrics included  
✅ **Ready for Marketing** - Easy to share  
✅ **Analytics** - Track performance trends  

**Your booking insights, automated and free! 📊🏓**

