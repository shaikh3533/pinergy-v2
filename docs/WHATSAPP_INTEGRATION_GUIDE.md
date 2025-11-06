# 📱 WhatsApp Business API Integration Guide

This guide will help you set up automatic WhatsApp notifications from your **SPINERGY admin number (03259898900)** to your WhatsApp group when bookings are made.

---

## 🎯 Goal

Send WhatsApp messages **automatically from your server** (not from user's device) when:
- A new booking is created
- Message sent FROM admin number (03259898900)
- Message sent TO WhatsApp group (JCxLLXGZMSrBjoMSmpBq8m)

---

## 📋 What You Need

1. ✅ WhatsApp Business Account (for admin number 03259898900)
2. ✅ WhatsApp Business API access (we'll set this up)
3. ✅ A backend server (Node.js/Python/PHP) to handle API calls
4. ✅ Meta/Facebook Business Account (for official API)

---

## 🚀 **Best Options for WhatsApp Integration**

### **Option 1: WhatsApp Business Cloud API** ⭐ (Recommended - Free)

**Pros:**
- ✅ Official Meta/WhatsApp API
- ✅ **FREE** (up to 1000 messages/month)
- ✅ Most reliable
- ✅ Can send to groups

**Cons:**
- ⚠️ Requires Meta Business verification
- ⚠️ Setup takes 1-2 hours
- ⚠️ Need to create a Facebook App

---

### **Option 2: Twilio WhatsApp API** (Easiest)

**Pros:**
- ✅ Very easy setup (15 minutes)
- ✅ Great documentation
- ✅ Reliable service
- ✅ Pre-approved WhatsApp number

**Cons:**
- ⚠️ Paid service ($0.005-0.01 per message)
- ⚠️ Can't directly send to groups
- ⚠️ Need Twilio account

---

### **Option 3: Third-Party Services** (Quick but Limited)

Services like WATI, Interakt, Aisensy, CallMeBot

**Pros:**
- ✅ Very quick setup
- ✅ User-friendly dashboard
- ✅ No coding for basic features

**Cons:**
- ⚠️ Monthly subscription fees
- ⚠️ Limited customization
- ⚠️ May have restrictions

---

## 📖 **Option 1: WhatsApp Business Cloud API Setup** (RECOMMENDED)

### **Step 1: Create Meta/Facebook Business Account**

1. Go to https://business.facebook.com
2. Click **"Create Account"**
3. Enter your business details (SPINERGY)
4. Verify your business

### **Step 2: Create a Meta App**

1. Go to https://developers.facebook.com
2. Click **"My Apps"** → **"Create App"**
3. Select **"Business"** as app type
4. Enter app name: "SPINERGY Booking System"
5. Click **"Create App"**

### **Step 3: Add WhatsApp Product**

1. In your app dashboard, click **"Add Product"**
2. Find **"WhatsApp"** and click **"Set Up"**
3. Click **"Start Using the API"**

### **Step 4: Get Test Phone Number & API Token**

1. You'll get a **Test Phone Number** from Meta
2. Copy the **Temporary Access Token**
3. Add your admin number (03259898900) as a recipient

### **Step 5: Verify Your Business Phone Number**

1. Click **"Phone Numbers"** in WhatsApp settings
2. Click **"Add Phone Number"**
3. Enter: **+92 341 3393533**
4. Verify via SMS/Call
5. This becomes your **sender number**

### **Step 6: Get Permanent Access Token**

1. Go to **Settings** → **Business Settings**
2. Click **"System Users"** → **"Add"**
3. Create a system user: "SPINERGY API"
4. Assign **"WhatsApp Business Management"** permission
5. Generate a **Permanent Token** (save this securely!)

### **Step 7: Get WhatsApp Business Account ID**

1. In WhatsApp settings, copy your **WhatsApp Business Account ID**
2. Copy your **Phone Number ID**

---

## 💻 **Backend Implementation (Node.js Example)**

Create a simple backend API to send WhatsApp messages:

### **File: `server.js`** (Node.js/Express)

```javascript
const express = require('express');
const axios = require('axios');
const cors = require('cors');

const app = express();
app.use(express.json());
app.use(cors());

// WhatsApp Cloud API Configuration
const WHATSAPP_TOKEN = 'YOUR_PERMANENT_ACCESS_TOKEN_HERE'; // From Step 6
const PHONE_NUMBER_ID = 'YOUR_PHONE_NUMBER_ID_HERE'; // From Step 7
const WHATSAPP_API_URL = `https://graph.facebook.com/v18.0/${PHONE_NUMBER_ID}/messages`;

// Admin WhatsApp Group ID
const ADMIN_GROUP_ID = 'JCxLLXGZMSrBjoMSmpBq8m';

// Endpoint to send WhatsApp notifications
app.post('/api/send-whatsapp', async (req, res) => {
  try {
    const { message, booking } = req.body;

    // Format message for WhatsApp
    const whatsappMessage = message || formatBookingMessage(booking);

    // Send to WhatsApp Group
    const response = await axios.post(
      WHATSAPP_API_URL,
      {
        messaging_product: 'whatsapp',
        to: '923259898900', // Your admin number
        type: 'text',
        text: {
          body: whatsappMessage,
        },
      },
      {
        headers: {
          Authorization: `Bearer ${WHATSAPP_TOKEN}`,
          'Content-Type': 'application/json',
        },
      }
    );

    console.log('✅ WhatsApp message sent:', response.data);

    res.json({
      success: true,
      messageId: response.data.messages[0].id,
      message: 'WhatsApp notification sent successfully',
    });
  } catch (error) {
    console.error('❌ WhatsApp send failed:', error.response?.data || error.message);
    res.status(500).json({
      success: false,
      error: error.response?.data || error.message,
    });
  }
});

function formatBookingMessage(booking) {
  return `🏓 *SPINERGY - New Booking*\n\n` +
    `👤 Player: ${booking.name}\n` +
    `📱 Phone: ${booking.phone || 'Not provided'}\n` +
    `🎯 Table: ${booking.table}\n` +
    `📅 Date: ${booking.date}\n` +
    `⏰ Time: ${booking.time}\n` +
    `⏱️ Duration: ${booking.duration} minutes\n` +
    `👨‍🏫 Coaching: ${booking.coaching ? 'Yes ✅' : 'No ❌'}\n\n` +
    `_Booking confirmed! See you at SPINERGY! 🏓_`;
}

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 WhatsApp API server running on port ${PORT}`);
});
```

### **Install Dependencies:**

```bash
npm install express axios cors
```

### **Run the Server:**

```bash
node server.js
```

---

## 📱 **Sending to WhatsApp Groups**

⚠️ **Important:** WhatsApp Business API **cannot directly send messages to groups** using the group invite link.

### **Workarounds:**

#### **Option A: Send to Admin Number (Recommended)**
Send the message to your admin number (03259898900), and you manually forward it to the group.

#### **Option B: Send to Multiple Recipients**
Send individual messages to all group members.

```javascript
// Send to multiple admin numbers
const adminNumbers = ['923259898900', '923001234567'];
for (const number of adminNumbers) {
  await sendWhatsAppMessage(number, message);
}
```

#### **Option C: Use WhatsApp Business App API**
Use unofficial libraries like `whatsapp-web.js` (requires keeping WhatsApp Web session active).

---

## 🔧 **Option 2: Twilio WhatsApp API** (Easiest for Testing)

### **Step 1: Create Twilio Account**

1. Go to https://www.twilio.com/try-twilio
2. Sign up (free trial with $15 credit)
3. Verify your phone number

### **Step 2: Get WhatsApp Sandbox**

1. In Twilio Console, go to **"Messaging"** → **"Try it out"** → **"Send a WhatsApp message"**
2. Follow instructions to join the sandbox
3. Send the code to Twilio's WhatsApp number

### **Step 3: Get Credentials**

1. Copy your **Account SID**
2. Copy your **Auth Token**
3. Copy your **WhatsApp Number** (starts with `whatsapp:+14155238886`)

### **Backend Code (Node.js + Twilio):**

```javascript
const express = require('express');
const twilio = require('twilio');

const app = express();
app.use(express.json());

const accountSid = 'YOUR_TWILIO_ACCOUNT_SID';
const authToken = 'YOUR_TWILIO_AUTH_TOKEN';
const client = twilio(accountSid, authToken);

app.post('/api/send-whatsapp', async (req, res) => {
  try {
    const { message, booking } = req.body;

    const whatsappMessage = message || formatBookingMessage(booking);

    // Send WhatsApp message via Twilio
    const messageResponse = await client.messages.create({
      from: 'whatsapp:+14155238886', // Twilio WhatsApp number
      to: 'whatsapp:+923259898900', // Your admin number
      body: whatsappMessage,
    });

    res.json({
      success: true,
      messageId: messageResponse.sid,
    });
  } catch (error) {
    console.error('Twilio error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

app.listen(3000, () => console.log('Server running on port 3000'));
```

**Install:**
```bash
npm install twilio express
```

---

## 🌐 **Deploy Your Backend**

### **Option A: Vercel (Free)**

1. Create `vercel.json`:
```json
{
  "version": 2,
  "builds": [{ "src": "server.js", "use": "@vercel/node" }],
  "routes": [{ "src": "/(.*)", "dest": "/server.js" }]
}
```

2. Deploy:
```bash
npm i -g vercel
vercel
```

### **Option B: Netlify Functions**

1. Create `netlify/functions/send-whatsapp.js`
2. Deploy to Netlify

### **Option C: Railway/Render (Free)**

Deploy your Node.js app to Railway or Render.

---

## 🔗 **Connect Frontend to Backend**

### **Update `.env` file:**

```env
VITE_SUPABASE_URL=https://mioxecluvalizougrstz.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
VITE_BACKEND_URL=https://your-backend-url.vercel.app/api/send-whatsapp
```

---

## ✅ **Testing the Integration**

1. Make a test booking in your app
2. Check the browser console for logs
3. Check your backend server logs
4. Check your admin WhatsApp (03259898900)
5. You should receive the booking notification!

---

## 🎯 **Expected Flow:**

```
User Books Slot
    ↓
Frontend calls sendWhatsAppNotification()
    ↓
Frontend sends POST to /api/send-whatsapp
    ↓
Backend receives request
    ↓
Backend calls WhatsApp Business API
    ↓
WhatsApp sends message to admin number (03259898900)
    ↓
Admin receives notification on WhatsApp ✅
    ↓
Admin forwards to group manually (or set up auto-forward)
```

---

## 💡 **Quick Start (For Testing)**

### **Temporary Solution: Email Notifications**

While setting up WhatsApp API (which takes time), use **email notifications** immediately:

Create `src/utils/emailNotification.ts`:

```typescript
export const sendEmailNotification = async (booking: any) => {
  try {
    await fetch('https://api.emailjs.com/api/v1.0/email/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        service_id: 'YOUR_SERVICE_ID',
        template_id: 'YOUR_TEMPLATE_ID',
        user_id: 'YOUR_PUBLIC_KEY',
        template_params: {
          to_email: 'spinergy.bookings@gmail.com',
          player_name: booking.name,
          player_phone: booking.phone,
          table: booking.table,
          date: booking.date,
          time: `${booking.startTime} - ${booking.endTime}`,
          coaching: booking.coaching ? 'Yes' : 'No',
        },
      }),
    });
  } catch (error) {
    console.error('Email notification failed:', error);
  }
};
```

**Setup EmailJS** (Free):
1. Go to https://www.emailjs.com
2. Create account
3. Add email service (Gmail)
4. Create email template
5. Get credentials

---

## 📞 **Need Help?**

- **WhatsApp Business API Docs:** https://developers.facebook.com/docs/whatsapp
- **Twilio WhatsApp Docs:** https://www.twilio.com/docs/whatsapp
- **Meta Business Help:** https://business.facebook.com/help

---

## 🎉 **Summary**

1. ✅ WhatsApp notifications no longer open on user's device
2. ✅ Messages sent from your backend server
3. ✅ Use WhatsApp Business Cloud API (free) or Twilio (paid)
4. ✅ Deploy backend to Vercel/Netlify/Railway
5. ✅ Messages sent FROM admin number TO admin WhatsApp
6. ✅ You can forward to group or set up multiple recipients

For immediate testing, use **Email Notifications** while setting up WhatsApp API! 📧

