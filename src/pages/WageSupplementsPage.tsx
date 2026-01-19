import { useState } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useWageSupplements, WageSupplement } from "@/hooks/useWageSupplements";
import {
  useUpdateWageSupplement,
  useCreateWageSupplement,
  useDeleteWageSupplement,
} from "@/hooks/useWageSupplementsMutations";
import { useAuth } from "@/contexts/AuthContext";
import { Moon, Sun, Calendar, Star, Plus, Pencil, Trash2, DollarSign, Percent, TrendingUp, Receipt, Upload } from "lucide-react";
import { cn } from "@/lib/utils";
import { WageLaddersManagementModal } from "@/components/employees/WageLaddersManagementModal";
import { WageAdjustmentsPanel } from "@/components/employees/WageAdjustmentsPanel";
import { WageLadderHistoryPanel } from "@/components/employees/WageLadderHistoryPanel";
import { TariffImportModal } from "@/components/employees/TariffImportModal";
import { useWageLadders } from "@/hooks/useWageLadders";
import { useWageAdjustments } from "@/hooks/useWageAdjustments";

const appliestoLabels: Record<string, { label: string; icon: React.ElementType; color: string }> = {
  night: { label: "Natt", icon: Moon, color: "text-destructive" },
  evening: { label: "Kveld", icon: Sun, color: "text-warning" },
  weekend: { label: "Helg", icon: Calendar, color: "text-primary" },
  holiday: { label: "Helligdag", icon: Star, color: "text-accent" },
};

