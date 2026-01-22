import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus, FileText, Download, ExternalLink, AlertCircle } from "lucide-react";
import { format, isPast, differenceInDays } from "date-fns";
import { nb } from "date-fns/locale";

interface EquipmentDocumentsTabProps {
  equipmentId: string;
}

// Mock data for now - would come from useEquipmentDocuments hook
const mockDocuments = [
  {
    id: "1",
    document_type: "manual",
    name: "Brukermanual",
    file_url: "#",
    expires_at: null,
    uploaded_at: "2024-01-15",
  },
  {
    id: "2",
    document_type: "certificate",
    name: "Sertifikat elektrisk anlegg",
    file_url: "#",
    expires_at: "2025-06-15",
    uploaded_at: "2024-06-15",
  },
];

function getDocumentTypeInfo(type: string) {
  const typeMap: Record<string, { label: string; icon: string }> = {
    manual: { label: "Manual", icon: "📖" },
    service_report: { label: "Servicerapport", icon: "🔧" },
    invoice: { label: "Faktura", icon: "💰" },
    certificate: { label: "Sertifikat", icon: "📜" },
    warranty: { label: "Garanti", icon: "🛡️" },
    image: { label: "Bilde", icon: "📷" },
    safety_datasheet: { label: "Sikkerhetsdatablad", icon: "⚠️" },
    other: { label: "Annet", icon: "📄" },
  };
  return typeMap[type] || typeMap.other;
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
  // In production: const { data: documents } = useEquipmentDocuments(equipmentId);
  const documents = mockDocuments;

  // Group documents by type
  const groupedDocuments = documents.reduce((acc, doc) => {
    const type = doc.document_type;
    if (!acc[type]) {
      acc[type] = [];
    }
    acc[type].push(doc);
    return acc;
  }, {} as Record<string, typeof documents>);

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
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Last opp dokument
        </Button>
      </div>

      {/* Document Groups */}
      {Object.entries(groupedDocuments).map(([type, docs]) => {
        const typeInfo = getDocumentTypeInfo(type);
        return (
          <Card key={type}>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <span>{typeInfo.icon}</span>
                {typeInfo.label} ({docs.length})
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
                        Lastet opp {format(new Date(doc.uploaded_at), "d. MMM yyyy", { locale: nb })}
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
            <p className="text-muted-foreground">
              Last opp manualer, sertifikater og annen dokumentasjon
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
