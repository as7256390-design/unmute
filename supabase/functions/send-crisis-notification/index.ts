import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface NotificationRequest {
  type: 'email' | 'sms' | 'both';
  alertId?: string;
  action?: string;
  details?: string;
  studentId?: string;
  riskLevel?: string;
  stage?: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { type, alertId, action, details, studentId, riskLevel, stage }: NotificationRequest = await req.json();
    
    console.log('Sending crisis notification:', { type, alertId, action, riskLevel, stage });

    // Get all admin notification settings for institution admins
    const { data: admins } = await supabase
      .from('admin_notification_settings')
      .select('*');

    if (!admins || admins.length === 0) {
      console.log('No admin notification settings found');
      return new Response(
        JSON.stringify({ message: 'No notification recipients configured' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const results = { email: 0, sms: 0, errors: [] as string[] };

    // Send emails
    if (type === 'email' || type === 'both') {
      const resendKey = Deno.env.get('RESEND_API_KEY');
      if (resendKey) {
        for (const admin of admins) {
          if (admin.notify_by_email && admin.email) {
            try {
              const emailHtml = `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                  <div style="background: linear-gradient(135deg, #dc2626, #991b1b); padding: 20px; text-align: center;">
                    <h1 style="color: white; margin: 0;">🚨 Crisis Alert</h1>
                  </div>
                  <div style="padding: 20px; background: #fef2f2; border: 1px solid #fecaca;">
                    <h2 style="color: #991b1b; margin-top: 0;">Immediate Attention Required</h2>
                    ${riskLevel ? `<p><strong>Risk Level:</strong> <span style="color: #dc2626; font-weight: bold;">${riskLevel.toUpperCase()}</span></p>` : ''}
                    ${stage ? `<p><strong>Suicide Roadmap Stage:</strong> ${stage}</p>` : ''}
                    ${studentId ? `<p><strong>Student ID:</strong> ${studentId.slice(0, 8)}...</p>` : ''}
                    ${action ? `<p><strong>Action Taken:</strong> ${action.replace(/_/g, ' ')}</p>` : ''}
                    ${details ? `<p><strong>Details:</strong> ${details}</p>` : ''}
                    <hr style="border: 1px solid #fecaca; margin: 20px 0;" />
                    <p style="color: #666; font-size: 14px;">
                      This is an automated alert from UNMUTE. Please log in to the dashboard to review and take appropriate action.
                    </p>
                  </div>
                  <div style="padding: 15px; background: #f3f4f6; text-align: center; font-size: 12px; color: #666;">
                    UNMUTE Mental Health Support Platform
                  </div>
                </div>
              `;

              // Use Resend REST API directly
              const resendResponse = await fetch('https://api.resend.com/emails', {
                method: 'POST',
                headers: {
                  'Authorization': `Bearer ${resendKey}`,
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                  from: 'UNMUTE Crisis Alerts <alerts@resend.dev>',
                  to: [admin.email],
                  subject: `🚨 URGENT: Crisis Alert ${riskLevel ? `- ${riskLevel.toUpperCase()} Risk` : ''}`,
                  html: emailHtml,
                }),
              });
              
              if (!resendResponse.ok) {
                throw new Error(`Resend API error: ${resendResponse.status}`);
              }
              
              results.email++;
              console.log(`Email sent to ${admin.email}`);
            } catch (e) {
              console.error(`Failed to send email to ${admin.email}:`, e);
              results.errors.push(`Email to ${admin.email} failed`);
            }
          }
        }
      } else {
        console.log('RESEND_API_KEY not configured');
        results.errors.push('Email service not configured');
      }
    }

    // Send SMS
    if (type === 'sms' || type === 'both') {
      const twilioSid = Deno.env.get('TWILIO_ACCOUNT_SID');
      const twilioToken = Deno.env.get('TWILIO_AUTH_TOKEN');
      const twilioPhone = Deno.env.get('TWILIO_PHONE_NUMBER');

      if (twilioSid && twilioToken && twilioPhone) {
        for (const admin of admins) {
          if (admin.notify_by_sms && admin.phone) {
            try {
              const message = `🚨 UNMUTE CRISIS ALERT\n${riskLevel ? `Risk: ${riskLevel.toUpperCase()}\n` : ''}${stage ? `Stage: ${stage}\n` : ''}${action ? `Action: ${action.replace(/_/g, ' ')}\n` : ''}Check dashboard immediately.`;

              const response = await fetch(
                `https://api.twilio.com/2010-04-01/Accounts/${twilioSid}/Messages.json`,
                {
                  method: 'POST',
                  headers: {
                    'Authorization': 'Basic ' + btoa(`${twilioSid}:${twilioToken}`),
                    'Content-Type': 'application/x-www-form-urlencoded',
                  },
                  body: new URLSearchParams({
                    To: admin.phone,
                    From: twilioPhone,
                    Body: message,
                  }),
                }
              );

              if (response.ok) {
                results.sms++;
                console.log(`SMS sent to ${admin.phone}`);
              } else {
                const error = await response.text();
                console.error(`SMS failed to ${admin.phone}:`, error);
                results.errors.push(`SMS to ${admin.phone} failed`);
              }
            } catch (e) {
              console.error(`Failed to send SMS to ${admin.phone}:`, e);
              results.errors.push(`SMS to ${admin.phone} failed`);
            }
          }
        }
      } else {
        console.log('Twilio not configured');
        results.errors.push('SMS service not configured');
      }
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        sent: { emails: results.email, sms: results.sms },
        errors: results.errors 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Crisis notification error:', error);
    return new Response(
      JSON.stringify({ error: 'Failed to send notifications' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
