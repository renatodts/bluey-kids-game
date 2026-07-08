// Palco: renderer, câmera fixa em perspectiva, luzes, sala e quadros. (GUARD-07, AD-002)
import * as THREE from 'three';
import { toonMaterial } from './materials.js';
import { createRoom } from './room.js';

export const ROOM = {
  width: 15,
  depth: 10,
  wallHeight: 6,
  wallZ: -3.5,
  floorY: 0,
};

// Status do tema Bluey (lido pelo hook de teste): quantas artes oficiais carregaram.
// Sem arte, o jogo segue com os painéis de cor sólida. (GUARD-08.3/.4)
export const themeStatus = {
  framesLoaded: 0,
  plaquesLoaded: 0,
};

// Aplica arte oficial num mesh quando (e só quando) a textura carrega; em falha,
// mantém o material de cor sólida — o fallback É o estado inicial. (GUARD-08.4)
export function applyArtTexture(mesh, url, onLoad) {
  new THREE.TextureLoader().load(
    url,
    (texture) => {
      texture.colorSpace = THREE.SRGBColorSpace;
      mesh.material.map = texture;
      mesh.material.color.set('#ffffff');
      mesh.material.needsUpdate = true;
      if (onLoad) onLoad(texture);
    },
    undefined,
    () => console.warn(`[hora-de-guardar] arte indisponível (${url}) — usando cor sólida`)
  );
}

// Quadros na parede: key art oficial com fallback de cor sólida. (GUARD-08.3)
const FRAME_ART = [
  { url: '/bluey/frame-1.jpg', w: 1.35, h: 1.9 }, // retrato
  { url: '/bluey/frame-2.jpg', w: 2.4, h: 1.35 }, // paisagem
  { url: '/bluey/frame-3.jpg', w: 2.4, h: 1.35 }, // paisagem
];

function createWallFrames() {
  const group = new THREE.Group();
  const colors = ['#4fa9e0', '#f6a531', '#e8748c'];
  FRAME_ART.forEach(({ url, w, h }, i) => {
    const border = new THREE.Mesh(
      new THREE.PlaneGeometry(w + 0.3, h + 0.3),
      toonMaterial('#8a5a33')
    );
    border.position.set((i - 1) * 4.2, 3.6, ROOM.wallZ + 0.02);
    const panel = new THREE.Mesh(
      new THREE.PlaneGeometry(w, h),
      toonMaterial(colors[i])
    );
    panel.position.set((i - 1) * 4.2, 3.6, ROOM.wallZ + 0.03);
    applyArtTexture(panel, url, () => {
      themeStatus.framesLoaded += 1;
    });
    group.add(border, panel);
  });
  return group;
}

export function createScene(canvas) {
  const scene = new THREE.Scene();
  scene.background = new THREE.Color('#bfe6f2');

  const camera = new THREE.PerspectiveCamera(50, 1, 0.1, 100);

  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;

  scene.add(new THREE.AmbientLight(0xfff2d2, 1.0));
  const sun = new THREE.DirectionalLight(0xffd38a, 2.8);
  sun.position.set(4.5, 9, 5.5);
  sun.castShadow = true;
  sun.shadow.mapSize.set(1024, 1024);
  sun.shadow.camera.left = -ROOM.width / 2;
  sun.shadow.camera.right = ROOM.width / 2;
  sun.shadow.camera.top = ROOM.depth / 2;
  sun.shadow.camera.bottom = -ROOM.depth / 2;
  sun.shadow.camera.near = 1;
  sun.shadow.camera.far = 20;
  scene.add(sun);

  const floor = new THREE.Mesh(
    new THREE.PlaneGeometry(ROOM.width, ROOM.depth),
    toonMaterial('#d9a066')
  );
  floor.rotation.x = -Math.PI / 2;
  floor.position.set(0, ROOM.floorY, ROOM.wallZ + ROOM.depth / 2);
  floor.receiveShadow = true;
  scene.add(floor);

  const wall = new THREE.Mesh(
    new THREE.PlaneGeometry(ROOM.width, ROOM.wallHeight),
    toonMaterial('#f7e8c9')
  );
  wall.position.set(0, ROOM.wallHeight / 2, ROOM.wallZ);
  wall.receiveShadow = true;
  scene.add(wall);

  scene.add(createRoom());
  scene.add(createWallFrames());

  // Câmera fixa: sem órbita/zoom. Resize mantém a sala inteira visível
  // afastando a câmera quando a tela é estreita (retrato funcional).
  function onResize() {
    const width = canvas.clientWidth || window.innerWidth;
    const height = canvas.clientHeight || window.innerHeight;
    renderer.setSize(width, height, false);
    camera.aspect = width / height;
    const baseDistance = 12.5;
    const widen = camera.aspect >= 1.15 ? 1 : 1.15 / Math.max(camera.aspect, 0.35);
    camera.position.set(0, 7.5, baseDistance * widen);
    camera.lookAt(0, 0.8, 0);
    camera.updateProjectionMatrix();
  }
  onResize();

  return { scene, camera, renderer, floorY: ROOM.floorY, onResize };
}
