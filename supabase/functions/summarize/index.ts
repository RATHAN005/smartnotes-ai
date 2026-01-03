import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { content, length, tone, bulletPoints } = await req.json();

    if (!content || typeof content !== "string" || content.trim().length === 0) {
      return new Response(
        JSON.stringify({ error: "Content is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    // Build the prompt based on options
    const lengthInstructions = {
      short: "Keep the summary very concise, around 2-3 sentences.",
      medium: "Provide a balanced summary, around 4-6 sentences.",
      long: "Create a comprehensive summary, around 8-10 sentences.",
    };

    const toneInstructions = {
      academic: "Use formal, scholarly language suitable for academic contexts.",
      casual: "Use friendly, conversational language that's easy to understand.",
      professional: "Use clear, professional business language.",
    };

    const formatInstructions = bulletPoints
      ? "Format the summary as bullet points."
      : "Write the summary as a coherent paragraph.";

    const systemPrompt = `You are an expert text summarizer. Your task is to:
1. Generate a concise, descriptive title for the content
2. Create a summary following these guidelines:
   - ${lengthInstructions[length as keyof typeof lengthInstructions] || lengthInstructions.medium}
   - ${toneInstructions[tone as keyof typeof toneInstructions] || toneInstructions.professional}
   - ${formatInstructions}
3. Extract 3-7 key keywords or phrases from the content

Respond with a JSON object containing:
- title: A short, descriptive title (max 10 words)
- summary: The summarized content
- keywords: An array of key terms/phrases`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: `Please summarize the following content:\n\n${content}` },
        ],
        response_format: { type: "json_object" },
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded. Please try again in a moment." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "Usage limit reached. Please add credits to continue." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      throw new Error(`AI gateway error: ${response.status}`);
    }

    const data = await response.json();
    const resultText = data.choices?.[0]?.message?.content;

    if (!resultText) {
      throw new Error("No response from AI");
    }

    // Parse the JSON response
    let result;
    try {
      result = JSON.parse(resultText);
    } catch {
      // Fallback if JSON parsing fails
      result = {
        title: "Untitled Summary",
        summary: resultText,
        keywords: [],
      };
    }

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Summarize error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
