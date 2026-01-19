import { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { MainLayout } from "@/components/layout/MainLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { 
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Separator } from "@/components/ui/separator";
import { 
  Home, 
  GraduationCap, 
  ChevronLeft, 
  ChevronRight, 
  CheckCircle, 
  Clock,
  BookOpen,
  PlayCircle,
  FileText,
  Award
} from "lucide-react";
import { 
  useCourses, 
  useCourseModules, 
  useEmployeeEnrollments,
  useUpdateEnrollmentProgress,
  useCompleteCourse,
  CourseModule
} from "@/hooks/useCourses";
import { useAuth } from "@/contexts/AuthContext";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export default function CourseViewerPage() {
  const { courseId } = useParams<{ courseId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const { data: courses = [] } = useCourses();
  const { data: modules = [], isLoading: modulesLoading } = useCourseModules(courseId || null);
  const { data: enrollments = [] } = useEmployeeEnrollments(user?.id || null);
  const updateProgress = useUpdateEnrollmentProgress();
  const completeCourse = useCompleteCourse();
  
  const course = courses.find(c => c.id === courseId);
  const enrollment = enrollments.find(e => e.course_id === courseId);
  
  const [currentModuleIndex, setCurrentModuleIndex] = useState(0);
  const [completedModules, setCompletedModules] = useState<Set<string>>(new Set());

  // Initialize current module from enrollment
  useEffect(() => {
    if (enrollment?.current_module_id && modules.length > 0) {
      const index = modules.findIndex(m => m.id === enrollment.current_module_id);
      if (index >= 0) {
        setCurrentModuleIndex(index);
      }
    }
  }, [enrollment, modules]);

  // Calculate progress
  const progressPercent = modules.length > 0 
    ? Math.round((completedModules.size / modules.length) * 100) 
    : 0;

  const currentModule = modules[currentModuleIndex];
  const isLastModule = currentModuleIndex === modules.length - 1;
  const isFirstModule = currentModuleIndex === 0;
  const allModulesCompleted = modules.length > 0 && completedModules.size === modules.length;

  const handleModuleComplete = () => {
    if (!currentModule) return;
    
    const newCompleted = new Set(completedModules);
    newCompleted.add(currentModule.id);
    setCompletedModules(newCompleted);

    const newProgress = Math.round((newCompleted.size / modules.length) * 100);
    
    if (enrollment) {
      updateProgress.mutate({
        enrollmentId: enrollment.id,
        progressPercent: newProgress,
        currentModuleId: currentModule.id,
      });
    }

    if (isLastModule && newCompleted.size === modules.length) {
      toast.success("Gratulerer! Du har fullført alle moduler.");
    } else if (!isLastModule) {
      setCurrentModuleIndex(prev => prev + 1);
    }
  };

  const handleCompleteCourse = () => {
    if (!enrollment || !course) return;
    
    completeCourse.mutate({
      enrollmentId: enrollment.id,
      certificateValidMonths: course.certificate_valid_months || undefined,
    }, {
      onSuccess: () => {
        navigate("/opplaering");
      }
    });
  };

  const handleNavigateModule = (index: number) => {
    setCurrentModuleIndex(index);
    if (enrollment && modules[index]) {
      updateProgress.mutate({
        enrollmentId: enrollment.id,
        progressPercent: Math.round((completedModules.size / modules.length) * 100),
        currentModuleId: modules[index].id,
      });
    }
  };

  if (!course) {
    return (
      <MainLayout>
        <div className="flex flex-col items-center justify-center py-12">
          <BookOpen className="h-12 w-12 text-muted-foreground mb-4" />
          <h2 className="text-xl font-semibold mb-2">Kurs ikke funnet</h2>
          <p className="text-muted-foreground mb-4">Kurset du leter etter eksisterer ikke.</p>
          <Button onClick={() => navigate("/opplaering")}>
            Tilbake til opplæring
          </Button>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Breadcrumb */}
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink asChild>
                <Link to="/" className="flex items-center gap-1">
                  <Home className="h-4 w-4" />
                  <span>Dashboard</span>
                </Link>
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbLink asChild>
                <Link to="/opplaering" className="flex items-center gap-1">
                  <GraduationCap className="h-4 w-4" />
                  <span>Opplæring</span>
                </Link>
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>{course.title}</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>

        {/* Course header */}
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-4">
            <Button variant="outline" size="icon" onClick={() => navigate("/opplaering")}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <div>
              <h1 className="text-2xl font-bold">{course.title}</h1>
              <div className="flex items-center gap-3 mt-1">
                {course.category && (
                  <Badge variant="outline">{course.category}</Badge>
                )}
                {course.is_required && (
                  <Badge variant="destructive">Påkrevd</Badge>
                )}
                {course.duration_minutes && (
                  <span className="text-sm text-muted-foreground flex items-center gap-1">
                    <Clock className="h-4 w-4" />
                    {course.duration_minutes} min
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Progress bar */}
        <Card>
          <CardContent className="py-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">Din fremgang</span>
              <span className="text-sm font-semibold">{progressPercent}%</span>
            </div>
            <Progress value={progressPercent} className="h-2" />
            <p className="text-xs text-muted-foreground mt-2">
              {completedModules.size} av {modules.length} moduler fullført
            </p>
          </CardContent>
        </Card>

        <div className="flex gap-6">
          {/* Module navigation sidebar */}
          <aside className="hidden w-72 shrink-0 lg:block">
            <Card className="sticky top-4">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                  Kursinnhold
                </CardTitle>
                <CardDescription>
                  {modules.length} moduler
                </CardDescription>
              </CardHeader>
              <CardContent className="p-2">
                <nav className="space-y-1">
                  {modules.map((module, index) => {
                    const isActive = index === currentModuleIndex;
                    const isCompleted = completedModules.has(module.id);
                    
                    return (
                      <button
                        key={module.id}
                        onClick={() => handleNavigateModule(index)}
                        className={cn(
                          "flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-left transition-colors",
                          isActive
                            ? "bg-primary text-primary-foreground"
                            : isCompleted
                            ? "bg-success/10 text-success hover:bg-success/20"
                            : "hover:bg-accent text-foreground"
                        )}
                      >
                        <div className={cn(
                          "flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-medium",
                          isActive
                            ? "bg-primary-foreground/20 text-primary-foreground"
                            : isCompleted
                            ? "bg-success text-success-foreground"
                            : "bg-muted text-muted-foreground"
                        )}>
                          {isCompleted ? <CheckCircle className="h-4 w-4" /> : index + 1}
                        </div>
                        <span className="flex-1 truncate">{module.title}</span>
                      </button>
                    );
                  })}
                </nav>
              </CardContent>
            </Card>
          </aside>

          {/* Main content area */}
          <div className="flex-1 min-w-0 space-y-6">
            {modulesLoading ? (
              <Card>
                <CardContent className="py-12">
                  <div className="flex flex-col items-center justify-center">
                    <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
                    <p className="mt-4 text-muted-foreground">Laster kursinnhold...</p>
                  </div>
                </CardContent>
              </Card>
            ) : modules.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <FileText className="mx-auto h-12 w-12 text-muted-foreground/50" />
                  <p className="mt-4 text-muted-foreground">
                    Dette kurset har ingen moduler ennå.
                  </p>
                  <Button 
                    variant="outline" 
                    className="mt-4"
                    onClick={() => navigate("/opplaering")}
                  >
                    Tilbake til opplæring
                  </Button>
                </CardContent>
              </Card>
            ) : currentModule ? (
              <>
                {/* Module content */}
                <Card>
                  <CardHeader>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                      <span>Modul {currentModuleIndex + 1} av {modules.length}</span>
                      {currentModule.duration_minutes && (
                        <>
                          <span>•</span>
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {currentModule.duration_minutes} min
                          </span>
                        </>
                      )}
                    </div>
                    <CardTitle className="text-xl">{currentModule.title}</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {/* Module content rendering based on content_type */}
                    <ModuleContentRenderer module={currentModule} />
                    
                    <Separator />
                    
                    {/* Navigation buttons */}
                    <div className="flex items-center justify-between">
                      <Button
                        variant="outline"
                        onClick={() => handleNavigateModule(currentModuleIndex - 1)}
                        disabled={isFirstModule}
                      >
                        <ChevronLeft className="mr-2 h-4 w-4" />
                        Forrige
                      </Button>
                      
                      <div className="flex gap-2">
                        {!completedModules.has(currentModule.id) && (
                          <Button onClick={handleModuleComplete}>
                            <CheckCircle className="mr-2 h-4 w-4" />
                            Marker som fullført
                          </Button>
                        )}
                        
                        {!isLastModule ? (
                          <Button
                            onClick={() => handleNavigateModule(currentModuleIndex + 1)}
                          >
                            Neste
                            <ChevronRight className="ml-2 h-4 w-4" />
                          </Button>
                        ) : allModulesCompleted ? (
                          <Button 
                            onClick={handleCompleteCourse}
                            disabled={completeCourse.isPending}
                          >
                            <Award className="mr-2 h-4 w-4" />
                            Fullfør kurs
                          </Button>
                        ) : null}
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Mobile module navigation */}
                <div className="lg:hidden">
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm">Moduler</CardTitle>
                    </CardHeader>
                    <CardContent className="p-2">
                      <div className="flex gap-2 overflow-x-auto pb-2">
                        {modules.map((module, index) => {
                          const isActive = index === currentModuleIndex;
                          const isCompleted = completedModules.has(module.id);
                          
                          return (
                            <button
                              key={module.id}
                              onClick={() => handleNavigateModule(index)}
                              className={cn(
                                "flex shrink-0 h-10 w-10 items-center justify-center rounded-full text-sm font-medium transition-colors",
                                isActive
                                  ? "bg-primary text-primary-foreground"
                                  : isCompleted
                                  ? "bg-success text-success-foreground"
                                  : "bg-muted text-muted-foreground hover:bg-accent"
                              )}
                            >
                              {isCompleted ? <CheckCircle className="h-4 w-4" /> : index + 1}
                            </button>
                          );
                        })}
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </>
            ) : null}
          </div>
        </div>
      </div>
    </MainLayout>
  );
}

