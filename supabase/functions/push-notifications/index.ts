import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { encode as base64UrlEncode } from "https://deno.land/std@0.208.0/encoding/base64url.ts";

// Allowed origins for CORS - restrict to production and preview URLs
const ALLOWED_ORIGINS = [
  "https://lgfewsifdmhodjdxojck.lovableproject.com",
  "https://lovable.dev",
  "http://localhost:5173",
  "http://localhost:8080",
];

function getCorsHeaders(origin: string | null) {
  // Use exact origin matching to prevent subdomain bypass attacks
  const allowedOrigin = origin && ALLOWED_ORIGINS.includes(origin)
    ? origin
    : ALLOWED_ORIGINS[0];
  
  return {
    "Access-Control-Allow-Origin": allowedOrigin,
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  };
}

// VAPID keys loaded from environment secrets
const VAPID_PUBLIC_KEY = Deno.env.get("VAPID_PUBLIC_KEY") || "";
const VAPID_PRIVATE_KEY = Deno.env.get("VAPID_PRIVATE_KEY") || "";
const VAPID_SUBJECT = "mailto:support@mindful-u.app";

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

// Convert Uint8Array to base64url string
function uint8ArrayToBase64Url(uint8Array: Uint8Array): string {
  return base64UrlEncode(uint8Array);
}

// Import ECDSA private key for VAPID signing
async function importVapidPrivateKey(privateKeyBase64Url: string): Promise<CryptoKey> {
  // Parse public key to get x and y coordinates
  const publicKeyBytes = base64UrlToUint8Array(VAPID_PUBLIC_KEY);
  
  // Public key is 65 bytes: 0x04 || x (32 bytes) || y (32 bytes)
  if (publicKeyBytes.length !== 65 || publicKeyBytes[0] !== 0x04) {
    throw new Error("Invalid VAPID public key format");
  }

  // VAPID private keys are raw 32-byte scalars, using JWK format for P-256 curve
  const jwk = {
    kty: "EC",
    crv: "P-256",
    d: privateKeyBase64Url,
    x: uint8ArrayToBase64Url(publicKeyBytes.slice(1, 33)),
    y: uint8ArrayToBase64Url(publicKeyBytes.slice(33, 65)),
  };

  return await crypto.subtle.importKey(
    "jwk",
    jwk,
    { name: "ECDSA", namedCurve: "P-256" },
    false,
    ["sign"]
  );
}

// Create VAPID JWT token
async function createVapidJwt(audience: string, expiration: number): Promise<string> {
  const header = { typ: "JWT", alg: "ES256" };
  const payload = {
    aud: audience,
    exp: expiration,
    sub: VAPID_SUBJECT,
  };

  const encodedHeader = uint8ArrayToBase64Url(new TextEncoder().encode(JSON.stringify(header)));
  const encodedPayload = uint8ArrayToBase64Url(new TextEncoder().encode(JSON.stringify(payload)));
  
  const unsignedToken = `${encodedHeader}.${encodedPayload}`;
  
  // Import the private key and sign
  const privateKey = await importVapidPrivateKey(VAPID_PRIVATE_KEY);
  
  const signature = await crypto.subtle.sign(
    { name: "ECDSA", hash: "SHA-256" },
    privateKey,
    new TextEncoder().encode(unsignedToken)
  );

  // The signature is in IEEE P1363 format (64 bytes: r || s)
  const signatureBytes = new Uint8Array(signature);
  const encodedSignature = uint8ArrayToBase64Url(signatureBytes);
  
  return `${unsignedToken}.${encodedSignature}`;
}

// Generate encryption keys for the payload
async function generateEncryptionKeys(): Promise<{ publicKey: CryptoKey; privateKey: CryptoKey }> {
  const keyPair = await crypto.subtle.generateKey(
    { name: "ECDH", namedCurve: "P-256" },
    true,
    ["deriveBits"]
  );
  return keyPair;
}

