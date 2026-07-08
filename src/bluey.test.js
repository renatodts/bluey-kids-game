import { describe, it, expect } from 'vitest';
import * as THREE from 'three';
import { createBluey } from './bluey.js';

const IDLE_YAW = -0.55;

// Gira convergindo por várias frames — TURN_SPEED=6 tem constante de tempo
// ~0.17s; 3s reais é folga de sobra para "chegar perto o suficiente".
function settle(bluey, lookTarget, seconds = 3, dt = 1 / 60) {
  const steps = Math.round(seconds / dt);
  for (let i = 0; i < steps; i++) bluey.update(dt, lookTarget);
}

describe('Bluey acompanha o arrasto (olhar segue o brinquedo)', () => {
  it('sem alvo, mantém o ângulo padrão do canto (idle)', () => {
    const bluey = createBluey();
    settle(bluey, null);
    expect(bluey.object.rotation.y).toBeCloseTo(IDLE_YAW, 2);
  });

  it('com um brinquedo à esquerda, vira para encará-lo', () => {
    const corner = new THREE.Vector3(5.8, 0, -2.1);
    const bluey = createBluey({ cornerPosition: corner });
    // Mesmo Z do corner, bem à esquerda (x muito menor) → deve olhar para -X.
    const target = new THREE.Vector3(-10, 0, corner.z);
    settle(bluey, target);
    const expectedYaw = Math.atan2(target.x - corner.x, target.z - corner.z);
    expect(bluey.object.rotation.y).toBeCloseTo(expectedYaw, 1);
  });

  it('ao soltar (lookTarget null), volta suavemente ao ângulo padrão', () => {
    const corner = new THREE.Vector3(5.8, 0, -2.1);
    const bluey = createBluey({ cornerPosition: corner });
    settle(bluey, new THREE.Vector3(-10, 0, corner.z));
    expect(bluey.object.rotation.y).not.toBeCloseTo(IDLE_YAW, 1);
    settle(bluey, null);
    expect(bluey.object.rotation.y).toBeCloseTo(IDLE_YAW, 2);
  });

  it('alvo bem em cima da Bluey não gera NaN (guarda de magnitude zero)', () => {
    const corner = new THREE.Vector3(5.8, 0, -2.1);
    const bluey = createBluey({ cornerPosition: corner });
    settle(bluey, corner.clone(), 0.5);
    expect(Number.isFinite(bluey.object.rotation.y)).toBe(true);
  });
});
