// =============================================================================
// PAYROLL EXPORT SYSTEM TYPES
// =============================================================================

export type PayrollSystemType = 
  | 'tripletex' 
  | 'poweroffice' 
  | '24sevenoffice' 
  | 'visma' 
  | 'xledger' 
  | 'fiken' 
  | 'file_export';

export type ExportFileFormat = 'csv' | 'xlsx' | 'json' | 'xml';
export type ExportStatus = 'pending' | 'processing' | 'completed' | 'partial' | 'failed' | 'cancelled';
export type SalaryTypeCategory = 'hourly' | 'monthly' | 'supplement' | 'overtime' | 'absence' | 'bonus' | 'deduction' | 'other';
export type CalculationType = 'hours' | 'days' | 'fixed' | 'percentage' | 'manual';
export type SyncStatus = 'pending' | 'synced' | 'error' | 'manual';
export type ExportLineStatus = 'pending' | 'exported' | 'error' | 'skipped';
export type SourceType = 'time_entry' | 'shift' | 'manual' | 'calculated';

// =============================================================================
// DATABASE ENTITIES
// =============================================================================

export interface EmployeeExternalId {
  id: string;
  employee_id: string;
  system_type: PayrollSystemType;
  external_id: string;
  external_name?: string | null;
  is_active: boolean;
  synced_at?: string | null;
  sync_status?: SyncStatus | null;
  sync_error?: string | null;
  metadata?: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export interface SalaryType {
  id: string;
  code: string;
  name: string;
  description?: string | null;
  category: SalaryTypeCategory;
  calculation_type: CalculationType;
  default_rate?: number | null;
  percentage_base?: string | null;
  is_taxable: boolean;
  is_pension_basis: boolean;
  is_vacation_basis: boolean;
  a_melding_code?: string | null;
  auto_calculate: boolean;
  time_range_start?: string | null;
  time_range_end?: string | null;
  applies_to_days?: number[] | null;
  is_active: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
  // Joined data
  mappings?: SalaryTypeMapping[];
}

export interface SalaryTypeMapping {
  id: string;
  salary_type_id: string;
  system_type: PayrollSystemType;
  external_code: string;
  external_name?: string | null;
  is_active: boolean;
  metadata?: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export interface PayrollIntegration {
  id: string;
  system_type: PayrollSystemType;
  is_enabled: boolean;
  is_configured: boolean;
  api_endpoint?: string | null;
  settings: PayrollIntegrationSettings;
  last_sync_at?: string | null;
  last_sync_status?: string | null;
  last_sync_error?: string | null;
  created_at: string;
  updated_at: string;
}

export interface PayrollIntegrationSettings {
  auto_export: boolean;
  export_approved_only: boolean;
  include_supplements: boolean;
  include_overtime: boolean;
  default_salary_type?: string | null;
  department_mapping: Record<string, string>;
  project_mapping: Record<string, string>;
}

export interface PayrollExport {
  id: string;
  target_system: PayrollSystemType;
  export_type: 'api' | 'file';
  file_format?: ExportFileFormat | null;
  period_start: string;
  period_end: string;
  status: ExportStatus;
  employee_count: number;
  transaction_count: number;
  total_amount: number;
  export_file_url?: string | null;
  api_response?: Record<string, unknown> | null;
  error_message?: string | null;
  errors: Array<{ employee_id?: string; message: string; code?: string }>;
  warnings: Array<{ employee_id?: string; message: string }>;
  exported_by?: string | null;
  exported_at?: string | null;
  created_at: string;
  updated_at: string;
  // Joined data
  lines?: PayrollExportLine[];
  profiles?: { full_name: string } | null;
}

export interface PayrollExportLine {
  id: string;
  export_id: string;
  employee_id: string;
  external_employee_id?: string | null;
  salary_type_id?: string | null;
  external_salary_code: string;
  salary_type_name?: string | null;
  quantity: number;
  rate?: number | null;
  amount: number;
  work_date?: string | null;
  period_start?: string | null;
  period_end?: string | null;
  source_type?: SourceType | null;
  source_id?: string | null;
  department_code?: string | null;
  project_code?: string | null;
  status: ExportLineStatus;
  error_message?: string | null;
  created_at: string;
  // Joined data
  profiles?: { full_name: string } | null;
  salary_types?: { name: string; code: string } | null;
}

// =============================================================================
// DATA TRANSFER OBJECTS (DTOs)
// =============================================================================

/**
 * Internal payroll line representation before transformation
 */
export interface PayrollLineDTO {
  employeeId: string;
  employeeName: string;
  externalEmployeeId?: string;
  
  salaryTypeCode: string;
  salaryTypeName: string;
  salaryTypeId?: string;
  
  quantity: number;
  rate?: number;
  amount: number;
  
