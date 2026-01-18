import { cn } from "@/lib/utils";

type Status = "active" | "inactive" | "pending" | "warning" | "error";

interface StatusBadgeProps {
  status: Status;
  label?: string;
  className?: string;
}

const statusConfig: Record<Status, { bg: string; text: string; dot: string; defaultLabel: string }> = {
  active: {
    bg: "bg-success-light",
    text: "text-success",
    dot: "bg-success",
    defaultLabel: "Klar for arbeid",
  },
  inactive: {
    bg: "bg-muted",
    text: "text-muted-foreground",
    dot: "bg-muted-foreground",
    defaultLabel: "Inaktiv",
  },
  pending: {
    bg: "bg-warning-light",
    text: "text-warning",
    dot: "bg-warning",
    defaultLabel: "Venter",
  },
  warning: {
    bg: "bg-warning-light",
    text: "text-warning",
    dot: "bg-warning",
    defaultLabel: "Mangler info",
  },
  error: {
    bg: "bg-destructive-light",
    text: "text-destructive",
    dot: "bg-destructive",
    defaultLabel: "Feil",
  },
};

export function StatusBadge({ status, label, className }: StatusBadgeProps) {
  const config = statusConfig[status];

  return (
    <div
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1",
        config.bg,
        className
      )}
    >
      <span className={cn("h-1.5 w-1.5 rounded-full", config.dot)} />
      <span className={cn("text-xs font-medium", config.text)}>
        {label || config.defaultLabel}
      </span>
    </div>
  );
}
