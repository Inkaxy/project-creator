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
  User,
  Trash2,
  Edit2,
  Calendar
} from "lucide-react";
import { format } from "date-fns";
import { nb } from "date-fns/locale";
import { 
  useRiskAssessments, 
  useCreateRiskAssessment,
  useUpdateRiskAssessment,
  useDeleteRiskAssessment,
  getRiskLevel,
  type RiskAssessment 
} from "@/hooks/useRiskAssessments";
import { useEmployees } from "@/hooks/useEmployees";
import { useAuth } from "@/contexts/AuthContext";

const CATEGORIES = [
  { value: "ergonomi", label: "Ergonomi" },
  { value: "kjemikalier", label: "Kjemikalier" },
  { value: "fall", label: "Fall og snubling" },
  { value: "brann", label: "Brann" },
  { value: "elektrisitet", label: "Elektrisitet" },
  { value: "maskiner", label: "Maskiner og utstyr" },
  { value: "psykososialt", label: "Psykososialt" },
  { value: "annet", label: "Annet" },
];

export function RiskAssessmentPanel() {
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingRisk, setEditingRisk] = useState<RiskAssessment | null>(null);

  const { data: risks = [], isLoading } = useRiskAssessments();
  const { data: employees = [] } = useEmployees();
  const createRisk = useCreateRiskAssessment();
  const updateRisk = useUpdateRiskAssessment();
  const deleteRisk = useDeleteRiskAssessment();
  const { user } = useAuth();

  const handleCreate = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!user) return;

    const formData = new FormData(e.currentTarget);
    const probability = parseInt(formData.get("probability") as string);
    const consequence = parseInt(formData.get("consequence") as string);

    await createRisk.mutateAsync({
      title: formData.get("title") as string,
      description: formData.get("description") as string || undefined,
      category: formData.get("category") as string || undefined,
      probability,
      consequence,
      current_measures: formData.get("current_measures") as string || undefined,
      planned_measures: formData.get("planned_measures") as string || undefined,
      responsible: formData.get("responsible") as string || undefined,
      review_date: formData.get("review_date") as string || undefined,
      created_by: user.id,
    });

    setIsCreateOpen(false);
  };

  const handleUpdate = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!editingRisk) return;

    const formData = new FormData(e.currentTarget);
    const probability = parseInt(formData.get("probability") as string);
    const consequence = parseInt(formData.get("consequence") as string);

    await updateRisk.mutateAsync({
      id: editingRisk.id,
      title: formData.get("title") as string,
      description: formData.get("description") as string || undefined,
      category: formData.get("category") as string || undefined,
      probability,
      consequence,
      current_measures: formData.get("current_measures") as string || undefined,
      planned_measures: formData.get("planned_measures") as string || undefined,
      responsible: formData.get("responsible") as string || undefined,
      review_date: formData.get("review_date") as string || undefined,
    });

    setEditingRisk(null);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Er du sikker på at du vil slette denne risikovurderingen?")) return;
    await deleteRisk.mutateAsync(id);
  };

  const getRiskBadge = (score: number) => {
    const { level, color } = getRiskLevel(score);
    const variants: Record<string, "destructive" | "warning" | "secondary" | "success"> = {
      destructive: "destructive",
      warning: "warning",
      secondary: "secondary",
      success: "success",
    };
    return <Badge variant={variants[color] || "secondary"}>{level} ({score})</Badge>;
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-8 text-center text-muted-foreground">
          Laster risikovurderinger...
        </CardContent>
      </Card>
    );
  }

  const RiskForm = ({ 
    risk, 
    onSubmit, 
    onCancel, 
    isPending 
  }: { 
    risk?: RiskAssessment | null;
    onSubmit: (e: React.FormEvent<HTMLFormElement>) => void;
    onCancel: () => void;
    isPending: boolean;
  }) => (
    <form onSubmit={onSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="title">Tittel *</Label>
        <Input 
          id="title" 
          name="title" 
          defaultValue={risk?.title}
          placeholder="Beskriv risikoen kort" 
          required 
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Beskrivelse</Label>
        <Textarea 
          id="description" 
          name="description" 
          defaultValue={risk?.description || ""}
          placeholder="Utfyllende beskrivelse av risikoen" 
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="category">Kategori</Label>
          <Select name="category" defaultValue={risk?.category || undefined}>
            <SelectTrigger>
              <SelectValue placeholder="Velg kategori" />
            </SelectTrigger>
            <SelectContent>
              {CATEGORIES.map((cat) => (
                <SelectItem key={cat.value} value={cat.value}>
                  {cat.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="responsible">Ansvarlig</Label>
          <Select name="responsible" defaultValue={risk?.responsible || undefined}>
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
      </div>

      {/* Risk Matrix */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="probability">Sannsynlighet (1-5) *</Label>
          <Select name="probability" defaultValue={risk?.probability?.toString() || "3"}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="1">1 - Svært liten</SelectItem>
              <SelectItem value="2">2 - Liten</SelectItem>
              <SelectItem value="3">3 - Middels</SelectItem>
              <SelectItem value="4">4 - Stor</SelectItem>
              <SelectItem value="5">5 - Svært stor</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="consequence">Konsekvens (1-5) *</Label>
          <Select name="consequence" defaultValue={risk?.consequence?.toString() || "3"}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="1">1 - Ubetydelig</SelectItem>
              <SelectItem value="2">2 - Liten</SelectItem>
              <SelectItem value="3">3 - Moderat</SelectItem>
              <SelectItem value="4">4 - Alvorlig</SelectItem>
              <SelectItem value="5">5 - Svært alvorlig</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="current_measures">Eksisterende tiltak</Label>
        <Textarea 
          id="current_measures" 
          name="current_measures" 
          defaultValue={risk?.current_measures || ""}
          placeholder="Beskriv tiltak som allerede er iverksatt" 
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="planned_measures">Planlagte tiltak</Label>
        <Textarea 
          id="planned_measures" 
          name="planned_measures" 
          defaultValue={risk?.planned_measures || ""}
          placeholder="Beskriv tiltak som planlegges" 
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="review_date">Neste gjennomgang</Label>
        <Input 
          id="review_date" 
          name="review_date" 
          type="date"
          defaultValue={risk?.review_date || ""}
        />
      </div>

      <div className="flex justify-end gap-2 pt-4">
        <Button type="button" variant="outline" onClick={onCancel}>
          Avbryt
        </Button>
        <Button type="submit" disabled={isPending}>
          {isPending ? "Lagrer..." : risk ? "Oppdater" : "Opprett"}
        </Button>
      </div>
    </form>
  );

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-muted-foreground">
            Risikomatrise: Sannsynlighet × Konsekvens = Risikoscore
          </p>
        </div>

        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Ny risikovurdering
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Opprett risikovurdering</DialogTitle>
            </DialogHeader>
            <RiskForm 
              onSubmit={handleCreate}
              onCancel={() => setIsCreateOpen(false)}
              isPending={createRisk.isPending}
            />
          </DialogContent>
        </Dialog>
      </div>

      {/* Risk Matrix Legend */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-4 flex-wrap">
            <span className="text-sm font-medium">Risikonivå:</span>
            <Badge variant="success">Lav (1-3)</Badge>
            <Badge variant="secondary">Medium (4-7)</Badge>
            <Badge variant="warning">Høy (8-14)</Badge>
            <Badge variant="destructive">Kritisk (15-25)</Badge>
          </div>
        </CardContent>
      </Card>

      {/* Risks List */}
      {risks.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center">
            <AlertTriangle className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="font-medium text-lg mb-2">Ingen risikovurderinger</h3>
            <p className="text-muted-foreground mb-4">
              Start med å kartlegge risikoer i din virksomhet
            </p>
            <Button onClick={() => setIsCreateOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Ny risikovurdering
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {risks.map((risk) => (
            <Card key={risk.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="font-medium">{risk.title}</h3>
                      {getRiskBadge(risk.risk_score)}
                      {risk.category && (
                        <Badge variant="outline">
                          {CATEGORIES.find(c => c.value === risk.category)?.label || risk.category}
                        </Badge>
                      )}
                    </div>

                    {risk.description && (
                      <p className="text-sm text-muted-foreground mb-3">
                        {risk.description}
                      </p>
                    )}

                    <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                      <div>
                        <span className="font-medium">S:</span> {risk.probability} × 
                        <span className="font-medium ml-1">K:</span> {risk.consequence} = 
                        <span className="font-medium ml-1">{risk.risk_score}</span>
                      </div>

                      {risk.responsible_person && (
                        <div className="flex items-center gap-1">
                          <User className="h-4 w-4" />
                          {risk.responsible_person.full_name}
                        </div>
                      )}

                      {risk.review_date && (
                        <div className="flex items-center gap-1">
                          <Calendar className="h-4 w-4" />
                          Gjennomgang: {format(new Date(risk.review_date), "d. MMM yyyy", { locale: nb })}
                        </div>
                      )}
                    </div>

                    {(risk.current_measures || risk.planned_measures) && (
                      <div className="mt-3 pt-3 border-t space-y-2">
                        {risk.current_measures && (
                          <div className="text-sm">
                            <span className="font-medium text-success">Eksisterende tiltak: </span>
                            {risk.current_measures}
                          </div>
                        )}
                        {risk.planned_measures && (
                          <div className="text-sm">
                            <span className="font-medium text-primary">Planlagte tiltak: </span>
                            {risk.planned_measures}
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-2 ml-4">
                    <Button 
                      variant="ghost" 
                      size="icon"
                      onClick={() => setEditingRisk(risk)}
                    >
                      <Edit2 className="h-4 w-4" />
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="icon"
                      className="text-destructive hover:text-destructive"
                      onClick={() => handleDelete(risk.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Edit Modal */}
      <Dialog open={!!editingRisk} onOpenChange={() => setEditingRisk(null)}>
        <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Rediger risikovurdering</DialogTitle>
          </DialogHeader>
          <RiskForm 
            risk={editingRisk}
            onSubmit={handleUpdate}
            onCancel={() => setEditingRisk(null)}
            isPending={updateRisk.isPending}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}
