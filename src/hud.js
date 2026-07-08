// HUD de progresso (WIN-01..03) — controlador burro de DOM, sem regra de jogo:
// recebe elementos prontos do index.html e só reflete { starsLit, fraction }.
// Elementos injetados (não busca no document) → testável com mocks (AD-004).
export function createHud({ starEls, barFillEl }) {
  function set({ starsLit, fraction }) {
    const lit = Math.max(0, Math.min(starEls.length, Math.round(starsLit)));
    starEls.forEach((el, i) => {
      if (i < lit) el.classList.add('lit');
      else el.classList.remove('lit');
    });
    const clamped = Math.max(0, Math.min(1, fraction));
    barFillEl.style.width = `${clamped * 100}%`;
  }

  return { set };
}
