import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { 
  ChevronLeft, 
  ChevronRight, 
  RotateCcw, 
  Lightbulb,
  Brain,
  Target,
  Sparkles,
  CheckCircle,
  XCircle,
  ArrowRight,
  Eye,
  EyeOff,
  Zap,
  Trophy,
  BookOpen,
  Play,
  Pause
} from "lucide-react";
import { cn } from "@/lib/utils";

interface Section {
  title: string;
  content: string;
}

interface LearningPhase {
  type: 'intro' | 'flashcard' | 'explore' | 'practice' | 'ready';
  title: string;
  description: string;
}

const LEARNING_PHASES: LearningPhase[] = [
  { type: 'intro', title: 'Introduksjon', description: 'Forstå hovedkonseptene' },
  { type: 'flashcard', title: 'Flashcards', description: 'Lær hovedpunktene' },
  { type: 'explore', title: 'Utforsk', description: 'Dykk dypere i materialet' },
  { type: 'practice', title: 'Øv deg', description: 'Test underveis' },
  { type: 'ready', title: 'Klar for quiz', description: 'Du er forberedt!' },
];

// Flashcard component for memorizing key points
function FlashcardDeck({ 
  keyPoints, 
  onComplete 
}: { 
  keyPoints: string[]; 
  onComplete: () => void;
}) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [masteredCards, setMasteredCards] = useState<Set<number>>(new Set());
  const [isAutoPlay, setIsAutoPlay] = useState(false);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (isAutoPlay && !isFlipped) {
      timer = setTimeout(() => setIsFlipped(true), 2000);
    } else if (isAutoPlay && isFlipped) {
      timer = setTimeout(() => {
        handleNext();
        setIsFlipped(false);
      }, 3000);
    }
    return () => clearTimeout(timer);
  }, [isAutoPlay, isFlipped, currentIndex]);

  const handleNext = () => {
    if (currentIndex < keyPoints.length - 1) {
      setCurrentIndex(prev => prev + 1);
      setIsFlipped(false);
    } else if (masteredCards.size === keyPoints.length) {
      onComplete();
    }
  };

  const handlePrev = () => {
    if (currentIndex > 0) {
      setCurrentIndex(prev => prev - 1);
      setIsFlipped(false);
    }
  };

  const handleMastered = () => {
    const newMastered = new Set(masteredCards);
    newMastered.add(currentIndex);
    setMasteredCards(newMastered);
    
    if (newMastered.size === keyPoints.length) {
      onComplete();
    } else {
      handleNext();
    }
  };

  const progress = (masteredCards.size / keyPoints.length) * 100;
  const currentPoint = keyPoints[currentIndex];
  
  // Generate a hint by taking first few words
  const hint = currentPoint.split(' ').slice(0, 3).join(' ') + '...';

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Brain className="h-5 w-5 text-primary" />
          <span className="font-medium">Flashcards</span>
          <Badge variant="outline">{currentIndex + 1} / {keyPoints.length}</Badge>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsAutoPlay(!isAutoPlay)}
            className="gap-1"
          >
            {isAutoPlay ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
            {isAutoPlay ? 'Stopp' : 'Auto'}
          </Button>
          <Badge variant="secondary" className="gap-1">
            <Trophy className="h-3 w-3" />
            {masteredCards.size} mestret
          </Badge>
        </div>
      </div>

      <Progress value={progress} className="h-2" />

      {/* Flashcard */}
      <div 
        className={cn(
          "relative min-h-[200px] cursor-pointer perspective-1000",
          "transition-transform duration-500 transform-style-preserve-3d"
        )}
        onClick={() => setIsFlipped(!isFlipped)}
      >
        <Card className={cn(
          "absolute inset-0 backface-hidden transition-all duration-500",
          "flex items-center justify-center p-6",
          isFlipped ? "rotate-y-180 opacity-0" : "rotate-y-0",
          masteredCards.has(currentIndex) && "border-success bg-success/5"
        )}>
          <CardContent className="text-center p-0">
            <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
              <Lightbulb className="h-6 w-6 text-primary" />
            </div>
            <p className="text-lg font-medium text-muted-foreground">{hint}</p>
            <p className="text-sm text-muted-foreground mt-4 flex items-center justify-center gap-2">
              <Eye className="h-4 w-4" />
              Klikk for å se svaret
            </p>
          </CardContent>
        </Card>

        <Card className={cn(
          "absolute inset-0 backface-hidden transition-all duration-500",
          "flex items-center justify-center p-6 bg-primary/5 border-primary/20",
          isFlipped ? "rotate-y-0" : "rotate-y-180 opacity-0"
        )}>
          <CardContent className="text-center p-0">
            <p className="text-lg leading-relaxed">{currentPoint}</p>
            <p className="text-sm text-muted-foreground mt-4 flex items-center justify-center gap-2">
              <EyeOff className="h-4 w-4" />
              Klikk for å skjule
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Navigation */}
      <div className="flex items-center justify-between">
        <Button
          variant="outline"
          onClick={handlePrev}
          disabled={currentIndex === 0}
        >
          <ChevronLeft className="mr-2 h-4 w-4" />
          Forrige
        </Button>

        <div className="flex gap-2">
          {!masteredCards.has(currentIndex) && (
            <Button
              variant="default"
              onClick={handleMastered}
              className="gap-2"
            >
              <CheckCircle className="h-4 w-4" />
              Jeg har lært dette
            </Button>
          )}
          <Button
            variant="outline"
            onClick={handleNext}
            disabled={currentIndex === keyPoints.length - 1 && masteredCards.size !== keyPoints.length}
          >
            {currentIndex === keyPoints.length - 1 ? 'Fullfør' : 'Hopp over'}
            <ChevronRight className="ml-2 h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Mastered indicators */}
      <div className="flex justify-center gap-1 pt-2">
        {keyPoints.map((_, index) => (
          <button
            key={index}
            onClick={() => {
              setCurrentIndex(index);
              setIsFlipped(false);
            }}
            className={cn(
              "h-2 w-8 rounded-full transition-all",
              index === currentIndex && "w-12",
              masteredCards.has(index) 
                ? "bg-success" 
                : index === currentIndex 
                ? "bg-primary" 
                : "bg-muted"
            )}
          />
        ))}
      </div>
    </div>
  );
}

