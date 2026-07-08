// Controles de câmera sobre a lib camera-controls (yomotsu) — padrão de
// mercado para 3D mobile, no lugar da v1 escrita à mão (AD-009):
//   1 dedo / botão esquerdo  → orbita ao redor do alvo
//   2 dedos                  → pinch-zoom + pan no mesmo gesto
//   3 dedos / botão direito  → pan puro
//   roda do mouse            → zoom na direção do cursor; botão do meio → zoom
// Suavização SmoothDamp da lib: micro-damping durante o gesto e assentamento
// curto ao soltar — sem fling longo (desorienta criança de 4 anos).
import * as THREE from 'three';
import CameraControls from 'camera-controls';

CameraControls.install({ THREE });

const MIN_DISTANCE = 3;
const MAX_DISTANCE = 26;
const MIN_POLAR = 0.12;
const MAX_POLAR = Math.PI / 2 - 0.06; // nunca abaixo do chão

// Alvo preso à sala — pan nunca leva a câmera para fora do jogo. (valores da v1)
const TARGET_BOUNDS = new THREE.Box3(
  new THREE.Vector3(-7, 0, -3.4),
  new THREE.Vector3(7, 4, 6.4)
);

const DRAGGING_SMOOTH_TIME = 0.06; // resposta direta com micro-suavização
const SMOOTH_TIME = 0.25; // assentamento pós-gesto

export function createCameraControls({ camera, canvas }) {
  const controls = new CameraControls(camera, canvas);

  controls.minDistance = MIN_DISTANCE;
  controls.maxDistance = MAX_DISTANCE;
  controls.minPolarAngle = MIN_POLAR;
  controls.maxPolarAngle = MAX_POLAR;
  controls.setBoundary(TARGET_BOUNDS);
  controls.draggingSmoothTime = DRAGGING_SMOOTH_TIME;
  controls.smoothTime = SMOOTH_TIME;
  controls.dollyToCursor = true;

  controls.mouseButtons.left = CameraControls.ACTION.ROTATE;
  controls.mouseButtons.right = CameraControls.ACTION.TRUCK;
  controls.mouseButtons.middle = CameraControls.ACTION.DOLLY;
  controls.touches.one = CameraControls.ACTION.TOUCH_ROTATE;
  controls.touches.two = CameraControls.ACTION.TOUCH_DOLLY_TRUCK;
  controls.touches.three = CameraControls.ACTION.TOUCH_TRUCK;

  controls.enabled = false; // liberado pelo main quando a abertura termina

  // A lib só suprime o menu de contexto com enabled=true; durante arrasto de
  // brinquedo/abertura o botão direito não pode abrir menu em cima do jogo.
  canvas.addEventListener('contextmenu', (event) => event.preventDefault());

  const targetOut = new THREE.Vector3();

  return {
    // dt em segundos (o main já clampa); a lib devolve se a pose mudou.
    update(dt) {
      return controls.update(dt);
    },
    // Sincroniza a pose sem transição — handoff da abertura sem salto.
    setPose(position, target) {
      controls.normalizeRotations(); // exigência da API v3 antes de setLookAt
      controls.setLookAt(position.x, position.y, position.z, target.x, target.y, target.z, false);
    },
    getState() {
      controls.getTarget(targetOut);
      return {
        position: camera.position,
        target: targetOut,
        distance: controls.distance,
      };
    },
    get enabled() {
      return controls.enabled;
    },
    set enabled(value) {
      controls.enabled = value; // false → controls.cancel(): gesto em andamento morre junto
    },
  };
}
