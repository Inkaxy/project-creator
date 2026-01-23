import { useState, useRef } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Upload, FileText, X, Loader2, Sparkles } from "lucide-react";
import { DOCUMENT_TYPES, useUploadEquipmentDocument } from "@/hooks/useEquipmentDocuments";
import { Badge } from "@/components/ui/badge";

interface EquipmentDocumentUploadModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  equipmentId: string;
}

export function EquipmentDocumentUploadModal({
  open,
  onOpenChange,
  equipmentId,
}: EquipmentDocumentUploadModalProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const uploadMutation = useUploadEquipmentDocument();

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [documentType, setDocumentType] = useState("datasheet");
  const [documentName, setDocumentName] = useState("");
  const [expiresAt, setExpiresAt] = useState("");

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      if (!documentName) {
        // Auto-fill name from filename (without extension)
        const nameWithoutExt = file.name.replace(/\.[^/.]+$/, "");
        setDocumentName(nameWithoutExt);
      }
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file) {
      setSelectedFile(file);
      if (!documentName) {
        const nameWithoutExt = file.name.replace(/\.[^/.]+$/, "");
        setDocumentName(nameWithoutExt);
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile || !documentName.trim()) return;

    await uploadMutation.mutateAsync({
      equipmentId,
      file: selectedFile,
      documentType,
      name: documentName.trim(),
      expiresAt: expiresAt || null,
    });

    // Reset form
    setSelectedFile(null);
    setDocumentType("datasheet");
    setDocumentName("");
    setExpiresAt("");
    onOpenChange(false);
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Last opp dokument</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* File Drop Zone */}
          <div
            className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
              selectedFile
                ? "border-primary bg-primary/5"
                : "border-muted-foreground/25 hover:border-primary/50"
            }`}
            onDragOver={(e) => e.preventDefault()}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
          >
            <input
              ref={fileInputRef}
              type="file"
              className="hidden"
              onChange={handleFileSelect}
              accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png,.gif,.webp"
            />
            
            {selectedFile ? (
              <div className="flex items-center justify-center gap-3">
                <FileText className="h-8 w-8 text-primary" />
                <div className="text-left">
                  <p className="font-medium">{selectedFile.name}</p>
                  <p className="text-sm text-muted-foreground">
                    {formatFileSize(selectedFile.size)}
                  </p>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedFile(null);
                  }}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ) : (
              <>
                <Upload className="h-10 w-10 mx-auto text-muted-foreground mb-2" />
                <p className="font-medium">Dra og slipp fil her</p>
                <p className="text-sm text-muted-foreground">
                  eller klikk for å velge fil
                </p>
              </>
            )}
          </div>

          {/* Document Type */}
          <div className="space-y-2">
            <Label>Dokumenttype</Label>
            <Select value={documentType} onValueChange={setDocumentType}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {DOCUMENT_TYPES.map((type) => (
                  <SelectItem key={type.value} value={type.value}>
                    <span className="flex items-center gap-2">
                      <span>{type.icon}</span>
                      <span>{type.label}</span>
                      {type.value === "datasheet" && (
                        <Badge variant="secondary" className="ml-2 text-xs gap-1">
                          <Sparkles className="h-3 w-3" />
                          CrewAI
                        </Badge>
                      )}
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {documentType === "datasheet" && (
              <p className="text-xs text-muted-foreground">
                💡 Datablader kan søkes i av CrewAI for å gi svar på feilkoder, rengjøringsprosedyrer og vedlikehold
              </p>
            )}
          </div>

          {/* Document Name */}
          <div className="space-y-2">
            <Label htmlFor="name">Dokumentnavn *</Label>
            <Input
              id="name"
              value={documentName}
              onChange={(e) => setDocumentName(e.target.value)}
              placeholder="F.eks. Datablad Rational SCC 101"
            />
          </div>

          {/* Expiry Date (optional) */}
          <div className="space-y-2">
            <Label htmlFor="expires">Utløpsdato (valgfritt)</Label>
            <Input
              id="expires"
              type="date"
              value={expiresAt}
              onChange={(e) => setExpiresAt(e.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              Relevant for sertifikater og garantier
            </p>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Avbryt
            </Button>
            <Button
              type="submit"
              disabled={!selectedFile || !documentName.trim() || uploadMutation.isPending}
            >
              {uploadMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Laster opp...
                </>
              ) : (
                <>
                  <Upload className="mr-2 h-4 w-4" />
                  Last opp
                </>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
