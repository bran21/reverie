// Synthesize retro MIDI-style tones using the Web Audio API

let audioCtx = null;

function getAudioContext() {
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  }
  if (audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
  return audioCtx;
}

function playTone(freq, type, time, duration, vol = 0.1) {
  const ctx = getAudioContext();
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();

  osc.type = type;
  osc.frequency.setValueAtTime(freq, ctx.currentTime + time);

  gain.gain.setValueAtTime(0, ctx.currentTime + time);
  gain.gain.linearRampToValueAtTime(vol, ctx.currentTime + time + 0.05);
  gain.gain.setValueAtTime(vol, ctx.currentTime + time + duration - 0.05);
  gain.gain.linearRampToValueAtTime(0, ctx.currentTime + time + duration);

  osc.connect(gain);
  gain.connect(ctx.destination);

  osc.start(ctx.currentTime + time);
  osc.stop(ctx.currentTime + time + duration);
}

export function playWinSound() {
  // Ascending major arpeggio (Mario coin/powerup style)
  playTone(523.25, 'square', 0.0, 0.1); // C5
  playTone(659.25, 'square', 0.1, 0.1); // E5
  playTone(783.99, 'square', 0.2, 0.1); // G5
  playTone(1046.50, 'square', 0.3, 0.3); // C6
}

export function playLossSound() {
  // Descending dissonant (fail style)
  playTone(466.16, 'sawtooth', 0.0, 0.2, 0.05); // A#4
  playTone(415.30, 'sawtooth', 0.2, 0.2, 0.05); // G#4
  playTone(369.99, 'sawtooth', 0.4, 0.2, 0.05); // F#4
  playTone(329.63, 'sawtooth', 0.6, 0.4, 0.05); // E4
}
