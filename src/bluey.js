// Bluey procedural: personagem de torcida com estados idle/cheer/dance.
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { toonMaterial } from './materials.js';

const easeInOut = (t) => (t < 0.5 ? 2 * t * t : 1 - (-2 * t + 2) ** 2 / 2);

const DEFAULT_CORNER = new THREE.Vector3(5.8, 0, -2.1);
const DEFAULT_CENTER = new THREE.Vector3(0, 0, 0.25);
const CHEER_DURATION = 1.6;

function markShadows(root) {
  root.traverse((node) => {
    if (!node.isMesh) return;
    node.castShadow = true;
    node.receiveShadow = true;
  });
  return root;
}

function ear(dx) {
  const group = new THREE.Group();
  const outer = new THREE.Mesh(new THREE.ConeGeometry(0.2, 0.55, 4), toonMaterial('#2f83c5'));
  outer.rotation.z = dx < 0 ? 0.28 : -0.28;
  outer.position.set(dx, 1.73, 0);
  const inner = new THREE.Mesh(new THREE.ConeGeometry(0.11, 0.34, 4), toonMaterial('#78c6ed'));
  inner.rotation.copy(outer.rotation);
  inner.position.set(dx * 1.01, 1.7, 0.03);
  group.add(outer, inner);
  return group;
}

function leg(dx) {
  const group = new THREE.Group();
  const upper = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.14, 0.5, 10), toonMaterial('#2f83c5'));
  upper.position.set(dx, 0.35, 0);
  const foot = new THREE.Mesh(new THREE.SphereGeometry(0.15, 12, 8), toonMaterial('#78c6ed'));
  foot.position.set(dx, 0.08, 0.12);
  foot.scale.set(1.25, 0.55, 1.55);
  group.add(upper, foot);
  return group;
}

function arm(dx) {
  const group = new THREE.Group();
  group.name = dx < 0 ? 'left-arm' : 'right-arm';
  const upper = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.1, 0.7, 10), toonMaterial('#2f83c5'));
  upper.position.y = -0.35;
  const paw = new THREE.Mesh(new THREE.SphereGeometry(0.11, 10, 8), toonMaterial('#78c6ed'));
  paw.position.y = -0.72;
  group.position.set(dx, 1.0, 0);
  group.rotation.z = dx < 0 ? 0.5 : -0.5;
  group.add(upper, paw);
  return group;
}

function buildProceduralBluey() {
  const root = new THREE.Group();
  root.name = 'bluey-procedural';

  const body = new THREE.Mesh(new THREE.SphereGeometry(0.45, 18, 14), toonMaterial('#2f83c5'));
  body.name = 'body';
  body.position.y = 0.82;
  body.scale.set(0.92, 1.18, 0.72);

  const belly = new THREE.Mesh(new THREE.SphereGeometry(0.32, 16, 12), toonMaterial('#78c6ed'));
  belly.position.set(0, 0.78, 0.24);
  belly.scale.set(0.86, 1.12, 0.32);

  const head = new THREE.Mesh(new THREE.SphereGeometry(0.43, 18, 14), toonMaterial('#2f83c5'));
  head.name = 'head';
  head.position.y = 1.38;
  head.scale.set(1.0, 0.92, 0.82);

  const muzzle = new THREE.Mesh(new THREE.SphereGeometry(0.22, 14, 10), toonMaterial('#f3c58d'));
  muzzle.position.set(0, 1.28, 0.35);
  muzzle.scale.set(1.25, 0.72, 0.85);

  const nose = new THREE.Mesh(new THREE.SphereGeometry(0.07, 10, 8), toonMaterial('#2d3142'));
  nose.position.set(0, 1.35, 0.52);
  nose.scale.set(1.25, 0.7, 0.8);

  const eyeMat = toonMaterial('#ffffff');
  const pupilMat = toonMaterial('#2d3142');
  for (const dx of [-0.15, 0.15]) {
    const eye = new THREE.Mesh(new THREE.SphereGeometry(0.08, 10, 8), eyeMat);
    eye.position.set(dx, 1.48, 0.37);
    eye.scale.set(0.8, 1.2, 0.45);
    const pupil = new THREE.Mesh(new THREE.SphereGeometry(0.035, 8, 6), pupilMat);
    pupil.position.set(dx, 1.47, 0.42);
    pupil.scale.set(0.8, 1.1, 0.4);
    root.add(eye, pupil);
  }

  const brow = new THREE.Mesh(new THREE.BoxGeometry(0.34, 0.06, 0.05), toonMaterial('#1f5f97'));
  brow.position.set(0, 1.62, 0.32);

  const tail = new THREE.Mesh(new THREE.ConeGeometry(0.11, 0.42, 10), toonMaterial('#2f83c5'));
  tail.position.set(0, 0.84, -0.47);
  tail.rotation.x = -Math.PI / 2.8;

  const leftArm = arm(-0.46);
  const rightArm = arm(0.46);
  root.userData.leftArm = leftArm;
  root.userData.rightArm = rightArm;

  root.add(body, belly, head, muzzle, nose, brow, tail, ear(-0.24), ear(0.24), leg(-0.2), leg(0.2), leftArm, rightArm);
  root.rotation.y = -0.55;
  return markShadows(root);
}

function loadGLTF(url) {
  const loader = new GLTFLoader();
  return new Promise((resolve, reject) => {
    loader.load(url, resolve, undefined, reject);
  });
}

