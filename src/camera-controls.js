// Controles de câmera gestuais, estilo app de mapa (AD: substitui OrbitControls,
// que não suporta girar com o twist de dois dedos):
//   1 dedo / botão esquerdo  → gira ao redor do alvo
//   2 dedos                  → pan (centróide) + pinch-zoom (distância) +
//                              giro (ângulo entre os dedos), tudo no mesmo gesto
//   roda do mouse            → zoom; botão direito → pan
// Sem inércia: resposta direta — a mão (da criança) manda.
import * as THREE from 'three';

const MIN_DISTANCE = 3;
const MAX_DISTANCE = 26;
const MIN_POLAR = 0.12;
const MAX_POLAR = Math.PI / 2 - 0.06; // nunca abaixo do chão

// Alvo preso à sala — pan nunca leva a câmera para fora do jogo.
const TARGET_BOUNDS = {
  minX: -7,
  maxX: 7,
  minY: 0,
  maxY: 4,
  minZ: -3.4,
  maxZ: 6.4,
};

export function createCameraControls({ camera, canvas }) {
  const target = new THREE.Vector3();
  const spherical = new THREE.Spherical();
  const offset = new THREE.Vector3();
  const panX = new THREE.Vector3();
  const panY = new THREE.Vector3();
  const prevTarget = new THREE.Vector3();

  // Ponteiros aceitos por ESTE controle (id → última posição/botão). Um toque
  // que virou arrasto de brinquedo nunca entra aqui (enabled=false na hora).
  const pointers = new Map();
  let enabled = false;

  function syncSpherical() {
    offset.copy(camera.position).sub(target);
    spherical.setFromVector3(offset);
  }

  function applySpherical() {
    spherical.phi = THREE.MathUtils.clamp(spherical.phi, MIN_POLAR, MAX_POLAR);
    spherical.radius = THREE.MathUtils.clamp(spherical.radius, MIN_DISTANCE, MAX_DISTANCE);
    spherical.makeSafe();
    camera.position.setFromSpherical(spherical).add(target);
    camera.lookAt(target);
  }

  function rotate(dxPx, dyPx) {
    syncSpherical();
    const h = canvas.clientHeight || 1;
    spherical.theta -= (2 * Math.PI * dxPx) / h;
    spherical.phi -= (2 * Math.PI * dyPx) / h;
    applySpherical();
  }

  // Giro de dois dedos: a cena acompanha o twist (dAngle em coords de tela).
  function twist(dAngle) {
    syncSpherical();
    spherical.theta += dAngle;
    applySpherical();
  }

  function dolly(scale) {
    syncSpherical();
    spherical.radius *= scale;
    applySpherical();
  }

  function pan(dxPx, dyPx) {
    const h = canvas.clientHeight || 1;
    offset.copy(camera.position).sub(target);
    // Quanto 1px vale no mundo à distância atual (projeção em perspectiva).
    const worldPerPx =
      (2 * offset.length() * Math.tan(THREE.MathUtils.degToRad(camera.fov / 2))) / h;
    panX.setFromMatrixColumn(camera.matrix, 0).multiplyScalar(-dxPx * worldPerPx);
    panY.setFromMatrixColumn(camera.matrix, 1).multiplyScalar(dyPx * worldPerPx);
    prevTarget.copy(target);
    target.add(panX).add(panY);
    target.x = THREE.MathUtils.clamp(target.x, TARGET_BOUNDS.minX, TARGET_BOUNDS.maxX);
    target.y = THREE.MathUtils.clamp(target.y, TARGET_BOUNDS.minY, TARGET_BOUNDS.maxY);
    target.z = THREE.MathUtils.clamp(target.z, TARGET_BOUNDS.minZ, TARGET_BOUNDS.maxZ);
    // Câmera acompanha só o delta que sobrou do clamp — orientação intacta.
    camera.position.add(target).sub(prevTarget);
  }

  function otherPointer(excludeId) {
    for (const [id, p] of pointers) {
      if (id !== excludeId) return p;
    }
    return null;
  }

  function onPointerDown(event) {
    if (!enabled) return;
    if (event.pointerType === 'mouse' && event.button !== 0 && event.button !== 2) return;
    if (pointers.size >= 2) return; // terceiro dedo não muda o gesto
    pointers.set(event.pointerId, { x: event.clientX, y: event.clientY, button: event.button });
    try {
      canvas.setPointerCapture(event.pointerId);
    } catch {
      // ponteiros sintéticos (E2E) não têm ponteiro ativo — gesto segue sem captura
    }
  }

  function onPointerMove(event) {
    const prev = pointers.get(event.pointerId);
    if (!prev) return;
    const curr = { x: event.clientX, y: event.clientY, button: prev.button };
    pointers.set(event.pointerId, curr);
    if (!enabled) return;

    if (pointers.size === 1) {
      const dx = curr.x - prev.x;
      const dy = curr.y - prev.y;
      if (prev.button === 2) pan(dx, dy);
      else rotate(dx, dy);
      return;
    }

    // Dois dedos: decompõe o movimento em centróide (pan), distância (zoom)
    // e ângulo entre os dedos (giro) — tudo relativo ao outro dedo parado.
    const other = otherPointer(event.pointerId);
    if (!other) return;
    pan(
      (curr.x - prev.x) / 2,
      (curr.y - prev.y) / 2
    );
    const prevDist = Math.hypot(prev.x - other.x, prev.y - other.y);
    const currDist = Math.hypot(curr.x - other.x, curr.y - other.y);
    if (prevDist > 1 && currDist > 1) dolly(prevDist / currDist);
    let dAngle =
      Math.atan2(curr.y - other.y, curr.x - other.x) -
      Math.atan2(prev.y - other.y, prev.x - other.x);
    if (dAngle > Math.PI) dAngle -= 2 * Math.PI;
    if (dAngle < -Math.PI) dAngle += 2 * Math.PI;
    twist(dAngle);
  }

  function onPointerEnd(event) {
    if (!pointers.delete(event.pointerId)) return;
    if (canvas.hasPointerCapture(event.pointerId)) canvas.releasePointerCapture(event.pointerId);
  }

  function onWheel(event) {
    if (!enabled) return;
    event.preventDefault();
    dolly(event.deltaY > 0 ? 1.1 : 1 / 1.1);
  }

  canvas.addEventListener('pointerdown', onPointerDown);
  canvas.addEventListener('pointermove', onPointerMove);
  canvas.addEventListener('pointerup', onPointerEnd);
  canvas.addEventListener('pointercancel', onPointerEnd);
  canvas.addEventListener('wheel', onWheel, { passive: false });
  canvas.addEventListener('contextmenu', (event) => event.preventDefault());

  return {
    target,
    get enabled() {
      return enabled;
    },
    set enabled(value) {
      enabled = value;
      if (!value) pointers.clear(); // gesto em andamento morre junto
    },
  };
}
