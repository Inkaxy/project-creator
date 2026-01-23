import { useState } from "react";
import { format, differenceInDays } from "date-fns";
import { nb } from "date-fns/locale";
import {
  Calendar,
  CheckCircle,
  Clock,
  FileText,
  Users,
  Activity,
  AlertTriangle,
  DollarSign,
  RefreshCw,
  MessageSquare,
  Send,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AvatarWithInitials } from "@/components/ui/avatar-with-initials";
import { ExtendSickLeaveModal } from "./ExtendSickLeaveModal";
import { ReturnConversationModal } from "./ReturnConversationModal";
import {
  SickLeave,
  calculateEmployerPeriodStatus,
  useFollowUpEvents,
  useEndSickLeave,
  useCompleteFollowUp,
  useUpdateSickLeave,
} from "@/hooks/useSickLeave";
import { toast } from "sonner";

interface SickLeaveDetailModalProps {
  sickLeave: SickLeave | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function SickLeaveDetailModal({
  sickLeave,
  open,
  onOpenChange,
}: SickLeaveDetailModalProps) {
  const [extendModalOpen, setExtendModalOpen] = useState(false);
  const [returnConversationOpen, setReturnConversationOpen] = useState(false);
  const [navReportSending, setNavReportSending] = useState(false);
  
  const { data: followUpEvents = [] } = useFollowUpEvents(sickLeave?.id);
  const endSickLeave = useEndSickLeave();
  const completeFollowUp = useCompleteFollowUp();
  const updateSickLeave = useUpdateSickLeave();

  if (!sickLeave) return null;

  const employerStatus = calculateEmployerPeriodStatus(sickLeave);
  const profile = sickLeave.profiles;
  const today = new Date();
  const daysActive = differenceInDays(today, new Date(sickLeave.start_date)) + 1;

  const getLeaveTypeLabel = (type: string) => {
    switch (type) {
      case "egenmelding": return "Egenmelding";
      case "sykemelding": return "Sykemelding";
      case "gradert_sykemelding": return "Gradert sykemelding";
      case "arbeidsrelatert_sykdom": return "Arbeidsrelatert sykdom";
      default: return type;
    }
  };

  const deadlines = [
    {
      label: "Oppfølgingsplan",
      dueDate: sickLeave.follow_up_plan_due,
      completedAt: sickLeave.follow_up_plan_completed_at,
      activityType: "follow_up_plan" as const,
      icon: FileText,
    },
    {
      label: "Dialogmøte 1",
      dueDate: sickLeave.dialogue_meeting_1_due,
      completedAt: sickLeave.dialogue_meeting_1_completed_at,
      activityType: "dialogue_meeting_1" as const,
      icon: Users,
    },
    {
      label: "Aktivitetsplikt",
      dueDate: sickLeave.activity_requirement_due,
      completedAt: sickLeave.activity_requirement_met ? "completed" : null,
      activityType: "activity_requirement" as const,
      icon: Activity,
    },
    {
      label: "Dialogmøte 2 (NAV)",
      dueDate: sickLeave.dialogue_meeting_2_due,
      completedAt: sickLeave.dialogue_meeting_2_completed_at,
      activityType: "dialogue_meeting_2" as const,
      icon: Users,
    },
    {
      label: "Maksdato (52 uker)",
      dueDate: sickLeave.max_date,
      completedAt: sickLeave.status === "completed" ? "completed" : null,
      activityType: null,
      icon: Calendar,
    },
  ];

  const handleEndSickLeave = () => {
    const today = format(new Date(), "yyyy-MM-dd");
    endSickLeave.mutate({
      sickLeaveId: sickLeave.id,
      endDate: today,
      actualReturnDate: today,
    }, {
      onSuccess: () => {
        toast.success("Sykefravær avsluttet");
        onOpenChange(false);
      },
      onError: () => {
        toast.error("Kunne ikke avslutte sykefravær");
      }
    });
  };

  const handleCompleteDeadline = (activityType: string) => {
    completeFollowUp.mutate({
      sickLeaveId: sickLeave.id,
      activityType: activityType as any,
    }, {
      onSuccess: () => {
        toast.success("Oppfølging markert som fullført");
      },
      onError: () => {
        toast.error("Kunne ikke oppdatere oppfølging");
      }
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-4">
              <AvatarWithInitials
                name={profile?.full_name || "Ukjent"}
                avatarUrl={profile?.avatar_url || undefined}
                className="h-14 w-14"
              />
              <div>
                <DialogTitle className="text-xl">
                  {profile?.full_name || "Ukjent ansatt"}
                </DialogTitle>
                <p className="text-muted-foreground">
                  {profile?.departments?.name || "Ingen avdeling"}
                </p>
              </div>
            </div>
            <Badge 
              variant={sickLeave.status === "active" ? "default" : "secondary"}
              className="text-sm"
            >
              {getLeaveTypeLabel(sickLeave.leave_type)}
              {sickLeave.sick_leave_percentage < 100 && 
                ` ${sickLeave.sick_leave_percentage}%`}
            </Badge>
          </div>
        </DialogHeader>

        <Tabs defaultValue="overview" className="mt-4">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="overview">Oversikt</TabsTrigger>
            <TabsTrigger value="followup">Oppfølging</TabsTrigger>
            <TabsTrigger value="history">Historikk</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4 mt-4">
            {/* Periode-info */}
            <Card>
              <CardContent className="pt-4">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div>
                    <p className="text-muted-foreground">Fra dato</p>
                    <p className="font-medium">
                      {format(new Date(sickLeave.start_date), "d. MMM yyyy", { locale: nb })}
                    </p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Til dato</p>
                    <p className="font-medium">
                      {sickLeave.end_date 
                        ? format(new Date(sickLeave.end_date), "d. MMM yyyy", { locale: nb })
                        : "Pågående"}
                    </p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Forventet tilbake</p>
                    <p className="font-medium">
                      {sickLeave.expected_return_date
                        ? format(new Date(sickLeave.expected_return_date), "d. MMM yyyy", { locale: nb })
                        : "-"}
                    </p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Varighet</p>
                    <p className="font-medium">{daysActive} dager</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Arbeidsgiverperiode */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2">
                  <DollarSign className="h-4 w-4" />
                  Arbeidsgiverperiode
                </CardTitle>
              </CardHeader>
              <CardContent>
                {employerStatus.isComplete ? (
                  <div className="flex items-center gap-2 text-green-600">
                    <CheckCircle className="h-5 w-5" />
                    <span className="font-medium">Arbeidsgiverperioden fullført</span>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between text-sm">
                      <span>Dag {employerStatus.daysPassed} av 16</span>
                      <span>{employerStatus.daysRemaining} dager igjen</span>
                    </div>
                    <Progress value={employerStatus.progress} className="h-3" />
                    <div className="grid grid-cols-3 gap-4 text-sm">
                      <div>
                        <p className="text-muted-foreground">Start</p>
                        <p className="font-medium">
                          {format(new Date(employerStatus.startDate), "d. MMM", { locale: nb })}
                        </p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Slutt</p>
                        <p className="font-medium">
                          {format(new Date(employerStatus.endDate), "d. MMM", { locale: nb })}
                        </p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">NAV overtar</p>
                        <p className="font-medium">
                          {employerStatus.navTakeoverDate && 
                            format(new Date(employerStatus.navTakeoverDate), "d. MMM", { locale: nb })}
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Notater */}
            {sickLeave.notes && (
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">Notater</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm">{sickLeave.notes}</p>
                </CardContent>
              </Card>
            )}

            {/* Handlinger */}
            {sickLeave.status === "active" && (
              <div className="grid grid-cols-2 gap-2">
                <Button 
                  variant="outline"
                  onClick={() => setReturnConversationOpen(true)}
                >
                  <MessageSquare className="h-4 w-4 mr-2" />
                  Tilbakekomstsamtale
                </Button>
                <Button 
                  variant="outline"
                  onClick={() => setExtendModalOpen(true)}
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Forleng
                </Button>
                <Button 
                  variant="outline" 
                  className="col-span-2"
                  onClick={handleEndSickLeave}
                  disabled={endSickLeave.isPending}
                >
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Avslutt sykefravær (friskmelding)
                </Button>
              </div>
            )}

            {/* NAV inntektsmelding status */}
            {employerStatus.isComplete && sickLeave.status === "active" && (
              <Card className="border-blue-500 bg-blue-50 dark:bg-blue-950/20">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base flex items-center gap-2 text-blue-700 dark:text-blue-300">
                    <Send className="h-4 w-4" />
                    NAV Inntektsmelding
                  </CardTitle>
                </CardHeader>
                <CardContent className="text-sm">
                  {sickLeave.income_report_sent_at ? (
                    <div className="flex items-center gap-2 text-green-600">
                      <CheckCircle className="h-4 w-4" />
                      <span>
                        Sendt {format(new Date(sickLeave.income_report_sent_at), "d. MMM yyyy", { locale: nb })}
                      </span>
                      {sickLeave.nav_case_number && (
                        <Badge variant="outline">Sak: {sickLeave.nav_case_number}</Badge>
                      )}
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <p className="text-muted-foreground">
                        Arbeidsgiverperioden er fullført. Inntektsmelding må sendes til NAV.
                      </p>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setNavReportSending(true);
                          updateSickLeave.mutate({
                            id: sickLeave.id,
                            internal_notes: `${sickLeave.internal_notes || ''}\n[${format(new Date(), 'dd.MM.yyyy HH:mm')}] Inntektsmelding sendt til NAV via A-ordningen.`
                          }, {
                            onSuccess: () => {
                              setNavReportSending(false);
                              toast.success("Marker at inntektsmelding er sendt");
                            },
                            onError: () => {
                              setNavReportSending(false);
                            }
                          });
                        }}
                        disabled={navReportSending}
                      >
                        Marker som sendt
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="followup" className="space-y-4 mt-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Oppfølgingsfrister</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {deadlines.map((deadline) => {
                  const dueDate = new Date(deadline.dueDate);
                  const isOverdue = !deadline.completedAt && dueDate < today;
                  const daysUntil = differenceInDays(dueDate, today);
                  const Icon = deadline.icon;

                  return (
                    <div
                      key={deadline.label}
                      className={`flex items-center justify-between p-3 rounded-lg border ${
                        deadline.completedAt
                          ? "bg-green-50 border-green-200 dark:bg-green-950/20 dark:border-green-800"
                          : isOverdue
                          ? "bg-destructive/10 border-destructive"
                          : ""
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-full ${
                          deadline.completedAt
                            ? "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300"
                            : isOverdue
                            ? "bg-destructive/20 text-destructive"
                            : "bg-muted text-muted-foreground"
                        }`}>
                          {deadline.completedAt ? (
                            <CheckCircle className="h-4 w-4" />
                          ) : (
                            <Icon className="h-4 w-4" />
                          )}
                        </div>
                        <div>
                          <p className="font-medium">{deadline.label}</p>
                          <p className="text-sm text-muted-foreground">
                            {format(dueDate, "d. MMM yyyy", { locale: nb })}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        {deadline.completedAt ? (
                          <Badge variant="outline" className="text-green-600">
                            Fullført
                          </Badge>
                        ) : (
                          <>
                            <span className={`text-sm ${isOverdue ? "text-destructive font-medium" : ""}`}>
                              {isOverdue
                                ? `${Math.abs(daysUntil)} dager siden`
                                : `Om ${daysUntil} dager`}
                            </span>
                            {deadline.activityType && (
                              <Button
                                size="sm"
                                variant={isOverdue ? "destructive" : "outline"}
                                onClick={() => handleCompleteDeadline(deadline.activityType!)}
                                disabled={completeFollowUp.isPending}
                              >
                                Fullfør
                              </Button>
                            )}
                          </>
                        )}
                      </div>
                    </div>
                  );
                })}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="history" className="space-y-4 mt-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Hendelseslogg</CardTitle>
              </CardHeader>
              <CardContent>
                {followUpEvents.length === 0 ? (
                  <p className="text-muted-foreground text-center py-4">
                    Ingen hendelser registrert ennå
                  </p>
                ) : (
                  <div className="space-y-3">
                    {followUpEvents.map((event) => (
                      <div
                        key={event.id}
                        className="flex items-start gap-3 pb-3 border-b last:border-0"
                      >
                        <div className="p-2 rounded-full bg-muted">
                          <Clock className="h-4 w-4 text-muted-foreground" />
                        </div>
                        <div className="flex-1">
                          <p className="font-medium text-sm">
                            {event.event_type.replace(/_/g, " ")}
                          </p>
                          {event.description && (
                            <p className="text-sm text-muted-foreground mt-1">
                              {event.description}
                            </p>
                          )}
                          <p className="text-xs text-muted-foreground mt-1">
                            {format(new Date(event.event_date), "d. MMM yyyy", { locale: nb })}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </DialogContent>

      {/* Modaler */}
      <ExtendSickLeaveModal
        sickLeave={sickLeave}
        open={extendModalOpen}
        onOpenChange={setExtendModalOpen}
      />
      <ReturnConversationModal
        sickLeave={sickLeave}
        open={returnConversationOpen}
        onOpenChange={setReturnConversationOpen}
      />
    </Dialog>
  );
}
