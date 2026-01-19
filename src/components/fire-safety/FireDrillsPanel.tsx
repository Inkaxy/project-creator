import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { 
  Plus, 
  Flame, 
  Calendar, 
  User,
  CheckCircle2,
  Clock,
  Users,
  Timer
} from "lucide-react";
import { format } from "date-fns";
import { nb } from "date-fns/locale";
import { 
  useFireDrills, 
  useCreateFireDrill,
  useCompleteFireDrill,
  type FireDrill 
} from "@/hooks/useFireSafety";
import { useEmployees } from "@/hooks/useEmployees";

const DRILL_TYPES = [
  { value: "evacuation", label: "Evakueringsøvelse" },
  { value: "fire_alarm", label: "Brannalarmtest" },
  { value: "extinguisher", label: "Slukkeøvelse" },
  { value: "full", label: "Full brannøvelse" },
  { value: "tabletop", label: "Teoretisk gjennomgang" },
];

export function FireDrillsPanel() {
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [completingDrill, setCompletingDrill] = useState<FireDrill | null>(null);

  const { data: drills = [], isLoading } = useFireDrills();
  const { data: employees = [] } = useEmployees();
  const createDrill = useCreateFireDrill();
  const completeDrill = useCompleteFireDrill();

  const handleCreate = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);

    await createDrill.mutateAsync({
      title: formData.get("title") as string,
      description: formData.get("description") as string || undefined,
      drill_type: formData.get("drill_type") as string,
      scheduled_date: formData.get("scheduled_date") as string,
      responsible: formData.get("responsible") as string || undefined,
      meeting_point: formData.get("meeting_point") as string || undefined,
    });

    setIsCreateOpen(false);
  };

  const handleComplete = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!completingDrill) return;

    const formData = new FormData(e.currentTarget);

    await completeDrill.mutateAsync({
      id: completingDrill.id,
      duration_minutes: parseInt(formData.get("duration_minutes") as string) || undefined,
      participants_count: parseInt(formData.get("participants_count") as string) || undefined,
      evacuation_time_seconds: parseInt(formData.get("evacuation_time_seconds") as string) || undefined,
      evaluation: formData.get("evaluation") as string || undefined,
      improvement_points: formData.get("improvement_points") as string || undefined,
    });

    setCompletingDrill(null);
  };

  const getStatusBadge = (drill: FireDrill) => {
    if (drill.completed_at) {
      return <Badge className="bg-success/20 text-success border-success/30">Fullført</Badge>;
    }
    const today = new Date();
    const scheduled = new Date(drill.scheduled_date);
    if (scheduled < today) {
      return <Badge variant="destructive">Forfalt</Badge>;
    }
    return <Badge variant="outline">Planlagt</Badge>;
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-8 text-center text-muted-foreground">
          Laster brannøvelser...
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          Planlegg og dokumenter brannøvelser
        </p>
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Ny brannøvelse
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Planlegg brannøvelse</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleCreate} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="title">Tittel *</Label>
                <Input 
                  id="title" 
                  name="title" 
                  placeholder="F.eks. Kvartalsvis brannøvelse Q1" 
                  required 
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="drill_type">Type øvelse *</Label>
                <Select name="drill_type" required defaultValue="evacuation">
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {DRILL_TYPES.map(type => (
                      <SelectItem key={type.value} value={type.value}>
                        {type.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Beskrivelse</Label>
                <Textarea 
                  id="description" 
                  name="description" 
                  placeholder="Beskriv formål og plan for øvelsen" 
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="scheduled_date">Dato *</Label>
                  <Input 
                    id="scheduled_date" 
                    name="scheduled_date" 
                    type="date" 
                    required 
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="meeting_point">Møteplass</Label>
                  <Input 
                    id="meeting_point" 
                    name="meeting_point" 
                    placeholder="F.eks. Parkeringsplass" 
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="responsible">Ansvarlig</Label>
                <Select name="responsible">
                  <SelectTrigger>
                    <SelectValue placeholder="Velg ansvarlig" />
                  </SelectTrigger>
                  <SelectContent>
                    {employees.map(emp => (
                      <SelectItem key={emp.id} value={emp.id}>
                        {emp.full_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex justify-end gap-2 pt-4">
                <Button type="button" variant="outline" onClick={() => setIsCreateOpen(false)}>
                  Avbryt
                </Button>
                <Button type="submit" disabled={createDrill.isPending}>
                  {createDrill.isPending ? "Oppretter..." : "Opprett"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Drills List */}
      {drills.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center">
            <Flame className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="font-medium text-lg mb-2">Ingen brannøvelser</h3>
            <p className="text-muted-foreground mb-4">
              Planlegg din første brannøvelse
            </p>
            <Button onClick={() => setIsCreateOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Ny brannøvelse
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {drills.map(drill => (
            <Card key={drill.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="font-medium">{drill.title}</h3>
                      {getStatusBadge(drill)}
                      <Badge variant="outline">
                        {DRILL_TYPES.find(t => t.value === drill.drill_type)?.label || drill.drill_type}
                      </Badge>
                    </div>

                    {drill.description && (
                      <p className="text-sm text-muted-foreground mb-3">
                        {drill.description}
                      </p>
                    )}

                    <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Calendar className="h-4 w-4" />
                        {format(new Date(drill.scheduled_date), "d. MMMM yyyy", { locale: nb })}
                      </div>

                      {drill.meeting_point && (
                        <div className="flex items-center gap-1">
                          📍 {drill.meeting_point}
                        </div>
                      )}

                      {drill.responsible_person && (
                        <div className="flex items-center gap-1">
                          <User className="h-4 w-4" />
                          {drill.responsible_person.full_name}
                        </div>
                      )}

                      {drill.completed_at && (
                        <>
                          {drill.participants_count && (
                            <div className="flex items-center gap-1 text-success">
                              <Users className="h-4 w-4" />
                              {drill.participants_count} deltakere
                            </div>
                          )}
                          {drill.duration_minutes && (
                            <div className="flex items-center gap-1 text-success">
                              <Clock className="h-4 w-4" />
                              {drill.duration_minutes} min
                            </div>
                          )}
                          {drill.evacuation_time_seconds && (
                            <div className="flex items-center gap-1 text-success">
                              <Timer className="h-4 w-4" />
                              {drill.evacuation_time_seconds}s evakuering
                            </div>
                          )}
                        </>
                      )}
                    </div>

                    {drill.completed_at && (drill.evaluation || drill.improvement_points) && (
                      <div className="mt-3 pt-3 border-t space-y-2">
                        {drill.evaluation && (
                          <div className="text-sm">
                            <span className="font-medium">Evaluering: </span>
                            {drill.evaluation}
                          </div>
                        )}
                        {drill.improvement_points && (
                          <div className="text-sm">
                            <span className="font-medium text-warning">Forbedringspunkter: </span>
                            {drill.improvement_points}
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-2 ml-4">
                    {!drill.completed_at && (
                      <Button 
                        size="sm"
                        onClick={() => setCompletingDrill(drill)}
                      >
                        <CheckCircle2 className="h-4 w-4 mr-1" />
                        Fullfør
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Complete Drill Modal */}
      <Dialog open={!!completingDrill} onOpenChange={() => setCompletingDrill(null)}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Registrer gjennomført øvelse</DialogTitle>
          </DialogHeader>
          {completingDrill && (
            <form onSubmit={handleComplete} className="space-y-4">
              <div className="p-3 rounded-lg bg-muted/50">
                <p className="font-medium">{completingDrill.title}</p>
                <p className="text-sm text-muted-foreground">
                  {format(new Date(completingDrill.scheduled_date), "d. MMMM yyyy", { locale: nb })}
                </p>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="participants_count">Deltakere</Label>
                  <Input 
                    id="participants_count" 
                    name="participants_count" 
                    type="number" 
                    min="1"
                    placeholder="Antall"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="duration_minutes">Varighet (min)</Label>
                  <Input 
                    id="duration_minutes" 
                    name="duration_minutes" 
                    type="number" 
                    min="1"
                    placeholder="Minutter"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="evacuation_time_seconds">Evak.tid (sek)</Label>
                  <Input 
                    id="evacuation_time_seconds" 
                    name="evacuation_time_seconds" 
                    type="number" 
                    min="1"
                    placeholder="Sekunder"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="evaluation">Evaluering</Label>
                <Textarea 
                  id="evaluation" 
                  name="evaluation" 
                  placeholder="Hvordan gikk øvelsen? Var alle rutiner fulgt?" 
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="improvement_points">Forbedringspunkter</Label>
                <Textarea 
                  id="improvement_points" 
                  name="improvement_points" 
                  placeholder="Hva kan forbedres til neste gang?" 
                />
              </div>

              <div className="flex justify-end gap-2 pt-4">
                <Button type="button" variant="outline" onClick={() => setCompletingDrill(null)}>
                  Avbryt
                </Button>
                <Button type="submit" disabled={completeDrill.isPending}>
                  {completeDrill.isPending ? "Lagrer..." : "Registrer fullført"}
                </Button>
              </div>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
