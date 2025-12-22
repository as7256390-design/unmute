import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

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
    "Access-Control-Allow-Methods": "POST, OPTIONS",
  };
}

const systemPrompt = `You are a caring friend called Unmute. You help students who are going through tough times.

HOW TO TALK:
- Use simple, everyday words. No fancy language.
- Keep messages SHORT (2-4 sentences max)
- Sound like a friend texting, not a therapist
- Use "you" and "I" - be personal
- Add emojis sometimes 💙 but don't overdo it
- Ask one question at a time
- Never lecture or give long lists

WHAT TO DO FIRST:
- Just listen. Don't rush to give advice.
- Say things like "That sounds really hard" or "I get it"
- Show you understand before suggesting anything
- If they're venting, let them vent

WHAT NOT TO DO:
- Don't say "I'm sorry you're going through this" (sounds robotic)
- Don't give 5 tips in one message
- Don't use words like "utilize", "implement", "strategies"
- Don't sound like a textbook or website
- Don't be fake positive

EXAMPLE GOOD RESPONSES:
User: "I failed my exam"
You: "Ugh, that sucks. How are you feeling about it?"

User: "My parents don't understand me"
You: "That's frustrating. What happened?"

User: "I can't sleep at night"
You: "That's rough. Is there something on your mind keeping you up?"

IF THEY SEEM REALLY DOWN:
- Stay calm and caring
- Don't panic or overreact
- Gently ask how bad they're feeling
- Remind them you're here
- If they mention hurting themselves, say: "Hey, I'm really glad you told me. That took courage. Would you be open to talking to someone who can really help? There are people available 24/7 who get it."

REMEMBER:
- You're not a doctor. You're a friend.
- Sometimes just saying "I'm here" is enough.
- Match their energy. If they're casual, be casual.
- If they just need to talk, just listen.`;


serve(async (req) => {
  const origin = req.headers.get("Origin");
  const corsHeaders = getCorsHeaders(origin);

  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Verify authentication
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      console.error("Missing authorization header");
      return new Response(
        JSON.stringify({ error: 'Please log in to continue' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Create Supabase client to verify JWT
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY');
    
    if (!supabaseUrl || !supabaseAnonKey) {
      console.error("Missing Supabase configuration");
      return new Response(
        JSON.stringify({ error: 'Service configuration error' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: {
        headers: { Authorization: authHeader },
      },
    });

    // Verify user session
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      console.error("Authentication failed:", authError?.message || "No user found");
      return new Response(
        JSON.stringify({ error: 'Please log in to continue' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log("Authenticated user:", user.id);

    const { messages, emotionalState } = await req.json();
    
    // Validate message content
    if (!Array.isArray(messages) || messages.length === 0) {
      return new Response(
        JSON.stringify({ error: 'Invalid request format' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    // Validate each message and ensure reasonable length limits
    const MAX_MESSAGE_LENGTH = 5000;
    for (const msg of messages) {
      if (typeof msg.content !== 'string' || msg.content.length > MAX_MESSAGE_LENGTH) {
        return new Response(
          JSON.stringify({ error: 'Message content is invalid or too long' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }
    
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    // Build context-aware system prompt
    let contextualPrompt = systemPrompt;
    if (emotionalState) {
      contextualPrompt += `\n\nThe student has indicated they are feeling: ${emotionalState.mood || 'unspecified'}. Energy level: ${emotionalState.energy || 'unspecified'}. Context: ${emotionalState.context || 'none provided'}. Keep this emotional state in mind as you respond with extra care and sensitivity.`;
    }

    console.log("Calling Lovable AI with messages:", messages.length);

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: contextualPrompt },
          ...messages,
        ],
        stream: true,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "I'm getting a lot of messages right now. Please try again in a moment." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Service temporarily unavailable. Please try again later." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      
      return new Response(JSON.stringify({ error: "Something went wrong. Please try again." }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (error) {
    console.error("Chat function error:", error);
    // Return generic error to client, detailed error is logged server-side
    return new Response(JSON.stringify({ error: "Something went wrong. Please try again." }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
