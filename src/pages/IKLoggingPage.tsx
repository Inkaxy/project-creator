import { useState } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ClipboardList,
  Calendar,
  History,
  Settings,
  Plus,
  Filter,
  FileText,
} from "lucide-react";
import { useDepartments } from "@/hooks/useEmployees";
import { usePendingControls } from "@/hooks/useIKControls";
import { TodayControlsPanel } from "@/components/ik-logging/TodayControlsPanel";
import { UpcomingControlsPanel } from "@/components/ik-logging/UpcomingControlsPanel";
import { ControlHistoryPanel } from "@/components/ik-logging/ControlHistoryPanel";
import { ControlSetupPanel } from "@/components/ik-logging/ControlSetupPanel";
import { CreateControlTemplateModal } from "@/components/ik-logging/CreateControlTemplateModal";

export default function IKLoggingPage() {
  const [selectedDepartment, setSelectedDepartment] = useState<string | null>(null);
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("today");

  const { data: departments = [] } = useDepartments();
  const { data: pendingData } = usePendingControls(selectedDepartment);

  const pendingCount = pendingData?.pending?.length || 0;

  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">IK-logging</h1>
            <p className="text-muted-foreground">
              Dokumenter og følg opp daglige kontroller
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Department filter */}
            <Select
              value={selectedDepartment || "all"}
              onValueChange={(v) => setSelectedDepartment(v === "all" ? null : v)}
            >
              <SelectTrigger className="w-[180px]">
                <Filter className="mr-2 h-4 w-4" />
                <SelectValue placeholder="Alle avdelinger" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Alle avdelinger</SelectItem>
                {departments.map((dept) => (
                  <SelectItem key={dept.id} value={dept.id}>
                    {dept.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Button variant="outline">
              <FileText className="mr-2 h-4 w-4" />
              Legg til fra mal
            </Button>

            <Button onClick={() => setCreateModalOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Nytt kontrollpunkt
            </Button>
          </div>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList>
            <TabsTrigger value="today" className="gap-2">
              <ClipboardList className="h-4 w-4" />
              Dagens kontroller
              {pendingCount > 0 && (
                <Badge variant="secondary" className="ml-1">
                  {pendingCount}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="upcoming" className="gap-2">
              <Calendar className="h-4 w-4" />
              Kommende
            </TabsTrigger>
            <TabsTrigger value="history" className="gap-2">
              <History className="h-4 w-4" />
              Historikk
            </TabsTrigger>
            <TabsTrigger value="setup" className="gap-2">
              <Settings className="h-4 w-4" />
              Oppsett
            </TabsTrigger>
          </TabsList>

          <TabsContent value="today" className="mt-6">
            <TodayControlsPanel departmentId={selectedDepartment} />
          </TabsContent>

          <TabsContent value="upcoming" className="mt-6">
            <UpcomingControlsPanel departmentId={selectedDepartment} />
          </TabsContent>

          <TabsContent value="history" className="mt-6">
            <ControlHistoryPanel departmentId={selectedDepartment} />
          </TabsContent>

          <TabsContent value="setup" className="mt-6">
            <ControlSetupPanel departmentId={selectedDepartment} />
          </TabsContent>
        </Tabs>
      </div>

      <CreateControlTemplateModal
        open={createModalOpen}
        onOpenChange={setCreateModalOpen}
      />
    </MainLayout>
  );
}
