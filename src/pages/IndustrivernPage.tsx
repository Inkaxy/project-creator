import { useState } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  LayoutDashboard, 
  Users, 
  FileText, 
  Wrench, 
  GraduationCap, 
  Calendar,
  Building2,
  AlertTriangle
} from "lucide-react";
import { IndustrivernDashboard } from "@/components/industrivern/dashboard/IndustrivernDashboard";
import { OrganizationPanel } from "@/components/industrivern/organization/OrganizationPanel";
import { EmergencyPlanPanel } from "@/components/industrivern/emergency-plan/EmergencyPlanPanel";
import { ExercisePlannerPanel } from "@/components/industrivern/exercises/ExercisePlannerPanel";
import { QualificationsPanel } from "@/components/industrivern/qualifications/QualificationsPanel";
import { IndustrivernEquipmentPanel } from "@/components/industrivern/equipment/IndustrivernEquipmentPanel";

export default function IndustrivernPage() {
  const [activeTab, setActiveTab] = useState("dashboard");

  return (
    <MainLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Industrivern</h1>
          <p className="text-muted-foreground">
            HMS Pro - Industrivernmodul ihht. Forskrift om industrivern
          </p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <TabsList className="flex flex-wrap h-auto gap-1 bg-muted p-1">
            <TabsTrigger value="dashboard" className="flex items-center gap-2">
              <LayoutDashboard className="h-4 w-4" />
              <span className="hidden sm:inline">Dashboard</span>
            </TabsTrigger>
            <TabsTrigger value="organization" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              <span className="hidden sm:inline">Organisasjon</span>
            </TabsTrigger>
            <TabsTrigger value="emergency-plan" className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              <span className="hidden sm:inline">Beredskapsplan</span>
            </TabsTrigger>
            <TabsTrigger value="equipment" className="flex items-center gap-2">
              <Wrench className="h-4 w-4" />
              <span className="hidden sm:inline">Utstyr</span>
            </TabsTrigger>
            <TabsTrigger value="qualifications" className="flex items-center gap-2">
              <GraduationCap className="h-4 w-4" />
              <span className="hidden sm:inline">Kvalifikasjoner</span>
            </TabsTrigger>
            <TabsTrigger value="exercises" className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              <span className="hidden sm:inline">Øvelser</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="dashboard" className="space-y-4">
            <IndustrivernDashboard />
          </TabsContent>

          <TabsContent value="organization" className="space-y-4">
            <OrganizationPanel />
          </TabsContent>

          <TabsContent value="emergency-plan" className="space-y-4">
            <EmergencyPlanPanel />
          </TabsContent>

          <TabsContent value="equipment" className="space-y-4">
            <IndustrivernEquipmentPanel />
          </TabsContent>

          <TabsContent value="qualifications" className="space-y-4">
            <QualificationsPanel />
          </TabsContent>

          <TabsContent value="exercises" className="space-y-4">
            <ExercisePlannerPanel />
          </TabsContent>
        </Tabs>
      </div>
    </MainLayout>
  );
}
