import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { StatCard } from "@/components/ui/stat-card";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  GraduationCap, 
  BookOpen, 
  Award, 
  AlertCircle, 
  Shield, 
  Utensils, 
  Flame, 
  Users,
  ChevronRight
} from "lucide-react";
import { useCourses, useCourseStats, useExpiringCertificates, useAllEnrollments } from "@/hooks/useCourses";
import { CourseLibraryPanel } from "@/components/training/CourseLibraryPanel";
import { MyCoursesPanel } from "@/components/training/MyCoursesPanel";
import { CertificatesPanel } from "@/components/training/CertificatesPanel";
import { AdminEnrollmentsPanel } from "@/components/training/AdminEnrollmentsPanel";
import { useAuth } from "@/contexts/AuthContext";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";

interface CourseCategory {
  id: string;
  title: string;
  icon: React.ElementType;
  description: string;
  color: string;
}

const COURSE_CATEGORIES: CourseCategory[] = [
  { 
    id: "all", 
    title: "Alle kurs", 
    icon: BookOpen, 
    description: "Oversikt over alle tilgjengelige kurs",
    color: "text-primary"
  },
  { 
    id: "hms", 
    title: "HMS", 
    icon: Shield, 
    description: "Helse, miljø og sikkerhet",
    color: "text-green-600"
  },
  { 
    id: "hms-ledere", 
    title: "HMS for Ledere", 
    icon: Shield, 
    description: "Lovpålagt HMS-opplæring for ledere",
    color: "text-emerald-600"
  },
  { 
    id: "mattrygghet", 
    title: "Mattrygghet", 
    icon: Utensils, 
    description: "Hygiene og matsikkerhet",
    color: "text-blue-600"
  },
  { 
    id: "brannvern", 
    title: "Brannvern", 
    icon: Flame, 
    description: "Forebygging og beredskap",
    color: "text-orange-600"
  },
  { 
    id: "ledelse", 
    title: "Ledelse", 
    icon: Users, 
    description: "Lederutvikling og opplæring",
    color: "text-purple-600"
  },
  { 
    id: "obligatorisk", 
    title: "Obligatorisk", 
    icon: AlertCircle, 
    description: "Påkrevde kurs for ansatte",
    color: "text-destructive"
  },
];

