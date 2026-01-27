
# Industrivern-modul (HMS Pro) - Implementeringsplan

## Oversikt

Denne planen beskriver implementeringen av Industrivern-modulen som en premium-oppgradering til eksisterende HMS-modul i CrewPlan. Modulen sikrer at virksomheter med industrivernplikt oppfyller kravene i Forskrift om industrivern (FOR-2011-12-20-1434).

**Eksisterende infrastruktur som kan gjenbrukes:**
- HMS-modulen (HMS-roller, Vernerunder, ROS-analyse)
- Brannvern-modulen (brannøvelser, utstyrskontroll)
- E-læringsmodulen (kurs og sertifikater)
- Utstyrsmodulen (CrewAssets)

---

## Fase 1: Database-grunnlag (Prioritet: Høy)

### 1.1 Nye enum-typer
```text
industrivern_role: 
  - industrivernleder
  - fagleder_industrivern
  - innsatsperson
  - redningsstab
  - orden_sikring
  - forstehjelp
  - brannvern
  - miljo_kjemikalievern
  - kjemikaliedykker
  - roykdykker

exercise_type:
  - diskusjonsovelse
  - delovelse
  - praktisk
  - fullskala
  - reell_hendelse

equipment_category:
  - personlig_verneutstyr
  - forstehjelp
  - brannvern
  - kjemikalievern
  - kommunikasjon
  - annet
```

### 1.2 Kjernetabeller (12 tabeller)

| Tabell | Beskrivelse | Relasjon |
|--------|-------------|----------|
| `industrivern_organization` | Virksomhetsinfo, NSO-registrering, forsterket status | Singleton per org |
| `industrivern_personnel` | Roller og ansvar for industrivern | FK → profiles |
| `emergency_plans` | Beredskapsplaner med versjonering | Standalone |
| `alert_plans` | Varslingsplaner per hendelsestype | FK → emergency_plans |
| `action_cards` | Tiltakskort med QR-koder | FK → emergency_plans |
| `emergency_resources` | Ressursoversikt (intern/ekstern) | FK → emergency_plans |
| `industrivern_equipment` | Beredskapsutstyr register | Standalone |
| `equipment_inspections` | Kontrolllogg for utstyr | FK → industrivern_equipment |
| `industrivern_qualifications` | Definisjon av kvalifikasjoner | Standalone |
| `personnel_qualifications` | Ansattes kvalifikasjoner | FK → profiles, qualifications |
| `industrivern_exercises` | Øvelsesplanlegging og evaluering | Standalone |
| `exercise_participants` | Deltakere i øvelser | FK → exercises, profiles |
| `exercise_evaluations` | Evalueringsrapporter | FK → exercises |
| `industrivern_coordination` | Samordning med nabovirksomheter | Standalone |
| `industrivern_incidents` | Hendelseslogg | Standalone |
| `exercise_schedule` | Årsplan for øvelser | Year-based |

### 1.3 RLS-policyer
- Alle tabeller får RLS aktivert
- Admins (superadmin, daglig_leder) får full tilgang
- Industrivern-personell får les-tilgang til relevante tabeller
- Ansatte får begrenset tilgang til egne kvalifikasjoner

---

## Fase 2: Navigasjon og sidestruktur

### 2.1 Oppdater AppSidebar.tsx
Legg til ny navigasjonsoppføring under "INTERNKONTROLL":

```text
INTERNKONTROLL
├── Utstyr
├── Opplæring
├── IK-Mat
├── HMS
├── Brann
├── Industrivern  ← NY (ikon: HardHat eller Shield med +)
└── Meld avvik
```

### 2.2 Ny side: IndustrivernPage.tsx
Hovedside med følgende tabs:
- **Dashboard** - Compliance-status, varsler, neste øvelse
- **Organisasjon** - Roller og personell
- **Beredskapsplan** - Varslingsplaner, tiltakskort, ressurser
- **Utstyr** - Beredskapsutstyr (separat fra generelt utstyr)
- **Kvalifikasjoner** - Kompetansekrav og sertifikater
- **Øvelser** - Planlegging, gjennomføring, evaluering
- **Samordning** - Nabovirksomheter
- **Hendelser** - Logg over reelle hendelser

### 2.3 App.tsx routing
```text
/industrivern → IndustrivernPage
/industrivern/ovelse/:id → ExerciseDetailPage (valgfritt)
```

