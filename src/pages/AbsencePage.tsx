import { useState } from "react";
import { Plus, Calendar } from "lucide-react";
import { MainLayout } from "@/components/layout/MainLayout";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AbsenceRequestModal } from "@/components/absence/AbsenceRequestModal";
import { AccountBalanceCard } from "@/components/absence/AccountBalanceCard";
import { AbsenceList } from "@/components/absence/AbsenceList";
import { AbsenceApprovalsPanel } from "@/components/absence/AbsenceApprovalsPanel";
import { useAuth } from "@/contexts/AuthContext";

const AbsencePage = () => {
  const { isAdminOrManager } = useAuth();
  const [requestModalOpen, setRequestModalOpen] = useState(false);

  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold">Fravær</h1>
            <p className="text-muted-foreground">
              Søk om fravær og se dine kontoer
            </p>
          </div>
          <Button onClick={() => setRequestModalOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Søk om fravær
          </Button>
        </div>

        {/* Account Balances */}
        <AccountBalanceCard />

        {/* Tabs for different views */}
        <Tabs defaultValue="mine" className="space-y-4">
          <TabsList>
            <TabsTrigger value="mine">Mine søknader</TabsTrigger>
            {isAdminOrManager() && (
              <>
                <TabsTrigger value="approvals">Til behandling</TabsTrigger>
                <TabsTrigger value="all">Alle søknader</TabsTrigger>
              </>
            )}
          </TabsList>

          <TabsContent value="mine">
            <AbsenceList />
          </TabsContent>

          {isAdminOrManager() && (
            <>
              <TabsContent value="approvals">
                <AbsenceApprovalsPanel />
              </TabsContent>

              <TabsContent value="all">
                <AbsenceList showAll />
              </TabsContent>
            </>
          )}
        </Tabs>
      </div>

      {/* Request Modal */}
      <AbsenceRequestModal
        open={requestModalOpen}
        onOpenChange={setRequestModalOpen}
      />
    </MainLayout>
  );
};

export default AbsencePage;
