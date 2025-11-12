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
  price?: number;
  totalSlots?: number;
  totalPrice?: number;
  allSlots?: Array<{
    date: string;
    time: string;
    endTime: string;
    dayOfWeek: string;
  }>;
}

/**
 * Send WhatsApp notification to ADMIN about new booking
 * Opens WhatsApp Web/App directly with pre-filled message
 */
export const sendAdminWhatsAppNotification = async (
  booking: BookingNotification
): Promise<void> => {
  // Format admin WhatsApp message (SHORT VERSION)
  let message = `🎯 *NEW BOOKING*\n\n`;
  message += `👤 *Player:* ${booking.name}\n`;
  message += `🏓 *Table:* ${booking.table}\n`;
  message += `📅 *Date:* ${booking.date} (${booking.dayOfWeek})\n`;
  
  // Show all time slots if multiple slots are booked
  if (booking.allSlots && booking.allSlots.length > 1) {
    message += `⏰ *Slots:*\n`;
    booking.allSlots.forEach((slot, index) => {
      message += `   ${index + 1}. ${slot.time} - ${slot.endTime}\n`;
    });
  } else {
    message += `⏰ *Time:* ${booking.startTime} - ${booking.endTime}\n`;
  }

  try {
    // Admin phone number (SPINERGY company number)
    const adminPhone = '923259898900';
    
    console.log('📤 Admin WhatsApp Notification Prepared:', message);
    console.log('📱 Opening WhatsApp for admin:', adminPhone);
    
    // DIRECT WHATSAPP URL - Opens WhatsApp Web/App with pre-filled message
    const whatsappURL = `https://wa.me/${adminPhone}?text=${encodeURIComponent(message)}`;
    
    // Open WhatsApp in new tab (works on desktop and mobile)
    window.open(whatsappURL, '_blank');
    
    console.log('✅ WhatsApp opened for admin notification');
    console.log('🔗 WhatsApp URL:', whatsappURL);
    
    // Also try backend API if available (optional)
    try {
      const backendUrl = import.meta.env.VITE_BACKEND_URL || '/api/send-whatsapp';
      
      const response = await fetch(backendUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          to: adminPhone,
          message: message,
          type: 'admin_notification',
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

      if (response.ok) {
        const result = await response.json();
        console.log('✅ Backend API also sent notification:', result);
      }
    } catch (backendError) {
      // Backend optional, ignore if not available
      console.log('Backend API not available, using direct WhatsApp only');
    }
    
  } catch (error) {
    console.error('⚠️ Admin WhatsApp notification failed:', error);
    console.log('Message that should be sent to admin:', message);
    // Don't throw error - notification failure shouldn't block booking
  }
};

/**
 * Send WhatsApp confirmation to CUSTOMER
 */
export const sendCustomerWhatsAppNotification = async (
  booking: BookingNotification
): Promise<void> => {
  // Only send if customer phone is provided and looks like a valid number
  if (!booking.phone || booking.phone.length < 10) {
    console.log('⚠️ Customer phone not provided or invalid, skipping WhatsApp');
    return;
  }

  // Format customer WhatsApp message (SHORT VERSION)
  let message = `✅ *BOOKING CONFIRMED*\n\n`;
  message += `Hi *${booking.name}*,\n\n`;
  message += `🏓 *Table:* ${booking.table}\n`;
  message += `📅 *Date:* ${booking.date} (${booking.dayOfWeek})\n`;
  message += `⏰ *Time:* ${booking.startTime} - ${booking.endTime}\n\n`;
  message += `📍 Suny Park, Lahore\n`;
  message += `📞 0325-9898900\n\n`;
  message += `See you there! 🏓`;

  try {
    console.log('📤 Customer WhatsApp Notification Prepared:', message);
    
    const backendUrl = import.meta.env.VITE_BACKEND_URL || '/api/send-whatsapp';
    
    // Format phone number (add 92 country code if not present)
    let customerPhone = booking.phone.replace(/\D/g, ''); // Remove non-digits
    if (customerPhone.startsWith('0')) {
      customerPhone = '92' + customerPhone.substring(1);
    } else if (!customerPhone.startsWith('92')) {
      customerPhone = '92' + customerPhone;
    }
    
    const response = await fetch(backendUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        to: customerPhone,
        message: message,
        type: 'customer_confirmation',
        booking: {
          name: booking.name,
          phone: booking.phone,
          table: booking.table,
          date: booking.date,
          time: `${booking.startTime} - ${booking.endTime}`,
          duration: booking.duration,
        },
      }),
    });

    if (!response.ok) {
      throw new Error('Backend API not available - Customer WhatsApp not sent');
    }

    const result = await response.json();
    console.log('✅ Customer WhatsApp notification sent:', result);
    
  } catch (error) {
    console.error('⚠️ Customer WhatsApp notification failed:', error);
    console.log('Message that should be sent to customer:', message);
    // Don't throw error - notification failure shouldn't block booking
  }
};

/**
 * Legacy function name for backward compatibility
 * Now sends to both admin and customer
 */
export const sendWhatsAppNotification = async (
  booking: BookingNotification
): Promise<void> => {
  // Send to admin
  await sendAdminWhatsAppNotification(booking);
  
  // Send to customer
  await sendCustomerWhatsAppNotification(booking);
};

