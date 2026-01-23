import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { 
  CheckCircle2, 
  Circle, 
  Mail, 
  FileText, 
  User, 
  FileSignature 
} from "lucide-react";
import { format } from "date-fns";
import { nb } from "date-fns/locale";
import { OnboardingStatusBadge } from "./OnboardingStatusBadge";
import { GenerateContractModal } from "@/components/contracts/GenerateContractModal";
import type { EmployeeOnboarding } from "@/hooks/useOnboardings";

interface OnboardingDetailModalProps {
  onboarding: EmployeeOnboarding;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface TimelineStep {
  title: string;
  description: string;
  completed: boolean;
  timestamp?: string | null;
  icon: typeof Mail;
}

export function OnboardingDetailModal({ onboarding, open, onOpenChange }: OnboardingDetailModalProps) {
  const [showContractModal, setShowContractModal] = useState(false);

  const canGenerateContract = ['info_pending', 'account_pending', 'contract_pending'].includes(onboarding.status);
  const hasContract = !!onboarding.contract_generated_at;

  const steps: TimelineStep[] = [
    {
      title: "Invitasjon sendt",
      description: "E-post sendt til den ansatte",
      completed: !!onboarding.invitation_sent_at,
      timestamp: onboarding.invitation_sent_at,
      icon: Mail,
    },
    {
      title: "Personopplysninger utfylt",
      description: "Ansatt har registrert sine opplysninger",
      completed: !!onboarding.info_completed_at,
      timestamp: onboarding.info_completed_at,
      icon: FileText,
    },
    {
      title: "Konto opprettet",
      description: "Ansatt har aktivert sin brukerkonto",
      completed: !!onboarding.account_created_at,
      timestamp: onboarding.account_created_at,
      icon: User,
    },
    {
      title: "Kontrakt generert",
      description: "Arbeidsavtale er opprettet",
      completed: !!onboarding.contract_generated_at,
      timestamp: onboarding.contract_generated_at,
      icon: FileSignature,
    },
    {
      title: "Kontrakt signert",
      description: "Ansatt har signert arbeidsavtalen",
      completed: !!onboarding.contract_signed_at,
      timestamp: onboarding.contract_signed_at,
      icon: CheckCircle2,
    },
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            {onboarding.full_name}
            <OnboardingStatusBadge status={onboarding.status} />
          </DialogTitle>
        </DialogHeader>

        <div className="grid gap-6 md:grid-cols-2">
          {/* Basic Info */}
          <div className="space-y-4">
            <h3 className="text-sm font-medium text-muted-foreground">Grunnleggende info</h3>
            <div className="space-y-3">
              <div>
                <p className="text-xs text-muted-foreground">E-post</p>
                <p className="font-medium">{onboarding.email}</p>
              </div>
              {onboarding.phone && (
                <div>
                  <p className="text-xs text-muted-foreground">Telefon</p>
                  <p className="font-medium">{onboarding.phone}</p>
                </div>
              )}
              <div>
                <p className="text-xs text-muted-foreground">Avdeling</p>
                <p className="font-medium">{onboarding.departments?.name || "-"}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Funksjon</p>
                <p className="font-medium">{onboarding.functions?.name || "-"}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Startdato</p>
                <p className="font-medium">
                  {onboarding.start_date 
                    ? format(new Date(onboarding.start_date), "d. MMMM yyyy", { locale: nb })
                    : "-"
                  }
                </p>
              </div>
            </div>

            {/* Personal info if filled */}
            {onboarding.info_completed_at && (
              <>
                <Separator />
                <h3 className="text-sm font-medium text-muted-foreground">Personopplysninger</h3>
                <div className="space-y-3">
                  {onboarding.date_of_birth && (
                    <div>
                      <p className="text-xs text-muted-foreground">Fødselsdato</p>
                      <p className="font-medium">
                        {format(new Date(onboarding.date_of_birth), "d. MMMM yyyy", { locale: nb })}
                      </p>
                    </div>
                  )}
                  {onboarding.address && (
                    <div>
                      <p className="text-xs text-muted-foreground">Adresse</p>
                      <p className="font-medium">
                        {onboarding.address}
                        {onboarding.postal_code && `, ${onboarding.postal_code}`}
                        {onboarding.city && ` ${onboarding.city}`}
                      </p>
                    </div>
                  )}
                  {onboarding.emergency_contact_name && (
                    <div>
                      <p className="text-xs text-muted-foreground">Nødkontakt</p>
                      <p className="font-medium">
                        {onboarding.emergency_contact_name}
                        {onboarding.emergency_contact_relation && ` (${onboarding.emergency_contact_relation})`}
                      </p>
                      {onboarding.emergency_contact_phone && (
                        <p className="text-sm text-muted-foreground">{onboarding.emergency_contact_phone}</p>
                      )}
                    </div>
                  )}
                </div>
              </>
            )}
          </div>

          {/* Timeline */}
          <div className="space-y-4">
            <h3 className="text-sm font-medium text-muted-foreground">Fremdrift</h3>
            <div className="space-y-4">
              {steps.map((step, index) => {
                const Icon = step.icon;
                return (
                  <div key={index} className="flex gap-3">
                    <div className="flex flex-col items-center">
                      <div className={`flex h-8 w-8 items-center justify-center rounded-full ${
                        step.completed 
                          ? "bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400" 
                          : "bg-muted text-muted-foreground"
                      }`}>
                        {step.completed ? (
                          <CheckCircle2 className="h-4 w-4" />
                        ) : (
                          <Circle className="h-4 w-4" />
                        )}
                      </div>
                      {index < steps.length - 1 && (
                        <div className={`h-full w-0.5 ${
                          step.completed ? "bg-green-200 dark:bg-green-900/50" : "bg-muted"
                        }`} />
                      )}
                    </div>
                    <div className="flex-1 pb-4">
                      <p className={`font-medium ${
                        step.completed ? "text-foreground" : "text-muted-foreground"
                      }`}>
                        {step.title}
                      </p>
                      <p className="text-sm text-muted-foreground">{step.description}</p>
                      {step.timestamp && (
                        <p className="mt-1 text-xs text-muted-foreground">
                          {format(new Date(step.timestamp), "d. MMM yyyy 'kl.' HH:mm", { locale: nb })}
                        </p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Notes */}
        {onboarding.notes && (
          <>
            <Separator />
            <div>
              <h3 className="text-sm font-medium text-muted-foreground mb-2">Interne notater</h3>
              <p className="text-sm">{onboarding.notes}</p>
            </div>
          </>
        )}

        {/* Footer with actions */}
        {canGenerateContract && !hasContract && (
          <DialogFooter className="mt-4">
            <Button onClick={() => setShowContractModal(true)}>
              <FileSignature className="mr-2 h-4 w-4" />
              Generer kontrakt
            </Button>
          </DialogFooter>
        )}

        {hasContract && (
          <DialogFooter className="mt-4">
            <Badge variant="outline" className="text-success border-success">
              <CheckCircle2 className="mr-1 h-3 w-3" />
              Kontrakt generert
            </Badge>
          </DialogFooter>
        )}
      </DialogContent>

      <GenerateContractModal
        onboarding={onboarding}
        open={showContractModal}
        onOpenChange={setShowContractModal}
      />
    </Dialog>
  );
}
