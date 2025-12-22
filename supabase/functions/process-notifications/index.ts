import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Pre-generated VAPID keys (same as push-notifications function)
const VAPID_PUBLIC_KEY = "BEl62iUYgUivxIkv69yViEuiBIa-Ib9-SkvMeAtA3LFgDzkrxZJjSgSnfckjBJuBkr3qBUYIHBQFLXYp5Nksh8U";
const VAPID_PRIVATE_KEY = "UUxI4O8-FbRouADVXc-hK3ltRAc8EPMgCNRKvSGZaR4";

interface PushSubscription {
  user_id: string;
  endpoint: string;
  p256dh: string;
  auth: string;
}

interface ScheduledNotification {
  id: string;
  user_id: string;
  type: string;
  title: string;
  body: string;
  scheduled_for: string;
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
    
    console.log("Processing scheduled notifications...");

    // Get notifications that are due (scheduled_for <= now and not yet sent)
    const now = new Date().toISOString();
    const { data: dueNotifications, error: fetchError } = await supabase
      .from("scheduled_notifications")
      .select("*")
      .lte("scheduled_for", now)
      .is("sent_at", null)
      .limit(100);

    if (fetchError) {
      console.error("Error fetching notifications:", fetchError);
      return new Response(
        JSON.stringify({ error: fetchError.message }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!dueNotifications || dueNotifications.length === 0) {
      console.log("No notifications due");
      return new Response(
        JSON.stringify({ processed: 0, message: "No notifications due" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`Found ${dueNotifications.length} notifications to process`);

    let successCount = 0;
    let failCount = 0;

    // Process each notification
    for (const notification of dueNotifications as ScheduledNotification[]) {
      try {
        // Get user's push subscriptions
        const { data: subscriptions, error: subError } = await supabase
          .from("push_subscriptions")
          .select("*")
          .eq("user_id", notification.user_id);

        if (subError) {
          console.error(`Error fetching subscriptions for user ${notification.user_id}:`, subError);
          failCount++;
          continue;
        }

        if (!subscriptions || subscriptions.length === 0) {
          console.log(`No subscriptions for user ${notification.user_id}`);
          // Mark as sent anyway to avoid infinite retries
          await supabase
            .from("scheduled_notifications")
            .update({ sent_at: now })
            .eq("id", notification.id);
          continue;
        }

        // Send to all user's subscriptions
        for (const sub of subscriptions as PushSubscription[]) {
          try {
            // Attempt to send push notification
            // Note: In production, you'd want proper VAPID signing with web-push library
            const pushPayload = JSON.stringify({
              title: notification.title,
              body: notification.body,
              icon: "/pwa-192x192.png",
              badge: "/pwa-192x192.png",
              data: {
                type: notification.type,
                notificationId: notification.id,
              },
            });

            // Try to send the push notification
            const response = await fetch(sub.endpoint, {
              method: "POST",
              headers: {
                "Content-Type": "application/octet-stream",
                "TTL": "86400",
              },
              body: pushPayload,
            });

            if (!response.ok) {
              console.log(`Push failed for endpoint (status ${response.status}), may need VAPID signing`);
              // If subscription is expired or invalid, remove it
              if (response.status === 404 || response.status === 410) {
                console.log(`Removing invalid subscription for user ${notification.user_id}`);
                await supabase
                  .from("push_subscriptions")
                  .delete()
                  .eq("id", sub.endpoint);
              }
            } else {
              console.log(`Push sent successfully to user ${notification.user_id}`);
            }
          } catch (pushError) {
            console.error(`Error sending push to endpoint:`, pushError);
          }
        }

        // Mark notification as sent
        const { error: updateError } = await supabase
          .from("scheduled_notifications")
          .update({ sent_at: now })
          .eq("id", notification.id);

        if (updateError) {
          console.error(`Error marking notification as sent:`, updateError);
          failCount++;
        } else {
          successCount++;
          console.log(`Notification ${notification.id} marked as sent`);
        }

      } catch (notifError) {
        console.error(`Error processing notification ${notification.id}:`, notifError);
        failCount++;
      }
    }

    // Also schedule recurring mood reminders for tomorrow
    await scheduleRecurringReminders(supabase as any);

    console.log(`Processing complete. Success: ${successCount}, Failed: ${failCount}`);

    return new Response(
      JSON.stringify({
        processed: dueNotifications.length,
        success: successCount,
        failed: failCount,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Process notifications error:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

// Schedule recurring daily mood reminders
async function scheduleRecurringReminders(supabase: any) {
  try {
    // Get all users with active push subscriptions
    const { data: activeUsers, error: usersError } = await supabase
      .from("push_subscriptions")
      .select("user_id")
      .limit(1000);

    if (usersError || !activeUsers) {
      console.error("Error fetching active users:", usersError);
      return;
    }

    // Get unique user IDs
    const uniqueUserIds = [...new Set(activeUsers.map((u: { user_id: string }) => u.user_id))];
    
    // For each user, check if they have a mood reminder scheduled for tomorrow
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(9, 0, 0, 0); // Default to 9 AM
    
    const tomorrowStart = new Date(tomorrow);
    tomorrowStart.setHours(0, 0, 0, 0);
    
    const tomorrowEnd = new Date(tomorrow);
    tomorrowEnd.setHours(23, 59, 59, 999);

    for (const userId of uniqueUserIds) {
      // Check if reminder already exists for tomorrow
      const { data: existingReminder } = await supabase
        .from("scheduled_notifications")
        .select("id")
        .eq("user_id", userId)
        .eq("type", "mood_reminder")
        .gte("scheduled_for", tomorrowStart.toISOString())
        .lte("scheduled_for", tomorrowEnd.toISOString())
        .is("sent_at", null)
        .limit(1);

      if (!existingReminder || existingReminder.length === 0) {
        // Schedule a new mood reminder for tomorrow
        const { error: insertError } = await supabase
          .from("scheduled_notifications")
          .insert({
            user_id: userId,
            type: "mood_reminder",
            title: "🌟 Time for a Check-in",
            body: "How are you feeling today? Take a moment to reflect on your mood.",
            scheduled_for: tomorrow.toISOString(),
          });

        if (insertError) {
          console.error(`Error scheduling reminder for user ${userId}:`, insertError);
        } else {
          console.log(`Scheduled mood reminder for user ${userId} at ${tomorrow.toISOString()}`);
        }
      }
    }
  } catch (error) {
    console.error("Error scheduling recurring reminders:", error);
  }
}
