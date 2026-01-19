import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { StatCard } from "@/components/ui/stat-card";
import { GraduationCap, BookOpen, Award, AlertCircle } from "lucide-react";
import { useCourses, useCourseStats, useExpiringCertificates, useAllEnrollments } from "@/hooks/useCourses";
import { CourseLibraryPanel } from "@/components/training/CourseLibraryPanel";
import { MyCoursesPanel } from "@/components/training/MyCoursesPanel";
import { CertificatesPanel } from "@/components/training/CertificatesPanel";
import { AdminEnrollmentsPanel } from "@/components/training/AdminEnrollmentsPanel";
import { useAuth } from "@/contexts/AuthContext";

export default function TrainingPage() {
  const [activeTab, setActiveTab] = useState("mine-kurs");
  const { isAdminOrManager } = useAuth();
  
  const { data: courses = [] } = useCourses();
  const { data: stats } = useCourseStats();
  const { data: expiringCerts = [] } = useExpiringCertificates(30);
  const { data: allEnrollments = [] } = useAllEnrollments();

  const activeCourses = courses.length;
  const completedCount = stats?.completed || 0;
  const inProgressCount = stats?.inProgress || 0;
  const expiringCount = expiringCerts.length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Opplæring</h1>
        <p className="text-muted-foreground">
          Kurs, sertifikater og kompetanseutvikling
        </p>
      </div>

      {/* Stats */}
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

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="mine-kurs">Mine kurs</TabsTrigger>
          <TabsTrigger value="kursbibliotek">Kursbibliotek</TabsTrigger>
          <TabsTrigger value="sertifikater">Sertifikater</TabsTrigger>
          {isAdminOrManager() && (
            <TabsTrigger value="administrer">Administrer</TabsTrigger>
          )}
        </TabsList>

        <TabsContent value="mine-kurs" className="mt-6">
          <MyCoursesPanel />
        </TabsContent>

        <TabsContent value="kursbibliotek" className="mt-6">
          <CourseLibraryPanel courses={courses} />
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
  );
}
