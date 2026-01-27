import { format } from 'date-fns';
import { nb } from 'date-fns/locale';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { 
  Calendar, 
  Clock, 
  MapPin, 
  Video, 
  Phone,
  Star,
  ChevronRight
} from 'lucide-react';
import type { Conversation, ConversationStatus } from '@/types/conversations';

interface ConversationCardProps {
  conversation: Conversation;
  onClick?: () => void;
}

const statusLabels: Record<ConversationStatus, string> = {
  draft: 'Utkast',
  scheduled: 'Planlagt',
  confirmed: 'Bekreftet',
  in_progress: 'Pågår',
  completed: 'Fullført',
  cancelled: 'Kansellert',
};

const statusColors: Record<ConversationStatus, string> = {
  draft: 'bg-muted text-muted-foreground',
  scheduled: 'bg-blue-500/10 text-blue-500',
  confirmed: 'bg-green-500/10 text-green-500',
  in_progress: 'bg-yellow-500/10 text-yellow-500',
  completed: 'bg-green-500/10 text-green-500',
  cancelled: 'bg-red-500/10 text-red-500',
};

const locationIcons = {
  in_person: MapPin,
  video: Video,
  phone: Phone,
};

export function ConversationCard({ conversation, onClick }: ConversationCardProps) {
  const LocationIcon = locationIcons[conversation.location_type] || MapPin;
  
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <Card 
      className="cursor-pointer transition-all hover:shadow-md hover:border-primary/20"
      onClick={onClick}
    >
      <CardContent className="flex items-center gap-4 py-4">
        <Avatar className="h-12 w-12">
          <AvatarImage src={conversation.employee?.avatar_url || undefined} />
          <AvatarFallback>
            {conversation.employee?.full_name ? getInitials(conversation.employee.full_name) : '??'}
          </AvatarFallback>
        </Avatar>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="font-medium truncate">
              {conversation.employee?.full_name || 'Ukjent ansatt'}
            </h3>
            <Badge className={statusColors[conversation.status]}>
              {statusLabels[conversation.status]}
            </Badge>
          </div>
          
          <div className="mt-1 flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
            <div className="flex items-center gap-1">
              <Calendar className="h-4 w-4" />
              <span>
                {format(new Date(conversation.scheduled_date), 'PPP', { locale: nb })}
              </span>
            </div>
            
            {conversation.scheduled_time && (
              <div className="flex items-center gap-1">
                <Clock className="h-4 w-4" />
                <span>{conversation.scheduled_time.slice(0, 5)}</span>
              </div>
            )}
            
            <div className="flex items-center gap-1">
              <LocationIcon className="h-4 w-4" />
              <span>
                {conversation.location_type === 'in_person' ? 'Fysisk' : 
                 conversation.location_type === 'video' ? 'Video' : 'Telefon'}
              </span>
            </div>

            {conversation.status === 'completed' && conversation.overall_rating && (
              <div className="flex items-center gap-1">
                <Star className="h-4 w-4 fill-yellow-500 text-yellow-500" />
                <span>{conversation.overall_rating}/5</span>
              </div>
            )}
          </div>
        </div>

        <ChevronRight className="h-5 w-5 text-muted-foreground" />
      </CardContent>
    </Card>
  );
}
