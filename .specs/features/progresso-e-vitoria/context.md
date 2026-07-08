# Progresso e Vitória — Context

**Gathered:** 2026-07-08
**Spec:** `.specs/features/progresso-e-vitoria/spec.md`
**Status:** Ready for design

---

## Feature Boundary

Dar um objetivo final ao jogo: um HUD de progresso no topo da tela (sem texto) e um
momento de vitória ao completar a última rodada, adequado a uma criança de 4 anos,
com botão gigante para jogar de novo.

---

## Implementation Decisions

### Meta de vitória

- O jogo completo tem **3 rodadas** (6 + 9 + 12 = 27 brinquedos).
- Completar a rodada 3 dispara a **vitória** (não existe rodada 4).

### Progresso no topo

- **Barra + estrelas** ("micro + macro"): a barra enche um pouco a cada brinquedo
  guardado (recompensa imediata); uma **estrela por rodada** acende quando a rodada
  é completada.
- Preview escolhido pelo usuário: `⭐ ⭐ ☆  ▓▓▓▓▓▓░░░░░░` no topo da tela.
- Sem texto (regra existente do projeto: UI sem texto, exceto erro WebGL).

### Vitória

- **Festa + botão de jogar de novo**: celebração grande — Bluey dança, confete/estrelas
  na cena 3D — e depois um **botão gigante sem texto** (ícone ▶/↻) para recomeçar.
  A criança decide quando jogar de novo.

### Persistência

- **Salva no meio, zera na vitória**: fechar o jogo no meio mantém a rodada salva
  (comportamento atual); vencer limpa o storage — a próxima sessão começa da rodada 1.

### Agent's Discretion

- Semântica exata da barra (por rodada vs. jogo inteiro) — decidido: **por rodada**
  (zera a cada rodada nova; estrelas carregam o macro). Registrado como assumption.
- Duração/forma exata da celebração de vitória e momento em que o botão aparece.
- Tratamento de saves antigos com rodada > 3.

### Declined / Undiscussed Gray Areas → Assumptions

Nenhuma área foi recusada; as discretions acima estão registradas na seção
Assumptions & Open Questions da spec.

---

## Specific References

- Preview ASCII do HUD escolhido pelo usuário (barra + estrelas no topo).
- Coerência com o padrão do projeto: overlays DOM (start-overlay, transition-overlay),
  feedback 3D via `feedback.js`, lógica pura em `game.js` (AD-004).

---

## Deferred Ideas

None — discussion stayed within feature scope.
