import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { HelpCircle, Plus, Pencil, Trash2, Users, Eye, GraduationCap, FolderOpen, Clock, Grid3X3 } from "lucide-react";
import { useAllFunctions, FunctionData } from "@/hooks/useFunctions";
import { useCourses, Course } from "@/hooks/useCourses";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

interface ShiftSetupOverviewProps {
  onOpenFunctionsModal: () => void;
  onOpenCompetenceMatrix: () => void;
  onOpenCourseEditor: (course?: Course) => void;
}

export function ShiftSetupOverview({
  onOpenFunctionsModal,
  onOpenCompetenceMatrix,
  onOpenCourseEditor,
}: ShiftSetupOverviewProps) {
  const { data: functions = [], isLoading: functionsLoading } = useAllFunctions();
  const { data: courses = [], isLoading: coursesLoading } = useCourses();
  
  const [selectedFunction, setSelectedFunction] = useState<string | null>(null);

  // Get active functions
  const activeFunctions = functions.filter(f => f.is_active);

  // Get courses linked to selected function
  const getLinkedCourses = (functionId: string) => {
    return courses.filter(course => 
      course.required_for_functions?.includes(functionId)
    );
  };

  // Count courses linked to function
  const getCourseCount = (functionId: string) => {
    return courses.filter(c => c.required_for_functions?.includes(functionId)).length;
  };

  // Get system e-learning courses (required courses)
  const systemCourses = courses.filter(c => c.is_required);
  const optionalCourses = courses.filter(c => !c.is_required);

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-muted-foreground">
            Klikk på et element for å se forbindelser. Koble funksjoner til kompetansekrav.
          </p>
        </div>
        <Button variant="outline" onClick={onOpenCompetenceMatrix}>
          <Grid3X3 className="h-4 w-4 mr-2" />
          Vis kompetansematrise
        </Button>
      </div>

      {/* 3-Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Column 1: Shift Categories / Functions */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FolderOpen className="h-5 w-5 text-muted-foreground" />
                <CardTitle className="text-base">Funksjoner</CardTitle>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger>
                      <HelpCircle className="h-4 w-4 text-muted-foreground" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Arbeidsroller/stillinger med standardtider</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
              <Button variant="ghost" size="icon" onClick={onOpenFunctionsModal}>
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            <CardDescription className="text-xs">
              Funksjoner med påkrevde kurs
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-0">
            <ScrollArea className="h-[400px] pr-4">
              {functionsLoading ? (
                <div className="space-y-2">
                  {[1, 2, 3].map(i => (
                    <Skeleton key={i} className="h-12 w-full" />
                  ))}
                </div>
              ) : activeFunctions.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Users className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">Ingen funksjoner ennå</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {activeFunctions.map(func => {
                    const courseCount = getCourseCount(func.id);
                    const isSelected = selectedFunction === func.id;
                    
                    return (
                      <div
                        key={func.id}
                        className={cn(
                          "flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all",
                          isSelected 
                            ? "border-primary bg-primary/5 ring-1 ring-primary" 
                            : "hover:bg-muted/50"
                        )}
                        onClick={() => setSelectedFunction(isSelected ? null : func.id)}
                      >
                        <div
                          className="h-3 w-3 rounded-full flex-shrink-0"
                          style={{ backgroundColor: func.color || "#3B82F6" }}
                        />
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm truncate">{func.name}</p>
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <Clock className="h-3 w-3" />
                            <span>
                              {func.default_start?.slice(0, 5) || "07:00"} - {func.default_end?.slice(0, 5) || "15:00"}
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant="secondary" className="text-xs">
                            <Users className="h-3 w-3 mr-1" />
                            {func.min_staff || 0}
                          </Badge>
                          <Badge 
                            variant={courseCount > 0 ? "default" : "outline"} 
                            className="text-xs"
                          >
                            <GraduationCap className="h-3 w-3 mr-1" />
                            {courseCount}
                          </Badge>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-6 w-6"
                            onClick={(e) => {
                              e.stopPropagation();
                              onOpenFunctionsModal();
                            }}
                          >
                            <Pencil className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </ScrollArea>
          </CardContent>
        </Card>

        {/* Column 2: Roles / Selected Function Details */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Users className="h-5 w-5 text-muted-foreground" />
                <CardTitle className="text-base">Roller</CardTitle>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger>
                      <HelpCircle className="h-4 w-4 text-muted-foreground" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Stillingstyper med påkrevde kurs</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
            </div>
            <CardDescription className="text-xs">
              Stillingstyper med påkrevde kurs
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-0">
            <ScrollArea className="h-[400px] pr-4">
              {selectedFunction ? (
                <div className="space-y-4">
                  {/* Selected function info */}
                  {(() => {
                    const func = functions.find(f => f.id === selectedFunction);
                    if (!func) return null;
                    
                    const linkedCourses = getLinkedCourses(func.id);
                    
                    return (
                      <>
                        <div className="p-3 rounded-lg bg-muted/50 border">
                          <div className="flex items-center gap-2 mb-2">
                            <div
                              className="h-4 w-4 rounded-full"
                              style={{ backgroundColor: func.color || "#3B82F6" }}
                            />
                            <span className="font-medium">{func.name}</span>
                          </div>
                          <p className="text-xs text-muted-foreground">
                            Standard: {func.default_start?.slice(0, 5) || "07:00"} - {func.default_end?.slice(0, 5) || "15:00"}
                          </p>
                        </div>
                        
                        <Separator />
                        
                        <div>
                          <h4 className="text-sm font-medium mb-2">Påkrevde kurs ({linkedCourses.length})</h4>
                          {linkedCourses.length === 0 ? (
                            <p className="text-xs text-muted-foreground py-4 text-center">
                              Ingen kurs knyttet til denne funksjonen ennå
                            </p>
                          ) : (
                            <div className="space-y-2">
                              {linkedCourses.map(course => (
                                <div
                                  key={course.id}
                                  className="flex items-center justify-between p-2 rounded-lg border hover:bg-muted/50 transition-colors"
                                >
                                  <div className="flex items-center gap-2">
                                    <GraduationCap className="h-4 w-4 text-primary" />
                                    <span className="text-sm">{course.title}</span>
                                  </div>
                                  <Badge variant="outline" className="text-xs">
                                    {course.duration_minutes || 0} min
                                  </Badge>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </>
                    );
                  })()}
                </div>
              ) : (
                <div className="text-center py-12 text-muted-foreground">
                  <Eye className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">Velg en funksjon for å se detaljer</p>
                </div>
              )}
            </ScrollArea>
          </CardContent>
        </Card>

        {/* Column 3: Competence Requirements / Courses */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <GraduationCap className="h-5 w-5 text-muted-foreground" />
                <CardTitle className="text-base">Kompetansekrav</CardTitle>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger>
                      <HelpCircle className="h-4 w-4 text-muted-foreground" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Kurs og kvalifikasjonskrav per rolle</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
              <Button variant="ghost" size="icon" onClick={() => onOpenCourseEditor()}>
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            <CardDescription className="text-xs">
              Kurs og kvalifikasjonskrav per rolle
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-0">
            <ScrollArea className="h-[400px] pr-4">
              {coursesLoading ? (
                <div className="space-y-2">
                  {[1, 2, 3].map(i => (
                    <Skeleton key={i} className="h-16 w-full" />
                  ))}
                </div>
              ) : (
                <div className="space-y-4">
                  {/* System / Required courses */}
                  <div>
                    <h4 className="text-xs font-medium text-muted-foreground mb-2 flex items-center gap-1">
                      <GraduationCap className="h-3 w-3" />
                      OBLIGATORISKE KURS ({systemCourses.length})
                    </h4>
                    {systemCourses.length === 0 ? (
                      <p className="text-xs text-muted-foreground py-2">
                        Ingen obligatoriske kurs definert
                      </p>
                    ) : (
                      <div className="space-y-2">
                        {systemCourses.map(course => {
                          const linkedFunctions = activeFunctions.filter(f => 
                            course.required_for_functions?.includes(f.id)
                          );
                          
                          return (
                            <div
                              key={course.id}
                              className="p-3 rounded-lg border hover:bg-muted/50 transition-colors cursor-pointer"
                              onClick={() => onOpenCourseEditor(course)}
                            >
                              <div className="flex items-start justify-between">
                                <div className="flex-1 min-w-0">
                                  <p className="font-medium text-sm truncate">{course.title}</p>
                                  <div className="flex items-center gap-2 mt-1">
                                    <Badge variant="destructive" className="text-xs">
                                      Obligatorisk
                                    </Badge>
                                    {linkedFunctions.length > 0 && (
                                      <span className="text-xs text-muted-foreground">
                                        {linkedFunctions.length} funksjon{linkedFunctions.length !== 1 ? "er" : ""}
                                      </span>
                                    )}
                                  </div>
                                </div>
                                <Button 
                                  variant="ghost" 
                                  size="icon" 
                                  className="h-6 w-6"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    onOpenCourseEditor(course);
                                  }}
                                >
                                  <Pencil className="h-3 w-3" />
                                </Button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  <Separator />

                  {/* Optional / Reference courses */}
                  <div>
                    <h4 className="text-xs font-medium text-muted-foreground mb-2 flex items-center gap-1">
                      <FolderOpen className="h-3 w-3" />
                      OPPSLAGSVERK ({optionalCourses.length})
                    </h4>
                    {optionalCourses.length === 0 ? (
                      <p className="text-xs text-muted-foreground py-2">
                        Ingen oppslagsverk definert
                      </p>
                    ) : (
                      <div className="space-y-2">
                        {optionalCourses.map(course => (
                          <div
                            key={course.id}
                            className="p-3 rounded-lg border hover:bg-muted/50 transition-colors cursor-pointer"
                            onClick={() => onOpenCourseEditor(course)}
                          >
                            <div className="flex items-start justify-between">
                              <div className="flex-1 min-w-0">
                                <p className="font-medium text-sm truncate">{course.title}</p>
                                <p className="text-xs text-muted-foreground mt-1">
                                  {course.description || "Ingen beskrivelse"}
                                </p>
                              </div>
                              <Button 
                                variant="ghost" 
                                size="icon" 
                                className="h-6 w-6"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onOpenCourseEditor(course);
                                }}
                              >
                                <Pencil className="h-3 w-3" />
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </ScrollArea>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