// HKDF implementation using HMAC
async function hkdf(
  salt: Uint8Array,
  ikm: Uint8Array,
  info: Uint8Array,
  length: number
): Promise<Uint8Array> {
  // If salt is empty, use a zero-filled buffer
  const actualSalt = salt.length > 0 ? salt : new Uint8Array(32);
  
  // Extract step
  const prkKey = await crypto.subtle.importKey(
    "raw",
    actualSalt.buffer.slice(actualSalt.byteOffset, actualSalt.byteOffset + actualSalt.byteLength) as ArrayBuffer,
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  
  const prk = new Uint8Array(await crypto.subtle.sign(
    "HMAC", 
    prkKey, 
    ikm.buffer.slice(ikm.byteOffset, ikm.byteOffset + ikm.byteLength) as ArrayBuffer
  ));
  
  // Expand step
  const expandKey = await crypto.subtle.importKey(
    "raw",
    prk.buffer.slice(prk.byteOffset, prk.byteOffset + prk.byteLength) as ArrayBuffer,
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  
  const result = new Uint8Array(length);
  let t = new Uint8Array(0);
  let offset = 0;
  let counter = 1;
  
  while (offset < length) {
    const input = new Uint8Array(t.length + info.length + 1);
    input.set(t, 0);
    input.set(info, t.length);
    input[t.length + info.length] = counter;
    
    t = new Uint8Array(await crypto.subtle.sign(
      "HMAC", 
      expandKey, 
      input.buffer.slice(input.byteOffset, input.byteOffset + input.byteLength) as ArrayBuffer
    ));
    
    const copyLength = Math.min(t.length, length - offset);
    result.set(t.slice(0, copyLength), offset);
    offset += copyLength;
    counter++;
  }
  
  return result;
}

// Encrypt the notification payload using aes128gcm
async function encryptPayload(
  subscription: PushSubscription,
  payload: string
): Promise<Uint8Array> {
  const encoder = new TextEncoder();
  const payloadBytes = encoder.encode(payload);
  
  // Generate ephemeral ECDH key pair
  const serverKeys = await generateEncryptionKeys();
  
  // Export server public key
  const serverPublicKeyRaw = await crypto.subtle.exportKey("raw", serverKeys.publicKey);
  const serverPublicKey = new Uint8Array(serverPublicKeyRaw);
  
  // Import subscriber's public key
  const subscriberPublicKeyBytes = base64UrlToUint8Array(subscription.keys.p256dh);
  const subscriberPublicKey = await crypto.subtle.importKey(
    "raw",
    subscriberPublicKeyBytes.buffer.slice(
      subscriberPublicKeyBytes.byteOffset, 
      subscriberPublicKeyBytes.byteOffset + subscriberPublicKeyBytes.byteLength
    ) as ArrayBuffer,
    { name: "ECDH", namedCurve: "P-256" },
    false,
    []
  );
  
  // Derive shared secret
  const sharedSecret = new Uint8Array(await crypto.subtle.deriveBits(
    { name: "ECDH", public: subscriberPublicKey },
    serverKeys.privateKey,
    256
  ));
  
  // Get auth secret
  const authSecret = base64UrlToUint8Array(subscription.keys.auth);
  
  // Generate salt
  const salt = crypto.getRandomValues(new Uint8Array(16));
  
  // Create info for auth secret derivation
  const authInfo = encoder.encode("Content-Encoding: auth\0");
  
  // Create key info
  const keyInfoData = new Uint8Array(
    encoder.encode("WebPush: info\0").length + 
    subscriberPublicKeyBytes.length + 
    serverPublicKey.length
  );
  let keyInfoOffset = 0;
  keyInfoData.set(encoder.encode("WebPush: info\0"), keyInfoOffset);
  keyInfoOffset += encoder.encode("WebPush: info\0").length;
  keyInfoData.set(subscriberPublicKeyBytes, keyInfoOffset);
  keyInfoOffset += subscriberPublicKeyBytes.length;
  keyInfoData.set(serverPublicKey, keyInfoOffset);
  
  // Derive IKM from shared secret and auth
  const ikm = await hkdf(authSecret, sharedSecret, authInfo, 32);
  
  // Derive content encryption key and nonce
  const cekInfo = encoder.encode("Content-Encoding: aes128gcm\0");
  const nonceInfo = encoder.encode("Content-Encoding: nonce\0");
  
  const contentEncryptionKey = await hkdf(salt, ikm, cekInfo, 16);
  const nonce = await hkdf(salt, ikm, nonceInfo, 12);
  
  // Import content encryption key
  const aesKey = await crypto.subtle.importKey(
    "raw",
    contentEncryptionKey.buffer.slice(
      contentEncryptionKey.byteOffset,
      contentEncryptionKey.byteOffset + contentEncryptionKey.byteLength
    ) as ArrayBuffer,
    { name: "AES-GCM" },
    false,
    ["encrypt"]
  );
  
  // Add padding delimiter (RFC 8291)
  const paddedPayload = new Uint8Array(payloadBytes.length + 1);
  paddedPayload.set(payloadBytes, 0);
  paddedPayload[payloadBytes.length] = 2; // Record delimiter
  
  // Encrypt with AES-GCM
  const nonceBuffer = nonce.buffer.slice(
    nonce.byteOffset,
    nonce.byteOffset + nonce.byteLength
  ) as ArrayBuffer;
  
  const encrypted = new Uint8Array(await crypto.subtle.encrypt(
    { name: "AES-GCM", iv: nonceBuffer },
    aesKey,
    paddedPayload.buffer.slice(
      paddedPayload.byteOffset,
      paddedPayload.byteOffset + paddedPayload.byteLength
    ) as ArrayBuffer
  ));
  
  // Build the encrypted content (RFC 8188 aes128gcm format)
  const recordSize = 4096;
  const headerSize = 16 + 4 + 1 + serverPublicKey.length; // salt + rs + idlen + keyid
  const header = new Uint8Array(headerSize);
  
  // Salt (16 bytes)
  header.set(salt, 0);
  
  // Record size (4 bytes, big endian)
  new DataView(header.buffer).setUint32(16, recordSize);
  
  // Key ID length (1 byte)
  header[20] = serverPublicKey.length;
  
  // Key ID (server public key)
  header.set(serverPublicKey, 21);
  
  // Combine header and encrypted data
  const encryptedPayload = new Uint8Array(header.length + encrypted.length);
  encryptedPayload.set(header, 0);
  encryptedPayload.set(encrypted, header.length);
  
  return encryptedPayload;
}

// Send web push notification with VAPID authentication
async function sendWebPush(
  subscription: PushSubscription,
  payload: NotificationPayload
): Promise<Response> {
  const payloadString = JSON.stringify(payload);
  
  // Get audience from endpoint URL
  const endpointUrl = new URL(subscription.endpoint);
  const audience = `${endpointUrl.protocol}//${endpointUrl.host}`;
  
  // Create expiration (12 hours from now)
  const expiration = Math.floor(Date.now() / 1000) + 12 * 60 * 60;
  
  // Create VAPID JWT
  const jwt = await createVapidJwt(audience, expiration);
  
  // Encrypt the payload
  const encryptedPayload = await encryptPayload(subscription, payloadString);
  
  console.log(`Sending push to ${subscription.endpoint}`);
  
  // Create a new ArrayBuffer copy to satisfy TypeScript
  const bodyBuffer = new Uint8Array(encryptedPayload).buffer;
  
  const response = await fetch(subscription.endpoint, {
    method: "POST",
    headers: {
      "Authorization": `vapid t=${jwt}, k=${VAPID_PUBLIC_KEY}`,
      "Content-Encoding": "aes128gcm",
      "Content-Type": "application/octet-stream",
      "TTL": "86400",
      "Urgency": "normal",
    },
    body: bodyBuffer,
  });
  
  console.log(`Push response status: ${response.status}`);
  if (!response.ok) {
    const text = await response.text();
    console.log(`Push response body: ${text}`);
  }
  
  return response;
}

Deno.serve(async (req) => {
  const origin = req.headers.get("Origin");
  const corsHeaders = getCorsHeaders(origin);

  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Validate VAPID keys are configured
    if (!VAPID_PUBLIC_KEY || !VAPID_PRIVATE_KEY) {
      console.error("VAPID keys not configured in environment secrets");
      return new Response(
        JSON.stringify({ error: "Push notification service not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

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
    console.log(`Request body action:`, body.action);

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
          JSON.stringify({ error: "Failed to save subscription. Please try again." }),
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
          JSON.stringify({ error: "Failed to unsubscribe. Please try again." }),
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
          JSON.stringify({ error: "Failed to schedule notification. Please try again." }),
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
          JSON.stringify({ error: "Failed to retrieve subscriptions. Please try again." }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      if (!subscriptions || subscriptions.length === 0) {
        return new Response(
          JSON.stringify({ error: "No push subscriptions found" }),
          { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Send push notification to all subscriptions
      const results = await Promise.all(
        subscriptions.map(async (sub) => {
          try {
            const response = await sendWebPush(
              {
                endpoint: sub.endpoint,
                keys: {
                  p256dh: sub.p256dh,
                  auth: sub.auth,
                },
              },
              {
                title: "🎉 Notifications Working!",
                body: "You will receive mood check-in reminders and session alerts.",
                icon: "/pwa-192x192.png",
                badge: "/pwa-192x192.png",
              }
            );
            
            // If subscription is gone (410), remove it
            if (response.status === 410) {
              await supabase
                .from("push_subscriptions")
                .delete()
                .eq("id", sub.id);
              return { endpoint: sub.endpoint, status: "expired" };
            }
            
            return { endpoint: sub.endpoint, status: response.ok ? "sent" : `failed:${response.status}` };
          } catch (error) {
            console.error(`Failed to send to ${sub.endpoint}:`, error);
            return { endpoint: sub.endpoint, status: "error" };
          }
        })
      );

      const successCount = results.filter(r => r.status === "sent").length;
      
      return new Response(
        JSON.stringify({ 
          success: successCount > 0, 
          message: `Sent ${successCount}/${results.length} notifications`,
          results 
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Send notification to a specific user (for scheduled notifications)
    if (body.action === "send") {
      const { userId, title, message, icon } = body;
      
      console.log(`Sending notification to user ${userId}`);

      const { data: subscriptions, error: subError } = await supabase
        .from("push_subscriptions")
        .select("*")
        .eq("user_id", userId);

      if (subError || !subscriptions || subscriptions.length === 0) {
        return new Response(
          JSON.stringify({ error: "No subscriptions found for user" }),
          { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const results = await Promise.all(
        subscriptions.map(async (sub) => {
          try {
            const response = await sendWebPush(
              {
                endpoint: sub.endpoint,
                keys: {
                  p256dh: sub.p256dh,
                  auth: sub.auth,
                },
              },
              {
                title,
                body: message,
                icon: icon || "/pwa-192x192.png",
                badge: "/pwa-192x192.png",
              }
            );
            
            if (response.status === 410) {
              await supabase
                .from("push_subscriptions")
                .delete()
                .eq("id", sub.id);
              return { status: "expired" };
            }
            
            return { status: response.ok ? "sent" : `failed:${response.status}` };
          } catch (error) {
            console.error(`Failed to send:`, error);
            return { status: "error" };
          }
        })
      );

      return new Response(
        JSON.stringify({ success: true, results }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ error: "Unknown action" }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Push notification error:", error);
    // Return generic error to client
    return new Response(
      JSON.stringify({ error: "Something went wrong. Please try again." }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
