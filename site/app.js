const MAX_TAPS = 9;
const RESET_DELAY = 3000;
const CIRCUMFERENCE = 2 * Math.PI * 11;

let taps = [];
let resetTimer = null;
let pulseTimeout = null;

const tapArea = document.getElementById('tap-area');
const bpmNumber = document.getElementById('bpm-number');
const tapHint = document.getElementById('tap-hint');
const tempoLabel = document.getElementById('tempo-label');
const tapDots = document.getElementById('tap-dots');
const hdBtns = document.getElementById('hd-btns');
const btnHalf = document.getElementById('btn-half');
const btnDouble = document.getElementById('btn-double');
const resetBtn = document.getElementById('reset-btn');
const countdownRing = document.getElementById('countdown-ring');
const ringCircle = document.getElementById('ring-circle');

const TEMPO_LABELS = [
  [220, 'Prestissimo'],
  [180, 'Presto'],
  [168, 'Vivace'],
  [120, 'Allegro'],
  [92,  'Moderato'],
  [70,  'Andante'],
  [50,  'Adagio'],
  [20,  'Largo'],
  [0,   'Grave'],
];

function getTempoLabel(bpm) {
  for (const [min, label] of TEMPO_LABELS) {
    if (bpm >= min) return label;
  }
  return '';
}

let multiplier = 1;
let lastRawBPM = null;

const dots = [];
for (let i = 0; i < MAX_TAPS - 1; i++) {
  const d = document.createElement('div');
  d.className = 'dot';
  tapDots.appendChild(d);
  dots.push(d);
}

function updateDots(intervalCount) {
  dots.forEach((d, i) => {
    d.classList.toggle('active', i < intervalCount);
  });
}

function triggerPulse() {
  tapArea.classList.remove('pulse');
  void tapArea.offsetWidth;
  tapArea.classList.add('pulse');
  clearTimeout(pulseTimeout);
  pulseTimeout = setTimeout(() => tapArea.classList.remove('pulse'), 150);
}

function startCountdown() {
  ringCircle.style.transition = 'none';
  ringCircle.style.strokeDashoffset = '0';
  void ringCircle.offsetWidth;
  ringCircle.style.transition = `stroke-dashoffset ${RESET_DELAY}ms linear`;
  ringCircle.style.strokeDashoffset = CIRCUMFERENCE.toString();
  countdownRing.classList.add('visible');
}

function stopCountdown() {
  ringCircle.style.transition = 'none';
  ringCircle.style.strokeDashoffset = '0';
  countdownRing.classList.remove('visible');
}

function applyMultiplier(mult) {
  multiplier = mult;
  btnHalf.classList.toggle('active', mult === 0.5);
  btnDouble.classList.toggle('active', mult === 2);
  if (lastRawBPM !== null) {
    const displayed = Math.round(lastRawBPM * multiplier);
    bpmNumber.textContent = displayed;
    tempoLabel.textContent = getTempoLabel(displayed);
  }
}

function displayBPM(value) {
  if (value === null) {
    lastRawBPM = null;
    multiplier = 1;
    bpmNumber.textContent = '--';
    bpmNumber.classList.remove('has-value');
    tapHint.classList.remove('hidden');
    tempoLabel.classList.remove('visible');
    hdBtns.classList.remove('visible');
    btnHalf.classList.remove('active');
    btnDouble.classList.remove('active');
    updateDots(0);
  } else {
    lastRawBPM = value;
    const displayed = Math.round(value * multiplier);
    bpmNumber.textContent = displayed;
    bpmNumber.classList.add('has-value');
    tapHint.classList.add('hidden');
    tempoLabel.textContent = getTempoLabel(displayed);
    tempoLabel.classList.add('visible');
    hdBtns.classList.add('visible');
  }
}

function reset() {
  taps = [];
  displayBPM(null);
  stopCountdown();
  clearTimeout(resetTimer);
}

function handleTap(e) {
  if (e.target === resetBtn || resetBtn.contains(e.target)) return;
  e.preventDefault();

  const now = Date.now();
  clearTimeout(resetTimer);
  stopCountdown();
  taps.push(now);

  if (taps.length > MAX_TAPS) taps = taps.slice(-MAX_TAPS);

  triggerPulse();

  const intervalCount = taps.length - 1;
  updateDots(intervalCount);

  if (intervalCount >= 1) {
    const intervals = [];
    for (let i = 1; i < taps.length; i++) intervals.push(taps[i] - taps[i - 1]);
    const avg = intervals.reduce((a, b) => a + b, 0) / intervals.length;
    displayBPM(Math.round(60000 / avg));
  }

  startCountdown();
  resetTimer = setTimeout(reset, RESET_DELAY);
}

document.addEventListener('keydown', (e) => {
  if (e.code === 'Space' || e.code === 'Enter') {
    e.preventDefault();
    handleTap(e);
  }
});

tapArea.addEventListener('pointerdown', handleTap);
resetBtn.addEventListener('pointerdown', (e) => { e.stopPropagation(); reset(); });
btnHalf.addEventListener('pointerdown', (e) => { e.stopPropagation(); applyMultiplier(multiplier === 0.5 ? 1 : 0.5); });
btnDouble.addEventListener('pointerdown', (e) => { e.stopPropagation(); applyMultiplier(multiplier === 2 ? 1 : 2); });

// PWA install
(function () {
  if (window.matchMedia('(display-mode: standalone)').matches) return;

  const btn = document.getElementById('install-btn');
  let prompt;

  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
  if (isIOS) {
    btn.textContent = '⊕ Install';
    btn.hidden = false;
    btn.addEventListener('click', () => alert('Tap the Share icon ⎋, then "Add to Home Screen".'));
    return;
  }

  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    prompt = e;
    btn.hidden = false;
  });

  window.addEventListener('appinstalled', () => { btn.hidden = true; prompt = null; });

  btn.addEventListener('click', async () => {
    if (!prompt) return;
    prompt.prompt();
    const { outcome } = await prompt.userChoice;
    if (outcome === 'accepted') btn.hidden = true;
    prompt = null;
  });
}());
