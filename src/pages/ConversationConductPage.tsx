import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { MainLayout } from '@/components/layout/MainLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  ArrowLeft, 
  ArrowRight, 
  SkipForward, 
  Save,
  CheckCircle,
  MessageSquare
} from 'lucide-react';
import { useConversation, useUpdateResponse, useCompleteConversation } from '@/hooks/useConversations';
import { RatingStars } from '@/components/conversations/RatingStars';

export default function ConversationConductPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { data: conversation, isLoading } = useConversation(id!);
  const updateResponse = useUpdateResponse();
  const completeConversation = useCompleteConversation();

  const [currentIndex, setCurrentIndex] = useState(0);
  const [responses, setResponses] = useState<Record<string, { text?: string; rating?: number; notes?: string; skipped?: boolean }>>({});
  const [isSaving, setIsSaving] = useState(false);
  const [summary, setSummary] = useState('');
  const [overallRating, setOverallRating] = useState<number>(0);

  const sortedResponses = conversation?.responses?.sort((a, b) => a.sort_order - b.sort_order) || [];
  const currentResponse = sortedResponses[currentIndex];
  const totalQuestions = sortedResponses.length;
  const progress = totalQuestions > 0 ? ((currentIndex + 1) / totalQuestions) * 100 : 0;

  // Load existing responses
  useEffect(() => {
    if (conversation?.responses) {
      const existing: Record<string, any> = {};
      conversation.responses.forEach(r => {
        existing[r.question_id] = {
          text: r.response_text || '',
          rating: r.response_rating || 0,
          notes: r.manager_notes || '',
          skipped: r.is_skipped,
        };
      });
      setResponses(existing);
    }
    if (conversation?.summary) {
      setSummary(conversation.summary);
    }
    if (conversation?.overall_rating) {
      setOverallRating(conversation.overall_rating);
    }
  }, [conversation]);

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const saveCurrentResponse = async () => {
    if (!currentResponse) return;
    
    const data = responses[currentResponse.question_id] || {};
    
    setIsSaving(true);
    try {
      await updateResponse.mutateAsync({
        conversation_id: conversation!.id,
        question_id: currentResponse.question_id,
        response_text: data.text || null,
        response_rating: data.rating || null,
        manager_notes: data.notes || null,
        is_skipped: data.skipped || false,
        sort_order: currentResponse.sort_order,
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleNext = async () => {
    await saveCurrentResponse();
    if (currentIndex < totalQuestions - 1) {
      setCurrentIndex(currentIndex + 1);
    }
  };

  const handlePrev = async () => {
    await saveCurrentResponse();
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
    }
  };

  const handleSkip = async () => {
    if (!currentResponse) return;
    
    setResponses(prev => ({
      ...prev,
      [currentResponse.question_id]: { ...prev[currentResponse.question_id], skipped: true },
    }));
    
    await saveCurrentResponse();
    
    if (currentIndex < totalQuestions - 1) {
      setCurrentIndex(currentIndex + 1);
    }
  };

  const handleComplete = async () => {
    await saveCurrentResponse();
    await completeConversation.mutateAsync({
      id: conversation!.id,
      summary: summary || undefined,
      overall_rating: overallRating || undefined,
    });
    navigate(`/samtaler/${conversation!.id}`);
  };

  const updateCurrentResponse = (field: 'text' | 'rating' | 'notes', value: string | number) => {
    if (!currentResponse) return;
    setResponses(prev => ({
      ...prev,
      [currentResponse.question_id]: {
        ...prev[currentResponse.question_id],
        [field]: value,
        skipped: false,
      },
    }));
  };

  const isLastQuestion = currentIndex === totalQuestions - 1;

  if (isLoading) {
    return (
      <MainLayout>
        <div className="mx-auto max-w-3xl space-y-6">
          <Skeleton className="h-10 w-64" />
          <Skeleton className="h-4 w-full" />
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
      <div className="mx-auto max-w-3xl space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate(`/samtaler/${id}`)}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex items-center gap-3">
            <Avatar className="h-10 w-10">
              <AvatarImage src={conversation.employee?.avatar_url || undefined} />
              <AvatarFallback>
                {conversation.employee?.full_name ? getInitials(conversation.employee.full_name) : '??'}
              </AvatarFallback>
            </Avatar>
            <div>
              <h1 className="font-bold">Samtale med {conversation.employee?.full_name}</h1>
              <p className="text-sm text-muted-foreground">
                Spørsmål {currentIndex + 1} av {totalQuestions}
              </p>
            </div>
          </div>
        </div>

        {/* Progress */}
        <div className="space-y-2">
          <Progress value={progress} className="h-2" />
          <div className="flex gap-1 overflow-x-auto pb-2">
            {sortedResponses.map((r, idx) => {
              const respData = responses[r.question_id];
              const isAnswered = respData?.text || respData?.rating || respData?.skipped;
              
              return (
                <button
                  key={r.id}
                  onClick={() => {
                    saveCurrentResponse();
                    setCurrentIndex(idx);
                  }}
                  className={`flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full text-xs transition-colors ${
                    idx === currentIndex
                      ? 'bg-primary text-primary-foreground'
                      : isAnswered
                        ? 'bg-green-500/20 text-green-600'
                        : 'bg-muted text-muted-foreground hover:bg-muted/80'
                  }`}
                >
                  {idx + 1}
                </button>
              );
            })}
          </div>
        </div>

        {/* Current Question */}
        {currentResponse && (
          <Card>
            <CardHeader>
              <div className="flex items-start gap-3">
                {currentResponse.question?.category && (
                  <Badge 
                    style={{ 
                      backgroundColor: `${currentResponse.question.category.color}20`,
                      color: currentResponse.question.category.color || undefined
                    }}
                  >
                    {currentResponse.question.category.icon} {currentResponse.question.category.name}
                  </Badge>
                )}
              </div>
              <CardTitle className="text-xl">
                {currentResponse.question?.question_text}
              </CardTitle>
              {currentResponse.question?.description && (
                <p className="text-sm text-muted-foreground">
                  {currentResponse.question.description}
                </p>
              )}
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Response Input */}
              {currentResponse.question?.question_type === 'rating' ? (
                <div className="flex flex-col items-center gap-4 py-4">
                  <RatingStars
                    value={responses[currentResponse.question_id]?.rating || 0}
                    onChange={(v) => updateCurrentResponse('rating', v)}
                    size="lg"
                  />
                  <p className="text-sm text-muted-foreground">
                    Klikk på stjernene for å sette rating
                  </p>
                </div>
              ) : (
                <Textarea
                  value={responses[currentResponse.question_id]?.text || ''}
                  onChange={(e) => updateCurrentResponse('text', e.target.value)}
                  placeholder="Skriv svar/notater her..."
                  rows={4}
                  className="text-base"
                />
              )}

              {/* Manager Notes */}
              <div className="space-y-2 border-t pt-4">
                <label className="text-sm font-medium text-muted-foreground">
                  Ledernotater (kun synlig for deg)
                </label>
                <Textarea
                  value={responses[currentResponse.question_id]?.notes || ''}
                  onChange={(e) => updateCurrentResponse('notes', e.target.value)}
                  placeholder="Legg til private notater..."
                  rows={2}
                  className="bg-muted/50"
                />
              </div>

              {isSaving && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Save className="h-4 w-4 animate-pulse" />
                  Lagrer...
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Summary Card (shown at end) */}
        {isLastQuestion && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5" />
                Avslutt samtalen
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Helhetsvurdering</label>
                <RatingStars
                  value={overallRating}
                  onChange={setOverallRating}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Oppsummering</label>
                <Textarea
                  value={summary}
                  onChange={(e) => setSummary(e.target.value)}
                  placeholder="Skriv en kort oppsummering av samtalen..."
                  rows={3}
                />
              </div>
            </CardContent>
          </Card>
        )}

        {/* Navigation */}
        <div className="flex items-center justify-between">
          <Button
            variant="outline"
            onClick={handlePrev}
            disabled={currentIndex === 0}
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Forrige
          </Button>

          <Button
            variant="ghost"
            onClick={handleSkip}
            className="text-muted-foreground"
          >
            <SkipForward className="mr-2 h-4 w-4" />
            Hopp over
          </Button>

          {isLastQuestion ? (
            <Button onClick={handleComplete} disabled={completeConversation.isPending}>
              <CheckCircle className="mr-2 h-4 w-4" />
              {completeConversation.isPending ? 'Fullfører...' : 'Fullfør samtale'}
            </Button>
          ) : (
            <Button onClick={handleNext}>
              Neste
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          )}
        </div>
      </div>
    </MainLayout>
  );
}
