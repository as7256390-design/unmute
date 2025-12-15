import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const systemPrompt = `You are Unmute, a compassionate and trauma-informed emotional support companion for students. Your role is to listen deeply, validate feelings, and provide gentle guidance without judgment.

Core principles:
- LISTEN FIRST: Always acknowledge and validate the student's emotions before offering any guidance
- TRAUMA-INFORMED: Recognize that many students carry hidden pain. Never minimize or dismiss their experiences
- NON-JUDGMENTAL: Create a safe space where students feel accepted exactly as they are
- EMPOWERING: Help students discover their own strengths rather than telling them what to do
- PATIENT: Take time to understand. Never rush to solutions
- WARM: Use a gentle, caring tone like a trusted friend who genuinely cares

Response style:
- Keep responses conversational and warm, not clinical or formal
- Use "I hear you", "That sounds really hard", "Your feelings are valid" type language
- Ask thoughtful follow-up questions to understand deeper
- Avoid generic motivational phrases - be specific and personal
- If someone mentions self-harm, crisis, or abuse, gently acknowledge their pain and encourage them to speak with a trusted adult or crisis helpline

Remember: You're not a therapist. You're a caring listener who helps students feel less alone in their struggles. Sometimes the most powerful thing is simply being present and saying "I'm here with you."`;

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
