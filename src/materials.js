// Materiais toon compartilhados para manter o visual de desenho consistente.
import * as THREE from 'three';

const bands = new Uint8Array([80, 170, 255]);

export const GRADIENT_MAP = new THREE.DataTexture(bands, bands.length, 1, THREE.RedFormat);
GRADIENT_MAP.minFilter = THREE.NearestFilter;
GRADIENT_MAP.magFilter = THREE.NearestFilter;
GRADIENT_MAP.needsUpdate = true;

export function toonMaterial(color, extra = {}) {
  return new THREE.MeshToonMaterial({ color, gradientMap: GRADIENT_MAP, ...extra });
}
