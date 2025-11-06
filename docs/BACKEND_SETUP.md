# 🚀 Backend Server Setup for WhatsApp Notifications

Quick guide to set up the backend server that sends WhatsApp notifications from your admin number.

---

## 📋 **Prerequisites**

- ✅ Node.js 18+ installed
- ✅ WhatsApp Business API access (see `WHATSAPP_INTEGRATION_GUIDE.md`)
- ✅ WhatsApp Access Token and Phone Number ID from Meta

---

## ⚡ **Quick Start (Local Development)**

### **Step 1: Set Up Backend Folder**

```bash
# Create a new folder for the backend
mkdir spinergy-backend
cd spinergy-backend

# Copy the backend files
cp ../smashzone-table-tennis/backend-server-example.js ./server.js
cp ../smashzone-table-tennis/backend-package.json ./package.json
cp ../smashzone-table-tennis/backend-.env.example ./.env
```

### **Step 2: Install Dependencies**

```bash
npm install
```

### **Step 3: Configure Environment Variables**

Edit `.env` file and add your WhatsApp credentials:

```env
PORT=3000
WHATSAPP_TOKEN=your_whatsapp_access_token_here
PHONE_NUMBER_ID=your_phone_number_id_here
ADMIN_PHONE=923413393533
```

**How to get these values:** See `WHATSAPP_INTEGRATION_GUIDE.md`

### **Step 4: Start the Server**

```bash
npm start
```

You should see:

```
🚀 ========================================
🏓 SPINERGY WhatsApp API Server
🚀 ========================================
✅ Server running on port 3000
📡 Endpoint: http://localhost:3000/api/send-whatsapp
🏥 Health Check: http://localhost:3000/api/health
🧪 Test WhatsApp: http://localhost:3000/api/test-whatsapp

📱 Admin Phone: 923413393533
🔑 Token configured: Yes ✅
🆔 Phone Number ID: Yes ✅
========================================
```

### **Step 5: Test the Server**

Open browser and visit: http://localhost:3000/api/test-whatsapp

This will send a test WhatsApp message to your admin number!

---

## 🌐 **Deploy to Production**

### **Option A: Deploy to Vercel** (Recommended - Free)

1. **Install Vercel CLI:**
```bash
npm i -g vercel
```

2. **Create `vercel.json`:**
```json
{
  "version": 2,
  "builds": [
    {
      "src": "server.js",
      "use": "@vercel/node"
    }
  ],
  "routes": [
    {
      "src": "/(.*)",
      "dest": "/server.js"
    }
  ],
  "env": {
    "WHATSAPP_TOKEN": "@whatsapp-token",
    "PHONE_NUMBER_ID": "@phone-number-id",
    "ADMIN_PHONE": "923413393533"
  }
}
```

3. **Deploy:**
```bash
vercel
```

4. **Set Environment Variables:**
```bash
vercel env add WHATSAPP_TOKEN
vercel env add PHONE_NUMBER_ID
```

5. **Get your deployment URL:**
```
https://your-project.vercel.app
```

---

### **Option B: Deploy to Railway** (Easy - Free tier)

1. Go to https://railway.app
2. Create new project
3. Connect GitHub repo or upload code
4. Add environment variables:
   - `WHATSAPP_TOKEN`
   - `PHONE_NUMBER_ID`
   - `ADMIN_PHONE`
5. Deploy!

Your API will be at: `https://your-app.railway.app/api/send-whatsapp`

---

### **Option C: Deploy to Render** (Free tier)

1. Go to https://render.com
2. Create new Web Service
3. Connect repo or upload code
4. Set environment variables
5. Deploy!

---

## 🔗 **Connect Frontend to Backend**

### **Update Frontend Environment Variables**

Create/edit `smashzone-table-tennis/.env`:

```env
# Supabase (existing)
VITE_SUPABASE_URL=https://mioxecluvalizougrstz.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key

# Backend API (NEW - add your deployed backend URL)
VITE_BACKEND_URL=https://your-backend.vercel.app/api/send-whatsapp
```

**For local development:**
```env
VITE_BACKEND_URL=http://localhost:3000/api/send-whatsapp
```

### **Restart Your Frontend**

```bash
# In smashzone-table-tennis folder
npm run dev
```

---

## ✅ **Testing End-to-End**

