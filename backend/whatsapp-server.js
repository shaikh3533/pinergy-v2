// WhatsApp Backend Server using Twilio
// Complete working implementation

const express = require('express');
const cors = require('cors');
const twilio = require('twilio');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Twilio Configuration
const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const twilioWhatsAppNumber = process.env.TWILIO_WHATSAPP_NUMBER; // e.g., 'whatsapp:+14155238886'

const client = twilio(accountSid, authToken);

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    service: 'SPINERGY WhatsApp Server',
    timestamp: new Date().toISOString() 
  });
});

// Send WhatsApp message endpoint
app.post('/api/send-whatsapp', async (req, res) => {
  try {
    const { to, message, type, groupId, booking } = req.body;

    console.log('📨 Received WhatsApp request:', {
      to,
      type,
      messageLength: message?.length,
    });

    // Validate required fields
    if (!to || !message) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: to, message',
      });
    }

    // Format phone number for WhatsApp
    let recipientNumber = to;
    
    // If it's a customer confirmation, format their number
    if (type === 'customer_confirmation') {
      // Ensure number starts with whatsapp: prefix
      if (!recipientNumber.startsWith('whatsapp:')) {
        // Add country code if not present
        if (!recipientNumber.startsWith('+')) {
          // For Pakistan numbers
          if (recipientNumber.startsWith('92')) {
            recipientNumber = '+' + recipientNumber;
          } else if (recipientNumber.startsWith('0')) {
            recipientNumber = '+92' + recipientNumber.substring(1);
          } else {
            recipientNumber = '+92' + recipientNumber;
          }
        }
        recipientNumber = 'whatsapp:' + recipientNumber;
      }
    } else {
      // For admin notifications, use admin number
      const adminNumber = process.env.ADMIN_WHATSAPP_NUMBER || '+923413393533';
      if (!adminNumber.startsWith('whatsapp:')) {
        recipientNumber = 'whatsapp:' + adminNumber;
      } else {
        recipientNumber = adminNumber;
      }
    }

    console.log('📱 Sending WhatsApp to:', recipientNumber);

    // Send WhatsApp message via Twilio
    const twilioMessage = await client.messages.create({
      body: message,
      from: twilioWhatsAppNumber,
      to: recipientNumber,
    });

    console.log('✅ WhatsApp sent successfully:', twilioMessage.sid);

    // Log to database (optional - you can add Supabase logging here)
    
    res.json({
      success: true,
      messageId: twilioMessage.sid,
      status: twilioMessage.status,
      to: recipientNumber,
      type: type || 'notification',
    });

  } catch (error) {
    console.error('❌ WhatsApp send error:', error);
    
    res.status(500).json({
      success: false,
      error: error.message,
      code: error.code,
      details: error.moreInfo || 'No additional details',
    });
  }
});

// Send bulk WhatsApp messages
app.post('/api/send-whatsapp-bulk', async (req, res) => {
  try {
    const { messages } = req.body; // Array of {to, message} objects

    if (!Array.isArray(messages) || messages.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'messages must be a non-empty array',
      });
    }

    const results = [];
    
    for (const msg of messages) {
      try {
        const result = await client.messages.create({
          body: msg.message,
          from: twilioWhatsAppNumber,
          to: msg.to,
        });
        
        results.push({
          to: msg.to,
          success: true,
          messageId: result.sid,
        });
      } catch (error) {
        results.push({
          to: msg.to,
          success: false,
          error: error.message,
        });
      }
      
      // Rate limiting: wait 100ms between messages
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    res.json({
      success: true,
      totalSent: results.filter(r => r.success).length,
      totalFailed: results.filter(r => !r.success).length,
      results,
    });

  } catch (error) {
    console.error('❌ Bulk WhatsApp error:', error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

// Get message status
app.get('/api/whatsapp-status/:messageSid', async (req, res) => {
  try {
    const { messageSid } = req.params;
    
    const message = await client.messages(messageSid).fetch();
    
    res.json({
      success: true,
      status: message.status,
      to: message.to,
      from: message.from,
      dateSent: message.dateSent,
      errorCode: message.errorCode,
      errorMessage: message.errorMessage,
    });
  } catch (error) {
    console.error('❌ Status check error:', error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

// Error handling middleware
app.use((error, req, res, next) => {
  console.error('Server error:', error);
  res.status(500).json({
    success: false,
    error: 'Internal server error',
    message: error.message,
  });
});

// Start server
app.listen(PORT, () => {
  console.log('🏓 SPINERGY WhatsApp Server Started!');
  console.log(`📡 Server running on http://localhost:${PORT}`);
  console.log(`✅ Health check: http://localhost:${PORT}/health`);
  console.log('');
  console.log('Twilio Configuration:');
  console.log(`  Account SID: ${accountSid ? '✅ Set' : '❌ Missing'}`);
  console.log(`  Auth Token: ${authToken ? '✅ Set' : '❌ Missing'}`);
  console.log(`  WhatsApp Number: ${twilioWhatsAppNumber || '❌ Missing'}`);
  console.log('');
  
  if (!accountSid || !authToken || !twilioWhatsAppNumber) {
    console.warn('⚠️  WARNING: Missing Twilio configuration!');
    console.warn('   Please set environment variables in .env file');
  }
});

module.exports = app;


