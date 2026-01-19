import { HandbookSection } from "@/hooks/useHandbook";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { FileText, Download, AlertTriangle, Scale, Paperclip } from "lucide-react";
import { format } from "date-fns";
import { nb } from "date-fns/locale";

interface HandbookSectionViewProps {
  section: HandbookSection & { 
    chapter?: { title: string; icon: string | null };
    attachments?: Array<{
      id: string;
      filename: string;
      file_url: string;
      file_type: string | null;
    }>;
  };
  onAcknowledge?: () => void;
  isAcknowledged?: boolean;
  requiresAcknowledgment?: boolean;
}

export function HandbookSectionView({
  section,
  onAcknowledge,
  isAcknowledged,
  requiresAcknowledgment,
}: HandbookSectionViewProps) {
  // Simple markdown to HTML conversion
  const renderContent = (content: string) => {
    // Basic markdown parsing
    let html = content
      // Headers
      .replace(/^### (.+)$/gm, '<h3 class="text-lg font-semibold mt-6 mb-2">$1</h3>')
      .replace(/^## (.+)$/gm, '<h2 class="text-xl font-semibold mt-8 mb-3">$1</h2>')
      .replace(/^# (.+)$/gm, '<h1 class="text-2xl font-bold mt-8 mb-4">$1</h1>')
      // Bold
      .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
      // Italic
      .replace(/\*(.+?)\*/g, '<em>$1</em>')
      // Line breaks
      .replace(/\n\n/g, '</p><p class="mb-4">')
      // Horizontal rule
      .replace(/^---$/gm, '<hr class="my-6 border-border">')
      // Lists
      .replace(/^- (.+)$/gm, '<li class="ml-4">$1</li>')
      .replace(/(<li.*<\/li>)\n(<li)/gm, '$1$2');
    
    // Wrap in paragraph
    if (!html.startsWith('<')) {
      html = '<p class="mb-4">' + html + '</p>';
    }
    
    return html;
  };

  return (
    <ScrollArea className="h-full">
      <div className="p-6 max-w-3xl mx-auto">
        {section.chapter && (
          <div className="text-sm text-muted-foreground mb-2">
            {section.chapter.title}
          </div>
        )}
        
        <h1 className="text-2xl font-bold mb-4">{section.title}</h1>
        
        <div className="flex flex-wrap gap-2 mb-6">
          {section.is_legal_requirement && (
            <Badge variant="secondary" className="gap-1">
              <Scale className="h-3 w-3" />
              Lovpålagt
            </Badge>
          )}
          {section.legal_reference && (
            <Badge variant="outline">{section.legal_reference}</Badge>
          )}
          {section.requires_acknowledgment && (
            <Badge variant={isAcknowledged ? "default" : "destructive"} className="gap-1">
              {isAcknowledged ? "✓ Signert" : "Krever signering"}
            </Badge>
          )}
          {section.last_reviewed_at && (
            <Badge variant="outline" className="text-muted-foreground">
              Gjennomgått: {format(new Date(section.last_reviewed_at), "d. MMMM yyyy", { locale: nb })}
            </Badge>
          )}
        </div>
        
        <Card className="mb-6">
          <CardContent className="pt-6">
            <div 
              className="prose prose-sm max-w-none dark:prose-invert"
              dangerouslySetInnerHTML={{ __html: renderContent(section.content) }}
            />
          </CardContent>
        </Card>
        
        {section.attachments && section.attachments.length > 0 && (
          <Card className="mb-6">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Paperclip className="h-4 w-4" />
                Vedlegg
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {section.attachments.map(attachment => (
                <a
                  key={attachment.id}
                  href={attachment.file_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 p-2 rounded-md hover:bg-accent transition-colors"
                >
                  <FileText className="h-4 w-4 text-primary" />
                  <span className="flex-1">{attachment.filename}</span>
                  <Download className="h-4 w-4 text-muted-foreground" />
                </a>
              ))}
            </CardContent>
          </Card>
        )}
        
        {requiresAcknowledgment && !isAcknowledged && onAcknowledge && (
          <Card className="border-amber-500/50 bg-amber-500/10">
            <CardContent className="pt-6">
              <div className="flex items-start gap-3">
                <AlertTriangle className="h-5 w-5 text-amber-500 shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="font-medium mb-2">Denne seksjonen krever bekreftelse</p>
                  <p className="text-sm text-muted-foreground mb-4">
                    Du må bekrefte at du har lest og forstått innholdet i denne seksjonen.
                  </p>
                  <Button onClick={onAcknowledge}>
                    Bekreft lesing
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </ScrollArea>
  );
}
