import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { differenceInDays, subMonths, startOfDay } from "date-fns";

export type InspectionType = 'mattilsynet' | 'arbeidstilsynet' | 'branntilsyn' | 'skjenkekontroll';
export type TrafficLightStatus = 'green' | 'yellow' | 'red';

export interface InspectionReport {
  id: string;
  inspection_type: InspectionType;
  generated_by: string | null;
  generated_at: string;
  period_from: string;
  period_to: string;
  status: 'generated' | 'reviewed' | 'submitted';
  pdf_url: string | null;
  metadata: Record<string, unknown>;
  notes: string | null;
  created_at: string;
}

export interface InspectionVisit {
  id: string;
  inspection_type: InspectionType;
  visit_date: string;
  inspector_name: string | null;
  result: 'approved' | 'remarks' | 'failed' | null;
  remarks: string | null;
  findings: unknown[];
  deadline: string | null;
  report_url: string | null;
  created_at: string;
}

export interface SectionStatus {
  id: string;
  title: string;
  status: TrafficLightStatus;
  details: string;
  action?: string;
  count?: number;
}

export interface InspectionReadiness {
  type: InspectionType;
  overallScore: number;
  sections: SectionStatus[];
  greenCount: number;
  yellowCount: number;
  redCount: number;
}

// Fetch inspection reports
export function useInspectionReports(type?: InspectionType) {
  return useQuery({
    queryKey: ["inspection-reports", type],
    queryFn: async () => {
      let query = supabase
        .from("inspection_reports")
        .select("*")
        .order("generated_at", { ascending: false });

      if (type) {
        query = query.eq("inspection_type", type);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as InspectionReport[];
    },
  });
}

// Fetch inspection visits
export function useInspectionVisits(type?: InspectionType) {
  return useQuery({
    queryKey: ["inspection-visits", type],
    queryFn: async () => {
      let query = supabase
        .from("inspection_visits")
        .select("*")
        .order("visit_date", { ascending: false });

      if (type) {
        query = query.eq("inspection_type", type);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as InspectionVisit[];
    },
  });
}

// Calculate readiness for Mattilsynet
export function useMattilsynetReadiness() {
  return useQuery({
    queryKey: ["mattilsynet-readiness"],
    queryFn: async () => {
      const today = startOfDay(new Date());
      const threeMonthsAgo = subMonths(today, 3);
      
      const sections: SectionStatus[] = [];

      // 1. Temperature logs check
      const { data: tempLogs } = await supabase
        .from("temperature_logs")
        .select("*, temperature_units(*)")
        .gte("logged_at", threeMonthsAgo.toISOString());

      const deviationTemps = tempLogs?.filter(log => log.is_deviation) || [];
      const unresolvedDeviations = deviationTemps.filter(log => !log.deviation_action);
      
      sections.push({
        id: "temperature",
        title: "Temperaturlogg",
        status: unresolvedDeviations.length > 0 ? "red" : deviationTemps.length > 0 ? "yellow" : "green",
        details: `${tempLogs?.length || 0} målinger, ${deviationTemps.length} avvik`,
        action: unresolvedDeviations.length > 0 ? "Registrer tiltak for temperaturavvik" : undefined,
        count: tempLogs?.length || 0,
      });

      // 2. Checklists completion
      const { data: checklistCompletions } = await supabase
        .from("checklist_completions")
        .select("*")
        .gte("completed_at", threeMonthsAgo.toISOString());

      const { data: requiredChecklists } = await supabase
        .from("checklist_templates")
        .select("*")
        .eq("is_active", true)
        .eq("is_required_for_clock_out", true);

      const completionRate = requiredChecklists?.length 
        ? Math.round((checklistCompletions?.length || 0) / (requiredChecklists.length * 90) * 100)
        : 100;

      sections.push({
        id: "checklists",
        title: "Sjekklister",
        status: completionRate >= 90 ? "green" : completionRate >= 70 ? "yellow" : "red",
        details: `${completionRate}% fullføringsgrad`,
        action: completionRate < 90 ? "Fullfør daglige sjekklister" : undefined,
        count: checklistCompletions?.length || 0,
      });

      // 3. Deviations
      const { data: deviations } = await supabase
        .from("deviations")
        .select("*")
        .in("category", ["mattrygghet", "hygiene", "allergen"]);

      const openDeviations = deviations?.filter(d => d.status !== "closed") || [];
      const criticalOpen = openDeviations.filter(d => d.severity === "high");

      sections.push({
        id: "deviations",
        title: "Avvik",
        status: criticalOpen.length > 0 ? "red" : openDeviations.length > 0 ? "yellow" : "green",
        details: `${openDeviations.length} åpne avvik`,
        action: criticalOpen.length > 0 ? "Lukk kritiske avvik" : openDeviations.length > 0 ? "Behandle åpne avvik" : undefined,
        count: openDeviations.length,
      });

      // 4. Training (food safety)
      const { data: enrollments } = await supabase
        .from("course_enrollments")
        .select("*, courses(*)")
        .not("completed_at", "is", null);

      const foodSafetyCourses = enrollments?.filter(e => 
        e.courses?.category === "mattrygghet" || e.courses?.is_required
      ) || [];

      sections.push({
        id: "training",
        title: "Opplæring",
        status: foodSafetyCourses.length > 0 ? "green" : "yellow",
        details: `${foodSafetyCourses.length} fullførte kurs`,
        action: foodSafetyCourses.length === 0 ? "Fullfør obligatorisk opplæring" : undefined,
        count: foodSafetyCourses.length,
      });

      return calculateReadiness("mattilsynet", sections);
    },
  });
}

// Calculate readiness for Arbeidstilsynet (HMS)
export function useArbeidstilsynetReadiness() {
  return useQuery({
    queryKey: ["arbeidstilsynet-readiness"],
    queryFn: async () => {
      const today = startOfDay(new Date());
      const sixMonthsAgo = subMonths(today, 6);
      const sections: SectionStatus[] = [];

      // 1. Safety rounds
      const { data: safetyRounds } = await supabase
        .from("safety_rounds")
        .select("*")
        .eq("status", "completed")
        .gte("completed_at", sixMonthsAgo.toISOString());

      const lastRound = safetyRounds?.[0];
      const daysSinceLastRound = lastRound 
        ? differenceInDays(today, new Date(lastRound.completed_at!))
        : 999;

      sections.push({
        id: "safety_rounds",
        title: "Vernerunder",
        status: daysSinceLastRound <= 90 ? "green" : daysSinceLastRound <= 180 ? "yellow" : "red",
        details: lastRound ? `Siste for ${daysSinceLastRound} dager siden` : "Ingen gjennomført",
        action: daysSinceLastRound > 90 ? "Gjennomfør vernerunde" : undefined,
        count: safetyRounds?.length || 0,
      });

      // 2. Risk assessments
      const { data: riskAssessments } = await supabase
        .from("risk_assessments")
        .select("*")
        .eq("status", "active");

      const highRisks = riskAssessments?.filter(r => (r.risk_score || 0) >= 15) || [];

      sections.push({
        id: "risk_assessment",
        title: "Risikovurdering",
        status: highRisks.length > 0 ? "red" : riskAssessments?.length ? "green" : "yellow",
        details: `${riskAssessments?.length || 0} aktive, ${highRisks.length} høy risiko`,
        action: highRisks.length > 0 ? "Behandle høyrisikoer" : !riskAssessments?.length ? "Opprett risikovurdering" : undefined,
        count: riskAssessments?.length || 0,
      });

      // 3. HMS deviations
      const { data: hmsDeviations } = await supabase
        .from("deviations")
        .select("*")
        .in("category", ["hms", "arbeidsmiljo", "sikkerhet"])
        .neq("status", "closed");

      sections.push({
        id: "hms_deviations",
        title: "HMS-avvik",
        status: (hmsDeviations?.length || 0) > 3 ? "red" : (hmsDeviations?.length || 0) > 0 ? "yellow" : "green",
        details: `${hmsDeviations?.length || 0} åpne avvik`,
        action: (hmsDeviations?.length || 0) > 0 ? "Behandle HMS-avvik" : undefined,
        count: hmsDeviations?.length || 0,
      });

      // 4. HMS roles
      const { data: profiles } = await supabase
        .from("employee_details")
        .select("*")
        .or("is_safety_representative.eq.true,is_fire_safety_leader.eq.true");

      const hasVerneombud = profiles?.some(p => p.is_safety_representative);
      
      sections.push({
        id: "hms_roles",
        title: "HMS-roller",
        status: hasVerneombud ? "green" : "red",
        details: hasVerneombud ? "Verneombud utpekt" : "Mangler verneombud",
        action: !hasVerneombud ? "Utpek verneombud" : undefined,
        count: profiles?.length || 0,
      });

      return calculateReadiness("arbeidstilsynet", sections);
    },
  });
}

// Calculate readiness for Branntilsyn
export function useBranntilsynReadiness() {
  return useQuery({
    queryKey: ["branntilsyn-readiness"],
    queryFn: async () => {
      const today = startOfDay(new Date());
      const threeMonthsAgo = subMonths(today, 3);
      const oneYearAgo = subMonths(today, 12);
      const sections: SectionStatus[] = [];

      // 1. Fire drills
      const { data: fireDrills } = await supabase
        .from("fire_drills")
        .select("*")
        .not("completed_at", "is", null)
        .gte("completed_at", oneYearAgo.toISOString())
        .order("completed_at", { ascending: false });

      const recentDrill = fireDrills?.find(d => 
        differenceInDays(today, new Date(d.completed_at!)) <= 90
      );

      sections.push({
        id: "fire_drills",
        title: "Brannøvelser",
        status: recentDrill ? "green" : (fireDrills?.length || 0) > 0 ? "yellow" : "red",
        details: `${fireDrills?.length || 0} øvelser siste år`,
        action: !recentDrill ? "Gjennomfør brannøvelse" : undefined,
        count: fireDrills?.length || 0,
      });

      // 2. Equipment checks
      const { data: equipment } = await supabase
        .from("fire_equipment")
        .select("*");

      const needsInspection = equipment?.filter(e => {
        if (!e.next_inspection_date) return true;
        return new Date(e.next_inspection_date) < today;
      }) || [];

      const failedEquipment = equipment?.filter(e => e.status === "failed" || e.status === "needs_service") || [];

      sections.push({
        id: "equipment",
        title: "Utstyrskontroll",
        status: failedEquipment.length > 0 ? "red" : needsInspection.length > 0 ? "yellow" : "green",
        details: `${equipment?.length || 0} enheter, ${needsInspection.length} trenger kontroll`,
        action: failedEquipment.length > 0 ? "Utbedr defekt utstyr" : needsInspection.length > 0 ? "Gjennomfør kontroll" : undefined,
        count: equipment?.length || 0,
      });

      // 3. Fire safety leader
      const { data: profiles } = await supabase
        .from("employee_details")
        .select("*")
        .eq("is_fire_safety_leader", true);

      sections.push({
        id: "fire_leader",
        title: "Brannvernleder",
        status: (profiles?.length || 0) > 0 ? "green" : "red",
        details: (profiles?.length || 0) > 0 ? "Utpekt" : "Mangler",
        action: (profiles?.length || 0) === 0 ? "Utpek brannvernleder" : undefined,
        count: profiles?.length || 0,
      });

      // 4. Fire deviations
      const { data: fireDeviations } = await supabase
        .from("deviations")
        .select("*")
        .in("category", ["brann", "brannvern"])
        .neq("status", "closed");

      sections.push({
        id: "fire_deviations",
        title: "Brannavvik",
        status: (fireDeviations?.length || 0) > 0 ? "red" : "green",
        details: `${fireDeviations?.length || 0} åpne avvik`,
        action: (fireDeviations?.length || 0) > 0 ? "Lukk brannavvik" : undefined,
        count: fireDeviations?.length || 0,
      });

      return calculateReadiness("branntilsyn", sections);
    },
  });
}

// Calculate readiness for Skjenkekontroll
export function useSkjenkekontrollReadiness() {
  return useQuery({
    queryKey: ["skjenkekontroll-readiness"],
    queryFn: async () => {
      const today = startOfDay(new Date());
      const sections: SectionStatus[] = [];

      // 1. Certificates (kunnskapsprøve, ansvarlig vertskap)
      const { data: certificates } = await supabase
        .from("certificates")
        .select("*, profiles(full_name)")
        .in("certificate_type", ["kunnskapsprove", "ansvarlig_vertskap"]);

      const validCerts = certificates?.filter(c => 
        !c.expiry_date || new Date(c.expiry_date) > today
      ) || [];

      const kunnskapsprove = validCerts.filter(c => c.certificate_type === "kunnskapsprove");
      const ansvarligVertskap = validCerts.filter(c => c.certificate_type === "ansvarlig_vertskap");

      sections.push({
        id: "kunnskapsprove",
        title: "Kunnskapsprøve",
        status: kunnskapsprove.length >= 2 ? "green" : kunnskapsprove.length === 1 ? "yellow" : "red",
        details: `${kunnskapsprove.length} godkjent(e)`,
        action: kunnskapsprove.length < 2 ? "Styrer og stedfortreder må ha bestått" : undefined,
        count: kunnskapsprove.length,
      });

      sections.push({
        id: "ansvarlig_vertskap",
        title: "Ansvarlig Vertskap",
        status: ansvarligVertskap.length > 0 ? "green" : "yellow",
        details: `${ansvarligVertskap.length} sertifisert(e)`,
        action: ansvarligVertskap.length === 0 ? "Fullfør Ansvarlig Vertskap-kurs" : undefined,
        count: ansvarligVertskap.length,
      });

      // 2. Alcohol-related checklists
      const { data: checklists } = await supabase
        .from("checklist_completions")
        .select("*, checklist_templates(*)")
        .gte("completed_at", subMonths(today, 1).toISOString());

      sections.push({
        id: "checklists",
        title: "Internkontroll",
        status: (checklists?.length || 0) > 0 ? "green" : "yellow",
        details: `${checklists?.length || 0} sjekklister siste mnd`,
        action: (checklists?.length || 0) === 0 ? "Fullfør internkontroll-sjekklister" : undefined,
        count: checklists?.length || 0,
      });

      // 3. Skjenke deviations
      const { data: skjenkeDeviations } = await supabase
        .from("deviations")
        .select("*")
        .in("category", ["skjenke", "alkohol"])
        .neq("status", "closed");

      sections.push({
        id: "deviations",
        title: "Avvik/Merknader",
        status: (skjenkeDeviations?.length || 0) > 0 ? "red" : "green",
        details: `${skjenkeDeviations?.length || 0} åpne`,
        action: (skjenkeDeviations?.length || 0) > 0 ? "Behandle merknader fra tidligere kontroll" : undefined,
        count: skjenkeDeviations?.length || 0,
      });

      return calculateReadiness("skjenkekontroll", sections);
    },
  });
}

// Helper to calculate overall readiness
function calculateReadiness(type: InspectionType, sections: SectionStatus[]): InspectionReadiness {
  const greenCount = sections.filter(s => s.status === "green").length;
  const yellowCount = sections.filter(s => s.status === "yellow").length;
  const redCount = sections.filter(s => s.status === "red").length;
  
  const totalSections = sections.length;
  const score = Math.round(
    ((greenCount * 100) + (yellowCount * 50) + (redCount * 0)) / totalSections
  );

  return {
    type,
    overallScore: score,
    sections,
    greenCount,
    yellowCount,
    redCount,
  };
}

// Create inspection report
export function useCreateInspectionReport() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: {
      inspection_type: InspectionType;
      period_from: string;
      period_to: string;
      metadata?: Record<string, unknown>;
      notes?: string;
    }) => {
      const insertData = {
        inspection_type: data.inspection_type,
        period_from: data.period_from,
        period_to: data.period_to,
        metadata: data.metadata || {},
        notes: data.notes,
      };

      const { data: result, error } = await supabase
        .from("inspection_reports")
        .insert(insertData as never)
        .select()
        .single();

      if (error) throw error;
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["inspection-reports"] });
      toast.success("Rapport generert");
    },
    onError: (error) => {
      toast.error("Kunne ikke generere rapport: " + error.message);
    },
  });
}

// Create inspection visit
export function useCreateInspectionVisit() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: {
      inspection_type: InspectionType;
      visit_date: string;
      inspector_name?: string;
      result?: 'approved' | 'remarks' | 'failed';
      remarks?: string;
      deadline?: string;
    }) => {
      const { data: result, error } = await supabase
        .from("inspection_visits")
        .insert(data as never)
        .select()
        .single();

      if (error) throw error;
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["inspection-visits"] });
      toast.success("Tilsyn registrert");
    },
    onError: (error) => {
      toast.error("Kunne ikke registrere tilsyn: " + error.message);
    },
  });
}
