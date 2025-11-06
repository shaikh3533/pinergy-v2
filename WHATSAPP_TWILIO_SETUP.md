# 📱 WhatsApp Integration with Twilio - COMPLETE SETUP

## 🎯 **What You'll Get:**

✅ **Automatic WhatsApp messages** to customers after booking  
✅ **WhatsApp notifications** to admin/group  
✅ **Professional message templates**  
✅ **Fully working backend server**  

---

## ⚡ **QUICK SETUP (15 Minutes)**

### **Step 1: Create Twilio Account**

1. Go to [twilio.com/try-twilio](https://www.twilio.com/try-twilio)
2. Sign up (FREE $15 credit included!)
3. Verify your email and phone number

---

### **Step 2: Set Up WhatsApp Sandbox (For Testing)**

1. **Go to:** Twilio Console → Messaging → Try it out → Send a WhatsApp message
2. **You'll see:** A WhatsApp Sandbox number like `+1 415 523 8886`
3. **Copy the join code:** Something like `join <word>-<word>`
4. **Open WhatsApp** on your phone
5. **Send message to** `+1 415 523 8886` with the join code
6. **You'll receive:** "You are all set! Your sandbox is now active"

✅ **Sandbox is now active!**

---

### **Step 3: Get Your Twilio Credentials**

1. **Go to:** [Twilio Console](https://console.twilio.com)
2. **Copy these 3 things:**
   - **Account SID** → `AC...` (long string)
   - **Auth Token** → Click to reveal, copy it
   - **WhatsApp Number** → `whatsapp:+14155238886`

---

### **Step 4: Set Up Backend Server**

#### **Option A: Run Locally (For Testing)**

```bash
# Navigate to backend folder
cd backend

# Install dependencies
npm install

# Create .env file
# Copy env.example to .env and fill in your credentials
cp env.example .env

# Edit .env file with your Twilio credentials
# TWILIO_ACCOUNT_SID=ACxxxxxxxxxx
# TWILIO_AUTH_TOKEN=your_token
# TWILIO_WHATSAPP_NUMBER=whatsapp:+14155238886
# ADMIN_WHATSAPP_NUMBER=+923259898900

# Start the server
npm start
```

**You should see:**
```
🏓 SPINERGY WhatsApp Server Started!
📡 Server running on http://localhost:3001
✅ Health check: http://localhost:3001/health

Twilio Configuration:
  Account SID: ✅ Set
  Auth Token: ✅ Set
  WhatsApp Number: ✅ Set
```

---

#### **Option B: Deploy to Vercel/Railway (For Production)**

**Using Railway (Easiest):**

1. Go to [railway.app](https://railway.app)
2. Click "Start a New Project"
3. Select "Deploy from GitHub repo"
4. Connect your repository
5. Select `backend` folder
6. Add environment variables in Railway dashboard
7. Deploy!

**Your backend will be live at:** `https://your-app.railway.app`

---

### **Step 5: Update Frontend Environment Variable**

1. Create `.env` file in your frontend root (if not exists)
2. Add this line:

```env
VITE_BACKEND_URL=http://localhost:3001
```

**For production:**
```env
VITE_BACKEND_URL=https://your-backend.railway.app
```

---

### **Step 6: Test the Integration**

#### **Test 1: Health Check**

Open browser:
```
http://localhost:3001/health
```

Should return:
```json
{
  "status": "ok",
  "service": "SPINERGY WhatsApp Server",
  "timestamp": "2025-11-04T..."
}
```

---

#### **Test 2: Send Test WhatsApp**

**Using cURL:**

```bash
curl -X POST http://localhost:3001/api/send-whatsapp \
  -H "Content-Type: application/json" \
  -d '{
    "to": "+923259898900",
    "message": "🏓 Test message from SPINERGY! This is working! ✅",
    "type": "admin_notification"
  }'
```

**Using Postman:**
- Method: POST
- URL: `http://localhost:3001/api/send-whatsapp`
- Body (JSON):
```json
{
  "to": "+923259898900",
  "message": "🏓 Test message from SPINERGY! This is working! ✅",
  "type": "admin_notification"
}
```

---

#### **Test 3: Make a Real Booking**

1. Open your SPINERGY app
2. Go to Book page
3. Fill in details (use YOUR phone number)
4. Select a slot and book
5. **Check your WhatsApp!** 📱

You should receive:
```
✅ Booking Confirmed - SPINERGY

Hi [Your Name]! 👋

Your table booking has been confirmed:
...
```

---

## 🔧 **Troubleshooting:**

### **Error: "Account SID is required"**

❌ **Problem:** Environment variables not loaded

✅ **Fix:**
1. Make sure you created `.env` file in `backend/` folder
2. Copy from `env.example`
3. Fill in all values
4. Restart server: `npm start`

---

### **Error: "Authentication failed"**

❌ **Problem:** Wrong Account SID or Auth Token

✅ **Fix:**
1. Go to [Twilio Console](https://console.twilio.com)
2. Copy Account SID and Auth Token again
3. Update `.env` file
4. Make sure there are NO SPACES before/after values
5. Restart server

---

### **Error: "Destination phone number is not valid"**

❌ **Problem:** Phone number format wrong

✅ **Fix:** Phone numbers must be in format:
- ✅ `whatsapp:+923XXXXXXXXX` (for customer)
- ✅ `+923XXXXXXXXX` (server will add whatsapp: prefix)
- ❌ `03XXXXXXXXX` (missing country code)
- ❌ `923XXXXXXXXX` (missing + sign)

---

### **Error: "Unverified number"**

❌ **Problem:** In sandbox mode, you can only send to numbers that joined the sandbox

✅ **Fix:**
1. Each recipient must send join code to Twilio's number first
2. OR upgrade to production WhatsApp API (requires business verification)

---

### **Messages not appearing in WhatsApp group**

❌ **Problem:** WhatsApp API doesn't support sending to groups directly

✅ **Fix:** Messages are sent to admin number (+923259898900). Admin can manually forward to group, or use WhatsApp Business API with group support.

---

## 💰 **Pricing:**

### **Twilio WhatsApp Costs:**

- **Sandbox:** FREE (for testing, limited recipients)
- **Production:** 
  - Conversation-based pricing
  - ~$0.005 per message
  - ~PKR 1.5 per message
  - First 1,000 conversations/month FREE

**For 100 bookings/day:**
- 2 messages per booking (customer + admin) = 200 messages/day
- 200 × 30 = 6,000 messages/month
- Cost: ~$30/month (~PKR 8,400/month)

---

## 🚀 **Upgrade to Production WhatsApp API:**

### **When to upgrade:**
- You have more than 10 test users
- You want to send to any phone number
- You want branded sender name
- You need higher message limits

### **How to upgrade:**

1. **Go to:** [Twilio Console](https://console.twilio.com)
2. **Click:** Messaging → WhatsApp → Get started
3. **Follow steps:**
   - Business verification
   - Facebook Business Manager setup
   - WhatsApp Business Account creation
   - Template message approval
4. **Get production number:** `whatsapp:+1234567890`
5. **Update:** `.env` file with new number

**Processing time:** 1-2 weeks for approval

---

## 📊 **Backend API Endpoints:**

### **POST /api/send-whatsapp**

Send a single WhatsApp message.

**Request:**
```json
{
  "to": "+923XXXXXXXXX",
  "message": "Your message here",
  "type": "customer_confirmation"
}
```

**Response:**
```json
{
  "success": true,
  "messageId": "SM...",
  "status": "queued",
  "to": "whatsapp:+923XXXXXXXXX"
}
```

---

### **POST /api/send-whatsapp-bulk**

Send multiple WhatsApp messages at once.

**Request:**
```json
{
  "messages": [
    {
      "to": "+923411111111",
      "message": "Message 1"
    },
    {
      "to": "+923422222222",
      "message": "Message 2"
    }
  ]
}
```

**Response:**
```json
{
  "success": true,
  "totalSent": 2,
  "totalFailed": 0,
  "results": [...]
}
```

---

### **GET /api/whatsapp-status/:messageSid**

Check message delivery status.

**Request:**
```
GET /api/whatsapp-status/SMxxxxxxxxxxxx
```

**Response:**
```json
{
  "success": true,
  "status": "delivered",
  "to": "whatsapp:+923XXXXXXXXX",
  "dateSent": "2025-11-04T...",
  "errorCode": null
}
```

**Status values:**
- `queued` - Message queued for sending
- `sent` - Sent to WhatsApp
- `delivered` - Delivered to recipient ✅
- `read` - Read by recipient ✅✅
- `failed` - Failed to send ❌

---

## 🔐 **Security Best Practices:**

1. **Never commit `.env` file** to Git
2. **Use environment variables** for all secrets
3. **Enable rate limiting** in production
4. **Validate phone numbers** before sending
5. **Log all messages** for debugging
6. **Use HTTPS** in production
7. **Add API authentication** (optional)

---

## 📁 **Files Created:**

✅ `backend/whatsapp-server.js` - Complete working server  
✅ `backend/package.json` - Dependencies  
✅ `backend/env.example` - Configuration template  
✅ `src/utils/whatsappNotification.ts` - Frontend integration  

---

## ✅ **Verification Checklist:**

Before going live, verify:

- [ ] Twilio account created and verified
- [ ] WhatsApp sandbox activated
- [ ] Backend server running without errors
- [ ] Test message sent successfully
- [ ] Customer receives confirmation WhatsApp
- [ ] Admin receives notification WhatsApp
- [ ] Messages are formatted correctly
- [ ] Phone numbers are validated
- [ ] Error handling works
- [ ] Logs are being recorded

---

## 🎉 **You're Done!**

Your WhatsApp integration is now complete and working!

**Test it:**
1. Make a booking on your app
2. Check customer's WhatsApp ✅
3. Check admin's WhatsApp ✅
4. Celebrate! 🎊

---

## 📞 **Need Help?**

**Common Issues:**
- Check Twilio Console → Monitor → Logs → Errors
- Verify phone number format
- Make sure sandbox join code was sent
- Check server is running: `http://localhost:3001/health`
- Review console logs for detailed errors

**Twilio Support:**
- [Twilio Documentation](https://www.twilio.com/docs/whatsapp)
- [Twilio Support](https://support.twilio.com)
- [WhatsApp Business API Guide](https://www.twilio.com/docs/whatsapp/api)

---

**Your WhatsApp notifications are now fully functional!** 📱✨


