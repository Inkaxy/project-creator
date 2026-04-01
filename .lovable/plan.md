

# Redesign av Timegodkjenning med Avvikshåndtering og Lønnskobling

## Problemstilling

Dagens system har en enkel godkjenningsflyt som bare skiller mellom "innenfor margin" (auto-godkjenn) og "avvik" (vis slider-modal). Det som mangler er det referansebildene viser: en listebasert avvikshåndtering der lederen kan **splitte arbeidstid inn i ulike vakttyper/lønnsarter** direkte ved godkjenning, med kobling til lønnssystemet.

## Konsept: Inline Avvikshåndtering

Inspirert av referansebildene, men med et moderne og mer intuitivt design:

```text
┌─────────────────────────────────────────────────────────────┐
│ Uke 14 · Bakeri · Filter: Alle                              │
├──────────┬────────────┬──────────┬──────────┬──────┬────────┤
│ Dato     │ Medarbeider│ Vaktplan │ Stemplet │ Lgde │ Status │
├──────────┼────────────┼──────────┼──────────┼──────┼────────┤
│ man 30.  │ Anders D.  │ 03:30-   │ 00:22-   │08:38 │   ☑    │
│          │            │ 11:30    │ 09:02    │      │        │
│  ▼ Benytt avvik [Ja]                                        │
│  ┌──────────────────────────────────────────────┐           │
│  │ Normal    │ 03:30 │ 11:30 │ 08:00           │           │
│  │ Plusstid  │ 11:30 │ 13:00 │ 01:30    [🗑]   │           │
│  │                          [+ Legg til avvik]  │           │
│  └──────────────────────────────────────────────┘           │
└─────────────────────────────────────────────────────────────┘
```

## Hva som skal bygges

### 1. Database: Avvikstyper (brukerdefinerbare)

Ny tabell `deviation_types` der brukeren selv kan opprette avvikstyper med kobling til lønnsart:

- `id`, `name` (f.eks. "Plusstid 100%", "Avspasering 100%"), `code`
- `salary_type_id` → referanse til `salary_types` for lønnseksport
- `color`, `sort_order`, `is_active`
- `is_system` (for standard Normal/Tidsbank som ikke kan slettes)

Seed med standardtyper: Normal, Plusstid 50%, Plusstid 100%, Avspasering 100%, Tidsbank.

### 2. Database: Tidslinjer per godkjenning

Ny tabell `time_entry_lines` for å splitte en godkjent timeliste i flere lønnslinjer:

- `id`, `time_entry_id`, `deviation_type_id`
- `start_time`, `end_time`, `duration_minutes`
- `salary_type_id`, `created_by`, `created_at`

Dette erstatter den nåværende `time_entry_deviations`-tabellen som distribusjonsmekanisme.

### 3. Redesignet TimesheetApprovalPanel

Bygge om til et listeformat (ikke ukesrutenett) som ligner referansebildene:

- **Kollapserbare rader**: Hver timeliste er en rad med dato, medarbeider, funksjon, vaktplanlagt tid, stemplingstid, lengde, pause, kommentar
- **"Benytt avvik" toggle**: Når aktivert, viser inline-tabell med tidslinjer
- Standard: én linje "Normal" som dekker hele arbeidstiden
- Lederen kan **legge til linjer** med avvikstype, starttid, sluttid (beregner lengde automatisk)
- Lederen kan **slette linjer** (unntatt siste)
- Avvikstypene er hentet fra `deviation_types` og vises i dropdown
- Tider valideres: linjer kan ikke overlappe og skal dekke hele perioden

### 4. Auto-godkjenning

Beholder nåværende logikk: timer innenfor margin (±X min) godkjennes med én linje "Normal" automatisk. Kun timer med avvik viser "Benytt avvik"-toggle.

### 5. Lønnskobling

Ved godkjenning med avvikslinjer:
- Hver linje genererer en `payroll_export_line` med riktig `salary_type_id` fra avvikstypen
- Tidsbank-linjer oppdaterer `employee_accounts` automatisk
- Alle linjer lagres i `time_entry_lines` for historikk

### 6. Innstillinger: Administrer avvikstyper

Ny seksjon under Innstillinger der admin kan:
- Opprette/redigere/deaktivere avvikstyper
- Koble avvikstype til lønnsart (dropdown fra `salary_types`)
- Sette standardfarge og sorteringsrekkefølge

## Tekniske endringer

### Nye filer
- `src/hooks/useDeviationTypes.ts` — CRUD for avvikstyper
- `src/components/timesheet/InlineDeviationEditor.tsx` — inline tidslinjeredigerering
- `src/components/settings/DeviationTypesPanel.tsx` — admin-panel for avvikstyper

### Endrede filer
- `src/components/timesheet/TimesheetApprovalPanel.tsx` — total omskriving til listeformat med kollapserbare rader og inline avvikshåndtering
- `src/hooks/useTimesheetApproval.ts` — ny `useApproveWithLines()` mutation som lagrer tidslinjer og kobler til lønn
- `src/hooks/usePayrollExport.ts` — hente fra `time_entry_lines` i stedet for å beregne på nytt
- `src/pages/SettingsPage.tsx` — legge til Avvikstyper-fane

### Migrering
- Opprett `deviation_types` og `time_entry_lines` tabeller med RLS
- Seed standardverdier
- Beholder eksisterende `time_entry_deviations` for bakoverkompatibilitet

## Oppsummering

Denne tilnærmingen gir lederen full kontroll over hvordan avvik fra vaktplanen kategoriseres, med direkte kobling til lønnssystemet. Det er fleksibelt (brukerdefinerte avvikstyper), intuitivt (inline-redigering inspirert av referansebildene), og sikkert (RLS + lønnsart-validering).

