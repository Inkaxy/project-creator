import { useState, useCallback } from "react";
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
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Upload,
  FileSpreadsheet,
  AlertTriangle,
  CheckCircle2,
  Loader2,
  Download,
} from "lucide-react";
import { toast } from "sonner";
import {
  useWageLadders,
  useCreateWageLadderLevel,
  useUpdateWageLadderLevel,
  WageLadder,
} from "@/hooks/useWageLadders";

interface TariffImportModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface ParsedLevel {
  level: number;
  minHours: number;
  maxHours: number | null;
  hourlyRate: number;
  isNew: boolean;
  isChanged: boolean;
  oldRate?: number;
}

interface ImportPreview {
  ladderId: string;
  tariffYear: number;
  tariffVersion: string;
  levels: ParsedLevel[];
  errors: string[];
}

export function TariffImportModal({ open, onOpenChange }: TariffImportModalProps) {
  const { data: wageLadders = [] } = useWageLadders();
  const createLevel = useCreateWageLadderLevel();
  const updateLevel = useUpdateWageLadderLevel();

  const [step, setStep] = useState<"select" | "upload" | "preview" | "importing">("select");
  const [selectedLadderId, setSelectedLadderId] = useState<string>("");
  const [tariffYear, setTariffYear] = useState<number>(new Date().getFullYear());
  const [tariffVersion, setTariffVersion] = useState<string>("1.0");
  const [csvData, setCsvData] = useState<string>("");
  const [preview, setPreview] = useState<ImportPreview | null>(null);

  const selectedLadder = wageLadders.find(l => l.id === selectedLadderId);

  const resetForm = useCallback(() => {
    setStep("select");
    setSelectedLadderId("");
    setTariffYear(new Date().getFullYear());
    setTariffVersion("1.0");
    setCsvData("");
    setPreview(null);
  }, []);

  const handleClose = () => {
    resetForm();
    onOpenChange(false);
  };

  const parseCSV = useCallback((csv: string, ladder: WageLadder): ImportPreview => {
    const errors: string[] = [];
    const levels: ParsedLevel[] = [];
    
    const lines = csv.trim().split("\n");
    
    // Skip header if present
    const startIndex = lines[0]?.toLowerCase().includes("nivå") || 
                       lines[0]?.toLowerCase().includes("level") ? 1 : 0;
    
    for (let i = startIndex; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;
      
      // Support both semicolon and comma as delimiter
      const delimiter = line.includes(";") ? ";" : ",";
      const parts = line.split(delimiter).map(p => p.trim());
      
      if (parts.length < 4) {
        errors.push(`Linje ${i + 1}: For få kolonner (forventet: nivå, timer_fra, timer_til, timelønn)`);
        continue;
      }
      
      const levelNum = parseInt(parts[0]);
      const minHours = parseInt(parts[1]);
      const maxHours = parts[2] === "" || parts[2] === "-" || parts[2] === "∞" ? null : parseInt(parts[2]);
      const hourlyRate = parseFloat(parts[3].replace(",", ".").replace(/[^\d.]/g, ""));
      
      if (isNaN(levelNum) || levelNum < 1) {
        errors.push(`Linje ${i + 1}: Ugyldig nivånummer "${parts[0]}"`);
        continue;
      }
      
      if (isNaN(minHours) || minHours < 0) {
        errors.push(`Linje ${i + 1}: Ugyldige timer fra "${parts[1]}"`);
        continue;
      }
      
      if (maxHours !== null && (isNaN(maxHours) || maxHours <= minHours)) {
        errors.push(`Linje ${i + 1}: Ugyldige timer til "${parts[2]}"`);
        continue;
      }
      
      if (isNaN(hourlyRate) || hourlyRate <= 0) {
        errors.push(`Linje ${i + 1}: Ugyldig timelønn "${parts[3]}"`);
        continue;
      }
      
      // Check if level exists in current ladder
      const existingLevel = ladder.levels?.find(l => l.level === levelNum);
      const isChanged = existingLevel ? existingLevel.hourly_rate !== hourlyRate : false;
      
      levels.push({
        level: levelNum,
        minHours,
        maxHours,
        hourlyRate,
        isNew: !existingLevel,
        isChanged,
        oldRate: existingLevel?.hourly_rate,
      });
    }
    
    // Sort by level
    levels.sort((a, b) => a.level - b.level);
    
    return {
      ladderId: ladder.id,
      tariffYear,
      tariffVersion,
      levels,
      errors,
    };
  }, [tariffYear, tariffVersion]);

  const handlePreview = () => {
    if (!selectedLadder || !csvData.trim()) {
      toast.error("Velg lønnsstige og lim inn data");
      return;
    }
    
    const result = parseCSV(csvData, selectedLadder);
    setPreview(result);
    setStep("preview");
  };

  const handleImport = async () => {
    if (!preview || !selectedLadder) return;
    
    setStep("importing");
    
    try {
      const today = new Date().toISOString().split("T")[0];
      
      for (const level of preview.levels) {
        const existingLevel = selectedLadder.levels?.find(l => l.level === level.level);
        
        if (existingLevel) {
          // Update existing level
          await updateLevel.mutateAsync({
            id: existingLevel.id,
            min_hours: level.minHours,
            max_hours: level.maxHours,
            hourly_rate: level.hourlyRate,
            effective_from: today,
          });
        } else {
          // Create new level
          await createLevel.mutateAsync({
            ladder_id: selectedLadder.id,
            level: level.level,
            min_hours: level.minHours,
            max_hours: level.maxHours,
            hourly_rate: level.hourlyRate,
            effective_from: today,
          });
        }
      }
      
      toast.success(`${preview.levels.length} nivåer importert for ${selectedLadder.name}`);
      handleClose();
    } catch (error) {
      console.error("Import error:", error);
      toast.error("Feil ved import av tariffer");
      setStep("preview");
    }
  };

  const downloadTemplate = () => {
    const template = `Nivå;Timer fra;Timer til;Timelønn
1;0;2000;195.50
2;2000;4000;205.00
3;4000;6000;215.00
4;6000;8000;225.00
5;8000;;235.00`;
    
    const blob = new Blob([template], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = "tariff-mal.csv";
    link.click();
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[85vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileSpreadsheet className="h-5 w-5" />
            Importer tariff
          </DialogTitle>
          <DialogDescription>
            Importer nye lønnssatser fra CSV-fil eller tekst
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="flex-1 pr-4">
          {/* Step 1: Select Ladder */}
          {step === "select" && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Velg lønnsstige</Label>
                <Select value={selectedLadderId} onValueChange={setSelectedLadderId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Velg lønnsstige..." />
                  </SelectTrigger>
                  <SelectContent>
                    {wageLadders.map((ladder) => (
                      <SelectItem key={ladder.id} value={ladder.id}>
                        {ladder.name} ({ladder.levels?.length || 0} nivåer)
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Tariffår</Label>
                  <Input
                    type="number"
                    value={tariffYear}
                    onChange={(e) => setTariffYear(parseInt(e.target.value))}
                    min={2020}
                    max={2030}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Versjon</Label>
                  <Input
                    value={tariffVersion}
                    onChange={(e) => setTariffVersion(e.target.value)}
                    placeholder="1.0"
                  />
                </div>
              </div>

              <Button
                variant="outline"
                size="sm"
                onClick={() => setStep("upload")}
                disabled={!selectedLadderId}
                className="w-full"
              >
                Neste: Last opp data
              </Button>
            </div>
          )}

          {/* Step 2: Upload/Paste Data */}
          {step === "upload" && (
            <div className="space-y-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">Format</CardTitle>
                  <CardDescription>
                    Lim inn CSV-data med kolonner: Nivå, Timer fra, Timer til, Timelønn
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Button variant="outline" size="sm" onClick={downloadTemplate}>
                    <Download className="h-4 w-4 mr-2" />
                    Last ned mal
                  </Button>
                </CardContent>
              </Card>

              <div className="space-y-2">
                <Label>Lim inn tariffdata</Label>
                <Textarea
                  value={csvData}
                  onChange={(e) => setCsvData(e.target.value)}
                  placeholder={`Nivå;Timer fra;Timer til;Timelønn
1;0;2000;195.50
2;2000;4000;205.00
...`}
                  className="min-h-[200px] font-mono text-sm"
                />
              </div>

              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setStep("select")}>
                  Tilbake
                </Button>
                <Button onClick={handlePreview} disabled={!csvData.trim()}>
                  Forhåndsvis import
                </Button>
              </div>
            </div>
          )}

          {/* Step 3: Preview */}
          {step === "preview" && preview && (
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <h3 className="font-semibold">Forhåndsvisning for {selectedLadder?.name}</h3>
                <Badge variant="secondary">Tariff {tariffYear} v{tariffVersion}</Badge>
              </div>

              {preview.errors.length > 0 && (
                <Alert variant="destructive">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    <ul className="list-disc list-inside">
                      {preview.errors.map((error, i) => (
                        <li key={i}>{error}</li>
                      ))}
                    </ul>
                  </AlertDescription>
                </Alert>
              )}

              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nivå</TableHead>
                    <TableHead>Timer fra</TableHead>
                    <TableHead>Timer til</TableHead>
                    <TableHead>Timelønn</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {preview.levels.map((level) => (
                    <TableRow key={level.level}>
                      <TableCell className="font-medium">{level.level}</TableCell>
                      <TableCell>{level.minHours.toLocaleString("nb-NO")}</TableCell>
                      <TableCell>
                        {level.maxHours?.toLocaleString("nb-NO") || "∞"}
                      </TableCell>
                      <TableCell className="font-mono">
                        {level.hourlyRate.toLocaleString("nb-NO", { minimumFractionDigits: 2 })} kr
                        {level.isChanged && level.oldRate && (
                          <span className="text-xs text-muted-foreground ml-1">
                            (var {level.oldRate.toLocaleString("nb-NO")} kr)
                          </span>
                        )}
                      </TableCell>
                      <TableCell>
                        {level.isNew ? (
                          <Badge variant="default" className="gap-1">
                            <CheckCircle2 className="h-3 w-3" />
                            Ny
                          </Badge>
                        ) : level.isChanged ? (
                          <Badge variant="secondary" className="gap-1">
                            <AlertTriangle className="h-3 w-3" />
                            Endret
                          </Badge>
                        ) : (
                          <Badge variant="outline">Uendret</Badge>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setStep("upload")}>
                  Tilbake
                </Button>
                <Button
                  onClick={handleImport}
                  disabled={preview.levels.length === 0}
                >
                  <Upload className="h-4 w-4 mr-2" />
                  Importer {preview.levels.length} nivåer
                </Button>
              </div>
            </div>
          )}

          {/* Step 4: Importing */}
          {step === "importing" && (
            <div className="flex flex-col items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
              <p className="text-muted-foreground">Importerer tariffer...</p>
            </div>
          )}
        </ScrollArea>

        <DialogFooter>
          <Button variant="ghost" onClick={handleClose}>
            Avbryt
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
