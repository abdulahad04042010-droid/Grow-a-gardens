/* =========================================================
   Sunny Meadow Farm · 3D Garden World · v0.1 First Playable
   Three.js (r160, loaded from CDN via importmap in index.html)
   ========================================================= */
import * as THREE from 'three';

/* ---------------------------------------------------------
   CONFIG
   --------------------------------------------------------- */
const SAVE_KEY = 'garden3d_save_v1';
const START_COINS = 100;
const XP_PER_LEVEL = 60;
const PLOT_COUNT = 9;
const MOVE_SPEED = 6.5;
const JUMP_SPEED = 9;
const GRAVITY = 26;
const PLAYER_RADIUS = 0.45;
const INTERACT_RANGE = 3.6;
const WORLD_LIMIT = 105;
const PLAYER_HEIGHT = 2.7;
const MATURE_H = PLAYER_HEIGHT * 2; // mature crops are twice the player's height

const CROPS = {
  carrot:     { name: 'Carrot',     emoji: '🥕', seedPrice: 10, sellPrice: 22, growSec: 20, xp: 10, color: '#ff8c1a' },
  tomato:     { name: 'Tomato',     emoji: '🍅', seedPrice: 15, sellPrice: 36, growSec: 30, xp: 15, color: '#ff3b30' },
  corn:       { name: 'Corn',       emoji: '🌽', seedPrice: 25, sellPrice: 60, growSec: 45, xp: 22, color: '#ffd60a' },
  strawberry: { name: 'Strawberry', emoji: '🍓', seedPrice: 20, sellPrice: 45, growSec: 35, xp: 18, color: '#ff2d6f' },
};
const CROP_KEYS = Object.keys(CROPS); // starter crops (hotbar slots 1-4)

// Extra seeds sold by Nguyet. They use the same growing, planting and harvesting rules.
const NEW_CROPS = {
  potato:           { name: 'Potato',          emoji: '🥔', seedPrice: 12,   sellPrice: 26,   growSec: 25,  xp: 10, color: '#c9a56a', shape: 'bush' },
  blueberry:        { name: 'Blueberry',       emoji: '🫐', seedPrice: 40,   sellPrice: 80,   growSec: 40,  xp: 15, color: '#3b5bdb', shape: 'bush' },
  watermelon:       { name: 'Watermelon',      emoji: '🍉', seedPrice: 60,   sellPrice: 130,  growSec: 60,  xp: 15, color: '#2fa84f', shape: 'stalk' },
  banana:           { name: 'Banana',          emoji: '🍌', seedPrice: 55,   sellPrice: 115,  growSec: 50,  xp: 15, color: '#ffe14d', shape: 'tree' },
  orange:           { name: 'Orange',          emoji: '🍊', seedPrice: 50,   sellPrice: 105,  growSec: 45,  xp: 15, color: '#ff9a1f', shape: 'tree' },
  grapes:           { name: 'Grapes',          emoji: '🍇', seedPrice: 65,   sellPrice: 140,  growSec: 55,  xp: 15, color: '#7b2cbf', shape: 'bush' },
  mango:            { name: 'Mango',           emoji: '🥭', seedPrice: 120,  sellPrice: 260,  growSec: 70,  xp: 25, color: '#ffb703', shape: 'tree' },
  pineapple:        { name: 'Pineapple',       emoji: '🍍', seedPrice: 150,  sellPrice: 330,  growSec: 80,  xp: 25, color: '#f4c430', shape: 'stalk' },
  dragonfruit:      { name: 'Dragon Fruit',    emoji: '🐉', seedPrice: 180,  sellPrice: 400,  growSec: 85,  xp: 25, color: '#ff3e8a', shape: 'bush' },
  cherry:           { name: 'Cherry',          emoji: '🍒', seedPrice: 110,  sellPrice: 240,  growSec: 60,  xp: 25, color: '#d00000', shape: 'tree' },
  coconut:          { name: 'Coconut',         emoji: '🥥', seedPrice: 200,  sellPrice: 440,  growSec: 90,  xp: 25, color: '#8d6e63', shape: 'tree' },
  goldenapple:      { name: 'Golden Apple',    emoji: '🍎', seedPrice: 350,  sellPrice: 800,  growSec: 120, xp: 40, color: '#ffd700', shape: 'tree' },
  crystalberry:     { name: 'Crystal Berry',   emoji: '💎', seedPrice: 420,  sellPrice: 950,  growSec: 130, xp: 40, color: '#8ee9ff', shape: 'bush' },
  rainbowmelon:     { name: 'Rainbow Melon',   emoji: '🌈', seedPrice: 500,  sellPrice: 1150, growSec: 140, xp: 40, color: '#ff6fd8', shape: 'stalk' },
  moonflower:       { name: 'Moonflower',      emoji: '🌙', seedPrice: 380,  sellPrice: 870,  growSec: 125, xp: 40, color: '#e0d7ff', shape: 'bush' },
  celestialfruit:   { name: 'Celestial Fruit', emoji: '✨', seedPrice: 900,  sellPrice: 2100, growSec: 200, xp: 70, color: '#ffe066', shape: 'tree' },
  starfruit:        { name: 'Starfruit',       emoji: '⭐', seedPrice: 1000, sellPrice: 2400, growSec: 210, xp: 70, color: '#fff176', shape: 'stalk' },
  goldendragonfruit:{ name: 'Golden Dragon Fruit', emoji: '👑', seedPrice: 1200, sellPrice: 2800, growSec: 230, xp: 70, color: '#ffc107', shape: 'bush' },
};
Object.assign(CROPS, NEW_CROPS);
const ALL_CROP_KEYS = Object.keys(CROPS); // every crop in the game

const SHOP = { x: 16, z: -4 };    // Seed shop (east side of the plaza)
const SELL = { x: -16, z: -4 };   // Selling store (west side of the plaza)
const GARDEN = { x: 0, z: -30 };  // Personal garden (north, reached via the garden path)

/* ---------------------------------------------------------
   GAME STATE (gameplay logic only; rendering reads from it)
   --------------------------------------------------------- */
const state = {
  coins: START_COINS,
  xp: 0,
  seeds: Object.fromEntries(ALL_CROP_KEYS.map(k => [k, 0])),
  crops: Object.fromEntries(ALL_CROP_KEYS.map(k => [k, 0])),
  plots: Array.from({ length: PLOT_COUNT }, () => ({ crop: null, plantedAt: 0 })),
  selectedSeed: 'carrot',
  gameTime: 0,      // seconds of in-game time (one day = DAY_LENGTH)
  lastResetDay: 0,  // last in-game day whose morning coin reset has been applied
};

/* ---------------------------------------------------------
   SAVE / LOAD (localStorage)
   --------------------------------------------------------- */
function save() {
  try {
    localStorage.setItem(SAVE_KEY, JSON.stringify({
      version: 1,
      coins: state.coins,
      xp: state.xp,
      level: levelFromXp(state.xp),
      seeds: state.seeds,
      crops: state.crops,
      plots: state.plots,
      selectedSeed: state.selectedSeed,
      gameTime: state.gameTime,
      lastResetDay: state.lastResetDay,
    }));
  } catch (err) {
    console.warn('Save failed', err);
  }
}

function load() {
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    if (!raw) return false;
    const d = JSON.parse(raw);
    if (Number.isFinite(d.coins)) state.coins = Math.max(0, Math.floor(d.coins));
    if (Number.isFinite(d.xp)) state.xp = Math.max(0, Math.floor(d.xp));
    for (const k of ALL_CROP_KEYS) {
      state.seeds[k] = Math.max(0, Math.floor(d.seeds?.[k] ?? 0));
      state.crops[k] = Math.max(0, Math.floor(d.crops?.[k] ?? 0));
    }
    if (Array.isArray(d.plots)) {
      for (let i = 0; i < PLOT_COUNT; i++) {
        const p = d.plots[i];
        if (p && ALL_CROP_KEYS.includes(p.crop) && Number.isFinite(p.plantedAt)) {
          state.plots[i] = { crop: p.crop, plantedAt: p.plantedAt };
        }
      }
    }
    if (ALL_CROP_KEYS.includes(d.selectedSeed)) state.selectedSeed = d.selectedSeed;
    if (Number.isFinite(d.gameTime)) state.gameTime = Math.max(0, d.gameTime);
    if (Number.isFinite(d.lastResetDay)) state.lastResetDay = Math.max(0, Math.floor(d.lastResetDay));
    return true;
  } catch (err) {
    console.warn('Load failed', err);
    return false;
  }
}

/* ---------------------------------------------------------
   UTILITIES
   --------------------------------------------------------- */
const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
const levelFromXp = xp => Math.floor(xp / XP_PER_LEVEL) + 1;

function plotProgress(plot, now = Date.now()) {
  if (!plot.crop) return 0;
  return clamp((now - plot.plantedAt) / (CROPS[plot.crop].growSec * 1000), 0, 1);
}
// 0 = sprout, 1 = growing, 2 = mature (three visual growth stages)
const stageFor = progress => (progress >= 1 ? 2 : progress >= 0.4 ? 1 : 0);

function lerpAngle(a, b, t) {
  const d = ((b - a) % (Math.PI * 2) + Math.PI * 3) % (Math.PI * 2) - Math.PI;
  return a + d * t;
}

