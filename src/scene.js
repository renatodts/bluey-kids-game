// Palco: renderer, câmera fixa em perspectiva, luzes, sala e quadros. (GUARD-07, AD-002)
import * as THREE from 'three';

export const ROOM = {
  width: 15,
  depth: 10,
  wallHeight: 6,
  wallZ: -3.5,
  floorY: 0,
};

// Quadros na parede: placeholder de cor sólida (key art entra na T12 com fallback).
function createWallFrames() {
  const group = new THREE.Group();
  const colors = ['#4fa9e0', '#f6a531', '#e8748c'];
  colors.forEach((color, i) => {
    const border = new THREE.Mesh(
      new THREE.PlaneGeometry(2.4, 1.8),
      new THREE.MeshLambertMaterial({ color: '#8a5a33' })
    );
    border.position.set((i - 1) * 4.2, 3.6, ROOM.wallZ + 0.02);
    const panel = new THREE.Mesh(
      new THREE.PlaneGeometry(2.1, 1.5),
      new THREE.MeshLambertMaterial({ color })
    );
    panel.position.set((i - 1) * 4.2, 3.6, ROOM.wallZ + 0.03);
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

  scene.add(new THREE.AmbientLight(0xffffff, 1.1));
  const sun = new THREE.DirectionalLight(0xffffff, 2.4);
  sun.position.set(5, 10, 7);
  scene.add(sun);

  const floor = new THREE.Mesh(
    new THREE.PlaneGeometry(ROOM.width, ROOM.depth),
    new THREE.MeshLambertMaterial({ color: '#d9a066' })
  );
  floor.rotation.x = -Math.PI / 2;
  floor.position.set(0, ROOM.floorY, ROOM.wallZ + ROOM.depth / 2);
  scene.add(floor);

  const wall = new THREE.Mesh(
    new THREE.PlaneGeometry(ROOM.width, ROOM.wallHeight),
    new THREE.MeshLambertMaterial({ color: '#f7e8c9' })
  );
  wall.position.set(0, ROOM.wallHeight / 2, ROOM.wallZ);
  scene.add(wall);

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
