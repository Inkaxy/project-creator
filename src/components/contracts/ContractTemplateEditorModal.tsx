import { useState, useEffect, useMemo } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { 
  Save, 
  Eye, 
  Edit, 
  Variable, 
  Plus,
  FileText,
} from "lucide-react";
import { 
  useCreateContractTemplate, 
  useUpdateContractTemplate,
  ContractTemplate 
} from "@/hooks/useContractTemplates";
import { ContractPreview } from "./ContractPreview";
import { mergeContractTemplate } from "@/hooks/useGeneratedContracts";

interface ContractTemplateEditorModalProps {
  template: ContractTemplate | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

// Available template variables
const TEMPLATE_VARIABLES = [
  { key: "full_name", label: "Navn", category: "Personalia" },
  { key: "personal_number", label: "Personnummer", category: "Personalia" },
  { key: "date_of_birth", label: "Fødselsdato", category: "Personalia" },
  { key: "address", label: "Adresse", category: "Personalia" },
  { key: "postal_code", label: "Postnummer", category: "Personalia" },
  { key: "city", label: "Poststed", category: "Personalia" },
  { key: "phone", label: "Telefon", category: "Personalia" },
  { key: "email", label: "E-post", category: "Personalia" },
  { key: "department", label: "Avdeling", category: "Stilling" },
  { key: "function", label: "Stilling", category: "Stilling" },
  { key: "start_date", label: "Startdato", category: "Stilling" },
  { key: "employment_percentage", label: "Stillingsprosent", category: "Stilling" },
  { key: "contracted_hours", label: "Timer per uke", category: "Stilling" },
  { key: "salary_type", label: "Lønnstype", category: "Lønn" },
  { key: "hourly_rate", label: "Timelønn", category: "Lønn" },
  { key: "monthly_salary", label: "Månedslønn", category: "Lønn" },
  { key: "company_name", label: "Bedriftsnavn", category: "Bedrift" },
  { key: "today", label: "Dagens dato", category: "System" },
];

// Mock data for preview
const MOCK_DATA: Record<string, string> = {
  full_name: "Ola Nordmann",
  personal_number: "12345678901",
  date_of_birth: "15. januar 1990",
  address: "Eksempelveien 123",
  postal_code: "0123",
  city: "Oslo",
  phone: "99887766",
  email: "ola@example.com",
  department: "Kjøkken",
  function: "Kokk",
  start_date: "1. februar 2026",
  employment_percentage: "100",
  contracted_hours: "37.5",
  salary_type: "hourly",
  hourly_rate: "220",
  monthly_salary: "45000",
  company_name: "Restaurant AS",
  today: "23. januar 2026",
};

export function ContractTemplateEditorModal({ 
  template, 
  open, 
  onOpenChange 
}: ContractTemplateEditorModalProps) {
  const createTemplate = useCreateContractTemplate();
  const updateTemplate = useUpdateContractTemplate();
  
  const [name, setName] = useState("");
  const [content, setContent] = useState("");
  const [employeeType, setEmployeeType] = useState<string>("");
  const [isDefault, setIsDefault] = useState(false);
  const [activeTab, setActiveTab] = useState("edit");
  const [isSaving, setIsSaving] = useState(false);

  const isEditing = !!template?.id;

  // Initialize form when template changes
  useEffect(() => {
    if (open) {
      if (template) {
        setName(template.name);
        setContent(template.content);
        setEmployeeType(template.employee_type || "");
        setIsDefault(template.is_default || false);
      } else {
        setName("");
        setContent(getDefaultTemplate());
        setEmployeeType("");
        setIsDefault(false);
      }
      setActiveTab("edit");
    }
  }, [open, template]);

  // Generate preview with mock data
  const previewContent = useMemo(() => {
    return mergeContractTemplate(content, MOCK_DATA);
  }, [content]);

  const insertVariable = (variable: string) => {
    setContent(prev => prev + `{{${variable}}}`);
  };

  const handleSave = async () => {
    if (!name.trim() || !content.trim()) return;
    
    setIsSaving(true);
    try {
      if (isEditing) {
        await updateTemplate.mutateAsync({
          id: template.id,
          name,
          content,
          employee_type: employeeType || undefined,
          is_default: isDefault,
        });
      } else {
        await createTemplate.mutateAsync({
          name,
          content,
          employee_type: employeeType || undefined,
          is_default: isDefault,
        });
      }
      onOpenChange(false);
    } finally {
      setIsSaving(false);
    }
  };

  // Group variables by category
  const groupedVariables = TEMPLATE_VARIABLES.reduce((acc, v) => {
    if (!acc[v.category]) acc[v.category] = [];
    acc[v.category].push(v);
    return acc;
  }, {} as Record<string, typeof TEMPLATE_VARIABLES>);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-primary" />
            {isEditing ? "Rediger kontraktmal" : "Ny kontraktmal"}
          </DialogTitle>
          <DialogDescription>
            Bruk variabler for automatisk datafletting
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-3 gap-4 mb-4">
          <div className="space-y-2">
            <Label htmlFor="name">Malnavn</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="F.eks. Standard arbeidsavtale"
            />
          </div>
          <div className="space-y-2">
            <Label>Type ansatt</Label>
            <Select value={employeeType} onValueChange={setEmployeeType}>
              <SelectTrigger>
                <SelectValue placeholder="Alle typer" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Alle typer</SelectItem>
                <SelectItem value="hourly">Timelønn</SelectItem>
                <SelectItem value="fixed">Fastlønn</SelectItem>
                <SelectItem value="management">Ledelse</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-end gap-4">
            <div className="flex items-center space-x-2">
              <Switch
                id="is-default"
                checked={isDefault}
                onCheckedChange={setIsDefault}
              />
              <Label htmlFor="is-default">Standardmal</Label>
            </div>
          </div>
        </div>

        <div className="flex-1 flex flex-col min-h-0">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="flex flex-col h-full">
            <div className="flex items-center justify-between mb-2">
              <TabsList>
                <TabsTrigger value="edit" className="flex items-center gap-1">
                  <Edit className="h-3 w-3" />
                  Rediger
                </TabsTrigger>
                <TabsTrigger value="preview" className="flex items-center gap-1">
                  <Eye className="h-3 w-3" />
                  Forhåndsvisning
                </TabsTrigger>
              </TabsList>

              {activeTab === "edit" && (
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" size="sm">
                      <Variable className="mr-2 h-4 w-4" />
                      Sett inn variabel
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-80" align="end">
                    <div className="space-y-3">
                      <h4 className="font-medium">Tilgjengelige variabler</h4>
                      <ScrollArea className="h-64">
                        <div className="space-y-4">
                          {Object.entries(groupedVariables).map(([category, variables]) => (
                            <div key={category}>
                              <p className="text-xs font-medium text-muted-foreground mb-2">
                                {category}
                              </p>
                              <div className="flex flex-wrap gap-1">
                                {variables.map((v) => (
                                  <Badge
                                    key={v.key}
                                    variant="secondary"
                                    className="cursor-pointer hover:bg-primary hover:text-primary-foreground"
                                    onClick={() => insertVariable(v.key)}
                                  >
                                    <Plus className="mr-1 h-3 w-3" />
                                    {v.label}
                                  </Badge>
                                ))}
                              </div>
                            </div>
                          ))}
                        </div>
                      </ScrollArea>
                      <p className="text-xs text-muted-foreground">
                        Klikk for å sette inn. Format: {"{{variabel}}"}
                      </p>
                    </div>
                  </PopoverContent>
                </Popover>
              )}
            </div>

            <TabsContent value="edit" className="flex-1 m-0">
              <Textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                className="h-full font-mono text-sm resize-none"
                placeholder="Skriv kontraktinnhold her..."
              />
            </TabsContent>

            <TabsContent value="preview" className="flex-1 m-0 border rounded-lg overflow-hidden">
              <ScrollArea className="h-full">
                <div className="p-6">
                  <div className="mb-4 p-2 bg-muted rounded text-sm text-muted-foreground">
                    Forhåndsvisning med testdata
                  </div>
                  <ContractPreview content={previewContent} />
                </div>
              </ScrollArea>
            </TabsContent>
          </Tabs>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Avbryt
          </Button>
          <Button onClick={handleSave} disabled={isSaving || !name.trim()}>
            <Save className="mr-2 h-4 w-4" />
            {isSaving ? "Lagrer..." : isEditing ? "Lagre endringer" : "Opprett mal"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function getDefaultTemplate(): string {
  return `# Arbeidsavtale

Mellom **{{company_name}}** (heretter kalt "Arbeidsgiver") og **{{full_name}}** (heretter kalt "Arbeidstaker") er det inngått følgende arbeidsavtale:

## 1. Tiltredelse og arbeidssted
Arbeidstaker tiltrer stillingen den **{{start_date}}**.
Arbeidssted er {{company_name}}.

## 2. Stilling og arbeidsoppgaver
Arbeidstaker ansettes som **{{function}}** i avdeling **{{department}}**.

## 3. Arbeidstid
Arbeidstaker har en stillingsandel på **{{employment_percentage}}%**.
Ordinær arbeidstid er {{contracted_hours}} timer per uke.

## 4. Lønn
[[IF salary_type=hourly]]
Arbeidstaker lønnes med en timelønn på **{{hourly_rate}} kr** per time.
Lønn utbetales den 15. hver måned.
[[ENDIF]]

[[IF salary_type=fixed]]
Arbeidstaker lønnes med en fast månedslønn på **{{monthly_salary}} kr**.
Lønn utbetales den 15. hver måned.
[[ENDIF]]

## 5. Ferie
Arbeidstaker har rett til ferie i samsvar med ferieloven.

## 6. Oppsigelse
Gjensidig oppsigelsestid er 1 måned.

## 7. Prøvetid
Det avtales en prøvetid på 6 måneder med gjensidig oppsigelsestid på 14 dager.

---

**Dato:** {{today}}

**Arbeidsgiver:**

_________________________
{{company_name}}

**Arbeidstaker:**

_________________________
{{full_name}}
`;
}
