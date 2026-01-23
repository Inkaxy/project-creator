import { useState } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
import { CreateRoutineModal } from "@/components/routines/CreateRoutineModal";
import { useRoutines, useDeleteRoutine, useRoutineCompletions, Routine } from "@/hooks/useRoutines";
import { useDepartments } from "@/hooks/useEmployees";
import { format } from "date-fns";
import { nb } from "date-fns/locale";
import {
  ClipboardList,
  ClipboardCheck,
  FileText,
  CheckSquare,
  ListChecks,
  Plus,
  Filter,
  MoreVertical,
  Pencil,
  Trash2,
  CheckCircle2,
  Clock,
} from "lucide-react";

const ICON_MAP: Record<string, React.ElementType> = {
  "clipboard-list": ClipboardList,
  "clipboard-check": ClipboardCheck,
  "file-text": FileText,
  "check-square": CheckSquare,
  "list-checks": ListChecks,
};

const FREQUENCY_LABELS: Record<string, string> = {
  daily: "Daglig",
  weekly: "Ukentlig",
  monthly: "Månedlig",
  shift: "Per vakt",
};

export default function RoutinesPage() {
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [departmentFilter, setDepartmentFilter] = useState<string>("all");
  const [deleteConfirm, setDeleteConfirm] = useState<Routine | null>(null);

  const today = new Date().toISOString().split("T")[0];
  const { data: routines = [], isLoading } = useRoutines(
    departmentFilter !== "all" ? departmentFilter : undefined
  );
  const { data: departments = [] } = useDepartments();
  const { data: todayCompletions = [] } = useRoutineCompletions(today);
  const deleteRoutine = useDeleteRoutine();

  // Check if routine is completed today
  const isRoutineCompletedToday = (routineId: string) => {
    return todayCompletions.some((c) => c.routine_id === routineId);
  };

  const handleDelete = async () => {
    if (!deleteConfirm) return;
    await deleteRoutine.mutateAsync(deleteConfirm.id);
    setDeleteConfirm(null);
  };

  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-4 pl-12 sm:flex-row sm:items-center sm:justify-between lg:pl-0">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Rutiner</h1>
            <p className="text-muted-foreground">
              {format(new Date(), "EEEE d. MMMM yyyy", { locale: nb })}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Select value={departmentFilter} onValueChange={setDepartmentFilter}>
              <SelectTrigger className="w-[180px]">
                <Filter className="h-4 w-4 mr-2" />
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
            <Button onClick={() => setCreateModalOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Ny rutine
            </Button>
          </div>
        </div>

        {/* Content */}
        {isLoading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-24 w-full" />
            ))}
          </div>
        ) : routines.length === 0 ? (
          <Card>
            <CardContent className="py-12">
              <div className="text-center text-muted-foreground">
                <ClipboardList className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <h3 className="text-lg font-semibold mb-2">Ingen rutiner ennå</h3>
                <p className="text-sm mb-4">
                  Opprett din første rutineliste for å komme i gang
                </p>
                <Button onClick={() => setCreateModalOpen(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Opprett rutineliste
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {routines.map((routine) => {
              const IconComponent = ICON_MAP[routine.icon || "clipboard-list"] || ClipboardList;
              const isCompleted = isRoutineCompletedToday(routine.id);
              const itemCount = routine.routine_items?.length || 0;

              return (
                <Card
                  key={routine.id}
                  className={`relative overflow-hidden transition-all ${
                    isCompleted ? "border-success/50 bg-success/5" : ""
                  }`}
                >
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-3">
                        <div
                          className={`h-10 w-10 rounded-lg flex items-center justify-center ${
                            isCompleted
                              ? "bg-success/20 text-success"
                              : "bg-primary/10 text-primary"
                          }`}
                        >
                          {isCompleted ? (
                            <CheckCircle2 className="h-5 w-5" />
                          ) : (
                            <IconComponent className="h-5 w-5" />
                          )}
                        </div>
                        <div>
                          <CardTitle className="text-base">{routine.name}</CardTitle>
                          {routine.description && (
                            <CardDescription className="text-xs mt-1 line-clamp-2">
                              {routine.description}
                            </CardDescription>
                          )}
                        </div>
                      </div>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem>
                            <Pencil className="h-4 w-4 mr-2" />
                            Rediger
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            className="text-destructive focus:text-destructive"
                            onClick={() => setDeleteConfirm(routine)}
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Slett
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="flex items-center flex-wrap gap-2">
                      <Badge variant="outline" className="text-xs">
                        {FREQUENCY_LABELS[routine.frequency] || routine.frequency}
                      </Badge>
                      {itemCount > 0 && (
                        <Badge variant="secondary" className="text-xs">
                          {itemCount} punkt{itemCount !== 1 ? "er" : ""}
                        </Badge>
                      )}
                      {routine.functions && (
                        <Badge
                          variant="secondary"
                          className="text-xs"
                          style={{
                            backgroundColor: `${routine.functions.color || "#3B82F6"}20`,
                            color: routine.functions.color || "#3B82F6",
                          }}
                        >
                          {routine.functions.name}
                        </Badge>
                      )}
                      {isCompleted && (
                        <Badge variant="success" className="text-xs bg-success/10 text-success">
                          Fullført i dag
                        </Badge>
                      )}
                    </div>

                    {!isCompleted && (
                      <Button className="w-full mt-4" variant="outline">
                        <CheckSquare className="h-4 w-4 mr-2" />
                        Fullfør rutine
                      </Button>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      {/* Modals */}
      <CreateRoutineModal open={createModalOpen} onOpenChange={setCreateModalOpen} />

      {/* Delete confirmation */}
      <AlertDialog open={!!deleteConfirm} onOpenChange={() => setDeleteConfirm(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Slett rutine</AlertDialogTitle>
            <AlertDialogDescription>
              Er du sikker på at du vil slette "{deleteConfirm?.name}"? Dette kan ikke angres.
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
    </MainLayout>
  );
}
