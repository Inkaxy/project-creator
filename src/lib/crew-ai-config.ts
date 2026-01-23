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
  if (pathname.startsWith("/ik-logging")) return "ik-logging";
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
  if (pathname.startsWith("/crewshare")) return "crewshare";
  if (pathname.startsWith("/sykefravær") || pathname.startsWith("/sykefravaer")) return "sickleave";
  if (pathname.startsWith("/rapporter")) return "reports";
  if (pathname.startsWith("/godkjenninger")) return "approvals";
  if (pathname.startsWith("/leverandor") || pathname.startsWith("/leverandør")) return "suppliers";
  if (pathname.startsWith("/kalender")) return "calendar";
  if (pathname.startsWith("/min-side")) return "mypage";
  if (pathname.startsWith("/disiplinaersaker") || pathname.startsWith("/disiplinærsaker")) return "disciplinary";
  if (pathname.startsWith("/kiosk")) return "kiosk";
  if (pathname === "/" || pathname.startsWith("/dashboard")) return "dashboard";
  return "general";
}

// Get readable name for module (used in context)
export function getModuleName(module: string): string {
  const names: Record<string, string> = {
    equipment: "Utstyr",
    hms: "HMS",
    "ik-logging": "IK-Logging",
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
    crewshare: "CrewShare",
    sickleave: "Sykefravær",
    reports: "Rapporter",
    approvals: "Godkjenninger",
    suppliers: "Leverandører",
    calendar: "Kalender",
    mypage: "Min Side",
    disciplinary: "Disiplinærsaker",
    kiosk: "Kiosk",
    dashboard: "Dashboard",
    general: "CrewPlan",
  };
  return names[module] || "CrewPlan";
}

// Universal actions that appear on all pages (merged with page-specific)
const universalActions: QuickAction[] = [
  { label: "Hjelp meg", prompt: "Hva kan du hjelpe meg med på denne siden?", icon: "help-circle" },
  { label: "Forklar siden", prompt: "Forklar hva denne siden brukes til og hva jeg kan gjøre her.", icon: "info" },
];

