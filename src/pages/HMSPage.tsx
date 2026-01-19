import { useState } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { 
  Shield, 
  Users, 
  AlertTriangle, 
  ClipboardCheck,
  HardHat,
  Flame,
  Heart,
  Utensils
} from "lucide-react";
import { useSafetyRounds, usePendingSafetyRoundsCount } from "@/hooks/useSafetyRounds";
import { useRiskAssessments, useHighRiskCount } from "@/hooks/useRiskAssessments";
import { SafetyRoundsPanel } from "@/components/hms/SafetyRoundsPanel";
import { RiskAssessmentPanel } from "@/components/hms/RiskAssessmentPanel";
import { HMSRolesPanel } from "@/components/hms/HMSRolesPanel";
import { StatCard } from "@/components/ui/stat-card";

export default function HMSPage() {
  const [activeTab, setActiveTab] = useState("overview");
  
  const { data: safetyRounds = [] } = useSafetyRounds();
  const { data: pendingRoundsCount = 0 } = usePendingSafetyRoundsCount();
  const { data: riskAssessments = [] } = useRiskAssessments();
  const { data: highRiskCount = 0 } = useHighRiskCount();

  const completedRounds = safetyRounds.filter(r => r.status === "completed").length;
  const plannedRounds = safetyRounds.filter(r => r.status === "planned").length;

  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
              <Shield className="h-8 w-8 text-primary" />
              HMS
            </h1>
            <p className="text-muted-foreground mt-1">
              Helse, miljø og sikkerhet
            </p>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-4">
          <StatCard
            title="Vernerunder"
            value={completedRounds}
            subtitle={`${plannedRounds} planlagt`}
            icon={ClipboardCheck}
            variant={pendingRoundsCount > 0 ? "warning" : "default"}
          />
          <StatCard
            title="Risikoer"
            value={riskAssessments.length}
            subtitle="aktive vurderinger"
            icon={AlertTriangle}
            variant={highRiskCount > 0 ? "warning" : "default"}
          />
          <StatCard
            title="Høy risiko"
            value={highRiskCount}
            subtitle="krever tiltak"
            icon={AlertTriangle}
            variant={highRiskCount > 0 ? "warning" : "success"}
          />
          <StatCard
            title="Forfalt"
            value={pendingRoundsCount}
            subtitle="vernerunder"
            icon={ClipboardCheck}
            variant={pendingRoundsCount > 0 ? "warning" : "success"}
          />
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <TabsList>
            <TabsTrigger value="overview">Oversikt</TabsTrigger>
            <TabsTrigger value="safety-rounds" className="flex items-center gap-2">
              Vernerunder
              {pendingRoundsCount > 0 && (
                <Badge variant="destructive" className="h-5 w-5 p-0 flex items-center justify-center text-xs">
                  {pendingRoundsCount}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="risk-assessment" className="flex items-center gap-2">
              ROS-analyse
              {highRiskCount > 0 && (
                <Badge variant="destructive" className="h-5 w-5 p-0 flex items-center justify-center text-xs">
                  {highRiskCount}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="roles">HMS-roller</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              {/* Quick Actions */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <ClipboardCheck className="h-5 w-5" />
                    Vernerunder
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {plannedRounds > 0 ? (
                      <div className="flex items-center justify-between p-3 bg-warning/10 rounded-lg border border-warning/20">
                        <div>
                          <p className="font-medium">Planlagte runder</p>
                          <p className="text-sm text-muted-foreground">
                            {plannedRounds} vernerunde(r) venter
                          </p>
                        </div>
                        <Badge variant="outline" className="bg-warning/20 text-warning-foreground border-warning/30">
                          {plannedRounds}
                        </Badge>
                      </div>
                    ) : (
                      <div className="flex items-center justify-between p-3 bg-success/10 rounded-lg border border-success/20">
                        <div>
                          <p className="font-medium">Alt i orden</p>
                          <p className="text-sm text-muted-foreground">
                            Ingen forfallte vernerunder
                          </p>
                        </div>
                        <Badge variant="outline" className="bg-success/20 text-success border-success/30">
                          ✓
                        </Badge>
                      </div>
                    )}
                    <div className="text-sm text-muted-foreground">
                      {completedRounds} fullført totalt
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Risk Overview */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <AlertTriangle className="h-5 w-5" />
                    Risikostatus
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {highRiskCount > 0 ? (
                      <div className="flex items-center justify-between p-3 bg-destructive/10 rounded-lg border border-destructive/20">
                        <div>
                          <p className="font-medium text-destructive">Høy risiko</p>
                          <p className="text-sm text-muted-foreground">
                            {highRiskCount} risiko(er) krever tiltak
                          </p>
                        </div>
                        <Badge variant="destructive">
                          {highRiskCount}
                        </Badge>
                      </div>
                    ) : (
                      <div className="flex items-center justify-between p-3 bg-success/10 rounded-lg border border-success/20">
                        <div>
                          <p className="font-medium text-success">Lavt risikonivå</p>
                          <p className="text-sm text-muted-foreground">
                            Ingen kritiske risikoer
                          </p>
                        </div>
                        <Badge variant="outline" className="bg-success/20 text-success border-success/30">
                          ✓
                        </Badge>
                      </div>
                    )}
                    <div className="text-sm text-muted-foreground">
                      {riskAssessments.length} aktive risikovurderinger
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* HMS Roles Quick View */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  HMS-roller i organisasjonen
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid gap-3 md:grid-cols-4">
                  <RoleCard
                    icon={<HardHat className="h-5 w-5" />}
                    title="Verneombud"
                    description="Representerer ansatte"
                    required={false}
                    fieldName="is_safety_representative"
                  />
                  <RoleCard
                    icon={<Flame className="h-5 w-5" />}
                    title="Brannvernleder"
                    description="Brannforebygging"
                    required={false}
                    fieldName="is_fire_safety_leader"
                  />
                  <RoleCard
                    icon={<Heart className="h-5 w-5" />}
                    title="Førstehjelpansvarlig"
                    description="Opplæring i førstehjelp"
                    required={false}
                    fieldName="has_first_aid_course"
                  />
                  <RoleCard
                    icon={<Utensils className="h-5 w-5" />}
                    title="Mattrygghetsansvarlig"
                    description="IK-Mat ansvarlig"
                    required={false}
                    fieldName="is_food_safety_responsible"
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="safety-rounds">
            <SafetyRoundsPanel />
          </TabsContent>

          <TabsContent value="risk-assessment">
            <RiskAssessmentPanel />
          </TabsContent>

          <TabsContent value="roles">
            <HMSRolesPanel />
          </TabsContent>
        </Tabs>
      </div>
    </MainLayout>
  );
}

function RoleCard({ 
  icon, 
  title, 
  description, 
  required 
}: { 
  icon: React.ReactNode; 
  title: string; 
  description: string; 
  required: boolean;
  fieldName: string;
}) {
  return (
    <div className="p-4 rounded-lg border bg-card hover:bg-accent/50 transition-colors">
      <div className="flex items-start gap-3">
        <div className="p-2 rounded-lg bg-primary/10 text-primary">
          {icon}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <p className="font-medium truncate">{title}</p>
            {required && (
              <Badge variant="outline" className="text-xs shrink-0">
                Påkrevd
              </Badge>
            )}
          </div>
          <p className="text-sm text-muted-foreground truncate">{description}</p>
        </div>
      </div>
    </div>
  );
}
