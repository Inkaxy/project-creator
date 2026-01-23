import { useMemo } from "react";
import { format } from "date-fns";
import { nb } from "date-fns/locale";
import { AlertTriangle, CheckCircle, Info, User } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { AvatarWithInitials } from "@/components/ui/avatar-with-initials";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

interface SelfCertQuotaWithEmployee {
  id: string;
  employee_id: string;
  quota_type: string;
  period_start: string;
  period_end: string;
  days_used: number;
  occurrences_used: number;
  max_days_per_occurrence: number;
  max_days_per_period: number;
  max_occurrences_per_period: number | null;
  profiles?: {
    full_name: string;
    avatar_url: string | null;
    departments?: { name: string } | null;
  };
}

export function SelfCertQuotasPanel() {
  const { data: quotas = [], isLoading } = useQuery({
    queryKey: ['self_cert_quotas_all'],
    queryFn: async () => {
      const today = format(new Date(), 'yyyy-MM-dd');
      
      const { data, error } = await supabase
        .from('self_certification_quotas')
        .select(`
          *,
          profiles:employee_id (
            full_name,
            avatar_url,
            departments (name)
          )
        `)
        .lte('period_start', today)
        .gte('period_end', today)
        .eq('is_active', true);
      
      if (error) throw error;
      return data as unknown as SelfCertQuotaWithEmployee[];
    },
  });

  const summary = useMemo(() => {
    const highUsage = quotas.filter(q => {
      const daysPct = q.max_days_per_period > 0 ? (q.days_used / q.max_days_per_period) * 100 : 0;
      return daysPct >= 75;
    });
    
    const maxedOut = quotas.filter(q => {
      const daysMaxed = q.days_used >= q.max_days_per_period;
      const occMaxed = q.max_occurrences_per_period 
        ? q.occurrences_used >= q.max_occurrences_per_period 
        : false;
      return daysMaxed || occMaxed;
    });

    return { highUsage, maxedOut };
  }, [quotas]);

  if (isLoading) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-muted-foreground">
          Laster egenmeldingskvoter...
        </CardContent>
      </Card>
    );
  }

  if (quotas.length === 0) {
    return (
      <Card>
        <CardContent className="py-8 text-center">
          <Info className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="font-semibold">Ingen egenmeldingskvoter funnet</h3>
          <p className="text-muted-foreground">
            Kvoter opprettes automatisk når ansatte registrerer egenmelding
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Sammendrag */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Totalt med kvote
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{quotas.length}</div>
            <p className="text-xs text-muted-foreground">aktive kvoter</p>
          </CardContent>
        </Card>

        <Card className={summary.highUsage.length > 0 ? "border-yellow-500" : ""}>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Høy bruk (75%+)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary.highUsage.length}</div>
            <p className="text-xs text-muted-foreground">ansatte</p>
          </CardContent>
        </Card>

        <Card className={summary.maxedOut.length > 0 ? "border-destructive" : ""}>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Kvote brukt opp
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">{summary.maxedOut.length}</div>
            <p className="text-xs text-muted-foreground">ansatte</p>
          </CardContent>
        </Card>
      </div>

      {/* Liste over kvoter */}
      <Card>
        <CardHeader>
          <CardTitle>Egenmeldingskvoter</CardTitle>
          <CardDescription>
            Oversikt over egenmeldingsbruk for alle ansatte
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {quotas.map(quota => {
            const daysPct = quota.max_days_per_period > 0 
              ? Math.round((quota.days_used / quota.max_days_per_period) * 100) 
              : 0;
            const daysRemaining = quota.max_days_per_period - quota.days_used;
            const occRemaining = quota.max_occurrences_per_period 
              ? quota.max_occurrences_per_period - quota.occurrences_used 
              : null;
            
            const isWarning = daysPct >= 75 && daysPct < 100;
            const isDanger = daysPct >= 100 || (occRemaining !== null && occRemaining <= 0);

            return (
              <div 
                key={quota.id}
                className={`p-4 rounded-lg border ${
                  isDanger 
                    ? "border-destructive bg-destructive/5" 
                    : isWarning 
                      ? "border-yellow-500 bg-yellow-50 dark:bg-yellow-950/20" 
                      : ""
                }`}
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <AvatarWithInitials
                      name={quota.profiles?.full_name || "Ukjent"}
                      avatarUrl={quota.profiles?.avatar_url || undefined}
                      className="h-10 w-10"
                    />
                    <div>
                      <p className="font-medium">{quota.profiles?.full_name || "Ukjent"}</p>
                      <p className="text-sm text-muted-foreground">
                        {quota.profiles?.departments?.name || "Ingen avdeling"}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={quota.quota_type === 'ia' ? 'default' : 'secondary'}>
                      {quota.quota_type === 'ia' ? 'IA-avtale' : 'Standard'}
                    </Badge>
                    {isDanger && (
                      <Badge variant="destructive">
                        <AlertTriangle className="h-3 w-3 mr-1" />
                        Kvote brukt opp
                      </Badge>
                    )}
                    {isWarning && !isDanger && (
                      <Badge variant="outline" className="text-yellow-600 border-yellow-500">
                        Høy bruk
                      </Badge>
                    )}
                  </div>
                </div>

                <div className="space-y-3">
                  {/* Dager */}
                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-sm">
                      <span>Egenmeldingsdager</span>
                      <span className="font-medium">
                        {quota.days_used} av {quota.max_days_per_period} dager brukt
                      </span>
                    </div>
                    <Progress 
                      value={Math.min(daysPct, 100)} 
                      className={`h-2 ${isDanger ? '[&>div]:bg-destructive' : isWarning ? '[&>div]:bg-yellow-500' : ''}`}
                    />
                    <p className="text-xs text-muted-foreground">
                      {daysRemaining > 0 ? `${daysRemaining} dager igjen` : 'Ingen dager igjen'}
                    </p>
                  </div>

                  {/* Perioder */}
                  {quota.max_occurrences_per_period && (
                    <div className="flex items-center justify-between text-sm pt-2 border-t">
                      <span className="text-muted-foreground">Egenmeldingsperioder</span>
                      <span className="font-medium">
                        {quota.occurrences_used} av {quota.max_occurrences_per_period} brukt
                        {occRemaining !== null && occRemaining > 0 && (
                          <span className="text-muted-foreground ml-1">
                            ({occRemaining} igjen)
                          </span>
                        )}
                      </span>
                    </div>
                  )}

                  {/* Maks per gang */}
                  <div className="flex items-center justify-between text-sm text-muted-foreground">
                    <span>Maks sammenhengende dager</span>
                    <span>{quota.max_days_per_occurrence} dager</span>
                  </div>
                </div>
              </div>
            );
          })}
        </CardContent>
      </Card>
    </div>
  );
}
