import { useState } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { DisciplinaryCasesList } from "@/components/disciplinary/DisciplinaryCasesList";
import { DisciplinaryCaseDetailModal } from "@/components/disciplinary/DisciplinaryCaseDetailModal";
import { CreateDisciplinaryCaseModal } from "@/components/disciplinary/CreateDisciplinaryCaseModal";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import type { DisciplinaryCase } from "@/types/disciplinary";

export default function DisciplinaryCasesPage() {
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [selectedCase, setSelectedCase] = useState<DisciplinaryCase | null>(null);
  const [detailModalOpen, setDetailModalOpen] = useState(false);

  const handleSelectCase = (caseItem: DisciplinaryCase) => {
    setSelectedCase(caseItem);
    setDetailModalOpen(true);
  };

  return (
    <MainLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Disiplinærsaker</h1>
            <p className="text-muted-foreground">
              Håndter og følg opp disiplinærsaker
            </p>
          </div>
          <Button onClick={() => setCreateModalOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Ny sak
          </Button>
        </div>

        <DisciplinaryCasesList onSelectCase={handleSelectCase} />

        <CreateDisciplinaryCaseModal
          open={createModalOpen}
          onOpenChange={setCreateModalOpen}
        />

        {selectedCase && (
          <DisciplinaryCaseDetailModal
            caseItem={selectedCase}
            open={detailModalOpen}
            onOpenChange={setDetailModalOpen}
          />
        )}
      </div>
    </MainLayout>
  );
}
