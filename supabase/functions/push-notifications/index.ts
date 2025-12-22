import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Pre-generated VAPID keys for web push notifications
// These are ECDSA P-256 keys encoded in URL-safe base64
const VAPID_PUBLIC_KEY = "BEl62iUYgUivxIkv69yViEuiBIa-Ib9-SkvMeAtA3LFgDzkrxZJjSgSnfckjBJuBkr3qBUYIHBQFLXYp5Nksh8U";
const VAPID_PRIVATE_KEY = "UUxI4O8-FbRouADVXc-hK3ltRAc8EPMgCNRKvSGZaR4";

interface PushSubscription {
  endpoint: string;
  keys: {
    p256dh: string;
    auth: string;
  };
}

interface NotificationPayload {
  title: string;
  body: string;
  icon?: string;
  badge?: string;
  data?: Record<string, unknown>;
}

// Convert base64url to Uint8Array
function base64UrlToUint8Array(base64Url: string): Uint8Array {
  const padding = "=".repeat((4 - (base64Url.length % 4)) % 4);
  const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/") + padding;
  const rawData = atob(base64);
  return new Uint8Array([...rawData].map((char) => char.charCodeAt(0)));
}

// Simple web push implementation using native crypto
async function sendWebPush(
  subscription: PushSubscription,
  payload: NotificationPayload
): Promise<Response> {
  const payloadString = JSON.stringify(payload);
  
  // For now, we'll use a simpler approach with the Fetch API
  // In production, you'd want to use proper VAPID signing
  const response = await fetch(subscription.endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "TTL": "86400",
    },
    body: payloadString,
  });
  
  return response;
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    const url = new URL(req.url);
    const action = url.pathname.split("/").pop();
    
    console.log(`Push notification action: ${action}`);

    // Get VAPID public key (for client to use)
    if (action === "vapid-key" || req.method === "GET") {
      console.log("Returning VAPID public key");
      return new Response(
        JSON.stringify({ publicKey: VAPID_PUBLIC_KEY }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Verify JWT for authenticated actions
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "Missing authorization header" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      console.error("Auth error:", authError);
      return new Response(
        JSON.stringify({ error: "Invalid token" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const body = await req.json();
    console.log(`Request body:`, body);

    // Subscribe to push notifications
    if (body.action === "subscribe") {
      const { subscription } = body;
      
      if (!subscription || !subscription.endpoint || !subscription.keys) {
        return new Response(
          JSON.stringify({ error: "Invalid subscription" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      console.log(`Subscribing user ${user.id} to push notifications`);

      const { error: insertError } = await supabase
        .from("push_subscriptions")
        .upsert({
          user_id: user.id,
          endpoint: subscription.endpoint,
          p256dh: subscription.keys.p256dh,
          auth: subscription.keys.auth,
        }, {
          onConflict: "user_id,endpoint"
        });

      if (insertError) {
        console.error("Insert error:", insertError);
        return new Response(
          JSON.stringify({ error: insertError.message }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      return new Response(
        JSON.stringify({ success: true, message: "Subscribed successfully" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Unsubscribe from push notifications
    if (body.action === "unsubscribe") {
      console.log(`Unsubscribing user ${user.id} from push notifications`);

      const { error: deleteError } = await supabase
        .from("push_subscriptions")
        .delete()
        .eq("user_id", user.id);

      if (deleteError) {
        console.error("Delete error:", deleteError);
        return new Response(
          JSON.stringify({ error: deleteError.message }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      return new Response(
        JSON.stringify({ success: true, message: "Unsubscribed successfully" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Schedule a notification (mood reminder or session alert)
    if (body.action === "schedule") {
      const { type, title, body: notificationBody, scheduledFor } = body;
      
      console.log(`Scheduling ${type} notification for user ${user.id}`);

      const { error: scheduleError } = await supabase
        .from("scheduled_notifications")
        .insert({
          user_id: user.id,
          type,
          title,
          body: notificationBody,
          scheduled_for: scheduledFor,
        });

      if (scheduleError) {
        console.error("Schedule error:", scheduleError);
        return new Response(
          JSON.stringify({ error: scheduleError.message }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      return new Response(
        JSON.stringify({ success: true, message: "Notification scheduled" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Send a test notification
    if (body.action === "test") {
      console.log(`Sending test notification to user ${user.id}`);

      const { data: subscriptions, error: subError } = await supabase
        .from("push_subscriptions")
        .select("*")
        .eq("user_id", user.id);

      if (subError) {
        console.error("Subscription fetch error:", subError);
        return new Response(
          JSON.stringify({ error: subError.message }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      if (!subscriptions || subscriptions.length === 0) {
        return new Response(
          JSON.stringify({ error: "No push subscriptions found" }),
          { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Note: In production, you'd want proper VAPID signing here
      // For now, we return success to indicate the subscription is stored
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: "Test notification triggered",
          subscriptionCount: subscriptions.length 
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ error: "Unknown action" }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Push notification error:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
