// Entry point — wiring happens in later tasks (T8).
const overlay = document.getElementById('start-overlay');
const playButton = document.getElementById('play-button');

playButton.addEventListener('pointerup', () => {
  overlay.classList.add('hidden');
});
