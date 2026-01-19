import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  useShiftTemplates,
  useCreateRotationGroup,
  useLinkTemplateToRotation,
} from "@/hooks/useShiftTemplates";
import { useDepartments } from "@/hooks/useEmployees";
import { RefreshCcw, Check, Globe, Building2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface CreateRotationGroupModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  departmentId?: string | null;
}

const ROTATION_NAMES = ["A", "B", "C", "D", "E", "F"];

export function CreateRotationGroupModal({ 
  open, 
  onOpenChange,
  departmentId: initialDepartmentId,
}: CreateRotationGroupModalProps) {
  const [step, setStep] = useState(1);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [rotationLength, setRotationLength] = useState(2);
  const [departmentId, setDepartmentId] = useState<string | null>(initialDepartmentId || null);
  const [selectedTemplates, setSelectedTemplates] = useState<(string | null)[]>([]);

  const { data: templates = [] } = useShiftTemplates(departmentId);
  const { data: departments = [] } = useDepartments();
  const createGroup = useCreateRotationGroup();
  const linkTemplate = useLinkTemplateToRotation();

  const availableTemplates = templates.filter(t => !t.is_rotating);

  const handleRotationLengthChange = (length: number) => {
    setRotationLength(length);
    setSelectedTemplates(Array(length).fill(null));
  };

  const resetForm = () => {
    setStep(1);
    setName("");
    setDescription("");
    setRotationLength(2);
    setDepartmentId(initialDepartmentId || null);
    setSelectedTemplates([]);
  };

  const handleCreate = async () => {
    const validTemplates = selectedTemplates.filter(Boolean) as string[];
    if (validTemplates.length !== rotationLength) return;

    const group = await createGroup.mutateAsync({
      name,
      description: description || undefined,
      rotation_length: rotationLength,
      department_id: departmentId,
    });

    for (let i = 0; i < validTemplates.length; i++) {
      await linkTemplate.mutateAsync({
        templateId: validTemplates[i],
        rotationGroupId: group.id,
        sequence: i + 1,
        rotationName: ROTATION_NAMES[i],
      });
    }

    onOpenChange(false);
    resetForm();
  };

  const handleClose = () => {
    onOpenChange(false);
    resetForm();
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-lg">
        <div className="flex items-center justify-center gap-2 mb-4">
          {[1, 2, 3].map((s) => (
            <div
              key={s}
              className={cn(
                "w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium",
                step === s && "bg-primary text-primary-foreground",
                step > s && "bg-primary/20 text-primary",
                step < s && "bg-muted text-muted-foreground"
              )}
            >
              {step > s ? <Check className="h-4 w-4" /> : s}
            </div>
          ))}
        </div>

        {step === 1 && (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <RefreshCcw className="h-5 w-5" />
                Opprett rotasjonsgruppe
              </DialogTitle>
              <DialogDescription>
                Steg 1 av 3: Grunnleggende informasjon
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Navn *</Label>
                <Input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="F.eks. Standard 2-ukers rotasjon"
                />
              </div>
              
              <div className="space-y-2">
                <Label>Antall uker i rotasjonen *</Label>
                <Select
                  value={String(rotationLength)}
                  onValueChange={(v) => handleRotationLengthChange(Number(v))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="2">2 uker (A → B → A → B ...)</SelectItem>
                    <SelectItem value="3">3 uker (A → B → C → A ...)</SelectItem>
                    <SelectItem value="4">4 uker</SelectItem>
                    <SelectItem value="5">5 uker</SelectItem>
                    <SelectItem value="6">6 uker</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Avdeling</Label>
                <Select
                  value={departmentId || "_global"}
                  onValueChange={(v) => setDepartmentId(v === "_global" ? null : v)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Velg avdeling" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="_global">
                      <div className="flex items-center gap-2">
                        <Globe className="h-4 w-4" />
                        Alle avdelinger
                      </div>
                    </SelectItem>
                    {departments.map((dept) => (
                      <SelectItem key={dept.id} value={dept.id}>
                        <div className="flex items-center gap-2">
                          <Building2 className="h-4 w-4" />
                          {dept.name}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Beskrivelse (valgfritt)</Label>
                <Textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Beskriv rotasjonsmønsteret..."
                  rows={2}
                />
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={handleClose}>
                Avbryt
              </Button>
              <Button 
                onClick={() => {
                  setSelectedTemplates(Array(rotationLength).fill(null));
                  setStep(2);
                }}
                disabled={!name.trim()}
              >
                Neste
              </Button>
            </DialogFooter>
          </>
        )}

        {step === 2 && (
          <>
            <DialogHeader>
              <DialogTitle>Velg maler for rotasjonen</DialogTitle>
              <DialogDescription>
                Steg 2 av 3: Velg {rotationLength} maler som skal rotere
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              {Array.from({ length: rotationLength }).map((_, index) => (
                <div key={index} className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <Badge variant="outline" className="bg-primary/10 border-primary/30">
                      Uke {ROTATION_NAMES[index]}
                    </Badge>
                  </Label>
                  <Select
                    value={selectedTemplates[index] || "_none"}
                    onValueChange={(v) => {
                      const newSelected = [...selectedTemplates];
                      newSelected[index] = v === "_none" ? null : v;
                      setSelectedTemplates(newSelected);
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Velg en mal..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="_none" disabled>
                        Velg en mal...
                      </SelectItem>
                      {availableTemplates
                        .filter(t => 
                          !selectedTemplates.includes(t.id) || 
                          selectedTemplates[index] === t.id
                        )
                        .map((template) => (
                          <SelectItem key={template.id} value={template.id}>
                            <div className="flex items-center justify-between w-full gap-4">
                              <span>{template.name}</span>
                              <Badge variant="secondary" className="ml-auto">
                                {template.shift_count} vakter
                              </Badge>
                            </div>
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                </div>
              ))}

              {availableTemplates.length < rotationLength && (
                <div className="text-sm text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/30 p-3 rounded-md">
                  ⚠️ Du har bare {availableTemplates.length} tilgjengelige maler.
                </div>
              )}
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setStep(1)}>
                Tilbake
              </Button>
              <Button 
                onClick={() => setStep(3)}
                disabled={selectedTemplates.filter(Boolean).length !== rotationLength}
              >
                Neste
              </Button>
            </DialogFooter>
          </>
        )}

        {step === 3 && (
          <>
            <DialogHeader>
              <DialogTitle>Bekreft rotasjonsgruppe</DialogTitle>
              <DialogDescription>
                Steg 3 av 3: Gjennomgå og opprett
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              <div className="rounded-lg border p-4 space-y-3">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Navn:</span>
                  <span className="font-medium">{name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Rotasjonslengde:</span>
                  <span className="font-medium">{rotationLength} uker</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Avdeling:</span>
                  <span className="font-medium">
                    {departmentId 
                      ? departments.find(d => d.id === departmentId)?.name 
                      : "Alle avdelinger"}
                  </span>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Rotasjonsmønster:</Label>
                <div className="flex items-center gap-2 flex-wrap p-3 bg-muted/50 rounded-md">
                  {selectedTemplates.map((templateId, index) => {
                    const template = templates.find(t => t.id === templateId);
                    return (
                      <div key={index} className="flex items-center gap-1">
                        <Badge variant="outline" className="bg-primary/10">
                          {ROTATION_NAMES[index]}: {template?.name}
                        </Badge>
                        {index < selectedTemplates.length - 1 && (
                          <span className="text-muted-foreground">→</span>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setStep(2)}>
                Tilbake
              </Button>
              <Button 
                onClick={handleCreate}
                disabled={createGroup.isPending || linkTemplate.isPending}
              >
                {createGroup.isPending || linkTemplate.isPending 
                  ? "Oppretter..." 
                  : "Opprett rotasjonsgruppe"
                }
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}