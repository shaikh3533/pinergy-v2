import { supabase } from '../lib/supabase';

export interface BookingEmailData {
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  table: string;
  date: string;
  dayOfWeek: string;
  startTime: string;
  endTime: string;
  duration: number;
  price: number;
  totalSlots: number;
  totalPrice: number;
  bookingId?: string;
}

/**
 * Send booking confirmation email to customer
 */
export const sendCustomerConfirmationEmail = async (
  data: BookingEmailData
): Promise<void> => {
  try {
    // Call Supabase Edge Function for sending emails
    const { data: result, error } = await supabase.functions.invoke('send-email', {
      body: {
        type: 'customer_confirmation',
        to: data.customerEmail,
        data: {
          customerName: data.customerName,
          table: data.table,
          date: data.date,
          dayOfWeek: data.dayOfWeek,
          startTime: data.startTime,
          endTime: data.endTime,
          duration: data.duration,
          price: data.price,
          totalSlots: data.totalSlots,
          totalPrice: data.totalPrice,
        },
      },
    });

    if (error) {
      console.error('❌ Customer email failed:', error);
      throw error;
    }

    console.log('✅ Customer confirmation email sent:', result);
  } catch (error) {
    console.error('⚠️ Email notification failed:', error);
    // Don't throw - email failure shouldn't block booking
  }
};

/**
 * Send booking notification email to admin
 */
export const sendAdminNotificationEmail = async (
  data: BookingEmailData
): Promise<void> => {
  try {
    // Admin email from environment or default
    const adminEmail = import.meta.env.VITE_ADMIN_EMAIL || 'admin@spinergy.com';

    const { data: result, error } = await supabase.functions.invoke('send-email', {
      body: {
        type: 'admin_notification',
        to: adminEmail,
        data: {
          customerName: data.customerName,
          customerEmail: data.customerEmail,
          customerPhone: data.customerPhone,
          table: data.table,
          date: data.date,
          dayOfWeek: data.dayOfWeek,
          startTime: data.startTime,
          endTime: data.endTime,
          duration: data.duration,
          price: data.price,
          totalSlots: data.totalSlots,
          totalPrice: data.totalPrice,
        },
      },
    });

    if (error) {
      console.error('❌ Admin email failed:', error);
      throw error;
    }

    console.log('✅ Admin notification email sent:', result);
  } catch (error) {
    console.error('⚠️ Admin email notification failed:', error);
    // Don't throw - email failure shouldn't block booking
  }
};

/**
 * Generate customer email HTML template
 */
