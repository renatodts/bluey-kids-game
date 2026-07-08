// Conteúdo artístico da sala dos Heeler: mobília baixa/lateral e janela ensolarada.
import * as THREE from 'three';
import { FLOOR_BOUNDS } from './game.js';
import { toonMaterial } from './materials.js';

export const ROOM_CLEARANCE = { ...FLOOR_BOUNDS };

const ROOM_FLOOR_Y = 0;
const ROOM_WALL_Z = -3.5;

function markShadows(root) {
  root.traverse((node) => {
    if (!node.isMesh) return;
    node.castShadow = true;
    node.receiveShadow = true;
  });
  return root;
}

function roundedCushion(width, height, depth, color) {
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(width, height, depth), toonMaterial(color));
  mesh.scale.set(1, 1, 1);
  return mesh;
}

function createSofa() {
  const group = new THREE.Group();
  group.name = 'heeler-sofa';

  const base = roundedCushion(3.8, 0.55, 1.0, '#f2a65a');
  base.position.set(-4.7, 0.55, -3.05);
  const back = roundedCushion(4.0, 1.25, 0.28, '#d97945');
  back.position.set(-4.7, 1.05, -3.48);
  const leftArm = roundedCushion(0.32, 0.85, 1.08, '#d97945');
  leftArm.position.set(-6.85, 0.8, -3.03);
  const rightArm = roundedCushion(0.32, 0.85, 1.08, '#d97945');
  rightArm.position.set(-2.55, 0.8, -3.03);

  for (const [x, color] of [
    [-5.6, '#4fa9e0'],
    [-4.55, '#ffd166'],
    [-3.55, '#7bc043'],
  ]) {
    const pillow = roundedCushion(0.72, 0.46, 0.18, color);
    pillow.position.set(x, 1.12, -2.5);
    pillow.rotation.x = -0.12;
    group.add(pillow);
  }

  group.add(base, back, leftArm, rightArm);
  return markShadows(group);
}

function createRug() {
  const rug = new THREE.Mesh(
    new THREE.CircleGeometry(2.7, 36),
    toonMaterial('#4fa9e0', { side: THREE.DoubleSide })
  );
  rug.name = 'sunburst-rug';
  rug.rotation.x = -Math.PI / 2;
  rug.position.set(1.0, ROOM_FLOOR_Y + 0.015, 0.9);
  rug.scale.z = 0.62;
  rug.receiveShadow = true;

  const ring = new THREE.Mesh(
    new THREE.TorusGeometry(2.72, 0.07, 8, 48),
    toonMaterial('#ffd166')
  );
  ring.name = 'sunburst-rug-trim';
  ring.rotation.x = Math.PI / 2;
  ring.position.copy(rug.position);
  ring.scale.z = rug.scale.z;
  ring.receiveShadow = true;

  const group = new THREE.Group();
  group.name = 'heeler-rug';
  group.add(rug, ring);
  return group;
}

function createWindow() {
  const group = new THREE.Group();
  group.name = 'sunny-yard-window';

  const yard = new THREE.Mesh(new THREE.PlaneGeometry(3.4, 2.2), toonMaterial('#8fd37f'));
  yard.position.set(3.9, 3.25, ROOM_WALL_Z + 0.04);
  const sky = new THREE.Mesh(new THREE.PlaneGeometry(3.4, 1.25), toonMaterial('#7ecff2'));
  sky.position.set(3.9, 3.72, ROOM_WALL_Z + 0.05);
  const sun = new THREE.Mesh(new THREE.CircleGeometry(0.34, 24), toonMaterial('#ffd166'));
  sun.position.set(2.85, 4.1, ROOM_WALL_Z + 0.06);

  const frameMat = toonMaterial('#8a5a33');
  const frameTop = new THREE.Mesh(new THREE.BoxGeometry(3.75, 0.18, 0.1), frameMat);
  frameTop.position.set(3.9, 4.45, ROOM_WALL_Z + 0.12);
  const frameBottom = frameTop.clone();
  frameBottom.position.y = 2.05;
  const frameLeft = new THREE.Mesh(new THREE.BoxGeometry(0.18, 2.55, 0.1), frameMat);
  frameLeft.position.set(2.0, 3.25, ROOM_WALL_Z + 0.12);
  const frameRight = frameLeft.clone();
  frameRight.position.x = 5.8;
  const mullionV = new THREE.Mesh(new THREE.BoxGeometry(0.12, 2.35, 0.11), frameMat);
  mullionV.position.set(3.9, 3.25, ROOM_WALL_Z + 0.13);
  const mullionH = new THREE.Mesh(new THREE.BoxGeometry(3.55, 0.12, 0.11), frameMat);
  mullionH.position.set(3.9, 3.25, ROOM_WALL_Z + 0.13);

  group.add(yard, sky, sun, frameTop, frameBottom, frameLeft, frameRight, mullionV, mullionH);
  return markShadows(group);
}

function createSideTable() {
  const group = new THREE.Group();
  group.name = 'heeler-side-table';
  const top = new THREE.Mesh(new THREE.CylinderGeometry(0.55, 0.65, 0.18, 18), toonMaterial('#b46d3f'));
  top.position.set(6.55, 0.72, -2.9);
  const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.16, 0.7, 12), toonMaterial('#8a5a33'));
  leg.position.set(6.55, 0.35, -2.9);
  const lamp = new THREE.Mesh(new THREE.ConeGeometry(0.45, 0.6, 18), toonMaterial('#ffd166'));
  lamp.position.set(6.55, 1.2, -2.9);
  group.add(top, leg, lamp);
  return markShadows(group);
}

export function createRoom() {
  const group = new THREE.Group();
  group.name = 'heeler-living-room';
  group.add(createSofa(), createRug(), createWindow(), createSideTable());
  return group;
}