// Small seeded RNG so the world layout is the same every visit
function rng(seed) {
  return function () {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const rnd = rng(20240607);

/* ---------------------------------------------------------
   AUDIO · background music, footsteps, growth sounds
   Synthesized with Web Audio, so no extra files are needed.
   --------------------------------------------------------- */
const audio = {
  ctx: null, master: null, musicBus: null, sfxBus: null,
  started: false,
  muted: localStorage.getItem('garden3d_muted') === '1',
  nextNoteTime: 0, step: 0, noise: null,
};
let footTimer = 0;
let sparkleTimer = 2;

const MUSIC_BPM = 108;
const EIGHTH = 60 / MUSIC_BPM / 2;
// 32-step loop of eighth notes (MIDI numbers, 0 = rest)
const MELODY = [72, 0, 76, 79,  77, 76, 0, 72,  74, 0, 79, 81,  79, 77, 76, 0,
                76, 0, 79, 81,  84, 0, 81, 79,  77, 76, 74, 0,  72, 0, 74, 76];
// One bass note every 4 steps
const BASS = [48, 48, 43, 43, 45, 45, 41, 41];

const midiToFreq = m => 440 * Math.pow(2, (m - 69) / 12);
const audioReady = () => !!audio.ctx && audio.ctx.state === 'running';

function ensureAudio() {
  if (audio.ctx) return true;
  const AC = window.AudioContext || window.webkitAudioContext;
  if (!AC) return false;
  audio.ctx = new AC();
  audio.master = audio.ctx.createGain();
  audio.master.gain.value = audio.muted ? 0 : 1;
  audio.master.connect(audio.ctx.destination);
  audio.musicBus = audio.ctx.createGain();
  audio.musicBus.gain.value = 0.2;
  audio.musicBus.connect(audio.master);
  audio.sfxBus = audio.ctx.createGain();
  audio.sfxBus.gain.value = 0.7;
  audio.sfxBus.connect(audio.master);
  return true;
}

// Browsers only allow audio after a user gesture, so start on the first tap or key press
function unlockAudio() {
  if (!ensureAudio()) return;
  if (audio.ctx.state === 'suspended') audio.ctx.resume();
  if (!audio.started) {
    audio.started = true;
    audio.nextNoteTime = audio.ctx.currentTime + 0.15;
    setInterval(scheduleMusic, 110);
  }
}

function tone(freq, when, dur, type, vol, bus) {
  const ctx = audio.ctx;
  const o = ctx.createOscillator();
  const g = ctx.createGain();
  o.type = type;
  o.frequency.setValueAtTime(freq, when);
  g.gain.setValueAtTime(0.0001, when);
  g.gain.exponentialRampToValueAtTime(vol, when + 0.015);
  g.gain.exponentialRampToValueAtTime(0.0001, when + dur);
  o.connect(g);
  g.connect(bus);
  o.start(when);
  o.stop(when + dur + 0.05);
}

function scheduleMusic() {
  if (!audio.ctx) return;
  while (audio.nextNoteTime < audio.ctx.currentTime + 0.4) {
    const s = audio.step % 32;
    const t = audio.nextNoteTime;
    if (MELODY[s]) tone(midiToFreq(MELODY[s]), t, EIGHTH * 0.95, 'triangle', 0.16, audio.musicBus);
    if (s % 4 === 0) tone(midiToFreq(BASS[(s / 4) % 8]), t, EIGHTH * 3.8, 'sine', 0.3, audio.musicBus);
    audio.nextNoteTime += EIGHTH;
    audio.step++;
  }
}

function playFootstep() {
  if (!audioReady()) return;
  const ctx = audio.ctx;
  if (!audio.noise) {
    const len = Math.floor(ctx.sampleRate * 0.12);
    audio.noise = ctx.createBuffer(1, len, ctx.sampleRate);
    const d = audio.noise.getChannelData(0);
    for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 3);
  }
  const src = ctx.createBufferSource();
  src.buffer = audio.noise;
  const filter = ctx.createBiquadFilter();
  filter.type = 'lowpass';
  filter.frequency.value = 700 + Math.random() * 400;
  const g = ctx.createGain();
  g.gain.value = 0.35;
  src.connect(filter);
  filter.connect(g);
  g.connect(audio.sfxBus);
  src.start();
}

function playBlip(freqs, type, gap, vol) {
  if (!audioReady()) return;
  const t0 = audio.ctx.currentTime;
  freqs.forEach((f, i) => tone(f, t0 + i * gap, 0.2, type, vol, audio.sfxBus));
}
const playPlant = () => playBlip([392, 523, 659], 'sine', 0.06, 0.22);
const playGrow = stage => (stage === 2
  ? playBlip([659, 784, 988, 1318], 'triangle', 0.08, 0.2)
  : playBlip([523, 659], 'sine', 0.09, 0.18));
const playHarvest = () => playBlip([784, 988, 1175, 1568], 'triangle', 0.07, 0.22);
const playCoin = () => playBlip([1318, 1760], 'square', 0.06, 0.07);

function playJump() {
  if (!audioReady()) return;
  const ctx = audio.ctx, t = ctx.currentTime;
  const o = ctx.createOscillator();
  const g = ctx.createGain();
  o.type = 'triangle';
  o.frequency.setValueAtTime(260, t);
  o.frequency.exponentialRampToValueAtTime(620, t + 0.18);
  g.gain.setValueAtTime(0.18, t);
  g.gain.exponentialRampToValueAtTime(0.0001, t + 0.2);
  o.connect(g);
  g.connect(audio.sfxBus);
  o.start(t);
  o.stop(t + 0.22);
}

// Soft sparkle now and then while any crop is still growing
function updateAmbientSound(dt) {
  if (!audioReady() || modalMode) return;
  const growing = state.plots.some(p => p.crop && plotProgress(p) < 1);
  if (!growing) return;
  sparkleTimer -= dt;
  if (sparkleTimer <= 0) {
    tone(1568 + rnd() * 600, audio.ctx.currentTime, 0.3, 'sine', 0.04, audio.sfxBus);
    sparkleTimer = 3 + rnd() * 2.5;
  }
}

const soundBtn = document.getElementById('btn-sound');
function refreshSoundButton() { soundBtn.textContent = audio.muted ? '🔇' : '🔊'; }
soundBtn.addEventListener('pointerdown', e => {
  e.preventDefault();
  unlockAudio();
  audio.muted = !audio.muted;
  localStorage.setItem('garden3d_muted', audio.muted ? '1' : '0');
  if (audio.master) audio.master.gain.value = audio.muted ? 0 : 1;
  refreshSoundButton();
});
refreshSoundButton();
addEventListener('pointerdown', unlockAudio);
addEventListener('keydown', unlockAudio);

/* ---------------------------------------------------------
   DOM REFERENCES
   --------------------------------------------------------- */
const $ = id => document.getElementById(id);
const dom = {
  canvas: $('game-canvas'),
  coins: $('coins'),
  level: $('level'),
  xpFill: $('xp-fill'),
  selected: $('selected-label'),
  hotbar: $('hotbar'),
  prompt: $('prompt'),
  interact: $('interact-btn'),
  jump: $('jump-btn'),
  joy: $('joystick'),
  joyKnob: $('joystick-knob'),
  toasts: $('toasts'),
  modal: $('modal'),
  modalTitle: $('modal-title'),
  modalBody: $('modal-body'),
  modalClose: $('modal-close'),
  invBtn: $('btn-inventory'),
  shopBtn: $('btn-shop'),
  loading: $('loading'),
};

/* ---------------------------------------------------------
   RENDERER / SCENE / CAMERA
   --------------------------------------------------------- */
const renderer = new THREE.WebGLRenderer({ canvas: dom.canvas, antialias: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setSize(window.innerWidth, window.innerHeight, false);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.outputColorSpace = THREE.SRGBColorSpace;

const scene = new THREE.Scene();
scene.fog = new THREE.Fog('#bfeaff', 85, 240);

const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 500);
const cam = { yaw: 0, pitch: 0.45, dist: 8, targetDist: 8, eff: 8 };

/* ---------------------------------------------------------
   MATERIAL / MESH HELPERS (low-poly, flat shaded)
   --------------------------------------------------------- */
const matCache = new Map();
function mat(color) {
  const key = String(color);
  if (!matCache.has(key)) {
    matCache.set(key, new THREE.MeshStandardMaterial({
      color, roughness: 0.85, metalness: 0.0, flatShading: true,
    }));
  }
  return matCache.get(key);
}

function addMesh(geo, color, parent, x = 0, y = 0, z = 0) {
  const m = new THREE.Mesh(geo, mat(color));
  m.position.set(x, y, z);
  m.castShadow = true;
  m.receiveShadow = true;
  parent.add(m);
  return m;
}

const BOX = new THREE.BoxGeometry(1, 1, 1);
function addBox(w, h, d, color, parent, x = 0, y = 0, z = 0) {
  const m = addMesh(BOX, color, parent, x, y, z);
  m.scale.set(w, h, d);
  return m;
}

/* Collision obstacles: circles {x,z,r} and rects {minX,maxX,minZ,maxZ} */
const obstacles = [];
const addCircleObs = (x, z, r) => obstacles.push({ x, z, r });
const addRectObs = (x, z, w, d) =>
  obstacles.push({ minX: x - w / 2, maxX: x + w / 2, minZ: z - d / 2, maxZ: z + d / 2 });

function resolveCollisions(p) {
  for (const o of obstacles) {
    if (o.r !== undefined) {
      const dx = p.x - o.x, dz = p.z - o.z;
      const d = Math.hypot(dx, dz);
      const min = o.r + PLAYER_RADIUS;
      if (d < min && d > 0.0001) {
        const k = (min - d) / d;
        p.x += dx * k;
        p.z += dz * k;
      }
    } else {
      const minX = o.minX - PLAYER_RADIUS, maxX = o.maxX + PLAYER_RADIUS;
      const minZ = o.minZ - PLAYER_RADIUS, maxZ = o.maxZ + PLAYER_RADIUS;
      if (p.x > minX && p.x < maxX && p.z > minZ && p.z < maxZ) {
        const left = p.x - minX, right = maxX - p.x;
        const back = p.z - minZ, front = maxZ - p.z;
        const m = Math.min(left, right, back, front);
        if (m === left) p.x = minX;
        else if (m === right) p.x = maxX;
        else if (m === back) p.z = minZ;
        else p.z = maxZ;
      }
    }
  }
}

/* ---------------------------------------------------------
   LIGHTING & SKY
   --------------------------------------------------------- */
const hemiLight = new THREE.HemisphereLight('#dff6ff', '#6aa84f', 1.15);
scene.add(hemiLight);

const sun = new THREE.DirectionalLight('#fff3d6', 1.8);
sun.castShadow = true;
sun.shadow.mapSize.set(2048, 2048);
{
  const s = sun.shadow.camera;
  s.left = -50; s.right = 50; s.top = 50; s.bottom = -50;
  s.near = 1; s.far = 160;
  s.updateProjectionMatrix();
}
sun.shadow.bias = -0.0006;
sun.shadow.normalBias = 0.02;
scene.add(sun, sun.target);

function buildSky() {
  const geo = new THREE.SphereGeometry(300, 24, 16);
  const pos = geo.attributes.position;
  const colors = [];
  const bottom = new THREE.Color('#d6f5ff');
  const top = new THREE.Color('#3f9cff');
  for (let i = 0; i < pos.count; i++) {
    const t = clamp(pos.getY(i) / 300, 0, 1);
    const c = bottom.clone().lerp(top, Math.pow(t, 0.6));
    colors.push(c.r, c.g, c.b);
  }
  geo.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
  skyGeo = geo;
  scene.add(new THREE.Mesh(geo, new THREE.MeshBasicMaterial({
    vertexColors: true, side: THREE.BackSide, fog: false,
  })));
}

/* ---------------------------------------------------------
   WORLD BUILD
   --------------------------------------------------------- */
const restricted = [
  { minX: -11, maxX: 11, minZ: -11, maxZ: 11 },                 // plaza
  { minX: -10, maxX: 10, minZ: -40, maxZ: -20 },                // garden
  { minX: SHOP.x - 4.5, maxX: SHOP.x + 4.5, minZ: SHOP.z - 3.5, maxZ: SHOP.z + 3.5 },
  { minX: SELL.x - 4.5, maxX: SELL.x + 4.5, minZ: SELL.z - 3.5, maxZ: SELL.z + 3.5 },
  { minX: -120, maxX: 120, minZ: 6, maxZ: 10 },                 // east-west path
  { minX: -2.5, maxX: 2.5, minZ: -23, maxZ: -9 },               // garden path
];

function scatter(count, fn) {
  let placed = 0;
  for (let tries = 0; tries < count * 30 && placed < count; tries++) {
    const x = (rnd() - 0.5) * 190;
    const z = (rnd() - 0.5) * 190;
    if (restricted.some(r => x > r.minX - 2 && x < r.maxX + 2 && z > r.minZ - 2 && z < r.maxZ + 2)) continue;
    fn(x, z);
    placed++;
  }
}

function buildGround() {
  const ground = new THREE.Mesh(new THREE.PlaneGeometry(260, 260), mat('#5fd24f'));
  ground.rotation.x = -Math.PI / 2;
  ground.receiveShadow = true;
  scene.add(ground);

  const tones = ['#4cc843', '#6ee05a', '#58d14a', '#7ae868', '#44b83d'];
  for (let i = 0; i < 80; i++) {
    const patch = new THREE.Mesh(
      new THREE.CircleGeometry(2 + rnd() * 5, 7),
      mat(tones[Math.floor(rnd() * tones.length)])
    );
    patch.rotation.x = -Math.PI / 2;
    patch.position.set((rnd() - 0.5) * 200, 0.01, (rnd() - 0.5) * 200);
    patch.receiveShadow = true;
    scene.add(patch);
  }

  // Roads
  addBox(80, 0.04, 3, '#f0d08c', scene, 0, 0.02, 8);     // east-west walking path
  addBox(3, 0.04, 12, '#f0d08c', scene, 0, 0.02, -16);   // path up to the garden
  // Tilled ground under the garden
  addBox(17, 0.04, 17, '#a56f3f', scene, GARDEN.x, 0.02, GARDEN.z);
}

function buildPlaza() {
  // Stone plaza
  addMesh(new THREE.CylinderGeometry(10, 10, 0.06, 36), '#f4e6c4', scene, 0, 0.03, 0);
  const ring = new THREE.Mesh(new THREE.RingGeometry(7.6, 7.9, 36), mat('#d4ae78'));
  ring.rotation.x = -Math.PI / 2;
  ring.position.y = 0.07;
  scene.add(ring);

  // Fountain (central landmark)
  const fountain = new THREE.Group();
  scene.add(fountain);
  addMesh(new THREE.CylinderGeometry(3, 3.2, 0.8, 24), '#e6e0d2', fountain, 0, 0.4, 0);
  const water = new THREE.Mesh(
    new THREE.CylinderGeometry(2.5, 2.5, 0.05, 24),
    new THREE.MeshStandardMaterial({ color: '#3fb8ff', roughness: 0.1, metalness: 0.2, transparent: true, opacity: 0.85 })
  );
  water.position.y = 0.82;
  fountain.add(water);
  addMesh(new THREE.CylinderGeometry(0.35, 0.5, 1.6, 12), '#e6e0d2', fountain, 0, 1.6, 0);
  addMesh(new THREE.SphereGeometry(0.6, 14, 10), '#7fd6ff', fountain, 0, 2.5, 0);
  addCircleObs(0, 0, 3.1);

  // Benches around the plaza
  for (let i = 0; i < 4; i++) {
    const a = i * Math.PI / 2 + Math.PI / 4;
    const x = Math.cos(a) * 6.2, z = Math.sin(a) * 6.2;
    const bench = new THREE.Group();
    bench.position.set(x, 0, z);
    bench.rotation.y = -a;
    scene.add(bench);
    addBox(1.8, 0.12, 0.6, '#a0673a', bench, 0, 0.5, 0);
    addBox(0.12, 0.5, 0.6, '#6b4423', bench, -0.7, 0.25, 0);
    addBox(0.12, 0.5, 0.6, '#6b4423', bench, 0.7, 0.25, 0);
    addBox(1.8, 0.6, 0.12, '#a0673a', bench, 0, 0.85, -0.3);
    addCircleObs(x, z, 0.9);
  }

  // Lamp posts ringing the plaza (offset angles keep the paths clear)
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * Math.PI * 2 + Math.PI / 8;
    const x = Math.cos(a) * 12.5, z = Math.sin(a) * 12.5;
    addMesh(new THREE.CylinderGeometry(0.08, 0.1, 2.6, 6), '#3d3550', scene, x, 1.3, z);
    addMesh(new THREE.SphereGeometry(0.28, 10, 8), '#fff2b0', scene, x, 2.8, z).material = lampMat;
    addCircleObs(x, z, 0.25);
  }
}

function makeSignTexture(text, bg) {
  const c = document.createElement('canvas');
  c.width = 680;
  c.height = 200;
  const g = c.getContext('2d');
  g.fillStyle = bg;
  g.fillRect(0, 0, 680, 200);
  g.fillStyle = '#ffffff';
  g.fillRect(14, 14, 652, 172);
  g.fillStyle = bg;
  g.font = 'bold 88px Trebuchet MS, Arial, sans-serif';
  g.textAlign = 'center';
  g.textBaseline = 'middle';
  g.fillText(text, 340, 104);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

function buildShop({ x, z, side, wall, roof, signBg, label }) {
  const g = new THREE.Group();
  g.position.set(x, 0, z);
  scene.add(g);
  addBox(7, 3.2, 5, wall, g, 0, 1.6, 0);                     // body
  addBox(7.8, 0.5, 5.8, roof, g, 0, 3.45, 0);                // roof
  addBox(0.1, 2, 1.2, '#6b4423', g, side * 3.52, 1.0, 0);    // door (faces the plaza)
  addBox(0.1, 0.9, 1.0, '#b8ecff', g, side * 3.52, 1.5, -1.6).material = windowMat; // windows
  addBox(0.1, 0.9, 1.0, '#b8ecff', g, side * 3.52, 1.5, 1.6).material = windowMat;

  const sign = new THREE.Mesh(
    new THREE.PlaneGeometry(3.4, 1.0),
    new THREE.MeshBasicMaterial({ map: makeSignTexture(label, signBg) })
  );
  sign.position.set(side * 3.58, 2.65, 0);
  sign.rotation.y = side * Math.PI / 2;
  g.add(sign);

  addRectObs(x, z, 7, 5);
}

const plotViews = [];

function buildGarden() {
  // Wooden fence with a gap on the south side (aligned with the garden path)
  const WOOD = '#b57a44';
  const walls = [
    [0, -38, 16.5, 0.5],
    [-8, -30, 0.5, 16],
    [8, -30, 0.5, 16],
    [-4.75, -22, 6.5, 0.5],
    [4.75, -22, 6.5, 0.5],
  ];
  for (const [x, z, w, d] of walls) {
    addBox(w, 1, d, WOOD, scene, x, 0.5, z);
    addRectObs(x, z, w, d);
  }

  // Scarecrow decoration
  addBox(0.12, 1.6, 0.12, '#6b4423', scene, -6.5, 0.8, -36);
  addBox(1.2, 0.12, 0.12, '#6b4423', scene, -6.5, 1.3, -36);
  addMesh(new THREE.SphereGeometry(0.25, 10, 8), '#ffd3a1', scene, -6.5, 1.85, -36);
  addMesh(new THREE.ConeGeometry(0.3, 0.4, 8), '#e0a030', scene, -6.5, 2.2, -36);

  // Nine separate planting plots (3 x 3)
  for (let i = 0; i < PLOT_COUNT; i++) {
    const col = i % 3;
    const row = Math.floor(i / 3);
    const x = GARDEN.x + (col - 1) * 4.5;
    const z = GARDEN.z + (row - 1) * 4.5;

    const group = new THREE.Group();
    group.position.set(x, 0, z);
    scene.add(group);

    addBox(2.6, 0.3, 2.6, '#6b4423', group, 0, 0.15, 0);       // soil block
    addBox(2.3, 0.02, 2.3, '#7d4f2a', group, 0, 0.31, 0);      // soil top

    // Growth progress bar (hidden while empty)
    const bar = new THREE.Group();
    bar.position.set(0, 2.3, 0);
    group.add(bar);
    addBox(1.8, 0.16, 0.16, '#2b2233', bar, 0, 0, 0);
    const fill = addBox(1.6, 0.1, 0.18, '#7CFC4A', bar, 0, 0, 0);

    addRectObs(x, z, 2.6, 2.6);
    plotViews.push({ index: i, x, z, group, bar, fill, cropObj: null, visKey: '' });
  }
}

function buildNature() {
  const FOLIAGE = ['#2fbf4a', '#3ad65a', '#1f9e52', '#6fd44a'];
  const ROCK = ['#9aa3ad', '#b8bfc6', '#8d959e'];
  const BUSH = ['#2fb85a', '#3bcf62', '#27a04f'];
  const FLOWERS = ['#ff5fa2', '#ffe74a', '#b98cff', '#ffffff', '#ff7a3d'];

  // Trees
  scatter(85, (x, z) => {
    const tree = new THREE.Group();
    const h = 2 + rnd() * 1.4;
    addMesh(new THREE.CylinderGeometry(0.22, 0.32, h, 6), '#8b5a2b', tree, 0, h / 2, 0);
    const crown = FOLIAGE[Math.floor(rnd() * FOLIAGE.length)];
    const r = 1.1 + rnd() * 0.5;
    addMesh(new THREE.IcosahedronGeometry(r, 0), crown, tree, 0, h + r * 0.6, 0);
    addMesh(new THREE.IcosahedronGeometry(r * 0.7, 0), crown, tree, 0.5, h + r * 1.4, 0.2);
    tree.position.set(x, 0, z);
    tree.rotation.y = rnd() * Math.PI * 2;
    tree.scale.setScalar(0.9 + rnd() * 0.4);
    scene.add(tree);
    addCircleObs(x, z, 0.7);
  });

  // Rocks
  scatter(35, (x, z) => {
    const r = 0.5 + rnd() * 0.6;
    const rock = addMesh(new THREE.DodecahedronGeometry(r, 0), ROCK[Math.floor(rnd() * ROCK.length)], scene, x, r * 0.4, z);
    rock.rotation.set(rnd() * 3, rnd() * 3, 0);
    rock.scale.y = 0.7;
    addCircleObs(x, z, r * 0.9);
  });

  // Bushes (decorative, walkable-through visual only)
  scatter(90, (x, z) => {
    const r = 0.5 + rnd() * 0.4;
    addMesh(new THREE.IcosahedronGeometry(r, 0), BUSH[Math.floor(rnd() * BUSH.length)], scene, x, r * 0.6, z);
  });

  // Flower clusters
  scatter(50, (x, z) => {
    const cluster = new THREE.Group();
    cluster.position.set(x, 0, z);
    for (let i = 0; i < 4; i++) {
      const ox = (rnd() - 0.5) * 0.9, oz = (rnd() - 0.5) * 0.9;
      addMesh(new THREE.CylinderGeometry(0.03, 0.03, 0.4, 4), '#3fae3c', cluster, ox, 0.2, oz);
      addMesh(new THREE.IcosahedronGeometry(0.13, 0), FLOWERS[Math.floor(rnd() * FLOWERS.length)], cluster, ox, 0.45, oz);
    }
    scene.add(cluster);
  });

  // Hay bales
  scatter(8, (x, z) => {
    const bale = addMesh(new THREE.CylinderGeometry(0.6, 0.6, 1.1, 10), '#f5d157', scene, x, 0.6, z);
    bale.rotation.z = Math.PI / 2;
    addCircleObs(x, z, 0.7);
  });
}

function buildClouds() {
  for (let i = 0; i < 14; i++) {
    const c = new THREE.Group();
    for (let j = 0; j < 3; j++) {
      addMesh(new THREE.IcosahedronGeometry(3 + rnd() * 2, 0), '#ffffff', c, (j - 1) * 3 + rnd(), rnd() * 1.2, rnd() * 1.5);
    }
    c.position.set((rnd() - 0.5) * 300, 42 + rnd() * 12, (rnd() - 0.5) * 300);
    scene.add(c);
    clouds.push(c);
  }
}
const clouds = [];
function updateClouds(dt) {
  for (const c of clouds) {
    c.position.x += dt * 1.5;
    if (c.position.x > 170) c.position.x = -170;
  }
}

/* ---------------------------------------------------------
   CROP MODELS (prototypes cloned per plot)
   --------------------------------------------------------- */
function buildSprout() {
  const g = new THREE.Group();
  for (let i = 0; i < 3; i++) {
    const leaf = addMesh(new THREE.ConeGeometry(0.07, 0.35, 4), '#6fe05a', g, (i - 1) * 0.09, 0.17, 0);
    leaf.rotation.z = (i - 1) * 0.5;
  }
  return g;
}

// Generic 3D model for the extra crops, built from each crop's color and shape
function buildGenericFruit(def) {
  const g = new THREE.Group();
  const LEAF = '#3fbf4f';
  if (def.shape === 'stalk') {
    addMesh(new THREE.CylinderGeometry(0.07, 0.09, 1.1, 6), '#4cb84a', g, 0, 0.55, 0);
    addMesh(new THREE.SphereGeometry(0.42, 14, 10), def.color, g, 0, 1.25, 0).scale.set(1, 0.8, 1);
    addMesh(new THREE.ConeGeometry(0.14, 0.7, 5), LEAF, g, 0.35, 0.9, 0).rotation.z = -1.0;
    addMesh(new THREE.ConeGeometry(0.14, 0.7, 5), LEAF, g, -0.35, 0.9, 0).rotation.z = 1.0;
  } else if (def.shape === 'tree') {
    addMesh(new THREE.CylinderGeometry(0.15, 0.22, 1.0, 6), '#8b5a2b', g, 0, 0.5, 0);
    addMesh(new THREE.IcosahedronGeometry(0.6, 0), LEAF, g, 0, 1.45, 0);
    for (let i = 0; i < 5; i++) {
      const a = (i / 5) * Math.PI * 2;
      addMesh(new THREE.SphereGeometry(0.14, 10, 8), def.color, g, Math.cos(a) * 0.45, 1.2 + (i % 2) * 0.3, Math.sin(a) * 0.45);
    }
  } else {
    addMesh(new THREE.IcosahedronGeometry(0.5, 0), LEAF, g, 0, 0.45, 0);
    for (let i = 0; i < 6; i++) {
      const a = (i / 6) * Math.PI * 2;
      addMesh(new THREE.SphereGeometry(0.13, 10, 8), def.color, g, Math.cos(a) * 0.4, 0.55 + (i % 2) * 0.2, Math.sin(a) * 0.4);
    }
  }
  return g;
}

/* ---------------------------------------------------------
   NPC SHOPKEEPERS · models and name labels
   --------------------------------------------------------- */
function buildAbdul(g) {
  const SKIN = '#c68642', SHIRT = '#f5f5f0', VEST = '#2e8b57', PANTS = '#34495e';
  const BEARD = '#2b2b2b', SHOE = '#2b2233';
  addBox(0.36, 0.8, 0.36, PANTS, g, -0.22, 0.4, 0);
  addBox(0.36, 0.8, 0.36, PANTS, g, 0.22, 0.4, 0);
  addBox(0.44, 0.14, 0.5, SHOE, g, -0.22, 0.07, 0.05);
  addBox(0.44, 0.14, 0.5, SHOE, g, 0.22, 0.07, 0.05);
  addBox(0.95, 0.9, 0.5, SHIRT, g, 0, 1.25, 0);            // shirt
  addBox(1.0, 0.7, 0.56, VEST, g, 0, 1.3, 0.02);           // green vest
  addBox(0.3, 0.9, 0.3, SHIRT, g, -0.66, 1.25, 0);         // arms
  addBox(0.3, 0.9, 0.3, SHIRT, g, 0.66, 1.25, 0);
  addBox(0.3, 0.25, 0.3, SKIN, g, -0.66, 0.7, 0);
  addBox(0.3, 0.25, 0.3, SKIN, g, 0.66, 0.7, 0);
  addBox(0.8, 0.8, 0.8, SKIN, g, 0, 2.2, 0);               // head
  addBox(0.62, 0.34, 0.12, BEARD, g, 0, 1.95, 0.42);       // beard
  addBox(0.36, 0.06, 0.05, '#1a1a1a', g, 0, 2.02, 0.42);   // mustache
  addBox(0.16, 0.14, 0.06, '#222222', g, -0.18, 2.27, 0.41); // eyes
  addBox(0.16, 0.14, 0.06, '#222222', g, 0.18, 2.27, 0.41);
  addBox(1.0, 0.42, 1.0, '#ffffff', g, 0, 2.7, 0);         // white turban
  addBox(1.02, 0.12, 1.02, VEST, g, 0, 2.55, 0);           // green band
}

function buildNguyet(g) {
  const SKIN = '#f6d1b1', DRESS = '#ff7eb6', DRESS2 = '#ffb3d6', HAIR = '#1e1a2e';
  const BOW = '#ff3d7f', SHOE = '#4a2b3a';
  addMesh(new THREE.CylinderGeometry(0.45, 0.7, 1.2, 12), DRESS, g, 0, 0.6, 0); // skirt
  addBox(0.7, 0.55, 0.45, DRESS, g, 0, 1.35, 0);            // bodice
  addBox(0.24, 0.6, 0.24, DRESS2, g, -0.5, 1.3, 0);         // sleeves
  addBox(0.24, 0.6, 0.24, DRESS2, g, 0.5, 1.3, 0);
  addBox(0.2, 0.2, 0.2, SKIN, g, -0.5, 0.95, 0);            // hands
  addBox(0.2, 0.2, 0.2, SKIN, g, 0.5, 0.95, 0);
  addBox(0.75, 0.75, 0.75, SKIN, g, 0, 2.2, 0);             // head
  addBox(0.84, 0.3, 0.84, HAIR, g, 0, 2.6, 0);              // hair top
  addBox(0.84, 1.0, 0.2, HAIR, g, 0, 2.05, -0.4);           // long hair
  addBox(0.14, 0.8, 0.7, HAIR, g, -0.45, 2.0, 0);           // side hair
  addBox(0.14, 0.8, 0.7, HAIR, g, 0.45, 2.0, 0);
  addBox(0.13, 0.13, 0.05, '#222222', g, -0.17, 2.25, 0.39); // eyes
  addBox(0.13, 0.13, 0.05, '#222222', g, 0.17, 2.25, 0.39);
  addBox(0.14, 0.08, 0.04, '#ff8fab', g, -0.25, 2.1, 0.39);  // blush
  addBox(0.14, 0.08, 0.04, '#ff8fab', g, 0.25, 2.1, 0.39);
  addBox(0.2, 0.05, 0.04, '#c2456b', g, 0, 2.0, 0.39);       // smile
  addBox(0.22, 0.14, 0.1, BOW, g, 0.3, 2.72, 0.2);           // bow
  addBox(0.2, 0.12, 0.25, SHOE, g, -0.15, 0.06, 0.1);
  addBox(0.2, 0.12, 0.25, SHOE, g, 0.15, 0.06, 0.1);
}

function makeNameTexture(text, color) {
  const c = document.createElement('canvas');
  c.width = 384;
  c.height = 96;
  const g = c.getContext('2d');
  g.fillStyle = 'rgba(255,255,255,0.95)';
  g.fillRect(6, 14, 372, 68);
  g.fillStyle = color;
  g.font = 'bold 44px Trebuchet MS, Arial, sans-serif';
  g.textAlign = 'center';
  g.textBaseline = 'middle';
  g.fillText(text, 192, 50);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

function addNameLabel(parent, text, color, y) {
  const sprite = new THREE.Sprite(new THREE.SpriteMaterial({
    map: makeNameTexture(text, color), transparent: true, depthTest: false,
  }));
  sprite.scale.set(2.2, 0.55, 1);
  sprite.position.set(0, y, 0);
  sprite.renderOrder = 10;
  parent.add(sprite);
}

// side: +1 = Crop Store (faces +x), -1 = Seed Shop (faces -x)
function buildShopkeeper(kind, side) {
  const sx = kind === 'abdul' ? SELL.x : SHOP.x;
  const sz = kind === 'abdul' ? SELL.z : SHOP.z;
  const counterX = sx + side * 5.2;
  addBox(0.9, 1.0, 3.2, '#a0673a', scene, counterX, 0.5, sz);     // counter
  addBox(1.0, 0.08, 3.4, '#fff8e7', scene, counterX, 1.04, sz);   // counter top
  [[-0.9, '#ff8c1a'], [0, '#ff3b30'], [0.9, '#ffd60a']].forEach(([dz, col]) =>
    addMesh(new THREE.SphereGeometry(0.14, 8, 6), col, scene, counterX, 1.2, sz + dz));
  addRectObs(counterX, sz, 0.9, 3.2);                              // counter blocks walking

  const npc = new THREE.Group();
  npc.position.set(sx + side * 4.2, 0, sz);   // behind the counter
  npc.rotation.y = side * Math.PI / 2;        // face the customers
  scene.add(npc);
  if (kind === 'abdul') buildAbdul(npc); else buildNguyet(npc);
  addNameLabel(npc, NPC_INFO[kind].name, kind === 'abdul' ? '#1d6b3a' : '#c2456b', 3.3);
}

function buildNpcs() {
  buildShopkeeper('abdul', 1);
  buildShopkeeper('nguyet', -1);
}

function buildCrop(key) {
  if (CROPS[key].shape) return buildGenericFruit(CROPS[key]);
  const g = new THREE.Group();
  if (key === 'carrot') {
    addMesh(new THREE.ConeGeometry(0.22, 0.9, 8), CROPS.carrot.color, g, 0, 0.4, 0).rotation.x = Math.PI;
    const l = addMesh(new THREE.ConeGeometry(0.1, 0.8, 5), '#3fbf3f', g, -0.12, 1.2, 0); l.rotation.z = 0.35;
    const r = addMesh(new THREE.ConeGeometry(0.1, 0.8, 5), '#3fbf3f', g, 0.12, 1.2, 0); r.rotation.z = -0.35;
    const f = addMesh(new THREE.ConeGeometry(0.1, 0.8, 5), '#4fd24f', g, 0, 1.25, 0.1); f.rotation.x = -0.35;
  } else if (key === 'tomato') {
    addMesh(new THREE.CylinderGeometry(0.05, 0.07, 0.9, 6), '#3f9c3a', g, 0, 0.45, 0);
    addMesh(new THREE.IcosahedronGeometry(0.45, 0), '#37b544', g, 0, 1.0, 0);
    [[0.32, 0.7, 0.2], [-0.28, 0.92, 0.18], [0.05, 0.55, -0.32], [-0.18, 1.25, -0.1], [0.22, 1.2, 0.25]]
      .forEach(([x, y, z]) => addMesh(new THREE.SphereGeometry(0.15, 10, 8), CROPS.tomato.color, g, x, y, z));
  } else if (key === 'corn') {
    addMesh(new THREE.CylinderGeometry(0.06, 0.07, 1.7, 6), '#4cb84a', g, 0, 0.85, 0);
    const cob = addMesh(new THREE.CylinderGeometry(0.13, 0.1, 0.6, 8), CROPS.corn.color, g, 0.16, 0.95, 0);
    cob.rotation.z = -0.35;
    const la = addMesh(new THREE.ConeGeometry(0.12, 0.9, 4), '#43b843', g, 0.1, 0.7, 0); la.rotation.z = -1.0;
    const lb = addMesh(new THREE.ConeGeometry(0.12, 0.9, 4), '#43b843', g, -0.1, 1.05, 0); lb.rotation.z = 1.0;
    addMesh(new THREE.CylinderGeometry(0.04, 0.02, 0.35, 5), '#c08a3e', g, 0, 1.85, 0);
  } else if (key === 'strawberry') {
    const mound = addMesh(new THREE.IcosahedronGeometry(0.5, 0), '#2fbf4f', g, 0, 0.25, 0);
    mound.scale.set(1, 0.7, 1);
    for (let i = 0; i < 7; i++) {
      const a = (i / 7) * Math.PI * 2;
      const b = addMesh(new THREE.ConeGeometry(0.12, 0.24, 6), CROPS.strawberry.color, g, Math.cos(a) * 0.42, 0.26, Math.sin(a) * 0.42);
      b.rotation.x = Math.PI;
    }
    for (let i = 0; i < 3; i++) {
      const a = (i / 3) * Math.PI * 2 + 0.5;
      const b = addMesh(new THREE.ConeGeometry(0.1, 0.2, 6), CROPS.strawberry.color, g, Math.cos(a) * 0.18, 0.6, Math.sin(a) * 0.18);
      b.rotation.x = Math.PI;
    }
  }
  return g;
}

let sproutProto;
const cropProto = {};

/* ---------------------------------------------------------
   PLAYER (Roblox-inspired blocky avatar)
   --------------------------------------------------------- */
const player = { x: 0, y: 0, z: 6, vy: 0, grounded: true, facing: 0, walk: 0 };

function buildAvatar() {
  const root = new THREE.Group();
  scene.add(root);
  const SHIRT = '#ff4f6d', PANTS = '#2f6bff', SKIN = '#ffd3a1', HAIR = '#5a3a1f', SHOE = '#2b2233';

  addBox(0.9, 0.9, 0.5, SHIRT, root, 0, 1.25, 0);     // torso
  addBox(0.8, 0.8, 0.8, SKIN, root, 0, 2.2, 0);       // head
  addBox(0.84, 0.22, 0.84, HAIR, root, 0, 2.6, 0);    // hair
  addBox(0.14, 0.14, 0.05, '#222222', root, -0.18, 2.25, 0.41); // eyes
  addBox(0.14, 0.14, 0.05, '#222222', root, 0.18, 2.25, 0.41);
  addBox(0.3, 0.06, 0.05, '#b5435a', root, 0, 2.05, 0.41);      // smile

  const makeArm = x => {
    const pivot = new THREE.Group();
    pivot.position.set(x, 1.7, 0);
    root.add(pivot);
    addBox(0.3, 0.85, 0.3, SHIRT, pivot, 0, -0.42, 0);
    addBox(0.3, 0.2, 0.3, SKIN, pivot, 0, -0.9, 0);
    return pivot;
  };
  const makeLeg = x => {
    const pivot = new THREE.Group();
    pivot.position.set(x, 0.8, 0);
    root.add(pivot);
    addBox(0.38, 0.75, 0.4, PANTS, pivot, 0, -0.38, 0);
    addBox(0.4, 0.13, 0.5, SHOE, pivot, 0, -0.735, 0.05);
    return pivot;
  };

  return {
    root,
    armL: makeArm(-0.62),
    armR: makeArm(0.62),
    legL: makeLeg(-0.23),
    legR: makeLeg(0.23),
  };
}

/* ---------------------------------------------------------
   INPUT
   --------------------------------------------------------- */
const keys = new Set();
let jumpQueued = false;
const isDown = (...codes) => codes.some(c => keys.has(c));
const joy = { x: 0, y: 0, id: null };

function updateJoystick(e) {
  const r = dom.joy.getBoundingClientRect();
  const cx = r.left + r.width / 2, cy = r.top + r.height / 2;
  const max = r.width / 2;
  let dx = e.clientX - cx, dy = e.clientY - cy;
  const len = Math.hypot(dx, dy);
  if (len > max) { dx *= max / len; dy *= max / len; }
  joy.x = dx / max;
  joy.y = -dy / max;
  if (Math.hypot(joy.x, joy.y) < 0.12) { joy.x = 0; joy.y = 0; }
  dom.joyKnob.style.transform = `translate(calc(-50% + ${dx}px), calc(-50% + ${dy}px))`;
}
function resetJoystick() {
  joy.x = 0; joy.y = 0; joy.id = null;
  dom.joyKnob.style.transform = 'translate(-50%, -50%)';
}

dom.joy.addEventListener('pointerdown', e => {
  joy.id = e.pointerId;
  dom.joy.setPointerCapture(e.pointerId);
  updateJoystick(e);
});
dom.joy.addEventListener('pointermove', e => { if (e.pointerId === joy.id) updateJoystick(e); });
const endJoy = e => { if (e.pointerId === joy.id) resetJoystick(); };
dom.joy.addEventListener('pointerup', endJoy);
dom.joy.addEventListener('pointercancel', endJoy);

// Camera rotation by dragging, pinch-to-zoom with two fingers, wheel zoom
const activePointers = new Map();
let rotating = null, pinch = null;
dom.canvas.addEventListener('pointerdown', e => {
  if (editing) return;
  activePointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
  dom.canvas.setPointerCapture(e.pointerId);
  if (activePointers.size === 2) {
    const [a, b] = [...activePointers.values()];
    pinch = { d0: Math.hypot(a.x - b.x, a.y - b.y) || 1, zoom0: cam.targetDist };
    rotating = null;
  } else if (activePointers.size === 1) {
    rotating = { id: e.pointerId };
  }
});
dom.canvas.addEventListener('pointermove', e => {
  const p = activePointers.get(e.pointerId);
  if (!p) return;
  const prevX = p.x, prevY = p.y;
  p.x = e.clientX; p.y = e.clientY;
  if (pinch && activePointers.size === 2) {
    const [a, b] = [...activePointers.values()];
    const d = Math.hypot(a.x - b.x, a.y - b.y) || 1;
    cam.targetDist = clamp(pinch.zoom0 * pinch.d0 / d, CAM_MIN, CAM_MAX);
    return;
  }
  if (rotating && rotating.id === e.pointerId) {
    cam.yaw -= (p.x - prevX) * 0.006;
    cam.pitch = clamp(cam.pitch - (p.y - prevY) * 0.004, 0.1, 1.3);
  }
});
const endPointer = e => {
  activePointers.delete(e.pointerId);
  if (activePointers.size < 2) pinch = null;
  if (activePointers.size === 1) {
    const [id] = activePointers.keys();
    rotating = { id };
  } else if (activePointers.size === 0) {
    rotating = null;
  }
};
dom.canvas.addEventListener('pointerup', endPointer);
dom.canvas.addEventListener('pointercancel', endPointer);
dom.canvas.addEventListener('contextmenu', e => e.preventDefault());
dom.canvas.addEventListener('wheel', e => zoomBy(e.deltaY * 0.01), { passive: true });

addEventListener('keydown', e => {
  if (['Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.code)) e.preventDefault();
  if (e.code === 'Escape') { if (modalMode) closeModal(); return; }
  if (e.repeat) return;
  keys.add(e.code);
  if (e.code === 'Space' && !modalMode) jumpQueued = true;
  if (e.code === 'KeyE') { if (modalMode) closeModal(); else interact(); }
  const num = e.code.match(/^(?:Digit|Numpad)([1-4])$/);
  if (num) selectSeed(CROP_KEYS[Number(num[1]) - 1]);
});
addEventListener('keyup', e => keys.delete(e.code));
addEventListener('blur', () => keys.clear());

dom.interact.addEventListener('pointerdown', e => { e.preventDefault(); interact(); });
dom.jump.addEventListener('pointerdown', e => { e.preventDefault(); if (!modalMode) jumpQueued = true; });

/* ---------------------------------------------------------
   GAMEPLAY ACTIONS
   --------------------------------------------------------- */
function gainXp(amount) {
  const before = levelFromXp(state.xp);
  state.xp += amount;
  const after = levelFromXp(state.xp);
  if (after > before) notify(`🎉 Level up! You are now level ${after}.`, 'success');
}

function plantSeed(i) {
  const key = state.selectedSeed;
  const c = CROPS[key];
  if (state.seeds[key] <= 0) {
    notify(`No ${c.name} seeds left. Visit the Seed Shop to buy more!`, 'error');
    return;
  }
  state.seeds[key] -= 1;
  state.plots[i] = { crop: key, plantedAt: Date.now() };
  notify(`Planted ${c.name} in plot ${i + 1}. Ready in ${c.growSec}s.`, 'success');
  playPlant();
  save();
  refreshUI();
}

function harvestPlot(i) {
  const plot = state.plots[i];
  if (!plot.crop) return;
  const key = plot.crop;
  const c = CROPS[key];
  // Clear the plot synchronously so the crop can never be harvested twice
  state.plots[i] = { crop: null, plantedAt: 0 };
  state.crops[key] += 1;
  gainXp(c.xp);
  notify(`Harvested a ${c.name}! Added to your inventory.`, 'success');
  playHarvest();
  save();
  refreshUI();
}

function plotAction(i) {
  const p = state.plots[i];
  if (!p.crop) { plantSeed(i); return; }
  if (plotProgress(p) >= 1) { harvestPlot(i); return; }
  notify(`${CROPS[p.crop].name} is still growing. Be patient!`, 'info');
}

function plotLabel(i) {
  const p = state.plots[i];
  if (!p.crop) {
    const sel = state.selectedSeed;
    if (state.seeds[sel] > 0) return `Plant ${CROPS[sel].name} · Plot ${i + 1}`;
    return `Empty plot · select seeds you own (1–4)`;
  }
  const prog = plotProgress(p);
  if (prog >= 1) return `Harvest ${CROPS[p.crop].name} · Plot ${i + 1}`;
  return `${CROPS[p.crop].name} growing · ${Math.floor(prog * 100)}%`;
}

function buySeeds(key, qty) {
  if (!Number.isInteger(qty) || qty < 1) return;
  const c = CROPS[key];
  const cost = c.seedPrice * qty;
  if (state.coins < cost) {
    notify('Not enough coins! Sell some crops to earn more money.', 'error');
    return;
  }
  state.coins -= cost;
  playCoin();
  state.seeds[key] += qty;
  notify(`Successfully purchased ${qty} ${c.name} Seed${qty > 1 ? 's' : ''}!`, 'success');
  save();
  refreshUI();
}

function sellCrops(key, qty) {
  const c = CROPS[key];
  const n = Math.min(qty, state.crops[key]);
  if (n <= 0) {
    notify(`You have no ${c.name} to sell.`, 'error');
    return;
  }
  const gain = n * c.sellPrice;
  state.crops[key] -= n;
  state.coins += gain;
  playCoin();
  notify(`Sold ${n} ${c.name}${n > 1 ? 's' : ''} for +🪙${gain}!`, 'success');
  save();
  refreshUI();
}

function selectSeed(key) {
  state.selectedSeed = key;
  notify(`Selected ${CROPS[key].name} seeds.`, 'info');
  save();
  refreshUI();
}

/* ---------------------------------------------------------
   INTERACTION TARGETS
   --------------------------------------------------------- */
const targets = [];

function buildTargets() {
  plotViews.forEach((v, i) => targets.push({
    x: v.x, z: v.z, range: INTERACT_RANGE,
    label: () => plotLabel(i),
    run: () => plotAction(i),
  }));
  targets.push({
    x: SHOP.x, z: SHOP.z, range: 8,
    label: () => 'Talk to Nguyet · Seed Shop',
    run: () => talkTo('nguyet'),
  });
  targets.push({
    x: SELL.x, z: SELL.z, range: 8,
    label: () => 'Talk to Abdul · Crop Store',
    run: () => talkTo('abdul'),
  });
}

function nearestTarget() {
  let best = null, bestD = Infinity;
  for (const t of targets) {
    const d = Math.hypot(t.x - player.x, t.z - player.z);
    if (d <= t.range && d < bestD) { best = t; bestD = d; }
  }
  return best;
}

function interact() {
  if (modalMode) return;
  const t = nearestTarget();
  if (!t) {
    notify('Walk up to a plot or building, then press E.', 'info');
    return;
  }
  t.run();
}

/* ---------------------------------------------------------
   HUD
   --------------------------------------------------------- */
function buildHotbar() {
  CROP_KEYS.forEach((k, i) => {
    const c = CROPS[k];
    const btn = document.createElement('button');
    btn.className = 'seed-slot';
    btn.dataset.key = k;
    btn.innerHTML = `
      <span class="slot-key">${i + 1}</span>
      <span class="slot-emoji">${c.emoji}</span>
      <span class="slot-name">${c.name}</span>
      <span class="slot-count"></span>`;
    btn.addEventListener('pointerdown', e => { e.preventDefault(); selectSeed(k); });
    dom.hotbar.appendChild(btn);
  });
}

function updateHUD() {
  dom.coins.textContent = state.coins;
  dom.level.textContent = levelFromXp(state.xp);
  dom.xpFill.style.width = `${((state.xp % XP_PER_LEVEL) / XP_PER_LEVEL) * 100}%`;

  const sel = CROPS[state.selectedSeed];
  dom.selected.textContent = `Selected: ${sel.emoji} ${sel.name} · ${state.seeds[state.selectedSeed]} left`;

  renderBag();
  dom.hotbar.querySelectorAll('.seed-slot').forEach(btn => {
    const k = btn.dataset.key;
    btn.classList.toggle('active', k === state.selectedSeed);
    btn.classList.toggle('empty', state.seeds[k] === 0);
    btn.querySelector('.slot-count').textContent = `x${state.seeds[k]}`;
  });
}

// Bottom bag: every seed and harvested crop you own (tap a chip to select it)
function renderBag() {
  const bag = document.getElementById('bag-strip');
  bag.innerHTML = bagKeys().map(k => {
    const c = CROPS[k];
    return `
      <div class="bag-chip ${k === state.selectedSeed ? 'active' : ''}" data-key="${k}">
        <span class="bag-seed">🌱 ${state.seeds[k]}</span>
        <span class="bag-crop">${c.emoji} ${state.crops[k]}</span>
      </div>`;
  }).join('');
}
document.getElementById('bag-strip').addEventListener('pointerdown', e => {
  const chip = e.target.closest('.bag-chip');
  if (!chip) return;
  e.preventDefault();
  selectSeed(chip.dataset.key);
});

/* ---------------------------------------------------------
   NPC SHOP SYSTEM · Abdul (sells crops) and Nguyet (sells seeds)
   Uses the existing coins, inventory, planting and save code.
   --------------------------------------------------------- */
const NPC_INFO = {
  abdul:  { name: 'Abdul',  role: 'Crop Buyer',  avatar: '🧔', line: 'Hello! Welcome to my store. You wanna sell your crops?' },
  nguyet: { name: 'Nguyet', role: 'Seed Seller', avatar: '👩', line: 'Hi! Welcome to my seed shop. You wanna buy some seeds?' },
};
const SHOP_RARITY = {
  carrot: 'COMMON', tomato: 'COMMON', potato: 'COMMON', corn: 'COMMON', strawberry: 'COMMON',
  blueberry: 'UNCOMMON', watermelon: 'UNCOMMON', banana: 'UNCOMMON', orange: 'UNCOMMON', grapes: 'UNCOMMON',
  mango: 'RARE', pineapple: 'RARE', dragonfruit: 'RARE', cherry: 'RARE', coconut: 'RARE',
  goldenapple: 'EPIC', crystalberry: 'EPIC', rainbowmelon: 'EPIC', moonflower: 'EPIC',
  celestialfruit: 'LEGENDARY', starfruit: 'LEGENDARY', goldendragonfruit: 'LEGENDARY',
};
const RARITY_ORDER = ['COMMON', 'UNCOMMON', 'RARE', 'EPIC', 'LEGENDARY'];
const RARITY_COLOR = { COMMON: '#8e9aaf', UNCOMMON: '#3ccf5e', RARE: '#3aa8ff', EPIC: '#b05cff', LEGENDARY: '#ffb300' };

const npcUI = { filter: 'ALL', buyQty: {}, sellQty: {} };

// Stops double clicks from running the same transaction twice: a repeat click
// on the same button within 500 ms is ignored. Different buttons are not affected.
const lastTxByButton = {};
function withTx(id, fn) {
  const now = Date.now();
  if (now - (lastTxByButton[id] || 0) < 500) return;
  lastTxByButton[id] = now;
  fn();
}

function plural(name, n) {
  if (n === 1) return name;
  if (name.endsWith('y')) return name.slice(0, -1) + 'ies';
  if (name.endsWith('o')) return name + 'es';
  return name + 's';
}

// Bag shows the 4 starter crops plus anything else the player owns
function bagKeys() {
  return ALL_CROP_KEYS.filter(k => CROP_KEYS.includes(k) || state.seeds[k] > 0 || state.crops[k] > 0);
}

function showNpcOverlay() {
  document.getElementById('npc-overlay').classList.remove('hidden');
}

function talkTo(who) {
  if (modalMode) return;
  modalMode = `${who}-ask`;
  showNpcOverlay();
  renderNpcPanel();
}

function openSeedShop() {
  npcUI.buyQty = {};
  npcUI.filter = 'ALL';
  modalMode = 'nguyet-buy';
  showNpcOverlay();
  renderNpcPanel();
}

function sellBatch(batch) {
  let total = 0;
  for (const [k, n] of batch) {
    const gain = n * CROPS[k].sellPrice;
    state.crops[k] -= n;
    state.coins += gain;
    total += gain;
    notify(`You sold ${n} ${plural(CROPS[k].name, n)}!`, 'success');
  }
  notify(`+${total} Coins`, 'success');
  playCoin();
  save();
  refreshUI();
}

function sellSelected() {
  const batch = ALL_CROP_KEYS
    .map(k => [k, Math.min(npcUI.sellQty[k] || 0, state.crops[k])])
    .filter(([, n]) => n > 0);
  if (!batch.length) { notify('Choose how many crops to sell first.', 'info'); return; }
  npcUI.sellQty = {};
  sellBatch(batch);
}

function sellAll() {
  const batch = ALL_CROP_KEYS.filter(k => state.crops[k] > 0).map(k => [k, state.crops[k]]);
  if (!batch.length) { notify("You don't have any crops to sell yet!", 'error'); return; }
  npcUI.sellQty = {};
  sellBatch(batch);
}

function dialogHTML(who) {
  const n = NPC_INFO[who];
  return `
    <div class="npc-head">
      <span class="npc-avatar">${n.avatar}</span>
      <div><b>${n.name}</b><small>${n.role}</small></div>
      <button class="npc-x" data-act="close" aria-label="Close">✕</button>
    </div>
    <div class="speech">“${n.line}”</div>
    <div class="npc-buttons">
      <button class="btn-yes" data-act="yes">YES</button>
      <button class="btn-no" data-act="no">NO</button>
    </div>`;
}

function sellPanelHTML() {
  const n = NPC_INFO.abdul;
  const owned = ALL_CROP_KEYS.filter(k => state.crops[k] > 0);
  let selVal = 0, totVal = 0;
  let rows;
  if (!owned.length) {
    rows = `<p class="npc-empty">You don't have any crops to sell yet!</p>`;
  } else {
    rows = owned.map(k => {
      const c = CROPS[k];
      const have = state.crops[k];
      const sel = Math.min(npcUI.sellQty[k] || 0, have);
      selVal += sel * c.sellPrice;
      totVal += have * c.sellPrice;
      return `
        <div class="shop-row" style="--rc:${c.color}">
          <span class="row-emoji">${c.emoji}</span>
          <div class="row-info"><b>${c.name}</b><small>🪙${c.sellPrice} each · you have ${have}</small></div>
          <div class="stepper">
            <button data-act="sell-dec" data-key="${k}">−</button>
            <span>${sel}</span>
            <button data-act="sell-inc" data-key="${k}">+</button>
          </div>
          <div class="row-total">🪙${sel * c.sellPrice}</div>
        </div>`;
    }).join('');
  }
  return `
    <div class="npc-head">
      <span class="npc-avatar">${n.avatar}</span>
      <div><b>Abdul's Crop Store</b><small>Your coins: <span class="balance">🪙 ${state.coins}</span></small></div>
      <button class="npc-x" data-act="close" aria-label="Close">✕</button>
    </div>
    <div class="shop-list">${rows}</div>
    ${owned.length ? `
      <div class="npc-total"><span>Selected value</span><span>🪙 ${selVal}</span></div>
      <div class="npc-total"><span>Total crop value</span><span>🪙 ${totVal}</span></div>` : ''}
    <div class="npc-footer">
      <button class="btn-sell-sel" data-act="sell-selected" ${selVal ? '' : 'disabled'}>SELL SELECTED</button>
      <button class="btn-sell-all" data-act="sell-all" ${owned.length ? '' : 'disabled'}>SELL ALL</button>
      <button class="btn-close" data-act="close">CLOSE</button>
    </div>`;
}

function seedPanelHTML() {
  const filters = ['ALL', ...RARITY_ORDER].map(r => {
    const col = r === 'ALL' ? '#7b4fd6' : RARITY_COLOR[r];
    return `<button class="filter ${npcUI.filter === r ? 'active' : ''}" style="--rc:${col}" data-act="filter" data-key="${r}">${r}</button>`;
  }).join('');
  const keys = ALL_CROP_KEYS.filter(k => npcUI.filter === 'ALL' || SHOP_RARITY[k] === npcUI.filter);
  const cards = keys.map(k => {
    const c = CROPS[k];
    const r = SHOP_RARITY[k];
    const qty = npcUI.buyQty[k] || 1;
    const cost = qty * c.seedPrice;
    return `
      <div class="shop-card" style="--rc:${RARITY_COLOR[r]}">
        <div class="icon">${c.emoji}</div>
        <b>${c.name} Seed</b>
        <span class="rarity">${r}</span>
        <small>🪙 ${c.seedPrice} each · grows in ${c.growSec}s</small>
        <small>You own: ${state.seeds[k]}</small>
        <div class="stepper">
          <button data-act="buy-dec" data-key="${k}">−</button>
          <span>${qty}</span>
          <button data-act="buy-inc" data-key="${k}">+</button>
        </div>
        <button class="buy-btn" data-act="buy" data-key="${k}">BUY · 🪙${cost}</button>
      </div>`;
  }).join('');
  return `
    <div class="npc-head">
      <span class="npc-avatar">${NPC_INFO.nguyet.avatar}</span>
      <div><b>Nguyet's Seed Shop</b><small>Your coins: <span class="balance">🪙 ${state.coins}</span></small></div>
      <button class="npc-x" data-act="close" aria-label="Close">✕</button>
    </div>
    <div class="filters">${filters}</div>
    <div class="seed-grid">${cards}</div>`;
}

function renderNpcPanel() {
  const card = document.getElementById('npc-card');
  if (!card || !modalMode || !modalMode.includes('-')) return;
  card.classList.toggle('dialog', modalMode.endsWith('-ask'));
  if (modalMode === 'abdul-ask') card.innerHTML = dialogHTML('abdul');
  else if (modalMode === 'nguyet-ask') card.innerHTML = dialogHTML('nguyet');
  else if (modalMode === 'abdul-sell') card.innerHTML = sellPanelHTML();
  else if (modalMode === 'nguyet-buy') card.innerHTML = seedPanelHTML();
}

document.getElementById('npc-overlay').addEventListener('click', e => {
  const b = e.target.closest('[data-act]');
  if (!b || b.disabled) return;
  const act = b.dataset.act;
  const key = b.dataset.key;

  if (act === 'yes') {
    if (modalMode === 'abdul-ask') { npcUI.sellQty = {}; modalMode = 'abdul-sell'; renderNpcPanel(); }
    else if (modalMode === 'nguyet-ask') openSeedShop();
  } else if (act === 'no' || act === 'close') {
    closeModal();
  } else if (act === 'sell-inc') {
    npcUI.sellQty[key] = Math.min(state.crops[key], (npcUI.sellQty[key] || 0) + 1);
    renderNpcPanel();
  } else if (act === 'sell-dec') {
    npcUI.sellQty[key] = Math.max(0, (npcUI.sellQty[key] || 0) - 1);
    renderNpcPanel();
  } else if (act === 'sell-selected') {
    withTx('sell-selected', sellSelected);
  } else if (act === 'sell-all') {
    withTx('sell-all', sellAll);
  } else if (act === 'filter') {
    npcUI.filter = key;
    renderNpcPanel();
  } else if (act === 'buy-inc') {
    npcUI.buyQty[key] = Math.min(99, (npcUI.buyQty[key] || 1) + 1);
    renderNpcPanel();
  } else if (act === 'buy-dec') {
    npcUI.buyQty[key] = Math.max(1, (npcUI.buyQty[key] || 1) - 1);
    renderNpcPanel();
  } else if (act === 'buy') {
    withTx('buy:' + key, () => buySeeds(key, npcUI.buyQty[key] || 1));
  }
});

/* ---------------------------------------------------------
   DAY & NIGHT CYCLE · sun, moon, stars, sky colours, lamps
   One in-game day = DAY_LENGTH seconds (20 minutes).
   Phase 0 = sunrise (6:00). A new day starts at dawn, and that
   is when the coins reset to 100.
   --------------------------------------------------------- */
const DAY_LENGTH = 1200;
const DAY_KEYS_RAW = [
  { p: 0.00, top: '#9fd8ff', bot: '#ffd2a0', sun: '#ffc27a', sunI: 1.0,  hemi: 0.9,  fog: '#ffd9b0' }, // dawn, golden morning
  { p: 0.10, top: '#8fd0ff', bot: '#c9ecff', sun: '#fff0c4', sunI: 1.5,  hemi: 1.1,  fog: '#bfeaff' }, // morning, light blue
  { p: 0.25, top: '#3f9cff', bot: '#d6f5ff', sun: '#fff6e0', sunI: 1.9,  hemi: 1.2,  fog: '#bfeaff' }, // noon, bright
  { p: 0.40, top: '#5aa8ff', bot: '#e8f7ff', sun: '#ffeccc', sunI: 1.7,  hemi: 1.15, fog: '#cfeeff' }, // afternoon
  { p: 0.50, top: '#6a7fd6', bot: '#ff9e7a', sun: '#ffa060', sunI: 1.1,  hemi: 0.85, fog: '#ffb08a' }, // sunset
  { p: 0.58, top: '#34407a', bot: '#ff7fa8', sun: '#ff8a80', sunI: 0.4,  hemi: 0.5,  fog: '#8a6ab0' }, // pink dusk
  { p: 0.68, top: '#101a3d', bot: '#253a6e', sun: '#9fb4ff', sunI: 0.15, hemi: 0.35, fog: '#1f2c5a' }, // night
  { p: 0.90, top: '#0b1230', bot: '#1b2a55', sun: '#9fb4ff', sunI: 0.12, hemi: 0.3,  fog: '#18244d' }, // late night
  { p: 1.00, top: '#9fd8ff', bot: '#ffd2a0', sun: '#ffc27a', sunI: 1.0,  hemi: 0.9,  fog: '#ffd9b0' }, // back to dawn
];
const hexRGB = h => [1, 3, 5].map(i => parseInt(h.slice(i, i + 2), 16) / 255);
const rgbHex = c => '#' + c.map(v => Math.round(clamp(v, 0, 1) * 255).toString(16).padStart(2, '0')).join('');
const lerpArr = (a, b, t) => a.map((v, i) => v + (b[i] - v) * t);
const DAY_KEYS = DAY_KEYS_RAW.map(k => ({
  ...k, top: hexRGB(k.top), bot: hexRGB(k.bot), sun: hexRGB(k.sun), fog: hexRGB(k.fog),
}));

function dayKeyAt(p) {
  let i = 0;
  while (i < DAY_KEYS.length - 2 && DAY_KEYS[i + 1].p <= p) i++;
  const a = DAY_KEYS[i], b = DAY_KEYS[i + 1];
  const t = clamp((p - a.p) / (b.p - a.p), 0, 1);
  const s = t * t * (3 - 2 * t); // smooth transition between keyframes
  return {
    top: lerpArr(a.top, b.top, s),
    bot: lerpArr(a.bot, b.bot, s),
    sun: lerpArr(a.sun, b.sun, s),
    fog: lerpArr(a.fog, b.fog, s),
    sunI: a.sunI + (b.sunI - a.sunI) * s,
    hemi: a.hemi + (b.hemi - a.hemi) * s,
  };
}

function periodName(p) {
  return p < 0.2 ? 'Morning' : p < 0.45 ? 'Afternoon' : p < 0.6 ? 'Evening' : 'Night';
}
const PERIOD_ICON = { Morning: '🌅', Afternoon: '☀️', Evening: '🌇', Night: '🌙' };

// Lamps and shop windows share these materials, so one change lights them all
const lampMat = new THREE.MeshStandardMaterial({ color: '#fff2b0', emissive: '#ffd36b', emissiveIntensity: 0 });
const windowMat = new THREE.MeshStandardMaterial({ color: '#b8ecff', emissive: '#ffb347', emissiveIntensity: 0 });

let sunMesh = null, moonMesh = null, sunMat = null, moonMat = null, starsMat = null, skyGeo = null;
const clockText = $('clock-text');
let chirpTimer = 3;

function buildCelestial() {
  sunMat = new THREE.MeshBasicMaterial({ color: '#fff3c4', fog: false });
  sunMesh = new THREE.Mesh(new THREE.SphereGeometry(9, 20, 14), sunMat);
  moonMat = new THREE.MeshBasicMaterial({ color: '#e6edff', fog: false });
  moonMesh = new THREE.Mesh(new THREE.SphereGeometry(6, 18, 12), moonMat);
  scene.add(sunMesh, moonMesh);

  // Stars use Math.random so the seeded world layout does not change
  const N = 340;
  const pos = new Float32Array(N * 3);
  for (let i = 0; i < N; i++) {
    const x = Math.random() - 0.5, y = 0.12 + Math.random() * 0.88, z = Math.random() - 0.5;
    const l = Math.hypot(x, y, z) || 1;
    pos.set([x / l * 280, y / l * 280, z / l * 280], i * 3);
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  starsMat = new THREE.PointsMaterial({
    color: '#ffffff', size: 2.2, sizeAttenuation: false, transparent: true, opacity: 0, fog: false,
  });
  scene.add(new THREE.Points(geo, starsMat));
}

function updateDayNight(dt) {
  state.gameTime += dt;

  // New morning: coins reset to the starting amount
  const day = Math.floor(state.gameTime / DAY_LENGTH);
  if (day > state.lastResetDay) {
    state.lastResetDay = day;
    state.coins = START_COINS;
    notify('🌅 A new morning! Your coins were reset to 🪙100.', 'info');
    save();
    refreshUI();
  }

  const p = (state.gameTime % DAY_LENGTH) / DAY_LENGTH;
  const th = p * Math.PI * 2;
  let sx = Math.cos(th), sy = Math.sin(th), sz = 0.35;
  const sl = Math.hypot(sx, sy, sz);
  sx /= sl; sy /= sl; sz /= sl;

  const d = dayKeyAt(p);
  const lampAmt = clamp((1.0 - d.sunI) / 0.7, 0, 1); // 0 in daylight, 1 at night

  // Sun light and ambient light
  sun.color.set(rgbHex(d.sun));
  sun.intensity = d.sunI;
  sun.position.set(player.x + sx * 80, Math.max(sy * 80, 6), player.z + sz * 80);
  sun.target.position.set(player.x, 0, player.z);
  sun.target.updateMatrixWorld();
  hemiLight.intensity = d.hemi;
  scene.fog.color.set(rgbHex(d.fog));

  // Sky gradient
  if (skyGeo) {
    const pos = skyGeo.attributes.position, col = skyGeo.attributes.color;
    for (let i = 0; i < pos.count; i++) {
      const t = clamp(pos.getY(i) / 300, 0, 1), f = Math.pow(t, 0.6);
      col.setXYZ(i,
        d.bot[0] + (d.top[0] - d.bot[0]) * f,
        d.bot[1] + (d.top[1] - d.bot[1]) * f,
        d.bot[2] + (d.top[2] - d.bot[2]) * f);
    }
    col.needsUpdate = true;
  }

  // Sun and moon orbit the player
  sunMat.color.set(rgbHex(d.sun));
  sunMesh.position.set(player.x + sx * 200, sy * 200, player.z + sz * 200);
  moonMesh.position.set(player.x - sx * 200, -sy * 200, player.z - sz * 200);
  sunMesh.visible = sy > -0.12;
  moonMesh.visible = sy < 0.12;

  // Night lighting
  lampMat.emissiveIntensity = lampAmt * 1.6;
  windowMat.emissiveIntensity = lampAmt * 1.1;
  starsMat.opacity = clamp((0.6 - d.sunI) / 0.35, 0, 1);

  // Clock label (6:00 is sunrise)
  const hour = (6 + p * 24) % 24;
  const hh = Math.floor(hour), mm = Math.floor((hour - hh) * 60);
  const per = periodName(p);
  clockText.textContent = `${PERIOD_ICON[per]} ${per} · Day ${day + 1} · ${String(hh).padStart(2, '0')}:${String(mm).padStart(2, '0')}`;

  // Optional night ambience: quiet crickets
  if (lampAmt > 0.5 && audioReady() && !modalMode) {
    chirpTimer -= dt;
    if (chirpTimer <= 0) {
      const t0 = audio.ctx.currentTime;
      tone(3100 + rnd() * 400, t0, 0.07, 'sine', 0.03, audio.sfxBus);
      tone(3500 + rnd() * 400, t0 + 0.12, 0.07, 'sine', 0.03, audio.sfxBus);
      chirpTimer = 2.5 + rnd() * 4;
    }
  }
}

// Normalises a crop model so its height equals targetH at scale 1
function normalizeCrop(group, targetH) {
  const box = new THREE.Box3().setFromObject(group);
  const h = box.max.y - box.min.y;
  group.userData.unit = h > 0.0001 ? targetH / h : targetH;
}

/* ---------------------------------------------------------
   CAMERA ZOOM & COLLISION
   --------------------------------------------------------- */
const CAM_MIN = 3, CAM_MAX = 16;
function zoomBy(delta) {
  cam.targetDist = clamp(cam.targetDist + delta, CAM_MIN, CAM_MAX);
}
function bindZoomButton(id, delta) {
  const btn = $(id);
  let timer = null;
  const stop = () => { clearInterval(timer); timer = null; };
  btn.addEventListener('pointerdown', e => {
    e.preventDefault();
    zoomBy(delta);
    stop();
    timer = setInterval(() => zoomBy(delta), 120);
  });
  ['pointerup', 'pointerleave', 'pointercancel'].forEach(t => btn.addEventListener(t, stop));
}
bindZoomButton('zoom-in', -1.2);
bindZoomButton('zoom-out', 1.2);
addEventListener('keydown', e => {
  if (e.repeat) return;
  if (e.code === 'Equal' || e.code === 'NumpadAdd') zoomBy(-1);
  if (e.code === 'Minus' || e.code === 'NumpadSubtract') zoomBy(1);
});

function insideAnyObstacle(x, z, m) {
  for (const o of obstacles) {
    if (o.r !== undefined) {
      if (Math.hypot(x - o.x, z - o.z) < o.r + m) return true;
    } else if (x > o.minX - m && x < o.maxX + m && z > o.minZ - m && z < o.maxZ + m) {
      return true;
    }
  }
  return false;
}

// Largest safe camera distance along the view direction, so the camera
// never passes through buildings, fences, trees, rocks or the ground
function cameraLimit(tx, ty, tz, ux, uy, uz, maxD) {
  for (let d = 1.0; d <= maxD; d += 0.25) {
    const x = tx + ux * d, y = ty + uy * d, z = tz + uz * d;
    if (y < 0.3 || insideAnyObstacle(x, z, 0.35)) return Math.max(1.2, d - 0.5);
  }
  return maxD;
}

/* ---------------------------------------------------------
   BUTTON LAYOUT · customise every HUD button (position & size)
   Saved per device in localStorage.
   --------------------------------------------------------- */
const LAYOUT_KEY = 'garden3d_layout_v1';
const EDITABLE = {
  'stats-panel': 'Stats', 'btn-inventory': 'Inventory', 'btn-shop': 'Shop', 'btn-sound': 'Sound',
  'btn-settings': 'Settings', 'zoom-wrap': 'Zoom buttons', 'hotbar-wrap': 'Seed bar',
  'interact-btn': 'Use button', 'jump-btn': 'Jump button', 'joystick': 'Joystick',
};
let layout = {};
try { layout = JSON.parse(localStorage.getItem(LAYOUT_KEY)) || {}; } catch (err) { layout = {}; }
function saveLayout() {
  try { localStorage.setItem(LAYOUT_KEY, JSON.stringify(layout)); } catch (err) { /* storage unavailable */ }
}
function layoutOf(id) { return layout[id] || { x: 0, y: 0, s: 1 }; }
function applyLayout(id) {
  const el = document.getElementById(id);
  if (!el) return;
  const L = layoutOf(id);
  el.style.translate = `${L.x}px ${L.y}px`;
  el.style.scale = String(L.s);
}
function applyAllLayout() { Object.keys(EDITABLE).forEach(applyLayout); }

let editing = false, editSel = null, dragInfo = null;
const editBar = $('edit-bar'), editName = $('edit-name'), editSize = $('edit-size');

function markEditable() {
  Object.keys(EDITABLE).forEach(id => document.getElementById(id)?.classList.add('editable'));
}
function clearEditable() {
  Object.keys(EDITABLE).forEach(id => document.getElementById(id)?.classList.remove('editable', 'selected'));
}
function selectEditable(id) {
  editSel = id;
  Object.keys(EDITABLE).forEach(k => document.getElementById(k)?.classList.toggle('selected', k === id));
  editName.textContent = EDITABLE[id];
  editSize.value = String(Math.round(layoutOf(id).s * 100));
  editSize.disabled = false;
}
function openSettings() {
  if (modalMode) return;
  modalMode = 'settings';
  document.getElementById('settings-overlay').classList.remove('hidden');
}
function closeSettings() {
  document.getElementById('settings-overlay').classList.add('hidden');
  if (modalMode === 'settings') modalMode = null;
}
function startEdit() {
  if (modalMode && modalMode !== 'settings') return;
  closeSettings();
  editing = true;
  modalMode = 'layout';
  document.body.classList.add('editing');
  markEditable();
  editSel = null;
  editName.textContent = 'Tap a button to select it';
  editSize.value = '100';
  editSize.disabled = true;
  editBar.classList.remove('hidden');
}
function endEdit() {
  editing = false;
  dragInfo = null;
  editSel = null;
  if (modalMode === 'layout') modalMode = null;
  document.body.classList.remove('editing');
  clearEditable();
  editBar.classList.add('hidden');
}

// While customising, HUD buttons only move or select; they do not trigger their actions
const inEditBar = e => !!(e.target.closest && e.target.closest('#edit-bar'));
document.addEventListener('pointerdown', e => {
  if (!editing || inEditBar(e)) return;
  e.preventDefault();
  e.stopPropagation();
  const el = e.target.closest ? e.target.closest('.editable') : null;
  if (!el) return;
  selectEditable(el.id);
  const L = layoutOf(el.id);
  dragInfo = { id: el.id, pid: e.pointerId, x0: e.clientX, y0: e.clientY, bx: L.x, by: L.y };
}, true);
document.addEventListener('pointermove', e => {
  if (!dragInfo || e.pointerId !== dragInfo.pid) return;
  const L = layoutOf(dragInfo.id);
  layout[dragInfo.id] = {
    x: dragInfo.bx + (e.clientX - dragInfo.x0),
    y: dragInfo.by + (e.clientY - dragInfo.y0),
    s: L.s,
  };
  applyLayout(dragInfo.id);
}, true);
const endLayoutDrag = e => {
  if (dragInfo && e.pointerId === dragInfo.pid) { dragInfo = null; saveLayout(); }
};
document.addEventListener('pointerup', endLayoutDrag, true);
document.addEventListener('pointercancel', endLayoutDrag, true);
document.addEventListener('click', e => {
  if (editing && !inEditBar(e)) { e.preventDefault(); e.stopPropagation(); }
}, true);

editSize.addEventListener('input', () => {
  if (!editSel) return;
  const L = layoutOf(editSel);
  layout[editSel] = { x: L.x, y: L.y, s: Number(editSize.value) / 100 };
  applyLayout(editSel);
  saveLayout();
});
$('edit-reset-one').addEventListener('click', () => {
  if (!editSel) return;
  delete layout[editSel];
  applyLayout(editSel);
  saveLayout();
  selectEditable(editSel);
});
$('edit-done').addEventListener('click', () => {
  endEdit();
  notify('Button layout saved ✔', 'success');
});

$('btn-settings').addEventListener('pointerdown', e => { e.preventDefault(); openSettings(); });
$('settings-close').addEventListener('click', closeModal);
$('settings-overlay').addEventListener('click', e => { if (e.target.id === 'settings-overlay') closeModal(); });
$('btn-customize').addEventListener('click', startEdit);
$('btn-reset-layout').addEventListener('click', () => {
  layout = {};
  saveLayout();
  applyAllLayout();
  notify('Button layout reset to default.', 'info');
});


let lastPrompt = '';
function updatePrompt() {
  const t = nearestTarget();
  const text = t && !modalMode ? t.label() : '';
  if (text !== lastPrompt) {
    lastPrompt = text;
    dom.prompt.textContent = text;
    dom.prompt.classList.toggle('hidden', !text);
  }
  dom.interact.classList.toggle('ready', !!t && !modalMode);
}

function notify(message, type = 'info') {
  const el = document.createElement('div');
  el.className = `toast ${type}`;
  el.textContent = message;
  dom.toasts.appendChild(el);
  while (dom.toasts.children.length > 4) dom.toasts.firstElementChild.remove();
  setTimeout(() => el.classList.add('out'), 2600);
  setTimeout(() => el.remove(), 3100);
}

function refreshUI() {
  updateHUD();
  renderModal();
  renderNpcPanel();
}

/* ---------------------------------------------------------
   MODALS (Seed Shop, Selling Store, Inventory)
   --------------------------------------------------------- */
let modalMode = null;

function openModal(mode) {
  modalMode = mode;
  dom.modal.classList.remove('hidden');
  renderModal();
}
function closeModal() {
  if (modalMode === 'layout') { endEdit(); return; }
  modalMode = null;
  dom.modal.classList.add('hidden');
  document.getElementById('npc-overlay').classList.add('hidden');
  document.getElementById('settings-overlay').classList.add('hidden');
}

function shopHTML() {
  const cards = CROP_KEYS.map(k => {
    const c = CROPS[k];
    return `
      <div class="item-card" style="--accent:${c.color}">
        <div class="item-emoji">${c.emoji}</div>
        <div class="item-info">
          <b>${c.name} seeds</b>
          <small>Grows in ${c.growSec}s · sells for 🪙${c.sellPrice}</small>
          <small>You own: ${state.seeds[k]}</small>
        </div>
        <div class="item-actions">
          <button data-action="buy" data-key="${k}" data-qty="1" ${state.coins < c.seedPrice ? 'disabled' : ''}>Buy 1 · 🪙${c.seedPrice}</button>
          <button data-action="buy" data-key="${k}" data-qty="5" ${state.coins < c.seedPrice * 5 ? 'disabled' : ''}>Buy 5 · 🪙${c.seedPrice * 5}</button>
        </div>
      </div>`;
  }).join('');
  return `<p class="modal-sub">Your coins: <b>🪙 ${state.coins}</b></p>${cards}`;
}

function sellHTML() {
  const rows = CROP_KEYS.map(k => {
    const c = CROPS[k];
    const n = state.crops[k];
    return `
      <div class="item-card" style="--accent:${c.color}">
        <div class="item-emoji">${c.emoji}</div>
        <div class="item-info">
          <b>${c.name}</b>
          <small>Sells for 🪙${c.sellPrice} each</small>
          <small>In inventory: ${n}</small>
        </div>
        <div class="item-actions">
          <button class="sell-btn" data-action="sell" data-key="${k}" data-qty="1" ${n < 1 ? 'disabled' : ''}>Sell 1 · 🪙${c.sellPrice}</button>
          <button class="sell-btn" data-action="sell" data-key="${k}" data-qty="all" ${n < 1 ? 'disabled' : ''}>Sell all · 🪙${n * c.sellPrice}</button>
        </div>
      </div>`;
  }).join('');
  return `<p class="modal-sub">Your coins: <b>🪙 ${state.coins}</b></p>${rows}`;
}

function inventoryHTML() {
  const crops = ALL_CROP_KEYS.map(k =>
    `<div class="inv-row"><span>${CROPS[k].emoji} ${CROPS[k].name}</span><b>${state.crops[k]}</b></div>`).join('');
  const seeds = ALL_CROP_KEYS.map(k =>
    `<div class="inv-row"><span>${CROPS[k].emoji} ${CROPS[k].name} seeds</span><b>${state.seeds[k]}</b></div>`).join('');
  const planted = state.plots.filter(p => p.crop).length;
  return `
    <div class="stat-row">
      <span>Level ${levelFromXp(state.xp)}</span>
      <span>XP ${state.xp % XP_PER_LEVEL}/${XP_PER_LEVEL}</span>
      <span>🪙 ${state.coins}</span>
    </div>
    <h3>Crops</h3>${crops}
    <h3>Seeds</h3>${seeds}
    <h3>Garden</h3>
    <div class="inv-row"><span>Plots planted</span><b>${planted}/${PLOT_COUNT}</b></div>`;
}

function renderModal() {
  if (!modalMode || modalMode.includes('-')) return; // '-' modes are NPC panels
  if (modalMode === 'shop') {
    dom.modalTitle.textContent = '🌱 Seed Shop';
    dom.modalBody.innerHTML = shopHTML();
  } else if (modalMode === 'sell') {
    dom.modalTitle.textContent = '🧺 Selling Store';
    dom.modalBody.innerHTML = sellHTML();
  } else {
    dom.modalTitle.textContent = '🎒 Inventory';
    dom.modalBody.innerHTML = inventoryHTML();
  }
}

dom.modalBody.addEventListener('click', e => {
  const btn = e.target.closest('button[data-action]');
  if (!btn || btn.disabled) return;
  const key = btn.dataset.key;
  if (btn.dataset.action === 'buy') {
    buySeeds(key, parseInt(btn.dataset.qty, 10));
  } else if (btn.dataset.action === 'sell') {
    const qty = btn.dataset.qty === 'all' ? Infinity : parseInt(btn.dataset.qty, 10);
    sellCrops(key, qty);
  }
});
dom.modalClose.addEventListener('click', closeModal);
dom.modal.addEventListener('click', e => { if (e.target === dom.modal) closeModal(); });
dom.invBtn.addEventListener('click', () => openModal('inventory'));
dom.shopBtn.addEventListener('click', () => { if (!modalMode) openSeedShop(); });

/* ---------------------------------------------------------
   PLOT VISUALS (reflect state; state itself lives above)
   --------------------------------------------------------- */
function updatePlotVisual(view, data, now, t) {
  let visKey = 'empty';
  let stage = -1;
  if (data.crop) {
    stage = stageFor(plotProgress(data, now));
    visKey = `${data.crop}|${stage}`;
  }

  const prevKey = view.visKey;
  if (visKey !== view.visKey) {
    if (view.cropObj) view.group.remove(view.cropObj);
    view.cropObj = null;
    if (data.crop) {
      const proto = stage === 0 ? sproutProto : cropProto[data.crop];
      view.cropObj = proto.clone();
      view.cropObj.position.y = 0.3;
      view.cropObj.scale.setScalar(proto.userData.unit * (stage === 1 ? 0.5 : 1));
      view.group.add(view.cropObj);
    }
    // Growth sound when the same crop moves to its next stage
    if (data.crop && prevKey.startsWith(data.crop + '|')) playGrow(stage);
    view.visKey = visKey;
  }

  view.bar.visible = !!data.crop;
  if (data.crop) {
    const prog = plotProgress(data, now);
    view.fill.scale.x = Math.max(0.001, prog * 1.6);
    view.fill.position.x = -0.8 + prog * 0.8;
    if (stage === 2 && view.cropObj) {
      view.cropObj.rotation.y = t * 0.6 + view.index;
      view.cropObj.position.y = 0.3 + Math.sin(t * 4 + view.index) * 0.04;
    }
  }
}

/* ---------------------------------------------------------
   PLAYER / CAMERA UPDATE
   --------------------------------------------------------- */
let avatar;

function updatePlayer(dt) {
  let ix = 0, iy = 0;
  if (!modalMode) {
    const keyX = (isDown('KeyD', 'ArrowRight') ? 1 : 0) - (isDown('KeyA', 'ArrowLeft') ? 1 : 0);
    const keyY = (isDown('KeyW', 'ArrowUp') ? 1 : 0) - (isDown('KeyS', 'ArrowDown') ? 1 : 0);
    ix = clamp(joy.x + keyX, -1, 1);
    iy = clamp(joy.y + keyY, -1, 1);
  }
  const mag = Math.hypot(ix, iy);
  if (mag > 1) { ix /= mag; iy /= mag; }
  const moving = mag > 0.05;

  // Camera-relative movement: forward = (-sin yaw, 0, -cos yaw), right = (cos yaw, 0, -sin yaw)
  const s = Math.sin(cam.yaw), c = Math.cos(cam.yaw);
  const dirX = c * ix - s * iy;
  const dirZ = -s * ix - c * iy;

  if (moving) {
    player.x += dirX * MOVE_SPEED * dt;
    player.z += dirZ * MOVE_SPEED * dt;
    player.facing = lerpAngle(player.facing, Math.atan2(dirX, dirZ), 1 - Math.exp(-dt * 12));
  }

  // Jump & gravity
  if (jumpQueued && player.grounded) {
    player.vy = JUMP_SPEED;
    playJump();
    player.grounded = false;
  }
  jumpQueued = false;
  player.vy -= GRAVITY * dt;
  player.y += player.vy * dt;
  if (player.y <= 0) {
    player.y = 0;
    player.vy = 0;
    player.grounded = true;
  }

  resolveCollisions(player);
  player.x = clamp(player.x, -WORLD_LIMIT, WORLD_LIMIT);
  player.z = clamp(player.z, -WORLD_LIMIT, WORLD_LIMIT);

  // Animation
  // Footsteps while walking on the ground
  if (moving && player.grounded) {
    footTimer -= dt;
    if (footTimer <= 0) { playFootstep(); footTimer = 0.34; }
  } else {
    footTimer = 0;
  }
  if (moving && player.grounded) player.walk += dt * 9 * Math.min(1, mag);
  const swing = moving && player.grounded ? Math.sin(player.walk) * 0.7 : 0;
  const idleSway = Math.sin(performance.now() * 0.002) * 0.04;
  if (player.grounded) {
    avatar.legL.rotation.x = swing;
    avatar.legR.rotation.x = -swing;
    avatar.armL.rotation.x = -swing * 0.8 + idleSway;
    avatar.armR.rotation.x = swing * 0.8 - idleSway;
  } else {
    avatar.legL.rotation.x = 0.6;
    avatar.legR.rotation.x = 0.6;
    avatar.armL.rotation.x = -2.4;
    avatar.armR.rotation.x = -2.4;
  }

  avatar.root.position.set(player.x, player.y, player.z);
  avatar.root.rotation.y = player.facing;
}

function updateCamera(dt) {
  cam.dist += (cam.targetDist - cam.dist) * (1 - Math.exp(-dt * 8));
  const tx = player.x, ty = player.y + 1.6, tz = player.z;
  const cp = Math.cos(cam.pitch);
  const ux = Math.sin(cam.yaw) * cp, uy = Math.sin(cam.pitch), uz = Math.cos(cam.yaw) * cp;
  const limit = cameraLimit(tx, ty, tz, ux, uy, uz, cam.dist);
  const goal = Math.min(cam.dist, limit);
  // Pull in quickly when a wall is hit, ease back out slowly
  cam.eff += (goal - cam.eff) * (1 - Math.exp(-dt * (goal < cam.eff ? 20 : 6)));
  camera.position.set(tx + ux * cam.eff, ty + uy * cam.eff, tz + uz * cam.eff);
  camera.lookAt(tx, ty, tz);
}


/* ---------------------------------------------------------
   INIT
   --------------------------------------------------------- */
load();
buildHotbar();
buildSky();
buildCelestial();
buildGround();
buildPlaza();
buildShop({ x: SHOP.x, z: SHOP.z, side: -1, wall: '#ffe6a8', roof: '#ff5a7a', signBg: '#2fbf5a', label: 'SEED SHOP' });
buildShop({ x: SELL.x, z: SELL.z, side: 1, wall: '#d6f2ff', roof: '#3a86ff', signBg: '#ff9f1c', label: 'SELL CROPS' });
buildGarden();
buildNature();
buildClouds();
avatar = buildAvatar();
sproutProto = buildSprout();
for (const k of ALL_CROP_KEYS) cropProto[k] = buildCrop(k);
for (const k of ALL_CROP_KEYS) normalizeCrop(cropProto[k], MATURE_H);
normalizeCrop(sproutProto, 0.6);
buildNpcs();
buildTargets();
updateHUD();
applyAllLayout();
updateDayNight(0);

addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight, false);
});

addEventListener('beforeunload', save);
document.addEventListener('visibilitychange', () => { if (document.hidden) save(); });

/* ---------------------------------------------------------
   MAIN LOOP
   --------------------------------------------------------- */
const clock = new THREE.Clock();
let elapsed = 0;
let saveTimer = 0;
let firstFrame = true;

function frame() {
  const dt = Math.min(clock.getDelta(), 0.05);
  elapsed += dt;

  updatePlayer(dt);
  updateCamera(dt);
  updateDayNight(dt);
  const now = Date.now();
  plotViews.forEach((v, i) => updatePlotVisual(v, state.plots[i], now, elapsed));
  updateClouds(dt);
  updatePrompt();
  updateAmbientSound(dt);

  renderer.render(scene, camera);

  if (firstFrame) {
    firstFrame = false;
    dom.loading.classList.add('hide');
  }

  saveTimer += dt;
  if (saveTimer > 5) { save(); saveTimer = 0; }

  requestAnimationFrame(frame);
}

frame();
notify('Welcome to Sunny Meadow Farm! Buy seeds at the Seed Shop 🌱', 'info');
