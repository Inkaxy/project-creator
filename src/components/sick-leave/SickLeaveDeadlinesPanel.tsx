import { useState } from "react";
import { format, differenceInDays } from "date-fns";
import { nb } from "date-fns/locale";
import { 
  AlertTriangle, 
  Calendar, 
  CheckCircle, 
  Clock,
  FileText,
  Users,
  Activity
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useUpcomingDeadlines, useCompleteFollowUp, UpcomingDeadline } from "@/hooks/useSickLeave";
import { toast } from "sonner";

export function SickLeaveDeadlinesPanel() {
  const [completeDialogOpen, setCompleteDialogOpen] = useState(false);
  const [selectedDeadline, setSelectedDeadline] = useState<UpcomingDeadline | null>(null);
  const [notes, setNotes] = useState("");
  
  const { data: deadlines = [], isLoading } = useUpcomingDeadlines(60);
  const completeFollowUp = useCompleteFollowUp();
  
  const overdueDeadlines = deadlines.filter(d => d.isOverdue);
  const upcomingThisWeek = deadlines.filter(d => !d.isOverdue && d.daysUntil <= 7);
  const upcomingLater = deadlines.filter(d => !d.isOverdue && d.daysUntil > 7);

  const getDeadlineIcon = (type: string) => {
    switch (type) {
      case "Oppfølgingsplan": return <FileText className="h-4 w-4" />;
      case "Dialogmøte 1": return <Users className="h-4 w-4" />;
      case "Dialogmøte 2": return <Users className="h-4 w-4" />;
      case "Aktivitetsplikt": return <Activity className="h-4 w-4" />;
      default: return <Calendar className="h-4 w-4" />;
    }
  };

  const getActivityType = (deadlineType: string) => {
    switch (deadlineType) {
      case "Oppfølgingsplan": return "follow_up_plan";
      case "Dialogmøte 1": return "dialogue_meeting_1";
      case "Dialogmøte 2": return "dialogue_meeting_2";
      case "Aktivitetsplikt": return "activity_requirement";
      default: return null;
    }
  };

  const handleComplete = () => {
    if (!selectedDeadline) return;
    
    const activityType = getActivityType(selectedDeadline.deadlineType);
    if (!activityType) return;
    
    completeFollowUp.mutate({
      sickLeaveId: selectedDeadline.sickLeaveId,
      activityType: activityType as any,
      notes: notes || undefined,
    }, {
      onSuccess: () => {
        toast.success(`${selectedDeadline.deadlineType} markert som fullført`);
        setCompleteDialogOpen(false);
        setSelectedDeadline(null);
        setNotes("");
      },
      onError: () => {
        toast.error("Kunne ikke oppdatere oppfølgingen");
      }
    });
  };

  const openCompleteDialog = (deadline: UpcomingDeadline) => {
    setSelectedDeadline(deadline);
    setNotes("");
    setCompleteDialogOpen(true);
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-muted-foreground">
          Laster frister...
        </CardContent>
      </Card>
    );
  }

  if (deadlines.length === 0) {
    return (
      <Card>
        <CardContent className="py-8 text-center">
          <CheckCircle className="h-12 w-12 mx-auto text-green-500 mb-4" />
          <h3 className="font-semibold">Ingen kommende frister</h3>
          <p className="text-muted-foreground">
            Alle oppfølgingsfrister er under kontroll
          </p>
        </CardContent>
      </Card>
    );
  }

  const DeadlineCard = ({ deadline, variant }: { deadline: UpcomingDeadline; variant: "overdue" | "soon" | "later" }) => {
    const colorClasses = {
      overdue: "border-destructive bg-destructive/5",
      soon: "border-yellow-500 bg-yellow-50 dark:bg-yellow-950/20",
      later: "",
    };

    return (
      <div 
        className={`flex items-center justify-between p-3 rounded-lg border ${colorClasses[variant]}`}
      >
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-full ${
            variant === "overdue" 
              ? "bg-destructive/10 text-destructive" 
              : variant === "soon" 
                ? "bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300"
                : "bg-muted text-muted-foreground"
          }`}>
            {getDeadlineIcon(deadline.deadlineType)}
          </div>
          <div>
            <p className="font-medium">{deadline.employeeName}</p>
            <p className="text-sm text-muted-foreground">{deadline.deadlineType}</p>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          <div className="text-right">
            <p className={`text-sm font-medium ${
              variant === "overdue" ? "text-destructive" : ""
            }`}>
              {variant === "overdue" 
                ? `${Math.abs(deadline.daysUntil)} dager siden`
                : `Om ${deadline.daysUntil} dager`}
            </p>
            <p className="text-xs text-muted-foreground">
              {format(new Date(deadline.deadlineDate), "d. MMM yyyy", { locale: nb })}
            </p>
          </div>
          <Button 
            size="sm" 
            variant={variant === "overdue" ? "destructive" : "outline"}
            onClick={() => openCompleteDialog(deadline)}
          >
            Fullfør
          </Button>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Forfalte frister */}
      {overdueDeadlines.length > 0 && (
        <Card className="border-destructive">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="h-5 w-5" />
              Forfalte frister ({overdueDeadlines.length})
            </CardTitle>
            <CardDescription>
              Disse fristene har passert og må håndteres umiddelbart
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {overdueDeadlines.map(deadline => (
              <DeadlineCard 
                key={`${deadline.sickLeaveId}-${deadline.deadlineType}`} 
                deadline={deadline} 
                variant="overdue" 
              />
            ))}
          </CardContent>
        </Card>
      )}

      {/* Frister denne uken */}
      {upcomingThisWeek.length > 0 && (
        <Card className="border-yellow-500">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-yellow-600" />
              Denne uken ({upcomingThisWeek.length})
            </CardTitle>
            <CardDescription>
              Frister som forfaller de neste 7 dagene
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {upcomingThisWeek.map(deadline => (
              <DeadlineCard 
                key={`${deadline.sickLeaveId}-${deadline.deadlineType}`} 
                deadline={deadline} 
                variant="soon" 
              />
            ))}
          </CardContent>
        </Card>
      )}

      {/* Kommende frister */}
      {upcomingLater.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Kommende frister ({upcomingLater.length})
            </CardTitle>
            <CardDescription>
              Frister som forfaller om mer enn 7 dager
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {upcomingLater.map(deadline => (
              <DeadlineCard 
                key={`${deadline.sickLeaveId}-${deadline.deadlineType}`} 
                deadline={deadline} 
                variant="later" 
              />
            ))}
          </CardContent>
        </Card>
      )}

      {/* Fullfør dialog */}
      <Dialog open={completeDialogOpen} onOpenChange={setCompleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Fullfør {selectedDeadline?.deadlineType}</DialogTitle>
            <DialogDescription>
              Marker at {selectedDeadline?.deadlineType?.toLowerCase()} for {selectedDeadline?.employeeName} er gjennomført.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="notes">Notater (valgfritt)</Label>
              <Textarea
                id="notes"
                placeholder="Legg til eventuelle notater om oppfølgingen..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setCompleteDialogOpen(false)}>
              Avbryt
            </Button>
            <Button 
              onClick={handleComplete}
              disabled={completeFollowUp.isPending}
            >
              {completeFollowUp.isPending ? "Lagrer..." : "Marker som fullført"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
