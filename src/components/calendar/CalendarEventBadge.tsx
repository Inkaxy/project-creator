import { CalendarEvent, CalendarEventType, EVENT_TYPE_CONFIG } from "@/hooks/useCalendarEvents";
import { cn } from "@/lib/utils";
import { Clock, UserX, Flame, Shield, ClipboardCheck, Cake } from "lucide-react";

interface CalendarEventBadgeProps {
  event: CalendarEvent;
  compact?: boolean;
  onClick?: () => void;
}

const iconMap: Record<CalendarEventType, typeof Clock> = {
  shift: Clock,
  absence: UserX,
  fire_drill: Flame,
  safety_round: Shield,
  inspection: ClipboardCheck,
  birthday: Cake,
};

export function CalendarEventBadge({ event, compact = false, onClick }: CalendarEventBadgeProps) {
  const Icon = iconMap[event.type];

  if (compact) {
    return (
      <div
        onClick={onClick}
        className={cn(
          "w-2 h-2 rounded-full cursor-pointer",
          onClick && "hover:ring-2 hover:ring-offset-1"
        )}
        style={{ backgroundColor: event.color }}
        title={event.title}
      />
    );
  }

  return (
    <div
      onClick={onClick}
      className={cn(
        "flex items-center gap-1.5 rounded px-1.5 py-0.5 text-xs truncate cursor-pointer transition-opacity",
        onClick && "hover:opacity-80"
      )}
      style={{
        backgroundColor: event.bgColor,
        color: event.color,
      }}
    >
      <Icon className="h-3 w-3 flex-shrink-0" />
      <span className="truncate font-medium">{event.title}</span>
    </div>
  );
}

interface EventTypeLegendProps {
  types?: CalendarEventType[];
  activeTypes?: CalendarEventType[];
  onToggle?: (type: CalendarEventType) => void;
}

export function EventTypeLegend({ types, activeTypes, onToggle }: EventTypeLegendProps) {
  const displayTypes = types || (Object.keys(EVENT_TYPE_CONFIG) as CalendarEventType[]);

  return (
    <div className="flex flex-wrap gap-3">
      {displayTypes.map((type) => {
        const config = EVENT_TYPE_CONFIG[type];
        const Icon = iconMap[type];
        const isActive = !activeTypes || activeTypes.includes(type);

        return (
          <button
            key={type}
            onClick={() => onToggle?.(type)}
            className={cn(
              "flex items-center gap-2 text-sm transition-opacity",
              onToggle && "cursor-pointer hover:opacity-80",
              !isActive && "opacity-40"
            )}
          >
            <div
              className="h-3 w-3 rounded flex items-center justify-center"
              style={{ backgroundColor: config.bgColor }}
            >
              <Icon className="h-2 w-2" style={{ color: config.color }} />
            </div>
            <span className="text-muted-foreground">{config.label}</span>
          </button>
        );
      })}
    </div>
  );
}
