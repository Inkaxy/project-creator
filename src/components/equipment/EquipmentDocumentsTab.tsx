import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Plus,
  FileText,
  Download,
  ExternalLink,
  AlertCircle,
  Trash2,
  Sparkles,
  Loader2,
} from "lucide-react";
import { format, isPast, differenceInDays } from "date-fns";
import { nb } from "date-fns/locale";
import {
  useEquipmentDocuments,
  useDeleteEquipmentDocument,
  getDocumentTypeInfo,
} from "@/hooks/useEquipmentDocuments";
import { EquipmentDocumentUploadModal } from "./EquipmentDocumentUploadModal";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface EquipmentDocumentsTabProps {
  equipmentId: string;
}

function getExpiryBadge(expiresAt: string | null) {
  if (!expiresAt) return null;

  const expiryDate = new Date(expiresAt);
  const daysUntil = differenceInDays(expiryDate, new Date());

  if (isPast(expiryDate)) {
    return (
      <Badge variant="destructive" className="gap-1">
        <AlertCircle className="h-3 w-3" />
        Utløpt
      </Badge>
    );
  }
  if (daysUntil <= 30) {
    return (
      <Badge className="bg-yellow-100 text-yellow-800 gap-1">
        <AlertCircle className="h-3 w-3" />
        Utløper om {daysUntil} dager
      </Badge>
    );
  }
  return (
    <Badge variant="secondary">
      Gyldig til {format(expiryDate, "d. MMM yyyy", { locale: nb })}
    </Badge>
  );
}

export function EquipmentDocumentsTab({ equipmentId }: EquipmentDocumentsTabProps) {
  const { data: documents = [], isLoading } = useEquipmentDocuments(equipmentId);
  const deleteDocument = useDeleteEquipmentDocument();

  const [showUploadModal, setShowUploadModal] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<{ id: string; name: string } | null>(null);

  // Group documents by type
  const groupedDocuments = documents.reduce(
    (acc, doc) => {
      const type = doc.document_type;
      if (!acc[type]) {
        acc[type] = [];
      }
      acc[type].push(doc);
      return acc;
    },
    {} as Record<string, typeof documents>
  );

  // Prioritize datasheets at the top
  const sortedTypes = Object.keys(groupedDocuments).sort((a, b) => {
    if (a === "datasheet") return -1;
    if (b === "datasheet") return 1;
    return 0;
  });

  const handleDelete = async () => {
    if (!deleteConfirm) return;
    await deleteDocument.mutateAsync({
      id: deleteConfirm.id,
      equipmentId,
    });
    setDeleteConfirm(null);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-semibold">Dokumenter</h3>
          <p className="text-sm text-muted-foreground">
            {documents.length} dokumenter
          </p>
        </div>
        <Button onClick={() => setShowUploadModal(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Last opp dokument
        </Button>
      </div>

      {/* CrewAI Info Banner */}
      {documents.some((d) => d.document_type === "datasheet") && (
        <Card className="border-primary/20 bg-primary/5">
          <CardContent className="py-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/20">
                <Sparkles className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="font-medium text-sm">CrewAI-klar</p>
                <p className="text-xs text-muted-foreground">
                  Datablader for dette utstyret kan søkes i av CrewAI for å gi svar på feilkoder,
                  rengjøringsprosedyrer og vedlikeholdsrutiner.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Document Groups */}
      {sortedTypes.map((type) => {
        const docs = groupedDocuments[type];
        const typeInfo = getDocumentTypeInfo(type);
        const isDatasheet = type === "datasheet";

        return (
          <Card key={type} className={isDatasheet ? "border-primary/30" : undefined}>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <span>{typeInfo.icon}</span>
                {typeInfo.label} ({docs.length})
                {isDatasheet && (
                  <Badge variant="secondary" className="ml-2 gap-1">
                    <Sparkles className="h-3 w-3" />
                    CrewAI
                  </Badge>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {docs.map((doc) => (
                <div
                  key={doc.id}
                  className="flex items-center justify-between rounded-lg border p-3"
                >
                  <div className="flex items-center gap-3">
                    <FileText className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="font-medium">{doc.name}</p>
                      <p className="text-sm text-muted-foreground">
                        Lastet opp{" "}
                        {format(new Date(doc.uploaded_at), "d. MMM yyyy", { locale: nb })}
                        {doc.uploader?.full_name && ` av ${doc.uploader.full_name}`}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {getExpiryBadge(doc.expires_at)}
                    <Button variant="ghost" size="icon" asChild>
                      <a href={doc.file_url} target="_blank" rel="noopener noreferrer">
                        <ExternalLink className="h-4 w-4" />
                      </a>
                    </Button>
                    <Button variant="ghost" size="icon" asChild>
                      <a href={doc.file_url} download>
                        <Download className="h-4 w-4" />
                      </a>
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setDeleteConfirm({ id: doc.id, name: doc.name })}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        );
      })}

      {/* Empty State */}
      {documents.length === 0 && (
        <Card>
          <CardContent className="py-12 text-center">
            <FileText className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="font-semibold">Ingen dokumenter</h3>
            <p className="text-muted-foreground mb-4">
              Last opp datablader, manualer, sertifikater og annen dokumentasjon
            </p>
            <Button onClick={() => setShowUploadModal(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Last opp dokument
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Upload Modal */}
      <EquipmentDocumentUploadModal
        open={showUploadModal}
        onOpenChange={setShowUploadModal}
        equipmentId={equipmentId}
      />

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteConfirm} onOpenChange={() => setDeleteConfirm(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Slett dokument</AlertDialogTitle>
            <AlertDialogDescription>
              Er du sikker på at du vil slette "{deleteConfirm?.name}"? Denne handlingen kan ikke
              angres.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Avbryt</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Slett
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
