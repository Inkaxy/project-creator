import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
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
import { format } from "date-fns";
import { nb } from "date-fns/locale";
import {
  useShiftTemplates,
  useUpdateShiftTemplate,
  useDeleteShiftTemplate,
  ShiftTemplate,
} from "@/hooks/useShiftTemplates";
import {
  Settings,
  MoreVertical,
  Star,
  Trash2,
  Pencil,
  Copy,
} from "lucide-react";

interface ManageTemplatesModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onRollout: (template: ShiftTemplate) => void;
}

export function ManageTemplatesModal({
  open,
  onOpenChange,
  onRollout,
}: ManageTemplatesModalProps) {
  const [editingTemplate, setEditingTemplate] = useState<ShiftTemplate | null>(null);
  const [editName, setEditName] = useState("");
  const [deleteConfirmTemplate, setDeleteConfirmTemplate] = useState<ShiftTemplate | null>(null);

  const { data: templates = [], isLoading } = useShiftTemplates();
  const updateTemplate = useUpdateShiftTemplate();
  const deleteTemplate = useDeleteShiftTemplate();

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

          <ScrollArea className="max-h-[400px]">
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
                  <div
                    key={template.id}
                    className="flex items-center justify-between rounded-lg border p-3"
                  >
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
                            {template.is_default && (
                              <Star className="h-4 w-4 text-yellow-500 fill-yellow-500 flex-shrink-0" />
                            )}
                            <span className="font-medium truncate">
                              {template.name}
                            </span>
                          </div>
                          <div className="flex items-center gap-2 mt-1">
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
                            <Copy className="h-4 w-4 mr-2" />
                            Rull ut mal
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleStartEdit(template)}>
                            <Pencil className="h-4 w-4 mr-2" />
                            Endre navn
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
    </>
  );
}
