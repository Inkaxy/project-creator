import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Settings,
  Plus,
  MoreHorizontal,
  Edit,
  Trash2,
  ClipboardList,
  Thermometer,
  ShieldCheck,
  Sparkles,
  Copy,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  useIKControlTemplates,
  useDeleteControlTemplate,
  IKControlTemplate,
} from "@/hooks/useIKControls";
import { CreateControlTemplateModal } from "./CreateControlTemplateModal";
import { EditControlTemplateModal } from "./EditControlTemplateModal";

interface ControlSetupPanelProps {
  departmentId?: string | null;
}

const getCategoryIcon = (category: string) => {
  switch (category) {
    case "temperature":
      return <Thermometer className="h-4 w-4" />;
    case "hygiene":
      return <Sparkles className="h-4 w-4" />;
    case "safety":
      return <ShieldCheck className="h-4 w-4" />;
    default:
      return <ClipboardList className="h-4 w-4" />;
  }
};

const getCategoryLabel = (category: string) => {
  switch (category) {
    case "temperature":
      return "Temperatur";
    case "hygiene":
      return "Hygiene";
    case "safety":
      return "Sikkerhet";
    case "equipment":
      return "Utstyr";
    default:
      return "Generell";
  }
};

const getFrequencyLabel = (frequency: string) => {
  switch (frequency) {
    case "daily":
      return "Daglig";
    case "weekly":
      return "Ukentlig";
    case "monthly":
      return "Månedlig";
    case "shift":
      return "Per vakt";
    default:
      return frequency;
  }
};

export function ControlSetupPanel({ departmentId }: ControlSetupPanelProps) {
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<IKControlTemplate | null>(null);

  const { data: templates = [], isLoading } = useIKControlTemplates(departmentId);
  const deleteTemplate = useDeleteControlTemplate();

  const handleDelete = (id: string) => {
    if (confirm("Er du sikker på at du vil slette dette kontrollpunktet?")) {
      deleteTemplate.mutate(id);
    }
  };

  // Group templates by department
  const groupedByDepartment = templates.reduce((acc, template) => {
    const deptId = template.department_id || "none";
    const deptName = template.departments?.name || "Ingen avdeling";
    if (!acc[deptId]) {
      acc[deptId] = {
        name: deptName,
        color: template.departments?.color || null,
        templates: [],
      };
    }
    acc[deptId].templates.push(template);
    return acc;
  }, {} as Record<string, { name: string; color: string | null; templates: IKControlTemplate[] }>);

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6 text-center text-muted-foreground">
          Laster kontrollpunkter...
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <div className="space-y-6">
        {/* Header with actions */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold">Kontrollpunkter</h2>
            <p className="text-sm text-muted-foreground">
              Administrer kontrollpunkter og maler for IK-logging
            </p>
          </div>
          <Button onClick={() => setCreateModalOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Nytt kontrollpunkt
          </Button>
        </div>

        {/* Templates grouped by department */}
        {Object.entries(groupedByDepartment).map(([deptId, group]) => (
          <Card key={deptId}>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-lg">
                <div
                  className="h-3 w-3 rounded-full"
                  style={{ backgroundColor: group.color || "#888" }}
                />
                {group.name}
                <Badge variant="secondary" className="ml-2">
                  {group.templates.length} kontrollpunkt
                  {group.templates.length !== 1 ? "er" : ""}
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {group.templates.map((template) => (
                <div
                  key={template.id}
                  className="flex items-center justify-between rounded-lg border p-3 hover:bg-muted/50"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted">
                      {getCategoryIcon(template.category)}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-medium text-sm">{template.name}</p>
                        {template.is_critical && (
                          <Badge variant="destructive" className="text-xs">
                            Kritisk
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <span>{getCategoryLabel(template.category)}</span>
                        <span>•</span>
                        <span>{getFrequencyLabel(template.frequency)}</span>
                        {template.time_of_day && (
                          <>
                            <span>•</span>
                            <span>Kl. {template.time_of_day}</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => setEditingTemplate(template)}>
                        <Edit className="mr-2 h-4 w-4" />
                        Rediger
                      </DropdownMenuItem>
                      <DropdownMenuItem>
                        <Copy className="mr-2 h-4 w-4" />
                        Dupliser
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        className="text-destructive"
                        onClick={() => handleDelete(template.id)}
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        Slett
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              ))}
            </CardContent>
          </Card>
        ))}

        {templates.length === 0 && (
          <Card>
            <CardContent className="p-8 text-center">
              <Settings className="mx-auto h-12 w-12 text-muted-foreground/50" />
              <p className="mt-4 text-muted-foreground">
                Ingen kontrollpunkter er opprettet ennå.
              </p>
              <Button className="mt-4" onClick={() => setCreateModalOpen(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Opprett første kontrollpunkt
              </Button>
            </CardContent>
          </Card>
        )}
      </div>

      <CreateControlTemplateModal
        open={createModalOpen}
        onOpenChange={setCreateModalOpen}
      />

      <EditControlTemplateModal
        open={!!editingTemplate}
        onOpenChange={(open) => !open && setEditingTemplate(null)}
        template={editingTemplate}
      />
    </>
  );
}
