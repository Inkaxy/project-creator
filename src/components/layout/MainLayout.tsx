import { AppSidebar } from "./AppSidebar";

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
    </div>
  );
}
