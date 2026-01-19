import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { BookOpen, Play, CheckCircle, Clock, ExternalLink, Award } from "lucide-react";
import { useEmployeeEnrollments, useRequiredCoursesForEmployee, CourseEnrollment } from "@/hooks/useCourses";
import { useAuth } from "@/contexts/AuthContext";
import { format } from "date-fns";
import { nb } from "date-fns/locale";

export function MyCoursesPanel() {
  const { user } = useAuth();
  const { data: enrollments = [], isLoading } = useEmployeeEnrollments(user?.id || null);
  const { data: requiredData } = useRequiredCoursesForEmployee(user?.id || null);

  const inProgress = enrollments.filter(e => !e.completed_at && (e.progress_percent || 0) > 0);
  const notStarted = enrollments.filter(e => !e.completed_at && (e.progress_percent || 0) === 0);
  const completed = enrollments.filter(e => e.completed_at);
  const missingRequired = requiredData?.missing || [];

  if (isLoading) {
    return (
      <div className="grid gap-4 md:grid-cols-2">
        {[1, 2].map(i => (
          <Card key={i} className="animate-pulse">
            <CardHeader>
              <div className="h-4 w-1/2 rounded bg-muted" />
            </CardHeader>
            <CardContent>
              <div className="h-20 rounded bg-muted" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Missing required courses */}
      {missingRequired.length > 0 && (
        <Card className="border-warning">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-warning">
              <Award className="h-5 w-5" />
              Manglende obligatoriske kurs
            </CardTitle>
            <CardDescription>
              Du mangler {missingRequired.length} obligatoriske kurs
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {missingRequired.map(course => (
                <Badge key={course.id} variant="outline" className="border-warning text-warning">
                  {course.title}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* In progress */}
      {inProgress.length > 0 && (
        <div className="space-y-4">
          <h3 className="font-semibold">Pågående kurs</h3>
          <div className="grid gap-4 md:grid-cols-2">
            {inProgress.map(enrollment => (
              <CourseCard key={enrollment.id} enrollment={enrollment} status="in-progress" />
            ))}
          </div>
        </div>
      )}

      {/* Not started */}
      {notStarted.length > 0 && (
        <div className="space-y-4">
          <h3 className="font-semibold">Ikke påbegynt</h3>
          <div className="grid gap-4 md:grid-cols-2">
            {notStarted.map(enrollment => (
              <CourseCard key={enrollment.id} enrollment={enrollment} status="not-started" />
            ))}
          </div>
        </div>
      )}

      {/* Completed */}
      {completed.length > 0 && (
        <div className="space-y-4">
          <h3 className="font-semibold">Fullførte kurs</h3>
          <div className="grid gap-4 md:grid-cols-2">
            {completed.map(enrollment => (
              <CourseCard key={enrollment.id} enrollment={enrollment} status="completed" />
            ))}
          </div>
        </div>
      )}

      {/* Empty state */}
      {enrollments.length === 0 && missingRequired.length === 0 && (
        <Card>
          <CardContent className="py-12 text-center">
            <BookOpen className="mx-auto h-12 w-12 text-muted-foreground/50" />
            <p className="mt-4 text-muted-foreground">
              Du er ikke påmeldt noen kurs ennå
            </p>
            <p className="text-sm text-muted-foreground">
              Gå til kursbiblioteket for å melde deg på kurs
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

interface CourseCardProps {
  enrollment: CourseEnrollment;
  status: "in-progress" | "not-started" | "completed";
}

function CourseCard({ enrollment, status }: CourseCardProps) {
  const course = enrollment.courses;
  
  if (!course) return null;

  const progress = enrollment.progress_percent || 0;
  const isExternal = course.is_external && course.external_url;

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1">
            <CardTitle className="text-base">{course.title}</CardTitle>
            {course.category && (
              <Badge variant="outline" className="mt-1">
                {course.category}
              </Badge>
            )}
          </div>
          {status === "completed" && (
            <CheckCircle className="h-5 w-5 text-success" />
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {status === "in-progress" && (
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Fremgang</span>
              <span className="font-medium">{progress}%</span>
            </div>
            <Progress value={progress} className="h-2" />
          </div>
        )}

        {status === "completed" && enrollment.completed_at && (
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <div className="flex items-center gap-1">
              <CheckCircle className="h-4 w-4" />
              Fullført {format(new Date(enrollment.completed_at), "d. MMM yyyy", { locale: nb })}
            </div>
            {enrollment.score !== null && (
              <span>Score: {enrollment.score}%</span>
            )}
          </div>
        )}

        {status === "completed" && enrollment.certificate_expires_at && (
          <div className="flex items-center gap-1 text-sm">
            <Award className="h-4 w-4 text-muted-foreground" />
            <span className="text-muted-foreground">
              Sertifikat utløper: {format(new Date(enrollment.certificate_expires_at), "d. MMM yyyy", { locale: nb })}
            </span>
          </div>
        )}

        {status === "not-started" && (
          <div className="flex items-center gap-1 text-sm text-muted-foreground">
            <Clock className="h-4 w-4" />
            {course.duration_minutes ? `Ca. ${course.duration_minutes} min` : "Ukjent varighet"}
          </div>
        )}

        {isExternal ? (
          <Button className="w-full" variant="outline" asChild>
            <a href={course.external_url!} target="_blank" rel="noopener noreferrer">
              <ExternalLink className="mr-2 h-4 w-4" />
              {status === "completed" ? "Åpne på nytt" : "Start eksternt kurs"}
            </a>
          </Button>
        ) : status !== "completed" ? (
          <Button className="w-full">
            <Play className="mr-2 h-4 w-4" />
            {status === "in-progress" ? "Fortsett" : "Start kurs"}
          </Button>
        ) : null}
      </CardContent>
    </Card>
  );
}
