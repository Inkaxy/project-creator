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

// Module name mapping
const moduleNames: Record<string, string> = {
  equipment: "Utstyr",
  hms: "HMS",
  "ik-mat": "IK-Mat",
  handbook: "Personalhåndbok",
  training: "Opplæring",
  fire: "Brannsikkerhet",
  routines: "Rutiner",
  schedule: "Vaktplan",
  absence: "Fravær",
  timesheets: "Timelister",
  deviations: "Avvik",
  employees: "Ansatte",
  payroll: "Lønn",
  settings: "Innstillinger",
  general: "Dashboard",
};

// Universal system prompt
const universalSystemPrompt = `Du er CrewAI, en intelligent og hjelpsom AI-assistent for CrewPlan – et komplett system for personaladministrasjon, vaktplanlegging og internkontroll.

DU KAN HJELPE MED ALT I CREWPLAN:

📦 UTSTYR
- Tolke feilkoder og feilsøking basert på datablader
- Rengjøringsprosedyrer og daglig vedlikehold
- Serviceintervaller og vedlikeholdsrutiner
- Sikkerhetsinstrukser for utstyr

🛡️ HMS (Helse, Miljø og Sikkerhet)
- Risikovurderinger og tiltak
- Vernerunder og oppfølging
- HMS-rutiner og prosedyrer
- Skade- og ulykkesrapportering
- HMS-roller og ansvar

🍽️ IK-MAT (Internkontroll Mat)
- Temperaturlogging og grenseverdier
- HACCP-prosedyrer og kontrollpunkter
- Sjekklister for åpning/stenging
- Hygiene og renholdsrutiner
- Dokumentasjonskrav fra Mattilsynet

📖 PERSONALHÅNDBOK
- Ferieregler og rettigheter
- Sykemelding og egenmelding
- Arbeidsreglement og retningslinjer
- Permisjoner og fravær
- Oppsigelse og arbeidsforhold

📅 VAKTPLAN
- Arbeidstidsregler og lovverk
- Vaktbytte og overtid
- Helge- og helligdagsarbeid
- Pauser og hviletid

🏖️ FRAVÆR OG PERMISJONER
- Søke om ferie, avspasering og permisjoner
- Forstå feriekvoter og saldoer
- Regler for ulike fraværstyper
- Status på fraværssøknader
- Beregne antall dager for fraværsperioder

⏱️ TIMELISTER
- Stempling inn/ut og pauseregistrering
- Timeliste-godkjenning og avvik
- Overtidsberegning og kompensasjon
- Fleksitidsaldo og timebank
- Korrigere feilstemplinger

🎓 OPPLÆRING
- Obligatoriske kurs og sertifiseringer
- Kursinnhold og læringsmål
- Sertifikatfornyelse og utløpsdatoer
- Kompetansekrav per funksjon

🔥 BRANNSIKKERHET
- Evakueringsprosedyrer
- Brannslukkerutstyr og plassering
- Brannøvelser og dokumentasjon
- Branninstrukser og varsling
- Bygningskart og rømningsveier

📋 RUTINER
- Daglige rutiner og prosedyrer
- Sjekklister og oppgaver
- Ansvarsfordeling
- Dokumentasjon av utført arbeid

⚠️ AVVIK
- Rapportere HMS-avvik, bekymringer og idéer
- Forstå avviksstatus og oppfølging
- Bekrefte at avvik er lukket
- Korrigerende og forebyggende tiltak

RETNINGSLINJER:
- Svar alltid på norsk
- Vær konkret og handlingsrettet
- Referer til spesifikke dokumenter eller rutiner når relevant
- For kritiske HMS/sikkerhetsspørsmål, anbefal å kontakte ansvarlig person
- Hold svarene konsise men informative
- Hvis brukeren spør om noe utenfor nåværende side, hjelp dem likevel!`;

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

interface AbsenceTypeData {
  name: string;
  affects_salary: boolean | null;
  requires_documentation: boolean | null;
  from_account: string | null;
}

interface WorkTimeRulesData {
  max_hours_per_day: number | null;
  max_hours_per_week: number | null;
  min_rest_hours_between_shifts: number | null;
}

interface TimesheetSettingsData {
  auto_approve_within_margin: boolean | null;
  margin_minutes: number | null;
  require_explanation_above_minutes: number | null;
}

interface DeviationData {
  title: string;
  category: string;
  severity: string;
  status: string;
}

