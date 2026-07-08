// Caixas-alvo: cesta (bolas), baú (blocos), caminha (bichinhos). (GUARD-02/03 alvos, GUARD-08 estrutura)
import * as THREE from 'three';
import { applyArtTexture, themeStatus } from './scene.js';
import { toonMaterial } from './materials.js';

function markShadows(root) {
  root.traverse((node) => {
    if (!node.isMesh) return;
    node.castShadow = true;
    node.receiveShadow = true;
  });
  return root;
}

// Placa de personagem com arte oficial (Bluey→cesta, Bingo→baú, Chilli→caminha);
// sem textura (ou falha de carga), o material de cor sólida É o fallback. (GUARD-08.3/.4)
const PLAQUE_ART = { ball: '/bluey/plaque-bluey.png', block: '/bluey/plaque-bingo.png', plush: '/bluey/plaque-chilli.png' };

function createPlaque(type, fallbackColor) {
  const plaque = new THREE.Mesh(new THREE.PlaneGeometry(0.9, 0.9), toonMaterial(fallbackColor));
  plaque.name = `plaque-${type}`;
  applyArtTexture(plaque, PLAQUE_ART[type], () => {
    plaque.material.transparent = true; // PNG de personagem com fundo alpha
    themeStatus.plaquesLoaded += 1;
  });
  return plaque;
}

function createBasket() {
  const group = new THREE.Group();
  const side = new THREE.Mesh(
    new THREE.CylinderGeometry(1.0, 0.8, 0.9, 18, 1, true),
    toonMaterial('#c98d4e', { side: THREE.DoubleSide })
  );
  side.position.y = 0.45;
  const bottom = new THREE.Mesh(new THREE.CircleGeometry(0.8, 18), toonMaterial('#b57c40'));
  bottom.rotation.x = -Math.PI / 2;
  bottom.position.y = 0.02;
  const rim = new THREE.Mesh(new THREE.TorusGeometry(1.0, 0.07, 8, 24), toonMaterial('#a86f38'));
  rim.rotation.x = Math.PI / 2;
  rim.position.y = 0.9;
  const plaque = createPlaque('ball', '#4fa9e0'); // Bluey
  plaque.position.set(0, 0.5, 1.02);
  group.add(side, bottom, rim, plaque);
  return markShadows(group);
}

function createChest() {
  const group = new THREE.Group();
  const body = new THREE.Mesh(new THREE.BoxGeometry(2.0, 0.9, 1.3), toonMaterial('#8a5a33'));
  body.position.y = 0.45;
  const lid = new THREE.Mesh(
    new THREE.CylinderGeometry(0.65, 0.65, 2.0, 14, 1, false, 0, Math.PI),
    toonMaterial('#a06a3d')
  );
  lid.rotation.z = Math.PI / 2;
  lid.position.set(0, 0.9, -0.35);
  const plaque = createPlaque('block', '#e8944a'); // Bingo
  plaque.position.set(0, 0.5, 0.66);
  group.add(body, lid, plaque);
  return markShadows(group);
}

function createBed() {
  const group = new THREE.Group();
  const base = new THREE.Mesh(new THREE.BoxGeometry(2.2, 0.4, 1.4), toonMaterial('#b0623c'));
  base.position.y = 0.2;
  const mattress = new THREE.Mesh(new THREE.BoxGeometry(2.05, 0.25, 1.25), toonMaterial('#f2f2f2'));
  mattress.position.y = 0.5;
  const pillow = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.2, 1.0), toonMaterial('#ffd166'));
  pillow.position.set(-0.65, 0.7, 0);
  const headboard = new THREE.Mesh(new THREE.BoxGeometry(0.12, 1.0, 1.4), toonMaterial('#b0623c'));
  headboard.position.set(-1.1, 0.5, 0);
  const plaque = createPlaque('plush', '#d95d4e'); // Chilli
  plaque.position.set(0.3, 0.4, 0.71);
  group.add(base, mattress, pillow, headboard, plaque);
  return markShadows(group);
}

const BOX_DEFS = [
  { type: 'ball', build: createBasket, x: -4.5 },
  { type: 'block', build: createChest, x: 0 },
  { type: 'plush', build: createBed, x: 4.5 },
];

const BOX_Z = 5;
const SNAP_RADIUS = 1.7; // generoso: alvo fácil para dedos de 4 anos

export function createBoxes() {
  return BOX_DEFS.map(({ type, build, x }) => {
    const mesh = build();
    mesh.position.set(x, 0, BOX_Z);
    mesh.userData.boxType = type;
    return { mesh, type, snapRadius: SNAP_RADIUS, position: { x, z: BOX_Z } };
  });
}
