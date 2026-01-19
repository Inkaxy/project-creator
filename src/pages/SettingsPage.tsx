import { useState } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Settings, Clock, Calendar, MapPin, Building2 } from "lucide-react";
import { WorkTimeRulesPanel } from "@/components/settings/WorkTimeRulesPanel";
import { AbsenceTypesPanel } from "@/components/settings/AbsenceTypesPanel";
import { LocationsPanel } from "@/components/settings/LocationsPanel";
import { DepartmentsSettingsPanel } from "@/components/settings/DepartmentsSettingsPanel";

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState("work-time");

  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-4 pl-12 sm:flex-row sm:items-center sm:justify-between lg:pl-0">
          <div>
            <h1 className="text-3xl font-bold text-foreground flex items-center gap-2">
              <Settings className="h-8 w-8" />
              Innstillinger
            </h1>
            <p className="text-muted-foreground">
              Konfigurer systeminnstillinger for hele organisasjonen
            </p>
          </div>
        </div>

        {/* Settings Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-2 lg:grid-cols-4">
            <TabsTrigger value="work-time" className="flex items-center gap-2">
              <Clock className="h-4 w-4" />
              <span className="hidden sm:inline">Arbeidstid</span>
            </TabsTrigger>
            <TabsTrigger value="absence" className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              <span className="hidden sm:inline">Fraværstyper</span>
            </TabsTrigger>
            <TabsTrigger value="locations" className="flex items-center gap-2">
              <MapPin className="h-4 w-4" />
              <span className="hidden sm:inline">Lokasjoner</span>
            </TabsTrigger>
            <TabsTrigger value="departments" className="flex items-center gap-2">
              <Building2 className="h-4 w-4" />
              <span className="hidden sm:inline">Avdelinger</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="work-time">
            <WorkTimeRulesPanel />
          </TabsContent>

          <TabsContent value="absence">
            <AbsenceTypesPanel />
          </TabsContent>

          <TabsContent value="locations">
            <LocationsPanel />
          </TabsContent>

          <TabsContent value="departments">
            <DepartmentsSettingsPanel />
          </TabsContent>
        </Tabs>
      </div>
    </MainLayout>
  );
}
