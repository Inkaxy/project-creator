import { useState } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  Flame, 
  Calendar, 
  AlertTriangle,
  FileText,
  CheckCircle2,
  Clock,
  Wrench,
  Map
} from "lucide-react";
import { format, differenceInDays } from "date-fns";
import { nb } from "date-fns/locale";
import { 
  useFireDrills, 
  useFireEquipment,
  useNextFireDrill,
  useOverdueEquipmentCount 
} from "@/hooks/useFireSafety";
import { FireDrillsPanel } from "@/components/fire-safety/FireDrillsPanel";
import { FireEquipmentPanel } from "@/components/fire-safety/FireEquipmentPanel";
import { FireInstructionsPanel } from "@/components/fire-safety/FireInstructionsPanel";
import { BuildingMapsPanel } from "@/components/fire-safety/BuildingMapsPanel";
import { StatCard } from "@/components/ui/stat-card";

export default function FireSafetyPage() {
  const [activeTab, setActiveTab] = useState("overview");
  
  const { data: drills = [] } = useFireDrills();
  const { data: equipment = [] } = useFireEquipment();
  const { data: nextDrill } = useNextFireDrill();
  const { data: overdueCount = 0 } = useOverdueEquipmentCount();

  const completedDrills = drills.filter(d => d.completed_at).length;
  const plannedDrills = drills.filter(d => !d.completed_at).length;
  const equipmentOk = equipment.filter(e => e.status === "ok").length;

  // Calculate days until next drill
  const daysUntilNextDrill = nextDrill 
    ? differenceInDays(new Date(nextDrill.scheduled_date), new Date())
    : null;

  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
              <Flame className="h-8 w-8 text-destructive" />
              Brannvern
            </h1>
            <p className="text-muted-foreground mt-1">
              Brannøvelser, utstyrskontroll og branninstruks
            </p>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-4">
          <StatCard
            title="Brannøvelser"
            value={completedDrills}
            subtitle={`${plannedDrills} planlagt`}
            icon={Flame}
            variant="default"
          />
          <StatCard
            title="Neste øvelse"
            value={daysUntilNextDrill !== null ? `${daysUntilNextDrill}d` : "-"}
            subtitle={nextDrill ? format(new Date(nextDrill.scheduled_date), "d. MMM", { locale: nb }) : "Ingen planlagt"}
            icon={Calendar}
            variant={daysUntilNextDrill !== null && daysUntilNextDrill < 7 ? "warning" : "default"}
          />
          <StatCard
            title="Utstyr OK"
            value={equipmentOk}
            subtitle={`av ${equipment.length} enheter`}
            icon={CheckCircle2}
            variant="success"
          />
          <StatCard
            title="Forfalt kontroll"
            value={overdueCount}
            subtitle="krever oppfølging"
            icon={AlertTriangle}
            variant={overdueCount > 0 ? "warning" : "success"}
          />
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <TabsList>
            <TabsTrigger value="overview">Oversikt</TabsTrigger>
            <TabsTrigger value="drills" className="flex items-center gap-2">
              Brannøvelser
              {plannedDrills > 0 && (
                <Badge variant="secondary" className="h-5 w-5 p-0 flex items-center justify-center text-xs">
                  {plannedDrills}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="equipment" className="flex items-center gap-2">
              Utstyr
              {overdueCount > 0 && (
                <Badge variant="destructive" className="h-5 w-5 p-0 flex items-center justify-center text-xs">
                  {overdueCount}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="instructions">Branninstruks</TabsTrigger>
            <TabsTrigger value="maps" className="flex items-center gap-2">
              <Map className="h-4 w-4" />
              Bygningskart
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              {/* Next Drill Card */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Flame className="h-5 w-5" />
                    Neste brannøvelse
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {nextDrill ? (
                    <div className="space-y-3">
                      <div className="p-4 rounded-lg bg-warning/10 border border-warning/20">
                        <div className="flex items-center justify-between mb-2">
                          <h3 className="font-medium">{nextDrill.title}</h3>
                          <Badge variant="outline">
                            <Clock className="h-3 w-3 mr-1" />
                            {daysUntilNextDrill} dager
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {format(new Date(nextDrill.scheduled_date), "EEEE d. MMMM yyyy", { locale: nb })}
                        </p>
                        {nextDrill.meeting_point && (
                          <p className="text-sm text-muted-foreground mt-1">
                            Møteplass: {nextDrill.meeting_point}
                          </p>
                        )}
                      </div>
                      <Button 
                        variant="outline" 
                        className="w-full"
                        onClick={() => setActiveTab("drills")}
                      >
                        Se alle øvelser
                      </Button>
                    </div>
                  ) : (
                    <div className="p-4 rounded-lg bg-muted/50 text-center">
                      <Flame className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                      <p className="text-sm text-muted-foreground mb-3">
                        Ingen brannøvelser planlagt
                      </p>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => setActiveTab("drills")}
                      >
                        Planlegg øvelse
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Equipment Status Card */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Wrench className="h-5 w-5" />
                    Utstyrsstatus
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {overdueCount > 0 ? (
                      <div className="p-4 rounded-lg bg-destructive/10 border border-destructive/20">
                        <div className="flex items-center gap-2">
                          <AlertTriangle className="h-5 w-5 text-destructive" />
                          <div>
                            <p className="font-medium text-destructive">
                              {overdueCount} enheter trenger kontroll
                            </p>
                            <p className="text-sm text-muted-foreground">
                              Kontroller forfalt eller nærmer seg
                            </p>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="p-4 rounded-lg bg-success/10 border border-success/20">
                        <div className="flex items-center gap-2">
                          <CheckCircle2 className="h-5 w-5 text-success" />
                          <div>
                            <p className="font-medium text-success">Alt utstyr OK</p>
                            <p className="text-sm text-muted-foreground">
                              Ingen forfallte kontroller
                            </p>
                          </div>
                        </div>
                      </div>
                    )}

                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div className="p-2 rounded bg-muted/50">
                        <p className="text-muted-foreground">Slukkere</p>
                        <p className="font-medium">
                          {equipment.filter(e => e.equipment_type === "slukker").length}
                        </p>
                      </div>
                      <div className="p-2 rounded bg-muted/50">
                        <p className="text-muted-foreground">Røykvarslere</p>
                        <p className="font-medium">
                          {equipment.filter(e => e.equipment_type === "roykvarsel").length}
                        </p>
                      </div>
                      <div className="p-2 rounded bg-muted/50">
                        <p className="text-muted-foreground">Nødlys</p>
                        <p className="font-medium">
                          {equipment.filter(e => e.equipment_type === "nodlys").length}
                        </p>
                      </div>
                      <div className="p-2 rounded bg-muted/50">
                        <p className="text-muted-foreground">Annet</p>
                        <p className="font-medium">
                          {equipment.filter(e => !["slukker", "roykvarsel", "nodlys"].includes(e.equipment_type)).length}
                        </p>
                      </div>
                    </div>

                    <Button 
                      variant="outline" 
                      className="w-full"
                      onClick={() => setActiveTab("equipment")}
                    >
                      Se alt utstyr
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Instructions Preview */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Branninstruks
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="p-4 rounded-lg bg-muted/50 text-center">
                  <FileText className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                  <p className="text-sm text-muted-foreground mb-3">
                    Last opp og administrer branninstruksen din
                  </p>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => setActiveTab("instructions")}
                  >
                    Gå til branninstruks
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="drills">
            <FireDrillsPanel />
          </TabsContent>

          <TabsContent value="equipment">
            <FireEquipmentPanel />
          </TabsContent>

          <TabsContent value="instructions">
            <FireInstructionsPanel />
          </TabsContent>

          <TabsContent value="maps">
            <BuildingMapsPanel />
          </TabsContent>
        </Tabs>
      </div>
    </MainLayout>
  );
}
