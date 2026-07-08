// Resposta sensorial: tweens de acerto/erro (GUARD-02/03), confete e celebração (GUARD-05/08),
// som festivo via WebAudio (GUARD-09), música de fundo em loop com duck automático e toque
// de erro bem-humorado (MUS-01..04, .specs/features/musica-e-sons). Mini-tween próprio
// (lerp + easing) — sem dependências (design.md, Tech Decisions). Bluey é injetada por
// main.js e reage sem bloquear input.
// SPEC_DEVIATION: sons sintetizados com osciladores WebAudio em vez de arquivos de kenney.nl.
// Reason: zero dependência de rede/asset em runtime e sem risco de licença; design.md já
// previa WebAudio direto e a spec só pede "sons livres genéricos".
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

// Musiquinha de fundo: loop de ~4.8s numa escala pentatônica, tocando bem baixo
// por baixo dos efeitos. Agendada com lookahead a partir de ctx.currentTime (não
// de dt do jogo), então não deriva mesmo com frames irregulares. (MUS-01)
const MUSIC_LOOP_DURATION = 4.8;
const MUSIC_BASE_GAIN = 0.05;
const MUSIC_DUCK_GAIN = 0.012;
const MUSIC_LOOKAHEAD = 0.5;
const MUSIC_PATTERN = [
  // melodia saltitante (C D E G A)
  { f: 523.25, t: 0.0, d: 0.34, type: 'triangle', peak: 0.5 },
  { f: 587.33, t: 0.4, d: 0.34, type: 'triangle', peak: 0.45 },
  { f: 659.25, t: 0.8, d: 0.34, type: 'triangle', peak: 0.5 },
  { f: 783.99, t: 1.2, d: 0.5, type: 'triangle', peak: 0.55 },
  { f: 659.25, t: 1.8, d: 0.34, type: 'triangle', peak: 0.45 },
  { f: 587.33, t: 2.2, d: 0.34, type: 'triangle', peak: 0.45 },
  { f: 523.25, t: 2.6, d: 0.5, type: 'triangle', peak: 0.5 },
  { f: 440.0, t: 3.3, d: 0.34, type: 'triangle', peak: 0.4 },
  { f: 523.25, t: 3.7, d: 0.9, type: 'triangle', peak: 0.5 },
  // baixo de apoio, uma oitava abaixo
  { f: 261.63, t: 0.0, d: 1.1, type: 'sine', peak: 0.35 },
  { f: 293.66, t: 1.2, d: 0.55, type: 'sine', peak: 0.3 },
  { f: 261.63, t: 2.6, d: 0.65, type: 'sine', peak: 0.3 },
  { f: 220.0, t: 3.3, d: 1.3, type: 'sine', peak: 0.3 },
];

