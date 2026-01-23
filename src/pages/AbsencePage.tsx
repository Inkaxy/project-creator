import { useState } from "react";
import { Plus, Calendar, Wallet } from "lucide-react";
import { MainLayout } from "@/components/layout/MainLayout";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AbsenceRequestModal } from "@/components/absence/AbsenceRequestModal";
import { AccountBalanceCard } from "@/components/absence/AccountBalanceCard";
import { TimeBankOverviewCard } from "@/components/timesheet/TimeBankOverviewCard";
import { TimeBankManagementPanel } from "@/components/timebank/TimeBankManagementPanel";
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
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <AccountBalanceCard />
          {isAdminOrManager() && <TimeBankOverviewCard />}
        </div>

        {/* Tabs for different views */}
        <Tabs defaultValue="mine" className="space-y-4">
          <TabsList>
            <TabsTrigger value="mine">Mine søknader</TabsTrigger>
            {isAdminOrManager() && (
              <>
                <TabsTrigger value="approvals">Til behandling</TabsTrigger>
                <TabsTrigger value="all">Alle søknader</TabsTrigger>
                <TabsTrigger value="timebank" className="flex items-center gap-1">
                  <Wallet className="h-4 w-4" />
                  Tidsbank
                </TabsTrigger>
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

              <TabsContent value="timebank">
                <TimeBankManagementPanel />
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
