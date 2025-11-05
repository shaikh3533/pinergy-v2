/**
 * SMS Notification Service
 * Using Twilio, SMS API, or similar service
 */

export interface SMSData {
  to: string;
  message: string;
}

/**
 * Send SMS to customer
 * Requires backend API integration with Twilio/SMS provider
 */
export const sendCustomerSMS = async (data: SMSData): Promise<void> => {
  try {
    const backendUrl = import.meta.env.VITE_BACKEND_URL || '/api/send-sms';
    
    // Format phone number (add +92 country code if not present)
    let phoneNumber = data.to.replace(/\D/g, ''); // Remove non-digits
    if (phoneNumber.startsWith('0')) {
      phoneNumber = '+92' + phoneNumber.substring(1);
    } else if (!phoneNumber.startsWith('92')) {
      phoneNumber = '+92' + phoneNumber;
    } else {
      phoneNumber = '+' + phoneNumber;
    }
    
    console.log('📤 SMS Notification Prepared:', {
      to: phoneNumber,
      message: data.message,
    });
    
    const response = await fetch(backendUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        to: phoneNumber,
        message: data.message,
        type: 'booking_confirmation',
      }),
    });

    if (!response.ok) {
      throw new Error('Backend API not available - SMS not sent');
    }

    const result = await response.json();
    console.log('✅ SMS sent successfully:', result);
    
  } catch (error) {
    console.error('⚠️ SMS notification failed:', error);
    console.log('💡 To enable SMS notifications, set up Twilio or SMS provider');
    console.log('Message that should be sent:', data.message);
    // Don't throw error - SMS failure shouldn't block booking
  }
};

/**
 * Generate booking confirmation SMS text
 */
export const generateBookingSMS = (data: {
  name: string;
  table: string;
  date: string;
  startTime: string;
  endTime: string;
  totalPrice: number;
}): string => {
  return `✅ SPINERGY Booking Confirmed!\n` +
    `${data.name}\n` +
    `Table: ${data.table}\n` +
    `Date: ${data.date}\n` +
    `Time: ${data.startTime}-${data.endTime}\n` +
    `Total: PKR ${data.totalPrice}\n\n` +
    `Location: Suny Park, Lahore\n` +
    `Ph: 03413393533\n` +
    `See you! 🏓`;
};

