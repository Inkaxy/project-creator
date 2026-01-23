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
  "ik-logging": "IK-Logging",
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
  crewshare: "CrewShare",
  sickleave: "Sykefravær",
  dashboard: "Dashboard",
  general: "Dashboard",
};

// Universal system prompt - now focused on concrete data and clean formatting
const universalSystemPrompt = `Du er CrewAI, en intelligent assistent for ledere i CrewPlan. Du gir KONKRETE SVAR med faktiske tall og data.

FORMATERINGSKRAV (VIKTIG!):
- IKKE bruk markdown-stjerner (**, ***, osv.) - bruk vanlig tekst
- Bruk tabeller for oversiktlig data (spesielt for flere ansatte/verdier)
- Bruk enkle lister med bindestreker for kortere opplisting
- Hold svarene strukturerte og lettleste
- Bruk overskrifter med emoji kun for hovedseksjoner

TABELLFORMAT FOR DATA:
Når du presenterer data for flere ansatte eller sammenligninger, bruk dette formatet:

| Ansatt | Feriedager igjen | Totalt | Brukt |
|--------|------------------|--------|-------|
| Ola N. | 15               | 25     | 10    |
| Kari H.| 8                | 25     | 17    |

EKSEMPLER PÅ GODE SVAR:

Spørsmål: "Hvor mange feriedager har Ola igjen?"
Svar: Ola Nordmann har 15 feriedager igjen av 25 totalt i 2025 (brukt 10 dager).

Spørsmål: "Oversikt over feriedager for alle"
Svar: 
📊 Feriedagsoversikt 2025

| Ansatt | Igjen | Totalt | Brukt |
|--------|-------|--------|-------|
| Ola N. | 15    | 25     | 10    |
| Kari H.| 8     | 25     | 17    |
| Per O. | 22    | 25     | 3     |

Spørsmål: "Hvem er sykemeldt?"
Svar:
🤒 Aktive sykemeldinger

Per Olsen
- Type: Sykmelding 100%
- Periode: 15.01 - 29.01.2025
- Arbeidsgiverperiode: Dag 8 av 16 (8 dager igjen før NAV overtar)

HVA DU KAN HJELPE MED:
- Ansattdata: Feriedager, egenmeldinger, sykefravær, vakter
- Vaktplan: Hvem jobber i dag/denne uken, ledige vakter
- Timelister: Timer logget, avvik, godkjenningsstatus
- Fravær: Søknader, status, fraværshistorikk
- Sykefravær: Sykemeldinger, arbeidsgiverperiode, oppfølging

RETNINGSLINJER:
- Svar alltid på norsk med ryddig formatering
- Gi KONKRETE tall fra dataene, ikke generelle forklaringer
- Bruk tabeller for sammenligning og oversikter
- Hvis data mangler, si det tydelig
- Hold svarene konsise og strukturerte`;

// Type definitions
interface EmployeeData {
  id: string;
  full_name: string;
  email: string;
  phone?: string;
  department?: { name: string } | null;
  role: string;
  start_date?: string;
}

interface EmployeeAccountData {
  employee_id: string;
  employee?: { full_name: string } | null;
  account_type: string;
  year: number;
  balance: number | null;
  used: number | null;
  carried_over: number | null;
}

interface SickLeaveData {
  id: string;
  employee_id: string;
  employee?: { full_name: string } | null;
  start_date: string;
  end_date?: string | null;
  leave_type: string;
  employer_period_start?: string | null;
  employer_period_end?: string | null;
  employer_period_days_used?: number | null;
  employer_period_completed: boolean | null;
  nav_takeover_date?: string | null;
  status: string;
}

interface ShiftData {
  id: string;
  date: string;
  employee_id: string;
  employee?: { full_name: string } | null;
  function?: { name: string; short_name?: string } | null;
  planned_start: string;
  planned_end: string;
  status: string;
}

interface TimeEntryData {
  id: string;
  employee_id: string;
  employee?: { full_name: string } | null;
  date: string;
  clock_in: string;
  clock_out?: string | null;
  break_minutes?: number | null;
  status: string;
  deviation_minutes?: number | null;
}

