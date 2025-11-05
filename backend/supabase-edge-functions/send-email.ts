// Supabase Edge Function for sending emails
// Deploy with: supabase functions deploy send-email

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const { type, to, data } = await req.json()

    let emailContent;
    let subject;

    if (type === 'customer_confirmation') {
      subject = '✅ Booking Confirmed - SPINERGY';
      emailContent = generateCustomerEmail(data);
    } else if (type === 'admin_notification') {
      subject = '🏓 New Booking - SPINERGY';
      emailContent = generateAdminEmail(data);
    } else {
      throw new Error('Invalid email type');
    }

    // Send email using Resend API
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: 'SPINERGY <bookings@spinergy.pk>',
        to: [to],
        subject: subject,
        html: emailContent,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Resend API error: ${error}`);
    }

    const result = await response.json();

    return new Response(
      JSON.stringify({ success: true, messageId: result.id }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})

function generateCustomerEmail(data: any): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f4f4f4;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f4f4f4; padding: 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 8px; overflow: hidden;">
          
          <!-- Header -->
          <tr>
            <td style="background: linear-gradient(135deg, #1e40af 0%, #dc2626 100%); padding: 40px 20px; text-align: center;">
              <h1 style="margin: 0; color: #ffffff; font-size: 32px;">🏓 SPINERGY</h1>
            </td>
          </tr>

          <!-- Success Message -->
          <tr>
            <td style="padding: 30px 20px; text-align: center;">
              <div style="font-size: 48px;">✅</div>
              <h2 style="color: #1e40af; font-size: 24px;">Booking Confirmed!</h2>
            </td>
          </tr>

          <!-- Booking Details -->
          <tr>
            <td style="padding: 0 20px 30px 20px;">
              <table width="100%" style="background-color: #f8fafc; border-radius: 8px; padding: 20px;">
                <tr>
                  <td style="padding: 10px 0;">
                    <table width="100%">
                      <tr>
                        <td style="color: #666;">Customer:</td>
                        <td align="right" style="color: #1f2937; font-weight: bold;">${data.customerName}</td>
                      </tr>
                    </table>
                  </td>
                </tr>
                <tr>
                  <td style="padding: 10px 0; border-top: 1px solid #e5e7eb;">
                    <table width="100%">
                      <tr>
                        <td style="color: #666;">Table:</td>
                        <td align="right" style="color: #1f2937; font-weight: bold;">${data.table}</td>
                      </tr>
                    </table>
                  </td>
                </tr>
                <tr>
                  <td style="padding: 10px 0; border-top: 1px solid #e5e7eb;">
                    <table width="100%">
                      <tr>
                        <td style="color: #666;">Date:</td>
                        <td align="right" style="color: #1f2937; font-weight: bold;">${data.date} (${data.dayOfWeek})</td>
                      </tr>
                    </table>
                  </td>
                </tr>
                <tr>
                  <td style="padding: 10px 0; border-top: 1px solid #e5e7eb;">
                    <table width="100%">
                      <tr>
                        <td style="color: #666;">Time:</td>
                        <td align="right" style="color: #1f2937; font-weight: bold;">${data.startTime} - ${data.endTime}</td>
                      </tr>
                    </table>
                  </td>
                </tr>
                <tr>
                  <td style="padding: 10px 0; border-top: 2px solid #1e40af;">
                    <table width="100%">
                      <tr>
                        <td style="color: #1e40af; font-weight: bold;">Total Amount:</td>
                        <td align="right" style="color: #1e40af; font-size: 18px; font-weight: bold;">PKR ${data.totalPrice}</td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Contact -->
          <tr>
            <td style="padding: 0 20px 30px 20px; text-align: center;">
              <p style="color: #666; font-size: 14px;">📍 Suny Park, Lahore, Punjab</p>
              <p style="color: #666; font-size: 14px;">📱 03413393533</p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color: #1f2937; padding: 20px; text-align: center;">
              <p style="color: #9ca3af; font-size: 12px;">© 2025 SPINERGY. All rights reserved.</p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `;
}

function generateAdminEmail(data: any): string {
  return `
<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"></head>
<body style="font-family: Arial, sans-serif;">
  <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
    <h2 style="color: #1e40af;">🏓 New Booking Alert - SPINERGY</h2>
    <div style="background: #f8fafc; padding: 20px; border-radius: 8px;">
      <p><strong>Customer:</strong> ${data.customerName}</p>
      <p><strong>Phone:</strong> ${data.customerPhone}</p>
      <p><strong>Email:</strong> ${data.customerEmail}</p>
      <p><strong>Table:</strong> ${data.table}</p>
      <p><strong>Date:</strong> ${data.date} (${data.dayOfWeek})</p>
      <p><strong>Time:</strong> ${data.startTime} - ${data.endTime}</p>
      <p><strong>Total Amount:</strong> PKR ${data.totalPrice}</p>
    </div>
    <p style="color: #666; font-size: 12px; margin-top: 20px;">Check admin dashboard for full details.</p>
  </div>
</body>
</html>
  `;
}

