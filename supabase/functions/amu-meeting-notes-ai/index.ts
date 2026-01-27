import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { agendaItems, meetingContext, action } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    let systemPrompt = `Du er en profesjonell møtesekretær for AMU (Arbeidsmiljøutvalg) møter i Norge. 
Du skriver klare, konsise og formelle møtenotater på norsk.

Viktige prinsipper:
- Bruk formelt, profesjonelt språk
- Vær konkret og spesifikk
- Fokuser på beslutninger, handlingspunkter og ansvarsfordeling
- Strukturer notater tydelig
- Inkluder relevante detaljer uten å være for ordrik`;

    let userPrompt = "";

    if (action === "generate_notes") {
      userPrompt = `Basert på følgende agendapunkter fra et AMU-møte, generer profesjonelle møtenotater.

Møtekontekst:
- Tittel: ${meetingContext?.title || "AMU-møte"}
- Dato: ${meetingContext?.date || "Ikke spesifisert"}
- Sted: ${meetingContext?.location || "Ikke spesifisert"}

Agendapunkter:
${agendaItems.map((item: any, i: number) => `
${i + 1}. ${item.title}
   Beskrivelse: ${item.description || "Ingen beskrivelse"}
   Eksisterende notater: ${item.notes || "Ingen notater ennå"}
`).join("\n")}

Generer strukturerte møtenotater for hvert agendapunkt. For hvert punkt, inkluder:
- Kort sammendrag av diskusjonen
- Eventuelle beslutninger
- Handlingspunkter med ansvarlig (hvis relevant)

Svar i JSON-format:
{
  "notes": [
    {
      "itemIndex": 0,
      "notes": "Diskusjonsnotater her...",
      "decision": "Beslutning hvis relevant, ellers null"
    }
  ],
  "generalNotes": "Overordnede notater fra møtet"
}`;
    } else if (action === "summarize") {
      userPrompt = `Oppsummer følgende AMU-møtenotater til et kort referat.

Møtekontekst:
- Tittel: ${meetingContext?.title || "AMU-møte"}
- Dato: ${meetingContext?.date || "Ikke spesifisert"}

Agendapunkter med notater:
${agendaItems.map((item: any, i: number) => `
${i + 1}. ${item.title}
   Notater: ${item.notes || "Ingen notater"}
   Beslutning: ${item.decision || "Ingen beslutning"}
`).join("\n")}

Generelle notater: ${meetingContext?.generalNotes || "Ingen"}

Lag et kort, profesjonelt referat (maks 300 ord) som oppsummerer de viktigste punktene, beslutningene og handlingspunktene.`;
    } else if (action === "suggest_decision") {
      userPrompt = `Basert på følgende diskusjonsnotater fra et AMU-agendapunkt, foreslå en passende beslutning.

Agendapunkt: ${agendaItems[0]?.title || "Ukjent"}
Beskrivelse: ${agendaItems[0]?.description || "Ingen beskrivelse"}
Notater fra diskusjonen: ${agendaItems[0]?.notes || "Ingen notater"}

Foreslå en kort, konkret beslutning (1-2 setninger) som AMU kan vedta basert på diskusjonen. Hvis notatene ikke gir grunnlag for en beslutning, foreslå "Saken tas til orientering" eller lignende.`;
    } else {
      throw new Error("Ugyldig action");
    }

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        temperature: 0.7,
        max_tokens: 2000,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "For mange forespørsler. Vennligst vent litt." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "AI-kreditter oppbrukt." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      
      throw new Error("AI gateway error");
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || "";

    // Try to parse JSON response for generate_notes action
    let result: { content: string; parsed?: unknown } = { content };
    if (action === "generate_notes") {
      try {
        // Extract JSON from the response
        const jsonMatch = content.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          result = { ...result, parsed: JSON.parse(jsonMatch[0]) };
        }
      } catch (e) {
        console.log("Could not parse JSON from response, returning raw content");
      }
    }

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("AMU meeting notes AI error:", error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : "Ukjent feil" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
