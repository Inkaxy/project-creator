import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Thermometer, Calendar, FileText, ChevronRight, AlertCircle } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useEmployeeSickLeaves, useSelfCertQuota, useSickLeaveSettings, type SickLeave } from "@/hooks/useSickLeave";
import { format, differenceInDays } from "date-fns";
import { nb } from "date-fns/locale";

function getLeaveTypeLabel(type: string): string {
  switch (type) {
    case "egenmelding":
      return "Egenmelding";
    case "sykemelding":
      return "Sykemelding";
    case "gradert_sykemelding":
      return "Gradert sykemelding";
    case "arbeidsrelatert_sykdom":
      return "Arbeidsrelatert sykdom";
    default:
      return type;
  }
}

function getStatusBadge(status: string) {
  switch (status) {
    case "active":
      return <Badge variant="destructive">Pågående</Badge>;
    case "completed":
      return <Badge variant="secondary">Avsluttet</Badge>;
    case "extended":
      return <Badge variant="outline" className="border-warning text-warning">Forlenget</Badge>;
    default:
      return <Badge variant="outline">{status}</Badge>;
  }
}

export function MySickLeaveCard() {
  const { user } = useAuth();
  const [historyOpen, setHistoryOpen] = useState(false);
  
  const { data: sickLeaves = [], isLoading } = useEmployeeSickLeaves(user?.id);
  const { data: quota } = useSelfCertQuota(user?.id);
  const { data: settings } = useSickLeaveSettings();
  
  const activeSickLeave = sickLeaves.find(sl => sl.status === "active");
  const completedSickLeaves = sickLeaves.filter(sl => sl.status !== "active").slice(0, 5);
  
  // Calculate quota usage
  const showQuota = settings?.allow_employee_quota_view !== false;
  const quotaUsedPercent = quota 
    ? (quota.days_used / quota.max_days_per_period) * 100 
    : 0;
  const quotaRemaining = quota 
    ? quota.max_days_per_period - quota.days_used 
    : 0;

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-muted rounded w-1/3" />
            <div className="h-8 bg-muted rounded w-2/3" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Thermometer className="h-5 w-5 text-destructive" />
            Sykefravær
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Active sick leave */}
          {activeSickLeave ? (
            <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-4">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    {getStatusBadge(activeSickLeave.status)}
                    <span className="text-sm font-medium">
                      {getLeaveTypeLabel(activeSickLeave.leave_type)}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Fra {format(new Date(activeSickLeave.start_date), "d. MMMM yyyy", { locale: nb })}
                  </p>
                  {activeSickLeave.sick_leave_percentage < 100 && (
                    <p className="text-sm text-muted-foreground">
                      {activeSickLeave.sick_leave_percentage}% sykmeldt
                    </p>
                  )}
                  {activeSickLeave.expected_return_date && (
                    <p className="text-sm mt-1">
                      Forventet tilbake: {format(new Date(activeSickLeave.expected_return_date), "d. MMMM", { locale: nb })}
                    </p>
                  )}
                </div>
                <div className="text-right text-sm text-muted-foreground">
                  Dag {differenceInDays(new Date(), new Date(activeSickLeave.start_date)) + 1}
                </div>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-3 text-muted-foreground">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-success/10">
                <Thermometer className="h-5 w-5 text-success" />
              </div>
              <span className="text-sm">Ingen pågående sykefravær</span>
            </div>
          )}

          {/* Self-cert quota */}
          {showQuota && quota && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Egenmeldingskvote ({new Date().getFullYear()})</span>
                <span className="font-medium">
                  {quota.days_used} / {quota.max_days_per_period} dager brukt
                </span>
              </div>
              <Progress value={quotaUsedPercent} className="h-2" />
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>{quotaRemaining} dager igjen</span>
                {quota.max_occurrences_per_period && (
                  <span>
                    {quota.occurrences_used} / {quota.max_occurrences_per_period} tilfeller
                  </span>
                )}
              </div>
              {quotaRemaining <= 3 && quotaRemaining > 0 && (
                <div className="flex items-center gap-2 text-xs text-warning mt-1">
                  <AlertCircle className="h-3 w-3" />
                  <span>Få egenmeldingsdager igjen</span>
                </div>
              )}
            </div>
          )}

          {/* History link */}
          {sickLeaves.length > 0 && (
            <Button
              variant="ghost"
              className="w-full justify-between text-sm"
              onClick={() => setHistoryOpen(true)}
            >
              <span className="flex items-center gap-2">
                <FileText className="h-4 w-4" />
                Sykefraværshistorikk ({sickLeaves.length})
              </span>
              <ChevronRight className="h-4 w-4" />
            </Button>
          )}
        </CardContent>
      </Card>

      {/* History Dialog */}
      <Dialog open={historyOpen} onOpenChange={setHistoryOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Thermometer className="h-5 w-5" />
              Sykefraværshistorikk
            </DialogTitle>
          </DialogHeader>
          <ScrollArea className="max-h-[60vh]">
            <div className="space-y-3 pr-4">
              {sickLeaves.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">
                  Ingen sykefravær registrert
                </p>
              ) : (
                sickLeaves.map((sl) => (
                  <div
                    key={sl.id}
                    className="rounded-lg border p-4 space-y-2"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-medium">
                        {getLeaveTypeLabel(sl.leave_type)}
                      </span>
                      {getStatusBadge(sl.status)}
                    </div>
                    <div className="text-sm text-muted-foreground space-y-1">
                      <div className="flex items-center gap-2">
                        <Calendar className="h-3 w-3" />
                        <span>
                          {format(new Date(sl.start_date), "d. MMM yyyy", { locale: nb })}
                          {sl.actual_return_date && (
                            <> – {format(new Date(sl.actual_return_date), "d. MMM yyyy", { locale: nb })}</>
                          )}
                          {!sl.actual_return_date && sl.end_date && (
                            <> – {format(new Date(sl.end_date), "d. MMM yyyy", { locale: nb })}</>
                          )}
                        </span>
                      </div>
                      {sl.sick_leave_percentage < 100 && (
                        <div>{sl.sick_leave_percentage}% sykmeldt</div>
                      )}
                      {sl.actual_return_date && (
                        <div>
                          Varighet: {differenceInDays(new Date(sl.actual_return_date), new Date(sl.start_date)) + 1} dager
                        </div>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>
    </>
  );
}