function fitModelToBlueyScale(object) {
  markShadows(object);
  const box = new THREE.Box3().setFromObject(object);
  const size = box.getSize(new THREE.Vector3());
  if (size.y > 0) {
    const scale = 1.85 / size.y;
    object.scale.multiplyScalar(scale);
    box.setFromObject(object);
  }
  const center = box.getCenter(new THREE.Vector3());
  const minY = box.min.y;
  object.position.sub(new THREE.Vector3(center.x, minY, center.z));
  object.rotation.y = Math.PI;
  return object;
}

export async function loadBlueyModel() {
  try {
    const gltf = await loadGLTF('/bluey/bluey.glb');
    return { object: fitModelToBlueyScale(gltf.scene), animations: gltf.animations || [], source: 'gltf' };
  } catch {
    console.warn('[visual-bluey] modelo GLTF indisponível — usando Bluey procedural');
    return { object: buildProceduralBluey(), animations: [], source: 'procedural' };
  }
}

export function createBluey({ scene, cornerPosition = DEFAULT_CORNER, centerPosition = DEFAULT_CENTER } = {}) {
  const root = new THREE.Group();
  root.name = 'bluey-character';
  let model = buildProceduralBluey();
  let modelBaseScale = model.scale.clone();
  root.add(model);
  root.position.copy(cornerPosition);
  if (scene) scene.add(root);

  const corner = cornerPosition.clone();
  const center = centerPosition.clone();
  const tweens = [];
  let mode = 'idle';
  let modeTime = 0;
  let cheerTime = 0;
  let danceDuration = 0;
  let source = 'procedural';

  loadBlueyModel().then((loaded) => {
    root.remove(model);
    model = loaded.object;
    modelBaseScale = model.scale.clone();
    root.add(model);
    source = loaded.source;
  });

  function setModelScale(x, y, z) {
    model.scale.set(modelBaseScale.x * x, modelBaseScale.y * y, modelBaseScale.z * z);
  }

  function addTween(target, duration, onUpdate, onComplete) {
    tweens.push({ target, duration, elapsed: 0, onUpdate, onComplete });
  }

  function cancel(target) {
    for (let i = tweens.length - 1; i >= 0; i--) {
      if (tweens[i].target === target) tweens.splice(i, 1);
    }
  }

  function moveTo(position, duration, onComplete) {
    cancel(root);
    const start = root.position.clone();
    const end = position.clone();
    addTween(
      root,
      duration,
      (t) => root.position.lerpVectors(start, end, easeInOut(t)),
      onComplete
    );
  }

  function pose(dt) {
    const leftArm = model.userData.leftArm;
    const rightArm = model.userData.rightArm;
    modeTime += dt;

    if (mode === 'cheer') {
      cheerTime += dt;
      const bounce = Math.abs(Math.sin(modeTime * Math.PI * 4));
      root.position.y = bounce * 0.22;
      setModelScale(1 + bounce * 0.08, 1 - bounce * 0.04, 1 + bounce * 0.08);
      if (leftArm) leftArm.rotation.z = 1.25 + Math.sin(modeTime * 14) * 0.22;
      if (rightArm) rightArm.rotation.z = -1.25 - Math.sin(modeTime * 14) * 0.22;
      if (cheerTime >= CHEER_DURATION) {
        mode = 'idle';
        modeTime = 0;
        cheerTime = 0;
        root.position.y = 0;
      }
      return;
    }

    if (mode === 'dance') {
      danceDuration -= dt;
      root.position.y = Math.abs(Math.sin(modeTime * Math.PI * 3)) * 0.16;
      root.rotation.y = -0.55 + Math.sin(modeTime * 5) * 0.35;
      setModelScale(1.04, 0.96 + Math.sin(modeTime * 12) * 0.04, 1.04);
      if (leftArm) leftArm.rotation.z = 0.95 + Math.sin(modeTime * 8) * 0.45;
      if (rightArm) rightArm.rotation.z = -0.95 + Math.sin(modeTime * 8 + Math.PI) * 0.45;
      if (danceDuration <= 0) returnToCorner();
      return;
    }

    const bob = Math.sin(modeTime * 2.6) * 0.035;
    root.position.y = bob;
    root.rotation.y = -0.55;
    setModelScale(1, 1 + bob * 0.7, 1);
    if (leftArm) leftArm.rotation.z = 0.5 + Math.sin(modeTime * 2.2) * 0.06;
    if (rightArm) rightArm.rotation.z = -0.5 - Math.sin(modeTime * 2.2) * 0.06;
  }

  function cheer() {
    mode = 'cheer';
    modeTime = 0;
    cheerTime = 0;
    danceDuration = 0;
    cancel(root);
  }

  function danceAt(position = center, duration = 3) {
    mode = 'dance';
    modeTime = 0;
    cheerTime = 0;
    danceDuration = duration;
    moveTo(position, 0.55);
  }

  function returnToCorner() {
    mode = 'idle';
    modeTime = 0;
    cheerTime = 0;
    danceDuration = 0;
    root.position.y = 0;
    root.rotation.y = -0.55;
    moveTo(corner, 0.65);
  }

  function update(dt) {
    for (let i = tweens.length - 1; i >= 0; i--) {
      const tween = tweens[i];
      tween.elapsed += dt;
      const t = Math.min(tween.elapsed / tween.duration, 1);
      tween.onUpdate(t);
      if (t >= 1) {
        tweens.splice(i, 1);
        if (tween.onComplete) tween.onComplete();
      }
    }
    pose(dt);
  }

  return {
    object: root,
    cheer,
    danceAt,
    returnToCorner,
    update,
    get source() {
      return source;
    },
    get mode() {
      return mode;
    },
  };
}
