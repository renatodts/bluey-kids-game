// Composição: cena + jogo + arrasto + feedback + hook de teste. (T8/T9)
import * as THREE from 'three';
import { createScene, themeStatus, defaultCameraPose } from './scene.js';
import { createCameraControls } from './camera-controls.js';
import { createGame } from './game.js';
import { createToyMesh, updateToyGlow } from './toys.js';
import { createBoxes } from './boxes.js';
import { createDrag } from './drag.js';
import { createFeedback } from './feedback.js';
import { createBluey } from './bluey.js';
import { createTransitions } from './transitions.js';

const overlay = document.getElementById('start-overlay');
const playButton = document.getElementById('play-button');

// WebGL indisponível → mensagem estática simples, voltada ao adulto.
// Única exceção à regra "sem texto na UI" (edge case da spec).
function webglAvailable() {
  if (location.hash === '#nowebgl') return false; // gancho de teste (cenário 05)
  try {
    const probe = document.createElement('canvas');
    return !!(probe.getContext('webgl2') || probe.getContext('webgl'));
  } catch {
    return false;
  }
}

if (!webglAvailable()) {
  overlay.remove();
  // Iris opaco cobriria a mensagem de erro — sem jogo, sem transição.
  document.getElementById('transition-overlay').remove();
  const message = document.createElement('div');
  message.id = 'webgl-error';
  message.textContent =
    'Este navegador não consegue rodar o jogo (WebGL indisponível). Tente atualizar o navegador ou usar outro aparelho.';
  message.style.cssText =
    'position:fixed;inset:0;display:flex;align-items:center;justify-content:center;' +
    'padding:2rem;text-align:center;font-family:sans-serif;font-size:1.2rem;' +
    'color:#333;background:#bfe6f2;z-index:20;';
  document.body.appendChild(message);
  throw new Error('WebGL indisponível — jogo não inicializado');
}

playButton.addEventListener('pointerup', () => {
  overlay.classList.add('hidden');
  // Gesto de usuário: única chance de destravar o WebAudio. Se falhar, jogo mudo. (GUARD-09)
  feedback.unlockAudio();
  // Iris abre revelando o jogo — transição de abertura. (VIS-06.1)
  transitions.open();
  // Close na Bluey → recuo suave até a vista de jogo.
  startCameraIntro();
});

const canvas = document.getElementById('game-canvas');
const { scene, camera, renderer, floorY, onResize } = createScene(canvas);

const transitions = createTransitions(document.getElementById('transition-overlay'));

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

const blueyCorner = new THREE.Vector3(5.8, floorY, -2.1);

const bluey = createBluey({
  scene,
  cornerPosition: blueyCorner,
  centerPosition: new THREE.Vector3(0, floorY, 0.25),
});

const feedback = createFeedback({ scene, floorY, bluey });

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
  // Fim do arrasto devolve a câmera aos gestos (se a abertura já terminou).
  controls.enabled = !intro.active;
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
    if (game.isRoundComplete()) {
      // Celebração grande + próxima rodada automática em ~4s. (GUARD-05, GUARD-06)
      feedback.roundComplete(boxes);
      setTimeout(() => {
        // Iris fecha → troca de brinquedos coberta → iris abre: brinquedos
        // novos nunca aparecem sem transição. (VIS-06.2)
        transitions.close().then(() => {
          game.advanceRound();
          spawnRound();
          transitions.open();
        });
      }, 4000);
    }
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
    // Dedo no brinquedo = arrasto; a câmera não gira junto. (listeners do drag
    // registrados antes dos da lib de câmera, então desabilitar aqui já vale
    // para este mesmo pointerdown)
    controls.enabled = false;
    // Pegou em pleno quique/assentamento? Cancela o tween — animação nunca trava o arrasto.
    feedback.cancel(findToyMesh(toyId));
    return true;
  },
  onDrop: handleDrop,
  // Input ignorado durante o iris (VIS-07.3) e durante o recuo da câmera.
  isBlocked: () => transitions.isBlocking() || intro.active,
});

