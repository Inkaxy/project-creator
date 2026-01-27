import { format } from 'date-fns';
import { nb } from 'date-fns/locale';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { 
  Users, 
  Calendar, 
  Clock, 
  MapPin, 
  Video, 
  Phone,
  MessageSquare,
  Bell,
  Mail,
  Eye
} from 'lucide-react';
import { useEmployees } from '@/hooks/useEmployees';
import type { LocationType, NotificationSettings, SelectedQuestion } from '@/types/conversations';

interface ConversationSummaryProps {
  selectedEmployees: string[];
  scheduledDate: Date | undefined;
  scheduledTime: string;
  duration: number;
  locationType: LocationType;
  location: string;
  selectedQuestions: SelectedQuestion[];
  notificationSettings: NotificationSettings;
  allowPreparation: boolean;
}

export function ConversationSummary({
  selectedEmployees,
  scheduledDate,
  scheduledTime,
  duration,
  locationType,
  location,
  selectedQuestions,
  notificationSettings,
  allowPreparation,
}: ConversationSummaryProps) {
  const { data: employees } = useEmployees();
  
  const selectedEmployeeData = employees?.filter(e => selectedEmployees.includes(e.id)) || [];

  const LocationIcon = locationType === 'video' ? Video : locationType === 'phone' ? Phone : MapPin;

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const getDurationLabel = () => {
    if (duration === 30) return '30 minutter';
    if (duration === 45) return '45 minutter';
    if (duration === 60) return '1 time';
    if (duration === 90) return '1,5 time';
    return `${duration} minutter`;
  };

  return (
    <div className="space-y-6">
      {/* Employees */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <Users className="h-4 w-4" />
            Ansatte ({selectedEmployeeData.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-3">
            {selectedEmployeeData.map(employee => (
              <div key={employee.id} className="flex items-center gap-2 rounded-full bg-muted px-3 py-1">
                <Avatar className="h-6 w-6">
                  <AvatarImage src={employee.avatar_url || undefined} />
                  <AvatarFallback className="text-xs">
                    {employee.full_name ? getInitials(employee.full_name) : '??'}
                  </AvatarFallback>
                </Avatar>
                <span className="text-sm">{employee.full_name}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Schedule */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <Calendar className="h-4 w-4" />
            Tidspunkt og sted
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm">
                {scheduledDate ? format(scheduledDate, 'PPP', { locale: nb }) : 'Ikke valgt'}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm">{scheduledTime} ({getDurationLabel()})</span>
            </div>
            <div className="flex items-center gap-2">
              <LocationIcon className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm">
                {locationType === 'in_person' ? 'Fysisk møte' :
                 locationType === 'video' ? 'Videomøte' : 'Telefon'}
                {location && ` - ${location}`}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Questions */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <MessageSquare className="h-4 w-4" />
            Spørsmål ({selectedQuestions.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ol className="space-y-2">
            {selectedQuestions.slice(0, 5).map((sq, index) => (
              <li key={sq.id} className="flex items-start gap-2 text-sm">
                <span className="flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-medium text-primary">
                  {index + 1}
                </span>
                <span>{sq.question.question_text}</span>
              </li>
            ))}
            {selectedQuestions.length > 5 && (
              <li className="text-sm text-muted-foreground">
                ...og {selectedQuestions.length - 5} flere spørsmål
              </li>
            )}
          </ol>
        </CardContent>
      </Card>

      {/* Notifications */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <Bell className="h-4 w-4" />
            Varsling
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {notificationSettings.email && (
              <Badge variant="secondary" className="gap-1">
                <Mail className="h-3 w-3" /> E-post
              </Badge>
            )}
            {notificationSettings.push && (
              <Badge variant="secondary" className="gap-1">
                <Bell className="h-3 w-3" /> Push
              </Badge>
            )}
            {notificationSettings.sms && (
              <Badge variant="secondary" className="gap-1">
                <MessageSquare className="h-3 w-3" /> SMS
              </Badge>
            )}
            {allowPreparation && (
              <Badge variant="outline" className="gap-1">
                <Eye className="h-3 w-3" /> Forberedelse aktivert
              </Badge>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
