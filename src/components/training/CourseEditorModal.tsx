import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Plus,
  Trash2,
  GripVertical,
  Video,
  FileText,
  Upload,
  X,
  Play,
  Save,
  BookOpen,
} from "lucide-react";
import { useFunctions } from "@/hooks/useFunctions";
import { Course, CourseModule } from "@/hooks/useCourses";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient, useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface CourseEditorModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  course?: Course | null;
  modules?: CourseModule[];
}

const CATEGORIES = [
  { value: "hms", label: "HMS" },
  { value: "ik_mat", label: "Mattrygghet" },
  { value: "brann", label: "Brannvern" },
  { value: "ledelse", label: "Ledelse" },
  { value: "onboarding", label: "Onboarding" },
  { value: "other", label: "Annet" },
];

interface ModuleFormData {
  id?: string;
  title: string;
  content_type: "video" | "text" | "embed";
  content: {
    text?: string;
    video_url?: string;
    embed_url?: string;
  };
  duration_minutes: number;
  sort_order: number;
  isNew?: boolean;
  isDeleted?: boolean;
}

export function CourseEditorModal({
  open,
  onOpenChange,
  course,
  modules = [],
}: CourseEditorModalProps) {
  const queryClient = useQueryClient();
  const { data: functions = [] } = useFunctions();
  const isEditing = !!course;

  // Course form state
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    category: "other",
    duration_minutes: 30,
    is_required: false,
    is_active: true,
    certificate_valid_months: 0,
    required_for_functions: [] as string[],
  });

  // Modules state
  const [modulesList, setModulesList] = useState<ModuleFormData[]>([]);
  const [activeModuleIndex, setActiveModuleIndex] = useState<number | null>(null);
  const [uploading, setUploading] = useState(false);

  // Reset form when course changes
  useEffect(() => {
    if (course) {
      setFormData({
        title: course.title,
        description: course.description || "",
        category: course.category || "other",
        duration_minutes: course.duration_minutes || 30,
        is_required: course.is_required || false,
        is_active: course.is_active !== false,
        certificate_valid_months: course.certificate_valid_months || 0,
        required_for_functions: course.required_for_functions || [],
      });
      setModulesList(
        modules.map((m, i) => ({
          id: m.id,
          title: m.title,
          content_type: m.content_type as "video" | "text" | "embed",
          content: (m.content as ModuleFormData["content"]) || {},
          duration_minutes: m.duration_minutes || 5,
          sort_order: m.sort_order || i,
        }))
      );
    } else {
      setFormData({
        title: "",
        description: "",
        category: "other",
        duration_minutes: 30,
        is_required: false,
        is_active: true,
        certificate_valid_months: 0,
        required_for_functions: [],
      });
      setModulesList([]);
    }
    setActiveModuleIndex(null);
  }, [course, modules]);

  const toggleFunction = (functionId: string) => {
    setFormData((prev) => ({
      ...prev,
      required_for_functions: prev.required_for_functions.includes(functionId)
        ? prev.required_for_functions.filter((id) => id !== functionId)
        : [...prev.required_for_functions, functionId],
    }));
  };

  const addModule = (type: "video" | "text") => {
    const newModule: ModuleFormData = {
      title: type === "video" ? "Ny video" : "Ny tekstseksjon",
      content_type: type,
      content: {},
      duration_minutes: type === "video" ? 10 : 5,
      sort_order: modulesList.length,
      isNew: true,
    };
    setModulesList((prev) => [...prev, newModule]);
    setActiveModuleIndex(modulesList.length);
  };

  const updateModule = (index: number, updates: Partial<ModuleFormData>) => {
    setModulesList((prev) =>
      prev.map((m, i) => (i === index ? { ...m, ...updates } : m))
    );
  };

  const deleteModule = (index: number) => {
    const module = modulesList[index];
    if (module.id) {
      // Mark existing module for deletion
      updateModule(index, { isDeleted: true });
    } else {
      // Remove new module entirely
      setModulesList((prev) => prev.filter((_, i) => i !== index));
    }
    setActiveModuleIndex(null);
  };

  const handleVideoUpload = async (
    e: React.ChangeEvent<HTMLInputElement>,
    moduleIndex: number
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate
    const validTypes = ["video/mp4", "video/webm", "video/quicktime"];
    if (!validTypes.includes(file.type)) {
      toast.error("Ugyldig filtype. Bruk MP4, WebM eller MOV.");
      return;
    }
    if (file.size > 500 * 1024 * 1024) {
      toast.error("Filen er for stor. Maks 500MB.");
      return;
    }

    setUploading(true);
    try {
      const fileExt = file.name.split(".").pop();
      const fileName = `${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;
      const filePath = `videos/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from("training-content")
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage
        .from("training-content")
        .getPublicUrl(filePath);

      updateModule(moduleIndex, {
        content: { video_url: urlData.publicUrl },
      });

      toast.success("Video lastet opp!");
    } catch (error: any) {
      toast.error("Kunne ikke laste opp video: " + error.message);
    } finally {
      setUploading(false);
    }
  };

  const saveMutation = useMutation({
    mutationFn: async () => {
      // Save course
      const courseData = {
        title: formData.title,
        description: formData.description || null,
        category: formData.category,
        duration_minutes: formData.duration_minutes,
        is_required: formData.is_required,
        is_active: formData.is_active,
        certificate_valid_months: formData.certificate_valid_months || null,
        required_for_functions:
          formData.required_for_functions.length > 0
            ? formData.required_for_functions
            : null,
      };

      let courseId = course?.id;

      if (isEditing) {
        const { error } = await supabase
          .from("courses")
          .update(courseData)
          .eq("id", courseId);
        if (error) throw error;
      } else {
        const { data, error } = await supabase
          .from("courses")
          .insert(courseData)
          .select()
          .single();
        if (error) throw error;
        courseId = data.id;
      }

      // Handle modules
      const activeModules = modulesList.filter((m) => !m.isDeleted);
      const deletedModules = modulesList.filter((m) => m.isDeleted && m.id);

      // Delete removed modules
      for (const mod of deletedModules) {
        await supabase.from("course_modules").delete().eq("id", mod.id);
      }

      // Update/create modules
      for (let i = 0; i < activeModules.length; i++) {
        const mod = activeModules[i];
        const moduleData = {
          course_id: courseId,
          title: mod.title,
          content_type: mod.content_type,
          content: mod.content,
          duration_minutes: mod.duration_minutes,
          sort_order: i,
        };

        if (mod.id) {
          await supabase
            .from("course_modules")
            .update(moduleData)
            .eq("id", mod.id);
        } else {
          await supabase.from("course_modules").insert(moduleData);
        }
      }
    },
    onSuccess: () => {
      toast.success(isEditing ? "Kurs oppdatert" : "Kurs opprettet");
      queryClient.invalidateQueries({ queryKey: ["courses"] });
      queryClient.invalidateQueries({ queryKey: ["course-modules"] });
      onOpenChange(false);
    },
    onError: (error: any) => {
      toast.error("Kunne ikke lagre kurs: " + error.message);
    },
  });

  const activeModule =
    activeModuleIndex !== null ? modulesList[activeModuleIndex] : null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl h-[85vh] flex flex-col p-0">
        <DialogHeader className="px-6 py-4 border-b">
          <DialogTitle className="flex items-center gap-2">
            <BookOpen className="h-5 w-5" />
            {isEditing ? "Rediger kurs" : "Opprett nytt kurs"}
          </DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="details" className="flex-1 flex flex-col min-h-0">
          <div className="px-6 border-b">
            <TabsList className="h-12">
              <TabsTrigger value="details">Kursdetaljer</TabsTrigger>
              <TabsTrigger value="content">
                Innhold
                {modulesList.filter((m) => !m.isDeleted).length > 0 && (
                  <Badge variant="secondary" className="ml-2">
                    {modulesList.filter((m) => !m.isDeleted).length}
                  </Badge>
                )}
              </TabsTrigger>
              <TabsTrigger value="functions">Funksjoner</TabsTrigger>
            </TabsList>
          </div>

          <ScrollArea className="flex-1">
            <TabsContent value="details" className="p-6 mt-0 space-y-6">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="title">Kursnavn *</Label>
                  <Input
                    id="title"
                    placeholder="F.eks. Grunnleggende HMS"
                    value={formData.title}
                    onChange={(e) =>
                      setFormData({ ...formData, title: e.target.value })
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="category">Kategori</Label>
                  <Select
                    value={formData.category}
                    onValueChange={(value) =>
                      setFormData({ ...formData, category: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {CATEGORIES.map((cat) => (
                        <SelectItem key={cat.value} value={cat.value}>
                          {cat.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Beskrivelse</Label>
                <Textarea
                  id="description"
                  placeholder="Beskriv kursets innhold og læringsmål..."
                  rows={4}
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                />
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="duration">Estimert varighet (minutter)</Label>
                  <Input
                    id="duration"
                    type="number"
                    min="1"
                    value={formData.duration_minutes}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        duration_minutes: parseInt(e.target.value) || 0,
                      })
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="cert_valid">
                    Sertifikat gyldig (måneder, 0 = ingen utløp)
                  </Label>
                  <Input
                    id="cert_valid"
                    type="number"
                    min="0"
                    value={formData.certificate_valid_months}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        certificate_valid_months: parseInt(e.target.value) || 0,
                      })
                    }
                  />
                </div>
              </div>

              <div className="flex items-center gap-6 pt-4 border-t">
                <div className="flex items-center gap-2">
                  <Switch
                    id="is_required"
                    checked={formData.is_required}
                    onCheckedChange={(checked) =>
                      setFormData({ ...formData, is_required: checked })
                    }
                  />
                  <Label htmlFor="is_required">Obligatorisk kurs</Label>
                </div>

                <div className="flex items-center gap-2">
                  <Switch
                    id="is_active"
                    checked={formData.is_active}
                    onCheckedChange={(checked) =>
                      setFormData({ ...formData, is_active: checked })
                    }
                  />
                  <Label htmlFor="is_active">Aktiv</Label>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="content" className="p-6 mt-0">
              <div className="flex gap-6">
                {/* Module list */}
                <div className="w-64 shrink-0 space-y-3">
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => addModule("video")}
                      className="flex-1"
                    >
                      <Video className="h-4 w-4 mr-1" />
                      Video
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => addModule("text")}
                      className="flex-1"
                    >
                      <FileText className="h-4 w-4 mr-1" />
                      Tekst
                    </Button>
                  </div>

                  <div className="space-y-2">
                    {modulesList
                      .filter((m) => !m.isDeleted)
                      .map((mod, index) => {
                        const actualIndex = modulesList.findIndex(
                          (m) => m === mod
                        );
                        return (
                          <Card
                            key={index}
                            className={cn(
                              "cursor-pointer transition-colors",
                              activeModuleIndex === actualIndex &&
                                "ring-2 ring-primary"
                            )}
                            onClick={() => setActiveModuleIndex(actualIndex)}
                          >
                            <CardContent className="p-3 flex items-center gap-2">
                              <GripVertical className="h-4 w-4 text-muted-foreground" />
                              {mod.content_type === "video" ? (
                                <Video className="h-4 w-4 text-primary" />
                              ) : (
                                <FileText className="h-4 w-4 text-primary" />
                              )}
                              <span className="text-sm truncate flex-1">
                                {mod.title}
                              </span>
                            </CardContent>
                          </Card>
                        );
                      })}

                    {modulesList.filter((m) => !m.isDeleted).length === 0 && (
                      <p className="text-sm text-muted-foreground text-center py-4">
                        Ingen moduler ennå. Legg til video eller tekst.
                      </p>
                    )}
                  </div>
                </div>

                {/* Module editor */}
                <div className="flex-1">
                  {activeModule && !activeModule.isDeleted ? (
                    <Card>
                      <CardContent className="p-4 space-y-4">
                        <div className="flex items-center justify-between">
                          <h3 className="font-medium">Rediger modul</h3>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="text-destructive hover:text-destructive"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Slett modul?</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Er du sikker på at du vil slette denne modulen?
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Avbryt</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => deleteModule(activeModuleIndex!)}
                                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                >
                                  Slett
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>

                        <div className="space-y-2">
                          <Label>Tittel</Label>
                          <Input
                            value={activeModule.title}
                            onChange={(e) =>
                              updateModule(activeModuleIndex!, {
                                title: e.target.value,
                              })
                            }
                          />
                        </div>

                        <div className="space-y-2">
                          <Label>Varighet (minutter)</Label>
                          <Input
                            type="number"
                            min="1"
                            value={activeModule.duration_minutes}
                            onChange={(e) =>
                              updateModule(activeModuleIndex!, {
                                duration_minutes: parseInt(e.target.value) || 1,
                              })
                            }
                          />
                        </div>

                        {activeModule.content_type === "video" && (
                          <div className="space-y-3">
                            <Label>Video</Label>
                            {activeModule.content.video_url ? (
                              <div className="space-y-2">
                                <video
                                  src={activeModule.content.video_url}
                                  controls
                                  className="w-full rounded-lg max-h-64"
                                />
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() =>
                                    updateModule(activeModuleIndex!, {
                                      content: {},
                                    })
                                  }
                                >
                                  <X className="h-4 w-4 mr-1" />
                                  Fjern video
                                </Button>
                              </div>
                            ) : (
                              <div className="border-2 border-dashed rounded-lg p-6 text-center">
                                <label className="cursor-pointer">
                                  <Upload className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                                  <p className="text-sm text-muted-foreground">
                                    {uploading
                                      ? "Laster opp..."
                                      : "Klikk for å laste opp video"}
                                  </p>
                                  <p className="text-xs text-muted-foreground mt-1">
                                    MP4, WebM eller MOV (maks 500MB)
                                  </p>
                                  <input
                                    type="file"
                                    className="hidden"
                                    accept="video/mp4,video/webm,video/quicktime"
                                    disabled={uploading}
                                    onChange={(e) =>
                                      handleVideoUpload(e, activeModuleIndex!)
                                    }
                                  />
                                </label>
                              </div>
                            )}

                            <div className="space-y-2">
                              <Label>Eller bruk ekstern URL (YouTube, Vimeo)</Label>
                              <Input
                                placeholder="https://www.youtube.com/embed/..."
                                value={activeModule.content.embed_url || ""}
                                onChange={(e) =>
                                  updateModule(activeModuleIndex!, {
                                    content: {
                                      ...activeModule.content,
                                      embed_url: e.target.value,
                                    },
                                  })
                                }
                              />
                            </div>
                          </div>
                        )}

                        {activeModule.content_type === "text" && (
                          <div className="space-y-2">
                            <Label>Innhold (Markdown støttes)</Label>
                            <Textarea
                              rows={12}
                              placeholder="Skriv innholdet her..."
                              value={activeModule.content.text || ""}
                              onChange={(e) =>
                                updateModule(activeModuleIndex!, {
                                  content: { text: e.target.value },
                                })
                              }
                            />
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  ) : (
                    <div className="flex items-center justify-center h-64 text-muted-foreground">
                      Velg en modul for å redigere
                    </div>
                  )}
                </div>
              </div>
            </TabsContent>

            <TabsContent value="functions" className="p-6 mt-0 space-y-4">
              <div>
                <h3 className="font-medium mb-2">Påkrevd for funksjoner</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Velg hvilke funksjoner som krever dette kurset. Ansatte med disse
                  funksjonene vil se kurset som obligatorisk.
                </p>
              </div>

              <div className="grid gap-2 md:grid-cols-2 lg:grid-cols-3">
                {functions.map((func) => {
                  const isSelected = formData.required_for_functions.includes(
                    func.id
                  );
                  return (
                    <Card
                      key={func.id}
                      className={cn(
                        "cursor-pointer transition-colors",
                        isSelected && "ring-2 ring-primary bg-primary/5"
                      )}
                      onClick={() => toggleFunction(func.id)}
                    >
                      <CardContent className="p-3 flex items-center gap-3">
                        <div
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: func.color || "#6B7280" }}
                        />
                        <span className="text-sm font-medium">{func.name}</span>
                        {isSelected && (
                          <Badge variant="secondary" className="ml-auto">
                            Valgt
                          </Badge>
                        )}
                      </CardContent>
                    </Card>
                  );
                })}
              </div>

              {functions.length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-8">
                  Ingen funksjoner definert ennå.
                </p>
              )}
            </TabsContent>
          </ScrollArea>
        </Tabs>

        <div className="flex justify-end gap-3 px-6 py-4 border-t bg-muted/30">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Avbryt
          </Button>
          <Button
            onClick={() => saveMutation.mutate()}
            disabled={!formData.title || saveMutation.isPending}
          >
            <Save className="h-4 w-4 mr-2" />
            {saveMutation.isPending ? "Lagrer..." : "Lagre kurs"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