// Module-specific quick actions
const moduleQuickActions: Record<string, QuickAction[]> = {
  dashboard: [
    { label: "Dagens oversikt", prompt: "Gi meg en oppsummering av dagens viktigste oppgaver og hendelser.", icon: "layout-dashboard" },
    { label: "Kommende vakter", prompt: "Hvilke vakter har jeg denne uken?", icon: "calendar" },
    { label: "Varsler", prompt: "Har jeg noen viktige varsler eller påminnelser jeg bør følge opp?", icon: "bell" },
    { label: "Søk om fri", prompt: "Hvordan søker jeg om ferie eller permisjon?", icon: "calendar-off" },
  ],
  schedule: [
    { label: "Bytt vakt", prompt: "Hvordan bytter jeg vakt med en kollega?", icon: "arrow-right-left" },
    { label: "Ledige vakter", prompt: "Er det noen ledige vakter jeg kan ta?", icon: "calendar-plus" },
    { label: "Ukerappport", prompt: "Gi meg en oversikt over vaktplanen denne uken.", icon: "calendar-days" },
    { label: "Planleggingstips", prompt: "Hva er beste praksis for vaktplanlegging?", icon: "lightbulb" },
  ],
  timesheets: [
    { label: "Stemple inn", prompt: "Hvordan stempler jeg inn på jobb?", icon: "log-in" },
    { label: "Korrigér timer", prompt: "Hvordan korrigerer jeg feil i timene mine?", icon: "pencil" },
    { label: "Timebank", prompt: "Hva er saldoen i timebanken min?", icon: "piggy-bank" },
    { label: "Godkjenning", prompt: "Hvordan fungerer godkjenning av timer?", icon: "check-circle" },
  ],
  absence: [
    { label: "Søk fravær", prompt: "Jeg vil søke om fravær. Hvordan gjør jeg det?", icon: "calendar-off" },
    { label: "Ferie saldo", prompt: "Hvor mange feriedager har jeg igjen?", icon: "umbrella" },
    { label: "Fraværstyper", prompt: "Hvilke typer fravær kan jeg søke om?", icon: "list" },
    { label: "Status søknad", prompt: "Hvordan sjekker jeg status på fraværssøknaden min?", icon: "clock" },
  ],
  employees: [
    { label: "Legg til ansatt", prompt: "Hvordan legger jeg til en ny ansatt?", icon: "user-plus" },
    { label: "Kompetanseoversikt", prompt: "Hvordan ser jeg kompetansen til de ansatte?", icon: "graduation-cap" },
    { label: "Lønnstige", prompt: "Forklar hvordan lønnsstiger og ansiennitet fungerer.", icon: "trending-up" },
    { label: "Personalfil", prompt: "Hvor finner jeg personaldokumenter for en ansatt?", icon: "folder" },
  ],
  equipment: [
    { label: "Rapporter feil", prompt: "Hvordan rapporterer jeg en feil på utstyr?", icon: "alert-triangle" },
    { label: "Vedlikeholdsplan", prompt: "Når er neste planlagte vedlikehold for dette utstyret?", icon: "wrench" },
    { label: "Skann QR", prompt: "Hvordan bruker jeg QR-koden for å finne utstyr?", icon: "qr-code" },
    { label: "Dokumenter", prompt: "Hvor finner jeg brukermanualer og sertifikater?", icon: "file-text" },
  ],
  hms: [
    { label: "Rapporter avvik", prompt: "Hvordan melder jeg et HMS-avvik?", icon: "alert-octagon" },
    { label: "Risikovurdering", prompt: "Vis meg aktive risikovurderinger.", icon: "shield" },
    { label: "Vernerunder", prompt: "Når er neste vernerunde planlagt?", icon: "hard-hat" },
    { label: "HMS-roller", prompt: "Hvem har de ulike HMS-rollene i organisasjonen?", icon: "users" },
  ],
  "ik-logging": [
    { label: "Dagens kontroller", prompt: "Hvilke kontroller må utføres i dag?", icon: "clipboard-check" },
    { label: "Opprett kontroll", prompt: "Hvordan oppretter jeg en ny kontrollmal?", icon: "plus-circle" },
    { label: "Historikk", prompt: "Vis historikk for gjennomførte kontroller.", icon: "history" },
    { label: "Avvik fra kontroll", prompt: "Hva gjør jeg hvis jeg finner avvik under kontroll?", icon: "alert-triangle" },
  ],
  "ik-mat": [
    { label: "HACCP", prompt: "Forklar HACCP-prinsippene.", icon: "shield-check" },
    { label: "Temperaturlogg", prompt: "Hvordan registrerer jeg temperaturer?", icon: "thermometer" },
    { label: "Dokumentasjon", prompt: "Hvilke IK-mat dokumenter trenger vi?", icon: "folder" },
    { label: "Allergener", prompt: "Hvor finner jeg informasjon om allergener?", icon: "alert-circle" },
  ],
  fire: [
    { label: "Brannøvelse", prompt: "Når hadde vi sist brannøvelse og når er neste?", icon: "flame" },
    { label: "Slukkeutstyr", prompt: "Hvor er brannslukkingsapparatene plassert?", icon: "fire-extinguisher" },
    { label: "Evakuering", prompt: "Hva er evakueringsrutinen?", icon: "door-open" },
    { label: "Brannkart", prompt: "Hvor finner jeg brannkartene for bygget?", icon: "map" },
  ],
  training: [
    { label: "Mine kurs", prompt: "Hvilke kurs er jeg påmeldt eller har fullført?", icon: "graduation-cap" },
    { label: "Obligatoriske kurs", prompt: "Hvilke kurs er obligatoriske for min stilling?", icon: "alert-circle" },
    { label: "Sertifikater", prompt: "Hvor finner jeg mine sertifikater og godkjenninger?", icon: "award" },
    { label: "Start kurs", prompt: "Hvordan starter jeg et nytt opplæringskurs?", icon: "play-circle" },
  ],
  handbook: [
    { label: "Arbeidsregler", prompt: "Hva er de viktigste arbeidsreglene?", icon: "book-open" },
    { label: "Personalpolicy", prompt: "Hvor finner jeg informasjon om personalpolicy?", icon: "file-text" },
    { label: "Søk i håndboken", prompt: "Søk etter informasjon i personalhåndboken.", icon: "search" },
    { label: "Oppdateringer", prompt: "Hva er de siste endringene i håndboken?", icon: "bell" },
  ],
  routines: [
    { label: "Daglige rutiner", prompt: "Hvilke daglige rutiner gjelder for meg?", icon: "repeat" },
    { label: "Sjekklister", prompt: "Vis sjekklister jeg må fullføre.", icon: "check-square" },
    { label: "Opprett rutine", prompt: "Hvordan oppretter jeg en ny rutine?", icon: "plus" },
    { label: "Åpning/stenging", prompt: "Hva er rutinene for åpning og stenging?", icon: "door-closed" },
  ],
  deviations: [
    { label: "Meld avvik", prompt: "Jeg vil melde et avvik. Hvordan gjør jeg det?", icon: "alert-triangle" },
    { label: "Mine avvik", prompt: "Vis avvik som er tildelt meg.", icon: "user" },
    { label: "Statistikk", prompt: "Gi meg en oversikt over avviksstatistikk.", icon: "bar-chart" },
    { label: "Lukk avvik", prompt: "Hvordan lukker jeg et avvik etter utbedring?", icon: "check-circle" },
  ],
  payroll: [
    { label: "Lønnskjøring", prompt: "Hvordan kjører jeg lønnsberegning?", icon: "calculator" },
    { label: "Tillegg", prompt: "Forklar de ulike lønnstilleggene.", icon: "plus-circle" },
    { label: "Eksporter data", prompt: "Hvordan eksporterer jeg lønnsdata?", icon: "download" },
    { label: "Lønnsstige", prompt: "Hvordan fungerer lønnstigene?", icon: "trending-up" },
  ],
  crewshare: [
    { label: "Tilgjengelige vakter", prompt: "Vis tilgjengelige poolvakter jeg kan ta.", icon: "hand-helping" },
    { label: "Meld interesse", prompt: "Hvordan melder jeg interesse for en poolvakt?", icon: "hand" },
    { label: "Partnerskap", prompt: "Hvilke partnerorganisasjoner er vi koblet til?", icon: "building" },
    { label: "Mine innstillinger", prompt: "Hvordan endrer jeg poolinnstillingene mine?", icon: "settings" },
  ],
  sickleave: [
    { label: "Meld sykdom", prompt: "Hvordan melder jeg sykefravær?", icon: "thermometer" },
    { label: "Egenmelding", prompt: "Hvor mange egenmeldingsdager har jeg brukt?", icon: "file-text" },
    { label: "Dokumentasjon", prompt: "Når trenger jeg legeerklæring?", icon: "file-plus" },
    { label: "Oppfølging", prompt: "Hvordan fungerer sykefraværsoppfølging?", icon: "user-check" },
  ],
  approvals: [
    { label: "Ventende", prompt: "Vis alle ventende godkjenningsforespørsler.", icon: "clock" },
    { label: "Hurtiggodkjenn", prompt: "Hvordan hurtiggodkjenner jeg flere elementer?", icon: "check-check" },
    { label: "Historikk", prompt: "Vis godkjenningshistorikk.", icon: "history" },
    { label: "Delegér", prompt: "Kan jeg delegere godkjenninger til andre?", icon: "user-plus" },
  ],
  reports: [
    { label: "Generer rapport", prompt: "Hvordan genererer jeg en rapport?", icon: "file-bar-chart" },
    { label: "Eksporter", prompt: "Hvilke eksportformater er tilgjengelige?", icon: "download" },
    { label: "Planlagte rapporter", prompt: "Hvordan setter jeg opp automatiske rapporter?", icon: "calendar" },
    { label: "Tilpasning", prompt: "Kan jeg tilpasse rapportene?", icon: "sliders" },
  ],
  suppliers: [
    { label: "Legg til leverandør", prompt: "Hvordan registrerer jeg en ny leverandør?", icon: "plus-circle" },
    { label: "Kontaktinfo", prompt: "Hvor finner jeg kontaktinformasjon for leverandører?", icon: "phone" },
    { label: "Kontrakter", prompt: "Hvor lagres leverandørkontrakter?", icon: "file-text" },
    { label: "Evaluering", prompt: "Hvordan evaluerer vi leverandører?", icon: "star" },
  ],
  calendar: [
    { label: "Denne uken", prompt: "Hva skjer denne uken?", icon: "calendar-days" },
    { label: "Bursdager", prompt: "Er det noen bursdager denne måneden?", icon: "cake" },
    { label: "Helligdager", prompt: "Hvilke helligdager kommer?", icon: "calendar-heart" },
    { label: "Arrangementer", prompt: "Hvilke arrangementer er planlagt?", icon: "party-popper" },
  ],
  mypage: [
    { label: "Min profil", prompt: "Hvordan oppdaterer jeg profilinformasjonen min?", icon: "user" },
    { label: "Mine vakter", prompt: "Vis mine kommende vakter.", icon: "calendar" },
    { label: "Lønnsslipper", prompt: "Hvor finner jeg lønnsslippene mine?", icon: "receipt" },
    { label: "Varsler", prompt: "Hvordan endrer jeg varslingsinnstillinger?", icon: "bell" },
  ],
  disciplinary: [
    { label: "Opprett sak", prompt: "Hvordan oppretter jeg en disiplinærsak?", icon: "file-warning" },
    { label: "Prosedyre", prompt: "Hva er prosedyren for håndtering av disiplinærsaker?", icon: "list-ordered" },
    { label: "Dokumentasjon", prompt: "Hvilken dokumentasjon kreves?", icon: "file-text" },
    { label: "Oppfølging", prompt: "Hvordan følger jeg opp en eksisterende sak?", icon: "user-check" },
  ],
  settings: [
    { label: "Generelle innst.", prompt: "Forklar de generelle innstillingene.", icon: "settings" },
    { label: "Avdelinger", prompt: "Hvordan administrerer jeg avdelinger?", icon: "building" },
    { label: "Brukerroller", prompt: "Hvilke brukerroller finnes og hva kan de gjøre?", icon: "shield" },
    { label: "Integrasjoner", prompt: "Hvilke integrasjoner er tilgjengelige?", icon: "plug" },
  ],
  kiosk: [
    { label: "Kiosk-oppsett", prompt: "Hvordan setter jeg opp kiosk-stempling?", icon: "monitor" },
    { label: "PIN-kode", prompt: "Hvordan endrer ansatte PIN-koden sin?", icon: "key" },
    { label: "Feilsøking", prompt: "Kiosken fungerer ikke - hva kan jeg gjøre?", icon: "wrench" },
    { label: "Innstillinger", prompt: "Hvilke innstillinger kan jeg tilpasse for kiosken?", icon: "settings" },
  ],
  general: [
    { label: "Navigasjon", prompt: "Hvordan navigerer jeg i CrewPlan?", icon: "compass" },
    { label: "Søk om fri", prompt: "Hvordan søker jeg om ferie eller permisjon?", icon: "calendar-off" },
    { label: "Rapporter problem", prompt: "Hvordan rapporterer jeg et avvik eller problem?", icon: "alert-triangle" },
    { label: "Kontakt support", prompt: "Hvordan kontakter jeg support?", icon: "message-circle" },
  ],
};

// Get module-specific config with merged universal actions
export function getModuleConfig(module: string): ModuleConfig {
  const moduleName = getModuleName(module);
  const specificActions = moduleQuickActions[module] || moduleQuickActions.general;
  
  return {
    name: moduleName,
    description: `CrewAI - ${moduleName}`,
    quickActions: [...specificActions, ...universalActions],
  };
}

// Export for backwards compatibility
export const universalConfig: ModuleConfig = {
  name: "CrewAI",
  description: "Spør meg om hva som helst i CrewPlan",
  quickActions: [...moduleQuickActions.general, ...universalActions],
};
