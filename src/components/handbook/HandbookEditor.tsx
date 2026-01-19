import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
import {
  HandbookChapter,
  HandbookSection,
  useCreateChapter,
  useUpdateChapter,
  useDeleteChapter,
  useCreateSection,
  useUpdateSection,
  useDeleteSection,
} from "@/hooks/useHandbook";
import {
  ChevronDown,
  ChevronRight,
  Plus,
  Pencil,
  Trash2,
  GripVertical,
  FileText,
  AlertTriangle,
  Scale,
  Save,
  Loader2,
} from "lucide-react";
import * as LucideIcons from "lucide-react";
import { cn } from "@/lib/utils";

interface HandbookEditorProps {
  handbookId: string;
  chapters: HandbookChapter[];
  selectedSection: HandbookSection | null;
  onSelectSection: (section: HandbookSection | null) => void;
}

export function HandbookEditor({
  handbookId,
  chapters,
  selectedSection,
  onSelectSection,
}: HandbookEditorProps) {
  const [expandedChapters, setExpandedChapters] = useState<Set<string>>(
    new Set(chapters.map(c => c.id))
  );
  const [editingChapter, setEditingChapter] = useState<HandbookChapter | null>(null);
  const [editingSection, setEditingSection] = useState<HandbookSection | null>(null);
  const [newChapterOpen, setNewChapterOpen] = useState(false);
  const [newSectionChapterId, setNewSectionChapterId] = useState<string | null>(null);
  const [deleteChapterId, setDeleteChapterId] = useState<string | null>(null);
  const [deleteSectionId, setDeleteSectionId] = useState<string | null>(null);
  
  const createChapter = useCreateChapter();
  const updateChapter = useUpdateChapter();
  const deleteChapter = useDeleteChapter();
  const createSection = useCreateSection();
  const updateSection = useUpdateSection();
  const deleteSection = useDeleteSection();
  
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
    if (!iconName) return <FileText className="h-4 w-4" />;
    const IconComponent = (LucideIcons as any)[iconName];
    return IconComponent ? <IconComponent className="h-4 w-4" /> : <FileText className="h-4 w-4" />;
  };
  
  const handleCreateChapter = async (data: { title: string; icon?: string; requiresAcknowledgment: boolean }) => {
    await createChapter.mutateAsync({
      handbook_id: handbookId,
      title: data.title,
      icon: data.icon || null,
      requires_acknowledgment: data.requiresAcknowledgment,
      sort_order: chapters.length,
    });
    setNewChapterOpen(false);
  };
  
  const handleUpdateChapter = async (data: { title: string; icon?: string; requiresAcknowledgment: boolean }) => {
    if (!editingChapter) return;
    await updateChapter.mutateAsync({
      id: editingChapter.id,
      title: data.title,
      icon: data.icon || null,
      requires_acknowledgment: data.requiresAcknowledgment,
    });
    setEditingChapter(null);
  };
  
  const handleDeleteChapter = async () => {
    if (!deleteChapterId) return;
    await deleteChapter.mutateAsync(deleteChapterId);
    setDeleteChapterId(null);
  };
  
  const handleCreateSection = async (data: { title: string; slug: string }) => {
    if (!newSectionChapterId) return;
    const chapter = chapters.find(c => c.id === newSectionChapterId);
    await createSection.mutateAsync({
      chapter_id: newSectionChapterId,
      title: data.title,
      slug: data.slug,
      content: "",
      sort_order: chapter?.sections?.length || 0,
    });
    setNewSectionChapterId(null);
  };
  
  const handleDeleteSection = async () => {
    if (!deleteSectionId) return;
    await deleteSection.mutateAsync(deleteSectionId);
    setDeleteSectionId(null);
    if (selectedSection?.id === deleteSectionId) {
      onSelectSection(null);
    }
  };
  
  return (
    <div className="flex h-full">
      {/* Left sidebar - chapters/sections */}
      <div className="w-80 border-r flex flex-col">
        <div className="p-4 border-b">
          <Button onClick={() => setNewChapterOpen(true)} className="w-full gap-2">
            <Plus className="h-4 w-4" />
            Legg til kapittel
          </Button>
        </div>
        
        <ScrollArea className="flex-1">
          <div className="p-2 space-y-1">
            {chapters.map((chapter, chapterIndex) => {
              const isExpanded = expandedChapters.has(chapter.id);
              
              return (
                <div key={chapter.id}>
                  <div
                    className={cn(
                      "flex items-center gap-1 px-2 py-1.5 rounded-md group",
                      "hover:bg-accent/50"
                    )}
                  >
                    <button
                      onClick={() => toggleChapter(chapter.id)}
                      className="p-0.5"
                    >
                      {isExpanded ? (
                        <ChevronDown className="h-4 w-4" />
                      ) : (
                        <ChevronRight className="h-4 w-4" />
                      )}
                    </button>
                    <GripVertical className="h-4 w-4 text-muted-foreground cursor-grab" />
                    {getIcon(chapter.icon)}
                    <span className="flex-1 text-sm font-medium truncate">
                      {chapterIndex + 1}. {chapter.title}
                    </span>
                    {chapter.requires_acknowledgment && (
                      <Badge variant="outline" className="text-xs px-1">
                        <AlertTriangle className="h-3 w-3" />
                      </Badge>
                    )}
                    <div className="hidden group-hover:flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6"
                        onClick={() => setEditingChapter(chapter)}
                      >
                        <Pencil className="h-3 w-3" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 text-destructive"
                        onClick={() => setDeleteChapterId(chapter.id)}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                  
                  {isExpanded && (
                    <div className="ml-6 space-y-0.5">
                      {chapter.sections?.map(section => (
                        <div
                          key={section.id}
                          className={cn(
                            "flex items-center gap-1 px-2 py-1 rounded-md group cursor-pointer",
                            "hover:bg-accent/50",
                            selectedSection?.id === section.id && "bg-accent"
                          )}
                          onClick={() => onSelectSection(section)}
                        >
                          <GripVertical className="h-3 w-3 text-muted-foreground cursor-grab" />
                          <span className="flex-1 text-sm truncate">
                            {section.title}
                          </span>
                          {section.is_legal_requirement && (
                            <Scale className="h-3 w-3 text-muted-foreground" />
                          )}
                          {section.requires_acknowledgment && (
                            <AlertTriangle className="h-3 w-3 text-amber-500" />
                          )}
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-5 w-5 hidden group-hover:flex text-destructive"
                            onClick={(e) => {
                              e.stopPropagation();
                              setDeleteSectionId(section.id);
                            }}
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      ))}
                      <Button
                        variant="ghost"
                        size="sm"
                        className="w-full justify-start text-muted-foreground"
                        onClick={() => setNewSectionChapterId(chapter.id)}
                      >
                        <Plus className="h-3 w-3 mr-1" />
                        Legg til seksjon
                      </Button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </ScrollArea>
      </div>
      
      {/* Right side - section editor */}
      <div className="flex-1 flex flex-col">
        {selectedSection ? (
          <SectionEditor
            section={selectedSection}
            onUpdate={(updates) => updateSection.mutate({ id: selectedSection.id, ...updates })}
          />
        ) : (
          <div className="flex-1 flex items-center justify-center text-muted-foreground">
            Velg en seksjon for å redigere
          </div>
        )}
      </div>
      
      {/* Modals */}
      <ChapterModal
        open={newChapterOpen || !!editingChapter}
        onOpenChange={(open) => {
          if (!open) {
            setNewChapterOpen(false);
            setEditingChapter(null);
          }
        }}
        chapter={editingChapter}
        onSave={editingChapter ? handleUpdateChapter : handleCreateChapter}
        isLoading={createChapter.isPending || updateChapter.isPending}
      />
      
      <SectionModal
        open={!!newSectionChapterId}
        onOpenChange={(open) => !open && setNewSectionChapterId(null)}
        onSave={handleCreateSection}
        isLoading={createSection.isPending}
      />
      
      <AlertDialog open={!!deleteChapterId} onOpenChange={(open) => !open && setDeleteChapterId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Slett kapittel?</AlertDialogTitle>
            <AlertDialogDescription>
              Dette vil slette kapittelet og alle seksjoner i det. Denne handlingen kan ikke angres.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Avbryt</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteChapter}>Slett</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      
      <AlertDialog open={!!deleteSectionId} onOpenChange={(open) => !open && setDeleteSectionId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Slett seksjon?</AlertDialogTitle>
            <AlertDialogDescription>
              Dette vil slette seksjonen permanent. Denne handlingen kan ikke angres.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Avbryt</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteSection}>Slett</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

// Chapter modal component
function ChapterModal({
  open,
  onOpenChange,
  chapter,
  onSave,
  isLoading,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  chapter: HandbookChapter | null;
  onSave: (data: { title: string; icon?: string; requiresAcknowledgment: boolean }) => void;
  isLoading: boolean;
}) {
  const [title, setTitle] = useState(chapter?.title || "");
  const [icon, setIcon] = useState(chapter?.icon || "");
  const [requiresAck, setRequiresAck] = useState(chapter?.requires_acknowledgment || false);
  
  // Reset form when chapter changes
  useState(() => {
    setTitle(chapter?.title || "");
    setIcon(chapter?.icon || "");
    setRequiresAck(chapter?.requires_acknowledgment || false);
  });
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{chapter ? "Rediger kapittel" : "Nytt kapittel"}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="chapter-title">Tittel</Label>
            <Input
              id="chapter-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="F.eks. Arbeidstid"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="chapter-icon">Ikon (Lucide navn)</Label>
            <Input
              id="chapter-icon"
              value={icon}
              onChange={(e) => setIcon(e.target.value)}
              placeholder="F.eks. Clock"
            />
          </div>
          <div className="flex items-center gap-2">
            <Checkbox
              id="requires-ack"
              checked={requiresAck}
              onCheckedChange={(checked) => setRequiresAck(checked === true)}
            />
            <Label htmlFor="requires-ack" className="font-normal">
              Krever signering fra ansatte
            </Label>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Avbryt
          </Button>
          <Button
            onClick={() => onSave({ title, icon, requiresAcknowledgment: requiresAck })}
            disabled={!title || isLoading}
          >
            {isLoading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            {chapter ? "Lagre" : "Opprett"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// Section modal component
function SectionModal({
  open,
  onOpenChange,
  onSave,
  isLoading,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (data: { title: string; slug: string }) => void;
  isLoading: boolean;
}) {
  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  
  const generateSlug = (text: string) => {
    return text
      .toLowerCase()
      .replace(/[æ]/g, "ae")
      .replace(/[ø]/g, "o")
      .replace(/[å]/g, "a")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");
  };
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Ny seksjon</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="section-title">Tittel</Label>
            <Input
              id="section-title"
              value={title}
              onChange={(e) => {
                setTitle(e.target.value);
                if (!slug || slug === generateSlug(title)) {
                  setSlug(generateSlug(e.target.value));
                }
              }}
              placeholder="F.eks. Ordinær arbeidstid"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="section-slug">URL-slug</Label>
            <Input
              id="section-slug"
              value={slug}
              onChange={(e) => setSlug(generateSlug(e.target.value))}
              placeholder="ordinaer-arbeidstid"
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Avbryt
          </Button>
          <Button
            onClick={() => {
              onSave({ title, slug });
              setTitle("");
              setSlug("");
            }}
            disabled={!title || !slug || isLoading}
          >
            {isLoading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            Opprett
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// Section editor component
function SectionEditor({
  section,
  onUpdate,
}: {
  section: HandbookSection;
  onUpdate: (updates: Partial<HandbookSection>) => void;
}) {
  const [content, setContent] = useState(section.content);
  const [title, setTitle] = useState(section.title);
  const [isLegal, setIsLegal] = useState(section.is_legal_requirement);
  const [legalRef, setLegalRef] = useState(section.legal_reference || "");
  const [requiresAck, setRequiresAck] = useState(section.requires_acknowledgment);
  const [hasChanges, setHasChanges] = useState(false);
  
  // Reset when section changes
  useState(() => {
    setContent(section.content);
    setTitle(section.title);
    setIsLegal(section.is_legal_requirement);
    setLegalRef(section.legal_reference || "");
    setRequiresAck(section.requires_acknowledgment);
    setHasChanges(false);
  });
  
  const handleSave = () => {
    onUpdate({
      title,
      content,
      is_legal_requirement: isLegal,
      legal_reference: legalRef || null,
      requires_acknowledgment: requiresAck,
    });
    setHasChanges(false);
  };
  
  return (
    <div className="flex-1 flex flex-col">
      <div className="p-4 border-b flex items-center justify-between">
        <Input
          value={title}
          onChange={(e) => {
            setTitle(e.target.value);
            setHasChanges(true);
          }}
          className="text-lg font-semibold border-0 p-0 h-auto focus-visible:ring-0"
        />
        <Button onClick={handleSave} disabled={!hasChanges} className="gap-2">
          <Save className="h-4 w-4" />
          Lagre
        </Button>
      </div>
      
      <div className="p-4 border-b space-y-3">
        <div className="flex flex-wrap gap-4">
          <div className="flex items-center gap-2">
            <Checkbox
              id="requires-ack-section"
              checked={requiresAck}
              onCheckedChange={(checked) => {
                setRequiresAck(checked === true);
                setHasChanges(true);
              }}
            />
            <Label htmlFor="requires-ack-section" className="font-normal">
              Krever signering fra ansatte
            </Label>
          </div>
          <div className="flex items-center gap-2">
            <Checkbox
              id="is-legal"
              checked={isLegal}
              onCheckedChange={(checked) => {
                setIsLegal(checked === true);
                setHasChanges(true);
              }}
            />
            <Label htmlFor="is-legal" className="font-normal">
              Lovpålagt innhold
            </Label>
          </div>
        </div>
        {isLegal && (
          <Input
            value={legalRef}
            onChange={(e) => {
              setLegalRef(e.target.value);
              setHasChanges(true);
            }}
            placeholder="Lovhenvisning, f.eks. Arbeidsmiljøloven § 14-6"
            className="max-w-md"
          />
        )}
      </div>
      
      <div className="flex-1 p-4">
        <Label className="text-sm text-muted-foreground mb-2 block">
          Innhold (Markdown)
        </Label>
        <Textarea
          value={content}
          onChange={(e) => {
            setContent(e.target.value);
            setHasChanges(true);
          }}
          placeholder="Skriv innhold her... Støtter Markdown-formattering."
          className="min-h-[400px] font-mono text-sm resize-none"
        />
        <p className="text-xs text-muted-foreground mt-2">
          Tips: Bruk {"{{variabel}}"} for dynamiske verdier som {"{{company_name}}"}, {"{{pay_day}}"} osv.
        </p>
      </div>
    </div>
  );
}
