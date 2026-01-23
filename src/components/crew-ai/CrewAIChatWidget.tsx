import { useState, useEffect } from "react";
import { useLocation, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { CrewAIChatPanel } from "./CrewAIChatPanel";
import { CrewAIIcon } from "./CrewAIIcon";
import { getModuleFromPath } from "@/lib/crew-ai-config";
import { useAuth } from "@/contexts/AuthContext";
import { cn } from "@/lib/utils";

export function CrewAIChatWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimizing, setIsMinimizing] = useState(false);
  const location = useLocation();
  const params = useParams();
  const { isAdminOrManager } = useAuth();
  
  // Only show CrewAI for managers and admins
  const canAccessCrewAI = isAdminOrManager();
  
  // Determine current module from URL
  const module = getModuleFromPath(location.pathname);
  
  // Get context ID if on a detail page (e.g., /utstyr/:id)
  const contextId = params.id;

  const handleClose = () => {
    setIsMinimizing(true);
    setTimeout(() => {
      setIsOpen(false);
      setIsMinimizing(false);
    }, 200);
  };

  // Reset chat when navigating to different modules
  useEffect(() => {
    // Could reset messages here if desired
  }, [module]);

  // Don't render anything if user doesn't have access
  if (!canAccessCrewAI) {
    return null;
  }

  return (
    <>
      {/* Floating button with custom CrewAI icon */}
      {!isOpen && (
        <Button
          onClick={() => setIsOpen(true)}
          className={cn(
            "fixed bottom-6 right-6 h-14 w-14 rounded-full shadow-lg z-50",
            "bg-gradient-to-br from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70",
            "text-primary-foreground",
            "transition-all duration-300 hover:scale-110 hover:shadow-xl",
            "flex items-center justify-center",
            "border-2 border-primary-foreground/20"
          )}
          size="icon"
          title="CrewAI - Din lederassistent"
        >
          <CrewAIIcon size={28} />
        </Button>
      )}

      {/* Chat panel */}
      {isOpen && (
        <div
          className={cn(
            "fixed bottom-6 right-6 z-50",
            "w-[400px] max-w-[calc(100vw-3rem)]",
            "transition-all duration-200",
            isMinimizing ? "opacity-0 scale-95" : "opacity-100 scale-100"
          )}
        >
          <CrewAIChatPanel
            module={module}
            contextId={contextId}
            onClose={handleClose}
          />
        </div>
      )}
    </>
  );
}