  workDate?: string;
  periodStart: string;
  periodEnd: string;
  
  department?: string;
  project?: string;
  
  sourceType: SourceType;
  sourceId?: string;
  
  metadata?: Record<string, unknown>;
}

/**
 * Aggregated payroll data per employee
 */
export interface EmployeePayrollSummary {
  employeeId: string;
  employeeName: string;
  externalEmployeeId?: string;
  hasExternalId: boolean;
  
  periodStart: string;
  periodEnd: string;
  
  totalHours: number;
  totalAmount: number;
  
  lines: PayrollLineDTO[];
  
  byCategory: {
    hourly: number;
    supplements: number;
    overtime: number;
    absence: number;
    other: number;
  };
}

// =============================================================================
// SYSTEM-SPECIFIC FORMATS
// =============================================================================

/**
 * Tripletex payroll import format
 */
export interface TripletexPayrollLine {
  ansattnummer: string;
  lønnsartNummer: string;
  lønnsartNavn?: string;
  antall: number;
  sats?: number;
  beløp: number;
  fraDato: string;
  tilDato: string;
  prosjektNummer?: string;
  avdelingNummer?: string;
  kommentar?: string;
}

/**
 * PowerOffice Go payroll format
 */
export interface PowerOfficePayrollLine {
  employeeCode: string;
  salaryCode: string;
  hours?: number;
  amount: number;
  periodFrom: string;
  periodTo: string;
  departmentCode?: string;
  projectCode?: string;
  description?: string;
}

/**
 * Generic export format (for file export)
 */
export interface GenericPayrollExport {
  exportDate: string;
  periodStart: string;
  periodEnd: string;
  systemInfo: {
    name: string;
    version: string;
  };
  totals: {
    employeeCount: number;
    lineCount: number;
    totalAmount: number;
  };
  lines: PayrollLineDTO[];
}

// =============================================================================
// ADAPTER INTERFACE
// =============================================================================

/**
 * Interface for all payroll system adapters
 */
export interface PayrollExportAdapter {
  readonly systemType: PayrollSystemType;
  readonly supportsApi: boolean;
  readonly supportsFileExport: boolean;
  readonly supportedFormats: ExportFileFormat[];
  
  /**
   * Validates that all employees have external IDs
   */
  validateEmployeeIds(employeeIds: string[]): Promise<{
    valid: string[];
    missing: string[];
  }>;
  
  /**
   * Transforms internal payroll lines to system-specific format
   */
  transform(lines: PayrollLineDTO[]): Promise<unknown[]>;
  
  /**
   * Exports to file
   */
  exportToFile(
    lines: PayrollLineDTO[], 
    format: ExportFileFormat
  ): Promise<{ content: string; filename: string; mimeType: string }>;
  
  /**
   * Exports via API (if supported)
   */
  exportToApi?(
    lines: PayrollLineDTO[]
  ): Promise<{ success: boolean; response?: unknown; errors?: string[] }>;
}

// =============================================================================
// UI HELPERS
// =============================================================================

export const SALARY_CATEGORIES: Array<{
  value: SalaryTypeCategory;
  label: string;
  color: string;
}> = [
  { value: 'hourly', label: 'Timelønn', color: 'bg-blue-100 text-blue-800' },
  { value: 'monthly', label: 'Månedslønn', color: 'bg-purple-100 text-purple-800' },
  { value: 'supplement', label: 'Tillegg', color: 'bg-green-100 text-green-800' },
  { value: 'overtime', label: 'Overtid', color: 'bg-orange-100 text-orange-800' },
  { value: 'absence', label: 'Fravær', color: 'bg-yellow-100 text-yellow-800' },
  { value: 'bonus', label: 'Bonus', color: 'bg-pink-100 text-pink-800' },
  { value: 'deduction', label: 'Trekk', color: 'bg-red-100 text-red-800' },
  { value: 'other', label: 'Annet', color: 'bg-gray-100 text-gray-800' },
];

export const PAYROLL_SYSTEMS: Array<{
  value: PayrollSystemType;
  label: string;
  logo?: string;
}> = [
  { value: 'tripletex', label: 'Tripletex' },
  { value: 'poweroffice', label: 'PowerOffice Go' },
  { value: '24sevenoffice', label: '24SevenOffice' },
  { value: 'visma', label: 'Visma eAccounting' },
  { value: 'xledger', label: 'Xledger' },
  { value: 'fiken', label: 'Fiken' },
  { value: 'file_export', label: 'Fil-eksport' },
];

export function getSystemDisplayName(system: PayrollSystemType): string {
  return PAYROLL_SYSTEMS.find(s => s.value === system)?.label || system;
}

export function getCategoryInfo(category: SalaryTypeCategory) {
  return SALARY_CATEGORIES.find(c => c.value === category) || SALARY_CATEGORIES[7];
}
