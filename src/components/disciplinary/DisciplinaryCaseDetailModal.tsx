import { useState } from "react";
import { format } from "date-fns";
import { nb } from "date-fns/locale";
import {
  AlertTriangle,
  Calendar,
  CheckCircle2,
  Clock,
  FileText,
  MapPin,
  MessageSquare,
  Send,
  Shield,
  User,
  XCircle,
  History,
  Users,
  Paperclip,
  Undo,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { AvatarWithInitials } from "@/components/ui/avatar-with-initials";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  useDisciplinaryCase,
  useSendDisciplinaryCase,
  useWithdrawDisciplinaryCase,
  useDisciplinaryAuditLog,
} from "@/hooks/useDisciplinary";
import {
  getSeverityLabel,
  getSeverityColor,
  getStatusLabel,
  getStatusColor,
  getWarningTypeLabel,
  getMeetingTypeLabel,
} from "@/types/disciplinary";
import type { DisciplinaryCase } from "@/types/disciplinary";

interface DisciplinaryCaseDetailModalProps {
  caseItem: DisciplinaryCase | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function DisciplinaryCaseDetailModal({
  caseItem,
  open,
  onOpenChange,
}: DisciplinaryCaseDetailModalProps) {
  const [showSendConfirm, setShowSendConfirm] = useState(false);
  const [showWithdrawConfirm, setShowWithdrawConfirm] = useState(false);

  const { data: fullCase, isLoading } = useDisciplinaryCase(caseItem?.id || null);
  const { data: auditLog = [] } = useDisciplinaryAuditLog(caseItem?.id || null);
  const sendCase = useSendDisciplinaryCase();
  const withdrawCase = useWithdrawDisciplinaryCase();

  const displayCase = fullCase || caseItem;

  const handleSend = async () => {
    if (!displayCase) return;
    await sendCase.mutateAsync(displayCase.id);
    setShowSendConfirm(false);
  };

  const handleWithdraw = async () => {
    if (!displayCase) return;
    await withdrawCase.mutateAsync(displayCase.id);
    setShowWithdrawConfirm(false);
    onOpenChange(false);
  };

  if (!displayCase) return null;

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <div className="flex items-center gap-3">
              <AvatarWithInitials
                name={displayCase.employee?.full_name || "Ukjent"}
                avatarUrl={displayCase.employee?.avatar_url}
                className="h-12 w-12"
              />
              <div>
                <DialogTitle className="text-xl">
                  {displayCase.case_number}
                </DialogTitle>
                <DialogDescription className="flex items-center gap-2">
                  {displayCase.employee?.full_name || "Ukjent ansatt"}
                  <Badge variant="outline" className={getStatusColor(displayCase.status)}>
                    {getStatusLabel(displayCase.status)}
                  </Badge>
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          <Tabs defaultValue="details" className="mt-4">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="details">Detaljer</TabsTrigger>
              <TabsTrigger value="meetings">
                Møter {fullCase?.meetings?.length ? `(${fullCase.meetings.length})` : ""}
              </TabsTrigger>
              <TabsTrigger value="responses">
                Tilsvar {fullCase?.responses?.length ? `(${fullCase.responses.length})` : ""}
              </TabsTrigger>
              <TabsTrigger value="history">Historikk</TabsTrigger>
            </TabsList>

            {/* Details Tab */}
            <TabsContent value="details" className="space-y-6 mt-4">
              {/* Severity and Type */}
              <div className="flex items-center gap-4">
                <Badge variant="outline" className={getSeverityColor(displayCase.severity)}>
                  <AlertTriangle className="h-3 w-3 mr-1" />
                  {getSeverityLabel(displayCase.severity)}
                </Badge>
                <Badge variant="secondary">
                  {getWarningTypeLabel(displayCase.warning_type)}
                </Badge>
                <Badge variant="outline">
                  {displayCase.category?.name || "Ukjent kategori"}
                </Badge>
              </div>

              {/* Incident Info */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Clock className="h-4 w-4" />
                    Hendelsen
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <span>
                        {format(new Date(displayCase.incident_date), "EEEE d. MMMM yyyy", { locale: nb })}
                        {displayCase.incident_time && ` kl. ${displayCase.incident_time.slice(0, 5)}`}
                      </span>
                    </div>
                    {displayCase.incident_location && (
                      <div className="flex items-center gap-2">
                        <MapPin className="h-4 w-4 text-muted-foreground" />
                        <span>{displayCase.incident_location}</span>
                      </div>
                    )}
                  </div>
                  
                  <div>
                    <Label className="text-muted-foreground">Beskrivelse</Label>
                    <p className="mt-1 whitespace-pre-wrap">{displayCase.incident_description}</p>
                  </div>
                </CardContent>
              </Card>

              {/* Actions/Expectations */}
              {(displayCase.consequences_description || displayCase.improvement_expectations) && (
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base flex items-center gap-2">
                      <FileText className="h-4 w-4" />
                      Tiltak og forventninger
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {displayCase.consequences_description && (
                      <div>
                        <Label className="text-muted-foreground">Konsekvenser ved gjentagelse</Label>
                        <p className="mt-1 whitespace-pre-wrap">{displayCase.consequences_description}</p>
                      </div>
                    )}
                    {displayCase.improvement_expectations && (
                      <div>
                        <Label className="text-muted-foreground">Forventninger til forbedring</Label>
                        <p className="mt-1 whitespace-pre-wrap">{displayCase.improvement_expectations}</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}

              {/* Blocking Info */}
              {(displayCase.blocks_clock_in || displayCase.blocks_timesheet) && (
                <Card className="border-yellow-200 bg-yellow-50 dark:border-yellow-900 dark:bg-yellow-950">
                  <CardContent className="py-4">
                    <div className="flex items-center gap-2 text-yellow-800 dark:text-yellow-200">
                      <Shield className="h-5 w-5" />
                      <span className="font-medium">Blokkering aktiv</span>
                    </div>
                    <div className="mt-2 text-sm text-yellow-700 dark:text-yellow-300 space-y-1">
                      {displayCase.blocks_clock_in && (
                        <p>• Ansatt kan ikke stemple inn før saken er kvittert</p>
                      )}
                      {displayCase.blocks_timesheet && (
                        <p>• Ansatt kan ikke levere timelister før saken er kvittert</p>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Meta Info */}
              <div className="grid grid-cols-2 gap-4 text-sm text-muted-foreground">
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4" />
                  Opprettet av: {displayCase.created_by_user?.full_name || "Ukjent"}
                </div>
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  Opprettet: {format(new Date(displayCase.created_at), "dd.MM.yyyy HH:mm")}
                </div>
                {displayCase.sent_at && (
                  <div className="flex items-center gap-2">
                    <Send className="h-4 w-4" />
                    Sendt: {format(new Date(displayCase.sent_at), "dd.MM.yyyy HH:mm")}
                  </div>
                )}
                {displayCase.expiry_date && (
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4" />
                    Utløper: {format(new Date(displayCase.expiry_date), "dd.MM.yyyy")}
                  </div>
                )}
              </div>
            </TabsContent>

            {/* Meetings Tab */}
            <TabsContent value="meetings" className="mt-4">
              {fullCase?.meetings && fullCase.meetings.length > 0 ? (
                <div className="space-y-4">
                  {fullCase.meetings.map((meeting: any) => (
                    <Card key={meeting.id}>
                      <CardContent className="py-4">
                        <div className="flex items-start justify-between">
                          <div>
                            <h4 className="font-medium">
                              {getMeetingTypeLabel(meeting.meeting_type)}
                            </h4>
                            <p className="text-sm text-muted-foreground">
                              {format(new Date(meeting.scheduled_at), "EEEE d. MMMM yyyy 'kl.' HH:mm", { locale: nb })}
                            </p>
                            {meeting.location && (
                              <p className="text-sm text-muted-foreground flex items-center gap-1 mt-1">
                                <MapPin className="h-3 w-3" />
                                {meeting.location}
                              </p>
                            )}
                          </div>
                          <Badge variant={meeting.status === 'completed' ? 'default' : 'secondary'}>
                            {meeting.status === 'completed' ? 'Gjennomført' : 'Planlagt'}
                          </Badge>
                        </div>
                        {meeting.minutes && (
                          <div className="mt-4 p-3 bg-muted rounded-md">
                            <Label className="text-xs text-muted-foreground">Referat</Label>
                            <p className="text-sm mt-1">{meeting.minutes}</p>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Ingen møter planlagt</p>
                </div>
              )}
            </TabsContent>

            {/* Responses Tab */}
            <TabsContent value="responses" className="mt-4">
              {fullCase?.responses && fullCase.responses.length > 0 ? (
                <div className="space-y-4">
                  {fullCase.responses.map((response: any) => (
                    <Card key={response.id}>
                      <CardContent className="py-4">
                        <div className="flex items-center gap-2 mb-2">
                          {response.response_type === 'disputed' ? (
                            <XCircle className="h-5 w-5 text-red-600" />
                          ) : (
                            <CheckCircle2 className="h-5 w-5 text-green-600" />
                          )}
                          <span className="font-medium">
                            {response.response_type === 'disputed' 
                              ? 'Bestridt' 
                              : response.response_type === 'acknowledged_with_comment'
                              ? 'Kvittert med kommentar'
                              : 'Kvittert'}
                          </span>
                          <span className="text-sm text-muted-foreground">
                            {format(new Date(response.responded_at), "dd.MM.yyyy HH:mm")}
                          </span>
                        </div>
                        {response.comment && (
                          <div className="p-3 bg-muted rounded-md">
                            <p className="text-sm">{response.comment}</p>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <MessageSquare className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Ingen tilsvar mottatt</p>
                </div>
              )}
            </TabsContent>

            {/* History Tab */}
            <TabsContent value="history" className="mt-4">
              {auditLog.length > 0 ? (
                <div className="space-y-3">
                  {auditLog.map((entry) => (
                    <div key={entry.id} className="flex items-start gap-3 text-sm">
                      <div className="mt-0.5">
                        <History className="h-4 w-4 text-muted-foreground" />
                      </div>
                      <div className="flex-1">
                        <p>
                          <span className="font-medium">{entry.performed_by_user?.full_name || 'System'}</span>
                          {' '}
                          <span className="text-muted-foreground">{entry.description}</span>
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {format(new Date(entry.performed_at), "dd.MM.yyyy HH:mm")}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <History className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Ingen historikk</p>
                </div>
              )}
            </TabsContent>
          </Tabs>

          <DialogFooter className="flex-col sm:flex-row gap-2 mt-6">
            {displayCase.status === 'draft' && (
              <>
                <Button 
                  variant="outline" 
                  onClick={() => setShowWithdrawConfirm(true)}
                  className="text-destructive"
                >
                  <XCircle className="h-4 w-4 mr-2" />
                  Slett utkast
                </Button>
                <Button onClick={() => setShowSendConfirm(true)}>
                  <Send className="h-4 w-4 mr-2" />
                  Send til ansatt
                </Button>
              </>
            )}
            {displayCase.status === 'pending_acknowledgment' && (
              <Button 
                variant="outline" 
                onClick={() => setShowWithdrawConfirm(true)}
              >
                <Undo className="h-4 w-4 mr-2" />
                Trekk tilbake
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Send Confirmation Dialog */}
      <AlertDialog open={showSendConfirm} onOpenChange={setShowSendConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Send sak til ansatt?</AlertDialogTitle>
            <AlertDialogDescription>
              Saken vil bli sendt til {displayCase.employee?.full_name} og de vil bli bedt om å kvittere.
              {(displayCase.blocks_clock_in || displayCase.blocks_timesheet) && (
                <span className="block mt-2 text-yellow-600">
                  ⚠️ Ansatten vil bli blokkert fra {displayCase.blocks_clock_in && 'innstempling'}
                  {displayCase.blocks_clock_in && displayCase.blocks_timesheet && ' og '}
                  {displayCase.blocks_timesheet && 'timelistelevering'} til saken er kvittert.
                </span>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Avbryt</AlertDialogCancel>
            <AlertDialogAction onClick={handleSend}>
              Send til ansatt
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Withdraw Confirmation Dialog */}
      <AlertDialog open={showWithdrawConfirm} onOpenChange={setShowWithdrawConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {displayCase.status === 'draft' ? 'Slett utkast?' : 'Trekk tilbake saken?'}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {displayCase.status === 'draft' 
                ? 'Utkastet vil bli slettet og kan ikke gjenopprettes.'
                : 'Saken vil bli trukket tilbake. Ansatten vil ikke lenger se saken og eventuelle blokkeringer vil bli fjernet.'}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Avbryt</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleWithdraw}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {displayCase.status === 'draft' ? 'Slett' : 'Trekk tilbake'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