export default function WageSupplementsPage() {
  const { isAdminOrManager } = useAuth();
  const { data: supplements = [], isLoading } = useWageSupplements();
  const { data: wageLadders = [] } = useWageLadders();
  const { data: pendingAdjustments = [] } = useWageAdjustments("pending");
  const updateMutation = useUpdateWageSupplement();
  const createMutation = useCreateWageSupplement();
  const deleteMutation = useDeleteWageSupplement();

  const [editModalOpen, setEditModalOpen] = useState(false);
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [wageLaddersModalOpen, setWageLaddersModalOpen] = useState(false);
  const [tariffImportModalOpen, setTariffImportModalOpen] = useState(false);
  const [selectedSupplement, setSelectedSupplement] = useState<WageSupplement | null>(null);

  // Form state for editing
  const [editForm, setEditForm] = useState({
    name: "",
    description: "",
    amount: 0,
    supplement_type: "fixed" as "fixed" | "percentage",
    applies_to: "night" as "night" | "weekend" | "holiday" | "evening",
    time_start: "",
    time_end: "",
  });

  // Form state for creating
  const [createForm, setCreateForm] = useState({
    name: "",
    description: "",
    amount: 0,
    supplement_type: "fixed" as "fixed" | "percentage",
    applies_to: "night" as "night" | "weekend" | "holiday" | "evening",
    time_start: "",
    time_end: "",
  });

  const handleEdit = (supplement: WageSupplement) => {
    setSelectedSupplement(supplement);
    setEditForm({
      name: supplement.name,
      description: supplement.description || "",
      amount: Number(supplement.amount),
      supplement_type: supplement.supplement_type,
      applies_to: supplement.applies_to,
      time_start: supplement.time_start || "",
      time_end: supplement.time_end || "",
    });
    setEditModalOpen(true);
  };

  const handleSaveEdit = async () => {
    if (!selectedSupplement) return;
    await updateMutation.mutateAsync({
      id: selectedSupplement.id,
      ...editForm,
      time_start: editForm.time_start || null,
      time_end: editForm.time_end || null,
    });
    setEditModalOpen(false);
  };

  const handleToggleActive = async (supplement: WageSupplement) => {
    await updateMutation.mutateAsync({
      id: supplement.id,
      is_active: !supplement.is_active,
    });
  };

  const handleCreate = async () => {
    await createMutation.mutateAsync({
      ...createForm,
      time_start: createForm.time_start || null,
      time_end: createForm.time_end || null,
    });
    setCreateModalOpen(false);
    setCreateForm({
      name: "",
      description: "",
      amount: 0,
      supplement_type: "fixed",
      applies_to: "night",
      time_start: "",
      time_end: "",
    });
  };

  const handleDelete = async (id: string) => {
    if (confirm("Er du sikker på at du vil slette dette tillegget?")) {
      await deleteMutation.mutateAsync(id);
    }
  };

  if (!isAdminOrManager()) {
    return (
      <MainLayout>
        <div className="flex h-64 items-center justify-center">
          <p className="text-muted-foreground">Du har ikke tilgang til denne siden.</p>
        </div>
      </MainLayout>
    );
  }

  if (isLoading) {
    return (
      <MainLayout>
        <div className="flex h-64 items-center justify-center">
          <p className="text-muted-foreground">Laster tillegg...</p>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-4 pl-12 sm:flex-row sm:items-center sm:justify-between lg:pl-0">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Lønnssatser</h1>
            <p className="text-muted-foreground">Administrer lønnsstiger, tillegg og etterbetalinger</p>
          </div>
        </div>

        {/* Summary Stats */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-sm font-medium">
                <TrendingUp className="h-4 w-4 text-primary" />
                Lønnsstiger
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{wageLadders.length}</p>
              <p className="text-xs text-muted-foreground">aktive stiger</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-sm font-medium">
                <DollarSign className="h-4 w-4 text-green-600" />
                Tillegg
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{supplements.filter(s => s.is_active).length}</p>
              <p className="text-xs text-muted-foreground">aktive tillegg</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-sm font-medium">
                <Receipt className="h-4 w-4 text-amber-600" />
                Etterbetalinger
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{pendingAdjustments.length}</p>
              <p className="text-xs text-muted-foreground">venter godkjenning</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-sm font-medium">
                <Calendar className="h-4 w-4 text-primary" />
                Helgetillegg
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">
                {supplements.filter(s => s.applies_to === 'weekend' && s.is_active).length}
              </p>
              <p className="text-xs text-muted-foreground">aktive</p>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="supplements" className="space-y-4">
          <TabsList>
            <TabsTrigger value="supplements" className="gap-2">
              <DollarSign className="h-4 w-4" />
              Tillegg
            </TabsTrigger>
            <TabsTrigger value="ladders" className="gap-2">
              <TrendingUp className="h-4 w-4" />
              Lønnsstiger
            </TabsTrigger>
            <TabsTrigger value="adjustments" className="gap-2">
              <Receipt className="h-4 w-4" />
              Etterbetalinger
              {pendingAdjustments.length > 0 && (
                <Badge variant="secondary" className="ml-1">{pendingAdjustments.length}</Badge>
              )}
            </TabsTrigger>
          </TabsList>

          {/* Supplements Tab */}
          <TabsContent value="supplements" className="space-y-4">
            <div className="flex justify-end">
              <Button onClick={() => setCreateModalOpen(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Nytt tillegg
              </Button>
            </div>

        {/* Summary Cards */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Object.entries(appliestoLabels).map(([key, { label, icon: Icon, color }]) => {
            const typeSupplements = supplements.filter(s => s.applies_to === key);
            const activeCount = typeSupplements.filter(s => s.is_active).length;
            return (
              <Card key={key}>
                <CardHeader className="pb-2">
                  <CardTitle className="flex items-center gap-2 text-sm font-medium">
                    <Icon className={cn("h-4 w-4", color)} />
                    {label}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-bold">{activeCount}</p>
                  <p className="text-xs text-muted-foreground">aktive tillegg</p>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Table */}
        <Card>
          <CardHeader>
            <CardTitle>Alle tillegg</CardTitle>
            <CardDescription>Klikk på en rad for å redigere</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Aktiv</TableHead>
                  <TableHead>Navn</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Beløp</TableHead>
                  <TableHead>Gjelder</TableHead>
                  <TableHead>Tidsrom</TableHead>
                  <TableHead className="text-right">Handlinger</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {supplements.map((supplement) => {
                  const typeInfo = appliestoLabels[supplement.applies_to];
                  const Icon = typeInfo?.icon || Moon;
                  return (
                    <TableRow key={supplement.id} className={cn(!supplement.is_active && "opacity-50")}>
                      <TableCell>
                        <Switch
                          checked={supplement.is_active ?? false}
                          onCheckedChange={() => handleToggleActive(supplement)}
                        />
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium">{supplement.name}</p>
                          {supplement.description && (
                            <p className="text-xs text-muted-foreground">{supplement.description}</p>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="gap-1">
                          {supplement.supplement_type === "percentage" ? (
                            <Percent className="h-3 w-3" />
                          ) : (
                            <DollarSign className="h-3 w-3" />
                          )}
                          {supplement.supplement_type === "percentage" ? "Prosent" : "Fast beløp"}
                        </Badge>
                      </TableCell>
                      <TableCell className="font-mono">
                        {supplement.supplement_type === "percentage"
                          ? `${supplement.amount}%`
                          : `${Number(supplement.amount).toLocaleString("nb-NO")} kr`}
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary" className={cn("gap-1", typeInfo?.color)}>
                          <Icon className="h-3 w-3" />
                          {typeInfo?.label}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {supplement.time_start && supplement.time_end ? (
                          <span className="font-mono text-sm">
                            {supplement.time_start.slice(0, 5)} - {supplement.time_end.slice(0, 5)}
                          </span>
                        ) : (
                          <span className="text-muted-foreground">Hele dagen</span>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          <Button variant="ghost" size="icon" onClick={() => handleEdit(supplement)}>
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="text-destructive hover:text-destructive"
                            onClick={() => handleDelete(supplement.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Wage Ladders Tab */}
          <TabsContent value="ladders" className="space-y-4">
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setTariffImportModalOpen(true)}>
                <Upload className="mr-2 h-4 w-4" />
                Importer tariff
              </Button>
              <Button onClick={() => setWageLaddersModalOpen(true)}>
                <TrendingUp className="mr-2 h-4 w-4" />
                Administrer lønnsstiger
              </Button>
            </div>

            {wageLadders.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <TrendingUp className="mx-auto h-12 w-12 text-muted-foreground/50" />
                  <h3 className="mt-4 text-lg font-medium">Ingen lønnsstiger</h3>
                  <p className="mt-2 text-sm text-muted-foreground">
                    Opprett lønnsstiger for å administrere timelønn basert på ansiennitet.
                  </p>
                  <Button className="mt-4" onClick={() => setWageLaddersModalOpen(true)}>
                    <Plus className="mr-2 h-4 w-4" />
                    Opprett lønnsstige
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {wageLadders.map((ladder) => (
                  <Card key={ladder.id} className="hover:shadow-md transition-shadow">
                    <CardHeader>
                      <CardTitle className="flex items-center justify-between">
                        <span>{ladder.name}</span>
                        <Badge variant="secondary">
                          {ladder.competence_level === 'faglaert' ? 'Faglært' : 
                           ladder.competence_level === 'laerling' ? 'Lærling' : 'Ufaglært'}
                        </Badge>
                      </CardTitle>
                      {ladder.description && (
                        <CardDescription>{ladder.description}</CardDescription>
                      )}
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        <p className="text-sm text-muted-foreground">
                          {ladder.levels?.length || 0} nivå{(ladder.levels?.length || 0) !== 1 ? 'er' : ''}
                        </p>
                        {ladder.levels && ladder.levels.length > 0 && (
                          <div className="text-sm">
                            <span className="text-muted-foreground">Satser: </span>
                            <span className="font-medium">
                              {Math.min(...ladder.levels.map(l => l.hourly_rate)).toLocaleString('nb-NO')} - {' '}
                              {Math.max(...ladder.levels.map(l => l.hourly_rate)).toLocaleString('nb-NO')} kr/t
                            </span>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          {/* Adjustments Tab */}
          <TabsContent value="adjustments">
            <WageAdjustmentsPanel />
          </TabsContent>
        </Tabs>
      </div>

      {/* Edit Modal */}
      <Dialog open={editModalOpen} onOpenChange={setEditModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Rediger tillegg</DialogTitle>
            <DialogDescription>Endre innstillinger for dette lønnstillegget</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="edit-name">Navn</Label>
              <Input
                id="edit-name"
                value={editForm.name}
                onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-description">Beskrivelse</Label>
              <Input
                id="edit-description"
                value={editForm.description}
                onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-type">Type</Label>
                <Select
                  value={editForm.supplement_type}
                  onValueChange={(v) => setEditForm({ ...editForm, supplement_type: v as "fixed" | "percentage" })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="fixed">Fast beløp (kr/time)</SelectItem>
                    <SelectItem value="percentage">Prosent av lønn</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-amount">
                  {editForm.supplement_type === "percentage" ? "Prosent" : "Beløp (kr/time)"}
                </Label>
                <Input
                  id="edit-amount"
                  type="number"
                  value={editForm.amount}
                  onChange={(e) => setEditForm({ ...editForm, amount: Number(e.target.value) })}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-applies">Gjelder for</Label>
              <Select
                value={editForm.applies_to}
                onValueChange={(v) => setEditForm({ ...editForm, applies_to: v as typeof editForm.applies_to })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="night">Natt</SelectItem>
                  <SelectItem value="evening">Kveld</SelectItem>
                  <SelectItem value="weekend">Helg</SelectItem>
                  <SelectItem value="holiday">Helligdag</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-time-start">Fra klokkeslett</Label>
                <Input
                  id="edit-time-start"
                  type="time"
                  value={editForm.time_start}
                  onChange={(e) => setEditForm({ ...editForm, time_start: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-time-end">Til klokkeslett</Label>
                <Input
                  id="edit-time-end"
                  type="time"
                  value={editForm.time_end}
                  onChange={(e) => setEditForm({ ...editForm, time_end: e.target.value })}
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditModalOpen(false)}>Avbryt</Button>
            <Button onClick={handleSaveEdit} disabled={updateMutation.isPending}>
              {updateMutation.isPending ? "Lagrer..." : "Lagre"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Create Modal */}
      <Dialog open={createModalOpen} onOpenChange={setCreateModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nytt tillegg</DialogTitle>
            <DialogDescription>Opprett et nytt lønnstillegg</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="create-name">Navn</Label>
              <Input
                id="create-name"
                value={createForm.name}
                onChange={(e) => setCreateForm({ ...createForm, name: e.target.value })}
                placeholder="F.eks. Nattillegg"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="create-description">Beskrivelse</Label>
              <Input
                id="create-description"
                value={createForm.description}
                onChange={(e) => setCreateForm({ ...createForm, description: e.target.value })}
                placeholder="Valgfri beskrivelse"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="create-type">Type</Label>
                <Select
                  value={createForm.supplement_type}
                  onValueChange={(v) => setCreateForm({ ...createForm, supplement_type: v as "fixed" | "percentage" })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="fixed">Fast beløp (kr/time)</SelectItem>
                    <SelectItem value="percentage">Prosent av lønn</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="create-amount">
                  {createForm.supplement_type === "percentage" ? "Prosent" : "Beløp (kr/time)"}
                </Label>
                <Input
                  id="create-amount"
                  type="number"
                  value={createForm.amount}
                  onChange={(e) => setCreateForm({ ...createForm, amount: Number(e.target.value) })}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="create-applies">Gjelder for</Label>
              <Select
                value={createForm.applies_to}
                onValueChange={(v) => setCreateForm({ ...createForm, applies_to: v as typeof createForm.applies_to })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="night">Natt</SelectItem>
                  <SelectItem value="evening">Kveld</SelectItem>
                  <SelectItem value="weekend">Helg</SelectItem>
                  <SelectItem value="holiday">Helligdag</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="create-time-start">Fra klokkeslett</Label>
                <Input
                  id="create-time-start"
                  type="time"
                  value={createForm.time_start}
                  onChange={(e) => setCreateForm({ ...createForm, time_start: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="create-time-end">Til klokkeslett</Label>
                <Input
                  id="create-time-end"
                  type="time"
                  value={createForm.time_end}
                  onChange={(e) => setCreateForm({ ...createForm, time_end: e.target.value })}
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateModalOpen(false)}>Avbryt</Button>
            <Button onClick={handleCreate} disabled={createMutation.isPending || !createForm.name}>
              {createMutation.isPending ? "Oppretter..." : "Opprett"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Wage Ladders Modal */}
      <WageLaddersManagementModal
        open={wageLaddersModalOpen}
        onOpenChange={setWageLaddersModalOpen}
      />

      {/* Tariff Import Modal */}
      <TariffImportModal
        open={tariffImportModalOpen}
        onOpenChange={setTariffImportModalOpen}
      />
    </MainLayout>
  );
}
