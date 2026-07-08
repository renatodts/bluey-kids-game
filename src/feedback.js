// Resposta sensorial: tweens de acerto/erro (GUARD-02/03), confete e celebração (GUARD-05/08).
// Mini-tween próprio (lerp + easing) — sem dependências (design.md, Tech Decisions).
// Som (T11) e aparição da Bluey (T12) entram nas próximas tasks.
import * as THREE from 'three';

const easeOutCubic = (t) => 1 - (1 - t) ** 3;
const easeInQuad = (t) => t * t;

// Confete: pool FIXO de partículas (sem alocação em runtime — performance em tablet).
const CONFETTI_POOL = 150;
const CONFETTI_COLORS = ['#e8483f', '#f6a531', '#4fa9e0', '#7bc043', '#c98bdb', '#ffd166'];
const GRAVITY = 7;

function createConfetti(scene) {
  const geometry = new THREE.PlaneGeometry(0.14, 0.1);
  const material = new THREE.MeshBasicMaterial({ side: THREE.DoubleSide });
  const mesh = new THREE.InstancedMesh(geometry, material, CONFETTI_POOL);
  mesh.frustumCulled = false;
  const color = new THREE.Color();
  const particles = [];
  const dummy = new THREE.Object3D();
  dummy.scale.setScalar(0);
  for (let i = 0; i < CONFETTI_POOL; i++) {
    mesh.setColorAt(i, color.set(CONFETTI_COLORS[i % CONFETTI_COLORS.length]));
    dummy.updateMatrix();
    mesh.setMatrixAt(i, dummy.matrix);
    particles.push({ active: false, pos: new THREE.Vector3(), vel: new THREE.Vector3(), spin: 0, angle: 0, life: 0 });
  }
  mesh.instanceMatrix.needsUpdate = true;
  scene.add(mesh);

  function activate(pos, vel, life) {
    const p = particles.find((q) => !q.active);
    if (!p) return; // pool esgotado: simplesmente não emite (limite rígido)
    p.active = true;
    p.pos.copy(pos);
    p.vel.copy(vel);
    p.spin = (Math.random() - 0.5) * 10;
    p.angle = Math.random() * Math.PI;
    p.life = life;
  }

  // Explosãozinha na caixa a cada acerto. (GUARD-08.1)
  function burst(x, y, z, count = 18) {
    for (let i = 0; i < count; i++) {
      const a = Math.random() * Math.PI * 2;
      const r = 1.5 + Math.random() * 2;
      activate(
        new THREE.Vector3(x, y, z),
        new THREE.Vector3(Math.cos(a) * r * 0.6, 2.5 + Math.random() * 2.5, Math.sin(a) * r * 0.4),
        1.6
      );
    }
  }

  let rainTime = 0;

  // Chuva de confete da celebração grande. (GUARD-05, GUARD-08.2)
  function rain(duration = 3) {
    rainTime = duration;
  }

  function update(dt, floorY) {
    if (rainTime > 0) {
      rainTime -= dt;
      for (let i = 0; i < 3; i++) {
        activate(
          new THREE.Vector3((Math.random() - 0.5) * 13, 7.5, -2 + Math.random() * 6),
          new THREE.Vector3((Math.random() - 0.5) * 1.5, -1 - Math.random() * 1.5, 0),
          4
        );
      }
    }
    let any = false;
    particles.forEach((p, i) => {
      if (!p.active) return;
      any = true;
      p.life -= dt;
      p.vel.y -= GRAVITY * dt * (p.vel.y < -2 ? 0 : 1); // queda com arrasto (flutua como papel)
      p.pos.addScaledVector(p.vel, dt);
      p.angle += p.spin * dt;
      if (p.life <= 0 || p.pos.y < floorY + 0.02) {
        p.active = false;
        dummy.scale.setScalar(0);
      } else {
        dummy.scale.setScalar(1);
        dummy.position.copy(p.pos);
        dummy.rotation.set(p.angle, p.angle * 0.7, p.angle * 0.3);
      }
      dummy.updateMatrix();
      mesh.setMatrixAt(i, dummy.matrix);
    });
    if (any) mesh.instanceMatrix.needsUpdate = true;
  }

  return { burst, rain, update };
}

