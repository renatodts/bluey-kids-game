import { describe, it, expect } from 'vitest';
import { createGame, toyCountForRound, TOY_TYPES, FLOOR_BOUNDS } from './game.js';

function countByType(toys) {
  const counts = {};
  for (const toy of toys) counts[toy.type] = (counts[toy.type] || 0) + 1;
  return counts;
}

describe('GUARD-04: geração de rodada', () => {
  it('rodada 1 espalha 6 brinquedos em quantidades iguais por tipo', () => {
    const game = createGame();
    const state = game.startRound();
    expect(state.toys).toHaveLength(6);
    expect(countByType(state.toys)).toEqual({ ball: 2, block: 2, plush: 2 });
  });

  it('quantidade por rodada segue a spec: 1→6, 2→9, 3+→12', () => {
    expect(toyCountForRound(1)).toBe(6);
    expect(toyCountForRound(2)).toBe(9);
    expect(toyCountForRound(3)).toBe(12);
    expect(toyCountForRound(4)).toBe(12);
    expect(toyCountForRound(12)).toBe(12);
    expect(toyCountForRound(50)).toBe(12);
  });

  it('cada brinquedo nasce idle, com cor e posição dentro da área do chão', () => {
    const game = createGame();
    const { toys } = game.startRound();
    for (const toy of toys) {
      expect(TOY_TYPES).toContain(toy.type);
      expect(toy.state).toBe('idle');
      expect(toy.color).toMatch(/^#[0-9a-f]{6}$/i);
      // Spec-precision gap: a spec pede "espalhar" sem bounds numéricos;
      // asserta contra a área de chão definida (clamp do arrasto usa a mesma).
      expect(toy.spawn.x).toBeGreaterThanOrEqual(FLOOR_BOUNDS.minX);
      expect(toy.spawn.x).toBeLessThanOrEqual(FLOOR_BOUNDS.maxX);
      expect(toy.spawn.z).toBeGreaterThanOrEqual(FLOOR_BOUNDS.minZ);
      expect(toy.spawn.z).toBeLessThanOrEqual(FLOOR_BOUNDS.maxZ);
    }
  });

  it('mesma seed reproduz a mesma rodada (cores e posições)', () => {
    const a = createGame();
    a.seed(42);
    const b = createGame();
    b.seed(42);
    expect(a.startRound().toys).toEqual(b.startRound().toys);
  });

  it('seeds diferentes variam cor/posição dos brinquedos', () => {
    const a = createGame();
    a.seed(1);
    const b = createGame();
    b.seed(2);
    expect(a.startRound().toys).not.toEqual(b.startRound().toys);
  });

  it('rodada inicia na fase playing', () => {
    const game = createGame();
    expect(game.startRound().phase).toBe('playing');
  });
});

describe('GUARD-02: guardar na caixa do mesmo tipo', () => {
  it('soltar na caixa certa retorna stored e o brinquedo fica stored', () => {
    const game = createGame();
    game.seed(1);
    const { toys } = game.startRound();
    const ball = toys.find((t) => t.type === 'ball');
    game.pickToy(ball.id);
    expect(game.tryStore(ball.id, 'ball')).toBe('stored');
    const after = game.getState().toys.find((t) => t.id === ball.id);
    expect(after.state).toBe('stored');
  });
});

describe('GUARD-03: caixa errada e soltar fora', () => {
  it('soltar na caixa de tipo diferente retorna rejected e o brinquedo volta a idle', () => {
    const game = createGame();
    game.seed(1);
    const { toys } = game.startRound();
    const ball = toys.find((t) => t.type === 'ball');
    game.pickToy(ball.id);
    expect(game.tryStore(ball.id, 'block')).toBe('rejected');
    const after = game.getState().toys.find((t) => t.id === ball.id);
    expect(after.state).toBe('idle');
  });

  it('soltar fora de qualquer caixa assenta o brinquedo (dragging → idle)', () => {
    const game = createGame();
    game.seed(1);
    const { toys } = game.startRound();
    const toy = toys[0];
    game.pickToy(toy.id);
    expect(game.getState().toys.find((t) => t.id === toy.id).state).toBe('dragging');
    game.dropToy(toy.id);
    expect(game.getState().toys.find((t) => t.id === toy.id).state).toBe('idle');
  });
});

describe('máquina de estados (edge cases multi-estado)', () => {
  it('só um brinquedo arrastado por vez: segundo pick é recusado', () => {
    const game = createGame();
    game.seed(1);
    const { toys } = game.startRound();
    expect(game.pickToy(toys[0].id)).toBe(true);
    expect(game.pickToy(toys[1].id)).toBe(false);
    expect(game.getState().toys.find((t) => t.id === toys[1].id).state).toBe('idle');
  });

  it('brinquedo guardado não pode ser pego nem guardado de novo', () => {
    const game = createGame();
    game.seed(1);
    const { toys } = game.startRound();
    const ball = toys.find((t) => t.type === 'ball');
    game.pickToy(ball.id);
    game.tryStore(ball.id, 'ball');
    expect(game.pickToy(ball.id)).toBe(false);
    expect(game.tryStore(ball.id, 'ball')).toBe('rejected');
    expect(game.getState().toys.find((t) => t.id === ball.id).state).toBe('stored');
  });

  it('após soltar, outro brinquedo pode ser pego', () => {
    const game = createGame();
    game.seed(1);
    const { toys } = game.startRound();
    game.pickToy(toys[0].id);
    game.dropToy(toys[0].id);
    expect(game.pickToy(toys[1].id)).toBe(true);
  });
});

describe('GUARD-05 (condição): rodada completa', () => {
  it('isRoundComplete é false enquanto restam brinquedos e true ao guardar o último', () => {
    const game = createGame();
    game.seed(1);
    const { toys } = game.startRound();
    expect(game.isRoundComplete()).toBe(false);
    for (const toy of toys) {
      game.pickToy(toy.id);
      expect(game.tryStore(toy.id, toy.type)).toBe('stored');
    }
    expect(game.isRoundComplete()).toBe(true);
  });

  it('guardar o último brinquedo dispara a fase celebrating', () => {
    const game = createGame();
    game.seed(1);
    const { toys } = game.startRound();
    for (const toy of toys.slice(0, -1)) {
      game.pickToy(toy.id);
      game.tryStore(toy.id, toy.type);
    }
    expect(game.getState().phase).toBe('playing');
    const last = toys[toys.length - 1];
    game.pickToy(last.id);
    game.tryStore(last.id, last.type);
    expect(game.getState().phase).toBe('celebrating');
  });
});

function stubStorage(initial = {}) {
  const data = { ...initial };
  return {
    getItem: (key) => (key in data ? data[key] : null),
    setItem: (key, value) => {
      data[key] = String(value);
    },
    _data: data,
  };
}

function throwingStorage() {
  return {
    getItem: () => {
      throw new Error('storage indisponível (modo privado)');
    },
    setItem: () => {
      throw new Error('storage indisponível (modo privado)');
    },
  };
}

describe('GUARD-04.1 via GUARD-05: progressão de rodadas 6→9→12→12', () => {
  it('advanceRound faz as rodadas seguintes nascerem com 9, 12 e de novo 12', () => {
    const game = createGame(stubStorage());
    game.seed(1);
    expect(game.startRound().toys).toHaveLength(6);
    expect(game.advanceRound()).toBe(2);
    expect(game.startRound().toys).toHaveLength(9);
    expect(game.advanceRound()).toBe(3);
    expect(game.startRound().toys).toHaveLength(12);
    expect(game.advanceRound()).toBe(4);
    expect(game.startRound().toys).toHaveLength(12);
  });

  it('rodada nova após advanceRound volta à fase playing com brinquedos idle', () => {
    const game = createGame(stubStorage());
    game.seed(1);
    const { toys } = game.startRound();
    for (const toy of toys) {
      game.pickToy(toy.id);
      game.tryStore(toy.id, toy.type);
    }
    expect(game.getState().phase).toBe('celebrating');
    game.advanceRound();
    const next = game.startRound();
    expect(next.phase).toBe('playing');
    expect(next.round).toBe(2);
    expect(next.toys.every((t) => t.state === 'idle')).toBe(true);
  });
});

describe('GUARD-06: persistência da rodada', () => {
  it('ao terminar a rodada, advanceRound persiste o número da próxima rodada', () => {
    const storage = stubStorage();
    const game = createGame(storage);
    expect(game.advanceRound()).toBe(2);
    expect(storage.getItem('hora-de-guardar:round')).toBe('2');
    expect(game.advanceRound()).toBe(3);
    expect(storage.getItem('hora-de-guardar:round')).toBe('3');
  });

  it('abre com progresso salvo: inicia na rodada salva', () => {
    const game = createGame(stubStorage({ 'hora-de-guardar:round': '2' }));
    game.seed(1);
    expect(game.currentRound).toBe(2);
    const state = game.startRound();
    expect(state.round).toBe(2);
    expect(state.toys).toHaveLength(9);
  });

  it('sem storage, inicia na rodada 1', () => {
    const game = createGame();
    expect(game.currentRound).toBe(1);
  });

  it('valor salvo inválido inicia na rodada 1', () => {
    for (const bad of ['abc', '', '0', '-3', '2.5', 'NaN']) {
      const game = createGame(stubStorage({ 'hora-de-guardar:round': bad }));
      expect(game.currentRound).toBe(1);
    }
  });

  it('storage que lança exceção: inicia na rodada 1 silenciosamente', () => {
    const game = createGame(throwingStorage());
    expect(game.currentRound).toBe(1);
    expect(game.startRound().toys).toHaveLength(6);
  });

  it('storage que lança na escrita: advanceRound segue avançando sem quebrar', () => {
    const game = createGame(throwingStorage());
    game.seed(1);
    expect(game.advanceRound()).toBe(2);
    expect(game.startRound().toys).toHaveLength(9);
  });

  it('advanceRound sem storage funciona (sem persistir)', () => {
    const game = createGame();
    expect(game.advanceRound()).toBe(2);
  });
});

describe('getState retorna cópia (hook somente leitura)', () => {
  it('mutar o retorno não altera o estado interno', () => {
    const game = createGame();
    game.seed(1);
    game.startRound();
    const snapshot = game.getState();
    snapshot.toys[0].state = 'stored';
    snapshot.phase = 'celebrating';
    expect(game.getState().toys[0].state).toBe('idle');
    expect(game.getState().phase).toBe('playing');
  });
});
