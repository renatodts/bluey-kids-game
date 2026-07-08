# LESSONS — auto-maintained by scripts/lessons.py

> Machine-owned. Do NOT hand-edit. Changes are overwritten on the next `lessons.py` write.
> Canonical state lives in `.specs/lessons.json`. Edit lessons only via the script.
> promote_threshold=2 distinct features · window_days=45 · quarantine_threshold=2

## Confirmed (load these at Specify/Design)

Corroborated across multiple features. Safe to apply as guidance.

_none_

## Candidates (under observation — do NOT load as guidance yet)

Seen once or not yet corroborated. Tracked, not trusted.

### L-001 — Spatial-positioning ACs ('spread out', 'near', 'inside the area') must define numeric bounds in the spec so the test can assert an exact value, not a constant from the implementation
- signal: `spec_precision_gap` · recurrence: 1 feature(s) · scope: `spec-writing` · harmful: 0
- features: hora-de-guardar
- evidence: GUARD-04 / src/game.test.js:34 (spec-writing)
- last seen: 2026-07-08T14:55:55Z

### L-002 — ACs with vague plural nouns ('characters', 'effects') must enumerate which/how many elements are required, otherwise verification has no precise outcome
- signal: `spec_precision_gap` · recurrence: 1 feature(s) · scope: `spec-writing` · harmful: 0
- features: hora-de-guardar
- evidence: GUARD-08.2 (spec-writing)
- last seen: 2026-07-08T14:55:55Z

### L-003 — For a few simple sound effects, synthesizing with WebAudio oscillators eliminates download/license/network; consider this as the default in the spec instead of external audio files
- signal: `spec_deviation` · recurrence: 1 feature(s) · scope: `audio` · harmful: 0
- features: hora-de-guardar
- evidence: src/feedback.js:4 (audio)
- last seen: 2026-07-08T14:55:55Z

### L-004 — An AC that delegates precise values to another document ('defined in the design') is only verifiable if that document actually pins those values — pin it in the design or give the value in the AC itself
- signal: `spec_precision_gap` · recurrence: 1 feature(s) · scope: `spec-writing` · harmful: 0
- features: visual-bluey
- evidence: VIS-01.1 / design.md (spec-writing)
- last seen: 2026-07-08T18:47:06Z

### L-005 — A design that introduces a DOM layer with z-index must enumerate the existing layers/overlays and order them explicitly — an absolute value chosen without that map conflicts with overlays already present
- signal: `spec_deviation` · recurrence: 1 feature(s) · scope: `design` · harmful: 0
- features: visual-bluey
- evidence: index.html:33 SPEC_DEVIATION z-index (design)
- last seen: 2026-07-08T18:47:06Z

## Quarantined (failed when applied — ignore)

A confirmed lesson that recurred alongside failure. Kept for the maintainer to review.

_none_
