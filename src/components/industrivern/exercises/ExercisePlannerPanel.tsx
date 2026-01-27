import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  Plus, 
  Calendar,
  Users,
  MapPin,
  Clock,
  CheckCircle,
  XCircle,
  MoreHorizontal
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useIndustrivernExercises, useCompleteExercise, useDeleteExercise } from "@/hooks/useIndustrivernExercises";
import { EXERCISE_TYPE_LABELS, INDUSTRIVERN_ROLE_LABELS } from "@/types/industrivern";
import { format } from "date-fns";
import { nb } from "date-fns/locale";
import { CreateExerciseModal } from "./CreateExerciseModal";

export function ExercisePlannerPanel() {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const { data: exercises, isLoading } = useIndustrivernExercises();
  const completeMutation = useCompleteExercise();
  const deleteMutation = useDeleteExercise();

  const plannedExercises = exercises?.filter((e) => e.status === "planned") || [];
  const completedExercises = exercises?.filter((e) => e.status === "completed") || [];

  const currentYear = new Date().getFullYear();
  const h1Completed = completedExercises.filter((e) => {
    const month = new Date(e.planned_date).getMonth();
    const year = new Date(e.planned_date).getFullYear();
    return year === currentYear && month < 6;
  }).length;
  const h2Completed = completedExercises.filter((e) => {
    const month = new Date(e.planned_date).getMonth();
    const year = new Date(e.planned_date).getFullYear();
    return year === currentYear && month >= 6;
  }).length;

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "planned":
        return <Badge variant="secondary">Planlagt</Badge>;
      case "completed":
        return <Badge className="bg-green-100 text-green-800">Gjennomført</Badge>;
      case "cancelled":
        return <Badge variant="destructive">Avlyst</Badge>;
      case "postponed":
        return <Badge variant="outline">Utsatt</Badge>;
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Øvelser</h2>
          <p className="text-muted-foreground">
            Planlegg og dokumenter industrivernøvelser
          </p>
        </div>
        <Button onClick={() => setShowCreateModal(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Planlegg øvelse
        </Button>
      </div>

      {/* Exercise Compliance Status */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">1. halvår {currentYear}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4">
              <div className="text-3xl font-bold">
                {h1Completed} <span className="text-lg font-normal text-muted-foreground">/ 1</span>
              </div>
              {h1Completed >= 1 ? (
                <Badge className="bg-green-100 text-green-800">Oppfylt</Badge>
              ) : (
                <Badge variant="secondary">I prosess</Badge>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">2. halvår {currentYear}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4">
              <div className="text-3xl font-bold">
                {h2Completed} <span className="text-lg font-normal text-muted-foreground">/ 1</span>
              </div>
              {h2Completed >= 1 ? (
                <Badge className="bg-green-100 text-green-800">Oppfylt</Badge>
              ) : new Date().getMonth() < 6 ? (
                <Badge variant="outline">Ikke startet</Badge>
              ) : (
                <Badge variant="secondary">I prosess</Badge>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Planned Exercises */}
      <Card>
        <CardHeader>
          <CardTitle>Planlagte øvelser</CardTitle>
          <CardDescription>Kommende øvelser som skal gjennomføres</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-24 w-full" />
              ))}
            </div>
          ) : plannedExercises.length > 0 ? (
            <div className="space-y-4">
              {plannedExercises.map((exercise) => (
                <div 
                  key={exercise.id} 
                  className="flex items-center justify-between p-4 rounded-lg border"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold">{exercise.title}</span>
                      {getStatusBadge(exercise.status)}
                      <Badge variant="outline">
                        {EXERCISE_TYPE_LABELS[exercise.exercise_type]}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Calendar className="h-4 w-4" />
                        {format(new Date(exercise.planned_date), "d. MMM yyyy", { locale: nb })}
                      </span>
                      {exercise.planned_start && (
                        <span className="flex items-center gap-1">
                          <Clock className="h-4 w-4" />
                          {exercise.planned_start.slice(0, 5)}
                          {exercise.planned_end && ` - ${exercise.planned_end.slice(0, 5)}`}
                        </span>
                      )}
                      {exercise.location && (
                        <span className="flex items-center gap-1">
                          <MapPin className="h-4 w-4" />
                          {exercise.location}
                        </span>
                      )}
                    </div>
                    {exercise.target_roles && exercise.target_roles.length > 0 && (
                      <div className="flex items-center gap-1 text-sm text-muted-foreground">
                        <Users className="h-4 w-4" />
                        {exercise.target_roles.map((r) => INDUSTRIVERN_ROLE_LABELS[r]).join(", ")}
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <Button 
                      size="sm" 
                      onClick={() => completeMutation.mutate({
                        id: exercise.id,
                        actual_date: new Date().toISOString().split("T")[0],
                      })}
                    >
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Fullfør
                    </Button>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem>Rediger</DropdownMenuItem>
                        <DropdownMenuItem>Utsett</DropdownMenuItem>
                        <DropdownMenuItem 
                          className="text-destructive"
                          onClick={() => deleteMutation.mutate(exercise.id)}
                        >
                          Slett
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <Calendar className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
              <p className="text-muted-foreground mb-4">Ingen planlagte øvelser</p>
              <Button onClick={() => setShowCreateModal(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Planlegg øvelse
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Completed Exercises */}
      {completedExercises.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Gjennomførte øvelser</CardTitle>
            <CardDescription>Historikk over gjennomførte øvelser</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {completedExercises.slice(0, 5).map((exercise) => (
                <div 
                  key={exercise.id} 
                  className="flex items-center justify-between p-3 rounded-lg border"
                >
                  <div className="flex items-center gap-3">
                    <CheckCircle className="h-5 w-5 text-green-600" />
                    <div>
                      <span className="font-medium">{exercise.title}</span>
                      <p className="text-sm text-muted-foreground">
                        {format(new Date(exercise.actual_date || exercise.planned_date), "d. MMM yyyy", { locale: nb })}
                        {" · "}
                        {EXERCISE_TYPE_LABELS[exercise.exercise_type]}
                      </p>
                    </div>
                  </div>
                  <Button variant="ghost" size="sm">
                    Se evaluering
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <CreateExerciseModal 
        open={showCreateModal} 
        onOpenChange={setShowCreateModal} 
      />
    </div>
  );
}
