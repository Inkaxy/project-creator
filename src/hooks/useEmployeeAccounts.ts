import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

export interface EmployeeAccount {
  id: string;
  employee_id: string;
  account_type: "vacation" | "time_bank" | "night_bank";
  year: number;
  balance: number;
  used: number;
  carried_over: number;
}

export interface AccountTransaction {
  id: string;
  account_id: string;
  amount: number;
  description: string | null;
  reference_type: "absence" | "overtime" | "adjustment" | "carryover" | null;
  reference_id: string | null;
  created_by: string | null;
  created_at: string;
}

export const useEmployeeAccounts = (employeeId?: string, year?: number) => {
  const { user } = useAuth();
  const targetEmployeeId = employeeId || user?.id;
  const targetYear = year || new Date().getFullYear();

  return useQuery({
    queryKey: ["employee-accounts", targetEmployeeId, targetYear],
    queryFn: async () => {
      if (!targetEmployeeId) return [];

      const { data, error } = await supabase
        .from("employee_accounts")
        .select("*")
        .eq("employee_id", targetEmployeeId)
        .eq("year", targetYear);

      if (error) throw error;
      return data as EmployeeAccount[];
    },
    enabled: !!targetEmployeeId,
  });
};

export const useAccountTransactions = (accountId: string) => {
  return useQuery({
    queryKey: ["account-transactions", accountId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("account_transactions")
        .select("*")
        .eq("account_id", accountId)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as AccountTransaction[];
    },
    enabled: !!accountId,
  });
};

export const useCreateEmployeeAccount = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: Omit<EmployeeAccount, "id">) => {
      const { data, error } = await supabase
        .from("employee_accounts")
        .insert(input)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["employee-accounts"] });
      toast.success("Konto opprettet");
    },
    onError: (error) => {
      toast.error("Kunne ikke opprette konto: " + error.message);
    },
  });
};

export const useUpdateEmployeeAccount = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<EmployeeAccount> & { id: string }) => {
      const { data, error } = await supabase
        .from("employee_accounts")
        .update(updates)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["employee-accounts"] });
      toast.success("Konto oppdatert");
    },
    onError: (error) => {
      toast.error("Kunne ikke oppdatere konto: " + error.message);
    },
  });
};

export const useCreateAccountTransaction = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (input: Omit<AccountTransaction, "id" | "created_at" | "created_by">) => {
      const { data, error } = await supabase
        .from("account_transactions")
        .insert({
          ...input,
          created_by: user?.id,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["account-transactions"] });
      queryClient.invalidateQueries({ queryKey: ["employee-accounts"] });
      toast.success("Transaksjon registrert");
    },
    onError: (error) => {
      toast.error("Kunne ikke registrere transaksjon: " + error.message);
    },
  });
};

// Utility function to get remaining balance
export const getAvailableBalance = (account: EmployeeAccount | undefined): number => {
  if (!account) return 0;
  return account.balance + account.carried_over - account.used;
};

// Account type labels
export const accountTypeLabels: Record<EmployeeAccount["account_type"], string> = {
  vacation: "Feriedager",
  time_bank: "Tidsbank",
  night_bank: "Nattkonto",
};
