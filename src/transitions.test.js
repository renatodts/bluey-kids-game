import { describe, it, expect } from 'vitest';
import { createTransitions } from './transitions.js';

// Overlay mockado (AD-004 / tasks.md): sem jsdom, sem WebGL. Expõe .animate()
// devolvendo uma Animation falsa cuja Promise `finished` resolvemos à mão para
// controlar deterministicamente o fim da transição.
function makeOverlay() {
  const animations = [];
  return {
    animate(keyframes, options) {
      let resolve;
      const finished = new Promise((r) => {
        resolve = r;
      });
      const anim = { keyframes, options, finished, finish: () => resolve() };
      animations.push(anim);
      return anim;
    },
    animations, // inspeção nos testes: quantas animações foram realmente iniciadas
  };
}

describe('VIS-06/07: controlador de transição iris', () => {
  // VIS-06.1 (abertura revela) + VIS-07.4 (hook expõe estado) + VIS-07.3 (isBlocking)
  it('open() entra em "opening", bloqueia input e volta a "none" ao concluir', async () => {
    const overlay = makeOverlay();
    const t = createTransitions(overlay);

    expect(t.state).toBe('none');
    expect(t.isBlocking()).toBe(false);

    const p = t.open();
    expect(t.state).toBe('opening');
    expect(t.isBlocking()).toBe(true);
    expect(overlay.animations).toHaveLength(1);

    overlay.animations[0].finish();
    await p;

    expect(t.state).toBe('none');
    expect(t.isBlocking()).toBe(false);
  });

  // VIS-06.2 (fecha cobre) + VIS-07.4 + VIS-07.3
  it('close() entra em "closing", bloqueia input e volta a "none" ao concluir', async () => {
    const overlay = makeOverlay();
    const t = createTransitions(overlay);

    const p = t.close();
    expect(t.state).toBe('closing');
    expect(t.isBlocking()).toBe(true);
    expect(overlay.animations).toHaveLength(1);

    overlay.animations[0].finish();
    await p;

    expect(t.state).toBe('none');
    expect(t.isBlocking()).toBe(false);
  });

  // VIS-07.5: nunca duas transições sobrepostas — chamada durante transição ativa
  // devolve a Promise em andamento e NÃO inicia uma segunda animação.
  it('chamar open()/close() durante transição ativa é idempotente (sem 2ª animação)', async () => {
    const overlay = makeOverlay();
    const t = createTransitions(overlay);

    const first = t.open();
    const second = t.open();
    const third = t.close();

    expect(second).toBe(first);
    expect(third).toBe(first);
    expect(t.state).toBe('opening'); // o estado da primeira transição não muda
    expect(overlay.animations).toHaveLength(1); // só uma animação de fato iniciada

    overlay.animations[0].finish();
    await first;
    expect(t.state).toBe('none');
  });

  // Após concluir, uma nova transição pode ser iniciada normalmente (guarda libera).
  it('após concluir, uma nova transição pode ser iniciada', async () => {
    const overlay = makeOverlay();
    const t = createTransitions(overlay);

    const p1 = t.open();
    overlay.animations[0].finish();
    await p1;

    const p2 = t.close();
    expect(t.state).toBe('closing');
    expect(overlay.animations).toHaveLength(2);
    overlay.animations[1].finish();
    await p2;
    expect(t.state).toBe('none');
  });
});
