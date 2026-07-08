// Entry point — composição completa acontece na T8.
import { createScene } from './scene.js';

const overlay = document.getElementById('start-overlay');
const playButton = document.getElementById('play-button');

playButton.addEventListener('pointerup', () => {
  overlay.classList.add('hidden');
});

const canvas = document.getElementById('game-canvas');
const { scene, camera, renderer, onResize } = createScene(canvas);

window.addEventListener('resize', onResize);

renderer.setAnimationLoop(() => {
  renderer.render(scene, camera);
});
