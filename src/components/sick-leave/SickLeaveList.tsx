import { useState } from "react";
import { format, differenceInDays } from "date-fns";
import { nb } from "date-fns/locale";
import { 
  User, 
  Calendar, 
  ChevronRight, 
  Clock,
  CheckCircle,
  AlertTriangle
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { AvatarWithInitials } from "@/components/ui/avatar-with-initials";
import { SickLeaveDetailModal } from "./SickLeaveDetailModal";
import { useSickLeaves, calculateEmployerPeriodStatus, SickLeave } from "@/hooks/useSickLeave";

interface SickLeaveListProps {
  status?: "active" | "completed" | "all";
}

export function SickLeaveList({ status = "all" }: SickLeaveListProps) {
  const [selectedSickLeave, setSelectedSickLeave] = useState<SickLeave | null>(null);
  
  const { data: sickLeaves = [], isLoading } = useSickLeaves(
    status === "all" ? undefined : { status }
  );

  const getLeaveTypeLabel = (type: string) => {
    switch (type) {
      case "egenmelding": return "Egenmelding";
      case "sykemelding": return "Sykemelding";
      case "gradert_sykemelding": return "Gradert sykemelding";
      case "arbeidsrelatert_sykdom": return "Arbeidsrelatert sykdom";
      default: return type;
    }
  };

  const getLeaveTypeColor = (type: string) => {
    switch (type) {
      case "egenmelding": return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200";
      case "sykemelding": return "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200";
      case "gradert_sykemelding": return "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200";
      case "arbeidsrelatert_sykdom": return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200";
      default: return "bg-muted text-muted-foreground";
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-muted-foreground">
          Laster sykefravær...
        </CardContent>
      </Card>
    );
  }

  if (sickLeaves.length === 0) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-muted-foreground">
          {status === "active" 
            ? "Ingen aktive sykefravær" 
            : status === "completed" 
              ? "Ingen avsluttede sykefravær"
              : "Ingen sykefravær funnet"}
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <div className="space-y-4">
        {sickLeaves.map((sickLeave) => {
          const employerStatus = calculateEmployerPeriodStatus(sickLeave);
          const profile = sickLeave.profiles;
          const departmentName = profile?.departments?.name || "Ingen avdeling";
          
          const daysActive = differenceInDays(
            new Date(), 
            new Date(sickLeave.start_date)
          ) + 1;
          
          return (
            <Card key={sickLeave.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-4">
                <div className="flex items-start gap-4">
                  {/* Avatar */}
                  <AvatarWithInitials
                    name={profile?.full_name || "Ukjent"}
                    avatarUrl={profile?.avatar_url || undefined}
                    className="h-12 w-12"
                  />
                  
                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h3 className="font-semibold text-foreground">
                          {profile?.full_name || "Ukjent ansatt"}
                        </h3>
                        <p className="text-sm text-muted-foreground">
                          {departmentName}
                        </p>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <Badge className={getLeaveTypeColor(sickLeave.leave_type)}>
                          {getLeaveTypeLabel(sickLeave.leave_type)}
                          {sickLeave.sick_leave_percentage < 100 && 
                            ` ${sickLeave.sick_leave_percentage}%`}
                        </Badge>
                        {sickLeave.status === "completed" && (
                          <Badge variant="outline" className="text-green-600">
                            <CheckCircle className="h-3 w-3 mr-1" />
                            Avsluttet
                          </Badge>
                        )}
                      </div>
                    </div>
                    
                    {/* Datoer */}
                    <div className="flex items-center gap-4 mt-2 text-sm">
                      <div className="flex items-center gap-1 text-muted-foreground">
                        <Calendar className="h-4 w-4" />
                        Fra: {format(new Date(sickLeave.start_date), "d. MMM yyyy", { locale: nb })}
                      </div>
                      {sickLeave.end_date && (
                        <div className="flex items-center gap-1 text-muted-foreground">
                          Til: {format(new Date(sickLeave.end_date), "d. MMM yyyy", { locale: nb })}
                        </div>
                      )}
                      {sickLeave.expected_return_date && !sickLeave.end_date && (
                        <div className="flex items-center gap-1 text-muted-foreground">
                          Forventet: {format(new Date(sickLeave.expected_return_date), "d. MMM yyyy", { locale: nb })}
                        </div>
                      )}
                    </div>
                    
                    {/* Arbeidsgiverperiode-status (kun for aktive) */}
                    {sickLeave.status === "active" && (
                      <div className="mt-3">
                        {employerStatus.isComplete ? (
                          <div className="flex items-center gap-2 text-sm">
                            <CheckCircle className="h-4 w-4 text-green-600" />
                            <span className="text-green-600 font-medium">
                              Arbeidsgiverperioden fullført
                            </span>
                            <span className="text-muted-foreground">
                              - NAV-perioden (dag {daysActive})
                            </span>
                          </div>
                        ) : (
                          <div className="space-y-1">
                            <div className="flex items-center justify-between text-sm">
                              <span className="text-muted-foreground">
                                Arbeidsgiverperioden
                              </span>
                              <span className="font-medium">
                                Dag {employerStatus.daysPassed} av 16
                              </span>
                            </div>
                            <Progress value={employerStatus.progress} className="h-2" />
                            <div className="flex items-center justify-between text-xs text-muted-foreground">
                              <span>{employerStatus.daysRemaining} dager igjen</span>
                              <span>NAV overtar: {format(new Date(employerStatus.navTakeoverDate!), "d. MMM", { locale: nb })}</span>
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                  
                  {/* Action */}
                  <Button 
                    variant="ghost" 
                    size="icon"
                    onClick={() => setSelectedSickLeave(sickLeave)}
                  >
                    <ChevronRight className="h-5 w-5" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Detail Modal */}
      <SickLeaveDetailModal
        sickLeave={selectedSickLeave}
        open={!!selectedSickLeave}
        onOpenChange={(open) => !open && setSelectedSickLeave(null)}
      />
    </>
  );
}
