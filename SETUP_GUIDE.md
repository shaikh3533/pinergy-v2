# 🚀 SmashZone Setup Guide

This guide will walk you through setting up the SmashZone Table Tennis Club Management System from scratch.

## 📋 Prerequisites

Before you begin, ensure you have:
- ✅ Node.js v18 or higher installed
- ✅ npm or yarn package manager
- ✅ A Supabase account (free tier works fine)
- ✅ Git installed (optional)

## 🔧 Step 1: Environment Setup

1. **Navigate to the project directory**:
```bash
cd smashzone-table-tennis
```

2. **Create a `.env` file** in the root directory with the following content:
```env
VITE_SUPABASE_URL=https://mioxecluvalizougrstz.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1pb3hlY2x1dmFsaXpvdWdyc3R6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjE4NTk4MzgsImV4cCI6MjA3NzQzNTgzOH0.wrtEWs9DFDt9tyPKgJ-Ex8Tw7EFPLN_WrCVhhmgLp4o
VITE_WHATSAPP_WEBHOOK_URL=https://example.com/webhook/whatsapp
```

> **Note**: The `.env` file is already in `.gitignore` to prevent sensitive data from being committed.

## 🗄️ Step 2: Supabase Database Setup

### 2.1 Run SQL Schema

1. Go to your Supabase project dashboard: https://app.supabase.com
2. Navigate to **SQL Editor** from the left sidebar
3. Open the file `supabase-schema.sql` from this project
4. Copy the entire contents
5. Paste it into the Supabase SQL Editor
6. Click **Run** to execute the script

This will create:
- ✅ All required tables (users, bookings, matches, ads)
- ✅ Indexes for performance
- ✅ Row Level Security (RLS) policies
- ✅ Helper functions for rating calculations
- ✅ Sample seed data

### 2.2 Create Storage Buckets

1. In Supabase Dashboard, go to **Storage** from the left sidebar
2. Click **New bucket**
3. Create the following buckets:

#### Bucket 1: profile_pics
- Name: `profile_pics`
- Public: ✅ **Yes** (check the box)
- Click **Create bucket**

#### Bucket 2: match_videos
- Name: `match_videos`
- Public: ✅ **Yes** (check the box)
- Click **Create bucket**

### 2.3 Enable Authentication

1. Go to **Authentication** → **Providers** in Supabase Dashboard
2. Enable **Email** provider (should be enabled by default)
3. **(Optional)** Enable **Google OAuth**:
   - Get OAuth credentials from Google Cloud Console
   - Add the credentials in Supabase
   - Add authorized redirect URIs

## 👤 Step 3: Create Admin User

### Option A: Via Application (Easiest)

1. Start the development server (see Step 4)
2. Navigate to the Sign Up page
3. Create an account with your email
4. Check your email for verification link (if enabled)
5. Get your User ID:
   - Go to Supabase Dashboard → **Authentication** → **Users**
   - Find your user and copy the **UUID**
6. Make yourself admin:
   - Go to **SQL Editor**
   - Run this query (replace `YOUR_USER_ID`):
   ```sql
   UPDATE users SET role = 'admin', approved = true 
   WHERE id = 'YOUR_USER_ID';
   ```

### Option B: Direct SQL Insert

If you want to create an admin user directly:

```sql
-- First, create an auth user in Supabase Authentication
-- Then, insert into users table:
INSERT INTO users (id, name, email, rating_points, level, total_hours_played, approved, role)
VALUES (
  'YOUR_AUTH_USER_ID',  -- Replace with actual auth user ID
  'Admin User',
  'admin@smashzone.com',
  0,
  'Noob',
  0,
  true,
  'admin'
);
```

## 🏃 Step 4: Run the Application

### Development Mode

```bash
# Install dependencies (if not already done)
npm install

# Start development server
npm run dev
```

The application will be available at: **http://localhost:5173**

### Build for Production

```bash
# Create production build
npm run build

# Preview production build locally
npm run preview
```

The build output will be in the `dist` folder.

## 🌐 Step 5: Deploy to Production

### Option A: Deploy to Vercel (Recommended)

1. **Install Vercel CLI** (optional):
```bash
npm install -g vercel
```

2. **Deploy**:
```bash
# Run in project directory
vercel
```

Or use the Vercel Dashboard:
- Go to https://vercel.com
- Click **New Project**
- Import your Git repository
- Add environment variables in Vercel settings
- Deploy!

