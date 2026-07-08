import { describe, it, expect } from 'vitest';
import { createHud } from './hud.js';

// Elementos mockados (AD-004): sem jsdom — só as superfícies que o hud usa
// (classList e style), gravando o estado para inspeção.
function makeStarEl() {
  const classes = new Set();
  return {
    classList: {
      add: (c) => classes.add(c),
      remove: (c) => classes.delete(c),
      contains: (c) => classes.has(c),
    },
  };
}

function makeHud() {
  const starEls = [makeStarEl(), makeStarEl(), makeStarEl()];
  const barFillEl = { style: { width: '0%' } };
  return { hud: createHud({ starEls, barFillEl }), starEls, barFillEl };
}

const litCount = (starEls) => starEls.filter((s) => s.classList.contains('lit')).length;

describe('WIN-01/02/03: controlador do HUD', () => {
  it('estado inicial zerado: nenhuma estrela acesa, barra 0%', () => {
    const { hud, starEls, barFillEl } = makeHud();
    hud.set({ starsLit: 0, fraction: 0 });
    expect(litCount(starEls)).toBe(0);
    expect(barFillEl.style.width).toBe('0%');
  });

  it('fraction vira largura percentual da barra (stored/total)', () => {
    const { hud, barFillEl } = makeHud();
    hud.set({ starsLit: 0, fraction: 0.5 });
    expect(barFillEl.style.width).toBe('50%');
    hud.set({ starsLit: 0, fraction: 1 });
    expect(barFillEl.style.width).toBe('100%');
  });

  it('starsLit acende as N primeiras estrelas', () => {
    const { hud, starEls } = makeHud();
    hud.set({ starsLit: 2, fraction: 0 });
    expect(starEls[0].classList.contains('lit')).toBe(true);
    expect(starEls[1].classList.contains('lit')).toBe(true);
    expect(starEls[2].classList.contains('lit')).toBe(false);
  });

  it('reaplicar com menos estrelas apaga as extras (replay zera o HUD)', () => {
    const { hud, starEls, barFillEl } = makeHud();
    hud.set({ starsLit: 3, fraction: 1 });
    expect(litCount(starEls)).toBe(3);
    hud.set({ starsLit: 0, fraction: 0 });
    expect(litCount(starEls)).toBe(0);
    expect(barFillEl.style.width).toBe('0%');
  });

  it('entradas fora dos limites são clampadas', () => {
    const { hud, starEls, barFillEl } = makeHud();
    hud.set({ starsLit: 7, fraction: 2.5 });
    expect(litCount(starEls)).toBe(3);
    expect(barFillEl.style.width).toBe('100%');
    hud.set({ starsLit: -1, fraction: -0.5 });
    expect(litCount(starEls)).toBe(0);
    expect(barFillEl.style.width).toBe('0%');
  });
});