// Interactive section explorer with reveal effects
function SectionExplorer({ 
  sections, 
  onComplete 
}: { 
  sections: Section[]; 
  onComplete: () => void;
}) {
  const [expandedSections, setExpandedSections] = useState<Set<number>>(new Set());
  const [readSections, setReadSections] = useState<Set<number>>(new Set());

  const toggleSection = (index: number) => {
    const newExpanded = new Set(expandedSections);
    if (newExpanded.has(index)) {
      newExpanded.delete(index);
    } else {
      newExpanded.add(index);
      // Mark as read after a delay
      setTimeout(() => {
        setReadSections(prev => {
          const newRead = new Set(prev);
          newRead.add(index);
          if (newRead.size === sections.length) {
            onComplete();
          }
          return newRead;
        });
      }, 1500);
    }
    setExpandedSections(newExpanded);
  };

  const progress = (readSections.size / sections.length) * 100;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <BookOpen className="h-5 w-5 text-primary" />
          <span className="font-medium">Utforsk temaene</span>
        </div>
        <Badge variant="secondary">
          {readSections.size} / {sections.length} lest
        </Badge>
      </div>

      <Progress value={progress} className="h-2" />

      <div className="space-y-3">
        {sections.map((section, index) => {
          const isExpanded = expandedSections.has(index);
          const isRead = readSections.has(index);

          return (
            <Card 
              key={index}
              className={cn(
                "transition-all duration-300 cursor-pointer",
                isRead && "border-success/50 bg-success/5",
                isExpanded && "ring-2 ring-primary/20"
              )}
              onClick={() => toggleSection(index)}
            >
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={cn(
                      "h-8 w-8 rounded-full flex items-center justify-center text-sm font-bold transition-colors",
                      isRead 
                        ? "bg-success text-success-foreground" 
                        : "bg-primary/10 text-primary"
                    )}>
                      {isRead ? <CheckCircle className="h-4 w-4" /> : index + 1}
                    </div>
                    <span>{section.title}</span>
                  </div>
                  <ChevronRight className={cn(
                    "h-5 w-5 text-muted-foreground transition-transform",
                    isExpanded && "rotate-90"
                  )} />
                </CardTitle>
              </CardHeader>
              
              <div className={cn(
                "overflow-hidden transition-all duration-300",
                isExpanded ? "max-h-[500px] opacity-100" : "max-h-0 opacity-0"
              )}>
                <CardContent className="pt-0">
                  <div className="prose prose-slate max-w-none dark:prose-invert">
                    {section.content.split('\n').map((paragraph, pIndex) => (
                      <p key={pIndex} className="text-muted-foreground leading-relaxed mb-2 last:mb-0">
                        {paragraph}
                      </p>
                    ))}
                  </div>
                </CardContent>
              </div>
            </Card>
          );
        })}
      </div>

      {readSections.size === sections.length && (
        <Card className="border-success bg-success/5">
          <CardContent className="py-4 text-center">
            <CheckCircle className="h-8 w-8 text-success mx-auto mb-2" />
            <p className="font-medium text-success">Flott! Du har lest gjennom alle temaene.</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

// Practice questions with instant feedback
function PracticeMode({ 
  questions,
  onComplete 
}: { 
  questions: Array<{ question: string; options: string[]; correct: number }>;
  onComplete: (score: number) => void;
}) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [showFeedback, setShowFeedback] = useState(false);
  const [correctAnswers, setCorrectAnswers] = useState(0);
  const [attempts, setAttempts] = useState<Record<number, number>>({});

  // Take first 2-3 questions for practice
  const practiceQuestions = questions.slice(0, Math.min(3, questions.length));
  const currentQuestion = practiceQuestions[currentIndex];
  const isCorrect = selectedAnswer === currentQuestion.correct;

  const handleSelect = (optionIndex: number) => {
    if (showFeedback) return;
    setSelectedAnswer(optionIndex);
  };

  const handleCheck = () => {
    setShowFeedback(true);
    setAttempts(prev => ({ ...prev, [currentIndex]: (prev[currentIndex] || 0) + 1 }));
    
    if (isCorrect) {
      setCorrectAnswers(prev => prev + 1);
    }
  };

  const handleNext = () => {
    if (currentIndex < practiceQuestions.length - 1) {
      setCurrentIndex(prev => prev + 1);
      setSelectedAnswer(null);
      setShowFeedback(false);
    } else {
      onComplete(Math.round((correctAnswers / practiceQuestions.length) * 100));
    }
  };

  const handleRetry = () => {
    setSelectedAnswer(null);
    setShowFeedback(false);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Target className="h-5 w-5 text-primary" />
          <span className="font-medium">Øvingsspørsmål</span>
          <Badge variant="outline">{currentIndex + 1} / {practiceQuestions.length}</Badge>
        </div>
        <Badge variant="secondary" className="gap-1">
          <Zap className="h-3 w-3" />
          {correctAnswers} riktige
        </Badge>
      </div>

      <Progress value={((currentIndex + 1) / practiceQuestions.length) * 100} className="h-2" />

      <Card>
        <CardHeader>
          <CardTitle className="text-lg leading-relaxed flex items-start gap-3">
            <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-sm font-bold text-primary shrink-0">
              ?
            </div>
            <span>{currentQuestion.question}</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {currentQuestion.options.map((option, optionIndex) => {
            const isSelected = selectedAnswer === optionIndex;
            const isCorrectOption = currentQuestion.correct === optionIndex;
            
            return (
              <button
                key={optionIndex}
                onClick={() => handleSelect(optionIndex)}
                disabled={showFeedback}
                className={cn(
                  "w-full text-left px-4 py-3 rounded-lg border-2 transition-all",
                  !showFeedback && isSelected && "border-primary bg-primary/5",
                  !showFeedback && !isSelected && "border-border hover:border-primary/50 hover:bg-accent",
                  showFeedback && isCorrectOption && "border-success bg-success/10",
                  showFeedback && isSelected && !isCorrectOption && "border-destructive bg-destructive/10",
                  showFeedback && "cursor-not-allowed"
                )}
              >
                <div className="flex items-center gap-3">
                  <div className={cn(
                    "flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-medium border-2",
                    !showFeedback && isSelected && "border-primary bg-primary text-primary-foreground",
                    !showFeedback && !isSelected && "border-muted-foreground/30",
                    showFeedback && isCorrectOption && "border-success bg-success text-success-foreground",
                    showFeedback && isSelected && !isCorrectOption && "border-destructive bg-destructive text-destructive-foreground"
                  )}>
                    {showFeedback && isCorrectOption ? (
                      <CheckCircle className="h-4 w-4" />
                    ) : showFeedback && isSelected && !isCorrectOption ? (
                      <XCircle className="h-4 w-4" />
                    ) : (
                      String.fromCharCode(65 + optionIndex)
                    )}
                  </div>
                  <span className="flex-1">{option}</span>
                </div>
              </button>
            );
          })}

          {/* Feedback */}
          {showFeedback && (
            <div className={cn(
              "mt-4 p-4 rounded-lg",
              isCorrect ? "bg-success/10 border border-success/20" : "bg-amber-50 border border-amber-200 dark:bg-amber-950/20 dark:border-amber-900"
            )}>
              <div className="flex items-start gap-3">
                {isCorrect ? (
                  <CheckCircle className="h-5 w-5 text-success shrink-0 mt-0.5" />
                ) : (
                  <Lightbulb className="h-5 w-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                )}
                <div>
                  <p className={cn(
                    "font-medium",
                    isCorrect ? "text-success" : "text-amber-700 dark:text-amber-400"
                  )}>
                    {isCorrect ? "Riktig!" : "Ikke helt riktig"}
                  </p>
                  <p className="text-sm text-muted-foreground mt-1">
                    {isCorrect 
                      ? "Flott jobbet! Du forsto dette poenget." 
                      : `Riktig svar er: ${currentQuestion.options[currentQuestion.correct]}`
                    }
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex justify-end gap-2 pt-4">
            {!showFeedback ? (
              <Button 
                onClick={handleCheck}
                disabled={selectedAnswer === null}
              >
                Sjekk svar
              </Button>
            ) : (
              <>
                {!isCorrect && (
                  <Button variant="outline" onClick={handleRetry}>
                    <RotateCcw className="mr-2 h-4 w-4" />
                    Prøv igjen
                  </Button>
                )}
                <Button onClick={handleNext}>
                  {currentIndex < practiceQuestions.length - 1 ? (
                    <>
                      Neste
                      <ChevronRight className="ml-2 h-4 w-4" />
                    </>
                  ) : (
                    <>
                      Fullfør øving
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </>
                  )}
                </Button>
              </>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// Main Interactive Learning Component
interface InteractiveLearningProps {
  introduction: string;
  keyPoints: string[];
  sections: Section[];
  quiz: Array<{ question: string; options: string[]; correct: number }>;
  onLearningComplete: () => void;
}

export function InteractiveLearning({
  introduction,
  keyPoints,
  sections,
  quiz,
  onLearningComplete
}: InteractiveLearningProps) {
  const [currentPhase, setCurrentPhase] = useState(0);
  const [completedPhases, setCompletedPhases] = useState<Set<number>>(new Set());
  const [practiceScore, setPracticeScore] = useState<number | null>(null);

  const phase = LEARNING_PHASES[currentPhase];
  const canProceed = completedPhases.has(currentPhase) || currentPhase === 0;

  const handlePhaseComplete = () => {
    setCompletedPhases(prev => {
      const newSet = new Set(prev);
      newSet.add(currentPhase);
      return newSet;
    });

    if (currentPhase < LEARNING_PHASES.length - 1) {
      setCurrentPhase(prev => prev + 1);
    } else {
      onLearningComplete();
    }
  };

  const handlePracticeComplete = (score: number) => {
    setPracticeScore(score);
    handlePhaseComplete();
  };

  const progress = ((completedPhases.size) / (LEARNING_PHASES.length - 1)) * 100;

  return (
    <div className="space-y-6">
      {/* Learning Progress Header */}
      <Card className="bg-gradient-to-r from-primary/5 to-primary/10 border-primary/20">
        <CardContent className="py-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" />
              <span className="font-semibold">Interaktiv læring</span>
            </div>
            <Badge variant="default" className="gap-1">
              <Trophy className="h-3 w-3" />
              {Math.round(progress)}% fullført
            </Badge>
          </div>
          
          {/* Phase indicators */}
          <div className="flex items-center gap-1">
            {LEARNING_PHASES.slice(0, -1).map((p, index) => (
              <div key={p.type} className="flex-1 flex items-center">
                <button
                  onClick={() => completedPhases.has(index) || index === 0 ? setCurrentPhase(index) : null}
                  disabled={!completedPhases.has(index) && index !== 0 && index > currentPhase}
                  className={cn(
                    "relative flex flex-col items-center w-full",
                    (!completedPhases.has(index) && index !== 0 && index > currentPhase) && "opacity-50 cursor-not-allowed"
                  )}
                >
                  <div className={cn(
                    "h-3 w-full rounded-full transition-colors",
                    completedPhases.has(index) 
                      ? "bg-success" 
                      : index === currentPhase 
                      ? "bg-primary" 
                      : "bg-muted"
                  )} />
                  <span className={cn(
                    "text-xs mt-1 hidden sm:block",
                    index === currentPhase ? "text-primary font-medium" : "text-muted-foreground"
                  )}>
                    {p.title}
                  </span>
                </button>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Current Phase Content */}
      {phase.type === 'intro' && (
        <div className="space-y-4">
          <div className="rounded-lg bg-primary/5 border border-primary/20 p-6">
            <div className="flex gap-4">
              <div className="hidden sm:block">
                <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                  <Lightbulb className="h-6 w-6 text-primary" />
                </div>
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-primary mb-2 text-lg">Introduksjon</h3>
                <p className="text-foreground leading-relaxed text-lg">{introduction}</p>
              </div>
            </div>
          </div>
          <div className="flex justify-end">
            <Button onClick={handlePhaseComplete} className="gap-2">
              Jeg forstår, gå videre
              <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      {phase.type === 'flashcard' && (
        <FlashcardDeck 
          keyPoints={keyPoints} 
          onComplete={handlePhaseComplete} 
        />
      )}

      {phase.type === 'explore' && (
        <SectionExplorer 
          sections={sections} 
          onComplete={handlePhaseComplete} 
        />
      )}

      {phase.type === 'practice' && quiz.length > 0 && (
        <PracticeMode 
          questions={quiz} 
          onComplete={handlePracticeComplete} 
        />
      )}

      {phase.type === 'ready' && (
        <Card className="border-success bg-success/5">
          <CardContent className="py-8 text-center">
            <div className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-success/20 mb-4">
              <Trophy className="h-8 w-8 text-success" />
            </div>
            <h3 className="text-xl font-bold mb-2">Du er klar for quizen!</h3>
            <p className="text-muted-foreground mb-4">
              Du har gått gjennom alt læringsmaterialet. 
              {practiceScore !== null && (
                <span className="block mt-1">
                  Du fikk {practiceScore}% på øvingsspørsmålene.
                </span>
              )}
            </p>
            <Button onClick={onLearningComplete} size="lg" className="gap-2">
              <Target className="h-5 w-5" />
              Start kunnskapstest
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Skip to quiz option */}
      {currentPhase < LEARNING_PHASES.length - 1 && (
        <div className="text-center pt-4 border-t">
          <Button 
            variant="ghost" 
            onClick={onLearningComplete}
            className="text-muted-foreground"
          >
            Hopp over og gå direkte til quiz
          </Button>
        </div>
      )}
    </div>
  );
}
