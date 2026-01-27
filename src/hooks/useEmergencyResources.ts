import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import type { Json } from "@/integrations/supabase/types";

export interface EmergencyResource {
  id: string;
  emergency_plan_id: string;
  resource_type: string;
  name: string;
  description: string;
  location: string;
  contact_info: Json;
  response_time_minutes: number;
  availability: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export function useEmergencyResources(emergencyPlanId?: string) {
  return useQuery({
    queryKey: ["emergency-resources", emergencyPlanId],
    queryFn: async () => {
      let query = supabase
        .from("emergency_resources")
        .select("*")
        .eq("is_active", true)
        .order("resource_type")
        .order("name");

      if (emergencyPlanId) {
        query = query.eq("emergency_plan_id", emergencyPlanId);
      }

      const { data, error } = await query;

      if (error) throw error;
      return data as EmergencyResource[];
    },
  });
}

export function useCreateEmergencyResource() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (resource: {
      emergency_plan_id: string;
      resource_type: string;
      name: string;
      description?: string;
      location?: string;
      contact_info?: Record<string, string>;
      response_time_minutes?: number;
      availability?: string;
    }) => {
      const { data, error } = await supabase
        .from("emergency_resources")
        .insert({
          emergency_plan_id: resource.emergency_plan_id,
          resource_type: resource.resource_type,
          name: resource.name,
          description: resource.description || "",
          location: resource.location || "",
          contact_info: resource.contact_info || {},
          response_time_minutes: resource.response_time_minutes || 0,
          availability: resource.availability || "24/7",
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["emergency-resources"] });
      toast.success("Ressurs lagt til");
    },
    onError: (error) => {
      console.error("Error creating resource:", error);
      toast.error("Kunne ikke legge til ressurs");
    },
  });
}

export function useUpdateEmergencyResource() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      ...updates
    }: Partial<EmergencyResource> & { id: string }) => {
      const { data, error } = await supabase
        .from("emergency_resources")
        .update(updates)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["emergency-resources"] });
      toast.success("Ressurs oppdatert");
    },
    onError: (error) => {
      console.error("Error updating resource:", error);
      toast.error("Kunne ikke oppdatere ressurs");
    },
  });
}

export function useDeleteEmergencyResource() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("emergency_resources")
        .update({ is_active: false })
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["emergency-resources"] });
      toast.success("Ressurs fjernet");
    },
    onError: (error) => {
      console.error("Error deleting resource:", error);
      toast.error("Kunne ikke fjerne ressurs");
    },
  });
}