// Som: destravado no gesto do play; se o navegador bloquear, o jogo segue mudo. (GUARD-09)
function createAudio() {
  let ctx = null;
  let unlocked = false;
  let soundsPlayed = 0;
  let musicBus = null;
  let musicRunning = false;
  let musicNextLoopAt = 0;

  async function unlock() {
    try {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return false;
      if (!ctx) ctx = new AC();
      await ctx.resume();
      unlocked = ctx.state === 'running';
      if (unlocked) startMusic(); // (MUS-01)
    } catch {
      unlocked = false; // segue funcional em silêncio (GUARD-09.3)
    }
    return unlocked;
  }

  function noteTo(destination, freq, atTime, dur, type, peak) {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = type;
    osc.frequency.value = freq;
    gain.gain.setValueAtTime(0.0001, atTime);
    gain.gain.exponentialRampToValueAtTime(peak, atTime + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, atTime + dur);
    osc.connect(gain).connect(destination);
    osc.start(atTime);
    osc.stop(atTime + dur + 0.05);
  }

  function note(freq, start, dur, type = 'sine', peak = 0.2) {
    noteTo(ctx.destination, freq, ctx.currentTime + start, dur, type, peak);
  }

  // Abaixa a música de fundo por baixo de um efeito e devolve ao volume base
  // em seguida, garantindo o efeito sempre em evidência. (MUS-03)
  function duck(duration) {
    if (!musicBus) return;
    const t0 = ctx.currentTime;
    musicBus.gain.cancelScheduledValues(t0);
    musicBus.gain.setValueAtTime(musicBus.gain.value, t0);
    musicBus.gain.linearRampToValueAtTime(MUSIC_DUCK_GAIN, t0 + 0.04);
    musicBus.gain.linearRampToValueAtTime(MUSIC_BASE_GAIN, t0 + duration);
  }

  function safePlay(fn, duckDuration) {
    if (!unlocked || !ctx || ctx.state !== 'running') return;
    try {
      if (duckDuration) duck(duckDuration);
      fn();
      soundsPlayed += 1;
    } catch {
      // qualquer falha de áudio é silenciosa — nunca quebra o jogo
    }
  }

  function scheduleMusicLoop(loopStart) {
    for (const n of MUSIC_PATTERN) noteTo(musicBus, n.f, loopStart + n.t, n.d, n.type, n.peak);
  }

  // Inicia a trilha de fundo em loop contínuo; idempotente. (MUS-01)
  function startMusic() {
    if (!unlocked || musicRunning) return;
    musicBus = ctx.createGain();
    musicBus.gain.value = MUSIC_BASE_GAIN;
    musicBus.connect(ctx.destination);
    musicNextLoopAt = ctx.currentTime + 0.05;
    musicRunning = true;
  }

  // Chamado a cada frame por update(dt): agenda a próxima repetição do loop
  // com lookahead, antes que a atual termine de tocar. (MUS-01)
  function tickMusic() {
    if (!musicRunning) return;
    while (musicNextLoopAt < ctx.currentTime + MUSIC_LOOKAHEAD) {
      scheduleMusicLoop(musicNextLoopAt);
      musicNextLoopAt += MUSIC_LOOP_DURATION;
    }
  }

  // Som curto de acerto: duas notas subindo ("plim!"). (GUARD-09.2)
  const chime = () => safePlay(() => {
    note(880, 0, 0.12);
    note(1174.66, 0.09, 0.25);
  }, 0.4);

  // Fanfarra da celebração: arpejo C-E-G-C. (GUARD-09.2)
  const fanfare = () => safePlay(() => {
    [523.25, 659.25, 783.99, 1046.5].forEach((f, i) => note(f, i * 0.15, 0.3, 'triangle', 0.18));
    note(1046.5, 0.6, 0.8, 'triangle', 0.22);
  }, 1.5);

  // Jingle de vitória (~2s): duas voltas do arpejo subindo uma oitava e
  // acorde final sustentado — inconfundível frente à fanfarra de rodada. (WIN-06)
  const victoryTune = () => safePlay(() => {
    const run = [523.25, 659.25, 783.99, 1046.5, 1318.5, 1568, 2093];
    run.forEach((f, i) => note(f, i * 0.12, 0.25, 'triangle', 0.18));
    [1046.5, 1318.5, 1568].forEach((f) => note(f, 0.95, 1.1, 'triangle', 0.16));
    note(2093, 1.3, 0.9, 'sine', 0.2);
  }, 2.5);

  // Toque curto e bem-humorado ao errar: um "boop" descendente, nunca um
  // buzzer — sem tom de punição. (MUS-04, emenda GUARD-03)
  const oops = () => safePlay(() => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'triangle';
    const t0 = ctx.currentTime;
    osc.frequency.setValueAtTime(520, t0);
    osc.frequency.exponentialRampToValueAtTime(260, t0 + 0.26);
    gain.gain.setValueAtTime(0.0001, t0);
    gain.gain.exponentialRampToValueAtTime(0.18, t0 + 0.03);
    gain.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.3);
    osc.connect(gain).connect(ctx.destination);
    osc.start(t0);
    osc.stop(t0 + 0.35);
  }, 0.4);

  return {
    unlock,
    chime,
    fanfare,
    victoryTune,
    oops,
    tickMusic,
    state: () => ({ unlocked, soundsPlayed }),
  };
}

export function createFeedback({ scene, floorY, bluey }) {
  const tweens = [];
  const confetti = createConfetti(scene);
  const audio = createAudio();

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
    audio.tickMusic(); // (MUS-01)
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
    audio.chime(); // (GUARD-09.2)
    if (bluey) bluey.cheer(); // (VIS-03)
  }

  // Celebração grande ao completar a rodada: chuva de confete + caixas pulando + fanfarra.
  // (GUARD-05, GUARD-08.2, GUARD-09.2)
  function roundComplete(boxes) {
    confetti.rain(3);
    if (bluey) bluey.danceAt(new THREE.Vector3(0, floorY, 0.25), 3);
    for (const box of boxes) pulse(box.mesh);
    audio.fanfare();
  }

  // Festa de VITÓRIA — maior e mais longa que a de rodada: 8s de chuva de
  // confete, dança central estendida da Bluey e jingle próprio. (WIN-06)
  function victory(boxes) {
    confetti.rain(8);
    if (bluey) bluey.danceAt(new THREE.Vector3(0, floorY, 0.25), 8);
    for (const box of boxes) pulse(box.mesh);
    audio.victoryTune();
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
    audio.oops(); // (MUS-04)
  }

  // Assentar suavemente no chão onde foi solto (fora de caixa). (GUARD-03)
  function settle(toyMesh, pos) {
    cancel(toyMesh);
    audio.oops(); // (MUS-04.1)
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

  return {
    update,
    cancel,
    stored,
    rejected,
    settle,
    roundComplete,
    victory,
    unlockAudio: audio.unlock,
    audioState: audio.state,
  };
}
