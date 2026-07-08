# LESSONS — auto-maintained by scripts/lessons.py

> Machine-owned. Do NOT hand-edit. Changes are overwritten on the next `lessons.py` write.
> Canonical state lives in `.specs/lessons.json`. Edit lessons only via the script.
> promote_threshold=2 distinct features · window_days=45 · quarantine_threshold=2

## Confirmed (load these at Specify/Design)

Corroborated across multiple features. Safe to apply as guidance.

_none_

## Candidates (under observation — do NOT load as guidance yet)

Seen once or not yet corroborated. Tracked, not trusted.

### L-001 — ACs de posicionamento espacial ('espalhar', 'perto', 'dentro da área') devem definir bounds numéricos na spec para o teste assertar valor exato, não constante da implementação
- signal: `spec_precision_gap` · recurrence: 1 feature(s) · scope: `spec-writing` · harmful: 0
- features: hora-de-guardar
- evidence: GUARD-04 / src/game.test.js:34 (spec-writing)
- last seen: 2026-07-08T14:55:55Z

### L-002 — ACs com substantivos plurais vagos ('personagens', 'efeitos') devem enumerar quais/quantos elementos são exigidos, senão a verificação não tem desfecho preciso
- signal: `spec_precision_gap` · recurrence: 1 feature(s) · scope: `spec-writing` · harmful: 0
- features: hora-de-guardar
- evidence: GUARD-08.2 (spec-writing)
- last seen: 2026-07-08T14:55:55Z

### L-003 — Para poucos efeitos sonoros simples, sintetizar com osciladores WebAudio elimina download/licença/rede; considerar como default na spec em vez de arquivos de áudio externos
- signal: `spec_deviation` · recurrence: 1 feature(s) · scope: `audio` · harmful: 0
- features: hora-de-guardar
- evidence: src/feedback.js:4 (audio)
- last seen: 2026-07-08T14:55:55Z

### L-004 — AC que delega valores precisos a outro documento ('definidos no design') só é verificável se o documento realmente fixar esses valores — pinar no design ou dar o valor na própria AC
- signal: `spec_precision_gap` · recurrence: 1 feature(s) · scope: `spec-writing` · harmful: 0
- features: visual-bluey
- evidence: VIS-01.1 / design.md (spec-writing)
- last seen: 2026-07-08T18:47:06Z

### L-005 — Design que introduz camada DOM com z-index deve enumerar as camadas/overlays existentes e ordenar explicitamente — valor absoluto escolhido sem esse mapa conflita com overlays já presentes
- signal: `spec_deviation` · recurrence: 1 feature(s) · scope: `design` · harmful: 0
- features: visual-bluey
- evidence: index.html:33 SPEC_DEVIATION z-index (design)
- last seen: 2026-07-08T18:47:06Z

## Quarantined (failed when applied — ignore)

A confirmed lesson that recurred alongside failure. Kept for the maintainer to review.

_none_
