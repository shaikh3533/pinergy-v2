# 🏓 SPINERGY - Table Tennis Club Management System

A complete, production-ready web application for managing table tennis club operations, built with React, TypeScript, Supabase, and Tailwind CSS.

![Build Status](https://img.shields.io/badge/build-passing-brightgreen)
![React](https://img.shields.io/badge/React-18.3-blue)
![TypeScript](https://img.shields.io/badge/TypeScript-5.6-blue)
![Supabase](https://img.shields.io/badge/Supabase-Backend-green)
![License](https://img.shields.io/badge/license-MIT-blue)

## 🌟 **Live Demo**

[View Live Site](https://spinergy-v1.vercel.app) • [GitHub Repository](https://github.com/shaikh3533/spinergy-v1)

---

## ✨ **Features**

### 🎯 **For Players:**
- ✅ Book slots with visual 7-day calendar
- ✅ Select multiple time slots in one booking
- ✅ Choose tables (Tibhar or DC-700)
- ✅ Add optional coaching
- ✅ View booking history
- ✅ Track playing hours and rating
- ✅ See leaderboard & rankings
- ✅ Upload profile pictures
- ✅ View match videos

### 👨‍💼 **For Admins:**
- ✅ **Manage Pricing** - Edit prices for any table/duration/coaching combo via UI
- ✅ **Edit Table Names** - Change table display names and specs anytime
- ✅ Manage all users and bookings
- ✅ Create/edit advertisements and events
- ✅ View automated hourly reports
- ✅ Update player ratings
- ✅ Approve/manage users
- ✅ Track revenue and statistics

### 🎨 **User Experience:**
- ✅ Beautiful, modern UI with animations
- ✅ Fully responsive (mobile, tablet, desktop)
- ✅ Toast notifications (no annoying alerts)
- ✅ Dark theme with blue & red accents
- ✅ Pakistani localization (PKR, names, timings)
- ✅ Google Maps integration
- ✅ Real-time data updates

---

## 🚀 **Quick Start**

### **Prerequisites:**
- Node.js 20.19+ (or 22.12+)
- npm or yarn
- Supabase account (free tier works)

### **Installation:**

```bash
# Clone the repository
git clone https://github.com/shaikh3533/spinergy-v1.git
cd spinergy-v1

# Install dependencies
npm install

# Set up environment variables
# Create .env file with:
# VITE_SUPABASE_URL=your_supabase_url
# VITE_SUPABASE_ANON_KEY=your_supabase_anon_key

# Run development server
npm run dev

# Build for production
npm run build
```

### **Database Setup:**

Run these SQL scripts in your Supabase SQL Editor (in order):

1. `database/supabase-final-fix.sql` - Core setup & RLS
2. `database/supabase-settings-pricing.sql` - Pricing system ⭐
3. `database/supabase-storage-setup.sql` - File uploads
4. Enable `pg_cron` extension in Supabase Dashboard
5. `database/supabase-booking-report-service.sql` - Hourly reports

**Detailed guide:** See [`docs/QUICK_SETUP_NOW.md`](docs/QUICK_SETUP_NOW.md)

---

## 📁 **Project Structure**

```
spinergy/
├── src/
│   ├── pages/              # React pages (Home, Book, Admin, etc.)
│   ├── components/         # Reusable components
│   ├── store/              # Zustand state management
│   ├── utils/              # Helper functions
│   ├── lib/                # Supabase client
│   └── assets/             # Images and logos
├── database/               # SQL scripts for Supabase
│   ├── README.md          # Database setup guide
│   └── *.sql              # All database scripts
├── docs/                   # Comprehensive documentation
│   ├── START_HERE.md      # Documentation index
│   └── *.md               # All guides and docs
├── backend/                # Backend server examples
│   ├── backend-server-example.js
│   └── backend-.env.example
└── public/                 # Static assets
```

---

## 🎯 **Tech Stack**

### **Frontend:**
- **React 18.3** - UI framework
- **TypeScript 5.6** - Type safety
- **Vite 7.1** - Build tool
- **Tailwind CSS 3.4** - Styling
- **Framer Motion** - Animations
- **React Router** - Routing
- **Zustand** - State management
- **TanStack Query** - Data fetching
- **React Hook Form** - Form management
- **date-fns** - Date utilities

### **Backend:**
- **Supabase** - Backend as a Service
  - PostgreSQL database
  - Authentication (Email & Google OAuth)
  - Storage (Profile pics & videos)
  - Row Level Security (RLS)
  - Real-time subscriptions
  - Edge Functions ready

### **DevOps:**
- **Vercel** - Hosting & deployment
- **GitHub** - Version control
- **ESLint** - Code linting
- **PostCSS** - CSS processing

---

## 🗂️ **Database Schema**

### **Core Tables:**
- `users` - User profiles, ratings, hours played
- `bookings` - All slot bookings with pricing
- `matches` - Match records with videos
- `ads` - Advertisements and events
- `suggestions` - User feedback
- `pricing_rules` - Dynamic pricing (8 rules) ⭐ NEW
- `table_names` - Editable table info ⭐ NEW
- `club_settings` - Club configuration ⭐ NEW
- `booking_reports` - Automated reports

### **Views & Functions:**
- `pricing_matrix` - Easy pricing lookup
- `is_admin()` - Admin check helper
- `get_price()` - Calculate price
- `generate_booking_report()` - Create hourly reports

---

## 💰 **Pricing System**

**Default Pricing (PKR):**

| Table | Duration | Coaching | Price |
|-------|----------|----------|-------|
| **Tibhar (Premium)** | 30 min | No | 400 |
| **Tibhar (Premium)** | 30 min | Yes | 600 |
| **Tibhar (Premium)** | 60 min | No | 700 |
| **Tibhar (Premium)** | 60 min | Yes | 1100 |
| **DC-700 (Standard)** | 30 min | No | 350 |
| **DC-700 (Standard)** | 30 min | Yes | 550 |
| **DC-700 (Standard)** | 60 min | No | 600 |
| **DC-700 (Standard)** | 60 min | Yes | 1000 |

**Admins can edit all prices via Settings page!** No code changes needed.

---

## 📖 **Documentation**

### **Essential Guides:**
- [`docs/QUICK_SETUP_NOW.md`](docs/QUICK_SETUP_NOW.md) - ⭐ **Start here!** Complete setup in 10 minutes
- [`docs/FINAL_COMPLETE_SUMMARY.md`](docs/FINAL_COMPLETE_SUMMARY.md) - All features overview
- [`database/README.md`](database/README.md) - Database setup instructions
- [`docs/START_HERE.md`](docs/START_HERE.md) - Documentation index

### **Feature Guides:**
- [`docs/PRICING_AND_SETTINGS_UPDATE.md`](docs/PRICING_AND_SETTINGS_UPDATE.md) - Dynamic pricing system
- [`docs/STORAGE_SETUP_GUIDE.md`](docs/STORAGE_SETUP_GUIDE.md) - File upload configuration
- [`docs/HOURLY_REPORT_SETUP.md`](docs/HOURLY_REPORT_SETUP.md) - Automated reports
- [`docs/WHATSAPP_INTEGRATION_GUIDE.md`](docs/WHATSAPP_INTEGRATION_GUIDE.md) - WhatsApp notifications

### **Troubleshooting:**
- [`docs/ALL_ISSUES_FIXED.md`](docs/ALL_ISSUES_FIXED.md) - Common issues & solutions
- [`docs/FIX_RLS_PERMANENTLY.md`](docs/FIX_RLS_PERMANENTLY.md) - RLS fixes
- [`docs/TIMESTAMP_FIX_FINAL.md`](docs/TIMESTAMP_FIX_FINAL.md) - Timestamp issues

---

## 🎮 **Usage**

### **For Development:**
```bash
npm run dev          # Start dev server (http://localhost:5173)
npm run build        # Build for production
npm run preview      # Preview production build
npm run lint         # Run ESLint
```

### **Environment Variables:**
Create a `.env` file:
```env
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### **Admin Access:**
Set user role to `admin` in Supabase:
```sql
UPDATE users SET role = 'admin' WHERE email = 'your-admin@email.com';
```

---

## 🌍 **Deployment**

### **Vercel (Recommended):**
```bash
npm i -g vercel
vercel
```

Add environment variables in Vercel dashboard:
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`

### **Netlify:**
```bash
npm run build
# Upload dist/ folder to Netlify
```

### **Other Hosts:**
Build the project and upload the `dist/` folder to any static hosting service.

---

## 📊 **Statistics**

- **Total Pages:** 9 (Home, Book, Dashboard, Admin, Ratings, Rules, Ads, Contact, Suggestions)
- **Total Features:** 50+
- **Database Tables:** 11
- **Lines of Code:** ~20,000
- **Build Size:** 617 kB (gzipped: 179 kB)
- **Setup Time:** ~10 minutes
- **Cost:** $0 (Supabase free tier + Vercel free tier)

---

## 🏢 **Club Information**

- **Name:** SPINERGY Table Tennis Club
- **Location:** Suny Park, Lahore, Punjab, Pakistan
- **Tables:** 
  - Table A: Tibhar Top (25mm ITTF approved)
  - Table B: DC-700 (25mm professional)
- **Timings:**
  - Monday-Friday: 2:00 PM - 2:00 AM
  - Saturday-Sunday: 12:00 PM - 3:00 AM
- **Contact:** 03413393533

---

## 🤝 **Contributing**

Contributions are welcome! Please feel free to submit a Pull Request.

---

## 📝 **License**

This project is licensed under the MIT License.

---

## 👨‍💻 **Author**

**Shaikh**
- GitHub: [@shaikh3533](https://github.com/shaikh3533)
- Repository: [spinergy-v1](https://github.com/shaikh3533/spinergy-v1)

---

## 🙏 **Acknowledgments**

- Built with [React](https://react.dev/)
- Backend by [Supabase](https://supabase.com/)
- Styled with [Tailwind CSS](https://tailwindcss.com/)
- Animated with [Framer Motion](https://www.framer.com/motion/)
- Hosted on [Vercel](https://vercel.com/)

---

## 📞 **Support**

For issues, questions, or feature requests:
1. Check the [`docs/`](docs/) folder for guides
2. Review [`docs/ALL_ISSUES_FIXED.md`](docs/ALL_ISSUES_FIXED.md)
3. Open an issue on GitHub
4. Contact via email

---

## 🎉 **Status**

✅ **Production Ready**  
✅ **Fully Tested**  
✅ **Well Documented**  
✅ **Actively Maintained**

---

**Built with ❤️ for the table tennis community in Pakistan! 🏓🇵🇰**

