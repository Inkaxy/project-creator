import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface ChatRequest {
  messages: { role: string; content: string }[];
  module: string;
  contextId?: string;
  contextType?: string;
}

// Module-specific system prompts
const modulePrompts: Record<string, string> = {
  equipment: `Du er CrewAI, en intelligent AI-assistent for utstyrsforvaltning i CrewPlan.
Du hjelper ansatte med:
- Tolke feilkoder og feilsøking basert på datablader
- Rengjøringsprosedyrer og daglig vedlikehold
- Serviceintervaller og vedlikeholdsrutiner
- Sikkerhetsinstrukser for utstyr
- Finne informasjon i tekniske datablader`,

  hms: `Du er CrewAI, en intelligent AI-assistent for HMS (Helse, Miljø og Sikkerhet) i CrewPlan.
Du hjelper ansatte med:
- Risikovurderinger og tiltak
- Vernerunder og oppfølging
- HMS-rutiner og prosedyrer
- Skade- og ulykkesrapportering
- HMS-roller og ansvar`,

  "ik-mat": `Du er CrewAI, en intelligent AI-assistent for internkontroll mat (IK-Mat) i CrewPlan.
Du hjelper ansatte med:
- Temperaturlogging og grenseverdier
- HACCP-prosedyrer og kontrollpunkter
- Sjekklister for åpning/stenging
- Hygiene og renholdsrutiner
- Dokumentasjonskrav fra Mattilsynet`,

  handbook: `Du er CrewAI, en intelligent AI-assistent for personalhåndboken i CrewPlan.
Du hjelper ansatte med:
- Ferieregler og rettigheter
- Sykemelding og egenmelding
- Arbeidsreglement og retningslinjer
- Permisjoner og fravær
- Oppsigelse og arbeidsforhold`,

  training: `Du er CrewAI, en intelligent AI-assistent for opplæring i CrewPlan.
Du hjelper ansatte med:
- Obligatoriske kurs og sertifiseringer
- Kursinnhold og læringsmål
- Sertifikatfornyelse og utløpsdatoer
- Kompetansekrav per funksjon`,

  fire: `Du er CrewAI, en intelligent AI-assistent for brannsikkerhet i CrewPlan.
Du hjelper ansatte med:
- Evakueringsprosedyrer
- Brannslukkerutstyr og plassering
- Brannøvelser og dokumentasjon
- Branninstrukser og varsling
- Bygningskart og rømningsveier`,

  routines: `Du er CrewAI, en intelligent AI-assistent for rutiner i CrewPlan.
Du hjelper ansatte med:
- Daglige rutiner og prosedyrer
- Sjekklister og oppgaver
- Ansvarsfordeling
- Dokumentasjon av utført arbeid`,

  schedule: `Du er CrewAI, en intelligent AI-assistent for vaktplanlegging i CrewPlan.
Du hjelper ansatte med:
- Arbeidstidsregler og lovverk
- Vaktbytte og overtid
- Helge- og helligdagsarbeid
- Pauser og hviletid`,

  general: `Du er CrewAI, en intelligent AI-assistent for CrewPlan.
Du hjelper ansatte med generelle spørsmål om systemet og arbeidsplassen.`,
};

// Type definitions for context data
interface EquipmentData {
  name: string;
  brand?: string;
  model?: string;
  serial_number?: string;
  status: string;
  notes?: string;
  category?: { name: string } | null;
}

interface DocumentData {
  name: string;
  document_type: string;
  file_url: string;
}

interface ServiceData {
  service_type: string;
  performed_at: string;
  notes?: string;
}

interface SectionData {
  title: string;
  content?: string;
}

interface RiskData {
  title: string;
  risk_level: string;
  status: string;
}

interface FireEquipmentData {
  type: string;
  location: string;
  last_inspection?: string;
}

interface CourseData {
  title: string;
  category?: string;
  is_required?: boolean;
}

