import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
  ClipboardCheck, 
  Calendar, 
  User,
  CheckCircle2,
  Clock,
  Building
} from "lucide-react";
import { format } from "date-fns";
import { nb } from "date-fns/locale";
import { 
  useSafetyRounds, 
  useCreateSafetyRound,
  useCompleteSafetyRound,
  type SafetyRound 
} from "@/hooks/useSafetyRounds";
import { useEmployees } from "@/hooks/useEmployees";
import { useDepartments } from "@/hooks/useEmployees";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

export function SafetyRoundsPanel() {
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [selectedRound, setSelectedRound] = useState<SafetyRound | null>(null);

  const { data: safetyRounds = [], isLoading } = useSafetyRounds(statusFilter);
  const { data: employees = [] } = useEmployees();
  const { data: departments = [] } = useDepartments();
  const createRound = useCreateSafetyRound();
  const completeRound = useCompleteSafetyRound();
  const { user } = useAuth();

  const handleCreate = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    
    await createRound.mutateAsync({
      title: formData.get("title") as string,
      description: formData.get("description") as string || undefined,
      department_id: formData.get("department_id") as string || undefined,
      assigned_to: formData.get("assigned_to") as string || undefined,
      scheduled_date: formData.get("scheduled_date") as string,
    });
    
    setIsCreateOpen(false);
  };

  const handleComplete = async (round: SafetyRound) => {
    if (!user) {
      toast.error("Du må være logget inn");
      return;
    }

    await completeRound.mutateAsync({
      id: round.id,
      completedBy: user.id,
      notes: "Vernerunde gjennomført",
    });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "completed":
        return <Badge className="bg-success/20 text-success border-success/30">Fullført</Badge>;
      case "in_progress":
        return <Badge className="bg-primary/20 text-primary border-primary/30">Pågår</Badge>;
      case "planned":
        return <Badge variant="outline">Planlagt</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-8 text-center text-muted-foreground">
          Laster vernerunder...
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filtrer status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Alle</SelectItem>
              <SelectItem value="planned">Planlagt</SelectItem>
              <SelectItem value="in_progress">Pågår</SelectItem>
              <SelectItem value="completed">Fullført</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Ny vernerunde
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Opprett vernerunde</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleCreate} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="title">Tittel *</Label>
                <Input 
                  id="title" 
                  name="title" 
                  placeholder="F.eks. Kvartalsvis vernerunde Q1" 
                  required 
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Beskrivelse</Label>
                <Textarea 
                  id="description" 
                  name="description" 
                  placeholder="Beskriv fokusområder for vernerunden" 
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="scheduled_date">Planlagt dato *</Label>
                  <Input 
                    id="scheduled_date" 
                    name="scheduled_date" 
                    type="date" 
                    required 
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="department_id">Avdeling</Label>
                  <Select name="department_id">
                    <SelectTrigger>
                      <SelectValue placeholder="Velg avdeling" />
                    </SelectTrigger>
                    <SelectContent>
                      {departments.map((dept) => (
                        <SelectItem key={dept.id} value={dept.id}>
                          {dept.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="assigned_to">Ansvarlig</Label>
                <Select name="assigned_to">
                  <SelectTrigger>
                    <SelectValue placeholder="Velg ansvarlig" />
                  </SelectTrigger>
                  <SelectContent>
                    {employees.map((emp) => (
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
                <Button type="submit" disabled={createRound.isPending}>
                  {createRound.isPending ? "Oppretter..." : "Opprett"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Safety Rounds List */}
      {safetyRounds.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center">
            <ClipboardCheck className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="font-medium text-lg mb-2">Ingen vernerunder</h3>
            <p className="text-muted-foreground mb-4">
              Opprett din første vernerunde for å komme i gang
            </p>
            <Button onClick={() => setIsCreateOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Ny vernerunde
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {safetyRounds.map((round) => (
            <Card key={round.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="font-medium">{round.title}</h3>
                      {getStatusBadge(round.status)}
                    </div>
                    
                    {round.description && (
                      <p className="text-sm text-muted-foreground mb-3">
                        {round.description}
                      </p>
                    )}

                    <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Calendar className="h-4 w-4" />
                        {format(new Date(round.scheduled_date), "d. MMMM yyyy", { locale: nb })}
                      </div>
                      
                      {round.departments && (
                        <div className="flex items-center gap-1">
                          <Building className="h-4 w-4" />
                          {round.departments.name}
                        </div>
                      )}
                      
                      {round.assignee && (
                        <div className="flex items-center gap-1">
                          <User className="h-4 w-4" />
                          {round.assignee.full_name}
                        </div>
                      )}

                      {round.completed_at && (
                        <div className="flex items-center gap-1 text-success">
                          <CheckCircle2 className="h-4 w-4" />
                          Fullført {format(new Date(round.completed_at), "d. MMM yyyy", { locale: nb })}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {round.status === "planned" && (
                      <Button 
                        size="sm"
                        onClick={() => handleComplete(round)}
                        disabled={completeRound.isPending}
                      >
                        <CheckCircle2 className="h-4 w-4 mr-1" />
                        Fullfør
                      </Button>
                    )}
                    <Button variant="outline" size="sm" onClick={() => setSelectedRound(round)}>
                      Detaljer
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Detail Modal */}
      <Dialog open={!!selectedRound} onOpenChange={() => setSelectedRound(null)}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>{selectedRound?.title}</DialogTitle>
          </DialogHeader>
          {selectedRound && (
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                {getStatusBadge(selectedRound.status)}
              </div>

              {selectedRound.description && (
                <div>
                  <Label className="text-muted-foreground">Beskrivelse</Label>
                  <p className="mt-1">{selectedRound.description}</p>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-muted-foreground">Planlagt dato</Label>
                  <p className="mt-1">
                    {format(new Date(selectedRound.scheduled_date), "d. MMMM yyyy", { locale: nb })}
                  </p>
                </div>

                {selectedRound.departments && (
                  <div>
                    <Label className="text-muted-foreground">Avdeling</Label>
                    <p className="mt-1">{selectedRound.departments.name}</p>
                  </div>
                )}
              </div>

              {selectedRound.assignee && (
                <div>
                  <Label className="text-muted-foreground">Ansvarlig</Label>
                  <p className="mt-1">{selectedRound.assignee.full_name}</p>
                </div>
              )}

              {selectedRound.completer && (
                <div>
                  <Label className="text-muted-foreground">Fullført av</Label>
                  <p className="mt-1">
                    {selectedRound.completer.full_name}
                    {selectedRound.completed_at && (
                      <span className="text-muted-foreground">
                        {" "}• {format(new Date(selectedRound.completed_at), "d. MMM yyyy HH:mm", { locale: nb })}
                      </span>
                    )}
                  </p>
                </div>
              )}

              {selectedRound.notes && (
                <div>
                  <Label className="text-muted-foreground">Notater</Label>
                  <p className="mt-1">{selectedRound.notes}</p>
                </div>
              )}

              <div className="flex justify-end pt-4">
                <Button variant="outline" onClick={() => setSelectedRound(null)}>
                  Lukk
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
