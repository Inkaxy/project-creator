import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { MainLayout } from '@/components/layout/MainLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { ArrowLeft, ArrowRight, Check, Users, Calendar, MessageSquare, Bell, Eye } from 'lucide-react';
import { useCreateConversation } from '@/hooks/useConversations';
import { EmployeeSelector } from '@/components/conversations/EmployeeSelector';
import { ScheduleStep } from '@/components/conversations/ScheduleStep';
import { QuestionSelector } from '@/components/conversations/QuestionSelector';
import { NotificationSettings } from '@/components/conversations/NotificationSettings';
import { ConversationSummary } from '@/components/conversations/ConversationSummary';
import type { LocationType, NotificationSettings as NotificationSettingsType, SelectedQuestion } from '@/types/conversations';

const steps = [
  { id: 1, title: 'Velg ansatt', icon: Users },
  { id: 2, title: 'Tidspunkt', icon: Calendar },
  { id: 3, title: 'Spørsmål', icon: MessageSquare },
  { id: 4, title: 'Varsling', icon: Bell },
  { id: 5, title: 'Oppsummering', icon: Eye },
];

export default function ConversationNewPage() {
  const navigate = useNavigate();
  const createConversation = useCreateConversation();
  const [currentStep, setCurrentStep] = useState(1);

  // Form state
  const [selectedEmployees, setSelectedEmployees] = useState<string[]>([]);
  const [scheduledDate, setScheduledDate] = useState<Date | undefined>();
  const [scheduledTime, setScheduledTime] = useState('09:00');
  const [duration, setDuration] = useState(60);
  const [locationType, setLocationType] = useState<LocationType>('in_person');
  const [location, setLocation] = useState('');
  const [selectedQuestions, setSelectedQuestions] = useState<SelectedQuestion[]>([]);
  const [notificationSettings, setNotificationSettings] = useState<NotificationSettingsType>({
    email: true,
    sms: false,
    push: true,
  });
  const [allowPreparation, setAllowPreparation] = useState(true);
  const [sendReminder, setSendReminder] = useState(true);

  const canProceed = () => {
    switch (currentStep) {
      case 1: return selectedEmployees.length > 0;
      case 2: return !!scheduledDate;
      case 3: return selectedQuestions.length > 0;
      case 4: return true;
      case 5: return true;
      default: return false;
    }
  };

  const handleNext = () => {
    if (currentStep < 5) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    } else {
      navigate('/samtaler');
    }
  };

  const handleSubmit = async () => {
    if (!scheduledDate) return;

    await createConversation.mutateAsync({
      employee_ids: selectedEmployees,
      scheduled_date: scheduledDate.toISOString().split('T')[0],
      scheduled_time: scheduledTime,
      duration_minutes: duration,
      location_type: locationType,
      location: location || undefined,
      question_ids: selectedQuestions.map(q => q.id),
      notification_settings: notificationSettings,
      allow_employee_preparation: allowPreparation,
    });

    navigate('/samtaler');
  };

  const progress = (currentStep / steps.length) * 100;

  return (
    <MainLayout>
      <div className="mx-auto max-w-3xl space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={handleBack}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold">Planlegg samtale</h1>
            <p className="text-muted-foreground">
              Steg {currentStep} av {steps.length}: {steps[currentStep - 1].title}
            </p>
          </div>
        </div>

        {/* Progress */}
        <div className="space-y-4">
          <Progress value={progress} className="h-2" />
          <div className="flex justify-between">
            {steps.map((step) => {
              const Icon = step.icon;
              const isActive = currentStep === step.id;
              const isCompleted = currentStep > step.id;
              
              return (
                <div 
                  key={step.id}
                  className={`flex flex-col items-center gap-1 ${
                    isActive ? 'text-primary' : isCompleted ? 'text-green-500' : 'text-muted-foreground'
                  }`}
                >
                  <div className={`flex h-8 w-8 items-center justify-center rounded-full border-2 ${
                    isActive ? 'border-primary bg-primary text-primary-foreground' : 
                    isCompleted ? 'border-green-500 bg-green-500 text-white' : 
                    'border-muted-foreground/30'
                  }`}>
                    {isCompleted ? <Check className="h-4 w-4" /> : <Icon className="h-4 w-4" />}
                  </div>
                  <span className="hidden text-xs sm:block">{step.title}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Step Content */}
        <Card>
          <CardHeader>
            <CardTitle>{steps[currentStep - 1].title}</CardTitle>
            <CardDescription>
              {currentStep === 1 && 'Velg én eller flere ansatte å ha samtale med'}
              {currentStep === 2 && 'Velg dato, tid og sted for samtalen'}
              {currentStep === 3 && 'Velg spørsmål fra spørsmålsbanken eller bruk en mal'}
              {currentStep === 4 && 'Konfigurer varsling og forberedelse'}
              {currentStep === 5 && 'Se over og bekreft samtalen'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {currentStep === 1 && (
              <EmployeeSelector
                selectedEmployees={selectedEmployees}
                onSelectionChange={setSelectedEmployees}
              />
            )}

            {currentStep === 2 && (
              <ScheduleStep
                scheduledDate={scheduledDate}
                onDateChange={setScheduledDate}
                scheduledTime={scheduledTime}
                onTimeChange={setScheduledTime}
                duration={duration}
                onDurationChange={setDuration}
                locationType={locationType}
                onLocationTypeChange={setLocationType}
                location={location}
                onLocationChange={setLocation}
              />
            )}

            {currentStep === 3 && (
              <QuestionSelector
                selectedQuestions={selectedQuestions}
                onQuestionsChange={setSelectedQuestions}
              />
            )}

            {currentStep === 4 && (
              <NotificationSettings
                settings={notificationSettings}
                onSettingsChange={setNotificationSettings}
                allowPreparation={allowPreparation}
                onAllowPreparationChange={setAllowPreparation}
                sendReminder={sendReminder}
                onSendReminderChange={setSendReminder}
              />
            )}

            {currentStep === 5 && (
              <ConversationSummary
                selectedEmployees={selectedEmployees}
                scheduledDate={scheduledDate}
                scheduledTime={scheduledTime}
                duration={duration}
                locationType={locationType}
                location={location}
                selectedQuestions={selectedQuestions}
                notificationSettings={notificationSettings}
                allowPreparation={allowPreparation}
              />
            )}
          </CardContent>
        </Card>

        {/* Navigation */}
        <div className="flex justify-between">
          <Button variant="outline" onClick={handleBack}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            {currentStep === 1 ? 'Avbryt' : 'Tilbake'}
          </Button>

          {currentStep < 5 ? (
            <Button onClick={handleNext} disabled={!canProceed()}>
              Neste
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          ) : (
            <Button 
              onClick={handleSubmit} 
              disabled={createConversation.isPending}
            >
              {createConversation.isPending ? 'Sender...' : 'Send invitasjon'}
              <Check className="ml-2 h-4 w-4" />
            </Button>
          )}
        </div>
      </div>
    </MainLayout>
  );
}
