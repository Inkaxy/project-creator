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
    className: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
  },
  info_pending: {
    label: "Venter på info",
    variant: "secondary",
    icon: FileText,
    className: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400",
  },
  account_pending: {
    label: "Venter på konto",
    variant: "secondary",
    icon: User,
    className: "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400",
  },
  contract_pending: {
    label: "Venter på kontrakt",
    variant: "secondary",
    icon: FileSignature,
    className: "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400",
  },
  signature_pending: {
    label: "Venter på signatur",
    variant: "secondary",
    icon: Clock,
    className: "bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-400",
  },
  completed: {
    label: "Fullført",
    variant: "default",
    icon: CheckCircle,
    className: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
  },
  cancelled: {
    label: "Avbrutt",
    variant: "destructive",
    icon: XCircle,
    className: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
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
