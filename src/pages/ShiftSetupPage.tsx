import { useState } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { FunctionsManagementModal } from "@/components/schedule/FunctionsManagementModal";
import { DepartmentsManagementModal } from "@/components/schedule/DepartmentsManagementModal";
import { ManageTemplatesModal } from "@/components/schedule/ManageTemplatesModal";
import { RolloutTemplateModal } from "@/components/schedule/RolloutTemplateModal";
import { CreateRotationGroupModal } from "@/components/schedule/CreateRotationGroupModal";
import { RotationTemplatesPanel } from "@/components/schedule/RotationTemplatesPanel";
import { ShiftSetupOverview } from "@/components/schedule/ShiftSetupOverview";
import { CompetenceMatrixModal } from "@/components/schedule/CompetenceMatrixModal";
import { CourseEditorModal } from "@/components/training/CourseEditorModal";
import { useAllFunctions } from "@/hooks/useFunctions";
import { useDepartments } from "@/hooks/useEmployees";
import { useShiftTemplates, useShiftTemplate, ShiftTemplate } from "@/hooks/useShiftTemplates";
import { useCourseModules, Course } from "@/hooks/useCourses";
import {
  Settings,
  Building2,
  Layers,
  Calendar,
  Users,
  Clock,
  Plus,
  Pencil,
  RefreshCw,
  LayoutGrid,
  Play,
} from "lucide-react";

interface RotationGroup {
  id: string;
  name: string;
}

