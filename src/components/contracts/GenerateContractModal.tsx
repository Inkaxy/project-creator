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
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { 
  FileSignature, 
  Send, 
  Eye, 
  Edit, 
  Check,
  AlertCircle,
  User,
  Building2,
  Wallet,
} from "lucide-react";
import { format } from "date-fns";
import { nb } from "date-fns/locale";
import { useContractTemplates } from "@/hooks/useContractTemplates";
import { useCreateGeneratedContract, useSendContractForSigning, mergeContractTemplate } from "@/hooks/useGeneratedContracts";
import { ContractPreview } from "./ContractPreview";
import type { EmployeeOnboarding } from "@/hooks/useOnboardings";

interface GenerateContractModalProps {
  onboarding: EmployeeOnboarding;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

// Default template if none exists
const DEFAULT_TEMPLATE = `# Arbeidsavtale

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

export function GenerateContractModal({ onboarding, open, onOpenChange }: GenerateContractModalProps) {
  const { data: templates = [] } = useContractTemplates();
  const createContract = useCreateGeneratedContract();
  const sendForSigning = useSendContractForSigning();
  
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>("");
  const [activeTab, setActiveTab] = useState("preview");
  const [customContent, setCustomContent] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  
  // Editable merged values
  const [mergedValues, setMergedValues] = useState<Record<string, string>>({});

  // Get the selected template
  const selectedTemplate = templates.find(t => t.id === selectedTemplateId);

  // Initialize merged values from onboarding data
  useEffect(() => {
    if (open) {
      const today = format(new Date(), "d. MMMM yyyy", { locale: nb });
      const startDate = onboarding.start_date 
        ? format(new Date(onboarding.start_date), "d. MMMM yyyy", { locale: nb })
        : today;

      setMergedValues({
        full_name: onboarding.full_name,
        email: onboarding.email,
        personal_number: onboarding.personal_number || "",
        address: onboarding.address || "",
        postal_code: onboarding.postal_code || "",
        city: onboarding.city || "",
        phone: onboarding.phone || "",
        department: onboarding.departments?.name || "",
        function: onboarding.functions?.name || "",
        employee_type: onboarding.employee_type || "hourly",
        start_date: startDate,
        today: today,
        company_name: "Bedriften AS", // TODO: Get from settings
        salary_type: "hourly", // Default, can be changed
        hourly_rate: "200",
        monthly_salary: "",
        employment_percentage: "100",
        contracted_hours: "37.5",
      });

      // Select default template if available
      const defaultTemplate = templates.find(t => t.is_default);
      if (defaultTemplate) {
        setSelectedTemplateId(defaultTemplate.id);
      } else if (templates.length > 0) {
        setSelectedTemplateId(templates[0].id);
      }
    }
  }, [open, onboarding, templates]);

  // Generate preview content
  const previewContent = useMemo(() => {
    const templateContent = customContent || selectedTemplate?.content || DEFAULT_TEMPLATE;
    return mergeContractTemplate(templateContent, mergedValues);
  }, [selectedTemplate, customContent, mergedValues]);

  const handleValueChange = (key: string, value: string) => {
    setMergedValues(prev => ({ ...prev, [key]: value }));
  };

  const handleGenerate = async (sendImmediately: boolean) => {
    setIsGenerating(true);
    try {
      const result = await createContract.mutateAsync({
        employee_id: onboarding.profile_id || onboarding.id, // Use profile_id if available
        template_id: selectedTemplateId || undefined,
        onboarding_id: onboarding.id,
        title: `Arbeidsavtale - ${onboarding.full_name}`,
        content: previewContent,
        merged_data: mergedValues,
        status: sendImmediately ? "pending_signature" : "draft",
      });

      if (sendImmediately && result) {
        await sendForSigning.mutateAsync(result.id);
      }

      onOpenChange(false);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileSignature className="h-5 w-5 text-primary" />
            Generer arbeidsavtale
          </DialogTitle>
          <DialogDescription>
            For {onboarding.full_name} - Velg mal og tilpass verdier
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 grid grid-cols-2 gap-4 min-h-0">
          {/* Left: Values and settings */}
          <div className="space-y-4 overflow-auto pr-2">
            {/* Template selector */}
            <div className="space-y-2">
              <Label>Kontraktmal</Label>
              <Select value={selectedTemplateId} onValueChange={setSelectedTemplateId}>
                <SelectTrigger>
                  <SelectValue placeholder="Velg mal..." />
                </SelectTrigger>
                <SelectContent>
                  {templates.length === 0 && (
                    <SelectItem value="default">Standardmal</SelectItem>
                  )}
                  {templates.map(template => (
                    <SelectItem key={template.id} value={template.id}>
                      {template.name}
                      {template.is_default && (
                        <Badge variant="secondary" className="ml-2">Standard</Badge>
                      )}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Personal info */}
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-sm font-medium">
                <User className="h-4 w-4 text-muted-foreground" />
                Personalia
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label className="text-xs">Navn</Label>
                  <Input 
                    value={mergedValues.full_name || ""} 
                    onChange={(e) => handleValueChange("full_name", e.target.value)}
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Personnummer</Label>
                  <Input 
                    value={mergedValues.personal_number || ""} 
                    onChange={(e) => handleValueChange("personal_number", e.target.value)}
                  />
                </div>
                <div className="col-span-2 space-y-1">
                  <Label className="text-xs">Adresse</Label>
                  <Input 
                    value={mergedValues.address || ""} 
                    onChange={(e) => handleValueChange("address", e.target.value)}
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Postnummer</Label>
                  <Input 
                    value={mergedValues.postal_code || ""} 
                    onChange={(e) => handleValueChange("postal_code", e.target.value)}
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Poststed</Label>
                  <Input 
                    value={mergedValues.city || ""} 
                    onChange={(e) => handleValueChange("city", e.target.value)}
                  />
                </div>
              </div>
            </div>

            {/* Work info */}
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-sm font-medium">
                <Building2 className="h-4 w-4 text-muted-foreground" />
                Stilling
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label className="text-xs">Avdeling</Label>
                  <Input 
                    value={mergedValues.department || ""} 
                    onChange={(e) => handleValueChange("department", e.target.value)}
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Stilling</Label>
                  <Input 
                    value={mergedValues.function || ""} 
                    onChange={(e) => handleValueChange("function", e.target.value)}
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Startdato</Label>
                  <Input 
                    value={mergedValues.start_date || ""} 
                    onChange={(e) => handleValueChange("start_date", e.target.value)}
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Stillingsprosent</Label>
                  <Input 
                    value={mergedValues.employment_percentage || ""} 
                    onChange={(e) => handleValueChange("employment_percentage", e.target.value)}
                  />
                </div>
              </div>
            </div>

            {/* Salary info */}
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-sm font-medium">
                <Wallet className="h-4 w-4 text-muted-foreground" />
                Lønn
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label className="text-xs">Lønnstype</Label>
                  <Select 
                    value={mergedValues.salary_type} 
                    onValueChange={(v) => handleValueChange("salary_type", v)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="hourly">Timelønn</SelectItem>
                      <SelectItem value="fixed">Fastlønn</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                {mergedValues.salary_type === "hourly" ? (
                  <div className="space-y-1">
                    <Label className="text-xs">Timelønn (kr)</Label>
                    <Input 
                      type="number"
                      value={mergedValues.hourly_rate || ""} 
                      onChange={(e) => handleValueChange("hourly_rate", e.target.value)}
                    />
                  </div>
                ) : (
                  <div className="space-y-1">
                    <Label className="text-xs">Månedslønn (kr)</Label>
                    <Input 
                      type="number"
                      value={mergedValues.monthly_salary || ""} 
                      onChange={(e) => handleValueChange("monthly_salary", e.target.value)}
                    />
                  </div>
                )}
                <div className="space-y-1">
                  <Label className="text-xs">Timer per uke</Label>
                  <Input 
                    value={mergedValues.contracted_hours || ""} 
                    onChange={(e) => handleValueChange("contracted_hours", e.target.value)}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Right: Preview */}
          <div className="border rounded-lg flex flex-col min-h-0">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="flex flex-col h-full">
              <TabsList className="mx-4 mt-4 self-start">
                <TabsTrigger value="preview" className="flex items-center gap-1">
                  <Eye className="h-3 w-3" />
                  Forhåndsvisning
                </TabsTrigger>
                <TabsTrigger value="edit" className="flex items-center gap-1">
                  <Edit className="h-3 w-3" />
                  Rediger
                </TabsTrigger>
              </TabsList>
              
              <TabsContent value="preview" className="flex-1 m-0 overflow-hidden">
                <ScrollArea className="h-full p-4">
                  <ContractPreview content={previewContent} />
                </ScrollArea>
              </TabsContent>
              
              <TabsContent value="edit" className="flex-1 m-0 p-4">
                <Textarea
                  value={customContent || selectedTemplate?.content || DEFAULT_TEMPLATE}
                  onChange={(e) => setCustomContent(e.target.value)}
                  className="h-full font-mono text-sm"
                  placeholder="Skriv kontraktinnhold her..."
                />
              </TabsContent>
            </Tabs>
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Avbryt
          </Button>
          <Button 
            variant="secondary"
            onClick={() => handleGenerate(false)}
            disabled={isGenerating}
          >
            <Check className="mr-2 h-4 w-4" />
            Lagre som utkast
          </Button>
          <Button 
            onClick={() => handleGenerate(true)}
            disabled={isGenerating}
          >
            <Send className="mr-2 h-4 w-4" />
            {isGenerating ? "Genererer..." : "Send til signering"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
