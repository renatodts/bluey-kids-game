// Fábrica de brinquedos low-poly: ball, block, plush. Sem assets externos. (GUARD-04 visual)
import * as THREE from 'three';
import { toonMaterial } from './materials.js';

function markShadows(root) {
  root.traverse((node) => {
    if (!node.isMesh) return;
    node.castShadow = true;
    node.receiveShadow = true;
  });
  return root;
}

function createBall(color) {
  const group = new THREE.Group();
  const sphere = new THREE.Mesh(new THREE.SphereGeometry(0.45, 20, 14), toonMaterial(color));
  sphere.position.y = 0.45;
  const stripe = new THREE.Mesh(new THREE.TorusGeometry(0.45, 0.06, 10, 24), toonMaterial('#ffffff'));
  stripe.position.y = 0.45;
  stripe.rotation.x = Math.PI / 2;
  group.add(sphere, stripe);
  return group;
}

function createBlock(color) {
  const group = new THREE.Group();
  const base = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.5, 0.5), toonMaterial(color));
  base.position.y = 0.25;
  group.add(base);
  for (const dx of [-0.175, 0.175]) {
    for (const dz of [-0.125, 0.125]) {
      const stud = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.09, 0.12, 12), toonMaterial(color));
      stud.position.set(dx, 0.56, dz);
      group.add(stud);
    }
  }
  return group;
}

function createPlush(color) {
  const group = new THREE.Group();
  const body = new THREE.Mesh(new THREE.SphereGeometry(0.35, 16, 12), toonMaterial(color));
  body.position.y = 0.32;
  body.scale.y = 0.95;
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.25, 16, 12), toonMaterial(color));
  head.position.y = 0.78;
  const snout = new THREE.Mesh(new THREE.SphereGeometry(0.1, 10, 8), toonMaterial('#f5e6c8'));
  snout.position.set(0, 0.72, 0.2);
  const earMaterial = toonMaterial(color);
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
  return markShadows(group);
}
