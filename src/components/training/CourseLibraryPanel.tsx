import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { BookOpen, Clock, Award, ExternalLink, Play, Search } from "lucide-react";
import { Course, useEnrollInCourse, useEmployeeEnrollments } from "@/hooks/useCourses";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

interface CourseLibraryPanelProps {
  courses: Course[];
  selectedCategory?: string;
  onCategoryChange?: (category: string) => void;
}

const CATEGORIES = [
  { value: "all", label: "Alle kategorier" },
  { value: "obligatorisk", label: "Obligatorisk" },
  { value: "hms", label: "HMS" },
  { value: "mattrygghet", label: "Mattrygghet" },
  { value: "brannvern", label: "Brannvern" },
  { value: "ledelse", label: "Ledelse" },
  { value: "generell", label: "Generell" },
];

export function CourseLibraryPanel({ courses, selectedCategory = "all", onCategoryChange }: CourseLibraryPanelProps) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState(selectedCategory);
  
  const { data: myEnrollments = [] } = useEmployeeEnrollments(user?.id || null);
  const enrollMutation = useEnrollInCourse();

  const enrolledCourseIds = new Set(myEnrollments.map(e => e.course_id));

  // Use selectedCategory from parent if provided, otherwise use internal filter
  const effectiveCategory = selectedCategory !== "all" ? selectedCategory : categoryFilter;

  const filteredCourses = courses.filter(course => {
    const matchesSearch = course.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      course.description?.toLowerCase().includes(searchTerm.toLowerCase());
    // When selectedCategory is passed from parent, skip category filter (already filtered)
    if (selectedCategory !== "all") return matchesSearch;
    const matchesCategory = categoryFilter === "all" || 
      course.category === categoryFilter || 
      (categoryFilter === "obligatorisk" && course.is_required);
    return matchesSearch && matchesCategory;
  });
  
  const handleCategoryChange = (value: string) => {
    setCategoryFilter(value);
    onCategoryChange?.(value);
  };

  const handleEnroll = (courseId: string) => {
    if (!user?.id) {
      toast.error("Du må være logget inn for å melde deg på kurs");
      return;
    }
    enrollMutation.mutate({ courseId, employeeId: user.id });
  };

  const formatDuration = (minutes: number | null) => {
    if (!minutes) return "Ukjent varighet";
    if (minutes < 60) return `${minutes} min`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return mins > 0 ? `${hours}t ${mins}min` : `${hours} timer`;
  };

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-col gap-4 sm:flex-row">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Søk i kurs..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9"
          />
        </div>
        {/* Only show category filter if not controlled by parent */}
        {selectedCategory === "all" && (
          <Select value={categoryFilter} onValueChange={handleCategoryChange}>
            <SelectTrigger className="w-full sm:w-[200px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {CATEGORIES.map(cat => (
                <SelectItem key={cat.value} value={cat.value}>
                  {cat.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      </div>

      {/* Course grid */}
      {filteredCourses.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <BookOpen className="mx-auto h-12 w-12 text-muted-foreground/50" />
            <p className="mt-4 text-muted-foreground">Ingen kurs funnet</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredCourses.map(course => {
            const isEnrolled = enrolledCourseIds.has(course.id);
            
            return (
              <Card key={course.id} className="flex flex-col">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1">
                      <CardTitle className="text-base">{course.title}</CardTitle>
                      {course.category && (
                        <Badge variant="outline" className="mt-1">
                          {course.category}
                        </Badge>
                      )}
                    </div>
                    {course.is_required && (
                      <Badge variant="destructive">Påkrevd</Badge>
                    )}
                  </div>
                  <CardDescription className="line-clamp-2 mt-2">
                    {course.description || "Ingen beskrivelse"}
                  </CardDescription>
                </CardHeader>
                <CardContent className="mt-auto space-y-4">
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <Clock className="h-4 w-4" />
                      {formatDuration(course.duration_minutes)}
                    </div>
                    {course.certificate_valid_months && (
                      <div className="flex items-center gap-1">
                        <Award className="h-4 w-4" />
                        {course.certificate_valid_months} mnd
                      </div>
                    )}
                  </div>
                  
                  {course.is_external && course.external_url ? (
                    <Button className="w-full" variant="outline" asChild>
                      <a href={course.external_url} target="_blank" rel="noopener noreferrer">
                        <ExternalLink className="mr-2 h-4 w-4" />
                        Åpne eksternt kurs
                      </a>
                    </Button>
                  ) : isEnrolled ? (
                    <Button 
                      className="w-full" 
                      variant="secondary"
                      onClick={() => navigate(`/opplaering/kurs/${course.id}`)}
                    >
                      <Play className="mr-2 h-4 w-4" />
                      Fortsett kurs
                    </Button>
                  ) : (
                    <Button 
                      className="w-full"
                      onClick={() => handleEnroll(course.id)}
                      disabled={enrollMutation.isPending}
                    >
                      <BookOpen className="mr-2 h-4 w-4" />
                      Meld på
                    </Button>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