export const generateCustomerEmailHTML = (data: BookingEmailData): string => {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Booking Confirmation - SPINERGY</title>
</head>
<body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f4f4f4;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f4f4f4; padding: 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
          
          <!-- Header -->
          <tr>
            <td style="background: linear-gradient(135deg, #1e40af 0%, #dc2626 100%); padding: 40px 20px; text-align: center;">
              <h1 style="margin: 0; color: #ffffff; font-size: 32px; font-weight: bold;">🏓 SPINERGY</h1>
              <p style="margin: 10px 0 0 0; color: #ffffff; font-size: 16px;">Table Tennis Club</p>
            </td>
          </tr>

          <!-- Success Message -->
          <tr>
            <td style="padding: 30px 20px; text-align: center;">
              <div style="font-size: 48px; margin-bottom: 10px;">✅</div>
              <h2 style="margin: 0 0 10px 0; color: #1e40af; font-size: 24px;">Booking Confirmed!</h2>
              <p style="margin: 0; color: #666; font-size: 16px;">Your table has been successfully booked</p>
            </td>
          </tr>

          <!-- Booking Details -->
          <tr>
            <td style="padding: 0 20px 30px 20px;">
              <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f8fafc; border-radius: 8px; padding: 20px;">
                <tr>
                  <td style="padding: 10px 0;">
                    <table width="100%" cellpadding="0" cellspacing="0">
                      <tr>
                        <td style="color: #666; font-size: 14px;">Customer Name:</td>
                        <td align="right" style="color: #1f2937; font-size: 14px; font-weight: bold;">${data.customerName}</td>
                      </tr>
                    </table>
                  </td>
                </tr>
                <tr>
                  <td style="padding: 10px 0; border-top: 1px solid #e5e7eb;">
                    <table width="100%" cellpadding="0" cellspacing="0">
                      <tr>
                        <td style="color: #666; font-size: 14px;">Table:</td>
                        <td align="right" style="color: #1f2937; font-size: 14px; font-weight: bold;">${data.table}</td>
                      </tr>
                    </table>
                  </td>
                </tr>
                <tr>
                  <td style="padding: 10px 0; border-top: 1px solid #e5e7eb;">
                    <table width="100%" cellpadding="0" cellspacing="0">
                      <tr>
                        <td style="color: #666; font-size: 14px;">Date:</td>
                        <td align="right" style="color: #1f2937; font-size: 14px; font-weight: bold;">${data.date} (${data.dayOfWeek})</td>
                      </tr>
                    </table>
                  </td>
                </tr>
                <tr>
                  <td style="padding: 10px 0; border-top: 1px solid #e5e7eb;">
                    <table width="100%" cellpadding="0" cellspacing="0">
                      <tr>
                        <td style="color: #666; font-size: 14px;">Time:</td>
                        <td align="right" style="color: #1f2937; font-size: 14px; font-weight: bold;">${data.startTime} - ${data.endTime}</td>
                      </tr>
                    </table>
                  </td>
                </tr>
                <tr>
                  <td style="padding: 10px 0; border-top: 1px solid #e5e7eb;">
                    <table width="100%" cellpadding="0" cellspacing="0">
                      <tr>
                        <td style="color: #666; font-size: 14px;">Duration:</td>
                        <td align="right" style="color: #1f2937; font-size: 14px; font-weight: bold;">${data.duration} minutes</td>
                      </tr>
                    </table>
                  </td>
                </tr>
                ${data.totalSlots > 1 ? `
                <tr>
                  <td style="padding: 10px 0; border-top: 1px solid #e5e7eb;">
                    <table width="100%" cellpadding="0" cellspacing="0">
                      <tr>
                        <td style="color: #666; font-size: 14px;">Total Slots:</td>
                        <td align="right" style="color: #1f2937; font-size: 14px; font-weight: bold;">${data.totalSlots} slots</td>
                      </tr>
                    </table>
                  </td>
                </tr>
                ` : ''}
                <tr>
                  <td style="padding: 10px 0; border-top: 2px solid #1e40af;">
                    <table width="100%" cellpadding="0" cellspacing="0">
                      <tr>
                        <td style="color: #1e40af; font-size: 16px; font-weight: bold;">Total Amount:</td>
                        <td align="right" style="color: #1e40af; font-size: 18px; font-weight: bold;">PKR ${data.totalPrice}</td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Important Information -->
          <tr>
            <td style="padding: 0 20px 30px 20px;">
              <div style="background-color: #fef3c7; border-left: 4px solid #f59e0b; padding: 15px; border-radius: 4px;">
                <p style="margin: 0 0 10px 0; color: #92400e; font-size: 14px; font-weight: bold;">📝 Important Notes:</p>
                <ul style="margin: 0; padding-left: 20px; color: #92400e; font-size: 13px;">
                  <li>Please arrive 5 minutes before your slot time</li>
                  <li>Payment can be made at the club</li>
                  <li>For cancellations, contact us at least 2 hours in advance</li>
                  <li>Late arrivals may result in reduced playing time</li>
                </ul>
              </div>
            </td>
          </tr>

          <!-- Contact Information -->
          <tr>
            <td style="padding: 0 20px 30px 20px; text-align: center;">
              <p style="margin: 0 0 10px 0; color: #666; font-size: 14px;">📍 <strong>Location:</strong> Suny Park, Lahore, Punjab</p>
              <p style="margin: 0 0 10px 0; color: #666; font-size: 14px;">📱 <strong>Phone:</strong> 03413393533</p>
              <p style="margin: 0; color: #666; font-size: 14px;">📧 <strong>Email:</strong> info@spinergy.pk</p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color: #1f2937; padding: 20px; text-align: center;">
              <p style="margin: 0 0 10px 0; color: #9ca3af; font-size: 12px;">Thank you for choosing SPINERGY!</p>
              <p style="margin: 0; color: #9ca3af; font-size: 12px;">© 2025 SPINERGY. All rights reserved.</p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `;
};

/**
 * Generate customer SMS text
 */
export const generateCustomerSMS = (data: BookingEmailData): string => {
  return `✅ SPINERGY Booking Confirmed!\n\n` +
    `${data.customerName}\n` +
    `Table: ${data.table}\n` +
    `Date: ${data.date}\n` +
    `Time: ${data.startTime}-${data.endTime}\n` +
    `Total: PKR ${data.totalPrice}\n\n` +
    `See you at SPINERGY! 🏓\n` +
    `Location: Suny Park, Lahore\n` +
    `Ph: 03413393533`;
};

