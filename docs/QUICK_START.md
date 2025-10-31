# ⚡ Quick Start Guide

Get SmashZone up and running in 5 minutes!

## 1️⃣ Install Dependencies
```bash
npm install
```

## 2️⃣ Create Environment File
Create a `.env` file in the root directory:
```env
VITE_SUPABASE_URL=https://mioxecluvalizougrstz.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1pb3hlY2x1dmFsaXpvdWdyc3R6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjE4NTk4MzgsImV4cCI6MjA3NzQzNTgzOH0.wrtEWs9DFDt9tyPKgJ-Ex8Tw7EFPLN_WrCVhhmgLp4o
VITE_WHATSAPP_WEBHOOK_URL=https://example.com/webhook/whatsapp
```

## 3️⃣ Set Up Supabase Database

### Run SQL Schema
1. Go to [Supabase Dashboard](https://app.supabase.com)
2. Open SQL Editor
3. Copy content from `supabase-schema.sql`
4. Paste and run

### Create Storage Buckets
In Supabase Dashboard → Storage:
- Create `profile_pics` (public)
- Create `match_videos` (public)

## 4️⃣ Start Development Server
```bash
npm run dev
```

Open [http://localhost:5173](http://localhost:5173)

## 5️⃣ Create Admin User
1. Sign up through the app
2. Get your User ID from Supabase → Authentication → Users
3. Run in Supabase SQL Editor:
```sql
UPDATE users SET role = 'admin', approved = true WHERE id = 'YOUR_USER_ID';
```

## 🎉 Done!

You can now:
- ✅ Book slots at `/book`
- ✅ View leaderboard at `/ratings`
- ✅ Access admin panel at `/admin`
- ✅ Manage your profile at `/dashboard`

## 📚 Need More Help?
- Full setup instructions: [SETUP_GUIDE.md](SETUP_GUIDE.md)
- Project details: [README.md](README.md)

---

**Happy Playing! 🏓**

