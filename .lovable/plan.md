
# Forbedret inline timeredigering

## Redesign av det ekspanderte redigeringspanelet

### 1. Tydelig planlagt vs faktisk sammenligning (øverst)
Vis en visuell sammenligning med to rader:
```
┌──────────────────────────────────────────────────┐
│  📋 Planlagt    08:00 – 16:00    30 min pause    │  7.5t
│  ⏱  Faktisk    09:55 – 18:50    30 min pause    │  8.4t
│                                  Avvik: +50m      │
└──────────────────────────────────────────────────┘
```
Read-only oppsummering som gir kontekst før man redigerer.

### 2. Enklere redigeringsseksjon
Én samlet seksjon "Korriger tid" med inn/ut/pause på én linje:
```
KORRIGER TID
Inn: [09:55]  →  Ut: [18:50]  |  Pause: [30] min  |  Netto: 8.4t
```
Netto-timer oppdateres live basert på inn/ut/pause.

### 3. Fordeling av timer (forbedret)
Beholder InlineDeviationEditor men med tydligere overskrift:
```
FORDELING PÅ LØNNSARTER
Normal    │ 08:00 │ 16:00 │ 7.5t   [🗑]
Overtid   │ 16:00 │ 18:50 │ 2.8t   [🗑]
                    [+ Legg til linje]
                    Sum: 10.3t / 8.4t  ← rødt hvis mismatch
```

### 4. Notat + handlingsknapper (uendret)

### Filer som endres
- `src/pages/ApprovalsPage.tsx` — kun inline editor-panelet redesignes (linje 614-710)