// Component to render module content based on content_type
function ModuleContentRenderer({ module }: { module: CourseModule }) {
  const content = module.content || {};
  
  switch (module.content_type) {
    case "video":
      return (
        <div className="space-y-4">
          <div className="aspect-video rounded-lg bg-muted flex items-center justify-center">
            <div className="text-center">
              <PlayCircle className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">Video innhold</p>
              {content.url && (
                <a 
                  href={content.url as string} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-primary hover:underline"
                >
                  Åpne video
                </a>
              )}
            </div>
          </div>
          {content.description && (
            <p className="text-muted-foreground">{content.description as string}</p>
          )}
        </div>
      );
    
    case "text":
    case "article":
      return (
        <div className="prose prose-slate max-w-none dark:prose-invert">
          {content.body ? (
            <div dangerouslySetInnerHTML={{ __html: content.body as string }} />
          ) : content.text ? (
            <p>{content.text as string}</p>
          ) : (
            <p className="text-muted-foreground">Ingen innhold tilgjengelig for denne modulen.</p>
          )}
        </div>
      );
    
    case "quiz":
      return (
        <div className="space-y-4">
          <div className="rounded-lg border p-6 text-center">
            <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="font-medium">Quiz-modul</p>
            <p className="text-sm text-muted-foreground mt-1">
              Quizzer er under utvikling
            </p>
          </div>
        </div>
      );
    
    default:
      return (
        <div className="rounded-lg border p-6">
          <div className="flex items-start gap-4">
            <BookOpen className="h-8 w-8 text-muted-foreground shrink-0" />
            <div>
              <p className="font-medium">{module.title}</p>
              {content.description && (
                <p className="text-muted-foreground mt-2">{content.description as string}</p>
              )}
              {content.text && (
                <p className="mt-4">{content.text as string}</p>
              )}
              {!content.description && !content.text && (
                <p className="text-muted-foreground mt-2">
                  Les gjennom materialet og marker modulen som fullført når du er ferdig.
                </p>
              )}
            </div>
          </div>
        </div>
      );
  }
}
