// Fábrica de brinquedos low-poly: ball, block, plush. Sem assets externos. (GUARD-04 visual)
import * as THREE from 'three';
import { toonMaterial } from './materials.js';

// Brilho pulsante: destaca o brinquedo da sala mesmo sem luz direta em cima.
// Emissivo sozinho satura em branco nas cores já bem vivas dos brinquedos, então
// o brilho de verdade vem de um halo aditivo no chão (imune à cor do material).
const GLOW_MIN = 0.1;
const GLOW_AMPLITUDE = 0.25;
const GLOW_SPEED = 2.1; // rad/s — ciclo completo a cada ~3s

const HALO_SCALE = 1.9; // raio do halo relativo ao raio do brinquedo
const HALO_OPACITY_MIN = 0.25;
const HALO_OPACITY_AMPLITUDE = 0.4;
const HALO_SCALE_MIN = 0.9;
const HALO_SCALE_AMPLITUDE = 0.25;

// Esfera invisível de captura maior que o modelo, pra facilitar o toque (raio x1.5).
const HIT_AREA_SCALE = 1.5;

let haloTexture = null;
function glowHaloTexture() {
  if (haloTexture) return haloTexture;
  const size = 128;
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = size;
  const ctx = canvas.getContext('2d');
  const gradient = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
  gradient.addColorStop(0, 'rgba(255,255,255,1)');
  gradient.addColorStop(0.5, 'rgba(255,255,255,0.4)');
  gradient.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, size, size);
  haloTexture = new THREE.CanvasTexture(canvas);
  return haloTexture;
}

function markShadows(root) {
  root.traverse((node) => {
    if (!node.isMesh) return;
    node.castShadow = true;
    node.receiveShadow = true;
  });
  return root;
}

// Emissivo na própria cor: um brilho sutil que soma ao halo do chão.
function glowMaterial(color) {
  return toonMaterial(color, { emissive: color, emissiveIntensity: GLOW_MIN });
}

function addHitArea(group, sphere) {
  const hitArea = new THREE.Mesh(
    new THREE.SphereGeometry(sphere.radius * HIT_AREA_SCALE, 12, 8),
    new THREE.MeshBasicMaterial({ visible: false })
  );
  hitArea.position.copy(sphere.center);
  group.add(hitArea);
}

// Poça de luz no chão sob o brinquedo — visível mesmo quando o material já é claro.
function addGlowHalo(group, sphere) {
  const halo = new THREE.Mesh(
    new THREE.CircleGeometry(sphere.radius * HALO_SCALE, 24),
    new THREE.MeshBasicMaterial({
      map: glowHaloTexture(),
      color: '#fff6c2',
      transparent: true,
      opacity: HALO_OPACITY_MIN,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    })
  );
  halo.rotation.x = -Math.PI / 2;
  halo.position.set(sphere.center.x, 0.02, sphere.center.z);
  group.add(halo);
  group.userData.glowHalo = halo;
}

function createBall(color) {
  const group = new THREE.Group();
  const sphere = new THREE.Mesh(new THREE.SphereGeometry(0.45, 20, 14), glowMaterial(color));
  sphere.position.y = 0.45;
  const stripe = new THREE.Mesh(new THREE.TorusGeometry(0.45, 0.06, 10, 24), glowMaterial('#ffffff'));
  stripe.position.y = 0.45;
  stripe.rotation.x = Math.PI / 2;
  group.add(sphere, stripe);
  return group;
}

function createBlock(color) {
  const group = new THREE.Group();
  const base = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.5, 0.5), glowMaterial(color));
  base.position.y = 0.25;
  group.add(base);
  for (const dx of [-0.175, 0.175]) {
    for (const dz of [-0.125, 0.125]) {
      const stud = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.09, 0.12, 12), glowMaterial(color));
      stud.position.set(dx, 0.56, dz);
      group.add(stud);
    }
  }
  return group;
}

function createPlush(color) {
  const group = new THREE.Group();
  const body = new THREE.Mesh(new THREE.SphereGeometry(0.35, 16, 12), glowMaterial(color));
  body.position.y = 0.32;
  body.scale.y = 0.95;
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.25, 16, 12), glowMaterial(color));
  head.position.y = 0.78;
  const snout = new THREE.Mesh(new THREE.SphereGeometry(0.1, 10, 8), glowMaterial('#f5e6c8'));
  snout.position.set(0, 0.72, 0.2);
  const earMaterial = glowMaterial(color);
  for (const dx of [-0.18, 0.18]) {
    const ear = new THREE.Mesh(new THREE.SphereGeometry(0.09, 10, 8), earMaterial);
    ear.position.set(dx, 0.98, 0);
    group.add(ear);
  }
  group.add(body, head, snout);
  return group;
}

const BUILDERS = { ball: createBall, block: createBlock, plush: createPlush };

export function createToyMesh(type, color, toyId) {
  const group = BUILDERS[type](color);
  group.userData.type = type;
  if (toyId !== undefined) group.userData.toyId = toyId;
  markShadows(group);
  group.updateMatrixWorld(true);
  const box = new THREE.Box3().setFromObject(group);
  const sphere = new THREE.Sphere();
  box.getBoundingSphere(sphere);
  addHitArea(group, sphere);
  addGlowHalo(group, sphere);
  return group;
}

// Chamado a cada frame (main.js) pra variar o brilho do brinquedo e o halo no chão.
export function updateToyGlow(mesh, elapsed) {
  const pulse = 0.5 + 0.5 * Math.sin(elapsed * GLOW_SPEED);
  const intensity = GLOW_MIN + GLOW_AMPLITUDE * pulse;
  mesh.traverse((node) => {
    if (node.isMesh && node.material && 'emissiveIntensity' in node.material) {
      node.material.emissiveIntensity = intensity;
    }
  });
  const halo = mesh.userData.glowHalo;
  if (halo) {
    halo.material.opacity = HALO_OPACITY_MIN + HALO_OPACITY_AMPLITUDE * pulse;
    const scale = HALO_SCALE_MIN + HALO_SCALE_AMPLITUDE * pulse;
    halo.scale.set(scale, scale, scale);
  }
}
