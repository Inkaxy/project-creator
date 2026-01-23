import { useState, useEffect } from "react";
import { Plus, Activity, Calendar, AlertTriangle, Users, TrendingUp, Settings, FileBarChart } from "lucide-react";
import { MainLayout } from "@/components/layout/MainLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { SickLeaveList } from "@/components/sick-leave/SickLeaveList";
import { SickLeaveDeadlinesPanel } from "@/components/sick-leave/SickLeaveDeadlinesPanel";
import { RegisterSickLeaveModal } from "@/components/sick-leave/RegisterSickLeaveModal";
import { SickLeaveStatisticsPanel } from "@/components/sick-leave/SickLeaveStatisticsPanel";
import { SelfCertQuotasPanel } from "@/components/sick-leave/SelfCertQuotasPanel";
import { SickLeaveSettingsPanel } from "@/components/sick-leave/SickLeaveSettingsPanel";
import { useActiveSickLeaves, useUpcomingDeadlines } from "@/hooks/useSickLeave";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";

const SickLeavePage = () => {
  const { isAdminOrManager } = useAuth();
  const [registerModalOpen, setRegisterModalOpen] = useState(false);
  
  const { data: activeSickLeaves = [] } = useActiveSickLeaves();
  const { data: upcomingDeadlines = [] } = useUpcomingDeadlines(30);
  
  const overdueCount = upcomingDeadlines.filter(d => d.isOverdue).length;
  const upcomingCount = upcomingDeadlines.filter(d => !d.isOverdue && d.daysUntil <= 7).length;
  
  // Beregn statistikk
  const employerPeriodActive = activeSickLeaves.filter(sl => !sl.employer_period_completed).length;

  // Check for deadline notifications when the page loads (for managers only)
  useEffect(() => {
    if (!isAdminOrManager()) return;
    
    const checkDeadlineNotifications = async () => {
      try {
        console.log("Checking sick leave deadline notifications...");
        const { error } = await supabase.functions.invoke("send-sick-leave-deadline-notifications");
        if (error) {
          console.error("Error checking deadline notifications:", error);
        }
      } catch (err) {
        console.error("Failed to check deadline notifications:", err);
      }
    };

    // Run after a short delay to not block page load
    const timer = setTimeout(checkDeadlineNotifications, 1000);
    return () => clearTimeout(timer);
  }, [isAdminOrManager]);

  if (!isAdminOrManager()) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center h-96">
          <p className="text-muted-foreground">Du har ikke tilgang til denne siden.</p>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold">Sykefravær</h1>
            <p className="text-muted-foreground">
              Administrer sykefravær, oppfølging og arbeidsgiverperiode
            </p>
          </div>
          <Button onClick={() => setRegisterModalOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Registrer sykefravær
          </Button>
        </div>

        {/* Statistikk-kort */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Aktive sykefravær</CardTitle>
              <Activity className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{activeSickLeaves.length}</div>
              <p className="text-xs text-muted-foreground">
                {employerPeriodActive} i arbeidsgiverperioden
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Frister</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                {overdueCount > 0 && (
                  <Badge variant="destructive">{overdueCount} forfalt</Badge>
                )}
                {upcomingCount > 0 && (
                  <Badge variant="secondary">{upcomingCount} snart</Badge>
                )}
                {overdueCount === 0 && upcomingCount === 0 && (
                  <span className="text-sm text-muted-foreground">Ingen</span>
                )}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Oppfølgingsfrister
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">I arbeidsgiverperioden</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{employerPeriodActive}</div>
              <p className="text-xs text-muted-foreground">
                Dag 1-16 (arbeidsgiver betaler)
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">NAV-perioden</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {activeSickLeaves.length - employerPeriodActive}
              </div>
              <p className="text-xs text-muted-foreground">
                Dag 17+ (NAV overtar)
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Varsler for forfalte frister */}
        {overdueCount > 0 && (
          <Card className="border-destructive">
            <CardHeader className="pb-2">
              <CardTitle className="text-destructive flex items-center gap-2">
                <AlertTriangle className="h-5 w-5" />
                {overdueCount} oppfølgingsfrist{overdueCount > 1 ? 'er' : ''} har forfalt!
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {upcomingDeadlines
                  .filter(d => d.isOverdue)
                  .slice(0, 3)
                  .map(deadline => (
                    <div 
                      key={`${deadline.sickLeaveId}-${deadline.deadlineType}`}
                      className="flex items-center justify-between p-2 bg-destructive/10 rounded-md"
                    >
                      <div>
                        <span className="font-medium">{deadline.employeeName}</span>
                        <span className="text-muted-foreground"> - {deadline.deadlineType}</span>
                      </div>
                      <Badge variant="destructive">
                        {Math.abs(deadline.daysUntil)} dager siden
                      </Badge>
                    </div>
                  ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Tabs for different views */}
        <Tabs defaultValue="active" className="space-y-4">
          <TabsList className="flex-wrap">
            <TabsTrigger value="active">
              Aktive sykefravær
              {activeSickLeaves.length > 0 && (
                <Badge variant="secondary" className="ml-2">{activeSickLeaves.length}</Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="deadlines">
              Oppfølgingsfrister
              {overdueCount > 0 && (
                <Badge variant="destructive" className="ml-2">{overdueCount}</Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="quotas">
              Egenmeldingskvoter
            </TabsTrigger>
            <TabsTrigger value="history">Historikk</TabsTrigger>
            <TabsTrigger value="statistics">
              <FileBarChart className="h-4 w-4 mr-1" />
              Statistikk
            </TabsTrigger>
            <TabsTrigger value="settings">
              <Settings className="h-4 w-4 mr-1" />
              Innstillinger
            </TabsTrigger>
          </TabsList>

          <TabsContent value="active">
            <SickLeaveList status="active" />
          </TabsContent>

          <TabsContent value="deadlines">
            <SickLeaveDeadlinesPanel />
          </TabsContent>

          <TabsContent value="quotas">
            <SelfCertQuotasPanel />
          </TabsContent>

          <TabsContent value="history">
            <SickLeaveList status="completed" />
          </TabsContent>

          <TabsContent value="statistics">
            <SickLeaveStatisticsPanel />
          </TabsContent>

          <TabsContent value="settings">
            <SickLeaveSettingsPanel />
          </TabsContent>
        </Tabs>
      </div>

      {/* Registrer sykefravær modal */}
      <RegisterSickLeaveModal
        open={registerModalOpen}
        onOpenChange={setRegisterModalOpen}
      />
    </MainLayout>
  );
};

export default SickLeavePage;
