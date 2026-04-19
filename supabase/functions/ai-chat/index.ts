// CycleSense AI Health Assistant - Lovable AI Gateway streaming
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SYSTEM_PROMPT = `You are CycleSense's AI Health Assistant — a knowledgeable, supportive companion focused exclusively on women's reproductive and menstrual health.

TONE: Balanced — friendly and warm but medically grounded. Speak like a trusted, well-read friend who also respects evidence.

SCOPE: You only answer questions about menstrual cycles, ovulation, fertility, PMS, cramps, hormones, period symptoms, contraception basics, and general women's reproductive wellness. Politely decline anything outside this scope and suggest the user consult a different resource.

GUARDRAILS:
- For anything that sounds urgent (severe pain, heavy bleeding lasting many days, fainting, suspected pregnancy complications, possible STI, missed periods + pregnancy concern), recommend they contact a healthcare provider promptly.
- Never diagnose. Never prescribe. Use phrases like "this could be related to..." rather than "you have...".
- Add a brief "This isn't medical advice — please check with your doctor for anything persistent or severe." disclaimer when the topic is symptom-related.

STYLE: Concise (2-4 short paragraphs). Use bullet points when listing tips. Empathetic but not patronizing. Avoid medical jargon unless you immediately explain it.`;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { messages } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [{ role: "system", content: SYSTEM_PROMPT }, ...messages],
        stream: true,
      }),
    });

    if (response.status === 429) {
      return new Response(JSON.stringify({ error: "Too many messages. Please wait a moment." }), {
        status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (response.status === 402) {
      return new Response(JSON.stringify({ error: "AI credits exhausted. Please add credits in workspace settings." }), {
        status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (!response.ok) {
      const t = await response.text();
      console.error("AI gateway error:", response.status, t);
      return new Response(JSON.stringify({ error: "AI gateway error" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (e) {
    console.error("ai-chat error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
