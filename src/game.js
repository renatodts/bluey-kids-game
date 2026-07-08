// Lógica pura do jogo — sem three.js, sem DOM. (AD-004)

export const TOY_TYPES = ['ball', 'block', 'plush'];

// Área do chão onde brinquedos nascem e podem ser arrastados (clamp).
export const FLOOR_BOUNDS = { minX: -6, maxX: 6, minZ: -2.5, maxZ: 4 };

const PALETTES = {
  ball: ['#e8483f', '#f6a531', '#4fa9e0', '#7bc043'],
  block: ['#f2c14e', '#5b8dd9', '#e07a5f', '#81b29a'],
  plush: ['#c98bdb', '#f4978e', '#8ecae6', '#ffd166'],
};

// GUARD-04: rodada 1 → 6, rodada 2 → 9, rodada 3+ → 12 (repete 12).
export function toyCountForRound(round) {
  if (round <= 1) return 6;
  if (round === 2) return 9;
  return 12;
}

// RNG semeável (mulberry32) para rodadas determinísticas nos testes/E2E.
function mulberry32(seed) {
  let a = seed >>> 0;
  return function () {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function createGame(storage) {
  let round = 1;
  let rng = mulberry32((Math.random() * 2 ** 31) >>> 0);
  let state = null;

  function seed(n) {
    rng = mulberry32(n >>> 0);
  }

  function startRound() {
    const count = toyCountForRound(round);
    const perType = count / TOY_TYPES.length;
    const toys = [];
    let i = 0;
    for (const type of TOY_TYPES) {
      const palette = PALETTES[type];
      for (let k = 0; k < perType; k++) {
        i += 1;
        toys.push({
          id: `t${i}`,
          type,
          color: palette[Math.floor(rng() * palette.length)],
          spawn: {
            x: FLOOR_BOUNDS.minX + rng() * (FLOOR_BOUNDS.maxX - FLOOR_BOUNDS.minX),
            z: FLOOR_BOUNDS.minZ + rng() * (FLOOR_BOUNDS.maxZ - FLOOR_BOUNDS.minZ),
          },
          state: 'idle',
        });
      }
    }
    state = { round, toys, phase: 'playing' };
    return getState();
  }

  function getState() {
    return structuredClone(state);
  }

  function findToy(toyId) {
    return state ? state.toys.find((t) => t.id === toyId) : undefined;
  }

  function pickToy(toyId) {
    const toy = findToy(toyId);
    if (!toy || toy.state !== 'idle' || state.phase !== 'playing') return false;
    if (state.toys.some((t) => t.state === 'dragging')) return false;
    toy.state = 'dragging';
    return true;
  }

  function dropToy(toyId) {
    const toy = findToy(toyId);
    if (toy && toy.state === 'dragging') toy.state = 'idle';
  }

  function tryStore(toyId, boxType) {
    const toy = findToy(toyId);
    if (!toy || toy.state === 'stored') return 'rejected';
    if (toy.type === boxType) {
      toy.state = 'stored';
      if (state.toys.every((t) => t.state === 'stored')) state.phase = 'celebrating';
      return 'stored';
    }
    toy.state = 'idle';
    return 'rejected';
  }

  function isRoundComplete() {
    return !!state && state.toys.every((t) => t.state === 'stored');
  }

  return {
    get currentRound() {
      return round;
    },
    seed,
    startRound,
    getState,
    pickToy,
    dropToy,
    tryStore,
    isRoundComplete,
  };
}
