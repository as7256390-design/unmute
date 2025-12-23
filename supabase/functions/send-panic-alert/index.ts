import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface PanicAlertRequest {
  contacts: { name: string; phone: string }[];
  latitude: number;
  longitude: number;
  userName?: string;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { contacts, latitude, longitude, userName }: PanicAlertRequest = await req.json();

    console.log("Panic alert triggered:", { contacts: contacts.length, latitude, longitude });

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

    const locationUrl = `https://www.google.com/maps?q=${latitude},${longitude}`;
    const message = `🚨 EMERGENCY ALERT 🚨\n\n${userName || "Someone"} has triggered a panic alert and needs help!\n\nLocation: ${locationUrl}\n\nPlease respond immediately or contact emergency services.`;

    const results: { phone: string; success: boolean; error?: string }[] = [];

    for (const contact of contacts) {
      try {
        // Format phone number for Twilio
        let phoneNumber = contact.phone.replace(/\s+/g, "");
        if (!phoneNumber.startsWith("+")) {
          phoneNumber = "+91" + phoneNumber; // Default to India country code
        }

        const twilioUrl = `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`;
        
        const formData = new URLSearchParams();
        formData.append("To", phoneNumber);
        formData.append("From", fromNumber);
        formData.append("Body", message);

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

    const successCount = results.filter(r => r.success).length;
    console.log(`Panic alert complete: ${successCount}/${contacts.length} SMS sent`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        sent: successCount, 
        total: contacts.length,
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
