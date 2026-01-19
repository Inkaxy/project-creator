import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Award, AlertCircle, Calendar, Download, FileText, CheckCircle } from "lucide-react";
import { useEmployeeEnrollments, useExpiringCertificates } from "@/hooks/useCourses";
import { useAuth } from "@/contexts/AuthContext";
import { format, differenceInDays, isPast } from "date-fns";
import { nb } from "date-fns/locale";

export function CertificatesPanel() {
  const { user } = useAuth();
  const { data: enrollments = [] } = useEmployeeEnrollments(user?.id || null);
  const { data: expiringCerts = [] } = useExpiringCertificates(30);

  // Get all completed courses with certificates
  const certificates = enrollments.filter(
    e => e.completed_at && e.certificate_expires_at
  );

  // My expiring certificates
  const myExpiringCerts = expiringCerts.filter(
    e => e.employee_id === user?.id
  );

  // Active certificates (not expired)
  const activeCerts = certificates.filter(
    e => !isPast(new Date(e.certificate_expires_at!))
  );

  // Expired certificates
  const expiredCerts = certificates.filter(
    e => isPast(new Date(e.certificate_expires_at!))
  );

  const getDaysUntilExpiry = (date: string) => {
    return differenceInDays(new Date(date), new Date());
  };

  const getExpiryBadge = (date: string) => {
    const days = getDaysUntilExpiry(date);
    if (days < 0) {
      return <Badge variant="destructive">Utløpt</Badge>;
    } else if (days <= 7) {
      return <Badge variant="destructive">Utløper om {days} dager</Badge>;
    } else if (days <= 30) {
      return <Badge variant="warning" className="bg-warning text-warning-foreground">Utløper om {days} dager</Badge>;
    }
    return <Badge variant="outline">Gyldig</Badge>;
  };

  return (
    <div className="space-y-6">
      {/* Expiring soon warning */}
      {myExpiringCerts.length > 0 && (
        <Card className="border-warning">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-warning">
              <AlertCircle className="h-5 w-5" />
              Sertifikater som utløper snart
            </CardTitle>
            <CardDescription>
              {myExpiringCerts.length} sertifikat{myExpiringCerts.length > 1 ? 'er' : ''} utløper innen 30 dager
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {myExpiringCerts.map(cert => (
                <div key={cert.id} className="flex items-center justify-between rounded-lg bg-muted/50 p-3">
                  <div className="flex items-center gap-3">
                    <Award className="h-5 w-5 text-warning" />
                    <div>
                      <p className="font-medium">{cert.courses?.title}</p>
                      <p className="text-sm text-muted-foreground">
                        Utløper {format(new Date(cert.certificate_expires_at!), "d. MMM yyyy", { locale: nb })}
                      </p>
                    </div>
                  </div>
                  <Button variant="outline" size="sm">
                    Forny
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Active certificates */}
      <div className="space-y-4">
        <h3 className="font-semibold">Aktive sertifikater</h3>
        {activeCerts.length === 0 ? (
          <Card>
            <CardContent className="py-8 text-center">
              <Award className="mx-auto h-10 w-10 text-muted-foreground/50" />
              <p className="mt-3 text-muted-foreground">Ingen aktive sertifikater</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {activeCerts.map(cert => (
              <CertificateCard key={cert.id} enrollment={cert} />
            ))}
          </div>
        )}
      </div>

      {/* Expired certificates */}
      {expiredCerts.length > 0 && (
        <div className="space-y-4">
          <h3 className="font-semibold text-muted-foreground">Utløpte sertifikater</h3>
          <div className="grid gap-4 md:grid-cols-2">
            {expiredCerts.map(cert => (
              <CertificateCard key={cert.id} enrollment={cert} expired />
            ))}
          </div>
        </div>
      )}

      {/* Upload external certificate */}
      <Card className="border-dashed">
        <CardContent className="py-8">
          <div className="text-center">
            <FileText className="mx-auto h-10 w-10 text-muted-foreground/50" />
            <h4 className="mt-3 font-medium">Last opp eksternt sertifikat</h4>
            <p className="mt-1 text-sm text-muted-foreground">
              F.eks. truckførerbevis, hygienesertifikat eller andre eksterne kurs
            </p>
            <Button variant="outline" className="mt-4">
              Last opp sertifikat
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

interface CertificateCardProps {
  enrollment: {
    id: string;
    completed_at: string | null;
    certificate_expires_at: string | null;
    score: number | null;
    courses?: {
      title: string;
      category: string | null;
    };
  };
  expired?: boolean;
}

function CertificateCard({ enrollment, expired }: CertificateCardProps) {
  const course = enrollment.courses;
  if (!course) return null;

  const daysUntil = enrollment.certificate_expires_at 
    ? differenceInDays(new Date(enrollment.certificate_expires_at), new Date())
    : null;

  return (
    <Card className={expired ? "opacity-60" : ""}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-start gap-3">
            <div className={`rounded-lg p-2 ${expired ? "bg-muted" : "bg-success/10"}`}>
              <Award className={`h-5 w-5 ${expired ? "text-muted-foreground" : "text-success"}`} />
            </div>
            <div>
              <CardTitle className="text-base">{course.title}</CardTitle>
              {course.category && (
                <Badge variant="outline" className="mt-1">
                  {course.category}
                </Badge>
              )}
            </div>
          </div>
          {enrollment.certificate_expires_at && (
            daysUntil !== null && daysUntil < 0 ? (
              <Badge variant="destructive">Utløpt</Badge>
            ) : daysUntil !== null && daysUntil <= 30 ? (
              <Badge variant="warning" className="bg-warning text-warning-foreground">
                {daysUntil}d igjen
              </Badge>
            ) : (
              <Badge variant="outline" className="border-success text-success">
                <CheckCircle className="mr-1 h-3 w-3" />
                Gyldig
              </Badge>
            )
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex items-center gap-4 text-sm text-muted-foreground">
          {enrollment.completed_at && (
            <div className="flex items-center gap-1">
              <CheckCircle className="h-4 w-4" />
              Fullført {format(new Date(enrollment.completed_at), "d. MMM yyyy", { locale: nb })}
            </div>
          )}
          {enrollment.score !== null && (
            <span>Score: {enrollment.score}%</span>
          )}
        </div>
        
        {enrollment.certificate_expires_at && (
          <div className="flex items-center gap-1 text-sm text-muted-foreground">
            <Calendar className="h-4 w-4" />
            Utløper: {format(new Date(enrollment.certificate_expires_at), "d. MMM yyyy", { locale: nb })}
          </div>
        )}

        <div className="flex gap-2">
          <Button variant="outline" size="sm" className="flex-1">
            <Download className="mr-2 h-4 w-4" />
            Last ned
          </Button>
          {expired && (
            <Button size="sm" className="flex-1">
              Forny sertifikat
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
