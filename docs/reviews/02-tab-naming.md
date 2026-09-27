# Tab naming review (agent: naming, 2026-09-26)

## What each tab does
- **Handbook** — verbatim Pritchett & Anjum chapters 0–8, chapter chips.
- **Ear** (default landing) — hear each bahr's dum/da pulse by family; drills (In/Limping, Which tune); weak-area tracker.
- **Tap** — echo a rhythm on a tap pad, or tap-scan a recited line into weights.
- **Scan** — paste verse/couplet/ghazal → auto-scansion, word weights, misra stacking; sample picker.
- **Studio** — same engine as Scan + real-time scanning, couplet-pair verdict banner, two-misra audio. Target of "Scan in Studio".
- **Meters** (`id=bahr`) — 37 meters + rubāʻī + Mir's Hindi meter by family.
- **Exercises** — 24 ghazals / 113 couplets with notes, transliterations, Scan/Play buttons.
- **Dictionary** — prosodic lexicon with search/filter/audio.
- **Bibliography** — 2 citations.
- **Learn** — six-stage method explainer + drills; currently last in nav despite being the conceptual entry point.

## Overlaps
- Scan and Studio share one engine → merge candidate.
- Ear / Tap / Learn split Learn's own Hear→Letters→Weight→Bending→Hands→Read pipeline; Learn is mis-ordered.

## Schemes
| Tab | Plain English | ʻArūz term — gloss | Hybrid (recommended) |
|---|---|---|---|
| Handbook | Read | Risāla (رسالہ) | Handbook |
| Ear | Listen | Samāʻ (سماع) | Listen |
| Tap | Tap Along | Żarb (ضرب) | Tap Along |
| Scan | Scan | Taqṭīʻ (تقطیع) | Taqṭīʻ — Scan |
| Studio | Compose | Kārgāh (کارگاہ) | Compose |
| Meters | All Meters | Buḥūr (بحور) | Buḥūr — Meters |
| Exercises | Practice | Mashq (مشق) | Mashq — Practice |
| Dictionary | Word Bank | Lughat (لغت) | Dictionary |
| Bibliography | Sources | Marājiʻ (مراجع) | Sources |
| Learn | Foundations | Uṣūl (اصول) | Foundations |

## Recommended order
Listen → Foundations → Tap Along → Mashq → Taqṭīʻ (Scan + Compose merged) → **Reference:** Buḥūr, Dictionary, Handbook, Sources.

## Decision (owner, 2026-09-26)
- **Merge Scan + Studio** into one tab.
- **Plain-English scheme.** Final nav order:
  1. Listen (Ear) 2. Foundations (Learn) 3. Tap Along (Tap) 4. Practice (Exercises) 5. Scan (Scan + Studio merged)
  — Reference — 6. Meters 7. Word Bank (Dictionary) 8. Handbook 9. Sources (Bibliography)
- Status: queued; to be implemented after the theme pass lands.
