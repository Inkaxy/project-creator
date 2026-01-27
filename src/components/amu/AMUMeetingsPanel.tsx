import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  Plus, 
  Calendar, 
  Clock, 
  MapPin, 
  Users, 
  FileText,
  ChevronRight,
  CalendarDays
} from "lucide-react";
import { useAMUMeetings } from "@/hooks/useAMU";
import { CreateAMUMeetingModal } from "./CreateAMUMeetingModal";
import { AMU_MEETING_STATUS_LABELS, type AMUMeetingStatus } from "@/types/amu";
import { format } from "date-fns";
import { nb } from "date-fns/locale";

export function AMUMeetingsPanel() {
  const navigate = useNavigate();
  const { data: meetings, isLoading } = useAMUMeetings();
  const [createModalOpen, setCreateModalOpen] = useState(false);

  const getStatusBadgeVariant = (status: AMUMeetingStatus) => {
    switch (status) {
      case "completed":
        return "default";
      case "in_progress":
        return "secondary";
      case "cancelled":
        return "destructive";
      default:
        return "outline";
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-40" />
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-24 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <CalendarDays className="h-5 w-5" />
            AMU-møter
          </CardTitle>
          <Button onClick={() => setCreateModalOpen(true)} size="sm">
            <Plus className="mr-2 h-4 w-4" />
            Nytt møte
          </Button>
        </CardHeader>
        <CardContent>
          {meetings && meetings.length > 0 ? (
            <div className="space-y-4">
              {meetings.map((meeting) => (
                <div
                  key={meeting.id}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors cursor-pointer group"
                  onClick={() => navigate(`/amu/mote/${meeting.id}`)}
                >
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center gap-3">
                      <h3 className="font-semibold">{meeting.title}</h3>
                      <Badge variant={getStatusBadgeVariant(meeting.status)}>
                        {AMU_MEETING_STATUS_LABELS[meeting.status]}
                      </Badge>
                      {meeting.meeting_number && (
                        <span className="text-sm text-muted-foreground">
                          Møte nr. {meeting.meeting_number}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Calendar className="h-4 w-4" />
                        {format(new Date(meeting.meeting_date), "d. MMMM yyyy", { locale: nb })}
                      </span>
                      {meeting.meeting_time && (
                        <span className="flex items-center gap-1">
                          <Clock className="h-4 w-4" />
                          {meeting.meeting_time.substring(0, 5)}
                        </span>
                      )}
                      {meeting.location && (
                        <span className="flex items-center gap-1">
                          <MapPin className="h-4 w-4" />
                          {meeting.location}
                        </span>
                      )}
                      {meeting.participants && (
                        <span className="flex items-center gap-1">
                          <Users className="h-4 w-4" />
                          {meeting.participants.length} deltakere
                        </span>
                      )}
                      {meeting.agenda_items && (
                        <span className="flex items-center gap-1">
                          <FileText className="h-4 w-4" />
                          {meeting.agenda_items.length} agendapunkter
                        </span>
                      )}
                    </div>
                  </div>
                  <ChevronRight className="h-5 w-5 text-muted-foreground group-hover:text-foreground transition-colors" />
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 text-muted-foreground">
              <CalendarDays className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p className="font-medium">Ingen AMU-møter</p>
              <p className="text-sm">Opprett ditt første AMU-møte for å komme i gang</p>
              <Button onClick={() => setCreateModalOpen(true)} className="mt-4">
                <Plus className="mr-2 h-4 w-4" />
                Opprett første møte
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      <CreateAMUMeetingModal open={createModalOpen} onOpenChange={setCreateModalOpen} />
    </>
  );
}
