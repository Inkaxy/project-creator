import { useState } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Users, Calendar, FileText } from "lucide-react";
import { AMUMembersPanel } from "@/components/amu/AMUMembersPanel";
import { AMUMeetingsPanel } from "@/components/amu/AMUMeetingsPanel";

export default function AMUPage() {
  const [activeTab, setActiveTab] = useState("members");

  return (
    <MainLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Arbeidsmiljøutvalg (AMU)</h1>
          <p className="text-muted-foreground">
            Administrer AMU-medlemmer og møter iht. Arbeidsmiljøloven § 7-1
          </p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <TabsList className="flex flex-wrap h-auto gap-1 bg-muted p-1">
            <TabsTrigger value="members" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              <span className="hidden sm:inline">Medlemmer</span>
            </TabsTrigger>
            <TabsTrigger value="meetings" className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              <span className="hidden sm:inline">Møter</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="members" className="space-y-4">
            <AMUMembersPanel />
          </TabsContent>

          <TabsContent value="meetings" className="space-y-4">
            <AMUMeetingsPanel />
          </TabsContent>
        </Tabs>
      </div>
    </MainLayout>
  );
}
