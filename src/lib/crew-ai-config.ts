export interface QuickAction {
  label: string;
  prompt: string;
  icon?: string;
}

export interface ModuleConfig {
  name: string;
  description: string;
  quickActions: QuickAction[];
}

// Map URL paths to module identifiers (used internally for context)
export function getModuleFromPath(pathname: string): string {
  if (pathname.startsWith("/utstyr")) return "equipment";
  if (pathname.startsWith("/hms")) return "hms";
  if (pathname.startsWith("/ik-mat")) return "ik-mat";
  if (pathname.startsWith("/personalhandbok")) return "handbook";
  if (pathname.startsWith("/opplaering")) return "training";
  if (pathname.startsWith("/brann")) return "fire";
  if (pathname.startsWith("/rutiner")) return "routines";
  if (pathname.startsWith("/vaktplan") || pathname.startsWith("/vaktoppsett")) return "schedule";
  if (pathname.startsWith("/fravaer")) return "absence";
  if (pathname.startsWith("/timelister")) return "timesheets";
  if (pathname.startsWith("/avvik")) return "deviations";
  if (pathname.startsWith("/ansatte")) return "employees";
  if (pathname.startsWith("/lonn")) return "payroll";
  if (pathname.startsWith("/innstillinger")) return "settings";
  return "general";
}

// Get readable name for module (used in context)
export function getModuleName(module: string): string {
  const names: Record<string, string> = {
    equipment: "Utstyr",
    hms: "HMS",
    "ik-mat": "IK-Mat",
    handbook: "Personalhåndbok",
    training: "Opplæring",
    fire: "Brannsikkerhet",
    routines: "Rutiner",
    schedule: "Vaktplan",
    absence: "Fravær",
    timesheets: "Timelister",
    deviations: "Avvik",
    employees: "Ansatte",
    payroll: "Lønn",
    settings: "Innstillinger",
    general: "Dashboard",
  };
  return names[module] || "CrewPlan";
}

// Universal configuration - same on all pages
export const universalConfig: ModuleConfig = {
  name: "CrewAI",
  description: "Spør meg om hva som helst i CrewPlan",
  quickActions: [
    { label: "Hjelp meg", prompt: "Hva kan du hjelpe meg med?", icon: "help-circle" },
    { label: "Forklar denne siden", prompt: "Kan du forklare hva denne siden brukes til og hva jeg kan gjøre her?", icon: "info" },
    { label: "Søk om fri", prompt: "Hvordan søker jeg om ferie eller permisjon?", icon: "calendar-off" },
    { label: "Rapporter problem", prompt: "Hvordan rapporterer jeg et avvik eller problem?", icon: "alert-triangle" },
    { label: "Finn informasjon", prompt: "Hvor finner jeg informasjon om arbeidsregler og rutiner?", icon: "search" },
    { label: "Mine oppgaver", prompt: "Hva er mine oppgaver og hva bør jeg gjøre nå?", icon: "list-checks" },
  ],
};

// Always return universal config
export function getModuleConfig(_module: string): ModuleConfig {
  return universalConfig;
}
