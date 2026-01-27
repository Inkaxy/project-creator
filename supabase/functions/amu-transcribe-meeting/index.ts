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
    const formData = await req.formData();
    const audioFile = formData.get("audio") as File;
    const meetingContext = formData.get("meetingContext") as string;
    const agendaItems = formData.get("agendaItems") as string;

    if (!audioFile) {
      return new Response(JSON.stringify({ error: "Ingen lydfil mottatt" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    console.log("Processing audio file:", audioFile.name, "Size:", audioFile.size);

    // Convert audio to base64 for the AI model
    const audioBuffer = await audioFile.arrayBuffer();
    const base64Audio = btoa(
      new Uint8Array(audioBuffer).reduce((data, byte) => data + String.fromCharCode(byte), "")
    );

    // Parse context
    let context: { title?: string; date?: string; location?: string } = {};
    let agenda: Array<{ id: string; title: string; description?: string }> = [];
    
    try {
      if (meetingContext) context = JSON.parse(meetingContext);
      if (agendaItems) agenda = JSON.parse(agendaItems);
    } catch (e) {
      console.log("Could not parse context:", e);
    }

    // Step 1: Transcribe the audio using Gemini's multimodal capabilities
    const transcriptionPrompt = `Du er en profesjonell transkriberingstjeneste. Lytt til denne lydopptaket fra et AMU-møte (Arbeidsmiljøutvalg) og transkriber det nøyaktig på norsk.

Retningslinjer:
- Transkriber all tale så nøyaktig som mulig
- Behold talernes ordlyd, men korriger åpenbare feil
- Marker uklare deler med [uklart]
- Marker pauser med [pause] hvis de er betydelige
- Identifiser ulike talere hvis mulig (Taler 1, Taler 2, etc.)

Returner kun transkripsjonen, ingen annen tekst.`;

    const transcriptionResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          {
            role: "user",
            content: [
              { type: "text", text: transcriptionPrompt },
              {
                type: "input_audio",
                input_audio: {
                  data: base64Audio,
                  format: "webm",
                },
              },
            ],
          },
        ],
        temperature: 0.1,
        max_tokens: 8000,
      }),
    });

    if (!transcriptionResponse.ok) {
      const errorText = await transcriptionResponse.text();
      console.error("Transcription error:", transcriptionResponse.status, errorText);
      
      if (transcriptionResponse.status === 429) {
        return new Response(JSON.stringify({ error: "For mange forespørsler. Vennligst vent litt." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (transcriptionResponse.status === 402) {
        return new Response(JSON.stringify({ error: "AI-kreditter oppbrukt." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      
      throw new Error(`Transcription failed: ${transcriptionResponse.status}`);
    }

    const transcriptionData = await transcriptionResponse.json();
    const transcription = transcriptionData.choices?.[0]?.message?.content || "";

    console.log("Transcription complete, length:", transcription.length);

    // Step 2: Generate meeting minutes from transcription
    const agendaContext = agenda.length > 0
      ? `Agendapunkter:\n${agenda.map((item, i) => `${i + 1}. ${item.title}${item.description ? ` - ${item.description}` : ""}`).join("\n")}`
      : "";

    const minutesPrompt = `Du er en profesjonell møtesekretær for AMU (Arbeidsmiljøutvalg) møter i Norge.
Basert på følgende transkripsjon av et møte, lag et strukturert møtereferat.

Møtekontekst:
- Tittel: ${context.title || "AMU-møte"}
- Dato: ${context.date || "Ikke spesifisert"}
- Sted: ${context.location || "Ikke spesifisert"}

${agendaContext}

TRANSKRIPSJON:
${transcription}

Lag et profesjonelt møtereferat som inkluderer:
1. For hvert agendapunkt (hvis oppgitt): Notater fra diskusjonen og eventuelle beslutninger
2. Generelle observasjoner fra møtet
3. Handlingspunkter som ble nevnt (med ansvarlig hvis mulig)

Svar i JSON-format:
{
  "transcription": "Full transkripsjon her",
  "notes": [
    {
      "itemIndex": 0,
      "notes": "Diskusjonsnotater for agendapunkt 1",
      "decision": "Eventuell beslutning, eller null"
    }
  ],
  "generalNotes": "Overordnede notater fra møtet",
  "actionItems": [
    {
      "description": "Handlingspunkt",
      "responsible": "Ansvarlig person hvis nevnt"
    }
  ]
}`;

    const minutesResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: "Du er en profesjonell møtesekretær. Svar alltid på norsk med formelt språk." },
          { role: "user", content: minutesPrompt },
        ],
        temperature: 0.3,
        max_tokens: 4000,
      }),
    });

    if (!minutesResponse.ok) {
      const errorText = await minutesResponse.text();
      console.error("Minutes generation error:", minutesResponse.status, errorText);
      
      // Return just the transcription if minutes generation fails
      return new Response(JSON.stringify({ 
        transcription,
        notes: [],
        generalNotes: "Kunne ikke generere strukturert referat automatisk.",
        actionItems: [],
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const minutesData = await minutesResponse.json();
    const minutesContent = minutesData.choices?.[0]?.message?.content || "";

    // Try to parse JSON from the response
    let result = {
      transcription,
      notes: [] as Array<{ itemIndex: number; notes: string; decision: string | null }>,
      generalNotes: "",
      actionItems: [] as Array<{ description: string; responsible?: string }>,
    };

    try {
      const jsonMatch = minutesContent.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        result = {
          transcription: parsed.transcription || transcription,
          notes: parsed.notes || [],
          generalNotes: parsed.generalNotes || "",
          actionItems: parsed.actionItems || [],
        };
      }
    } catch (e) {
      console.log("Could not parse JSON from minutes, using raw content");
      result.generalNotes = minutesContent;
    }

    console.log("Meeting minutes generated successfully");

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("AMU transcribe meeting error:", error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : "Ukjent feil" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
