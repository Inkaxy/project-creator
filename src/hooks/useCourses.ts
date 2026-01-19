import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface Course {
  id: string;
  title: string;
  description: string | null;
  category: string | null;
  duration_minutes: number | null;
  is_required: boolean | null;
  required_for_roles: string[] | null;
  required_for_functions: string[] | null;
  certificate_valid_months: number | null;
  external_url: string | null;
  is_external: boolean | null;
  is_active: boolean | null;
  sort_order: number | null;
  created_at: string;
  updated_at: string;
}

export interface CourseModule {
  id: string;
  course_id: string;
  title: string;
  content_type: string;
  content: Record<string, unknown> | null;
  duration_minutes: number | null;
  sort_order: number | null;
  created_at: string;
}

export interface CourseEnrollment {
  id: string;
  course_id: string;
  employee_id: string;
  started_at: string | null;
  completed_at: string | null;
  score: number | null;
  current_module_id: string | null;
  progress_percent: number | null;
  certificate_url: string | null;
  certificate_expires_at: string | null;
  created_at: string;
  updated_at: string;
  courses?: Course;
  profiles?: { id: string; full_name: string };
}

// Fetch all active courses
export function useCourses() {
  return useQuery({
    queryKey: ["courses"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("courses")
        .select("*")
        .eq("is_active", true)
        .order("sort_order", { ascending: true });

      if (error) throw error;
      return data as Course[];
    },
  });
}

// Fetch modules for a course
export function useCourseModules(courseId: string | null) {
  return useQuery({
    queryKey: ["course-modules", courseId],
    queryFn: async () => {
      if (!courseId) return [];

      const { data, error } = await supabase
        .from("course_modules")
        .select("*")
        .eq("course_id", courseId)
        .order("sort_order", { ascending: true });

      if (error) throw error;
      return data as CourseModule[];
    },
    enabled: !!courseId,
  });
}

// Fetch enrollments for an employee
export function useEmployeeEnrollments(employeeId: string | null) {
  return useQuery({
    queryKey: ["course-enrollments", employeeId],
    queryFn: async () => {
      if (!employeeId) return [];

      const { data, error } = await supabase
        .from("course_enrollments")
        .select(`
          *,
          courses (*)
        `)
        .eq("employee_id", employeeId)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as unknown as CourseEnrollment[];
    },
    enabled: !!employeeId,
  });
}

// Fetch all enrollments (admin view)
export function useAllEnrollments() {
  return useQuery({
    queryKey: ["all-course-enrollments"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("course_enrollments")
        .select(`
          *,
          courses (*),
          profiles (id, full_name)
        `)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as unknown as CourseEnrollment[];
    },
  });
}

// Enroll in a course
export function useEnrollInCourse() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      courseId,
      employeeId,
    }: {
      courseId: string;
      employeeId: string;
    }) => {
      const { data, error } = await supabase
        .from("course_enrollments")
        .insert({
          course_id: courseId,
          employee_id: employeeId,
          started_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["course-enrollments"] });
      toast.success("Påmeldt kurs");
    },
    onError: (error) => {
      toast.error("Kunne ikke melde på kurs: " + error.message);
    },
  });
}

// Update enrollment progress
export function useUpdateEnrollmentProgress() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      enrollmentId,
      progressPercent,
      currentModuleId,
    }: {
      enrollmentId: string;
      progressPercent: number;
      currentModuleId?: string;
    }) => {
      const updateData: Partial<CourseEnrollment> = {
        progress_percent: progressPercent,
      };

      if (currentModuleId) {
        updateData.current_module_id = currentModuleId;
      }

      if (progressPercent === 100) {
        updateData.completed_at = new Date().toISOString();
      }

      const { error } = await supabase
        .from("course_enrollments")
        .update(updateData)
        .eq("id", enrollmentId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["course-enrollments"] });
    },
    onError: (error) => {
      toast.error("Kunne ikke oppdatere fremgang: " + error.message);
    },
  });
}

// Complete a course
export function useCompleteCourse() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      enrollmentId,
      score,
      certificateValidMonths,
    }: {
      enrollmentId: string;
      score?: number;
      certificateValidMonths?: number;
    }) => {
      const updateData: Partial<CourseEnrollment> = {
        completed_at: new Date().toISOString(),
        progress_percent: 100,
        score,
      };

      if (certificateValidMonths) {
        const expiresAt = new Date();
        expiresAt.setMonth(expiresAt.getMonth() + certificateValidMonths);
        updateData.certificate_expires_at = expiresAt.toISOString().split("T")[0];
      }

      const { error } = await supabase
        .from("course_enrollments")
        .update(updateData)
        .eq("id", enrollmentId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["course-enrollments"] });
      toast.success("Kurs fullført!");
    },
    onError: (error) => {
      toast.error("Kunne ikke fullføre kurs: " + error.message);
    },
  });
}

// Get expiring certificates
export function useExpiringCertificates(daysAhead: number = 30) {
  return useQuery({
    queryKey: ["expiring-certificates", daysAhead],
    queryFn: async () => {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + daysAhead);
      const futureDateStr = futureDate.toISOString().split("T")[0];
      const today = new Date().toISOString().split("T")[0];

      const { data, error } = await supabase
        .from("course_enrollments")
        .select(`
          *,
          courses (*),
          profiles (id, full_name)
        `)
        .not("certificate_expires_at", "is", null)
        .gte("certificate_expires_at", today)
        .lte("certificate_expires_at", futureDateStr)
        .order("certificate_expires_at", { ascending: true });

      if (error) throw error;
      return data as unknown as CourseEnrollment[];
    },
  });
}

// Get course completion stats
export function useCourseStats() {
  return useQuery({
    queryKey: ["course-stats"],
    queryFn: async () => {
      const { data: enrollments, error } = await supabase
        .from("course_enrollments")
        .select("completed_at, progress_percent");

      if (error) throw error;

      const total = enrollments.length;
      const completed = enrollments.filter((e) => e.completed_at).length;
      const inProgress = enrollments.filter(
        (e) => !e.completed_at && (e.progress_percent || 0) > 0
      ).length;

      return {
        total,
        completed,
        inProgress,
        completionRate: total > 0 ? Math.round((completed / total) * 100) : 0,
      };
    },
  });
}

// Get required courses for employee
export function useRequiredCoursesForEmployee(employeeId: string | null) {
  return useQuery({
    queryKey: ["required-courses", employeeId],
    queryFn: async () => {
      if (!employeeId) return { required: [], missing: [] };

      // Get all required courses
      const { data: courses, error: coursesError } = await supabase
        .from("courses")
        .select("*")
        .eq("is_active", true)
        .eq("is_required", true);

      if (coursesError) throw coursesError;

      // Get employee's completed courses
      const { data: enrollments, error: enrollmentsError } = await supabase
        .from("course_enrollments")
        .select("course_id, completed_at")
        .eq("employee_id", employeeId);

      if (enrollmentsError) throw enrollmentsError;

      const completedCourseIds = new Set(
        enrollments
          .filter((e) => e.completed_at)
          .map((e) => e.course_id)
      );

      const missing = courses.filter((c) => !completedCourseIds.has(c.id));

      return {
        required: courses as Course[],
        missing: missing as Course[],
      };
    },
    enabled: !!employeeId,
  });
}
