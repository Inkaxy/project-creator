import { EmployeeProfile } from "@/hooks/useEmployees";
import { EmployeeDetails } from "@/hooks/useEmployeeDetails";
import { useWageLadder, calculateCurrentLevel } from "@/hooks/useWageLadders";
import { useWageSupplements } from "@/hooks/useWageSupplements";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  DollarSign,
  Clock,
  TrendingUp,
  Moon,
} from "lucide-react";
import { SeniorityGamificationCard } from "@/components/seniority/SeniorityGamificationCard";

interface EmployeeSalaryTabProps {
  employee: EmployeeProfile;
  employeeDetails: EmployeeDetails | null | undefined;
}

export function EmployeeSalaryTab({ employee, employeeDetails }: EmployeeSalaryTabProps) {
  const { data: wageLadder } = useWageLadder(employeeDetails?.wage_ladder_id || undefined);
  const { data: supplements = [] } = useWageSupplements();

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

  // Get current level from wage ladder
  const currentLevel = wageLadder ? calculateCurrentLevel(wageLadder, employeeDetails?.accumulated_hours || 0) : null;
  
  // Get night supplement based on competence level
  const nightSupplement = supplements.find(s => 
    s.applies_to === "night" && 
    s.name.toLowerCase().includes(employeeDetails?.competence_level === "faglaert" ? "faglært" : "ufaglært")
  ) || supplements.find(s => s.applies_to === "night");

  // Calculate effective hourly rate for fixed salary (based on actual ladder rate)
  const calculateEffectiveHourlyRate = () => {
    if (!employeeDetails?.fixed_monthly_salary || !employeeDetails?.contracted_hours_per_month) {
      return null;
    }
    const nightRate = nightSupplement?.amount || 90;
    const nightValue = (employeeDetails.included_night_hours || 0) * nightRate;
    const restForRegular = employeeDetails.fixed_monthly_salary - nightValue;
    return restForRegular / (employeeDetails.contracted_hours_per_month - (employeeDetails.included_night_hours || 0));
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
          {/* Wage Ladder Connection - Shows the base rate being used */}
          {wageLadder && currentLevel && (
            <Card className="bg-primary/5 border-primary/20">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-3">
                  <TrendingUp className="h-4 w-4 text-primary" />
                  <span className="font-medium text-foreground">Koblet lønnsstige</span>
                  <Badge variant="outline" className="ml-auto">{wageLadder.name}</Badge>
                </div>
                <div className="grid grid-cols-3 gap-4 text-sm">
                  <div>
                    <p className="text-muted-foreground">Grunnlag timelønn</p>
                    <p className="font-bold text-primary text-lg">{currentLevel.hourlyRate.toFixed(2)} kr</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Ansiennitetsnivå</p>
                    <p className="font-medium text-foreground">Nivå {currentLevel.level}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Akkumulerte timer</p>
                    <p className="font-medium text-foreground">{(employeeDetails?.accumulated_hours || 0).toLocaleString("nb-NO")} t</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

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
                  <Moon className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium text-foreground">Innbakt nattillegg</span>
                </div>
                <div className="grid grid-cols-3 gap-4 text-sm">
                  <div>
                    <p className="text-muted-foreground">Innbakte natt-timer</p>
                    <p className="font-medium text-foreground">
                      {employeeDetails.included_night_hours.toFixed(1)} t/mnd
                    </p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Natt-tillegg ({getCompetenceLabel(employeeDetails.competence_level || null)})</p>
                    <p className="font-medium text-foreground">
                      {nightSupplement?.amount.toFixed(2) || "90"} kr/t
                    </p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Natt-verdi i lønn</p>
                    <p className="font-medium text-foreground">
                      {((employeeDetails.included_night_hours || 0) * (nightSupplement?.amount || 90)).toLocaleString("nb-NO", { maximumFractionDigits: 0 })} kr
                    </p>
                  </div>
                </div>
                {effectiveHourlyRate && currentLevel && (
                  <div className="mt-3 pt-3 border-t border-border">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Effektiv timelønn (beregnet):</span>
                      <span className={`font-bold ${Math.abs(effectiveHourlyRate - currentLevel.hourlyRate) < 1 ? 'text-primary' : 'text-destructive'}`}>
                        {effectiveHourlyRate.toFixed(2)} kr/t
                        {Math.abs(effectiveHourlyRate - currentLevel.hourlyRate) < 1 && (
                          <span className="text-primary ml-2">✓ Matcher lønnsstige</span>
                        )}
                      </span>
                    </div>
                  </div>
                )}
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

      {/* Applicable Supplements (from database) */}
      <div className="pt-4 border-t border-border">
        <h4 className="text-sm font-semibold text-foreground mb-3">Tillegg som gjelder</h4>
        <div className="space-y-2 text-sm">
          {nightSupplement && (
            <div className="flex items-center justify-between p-2 bg-muted/50 rounded-lg">
              <span>✓ {nightSupplement.name}</span>
              <span className="font-medium">{nightSupplement.amount.toFixed(0)} kr/t</span>
              <span className="text-muted-foreground">{nightSupplement.time_start || "21:00"}-{nightSupplement.time_end || "06:00"}</span>
            </div>
          )}
          {supplements.filter(s => s.applies_to === "weekend").slice(0, 2).map(supp => (
            <div key={supp.id} className="flex items-center justify-between p-2 bg-muted/50 rounded-lg">
              <span>✓ {supp.name}</span>
              <span className="font-medium">{supp.amount.toFixed(0)} kr/t</span>
              <span className="text-muted-foreground">Helg</span>
            </div>
          ))}
          {supplements.find(s => s.applies_to === "holiday") && (
            <div className="flex items-center justify-between p-2 bg-muted/50 rounded-lg">
              <span>✓ Helligdagstillegg</span>
              <span className="font-medium">{supplements.find(s => s.applies_to === "holiday")?.supplement_type === "percentage" ? `${supplements.find(s => s.applies_to === "holiday")?.amount}%` : `${supplements.find(s => s.applies_to === "holiday")?.amount} kr/t`}</span>
              <span className="text-muted-foreground">Røde dager</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}