interface FunctionData {
  name: string;
  short_name?: string;
}

// Fetch general context that's useful across all modules
async function getGeneralContext(supabase: any): Promise<string> {
  let context = "";

  try {
    // Get absence types
    const { data: absenceTypes } = await supabase
      .from("absence_types")
      .select("name, affects_salary, requires_documentation, from_account")
      .eq("is_active", true);

    const absTypes = absenceTypes as AbsenceTypeData[] | null;
    if (absTypes && absTypes.length > 0) {
      context += "\nTilgjengelige fraværstyper:\n";
      absTypes.forEach((t) => {
        context += `- ${t.name}`;
        if (t.from_account) context += ` (fra konto: ${t.from_account})`;
        if (t.requires_documentation) context += " [Krever dokumentasjon]";
        context += "\n";
      });
    }

    // Get work time rules
    const { data: workRules } = await supabase
      .from("work_time_rules")
      .select("*")
      .limit(1)
      .single();

    const rules = workRules as WorkTimeRulesData | null;
    if (rules) {
      context += "\nArbeidstidsregler:\n";
      if (rules.max_hours_per_day) context += `- Maks timer/dag: ${rules.max_hours_per_day}\n`;
      if (rules.max_hours_per_week) context += `- Maks timer/uke: ${rules.max_hours_per_week}\n`;
      if (rules.min_rest_hours_between_shifts) context += `- Min hviletid mellom vakter: ${rules.min_rest_hours_between_shifts} timer\n`;
    }

    // Get timesheet settings
    const { data: tsSettings } = await supabase
      .from("timesheet_settings")
      .select("*")
      .limit(1)
      .single();

    const settings = tsSettings as TimesheetSettingsData | null;
    if (settings) {
      context += "\nTimelisteinnstillinger:\n";
      context += `- Auto-godkjenning: ${settings.auto_approve_within_margin ? "Ja" : "Nei"}\n`;
      if (settings.margin_minutes) context += `- Margin for godkjenning: ${settings.margin_minutes} minutter\n`;
    }
  } catch (error) {
    console.error("Error fetching general context:", error);
  }

  return context;
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
            context += `\nAktuelt utstyr:\n`;
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
              context += `- ${doc.name}\n`;
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
          context += `\nPersonalhåndbok kapitler:\n`;
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
          context += `\nAktive risikovurderinger:\n`;
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
          context += `\nBrannutstyr:\n`;
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
          context += `\nTilgjengelige kurs:\n`;
          courseList.forEach((c) => {
            context += `- ${c.title} (${c.category || "Generelt"})${c.is_required ? " - Obligatorisk" : ""}\n`;
          });
        }
        break;

      case "schedule":
        // Get functions/roles
        const { data: functions } = await supabase
          .from("functions")
          .select("name, short_name")
          .eq("is_active", true)
          .limit(10);

        const funcList = functions as FunctionData[] | null;
        if (funcList && funcList.length > 0) {
          context += `\nRoller/Funksjoner:\n`;
          funcList.forEach((f) => {
            context += `- ${f.name}${f.short_name ? ` (${f.short_name})` : ""}\n`;
          });
        }
        break;

      case "deviations":
        // Get recent open deviations
        const { data: openDeviations } = await supabase
          .from("deviations")
          .select("title, category, severity, status")
          .in("status", ["open", "in_progress"])
          .order("created_at", { ascending: false })
          .limit(5);

        const devList = openDeviations as DeviationData[] | null;
        if (devList && devList.length > 0) {
          context += `\nÅpne avvik:\n`;
          devList.forEach((d) => {
            context += `- ${d.title} (${d.category}, ${d.severity})\n`;
          });
        }
        break;
    }
  } catch (error) {
    console.error("Error fetching module context:", error);
  }

  return context;
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { messages, module, contextId }: ChatRequest = await req.json();

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get LOVABLE_API_KEY
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    // Get contexts
    const [moduleContext, generalContext] = await Promise.all([
      getModuleContext(supabase, module, contextId),
      getGeneralContext(supabase),
    ]);

    // Build full context
    const moduleName = moduleNames[module] || "CrewPlan";
    const fullContext = `
BRUKERENS NÅVÆRENDE SIDE: ${moduleName}
${moduleContext}

GENERELL INFORMASJON:
${generalContext}`;

    // Build system prompt with context
    const systemPrompt = `${universalSystemPrompt}

${fullContext}`;

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
