import { useState } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Plus, 
  Search, 
  Edit, 
  Trash2, 
  GripVertical,
  FolderOpen,
  MessageSquare,
  ChevronDown,
  ChevronRight
} from 'lucide-react';
import { 
  useCategories, 
  useQuestions, 
  useCreateCategory, 
  useUpdateCategory,
  useDeleteCategory,
  useCreateQuestion,
  useUpdateQuestion,
  useDeleteQuestion
} from '@/hooks/useConversationQuestions';
import type { ConversationCategory, ConversationQuestion, QuestionType } from '@/types/conversations';

export default function ConversationQuestionsAdminPage() {
  const { data: categories, isLoading: categoriesLoading } = useCategories();
  const { data: questions, isLoading: questionsLoading } = useQuestions();
  
  const createCategory = useCreateCategory();
  const updateCategory = useUpdateCategory();
  const deleteCategory = useDeleteCategory();
  const createQuestion = useCreateQuestion();
  const updateQuestion = useUpdateQuestion();
  const deleteQuestion = useDeleteQuestion();

  const [searchQuery, setSearchQuery] = useState('');
  const [expandedCategories, setExpandedCategories] = useState<string[]>([]);
  const [showCategoryDialog, setShowCategoryDialog] = useState(false);
  const [showQuestionDialog, setShowQuestionDialog] = useState(false);
  const [editingCategory, setEditingCategory] = useState<ConversationCategory | null>(null);
  const [editingQuestion, setEditingQuestion] = useState<ConversationQuestion | null>(null);

  // Category form state
  const [categoryName, setCategoryName] = useState('');
  const [categoryDescription, setCategoryDescription] = useState('');
  const [categoryIcon, setCategoryIcon] = useState('📝');
  const [categoryColor, setCategoryColor] = useState('#3B82F6');

  // Question form state
  const [questionText, setQuestionText] = useState('');
  const [questionDescription, setQuestionDescription] = useState('');
  const [questionType, setQuestionType] = useState<QuestionType>('open');
  const [questionCategoryId, setQuestionCategoryId] = useState('');
  const [isDefault, setIsDefault] = useState(false);

  const toggleCategory = (categoryId: string) => {
    setExpandedCategories(prev =>
      prev.includes(categoryId)
        ? prev.filter(id => id !== categoryId)
        : [...prev, categoryId]
    );
  };

  const getQuestionsByCategory = (categoryId: string) => {
    return questions?.filter(q => q.category_id === categoryId) || [];
  };

  const filteredQuestions = searchQuery
    ? questions?.filter(q => 
        q.question_text.toLowerCase().includes(searchQuery.toLowerCase()) ||
        q.category?.name.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : null;

  const openCategoryDialog = (category?: ConversationCategory) => {
    if (category) {
      setEditingCategory(category);
      setCategoryName(category.name);
      setCategoryDescription(category.description || '');
      setCategoryIcon(category.icon || '📝');
      setCategoryColor(category.color || '#3B82F6');
    } else {
      setEditingCategory(null);
      setCategoryName('');
      setCategoryDescription('');
      setCategoryIcon('📝');
      setCategoryColor('#3B82F6');
    }
    setShowCategoryDialog(true);
  };

  const openQuestionDialog = (question?: ConversationQuestion, categoryId?: string) => {
    if (question) {
      setEditingQuestion(question);
      setQuestionText(question.question_text);
      setQuestionDescription(question.description || '');
      setQuestionType(question.question_type);
      setQuestionCategoryId(question.category_id);
      setIsDefault(question.is_default);
    } else {
      setEditingQuestion(null);
      setQuestionText('');
      setQuestionDescription('');
      setQuestionType('open');
      setQuestionCategoryId(categoryId || categories?.[0]?.id || '');
      setIsDefault(false);
    }
    setShowQuestionDialog(true);
  };

  const handleSaveCategory = async () => {
    if (!categoryName.trim()) return;

    if (editingCategory) {
      await updateCategory.mutateAsync({
        id: editingCategory.id,
        name: categoryName,
        description: categoryDescription || undefined,
        icon: categoryIcon,
        color: categoryColor,
      });
    } else {
      await createCategory.mutateAsync({
        name: categoryName,
        description: categoryDescription || undefined,
        icon: categoryIcon,
        color: categoryColor,
      });
    }
    setShowCategoryDialog(false);
  };

  const handleSaveQuestion = async () => {
    if (!questionText.trim() || !questionCategoryId) return;

    if (editingQuestion) {
      await updateQuestion.mutateAsync({
        id: editingQuestion.id,
        question_text: questionText,
        description: questionDescription || undefined,
        question_type: questionType,
        category_id: questionCategoryId,
        is_default: isDefault,
      });
    } else {
      await createQuestion.mutateAsync({
        question_text: questionText,
        description: questionDescription || undefined,
        question_type: questionType,
        category_id: questionCategoryId,
        is_default: isDefault,
      });
    }
    setShowQuestionDialog(false);
  };

  const handleDeleteCategory = async (id: string) => {
    if (confirm('Er du sikker? Alle spørsmål i kategorien vil også bli slettet.')) {
      await deleteCategory.mutateAsync(id);
    }
  };

  const handleDeleteQuestion = async (id: string) => {
    if (confirm('Er du sikker på at du vil slette dette spørsmålet?')) {
      await deleteQuestion.mutateAsync(id);
    }
  };

  const isLoading = categoriesLoading || questionsLoading;

  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold">Spørsmålsbank</h1>
            <p className="text-muted-foreground">
              Administrer kategorier og spørsmål for medarbeidersamtaler
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => openCategoryDialog()}>
              <FolderOpen className="mr-2 h-4 w-4" />
              Ny kategori
            </Button>
            <Button onClick={() => openQuestionDialog()}>
              <Plus className="mr-2 h-4 w-4" />
              Nytt spørsmål
            </Button>
          </div>
        </div>

        {/* Search */}
        <div className="relative w-full max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Søk i spørsmål..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Content */}
        {isLoading ? (
          <div className="space-y-4">
            {[1, 2, 3].map(i => (
              <Skeleton key={i} className="h-20 w-full" />
            ))}
          </div>
        ) : searchQuery ? (
          // Search Results
          <Card>
            <CardHeader>
              <CardTitle>Søkeresultater ({filteredQuestions?.length || 0})</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {filteredQuestions?.length === 0 ? (
                <p className="py-4 text-center text-muted-foreground">Ingen spørsmål funnet</p>
              ) : (
                filteredQuestions?.map(question => (
                  <div
                    key={question.id}
                    className="flex items-center justify-between rounded-lg border p-3"
                  >
                    <div className="flex-1">
                      <p className="font-medium">{question.question_text}</p>
                      <div className="mt-1 flex items-center gap-2">
                        <Badge 
                          style={{ 
                            backgroundColor: `${question.category?.color}20`,
                            color: question.category?.color || undefined
                          }}
                        >
                          {question.category?.icon} {question.category?.name}
                        </Badge>
                        <Badge variant="outline">
                          {question.question_type === 'open' ? 'Åpent' :
                           question.question_type === 'rating' ? 'Rating' : 'Ja/Nei'}
                        </Badge>
                        {question.is_default && (
                          <Badge variant="secondary">Standard</Badge>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="icon" onClick={() => openQuestionDialog(question)}>
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => handleDeleteQuestion(question.id)}>
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        ) : (
          // Categories List
          <div className="space-y-4">
            {categories?.map(category => (
              <Card key={category.id}>
                <CardHeader className="cursor-pointer" onClick={() => toggleCategory(category.id)}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      {expandedCategories.includes(category.id) ? (
                        <ChevronDown className="h-5 w-5" />
                      ) : (
                        <ChevronRight className="h-5 w-5" />
                      )}
                      <span className="text-2xl">{category.icon}</span>
                      <div>
                        <CardTitle className="text-lg">{category.name}</CardTitle>
                        {category.description && (
                          <p className="text-sm text-muted-foreground">{category.description}</p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                      <Badge variant="secondary">
                        {getQuestionsByCategory(category.id).length} spørsmål
                      </Badge>
                      <Button variant="ghost" size="icon" onClick={() => openCategoryDialog(category)}>
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => handleDeleteCategory(category.id)}>
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                
                {expandedCategories.includes(category.id) && (
                  <CardContent className="space-y-2 pt-0">
                    {getQuestionsByCategory(category.id).map(question => (
                      <div
                        key={question.id}
                        className="flex items-center justify-between rounded-lg border p-3"
                      >
                        <div className="flex items-center gap-3">
                          <GripVertical className="h-4 w-4 text-muted-foreground" />
                          <div>
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
                        <div className="flex gap-1">
                          <Button variant="ghost" size="icon" onClick={() => openQuestionDialog(question)}>
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" onClick={() => handleDeleteQuestion(question.id)}>
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      </div>
                    ))}
                    <Button
                      variant="ghost"
                      className="w-full gap-2 border border-dashed"
                      onClick={() => openQuestionDialog(undefined, category.id)}
                    >
                      <Plus className="h-4 w-4" />
                      Legg til spørsmål
                    </Button>
                  </CardContent>
                )}
              </Card>
            ))}
          </div>
        )}

        {/* Category Dialog */}
        <Dialog open={showCategoryDialog} onOpenChange={setShowCategoryDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingCategory ? 'Rediger kategori' : 'Ny kategori'}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Navn</Label>
                <Input
                  value={categoryName}
                  onChange={(e) => setCategoryName(e.target.value)}
                  placeholder="F.eks. Trivsel & Arbeidsmiljø"
                />
              </div>
              <div className="space-y-2">
                <Label>Beskrivelse</Label>
                <Textarea
                  value={categoryDescription}
                  onChange={(e) => setCategoryDescription(e.target.value)}
                  placeholder="Kort beskrivelse av kategorien..."
                />
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label>Ikon (emoji)</Label>
                  <Input
                    value={categoryIcon}
                    onChange={(e) => setCategoryIcon(e.target.value)}
                    placeholder="😊"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Farge</Label>
                  <Input
                    type="color"
                    value={categoryColor}
                    onChange={(e) => setCategoryColor(e.target.value)}
                  />
                </div>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setShowCategoryDialog(false)} className="flex-1">
                  Avbryt
                </Button>
                <Button onClick={handleSaveCategory} className="flex-1">
                  {editingCategory ? 'Lagre' : 'Opprett'}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Question Dialog */}
        <Dialog open={showQuestionDialog} onOpenChange={setShowQuestionDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingQuestion ? 'Rediger spørsmål' : 'Nytt spørsmål'}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Kategori</Label>
                <Select value={questionCategoryId} onValueChange={setQuestionCategoryId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Velg kategori" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories?.map(cat => (
                      <SelectItem key={cat.id} value={cat.id}>
                        {cat.icon} {cat.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Spørsmål</Label>
                <Textarea
                  value={questionText}
                  onChange={(e) => setQuestionText(e.target.value)}
                  placeholder="Skriv spørsmålet her..."
                />
              </div>
              <div className="space-y-2">
                <Label>Hjelpetekst (valgfritt)</Label>
                <Input
                  value={questionDescription}
                  onChange={(e) => setQuestionDescription(e.target.value)}
                  placeholder="Tips til hvordan spørsmålet kan brukes"
                />
              </div>
              <div className="space-y-2">
                <Label>Svartype</Label>
                <Select value={questionType} onValueChange={(v) => setQuestionType(v as QuestionType)}>
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
              <div className="flex items-center justify-between rounded-lg border p-3">
                <div>
                  <p className="font-medium">Standard spørsmål</p>
                  <p className="text-sm text-muted-foreground">
                    Inkluderes automatisk i nye samtaler
                  </p>
                </div>
                <Switch checked={isDefault} onCheckedChange={setIsDefault} />
              </div>
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setShowQuestionDialog(false)} className="flex-1">
                  Avbryt
                </Button>
                <Button onClick={handleSaveQuestion} className="flex-1">
                  {editingQuestion ? 'Lagre' : 'Opprett'}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </MainLayout>
  );
}
