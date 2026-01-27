import { BasePayrollAdapter } from "./base-adapter";
import type {
  PayrollLineDTO,
  ExportFileFormat,
  TripletexPayrollLine,
} from "@/types/payroll";

export class TripletexAdapter extends BasePayrollAdapter {
  readonly systemType = "tripletex" as const;
  readonly supportsApi = true;
  readonly supportsFileExport = true;
  readonly supportedFormats: ExportFileFormat[] = ["csv", "xlsx", "json"];

  async transform(lines: PayrollLineDTO[]): Promise<TripletexPayrollLine[]> {
    const result: TripletexPayrollLine[] = [];
    
    // Get all external IDs in one batch
    const employeeIds = [...new Set(lines.map(l => l.employeeId))];
    const employeeIdMap = await this.getExternalEmployeeIdMap(employeeIds);
    const salaryCodeMap = await this.getSalaryCodeMap();

    for (const line of lines) {
      const externalEmployeeId = employeeIdMap.get(line.employeeId);
      if (!externalEmployeeId) continue;

      const externalCode = salaryCodeMap.get(line.salaryTypeCode) || line.salaryTypeCode;

      result.push({
        ansattnummer: externalEmployeeId,
        lønnsartNummer: externalCode,
        lønnsartNavn: line.salaryTypeName,
        antall: line.quantity,
        sats: line.rate,
        beløp: line.amount,
        fraDato: line.periodStart,
        tilDato: line.periodEnd,
        prosjektNummer: line.project,
        avdelingNummer: line.department,
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
    
    if (format === "csv") {
      const headers = [
        "Ansattnummer",
        "Lønnsart nummer",
        "Lønnsart navn",
        "Antall",
        "Sats",
        "Beløp",
        "Fra dato",
        "Til dato",
        "Prosjekt",
        "Avdeling",
      ];

      const rows = transformed.map((t) => [
        this.escapeCSV(t.ansattnummer),
        this.escapeCSV(t.lønnsartNummer),
        this.escapeCSV(t.lønnsartNavn),
        this.escapeCSV(t.antall),
        this.escapeCSV(t.sats),
        this.escapeCSV(t.beløp),
        this.escapeCSV(t.fraDato),
        this.escapeCSV(t.tilDato),
        this.escapeCSV(t.prosjektNummer),
        this.escapeCSV(t.avdelingNummer),
      ]);

      const csv = [headers.join(";"), ...rows.map((row) => row.join(";"))].join("\n");

      return {
        content: csv,
        filename: `tripletex_lonn_${timestamp}.csv`,
        mimeType: "text/csv;charset=utf-8",
      };
    }

    if (format === "json") {
      return {
        content: JSON.stringify(transformed, null, 2),
        filename: `tripletex_lonn_${timestamp}.json`,
        mimeType: "application/json",
      };
    }

    throw new Error(`Unsupported format: ${format}`);
  }

  async exportToApi(lines: PayrollLineDTO[]): Promise<{
    success: boolean;
    response?: unknown;
    errors?: string[];
  }> {
    // TODO: Implement Tripletex API integration
    // Requires:
    // 1. Consumer Token (from Tripletex after approval)
    // 2. Employee Token (from company's Tripletex account)
    // 3. Session Token (created via API call)
    
    throw new Error("API export not yet implemented. Use file export instead.");
  }
}
