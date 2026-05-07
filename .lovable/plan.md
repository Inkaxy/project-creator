## Mål
Legge til flere oppføringer som vises på `/godkjenninger`-siden, slik at du har mer data å teste godkjenningsflyten med.

## Bakgrunn
Godkjenningssiden viser tre typer oppføringer:
1. **Fraværssøknader** (status `pending`)
2. **Vaktbytter** (status `pending_manager`)
3. **Timelister / stemplede timer** (status `submitted`, fra siste 30 dager)

I dag er listen tynn fordi det finnes få oppføringer i disse statusene i databasen.

## Plan

### 1. Sjekk eksisterende demo-data
Kjør et raskt søk i databasen for å se hvilke ansatte, avdelinger og vakter som finnes, så de nye oppføringene knyttes til ekte profiler (ikke ugyldige ID-er).

### 2. Opprett en seed-migrasjon som legger til:
- **~8 nye timelister til godkjenning** (`time_entries.status = 'submitted'`)
  - Spredt over de siste 14 dagene
  - Variert: noen normale, noen med avvik (startet sent, sluttet sent, lang pause) for å teste avviksflyten
  - Knyttet til reelle `employee_id` fra `profiles` på tvers av flere avdelinger
  - Inkluderer `clock_in`, `clock_out`, `break_minutes`, `date`
- **~4 nye fraværssøknader** (`absence_requests.status = 'pending'`)
  - Blanding av Ferie, Avspasering og Permisjon med lønn
  - Datoer fram i tid (1–6 uker fram)
  - Forskjellige ansatte
- **~3 nye vaktbytter** (`shift_swaps.status = 'pending_manager'`)
  - Bruker eksisterende publiserte vakter som `original_shift_id`
  - Variert type: `swap`, `giveaway`, `cover`

### 3. Verifisering
Etter migrasjonen kjøres åpnes `/godkjenninger`-siden og det bekreftes at:
- Antall i fanen "Til godkjenning" har økt
- Filter pr. avdeling fungerer
- Avviks-editoren åpnes for timeposter med avvik

## Tekniske detaljer
- All seeding gjøres som en SQL-migrasjon (ingen kodeendringer nødvendig).
- ID-er hentes via `SELECT` i migrasjonen (ikke hardkodet) for å unngå brudd hvis demo-data endres.
- Bruker `gen_random_uuid()` for nye rader og `now() - interval 'X days'` for tidsstempler.
- Ingen RLS-endringer; bruker eksisterende roller.

## Det dette ikke gjør
- Endrer ikke selve godkjenningssiden eller logikken bak.
- Sletter ikke eksisterende godkjenninger.
