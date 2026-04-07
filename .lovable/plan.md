

# Inline timeredigering på godkjenningskort

## Konsept

I stedet for å åpne en modal for å redigere timer, gjør vi hvert timeliste-kort **ekspanderbart**. Når man klikker "Rediger" kollapser kortet ut nedover og viser redigerbare felt direkte — uten å forlate siden.

```text
┌─────────────────────────────────────────────────────────────┐
│ ○  EH  Emma Haugen  [Timeliste] [Butikk] [⚠ Avvik]        │
│       tir 31. mars  Plan: 09:00–17:00 (7.5t)               │
│       ⏱ 10:50–20:00 (8.2t)  +40m                           │
│       «Varemottak forsinkelse»                              │
│                              [Avslå] [Rediger ▼] [Godkjenn] │
│  ┌──────────────────────────────────────────────────────────┐│
│  │  Korriger stempling                                      ││
│  │  Inn: [10:50]  Ut: [20:00]  Pause: [30] min             ││
│  │                                                          ││
│  │  Fordeling av timer                                      ││
│  │  Normal    │ 09:00 │ 17:00 │ 7.5t              [🗑]     ││
│  │  Plusstid  │ 17:00 │ 20:00 │ 3.0t              [🗑]     ││
│  │                           [+ Legg til linje]             ││
│  │                                                          ││
│  │  Notat: [________________]                               ││
│  │                              [Avbryt] [Lagre & Godkjenn] ││
│  └──────────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────────┘
```

## Hva som endres

### `src/pages/ApprovalsPage.tsx`
- Legg til `expandedEntryId` state — kun én rad kan være åpen om gangen
- "Rediger"-knappen toggler `expandedEntryId` i stedet for å åpne modal
- Under den eksisterende kortinnholdet, render en animert ekspansjon med:
  - **Korriger stempling**: Tre input-felt (inn, ut, pause) pre-fyllt med nåværende verdier
  - **Fordeling av timer**: Gjenbruk `InlineDeviationEditor`-komponenten som allerede finnes
  - **Notat-felt** for leder
  - **Handlingsknapper**: "Avbryt" (kollapser) og "Lagre & Godkjenn" (lagrer linjer + godkjenner)
- Knappen endres til "Rediger ▲" når ekspandert
- Kortet som helhet åpner IKKE modal når det er ekspandert (forhindre onClick)

### Ingen nye filer
Alt bygges inn i eksisterende `ApprovalsPage.tsx` ved å gjenbruke `InlineDeviationEditor` og `useDeviationTypes`.

### Logikk
- Ved ekspansjon: initialiserer redigerbare felter fra entry-data, oppretter standard deviation-linje (Normal, full tid)
- Ved "Lagre & Godkjenn": lagrer `time_entry_lines` til databasen og godkjenner entry — samme logikk som i `TimesheetDetailModal`
- "Rediger"-knappen er tilgjengelig på ALLE timeliste-kort, ikke bare de med avvik
- Modal-åpning via kort-klikk beholdes som fallback for detaljvisning

