import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
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
import { Plus, Pencil, Trash2, GripVertical, Lock, Loader2 } from "lucide-react";
import {
  useDeviationTypes,
  useCreateDeviationType,
  useUpdateDeviationType,
  useDeleteDeviationType,
  type DeviationType,
} from "@/hooks/useDeviationTypes";
import { useSalaryTypes } from "@/hooks/useSalaryTypes";

interface FormState {
  name: string;
  code: string;
  salary_type_id: string;
  color: string;
  sort_order: number;
  is_active: boolean;
  affects_time_bank: boolean;
}

const defaultForm: FormState = {
  name: "",
  code: "",
  salary_type_id: "",
  color: "#6B7280",
  sort_order: 10,
  is_active: true,
  affects_time_bank: false,
};

export function DeviationTypesPanel() {
  const { data: types = [], isLoading } = useDeviationTypes(false);
  const { data: salaryTypes = [] } = useSalaryTypes();
  const createType = useCreateDeviationType();
  const updateType = useUpdateDeviationType();
  const deleteType = useDeleteDeviationType();

  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>(defaultForm);

  const openCreate = () => {
    setEditingId(null);
    setForm(defaultForm);
    setModalOpen(true);
  };

  const openEdit = (t: DeviationType) => {
    setEditingId(t.id);
    setForm({
      name: t.name,
      code: t.code,
      salary_type_id: t.salary_type_id || "",
      color: t.color,
      sort_order: t.sort_order,
      is_active: t.is_active,
      affects_time_bank: t.affects_time_bank,
    });
    setModalOpen(true);
  };

  const handleSave = async () => {
    const payload = {
      ...form,
      salary_type_id: form.salary_type_id || null,
      is_system: false,
    };

    if (editingId) {
      await updateType.mutateAsync({ id: editingId, ...payload });
    } else {
      await createType.mutateAsync(payload);
    }
    setModalOpen(false);
  };

  const handleDelete = async (id: string) => {
    if (confirm("Er du sikker på at du vil slette denne avvikstypen?")) {
      await deleteType.mutateAsync(id);
    }
  };

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Avvikstyper for timegodkjenning</CardTitle>
          <Button onClick={openCreate} size="sm">
            <Plus className="mr-2 h-4 w-4" />
            Ny avvikstype
          </Button>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-4">
            Definer avvikstyper som brukes ved godkjenning av timer. Koble til lønnsart for korrekt lønnseksport.
          </p>

          {isLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[40px]"></TableHead>
                  <TableHead>Navn</TableHead>
                  <TableHead>Kode</TableHead>
                  <TableHead>Lønnsart</TableHead>
                  <TableHead>Farge</TableHead>
                  <TableHead>Tidsbank</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="w-[100px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {types.map((t) => (
                  <TableRow key={t.id}>
                    <TableCell>
                      {t.is_system ? (
                        <Lock className="h-4 w-4 text-muted-foreground" />
                      ) : (
                        <GripVertical className="h-4 w-4 text-muted-foreground" />
                      )}
                    </TableCell>
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-2">
                        <div
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: t.color }}
                        />
                        {t.name}
                      </div>
                    </TableCell>
                    <TableCell>
                      <code className="text-xs bg-muted px-1.5 py-0.5 rounded">
                        {t.code}
                      </code>
                    </TableCell>
                    <TableCell>
                      {t.salary_type_id ? (
                        <Badge variant="secondary">
                          {salaryTypes.find((s) => s.id === t.salary_type_id)?.name || "—"}
                        </Badge>
                      ) : (
                        <span className="text-muted-foreground text-sm">Ikke koblet</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <div
                        className="w-6 h-6 rounded border"
                        style={{ backgroundColor: t.color }}
                      />
                    </TableCell>
                    <TableCell>
                      {t.affects_time_bank && (
                        <Badge variant="outline" className="text-xs">Ja</Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge variant={t.is_active ? "default" : "secondary"}>
                        {t.is_active ? "Aktiv" : "Inaktiv"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => openEdit(t)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        {!t.is_system && (
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDelete(t.id)}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Create / Edit Modal */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingId ? "Rediger avvikstype" : "Ny avvikstype"}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Navn</Label>
                <Input
                  value={form.name}
                  onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                  placeholder="F.eks. Plusstid 50%"
                />
              </div>
              <div className="space-y-2">
                <Label>Kode</Label>
                <Input
                  value={form.code}
                  onChange={(e) => setForm((f) => ({ ...f, code: e.target.value }))}
                  placeholder="F.eks. overtime_50"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Koble til lønnsart</Label>
              <Select
                value={form.salary_type_id}
                onValueChange={(v) => setForm((f) => ({ ...f, salary_type_id: v }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Velg lønnsart (valgfritt)" />
                </SelectTrigger>
                <SelectContent className="bg-popover">
                  <SelectItem value="">Ingen</SelectItem>
                  {salaryTypes.map((st) => (
                    <SelectItem key={st.id} value={st.id}>
                      {st.code} – {st.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Farge</Label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={form.color}
                    onChange={(e) => setForm((f) => ({ ...f, color: e.target.value }))}
                    className="w-10 h-10 rounded border cursor-pointer"
                  />
                  <Input
                    value={form.color}
                    onChange={(e) => setForm((f) => ({ ...f, color: e.target.value }))}
                    className="flex-1"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Sortering</Label>
                <Input
                  type="number"
                  value={form.sort_order}
                  onChange={(e) => setForm((f) => ({ ...f, sort_order: parseInt(e.target.value) || 0 }))}
                />
              </div>
            </div>

            <div className="flex items-center gap-6">
              <div className="flex items-center gap-2">
                <Switch
                  checked={form.is_active}
                  onCheckedChange={(v) => setForm((f) => ({ ...f, is_active: v }))}
                />
                <Label>Aktiv</Label>
              </div>
              <div className="flex items-center gap-2">
                <Switch
                  checked={form.affects_time_bank}
                  onCheckedChange={(v) => setForm((f) => ({ ...f, affects_time_bank: v }))}
                />
                <Label>Påvirker tidsbank</Label>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setModalOpen(false)}>
              Avbryt
            </Button>
            <Button
              onClick={handleSave}
              disabled={!form.name || !form.code || createType.isPending || updateType.isPending}
            >
              {(createType.isPending || updateType.isPending) && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              {editingId ? "Lagre" : "Opprett"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
