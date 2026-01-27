import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { MainLayout } from "@/components/layout/MainLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  ChevronLeft, 
  ChevronRight, 
  Check, 
  FileText, 
  Users, 
  ListChecks, 
  MessageSquare, 
  CheckCircle,
  ArrowLeft
} from "lucide-react";
import { useAMUMeeting, useApplyAgendaTemplate } from "@/hooks/useAMU";
import { MeetingWizardStep1 } from "@/components/amu/wizard/MeetingWizardStep1";
import { MeetingWizardStep2 } from "@/components/amu/wizard/MeetingWizardStep2";
import { MeetingWizardStep3 } from "@/components/amu/wizard/MeetingWizardStep3";
import { MeetingWizardStep4 } from "@/components/amu/wizard/MeetingWizardStep4";
import { MeetingWizardStep5 } from "@/components/amu/wizard/MeetingWizardStep5";
import { cn } from "@/lib/utils";
import { format } from "date-fns";

const STEPS = [
  { id: "general", label: "Generelt", icon: FileText },
  { id: "participants", label: "Deltakere", icon: Users },
  { id: "agenda", label: "Dagsorden", icon: ListChecks },
  { id: "notes", label: "Notater", icon: MessageSquare },
  { id: "summary", label: "Oppsummering", icon: CheckCircle },
] as const;

export default function AMUMeetingWizardPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: meeting, isLoading, refetch } = useAMUMeeting(id);
  const applyTemplate = useApplyAgendaTemplate();

  const [currentStep, setCurrentStep] = useState(0);
  const [autoSaveTime, setAutoSaveTime] = useState<string | null>(null);

  // Apply template if specified and no agenda items yet
  useEffect(() => {
    if (meeting?.template_id && meeting.agenda_items?.length === 0) {
      applyTemplate.mutate({
        meeting_id: meeting.id,
        template_id: meeting.template_id,
      });
    }
  }, [meeting?.id, meeting?.template_id, meeting?.agenda_items?.length]);

  // Auto-save indicator
  useEffect(() => {
    const timer = setInterval(() => {
      setAutoSaveTime(format(new Date(), "HH:mm"));
    }, 30000);
    return () => clearInterval(timer);
  }, []);

  if (isLoading) {
    return (
      <MainLayout>
        <div className="space-y-6">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-96 w-full" />
        </div>
      </MainLayout>
    );
  }

  if (!meeting) {
    return (
      <MainLayout>
        <div className="text-center py-12">
          <p className="text-muted-foreground">Møtet ble ikke funnet</p>
          <Button onClick={() => navigate("/amu")} className="mt-4">
            Tilbake til AMU
          </Button>
        </div>
      </MainLayout>
    );
  }

  const canGoNext = currentStep < STEPS.length - 1;
  const canGoPrev = currentStep > 0;

  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate("/amu")}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold">{meeting.title}</h1>
            <p className="text-sm text-muted-foreground">
              AMU &gt; Møter &gt; {meeting.title}
            </p>
          </div>
        </div>

        {/* Progress Steps */}
        <Card>
          <CardContent className="py-6">
            <div className="flex items-center justify-between">
              {STEPS.map((step, index) => (
                <div key={step.id} className="flex items-center">
                  <button
                    onClick={() => setCurrentStep(index)}
                    className={cn(
                      "flex items-center gap-2 transition-colors",
                      index <= currentStep ? "text-foreground" : "text-muted-foreground"
                    )}
                  >
                    <div
                      className={cn(
                        "flex items-center justify-center w-8 h-8 rounded-full text-sm font-medium transition-colors",
                        index < currentStep && "bg-primary text-primary-foreground",
                        index === currentStep && "border-2 border-primary text-primary",
                        index > currentStep && "border-2 border-muted text-muted-foreground"
                      )}
                    >
                      {index < currentStep ? (
                        <Check className="h-4 w-4" />
                      ) : (
                        <span>{index + 1}</span>
                      )}
                    </div>
                    <span className="hidden sm:inline text-sm font-medium">
                      {step.label}
                    </span>
                  </button>
                  {index < STEPS.length - 1 && (
                    <div
                      className={cn(
                        "w-8 sm:w-16 h-0.5 mx-2 sm:mx-4 transition-colors",
                        index < currentStep ? "bg-primary" : "bg-muted"
                      )}
                    />
                  )}
                </div>
              ))}

              {/* Auto-save indicator */}
              {autoSaveTime && (
                <div className="hidden md:flex items-center gap-2 text-sm text-primary ml-4">
                  <Check className="h-4 w-4" />
                  <span>Automatisk lagret kl. {autoSaveTime}</span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Step Content */}
        <Card>
          <CardContent className="py-6">
            {currentStep === 0 && (
              <MeetingWizardStep1 meeting={meeting} onUpdate={refetch} />
            )}
            {currentStep === 1 && (
              <MeetingWizardStep2 meeting={meeting} onUpdate={refetch} />
            )}
            {currentStep === 2 && (
              <MeetingWizardStep3 meeting={meeting} onUpdate={refetch} />
            )}
            {currentStep === 3 && (
              <MeetingWizardStep4 meeting={meeting} onUpdate={refetch} />
            )}
            {currentStep === 4 && (
              <MeetingWizardStep5 meeting={meeting} onUpdate={refetch} />
            )}
          </CardContent>
        </Card>

        {/* Navigation */}
        <div className="flex items-center justify-between">
          <Button
            variant="ghost"
            onClick={() => setCurrentStep((prev) => prev - 1)}
            disabled={!canGoPrev}
          >
            <ChevronLeft className="mr-2 h-4 w-4" />
            Tilbake
          </Button>

          <span className="text-sm text-muted-foreground">
            {currentStep + 1} / {STEPS.length}
          </span>

          <Button
            variant="ghost"
            onClick={() => setCurrentStep((prev) => prev + 1)}
            disabled={!canGoNext}
          >
            Neste
            <ChevronRight className="ml-2 h-4 w-4" />
          </Button>
        </div>
      </div>
    </MainLayout>
  );
}
