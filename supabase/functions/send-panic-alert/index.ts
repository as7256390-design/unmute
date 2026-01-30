import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

interface PanicAlertRequest {
  contacts?: { name: string; phone: string }[];
  latitude?: number;
  longitude?: number;
  userName?: string;
  // Crisis notification fields
  contactPhone?: string;
  contactName?: string;
  message?: string;
  type?: 'panic' | 'crisis';
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const body: PanicAlertRequest = await req.json();
    const { contacts, latitude, longitude, userName, contactPhone, contactName, message, type } = body;

    console.log("Alert triggered:", { type: type || 'panic', contactsCount: contacts?.length || 1 });

    const accountSid = Deno.env.get("TWILIO_ACCOUNT_SID");
    const authToken = Deno.env.get("TWILIO_AUTH_TOKEN");
    const fromNumber = Deno.env.get("TWILIO_PHONE_NUMBER");

    if (!accountSid || !authToken || !fromNumber) {
      console.error("Missing Twilio credentials");
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: "SMS service not configured",
          whatsappOnly: true 
        }),
        { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const results: { phone: string; success: boolean; error?: string }[] = [];

    // Handle crisis notification (single contact)
    if (type === 'crisis' && contactPhone) {
      try {
        let phoneNumber = contactPhone.replace(/\s+/g, "");
        if (!phoneNumber.startsWith("+")) {
          phoneNumber = "+91" + phoneNumber;
        }

        const twilioUrl = `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`;
        
        const formData = new URLSearchParams();
        formData.append("To", phoneNumber);
        formData.append("From", fromNumber);
        formData.append("Body", message || `🚨 URGENT: ${contactName || 'A loved one'} may need immediate help. Please reach out to them now. - Aprivox Crisis Alert`);

        const response = await fetch(twilioUrl, {
          method: "POST",
          headers: {
            "Authorization": `Basic ${btoa(`${accountSid}:${authToken}`)}`,
            "Content-Type": "application/x-www-form-urlencoded",
          },
          body: formData.toString(),
        });

        const result = await response.json();
        
        if (response.ok) {
          console.log(`Crisis SMS sent to ${contactName}:`, result.sid);
          results.push({ phone: contactPhone, success: true });
        } else {
          console.error(`Failed to send crisis SMS:`, result);
          results.push({ phone: contactPhone, success: false, error: result.message });
        }
      } catch (error) {
        console.error(`Error sending crisis SMS:`, error);
        results.push({ phone: contactPhone, success: false, error: String(error) });
      }

      return new Response(
        JSON.stringify({ 
          success: results[0]?.success || false, 
          sent: results.filter(r => r.success).length, 
          total: 1,
          results 
        }),
        { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Handle panic alert (multiple contacts with location)
    if (contacts && contacts.length > 0) {
      const locationUrl = latitude && longitude 
        ? `https://www.google.com/maps?q=${latitude},${longitude}` 
        : null;
      
      const panicMessage = locationUrl
        ? `🚨 EMERGENCY ALERT 🚨\n\n${userName || "Someone"} has triggered a panic alert and needs help!\n\nLocation: ${locationUrl}\n\nPlease respond immediately or contact emergency services.`
        : `🚨 EMERGENCY ALERT 🚨\n\n${userName || "Someone"} has triggered a panic alert and needs help!\n\nPlease respond immediately or contact emergency services.`;

      for (const contact of contacts) {
        try {
          let phoneNumber = contact.phone.replace(/\s+/g, "");
          if (!phoneNumber.startsWith("+")) {
            phoneNumber = "+91" + phoneNumber;
          }

          const twilioUrl = `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`;
          
          const formData = new URLSearchParams();
          formData.append("To", phoneNumber);
          formData.append("From", fromNumber);
          formData.append("Body", panicMessage);

          const response = await fetch(twilioUrl, {
            method: "POST",
            headers: {
              "Authorization": `Basic ${btoa(`${accountSid}:${authToken}`)}`,
              "Content-Type": "application/x-www-form-urlencoded",
            },
            body: formData.toString(),
          });

          const result = await response.json();
          
          if (response.ok) {
            console.log(`SMS sent to ${contact.name}:`, result.sid);
            results.push({ phone: contact.phone, success: true });
          } else {
            console.error(`Failed to send SMS to ${contact.name}:`, result);
            results.push({ phone: contact.phone, success: false, error: result.message });
          }
        } catch (error) {
          console.error(`Error sending SMS to ${contact.name}:`, error);
          results.push({ phone: contact.phone, success: false, error: String(error) });
        }
      }
    }

    const successCount = results.filter(r => r.success).length;
    console.log(`Alert complete: ${successCount}/${results.length} SMS sent`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        sent: successCount, 
        total: results.length,
        results 
      }),
      { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );

  } catch (error: any) {
    console.error("Error in send-panic-alert:", error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
};

serve(handler);
