// Arrasto unificado touch+mouse via Pointer Events: raycast pega o brinquedo,
// o movimento fica preso ao plano do chão com clamp na sala. (GUARD-01, AD-003)
import * as THREE from 'three';
import { FLOOR_BOUNDS } from './game.js';

const DRAG_LIFT = 0.8; // elevação do brinquedo enquanto arrastado

export function createDrag({ camera, canvas, toys, floorY, onDrop, onPick }) {
  const raycaster = new THREE.Raycaster();
  const pointerNdc = new THREE.Vector2();
  const floorPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), -floorY);
  const hitPoint = new THREE.Vector3();

  let activePointerId = null;
  let draggedToy = null;

  function toNdc(event) {
    const rect = canvas.getBoundingClientRect();
    pointerNdc.set(
      ((event.clientX - rect.left) / rect.width) * 2 - 1,
      -((event.clientY - rect.top) / rect.height) * 2 + 1
    );
  }

  function findToyRoot(object) {
    let node = object;
    while (node) {
      if (node.userData.toyId !== undefined) return node;
      node = node.parent;
    }
    return null;
  }

  function floorPointFromEvent(event) {
    toNdc(event);
    raycaster.setFromCamera(pointerNdc, camera);
    if (!raycaster.ray.intersectPlane(floorPlane, hitPoint)) return null;
    return {
      x: THREE.MathUtils.clamp(hitPoint.x, FLOOR_BOUNDS.minX, FLOOR_BOUNDS.maxX),
      z: THREE.MathUtils.clamp(hitPoint.z, FLOOR_BOUNDS.minZ, FLOOR_BOUNDS.maxZ),
    };
  }

  function onPointerDown(event) {
    // Só o primeiro ponteiro arrasta; um segundo dedo é ignorado. (GUARD-01)
    if (activePointerId !== null) return;
    toNdc(event);
    raycaster.setFromCamera(pointerNdc, camera);
    const hits = raycaster.intersectObjects(toys, true);
    if (hits.length === 0) return; // primeiro hit = mais próximo da câmera
    const toy = findToyRoot(hits[0].object);
    if (!toy) return;
    if (onPick && !onPick(toy.userData.toyId)) return;
    activePointerId = event.pointerId;
    draggedToy = toy;
    try {
      canvas.setPointerCapture(event.pointerId);
    } catch {
      // PointerEvents sintéticos (E2E) não têm ponteiro ativo — arrasto segue sem captura
    }
    const point = floorPointFromEvent(event);
    if (point) draggedToy.position.set(point.x, floorY + DRAG_LIFT, point.z);
  }

  function onPointerMove(event) {
    if (event.pointerId !== activePointerId || !draggedToy) return;
    const point = floorPointFromEvent(event);
    if (point) draggedToy.position.set(point.x, floorY + DRAG_LIFT, point.z);
  }

  function endDrag(event) {
    if (event.pointerId !== activePointerId || !draggedToy) return;
    const toy = draggedToy;
    activePointerId = null;
    draggedToy = null;
    if (canvas.hasPointerCapture(event.pointerId)) canvas.releasePointerCapture(event.pointerId);
    // Acerto por paralaxe em tela só num soltar deliberado; cancel/saída da janela
    // solta como "fora de caixa" — assenta no chão. (edge case da spec)
    const deliberate = event.type === 'pointerup';
    onDrop(
      toy.userData.toyId,
      { x: toy.position.x, z: toy.position.z },
      deliberate ? { x: event.clientX, y: event.clientY } : null
    );
  }

  // Sem pointer capture (ex.: eventos sintéticos), sair da janela encerra o arrasto
  // como "solto fora". Com capture, os eventos continuam chegando — não interfere.
  function onPointerLeave(event) {
    if (event.pointerId !== activePointerId || !draggedToy) return;
    if (canvas.hasPointerCapture(event.pointerId)) return;
    endDrag(event);
  }

  canvas.addEventListener('pointerdown', onPointerDown);
  canvas.addEventListener('pointermove', onPointerMove);
  canvas.addEventListener('pointerup', endDrag);
  canvas.addEventListener('pointercancel', endDrag);
  canvas.addEventListener('pointerleave', onPointerLeave);
}
