import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Skeleton } from '@/components/ui/skeleton';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { 
  Plus, 
  GripVertical, 
  Trash2, 
  ChevronDown, 
  ChevronRight,
  Save,
  MessageSquare
} from 'lucide-react';
import { useCategories, useQuestions, useDefaultQuestions } from '@/hooks/useConversationQuestions';
import { useTemplates, useTemplate } from '@/hooks/useConversationTemplates';
import type { ConversationQuestion, SelectedQuestion, QuestionType } from '@/types/conversations';

interface QuestionSelectorProps {
  selectedQuestions: SelectedQuestion[];
  onQuestionsChange: (questions: SelectedQuestion[]) => void;
}

export function QuestionSelector({ selectedQuestions, onQuestionsChange }: QuestionSelectorProps) {
  const { data: categories, isLoading: categoriesLoading } = useCategories();
  const { data: allQuestions, isLoading: questionsLoading } = useQuestions();
  const { data: defaultQuestions } = useDefaultQuestions();
  const { data: templates } = useTemplates();
  
  const [expandedCategories, setExpandedCategories] = useState<string[]>([]);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>('');
  const { data: selectedTemplate } = useTemplate(selectedTemplateId);
  
  const [showCustomDialog, setShowCustomDialog] = useState(false);
  const [customQuestion, setCustomQuestion] = useState('');
  const [customQuestionType, setCustomQuestionType] = useState<QuestionType>('open');

  // Load default questions on mount
  useEffect(() => {
    if (defaultQuestions && selectedQuestions.length === 0) {
      const defaults = defaultQuestions.map((q, index) => ({
        id: q.id,
        question: q,
        sort_order: index,
        is_required: false,
      }));
      onQuestionsChange(defaults);
    }
  }, [defaultQuestions]);

  // Apply template when selected
  useEffect(() => {
    if (selectedTemplate?.questions) {
      const templateQuestions = selectedTemplate.questions.map((tq: any, index: number) => ({
        id: tq.question.id,
        question: tq.question,
        sort_order: index,
        is_required: tq.is_required,
      }));
      onQuestionsChange(templateQuestions);
    }
  }, [selectedTemplate]);

  const toggleCategory = (categoryId: string) => {
    setExpandedCategories(prev =>
      prev.includes(categoryId)
        ? prev.filter(id => id !== categoryId)
        : [...prev, categoryId]
    );
  };

  const isQuestionSelected = (questionId: string) => {
    return selectedQuestions.some(sq => sq.id === questionId);
  };

  const toggleQuestion = (question: ConversationQuestion) => {
    if (isQuestionSelected(question.id)) {
      onQuestionsChange(selectedQuestions.filter(sq => sq.id !== question.id));
    } else {
      onQuestionsChange([
        ...selectedQuestions,
        {
          id: question.id,
          question,
          sort_order: selectedQuestions.length,
          is_required: false,
        },
      ]);
    }
  };

  const removeQuestion = (questionId: string) => {
    onQuestionsChange(selectedQuestions.filter(sq => sq.id !== questionId));
  };

  const moveQuestion = (index: number, direction: 'up' | 'down') => {
    if (
      (direction === 'up' && index === 0) ||
      (direction === 'down' && index === selectedQuestions.length - 1)
    ) {
      return;
    }

    const newQuestions = [...selectedQuestions];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    [newQuestions[index], newQuestions[targetIndex]] = [newQuestions[targetIndex], newQuestions[index]];
    
    // Update sort_order
    newQuestions.forEach((q, i) => {
      q.sort_order = i;
    });
    
    onQuestionsChange(newQuestions);
  };

  const addCustomQuestion = () => {
    if (!customQuestion.trim()) return;

    const newQuestion: ConversationQuestion = {
      id: `custom-${Date.now()}`,
      category_id: '',
      question_text: customQuestion,
      description: null,
      question_type: customQuestionType,
      is_default: false,
      tags: ['egendefinert'],
      sort_order: 0,
      is_active: true,
      created_at: new Date().toISOString(),
    };

    onQuestionsChange([
      ...selectedQuestions,
      {
        id: newQuestion.id,
        question: newQuestion,
        sort_order: selectedQuestions.length,
        is_required: false,
      },
    ]);

    setCustomQuestion('');
    setCustomQuestionType('open');
    setShowCustomDialog(false);
  };

  const getQuestionsByCategory = (categoryId: string) => {
    return allQuestions?.filter(q => q.category_id === categoryId) || [];
  };

  if (categoriesLoading || questionsLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map(i => (
          <Skeleton key={i} className="h-20 w-full" />
        ))}
      </div>
    );
  }

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      {/* Left: Question Bank */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <Label className="text-base font-medium">Spørsmålsbank</Label>
          {templates && templates.length > 0 && (
            <Select value={selectedTemplateId} onValueChange={setSelectedTemplateId}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Velg mal" />
              </SelectTrigger>
              <SelectContent>
                {templates.map(template => (
                  <SelectItem key={template.id} value={template.id}>
                    {template.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>

        <ScrollArea className="h-80 rounded-lg border p-4">
          {categories?.map(category => (
            <div key={category.id} className="mb-2">
              <button
                onClick={() => toggleCategory(category.id)}
                className="flex w-full items-center gap-2 rounded-lg p-2 text-left transition-colors hover:bg-muted"
              >
                {expandedCategories.includes(category.id) ? (
                  <ChevronDown className="h-4 w-4" />
                ) : (
                  <ChevronRight className="h-4 w-4" />
                )}
                <span className="text-lg">{category.icon}</span>
                <span className="flex-1 font-medium">{category.name}</span>
                <Badge 
                  variant="secondary" 
                  style={{ backgroundColor: `${category.color}20`, color: category.color || undefined }}
                >
                  {getQuestionsByCategory(category.id).length}
                </Badge>
              </button>

              {expandedCategories.includes(category.id) && (
                <div className="ml-6 space-y-1 py-2">
                  {getQuestionsByCategory(category.id).map(question => (
                    <div
                      key={question.id}
                      className="flex items-start gap-3 rounded-lg p-2 transition-colors hover:bg-muted"
                    >
                      <Checkbox
                        checked={isQuestionSelected(question.id)}
                        onCheckedChange={() => toggleQuestion(question)}
                      />
                      <div className="flex-1">
                        <p className="text-sm">{question.question_text}</p>
                        <div className="mt-1 flex gap-1">
                          <Badge variant="outline" className="text-xs">
                            {question.question_type === 'open' ? 'Åpent' : 
                             question.question_type === 'rating' ? 'Rating' : 'Ja/Nei'}
                          </Badge>
                          {question.is_default && (
                            <Badge variant="secondary" className="text-xs">Standard</Badge>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </ScrollArea>

        <Dialog open={showCustomDialog} onOpenChange={setShowCustomDialog}>
          <DialogTrigger asChild>
            <Button variant="outline" className="w-full gap-2">
              <Plus className="h-4 w-4" />
              Legg til egendefinert spørsmål
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Egendefinert spørsmål</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Spørsmål</Label>
                <Textarea
                  value={customQuestion}
                  onChange={(e) => setCustomQuestion(e.target.value)}
                  placeholder="Skriv ditt spørsmål her..."
                />
              </div>
              <div className="space-y-2">
                <Label>Type</Label>
                <Select value={customQuestionType} onValueChange={(v) => setCustomQuestionType(v as QuestionType)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="open">Åpent svar</SelectItem>
                    <SelectItem value="rating">Rating (1-5)</SelectItem>
                    <SelectItem value="yes_no">Ja/Nei</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button onClick={addCustomQuestion} className="w-full">
                Legg til
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Right: Selected Questions */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <Label className="text-base font-medium">
            Valgte spørsmål ({selectedQuestions.length})
          </Label>
        </div>

        <ScrollArea className="h-80 rounded-lg border p-4">
          {selectedQuestions.length === 0 ? (
            <div className="flex h-full flex-col items-center justify-center text-center">
              <MessageSquare className="h-8 w-8 text-muted-foreground/50" />
              <p className="mt-2 text-sm text-muted-foreground">
                Velg spørsmål fra listen til venstre
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {selectedQuestions.map((sq, index) => (
                <div
                  key={sq.id}
                  className="flex items-start gap-2 rounded-lg border bg-card p-3"
                >
                  <div className="flex flex-col gap-1 pt-1">
                    <button
                      onClick={() => moveQuestion(index, 'up')}
                      disabled={index === 0}
                      className="text-muted-foreground hover:text-foreground disabled:opacity-30"
                    >
                      <ChevronDown className="h-4 w-4 rotate-180" />
                    </button>
                    <button
                      onClick={() => moveQuestion(index, 'down')}
                      disabled={index === selectedQuestions.length - 1}
                      className="text-muted-foreground hover:text-foreground disabled:opacity-30"
                    >
                      <ChevronDown className="h-4 w-4" />
                    </button>
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium">{sq.question.question_text}</p>
                    <div className="mt-1 flex items-center gap-2">
                      <Badge variant="outline" className="text-xs">
                        {sq.question.question_type === 'open' ? 'Åpent' :
                         sq.question.question_type === 'rating' ? 'Rating' : 'Ja/Nei'}
                      </Badge>
                      {sq.question.category && (
                        <span className="text-xs text-muted-foreground">
                          {sq.question.category.icon} {sq.question.category.name}
                        </span>
                      )}
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => removeQuestion(sq.id)}
                    className="h-8 w-8 text-muted-foreground hover:text-destructive"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </div>
    </div>
  );
}
