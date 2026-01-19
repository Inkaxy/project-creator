import { useState } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ChecklistsPanel } from "@/components/checklist/ChecklistsPanel";
import {
  useTemperatureUnits,
  useTodayTemperatureLogs,
  useTemperatureDeviationsToday,
} from "@/hooks/useTemperature";
import { useOpenDeviationsCount } from "@/hooks/useDeviations";
import {
  ClipboardCheck,
  Thermometer,
  AlertTriangle,
  CheckCircle2,
  Calendar,
  FileText,
  TrendingUp,
} from "lucide-react";
import { Link } from "react-router-dom";
import { format } from "date-fns";
import { nb } from "date-fns/locale";

export default function IKMatPage() {
  const { data: units = [] } = useTemperatureUnits();
  const { data: todayLogs = [] } = useTodayTemperatureLogs();
  const { data: deviationCount = 0 } = useTemperatureDeviationsToday();
  const { data: openDeviations = 0 } = useOpenDeviationsCount();

  const unitsLoggedToday = new Set(todayLogs.map((l) => l.unit_id)).size;
  const tempProgress = units.length > 0 ? (unitsLoggedToday / units.length) * 100 : 0;

  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">IK-Mat / HACCP</h1>
            <p className="text-muted-foreground">
              {format(new Date(), "EEEE d. MMMM yyyy", { locale: nb })}
            </p>
          </div>
          <Button asChild>
            <Link to="/ik-mat/rapport">
              <FileText className="mr-2 h-4 w-4" />
              Kontrollknappen
            </Link>
          </Button>
        </div>

        {/* Status Cards */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                  <Thermometer className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Temperatur i dag</p>
                  <p className="text-2xl font-bold">{unitsLoggedToday}/{units.length}</p>
                </div>
              </div>
              <Progress value={tempProgress} className="mt-3 h-2" />
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className={`flex h-10 w-10 items-center justify-center rounded-full ${deviationCount > 0 ? 'bg-destructive/10' : 'bg-success/10'}`}>
                  {deviationCount > 0 ? (
                    <AlertTriangle className="h-5 w-5 text-destructive" />
                  ) : (
                    <CheckCircle2 className="h-5 w-5 text-success" />
                  )}
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Temp.avvik i dag</p>
                  <p className="text-2xl font-bold">{deviationCount}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className={`flex h-10 w-10 items-center justify-center rounded-full ${openDeviations > 0 ? 'bg-warning/10' : 'bg-success/10'}`}>
                  <AlertTriangle className={`h-5 w-5 ${openDeviations > 0 ? 'text-warning' : 'text-success'}`} />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Åpne avvik</p>
                  <p className="text-2xl font-bold">{openDeviations}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                  <Calendar className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Neste tilsyn</p>
                  <p className="text-lg font-semibold">Ikke planlagt</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <Tabs defaultValue="checklists" className="space-y-4">
          <TabsList>
            <TabsTrigger value="checklists">
              <ClipboardCheck className="mr-2 h-4 w-4" />
              Sjekklister
            </TabsTrigger>
            <TabsTrigger value="temperature">
              <Thermometer className="mr-2 h-4 w-4" />
              Temperatur
            </TabsTrigger>
          </TabsList>

          <TabsContent value="checklists">
            <ChecklistsPanel />
          </TabsContent>

          <TabsContent value="temperature">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Thermometer className="h-5 w-5" />
                  Temperaturlogging
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {units.map((unit) => {
                    const lastLog = todayLogs.find((l) => l.unit_id === unit.id);
                    const isLogged = !!lastLog;
                    const isDeviation = lastLog?.is_deviation;

                    return (
                      <div
                        key={unit.id}
                        className={`rounded-lg border p-4 ${
                          isDeviation
                            ? "border-destructive bg-destructive/5"
                            : isLogged
                            ? "border-success bg-success/5"
                            : "border-border"
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-medium">{unit.name}</p>
                            <p className="text-sm text-muted-foreground">{unit.location}</p>
                          </div>
                          {isLogged ? (
                            <Badge variant={isDeviation ? "destructive" : "default"}>
                              {lastLog?.temperature}°C
                            </Badge>
                          ) : (
                            <Badge variant="outline">Ikke logget</Badge>
                          )}
                        </div>
                        <p className="mt-2 text-xs text-muted-foreground">
                          Gyldig: {unit.min_temp}°C - {unit.max_temp}°C
                        </p>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </MainLayout>
  );
}
