# 🚀 Vercel Deployment Guide for SPINERGY

Complete guide to deploy your SPINERGY app to Vercel with all assets working properly.

---

## ✅ **What We Fixed:**

### **Image Issues - RESOLVED ✅**
**Problem:** Images showing as broken/missing after Vercel deployment

**Solution:** Changed from absolute paths to ES6 imports
- ❌ **Before:** `src="/src/assets/logo.jpeg"` (doesn't work in production)
- ✅ **After:** `import logo from '../assets/logo.jpeg'; <img src={logo} />`

**Files Updated:**
- `src/pages/Home.tsx` - Logo, Tibhar, DC-700 images
- `src/components/Layout/Navbar.tsx` - Logo
- `src/components/Layout/Footer.tsx` - Logo

---

## 🎯 **Step-by-Step Deployment:**

### **1. Prerequisites**
- ✅ GitHub repository created
- ✅ Code pushed to GitHub
- ✅ Vercel account (free tier works)
- ✅ Supabase project with all SQL scripts run

---

### **2. Deploy to Vercel**

#### **Option A: Via Vercel Dashboard (Easiest)**

1. Go to [vercel.com](https://vercel.com)
2. Click **"Add New Project"**
3. **Import Git Repository:**
   - Select your GitHub repository: `spinergy-v1`
   - Click **"Import"**

4. **Configure Project:**
   - **Framework Preset:** Vite
   - **Root Directory:** `./` (leave default)
   - **Build Command:** `npm run build`
   - **Output Directory:** `dist`
   - **Install Command:** `npm install`

5. **Add Environment Variables:** ⭐ **CRITICAL STEP**
   ```
   VITE_SUPABASE_URL=your_supabase_project_url
   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```
   
   **How to add:**
   - Click **"Environment Variables"** section
   - Add `VITE_SUPABASE_URL` → Paste your Supabase URL
   - Add `VITE_SUPABASE_ANON_KEY` → Paste your Supabase Anon Key
   - Select: ✅ Production, ✅ Preview, ✅ Development

6. Click **"Deploy"**
   - Wait 2-3 minutes for build
   - ✅ Deployment successful!

---

#### **Option B: Via Vercel CLI**

```bash
# Install Vercel CLI
npm i -g vercel

# Login to Vercel
vercel login

# Deploy
vercel

# Follow prompts:
# - Set up and deploy? Y
# - Which scope? [Your account]
# - Link to existing project? N
# - Project name? spinergy
# - Directory? ./
# - Override settings? N

# Deploy to production
vercel --prod
```

Then add environment variables in Vercel dashboard.

---

### **3. Add Environment Variables (Post-Deployment)**

If you forgot to add them during setup:

1. Go to your project in Vercel
2. Click **"Settings"** tab
3. Click **"Environment Variables"**
4. Add both variables:
   ```
   VITE_SUPABASE_URL
   VITE_SUPABASE_ANON_KEY
   ```
5. Check all environments: Production, Preview, Development
6. Click **"Save"**
7. **Redeploy:** Go to "Deployments" → Click "..." → "Redeploy"

---

### **4. Verify Deployment**

#### **Check Build Logs:**
```
✓ 894 modules transformed.
✓ built in 6.55s

dist/index.html                                   0.84 kB
dist/assets/primary white variant logo-*.jpeg   181.80 kB  ✅
dist/assets/tibhar-*.png                        114.73 kB  ✅
dist/assets/dc-700-*.png                        110.10 kB  ✅
dist/assets/2 rackets variant logo-*.jpeg        89.36 kB  ✅
dist/assets/index-*.css                          25.67 kB
dist/assets/index-*.js                          617.11 kB
```

**All 4 images should be included in build!** ✅

#### **Test Live Site:**

1. **Home Page:**
   - ✅ Logo visible in hero section
   - ✅ Tibhar table image visible
   - ✅ DC-700 table image visible

2. **Navbar:**
   - ✅ Logo visible in top-left

3. **Footer:**
   - ✅ Logo visible at bottom

4. **Functionality:**
   - ✅ Sign up works
   - ✅ Login works
   - ✅ Booking system works
   - ✅ Admin dashboard accessible

---

## 🐛 **Common Issues & Solutions:**

### **❌ Error: "Missing Supabase environment variables"**

**Cause:** Environment variables not set in Vercel

**Fix:**
1. Go to Vercel Project → Settings → Environment Variables
2. Add `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`
3. Redeploy the project

---

### **❌ Images Not Showing**

**Cause:** Using absolute paths instead of imports

**Fix:** ✅ Already fixed in latest code! Just redeploy.

**Verify:**
```typescript
// ✅ CORRECT (what we have now)
import logoImage from '../assets/primary white variant logo.jpeg';
<img src={logoImage} alt="Logo" />

// ❌ WRONG (old way)
<img src="/src/assets/logo.jpeg" alt="Logo" />
```

---

### **❌ Build Failed**

**Check:**
1. Node version (needs 20.19+ or 22.12+)
2. All dependencies in `package.json`
3. No TypeScript errors: `npm run build` locally

**Fix:**
- Update Node version in Vercel settings
- Or add `.nvmrc` file: `echo "20" > .nvmrc`

---

### **❌ Database Errors After Deployment**

**Cause:** SQL scripts not run or RLS policies blocking

**Fix:**
1. Run all SQL scripts in order (see `database/README.md`)
2. Disable email confirmation in Supabase:
   - Go to Authentication → Providers → Email
   - Turn OFF "Confirm email"

---

### **❌ 404 on Page Refresh**

**Cause:** Vercel doesn't have SPA routing configured

**Fix:** Add `vercel.json`:
```json
{
  "rewrites": [
    { "source": "/(.*)", "destination": "/index.html" }
  ]
}
```

---

## 🔄 **Redeploying After Changes:**

### **Automatic Deployment:**
```bash
# Just push to GitHub
git add .
git commit -m "Your changes"
git push origin main

# Vercel auto-deploys! ✅
```

### **Manual Redeploy:**
1. Go to Vercel dashboard
2. Go to "Deployments"
3. Find latest deployment
4. Click "..." → "Redeploy"

---

## 📊 **Deployment Checklist:**

Before deploying:
- [ ] All SQL scripts run in Supabase
- [ ] Email confirmation disabled in Supabase
- [ ] Code pushed to GitHub
- [ ] `.env` file ready (for copying values)
- [ ] Images using ES6 imports (✅ already done)

During deployment:
- [ ] Connected GitHub repository
- [ ] Added `VITE_SUPABASE_URL` env var
- [ ] Added `VITE_SUPABASE_ANON_KEY` env var
- [ ] Build command: `npm run build`
- [ ] Output directory: `dist`

After deployment:
- [ ] Visit live URL
- [ ] Test logo/images visible
- [ ] Test sign up
- [ ] Test login
- [ ] Test booking
- [ ] Test admin access

---

## 🎉 **Success Indicators:**

Your deployment is successful when:

✅ Build completes without errors  
✅ All 4 image assets in build output  
✅ Home page shows logo and table images  
✅ Sign up/login works  
✅ Bookings can be created  
✅ Admin dashboard accessible  
✅ No console errors (F12)  

---

## 📞 **Still Having Issues?**

1. **Check Vercel Build Logs:**
   - Go to Deployments → Click deployment → View logs
   - Look for red error messages

2. **Check Browser Console:**
   - Press F12 → Console tab
   - Look for errors

3. **Check Supabase:**
   - Go to Supabase Dashboard → Logs
   - Check for database errors

4. **Environment Variables:**
   - Vercel Dashboard → Settings → Environment Variables
   - Verify both variables exist
   - Values should NOT have quotes around them

5. **Try Fresh Deploy:**
   ```bash
   # Delete node_modules
   rm -rf node_modules
   rm -rf dist
   
   # Fresh install
   npm install
   
   # Test build locally
   npm run build
   
   # If works locally, push to GitHub
   git push origin main
   ```

---

## 🚀 **Performance Tips:**

### **Enable Edge Functions:**
In `vercel.json`:
```json
{
  "rewrites": [
    { "source": "/(.*)", "destination": "/index.html" }
  ],
  "headers": [
    {
      "source": "/assets/(.*)",
      "headers": [
        {
          "key": "Cache-Control",
          "value": "public, max-age=31536000, immutable"
        }
      ]
    }
  ]
}
```

### **Enable Compression:**
Already enabled by default in Vercel ✅

### **Image Optimization:**
- Images are already optimized
- Consider WebP format for future updates

---

## 📈 **Monitoring Your Deployment:**

### **Vercel Analytics (Free):**
1. Go to your project in Vercel
2. Click "Analytics" tab
3. Enable analytics
4. See visitor stats, performance metrics

### **Supabase Monitoring:**
1. Go to Supabase Dashboard
2. Check "Reports" for database usage
3. Monitor API requests

---

## ✅ **You're All Set!**

Your SPINERGY app is now live with:
- ✅ All images working
- ✅ Full functionality
- ✅ Automatic deployments on git push
- ✅ Free hosting (Vercel + Supabase)

**Live URL:** `https://your-project-name.vercel.app`

---

**Need more help?** Check other docs in the `/docs` folder!

**Happy deploying! 🎉🏓**




