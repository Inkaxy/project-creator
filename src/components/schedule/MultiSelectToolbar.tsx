import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { X, Copy, Trash2, Move, Calendar } from "lucide-react";
import { cn } from "@/lib/utils";

interface MultiSelectToolbarProps {
  selectedCount: number;
  onClearSelection: () => void;
  onMoveSelected: () => void;
  onCopySelected: () => void;
  onDeleteSelected: () => void;
  isDragging?: boolean;
}

export function MultiSelectToolbar({
  selectedCount,
  onClearSelection,
  onMoveSelected,
  onCopySelected,
  onDeleteSelected,
  isDragging = false,
}: MultiSelectToolbarProps) {
  if (selectedCount === 0) return null;

  return (
    <div className={cn(
      "fixed bottom-4 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 rounded-lg border border-border bg-card p-3 shadow-lg transition-all",
      isDragging && "ring-2 ring-primary"
    )}>
      <Badge variant="secondary" className="text-sm">
        {selectedCount} vakter valgt
      </Badge>
      
      <div className="h-4 w-px bg-border mx-1" />
      
      <Button
        variant="outline"
        size="sm"
        onClick={onMoveSelected}
        className="gap-1"
      >
        <Move className="h-3 w-3" />
        Flytt
      </Button>
      
      <Button
        variant="outline"
        size="sm"
        onClick={onCopySelected}
        className="gap-1"
      >
        <Copy className="h-3 w-3" />
        Kopier
      </Button>
      
      <Button
        variant="outline"
        size="sm"
        onClick={onDeleteSelected}
        className="gap-1 text-destructive hover:text-destructive"
      >
        <Trash2 className="h-3 w-3" />
        Slett
      </Button>
      
      <div className="h-4 w-px bg-border mx-1" />
      
      <Button
        variant="ghost"
        size="icon"
        onClick={onClearSelection}
        className="h-7 w-7"
      >
        <X className="h-4 w-4" />
      </Button>
      
      <p className="text-xs text-muted-foreground ml-2">
        Dra for å flytte alle valgte
      </p>
    </div>
  );
}
