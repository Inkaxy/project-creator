import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Json } from "@/integrations/supabase/types";

export type BirthdayVisibility = "all" | "managers_only";

interface Setting {
  id: string;
  key: string;
  value: Json;
  description: string | null;
  created_at: string;
  updated_at: string;
}

export function useSetting<T>(key: string, defaultValue: T) {
  return useQuery({
    queryKey: ["settings", key],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("settings")
        .select("*")
        .eq("key", key)
        .maybeSingle();

      if (error) throw error;
      return (data?.value as T) ?? defaultValue;
    },
  });
}

export function useUpdateSetting() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ key, value }: { key: string; value: Json }) => {
      const { error } = await supabase
        .from("settings")
        .update({ value })
        .eq("key", key);

      if (error) throw error;
    },
    onSuccess: (_, { key }) => {
      queryClient.invalidateQueries({ queryKey: ["settings", key] });
    },
  });
}

export function useBirthdayVisibility() {
  return useSetting<BirthdayVisibility>("calendar_birthdays_visibility", "managers_only");
}
