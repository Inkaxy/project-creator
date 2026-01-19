import { CalendarEvent, EVENT_TYPE_CONFIG } from "@/hooks/useCalendarEvents";
import { format, parseISO } from "date-fns";
import { nb } from "date-fns/locale";
import { Clock, UserX, Flame, Shield, ClipboardCheck, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";

const iconMap = {
  shift: Clock,
  absence: UserX,
  fire_drill: Flame,
  safety_round: Shield,
  inspection: ClipboardCheck,
};

interface CalendarDayDetailProps {
  date: string;
  events: CalendarEvent[];
  onClose: () => void;
}

export function CalendarDayDetail({ date, events, onClose }: CalendarDayDetailProps) {
  const formattedDate = format(parseISO(date), "EEEE d. MMMM yyyy", { locale: nb });

  // Group events by type
  const groupedEvents = events.reduce((acc, event) => {
    if (!acc[event.type]) {
      acc[event.type] = [];
    }
    acc[event.type].push(event);
    return acc;
  }, {} as Record<string, CalendarEvent[]>);

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-border">
        <div>
          <h3 className="font-semibold text-lg capitalize">{formattedDate}</h3>
          <p className="text-sm text-muted-foreground">
            {events.length} {events.length === 1 ? 'hendelse' : 'hendelser'}
          </p>
        </div>
        <Button variant="ghost" size="icon" onClick={onClose}>
          <X className="h-4 w-4" />
        </Button>
      </div>

      {/* Content */}
      <ScrollArea className="flex-1 p-4">
        {events.length === 0 ? (
          <p className="text-muted-foreground text-center py-8">
            Ingen hendelser denne dagen
          </p>
        ) : (
          <div className="space-y-6">
            {Object.entries(groupedEvents).map(([type, typeEvents]) => {
              const config = EVENT_TYPE_CONFIG[type as keyof typeof EVENT_TYPE_CONFIG];
              const Icon = iconMap[type as keyof typeof iconMap];

              return (
                <div key={type}>
                  <div className="flex items-center gap-2 mb-3">
                    <div
                      className="p-1.5 rounded"
                      style={{ backgroundColor: config.bgColor }}
                    >
                      <Icon className="h-4 w-4" style={{ color: config.color }} />
                    </div>
                    <h4 className="font-medium">{config.label}</h4>
                    <Badge variant="secondary" className="text-xs">
                      {typeEvents.length}
                    </Badge>
                  </div>

                  <div className="space-y-2 ml-9">
                    {typeEvents.map((event) => (
                      <EventCard key={event.id} event={event} />
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </ScrollArea>
    </div>
  );
}

function EventCard({ event }: { event: CalendarEvent }) {
  return (
    <div
      className="p-3 rounded-lg border border-border bg-card hover:bg-accent/50 transition-colors"
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <p className="font-medium truncate">{event.title}</p>
          {event.subtitle && (
            <p className="text-sm text-muted-foreground truncate">{event.subtitle}</p>
          )}
        </div>
        {event.startTime && event.endTime && (
          <div className="text-xs text-muted-foreground whitespace-nowrap">
            {event.startTime.slice(0, 5)} - {event.endTime.slice(0, 5)}
          </div>
        )}
      </div>
      {event.status && (
        <Badge
          variant="outline"
          className="mt-2 text-xs"
          style={{
            borderColor: event.color,
            color: event.color,
          }}
        >
          {event.status === 'completed' ? 'Fullført' : 
           event.status === 'planned' ? 'Planlagt' : 
           event.status === 'open' ? 'Ledig' : event.status}
        </Badge>
      )}
    </div>
  );
}