export default function ShiftSetupPage() {
  const [activeTab, setActiveTab] = useState("overview");
  
  // Modal states
  const [functionsModalOpen, setFunctionsModalOpen] = useState(false);
  const [departmentsModalOpen, setDepartmentsModalOpen] = useState(false);
  const [templatesModalOpen, setTemplatesModalOpen] = useState(false);
  const [rolloutModalOpen, setRolloutModalOpen] = useState(false);
  const [rotationModalOpen, setRotationModalOpen] = useState(false);
  const [competenceMatrixOpen, setCompetenceMatrixOpen] = useState(false);
  const [courseEditorOpen, setCourseEditorOpen] = useState(false);
  const [editingCourse, setEditingCourse] = useState<Course | null>(null);
  const [selectedTemplate, setSelectedTemplate] = useState<ShiftTemplate | null>(null);
  const [editingRotation, setEditingRotation] = useState<RotationGroup | null>(null);

  // Data
  const { data: functions, isLoading: functionsLoading } = useAllFunctions();
  const { data: departments, isLoading: departmentsLoading } = useDepartments();
  const { data: templates, isLoading: templatesLoading } = useShiftTemplates();
  const { data: editingCourseModules = [] } = useCourseModules(editingCourse?.id || null);

  const handleRollout = (template: ShiftTemplate) => {
    setSelectedTemplate(template);
    setRolloutModalOpen(true);
  };

  const handleEditRotation = (group: RotationGroup) => {
    setEditingRotation(group);
    setRotationModalOpen(true);
  };

  const handleRolloutRotation = (group: RotationGroup) => {
    console.log("Rollout rotation:", group);
  };

  const handleOpenCourseEditor = (course?: Course) => {
    setEditingCourse(course || null);
    setCourseEditorOpen(true);
  };

  // Helper to calculate shifts per day for a template
  const getShiftsPerDay = (template: ShiftTemplate): number[] => {
    // This would need the template_shifts data
    // For now, return placeholder
    return [0, 0, 0, 0, 0, 0, 0];
  };

  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-4 pl-12 sm:flex-row sm:items-center sm:justify-between lg:pl-0">
          <div>
            <h1 className="text-3xl font-bold text-foreground flex items-center gap-2">
              <Settings className="h-8 w-8" />
              Vaktoppsett
            </h1>
            <p className="text-muted-foreground">
              Konfigurer funksjoner, avdelinger og vaktmaler
            </p>
          </div>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-2 lg:grid-cols-5">
            <TabsTrigger value="overview" className="flex items-center gap-2">
              <LayoutGrid className="h-4 w-4" />
              <span className="hidden sm:inline">Oversikt</span>
            </TabsTrigger>
            <TabsTrigger value="functions" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              <span className="hidden sm:inline">Funksjoner</span>
            </TabsTrigger>
            <TabsTrigger value="departments" className="flex items-center gap-2">
              <Building2 className="h-4 w-4" />
              <span className="hidden sm:inline">Avdelinger</span>
            </TabsTrigger>
            <TabsTrigger value="templates" className="flex items-center gap-2">
              <Layers className="h-4 w-4" />
              <span className="hidden sm:inline">Vaktmaler</span>
            </TabsTrigger>
            <TabsTrigger value="rotations" className="flex items-center gap-2">
              <RefreshCw className="h-4 w-4" />
              <span className="hidden sm:inline">Rotasjoner</span>
            </TabsTrigger>
          </TabsList>

          {/* Overview Tab - NEW 3-column layout */}
          <TabsContent value="overview">
            <ShiftSetupOverview
              onOpenFunctionsModal={() => setFunctionsModalOpen(true)}
              onOpenCompetenceMatrix={() => setCompetenceMatrixOpen(true)}
              onOpenCourseEditor={handleOpenCourseEditor}
            />
          </TabsContent>

          {/* Functions Tab */}
          <TabsContent value="functions">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="h-5 w-5 text-primary" />
                    Funksjoner
                  </CardTitle>
                  <CardDescription>
                    Definer arbeidsroller og stillinger med standardtider og farger
                  </CardDescription>
                </div>
                <Button onClick={() => setFunctionsModalOpen(true)}>
                  <Pencil className="h-4 w-4 mr-2" />
                  Rediger funksjoner
                </Button>
              </CardHeader>
              <CardContent>
                {functionsLoading ? (
                  <div className="space-y-3">
                    {[1, 2, 3].map((i) => (
                      <Skeleton key={i} className="h-16 w-full" />
                    ))}
                  </div>
                ) : functions && functions.length > 0 ? (
                  <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                    {functions.map((func) => (
                      <div
                        key={func.id}
                        className="flex items-center gap-3 rounded-lg border border-border p-4 transition-colors hover:bg-muted/50"
                      >
                        <div
                          className="h-10 w-10 rounded-lg flex items-center justify-center text-white font-semibold"
                          style={{ backgroundColor: func.color || "#3B82F6" }}
                        >
                          {func.short_name || func.name.substring(0, 2).toUpperCase()}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-foreground truncate">{func.name}</p>
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Clock className="h-3 w-3" />
                            <span>
                              {func.default_start?.slice(0, 5) || "07:00"} - {func.default_end?.slice(0, 5) || "15:00"}
                            </span>
                          </div>
                        </div>
                        {!func.is_active && (
                          <Badge variant="secondary">Inaktiv</Badge>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>Ingen funksjoner definert ennå</p>
                    <Button
                      variant="outline"
                      className="mt-4"
                      onClick={() => setFunctionsModalOpen(true)}
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Legg til funksjon
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Departments Tab */}
          <TabsContent value="departments">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Building2 className="h-5 w-5 text-primary" />
                    Avdelinger
                  </CardTitle>
                  <CardDescription>
                    Organiser funksjoner og ansatte i avdelinger
                  </CardDescription>
                </div>
                <Button onClick={() => setDepartmentsModalOpen(true)}>
                  <Pencil className="h-4 w-4 mr-2" />
                  Rediger avdelinger
                </Button>
              </CardHeader>
              <CardContent>
                {departmentsLoading ? (
                  <div className="space-y-3">
                    {[1, 2, 3].map((i) => (
                      <Skeleton key={i} className="h-16 w-full" />
                    ))}
                  </div>
                ) : departments && departments.length > 0 ? (
                  <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                    {departments.map((dept) => {
                      const deptFunctions = functions?.filter(f => f.department_id === dept.id) || [];
                      return (
                        <div
                          key={dept.id}
                          className="rounded-lg border border-border p-4 transition-colors hover:bg-muted/50"
                        >
                          <div className="flex items-center gap-3 mb-3">
                            <div
                              className="h-10 w-10 rounded-lg flex items-center justify-center"
                              style={{ backgroundColor: `${dept.color || "#3B82F6"}20` }}
                            >
                              <Building2
                                className="h-5 w-5"
                                style={{ color: dept.color || "#3B82F6" }}
                              />
                            </div>
                            <div>
                              <p className="font-medium text-foreground">{dept.name}</p>
                              <p className="text-sm text-muted-foreground">
                                {deptFunctions.length} {deptFunctions.length === 1 ? "funksjon" : "funksjoner"}
                              </p>
                            </div>
                          </div>
                          {deptFunctions.length > 0 && (
                            <div className="flex flex-wrap gap-1">
                              {deptFunctions.slice(0, 3).map((func) => (
                                <Badge
                                  key={func.id}
                                  variant="secondary"
                                  className="text-xs"
                                  style={{
                                    backgroundColor: `${func.color || "#3B82F6"}20`,
                                    color: func.color || "#3B82F6",
                                  }}
                                >
                                  {func.short_name || func.name}
                                </Badge>
                              ))}
                              {deptFunctions.length > 3 && (
                                <Badge variant="secondary" className="text-xs">
                                  +{deptFunctions.length - 3}
                                </Badge>
                              )}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <Building2 className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>Ingen avdelinger definert ennå</p>
                    <Button
                      variant="outline"
                      className="mt-4"
                      onClick={() => setDepartmentsModalOpen(true)}
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Legg til avdeling
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Templates Tab - Enhanced with weekly preview */}
          <TabsContent value="templates">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Layers className="h-5 w-5 text-primary" />
                    Vaktmaler
                  </CardTitle>
                  <CardDescription>
                    Opprett og administrer maler for sesonger og spesielle perioder
                  </CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="outline" onClick={() => setTemplatesModalOpen(true)}>
                    <Play className="h-4 w-4 mr-2" />
                    Bruk mal
                  </Button>
                  <Button onClick={() => setTemplatesModalOpen(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Ny mal
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {templatesLoading ? (
                  <div className="space-y-3">
                    {[1, 2, 3].map((i) => (
                      <Skeleton key={i} className="h-32 w-full" />
                    ))}
                  </div>
                ) : templates && templates.length > 0 ? (
                  <div className="space-y-4">
                    {templates.map((template) => (
                      <TemplateCard 
                        key={template.id} 
                        template={template} 
                        onRollout={handleRollout}
                        onEdit={() => setTemplatesModalOpen(true)}
                      />
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <Layers className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>Ingen vaktmaler lagret ennå</p>
                    <p className="text-sm mt-1">
                      Du kan lagre maler fra vaktplan-visningen
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Rotations Tab */}
          <TabsContent value="rotations">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <RefreshCw className="h-5 w-5 text-primary" />
                    Rotasjonsgrupper
                  </CardTitle>
                  <CardDescription>
                    Automatisk rullerende vaktplaner for ansattgrupper
                  </CardDescription>
                </div>
                <Button onClick={() => {
                  setEditingRotation(null);
                  setRotationModalOpen(true);
                }}>
                  <Plus className="h-4 w-4 mr-2" />
                  Ny rotasjonsgruppe
                </Button>
              </CardHeader>
              <CardContent>
                <RotationTemplatesPanel 
                  onCreateNew={() => {
                    setEditingRotation(null);
                    setRotationModalOpen(true);
                  }}
                  onEdit={handleEditRotation}
                  onRollout={handleRolloutRotation}
                />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Modals */}
      <FunctionsManagementModal
        open={functionsModalOpen}
        onOpenChange={setFunctionsModalOpen}
      />
      <DepartmentsManagementModal
        open={departmentsModalOpen}
        onOpenChange={setDepartmentsModalOpen}
      />
      <ManageTemplatesModal
        open={templatesModalOpen}
        onOpenChange={setTemplatesModalOpen}
        onRollout={handleRollout}
      />
      <RolloutTemplateModal
        open={rolloutModalOpen}
        onOpenChange={setRolloutModalOpen}
        currentWeekDate={new Date()}
        preselectedTemplate={selectedTemplate || undefined}
      />
      <CreateRotationGroupModal
        open={rotationModalOpen}
        onOpenChange={setRotationModalOpen}
      />
      <CompetenceMatrixModal
        open={competenceMatrixOpen}
        onOpenChange={setCompetenceMatrixOpen}
      />
      <CourseEditorModal
        open={courseEditorOpen}
        onOpenChange={setCourseEditorOpen}
        course={editingCourse}
        modules={editingCourseModules}
      />
    </MainLayout>
  );
}

// Enhanced Template Card Component with weekly preview
function TemplateCard({ 
  template, 
  onRollout,
  onEdit
}: { 
  template: ShiftTemplate; 
  onRollout: (template: ShiftTemplate) => void;
  onEdit: () => void;
}) {
  const { data: templateData } = useShiftTemplate(template.id);
  
  const dayNames = ["Man", "Tir", "Ons", "Tor", "Fre", "Lør", "Søn"];
  const orderedDays = [1, 2, 3, 4, 5, 6, 0];

  // Calculate shifts per day
  const shiftsPerDay = orderedDays.map(dayOfWeek => {
    if (!templateData?.template_shifts) return 0;
    return templateData.template_shifts.filter(s => s.day_of_week === dayOfWeek).length;
  });

  const totalShifts = shiftsPerDay.reduce((a, b) => a + b, 0);

  return (
    <Card className="overflow-hidden">
      <CardContent className="p-4">
        <div className="flex items-start gap-4">
          {/* Icon */}
          <div className="flex-shrink-0 h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center">
            <Calendar className="h-6 w-6 text-primary" />
          </div>
          
          <div className="flex-1 min-w-0">
            {/* Header */}
            <div className="flex items-start justify-between gap-2">
              <div>
                <h3 className="font-semibold text-foreground">{template.name}</h3>
                <div className="flex items-center gap-2 mt-1">
                  <Badge variant="outline" className="text-xs">
                    {template.category || "Egendefinert"}
                  </Badge>
                  <Badge variant="secondary" className="text-xs">
                    {totalShifts} vakter per uke
                  </Badge>
                  {template.is_default && (
                    <Badge className="text-xs bg-primary">Aktiv</Badge>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-1">
                <Button variant="ghost" size="icon" onClick={onEdit}>
                  <Pencil className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Weekly preview grid */}
            <div className="grid grid-cols-7 gap-2 mt-4">
              {orderedDays.map((dayOfWeek, index) => (
                <div
                  key={dayOfWeek}
                  className="text-center rounded-lg border bg-muted/30 p-2"
                >
                  <p className="text-xs text-muted-foreground mb-1">{dayNames[index]}</p>
                  <p className="text-lg font-semibold">{shiftsPerDay[index]}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
