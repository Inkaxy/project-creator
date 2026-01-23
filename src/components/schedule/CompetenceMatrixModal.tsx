import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Grid3X3, CheckCircle2, Circle, Save } from "lucide-react";
import { useAllFunctions } from "@/hooks/useFunctions";
import { useCourses, Course } from "@/hooks/useCourses";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface CompetenceMatrixModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CompetenceMatrixModal({ open, onOpenChange }: CompetenceMatrixModalProps) {
  const { data: functions = [], isLoading: functionsLoading } = useAllFunctions();
  const { data: courses = [], isLoading: coursesLoading } = useCourses();
  const queryClient = useQueryClient();
  
  const [pendingChanges, setPendingChanges] = useState<Record<string, string[]>>({});
  const [isSaving, setIsSaving] = useState(false);

  const activeFunctions = functions.filter(f => f.is_active);
  const requiredCourses = courses.filter(c => c.is_required);

  // Get current or pending linked functions for a course
  const getLinkedFunctions = (course: Course): string[] => {
    if (pendingChanges[course.id] !== undefined) {
      return pendingChanges[course.id];
    }
    return course.required_for_functions || [];
  };

  // Toggle function linkage
  const toggleFunctionLink = (courseId: string, functionId: string) => {
    const course = courses.find(c => c.id === courseId);
    if (!course) return;

    const currentLinks = pendingChanges[courseId] !== undefined 
      ? pendingChanges[courseId] 
      : course.required_for_functions || [];

    const newLinks = currentLinks.includes(functionId)
      ? currentLinks.filter(id => id !== functionId)
      : [...currentLinks, functionId];

    setPendingChanges(prev => ({
      ...prev,
      [courseId]: newLinks,
    }));
  };

  // Check if there are unsaved changes
  const hasChanges = Object.keys(pendingChanges).length > 0;

  // Save all changes
  const handleSave = async () => {
    if (!hasChanges) return;

    setIsSaving(true);
    try {
      for (const [courseId, functionIds] of Object.entries(pendingChanges)) {
        const { error } = await supabase
          .from("courses")
          .update({ required_for_functions: functionIds })
          .eq("id", courseId);

        if (error) throw error;
      }

      queryClient.invalidateQueries({ queryKey: ["courses"] });
      toast.success("Kompetansekrav oppdatert");
      setPendingChanges({});
    } catch (error) {
      toast.error("Kunne ikke lagre endringer");
      console.error(error);
    } finally {
      setIsSaving(false);
    }
  };

  const isLoading = functionsLoading || coursesLoading;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Grid3X3 className="h-5 w-5" />
            Kompetansematrise
          </DialogTitle>
          <DialogDescription>
            Koble obligatoriske kurs til funksjoner. Ansatte i en funksjon må fullføre de tilknyttede kursene.
          </DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className="space-y-4 py-8">
            <Skeleton className="h-8 w-full" />
            <Skeleton className="h-32 w-full" />
          </div>
        ) : requiredCourses.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <Grid3X3 className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p className="font-medium">Ingen obligatoriske kurs</p>
            <p className="text-sm mt-1">
              Opprett obligatoriske kurs først for å kunne knytte dem til funksjoner
            </p>
          </div>
        ) : activeFunctions.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <Grid3X3 className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p className="font-medium">Ingen funksjoner</p>
            <p className="text-sm mt-1">
              Opprett funksjoner først for å kunne knytte dem til kurs
            </p>
          </div>
        ) : (
          <ScrollArea className="max-h-[60vh]">
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr>
                    <th className="text-left p-2 border-b font-medium text-sm sticky left-0 bg-background">
                      Kurs
                    </th>
                    {activeFunctions.map(func => (
                      <th 
                        key={func.id} 
                        className="p-2 border-b text-center min-w-[100px]"
                      >
                        <div className="flex flex-col items-center gap-1">
                          <div
                            className="h-3 w-3 rounded-full"
                            style={{ backgroundColor: func.color || "#3B82F6" }}
                          />
                          <span className="text-xs font-medium">{func.short_name || func.name}</span>
                        </div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {requiredCourses.map(course => {
                    const linkedFunctions = getLinkedFunctions(course);
                    
                    return (
                      <tr key={course.id} className="hover:bg-muted/30">
                        <td className="p-2 border-b sticky left-0 bg-background">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium">{course.title}</span>
                            <Badge variant="secondary" className="text-xs">
                              {linkedFunctions.length} funksjoner
                            </Badge>
                          </div>
                        </td>
                        {activeFunctions.map(func => {
                          const isLinked = linkedFunctions.includes(func.id);
                          
                          return (
                            <td 
                              key={func.id} 
                              className={cn(
                                "p-2 border-b text-center cursor-pointer transition-colors",
                                isLinked && "bg-primary/5"
                              )}
                              onClick={() => toggleFunctionLink(course.id, func.id)}
                            >
                              <div className="flex justify-center">
                                <Checkbox
                                  checked={isLinked}
                                  onCheckedChange={() => toggleFunctionLink(course.id, func.id)}
                                  className="data-[state=checked]:bg-primary"
                                />
                              </div>
                            </td>
                          );
                        })}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </ScrollArea>
        )}

        {hasChanges && (
          <div className="flex items-center justify-between pt-4 border-t">
            <p className="text-sm text-muted-foreground">
              Du har ulagrede endringer
            </p>
            <div className="flex items-center gap-2">
              <Button 
                variant="outline" 
                onClick={() => setPendingChanges({})}
                disabled={isSaving}
              >
                Avbryt
              </Button>
              <Button onClick={handleSave} disabled={isSaving}>
                <Save className="h-4 w-4 mr-2" />
                {isSaving ? "Lagrer..." : "Lagre endringer"}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
