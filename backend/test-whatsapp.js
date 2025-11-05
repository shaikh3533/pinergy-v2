// Test script for WhatsApp notifications
// Usage: node test-whatsapp.js

require('dotenv').config();
const twilio = require('twilio');

const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const twilioWhatsAppNumber = process.env.TWILIO_WHATSAPP_NUMBER;
const adminNumber = process.env.ADMIN_WHATSAPP_NUMBER || '+923413393533';

console.log('🧪 Testing Twilio WhatsApp Integration\n');

// Check configuration
console.log('Configuration Check:');
console.log('  Account SID:', accountSid ? `✅ ${accountSid.substring(0, 10)}...` : '❌ Missing');
console.log('  Auth Token:', authToken ? '✅ Set' : '❌ Missing');
console.log('  WhatsApp Number:', twilioWhatsAppNumber || '❌ Missing');
console.log('  Admin Number:', adminNumber);
console.log('');

if (!accountSid || !authToken || !twilioWhatsAppNumber) {
  console.error('❌ Error: Missing Twilio configuration!');
  console.log('Please set the following environment variables in .env file:');
  console.log('  - TWILIO_ACCOUNT_SID');
  console.log('  - TWILIO_AUTH_TOKEN');
  console.log('  - TWILIO_WHATSAPP_NUMBER');
  process.exit(1);
}

const client = twilio(accountSid, authToken);

async function sendTestMessage() {
  try {
    console.log('📤 Sending test WhatsApp message...\n');

    const testMessage = `🏓 *SPINERGY Test Message*\n\n` +
      `This is a test message from your WhatsApp integration!\n\n` +
      `✅ If you're reading this, WhatsApp is working correctly!\n\n` +
      `_Sent at: ${new Date().toLocaleString()}_`;

    // Format recipient number
    let recipient = adminNumber;
    if (!recipient.startsWith('whatsapp:')) {
      if (!recipient.startsWith('+')) {
        if (recipient.startsWith('0')) {
          recipient = '+92' + recipient.substring(1);
        } else if (recipient.startsWith('92')) {
          recipient = '+' + recipient;
        } else {
          recipient = '+92' + recipient;
        }
      }
      recipient = 'whatsapp:' + recipient;
    }

    console.log('Sending to:', recipient);
    console.log('From:', twilioWhatsAppNumber);
    console.log('Message:', testMessage.substring(0, 50) + '...\n');

    const message = await client.messages.create({
      body: testMessage,
      from: twilioWhatsAppNumber,
      to: recipient,
    });

    console.log('✅ SUCCESS! Message sent!\n');
    console.log('Message Details:');
    console.log('  SID:', message.sid);
    console.log('  Status:', message.status);
    console.log('  To:', message.to);
    console.log('  From:', message.from);
    console.log('  Date Created:', message.dateCreated);
    console.log('');
    console.log('📱 Check your WhatsApp now!');
    console.log('');

  } catch (error) {
    console.error('❌ ERROR:', error.message);
    console.error('');
    
    if (error.code === 20003) {
      console.log('💡 Authentication failed. Please check:');
      console.log('   - Account SID is correct');
      console.log('   - Auth Token is correct');
      console.log('   - No extra spaces in .env file');
    } else if (error.code === 21211) {
      console.log('💡 Invalid phone number. Please check:');
      console.log('   - Number format: +923XXXXXXXXX');
      console.log('   - Recipient joined sandbox (sent join code)');
    } else if (error.code === 21608) {
      console.log('💡 Unverified number. The recipient must:');
      console.log('   1. Send the join code to ' + twilioWhatsAppNumber);
      console.log('   2. Wait for confirmation from Twilio');
      console.log('   3. Then try again');
    } else {
      console.log('💡 Error details:');
      console.log('   Code:', error.code);
      console.log('   More info:', error.moreInfo);
    }
    
    process.exit(1);
  }
}

// Run the test
sendTestMessage();


