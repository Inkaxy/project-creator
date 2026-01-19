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
  AlertTriangle,
  CheckCircle2,
  MapPin,
  Calendar,
  ClipboardCheck,
  Wrench
} from "lucide-react";
import { format, isPast, isWithinInterval, addDays } from "date-fns";
import { nb } from "date-fns/locale";
import { 
  useFireEquipment, 
  useCreateFireEquipment,
  useCreateEquipmentInspection,
  type FireEquipment 
} from "@/hooks/useFireSafety";
import { useAuth } from "@/contexts/AuthContext";

const EQUIPMENT_TYPES = [
  { value: "slukker", label: "Brannslukker" },
  { value: "roykvarsel", label: "Røykvarsler" },
  { value: "nodlys", label: "Nødlys" },
  { value: "brannslange", label: "Brannslange" },
  { value: "sprinkler", label: "Sprinkleranlegg" },
  { value: "branndor", label: "Branndør" },
  { value: "annet", label: "Annet" },
];

const STATUS_OPTIONS = [
  { value: "ok", label: "OK", color: "success" },
  { value: "needs_service", label: "Trenger service", color: "warning" },
  { value: "defect", label: "Defekt", color: "destructive" },
];

export function FireEquipmentPanel() {
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [inspectingEquipment, setInspectingEquipment] = useState<FireEquipment | null>(null);
  const [filterType, setFilterType] = useState<string>("all");

  const { data: equipment = [], isLoading } = useFireEquipment();
  const createEquipment = useCreateFireEquipment();
  const createInspection = useCreateEquipmentInspection();
  const { user } = useAuth();

  const filteredEquipment = filterType === "all" 
    ? equipment 
    : equipment.filter(e => e.equipment_type === filterType);

  const handleCreate = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);

    await createEquipment.mutateAsync({
      name: formData.get("name") as string,
      equipment_type: formData.get("equipment_type") as string,
      location: formData.get("location") as string,
      serial_number: formData.get("serial_number") as string || undefined,
      next_inspection_date: formData.get("next_inspection_date") as string || undefined,
      next_service_date: formData.get("next_service_date") as string || undefined,
    });

    setIsCreateOpen(false);
  };

  const handleInspection = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!inspectingEquipment || !user) return;

    const formData = new FormData(e.currentTarget);

    await createInspection.mutateAsync({
      equipment_id: inspectingEquipment.id,
      inspected_by: user.id,
      status: formData.get("status") as string,
      notes: formData.get("notes") as string || undefined,
      inspection_type: "visual",
    });

    setInspectingEquipment(null);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "ok":
        return <Badge className="bg-success/20 text-success border-success/30">OK</Badge>;
      case "needs_service":
        return <Badge className="bg-warning/20 text-warning border-warning/30">Trenger service</Badge>;
      case "defect":
        return <Badge variant="destructive">Defekt</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const getInspectionStatus = (eq: FireEquipment) => {
    if (!eq.next_inspection_date) return null;
    
    const nextDate = new Date(eq.next_inspection_date);
    const today = new Date();
    
    if (isPast(nextDate)) {
      return { status: "overdue", label: "Forfalt", variant: "destructive" as const };
    }
    
    if (isWithinInterval(nextDate, { start: today, end: addDays(today, 30) })) {
      return { status: "soon", label: "Snart", variant: "warning" as const };
    }
    
    return { status: "ok", label: "OK", variant: "secondary" as const };
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-8 text-center text-muted-foreground">
          Laster utstyr...
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Select value={filterType} onValueChange={setFilterType}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filtrer type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Alle typer</SelectItem>
              {EQUIPMENT_TYPES.map(type => (
                <SelectItem key={type.value} value={type.value}>
                  {type.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Legg til utstyr
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Legg til brannvernutstyr</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleCreate} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Navn *</Label>
                <Input 
                  id="name" 
                  name="name" 
                  placeholder="F.eks. Brannslukker Kjøkken" 
                  required 
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="equipment_type">Type *</Label>
                  <Select name="equipment_type" required defaultValue="slukker">
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {EQUIPMENT_TYPES.map(type => (
                        <SelectItem key={type.value} value={type.value}>
                          {type.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="location">Plassering *</Label>
                  <Input 
                    id="location" 
                    name="location" 
                    placeholder="F.eks. Kjøkken" 
                    required 
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="serial_number">Serienummer</Label>
                <Input 
                  id="serial_number" 
                  name="serial_number" 
                  placeholder="Valgfritt" 
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="next_inspection_date">Neste kontroll</Label>
                  <Input 
                    id="next_inspection_date" 
                    name="next_inspection_date" 
                    type="date" 
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="next_service_date">Neste service</Label>
                  <Input 
                    id="next_service_date" 
                    name="next_service_date" 
                    type="date" 
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-4">
                <Button type="button" variant="outline" onClick={() => setIsCreateOpen(false)}>
                  Avbryt
                </Button>
                <Button type="submit" disabled={createEquipment.isPending}>
                  {createEquipment.isPending ? "Lagrer..." : "Legg til"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Equipment List */}
      {filteredEquipment.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center">
            <Wrench className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="font-medium text-lg mb-2">Ingen utstyr registrert</h3>
            <p className="text-muted-foreground mb-4">
              Legg til brannvernutstyr for å holde oversikt
            </p>
            <Button onClick={() => setIsCreateOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Legg til utstyr
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredEquipment.map(eq => {
            const inspectionStatus = getInspectionStatus(eq);
            
            return (
              <Card key={eq.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h3 className="font-medium">{eq.name}</h3>
                      <p className="text-sm text-muted-foreground">
                        {EQUIPMENT_TYPES.find(t => t.value === eq.equipment_type)?.label}
                      </p>
                    </div>
                    {getStatusBadge(eq.status)}
                  </div>

                  <div className="space-y-2 text-sm">
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <MapPin className="h-4 w-4" />
                      {eq.location}
                    </div>

                    {eq.last_inspected_at && (
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <CheckCircle2 className="h-4 w-4" />
                        Sist kontrollert: {format(new Date(eq.last_inspected_at), "d. MMM yyyy", { locale: nb })}
                      </div>
                    )}

                    {eq.next_inspection_date && (
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4" />
                        <span>Neste: {format(new Date(eq.next_inspection_date), "d. MMM yyyy", { locale: nb })}</span>
                        {inspectionStatus && (
                          <Badge variant={inspectionStatus.variant} className="text-xs">
                            {inspectionStatus.label}
                          </Badge>
                        )}
                      </div>
                    )}

                    {eq.serial_number && (
                      <div className="text-xs text-muted-foreground">
                        SN: {eq.serial_number}
                      </div>
                    )}
                  </div>

                  <div className="mt-4 pt-3 border-t">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="w-full"
                      onClick={() => setInspectingEquipment(eq)}
                    >
                      <ClipboardCheck className="h-4 w-4 mr-2" />
                      Registrer kontroll
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Inspection Modal */}
      <Dialog open={!!inspectingEquipment} onOpenChange={() => setInspectingEquipment(null)}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle>Registrer kontroll</DialogTitle>
          </DialogHeader>
          {inspectingEquipment && (
            <form onSubmit={handleInspection} className="space-y-4">
              <div className="p-3 rounded-lg bg-muted/50">
                <p className="font-medium">{inspectingEquipment.name}</p>
                <p className="text-sm text-muted-foreground">
                  {inspectingEquipment.location}
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="status">Status *</Label>
                <Select name="status" required defaultValue="ok">
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {STATUS_OPTIONS.map(option => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="notes">Notater</Label>
                <Textarea 
                  id="notes" 
                  name="notes" 
                  placeholder="Eventuelle observasjoner..." 
                />
              </div>

              <div className="flex justify-end gap-2 pt-4">
                <Button type="button" variant="outline" onClick={() => setInspectingEquipment(null)}>
                  Avbryt
                </Button>
                <Button type="submit" disabled={createInspection.isPending}>
                  {createInspection.isPending ? "Lagrer..." : "Registrer"}
                </Button>
              </div>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
