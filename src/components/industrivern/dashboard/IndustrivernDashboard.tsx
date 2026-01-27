import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  Shield, 
  Calendar, 
  Users, 
  AlertTriangle, 
  CheckCircle2,
  Clock,
  Wrench
} from "lucide-react";
import { useIndustrivernCompliance } from "@/hooks/useIndustrivernCompliance";
import { useIndustrivernPersonnel } from "@/hooks/useIndustrivernPersonnel";
import { useUpcomingExercises } from "@/hooks/useIndustrivernExercises";
import { useExpiringQualifications } from "@/hooks/useIndustrivernQualifications";
import { format } from "date-fns";
import { nb } from "date-fns/locale";
import { INDUSTRIVERN_ROLE_LABELS, EXERCISE_TYPE_LABELS } from "@/types/industrivern";

export function IndustrivernDashboard() {
  const { data: compliance, isLoading: loadingCompliance } = useIndustrivernCompliance();
  const { data: personnel, isLoading: loadingPersonnel } = useIndustrivernPersonnel();
  const { data: upcomingExercises, isLoading: loadingExercises } = useUpcomingExercises(3);
  const { data: expiringQuals, isLoading: loadingQuals } = useExpiringQualifications(60);

  const getComplianceColor = (score: number) => {
    if (score >= 80) return "text-green-600";
    if (score >= 60) return "text-yellow-600";
    return "text-red-600";
  };

  const getStatusIcon = (status: "ok" | "warning" | "error") => {
    switch (status) {
      case "ok":
        return <CheckCircle2 className="h-4 w-4 text-green-600" />;
      case "warning":
        return <AlertTriangle className="h-4 w-4 text-yellow-600" />;
      case "error":
        return <AlertTriangle className="h-4 w-4 text-red-600" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Stats Row */}
      <div className="grid gap-4 md:grid-cols-3">
        {/* Compliance Score */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Compliance-score</CardTitle>
            <Shield className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {loadingCompliance ? (
              <Skeleton className="h-12 w-24" />
            ) : (
              <>
                <div className={`text-3xl font-bold ${getComplianceColor(compliance?.totalScore || 0)}`}>
                  {compliance?.totalScore}%
                </div>
                <Progress 
                  value={compliance?.totalScore || 0} 
                  className="mt-2 h-2"
                />
                <p className="text-xs text-muted-foreground mt-2">
                  Basert på forskriftskravene
                </p>
              </>
            )}
          </CardContent>
        </Card>

        {/* Next Exercise */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Neste øvelse</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {loadingExercises ? (
              <Skeleton className="h-12 w-full" />
            ) : upcomingExercises && upcomingExercises.length > 0 ? (
              <>
                <div className="text-lg font-semibold">
                  {format(new Date(upcomingExercises[0].planned_date), "d. MMM yyyy", { locale: nb })}
                </div>
                <p className="text-sm text-muted-foreground truncate">
                  {upcomingExercises[0].title}
                </p>
                <Badge variant="outline" className="mt-2">
                  {EXERCISE_TYPE_LABELS[upcomingExercises[0].exercise_type]}
                </Badge>
              </>
            ) : (
              <div className="text-muted-foreground">
                Ingen planlagte øvelser
              </div>
            )}
          </CardContent>
        </Card>

        {/* Personnel Count */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Industrivern-personell</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {loadingPersonnel ? (
              <Skeleton className="h-12 w-20" />
            ) : (
              <>
                <div className="text-3xl font-bold">{personnel?.length || 0}</div>
                <p className="text-xs text-muted-foreground mt-2">
                  aktive medlemmer
                </p>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Compliance Details & Alerts Row */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* Compliance Breakdown */}
        <Card>
          <CardHeader>
            <CardTitle>Compliance-oversikt</CardTitle>
            <CardDescription>Status per forskriftsparagraf</CardDescription>
          </CardHeader>
          <CardContent>
            {loadingCompliance ? (
              <div className="space-y-3">
                {[1, 2, 3, 4, 5, 6, 7].map((i) => (
                  <Skeleton key={i} className="h-8 w-full" />
                ))}
              </div>
            ) : (
              <div className="space-y-3">
                {compliance?.items.map((item) => (
                  <div key={item.paragraph} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {getStatusIcon(item.status)}
                      <span className="text-sm font-medium">{item.paragraph}</span>
                      <span className="text-sm text-muted-foreground">{item.name}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium">
                        {item.score}/{item.maxScore}%
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Alerts */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-yellow-600" />
              Krever oppmerksomhet
            </CardTitle>
            <CardDescription>Varsler og påminnelser</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {/* Expiring Qualifications */}
              {loadingQuals ? (
                <Skeleton className="h-16 w-full" />
              ) : expiringQuals && expiringQuals.length > 0 ? (
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm font-medium">
                    <Clock className="h-4 w-4 text-yellow-600" />
                    Kvalifikasjoner som utløper snart
                  </div>
                  {expiringQuals.slice(0, 3).map((qual: any) => (
                    <div key={qual.id} className="ml-6 text-sm text-muted-foreground">
                      {qual.profiles?.full_name} - {qual.industrivern_qualifications?.name}
                      <span className="ml-2 text-yellow-600">
                        ({format(new Date(qual.expires_date), "d. MMM", { locale: nb })})
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                  Ingen utløpende kvalifikasjoner
                </div>
              )}

              {/* Compliance warnings */}
              {compliance?.items.filter((i) => i.status !== "ok").map((item) => (
                <div key={item.paragraph} className="space-y-1">
                  <div className="flex items-center gap-2 text-sm font-medium">
                    {getStatusIcon(item.status)}
                    {item.paragraph} {item.name}
                  </div>
                  <p className="ml-6 text-sm text-muted-foreground">{item.details}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Organization Chart Preview */}
      <Card>
        <CardHeader>
          <CardTitle>Industrivernorganisasjon</CardTitle>
          <CardDescription>Oversikt over roller og personell</CardDescription>
        </CardHeader>
        <CardContent>
          {loadingPersonnel ? (
            <Skeleton className="h-32 w-full" />
          ) : personnel && personnel.length > 0 ? (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {Object.entries(
                personnel.reduce((acc, p) => {
                  if (!acc[p.role]) acc[p.role] = [];
                  acc[p.role].push(p);
                  return acc;
                }, {} as Record<string, typeof personnel>)
              ).map(([role, members]) => (
                <div key={role} className="rounded-lg border p-3">
                  <div className="font-medium text-sm mb-2">
                    {INDUSTRIVERN_ROLE_LABELS[role as keyof typeof INDUSTRIVERN_ROLE_LABELS] || role}
                  </div>
                  <div className="space-y-1">
                    {members.map((m) => (
                      <div key={m.id} className="text-sm text-muted-foreground flex items-center gap-1">
                        {m.profiles?.full_name}
                        {m.is_deputy && <Badge variant="outline" className="text-xs">Stedfortreder</Badge>}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Ingen industrivern-personell registrert</p>
              <p className="text-sm">Gå til Organisasjon-fanen for å legge til personell</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
