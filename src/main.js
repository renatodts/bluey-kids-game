// Composição: cena + jogo + arrasto + feedback + hook de teste. (T8/T9)
import * as THREE from 'three';
import { createScene } from './scene.js';
import { createGame } from './game.js';
import { createToyMesh } from './toys.js';
import { createBoxes } from './boxes.js';
import { createDrag } from './drag.js';
import { createFeedback } from './feedback.js';

const overlay = document.getElementById('start-overlay');
const playButton = document.getElementById('play-button');

playButton.addEventListener('pointerup', () => {
  overlay.classList.add('hidden');
});

const canvas = document.getElementById('game-canvas');
const { scene, camera, renderer, floorY, onResize } = createScene(canvas);

window.addEventListener('resize', onResize);

// Acessar window.localStorage pode lançar (modo privado) — o jogo segue sem persistir.
const storage = (() => {
  try {
    return window.localStorage;
  } catch {
    return undefined;
  }
})();

const game = createGame(storage);

const boxes = createBoxes();
for (const box of boxes) scene.add(box.mesh);

const feedback = createFeedback({ scene, floorY });

// Referência viva compartilhada com o drag — mutar no lugar, nunca reatribuir.
const toyMeshes = [];

function spawnRound() {
  for (const mesh of toyMeshes) scene.remove(mesh);
  toyMeshes.length = 0;
  const state = game.startRound();
  for (const toy of state.toys) {
    const mesh = createToyMesh(toy.type, toy.color, toy.id);
    mesh.position.set(toy.spawn.x, floorY, toy.spawn.z);
    scene.add(mesh);
    mesh.updateMatrixWorld(true); // raycast coerente já no mesmo tick (antes do próximo frame)
    toyMeshes.push(mesh);
  }
}

function findToyMesh(toyId) {
  return toyMeshes.find((mesh) => mesh.userData.toyId === toyId);
}

const projected = new THREE.Vector3();

function projectToScreen(object, yOffset) {
  object.getWorldPosition(projected);
  projected.y += yOffset;
  projected.project(camera);
  const rect = canvas.getBoundingClientRect();
  return {
    x: rect.left + ((projected.x + 1) / 2) * rect.width,
    y: rect.top + ((1 - projected.y) / 2) * rect.height,
  };
}

// Raio de acerto da caixa projetado em pixels (varia com viewport/câmera).
function boxScreenRadius(box) {
  const center = projectToScreen(box.mesh, 0.5);
  projected.set(box.position.x + box.snapRadius, 0.5, box.position.z).project(camera);
  const rect = canvas.getBoundingClientRect();
  const edgeX = rect.left + ((projected.x + 1) / 2) * rect.width;
  const edgeY = rect.top + ((1 - projected.y) / 2) * rect.height;
  return Math.hypot(edgeX - center.x, edgeY - center.y);
}

function nearestBox(pos, screenXY) {
  let best = null;
  let bestDist = Infinity;
  // 1) Proximidade no mundo: o brinquedo chegou perto da caixa.
  for (const box of boxes) {
    const dist = Math.hypot(pos.x - box.position.x, pos.z - box.position.z);
    if (dist <= box.snapRadius && dist < bestDist) {
      best = box;
      bestDist = dist;
    }
  }
  if (best || !screenXY) return best;
  // 2) Proximidade em tela: o dedo soltou SOBRE a caixa. Em retrato a câmera
  //    afastada cria paralaxe entre dedo e projeção no chão — sem este teste,
  //    soltar visualmente na caixa contaria como "fora". (GUARD-02/07)
  for (const box of boxes) {
    const center = projectToScreen(box.mesh, 0.5);
    const dist = Math.hypot(screenXY.x - center.x, screenXY.y - center.y);
    if (dist <= boxScreenRadius(box) && dist < bestDist) {
      best = box;
      bestDist = dist;
    }
  }
  return best;
}

function handleDrop(toyId, pos, screenXY) {
  const mesh = findToyMesh(toyId);
  if (!mesh) return;
  const box = nearestBox(pos, screenXY);
  if (!box) {
    // Fora de qualquer caixa: assenta suavemente no chão onde foi solto. (GUARD-03)
    game.dropToy(toyId);
    feedback.settle(mesh, pos);
    return;
  }
  const result = game.tryStore(toyId, box.type);
  if (result === 'stored') {
    // Sugar para a caixa com pulo; sai do raycast já (estado é 'stored'). (GUARD-02)
    toyMeshes.splice(toyMeshes.indexOf(mesh), 1);
    feedback.stored(mesh, box);
  } else {
    // Caixa errada: balança a caixa e devolve o brinquedo quicando ao spawn. (GUARD-03)
    const toy = game.getState().toys.find((t) => t.id === toyId);
    feedback.rejected(mesh, box, toy.spawn);
  }
}

createDrag({
  camera,
  canvas,
  toys: toyMeshes,
  floorY,
  onPick: (toyId) => {
    if (!game.pickToy(toyId)) return false;
    // Pegou em pleno quique/assentamento? Cancela o tween — animação nunca trava o arrasto.
    feedback.cancel(findToyMesh(toyId));
    return true;
  },
  onDrop: handleDrop,
});

// Hook de teste E2E — somente leitura + determinismo. Contrato do design.md.
window.__game = {
  state() {
    return game.getState();
  },
  screenPos(objectId) {
    const boxTarget = boxes.find((b) => b.type === objectId);
    const target = boxTarget ? boxTarget.mesh : findToyMesh(objectId);
    if (!target) return null;
    return projectToScreen(target, boxTarget ? 0.5 : 0.35);
  },
  seed(n) {
    game.seed(n);
    spawnRound(); // próxima rodada gerada = esta, determinística
  },
};

spawnRound();

// Render síncrono inicial: garante matrizes de câmera/cena válidas para
// raycast e screenPos já no primeiro tick (antes do primeiro frame do loop).
renderer.render(scene, camera);

let lastTime = 0;
renderer.setAnimationLoop((time) => {
  const dt = Math.min((time - lastTime) / 1000, 0.05); // clamp: aba dormiu ≠ salto de animação
  lastTime = time;
  feedback.update(dt);
  renderer.render(scene, camera);
});