export default function TrainingPage() {
  const [activeTab, setActiveTab] = useState("mine-kurs");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const { isAdminOrManager } = useAuth();
  
  const { data: courses = [] } = useCourses();
  const { data: stats } = useCourseStats();
  const { data: expiringCerts = [] } = useExpiringCertificates(30);
  const { data: allEnrollments = [] } = useAllEnrollments();

  const activeCourses = courses.length;
  const completedCount = stats?.completed || 0;
  const inProgressCount = stats?.inProgress || 0;
  const expiringCount = expiringCerts.length;

  // Count courses per category
  const getCategoryCount = (categoryId: string) => {
    if (categoryId === "all") return courses.length;
    if (categoryId === "obligatorisk") return courses.filter(c => c.is_required).length;
    return courses.filter(c => c.category === categoryId).length;
  };

  // Filter courses based on selected category
  const filteredCourses = selectedCategory === "all" 
    ? courses 
    : selectedCategory === "obligatorisk"
    ? courses.filter(c => c.is_required)
    : courses.filter(c => c.category === selectedCategory);

  return (
    <div className="flex gap-6">
      {/* Sidebar */}
      <aside className="hidden w-64 shrink-0 lg:block">
        <Card className="sticky top-4">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Kurskategorier</CardTitle>
            <CardDescription>Naviger etter tema</CardDescription>
          </CardHeader>
          <CardContent className="p-2">
            <nav className="space-y-1">
              {COURSE_CATEGORIES.map((category) => {
                const count = getCategoryCount(category.id);
                const isActive = selectedCategory === category.id;
                const Icon = category.icon;
                
                return (
                  <button
                    key={category.id}
                    onClick={() => {
                      setSelectedCategory(category.id);
                      setActiveTab("kursbibliotek");
                    }}
                    className={cn(
                      "flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors text-left",
                      isActive
                        ? "bg-accent text-accent-foreground"
                        : "hover:bg-muted text-muted-foreground hover:text-foreground"
                    )}
                  >
                    <Icon className={cn("h-5 w-5 shrink-0", isActive ? category.color : "")} />
                    <span className="flex-1 truncate">{category.title}</span>
                    <Badge variant={isActive ? "default" : "secondary"} className="h-5 min-w-5 justify-center text-xs">
                      {count}
                    </Badge>
                  </button>
                );
              })}
            </nav>
          </CardContent>
        </Card>
        
        {/* Quick stats in sidebar */}
        <Card className="mt-4">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Din fremgang</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Fullført</span>
              <span className="font-medium">{completedCount} kurs</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Pågående</span>
              <span className="font-medium">{inProgressCount} kurs</span>
            </div>
            {expiringCount > 0 && (
              <div className="flex items-center justify-between text-sm">
                <span className="text-warning">Utløper snart</span>
                <span className="font-medium text-warning">{expiringCount} sert.</span>
              </div>
            )}
          </CardContent>
        </Card>
      </aside>

      {/* Main content */}
      <div className="flex-1 min-w-0 space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Opplæring</h1>
          <p className="text-muted-foreground">
            Kurs, sertifikater og kompetanseutvikling
          </p>
        </div>

        {/* Stats - mobile/tablet */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            title="Tilgjengelige kurs"
            value={activeCourses}
            subtitle="aktive kurs"
            icon={BookOpen}
            variant="default"
          />
          <StatCard
            title="Fullførte"
            value={completedCount}
            subtitle="kurs fullført"
            icon={GraduationCap}
            variant="success"
          />
          <StatCard
            title="Pågående"
            value={inProgressCount}
            subtitle="under gjennomføring"
            icon={BookOpen}
            variant="default"
          />
          <StatCard
            title="Utløper snart"
            value={expiringCount}
            subtitle="sertifikater (30 dager)"
            icon={expiringCount > 0 ? AlertCircle : Award}
            variant={expiringCount > 0 ? "warning" : "default"}
          />
        </div>

        {/* Mobile category navigation */}
        <div className="flex gap-2 overflow-x-auto pb-2 lg:hidden">
          {COURSE_CATEGORIES.map((category) => {
            const isActive = selectedCategory === category.id;
            const Icon = category.icon;
            
            return (
              <button
                key={category.id}
                onClick={() => {
                  setSelectedCategory(category.id);
                  setActiveTab("kursbibliotek");
                }}
                className={cn(
                  "flex shrink-0 items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition-colors",
                  isActive
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground hover:text-foreground"
                )}
              >
                <Icon className="h-4 w-4" />
                {category.title}
              </button>
            );
          })}
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList>
            <TabsTrigger value="mine-kurs">Mine kurs</TabsTrigger>
            <TabsTrigger value="kursbibliotek">
              Kursbibliotek
              {selectedCategory !== "all" && (
                <span className="ml-1 text-xs">
                  ({COURSE_CATEGORIES.find(c => c.id === selectedCategory)?.title})
                </span>
              )}
            </TabsTrigger>
            <TabsTrigger value="sertifikater">Sertifikater</TabsTrigger>
            {isAdminOrManager() && (
              <TabsTrigger value="administrer">Administrer</TabsTrigger>
            )}
          </TabsList>

          <TabsContent value="mine-kurs" className="mt-6">
            <MyCoursesPanel />
          </TabsContent>

          <TabsContent value="kursbibliotek" className="mt-6">
            <CourseLibraryPanel 
              courses={filteredCourses} 
              selectedCategory={selectedCategory}
              onCategoryChange={setSelectedCategory}
            />
          </TabsContent>

          <TabsContent value="sertifikater" className="mt-6">
            <CertificatesPanel />
          </TabsContent>

          {isAdminOrManager() && (
            <TabsContent value="administrer" className="mt-6">
              <AdminEnrollmentsPanel enrollments={allEnrollments} />
            </TabsContent>
          )}
        </Tabs>
      </div>
    </div>
  );
}