---

## Fase 3: React-komponenter

### 3.1 Dashboard-komponenter
```text
src/components/industrivern/
├── IndustrivernDashboard.tsx       # Hovedoversikt
├── ComplianceStatusCard.tsx        # Compliance-score widget
├── ExerciseCalendarWidget.tsx      # Neste øvelser
├── ExpiringQualificationsWidget.tsx # Utløpende sertifikater
└── EquipmentAlertsWidget.tsx       # Utstyr som trenger kontroll
```

### 3.2 Organisasjons-komponenter
```text
├── OrganizationPanel.tsx           # Hovedpanel
├── OrganizationChartView.tsx       # Visuelt organisasjonskart
├── PersonnelRoleModal.tsx          # Tildel/rediger rolle
├── ReinforcementTypesPanel.tsx     # Forsterket industrivern-valg
└── NSORegistrationCard.tsx         # NSO-status
```

### 3.3 Beredskapsplan-komponenter
```text
├── EmergencyPlanPanel.tsx          # Planversjonering
├── AlertPlanEditor.tsx             # Varslingsplan-builder
├── ActionCardEditor.tsx            # Tiltakskort med QR
├── ActionCardPrintView.tsx         # Utskriftsvennlig visning
├── ResourcesOverviewPanel.tsx      # Ressursoversikt
└── EmergencyPlanVersionHistory.tsx # Versjoneringslogg
```

### 3.4 Øvelses-komponenter
```text
├── ExercisePlannerPanel.tsx        # Årsplan og planlegging
├── CreateExerciseModal.tsx         # Opprett ny øvelse
├── ExerciseDetailView.tsx          # Detaljer og deltakere
├── ExerciseEvaluationModal.tsx     # Evalueringsrapport
├── ExerciseComplianceTracker.tsx   # Status per halvår/kvartal
└── ExerciseParticipantsList.tsx    # Deltakerhåndtering
```

### 3.5 Kvalifikasjons-komponenter
```text
├── QualificationsPanel.tsx         # Oversikt
├── QualificationRequirementsTable.tsx # Krav per rolle
├── PersonnelQualificationsGrid.tsx # Matrise: person × kvalifikasjon
├── AddQualificationModal.tsx       # Registrer ny kvalifikasjon
└── QualificationExpiryAlerts.tsx   # Varsler
```

### 3.6 Utstyrs-komponenter
```text
├── IndustrivernEquipmentPanel.tsx  # Beredskapsutstyr
├── EquipmentInspectionModal.tsx    # Registrer kontroll
├── EquipmentQRGenerator.tsx        # QR-kode generering
└── EquipmentServiceSchedule.tsx    # Serviceplan
```

---

## Fase 4: Hooks og datalag

### 4.1 Nye hooks
```text
src/hooks/
├── useIndustrivernOrganization.ts  # CRUD for org-innstillinger
├── useIndustrivernPersonnel.ts     # Personell og roller
├── useEmergencyPlans.ts            # Beredskapsplaner
├── useAlertPlans.ts                # Varslingsplaner
├── useActionCards.ts               # Tiltakskort
├── useIndustrivernEquipment.ts     # Beredskapsutstyr
├── useIndustrivernQualifications.ts # Kvalifikasjoner
├── useIndustrivernExercises.ts     # Øvelser
├── useExerciseEvaluations.ts       # Evalueringer
├── useIndustrivernCoordination.ts  # Samordning
├── useIndustrivernIncidents.ts     # Hendelser
├── useExerciseSchedule.ts          # Årsplan
└── useIndustrivernCompliance.ts    # Compliance-beregning
```

### 4.2 Integrasjoner med eksisterende hooks
- `useRiskAssessments` → Koble uønskede hendelser fra ROS til øvelsesscenarier
- `useCourses` → Koble industrivern-kurs til kvalifikasjonskrav
- `useFireSafety` → Gjenbruk brannøvelser for forsterket industrivern

---

## Fase 5: Compliance-motor

### 5.1 Compliance-beregning
Automatisk beregning basert på forskriftskravene:

