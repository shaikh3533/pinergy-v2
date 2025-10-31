# 🏓 SmashZone Table Tennis Club Management System

A modern, full-stack web application for managing a table tennis club, built with React, Vite, TypeScript, Tailwind CSS, and Supabase.

## 🌟 Features

### For Players
- 📅 **Book Slots**: Reserve tables for 30 or 60-minute sessions
- 👨‍🏫 **Coaching**: Option to add professional coaching to your booking
- 🏆 **Rating System**: Earn points and climb the leaderboard
- 📊 **Dashboard**: Track your bookings, matches, and statistics
- 🖼️ **Profile Management**: Upload and manage your profile picture
- 📹 **Match Videos**: View recordings of your games

### For Admins
- 👥 **User Management**: Approve/revoke users, manage ratings
- 📋 **Booking Overview**: View all bookings and statistics
- 📢 **Events & Ads**: Create and manage advertisements and events
- 🎯 **Match Recording**: Add match results and video links
- 📈 **Analytics**: Track total hours played and user activity

### General Features
- 🔐 **Authentication**: Email/Password and Google OAuth sign-in
- 📱 **Responsive Design**: Works perfectly on all devices
- 🎨 **Modern UI**: Premium black, blue, and red theme
- ⚡ **Real-time Updates**: Live data with Supabase
- 🔔 **WhatsApp Notifications**: Automated booking alerts (webhook)

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ (currently using v20.12.2)
- npm or yarn
- Supabase account

### Installation

1. **Clone and navigate to the project**:
```bash
cd smashzone-table-tennis
```

2. **Install dependencies**:
```bash
npm install
```

3. **Set up environment variables**:

Create a `.env` file in the root directory:
```env
VITE_SUPABASE_URL=https://mioxecluvalizougrstz.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1pb3hlY2x1dmFsaXpvdWdyc3R6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjE4NTk4MzgsImV4cCI6MjA3NzQzNTgzOH0.wrtEWs9DFDt9tyPKgJ-Ex8Tw7EFPLN_WrCVhhmgLp4o
VITE_WHATSAPP_WEBHOOK_URL=https://example.com/webhook/whatsapp
```

4. **Set up Supabase Database**:
   - Go to your Supabase project dashboard
   - Navigate to SQL Editor
   - Copy and paste the contents of `supabase-schema.sql`
   - Run the SQL script

5. **Create Storage Buckets** (in Supabase Dashboard):
   - Go to Storage
   - Create bucket: `profile_pics` (make it public)
   - Create bucket: `match_videos` (make it public)

6. **Enable Authentication** (in Supabase Dashboard):
   - Go to Authentication → Providers
   - Enable Email provider
   - Enable Google OAuth (optional, requires setup)

7. **Create Admin User**:
   - Sign up through the app
   - Get your user ID from Supabase Authentication dashboard
   - Run this SQL in Supabase SQL Editor:
   ```sql
   UPDATE users SET role = 'admin', approved = true WHERE id = 'YOUR_USER_ID';
   ```

8. **Run the development server**:
```bash
npm run dev
```

The app will be available at `http://localhost:5173`

## 📁 Project Structure

```
smashzone-table-tennis/
├── src/
│   ├── components/
│   │   ├── Layout/
│   │   │   ├── Navbar.tsx
│   │   │   ├── Footer.tsx
│   │   │   └── Layout.tsx
│   │   └── ProtectedRoute.tsx
│   ├── pages/
│   │   ├── Auth/
│   │   │   ├── SignIn.tsx
│   │   │   └── SignUp.tsx
│   │   ├── Admin/
│   │   │   └── Admin.tsx
│   │   ├── Home.tsx
│   │   ├── Book.tsx
│   │   ├── Dashboard.tsx
│   │   ├── Ratings.tsx
│   │   ├── Rules.tsx
│   │   ├── Ads.tsx
│   │   └── Contact.tsx
│   ├── lib/
│   │   └── supabase.ts
│   ├── store/
│   │   └── authStore.ts
│   ├── utils/
│   │   ├── ratingSystem.ts
│   │   ├── whatsappNotification.ts
│   │   ├── dateUtils.ts
│   │   └── pricingCalculator.ts
│   ├── App.tsx
│   ├── main.tsx
│   └── index.css
├── supabase-schema.sql
├── package.json
└── README.md
```

## 🎯 Rating System

### Point Distribution

| Opponent Level | Win Points | Loss Points |
|---------------|-----------|-------------|
| Noob | +1 | 0 |
| Level 3 | +3 | 0 |
| Level 2 | +5 | 0 |
| Level 1 | +7 | 0 |
| Top Player | +10 | +2 |

### Level Thresholds

- **Noob**: 0-30 points
- **Level 3**: 31-70 points
- **Level 2**: 71-120 points
- **Level 1**: 121-180 points
- **Top Player**: 181+ points

### Rules
- Players can only earn points from max 10 matches/month vs Noobs
- Ratings reset annually on January 1st
- All matches are Best of 3

## 💰 Pricing

### Table Rental
- 30 minutes: ₹100
- 60 minutes: ₹200

### Coaching (Optional)
- 30 minutes: +₹250
- 60 minutes: +₹500

## 🛠️ Tech Stack

- **Frontend**: React 18, TypeScript, Vite
- **Styling**: Tailwind CSS
- **Animation**: Framer Motion
- **State Management**: Zustand
- **Data Fetching**: TanStack Query (React Query)
- **Routing**: React Router DOM
- **Backend**: Supabase (PostgreSQL)
- **Authentication**: Supabase Auth (Email + Google OAuth)
- **Storage**: Supabase Storage
- **Date Handling**: date-fns
- **Form Handling**: React Hook Form + Zod

## 🔒 Security

- Row Level Security (RLS) enabled on all tables
- Protected routes for authenticated users
- Admin-only access to sensitive operations
- Profile picture uploads sanitized and stored securely

## 🚢 Deployment

### Vercel (Recommended)
```bash
npm run build
# Deploy the `dist` folder to Vercel
```

### Netlify
```bash
npm run build
# Deploy the `dist` folder to Netlify
```

### Environment Variables
Make sure to add all environment variables in your deployment platform:
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`
- `VITE_WHATSAPP_WEBHOOK_URL` (optional)

## 📝 WhatsApp Integration

The app includes a placeholder for WhatsApp notifications. To enable real notifications:

1. Set up a WhatsApp Business API or use services like:
   - Twilio WhatsApp API
   - Vonage (Nexmo)
   - MessageBird

2. Create a webhook endpoint that accepts POST requests with booking data

3. Update `VITE_WHATSAPP_WEBHOOK_URL` in your `.env` file

Currently, booking notifications are logged to the console in demo mode.

## 🎨 Customization

### Colors
The app uses a custom color scheme defined in `tailwind.config.js`:
- Primary Black: `#000000`
- Primary Blue: `#0047FF`
- Primary Red: `#FF1A1A`

### Tables
To modify table information, edit:
- `src/pages/Home.tsx` (table descriptions)
- `src/pages/Book.tsx` (table selection options)

### Pricing
To change pricing, edit:
- `src/utils/pricingCalculator.ts`

## 📧 Support

For issues or questions:
- Email: info@smashzone.com
- Phone: +91 98765 43210

## 📄 License

This project is proprietary software for SmashZone Table Tennis Club.

---

Built with ❤️ for the table tennis community 🏓
