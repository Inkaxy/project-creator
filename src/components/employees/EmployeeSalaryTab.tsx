import { EmployeeProfile } from "@/hooks/useEmployees";
import { EmployeeDetails } from "@/hooks/useEmployeeDetails";
import { useWageLadder } from "@/hooks/useWageLadders";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  DollarSign,
  Clock,
} from "lucide-react";
import { SeniorityGamificationCard } from "@/components/seniority/SeniorityGamificationCard";

interface EmployeeSalaryTabProps {
  employee: EmployeeProfile;
  employeeDetails: EmployeeDetails | null | undefined;
}

export function EmployeeSalaryTab({ employee, employeeDetails }: EmployeeSalaryTabProps) {
  const { data: wageLadder } = useWageLadder(employeeDetails?.wage_ladder_id || undefined);

  const getCompetenceLabel = (level: string | null) => {
    const labels: Record<string, string> = {
      ufaglaert: "Ufaglært",
      faglaert: "Faglært",
      laerling: "Lærling",
    };
    return labels[level || ""] || level || "Ikke angitt";
  };

  const getSalaryTypeLabel = (type: string) => {
    return type === "fixed" ? "Fastlønn" : "Timelønn";
  };

  // Calculate effective hourly rate for fixed salary
  const calculateEffectiveHourlyRate = () => {
    if (!employeeDetails?.fixed_monthly_salary || !employeeDetails?.contracted_hours_per_month) {
      return null;
    }
    const nightValue = (employeeDetails.included_night_hours || 0) * 90; // Assuming 90 kr night supplement
    const restForRegular = employeeDetails.fixed_monthly_salary - nightValue;
    return restForRegular / employeeDetails.contracted_hours_per_month;
  };

  const effectiveHourlyRate = calculateEffectiveHourlyRate();

  return (
    <div className="space-y-6">
      {/* Salary Type Header */}
      <div className="flex items-center gap-3">
        <div className="p-2 bg-primary/10 rounded-lg">
          <DollarSign className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h3 className="font-semibold text-foreground">Lønnsinformasjon</h3>
          <p className="text-sm text-muted-foreground">
            {getSalaryTypeLabel(employeeDetails?.salary_type || "hourly")} • {getCompetenceLabel(employeeDetails?.competence_level || null)}
          </p>
        </div>
      </div>

      {employeeDetails?.salary_type === "hourly" ? (
        // HOURLY WAGE VIEW
        <div className="space-y-4">
          {/* Seniority Progress Card - Main feature */}
          <SeniorityGamificationCard
            employeeId={employee.id}
            employeeName={employee.full_name || "Ansatt"}
            accumulatedHours={employeeDetails?.accumulated_hours || 0}
            wageLadder={wageLadder}
            contractedHoursPerWeek={employeeDetails?.contracted_hours_per_week || 37.5}
            showAdminControls={true}
          />

          {/* Working Hours */}
          <div className="grid grid-cols-2 gap-4 text-sm pt-4 border-t border-border">
            <div>
              <p className="text-muted-foreground">Avtalt timer/uke</p>
              <p className="font-medium text-foreground">{employeeDetails?.contracted_hours_per_week || 37.5} t</p>
            </div>
            <div>
              <p className="text-muted-foreground">Stillingsprosent</p>
              <p className="font-medium text-foreground">{employeeDetails?.employment_percentage?.toFixed(0) || 100}%</p>
            </div>
          </div>
        </div>
      ) : (
        // FIXED SALARY VIEW
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-muted-foreground">Månedslønn</p>
              <p className="font-medium text-foreground text-lg">
                {employeeDetails?.fixed_monthly_salary?.toLocaleString("nb-NO") || "-"} kr
              </p>
            </div>
            <div>
              <p className="text-muted-foreground">Avtalt timer/måned</p>
              <p className="font-medium text-foreground">
                {employeeDetails?.contracted_hours_per_month || "-"} t
              </p>
            </div>
          </div>

          {/* Night Hours Calculation */}
          {employeeDetails?.included_night_hours && employeeDetails.included_night_hours > 0 && (
            <Card className="bg-muted/50">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-3">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium text-foreground">Innbakt nattillegg</span>
                </div>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-muted-foreground">Innbakte natt-timer</p>
                    <p className="font-medium text-foreground">
                      {employeeDetails.included_night_hours} t × 90 kr = {(employeeDetails.included_night_hours * 90).toLocaleString("nb-NO")} kr
                    </p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Effektiv timelønn</p>
                    <p className="font-medium text-foreground">
                      {effectiveHourlyRate?.toFixed(2) || "-"} kr/t
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Employment Percentage */}
          <div className="pt-4 border-t border-border">
            <div className="text-sm">
              <p className="text-muted-foreground">Stillingsprosent</p>
              <p className="font-medium text-foreground">{employeeDetails?.employment_percentage?.toFixed(0) || 100}%</p>
            </div>
          </div>
        </div>
      )}

      {/* Applicable Supplements */}
      <div className="pt-4 border-t border-border">
        <h4 className="text-sm font-semibold text-foreground mb-3">Tillegg som gjelder</h4>
        <div className="space-y-2 text-sm">
          <div className="flex items-center justify-between p-2 bg-muted/50 rounded-lg">
            <span>✓ {employeeDetails?.competence_level === "faglaert" ? "Nattillegg faglært" : "Nattillegg ufaglært"}</span>
            <span className="font-medium">{employeeDetails?.competence_level === "faglaert" ? "90" : "50"} kr/t</span>
            <span className="text-muted-foreground">21:00-06:00</span>
          </div>
          <div className="flex items-center justify-between p-2 bg-muted/50 rounded-lg">
            <span>✓ Helgetillegg</span>
            <span className="font-medium">50 kr/t</span>
            <span className="text-muted-foreground">Lør-Søn</span>
          </div>
          <div className="flex items-center justify-between p-2 bg-muted/50 rounded-lg">
            <span>✓ Helligdagstillegg</span>
            <span className="font-medium">100%</span>
            <span className="text-muted-foreground">Røde dager</span>
          </div>
        </div>
      </div>
    </div>
  );
}