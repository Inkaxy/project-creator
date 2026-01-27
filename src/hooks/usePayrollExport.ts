import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { getPayrollAdapter } from "@/lib/payroll/adapters";
import type { 
  PayrollExport, 
  PayrollExportLine,
  PayrollLineDTO,
  PayrollSystemType,
  ExportFileFormat,
} from "@/types/payroll";
import { differenceInMinutes, getDay, parseISO, format } from "date-fns";

// Hook to fetch payroll exports
export function usePayrollExports(limit: number = 20) {
  return useQuery({
    queryKey: ["payroll-exports", limit],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("payroll_exports")
        .select(`
          *,
          profiles:exported_by (full_name)
        `)
        .order("created_at", { ascending: false })
        .limit(limit);

      if (error) throw error;
      return data as PayrollExport[];
    },
  });
}

// Hook to fetch export details with lines
export function usePayrollExportDetails(exportId: string) {
  return useQuery({
    queryKey: ["payroll-export-details", exportId],
    queryFn: async () => {
      const { data: exportData, error: exportError } = await supabase
        .from("payroll_exports")
        .select(`
          *,
          profiles:exported_by (full_name)
        `)
        .eq("id", exportId)
        .single();

      if (exportError) throw exportError;

      const { data: lines, error: linesError } = await supabase
        .from("payroll_export_lines")
        .select(`
          *,
          profiles:employee_id (full_name),
          salary_types:salary_type_id (name, code)
        `)
        .eq("export_id", exportId)
        .order("created_at");

      if (linesError) throw linesError;

      return {
        ...exportData,
        lines,
      } as PayrollExport;
    },
    enabled: !!exportId,
  });
}

// Hook to calculate payroll lines from approved time entries
export function useCalculatePayrollLines(periodStart: string, periodEnd: string) {
  return useQuery({
    queryKey: ["calculate-payroll-lines", periodStart, periodEnd],
    queryFn: async () => {
      // Fetch approved time entries
      const { data: timeEntries, error } = await supabase
        .from("time_entries")
        .select(`
          *,
          profiles:employee_id (id, full_name),
          shifts (
            function_id,
            department_id,
            functions (name)
          )
        `)
        .eq("status", "approved")
        .gte("date", periodStart)
        .lte("date", periodEnd);

      if (error) throw error;

      // Fetch salary types for reference
      const { data: salaryTypes } = await supabase
        .from("salary_types")
        .select("*")
        .eq("is_active", true);

      const salaryTypeMap = new Map(
        (salaryTypes || []).map(st => [st.code, st])
      );

      const lines: PayrollLineDTO[] = [];

      for (const entry of timeEntries || []) {
        if (!entry.clock_in || !entry.clock_out) continue;

        const clockIn = parseISO(`${entry.date}T${entry.clock_in}`);
        const clockOut = parseISO(`${entry.date}T${entry.clock_out}`);
        
        let totalMinutes = differenceInMinutes(clockOut, clockIn);
        if (totalMinutes < 0) totalMinutes += 24 * 60; // Handle overnight
        
        const breakMinutes = entry.break_minutes || 0;
        const netMinutes = Math.max(0, totalMinutes - breakMinutes);
        const hours = netMinutes / 60;

        const employeeId = entry.employee_id;
        const employeeName = (entry.profiles as any)?.full_name || "Ukjent";

        // Base hourly pay (1000)
        lines.push({
          employeeId,
          employeeName,
          salaryTypeCode: "1000",
          salaryTypeName: "Timelønn",
          quantity: hours,
          amount: 0,
          periodStart,
          periodEnd,
          workDate: entry.date,
          sourceType: "time_entry",
          sourceId: entry.id,
        });

        // Calculate supplements based on time of day and day of week
        const dayOfWeek = getDay(clockIn);
        const startHour = clockIn.getHours();
        const endHour = clockOut.getHours();

        // Evening supplement (17:00-21:00) - code 2010
        if (startHour >= 17 || endHour <= 21) {
          const eveningType = salaryTypeMap.get("2010");
          if (eveningType?.auto_calculate) {
            // Simplified: assume some portion is evening hours
            const eveningHours = Math.min(hours, 4);
            if (eveningHours > 0 && startHour >= 17 && startHour < 21) {
              lines.push({
                employeeId,
                employeeName,
                salaryTypeCode: "2010",
                salaryTypeName: "Kveldstillegg",
                quantity: eveningHours,
                amount: 0,
                periodStart,
                periodEnd,
                workDate: entry.date,
                sourceType: "calculated",
                sourceId: entry.id,
              });
            }
          }
        }

        // Night supplement (21:00-06:00) - code 2020
        if (startHour >= 21 || endHour <= 6 || startHour < 6) {
          const nightType = salaryTypeMap.get("2020");
          if (nightType?.auto_calculate) {
            const nightHours = Math.min(hours, 8);
            if (nightHours > 0 && (startHour >= 21 || startHour < 6)) {
              lines.push({
                employeeId,
                employeeName,
                salaryTypeCode: "2020",
                salaryTypeName: "Nattillegg",
                quantity: nightHours,
                amount: 0,
                periodStart,
                periodEnd,
                workDate: entry.date,
                sourceType: "calculated",
                sourceId: entry.id,
              });
            }
          }
        }

        // Saturday supplement - code 2030
        if (dayOfWeek === 6) {
          lines.push({
            employeeId,
            employeeName,
            salaryTypeCode: "2030",
            salaryTypeName: "Helgetillegg lørdag",
            quantity: hours,
            amount: 0,
            periodStart,
            periodEnd,
            workDate: entry.date,
            sourceType: "calculated",
            sourceId: entry.id,
          });
        }

        // Sunday supplement - code 2040
        if (dayOfWeek === 0) {
          lines.push({
            employeeId,
            employeeName,
            salaryTypeCode: "2040",
            salaryTypeName: "Helgetillegg søndag",
            quantity: hours,
            amount: 0,
            periodStart,
            periodEnd,
            workDate: entry.date,
            sourceType: "calculated",
            sourceId: entry.id,
          });
        }

        // Overtime check (over 9 hours/day) - code 3010
        if (hours > 9) {
          const overtimeHours = hours - 9;
          lines.push({
            employeeId,
            employeeName,
            salaryTypeCode: "3010",
            salaryTypeName: "Overtid 50%",
            quantity: Math.min(overtimeHours, 2),
            amount: 0,
            periodStart,
            periodEnd,
            workDate: entry.date,
            sourceType: "calculated",
            sourceId: entry.id,
          });

          if (overtimeHours > 2) {
            lines.push({
              employeeId,
              employeeName,
              salaryTypeCode: "3020",
              salaryTypeName: "Overtid 100%",
              quantity: overtimeHours - 2,
              amount: 0,
              periodStart,
              periodEnd,
              workDate: entry.date,
              sourceType: "calculated",
              sourceId: entry.id,
            });
          }
        }
      }

      return lines;
    },
    enabled: !!periodStart && !!periodEnd,
  });
}

