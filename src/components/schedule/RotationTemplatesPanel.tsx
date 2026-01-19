import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
  useRotationGroups,
  useDeleteRotationGroup,
  RotationGroup,
} from "@/hooks/useShiftTemplates";
import { 
  RefreshCcw, 
  Plus, 
  MoreVertical, 
  Pencil, 
  Trash2, 
  Play,
  ArrowRight,
  Calendar,
} from "lucide-react";

interface RotationTemplatesPanelProps {
  onCreateNew: () => void;
  onEdit: (group: RotationGroup) => void;
  onRollout: (group: RotationGroup) => void;
  departmentId?: string | null;
}

const ROTATION_NAMES = ["A", "B", "C", "D", "E", "F"];

export function RotationTemplatesPanel({
  onCreateNew,
  onEdit,
  onRollout,
  departmentId,
}: RotationTemplatesPanelProps) {
  const { data: groups = [], isLoading } = useRotationGroups(departmentId);
  const deleteGroup = useDeleteRotationGroup();
  
  const [deleteConfirm, setDeleteConfirm] = useState<RotationGroup | null>(null);

  if (isLoading) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <RefreshCcw className="h-4 w-4" />
            Roterende vaktmaler
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-4 text-sm text-muted-foreground">
            Laster rotasjoner...
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2 text-base">
                <RefreshCcw className="h-4 w-4" />
                Roterende vaktmaler
              </CardTitle>
              <CardDescription className="text-xs">
                Automatisk rotasjon over flere uker
              </CardDescription>
            </div>
            <Button onClick={onCreateNew} size="sm" variant="outline">
              <Plus className="h-3 w-3 mr-1" />
              Ny
            </Button>
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          {groups.length === 0 ? (
            <div className="text-center py-4">
              <RefreshCcw className="h-8 w-8 mx-auto text-muted-foreground/50 mb-2" />
              <p className="text-sm text-muted-foreground">
                Ingen roterende maler ennå
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {groups.map((group) => (
                <div
                  key={group.id}
                  className="border rounded-lg p-3 space-y-2"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-sm">{group.name}</span>
                        <Badge variant="secondary" className="text-xs">
                          {group.rotation_length} uker
                        </Badge>
                      </div>
                    </div>
                    
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-6 w-6">
                          <MoreVertical className="h-3 w-3" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="bg-popover">
                        <DropdownMenuItem onClick={() => onRollout(group)}>
                          <Play className="mr-2 h-3 w-3" />
                          Rull ut
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => onEdit(group)}>
                          <Pencil className="mr-2 h-3 w-3" />
                          Rediger
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          onClick={() => setDeleteConfirm(group)}
                          className="text-destructive"
                        >
                          <Trash2 className="mr-2 h-3 w-3" />
                          Slett
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>

                  {/* Rotation pattern visualization */}
                  <div className="flex items-center gap-1 flex-wrap">
                    {group.templates?.map((template, index) => (
                      <div key={template.id} className="flex items-center gap-1">
                        <div className="bg-primary/10 border border-primary/20 rounded px-2 py-1 text-center">
                          <div className="text-[10px] font-medium text-primary">
                            {template.rotation_name || ROTATION_NAMES[index]}
                          </div>
                          <div className="text-xs truncate max-w-[60px]">
                            {template.name}
                          </div>
                        </div>
                        {index < (group.templates?.length || 0) - 1 && (
                          <ArrowRight className="h-3 w-3 text-muted-foreground" />
                        )}
                      </div>
                    ))}
                  </div>

                  {group.templates && group.templates.length > 0 && (
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Calendar className="h-3 w-3" />
                      <span>
                        {group.templates.reduce((sum, t) => sum + (t.shift_count || 0), 0)} vakter/rotasjon
                      </span>
                    </div>
                  )}

                  <Button
                    variant="default"
                    size="sm"
                    className="w-full h-7 text-xs"
                    onClick={() => onRollout(group)}
                  >
                    <Play className="h-3 w-3 mr-1" />
                    Rull ut
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <AlertDialog 
        open={!!deleteConfirm} 
        onOpenChange={(open) => !open && setDeleteConfirm(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Slett rotasjonsgruppe?</AlertDialogTitle>
            <AlertDialogDescription>
              Er du sikker på at du vil slette "{deleteConfirm?.name}"? 
              Malene i gruppen vil beholdes.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Avbryt</AlertDialogCancel>
            <AlertDialogAction
              onClick={async () => {
                if (deleteConfirm) {
                  await deleteGroup.mutateAsync(deleteConfirm.id);
                  setDeleteConfirm(null);
                }
              }}
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