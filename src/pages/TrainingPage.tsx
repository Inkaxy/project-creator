import { useState } from "react";
import { Link } from "react-router-dom";
import { MainLayout } from "@/components/layout/MainLayout";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { StatCard } from "@/components/ui/stat-card";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { 
  GraduationCap, 
  BookOpen, 
  Award, 
  AlertCircle, 
  Shield, 
  Utensils, 
  Flame, 
  Users,
  Home,
  UserCog
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
    icon: UserCog, 
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

// Leader roles for HMS for Ledere filter
const LEADER_ROLES = ['daglig_leder', 'superadmin', 'avdelingsleder'];

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

  // Helper to check if course is for leaders
  const isLeaderCourse = (course: typeof courses[0]) => {
    if (!course.required_for_roles) return false;
    return course.required_for_roles.some(role => LEADER_ROLES.includes(role));
  };

  // Count courses per category
  const getCategoryCount = (categoryId: string) => {
    if (categoryId === "all") return courses.length;
    if (categoryId === "obligatorisk") return courses.filter(c => c.is_required).length;
    if (categoryId === "hms-ledere") return courses.filter(c => isLeaderCourse(c)).length;
    if (categoryId === "ik_mat") return courses.filter(c => c.category === "ik_mat").length;
    if (categoryId === "mattrygghet") return courses.filter(c => c.category === "ik_mat").length;
    if (categoryId === "brannvern") return courses.filter(c => c.category === "brann").length;
    return courses.filter(c => c.category === categoryId).length;
  };

  // Filter courses based on selected category
  const getFilteredCourses = () => {
    if (selectedCategory === "all") return courses;
    if (selectedCategory === "obligatorisk") return courses.filter(c => c.is_required);
    if (selectedCategory === "hms-ledere") return courses.filter(c => isLeaderCourse(c));
    if (selectedCategory === "mattrygghet") return courses.filter(c => c.category === "ik_mat");
    if (selectedCategory === "brannvern") return courses.filter(c => c.category === "brann");
    return courses.filter(c => c.category === selectedCategory);
  };

  const filteredCourses = getFilteredCourses();

  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Breadcrumb navigation */}
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
              <BreadcrumbPage>Opplæring</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>

        {/* Header */}
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
            <GraduationCap className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Opplæring</h1>
            <p className="text-muted-foreground">
              Kurs, sertifikater og kompetanseutvikling
            </p>
          </div>
        </div>

        <div className="flex gap-6">
          {/* Sidebar */}
          <aside className="hidden w-72 shrink-0 lg:block">
            <div className="sticky top-4 space-y-4">
              {/* Category Navigation */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                    Kurskategorier
                  </CardTitle>
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
                            "group flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all text-left",
                            isActive
                              ? "bg-primary text-primary-foreground shadow-sm"
                              : "hover:bg-accent text-foreground"
                          )}
                        >
                          <div className={cn(
                            "flex h-8 w-8 items-center justify-center rounded-md transition-colors",
                            isActive 
                              ? "bg-primary-foreground/20" 
                              : "bg-muted group-hover:bg-accent"
                          )}>
                            <Icon className={cn(
                              "h-4 w-4",
                              isActive ? "text-primary-foreground" : category.color
                            )} />
                          </div>
                          <span className="flex-1">{category.title}</span>
                          <Badge 
                            variant={isActive ? "secondary" : "outline"} 
                            className={cn(
                              "h-6 min-w-6 justify-center text-xs font-semibold",
                              isActive && "bg-primary-foreground/20 text-primary-foreground border-0"
                            )}
                          >
                            {count}
                          </Badge>
                        </button>
                      );
                    })}
                  </nav>
                </CardContent>
              </Card>
              
              {/* Quick stats in sidebar */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                    Din fremgang
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center justify-between rounded-lg bg-success/10 p-3">
                    <div className="flex items-center gap-2">
                      <GraduationCap className="h-4 w-4 text-success" />
                      <span className="text-sm font-medium">Fullført</span>
                    </div>
                    <span className="text-lg font-bold text-success">{completedCount}</span>
                  </div>
                  <div className="flex items-center justify-between rounded-lg bg-primary/10 p-3">
                    <div className="flex items-center gap-2">
                      <BookOpen className="h-4 w-4 text-primary" />
                      <span className="text-sm font-medium">Pågående</span>
                    </div>
                    <span className="text-lg font-bold text-primary">{inProgressCount}</span>
                  </div>
                  {expiringCount > 0 && (
                    <div className="flex items-center justify-between rounded-lg bg-warning/10 p-3">
                      <div className="flex items-center gap-2">
                        <AlertCircle className="h-4 w-4 text-warning" />
                        <span className="text-sm font-medium">Utløper snart</span>
                      </div>
                      <span className="text-lg font-bold text-warning">{expiringCount}</span>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </aside>

          {/* Main content */}
          <div className="flex-1 min-w-0 space-y-6">
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
      </div>
    </MainLayout>
  );
}
