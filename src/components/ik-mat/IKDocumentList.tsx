import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useIKDocuments, IKDocumentFolder } from "@/hooks/useIKDocuments";
import { FileText, Plus, Eye, Edit, MoreHorizontal, CheckCircle2, Clock, AlertTriangle } from "lucide-react";
import { format } from "date-fns";
import { nb } from "date-fns/locale";

interface IKDocumentListProps {
  selectedFolder: IKDocumentFolder | null;
}

const statusConfig: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline"; icon: React.ElementType }> = {
  active: { label: "Aktiv", variant: "default", icon: CheckCircle2 },
  draft: { label: "Utkast", variant: "secondary", icon: Clock },
  review_pending: { label: "Trenger gjennomgang", variant: "destructive", icon: AlertTriangle },
  archived: { label: "Arkivert", variant: "outline", icon: FileText },
};

const documentTypeLabels: Record<string, string> = {
  routine: "Rutine",
  form_template: "Skjemamal",
  certificate: "Sertifikat",
  agreement: "Avtale",
  report: "Rapport",
  external: "Eksternt dokument",
};

export function IKDocumentList({ selectedFolder }: IKDocumentListProps) {
  const { data: documents = [], isLoading } = useIKDocuments(selectedFolder?.id);

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="animate-pulse space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-24 bg-muted rounded" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-lg flex items-center gap-2">
          <FileText className="h-5 w-5" />
          {selectedFolder ? `${selectedFolder.code}. ${selectedFolder.name}` : "Alle dokumenter"}
        </CardTitle>
        <Button size="sm">
          <Plus className="h-4 w-4 mr-2" />
          Nytt dokument
        </Button>
      </CardHeader>
      <CardContent>
        {documents.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <FileText className="h-12 w-12 mx-auto mb-3 opacity-50" />
            <p className="font-medium">Ingen dokumenter</p>
            <p className="text-sm">Opprett et nytt dokument for å komme i gang</p>
          </div>
        ) : (
          <div className="space-y-3">
            {documents.map((doc) => {
              const status = statusConfig[doc.status] || statusConfig.draft;
              const StatusIcon = status.icon;

              return (
                <div
                  key={doc.id}
                  className="border rounded-lg p-4 hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <FileText className="h-4 w-4 text-primary shrink-0" />
                        <h3 className="font-medium truncate">{doc.name}</h3>
                      </div>

                      <div className="flex flex-wrap gap-2 mb-2">
                        <Badge variant={status.variant} className="text-xs">
                          <StatusIcon className="h-3 w-3 mr-1" />
                          {status.label}
                        </Badge>
                        <Badge variant="outline" className="text-xs">
                          v{doc.version_number}
                        </Badge>
                        <Badge variant="outline" className="text-xs">
                          {documentTypeLabels[doc.document_type] || doc.document_type}
                        </Badge>
                      </div>

                      <div className="text-xs text-muted-foreground space-y-0.5">
                        <p>Sist oppdatert: {format(new Date(doc.updated_at), "d. MMMM yyyy", { locale: nb })}</p>
                        {doc.next_review_date && (
                          <p>Neste gjennomgang: {format(new Date(doc.next_review_date), "d. MMMM yyyy", { locale: nb })}</p>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
