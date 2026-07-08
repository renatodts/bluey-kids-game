// Transição iris (abertura, entre rodadas) via overlay DOM — não via cena 3D:
// não disputa o orçamento de draw calls do celular e é trivialmente testável
// (CSS/Web Animations, não WebGL). Ver design.md (visual-bluey). (VIS-06, VIS-07)
//
// O overlay é uma camada opaca sobre o jogo, recortada por `clip-path: circle()`:
//   - círculo cheio (150%)  → overlay cobre a tela  → jogo escondido
//   - círculo zero (0%)     → overlay recortado      → jogo visível
// open()  recolhe o overlay (150% → 0%): revela o jogo.
// close() expande o overlay (0% → 150%): cobre o jogo.
const IRIS_DURATION_MS = 1200; // dentro de 0,8–2,5 s exigido pela spec (VIS-06.1)

export function createTransitions(overlayEl) {
  let state = 'none'; // 'none' | 'opening' | 'closing'
  let activePromise = null; // guarda de não sobreposição (VIS-07.5)

  // fromRadius/toRadius em % do raio do círculo do clip-path.
  function run(nextState, fromRadius, toRadius) {
    // Já há transição ativa: idempotente — devolve a Promise em andamento,
    // sem iniciar uma segunda animação (nunca duas sobrepostas). (VIS-07.5)
    if (activePromise) return activePromise;
    state = nextState;
    const anim = overlayEl.animate(
      [
        { clipPath: `circle(${fromRadius} at 50% 50%)` },
        { clipPath: `circle(${toRadius} at 50% 50%)` },
      ],
      { duration: IRIS_DURATION_MS, easing: 'ease-in-out', fill: 'forwards' }
    );
    activePromise = anim.finished.then(() => {
      state = 'none';
      activePromise = null;
    });
    return activePromise;
  }

  return {
    open() {
      return run('opening', '150%', '0%');
    },
    close() {
      return run('closing', '0%', '150%');
    },
    get state() {
      return state;
    },
    // Usado por drag.js para ignorar input enquanto a tela está em transição. (VIS-07.3)
    isBlocking() {
      return state !== 'none';
    },
  };
}
