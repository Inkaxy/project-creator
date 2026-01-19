import { useState, useMemo } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { format } from "date-fns";
import { nb } from "date-fns/locale";
import {
  useShiftTemplates,
  useShiftTemplate,
  useUpdateShiftTemplate,
  useDeleteShiftTemplate,
  useDuplicateTemplate,
  ShiftTemplate,
  TemplateShift,
} from "@/hooks/useShiftTemplates";
import {
  Settings,
  MoreVertical,
  Star,
  Trash2,
  Pencil,
  Copy,
  ChevronDown,
  ChevronRight,
  Play,
} from "lucide-react";
import { EditTemplateModal } from "./EditTemplateModal";

interface ManageTemplatesModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onRollout: (template: ShiftTemplate) => void;
}

// Component for visual preview of a template's shifts
function TemplatePreviewGrid({ templateId }: { templateId: string }) {
  const { data: template, isLoading } = useShiftTemplate(templateId);

  const dayNames = ["Søn", "Man", "Tir", "Ons", "Tor", "Fre", "Lør"];
  const orderedDays = [1, 2, 3, 4, 5, 6, 0]; // Man-Søn

  const shiftsByDay = useMemo(() => {
    if (!template?.template_shifts) return {};
    return template.template_shifts.reduce((acc, shift) => {
      if (!acc[shift.day_of_week]) acc[shift.day_of_week] = [];
      acc[shift.day_of_week].push(shift);
      return acc;
    }, {} as Record<number, TemplateShift[]>);
  }, [template]);

  if (isLoading) {
    return (
      <div className="grid grid-cols-7 gap-1 p-2">
        {orderedDays.map((day) => (
          <div key={day} className="animate-pulse">
            <div className="text-center text-xs font-medium text-muted-foreground mb-1">
              {dayNames[day]}
            </div>
            <div className="h-8 bg-muted rounded" />
          </div>
        ))}
      </div>
    );
  }

  if (!template) return null;

  return (
    <div className="grid grid-cols-7 gap-1 p-2 bg-muted/30 rounded-md">
      {orderedDays.map((dayOfWeek) => {
        const dayShifts = shiftsByDay[dayOfWeek] || [];
        return (
          <div key={dayOfWeek} className="text-center">
            <div className="text-xs font-medium text-muted-foreground mb-1">
              {dayNames[dayOfWeek]}
            </div>
            <div className="min-h-[32px] flex flex-col gap-0.5">
              {dayShifts.slice(0, 4).map((shift, idx) => (
                <div
                  key={idx}
                  className="h-1.5 rounded-sm"
                  style={{
                    backgroundColor: shift.functions?.color || "#3B82F6",
                  }}
                  title={`${shift.functions?.name || "Ukjent"}: ${shift.start_time}-${shift.end_time}`}
                />
              ))}
              {dayShifts.length > 4 && (
                <div className="text-[9px] text-muted-foreground">
                  +{dayShifts.length - 4}
                </div>
              )}
              {dayShifts.length === 0 && (
                <div className="h-1.5 rounded-sm bg-muted" />
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

export function ManageTemplatesModal({
  open,
  onOpenChange,
  onRollout,
}: ManageTemplatesModalProps) {
  const [editingTemplate, setEditingTemplate] = useState<ShiftTemplate | null>(null);
  const [editName, setEditName] = useState("");
  const [deleteConfirmTemplate, setDeleteConfirmTemplate] = useState<ShiftTemplate | null>(null);
  const [expandedTemplateId, setExpandedTemplateId] = useState<string | null>(null);
  
  // Edit template modal state
  const [editTemplateId, setEditTemplateId] = useState<string | null>(null);
  
  // Duplicate state
  const [duplicateTemplate, setDuplicateTemplate] = useState<ShiftTemplate | null>(null);
  const [duplicateName, setDuplicateName] = useState("");

  const { data: templates = [], isLoading } = useShiftTemplates();
  const updateTemplate = useUpdateShiftTemplate();
  const deleteTemplate = useDeleteShiftTemplate();
  const duplicate = useDuplicateTemplate();

  const handleStartEdit = (template: ShiftTemplate) => {
    setEditingTemplate(template);
    setEditName(template.name);
  };

  const handleSaveEdit = async () => {
    if (!editingTemplate || !editName.trim()) return;

    await updateTemplate.mutateAsync({
      id: editingTemplate.id,
      name: editName.trim(),
    });

    setEditingTemplate(null);
    setEditName("");
  };

  const handleSetDefault = async (template: ShiftTemplate) => {
    await updateTemplate.mutateAsync({
      id: template.id,
      name: template.name,
      is_default: true,
    });
  };

  const handleDelete = async () => {
    if (!deleteConfirmTemplate) return;

    await deleteTemplate.mutateAsync(deleteConfirmTemplate.id);
    setDeleteConfirmTemplate(null);
  };

  const handleDuplicate = async () => {
    if (!duplicateTemplate || !duplicateName.trim()) return;
    await duplicate.mutateAsync({
      templateId: duplicateTemplate.id,
      newName: duplicateName.trim(),
    });
    setDuplicateTemplate(null);
    setDuplicateName("");
  };

  const toggleExpand = (templateId: string) => {
    setExpandedTemplateId((prev) => (prev === templateId ? null : templateId));
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              Administrer vaktmaler
            </DialogTitle>
            <DialogDescription>
              Se, rediger og slett dine lagrede vaktmaler.
            </DialogDescription>
          </DialogHeader>

          <ScrollArea className="max-h-[500px]">
            {isLoading ? (
              <div className="py-8 text-center text-muted-foreground">
                Laster maler...
              </div>
            ) : templates.length === 0 ? (
              <div className="py-8 text-center text-muted-foreground">
                <Copy className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Ingen maler opprettet ennå</p>
                <p className="text-sm mt-1">
                  Lagre en uke som mal for å komme i gang
                </p>
              </div>
            ) : (
              <div className="space-y-2 pr-4">
                {templates.map((template) => (
                  <Collapsible
                    key={template.id}
                    open={expandedTemplateId === template.id}
                    onOpenChange={() => toggleExpand(template.id)}
                  >
                    <div className="rounded-lg border">
                      <div className="flex items-center justify-between p-3">
                        <div className="flex-1 min-w-0">
                          {editingTemplate?.id === template.id ? (
                            <div className="flex items-center gap-2">
                              <Input
                                value={editName}
                                onChange={(e) => setEditName(e.target.value)}
                                className="h-8"
                                autoFocus
                              />
                              <Button
                                size="sm"
                                onClick={handleSaveEdit}
                                disabled={updateTemplate.isPending}
                              >
                                Lagre
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => setEditingTemplate(null)}
                              >
                                Avbryt
                              </Button>
                            </div>
                          ) : (
                            <>
                              <div className="flex items-center gap-2">
                                <CollapsibleTrigger asChild>
                                  <Button variant="ghost" size="icon" className="h-6 w-6">
                                    {expandedTemplateId === template.id ? (
                                      <ChevronDown className="h-4 w-4" />
                                    ) : (
                                      <ChevronRight className="h-4 w-4" />
                                    )}
                                  </Button>
                                </CollapsibleTrigger>
                                {template.is_default && (
                                  <Star className="h-4 w-4 text-yellow-500 fill-yellow-500 flex-shrink-0" />
                                )}
                                <span className="font-medium truncate">
                                  {template.name}
                                </span>
                              </div>
                              <div className="flex items-center gap-2 mt-1 ml-8">
                                <Badge variant="secondary" className="text-xs">
                                  {template.shift_count} vakter
                                </Badge>
                                {template.category && (
                                  <Badge variant="outline" className="text-xs">
                                    {template.category}
                                  </Badge>
                                )}
                                <span className="text-xs text-muted-foreground">
                                  Opprettet{" "}
                                  {format(new Date(template.created_at), "d. MMM yyyy", {
                                    locale: nb,
                                  })}
                                </span>
                              </div>
                            </>
                          )}
                        </div>

                        {editingTemplate?.id !== template.id && (
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-8 w-8">
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="bg-popover">
                              <DropdownMenuItem
                                onClick={() => {
                                  onRollout(template);
                                  onOpenChange(false);
                                }}
                              >
                                <Play className="h-4 w-4 mr-2" />
                                Rull ut mal
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => setEditTemplateId(template.id)}>
                                <Pencil className="h-4 w-4 mr-2" />
                                Rediger vakter
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleStartEdit(template)}>
                                <Pencil className="h-4 w-4 mr-2" />
                                Endre navn
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => {
                                  setDuplicateTemplate(template);
                                  setDuplicateName(`${template.name} (kopi)`);
                                }}
                              >
                                <Copy className="h-4 w-4 mr-2" />
                                Dupliser
                              </DropdownMenuItem>
                              {!template.is_default && (
                                <DropdownMenuItem
                                  onClick={() => handleSetDefault(template)}
                                >
                                  <Star className="h-4 w-4 mr-2" />
                                  Sett som standard
                                </DropdownMenuItem>
                              )}
                              <DropdownMenuItem
                                className="text-destructive focus:text-destructive"
                                onClick={() => setDeleteConfirmTemplate(template)}
                              >
                                <Trash2 className="h-4 w-4 mr-2" />
                                Slett
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        )}
                      </div>

                      <CollapsibleContent>
                        <div className="border-t px-3 pb-3 pt-2">
                          <p className="text-xs text-muted-foreground mb-2">
                            Forhåndsvisning av vakter per dag:
                          </p>
                          <TemplatePreviewGrid templateId={template.id} />
                        </div>
                      </CollapsibleContent>
                    </div>
                  </Collapsible>
                ))}
              </div>
            )}
          </ScrollArea>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog
        open={!!deleteConfirmTemplate}
        onOpenChange={() => setDeleteConfirmTemplate(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Slett mal</AlertDialogTitle>
            <AlertDialogDescription>
              Er du sikker på at du vil slette malen "{deleteConfirmTemplate?.name}"?
              Dette kan ikke angres.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Avbryt</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Slett
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Duplicate Template Dialog */}
      <Dialog 
        open={!!duplicateTemplate} 
        onOpenChange={(openState) => !openState && setDuplicateTemplate(null)}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Copy className="h-5 w-5" />
              Dupliser mal
            </DialogTitle>
            <DialogDescription>
              Opprett en kopi av "{duplicateTemplate?.name}"
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Navn på ny mal</Label>
              <Input
                value={duplicateName}
                onChange={(e) => setDuplicateName(e.target.value)}
                placeholder="F.eks. Standard Uke (kopi)"
              />
            </div>
            
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Badge variant="secondary">{duplicateTemplate?.shift_count}</Badge>
              <span>vakter vil bli kopiert</span>
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setDuplicateTemplate(null)}>
              Avbryt
            </Button>
            <Button
              onClick={handleDuplicate}
              disabled={!duplicateName.trim() || duplicate.isPending}
            >
              {duplicate.isPending ? "Dupliserer..." : "Dupliser"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Template Modal */}
      {editTemplateId && (
        <EditTemplateModal
          open={!!editTemplateId}
          onOpenChange={(openState) => !openState && setEditTemplateId(null)}
          templateId={editTemplateId}
        />
      )}
    </>
  );
}