export function createFeedback({ scene, floorY }) {
  const tweens = [];
  const confetti = createConfetti(scene);

  function addTween(target, duration, onUpdate, onComplete) {
    tweens.push({ target, duration, elapsed: 0, onUpdate, onComplete });
  }

  // Cancela tweens do alvo sem onComplete (ex.: criança pega o brinquedo em pleno quique —
  // a animação nunca pode travar o arrasto seguinte).
  function cancel(target) {
    for (let i = tweens.length - 1; i >= 0; i--) {
      if (tweens[i].target === target) tweens.splice(i, 1);
    }
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
    confetti.update(dt, floorY);
  }

  // Pulinho feliz da caixa ao receber um brinquedo. (GUARD-02)
  function pulse(boxMesh) {
    cancel(boxMesh);
    addTween(
      boxMesh,
      0.35,
      (t) => {
        const s = 1 + Math.sin(t * Math.PI) * 0.12;
        boxMesh.scale.set(s, s, s);
      },
      () => boxMesh.scale.set(1, 1, 1)
    );
  }

  // Balançar "essa não!" — sem som negativo, sem punição. (GUARD-03)
  function wobble(boxMesh) {
    cancel(boxMesh);
    addTween(
      boxMesh,
      0.6,
      (t) => {
        boxMesh.rotation.z = Math.sin(t * Math.PI * 4) * 0.12 * (1 - t);
      },
      () => {
        boxMesh.rotation.z = 0;
      }
    );
  }

  // Sugar para a caixa com pulo + encolher; remove da cena ao final. (GUARD-02)
  function stored(toyMesh, box) {
    cancel(toyMesh);
    const sx = toyMesh.position.x;
    const sy = toyMesh.position.y;
    const sz = toyMesh.position.z;
    const targetY = floorY + 0.5;
    addTween(
      toyMesh,
      0.55,
      (t) => {
        const e = easeOutCubic(t);
        toyMesh.position.x = sx + (box.position.x - sx) * e;
        toyMesh.position.z = sz + (box.position.z - sz) * e;
        toyMesh.position.y = sy + (targetY - sy) * t + Math.sin(t * Math.PI) * 1.4;
        const shrink = t < 0.6 ? 1 : 1 - easeInQuad((t - 0.6) / 0.4) * 0.92;
        toyMesh.scale.set(shrink, shrink, shrink);
      },
      () => scene.remove(toyMesh)
    );
    pulse(box.mesh);
    confetti.burst(box.position.x, floorY + 1.2, box.position.z); // (GUARD-08.1)
  }

  // Celebração grande ao completar a rodada: chuva de confete + caixas pulando. (GUARD-05, GUARD-08.2)
  function roundComplete(boxes) {
    confetti.rain(3);
    for (const box of boxes) pulse(box.mesh);
  }

  // Quicar de volta ao spawn em pulinhos decrescentes. (GUARD-03)
  function rejected(toyMesh, box, spawn) {
    cancel(toyMesh);
    const sx = toyMesh.position.x;
    const sy = toyMesh.position.y;
    const sz = toyMesh.position.z;
    addTween(
      toyMesh,
      0.7,
      (t) => {
        toyMesh.position.x = sx + (spawn.x - sx) * t;
        toyMesh.position.z = sz + (spawn.z - sz) * t;
        const hop = Math.abs(Math.sin(t * Math.PI * 2)) * 0.9 * (1 - t * 0.7);
        toyMesh.position.y = sy + (floorY - sy) * Math.min(t * 2, 1) + hop;
      },
      () => {
        toyMesh.position.set(spawn.x, floorY, spawn.z);
        toyMesh.updateMatrixWorld(true);
      }
    );
    wobble(box.mesh);
  }

  // Assentar suavemente no chão onde foi solto (fora de caixa). (GUARD-03)
  function settle(toyMesh, pos) {
    cancel(toyMesh);
    const sy = toyMesh.position.y;
    addTween(
      toyMesh,
      0.3,
      (t) => {
        toyMesh.position.y = sy + (floorY - sy) * easeOutCubic(t);
      },
      () => {
        toyMesh.position.set(pos.x, floorY, pos.z);
        toyMesh.updateMatrixWorld(true);
      }
    );
  }

  return { update, cancel, stored, rejected, settle, roundComplete };
}
