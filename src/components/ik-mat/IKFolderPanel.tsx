import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { useIKFoldersWithHierarchy, IKDocumentFolder, useIKDocuments } from "@/hooks/useIKDocuments";
import {
  Folder,
  FolderOpen,
  ChevronRight,
  ChevronDown,
  FileText,
  Star,
  Building2,
  ShieldCheck,
  AlertCircle,
  AlertTriangle,
  GraduationCap,
  CalendarCheck,
  FolderCog,
  FileArchive,
  Plus,
} from "lucide-react";
import { cn } from "@/lib/utils";

const iconMap: Record<string, React.ElementType> = {
  "building-2": Building2,
  "shield-check": ShieldCheck,
  "alert-circle": AlertCircle,
  "alert-triangle": AlertTriangle,
  "graduation-cap": GraduationCap,
  "file-text": FileText,
  "calendar-check": CalendarCheck,
  "folder-cog": FolderCog,
  "file-archive": FileArchive,
  folder: Folder,
};

interface FolderItemProps {
  folder: IKDocumentFolder;
  level: number;
  selectedFolderId: string | null;
  onSelect: (folder: IKDocumentFolder) => void;
}

function FolderItem({ folder, level, selectedFolderId, onSelect }: FolderItemProps) {
  const [isOpen, setIsOpen] = useState(level === 0);
  const hasChildren = folder.children && folder.children.length > 0;
  const isSelected = selectedFolderId === folder.id;
  const Icon = iconMap[folder.icon || "folder"] || Folder;

  return (
    <div>
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <div
          className={cn(
            "flex items-center gap-2 px-3 py-2 rounded-md cursor-pointer transition-colors",
            isSelected ? "bg-primary/10 text-primary" : "hover:bg-muted",
            level > 0 && "ml-4"
          )}
          onClick={() => onSelect(folder)}
        >
          {hasChildren ? (
            <CollapsibleTrigger asChild onClick={(e) => e.stopPropagation()}>
              <Button variant="ghost" size="icon" className="h-5 w-5 p-0">
                {isOpen ? (
                  <ChevronDown className="h-4 w-4" />
                ) : (
                  <ChevronRight className="h-4 w-4" />
                )}
              </Button>
            </CollapsibleTrigger>
          ) : (
            <span className="w-5" />
          )}

          {isOpen && hasChildren ? (
            <FolderOpen className="h-4 w-4 text-primary" />
          ) : (
            <Icon className="h-4 w-4" />
          )}

          <span className="flex-1 text-sm font-medium truncate">
            {folder.code}. {folder.name}
          </span>

          {folder.is_required && (
            <Star className="h-3 w-3 text-warning fill-warning" />
          )}

          {(folder.document_count || 0) > 0 && (
            <Badge variant="secondary" className="text-xs">
              {folder.document_count}
            </Badge>
          )}
        </div>

        {hasChildren && (
          <CollapsibleContent>
            {folder.children!.map((child) => (
              <FolderItem
                key={child.id}
                folder={child}
                level={level + 1}
                selectedFolderId={selectedFolderId}
                onSelect={onSelect}
              />
            ))}
          </CollapsibleContent>
        )}
      </Collapsible>
    </div>
  );
}

interface IKFolderPanelProps {
  selectedFolder: IKDocumentFolder | null;
  onSelectFolder: (folder: IKDocumentFolder | null) => void;
}

export function IKFolderPanel({ selectedFolder, onSelectFolder }: IKFolderPanelProps) {
  const { folders, isLoading } = useIKFoldersWithHierarchy();
  const { data: documents = [] } = useIKDocuments(selectedFolder?.id);

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="animate-pulse space-y-3">
            {[...Array(9)].map((_, i) => (
              <div key={i} className="h-8 bg-muted rounded" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Folder className="h-4 w-4" />
            Internkontroll-mappe
          </CardTitle>
        </CardHeader>
        <CardContent className="p-2">
          <div className="space-y-1">
            <div
              className={cn(
                "flex items-center gap-2 px-3 py-2 rounded-md cursor-pointer transition-colors",
                !selectedFolder ? "bg-primary/10 text-primary" : "hover:bg-muted"
              )}
              onClick={() => onSelectFolder(null)}
            >
              <Folder className="h-4 w-4" />
              <span className="text-sm font-medium">Alle dokumenter</span>
            </div>
            {folders.map((folder) => (
              <FolderItem
                key={folder.id}
                folder={folder}
                level={0}
                selectedFolderId={selectedFolder?.id || null}
                onSelect={onSelectFolder}
              />
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-4 space-y-2">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Star className="h-3 w-3 text-warning fill-warning" />
            <span>= Lovpålagt skriftlig dokumentasjon</span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