1. ✅ Backend server running (local or deployed)
2. ✅ Frontend `.env` has `VITE_BACKEND_URL` set
3. ✅ WhatsApp credentials configured
4. ✅ Make a test booking in your app
5. ✅ Check console logs
6. ✅ Check your admin WhatsApp - you should receive the notification!

---

## 🧪 **Test Endpoints**

### **1. Health Check**
```bash
curl http://localhost:3000/api/health
```

**Response:**
```json
{
  "status": "OK",
  "message": "SPINERGY WhatsApp API Server is running",
  "timestamp": "2025-10-31T12:00:00.000Z"
}
```

### **2. Test WhatsApp**
```bash
curl http://localhost:3000/api/test-whatsapp
```

**Response:**
```json
{
  "success": true,
  "message": "Test message sent! Check your WhatsApp.",
  "messageId": "wamid.xxx..."
}
```

### **3. Send Booking Notification**
```bash
curl -X POST http://localhost:3000/api/send-whatsapp \
  -H "Content-Type: application/json" \
  -d '{
    "booking": {
      "name": "Ahmed Khan",
      "phone": "03001234567",
      "table": "Table A (DC-700)",
      "date": "2025-11-01",
      "time": "5:00 PM - 6:00 PM",
      "duration": 60,
      "coaching": true
    }
  }'
```

---

## 📱 **Expected WhatsApp Message Format**

When a booking is made, the admin will receive:

```
🏓 *SPINERGY - New Booking*

👤 Player: Ahmed Khan
📱 Phone: 03001234567
🎯 Table: Table A (DC-700)
📅 Date: 2025-11-01
⏰ Time: 5:00 PM - 6:00 PM
⏱️ Duration: 60 minutes
👨‍🏫 Coaching: Yes ✅

_Booking confirmed! See you at SPINERGY! 🏓_
```

---

## 🛠️ **Troubleshooting**

### **Issue: "Token configured: No ❌"**
**Solution:** Add `WHATSAPP_TOKEN` to your `.env` file

### **Issue: "Phone Number ID: No ❌"**
**Solution:** Add `PHONE_NUMBER_ID` to your `.env` file

### **Issue: WhatsApp message not received**
**Solutions:**
1. Check if `ADMIN_PHONE` is in correct format (923413393533)
2. Verify your WhatsApp token is valid
3. Check Meta Business API status
4. Look at server logs for errors

### **Issue: CORS error in browser**
**Solution:** Backend has CORS enabled. If still getting errors, update CORS config:
```javascript
app.use(cors({
  origin: ['http://localhost:5173', 'https://your-frontend-domain.com']
}));
```

### **Issue: Backend API call fails from frontend**
**Solutions:**
1. Check if `VITE_BACKEND_URL` is set correctly
2. Restart frontend after changing `.env`
3. Check browser console for actual error
4. Verify backend is running and accessible

---

## 📊 **Architecture Flow**

```
User Books Slot (Frontend)
    ↓
Frontend calls sendWhatsAppNotification()
    ↓
POST request to backend API
    ↓
Backend receives booking data
    ↓
Backend formats WhatsApp message
    ↓
Backend calls WhatsApp Business API
    ↓
WhatsApp sends message to admin (03259898900)
    ↓
Admin receives notification ✅
```

---

## 🔐 **Security Best Practices**

1. ✅ Never commit `.env` file to Git
2. ✅ Use environment variables for all secrets
3. ✅ Enable rate limiting (add express-rate-limit)
4. ✅ Add API authentication for production
5. ✅ Use HTTPS for production deployment

---

## 📈 **Next Steps**

1. ✅ Set up WhatsApp Business API (see `WHATSAPP_INTEGRATION_GUIDE.md`)
2. ✅ Run backend locally and test
3. ✅ Deploy backend to Vercel/Railway/Render
4. ✅ Update frontend `.env` with backend URL
5. ✅ Make a test booking
6. ✅ Verify WhatsApp notification received!

---

## 💡 **Pro Tips**

- **Multiple Admins:** Modify server.js to send to multiple phone numbers
- **Database Logging:** Add code to log all notifications in Supabase
- **Email Fallback:** Add email notifications if WhatsApp fails
- **Monitoring:** Use services like Sentry or LogRocket
- **Rate Limiting:** Add rate limiting to prevent API abuse

---

## 🎉 **You're All Set!**

Once configured, every booking will automatically trigger a WhatsApp notification to your admin number. No user interaction required! 🚀

For detailed WhatsApp API setup, see `WHATSAPP_INTEGRATION_GUIDE.md`