interface AbsenceRequestData {
  id: string;
  employee_id: string;
  employee?: { full_name: string } | null;
  absence_type?: { name: string } | null;
  start_date: string;
  end_date: string;
  total_days: number;
  status: string;
}

// Helper function to calculate days between dates
function daysBetween(start: string, end: string): number {
  const startDate = new Date(start);
  const endDate = new Date(end);
  return Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
}

// Fetch comprehensive manager data
async function getManagerDashboardData(supabase: any): Promise<string> {
  let context = "";
  const currentYear = new Date().getFullYear();
  const today = new Date().toISOString().split("T")[0];

  try {
    // Get all employees with details
    const { data: employees } = await supabase
      .from("profiles")
      .select(`
        id,
        full_name,
        email,
        phone,
        role,
        start_date,
        department:departments(name)
      `)
      .eq("is_active", true)
      .order("full_name");

    if (employees && employees.length > 0) {
      context += `\n📋 ANSATTE I SYSTEMET (${employees.length} aktive):\n`;
      employees.forEach((emp: EmployeeData) => {
        context += `- ${emp.full_name} (${emp.role})`;
        if (emp.department?.name) context += ` - ${emp.department.name}`;
        context += "\n";
      });
    }

    // Get vacation/absence balances for current year
    const { data: accounts } = await supabase
      .from("employee_accounts")
      .select(`
        employee_id,
        account_type,
        year,
        balance,
        used,
        carried_over,
        employee:profiles(full_name)
      `)
      .eq("year", currentYear);

    if (accounts && accounts.length > 0) {
      context += `\n🏖️ FERIE- OG FRAVÆRSSALDO ${currentYear}:\n`;
      
      // Group by employee
      const byEmployee: Record<string, { name: string; accounts: any[] }> = {};
      accounts.forEach((acc: EmployeeAccountData) => {
        const empId = acc.employee_id;
        if (!byEmployee[empId]) {
          byEmployee[empId] = {
            name: acc.employee?.full_name || "Ukjent",
            accounts: [],
          };
        }
        byEmployee[empId].accounts.push(acc);
      });

      Object.values(byEmployee).forEach((emp) => {
        context += `\n${emp.name}:\n`;
        emp.accounts.forEach((acc: any) => {
          const total = (acc.balance || 0) + (acc.carried_over || 0);
          const remaining = total - (acc.used || 0);
          context += `  - ${acc.account_type}: ${remaining} igjen av ${total} (brukt: ${acc.used || 0})\n`;
        });
      });
    }

    // Get active sick leaves with employer period info
    const { data: sickLeaves } = await supabase
      .from("sick_leaves")
      .select(`
        id,
        employee_id,
        start_date,
        end_date,
        leave_type,
        employer_period_start,
        employer_period_end,
        employer_period_days_used,
        employer_period_completed,
        nav_takeover_date,
        status,
        employee:profiles(full_name)
      `)
      .in("status", ["active", "pending"])
      .order("start_date", { ascending: false });

    if (sickLeaves && sickLeaves.length > 0) {
      context += `\n🤒 AKTIVE SYKEMELDINGER:\n`;
      sickLeaves.forEach((sl: SickLeaveData) => {
        const empName = sl.employee?.full_name || "Ukjent";
        context += `\n${empName}:\n`;
        context += `  - Type: ${sl.leave_type}\n`;
        context += `  - Start: ${sl.start_date}`;
        if (sl.end_date) context += `, Slutt: ${sl.end_date}`;
        context += "\n";
        
        if (sl.employer_period_start && !sl.employer_period_completed) {
          const daysUsed = sl.employer_period_days_used || 0;
          const daysRemaining = 16 - daysUsed;
          context += `  - Arbeidsgiverperiode: Dag ${daysUsed} av 16 (${daysRemaining} dager igjen)\n`;
          if (sl.employer_period_end) {
            context += `  - Arbeidsgiverperiode slutter: ${sl.employer_period_end}\n`;
          }
        } else if (sl.employer_period_completed) {
          context += `  - Arbeidsgiverperiode: Fullført (NAV overtar)\n`;
          if (sl.nav_takeover_date) {
            context += `  - NAV overtok: ${sl.nav_takeover_date}\n`;
          }
        }
      });
    }

    // Get self-certification usage (egenmeldinger)
    const { data: selfCertifications } = await supabase
      .from("sick_leaves")
      .select(`
        employee_id,
        start_date,
        end_date,
        employee:profiles(full_name)
      `)
      .eq("leave_type", "egenmelding")
      .gte("start_date", `${currentYear}-01-01`);

    if (selfCertifications && selfCertifications.length > 0) {
      context += `\n📝 EGENMELDINGER ${currentYear}:\n`;
      
      // Group by employee
      const byEmp: Record<string, { name: string; periods: number; days: number }> = {};
      selfCertifications.forEach((sc: any) => {
        const empId = sc.employee_id;
        if (!byEmp[empId]) {
          byEmp[empId] = {
            name: sc.employee?.full_name || "Ukjent",
            periods: 0,
            days: 0,
          };
        }
        byEmp[empId].periods += 1;
        if (sc.end_date) {
          byEmp[empId].days += daysBetween(sc.start_date, sc.end_date) + 1;
        } else {
          byEmp[empId].days += 1;
        }
      });

      Object.values(byEmp).forEach((emp) => {
        context += `- ${emp.name}: ${emp.periods} periode(r), ${emp.days} dager (maks: 4 perioder/16 dager per år)\n`;
      });
    }

    // Get today's shifts
    const { data: todayShifts } = await supabase
      .from("shifts")
      .select(`
        id,
        date,
        employee_id,
        planned_start,
        planned_end,
        status,
        employee:profiles(full_name),
        function:functions(name, short_name)
      `)
      .eq("date", today)
      .order("planned_start");

    if (todayShifts && todayShifts.length > 0) {
      context += `\n📅 VAKTER I DAG (${today}):\n`;
      todayShifts.forEach((shift: ShiftData) => {
        const empName = shift.employee?.full_name || "Ikke tildelt";
        const funcName = shift.function?.short_name || shift.function?.name || "";
        context += `- ${shift.planned_start.slice(0, 5)}-${shift.planned_end.slice(0, 5)}: ${empName}`;
        if (funcName) context += ` (${funcName})`;
        context += ` [${shift.status}]\n`;
      });
    }

    // Get this week's shifts
    const weekStart = new Date();
    weekStart.setDate(weekStart.getDate() - weekStart.getDay() + 1);
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekEnd.getDate() + 6);

    const { data: weekShifts } = await supabase
      .from("shifts")
      .select(`
        date,
        employee_id,
        employee:profiles(full_name)
      `)
      .gte("date", weekStart.toISOString().split("T")[0])
      .lte("date", weekEnd.toISOString().split("T")[0]);

    if (weekShifts && weekShifts.length > 0) {
      context += `\n📆 VAKTER DENNE UKEN (${weekStart.toISOString().split("T")[0]} - ${weekEnd.toISOString().split("T")[0]}):\n`;
      
      // Count shifts per employee
      const shiftCounts: Record<string, { name: string; count: number }> = {};
      weekShifts.forEach((s: any) => {
        const empId = s.employee_id;
        if (!shiftCounts[empId]) {
          shiftCounts[empId] = {
            name: s.employee?.full_name || "Ukjent",
            count: 0,
          };
        }
        shiftCounts[empId].count += 1;
      });

      Object.values(shiftCounts).forEach((emp) => {
        context += `- ${emp.name}: ${emp.count} vakt(er)\n`;
      });
    }

    // Get pending time entries for approval
    const { data: pendingTimeEntries } = await supabase
      .from("time_entries")
      .select(`
        id,
        employee_id,
        date,
        clock_in,
        clock_out,
        status,
        deviation_minutes,
        employee:profiles(full_name)
      `)
      .eq("status", "pending")
      .order("date", { ascending: false })
      .limit(20);

    if (pendingTimeEntries && pendingTimeEntries.length > 0) {
      context += `\n⏱️ TIMELISTER TIL GODKJENNING (${pendingTimeEntries.length}):\n`;
      pendingTimeEntries.slice(0, 10).forEach((te: TimeEntryData) => {
        const empName = te.employee?.full_name || "Ukjent";
        context += `- ${te.date}: ${empName}`;
        if (te.deviation_minutes && te.deviation_minutes !== 0) {
          context += ` (avvik: ${te.deviation_minutes > 0 ? "+" : ""}${te.deviation_minutes} min)`;
        }
        context += "\n";
      });
    }

    // Get pending absence requests
    const { data: pendingAbsence } = await supabase
      .from("absence_requests")
      .select(`
        id,
        employee_id,
        start_date,
        end_date,
        total_days,
        status,
        employee:profiles(full_name),
        absence_type:absence_types(name)
      `)
      .eq("status", "pending")
      .order("created_at", { ascending: false });

    if (pendingAbsence && pendingAbsence.length > 0) {
      context += `\n📨 FRAVÆRSSØKNADER TIL BEHANDLING (${pendingAbsence.length}):\n`;
      pendingAbsence.forEach((ar: AbsenceRequestData) => {
        const empName = ar.employee?.full_name || "Ukjent";
        const typeName = ar.absence_type?.name || "Fravær";
        context += `- ${empName}: ${typeName} (${ar.start_date} - ${ar.end_date}, ${ar.total_days} dager)\n`;
      });
    }

    // Get open deviations
    const { data: openDeviations } = await supabase
      .from("deviations")
      .select("id, title, severity, status, due_date")
      .in("status", ["open", "in_progress"])
      .order("created_at", { ascending: false })
      .limit(10);

    if (openDeviations && openDeviations.length > 0) {
      context += `\n⚠️ ÅPNE AVVIK (${openDeviations.length}):\n`;
      openDeviations.forEach((d: any) => {
        context += `- ${d.title} [${d.severity}]`;
        if (d.due_date) context += ` - Frist: ${d.due_date}`;
        context += "\n";
      });
    }

  } catch (error) {
    console.error("Error fetching manager data:", error);
  }

  return context;
}

