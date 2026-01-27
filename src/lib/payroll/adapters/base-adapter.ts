import { supabase } from "@/integrations/supabase/client";
import type {
  PayrollExportAdapter,
  PayrollSystemType,
  PayrollLineDTO,
  ExportFileFormat,
} from "@/types/payroll";

export abstract class BasePayrollAdapter implements PayrollExportAdapter {
  abstract readonly systemType: PayrollSystemType;
  abstract readonly supportsApi: boolean;
  abstract readonly supportsFileExport: boolean;
  abstract readonly supportedFormats: ExportFileFormat[];

  async validateEmployeeIds(employeeIds: string[]): Promise<{
    valid: string[];
    missing: string[];
  }> {
    if (employeeIds.length === 0) {
      return { valid: [], missing: [] };
    }

    const { data } = await supabase
      .from("employee_external_ids")
      .select("employee_id, external_id")
      .eq("system_type", this.systemType)
      .eq("is_active", true)
      .in("employee_id", employeeIds);

    const mappedIds = new Set((data || []).map((d) => d.employee_id));
    
    return {
      valid: employeeIds.filter((id) => mappedIds.has(id)),
      missing: employeeIds.filter((id) => !mappedIds.has(id)),
    };
  }

  async getExternalEmployeeId(employeeId: string): Promise<string | null> {
    const { data } = await supabase
      .from("employee_external_ids")
      .select("external_id")
      .eq("employee_id", employeeId)
      .eq("system_type", this.systemType)
      .eq("is_active", true)
      .maybeSingle();
    
    return data?.external_id || null;
  }

  async getExternalEmployeeIdMap(employeeIds: string[]): Promise<Map<string, string>> {
    if (employeeIds.length === 0) return new Map();

    const { data } = await supabase
      .from("employee_external_ids")
      .select("employee_id, external_id")
      .eq("system_type", this.systemType)
      .eq("is_active", true)
      .in("employee_id", employeeIds);

    return new Map((data || []).map(d => [d.employee_id, d.external_id]));
  }

  async getExternalSalaryCode(internalCode: string): Promise<string> {
    const { data } = await supabase
      .from("salary_types")
      .select(`
        code,
        salary_type_mappings!inner (external_code)
      `)
      .eq("code", internalCode)
      .eq("salary_type_mappings.system_type", this.systemType)
      .maybeSingle();

    return (data?.salary_type_mappings as any)?.[0]?.external_code || internalCode;
  }

  async getSalaryCodeMap(): Promise<Map<string, string>> {
    const { data } = await supabase
      .from("salary_types")
      .select(`
        code,
        salary_type_mappings (external_code, system_type)
      `)
      .eq("is_active", true);

    const map = new Map<string, string>();
    (data || []).forEach(st => {
      const mapping = (st.salary_type_mappings as any[])?.find(
        m => m.system_type === this.systemType
      );
      map.set(st.code, mapping?.external_code || st.code);
    });

    return map;
  }

  protected escapeCSV(value: string | number | undefined | null): string {
    if (value === null || value === undefined) return '';
    const str = String(value);
    if (str.includes(';') || str.includes('"') || str.includes('\n')) {
      return `"${str.replace(/"/g, '""')}"`;
    }
    return str;
  }

  abstract transform(lines: PayrollLineDTO[]): Promise<unknown[]>;
  
  abstract exportToFile(
    lines: PayrollLineDTO[],
    format: ExportFileFormat
  ): Promise<{ content: string; filename: string; mimeType: string }>;
}