// Gestos de câmera (lib camera-controls, AD-009): 1 dedo orbita (quando o
// toque não começou num brinquedo); 2 dedos fazem pinch-zoom + pan num gesto
// só; 3 dedos fazem pan puro. Mouse: esquerdo orbita, direito pan, roda zoom
// no cursor. Criado DEPOIS do drag para o drag decidir primeiro.
const controls = createCameraControls({ camera, canvas });

// Abertura: câmera começa em close na Bluey e recua até a vista de jogo.
const easeInOut = (t) => (t < 0.5 ? 2 * t * t : 1 - (-2 * t + 2) ** 2 / 2);
const intro = {
  active: false,
  elapsed: 0,
  hold: 0.8, // segura o close na Bluey enquanto o iris abre
  duration: 2.0,
  fromPosition: new THREE.Vector3(),
  fromTarget: new THREE.Vector3(),
  toPosition: new THREE.Vector3(),
  toTarget: new THREE.Vector3(),
};

// Alvo do olhar durante a abertura — os controles só assumem no handoff.
const introTarget = blueyCorner.clone().add(new THREE.Vector3(0, 1.1, 0));
camera.position.copy(blueyCorner.clone().add(new THREE.Vector3(-2.3, 2.1, 3.6)));
camera.lookAt(introTarget);

function startCameraIntro() {
  const pose = defaultCameraPose(camera.aspect);
  intro.fromPosition.copy(camera.position);
  intro.fromTarget.copy(introTarget);
  intro.toPosition.copy(pose.position);
  intro.toTarget.copy(pose.target);
  intro.elapsed = 0;
  intro.active = true;
}

// Pose da câmera para asserts numéricos do e2e (CAMG-06): 2 casas decimais.
function cameraHookState() {
  const round = (v) => Math.round(v * 100) / 100;
  const target = intro.active ? introTarget : controls.getState().target;
  return {
    intro: intro.active,
    gesturesEnabled: controls.enabled,
    position: [round(camera.position.x), round(camera.position.y), round(camera.position.z)],
    target: [round(target.x), round(target.y), round(target.z)],
    distance: round(camera.position.distanceTo(target)),
  };
}

// Hook de teste E2E — somente leitura + determinismo. Contrato do design.md.
window.__game = {
  state() {
    // RoundState + flags de áudio e tema (cenários 03/04 assertam por aqui).
    return {
      ...game.getState(),
      audio: feedback.audioState(),
      theme: { ...themeStatus },
      bluey: { source: bluey.source, mode: bluey.mode },
      transition: transitions.state,
      camera: cameraHookState(),
    };
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
let elapsed = 0;
renderer.setAnimationLoop((time) => {
  const dt = Math.min((time - lastTime) / 1000, 0.05); // clamp: aba dormiu ≠ salto de animação
  lastTime = time;
  elapsed += dt;
  for (const mesh of toyMeshes) updateToyGlow(mesh, elapsed);
  if (intro.active) {
    // Recuo da abertura: câmera sai do close na Bluey para a vista de jogo.
    intro.elapsed += dt;
    const t = Math.min(Math.max((intro.elapsed - intro.hold) / intro.duration, 0), 1);
    camera.position.lerpVectors(intro.fromPosition, intro.toPosition, easeInOut(t));
    introTarget.lerpVectors(intro.fromTarget, intro.toTarget, easeInOut(t));
    camera.lookAt(introTarget);
    if (t >= 1) {
      intro.active = false;
      // Handoff sem salto: controles assumem a pose exata do fim da abertura.
      controls.setPose(intro.toPosition, intro.toTarget);
      controls.enabled = true;
    }
  } else {
    // Fora da abertura a lib é dona da câmera (damping/assentamento).
    controls.update(dt);
  }
  feedback.update(dt);
  bluey.update(dt);
  renderer.render(scene, camera);
});
