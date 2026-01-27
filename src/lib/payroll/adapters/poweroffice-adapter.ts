import { BasePayrollAdapter } from "./base-adapter";
import type {
  PayrollLineDTO,
  ExportFileFormat,
  PowerOfficePayrollLine,
} from "@/types/payroll";

export class PowerOfficeAdapter extends BasePayrollAdapter {
  readonly systemType = "poweroffice" as const;
  readonly supportsApi = true;
  readonly supportsFileExport = true;
  readonly supportedFormats: ExportFileFormat[] = ["csv", "json"];

  async transform(lines: PayrollLineDTO[]): Promise<PowerOfficePayrollLine[]> {
    const result: PowerOfficePayrollLine[] = [];

    // Get all external IDs in one batch
    const employeeIds = [...new Set(lines.map(l => l.employeeId))];
    const employeeIdMap = await this.getExternalEmployeeIdMap(employeeIds);
    const salaryCodeMap = await this.getSalaryCodeMap();

    for (const line of lines) {
      const externalEmployeeId = employeeIdMap.get(line.employeeId);
      if (!externalEmployeeId) continue;

      const externalCode = salaryCodeMap.get(line.salaryTypeCode) || line.salaryTypeCode;

      result.push({
        employeeCode: externalEmployeeId,
        salaryCode: externalCode,
        hours: line.quantity,
        amount: line.amount,
        periodFrom: line.periodStart,
        periodTo: line.periodEnd,
        departmentCode: line.department,
        projectCode: line.project,
        description: line.salaryTypeName,
      });
    }

    return result;
  }

  async exportToFile(
    lines: PayrollLineDTO[],
    format: ExportFileFormat
  ): Promise<{ content: string; filename: string; mimeType: string }> {
    const transformed = await this.transform(lines);
    const timestamp = new Date().toISOString().split("T")[0];

    if (format === "json") {
      return {
        content: JSON.stringify(transformed, null, 2),
        filename: `poweroffice_lonn_${timestamp}.json`,
        mimeType: "application/json",
      };
    }

    if (format === "csv") {
      const headers = [
        "Ansattkode",
        "Lønnskode",
        "Timer",
        "Beløp",
        "Fra",
        "Til",
        "Avdeling",
        "Prosjekt",
        "Beskrivelse",
      ];

      const rows = transformed.map((t) => [
        this.escapeCSV(t.employeeCode),
        this.escapeCSV(t.salaryCode),
        this.escapeCSV(t.hours),
        this.escapeCSV(t.amount),
        this.escapeCSV(t.periodFrom),
        this.escapeCSV(t.periodTo),
        this.escapeCSV(t.departmentCode),
        this.escapeCSV(t.projectCode),
        this.escapeCSV(t.description),
      ]);

      const csv = [headers.join(";"), ...rows.map((row) => row.join(";"))].join("\n");

      return {
        content: csv,
        filename: `poweroffice_lonn_${timestamp}.csv`,
        mimeType: "text/csv;charset=utf-8",
      };
    }

    throw new Error(`Unsupported format: ${format}`);
  }
}
