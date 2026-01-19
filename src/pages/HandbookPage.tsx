import { useState, useMemo } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  useHandbook,
  useHandbookChapters,
  useMyAcknowledgments,
  useUpsertHandbook,
  usePublishHandbook,
  HandbookSection,
} from "@/hooks/useHandbook";
import { useAuth } from "@/contexts/AuthContext";
import { HandbookTableOfContents } from "@/components/handbook/HandbookTableOfContents";
import { HandbookSectionView } from "@/components/handbook/HandbookSectionView";
import { AcknowledgmentModal } from "@/components/handbook/AcknowledgmentModal";
import { AcknowledgmentStatusList } from "@/components/handbook/AcknowledgmentStatusList";
import { HandbookEditor } from "@/components/handbook/HandbookEditor";
import {
  BookOpen,
  Settings,
  Users,
  History,
  AlertTriangle,
  Eye,
  Pencil,
  Loader2,
  Search,
  CheckCircle,
} from "lucide-react";
import { format } from "date-fns";
import { nb } from "date-fns/locale";

export default function HandbookPage() {
  const { user, isAdmin, isManager } = useAuth();
  const isAdminOrManager = isAdmin || isManager;
  
  const [activeTab, setActiveTab] = useState<string>("read");
  const [selectedSection, setSelectedSection] = useState<HandbookSection | null>(null);
  const [showAckModal, setShowAckModal] = useState(false);
  const [showPublishModal, setShowPublishModal] = useState(false);
  const [newVersion, setNewVersion] = useState("");
  const [changesSummary, setChangesSummary] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  
  const { data: handbook, isLoading: handbookLoading } = useHandbook();
  const { data: chapters = [], isLoading: chaptersLoading } = useHandbookChapters(handbook?.id);
  const { data: myAcknowledgments = [] } = useMyAcknowledgments(handbook?.id);
  
  const upsertHandbook = useUpsertHandbook();
  const publishHandbook = usePublishHandbook();
  
  // Create handbook if none exists (admin only)
  const handleCreateHandbook = async () => {
    await upsertHandbook.mutateAsync({
      title: "Personalhåndbok",
      status: "draft",
    });
  };
  
  // Publish handbook
  const handlePublish = async () => {
    if (!handbook || !newVersion) return;
    await publishHandbook.mutateAsync({
      handbookId: handbook.id,
      newVersion,
      changesSummary,
    });
    setShowPublishModal(false);
    setNewVersion("");
    setChangesSummary("");
  };
  
  // Get acknowledged section IDs
  const acknowledgedSections = useMemo(() => {
    return new Set(
      myAcknowledgments
        .filter(a => a.section_id && a.version === handbook?.version)
        .map(a => a.section_id!)
    );
  }, [myAcknowledgments, handbook?.version]);
  
  // Check if user has acknowledged the entire handbook
  const hasAcknowledgedHandbook = useMemo(() => {
    return myAcknowledgments.some(
      a => !a.section_id && a.version === handbook?.version
    );
  }, [myAcknowledgments, handbook?.version]);
  
  // Get chapters that require acknowledgment
  const chaptersRequiringAck = useMemo(() => {
    return chapters.filter(c => c.requires_acknowledgment);
  }, [chapters]);
  
  // Search results
  const searchResults = useMemo(() => {
    if (!searchQuery.trim()) return [];
    const query = searchQuery.toLowerCase();
    const results: Array<{ section: HandbookSection; chapterTitle: string }> = [];
    
    chapters.forEach(chapter => {
      chapter.sections?.forEach(section => {
        if (
          section.title.toLowerCase().includes(query) ||
          section.content.toLowerCase().includes(query)
        ) {
          results.push({ section, chapterTitle: chapter.title });
        }
      });
    });
    
    return results;
  }, [chapters, searchQuery]);
  
  if (handbookLoading) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center h-96">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </MainLayout>
    );
  }
  
  if (!handbook) {
    return (
      <MainLayout>
        <div className="flex flex-col items-center justify-center h-96 gap-4">
          <BookOpen className="h-16 w-16 text-muted-foreground" />
          <h2 className="text-xl font-semibold">Ingen personalhåndbok funnet</h2>
          {isAdminOrManager && (
            <Button onClick={handleCreateHandbook} disabled={upsertHandbook.isPending}>
              {upsertHandbook.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Opprett personalhåndbok
            </Button>
          )}
        </div>
      </MainLayout>
    );
  }
  
  return (
    <MainLayout>
      <div className="h-[calc(100vh-4rem)] flex flex-col">
        {/* Header */}
        <div className="border-b px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <BookOpen className="h-6 w-6 text-primary" />
            <div>
              <h1 className="text-xl font-semibold">{handbook.title}</h1>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <span>Versjon {handbook.version}</span>
                {handbook.published_at && (
                  <>
                    <span>•</span>
                    <span>
                      Publisert {format(new Date(handbook.published_at), "d. MMM yyyy", { locale: nb })}
                    </span>
                  </>
                )}
                <Badge variant={handbook.status === "published" ? "default" : "secondary"}>
                  {handbook.status === "published" ? "Publisert" : "Utkast"}
                </Badge>
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            {isAdminOrManager && (
              <>
                <Button variant="outline" onClick={() => setShowPublishModal(true)}>
                  Publiser ny versjon
                </Button>
              </>
            )}
          </div>
        </div>
        
        {/* Show acknowledgment banner if needed */}
        {handbook.status === "published" && !hasAcknowledgedHandbook && chaptersRequiringAck.length > 0 && (
          <div className="bg-amber-500/10 border-b border-amber-500/20 px-6 py-3 flex items-center justify-between">
            <div className="flex items-center gap-2 text-amber-700 dark:text-amber-400">
              <AlertTriangle className="h-5 w-5" />
              <span>Du har ikke signert den oppdaterte personalhåndboken</span>
            </div>
            <Button size="sm" onClick={() => setShowAckModal(true)}>
              Les og signer nå
            </Button>
          </div>
        )}
        
        {hasAcknowledgedHandbook && (
          <div className="bg-green-500/10 border-b border-green-500/20 px-6 py-3 flex items-center gap-2 text-green-700 dark:text-green-400">
            <CheckCircle className="h-5 w-5" />
            <span>Du har signert personalhåndboken (versjon {handbook.version})</span>
          </div>
        )}
        
        {/* Main content */}
        {isAdminOrManager ? (
          <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col">
            <div className="border-b px-6">
              <TabsList className="h-12">
                <TabsTrigger value="read" className="gap-2">
                  <Eye className="h-4 w-4" />
                  Les
                </TabsTrigger>
                <TabsTrigger value="edit" className="gap-2">
                  <Pencil className="h-4 w-4" />
                  Rediger
                </TabsTrigger>
                <TabsTrigger value="signatures" className="gap-2">
                  <Users className="h-4 w-4" />
                  Signeringsstatus
                </TabsTrigger>
              </TabsList>
            </div>
            
            <TabsContent value="read" className="flex-1 m-0 flex">
              <div className="w-72 border-r">
                <div className="p-4 border-b">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Søk i håndboken..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-9"
                    />
                  </div>
                </div>
                {searchQuery ? (
                  <div className="p-4 space-y-2">
                    <p className="text-sm text-muted-foreground mb-2">
                      {searchResults.length} treff
                    </p>
                    {searchResults.map(({ section, chapterTitle }) => (
                      <button
                        key={section.id}
                        onClick={() => {
                          setSelectedSection(section);
                          setSearchQuery("");
                        }}
                        className="w-full text-left p-2 rounded-md hover:bg-accent text-sm"
                      >
                        <p className="font-medium">{section.title}</p>
                        <p className="text-xs text-muted-foreground">{chapterTitle}</p>
                      </button>
                    ))}
                  </div>
                ) : (
                  <HandbookTableOfContents
                    chapters={chapters}
                    selectedSectionId={selectedSection?.id}
                    onSelectSection={setSelectedSection}
                    acknowledgedSections={acknowledgedSections}
                  />
                )}
              </div>
              <div className="flex-1">
                {selectedSection ? (
                  <HandbookSectionView
                    section={selectedSection as any}
                    isAcknowledged={acknowledgedSections.has(selectedSection.id)}
                    requiresAcknowledgment={selectedSection.requires_acknowledgment}
                  />
                ) : (
                  <div className="flex items-center justify-center h-full text-muted-foreground">
                    Velg en seksjon fra menyen
                  </div>
                )}
              </div>
            </TabsContent>
            
            <TabsContent value="edit" className="flex-1 m-0">
              <HandbookEditor
                handbookId={handbook.id}
                chapters={chapters}
                selectedSection={selectedSection}
                onSelectSection={setSelectedSection}
              />
            </TabsContent>
            
            <TabsContent value="signatures" className="flex-1 m-0 p-6 overflow-auto">
              <AcknowledgmentStatusList handbookId={handbook.id} version={handbook.version} />
            </TabsContent>
          </Tabs>
        ) : (
          // Employee view
          <div className="flex-1 flex">
            <div className="w-72 border-r">
              <div className="p-4 border-b">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Søk i håndboken..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9"
                  />
                </div>
              </div>
              {searchQuery ? (
                <div className="p-4 space-y-2">
                  <p className="text-sm text-muted-foreground mb-2">
                    {searchResults.length} treff
                  </p>
                  {searchResults.map(({ section, chapterTitle }) => (
                    <button
                      key={section.id}
                      onClick={() => {
                        setSelectedSection(section);
                        setSearchQuery("");
                      }}
                      className="w-full text-left p-2 rounded-md hover:bg-accent text-sm"
                    >
                      <p className="font-medium">{section.title}</p>
                      <p className="text-xs text-muted-foreground">{chapterTitle}</p>
                    </button>
                  ))}
                </div>
              ) : (
                <HandbookTableOfContents
                  chapters={chapters}
                  selectedSectionId={selectedSection?.id}
                  onSelectSection={setSelectedSection}
                  acknowledgedSections={acknowledgedSections}
                />
              )}
            </div>
            <div className="flex-1">
              {selectedSection ? (
                <HandbookSectionView
                  section={selectedSection as any}
                  isAcknowledged={acknowledgedSections.has(selectedSection.id)}
                  requiresAcknowledgment={selectedSection.requires_acknowledgment}
                />
              ) : (
                <div className="flex items-center justify-center h-full text-muted-foreground">
                  Velg en seksjon fra menyen
                </div>
              )}
            </div>
          </div>
        )}
      </div>
      
      {/* Acknowledgment modal */}
      <AcknowledgmentModal
        open={showAckModal}
        onOpenChange={setShowAckModal}
        handbookId={handbook.id}
        version={handbook.version}
        effectiveDate={handbook.effective_date}
        chapters={chapters}
      />
      
      {/* Publish modal */}
      <Dialog open={showPublishModal} onOpenChange={setShowPublishModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Publiser ny versjon</DialogTitle>
            <DialogDescription>
              Nåværende versjon: {handbook.version}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Ny versjon</label>
              <Input
                value={newVersion}
                onChange={(e) => setNewVersion(e.target.value)}
                placeholder="F.eks. 2.0"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Sammendrag av endringer (valgfritt)</label>
              <Input
                value={changesSummary}
                onChange={(e) => setChangesSummary(e.target.value)}
                placeholder="F.eks. Oppdaterte ferierutiner"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowPublishModal(false)}>
              Avbryt
            </Button>
            <Button
              onClick={handlePublish}
              disabled={!newVersion || publishHandbook.isPending}
            >
              {publishHandbook.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Publiser
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </MainLayout>
  );
}