// Hook to perform payroll export
export function usePerformPayrollExport() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({
      targetSystem,
      periodStart,
      periodEnd,
      lines,
      format = "csv",
    }: {
      targetSystem: PayrollSystemType;
      periodStart: string;
      periodEnd: string;
      lines: PayrollLineDTO[];
      format?: ExportFileFormat;
    }) => {
      const adapter = getPayrollAdapter(targetSystem);

      // Validate employee IDs
      const employeeIds = [...new Set(lines.map(l => l.employeeId))];
      const validation = await adapter.validateEmployeeIds(employeeIds);

      // Create export record
      const { data: exportRecord, error: insertError } = await supabase
        .from("payroll_exports")
        .insert({
          target_system: targetSystem,
          export_type: "file",
          file_format: format,
          period_start: periodStart,
          period_end: periodEnd,
          status: "processing",
          employee_count: validation.valid.length,
          transaction_count: lines.filter(l => validation.valid.includes(l.employeeId)).length,
          exported_by: user?.id,
        })
        .select()
        .single();

      if (insertError) throw insertError;

      try {
        // Filter valid lines
        const validLines = lines.filter(l => validation.valid.includes(l.employeeId));

        // Save export lines
        const exportLines = validLines.map(line => ({
          export_id: exportRecord.id,
          employee_id: line.employeeId,
          external_salary_code: line.salaryTypeCode,
          salary_type_name: line.salaryTypeName,
          quantity: line.quantity,
          rate: line.rate || null,
          amount: line.amount,
          work_date: line.workDate || null,
          period_start: periodStart,
          period_end: periodEnd,
          source_type: line.sourceType,
          source_id: line.sourceId || null,
          status: "pending" as const,
        }));

        if (exportLines.length > 0) {
          await supabase.from("payroll_export_lines").insert(exportLines);
        }

        // Generate file
        const { content, filename, mimeType } = await adapter.exportToFile(validLines, format);

        // Update export record
        await supabase
          .from("payroll_exports")
          .update({
            status: "completed",
            total_amount: validLines.reduce((sum, l) => sum + l.amount, 0),
            exported_at: new Date().toISOString(),
            warnings: validation.missing.length > 0
              ? validation.missing.map(id => ({
                  employee_id: id,
                  message: "Mangler ansattnummer i eksternt system",
                }))
              : [],
          })
          .eq("id", exportRecord.id);

        // Update line statuses
        await supabase
          .from("payroll_export_lines")
          .update({ status: "exported" })
          .eq("export_id", exportRecord.id);

        return {
          exportId: exportRecord.id,
          content,
          filename,
          mimeType,
          validCount: validLines.length,
          missingCount: validation.missing.length,
        };
      } catch (error) {
        await supabase
          .from("payroll_exports")
          .update({
            status: "failed",
            error_message: error instanceof Error ? error.message : "Unknown error",
          })
          .eq("id", exportRecord.id);

        throw error;
      }
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ["payroll-exports"] });
      
      // Trigger file download
      const blob = new Blob([result.content], { type: result.mimeType });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = result.filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      if (result.missingCount > 0) {
        toast.warning(
          `Eksport fullført. ${result.validCount} linjer eksportert, ${result.missingCount} ansatte mangler ansattnummer.`
        );
      } else {
        toast.success(`Eksport fullført. ${result.validCount} linjer eksportert.`);
      }
    },
    onError: (error) => {
      toast.error("Eksport feilet: " + error.message);
    },
  });
}

// Hook to get payroll integrations
export function usePayrollIntegrations() {
  return useQuery({
    queryKey: ["payroll-integrations"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("payroll_integrations")
        .select("*")
        .order("system_type");

      if (error) throw error;
      return data;
    },
  });
}

export function useUpdatePayrollIntegration() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      systemType,
      isEnabled,
      settings,
    }: {
      systemType: PayrollSystemType;
      isEnabled?: boolean;
      settings?: Record<string, unknown>;
    }) => {
      const updateData: Record<string, unknown> = {};
      if (isEnabled !== undefined) updateData.is_enabled = isEnabled;
      if (settings) updateData.settings = settings;

      const { error } = await supabase
        .from("payroll_integrations")
        .update(updateData)
        .eq("system_type", systemType);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["payroll-integrations"] });
      toast.success("Integrasjon oppdatert");
    },
    onError: (error) => {
      toast.error("Kunne ikke oppdatere: " + error.message);
    },
  });
}
