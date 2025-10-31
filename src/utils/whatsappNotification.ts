export interface BookingNotification {
  name: string;
  table: string;
  duration: number;
  date: string;
  startTime: string;
  endTime: string;
  dayOfWeek: string;
  coaching: boolean;
  phone?: string;
}

export const sendWhatsAppNotification = async (
  booking: BookingNotification
): Promise<void> => {
  // Format WhatsApp message
  const message = `🏓 *SPINERGY - New Booking*\n\n` +
    `👤 Player: ${booking.name}\n` +
    `📱 Phone: ${booking.phone || 'Not provided'}\n` +
    `🎯 Table: ${booking.table}\n` +
    `📅 Date: ${booking.date} (${booking.dayOfWeek})\n` +
    `⏰ Time: ${booking.startTime} - ${booking.endTime}\n` +
    `⏱️ Duration: ${booking.duration} minutes\n` +
    `👨‍🏫 Coaching: ${booking.coaching ? 'Yes ✅' : 'No ❌'}\n\n` +
    `_Booking confirmed! See you at SPINERGY! 🏓_`;

  try {
    // Admin phone number (SPINERGY company number)
    const adminPhone = '923413393533';
    // WhatsApp Group ID (from invite link)
    const groupId = 'JCxLLXGZMSrBjoMSmpBq8m';
    
    console.log('📤 WhatsApp Notification Prepared:', message);
    
    // ⚠️ IMPORTANT: To send WhatsApp messages automatically from your server,
    // you need to integrate WhatsApp Business API.
    // See WHATSAPP_INTEGRATION_GUIDE.md for setup instructions.
    
    // Option 1: WhatsApp Business Cloud API (Official, Free)
    // Option 2: Twilio WhatsApp API (Paid, Easy setup)
    // Option 3: WhatsApp Business API via Meta (Official)
    
    // For now, we'll send to your backend API endpoint
    // Your backend should handle the actual WhatsApp sending
    const backendUrl = import.meta.env.VITE_BACKEND_URL || '/api/send-whatsapp';
    
    const response = await fetch(backendUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        to: adminPhone,
        groupId: groupId,
        message: message,
        booking: {
          name: booking.name,
          phone: booking.phone,
          table: booking.table,
          date: booking.date,
          time: `${booking.startTime} - ${booking.endTime}`,
          duration: booking.duration,
          coaching: booking.coaching,
        },
      }),
    });

    if (!response.ok) {
      throw new Error('Backend API not available - WhatsApp not sent');
    }

    const result = await response.json();
    console.log('✅ WhatsApp notification sent:', result);
    
  } catch (error) {
    console.error('⚠️ WhatsApp notification failed:', error);
    console.log('💡 To enable WhatsApp notifications, set up WhatsApp Business API');
    console.log('📖 See WHATSAPP_INTEGRATION_GUIDE.md for instructions');
    
    // Log the message that would have been sent
    console.log('Message that should be sent to WhatsApp group:', message);
    
    // Don't throw error - notification failure shouldn't block booking
    // The booking is still successful even if WhatsApp fails
  }
};

