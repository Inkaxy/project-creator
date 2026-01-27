import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { ComplianceResult, ComplianceItem } from "@/types/industrivern";

export function useIndustrivernCompliance() {
  return useQuery({
    queryKey: ["industrivern-compliance"],
    queryFn: async (): Promise<ComplianceResult> => {
      const items: ComplianceItem[] = [];
      let totalWeightedScore = 0;
      let totalWeight = 0;

      // § 5 - Uønskede hendelser (ROS-analyse)
      const { data: riskAssessments } = await supabase
        .from("risk_assessments")
        .select("updated_at")
        .order("updated_at", { ascending: false })
        .limit(1);

      const rosUpdatedRecently = riskAssessments?.[0]?.updated_at
        ? new Date(riskAssessments[0].updated_at) > new Date(Date.now() - 365 * 24 * 60 * 60 * 1000)
        : false;

      items.push({
        paragraph: "§ 5",
        name: "Uønskede hendelser",
        weight: 15,
        score: rosUpdatedRecently ? 15 : 0,
        maxScore: 15,
        status: rosUpdatedRecently ? "ok" : "error",
        details: rosUpdatedRecently
          ? "ROS-analyse oppdatert siste 12 måneder"
          : "ROS-analyse ikke oppdatert siste 12 måneder",
      });

      // § 6 - Organisering
      const { data: personnel } = await supabase
        .from("industrivern_personnel")
        .select("role")
        .eq("is_active", true);

      const hasLeader = personnel?.some((p) => p.role === "industrivernleder");
      const hasFagleder = personnel?.some((p) => p.role === "fagleder_industrivern");
      const hasInnsats = personnel?.some((p) => p.role === "innsatsperson");
      const orgScore = (hasLeader ? 10 : 0) + (hasFagleder ? 5 : 0) + (hasInnsats ? 5 : 0);

      items.push({
        paragraph: "§ 6",
        name: "Organisering",
        weight: 20,
        score: orgScore,
        maxScore: 20,
        status: orgScore >= 15 ? "ok" : orgScore >= 10 ? "warning" : "error",
        details: `${hasLeader ? "✓" : "✗"} Industrivernleder, ${hasFagleder ? "✓" : "✗"} Fagleder, ${hasInnsats ? "✓" : "✗"} Innsatspersoner`,
      });

      // § 7 - Beredskapsplan
      const { data: activePlan } = await supabase
        .from("emergency_plans")
        .select("approved_date, status")
        .eq("status", "active")
        .maybeSingle();

      const planActive = activePlan?.status === "active";
      const planReviewedRecently = activePlan?.approved_date
        ? new Date(activePlan.approved_date) > new Date(Date.now() - 365 * 24 * 60 * 60 * 1000)
        : false;

      const planScore = (planActive ? 10 : 0) + (planReviewedRecently ? 5 : 0);

      items.push({
        paragraph: "§ 7",
        name: "Beredskapsplan",
        weight: 15,
        score: planScore,
        maxScore: 15,
        status: planScore >= 15 ? "ok" : planScore >= 10 ? "warning" : "error",
        details: `${planActive ? "✓" : "✗"} Aktiv plan, ${planReviewedRecently ? "✓" : "✗"} Gjennomgått siste 12 mnd`,
      });

      // § 8 - Personlig verneutstyr
      const { data: assignedEquipment } = await supabase
        .from("industrivern_equipment")
        .select("id")
        .eq("category", "personlig_verneutstyr")
        .not("assigned_to", "is", null);

      const ppeCount = assignedEquipment?.length || 0;
      const personnelCount = personnel?.length || 1;
      const ppeScore = ppeCount >= personnelCount ? 10 : Math.round((ppeCount / personnelCount) * 10);

      items.push({
        paragraph: "§ 8",
        name: "Personlig verneutstyr",
        weight: 10,
        score: ppeScore,
        maxScore: 10,
        status: ppeScore >= 10 ? "ok" : ppeScore >= 5 ? "warning" : "error",
        details: `${ppeCount} av ${personnelCount} har registrert verneutstyr`,
      });

      // § 9 - Beredskapsutstyr
      const { data: overdueEquipment } = await supabase
        .from("industrivern_equipment")
        .select("id")
        .lt("next_inspection_date", new Date().toISOString().split("T")[0]);

      const overdueCount = overdueEquipment?.length || 0;
      const equipScore = overdueCount === 0 ? 10 : Math.max(0, 10 - overdueCount * 2);

      items.push({
        paragraph: "§ 9",
        name: "Beredskapsutstyr",
        weight: 10,
        score: equipScore,
        maxScore: 10,
        status: equipScore >= 10 ? "ok" : equipScore >= 5 ? "warning" : "error",
        details: overdueCount === 0
          ? "Ingen utstyr med forfalt kontroll"
          : `${overdueCount} utstyr trenger kontroll`,
      });

      // § 10 - Kvalifikasjoner
      const { data: expiredQuals } = await supabase
        .from("personnel_qualifications")
        .select("id")
        .eq("status", "expired");

      const expiredCount = expiredQuals?.length || 0;
      const qualScore = expiredCount === 0 ? 15 : Math.max(0, 15 - expiredCount * 3);

      items.push({
        paragraph: "§ 10",
        name: "Kvalifikasjoner",
        weight: 15,
        score: qualScore,
        maxScore: 15,
        status: qualScore >= 15 ? "ok" : qualScore >= 10 ? "warning" : "error",
        details: expiredCount === 0
          ? "Alle kvalifikasjoner er gyldige"
          : `${expiredCount} utløpte kvalifikasjoner`,
      });

      // § 12 - Øvelser
      const currentYear = new Date().getFullYear();
      const currentMonth = new Date().getMonth();
      const isH2 = currentMonth >= 6;

      const { data: exercises } = await supabase
        .from("industrivern_exercises")
        .select("id, planned_date, status")
        .eq("status", "completed")
        .gte("planned_date", `${currentYear}-01-01`)
        .lte("planned_date", `${currentYear}-12-31`);

      const h1Exercises = exercises?.filter((e) => {
        const month = new Date(e.planned_date).getMonth();
        return month < 6;
      }).length || 0;

      const h2Exercises = exercises?.filter((e) => {
        const month = new Date(e.planned_date).getMonth();
        return month >= 6;
      }).length || 0;

      const h1Met = h1Exercises >= 1;
      const h2Met = !isH2 || h2Exercises >= 1;
      const exerciseScore = (h1Met ? 7.5 : 0) + (h2Met ? 7.5 : 0);

      items.push({
        paragraph: "§ 12",
        name: "Øvelser",
        weight: 15,
        score: exerciseScore,
        maxScore: 15,
        status: exerciseScore >= 15 ? "ok" : exerciseScore >= 7.5 ? "warning" : "error",
        details: `H1: ${h1Exercises}/1 øvelser, H2: ${h2Exercises}/1 øvelser`,
      });

      // Calculate total score
      for (const item of items) {
        totalWeightedScore += item.score;
        totalWeight += item.maxScore;
      }

      const totalScore = totalWeight > 0 
        ? Math.round((totalWeightedScore / totalWeight) * 100) 
        : 0;

      return {
        totalScore,
        items,
      };
    },
  });
}
