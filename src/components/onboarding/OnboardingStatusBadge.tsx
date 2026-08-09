import { Badge } from "@/components/ui/badge";
import { 
  Mail, 
  FileText, 
  User, 
  FileSignature, 
  CheckCircle, 
  XCircle,
  Clock
} from "lucide-react";

interface OnboardingStatusBadgeProps {
  status: string;
  showIcon?: boolean;
}

const statusConfig: Record<string, { 
  label: string; 
  variant: "default" | "secondary" | "destructive" | "outline";
  icon: typeof Mail;
  className: string;
}> = {
  invited: {
    label: "Invitert",
    variant: "secondary",
    icon: Mail,
    className: "bg-info-light text-info-text border border-info-border",
  },
  info_pending: {
    label: "Venter på info",
    variant: "secondary",
    icon: FileText,
    className: "bg-warning-light text-warning-text border border-warning-border",
  },
  account_pending: {
    label: "Venter på konto",
    variant: "secondary",
    icon: User,
    className: "bg-warning-light text-warning-text border border-warning-border",
  },
  contract_pending: {
    label: "Venter på kontrakt",
    variant: "secondary",
    icon: FileSignature,
    className: "bg-ai-light text-ai border border-ai-border",
  },
  signature_pending: {
    label: "Venter på signatur",
    variant: "secondary",
    icon: Clock,
    className: "bg-info-light text-info-text border border-info-border",
  },
  completed: {
    label: "Fullført",
    variant: "default",
    icon: CheckCircle,
    className: "bg-success-light text-success-text border border-success-border",
  },
  cancelled: {
    label: "Avbrutt",
    variant: "destructive",
    icon: XCircle,
    className: "bg-destructive-light text-destructive-text border border-destructive-border",
  },
};

export function OnboardingStatusBadge({ status, showIcon = true }: OnboardingStatusBadgeProps) {
  const config = statusConfig[status] || statusConfig.invited;
  const Icon = config.icon;

  return (
    <Badge variant={config.variant} className={config.className}>
      {showIcon && <Icon className="mr-1 h-3 w-3" />}
      {config.label}
    </Badge>
  );
}
