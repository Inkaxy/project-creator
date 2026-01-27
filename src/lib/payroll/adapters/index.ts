import type { PayrollSystemType, PayrollExportAdapter } from "@/types/payroll";
import { TripletexAdapter } from "./tripletex-adapter";
import { PowerOfficeAdapter } from "./poweroffice-adapter";

const adapters: Map<PayrollSystemType, PayrollExportAdapter> = new Map();

export function getPayrollAdapter(
  systemType: PayrollSystemType
): PayrollExportAdapter {
  if (!adapters.has(systemType)) {
    switch (systemType) {
      case "tripletex":
        adapters.set(systemType, new TripletexAdapter());
        break;
      case "poweroffice":
        adapters.set(systemType, new PowerOfficeAdapter());
        break;
      default:
        throw new Error(`No adapter available for system: ${systemType}`);
    }
  }

  return adapters.get(systemType)!;
}

export function getAvailableSystems(): PayrollSystemType[] {
  return ["tripletex", "poweroffice"];
}

export function isSystemSupported(systemType: PayrollSystemType): boolean {
  return ["tripletex", "poweroffice"].includes(systemType);
}

export { TripletexAdapter } from "./tripletex-adapter";
export { PowerOfficeAdapter } from "./poweroffice-adapter";
export { BasePayrollAdapter } from "./base-adapter";
