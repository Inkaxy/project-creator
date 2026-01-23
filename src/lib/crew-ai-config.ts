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

// Map URL paths to module identifiers
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
  return "general";
}

// Module-specific configurations
export const moduleConfigs: Record<string, ModuleConfig> = {
  equipment: {
    name: "Utstyr",
    description: "Spør om utstyrsvedlikehold, datablader og feilsøking",
    quickActions: [
      { label: "Hvordan rengjør jeg dette?", prompt: "Hvordan rengjør og vedlikeholder jeg dette utstyret riktig?", icon: "sparkles" },
      { label: "Hva betyr feilkoden?", prompt: "Kan du forklare hva en feilkode på dette utstyret betyr og hvordan jeg løser det?", icon: "alert-circle" },
      { label: "Når er neste service?", prompt: "Når bør neste service utføres på dette utstyret, og hva bør sjekkes?", icon: "calendar" },
      { label: "Sikkerhetsinstrukser", prompt: "Hva er de viktigste sikkerhetsinstruksene for dette utstyret?", icon: "shield" },
    ],
  },
  hms: {
    name: "HMS",
    description: "Spør om helse, miljø og sikkerhet",
    quickActions: [
      { label: "Vis aktive risikoer", prompt: "Hvilke aktive risikovurderinger finnes det nå, og hva er tiltakene?", icon: "alert-triangle" },
      { label: "Ved ulykke", prompt: "Hva gjør jeg hvis det skjer en ulykke på arbeidsplassen?", icon: "first-aid" },
      { label: "Hvem er verneombud?", prompt: "Hvem er verneombud og hva er deres rolle?", icon: "user" },
      { label: "Rapportere avvik", prompt: "Hvordan rapporterer jeg et HMS-avvik?", icon: "file-warning" },
    ],
  },
  "ik-mat": {
    name: "IK-Mat",
    description: "Spør om internkontroll mat og HACCP",
    quickActions: [
      { label: "Temperaturgrenser", prompt: "Hva er de riktige temperaturgrensene for kjøleskap og fryser?", icon: "thermometer" },
      { label: "HACCP-prosedyre", prompt: "Forklar HACCP-prosedyrene vi følger.", icon: "clipboard-check" },
      { label: "Sjekkliste åpning", prompt: "Hva skal gjøres ved åpning av kjøkkenet?", icon: "list-checks" },
      { label: "Mattilsynet-krav", prompt: "Hvilke dokumentasjonskrav har Mattilsynet?", icon: "file-text" },
    ],
  },
  handbook: {
    name: "Personalhåndbok",
    description: "Spør om arbeidsregler og rettigheter",
    quickActions: [
      { label: "Ferieregler", prompt: "Forklar ferielovens regler og hvordan ferie søkes.", icon: "palmtree" },
      { label: "Sykemelding", prompt: "Hva er reglene for sykemelding og egenmelding?", icon: "heart-pulse" },
      { label: "Permisjoner", prompt: "Hvilke typer permisjoner kan jeg søke om?", icon: "calendar-off" },
      { label: "Oppsigelse", prompt: "Hva er prosessen og frister ved oppsigelse?", icon: "file-x" },
    ],
  },
  training: {
    name: "Opplæring",
    description: "Spør om kurs og sertifiseringer",
    quickActions: [
      { label: "Mine kurs", prompt: "Hvilke kurs trenger jeg å ta basert på min stilling?", icon: "graduation-cap" },
      { label: "Sertifikater", prompt: "Hvilke sertifikater har jeg og når utløper de?", icon: "badge-check" },
      { label: "Obligatoriske kurs", prompt: "Hvilke kurs er obligatoriske for alle ansatte?", icon: "book-open" },
    ],
  },
  fire: {
    name: "Brannsikkerhet",
    description: "Spør om brannvern og evakuering",
    quickActions: [
      { label: "Evakuering", prompt: "Hva er evakueringsprosedyren ved brannalarm?", icon: "door-open" },
      { label: "Brannslukkere", prompt: "Hvor finner jeg brannslukkere og hvordan brukes de?", icon: "flame" },
      { label: "Neste brannøvelse", prompt: "Når er neste brannøvelse planlagt?", icon: "siren" },
      { label: "Møteplass", prompt: "Hvor er brannsikker møteplass?", icon: "map-pin" },
    ],
  },
  routines: {
    name: "Rutiner",
    description: "Spør om daglige rutiner og prosedyrer",
    quickActions: [
      { label: "Åpningsrutiner", prompt: "Hva er rutinene ved åpning?", icon: "sunrise" },
      { label: "Stengingsrutiner", prompt: "Hva skal gjøres ved stenging?", icon: "sunset" },
      { label: "Daglige oppgaver", prompt: "Hvilke daglige oppgaver må gjennomføres?", icon: "list-todo" },
    ],
  },
  schedule: {
    name: "Vaktplan",
    description: "Spør om arbeidstid og vakter",
    quickActions: [
      { label: "Arbeidstidsregler", prompt: "Hva sier arbeidsmiljøloven om arbeidstid?", icon: "clock" },
      { label: "Overtid", prompt: "Hva er reglene for overtid og kompensasjon?", icon: "plus-circle" },
      { label: "Vaktbytte", prompt: "Hvordan bytter jeg vakt med en kollega?", icon: "repeat" },
    ],
  },
  general: {
    name: "Generelt",
    description: "Spør meg om hva som helst",
    quickActions: [
      { label: "Hjelp med CrewPlan", prompt: "Hvordan bruker jeg CrewPlan-systemet?", icon: "help-circle" },
      { label: "Kontaktinfo", prompt: "Hvem kontakter jeg for ulike spørsmål?", icon: "phone" },
    ],
  },
};

export function getModuleConfig(module: string): ModuleConfig {
  return moduleConfigs[module] || moduleConfigs.general;
}
