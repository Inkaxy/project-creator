import { useState } from "react";
import { useEmployeeDocumentsByCategory, DOCUMENT_CATEGORIES, DocumentCategory } from "@/hooks/useEmployeeDocuments";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  FileText,
  ChevronRight,
  ChevronDown,
  Upload,
  Check,
  Download,
  Trash2,
} from "lucide-react";
import { format } from "date-fns";
import { nb } from "date-fns/locale";

interface EmployeePersonnelFileTabProps {
  employeeId: string;
}

export function EmployeePersonnelFileTab({ employeeId }: EmployeePersonnelFileTabProps) {
  const { data: documentsByCategory, documents, isLoading } = useEmployeeDocumentsByCategory(employeeId);
  const [openCategories, setOpenCategories] = useState<Set<string>>(new Set(["employment"]));

  const toggleCategory = (category: string) => {
    setOpenCategories(prev => {
      const next = new Set(prev);
      if (next.has(category)) {
        next.delete(category);
      } else {
        next.add(category);
      }
      return next;
    });
  };

  const getCategoryIcon = (category: DocumentCategory) => {
    const icons: Record<DocumentCategory, string> = {
      employment: "📁",
      salary: "💰",
      leave: "🏖️",
      training: "📚",
      reviews: "💬",
      disciplinary: "⚠️",
      termination: "📤",
    };
    return icons[category];
  };

  if (isLoading) {
    return (
      <div className="space-y-2">
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-12 w-full" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h4 className="font-semibold text-foreground">Personalmappe</h4>
          <p className="text-sm text-muted-foreground">
            {documents.length} dokument{documents.length !== 1 ? "er" : ""}
          </p>
        </div>
        <Button size="sm">
          <Upload className="mr-2 h-4 w-4" />
          Last opp
        </Button>
      </div>

      <div className="space-y-2">
        {(Object.keys(DOCUMENT_CATEGORIES) as DocumentCategory[]).map((category) => {
          const categoryDocs = documentsByCategory[category] || [];
          const isOpen = openCategories.has(category);

          return (
            <Collapsible key={category} open={isOpen} onOpenChange={() => toggleCategory(category)}>
              <CollapsibleTrigger className="flex items-center justify-between w-full p-3 rounded-lg border border-border hover:bg-muted/50 transition-colors">
                <div className="flex items-center gap-3">
                  <span className="text-lg">{getCategoryIcon(category)}</span>
                  <div className="text-left">
                    <span className="font-medium text-foreground">
                      {DOCUMENT_CATEGORIES[category].label}
                    </span>
                    <p className="text-xs text-muted-foreground">
                      {DOCUMENT_CATEGORIES[category].description}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="secondary">{categoryDocs.length}</Badge>
                  {isOpen ? (
                    <ChevronDown className="h-4 w-4 text-muted-foreground" />
                  ) : (
                    <ChevronRight className="h-4 w-4 text-muted-foreground" />
                  )}
                </div>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <div className="ml-8 mt-2 space-y-2">
                  {categoryDocs.length === 0 ? (
                    <p className="text-sm text-muted-foreground py-2">
                      Ingen dokumenter i denne kategorien.
                    </p>
                  ) : (
                    categoryDocs.map((doc) => (
                      <div
                        key={doc.id}
                        className="flex items-center justify-between p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <FileText className="h-4 w-4 text-muted-foreground" />
                          <div>
                            <p className="text-sm font-medium text-foreground">
                              {doc.name}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {format(new Date(doc.created_at), "d. MMM yyyy", { locale: nb })}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {doc.is_signed && (
                            <Badge variant="outline" className="text-success border-success">
                              <Check className="mr-1 h-3 w-3" />
                              Signert
                            </Badge>
                          )}
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <Download className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </CollapsibleContent>
            </Collapsible>
          );
        })}
      </div>
    </div>
  );
}
