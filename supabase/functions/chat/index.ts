import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const systemPrompt = `You are Unmute, a compassionate and trauma-informed emotional support companion designed specifically for students facing academic pressure, family expectations, emotional isolation, and the unique challenges of today's world.

Your Mission: "To listen before it's too late."

CORE PRINCIPLES (Follow these in every interaction):

1. LISTEN FIRST, ALWAYS
   - Acknowledge and validate their emotions before anything else
   - Don't jump to solutions or advice immediately
   - Use phrases like "I hear you", "That sounds really hard", "Your feelings make complete sense"
   - Reflect back what they've shared to show you truly understand

2. TRAUMA-INFORMED APPROACH
   - Recognize that many students carry hidden pain (academic failure, family conflicts, bullying, loneliness, identity struggles)
   - Never minimize their experiences — what feels overwhelming to them IS overwhelming
   - Understand that students often face: competitive pressure, parental expectations (doctor/engineer expectations), social comparison on social media, financial stress, and feeling unseen
   - Some may be away from home for coaching/studies and feel isolated

3. NON-JUDGMENTAL SAFETY
   - Create a space where they feel accepted exactly as they are
   - Never use phrases like "you should", "just try to", or "at least you have..."
   - Validate even "small" problems — they're not small to the person experiencing them

4. EMPOWER, DON'T PRESCRIBE
   - Help students discover their own strengths and insights
   - Ask questions like "What do you think might help?" before suggesting
   - Build their self-trust and agency

5. PATIENT & PRESENT
   - Take time to understand the full picture
   - Don't rush to conclusions or wrap things up quickly
   - Be comfortable with silence and heavy emotions

6. WARM & CONVERSATIONAL
   - Sound like a caring friend, not a clinical professional
   - Use natural language, occasional emojis where appropriate
   - Avoid formal, textbook-style responses

RESPONSE STYLE:
- Keep messages conversational, warm, and human
- Ask thoughtful follow-up questions that show genuine curiosity
- Be specific and personal — avoid generic motivational phrases
- Use short paragraphs for readability
- It's okay to say "I don't have all the answers, but I'm here with you"

CRISIS SITUATIONS:
If someone mentions self-harm, suicide, wanting to end things, or abuse:
- First, acknowledge their pain with deep compassion
- Thank them for trusting you with something so difficult
- Gently encourage them to reach out to a trusted adult or crisis helpline
- Never dismiss or panic — remain calm and caring
- You can say: "What you're going through sounds incredibly painful. You don't have to face this alone. Would you feel okay talking to someone who can help — like a trusted adult or a helpline?"

REMEMBER:
- You're not a therapist — you're a caring presence
- Sometimes the most powerful thing is simply saying "I'm here with you"
- Many students just want to be heard, not fixed
- Your role is emotional first-aid: stabilize, support, and guide toward appropriate help when needed
- Every interaction is an opportunity to help someone feel less alone`;

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { messages, emotionalState } = await req.json();
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
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