**Environment Variables in Vercel**:
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`
- `VITE_WHATSAPP_WEBHOOK_URL`

### Option B: Deploy to Netlify

1. **Build the project**:
```bash
npm run build
```

2. **Deploy via Netlify CLI**:
```bash
# Install Netlify CLI
npm install -g netlify-cli

# Deploy
netlify deploy --prod
```

Or use Netlify Dashboard:
- Go to https://app.netlify.com
- Drag and drop the `dist` folder
- Or connect your Git repository
- Add environment variables in Site settings

### Option C: Deploy to Any Static Host

The app is a static site after building. You can deploy the `dist` folder to:
- GitHub Pages
- AWS S3 + CloudFront
- Firebase Hosting
- Cloudflare Pages
- Any other static hosting service

## 📱 Step 6: WhatsApp Integration (Optional)

To enable WhatsApp booking notifications:

### Using Twilio (Recommended)

1. Sign up at https://www.twilio.com
2. Get WhatsApp-enabled phone number
3. Create a webhook endpoint (using Twilio Functions or your own server)
4. Update `VITE_WHATSAPP_WEBHOOK_URL` in `.env`

Example webhook format:
```javascript
// Expected POST body
{
  "message": "New Booking: John booked Table A for 60 minutes on 2024-01-15 at 18:00"
}
```

### Using Alternative Services

- **Vonage (Nexmo)**: https://www.vonage.com/
- **MessageBird**: https://www.messagebird.com/
- **WhatsApp Business API**: Direct integration

> **Note**: Currently, the app runs in demo mode and logs notifications to the console if no webhook URL is configured.

## ✅ Step 7: Verify Setup

### Test Checklist

- [ ] Application loads without errors
- [ ] Can sign up with email
- [ ] Can sign in with credentials
- [ ] Can book a slot (as guest or logged in user)
- [ ] Dashboard shows user profile
- [ ] Ratings page displays leaderboard
- [ ] Admin user can access `/admin` page
- [ ] Admin can approve/reject users
- [ ] Admin can manage ads

### Troubleshooting

#### Issue: "Missing Supabase environment variables"
**Solution**: Make sure `.env` file exists and contains correct values

#### Issue: Can't access admin panel
**Solution**: Verify user's role is set to 'admin' in Supabase

#### Issue: Profile picture upload fails
**Solution**: Check that storage buckets are created and set to public

#### Issue: Authentication not working
**Solution**: Verify email provider is enabled in Supabase Auth settings

## 🎨 Customization

### Change Color Theme

Edit `tailwind.config.js`:
```javascript
colors: {
  primary: {
    black: '#000000',  // Change these
    blue: '#0047FF',
    red: '#FF1A1A',
  },
}
```

### Update Club Information

Edit the following files:
- `src/pages/Home.tsx` - Hero section and about
- `src/pages/Contact.tsx` - Contact information
- `src/components/Layout/Footer.tsx` - Footer details

### Modify Pricing

Edit `src/utils/pricingCalculator.ts`:
```typescript
const baseHourlyRate = 200;      // Change this
const coachingHourlyRate = 500;  // Change this
```

### Change Rating Formula

Edit `src/utils/ratingSystem.ts` and update the points map.

## 📊 Database Backup

### Export Data

In Supabase Dashboard → Database → Backups:
- Enable automatic backups (available on paid plans)
- Or export tables manually via SQL:

```sql
-- Export users
COPY (SELECT * FROM users) TO '/path/to/users_backup.csv' CSV HEADER;
```

### Import Data

```sql
-- Import users
COPY users FROM '/path/to/users_backup.csv' CSV HEADER;
```

## 🔒 Security Best Practices

1. **Never commit `.env` file** to version control
2. **Rotate API keys** periodically in Supabase
3. **Enable email verification** in Supabase Auth settings
4. **Review RLS policies** regularly
5. **Use strong passwords** for admin accounts
6. **Enable 2FA** for Supabase project owner account
7. **Monitor usage** in Supabase Dashboard

## 📞 Support

If you encounter issues:

1. Check the [README.md](README.md) for general information
2. Review Supabase documentation: https://supabase.com/docs
3. Contact support: info@smashzone.com

## 🎉 You're All Set!

Your SmashZone Table Tennis Club Management System is now ready to use!

### Next Steps:
1. Invite players to sign up
2. Start accepting bookings
3. Record matches and build the leaderboard
4. Create events and promotions
5. Grow your club community!

---

**Happy Smashing! 🏓**

