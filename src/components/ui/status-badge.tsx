import { cn } from "@/lib/utils";

type Status = "active" | "inactive" | "pending" | "warning" | "error";

interface StatusBadgeProps {
  status: Status;
  label?: string;
  className?: string;
}

const statusConfig: Record<
  Status,
  { bg: string; text: string; dot: string; border: string; defaultLabel: string }
> = {
  active: {
    bg: "bg-success-light",
    text: "text-success-text",
    dot: "bg-success",
    border: "border-success-border",
    defaultLabel: "Klar for arbeid",
  },
  inactive: {
    bg: "bg-muted",
    text: "text-muted-foreground",
    dot: "bg-muted-foreground",
    border: "border-border",
    defaultLabel: "Inaktiv",
  },
  pending: {
    bg: "bg-warning-light",
    text: "text-warning-text",
    dot: "bg-warning",
    border: "border-warning-border",
    defaultLabel: "Venter",
  },
  warning: {
    bg: "bg-warning-light",
    text: "text-warning-text",
    dot: "bg-warning",
    border: "border-warning-border",
    defaultLabel: "Mangler info",
  },
  error: {
    bg: "bg-destructive-light",
    text: "text-destructive-text",
    dot: "bg-destructive",
    border: "border-destructive-border",
    defaultLabel: "Feil",
  },
};

export function StatusBadge({ status, label, className }: StatusBadgeProps) {
  const config = statusConfig[status];

  return (
    <div
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5",
        config.bg,
        config.border,
        className
      )}
    >
      <span className={cn("h-1.5 w-1.5 rounded-full", config.dot)} />
      <span className={cn("text-[0.71875rem] font-medium", config.text)}>
        {label || config.defaultLabel}
      </span>
    </div>
  );
}