// Fetch module-specific context from database
async function getModuleContext(
  supabase: any,
  module: string,
  contextId?: string
): Promise<string> {
  let context = "";

  try {
    switch (module) {
      case "equipment":
        if (contextId) {
          // Get equipment details
          const { data: equipment } = await supabase
            .from("equipment")
            .select(`
              *,
              category:equipment_categories(name),
              location:locations(name),
              department:departments(name),
              supplier:equipment_suppliers(name, phone_service)
            `)
            .eq("id", contextId)
            .single();

          const eq = equipment as EquipmentData | null;
          if (eq) {
            context += `\n\nAktuelt utstyr:\n`;
            context += `- Navn: ${eq.name}\n`;
            context += `- Merke/Modell: ${eq.brand || "Ukjent"} ${eq.model || ""}\n`;
            context += `- Serienummer: ${eq.serial_number || "Ikke oppgitt"}\n`;
            context += `- Kategori: ${eq.category?.name || "Ukjent"}\n`;
            context += `- Status: ${eq.status}\n`;
            if (eq.notes) context += `- Notater: ${eq.notes}\n`;
          }

          // Get datasheets
          const { data: documents } = await supabase
            .from("equipment_documents")
            .select("name, document_type, file_url")
            .eq("equipment_id", contextId)
            .eq("document_type", "datasheet");

          const docs = documents as DocumentData[] | null;
          if (docs && docs.length > 0) {
            context += `\nTilgjengelige datablader:\n`;
            docs.forEach((doc) => {
              context += `- ${doc.name}: ${doc.file_url}\n`;
            });
          }

          // Get recent services
          const { data: services } = await supabase
            .from("equipment_services")
            .select("service_type, performed_at, notes")
            .eq("equipment_id", contextId)
            .order("performed_at", { ascending: false })
            .limit(3);

          const svcs = services as ServiceData[] | null;
          if (svcs && svcs.length > 0) {
            context += `\nSiste service:\n`;
            svcs.forEach((s) => {
              context += `- ${s.service_type} (${new Date(s.performed_at).toLocaleDateString("nb-NO")})\n`;
            });
          }
        }
        break;

      case "handbook":
        // Get handbook sections overview
        const { data: sections } = await supabase
          .from("handbook_sections")
          .select("title, content")
          .eq("is_published", true)
          .order("sort_order")
          .limit(10);

        const secs = sections as SectionData[] | null;
        if (secs && secs.length > 0) {
          context += `\n\nPersonalhåndbok kapitler:\n`;
          secs.forEach((s) => {
            context += `- ${s.title}\n`;
          });
        }
        break;

      case "hms":
        // Get active risks
        const { data: risks } = await supabase
          .from("hms_risks")
          .select("title, risk_level, status, mitigation")
          .eq("status", "active")
          .limit(5);

        const riskList = risks as RiskData[] | null;
        if (riskList && riskList.length > 0) {
          context += `\n\nAktive risikovurderinger:\n`;
          riskList.forEach((r) => {
            context += `- ${r.title} (Risikonivå: ${r.risk_level})\n`;
          });
        }
        break;

      case "fire":
        // Get fire equipment
        const { data: fireEquipment } = await supabase
          .from("fire_equipment")
          .select("type, location, last_inspection")
          .limit(10);

        const fireEq = fireEquipment as FireEquipmentData[] | null;
        if (fireEq && fireEq.length > 0) {
          context += `\n\nBrannutstyr:\n`;
          fireEq.forEach((e) => {
            context += `- ${e.type}: ${e.location}\n`;
          });
        }
        break;

      case "training":
        // Get courses overview
        const { data: courses } = await supabase
          .from("courses")
          .select("title, category, is_required")
          .eq("is_active", true)
          .limit(10);

        const courseList = courses as CourseData[] | null;
        if (courseList && courseList.length > 0) {
          context += `\n\nTilgjengelige kurs:\n`;
          courseList.forEach((c) => {
            context += `- ${c.title} (${c.category || "Generelt"})${c.is_required ? " - Obligatorisk" : ""}\n`;
          });
        }
        break;
    }
  } catch (error) {
    console.error("Error fetching context:", error);
  }

  return context;
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { messages, module, contextId, contextType }: ChatRequest = await req.json();

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get LOVABLE_API_KEY
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    // Get module-specific context
    const moduleContext = await getModuleContext(supabase, module, contextId);

    // Build system prompt
    const basePrompt = modulePrompts[module] || modulePrompts.general;
    const systemPrompt = `${basePrompt}
${moduleContext}

Retningslinjer:
- Svar alltid på norsk
- Vær konkret og handlingsrettet
- Referer til spesifikke dokumenter eller rutiner når relevant
- For kritiske HMS/sikkerhetsspørsmål, anbefal å kontakte ansvarlig person
- Hold svarene konsise men informative`;

    console.log("CrewAI request:", { module, contextId, messageCount: messages.length });

    // Call Lovable AI Gateway
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
          ...messages,
        ],
        stream: true,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "For mange forespørsler. Vennligst vent litt og prøv igjen." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "AI-kreditter er oppbrukt. Kontakt administrator." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      return new Response(
        JSON.stringify({ error: "Kunne ikke kontakte AI-tjenesten" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Return streaming response
    return new Response(response.body, {
      headers: {
        ...corsHeaders,
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
    });
  } catch (error) {
    console.error("CrewAI chat error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Ukjent feil" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
