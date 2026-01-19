import { useState } from "react";
import { cn } from "@/lib/utils";
import { ChevronDown, ChevronRight, Circle, AlertCircle } from "lucide-react";
import * as LucideIcons from "lucide-react";
import { HandbookChapter, HandbookSection } from "@/hooks/useHandbook";
import { ScrollArea } from "@/components/ui/scroll-area";

interface HandbookTableOfContentsProps {
  chapters: HandbookChapter[];
  selectedSectionId?: string;
  onSelectSection: (section: HandbookSection) => void;
  acknowledgedSections?: Set<string>;
  updatedSections?: Set<string>;
  newSections?: Set<string>;
}

export function HandbookTableOfContents({
  chapters,
  selectedSectionId,
  onSelectSection,
  acknowledgedSections = new Set(),
  updatedSections = new Set(),
  newSections = new Set(),
}: HandbookTableOfContentsProps) {
  const [expandedChapters, setExpandedChapters] = useState<Set<string>>(
    new Set(chapters.map(c => c.id))
  );

  const toggleChapter = (chapterId: string) => {
    setExpandedChapters(prev => {
      const next = new Set(prev);
      if (next.has(chapterId)) {
        next.delete(chapterId);
      } else {
        next.add(chapterId);
      }
      return next;
    });
  };

  const getIcon = (iconName: string | null) => {
    if (!iconName) return null;
    const IconComponent = (LucideIcons as any)[iconName];
    return IconComponent ? <IconComponent className="h-4 w-4" /> : null;
  };

  return (
    <ScrollArea className="h-full">
      <div className="p-4 space-y-1">
        <h3 className="text-sm font-medium text-muted-foreground mb-3">
          📑 INNHOLD
        </h3>
        
        {chapters.map((chapter, index) => {
          const isExpanded = expandedChapters.has(chapter.id);
          const hasUpdates = chapter.sections?.some(s => 
            updatedSections.has(s.id) || newSections.has(s.id)
          );
          
          return (
            <div key={chapter.id} className="space-y-0.5">
              <button
                onClick={() => toggleChapter(chapter.id)}
                className={cn(
                  "w-full flex items-center gap-2 px-2 py-1.5 rounded-md text-sm font-medium",
                  "hover:bg-accent/50 transition-colors text-left"
                )}
              >
                {isExpanded ? (
                  <ChevronDown className="h-4 w-4 shrink-0" />
                ) : (
                  <ChevronRight className="h-4 w-4 shrink-0" />
                )}
                {getIcon(chapter.icon) || <Circle className="h-4 w-4" />}
                <span className="flex-1 truncate">
                  {index + 1}. {chapter.title}
                </span>
                {hasUpdates && (
                  <span className="h-2 w-2 rounded-full bg-primary shrink-0" />
                )}
              </button>
              
              {isExpanded && chapter.sections && (
                <div className="ml-6 space-y-0.5">
                  {chapter.sections.map(section => {
                    const isNew = newSections.has(section.id);
                    const isUpdated = updatedSections.has(section.id);
                    const isAcknowledged = acknowledgedSections.has(section.id);
                    
                    return (
                      <button
                        key={section.id}
                        onClick={() => onSelectSection(section)}
                        className={cn(
                          "w-full flex items-center gap-2 px-2 py-1 rounded-md text-sm",
                          "hover:bg-accent/50 transition-colors text-left",
                          selectedSectionId === section.id && "bg-accent"
                        )}
                      >
                        <span className="flex-1 truncate text-muted-foreground">
                          {section.title}
                        </span>
                        {section.requires_acknowledgment && !isAcknowledged && (
                          <AlertCircle className="h-3.5 w-3.5 text-amber-500 shrink-0" />
                        )}
                        {isNew && (
                          <span className="h-2 w-2 rounded-full bg-red-500 shrink-0" title="Nytt innhold" />
                        )}
                        {isUpdated && !isNew && (
                          <span className="h-2 w-2 rounded-full bg-amber-500 shrink-0" title="Oppdatert" />
                        )}
                        {isAcknowledged && (
                          <span className="text-xs text-green-600">✓</span>
                        )}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
        
        <div className="pt-4 border-t mt-4 space-y-1 text-xs text-muted-foreground">
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-red-500" />
            <span>= Nytt innhold</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-amber-500" />
            <span>= Oppdatert</span>
          </div>
        </div>
      </div>
    </ScrollArea>
  );
}
