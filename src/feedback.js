// Resposta sensorial: tweens de acerto/erro. (GUARD-02, GUARD-03)
// Mini-tween próprio (lerp + easing) — sem dependências (design.md, Tech Decisions).
// Confete/celebração (T10), som (T11) e Bluey (T12) entram nas próximas tasks.

const easeOutCubic = (t) => 1 - (1 - t) ** 3;
const easeInQuad = (t) => t * t;

export function createFeedback({ scene, floorY }) {
  const tweens = [];

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

  return { update, cancel, stored, rejected, settle };
}
