import { AppSidebar } from "./AppSidebar";
import { CrewAIChatWidget } from "@/components/crew-ai/CrewAIChatWidget";

interface MainLayoutProps {
  children: React.ReactNode;
}

export function MainLayout({ children }: MainLayoutProps) {
  return (
    <div className="flex h-screen bg-background">
      <AppSidebar />
      <main className="flex-1 overflow-y-auto">
        <div className="container max-w-7xl py-6 lg:py-8">
          {children}
        </div>
      </main>
      <CrewAIChatWidget />
    </div>
  );
}