| Paragraf | Vekt | Sjekk |
|----------|------|-------|
| § 5 Uønskede hendelser | 15% | ROS-analyse oppdatert siste 12 mnd |
| § 6 Organisering | 20% | Industrivernleder + fagleder tildelt |
| § 7 Beredskapsplan | 15% | Aktiv plan, gjennomgått siste 12 mnd |
| § 8 Personlig verneutstyr | 10% | Alt personlig utstyr registrert |
| § 9 Beredskapsutstyr | 10% | Ingen forfalt kontroll |
| § 10 Kvalifikasjoner | 15% | Alle påkrevde kvalifikasjoner gyldige |
| § 12 Øvelser | 15% | Oppfylt halvårskrav |

### 5.2 Varslingsregler
```text
Øvelser:
  - 30 dager før: "Øvelse planlagt"
  - 7 dager før: "Øvelse nærmer seg"
  - 0 dager: "Øvelse i dag"
  - Forfalt: "Øvelseskrav ikke oppfylt" (varsling til ledelse)

Utstyr:
  - 30/14/7 dager før kontroll
  - Ved forfall: Eskalering til industrivernleder

Kvalifikasjoner:
  - 60/30 dager før utløp
  - Ved utløp: Person fjernes fra rolle automatisk (konfigurerbart)

Beredskapsplan:
  - 30 dager før årlig gjennomgang
```

---

## Fase 6: Rapporter og eksport

### 6.1 PDF-generering
- **NSO Årsrapport** - Komplett rapport for innsending
- **Compliance-rapport** - Intern statusoversikt
- **Øvelsesrapport** - Dokumentasjon av enkeltøvelse
- **Tiltakskort** - Utskriftsvennlige kort med QR

### 6.2 Eksportformater
- PDF for rapporter
- Excel for dataoversikter
- QR-koder (PNG/SVG) for tiltakskort

---

## Teknisk gjennomføringsplan

### Uke 1-2: Database og grunnlag
1. Kjør database-migrering med alle tabeller og enums
2. Sett opp RLS-policyer
3. Opprett basis-hooks for CRUD-operasjoner

### Uke 3-4: Organisasjon og personell
1. Implementer IndustrivernPage med tabs
2. Bygg organisasjonspanel med rolletildeling
3. Koble til eksisterende profiles-tabell

### Uke 5-6: Beredskapsplan
1. Implementer plan-editor med versjonering
2. Bygg varslingsplan-builder
3. Lag tiltakskort med QR-generering

### Uke 7-8: Øvelser
1. Øvelsesplanlegger med kalendervisning
2. Deltakerhåndtering og deltakelsesregistrering
3. Evalueringsmodul med forbedringstiltak

### Uke 9-10: Kvalifikasjoner og utstyr
1. Kvalifikasjonsregister med kobling til e-læring
2. Beredskapsutstyr-modul
3. Kontroll- og serviceplanlegging

### Uke 11-12: Compliance og rapporter
1. Compliance-motor med automatisk beregning
2. Dashboard-widgets
3. PDF-rapportgenerering

---

## Filstruktur (ny)

```text
src/
├── pages/
│   └── IndustrivernPage.tsx
├── components/
│   └── industrivern/
│       ├── dashboard/
│       │   ├── IndustrivernDashboard.tsx
│       │   ├── ComplianceStatusCard.tsx
│       │   └── ...
│       ├── organization/
│       │   ├── OrganizationPanel.tsx
│       │   └── ...
│       ├── emergency-plan/
│       │   ├── EmergencyPlanPanel.tsx
│       │   └── ...
│       ├── exercises/
│       │   ├── ExercisePlannerPanel.tsx
│       │   └── ...
│       ├── qualifications/
│       │   └── ...
│       └── equipment/
│           └── ...
├── hooks/
│   ├── useIndustrivernOrganization.ts
│   ├── useIndustrivernPersonnel.ts
│   ├── useEmergencyPlans.ts
│   ├── useIndustrivernExercises.ts
│   ├── useIndustrivernQualifications.ts
│   └── useIndustrivernCompliance.ts
└── types/
    └── industrivern.ts
```

---

## Anbefalt startpunkt

For å starte implementeringen anbefales følgende rekkefølge:

1. **Database-migrering** - Opprett alle tabeller og enums
2. **Basis-hooks** - useIndustrivernPersonnel, useIndustrivernExercises
3. **Navigasjon** - Legg til /industrivern i sidebar og App.tsx
4. **Hovedside** - IndustrivernPage med tabs (tom struktur)
5. **Dashboard** - Compliance-score og varsler
6. **Organisasjonspanel** - Rolletildeling

Skal jeg starte med database-migreringen og de grunnleggende hooks?