// Fetch general context
async function getGeneralContext(supabase: any): Promise<string> {
  let context = "";

  try {
    // Get absence types
    const { data: absenceTypes } = await supabase
      .from("absence_types")
      .select("name, affects_salary, requires_documentation, from_account")
      .eq("is_active", true);

    if (absenceTypes && absenceTypes.length > 0) {
      context += "\n📋 FRAVÆRSTYPER TILGJENGELIG:\n";
      absenceTypes.forEach((t: any) => {
        context += `- ${t.name}`;
        if (t.from_account) context += ` (trekkes fra: ${t.from_account})`;
        if (t.requires_documentation) context += " [Krever dok.]";
        context += "\n";
      });
    }

    // Get work time rules
    const { data: workRules } = await supabase
      .from("work_time_rules")
      .select("*")
      .limit(1)
      .single();

    if (workRules) {
      context += "\n⚙️ ARBEIDSTIDSREGLER:\n";
      if (workRules.max_hours_per_day) context += `- Maks timer/dag: ${workRules.max_hours_per_day}\n`;
      if (workRules.max_hours_per_week) context += `- Maks timer/uke: ${workRules.max_hours_per_week}\n`;
      if (workRules.min_rest_hours_between_shifts) context += `- Min hviletid: ${workRules.min_rest_hours_between_shifts} timer\n`;
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

          if (equipment) {
            context += `\n🔧 AKTUELT UTSTYR:\n`;
            context += `- Navn: ${equipment.name}\n`;
            context += `- Merke/Modell: ${equipment.brand || "Ukjent"} ${equipment.model || ""}\n`;
            context += `- Serienummer: ${equipment.serial_number || "Ikke oppgitt"}\n`;
            context += `- Kategori: ${equipment.category?.name || "Ukjent"}\n`;
            context += `- Status: ${equipment.status}\n`;
            if (equipment.notes) context += `- Notater: ${equipment.notes}\n`;
          }

          // Get documents
          const { data: documents } = await supabase
            .from("equipment_documents")
            .select("name, document_type")
            .eq("equipment_id", contextId);

          if (documents && documents.length > 0) {
            context += `\nDokumenter:\n`;
            documents.forEach((doc: any) => {
              context += `- ${doc.name} (${doc.document_type})\n`;
            });
          }

          // Get recent services
          const { data: services } = await supabase
            .from("equipment_services")
            .select("service_type, performed_at, notes")
            .eq("equipment_id", contextId)
            .order("performed_at", { ascending: false })
            .limit(3);

          if (services && services.length > 0) {
            context += `\nSiste service:\n`;
            services.forEach((s: any) => {
              context += `- ${s.service_type} (${new Date(s.performed_at).toLocaleDateString("nb-NO")})\n`;
            });
          }
        }
        break;

      case "handbook":
        const { data: sections } = await supabase
          .from("handbook_sections")
          .select("title, content")
          .eq("is_published", true)
          .order("sort_order")
          .limit(20);

        if (sections && sections.length > 0) {
          context += `\n📖 PERSONALHÅNDBOK INNHOLD:\n`;
          sections.forEach((s: any) => {
            context += `\n## ${s.title}\n`;
            if (s.content) {
              // Include first 500 chars of content
              const preview = s.content.substring(0, 500);
              context += preview + (s.content.length > 500 ? "..." : "") + "\n";
            }
          });
        }
        break;

      case "hms":
        const { data: risks } = await supabase
          .from("hms_risks")
          .select("title, risk_level, status, mitigation")
          .eq("status", "active")
          .limit(10);

        if (risks && risks.length > 0) {
          context += `\n🛡️ AKTIVE RISIKOVURDERINGER:\n`;
          risks.forEach((r: any) => {
            context += `\n${r.title}:\n`;
            context += `- Risikonivå: ${r.risk_level}\n`;
            if (r.mitigation) context += `- Tiltak: ${r.mitigation}\n`;
          });
        }
        break;

      case "fire":
        const { data: fireEquipment } = await supabase
          .from("fire_equipment")
          .select("type, location, last_inspection")
          .limit(15);

        if (fireEquipment && fireEquipment.length > 0) {
          context += `\n🔥 BRANNUTSTYR:\n`;
          fireEquipment.forEach((e: any) => {
            context += `- ${e.type}: ${e.location}`;
            if (e.last_inspection) {
              context += ` (sist sjekket: ${new Date(e.last_inspection).toLocaleDateString("nb-NO")})`;
            }
            context += "\n";
          });
        }

        const { data: drills } = await supabase
          .from("fire_drills")
          .select("date, participants_count, notes")
          .order("date", { ascending: false })
          .limit(3);

        if (drills && drills.length > 0) {
          context += `\nSiste brannøvelser:\n`;
          drills.forEach((d: any) => {
            context += `- ${new Date(d.date).toLocaleDateString("nb-NO")} (${d.participants_count} deltakere)\n`;
          });
        }
        break;

      case "training":
        const { data: courses } = await supabase
          .from("courses")
          .select("title, category, is_required, description")
          .eq("is_active", true)
          .limit(15);

        if (courses && courses.length > 0) {
          context += `\n🎓 TILGJENGELIGE KURS:\n`;
          courses.forEach((c: any) => {
            context += `\n${c.title}`;
            if (c.is_required) context += " ⭐ Obligatorisk";
            context += "\n";
            if (c.category) context += `- Kategori: ${c.category}\n`;
            if (c.description) context += `- ${c.description.substring(0, 200)}\n`;
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
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { messages, module, contextId }: ChatRequest = await req.json();

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    // Fetch all contexts in parallel
    const [managerData, moduleContext, generalContext] = await Promise.all([
      getManagerDashboardData(supabase),
      getModuleContext(supabase, module, contextId),
      getGeneralContext(supabase),
    ]);

    const moduleName = moduleNames[module] || "CrewPlan";
    const fullContext = `
═══════════════════════════════════════════════
BRUKERENS NÅVÆRENDE SIDE: ${moduleName}
DAGENS DATO: ${new Date().toLocaleDateString("nb-NO")}
═══════════════════════════════════════════════

${managerData}

${moduleContext}

${generalContext}
═══════════════════════════════════════════════`;

    const systemPrompt = `${universalSystemPrompt}

${fullContext}`;

    console.log("CrewAI request:", { module, contextId, messageCount: messages.length });

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
