import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { MainLayout } from '@/components/layout/MainLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';
import { 
  ArrowLeft, 
  Calendar, 
  Clock, 
  MapPin, 
  Video, 
  Phone,
  Star,
  Play,
  X,
  Edit,
  Plus,
  CheckCircle,
  ListTodo
} from 'lucide-react';
import { format } from 'date-fns';
import { nb } from 'date-fns/locale';
import { useConversation, useStartConversation, useCancelConversation, useCompleteConversation, useUpdateConversation } from '@/hooks/useConversations';
import { useAuth } from '@/contexts/AuthContext';
import { ActionItemsList } from '@/components/conversations/ActionItemsList';
import { ActionItemForm } from '@/components/conversations/ActionItemForm';
import { RatingStars } from '@/components/conversations/RatingStars';
import type { ConversationStatus } from '@/types/conversations';

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
  scheduled: 'bg-blue-500/10 text-blue-600',
  confirmed: 'bg-green-500/10 text-green-600',
  in_progress: 'bg-yellow-500/10 text-yellow-600',
  completed: 'bg-green-500/10 text-green-600',
  cancelled: 'bg-red-500/10 text-red-600',
};

export default function ConversationDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, isAdminOrManager } = useAuth();
  const { data: conversation, isLoading } = useConversation(id!);
  const startConversation = useStartConversation();
  const cancelConversation = useCancelConversation();
  const completeConversation = useCompleteConversation();
  const updateConversation = useUpdateConversation();
  
  const [showActionForm, setShowActionForm] = useState(false);
  const [summary, setSummary] = useState('');
  const [rating, setRating] = useState<number | null>(null);
  const [isEditing, setIsEditing] = useState(false);

  const isManager = user?.id === conversation?.manager_id;
  const isEmployee = user?.id === conversation?.employee_id;
  const canManage = isManager || isAdminOrManager();

  const LocationIcon = conversation?.location_type === 'video' ? Video : 
                       conversation?.location_type === 'phone' ? Phone : MapPin;

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const handleStart = async () => {
    if (conversation) {
      await startConversation.mutateAsync(conversation.id);
      navigate(`/samtaler/${conversation.id}/gjennomfor`);
    }
  };

  const handleCancel = async () => {
    if (conversation && confirm('Er du sikker på at du vil kansellere denne samtalen?')) {
      await cancelConversation.mutateAsync(conversation.id);
    }
  };

  const handleComplete = async () => {
    if (conversation) {
      await completeConversation.mutateAsync({
        id: conversation.id,
        summary: summary || conversation.summary || undefined,
        overall_rating: rating || conversation.overall_rating || undefined,
      });
      setIsEditing(false);
    }
  };

  const handleSaveSummary = async () => {
    if (conversation) {
      await updateConversation.mutateAsync({
        id: conversation.id,
        summary,
        overall_rating: rating || undefined,
      });
      setIsEditing(false);
    }
  };

  if (isLoading) {
    return (
      <MainLayout>
        <div className="space-y-6">
          <Skeleton className="h-10 w-64" />
          <Skeleton className="h-48 w-full" />
          <Skeleton className="h-64 w-full" />
        </div>
      </MainLayout>
    );
  }

  if (!conversation) {
    return (
      <MainLayout>
        <div className="flex flex-col items-center justify-center py-12">
          <p className="text-lg text-muted-foreground">Samtalen ble ikke funnet</p>
          <Button onClick={() => navigate('/samtaler')} className="mt-4">
            Tilbake til oversikt
          </Button>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate('/samtaler')}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div className="flex items-center gap-3">
              <Avatar className="h-12 w-12">
                <AvatarImage src={conversation.employee?.avatar_url || undefined} />
                <AvatarFallback>
                  {conversation.employee?.full_name ? getInitials(conversation.employee.full_name) : '??'}
                </AvatarFallback>
              </Avatar>
              <div>
                <h1 className="text-xl font-bold">
                  Samtale med {conversation.employee?.full_name}
                </h1>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Badge className={statusColors[conversation.status]}>
                    {statusLabels[conversation.status]}
                  </Badge>
                  <span>•</span>
                  <span>{format(new Date(conversation.scheduled_date), 'PPP', { locale: nb })}</span>
                </div>
              </div>
            </div>
          </div>

          {canManage && (
            <div className="flex gap-2">
              {conversation.status === 'scheduled' && (
                <>
                  <Button variant="outline" onClick={handleCancel}>
                    <X className="mr-2 h-4 w-4" />
                    Kanseller
                  </Button>
                  <Button onClick={handleStart}>
                    <Play className="mr-2 h-4 w-4" />
                    Start samtale
                  </Button>
                </>
              )}
              {conversation.status === 'in_progress' && (
                <Button onClick={() => navigate(`/samtaler/${conversation.id}/gjennomfor`)}>
                  <Edit className="mr-2 h-4 w-4" />
                  Fortsett samtale
                </Button>
              )}
            </div>
          )}
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          {/* Main Content */}
          <div className="space-y-6 lg:col-span-2">
            {/* Info Card */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  Samtaleinformasjon
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-3">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-sm text-muted-foreground">Dato</p>
                      <p className="font-medium">
                        {format(new Date(conversation.scheduled_date), 'PPP', { locale: nb })}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-sm text-muted-foreground">Tid</p>
                      <p className="font-medium">
                        {conversation.scheduled_time?.slice(0, 5) || 'Ikke satt'} ({conversation.duration_minutes} min)
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <LocationIcon className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-sm text-muted-foreground">Sted</p>
                      <p className="font-medium">
                        {conversation.location_type === 'in_person' ? 'Fysisk' :
                         conversation.location_type === 'video' ? 'Video' : 'Telefon'}
                        {conversation.location && ` - ${conversation.location}`}
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Responses/Questions */}
            {conversation.responses && conversation.responses.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Spørsmål og svar</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {conversation.responses.map((response, index) => (
                    <div key={response.id} className="rounded-lg border p-4">
                      <div className="flex items-start gap-3">
                        <span className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-medium text-primary">
                          {index + 1}
                        </span>
                        <div className="flex-1 space-y-2">
                          <p className="font-medium">{response.question?.question_text}</p>
                          
                          {response.is_skipped ? (
                            <p className="text-sm italic text-muted-foreground">Hoppet over</p>
                          ) : response.question?.question_type === 'rating' ? (
                            <div className="flex items-center gap-1">
                              {[1, 2, 3, 4, 5].map(star => (
                                <Star
                                  key={star}
                                  className={`h-5 w-5 ${
                                    star <= (response.response_rating || 0)
                                      ? 'fill-yellow-400 text-yellow-400'
                                      : 'text-muted-foreground'
                                  }`}
                                />
                              ))}
                            </div>
                          ) : (
                            <p className="text-sm text-muted-foreground">
                              {response.response_text || 'Ikke besvart'}
                            </p>
                          )}

                          {response.manager_notes && (
                            <div className="mt-2 rounded-lg bg-muted p-3">
                              <p className="text-xs font-medium text-muted-foreground">Ledernotater:</p>
                              <p className="text-sm">{response.manager_notes}</p>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}

            {/* Summary */}
            {(conversation.status === 'completed' || conversation.status === 'in_progress') && canManage && (
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <CheckCircle className="h-5 w-5" />
                    Oppsummering
                  </CardTitle>
                  {!isEditing && conversation.status === 'completed' && (
                    <Button variant="ghost" size="sm" onClick={() => {
                      setSummary(conversation.summary || '');
                      setRating(conversation.overall_rating || null);
                      setIsEditing(true);
                    }}>
                      <Edit className="mr-2 h-4 w-4" />
                      Rediger
                    </Button>
                  )}
                </CardHeader>
                <CardContent className="space-y-4">
                  {isEditing || conversation.status === 'in_progress' ? (
                    <>
                      <div className="space-y-2">
                        <Label>Helhetsvurdering</Label>
                        <RatingStars value={rating || 0} onChange={setRating} />
                      </div>
                      <div className="space-y-2">
                        <Label>Oppsummering</Label>
                        <Textarea
                          value={summary}
                          onChange={(e) => setSummary(e.target.value)}
                          placeholder="Skriv en oppsummering av samtalen..."
                          rows={4}
                        />
                      </div>
                      <div className="flex gap-2">
                        {conversation.status === 'in_progress' ? (
                          <Button onClick={handleComplete}>
                            <CheckCircle className="mr-2 h-4 w-4" />
                            Fullfør samtale
                          </Button>
                        ) : (
                          <>
                            <Button variant="outline" onClick={() => setIsEditing(false)}>
                              Avbryt
                            </Button>
                            <Button onClick={handleSaveSummary}>
                              Lagre
                            </Button>
                          </>
                        )}
                      </div>
                    </>
                  ) : (
                    <>
                      {conversation.overall_rating && (
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-muted-foreground">Rating:</span>
                          <div className="flex items-center gap-1">
                            {[1, 2, 3, 4, 5].map(star => (
                              <Star
                                key={star}
                                className={`h-5 w-5 ${
                                  star <= conversation.overall_rating!
                                    ? 'fill-yellow-400 text-yellow-400'
                                    : 'text-muted-foreground'
                                }`}
                              />
                            ))}
                          </div>
                        </div>
                      )}
                      {conversation.summary ? (
                        <p className="text-sm">{conversation.summary}</p>
                      ) : (
                        <p className="text-sm italic text-muted-foreground">Ingen oppsummering ennå</p>
                      )}
                    </>
                  )}
                </CardContent>
              </Card>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Actions */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <ListTodo className="h-5 w-5" />
                  Handlingspunkter
                </CardTitle>
                {canManage && (
                  <Button variant="ghost" size="sm" onClick={() => setShowActionForm(true)}>
                    <Plus className="h-4 w-4" />
                  </Button>
                )}
              </CardHeader>
              <CardContent>
                {showActionForm && (
                  <div className="mb-4">
                    <ActionItemForm
                      conversationId={conversation.id}
                      employeeId={conversation.employee_id}
                      managerId={conversation.manager_id}
                      onClose={() => setShowActionForm(false)}
                    />
                  </div>
                )}
                <ActionItemsList 
                  conversationId={conversation.id} 
                  canManage={canManage}
                />
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
