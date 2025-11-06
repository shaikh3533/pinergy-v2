// SPINERGY WhatsApp Notification Server
// This is a simple Express.js server that sends WhatsApp notifications
// using WhatsApp Business Cloud API

const express = require('express');
const axios = require('axios');
const cors = require('cors');
require('dotenv').config();

const app = express();
app.use(express.json());
app.use(cors());

// ============================================
// CONFIGURATION - Update these values
// ============================================

const WHATSAPP_TOKEN = process.env.WHATSAPP_TOKEN || 'YOUR_ACCESS_TOKEN_HERE';
const PHONE_NUMBER_ID = process.env.PHONE_NUMBER_ID || 'YOUR_PHONE_NUMBER_ID_HERE';
const ADMIN_PHONE = process.env.ADMIN_PHONE || '923259898900';

// WhatsApp API endpoint
const WHATSAPP_API_URL = `https://graph.facebook.com/v18.0/${PHONE_NUMBER_ID}/messages`;

// ============================================
// SEND WHATSAPP NOTIFICATION ENDPOINT
// ============================================

app.post('/api/send-whatsapp', async (req, res) => {
  try {
    const { message, booking } = req.body;

    // Validate request
    if (!message && !booking) {
      return res.status(400).json({
        success: false,
        error: 'Message or booking data is required',
      });
    }

    // Format the WhatsApp message
    const whatsappMessage = message || formatBookingMessage(booking);

    console.log('📤 Sending WhatsApp notification...');
    console.log('To:', ADMIN_PHONE);
    console.log('Message:', whatsappMessage);

    // Send message via WhatsApp Business API
    const response = await axios.post(
      WHATSAPP_API_URL,
      {
        messaging_product: 'whatsapp',
        recipient_type: 'individual',
        to: ADMIN_PHONE,
        type: 'text',
        text: {
          preview_url: false,
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

    console.log('✅ WhatsApp message sent successfully!');
    console.log('Message ID:', response.data.messages[0].id);

    res.json({
      success: true,
      messageId: response.data.messages[0].id,
      message: 'WhatsApp notification sent successfully',
    });
  } catch (error) {
    console.error('❌ WhatsApp send failed:');
    console.error(error.response?.data || error.message);

    res.status(500).json({
      success: false,
      error: error.response?.data?.error?.message || error.message,
      details: error.response?.data,
    });
  }
});

// ============================================
// HELPER FUNCTION - Format Booking Message
// ============================================

function formatBookingMessage(booking) {
  if (!booking) return '';

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

// ============================================
// HEALTH CHECK ENDPOINT
// ============================================

app.get('/api/health', (req, res) => {
  res.json({
    status: 'OK',
    message: 'SPINERGY WhatsApp API Server is running',
    timestamp: new Date().toISOString(),
  });
});

// ============================================
// TEST ENDPOINT - For testing WhatsApp integration
// ============================================

app.get('/api/test-whatsapp', async (req, res) => {
  try {
    const testMessage = '🏓 *SPINERGY Test*\n\nThis is a test message from your booking system. WhatsApp integration is working! ✅';

    const response = await axios.post(
      WHATSAPP_API_URL,
      {
        messaging_product: 'whatsapp',
        to: ADMIN_PHONE,
        type: 'text',
        text: { body: testMessage },
      },
      {
        headers: {
          Authorization: `Bearer ${WHATSAPP_TOKEN}`,
          'Content-Type': 'application/json',
        },
      }
    );

    res.json({
      success: true,
      message: 'Test message sent! Check your WhatsApp.',
      messageId: response.data.messages[0].id,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.response?.data || error.message,
    });
  }
});

// ============================================
// START SERVER
// ============================================

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log('');
  console.log('🚀 ========================================');
  console.log('🏓 SPINERGY WhatsApp API Server');
  console.log('🚀 ========================================');
  console.log(`✅ Server running on port ${PORT}`);
  console.log(`📡 Endpoint: http://localhost:${PORT}/api/send-whatsapp`);
  console.log(`🏥 Health Check: http://localhost:${PORT}/api/health`);
  console.log(`🧪 Test WhatsApp: http://localhost:${PORT}/api/test-whatsapp`);
  console.log('');
  console.log('📱 Admin Phone:', ADMIN_PHONE);
  console.log('🔑 Token configured:', WHATSAPP_TOKEN ? 'Yes ✅' : 'No ❌ (Please set WHATSAPP_TOKEN)');
  console.log('🆔 Phone Number ID:', PHONE_NUMBER_ID !== 'YOUR_PHONE_NUMBER_ID_HERE' ? 'Yes ✅' : 'No ❌ (Please set PHONE_NUMBER_ID)');
  console.log('');
  console.log('📖 See WHATSAPP_INTEGRATION_GUIDE.md for setup instructions');
  console.log('========================================');
  console.log('');
});

// ============================================
// EXPORT FOR VERCEL/NETLIFY
// ============================================

module.exports = app;

