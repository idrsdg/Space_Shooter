// Space Shooter 3D. Every mesh, texture and animation is baked offline by tools/*.py.
// Nothing is generated during play: this file only streams baked data to the GPU.
(() => {
  'use strict';
  const DEBUG = /[?&]debug=1(&|$)/.test(location.search);
  const TAU = Math.PI * 2, PI = Math.PI;
  const { sin, cos, atan2, floor, ceil, min, max, abs, sqrt, random, round, tan, hypot } = Math;
  const rnd = (a, b) => a + random() * (b - a);
  const clamp = (v, a, b) => v < a ? a : v > b ? b : v;
  const $ = id => document.getElementById(id);

  // ---------- language ----------
  const TXT = {
    tr: {
      tag: 'Kokpite geç, filoyu durdur, sektörleri geri al', allGames: 'Tüm oyunlar', play: 'Yeni Oyun', cont: 'Devam Et', hangar: 'Hangar', how: 'Nasıl?', back: 'Geri',
      soundOn: 'Ses: Açık', soundOff: 'Ses: Kapalı', best: 'En iyi', scrap: 'Hurda', paused: 'Duraklatıldı', resume: 'Devam Et', restart: 'Yeniden Başla',
      quit: 'Ana Menü (kayıtlı)', over: 'Gemi Düştü', again: 'Tekrar Oyna', menu: 'Ana Menü', reached: 'Ulaşılan sektör', scrapGot: 'Toplanan hurda', newBest: 'Yeni rekor!',
      phase2: 'BOSS ÖFKELENDİ', phase3: 'SON FAZ', bomb: 'NOVA', sector: 'SEKTÖR', wave: 'DALGA', warning: 'UYARI', cleared: 'SEKTÖR TEMİZ', max: 'TAM', hHull: 'Gövde', hShield: 'Kalkan', hGun: 'Top', hRkt: 'Roket',
      u_hull: 'Gövde', ud_hull: 'Başlangıçta +1 gövde', u_cannon: 'Top', ud_cannon: 'Daha güçlü topla başla', u_rocket: 'Roket', ud_rocket: 'Roketlerle başla',
      u_magnet: 'Mıknatıs', ud_magnet: 'Hurda ve kapsülleri uzaktan çek', u_bomb: 'Nova Deposu', ud_bomb: 'Başlangıçta +1 Nova',
      p_w: 'TOP +1', p_r: 'ROKET +1', p_s: 'KALKAN', p_h: 'ONARIM', p_b: 'NOVA +1', p_o: 'AŞIRI GÜÇ', boss0: 'KOR PENÇE', boss1: 'GİRDAP ÇEKİRDEĞİ', boss2: 'SESSİZ TAHT',
      l_get: 'Modeller indiriliyor', l_tex: 'Dokular açılıyor', l_mesh: 'Gemiler hazırlanıyor', l_gpu: 'Grafik kartına yükleniyor', l_err: 'Oyun dosyaları yüklenemedi. Sayfayı yenile.', l_gl: 'Bu cihazda WebGL2 açık değil, oyun çalışamıyor.',
      help: ['<b>Klavye:</b> Yön tuşları veya WASD ile uç, Boşluk ile ateş et, X ile Nova, P ile duraklat, M ile ses.', '<b>Fare:</b> Nişangâh imleci izler, gemi de o yöne kayar. Sol tuş ateş, sağ tuş Nova.', '<b>Dokunmatik:</b> Parmağını sürükle, nişangâh parmağınla gider, basılı tutunca ateş eder ve yakındaki hedefe kilitlenir. Nova sağ altta.', '<b>Tehlike:</b> Her şey derinden üzerine gelir. Mermilerden ve kayalardan yana kayarak kaç.', '<b>Zincir:</b> Art arda vurdukça skor çarpanı 8 katına çıkar, hasar alınca sıfırlanır.', '<b>Hurda:</b> Hangarda kalıcı geliştirmelere harca. İlerlemen her dalgada kaydedilir.']
    },
    en: {
      tag: 'Take the cockpit, stop the fleet, win the sectors back', allGames: 'All games', play: 'New Game', cont: 'Continue', hangar: 'Hangar', how: 'How?', back: 'Back',
      soundOn: 'Sound: On', soundOff: 'Sound: Off', best: 'Best', scrap: 'Scrap', paused: 'Paused', resume: 'Resume', restart: 'Restart',
      quit: 'Main Menu (saved)', over: 'Ship Down', again: 'Play Again', menu: 'Main Menu', reached: 'Sector reached', scrapGot: 'Scrap collected', newBest: 'New record!',
      phase2: 'BOSS ENRAGED', phase3: 'FINAL PHASE', bomb: 'NOVA', sector: 'SECTOR', wave: 'WAVE', warning: 'WARNING', cleared: 'SECTOR CLEAR', max: 'MAX', hHull: 'Hull', hShield: 'Shield', hGun: 'Cannon', hRkt: 'Rocket',
      u_hull: 'Hull', ud_hull: '+1 hull at start', u_cannon: 'Cannon', ud_cannon: 'Start with a stronger cannon', u_rocket: 'Rockets', ud_rocket: 'Start with rockets',
      u_magnet: 'Magnet', ud_magnet: 'Pull scrap and capsules from afar', u_bomb: 'Nova Rack', ud_bomb: '+1 Nova at start',
      p_w: 'CANNON +1', p_r: 'ROCKET +1', p_s: 'SHIELD', p_h: 'REPAIR', p_b: 'NOVA +1', p_o: 'OVERDRIVE', boss0: 'EMBER CLAW', boss1: 'VORTEX CORE', boss2: 'SILENT THRONE',
      l_get: 'Downloading models', l_tex: 'Unpacking textures', l_mesh: 'Preparing ships', l_gpu: 'Uploading to the graphics card', l_err: 'Game files could not be loaded. Refresh the page.', l_gl: 'WebGL2 is not available on this device, so the game cannot run.',
      help: ['<b>Keyboard:</b> Arrows or WASD to fly, Space to fire, X for Nova, P to pause, M for sound.', '<b>Mouse:</b> The reticle follows the cursor and the ship slides that way. Left button fires, right button launches Nova.', '<b>Touch:</b> Drag to move the crosshair. Hold to fire; it locks onto nearby targets. Nova is bottom right.', '<b>Danger:</b> Everything comes at you out of the depth. Slide aside to dodge shots and rocks.', '<b>Chain:</b> Keep hitting to raise the score multiplier up to 8x. Taking damage resets it.', '<b>Scrap:</b> Spend it on permanent Hangar upgrades. Your run is saved every wave.']
    }
  };

  // ---------- save (new key: an old 2D save is never read) ----------
  const KEY = 'spaceShooter3d.v1';
  const UPS = [
    { id: 'hull', max: 3, cost: [60, 160, 340] }, { id: 'cannon', max: 3, cost: [80, 220, 460] }, { id: 'rocket', max: 3, cost: [100, 260, 520] },
    { id: 'magnet', max: 3, cost: [50, 140, 300] }, { id: 'bomb', max: 2, cost: [120, 320] }
  ];
  const Save = { best: 0, bestSector: 1, scrap: 0, up: { hull: 0, cannon: 0, rocket: 0, magnet: 0, bomb: 0 }, lang: '', mute: false, run: null };
  const num = (v, d) => (typeof v === 'number' && isFinite(v) && v >= 0) ? floor(v) : d;
  try {
    const o = JSON.parse(localStorage.getItem(KEY) || 'null');
    if (o && typeof o === 'object') {
      Save.best = num(o.best, 0); Save.bestSector = max(1, num(o.bestSector, 1)); Save.scrap = num(o.scrap, 0);
      if (o.up) for (const u of UPS) Save.up[u.id] = clamp(num(o.up[u.id], 0), 0, u.max);
      if (o.lang === 'tr' || o.lang === 'en') Save.lang = o.lang;
      Save.mute = o.mute === true;
      const r = o.run;
      if (r && typeof r === 'object' && num(r.sector, 0) >= 1 && num(r.wave, 0) >= 1 && num(r.hull, 0) >= 1) {
        Save.run = { score: num(r.score, 0), sector: num(r.sector, 1), wave: clamp(num(r.wave, 1), 1, 6), hull: num(r.hull, 1), maxHull: max(num(r.maxHull, 3), 1), shield: clamp(num(r.shield, 0), 0, 3), wpn: clamp(num(r.wpn, 1), 1, 6), rkt: clamp(num(r.rkt, 0), 0, 3), bombs: clamp(num(r.bombs, 0), 0, 6), gain: num(r.gain, 0) };
        Save.run.hull = min(Save.run.hull, Save.run.maxHull);
      }
    }
  } catch (e) { /* unreadable save: start clean */ }
  const persist = () => { try { localStorage.setItem(KEY, JSON.stringify(Save)); } catch (e) { /* storage may be off */ } };
  let lang = Save.lang || (/^tr/i.test(navigator.language || '') ? 'tr' : 'en');
  const t = key => TXT[lang][key];

  // ---------- sound ----------
  const Snd = (() => {
    let ac = null, master = null, noise = null;
    const last = {};
    function ensure() {
      if (Save.mute) return false;
      if (!ac) {
        try {
          ac = new (window.AudioContext || window.webkitAudioContext)();
          master = ac.createGain(); master.gain.value = .5;
          const comp = ac.createDynamicsCompressor(); master.connect(comp); comp.connect(ac.destination);
          const n = ac.sampleRate, b = ac.createBuffer(1, n, n), d = b.getChannelData(0);
          for (let i = 0; i < n; i++) d[i] = random() * 2 - 1;
          noise = b;
        } catch (e) { ac = null; return false; }
      }
      if (ac.state === 'suspended') ac.resume();
      return true;
    }
    function gate(id, gap) { const now = ac.currentTime; if (last[id] && now - last[id] < gap) return false; last[id] = now; return true; }
    function tone(f0, f1, dur, type, vol, delay) {
      const at = ac.currentTime + (delay || 0), o = ac.createOscillator(), v = ac.createGain();
      o.type = type; o.frequency.setValueAtTime(f0, at); o.frequency.exponentialRampToValueAtTime(max(20, f1), at + dur);
      v.gain.setValueAtTime(.0001, at); v.gain.exponentialRampToValueAtTime(vol, at + .006); v.gain.exponentialRampToValueAtTime(.0001, at + dur);
      o.connect(v); v.connect(master); o.start(at); o.stop(at + dur + .02);
    }
    function burst(dur, vol, f0, f1, type) {
      const at = ac.currentTime, s = ac.createBufferSource(), f = ac.createBiquadFilter(), v = ac.createGain();
      s.buffer = noise; s.loop = true; f.type = type || 'lowpass';
      f.frequency.setValueAtTime(f0, at); f.frequency.exponentialRampToValueAtTime(max(40, f1), at + dur);
      v.gain.setValueAtTime(vol, at); v.gain.exponentialRampToValueAtTime(.0001, at + dur);
      s.connect(f); f.connect(v); v.connect(master); s.start(at, random() * .8); s.stop(at + dur + .02);
    }
    const defs = {
      shot() { if (gate('shot', .085)) { burst(.055, .075, 5200, 1500, 'highpass'); tone(420, 92, .09, 'sawtooth', .05); tone(120, 54, .1, 'sine', .09); } },
      rocket() { if (gate('rocket', .12)) { burst(.22, .1, 2600, 500, 'bandpass'); tone(170, 420, .18, 'sawtooth', .025); } },
      hit() { if (gate('hit', .06)) tone(520, 240, .04, 'triangle', .05); },
      armor() { if (gate('armor', .08)) { tone(2300, 1500, .07, 'triangle', .035); tone(3100, 2100, .05, 'sine', .018); } },
      small() { if (gate('small', .05)) { burst(.32, .3, 2600, 130); tone(150, 36, .26, 'sine', .22); } },
      big() { if (gate('big', .1)) { burst(.08, .3, 6000, 1800, 'highpass'); burst(.75, .5, 1500, 48); tone(88, 22, .7, 'sine', .42); } },
      huge() { burst(1.5, .6, 900, 30); tone(80, 20, 1.3, 'sine', .46); },
      enemy() { if (gate('enemy', .11)) tone(420, 170, .1, 'sawtooth', .018); },
      beam() { if (gate('beam', .3)) tone(90, 720, .5, 'sawtooth', .04); },
      pick() { if (gate('pick', .035)) tone(1250, 1850, .05, 'sine', .035); },
      power() { tone(520, 780, .09, 'triangle', .1); tone(780, 1170, .13, 'triangle', .1, .08); },
      hurt() { burst(.4, .42, 900, 90); tone(240, 50, .35, 'sawtooth', .12); },
      shieldHit() { tone(900, 300, .22, 'triangle', .13); },
      nova() { burst(1.1, .55, 3200, 50); tone(60, 500, .3, 'sawtooth', .12); tone(500, 30, .9, 'sine', .36, .25); },
      warn() { for (let i = 0; i < 3; i++) { tone(440, 440, .24, 'square', .05, i * .42); tone(330, 330, .18, 'square', .05, i * .42 + .2); } },
      clear() { [523, 659, 784, 1047].forEach((f, i) => tone(f, f, .22, 'triangle', .1, i * .11)); },
      ui() { tone(700, 980, .05, 'triangle', .06); }
    };
    return { play(id) { if (!ensure()) return; try { defs[id](); } catch (e) { /* sound must never stop the game */ } }, unlock() { ensure(); } };
  })();

  // ---------- pools ----------
  function Pool(cap, proto) { this.a = []; for (let i = 0; i < cap; i++) this.a.push(Object.assign({ dead: false }, proto)); this.n = 0; }
  Pool.prototype.get = function () { if (this.n >= this.a.length) return null; const o = this.a[this.n++]; o.dead = false; return o; };
  Pool.prototype.sweep = function () { const a = this.a; let i = 0; while (i < this.n) { if (a[i].dead) { const l = --this.n, x = a[i]; a[i] = a[l]; a[l] = x; } else i++; } };
  Pool.prototype.clear = function () { this.n = 0; };

  const pb = new Pool(260, { x: 0, y: 0, z: 0, vx: 0, vy: 0, vz: 0, dmg: 1, heavy: false, t: 0 });
  const rk = new Pool(30, { x: 0, y: 0, z: 0, vx: 0, vy: 0, vz: 0, t: 0, rt: 0, tg: null, v: 0, trail: 0 });
  const tr = new Pool(70, { x: 0, y: 0, z: 0, t: 0, life: 1, s: 1, rot: 0 });
  const eb = new Pool(420, { x: 0, y: 0, z: 0, vx: 0, vy: 0, vz: 0, kind: 0, r: 1, t: 0 });
  const en = new Pool(64, { type: '', def: null, x: 0, y: 0, z: 0, vx: 0, vy: 0, vz: 0, hp: 0, maxHp: 0, t: 0, path: 0, a: 0, b: 0, c: 0, d: 0, e: 0, fireT: 0, flash: 0, rx: 0, ry: 0, rz: 0, sx: 0, sy: 0, sz: 0, shield: 0, st: 0, vr: 0, phase: 0, px: 0, py: 0, bank: 0, pz: 0, ux: 0, uy: 0, uz: 0 });
  const sq = new Pool(150, { t: 0, type: '', x: 0, y: 0, path: 0, a: 0, b: 0, c: 0, d: 0, e: 0 });
  const pu = new Pool(80, { x: 0, y: 0, z: 0, vx: 0, vy: 0, vz: 0, kind: '', t: 0, scrap: false });
  const fx = new Pool(150, { m: 0, x: 0, y: 0, z: 0, vx: 0, vy: 0, vz: 0, t: 0, life: 1, s: 1, qx: 0, qy: 0, qz: 0, qw: 1 });
  const bm = new Pool(8, { owner: null, ox: 0, oy: 0, oz: 0, tx: 0, ty: 0, tvx: 0, tvy: 0, t: 0, warn: .7, life: 1, w: 1, part: -1 });

  // ---------- state ----------
  let XR = 30, SX = 1;
  const YR = 17, SPAWN_Z = -560, PL_R = 2.7;
  const S = { mode: 'load', clock: 0, shake: 0, slow: 0, waveState: 'idle', waveT: 0, deadT: 0, gain: 0, novaT: -1, nx: 0, ny: 0, nz: 0, nvx: 0, nvy: 0, nvz: 0, sector: 0, flow: 0, hitT: 0, killT: 0 };
  const R = { score: 0, sector: 1, wave: 1, hull: 3, maxHull: 3, shield: 0, wpn: 1, rkt: 0, bombs: 2, chain: 0, combo: 1, comboT: 0, overT: 0, pity: 0 };
  const Pl = { x: 0, y: 0, vx: 0, vy: 0, rx: 0, ry: 0, bank: 0, pitch: 0, inv: 0, fireT: 0, rktT: 0, recoil: 0, muzzle: 0, alive: true, novaCd: 0, rktSide: 1, tg: null, firing: false, heat: 0, gunSide: 1, muzzleSide: 0, kick: 0 };
  const B = { active: false, dead: true, type: 0, x: 0, y: 0, z: -420, baseZ: -128, hp: 0, maxHp: 1, t: 0, state: '', phase: 0, atk: -1, cur: null, sub: 0, subI: 0, subT: 0, flash: 0, dieT: 0, boomT: 0, r: 22, s: 1.35,
    parts: [0, 1, 2].map(() => ({ x: 0, y: 0, z: 0, hp: 0, max: 1, alive: false, flash: 0, r: 9, ang: 0 })), nparts: 0 };

  const hpMul = () => 1 + (R.sector - 1) * .34 + (R.wave - 1) * .05;
  const bulletMul = () => min(1.5, 1 + (R.sector - 1) * .07 + (R.wave - 1) * .012);
  const fireMul = () => max(.5, 1 - (R.sector - 1) * .09 - (R.wave - 1) * .012);

  const ET = {
    dart: { m: 'dart', hp: 2, r: 6.2, s: 1.15, score: 40, scrap: 1, v: 142, fire: 0, boom: 1 },
    wasp: { m: 'wasp', hp: 3, r: 6.4, s: 1.15, score: 70, scrap: 1, v: 104, fire: 1.75, boom: 1 },
    splitter: { m: 'splitter', hp: 6, r: 7.6, s: 1.15, score: 110, scrap: 2, v: 84, fire: 2.3, boom: 2 },
    orb: { m: 'orb', hp: 9, r: 6.6, s: 1.25, score: 170, scrap: 3, v: 90, fire: 2.4, boom: 2 },
    bomber: { m: 'bomber', hp: 22, r: 11.5, s: 1.15, score: 340, scrap: 6, v: 62, fire: 2.5, boom: 3 },
    lancer: { m: 'lancer', hp: 11, r: 6.6, s: 1.1, score: 240, scrap: 4, v: 88, fire: 3.3, boom: 2 },
    warden: { m: 'warden', hp: 10, r: 8.2, s: 1.15, score: 260, scrap: 5, v: 76, fire: 2.2, boom: 2, shield: 12 },
    mine: { m: 'mine', hp: 3, r: 4.4, s: 1.25, score: 30, scrap: 1, v: 56, fire: 0, boom: 1 },
    srocket: { m: 'srocket', hp: 2, r: 3, s: 1.05, score: 25, scrap: 0, v: 90, fire: 0, boom: 1 },
    rockS: { m: 'rockS', hp: 2, r: 4.2, s: 1, score: 15, scrap: 0, v: 118, fire: 0, boom: 1, rock: 0 },
    rockM: { m: 'rockM', hp: 5, r: 7, s: 1, score: 35, scrap: 1, v: 96, fire: 0, boom: 2, rock: 1 },
    rockL: { m: 'rockL', hp: 11, r: 10.6, s: 1, score: 70, scrap: 2, v: 76, fire: 0, boom: 2, rock: 2 }
  };
  // Sector looks: sky texture, planet, station, light.
  const SECTORS = [
    { sun: [.55, .62, .56], sunC: [1.04, .93, .78], amb: [.34, .36, .52], fog: [.07, .07, .2], atm: [.95, .6, .34], planet: 0, ring: 'ring0', station: 0, pPos: [-260, 120, -880], pS: 215, sPos: [330, -120, -760], sS: 2.6 },
    { sun: [-.5, .7, .5], sunC: [.86, 1.0, .94], amb: [.26, .42, .44], fog: [.03, .13, .15], atm: [.42, .78, .95], planet: 1, ring: null, station: 1, pPos: [300, -110, -900], pS: 250, sPos: [-340, 90, -740], sS: 2.8 },
    { sun: [.32, .8, .5], sunC: [1.05, .84, .68], amb: [.46, .26, .36], fog: [.16, .05, .1], atm: [1, .42, .24], planet: 2, ring: null, station: 2, pPos: [-310, -100, -860], pS: 200, sPos: [300, 140, -700], sS: 2.4 },
    { sun: [-.6, .55, .58], sunC: [.92, .96, 1.05], amb: [.33, .37, .48], fog: [.07, .09, .15], atm: [.7, .82, 1], planet: 3, ring: 'ring3', station: 3, pPos: [260, 130, -900], pS: 235, sPos: [-310, -120, -720], sS: 2.6 }
  ];

  // ---------- renderer ----------
  const VS = `
    precision highp float; precision highp int; precision highp sampler2D;
    attribute float aPart; attribute vec2 aUv; attribute vec4 aN; attribute vec4 aC; attribute vec4 iAnim;
    uniform sampler2D uAnim; uniform float uBones; uniform float uQ; uniform int uAW; uniform vec2 uFx;
    varying float vHeat; varying vec3 vN; varying vec3 vC; varying vec3 vP; varying vec2 vUv; varying float vAo; varying float vFlash; varying float vFogK; flat varying int vMat;
    vec4 tx(int i) { return texelFetch(uAnim, ivec2(i % uAW, i / uAW), 0); }
    vec3 qrot(vec4 q, vec3 v) { return v + 2.0 * cross(q.xyz, cross(q.xyz, v) + q.w * v); }
    void main() {
      int mat = int(floor(aN.w * 127.0 + .5));
      vec3 p = position * uQ, n = aN.xyz;
      vHeat = uFx.x > 0. ? clamp(p.z / uFx.x, 0., 1.) * .72 + iAnim.y / uFx.y * .62 : -1.;
      if (uBones > .5) {
        int bn = int(uBones + .5), b = int(aPart + .5), f0 = int(iAnim.y);
        int i0 = int(iAnim.x + .5) + (f0 * bn + b) * 2;
        #ifdef FAST
        vec4 tr = tx(i0), q = tx(i0 + 1);
        #else
        int i1 = i0 + bn * 2;
        float ft = iAnim.y - float(f0);
        vec4 tr = mix(tx(i0), tx(i1), ft);
        vec4 q = normalize(mix(tx(i0 + 1), tx(i1 + 1), ft));
        #endif
        if (mat == 5) n = normalize(position);
        if (mat == 3) { p.z *= tr.w; p.xy *= min(1., tr.w * 1.7) * (.7 + .3 * tr.w); } else p *= tr.w;
        p = qrot(q, p) + tr.xyz;
        n = qrot(q, n);
      }
      vec4 wp = modelMatrix * instanceMatrix * vec4(p, 1.0);
      vN = normalize(mat3(modelMatrix) * mat3(instanceMatrix) * n);
      vP = wp.xyz; vUv = aUv * 32.0; vC = aC.rgb; vAo = aC.a; vFlash = iAnim.z; vFogK = 1. - iAnim.w; vMat = mat;
      gl_Position = projectionMatrix * viewMatrix * wp;
    }`;
  // Shading happens in approximate linear light (gamma 2) and is tone-mapped once. Emissive parts stay exact.
  const FS = `
    precision highp float; precision highp int;
    uniform sampler2D uDetail; uniform vec3 uSun, uSunC, uAmb, uFog, uEye; uniform float uFogN, uFogF;
    varying float vHeat;
    #ifdef HQ
    uniform sampler2D uDetailN; uniform samplerCube uEnv;
    #endif
    varying vec3 vN; varying vec3 vC; varying vec3 vP; varying vec2 vUv; varying float vAo; varying float vFlash; varying float vFogK; flat varying int vMat;
    void main() {
      vec3 col = vC;
      if (vMat == 3) {
        float nv = abs(dot(normalize(vN), normalize(uEye - vP)));
        if (vHeat >= 0.) {
          float h = vHeat;
          col = h < .22 ? mix(vec3(1., .97, .82), vec3(1., .83, .24), h / .22) : h < .55 ? mix(vec3(1., .83, .24), vec3(1., .43, .05), (h - .22) / .33) : h < .95 ? mix(vec3(1., .43, .05), vec3(.72, .1, .04), (h - .55) / .4) : mix(vec3(.72, .1, .04), vec3(.2, .07, .07), min((h - .95) / .3, 1.));
        }
        col *= .62 + .38 * nv;
      } else if (vMat == 5) {
        vec3 N = normalize(vN);
        float w = dot(N, uSun) * .5 + .5, nv = max(dot(N, normalize(uEye - vP)), 0.);
        col = vC * (.42 + .78 * w * w) * (.62 + .38 * sqrt(nv)) * (.72 + .28 * uAmb / max(max(uAmb.r, uAmb.g), uAmb.b));
      } else if (vMat != 4) {
        vec3 d = texture2D(uDetail, vUv).rgb;
        vec3 N = normalize(vN), V = normalize(uEye - vP);
        float rough = vMat == 2 ? .08 : vMat == 1 ? .85 : .3 + d.b * .42;
        #ifdef HQ
        vec3 nm = texture2D(uDetailN, vUv).rgb;
        if (vMat != 2) {
          vec3 T = normalize(cross(N, abs(N.y) < .9 ? vec3(0., 1., 0.) : vec3(1., 0., 0.))), Bt = cross(N, T);
          N = normalize(N + (T * (nm.x - .5) + Bt * (nm.y - .5)) * (vMat == 1 ? 1.5 : .9));
          if (vMat == 0) rough = .22 + nm.b * .55;
        }
        #endif
        float det = vMat == 1 ? (.5 + d.g * .8) : (vMat == 0 ? d.r * (.92 + d.b * .12) : 1.);
        vec3 alb = vC * vC * det * det;
        float metal = vMat == 0 ? .62 : 0.;
        vec3 F0 = mix(vec3(vMat == 2 ? .08 : .04), alb, metal);
        float nl = max(dot(N, uSun), 0.), hemi = .5 + .5 * N.y, nv = max(dot(N, V), .02);
        vec3 H = normalize(uSun + V);
        float nh = max(dot(N, H), 0.), power = 2. / max(rough * rough * rough, .004);
        power = min(power, 420.);
        float fres = pow(1. - nv, 5.);
        vec3 F = F0 + (vec3(1.) - F0) * fres;
        float ao = .28 + .72 * vAo;
        vec3 sunL = uSunC * uSunC * 2.5;
        vec3 ambL = uAmb * uAmb * (.55 + .85 * hemi);
        vec3 lit = alb * (1. - metal * .72) * (ambL * ao + sunL * nl * (.55 + .45 * vAo));
        lit += F * sunL * pow(nh, power) * nl * (power + 8.) * .04;
        #ifdef HQ
        vec3 R = reflect(-V, N), env = textureCube(uEnv, R).rgb;
        lit += env * env * F * (1. - rough * .78) * ao * 1.5;
        #else
        lit += ambL * F * (1. - rough * .7) * (.5 + .5 * reflect(-V, N).y) * ao;
        #endif
        col = sqrt(lit / (1. + lit * .42) * 1.22);
      }
      if (vFlash > .001) col = mix(col, vec3(1., .9, .7), vFlash * .3);
      float dist = length(vP - uEye), fg = clamp((dist - uFogN) / (uFogF - uFogN), 0., 1.);
      col = mix(col, uFog, fg * fg * vFogK);
      gl_FragColor = vec4(min(col, vec3(1.)), 1.);
    }`;
  const SKY_VS = `varying vec3 vD; void main() { vD = position; vec4 p = projectionMatrix * mat4(mat3(viewMatrix)) * vec4(position, 1.); gl_Position = p.xyww; }`;
  const SKY_FS = `precision mediump float; uniform samplerCube uA, uB; uniform float uMix; varying vec3 vD;
    void main() { vec3 col = textureCube(uA, vD).rgb; if (uMix < .999) col = mix(textureCube(uB, vD).rgb, col, uMix); gl_FragColor = vec4(col, 1.); }`;
  const STAR_VS = `attribute float aSize; attribute vec3 aCol; uniform float uPx; varying vec3 vCol;
    void main() { vCol = aCol; vec4 p = projectionMatrix * mat4(mat3(viewMatrix)) * vec4(position, 1.); gl_Position = p.xyww; gl_PointSize = max(1., floor(aSize * uPx + .5)); }`;
  const STAR_FS = `precision mediump float; varying vec3 vCol; void main() { gl_FragColor = vec4(vCol, 1.); }`;
  const PLANET_VS = `varying vec3 vO; varying vec3 vN; varying vec3 vW; uniform float uSpin; void main() { float s = sin(uSpin), c = cos(uSpin); vO = vec3(c * position.x - s * position.z, position.y, s * position.x + c * position.z); vN = normalize(mat3(modelMatrix) * position); vec4 w = modelMatrix * vec4(position, 1.); vW = w.xyz; gl_Position = projectionMatrix * viewMatrix * w; }`;
  const PLANET_FS = `precision highp float; uniform sampler2D uMap; uniform vec3 uSun, uEye, uAtm; varying vec3 vO; varying vec3 vN; varying vec3 vW;
    void main() { vec3 d = normalize(vO), N = normalize(vN), V = normalize(uEye - vW); vec2 uv = vec2(atan(d.x, -d.z) / 6.2831853 + .5, asin(clamp(d.y, -1., 1.)) / 3.1415927 + .5);
      vec3 alb = texture2D(uMap, uv).rgb; alb *= alb;
      float l = dot(N, uSun), lit = smoothstep(-.06, .34, l) * (.2 + .8 * max(l, 0.)), nv = max(dot(N, V), 0.);
      vec3 col = alb * (.012 + lit * 1.5) + uAtm * uAtm * pow(1. - nv, 3.) * smoothstep(-.1, .4, l) * .55;
      gl_FragColor = vec4(sqrt(col / (1. + col * .3)), 1.); }`;

  let bgK = 1, bgS = 1, bgY = 0;
  const coarse = matchMedia('(pointer: coarse)').matches || 'ontouchstart' in window;
  const smallScreen = min(screen.width || 1000, screen.height || 1000) < 720;
  const TIER = (coarse && smallScreen) || /[?&]tier=phone(&|$)/.test(location.search) ? 'phone' : 'desktop';
  const LOW = TIER === 'phone';
  const TRI_BUDGET = LOW ? 48000 : 300000;
  const DPR = window.devicePixelRatio || 1;
  const PR_MAX = LOW ? min(DPR, 1.6) : min(DPR, 2), PR_MIN = LOW ? .72 : .9;
  const PR_START = LOW ? min(DPR, 1.25) : min(DPR, 1.5);
  let renderer = null, scene = null, ckScene = null, hudScene = null, camera = null, ckCamera = null, hudCamera = null, gl2ok = true, gl = null;
  const U = {
    uAnim: { value: null }, uDetail: { value: null }, uDetailN: { value: null }, uEnv: { value: null }, uSun: { value: new THREE.Vector3(.5, .6, .6).normalize() }, uSunC: { value: new THREE.Vector3(1, 1, 1) }, uAmb: { value: new THREE.Vector3(.3, .3, .4) },
    uFog: { value: new THREE.Vector3() }, uEye: { value: new THREE.Vector3() }, uFogN: { value: 300 }, uFogF: { value: 640 }, uAW: { value: 1024 }
  };
  const UCK = { uAnim: U.uAnim, uDetail: U.uDetail, uDetailN: U.uDetailN, uEnv: U.uEnv, uSun: { value: new THREE.Vector3(.2, .85, .5).normalize() }, uSunC: { value: new THREE.Vector3(.72, .74, .8) }, uAmb: { value: new THREE.Vector3(.5, .54, .68) },
    uFog: { value: new THREE.Vector3() }, uEye: { value: new THREE.Vector3() }, uFogN: { value: 90 }, uFogF: { value: 100 }, uAW: U.uAW };

  const CAPS = { deco: 70, rock: 14, tr_: 150, bolt_e: 130, bolt_muzzle: 4, pick_scrap: 36, pick: 6, boom: 12, fx_flash: 10, sparks: 12, imp_: 12, smoke: 10, debris: 10, shock: 8, puff: 70, aimline: 2, hud_: 10, default: 14 };
  const LOD0_CAP = { deco: 2, tr_: 4, bolt: 4, rock: 3, pick: 2, boom: 2, fx_: 2, sparks: 2, imp_: 2, smoke: 2, debris: 2, shock: 2, puff: 3, ck_led: 10, hud_: 10, aimline: 2, default: 3 };
  const PHONE_CAP = { deco: 30, boom_hit: 3, imp_: 3, boom_: 5, fx_flash: 3, sparks: 4, smoke: 3, debris: 4, shock: 3, puff: 30, default: 0 };
  const prefixKey = (n, tbl) => { for (const k in tbl) if (k !== 'default' && n.startsWith(k)) return tbl[k]; return tbl.default; };

  let manifest = null;
  const BT = {};
  const allBatches = [];
  let trisLeft = 0, lodBias = 1;

  const FX_LEN = { boom_s: 4, boom_m: 7, boom_l: 12.5, fx_flash: 4.4, sparks: 2.2, boom_hit: 1.5, imp_armor: 2 };
  const fxLen = def => { for (const k in FX_LEN) if (manifest.models[k] === def) return FX_LEN[k]; return 0; };
  function makeMat(def, layer, fast) {
    const defines = {};
    if (!LOW && layer !== 2) defines.HQ = 1;
    if (fast && def.parts) defines.FAST = 1;
    return new THREE.ShaderMaterial({ vertexShader: VS, fragmentShader: FS, side: THREE.FrontSide, defines, depthTest: layer !== 2, depthWrite: layer !== 2,
      uniforms: Object.assign({}, layer ? UCK : U, { uBones: { value: def.parts }, uQ: { value: def.q }, uFx: { value: new THREE.Vector2(fxLen(def), def.clips.play ? def.clips.play.frames : 1) } }) });
  }
  function Batch(name, def, bins, layer) {
    this.name = name; this.r = def.r; this.def = def; this.layer = layer;
    this.cap = name === 'dust' ? (LOW ? 50 : 90) : prefixKey(name, CAPS);
    if (LOW) { const lim = prefixKey(name, PHONE_CAP); if (lim) this.cap = min(this.cap, lim); }
    this.l0cap = name === 'dust' ? 2 : prefixKey(name, LOD0_CAP);
    this.noFog = /^(station|ring)/.test(name) ? 1 : 0;
    this.isBoom = /^boom_[sml]$/.test(name);
    this.optional = /^(deco|smoke|sparks|debris|shock|puff|dust|fx_|imp_|boom_hit)/.test(name);
    const lods = def.lod.filter(l => !(LOW && l.bin === 'hi'));
    this.tris = lods.map(l => l.ic / 3);
    this.last = lods.length - 1;
    this.meshes = []; this.cnt = [0, 0, 0]; this.m = []; this.an = []; this.lastL = -1; this.lastI = -1;
    const near = makeMat(def, layer, false), far = def.parts ? makeMat(def, layer, true) : near;
    lods.forEach((l, i) => {
      const buf = bins[l.bin], g = new THREE.BufferGeometry();
      const A = new THREE.InterleavedBuffer(new Int16Array(buf, l.vo, l.vc * 6), 6);
      const Bb = new THREE.InterleavedBuffer(new Int8Array(buf, l.vo + l.vc * 12, l.vc * 4), 4);
      const C = new THREE.InterleavedBuffer(new Uint8Array(buf, l.vo + l.vc * 16, l.vc * 4), 4);
      g.setAttribute('position', new THREE.InterleavedBufferAttribute(A, 3, 0, true));
      g.setAttribute('aPart', new THREE.InterleavedBufferAttribute(A, 1, 3, false));
      g.setAttribute('aUv', new THREE.InterleavedBufferAttribute(A, 2, 4, true));
      g.setAttribute('aN', new THREE.InterleavedBufferAttribute(Bb, 4, 0, true));
      g.setAttribute('aC', new THREE.InterleavedBufferAttribute(C, 4, 0, true));
      g.setIndex(new THREE.BufferAttribute(l.bits === 16 ? new Uint16Array(buf, l.io, l.ic) : new Uint32Array(buf, l.io, l.ic), 1));
      g.boundingSphere = new THREE.Sphere(new THREE.Vector3(), def.r * 2);
      const lc = i === 0 && this.last > 0 ? min(this.cap, max(this.l0cap, 1)) : this.cap;
      // far LODs skip frame blending: half the vertex texture reads
      const im = new THREE.InstancedMesh(g, (i > 0 && (LOW || i > 1)) ? far : near, lc);
      im.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
      const an = new THREE.InstancedBufferAttribute(new Float32Array(lc * 4), 4); an.setUsage(THREE.DynamicDrawUsage);
      g.setAttribute('iAnim', an);
      im.frustumCulled = false; im.count = 0; im.visible = false; im.matrixAutoUpdate = false;
      (layer === 2 ? hudScene : layer === 1 ? ckScene : scene).add(im);
      this.meshes.push(im); this.m.push(im.instanceMatrix.array); this.an.push(an.array);
    });
    this.lcap = this.meshes.map(q => q.instanceMatrix.count);
    allBatches.push(this);
  }
  Batch.prototype.begin = function () { this.cnt[0] = this.cnt[1] = this.cnt[2] = 0; };
  Batch.prototype.end = function () {
    for (let i = 0; i < this.meshes.length; i++) {
      const im = this.meshes[i], c = this.cnt[i];
      if (im.count !== c) im.count = c;
      im.visible = c > 0;
      if (c > 0) {
        const a = im.instanceMatrix, b = im.geometry.attributes.iAnim;
        a.updateRange.offset = 0; a.updateRange.count = c * 16; a.needsUpdate = true;
        b.updateRange.offset = 0; b.updateRange.count = c * 4; b.needsUpdate = true;
      }
    }
  };
  // Picks an LOD from on-screen size, then respects the per-model and global triangle budgets.
  Batch.prototype.push = function (x, y, z, qx, qy, qz, qw, s, base, frame, flash, forceLod) {
    const last = this.last;
    let l;
    if (forceLod !== undefined) l = min(forceLod, last);
    else {
      const e = U.uEye.value, dx = x - e.x, dy = y - e.y, dz = z - e.z;
      const d2 = (dx * dx + dy * dy + dz * dz) * lodBias, rr = this.r * s;
      l = rr * rr > d2 * LOD_A ? 0 : rr * rr > d2 * LOD_B ? 1 : 2;
      if (l > last) l = last;
      while (l < last && (this.cnt[l] >= this.lcap[l] || this.tris[l] > trisLeft)) l++;
      if ((this.optional || (LOW && this.isBoom && this.cnt[0] + this.cnt[1] + this.cnt[2] >= 3)) && this.tris[l] > trisLeft) { this.lastL = -1; return; }
    }
    if (this.cnt[l] >= this.lcap[l]) { if (forceLod === undefined && l < last) l = last; if (this.cnt[l] >= this.lcap[l]) { this.lastL = -1; return; } }
    trisLeft -= this.tris[l];
    const i = this.cnt[l]++, m = this.m[l], o = i * 16;
    this.lastL = l; this.lastI = i;
    const x2 = qx + qx, y2 = qy + qy, z2 = qz + qz, xx = qx * x2, xy = qx * y2, xz = qx * z2, yy = qy * y2, yz = qy * z2, zz = qz * z2, wx = qw * x2, wy = qw * y2, wz = qw * z2;
    m[o] = (1 - (yy + zz)) * s; m[o + 1] = (xy + wz) * s; m[o + 2] = (xz - wy) * s; m[o + 3] = 0;
    m[o + 4] = (xy - wz) * s; m[o + 5] = (1 - (xx + zz)) * s; m[o + 6] = (yz + wx) * s; m[o + 7] = 0;
    m[o + 8] = (xz + wy) * s; m[o + 9] = (yz - wx) * s; m[o + 10] = (1 - (xx + yy)) * s; m[o + 11] = 0;
    m[o + 12] = x; m[o + 13] = y; m[o + 14] = z; m[o + 15] = 1;
    const an = this.an[l], p = i * 4;
    an[p] = base; an[p + 1] = frame; an[p + 2] = flash; an[p + 3] = this.noFog;
  };
  // Width across, length along the local Z of the instance pushed last.
  Batch.prototype.stretch = function (w, len) {
    if (this.lastL < 0) return;
    const m = this.m[this.lastL], o = this.lastI * 16;
    for (let k = 0; k < 3; k++) { m[o + k] *= w; m[o + 4 + k] *= w; m[o + 8 + k] *= len; }
  };
  const LOD_A = LOW ? .03 : .0075, LOD_B = LOW ? .0034 : .0007;

  const Q = { x: 0, y: 0, z: 0, w: 1 };
  function eulerQ(px, py, pz) {
    const cx = cos(px / 2), sx = sin(px / 2), cy = cos(py / 2), sy = sin(py / 2), cz = cos(pz / 2), sz = sin(pz / 2);
    Q.x = sx * cy * cz + cx * sy * sz; Q.y = cx * sy * cz - sx * cy * sz; Q.z = cx * cy * sz + sx * sy * cz; Q.w = cx * cy * cz - sx * sy * sz;
  }
  // Heading from a direction, then roll around it (order: yaw, pitch, roll).
  function headingQ(dx, dy, dz, roll) {
    const l = sqrt(dx * dx + dy * dy + dz * dz) || 1, yaw = atan2(dx / l, dz / l), pit = -Math.asin(clamp(dy / l, -1, 1));
    const cy = cos(yaw / 2), sy = sin(yaw / 2), cp = cos(pit / 2), sp = sin(pit / 2), cr = cos(roll / 2), sr = sin(roll / 2);
    Q.x = cy * sp * cr + sy * cp * sr; Q.y = sy * cp * cr - cy * sp * sr; Q.z = cy * cp * sr - sy * sp * cr; Q.w = cy * cp * cr + sy * sp * sr;
  }
  function aimQ(dx, dy, dz) {
    const l = sqrt(dx * dx + dy * dy + dz * dz) || 1; dx /= l; dy /= l; dz /= l;
    if (dz < -.9999) { Q.x = 0; Q.y = 1; Q.z = 0; Q.w = 0; return; }
    const w = 1 + dz, n = sqrt(dy * dy + dx * dx + w * w);
    Q.x = -dy / n; Q.y = dx / n; Q.z = 0; Q.w = w / n;
  }
  const clipFrame = (c, time) => { const f = time * c.fps; if (c.loop) { const fr = f % c.frames; return fr < 0 ? fr + c.frames : fr; } return min(f, c.frames - .001); };
  function pushClip(b, clip, time, x, y, z, s, flash) {
    const c = b.def.clips[clip];
    b.push(x, y, z, Q.x, Q.y, Q.z, Q.w, s, c.base, clipFrame(c, time), flash);
  }

  // ---------- loading ----------
  // XHR plus blob-backed images work the same over http(s) and over an app's custom URL scheme.
  const setBar = (v, label) => { $('barIn').style.transform = 'scaleX(' + clamp(v, 0, 1) + ')'; $('loadTxt').textContent = t(label) + '  ' + round(v * 100) + '%'; };
  const tickFrame = () => new Promise(r => { let done = false; const go = () => { if (!done) { done = true; r(); } }; requestAnimationFrame(go); setTimeout(go, 120); });
  function xhrBytes(url, onDelta) {
    return new Promise((res, rej) => {
      const x = new XMLHttpRequest(); let seen = 0, stall = 0;
      const clear = () => clearTimeout(stall), arm = () => { clear(); stall = setTimeout(() => { x.abort(); rej(new Error('stalled ' + url)); }, 25000); };
      x.open('GET', url, true); x.responseType = 'arraybuffer';
      x.onprogress = e => { arm(); const d = e.loaded - seen; seen = e.loaded; if (d > 0) onDelta(d); };
      x.onload = () => { clear(); const b = x.response; if ((x.status === 200 || x.status === 0) && b && b.byteLength) { if (b.byteLength > seen) onDelta(b.byteLength - seen); res(b); } else rej(new Error('status ' + x.status + ' ' + url)); };
      x.onerror = () => { clear(); rej(new Error('network ' + url)); };
      arm(); x.send();
    });
  }
  async function fetchBytes(url, onDelta) {
    const r = await fetch(url);
    if (!r.ok && r.status !== 0) throw new Error('status ' + r.status + ' ' + url);
    const b = await r.arrayBuffer(); onDelta(b.byteLength); return b;
  }
  async function bytes(url, onDelta) {
    const on = onDelta || (() => {});
    for (let attempt = 0; attempt < 3; attempt++) {
      try { return await xhrBytes(url, on); } catch (e) {
        try { return await fetchBytes(url, on); } catch (e2) { if (attempt === 2) throw e2; await new Promise(r => setTimeout(r, 300 * (attempt + 1))); }
      }
    }
    throw new Error(url);
  }
  async function loadImage(url, onDelta) {
    const data = await bytes(url, onDelta), blobUrl = URL.createObjectURL(new Blob([data], { type: 'image/jpeg' }));
    try {
      return await new Promise((res, rej) => {
        const i = new Image(), timer = setTimeout(() => rej(new Error('image timeout ' + url)), 20000);
        i.onload = () => { clearTimeout(timer); res(i); }; i.onerror = () => { clearTimeout(timer); rej(new Error('image ' + url)); }; i.src = blobUrl;
      });
    } finally { setTimeout(() => URL.revokeObjectURL(blobUrl), 4000); }
  }
  function texFrom(img, opt) {
    const tx = new THREE.Texture(img);
    tx.wrapS = opt && opt.repeat ? THREE.RepeatWrapping : THREE.ClampToEdgeWrapping; tx.wrapT = tx.wrapS;
    tx.minFilter = opt && opt.mip ? THREE.LinearMipmapLinearFilter : THREE.LinearFilter; tx.magFilter = THREE.LinearFilter;
    tx.generateMipmaps = !!(opt && opt.mip); tx.anisotropy = opt && opt.aniso || 1; tx.flipY = true; tx.needsUpdate = true;
    return tx;
  }
  function cubeFrom(img) {
    const n = LOW ? min(img.height, 256) : img.height, h = img.height, faces = [];
    for (let f = 0; f < 6; f++) {
      const c = document.createElement('canvas'); c.width = c.height = n;
      c.getContext('2d').drawImage(img, f * h, 0, h, h, 0, 0, n, n);
      faces.push(c);
    }
    const tx = new THREE.CubeTexture(faces);
    tx.minFilter = THREE.LinearFilter; tx.magFilter = THREE.LinearFilter; tx.generateMipmaps = false; tx.flipY = false; tx.needsUpdate = true;
    return tx;
  }
  let moons = [], skyMesh, planetMesh, starMesh, skyTex = [], planetTex = [];
  const SkyU = { uA: { value: null }, uB: { value: null }, uMix: { value: 1 } };
  const StarU = { uPx: { value: 1 } };
  const PlanetU = { uMap: { value: null }, uSun: U.uSun, uEye: U.uEye, uAtm: { value: new THREE.Vector3() }, uSpin: { value: 0 } };

  async function boot() {
    applyLang();
    setBar(0, 'l_get');
    const cv = $('c');
    try {
      renderer = new THREE.WebGLRenderer({ canvas: cv, antialias: true, alpha: false, depth: true, stencil: false, powerPreference: 'high-performance', preserveDrawingBuffer: DEBUG });
    } catch (e) { gl2ok = false; }
    if (!gl2ok || !renderer.capabilities.isWebGL2) { $('bar').style.display = 'none'; $('loadTxt').textContent = ''; $('loadErr').style.display = 'block'; $('loadErr').textContent = t('l_gl'); return; }
    gl = renderer.getContext();
    renderer.autoClear = false; renderer.info.autoReset = false; renderer.setClearColor(0x05070f, 1);
    renderer.outputEncoding = THREE.LinearEncoding;
    scene = new THREE.Scene(); ckScene = new THREE.Scene(); hudScene = new THREE.Scene();
    for (const s of [scene, ckScene, hudScene]) { s.matrixAutoUpdate = false; s.matrixWorldAutoUpdate = false; }
    camera = new THREE.PerspectiveCamera(62, 1, .6, 3200); ckCamera = new THREE.PerspectiveCamera(62, 1, .02, 6);
    hudCamera = new THREE.OrthographicCamera(-1, 1, 1, -1, -2, 2);
    pr = PR_START;
    fit();

    manifest = JSON.parse(new TextDecoder().decode(await bytes('assets/manifest.json')));
    const F = manifest.files, tag = LOW ? '_lo' : '';
    const texUrls = ['assets/tex/detail.jpg'];
    if (!LOW) texUrls.push('assets/tex/detail_n.jpg');
    for (let i = 0; i < 4; i++) texUrls.push('assets/tex/neb' + i + tag + '.jpg');
    for (let i = 0; i < 4; i++) texUrls.push('assets/tex/planet' + i + '.jpg');
    const IMG_EST = LOW ? 700000 : 1500000;
    const total = (LOW ? 0 : F.hi.bytes) + F.base.bytes + F.anim.bytes + 72000 + IMG_EST;
    let got = 0;
    const on = n => { got += n; setBar(min(.8, got / total * .8), 'l_get'); };
    const [hi, base, anim, starData] = await Promise.all([LOW ? null : bytes('assets/' + F.hi.file, on), bytes('assets/' + F.base.file, on), bytes('assets/' + F.anim.file, on), bytes('assets/mesh/stars.bin', on)]);
    const imgs = [];
    for (let i = 0; i < texUrls.length; i++) imgs.push(await loadImage(texUrls[i], on));

    setBar(.81, 'l_tex');
    let k = 0;
    U.uDetail.value = texFrom(imgs[k++], { repeat: true, mip: true, aniso: min(LOW ? 2 : 4, renderer.capabilities.getMaxAnisotropy()) });
    U.uDetailN.value = LOW ? U.uDetail.value : texFrom(imgs[k++], { repeat: true, mip: true });
    for (let i = 0; i < 4; i++) { skyTex.push(cubeFrom(imgs[k++])); if (i % 2) await tickFrame(); }
    for (let i = 0; i < 4; i++) planetTex.push(texFrom(imgs[k++], {}));
    const animTex = new THREE.DataTexture(new Float32Array(anim), F.anim.w, F.anim.h, THREE.RGBAFormat, THREE.FloatType);
    animTex.minFilter = animTex.magFilter = THREE.NearestFilter; animTex.generateMipmaps = false; animTex.flipY = false; animTex.needsUpdate = true;
    U.uAnim.value = animTex; U.uAW.value = F.anim.w; U.uEnv.value = skyTex[0];

    setBar(.84, 'l_mesh');
    const bins = { hi, base };
    const names = Object.keys(manifest.models);
    for (let i = 0; i < names.length; i++) {
      const n = names[i];
      if (n === 'sky' || /^planet\d/.test(n)) continue;
      BT[n] = new Batch(n, manifest.models[n], bins, n.startsWith('hud_') ? 2 : n.startsWith('ck_') ? 1 : 0);
      if (i % 12 === 0) { setBar(.84 + .05 * i / names.length, 'l_mesh'); await tickFrame(); }
    }
    const geoOf = name => { const d = manifest.models[name], ls = d.lod.filter(l => !(LOW && l.bin === 'hi')), l = ls[0], g = new THREE.BufferGeometry(), buf = bins[l.bin];
      const pos = new Float32Array(l.vc * 3), src = new Int16Array(buf, l.vo, l.vc * 6);
      for (let q = 0; q < l.vc; q++) { pos[q * 3] = src[q * 6] / 32767 * d.q; pos[q * 3 + 1] = src[q * 6 + 1] / 32767 * d.q; pos[q * 3 + 2] = src[q * 6 + 2] / 32767 * d.q; }
      g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
      g.setIndex(new THREE.BufferAttribute(l.bits === 16 ? new Uint16Array(buf, l.io, l.ic) : new Uint32Array(buf, l.io, l.ic), 1));
      return g; };
    skyMesh = new THREE.Mesh(geoOf('sky'), new THREE.ShaderMaterial({ vertexShader: SKY_VS, fragmentShader: SKY_FS, uniforms: SkyU, side: THREE.BackSide, depthWrite: false, depthTest: true }));
    skyMesh.frustumCulled = false; skyMesh.renderOrder = 10; skyMesh.matrixAutoUpdate = false; scene.add(skyMesh);
    const st = new Float32Array(starData), stN = st.length / 7, sp = new Float32Array(stN * 3), ss = new Float32Array(stN), sc = new Float32Array(stN * 3);
    for (let i = 0; i < stN; i++) { sp[i * 3] = st[i * 7]; sp[i * 3 + 1] = st[i * 7 + 1]; sp[i * 3 + 2] = st[i * 7 + 2]; ss[i] = st[i * 7 + 3]; sc[i * 3] = st[i * 7 + 4]; sc[i * 3 + 1] = st[i * 7 + 5]; sc[i * 3 + 2] = st[i * 7 + 6]; }
    const sg = new THREE.BufferGeometry(); sg.setAttribute('position', new THREE.BufferAttribute(sp, 3)); sg.setAttribute('aSize', new THREE.BufferAttribute(ss, 1)); sg.setAttribute('aCol', new THREE.BufferAttribute(sc, 3));
    starMesh = new THREE.Points(sg, new THREE.ShaderMaterial({ vertexShader: STAR_VS, fragmentShader: STAR_FS, uniforms: StarU, depthWrite: false, depthTest: true }));
    starMesh.frustumCulled = false; starMesh.renderOrder = 9; starMesh.matrixAutoUpdate = false; scene.add(starMesh);
    planetMesh = new THREE.Mesh(geoOf('planet0'), new THREE.ShaderMaterial({ vertexShader: PLANET_VS, fragmentShader: PLANET_FS, uniforms: PlanetU }));
    planetMesh.frustumCulled = false; planetMesh.matrixAutoUpdate = false; scene.add(planetMesh);
    // scenery: three rock shapes for the passing belt, and moons with their own map and air colour (planet geometry and textures already loaded)
    ['rockL0', 'rockM1', 'rockS2'].forEach((n, k) => { BT['deco' + k] = new Batch('deco' + k, manifest.models[n], bins, 0); });
    for (let j = 0; j < (LOW ? 2 : 3); j++) { const u = { uMap: { value: planetTex[0] }, uSun: U.uSun, uEye: U.uEye, uAtm: { value: new THREE.Vector3() }, uSpin: { value: j * 2 } };
      const m = new THREE.Mesh(planetMesh.geometry, new THREE.ShaderMaterial({ vertexShader: PLANET_VS, fragmentShader: PLANET_FS, uniforms: u })); m.frustumCulled = false; m.matrixAutoUpdate = false; m.visible = false; scene.add(m);
      moons.push({ m, u, x: 0, y: 0, z: 0, s: 1, v: 1, on: false, wait: 2 + j * 9 }); }
    applySector(0, true);

    // compile every shader and upload every buffer and texture now, so nothing can hitch on first use in play
    setBar(.89, 'l_gpu');
    await tickFrame();
    for (const tx of [U.uDetail.value, U.uDetailN.value, animTex, ...skyTex, ...planetTex]) { renderer.initTexture(tx); await tickFrame(); }
    setBar(.92, 'l_gpu');
    for (const b of allBatches) for (let i = 0; i < b.meshes.length; i++) { const im = b.meshes[i]; im.count = 1; im.visible = true; b.m[i].fill(0); }
    scene.updateMatrixWorld(true); ckScene.updateMatrixWorld(true); hudScene.updateMatrixWorld(true);
    renderer.compile(scene, camera); renderer.compile(ckScene, ckCamera); renderer.compile(hudScene, hudCamera);
    setBar(.95, 'l_gpu'); await tickFrame();
    const rt = new THREE.WebGLRenderTarget(8, 8);
    for (let idx = 0; idx < allBatches.length; idx += 5) {
      renderer.setRenderTarget(rt);
      for (const b of allBatches) for (const im of b.meshes) im.visible = false;
      for (let j = idx; j < idx + 5 && j < allBatches.length; j++) for (const im of allBatches[j].meshes) im.visible = true;
      renderer.clear(); renderer.render(scene, camera); renderer.render(ckScene, ckCamera); renderer.render(hudScene, hudCamera);
      renderer.setRenderTarget(null);
      setBar(.95 + .05 * idx / allBatches.length, 'l_gpu'); await tickFrame();
    }
    rt.dispose();
    for (const b of allBatches) { b.begin(); b.end(); }
    FX_NAME.forEach((n, i) => { fxBatch[i] = BT[n]; });
    renderer.info.reset();
    setBar(1, 'l_gpu');
    $('load').style.display = 'none';
    setMode('menu');
    window.__ready = true;
    requestAnimationFrame(frame);
  }

  function applyBackdropFrame() {
    const s = SECTORS[S.sector];
    planetMesh.position.set(s.pPos[0] * bgK, s.pPos[1] + bgY, s.pPos[2]); planetMesh.scale.setScalar(s.pS * bgS); planetMesh.updateMatrix(); planetMesh.updateMatrixWorld(true);
  }
  function applySector(i, instant) {
    const s = SECTORS[i % 4];
    S.sector = i % 4;
    U.uSun.value.set(s.sun[0], s.sun[1], s.sun[2]).normalize();
    U.uSunC.value.set(s.sunC[0], s.sunC[1], s.sunC[2]); U.uAmb.value.set(s.amb[0], s.amb[1], s.amb[2]);
    U.uFog.value.set(s.fog[0], s.fog[1], s.fog[2]);
    SkyU.uB.value = instant ? skyTex[i % 4] : SkyU.uA.value;
    SkyU.uA.value = skyTex[i % 4]; SkyU.uMix.value = instant ? 1 : 0; U.uEnv.value = skyTex[i % 4];
    PlanetU.uMap.value = planetTex[s.planet]; PlanetU.uAtm.value.set(s.atm[0], s.atm[1], s.atm[2]);
    planetMesh.position.set(s.pPos[0] * bgK, s.pPos[1] + bgY, s.pPos[2]); planetMesh.scale.setScalar(s.pS * bgS); planetMesh.updateMatrix(); planetMesh.updateMatrixWorld(true);
  }

  // ---------- spawning ----------
  function spawnEnemy(type, x, y, z, path, a, b, c, d, e2) {
    const e = en.get(); if (!e) return null;
    const df = ET[type];
    e.type = type; e.def = df; e.x = x; e.y = y; e.z = z; e.vx = 0; e.vy = 0; e.vz = df.v * (1 + (R.sector - 1) * .05);
    e.hp = e.maxHp = ceil(df.hp * hpMul()); e.t = 0; e.path = path; e.a = a || 0; e.b = b || 0; e.c = c || 0; e.d = d || 0; e.e = e2 || 0;
    e.fireT = df.fire ? rnd(.7, 1.1) * df.fire * fireMul() : 0; e.flash = 0; e.rx = rnd(0, TAU); e.ry = rnd(0, TAU); e.rz = rnd(0, TAU);
    e.sx = rnd(-1.5, 1.5); e.sy = rnd(-1.5, 1.5); e.sz = rnd(-1, 1); e.shield = df.shield ? ceil(df.shield * hpMul()) : 0; e.st = 0;
    e.vr = floor(random() * 3); e.phase = random() * 4; e.px = x; e.py = y; e.pz = z; e.bank = 0; e.ux = 0; e.uy = 0; e.uz = e.vz;
    return e;
  }
  function Qs(at, type, x, y, path, a, b, c, d, e) {
    const s = sq.get(); if (!s) return;
    // portrait: formations are narrowed to fit the taller, closer view
    let qa = a || 0, qb = b || 0, qc = c || 0;
    if (SX !== 1) { if (path === 0) qa *= SX; else if (path === 1 || path === 6) { qa *= SX; qc *= SX; } else if (path === 2) { qb *= SX; qc *= SX; } else if (path === 7) { qa *= SX; qb *= SX; } }
    s.t = at; s.type = type; s.x = x * SX; s.y = y; s.path = path; s.a = qa; s.b = qb; s.c = qc; s.d = d || 0; s.e = e || 0;
  }
  // paths: 0 straight, 1 weave, 2 come in and hold, 3 side arc, 5 homing rocket, 6 corkscrew, 7 banking fly-past
  function patternDart(at, L) {
    const n = 4 + min(6, floor(L / 3)), v = floor(random() * (L >= 3 ? 6 : 4));
    if (v === 4) { const cx = rnd(-14, 14), cy = rnd(-6, 7), dir = random() < .5 ? 1 : -1; for (let i = 0; i < n; i++) Qs(at + i * .17, 'dart', cx, cy, 6, cx, dir * 2.3, 13, cy); return n * .17 + .8; }
    if (v === 5) { const dir = random() < .5 ? 1 : -1, y = rnd(-8, 9); for (let i = 0; i < n; i++) Qs(at + i * .2, 'dart', dir * 56, y + i * .8, 7, dir * 56, -dir * (16 + i * 3), .26, y + i * .8, rnd(5, 10)); return n * .2 + 1; }
    if (v === 0) { const y = rnd(-9, 9); for (let i = 0; i < n; i++) { const o = i - (n - 1) / 2; Qs(at + abs(o) * .16, 'dart', o * 6.2, y + abs(o) * 1.3, 0); } return 1.6; }
    if (v === 1) { const cx = rnd(-16, 16), cy = rnd(-8, 8); for (let i = 0; i < n; i++) Qs(at + i * .2, 'dart', cx, cy, 1, cx, 2.2, 15, cy); return n * .2 + .6; }
    if (v === 2) { const dir = random() < .5 ? 1 : -1, y = rnd(-9, 11); for (let i = 0; i < n; i++) Qs(at + i * .19, 'dart', -dir * 64, y, 3, dir, .36, 13, y); return n * .19 + 1; }
    const y = rnd(-6, 10); for (let i = 0; i < n; i++) { Qs(at + i * .24, 'dart', -64, y, 3, 1, .36, 11, y); Qs(at + i * .24, 'dart', 64, y, 3, -1, .36, 11, y); } return n * .24 + 1;
  }
  function patternFor(type, at, L) {
    switch (type) {
      case 'dart': return patternDart(at, L);
      case 'rock': { const n = 4 + min(8, floor(L / 2)); for (let i = 0; i < n; i++) { const roll = random(); Qs(at + i * .3, roll < .45 ? 'rockS' : roll < .82 ? 'rockM' : 'rockL', rnd(-30, 30), rnd(-16, 16), 0, rnd(-3, 3), rnd(-2, 2)); } return n * .3; }
      case 'wasp': { const n = 3 + min(4, floor(L / 5)), cx = rnd(-15, 15), cy = rnd(-6, 8); for (let i = 0; i < n; i++) Qs(at + i * .34, 'wasp', cx, cy, 1, cx, 1.8, 13, cy); return n * .34 + .8; }
      case 'splitter': { const n = 2 + min(3, floor(L / 8)); for (let i = 0; i < n; i++) Qs(at + i * .5, 'splitter', -22 + 44 * (n > 1 ? i / (n - 1) : .5), rnd(-7, 9), 0, 0, 0); return n * .5 + .6; }
      case 'orb': { const n = 1 + min(3, floor(L / 7)); for (let i = 0; i < n; i++) { const x = -24 + 48 * (i + 1) / (n + 1), y = rnd(-6, 11); Qs(at + i * .3, 'orb', x, y, 2, -128 - (i % 2) * 34, x, 7, 9, y); } return n * .3 + 2; }
      case 'bomber': { const n = 1 + min(2, floor(L / 12)); for (let i = 0; i < n; i++) { const x = -26 + 52 * (i + 1) / (n + 1), y = rnd(2, 11); Qs(at + i * .5, 'bomber', x, y, 2, -150, x, 9, 12, y); } return 2.6; }
      case 'mine': { const n = 3 + min(5, floor(L / 5)); for (let i = 0; i < n; i++) Qs(at + i * .24, 'mine', rnd(-27, 27), rnd(-14, 14), 0, rnd(-1.4, 1.4), rnd(-1, 1)); return n * .24 + .6; }
      case 'lancer': { const n = 1 + min(2, floor(L / 13)); for (let i = 0; i < n; i++) { const x = -24 + 48 * (i + 1) / (n + 1), y = rnd(-5, 10); Qs(at + i * .4, 'lancer', x, y, 2, -122 - i * 16, x, 8, 10, y); } return 2.6; }
      case 'warden': { const n = 1 + min(2, floor(L / 16)); for (let i = 0; i < n; i++) { const x = -22 + 44 * (i + 1) / (n + 1), y = rnd(-4, 9); Qs(at + i * .4, 'warden', x, y, 2, -112, x, 6, 11, y); } Qs(at + .9, 'wasp', -22, 6, 1, -22, 1.8, 9, 6); Qs(at + 1.1, 'wasp', 22, 6, 1, 22, 1.8, 9, 6); return 2.8; }
    }
    return 1;
  }
  const UNLOCK = [['dart', 1], ['rock', 2], ['wasp', 2], ['splitter', 4], ['orb', 5], ['bomber', 7], ['mine', 8], ['lancer', 10], ['warden', 13]];
  function pickType(L) {
    let n = 0;
    for (let i = 0; i < UNLOCK.length; i++) if (UNLOCK[i][1] <= L) n = i + 1;
    return UNLOCK[clamp(n - 1 - floor(n * random() * random()), 0, n - 1)][0];
  }
  function buildWave() {
    const L = (R.sector - 1) * 5 + R.wave, groups = clamp(2 + floor(L * .42), 2, 8), gap = max(.75, 1.9 - L * .05);
    let at = .6;
    for (let i = 0; i < groups; i++) at += patternFor(i === 0 && L > 2 ? UNLOCK[min(UNLOCK.length - 1, floor(random() * 3))][0] : pickType(L), at, L) + gap;
  }

  // ---------- effects: layered, all baked clips on instanced meshes ----------
  const FX = { s: 0, m: 1, l: 2, hit: 3, debris: 4, shock: 5, flash: 6, sparks: 7, armor: 8, shield: 9, smS: 10, smM: 11, smL: 12 };
  const FX_NAME = ['boom_s', 'boom_m', 'boom_l', 'boom_hit', 'debris', 'shock', 'fx_flash', 'sparks', 'imp_armor', 'imp_shield', 'smoke_s', 'smoke_m', 'smoke_l'];
  const fxBatch = [];
  let fxLoad = 1; // governor lowers this on weak devices: fewer secondary layers
  function addFx(kind, x, y, z, s, vx, vy, vz, faceCamera) {
    const f = fx.get(); if (!f) return;
    const c = fxBatch[kind].def.clips.play;
    f.m = kind; f.x = x; f.y = y; f.z = z; f.s = s; f.t = 0; f.life = c.frames / c.fps; f.vx = vx || 0; f.vy = vy || 0; f.vz = vz || 0;
    if (faceCamera) { const e = U.uEye.value; aimQ(e.x - x, e.y - y, e.z - z); } else eulerQ(rnd(0, TAU), rnd(0, TAU), rnd(0, TAU));
    f.qx = Q.x; f.qy = Q.y; f.qz = Q.z; f.qw = Q.w;
  }
  const delayLast = d => { if (fx.n) fx.a[fx.n - 1].t = -d; };
  function explosion(x, y, z, size, vz) {
    const v = vz === undefined ? 26 : vz;
    if (LOW && fx.n > 26 && size > 1) { addFx(size > 2 ? FX.m : FX.s, x, y, z, size > 2 ? 1.5 : 1.2, 0, 0, v); addFx(FX.sparks, x, y, z, size * .5, 0, 0, v); return; }
    if (size <= 1) {
      addFx(FX.flash, x, y, z, 1.1, 0, 0, v); addFx(FX.s, x, y, z, 1.2, 0, 0, v); addFx(FX.sparks, x, y, z, .62, 0, 0, v);
      if (fxLoad > .6) { addFx(FX.smS, x, y, z, 1, 0, 0, v * .7); delayLast(.14); }
      addFx(FX.debris, x, y, z, .4, 0, 0, v);
    } else if (size === 2) {
      addFx(FX.flash, x, y, z, 1.8, 0, 0, v); addFx(FX.m, x, y, z, 1.2, 0, 0, v); addFx(FX.sparks, x, y, z, 1, 0, 0, v);
      addFx(FX.shock, x, y, z, 2.6, 0, 0, v, true);
      if (fxLoad > .4) { addFx(FX.smM, x, y, z, 1, 0, 0, v * .6); delayLast(.2); }
      addFx(FX.debris, x, y, z, .7, 0, 0, v);
    } else if (size === 3) {
      addFx(FX.flash, x, y, z, 3, 0, 0, v * .6); addFx(FX.l, x, y, z, 1.05, 0, 0, v * .6); addFx(FX.sparks, x, y, z, 1.7, 0, 0, v * .6);
      addFx(FX.shock, x, y, z, 5, 0, 0, v * .6, true); addFx(FX.smL, x, y, z, 1, 0, 0, v * .4); delayLast(.26); addFx(FX.debris, x, y, z, 1.05, 0, 0, v * .6);
    } else {
      addFx(FX.flash, x, y, z, 5, 0, 0, v * .3); addFx(FX.l, x, y, z, 1.8, 0, 0, v * .3); addFx(FX.m, x + rnd(-8, 8), y + rnd(-6, 6), z, 1.7, 0, 0, v * .3);
      addFx(FX.sparks, x, y, z, 2.8, 0, 0, v * .3); addFx(FX.shock, x, y, z, 8.5, 0, 0, v * .3, true); addFx(FX.smL, x, y, z, 1.8, 0, 0, v * .25); delayLast(.3); addFx(FX.debris, x, y, z, 1.8, 0, 0, v * .3);
    }
  }
  // kind: 0 hull, 1 armour, 2 energy shield
  function impact(kind, x, y, z, s, vz) {
    const v = vz || 0;
    if (kind === 2) addFx(FX.shield, x, y, z, 1.5 * s, 0, 0, v, true);
    else if (kind === 1) { addFx(FX.armor, x, y, z, s, 0, 0, v, true); addFx(FX.flash, x, y, z, .26 * s, 0, 0, v); }
    else addFx(FX.hit, x, y, z, s, 0, 0, v, true);
  }
  const addShake = v => { S.shake = min(1, S.shake + v); };

  // ---------- rewards ----------
  const addScore = v => { R.score += v * R.combo; };
  const chainUp = () => { R.chain++; R.combo = min(8, 1 + floor(R.chain / 8)); R.comboT = 2.8; };
  function dropPickup(kind, x, y, z) {
    const p = pu.get(); if (!p) return;
    p.kind = kind; p.x = x; p.y = y; p.z = z; p.vx = rnd(-3, 3); p.vy = rnd(-2, 3); p.vz = 66; p.t = random() * 3; p.scrap = false;
  }
  function dropScrap(n, x, y, z) {
    for (let i = 0; i < n; i++) {
      const p = pu.get(); if (!p) return;
      const a = random() * TAU, v = rnd(2, 11);
      p.kind = 'scrap'; p.x = x; p.y = y; p.z = z; p.vx = cos(a) * v; p.vy = sin(a) * v; p.vz = rnd(72, 92); p.t = random() * 3; p.scrap = true;
    }
  }
  function rollDrop(x, y, z, weight) {
    R.pity += weight;
    if (R.pity < 12 && random() > weight * .018) return;
    R.pity = 0;
    const needW = R.wpn < 6, needR = R.rkt < 3, needH = R.hull < R.maxHull, roll = random();
    let kind = 's';
    if (needH && R.hull <= 1) kind = 'h';
    else if (needW && roll < .34) kind = 'w';
    else if (needR && roll < .56) kind = 'r';
    else if (needH && roll < .68) kind = 'h';
    else if (roll < .8) kind = 's';
    else if (roll < .9) kind = 'b';
    else kind = 'o';
    dropPickup(kind, x, y, z);
  }
  let pickT = 0;
  function showPick(key) { const el = $('hPick'); el.textContent = t(key); el.style.opacity = 1; pickT = 1.1; }
  function applyPickup(kind) {
    if (kind === 'w') { R.wpn = min(6, R.wpn + 1); showPick('p_w'); }
    else if (kind === 'r') { R.rkt = min(3, R.rkt + 1); showPick('p_r'); }
    else if (kind === 's') { R.shield = min(3, R.shield + 1); showPick('p_s'); }
    else if (kind === 'h') { R.hull = min(R.maxHull, R.hull + 1); showPick('p_h'); }
    else if (kind === 'b') { R.bombs = min(6, R.bombs + 1); showPick('p_b'); }
    else if (kind === 'o') { R.overT = 8; showPick('p_o'); }
    Snd.play('power');
  }

  // ---------- enemy fire: every shot flies from depth to a point on the player's plane ----------
  const EB_R = [1.25, 1.35, 1.55, 1.3, 1.45];
  function shootAt(x, y, z, tx, ty, spd, kind) {
    const b = eb.get(); if (!b) return;
    const dx = tx - x, dy = ty - y, dz = 6 - z, l = sqrt(dx * dx + dy * dy + dz * dz) || 1;
    b.x = x; b.y = y; b.z = z; b.vx = dx / l * spd; b.vy = dy / l * spd; b.vz = dz / l * spd; b.kind = kind; b.r = EB_R[kind]; b.t = 0;
  }
  function fanAt(x, y, z, n, width, spd, kind) {
    for (let i = 0; i < n; i++) { const o = n > 1 ? (i / (n - 1) - .5) * width : 0; shootAt(x, y, z, Pl.x + o, Pl.y + o * .22, spd, kind); }
  }
  function ringAt(x, y, z, n, rad, off, spd, kind, gap) {
    for (let i = 0; i < n; i++) { if (gap && abs(i - n / 2) < gap) continue; const a = off + i / n * TAU; shootAt(x, y, z, Pl.x + cos(a) * rad, Pl.y + sin(a) * rad, spd, kind); }
  }
  function addBeam(ox, oy, oz, tx, ty, tvx, tvy, warn, life, w, part) {
    const b = bm.get(); if (!b) return;
    b.ox = ox; b.oy = oy; b.oz = oz; b.tx = tx; b.ty = ty; b.tvx = tvx; b.tvy = tvy; b.t = 0; b.warn = warn; b.life = life; b.w = w; b.part = part; b.owner = null;
  }
  function enemyFire(e) {
    const bs = bulletMul();
    switch (e.type) {
      case 'wasp': shootAt(e.x, e.y, e.z + 4, Pl.x, Pl.y, 118 * bs, 0); Snd.play('enemy'); break;
      case 'splitter': fanAt(e.x, e.y, e.z + 5, 2, 8, 112 * bs, 0); Snd.play('enemy'); break;
      case 'orb': ringAt(e.x, e.y, e.z + 5, 6 + min(4, R.sector - 1), 11, e.rz, 88 * bs, 1); Snd.play('enemy'); break;
      case 'bomber': { spawnEnemy('mine', e.x, e.y - 3, e.z + 6, 0, rnd(-1.5, 1.5), rnd(-1, 1)); fanAt(e.x, e.y - 1, e.z + 8, 3, 13, 102 * bs, 2); Snd.play('enemy'); break; }
      case 'lancer': addBeam(e.x, e.y, e.z + 8, Pl.x, Pl.y, 0, 0, .8, .55, 1.15, -1); bm.a[bm.n - 1].owner = e; Snd.play('beam'); break;
      case 'warden': fanAt(e.x, e.y, e.z + 6, 3, 9, 116 * bs, 3); Snd.play('enemy'); break;
    }
  }

  // ---------- bosses ----------
  const BOSS_ATK = {
    clawAim: { n: 6, gap: .24, rest: .75, f(i) { const p = B.parts[i % 2]; if (p.alive) { fanAt(p.x, p.y, p.z + 8, 3, 8, 118 * bulletMul(), 0); Snd.play('enemy'); } else if (i % 2 === 0) shootAt(B.x, B.y, B.z + 22, Pl.x, Pl.y, 128 * bulletMul(), 3); } },
    clawFan: { n: 3, gap: .52, rest: .85, f(i) { ringAt(B.x, B.y - 3, B.z + 22, 11, 13 + i * 3, i * .28, 94 * bulletMul(), 3, 1.6); Snd.play('enemy'); } },
    clawSpiral: { n: 34, gap: .065, rest: 1, f(i) { const a = i * .36, r = 13; shootAt(B.x, B.y, B.z + 22, Pl.x + cos(a) * r, Pl.y + sin(a) * r, 92 * bulletMul(), 0); shootAt(B.x, B.y, B.z + 22, Pl.x - cos(a) * r, Pl.y - sin(a) * r, 92 * bulletMul(), 1); if (i % 3 === 0) Snd.play('enemy'); } },
    vSpiral: { n: 44, gap: .06, rest: .9, f(i) { for (let j = 0; j < B.nparts; j++) { const p = B.parts[j]; if (p.alive) { const a = B.t * 2.2 + j * TAU / 3 + i * .05; shootAt(p.x, p.y, p.z + 5, Pl.x + cos(a) * 12, Pl.y + sin(a) * 12, 92 * bulletMul(), 1); } } if (i % 3 === 0) Snd.play('enemy'); } },
    vRing: { n: 4, gap: .62, rest: .8, f(i) { ringAt(B.x, B.y, B.z + 22, 20, 15, i * .07, 84 * bulletMul(), 4, 1.8); Snd.play('enemy'); } },
    vMines: { n: 3, gap: .42, rest: .7, f(i) { spawnEnemy('mine', B.x + (i - 1) * 16, B.y - 6, B.z + 24, 0, (i - 1) * 3, rnd(-1, 1)); shootAt(B.x, B.y, B.z + 22, Pl.x, Pl.y, 128 * bulletMul(), 2); } },
    tWall: { n: 4, gap: .76, rest: .7, f() { const gx = clamp(Pl.x + rnd(-12, 12), -24, 24), gy = clamp(Pl.y + rnd(-6, 6), -12, 12), spd = 82 * bulletMul(); for (let x = -36; x <= 36; x += 7.2) for (let y = -20; y <= 20; y += 8) { if (abs(x - gx) < 9 && abs(y - gy) < 8) continue; shootAt(B.x + x * .4, B.y + y * .4, B.z + 18, x, y, spd, 2); } Snd.play('enemy'); } },
    tBeams: { n: 1, gap: .2, rest: 2.5, f() { for (let j = 0; j < 2; j++) { const p = B.parts[j]; if (p.alive || j === 0) { const dir = j ? -1 : 1; addBeam(p.alive ? p.x : B.x, p.alive ? p.y : B.y, (p.alive ? p.z : B.z) + 18, Pl.x - dir * 22, Pl.y + rnd(-5, 5), dir * 22, 0, .85, 1.6, 1.4, p.alive ? j : -1); } } Snd.play('beam'); } },
    tRockets: { n: 4, gap: .36, rest: .9, f(i) { const p = B.parts[i % 2], x = p.alive ? p.x : B.x + (i % 2 ? 12 : -12), y = p.alive ? p.y : B.y, z = (p.alive ? p.z : B.z) + 18; const m = spawnEnemy('srocket', x, y, z, 5); if (m) m.d = rnd(1.6, 2.4); Snd.play('rocket'); } },
    tFan: { n: 5, gap: .3, rest: .8, f() { fanAt(B.x, B.y + 2, B.z + 20, 5, 19, 122 * bulletMul(), 3); Snd.play('enemy'); } }
  };
  const BOSS_PLAN = [
    [['clawAim', 'clawFan'], ['clawAim', 'clawSpiral', 'clawFan'], ['clawSpiral', 'clawFan', 'clawAim', 'clawSpiral']],
    [['vRing', 'vSpiral'], ['vSpiral', 'vMines', 'vRing'], ['vSpiral', 'vRing', 'vMines', 'vSpiral']],
    [['tWall', 'tFan'], ['tBeams', 'tWall', 'tRockets'], ['tBeams', 'tRockets', 'tWall', 'tFan']]
  ];
  function startBoss() {
    const ty = (R.sector - 1) % 3, lvl = 1 + (R.sector - 1) * .55;
    Object.assign(B, { active: true, dead: false, type: ty, x: 0, y: 2, z: -640, t: 0, state: 'enter', phase: 0, atk: -1, cur: null, sub: 0, subI: 0, subT: 1, flash: 0, dieT: 0, boomT: 0 });
    B.baseZ = ckTall ? -166 : -128; B.r = [24, 21, 25][ty]; B.maxHp = B.hp = round([260, 340, 420][ty] * lvl); B.nparts = ty === 1 ? 3 : 2;
    for (let i = 0; i < 3; i++) { const p = B.parts[i], on = i < B.nparts; p.alive = on; p.max = p.hp = round((ty === 1 ? 46 : 56) * lvl); p.flash = 0; p.r = ty === 1 ? 8 : 11.5; p.x = 0; p.y = 0; p.z = -700; p.ang = 0; }
    showMsg('warning', 'boss' + ty, 2.6, true); Snd.play('warn');
    $('hBossName').textContent = t('boss' + ty); $('hBoss').style.display = 'block'; hudBoss = -1;
  }
  function bossDamage(dmg, part) {
    if (!B.active || B.state !== 'fight') return;
    if (part) {
      part.hp -= dmg; part.flash = .04;
      if (part.hp <= 0 && part.alive) {
        part.alive = false; explosion(part.x, part.y, part.z, 3, 8); addShake(.4); Snd.play('big'); addScore(600); chainUp();
        dropPickup(random() < .5 ? 'w' : 's', part.x, part.y, part.z); dropScrap(6, part.x, part.y, part.z);
      } else Snd.play('hit');
      return;
    }
    B.hp -= dmg; B.flash = .04; Snd.play('hit');
    const ratio = B.hp / B.maxHp, ph = ratio > .66 ? 0 : ratio > .33 ? 1 : 2;
    if (ph !== B.phase) { B.phase = ph; showPick('phase' + (ph + 1)); B.atk = -1; B.sub = 0; B.subT = .9; explosion(B.x + rnd(-14, 14), B.y + rnd(-9, 9), B.z + 16, 3, 8); addShake(.45); Snd.play('big'); clearEnemyShots(); }
    if (B.hp <= 0) {
      B.hp = 0; B.state = 'dying'; B.dieT = 0; B.boomT = 0; S.slow = .9; clearEnemyShots();
      for (let i = 0; i < bm.n; i++) bm.a[i].dead = true;
      for (let i = 0; i < en.n; i++) if (en.a[i].type === 'mine' || en.a[i].type === 'srocket') en.a[i].dead = true;
    }
  }
  function clearEnemyShots() { for (let i = 0; i < eb.n; i++) { const b = eb.a[i]; if (!b.dead) { b.dead = true; if (i % 9 === 0) addFx(FX.hit, b.x, b.y, b.z, 1.2, 0, 0, 10); } } }
  function updBoss(dt) {
    if (!B.active) return;
    B.t += dt; B.flash = max(0, B.flash - dt);
    if (B.state === 'enter') {
      B.z += (B.baseZ - B.z) * min(1, dt * 1.4);
      if (B.baseZ - B.z < 3) { B.state = 'fight'; B.t = 0; }
    } else if (B.state === 'fight') {
      B.x = sin(B.t * (.44 + B.phase * .08)) * 15 * SX; B.y = 3 + sin(B.t * .9) * 5; B.z = B.baseZ + sin(B.t * .6) * 10;
      B.subT -= dt;
      let guard = 0;
      while (B.subT <= 0 && guard++ < 4 && Pl.alive) {
        if (B.sub <= 0) { const list = BOSS_PLAN[B.type][B.phase]; B.atk = (B.atk + 1) % list.length; B.cur = BOSS_ATK[list[B.atk]]; B.sub = B.cur.n; B.subI = 0; }
        B.cur.f(B.subI); B.subI++; B.sub--;
        B.subT += B.sub > 0 ? B.cur.gap : B.cur.rest * max(.6, 1 - (R.sector - 1) * .05) * (B.phase === 2 ? .8 : 1);
      }
    } else if (B.state === 'dying') {
      B.dieT += dt; B.boomT -= dt; B.z -= 5 * dt; B.y -= 3 * dt;
      if (B.boomT <= 0) { B.boomT = LOW ? .3 : .17; explosion(B.x + rnd(-26, 26), B.y + rnd(-18, 18), B.z + rnd(4, 24), floor(rnd(2, 4)), 6); addShake(.14); Snd.play('big'); }
      if (B.dieT > 2.1) finishBoss();
    }
    const s = B.s;
    for (let i = 0; i < B.nparts; i++) {
      const p = B.parts[i]; p.flash = max(0, p.flash - dt);
      if (B.type === 0) { const d = i ? 1 : -1, sw = sin(B.t * 1.6 + i) * .14; p.x = B.x + d * (29 + sw * 5) * s; p.y = B.y + (-1 + cos(B.t * 1.6 + i) * 1.2) * s; p.z = B.z + 15 * s; }
      else if (B.type === 1) { const a = B.t * (.7 + B.phase * .25) + i * TAU / 3; p.ang = a; p.x = B.x + cos(a) * 25 * s; p.y = B.y + sin(a) * 25 * s; p.z = B.z + 2; }
      else { const d = i ? 1 : -1; p.x = B.x + d * 23 * s; p.y = B.y + (-5 + sin(B.t * 2.2 + i * 2) * .5) * s; p.z = B.z + 9 * s; }
    }
  }
  function finishBoss() {
    explosion(B.x, B.y, B.z + 10, 5, 5); explosion(B.x - 18, B.y + 3, B.z + 14, 4, 5); explosion(B.x + 18, B.y - 3, B.z + 14, 4, 5); addShake(1); Snd.play('huge');
    addScore(2500 * R.sector); chainUp(); dropScrap(18, B.x, B.y, B.z + 10);
    dropPickup('h', B.x - 9, B.y, B.z + 12); dropPickup(R.wpn < 6 ? 'w' : 's', B.x, B.y, B.z + 12); dropPickup(R.rkt < 3 ? 'r' : 'b', B.x + 9, B.y, B.z + 12);
    B.active = false; B.dead = true; $('hBoss').style.display = 'none';
    R.sector++; R.wave = 1;
    if (R.sector > Save.bestSector) Save.bestSector = R.sector;
    S.waveState = 'break'; S.waveT = 4.2;
    showMsg('cleared', null, 3, false); Snd.play('clear');
    applySector(R.sector - 1, false);
  }

  // ---------- flow ----------
  let msgT = 0, msgLife = 0;
  function showMsg(key, sub, life, warn) {
    const el = $('hMsg');
    el.className = warn ? 'warn' : '';
    el.textContent = t(key);
    const small = document.createElement('small');
    small.textContent = sub === 'wave' ? t('wave') + ' ' + R.wave + ' / 5' : sub ? t(sub) : t('sector') + ' ' + R.sector;
    el.appendChild(small);
    el.style.opacity = 1; msgT = 0; msgLife = life;
  }
  function startWave() {
    if (R.wave >= 6) { S.waveState = 'boss'; saveRun(); startBoss(); return; }
    S.waveState = 'run'; buildWave(); showMsg('sector', 'wave', 1.7, false);
    $('hMsg').firstChild.textContent = t('sector') + ' ' + R.sector + ' ';
    saveRun();
  }
  function saveRun() {
    Save.run = { score: R.score, sector: R.sector, wave: R.wave, hull: R.hull, maxHull: R.maxHull, shield: R.shield, wpn: R.wpn, rkt: R.rkt, bombs: R.bombs, gain: S.gain };
    persist();
  }
  function clearField() {
    pb.clear(); rk.clear(); eb.clear(); en.clear(); sq.clear(); pu.clear(); fx.clear(); bm.clear(); tr.clear();
    B.active = false; B.dead = true; S.novaT = -1; $('hBoss').style.display = 'none';
  }
  function startRun(resume) {
    clearField();
    const u = Save.up;
    R.maxHull = 3 + u.hull; R.hull = R.maxHull; R.shield = 0; R.wpn = 1 + u.cannon; R.rkt = u.rocket; R.bombs = 2 + u.bomb; R.score = 0; R.sector = 1; R.wave = 1; S.gain = 0;
    R.chain = 0; R.combo = 1; R.comboT = 0; R.overT = 0; R.pity = 6;
    if (resume && Save.run) { const r = Save.run; R.score = r.score; R.sector = r.sector; R.wave = r.wave; R.maxHull = r.maxHull; R.hull = r.hull; R.shield = r.shield; R.wpn = r.wpn; R.rkt = r.rkt; R.bombs = r.bombs; S.gain = r.gain; }
    else Save.run = null;
    Object.assign(Pl, { x: 0, y: 0, vx: 0, vy: 0, rx: 0, ry: 0, bank: 0, pitch: 0, inv: 1.4, fireT: 0, rktT: .6, recoil: 0, muzzle: 0, alive: true, novaCd: 0, tg: null, heat: 0, gunSide: 1, muzzleSide: 0, kick: 0 });
    S.shake = 0; S.slow = 0; S.deadT = 0; S.waveState = 'break'; S.waveT = .9;
    ptr.touchId = null; ptr.fire = false; ptr.dx = 0; ptr.dy = 0; ptr.mouse = false;
    applySector(R.sector - 1, true);
    hudReset(); setMode('play');
  }
  const SCR = { menu: 'scrMenu', hangar: 'scrHangar', help: 'scrHelp', paused: 'scrPause', over: 'scrOver' };
  let backTo = 'menu';
  function setMode(m) {
    S.mode = m;
    for (const k in SCR) $(SCR[k]).classList.toggle('on', k === m);
    $('hud').classList.toggle('on', m === 'play' || m === 'paused');
    $('btnNova').style.display = m === 'play' ? 'flex' : 'none';
    $('btnPause').style.display = m === 'play' ? 'flex' : 'none';
    if (m === 'menu') refreshMenu();
    if (m === 'hangar') renderHangar();
    if (m === 'help') $('helpBody').innerHTML = TXT[lang].help.map(p => '<p>' + p + '</p>').join('');
  }
  function refreshMenu() {
    $('menuBest').textContent = Save.best.toLocaleString(lang);
    const has = !!Save.run;
    $('btnCont').style.display = has ? '' : 'none';
    if (has) $('btnCont').textContent = t('cont') + '  ·  ' + Save.run.sector + '-' + Save.run.wave;
    $('btnNew').classList.toggle('pri', !has);
  }
  function renderHangar() {
    $('hangarScrap').textContent = Save.scrap.toLocaleString(lang);
    $('upList').innerHTML = UPS.map(u => {
      const lv = Save.up[u.id], full = lv >= u.max, cost = full ? 0 : u.cost[lv];
      let pips = ''; for (let i = 0; i < u.max; i++) pips += '<i class="' + (i < lv ? 'f' : '') + '"></i>';
      return '<div class="up"><div><strong>' + t('u_' + u.id) + '</strong><small>' + t('ud_' + u.id) + '</small><div class="pips">' + pips + '</div></div>' +
        '<button class="buy" data-buy="' + u.id + '"' + (full || Save.scrap < cost ? ' disabled' : '') + '>' + (full ? t('max') : cost) + '</button></div>';
    }).join('');
  }
  function applyLang() {
    document.documentElement.lang = lang;
    document.querySelectorAll('[data-t]').forEach(el => { el.textContent = t(el.dataset.t); });
    document.querySelectorAll('[data-role=lang]').forEach(el => { el.textContent = lang === 'tr' ? 'EN' : 'TR'; el.setAttribute('aria-label', lang === 'tr' ? 'Switch to English' : 'Türkçeye geç'); });
    syncSound();
    $('btnPause').setAttribute('aria-label', t('paused'));
    if (S.mode === 'menu') refreshMenu();
    if (S.mode === 'hangar') renderHangar();
    if (S.mode === 'help') setMode('help');
    if (B.active) $('hBossName').textContent = t('boss' + B.type);
    hudWave = '';
  }
  function syncSound() { document.querySelectorAll('[data-role=sound]').forEach(el => { el.textContent = Save.mute ? t('soundOff') : t('soundOn'); }); }
  function toggleSound() { Save.mute = !Save.mute; persist(); syncSound(); if (!Save.mute) Snd.play('ui'); }
  function pauseGame() { if (S.mode === 'play' && Pl.alive) { persist(); setMode('paused'); clearKeys(); } }
  function gameOver() {
    const rec = R.score > Save.best;
    if (rec) Save.best = R.score;
    if (R.sector > Save.bestSector) Save.bestSector = R.sector;
    Save.run = null; persist();
    $('overScore').textContent = R.score.toLocaleString(lang);
    $('overRec').textContent = rec && R.score > 0 ? t('newBest') : '';
    $('overBest').textContent = Save.best.toLocaleString(lang);
    $('overSector').textContent = R.sector;
    $('overScrap').textContent = S.gain.toLocaleString(lang);
    backTo = 'over'; setMode('over');
  }

  // ---------- input ----------
  const keys = Object.create(null);
  const ptr = { mouse: false, nx: 0, ny: 0, fire: false, touchId: null, lx: 0, ly: 0, dx: 0, dy: 0 };
  const clearKeys = () => { for (const q in keys) keys[q] = false; ptr.fire = false; ptr.touchId = null; ptr.dx = ptr.dy = 0; };
  const GAME_KEYS = new Set(['arrowleft', 'arrowright', 'arrowup', 'arrowdown', ' ']);
  addEventListener('keydown', e => {
    const q = e.key.toLowerCase();
    if (S.mode === 'play') {
      if (GAME_KEYS.has(q)) e.preventDefault();
      if (!e.repeat) { if (q === 'x' || q === 'shift') useNova(); if (q === 'p' || q === 'escape') pauseGame(); }
      keys[q] = true;
      if (q.startsWith('arrow') || 'wasd'.includes(q)) ptr.mouse = false;
    } else {
      if (e.repeat && (q === ' ' || q === 'enter')) { e.preventDefault(); return; }
      if (S.mode === 'paused' && !e.repeat && (q === 'p' || q === 'escape')) { setMode('play'); return; }
      if ((S.mode === 'hangar' || S.mode === 'help') && !e.repeat && q === 'escape') { setMode(backTo); return; }
    }
    if (q === 'm' && !e.repeat) toggleSound();
    Snd.unlock();
  });
  addEventListener('keyup', e => { keys[e.key.toLowerCase()] = false; });
  addEventListener('blur', () => clearKeys());
  document.addEventListener('visibilitychange', () => { if (document.hidden) { if (!DEBUG) pauseGame(); persist(); } });
  addEventListener('pagehide', persist);
  const cv = $('c');
  cv.addEventListener('contextmenu', e => e.preventDefault());
  const toNdc = e => { ptr.nx = clamp(e.clientX / innerWidth * 2 - 1, -1, 1); ptr.ny = clamp(1 - e.clientY / innerHeight * 2, -1, 1); };
  cv.addEventListener('pointerdown', e => {
    e.preventDefault(); Snd.unlock();
    if (S.mode !== 'play') return;
    if (e.pointerType === 'mouse') { ptr.mouse = true; toNdc(e); if (e.button === 2) useNova(); else ptr.fire = true; }
    else if (ptr.touchId === null) { ptr.touchId = e.pointerId; ptr.lx = e.clientX; ptr.ly = e.clientY; ptr.mouse = false; try { cv.setPointerCapture(e.pointerId); } catch (err) { /* optional */ } }
  });
  cv.addEventListener('pointermove', e => {
    if (S.mode !== 'play') return;
    if (e.pointerType === 'mouse') { ptr.mouse = true; toNdc(e); }
    else if (e.pointerId === ptr.touchId) { ptr.dx += e.clientX - ptr.lx; ptr.dy += e.clientY - ptr.ly; ptr.lx = e.clientX; ptr.ly = e.clientY; }
  });
  const pointerEnd = e => { if (e.pointerType === 'mouse') { if (e.button !== 2) ptr.fire = false; } else if (e.pointerId === ptr.touchId) ptr.touchId = null; };
  cv.addEventListener('pointerup', pointerEnd); cv.addEventListener('pointercancel', pointerEnd);
  $('btnNova').addEventListener('pointerdown', e => { e.preventDefault(); e.stopPropagation(); Snd.unlock(); useNova(); });
  $('stage').addEventListener('click', e => {
    const buy = e.target.closest('[data-buy]');
    if (buy) {
      const u = UPS.find(x => x.id === buy.dataset.buy), lv = Save.up[u.id];
      if (lv < u.max && Save.scrap >= u.cost[lv]) { Save.scrap -= u.cost[lv]; Save.up[u.id] = lv + 1; persist(); Snd.play('power'); renderHangar(); }
      return;
    }
    const b = e.target.closest('[data-act]'); if (!b) return;
    Snd.unlock();
    const act = b.dataset.act;
    if (act !== 'pause') Snd.play('ui');
    if (act === 'pause') pauseGame();
    else if (act === 'continue') startRun(true);
    else if (act === 'new') startRun(false);
    else if (act === 'hangar') { backTo = S.mode === 'over' ? 'over' : 'menu'; setMode('hangar'); }
    else if (act === 'help') { backTo = 'menu'; setMode('help'); }
    else if (act === 'back') setMode(backTo);
    else if (act === 'resume') setMode('play');
    else if (act === 'restart') startRun(false);
    else if (act === 'quit') { persist(); backTo = 'menu'; clearField(); setMode('menu'); }
    else if (act === 'menu') { backTo = 'menu'; clearField(); setMode('menu'); }
    else if (act === 'sound') toggleSound();
    else if (act === 'lang') { lang = lang === 'tr' ? 'en' : 'tr'; Save.lang = lang; persist(); applyLang(); }
  });

  // ---------- player and aiming ----------
  // The crosshair is a true screen point. Its camera ray gives the convergence point every gun fires at.
  let tanV = .6, tanH = 1, ckShift = 0, ckTall = 0, ckScissor = 1;
  const SHOT_SPEED = 1050;
  let CONVERGE = 300, ENGAGE = 330, ES = 1;
  const aim = { x: 0, y: 0, z: -CONVERGE, dx: 0, dy: 0, dz: -1, lock: null, lx: 0, ly: 0, lz: 0, hasLead: false };
  const MZ = [-2.1, 2.1];
  const P = { x: 0, y: 0, w: 1 };
  // Projects a world point into NDC using the current camera, without allocating.
  function project(x, y, z) {
    const v = camera.matrixWorldInverse.elements, p = camera.projectionMatrix.elements;
    const cx = v[0] * x + v[4] * y + v[8] * z + v[12], cy = v[1] * x + v[5] * y + v[9] * z + v[13], cz = v[2] * x + v[6] * y + v[10] * z + v[14];
    const w = -cz; P.w = w;
    if (w > .001) { P.x = p[0] * cx / w; P.y = p[5] * cy / w; } else { const m = hypot(cx, cy) || 1; P.x = cx / m * 3; P.y = cy / m * 3; }
  }
  function worldOffset(ox, oy, oz, out) {
    const m = camera.matrixWorld.elements;
    out.x = m[12] + m[0] * ox + m[4] * oy + m[8] * oz; out.y = m[13] + m[1] * ox + m[5] * oy + m[9] * oz; out.z = m[14] + m[2] * ox + m[6] * oy + m[10] * oz;
  }
  const W1 = { x: 0, y: 0, z: 0 };
  function updateAim() {
    const m = camera.matrixWorld.elements, rx = Pl.rx * tanH, ry = Pl.ry * tanV;
    let dx = m[0] * rx + m[4] * ry - m[8], dy = m[1] * rx + m[5] * ry - m[9], dz = m[2] * rx + m[6] * ry - m[10];
    const l = sqrt(dx * dx + dy * dy + dz * dz); dx /= l; dy /= l; dz /= l;
    aim.dx = dx; aim.dy = dy; aim.dz = dz;
    const ex = m[12], ey = m[13], ez = m[14];
    // lock: the target nearest the crosshair on screen, inside a small circle
    const asp = tanH / tanV, reach = ptr.mouse ? .13 : .2;
    let best = null, bd = reach * reach;
    const test = (o, r, rockPenalty) => {
      if (o.z > ez - 10 || o.z < ez - ENGAGE) return;
      project(o.x, o.y, o.z); if (P.w < 8 || abs(P.x) > 1.05 || abs(P.y) > 1.05) return;
      const sx = (P.x - Pl.rx) * asp, sy = P.y - Pl.ry, rad = r / P.w / tanV, d = max(0, hypot(sx, sy) - rad * .7), q = d * d * rockPenalty;
      if (q < bd) { bd = q; best = o; }
    };
    for (let i = 0; i < en.n; i++) { const e = en.a[i]; if (!e.dead) test(e, e.def.r * e.def.s * ES, e.def.rock !== undefined ? 1.5 : 1); }
    if (B.active && B.state === 'fight') { for (let j = 0; j < B.nparts; j++) if (B.parts[j].alive) test(B.parts[j], B.parts[j].r * B.s, .8); test(B, B.r * B.s, 1.1); }
    aim.lock = best; aim.hasLead = false;
    if (best) {
      // lead: solve where the target will be when a shot arrives
      const ux = best.ux || 0, uy = best.uy || 0, uz = best.uz || 0;
      let tx = best.x, ty = best.y, tz = best.z;
      for (let it = 0; it < 3; it++) { const tt = sqrt((tx - ex) ** 2 + (ty - ey) ** 2 + (tz - ez) ** 2) / SHOT_SPEED; tx = best.x + ux * tt; ty = best.y + uy * tt; tz = best.z + uz * tt; }
      aim.x = tx; aim.y = ty; aim.z = tz; aim.lx = tx; aim.ly = ty; aim.lz = tz; aim.hasLead = true;
    } else { aim.x = ex + dx * CONVERGE; aim.y = ey + dy * CONVERGE; aim.z = ez + dz * CONVERGE; }
    Pl.tg = best;
  }
  function pShot(ox, oy, sx, dmg, heavy) {
    const b = pb.get(); if (!b) return;
    worldOffset(ox, oy - 1.25, -3.2, W1);
    const m = camera.matrixWorld.elements, dist = hypot(aim.x - W1.x, aim.y - W1.y, aim.z - W1.z);
    let dx = aim.x + m[0] * sx * dist - W1.x, dy = aim.y + m[1] * sx * dist - W1.y, dz = aim.z + m[2] * sx * dist - W1.z;
    const l = sqrt(dx * dx + dy * dy + dz * dz);
    if (DEBUG) G.shots++;
    b.x = W1.x; b.y = W1.y; b.z = W1.z; b.vx = dx / l * SHOT_SPEED; b.vy = dy / l * SHOT_SPEED; b.vz = dz / l * SHOT_SPEED; b.dmg = dmg; b.heavy = heavy; b.t = 0;
  }
  function firePlayer() {
    // guns alternate left and right at low levels, salvo from level 2
    const a = Pl.gunSide = -Pl.gunSide;
    switch (R.wpn) {
      case 1: pShot(MZ[a > 0 ? 1 : 0], 0, 0, 1, false); break;
      case 2: pShot(-2.1, 0, 0, 1, false); pShot(2.1, 0, 0, 1, false); break;
      case 3: pShot(-2.1, 0, 0, 1, true); pShot(2.1, 0, 0, 1, false); pShot(0, -.5, 0, 1, false); break;
      case 4: pShot(-2.1, 0, 0, 1, true); pShot(2.1, 0, 0, 1, true); pShot(-3.4, -.3, -.009, 1, false); pShot(3.4, -.3, .009, 1, false); break;
      case 5: pShot(0, -.5, 0, 2, true); pShot(-2.1, 0, -.004, 1, false); pShot(2.1, 0, .004, 1, false); pShot(-3.6, -.3, -.016, 1, false); pShot(3.6, -.3, .016, 1, false); break;
      default: pShot(-1.2, 0, 0, 2, true); pShot(1.2, 0, 0, 2, true); pShot(-2.6, -.15, -.006, 1, true); pShot(2.6, -.15, .006, 1, true); pShot(-4, -.3, -.018, 1, false); pShot(4, -.3, .018, 1, false); break;
    }
    Pl.recoil = min(1, Pl.recoil + .42); Pl.muzzle = .05; Pl.muzzleSide = R.wpn === 1 ? a : 0; Snd.play('shot');
  }
  function launchRocket(side) {
    const r = rk.get(); if (!r) return;
    worldOffset(side * 4, -2.2, -2.5, W1);
    r.x = W1.x; r.y = W1.y; r.z = W1.z; r.vx = side * 42 + aim.dx * 90; r.vy = -12 + aim.dy * 90; r.vz = aim.dz * 150; r.t = 0; r.rt = 0; r.tg = Pl.tg; r.trail = 0;
    Snd.play('rocket');
  }
  function useNova() {
    if (S.mode !== 'play' || !Pl.alive || R.bombs <= 0 || Pl.novaCd > 0 || S.novaT >= 0) return;
    R.bombs--; Pl.novaCd = 1; S.novaT = 0; worldOffset(0, -2, -4, W1); S.nx = W1.x; S.ny = W1.y; S.nz = W1.z;
    S.nvx = aim.dx * 340; S.nvy = aim.dy * 340; S.nvz = aim.dz * 340;
    Snd.play('rocket');
  }
  function detonateNova() {
    addShake(.9); Pl.kick = 1; Snd.play('nova'); clearEnemyShots();
    for (let i = 0; i < bm.n; i++) if (bm.a[i].part < 0 || !B.active) bm.a[i].dead = true;
    for (let i = 0; i < en.n; i++) { const e = en.a[i]; if (!e.dead && e.z > -360) { e.shield = 0; hitEnemy(e, 24 + R.sector * 6); } }
    if (B.active && B.state === 'fight') {
      for (let i = 0; i < B.nparts; i++) if (B.parts[i].alive) bossDamage(34 + R.sector * 6, B.parts[i]);
      bossDamage(48 + R.sector * 10, null);
    }
    explosion(S.nx, S.ny, S.nz, 4, 0);
    addFx(FX.shock, S.nx, S.ny, S.nz, 22, 0, 0, 0, true);
  }
  let hurtT = 0;
  function hurtPlayer() {
    if (Pl.inv > 0 || !Pl.alive) return;
    R.chain = 0; R.combo = 1; R.comboT = 0; hurtT = .34; Pl.kick = 1;
    if (R.shield > 0) { R.shield--; Pl.inv = .85; addShake(.3); worldOffset(0, 0, -7, W1); impact(2, W1.x, W1.y, W1.z, 3.2, 0); Snd.play('shieldHit'); return; }
    R.hull--; Pl.inv = 1.7; addShake(.65); worldOffset(rnd(-2, 2), rnd(-1, 1), -8, W1); addFx(FX.sparks, W1.x, W1.y, W1.z, .7, 0, 0, 0); Snd.play('hurt');
    if (R.hull <= 0 && !(DEBUG && G.god)) {
      Pl.alive = false; explosion(Pl.x, Pl.y, -9, 4, 0); addShake(1); S.slow = 1.1; S.deadT = 1.9; Snd.play('huge');
    } else if (R.hull <= 0) R.hull = R.maxHull;
  }
  function nearestTarget(x, y, z) {
    let best = null, bd = 1e12;
    for (let i = 0; i < en.n; i++) {
      const e = en.a[i]; if (e.dead || e.z > -8 || e.z < -ENGAGE - 30) continue;
      const dx = e.x - x, dy = e.y - y, dz = e.z - z, q = (dx * dx + dy * dy + dz * dz) * (e.def.rock !== undefined ? 2.4 : 1);
      if (q < bd) { bd = q; best = e; }
    }
    if (B.active && B.state === 'fight') {
      for (let j = -1; j < B.nparts; j++) {
        const o = j < 0 ? B : B.parts[j]; if (j >= 0 && !o.alive) continue;
        const dx = o.x - x, dy = o.y - y, dz = o.z - z, q = dx * dx + dy * dy + dz * dz;
        if (q < bd) { bd = q; best = o; }
      }
    }
    return best;
  }
  function updPlayer(dt) {
    if (!Pl.alive) return;
    let ax = (keys.arrowright || keys.d ? 1 : 0) - (keys.arrowleft || keys.a ? 1 : 0), ay = (keys.arrowup || keys.w ? 1 : 0) - (keys.arrowdown || keys.s ? 1 : 0);
    if (ax && ay) { ax *= .7071; ay *= .7071; }
    const ox = Pl.x, oy = Pl.y;
    // Every input drives the crosshair directly; the ship slides to follow it.
    if (DEBUG && G.bot) { botInput(dt); Pl.rx += (G.botAim.x - Pl.rx) * min(1, dt * 14); Pl.ry += (G.botAim.y - Pl.ry) * min(1, dt * 14); }
    else {
      if (ptr.dx || ptr.dy) {
        const kx = 2.5 / max(innerWidth, 1), ky = 2.5 / max(innerHeight * (innerHeight > innerWidth ? .62 : 1), 1);
        Pl.rx = clamp(Pl.rx + ptr.dx * kx, -.96, .96); Pl.ry = clamp(Pl.ry - ptr.dy * ky, -.9, .9); ptr.dx = ptr.dy = 0;
      } else if (ptr.mouse && !ax && !ay) { Pl.rx += (ptr.nx - Pl.rx) * min(1, dt * 40); Pl.ry += (ptr.ny - Pl.ry) * min(1, dt * 40); }
      if (ax || ay) { Pl.rx = clamp(Pl.rx + ax * dt * 1.5, -.96, .96); Pl.ry = clamp(Pl.ry + ay * dt * 1.5, -.9, .9); }
    }
    const tx = Pl.rx * XR, ty = Pl.ry * YR, r = min(1, dt * 11);
    Pl.vx += (clamp((tx - Pl.x) * 7, -78, 78) - Pl.vx) * r; Pl.vy += (clamp((ty - Pl.y) * 7, -60, 60) - Pl.vy) * r;
    Pl.x = clamp(Pl.x + Pl.vx * dt, -XR, XR); Pl.y = clamp(Pl.y + Pl.vy * dt, -YR, YR);
    const bx = clamp((Pl.x - ox) / max(dt, .001) / 70, -1, 1), by = clamp((Pl.y - oy) / max(dt, .001) / 56, -1, 1);
    Pl.bank += (bx - Pl.bank) * min(1, dt * 7); Pl.pitch += (by - Pl.pitch) * min(1, dt * 7);
    Pl.inv = max(0, Pl.inv - dt); Pl.recoil = max(0, Pl.recoil - dt * 7); Pl.muzzle = max(0, Pl.muzzle - dt); Pl.novaCd = max(0, Pl.novaCd - dt); Pl.kick = max(0, Pl.kick - dt * 5);
    S.hitT = max(0, S.hitT - dt); S.killT = max(0, S.killT - dt);
    R.overT = max(0, R.overT - dt);
    if (R.comboT > 0) { R.comboT -= dt; if (R.comboT <= 0) { R.chain = 0; R.combo = 1; } }
    updateAim();
    const firing = keys[' '] || keys.j || ptr.fire || ptr.touchId !== null || (DEBUG && G.bot);
    Pl.firing = !!firing;
    Pl.fireT -= dt;
    if (firing && Pl.fireT <= 0) { firePlayer(); Pl.fireT = (R.wpn >= 6 ? .105 : .125) * (R.overT > 0 ? .58 : 1); }
    Pl.heat += ((firing ? .35 + R.wpn * .1 : 0) - Pl.heat) * min(1, dt * 3);
    if (R.rkt > 0) {
      Pl.rktT -= dt;
      if (firing && Pl.rktT <= 0) { Pl.rktT = [0, 1.15, .86, .62][R.rkt] * (R.overT > 0 ? .7 : 1); launchRocket(Pl.rktSide); if (R.rkt >= 2) launchRocket(-Pl.rktSide); Pl.rktSide *= -1; }
    }
  }

  // ---------- collision ----------
  function hitEnemy(e, dmg) {
    if (e.dead) return;
    e.hp -= dmg; e.flash = .04;
    if (e.hp <= 0) killEnemy(e); else if (e.def.rock === undefined || e.def.rock > 0) Snd.play('hit');
  }
  function killEnemy(e) {
    e.dead = true;
    const d = e.def;
    addScore(d.score); chainUp();
    explosion(e.x, e.y, e.z, d.boom); addShake((.05 + d.boom * .045) * clamp(1 - (-e.z) / 320, .15, 1)); Snd.play(d.boom >= 3 ? 'big' : 'small');
    if (d.scrap) dropScrap(d.scrap, e.x, e.y, e.z);
    if (d.scrap >= 1) rollDrop(e.x, e.y, e.z, d.scrap);
    if (e.type === 'splitter') {
      for (const dir of [-1, 1]) { const m = spawnEnemy('dart', e.x + dir * 3, e.y, e.z, 0, dir * 12, rnd(-3, 3)); if (m) m.vz = 150; }
    } else if (e.type === 'rockL' || e.type === 'rockM') {
      const next = e.type === 'rockL' ? 'rockM' : 'rockS';
      for (const dir of [-1, 1]) { const m = spawnEnemy(next, e.x + dir * 3, e.y + dir * 1.5, e.z, 0, dir * rnd(5, 11), rnd(-5, 5)); if (m) { m.vz = rnd(100, 135); m.hp = m.maxHp = max(1, ceil(m.maxHp * .7)); } }
    }
  }
  // closest approach of a moving point (segment) to a sphere
  function segHit(x, y, z, dx, dy, dz, cx, cy, cz, r) {
    const fx0 = x - cx, fy0 = y - cy, fz0 = z - cz, a = dx * dx + dy * dy + dz * dz;
    let u = a > 0 ? -(fx0 * dx + fy0 * dy + fz0 * dz) / a : 0; u = u < 0 ? 0 : u > 1 ? 1 : u;
    const qx = fx0 + dx * u, qy = fy0 + dy * u, qz = fz0 + dz * u;
    return qx * qx + qy * qy + qz * qz < r * r;
  }
  function collide(dt) {
    for (let i = 0; i < pb.n; i++) {
      const b = pb.a[i]; if (b.dead) continue;
      const mx = b.vx * dt, my = b.vy * dt, mz = b.vz * dt, ox = b.x - mx, oy = b.y - my, oz = b.z - mz;
      let used = false;
      for (let j = 0; j < en.n; j++) {
        const e = en.a[j]; if (e.dead || e.z > 4) continue;
        if (b.z > e.z + 26 + e.def.r || oz < e.z - 26 - e.def.r) continue;
        if (e.z < -ENGAGE - 20 || !segHit(ox, oy, oz, mx, my, mz, e.x, e.y, e.z, e.def.r * ES * (.9 + -e.z * .0012))) continue;
        used = true;
        const hs = 1 + -e.z * .005, ix = e.x + (b.x - e.x) * .45, iy = e.y + (b.y - e.y) * .45, iz = e.z + e.def.r * .7;
        S.hitT = .14;
        if (e.shield > 0) { impact(2, ix, iy, iz + 2, hs * 1.1, e.uz); e.shield -= b.dmg; e.flash = .05; Snd.play('armor'); if (e.shield <= 0) { explosion(e.x, e.y, e.z + 8, 1); Snd.play('small'); } }
        else { impact(e.def.rock !== undefined || e.def.hp >= 9 ? 1 : 0, ix, iy, iz, hs, e.uz); hitEnemy(e, b.dmg); if (e.dead) S.killT = .3; }
        break;
      }
      if (!used && B.active && B.state === 'fight') {
        for (let p = 0; p < B.nparts; p++) {
          const q = B.parts[p]; if (!q.alive) continue;
          if (segHit(ox, oy, oz, mx, my, mz, q.x, q.y, q.z, q.r * B.s)) { used = true; S.hitT = .14; impact(1, b.x, b.y, b.z, 2.2, 0); bossDamage(b.dmg, q); if (!q.alive) S.killT = .3; break; }
        }
        if (!used && segHit(ox, oy, oz, mx, my, mz, B.x, B.y, B.z, B.r * B.s)) { used = true; S.hitT = .14; impact(B.type === 1 ? 2 : 1, b.x, b.y, b.z, 2.2, 0); bossDamage(b.dmg, null); }
      }
      if (used) { b.dead = true; if (DEBUG) G.hits++; }
    }
    if (!Pl.alive) return;
    for (let i = 0; i < eb.n; i++) {
      const b = eb.a[i]; if (b.dead || b.z < -6) continue;
      const mx = b.vx * dt, my = b.vy * dt, mz = b.vz * dt;
      if (segHit(b.x - mx, b.y - my, b.z - mz, mx, my, mz, Pl.x, Pl.y, 0, b.r + PL_R) && Pl.inv <= 0) { b.dead = true; hurtPlayer(); }
    }
    for (let i = 0; i < en.n; i++) {
      const e = en.a[i]; if (e.dead || abs(e.z) > e.def.r + 5) continue;
      const dx = e.x - Pl.x, dy = e.y - Pl.y, r = e.def.r * .82 + PL_R;
      if (dx * dx + dy * dy < r * r && Pl.inv <= 0) { hurtPlayer(); hitEnemy(e, 8); }
    }
    for (let i = 0; i < bm.n; i++) {
      const b = bm.a[i]; if (b.dead || b.t < b.warn || Pl.inv > 0) continue;
      const dx = Pl.x - b.tx, dy = Pl.y - b.ty;
      if (dx * dx + dy * dy < (b.w + PL_R) * (b.w + PL_R)) hurtPlayer();
    }
  }

  // ---------- update ----------
  function updRockets(dt) {
    for (let i = 0; i < rk.n; i++) {
      const r = rk.a[i]; if (r.dead) continue;
      r.t += dt; r.rt -= dt;
      if (r.rt <= 0) { r.rt = .16; r.tg = nearestTarget(r.x, r.y, r.z, false); }
      if (r.tg && r.tg.dead) r.tg = null;
      const sp = min(520, 120 + r.t * 950);
      let wx = 0, wy = 0, wz = -1;
      if (r.tg) { const dx = r.tg.x - r.x, dy = r.tg.y - r.y, dz = r.tg.z - r.z, l = sqrt(dx * dx + dy * dy + dz * dz) || 1; wx = dx / l; wy = dy / l; wz = dz / l; }
      const turn = min(1, dt * (r.t < .14 ? 2 : 8));
      r.vx += (wx * sp - r.vx) * turn; r.vy += (wy * sp - r.vy) * turn; r.vz += (wz * sp - r.vz) * turn;
      r.x += r.vx * dt; r.y += r.vy * dt; r.z += r.vz * dt;
      r.trail -= dt;
      if (r.trail <= 0) { r.trail = fxLoad < 1 ? .05 : .03; const q = tr.get(); if (q) { const vl = sqrt(r.vx * r.vx + r.vy * r.vy + r.vz * r.vz) || 1; q.x = r.x - r.vx / vl * 2.4; q.y = r.y - r.vy / vl * 2.4; q.z = r.z - r.vz / vl * 2.4; q.t = 0; q.life = rnd(.34, .52); q.s = rnd(.42, .7); q.rot = random() * TAU; } }
      if (r.t > 3.2 || r.z < -640) { r.dead = true; continue; }
      let hit = false;
      for (let j = 0; j < en.n && !hit; j++) { const e = en.a[j]; if (e.dead) continue; const dx = e.x - r.x, dy = e.y - r.y, dz = e.z - r.z, q = e.def.r + 3.4; if (dx * dx + dy * dy + dz * dz < q * q) hit = true; }
      if (!hit && B.active && B.state === 'fight') {
        for (let p = 0; p < B.nparts && !hit; p++) { const q = B.parts[p]; if (q.alive) { const dx = r.x - q.x, dy = r.y - q.y, dz = r.z - q.z, rr = q.r * B.s + 3; if (dx * dx + dy * dy + dz * dz < rr * rr) { hit = true; bossDamage(6, q); } } }
        if (!hit) { const dx = r.x - B.x, dy = r.y - B.y, dz = r.z - B.z, rr = B.r * B.s + 3; if (dx * dx + dy * dy + dz * dz < rr * rr) { hit = true; bossDamage(6, null); } }
      }
      if (hit) {
        r.dead = true; explosion(r.x, r.y, r.z, 1); addShake(.04); Snd.play('small');
        for (let j = 0; j < en.n; j++) { const e = en.a[j]; if (e.dead) continue; const dx = e.x - r.x, dy = e.y - r.y, dz = e.z - r.z, q = e.def.r + 13; if (dx * dx + dy * dy + dz * dz < q * q) { if (e.shield > 0) e.shield -= 3; else hitEnemy(e, 5); } }
      }
    }
  }
  const d0 = e => e.def.rock === undefined && e.type !== 'mine' && e.path !== 5;
  function updEnemies(dt) {
    for (let i = 0; i < sq.n; i++) { const s = sq.a[i]; s.t -= dt; if (s.t <= 0) { s.dead = true; spawnEnemy(s.type, s.x, s.y, SPAWN_Z, s.path, s.a, s.b, s.c, s.d, s.e); } }
    sq.sweep();
    for (let i = 0; i < en.n; i++) {
      const e = en.a[i]; if (e.dead) continue;
      e.t += dt; e.flash = max(0, e.flash - dt); e.px = e.x; e.py = e.y; e.pz = e.z;
      switch (e.path) {
        case 0: e.x += (e.vx + e.a) * dt; e.y += (e.vy + e.b) * dt; e.z += e.vz * dt; break;
        case 1: e.z += e.vz * dt; e.x = e.a + sin(e.t * e.b) * e.c; e.y = e.d + cos(e.t * e.b * .7) * e.c * .45; break;
        case 2:
          if (e.t < e.d) { e.z += (e.a - e.z) * min(1, dt * 1.5); e.x = e.b + sin(e.t * .85) * e.c; e.y = e.e + cos(e.t * .7) * e.c * .4; }
          else { e.z += e.vz * 1.7 * dt; e.x += (Pl.x - e.x) * min(1, dt * .35); e.y += (Pl.y - e.y) * min(1, dt * .35); }
          break;
        case 3: {
          const u = e.t * e.b;
          e.x = (-e.a * 64 + e.a * 128 * u) * SX; e.y = e.d + sin(u * PI) * e.c; e.z = SPAWN_Z * .32 + sin(u * PI) * 60 - 34 - (1 - u) * 110 + u * 118;
          if (u > 1.02) e.dead = true;
          break;
        }
        case 6: { const a = e.t * e.b; e.z += e.vz * dt; e.x = e.a + cos(a) * e.c * min(1, e.t * .6); e.y = e.d + sin(a) * e.c * .7 * min(1, e.t * .6); break; }
        case 7: { const u = clamp(e.t * e.c, 0, 1), k = u * u * (3 - 2 * u); e.z += e.vz * 1.2 * dt; e.x = e.a + (e.b - e.a) * k; e.y = e.d + sin(u * PI) * e.e; break; }
        case 5: {
          const sp = min(190, 62 + e.t * 66);
          if (e.t < e.d) { const dx = Pl.x - e.x, dy = Pl.y - e.y, dz = 2 - e.z, l = sqrt(dx * dx + dy * dy + dz * dz) || 1, r = min(1, dt * 2.2); e.vx += (dx / l - e.vx) * r; e.vy += (dy / l - e.vy) * r; e.c += (dz / l - e.c) * r; }
          else if (!e.c) e.c = 1;
          if (e.t < .05) { e.vx = 0; e.vy = 0; e.c = 1; }
          e.x += e.vx * sp * dt; e.y += e.vy * sp * dt; e.z += e.c * sp * dt;
          if (e.t > 5.5) { explosion(e.x, e.y, e.z, 1); e.dead = true; continue; }
          break;
        }
      }
      if (e.def.rock !== undefined || e.type === 'mine') { e.rx += e.sx * dt; e.ry += e.sy * dt; e.rz += e.sz * dt; }
      
      { // velocity for lead, heading and a coordinated bank into each turn
        const idt = 1 / max(dt, .001), nx = (e.x - e.px) * idt, ny = (e.y - e.py) * idt, nz = (e.z - e.pz) * idt, turn = (nx - e.ux) * idt;
        e.ux += (nx - e.ux) * min(1, dt * 14); e.uy += (ny - e.uy) * min(1, dt * 14); e.uz += (nz - e.uz) * min(1, dt * 14);
        if (d0(e)) e.bank += (clamp(-e.ux / 58 - turn * .0035, -1.25, 1.25) - e.bank) * min(1, dt * 6);
      }
      if (e.type === 'mine') {
        const dx = Pl.x - e.x, dy = Pl.y - e.y;
        if (e.st === 0 && ((e.z > -74 && dx * dx + dy * dy < 15 * 15) || e.t > 9.5)) { e.st = 1; e.c = .75; }
        if (e.st === 1) { e.c -= dt; e.flash = e.c % .16 < .08 ? .1 : 0; if (e.c <= 0) { e.dead = true; ringAt(e.x, e.y, e.z, 8, 10, random() * TAU, 84 * bulletMul(), 0); explosion(e.x, e.y, e.z, 1); Snd.play('small'); continue; } }
      }
      if (e.def.fire && Pl.alive && e.t > .7 && e.z > -330 && e.z < -32) {
        e.fireT -= dt;
        if (e.fireT <= 0) { e.fireT = e.def.fire * fireMul() * rnd(.85, 1.2); enemyFire(e); }
      }
      if (e.z > 16 || abs(e.x) > 110 || abs(e.y) > 90) e.dead = true;
    }
    for (let i = 0; i < bm.n; i++) {
      const b = bm.a[i]; if (b.dead) continue;
      b.t += dt;
      if (b.part >= 0 && B.active) { const p = B.parts[b.part]; if (p.alive) { b.ox = p.x; b.oy = p.y; b.oz = p.z + 18; } }
      else if (b.owner) { if (b.owner.dead) { b.dead = true; continue; } b.ox = b.owner.x; b.oy = b.owner.y; b.oz = b.owner.z + 8; }
      if (b.t >= b.warn) { b.tx += b.tvx * dt / b.life; b.ty += b.tvy * dt / b.life; }
      if (b.t > b.warn + b.life) b.dead = true;
    }
  }
  function updBullets(dt) {
    for (let i = 0; i < pb.n; i++) { const b = pb.a[i]; b.t += dt; b.x += b.vx * dt; b.y += b.vy * dt; b.z += b.vz * dt; if (b.z < -ENGAGE - 45) b.dead = true; }
    for (let i = 0; i < eb.n; i++) { const b = eb.a[i]; b.t += dt; b.x += b.vx * dt; b.y += b.vy * dt; b.z += b.vz * dt; if (b.z > 10) b.dead = true; }
  }
  function updPickups(dt) {
    const reach = 11 + Save.up.magnet * 9;
    for (let i = 0; i < pu.n; i++) {
      const p = pu.a[i]; if (p.dead) continue;
      p.t += dt;
      const dx = Pl.x - p.x, dy = Pl.y - p.y, dz = -p.z, q = sqrt(dx * dx + dy * dy) || 1;
      if (Pl.alive && q < reach + (p.scrap ? 0 : 5) && p.z > -130) { const a = 340 * dt; p.vx += dx / q * a; p.vy += dy / q * a; p.vx *= .9; p.vy *= .9; if (p.z > -40) p.vz = max(p.vz, 110); }
      else { p.vx *= max(0, 1 - dt * 1.5); p.vy *= max(0, 1 - dt * 1.5); }
      p.x += p.vx * dt; p.y += p.vy * dt; p.z += p.vz * dt;
      if (Pl.alive && abs(dz) < 7 && q < (p.scrap ? 5.2 : 6.6)) {
        p.dead = true;
        if (p.scrap) { Save.scrap++; S.gain++; R.score += 2; Snd.play('pick'); }
        else applyPickup(p.kind);
      } else if (p.z > 12) p.dead = true;
    }
  }
  function updFx(dt) {
    for (let i = 0; i < tr.n; i++) { const q = tr.a[i]; q.t += dt; q.z += 30 * dt; if (q.t >= q.life) q.dead = true; }
    for (let i = 0; i < fx.n; i++) { const f = fx.a[i]; f.t += dt; if (f.t >= f.life) { f.dead = true; continue; } f.x += f.vx * dt; f.y += f.vy * dt; f.z += f.vz * dt; }
  }
  function updNova(dt) {
    if (S.novaT >= 0) {
      S.novaT += dt; S.nx += S.nvx * dt; S.ny += S.nvy * dt; S.nz += S.nvz * dt;
      if (S.novaT > .5) { S.novaT = -1; detonateNova(); }
    }
  }
  function updWave(dt) {
    if (S.waveState === 'break') { S.waveT -= dt; if (S.waveT <= 0 && Pl.alive) startWave(); }
    else if (S.waveState === 'run' && sq.n === 0 && en.n === 0) { R.wave++; S.waveState = 'break'; S.waveT = 1.5; }
  }
  function step(dt) {
    updPlayer(dt); updWave(dt); updEnemies(dt); updBoss(dt); updBullets(dt); updRockets(dt); updNova(dt);
    collide(dt); updPickups(dt); updFx(dt);
    pb.sweep(); rk.sweep(); eb.sweep(); en.sweep(); pu.sweep(); fx.sweep(); bm.sweep(); tr.sweep();
    S.shake = max(0, S.shake - dt * 2.5);
    if (!Pl.alive) { S.deadT -= dt; if (S.deadT <= 0) gameOver(); }
  }

  // ---------- hud (DOM only touched when a value changes, no per-frame strings) ----------
  let hudScore = -1, hudCombo = -1, hudWaveKey = -1, hudWave = '', hudBoss = -1, hudNova = -1, hudPips = -1, hurtShown = 0, lblKey = -1, lblOn = false, lblT = 0;
  function hudReset() { hudScore = hudCombo = hudBoss = hudNova = hudPips = hudWaveKey = lblKey = -1; hudWave = ''; }
  let xhX = -1, xhY = -1, xhLk = -1, xhVis = null;
  function pipRow(el, n, on, cls) { let h = ''; for (let i = 0; i < n; i++) h += '<i class="pip' + (i < on ? ' ' + cls : '') + '"></i>'; el.innerHTML = h; }
  function drawHud(dt) {
    if (R.score !== hudScore) { hudScore = R.score; $('hScore').textContent = R.score.toLocaleString(lang); }
    if (R.combo !== hudCombo) { hudCombo = R.combo; $('hCombo').textContent = R.combo > 1 ? '×' + R.combo : ''; }
    const wk = R.sector * 100 + R.wave * 2 + (B.active ? 1 : 0);
    if (wk !== hudWaveKey || hudWave === '') { hudWaveKey = wk; hudWave = 'x'; $('hWave').textContent = t('sector') + ' ' + R.sector + (B.active ? '' : '  ·  ' + t('wave') + ' ' + min(R.wave, 5) + '/5'); }
    if (B.active) { const v = round(B.hp / B.maxHp * 200); if (v !== hudBoss) { hudBoss = v; $('hBossIn').style.transform = 'scaleX(' + v / 200 + ')'; } }
    if (R.bombs !== hudNova) { hudNova = R.bombs; $('novaN').textContent = R.bombs; $('btnNova').classList.toggle('empty', R.bombs <= 0); }
    const pk = R.hull + R.maxHull * 10 + R.shield * 100 + R.wpn * 1000 + R.rkt * 10000;
    if (pk !== hudPips) { hudPips = pk; pipRow($('hHull'), R.maxHull, R.hull, 'h'); pipRow($('hShield'), 3, R.shield, 's'); pipRow($('hGun'), 6, R.wpn, 'w'); pipRow($('hRkt'), 3, R.rkt, 'r'); }
    if (msgLife > 0) { msgT += dt; if (msgT > msgLife) { msgLife = 0; $('hMsg').style.opacity = 0; } else if (msgT > msgLife - .35) $('hMsg').style.opacity = (msgLife - msgT) / .35; }
    if (pickT > 0) { pickT -= dt; if (pickT <= 0) $('hPick').style.opacity = 0; else if (pickT < .3) $('hPick').style.opacity = pickT / .3; }
    if (hurtT > 0 || hurtShown) { hurtT = max(0, hurtT - dt); const v = round(hurtT / .34 * 10) / 10; if (v !== hurtShown) { hurtShown = v; const el = $('hurt'); el.style.display = v > 0 ? 'block' : 'none'; el.style.opacity = v * .75; } }
    { // crosshair: outlined vector mark, readable on any background
      const xh = $('xh'), vis = Pl.alive, cx = round((Pl.rx * .5 + .5) * innerWidth), cy = round((.5 - Pl.ry * .5) * innerHeight), lk = aim.lock ? 1 : 0;
      if (vis !== xhVis) { xhVis = vis; xh.style.display = vis ? 'block' : 'none'; }
      if (cx !== xhX || cy !== xhY) { xhX = cx; xhY = cy; xh.style.transform = 'translate3d(' + cx + 'px,' + cy + 'px,0) translate(-50%,-50%)'; }
      if (lk !== xhLk) { xhLk = lk; xh.classList.toggle('lock', !!lk); }
    }
    // target readout: distance and health next to the lock brackets
    const g = aim.lock, el = $('tLabel');
    if (g && Pl.alive) {
      project(g.x, g.y, g.z);
      const rad = (g.def ? g.def.r * g.def.s : g.r * B.s) / max(P.w, 1) / tanV;
      const px = (P.x * .5 + .5) * innerWidth, cxx = (Pl.rx * .5 + .5) * innerWidth, cyy = (.5 - Pl.ry * .5) * innerHeight;
      let py = (.5 - (P.y + rad * 1.14) * .5) * innerHeight;
      if (abs(px - cxx) < 86 && py > cyy - 34 && py < cyy + 52) py = cyy - 34; // keep the readout clear of the crosshair
      el.style.transform = 'translate3d(' + round(clamp(px, 46, innerWidth - 46)) + 'px,' + round(max(py, 60)) + 'px,0) translate(-50%,-100%)';
      if (!lblOn) { lblOn = true; el.style.display = 'block'; }
      lblT -= dt;
      if (lblT <= 0) {
        lblT = .1;
        const hp = g === B ? B.hp / B.maxHp : g.def ? max(0, g.hp) / g.maxHp : max(0, g.hp) / g.max, dist = round(P.w), key = round(hp * 24) * 10000 + dist;
        if (key !== lblKey) { lblKey = key; $('tDist').textContent = dist + ' m'; $('tHp').style.transform = 'scaleX(' + round(hp * 24) / 24 + ')'; }
      }
    } else if (lblOn) { lblOn = false; el.style.display = 'none'; }
  }

  // ---------- render ----------
  const DUST_N = 70;
  const dust = new Float32Array(DUST_N * 3);
  for (let i = 0; i < DUST_N; i++) { dust[i * 3] = rnd(-130, 130); dust[i * 3 + 1] = rnd(-90, 90); dust[i * 3 + 2] = rnd(-420, 0); }
  const PICK_MODEL = { w: 'pick_w', r: 'pick_r', s: 'pick_s', h: 'pick_h', b: 'pick_b', o: 'pick_o', scrap: 'pick_scrap' };
  const EB_MODEL = ['bolt_e0', 'bolt_e1', 'bolt_e2', 'bolt_e3', 'bolt_e4'];
  const ROCK_NAMES = { rockS: ['rockS0', 'rockS1', 'rockS2'], rockM: ['rockM0', 'rockM1', 'rockM2'], rockL: ['rockL0', 'rockL1', 'rockL2'] };

  // 2026-11-24 İdris: "çok fazla göktaşı, gezegen ... olsun, sürekli biz içinden geçelim hepsinin etrafından ... başka hava araçları da olsun".
  // Scenery that never collides and never sits in the firing lane: a belt of tumbling rocks streaming past, moons that grow and slide by, allied wings
  // overtaking us, and big hulls drifting alongside. All of it reuses baked models; phones get fewer of each and the rocks drop first under the budget.
  const DECO_N = LOW ? 28 : 66, deco = new Float32Array(DECO_N * 8);
  function decoSpawn(i, z) { const o = i * 8; let x, y; do { x = rnd(-320, 320); y = rnd(-180, 180); } while (abs(x) < 72 && abs(y) < 50);
    deco[o] = x; deco[o + 1] = y; deco[o + 2] = z; deco[o + 3] = rnd(0, 6.28); deco[o + 4] = rnd(0, 6.28); deco[o + 5] = rnd(-.7, .7); deco[o + 6] = .45 + random() ** 2 * 4.2; deco[o + 7] = floor(random() * 3); }
  for (let i = 0; i < DECO_N; i++) decoSpawn(i, rnd(-1150, 0));
  const wings = [], hull = { on: false, wait: 14, x: 0, y: 0, z: 0, s: 1, k: 0, side: 1 }; let wingWait = 6;
  function drawScenery(dt, moving) {
    const s = SECTORS[S.sector], sp = moving ? 150 : 34, e = U.uEye.value, mv = moving ? 1 : .25;
    for (let i = 0; i < DECO_N; i++) {
      const o = i * 8; let z = deco[o + 2] + sp * dt * (.85 + deco[o + 6] * .04);
      if (z > 60) { decoSpawn(i, rnd(-1200, -1000)); z = deco[o + 2]; }
      deco[o + 2] = z; deco[o + 3] += deco[o + 5] * dt; deco[o + 4] += deco[o + 5] * .7 * dt;
      eulerQ(deco[o + 3], deco[o + 4], deco[o + 3] * .5);
      BT['deco' + deco[o + 7]].push(deco[o] + e.x * .2, deco[o + 1] + e.y * .2, z, Q.x, Q.y, Q.z, Q.w, deco[o + 6], 0, 0, 0);
    }
    for (let j = 0; j < moons.length; j++) {
      const M = moons[j];
      if (!M.on) { M.wait -= dt * mv; if (M.wait > 0) continue; const side = (j + floor(S.clock / 7)) % 2 ? 1 : -1, pk = (s.planet + 1 + j) % 4;
        M.on = true; M.z = -2700; M.x = side * rnd(420, 760); M.y = rnd(-280, 280); M.s = rnd(40, 115); M.v = rnd(55, 85);
        M.u.uMap.value = planetTex[pk]; const a = SECTORS[pk].atm; M.u.uAtm.value.set(a[0], a[1], a[2]); }
      M.z += M.v * dt * mv; M.u.uSpin.value += dt * .03;
      if (M.z > 400) { M.on = false; M.wait = rnd(6, 16); M.m.visible = false; continue; }
      M.m.visible = true; M.m.position.set(M.x * bgK, M.y + bgY * .4, M.z); M.m.scale.setScalar(M.s * bgS); M.m.updateMatrix(); M.m.updateMatrixWorld(true);
    }
    wingWait -= dt * mv;
    if (wingWait <= 0 && wings.length < 2) { wingWait = rnd(8, 15); const side = random() < .5 ? -1 : 1; wings.push({ x: side * rnd(85, 190), y: rnd(-70, 90), z: 70, v: -rnd(120, 175), bank: side * .5, ph: rnd(0, 9) }); }
    const pc = BT.player.def.clips.idle;
    for (let w = wings.length - 1; w >= 0; w--) {
      const W = wings[w]; W.z += W.v * dt; W.bank *= 1 - min(1, dt * .6);
      if (W.z < -1300) { wings.splice(w, 1); continue; }
      for (let q = 0; q < 3; q++) { const ox = q === 0 ? 0 : (q === 1 ? -11 : 11), oz = q === 0 ? 0 : 10, oy = q === 0 ? 0 : -3;
        headingQ(-W.bank * .3, 0, -1, W.bank + sin(S.clock * 1.3 + W.ph + q) * .08);
        BT.player.push(W.x + ox, W.y + oy + sin(S.clock + W.ph + q) * 1.2, W.z + oz, Q.x, Q.y, Q.z, Q.w, 1.35, pc.base, clipFrame(pc, S.clock + q), 0); }
    }
    if (!hull.on) { hull.wait -= dt * mv; if (hull.wait <= 0) { hull.on = true; hull.side = random() < .5 ? -1 : 1; hull.x = hull.side * rnd(250, 360); hull.y = rnd(-110, 110); hull.z = -1700; hull.s = rnd(1.5, 2.3); hull.k = (s.station + 1 + floor(random() * 3)) % 4; } }
    else { hull.z += 48 * dt * mv; if (hull.z > 350) { hull.on = false; hull.wait = rnd(18, 32); }
      else { const fade = clamp((hull.z + 1700) / 300, 0, 1); eulerQ(.12, hull.side * .5 + S.clock * .01, .05); BT['station' + hull.k].push(hull.x * bgK, hull.y, hull.z, Q.x, Q.y, Q.z, Q.w, hull.s * fade, 0, 0, 0, LOW ? 1 : undefined); } }
  }
  function drawBackdrop(dt, moving) {
    const s = SECTORS[S.sector];
    if (SkyU.uMix.value < 1) SkyU.uMix.value = min(1, SkyU.uMix.value + dt / 2.2);
    PlanetU.uSpin.value += dt * .012;
    const st = BT['station' + s.station];
    eulerQ(.25, S.clock * .05, S.clock * .035);
    st.push(s.sPos[0] * bgK, s.sPos[1], s.sPos[2], Q.x, Q.y, Q.z, Q.w, s.sS * (ckTall ? .8 : 1), 0, 0, 0, LOW ? 0 : 1);
    if (s.ring) { const r = BT[s.ring]; eulerQ(.42, .2, -.3); r.push(s.pPos[0] * bgK, s.pPos[1] + bgY, s.pPos[2], Q.x, Q.y, Q.z, Q.w, s.pS * bgS, 0, 0, 0, 0); }
    const b = BT.dust, sp = moving ? 150 : 34, e = U.uEye.value, ls = 1.2 + sp * .03;
    for (let i = 0; i < DUST_N; i++) {
      let z = dust[i * 3 + 2] + sp * dt;
      if (z > 6) { z = -420; dust[i * 3] = e.x + rnd(-130, 130); dust[i * 3 + 1] = e.y + rnd(-90, 90); }
      dust[i * 3 + 2] = z;
      const near = (dust[i * 3] - e.x) ** 2 + (dust[i * 3 + 1] - e.y) ** 2 + z * z < 900;
      b.push(dust[i * 3], dust[i * 3 + 1], z, 0, 0, 0, 1, ls, 0, 0, 0, near && b.cnt[0] < b.lcap[0] ? 0 : b.last);
    }
  }
  function drawWorld() {
    const tm = S.clock;
    for (let i = 0; i < en.n; i++) {
      const e = en.a[i]; if (e.dead) continue;
      const d = e.def, fade = min(1, e.t * 3 + .15), s = d.s * fade * ES * (d.rock !== undefined ? 1.25 : 1.42);
      if (d.rock !== undefined) {
        eulerQ(e.rx, e.ry, e.rz);
        BT[ROCK_NAMES[e.type][e.vr]].push(e.x, e.y, e.z, Q.x, Q.y, Q.z, Q.w, s, 0, 0, e.flash > 0 ? 1 : 0);
      } else if (e.path === 5) {
        aimQ(e.vx, e.vy, e.c || 1);
        pushClip(BT.srocket, 'idle', tm + e.phase, e.x, e.y, e.z, s, e.flash > 0 ? 1 : 0);
      } else if (e.type === 'mine') {
        eulerQ(e.rx, e.ry, e.rz);
        pushClip(BT.mine, 'idle', tm + e.phase, e.x, e.y, e.z, s, e.flash > 0 ? 1 : 0);
      } else {
        // nose follows the flight path and turns toward the player when it can shoot; wings roll into every turn
        const toX = Pl.x - e.x, toY = Pl.y - e.y, toZ = max(-e.z, 24), l = sqrt(toX * toX + toY * toY + toZ * toZ), sp = sqrt(e.ux * e.ux + e.uy * e.uy + e.uz * e.uz) || 1, k = e.path === 2 && e.t < e.d ? .78 : .34;
        headingQ(e.ux / sp * (1 - k) + toX / l * k, e.uy / sp * (1 - k) + toY / l * k, max(.15, e.uz / sp) * (1 - k) + toZ / l * k, e.bank);
        pushClip(BT[d.m], 'idle', tm + e.phase, e.x, e.y, e.z, s, e.flash > 0 ? 1 : 0);
      }
    }
    if (B.active) drawBoss(tm);
    for (let i = 0; i < pb.n; i++) {
      const b = pb.a[i]; if (b.dead) continue;
      aimQ(b.vx, b.vy, b.vz);
      // hot tracer: starts short at the muzzle and reaches full length within a few frames
      const bb = b.heavy ? BT.tr_h : BT.tr_p, dc = -b.z, len = min(b.t * SHOT_SPEED * .92 + 1.6, b.heavy ? 21 : 17, dc * .3 + 1.5), back = len * .46 / SHOT_SPEED, nearW = clamp(dc / 70, .16, 1);
      bb.push(b.x - b.vx * back, b.y - b.vy * back, b.z - b.vz * back, Q.x, Q.y, Q.z, Q.w, 1, 0, 0, 0);
      bb.stretch((b.heavy ? .4 : .28) * (LOW ? 1.5 : 1) * nearW, len);
    }
    for (let i = 0; i < eb.n; i++) {
      const b = eb.a[i]; if (b.dead) continue;
      if (b.kind === 0 || b.kind === 3) aimQ(b.vx, b.vy, b.vz); else eulerQ(b.t * 3, b.t * 4, 0);
      BT[EB_MODEL[b.kind]].push(b.x, b.y, b.z, Q.x, Q.y, Q.z, Q.w, 1.3 * clamp(-b.z / 40, .22, 1), 0, 0, 0);
    }
    for (let i = 0; i < rk.n; i++) { const r = rk.a[i]; if (r.dead) continue; aimQ(r.vx, r.vy, r.vz); pushClip(BT.rocket, 'idle', tm + i * .1, r.x, r.y, r.z, 1, 0); }
    if (S.novaT >= 0) { aimQ(S.nvx, S.nvy, S.nvz); pushClip(BT.nova, 'idle', tm, S.nx, S.ny, S.nz, 1.3, 0); }
    for (let i = 0; i < tr.n; i++) {
      const p = tr.a[i]; if (p.dead) continue;
      const u = p.t / p.life, sz = p.s * (u < .18 ? .4 + u * 3.3 : (1.06 - u) * 1.15);
      eulerQ(p.rot, p.rot * 1.7, 0);
      BT.puff.push(p.x, p.y, p.z, Q.x, Q.y, Q.z, Q.w, max(sz, .02), 0, 0, 0);
    }
    for (let i = 0; i < pu.n; i++) {
      const p = pu.a[i]; if (p.dead) continue;
      eulerQ(.3, p.t, 0);
      pushClip(BT[PICK_MODEL[p.kind]], 'idle', p.t, p.x, p.y, p.z, p.scrap ? 1.5 : 1.9, 0);
    }
    for (let i = 0; i < fx.n; i++) {
      const f = fx.a[i]; if (f.dead || f.t < 0) continue;
      const b = fxBatch[f.m], c = b.def.clips.play;
      b.push(f.x, f.y, f.z, f.qx, f.qy, f.qz, f.qw, f.s, c.base, min(f.t * c.fps, c.frames - .001), 0);
    }
    for (let i = 0; i < bm.n; i++) {
      const b = bm.a[i]; if (b.dead) continue;
      const dx = b.tx - b.ox, dy = b.ty - b.oy, dz = 8 - b.oz, l = sqrt(dx * dx + dy * dy + dz * dz);
      aimQ(dx, dy, dz);
      const on = b.t >= b.warn, w = on ? b.w * (.9 + sin(b.t * 44) * .1) : .1 + b.t / b.warn * .16, bb = on ? BT.beam : BT.beam_warn;
      bb.push((b.ox + b.tx) / 2, (b.oy + b.ty) / 2, (b.oz + 8) / 2, Q.x, Q.y, Q.z, Q.w, 1, 0, 0, 0, 0);
      bb.stretch(w, l);
    }
    // gun effects: aim lines to the convergence point while firing, flash at the muzzle that fired
    if (Pl.alive && Pl.firing) {
      for (let k = 0; k < 2; k++) {
        worldOffset(MZ[k], -1.25, -3.2, W1);
        const dx = aim.x - W1.x, dy = aim.y - W1.y, dz = aim.z - W1.z, l = sqrt(dx * dx + dy * dy + dz * dz);
        aimQ(dx, dy, dz);
        BT.aimline.push(W1.x + dx * .5, W1.y + dy * .5, W1.z + dz * .5, Q.x, Q.y, Q.z, Q.w, 1, 0, 0, 0, LOW ? 1 : 0);
        BT.aimline.stretch(LOW ? .018 : .015, l);
      }
    }
    if (Pl.alive && Pl.muzzle > 0) {
      const ms = .13 + Pl.muzzle * 3.2;
      aimQ(aim.dx, aim.dy, aim.dz);
      const qx = Q.x, qy = Q.y, qz = Q.z, qw = Q.w;
      for (let k = 0; k < 2; k++) {
        if (Pl.muzzleSide && (k === 1) !== (Pl.muzzleSide > 0)) continue;
        worldOffset(MZ[k] * 1.25, -1.55, -5.4, W1);
        BT.bolt_muzzle.push(W1.x, W1.y, W1.z, qx, qy, qz, qw, ms, 0, 0, 0, 0);
      }
    }
  }
  function drawBoss(tm) {
    const s = B.s, phase = B.state === 'dying' ? 'die' : 'p' + B.phase, f = B.flash > 0 ? 1 : 0;
    const time = B.state === 'dying' ? B.dieT : tm;
    if (B.type === 0) {
      eulerQ(sin(tm * .7) * .03, sin(B.t * .4) * .12, sin(B.t * .44) * .05);
      pushClip(BT.boss0_core, phase, time, B.x, B.y, B.z, s, f);
      const armClip = B.state === 'dying' ? 'p2' : phase;
      for (let i = 0; i < 2; i++) {
        const p = B.parts[i]; if (!p.alive) continue;
        const d = i ? 1 : -1, ang = sin(B.t * 1.6 + i) * .14;
        eulerQ(0, d * ang, 0);
        pushClip(i ? BT.boss0_armR : BT.boss0_armL, armClip, tm + i * .3, B.x + d * 13 * s, B.y + 1 * s, B.z + 2 * s, s, p.flash > 0 ? 1 : 0);
      }
    } else if (B.type === 1) {
      eulerQ(sin(tm * .5) * .08, sin(tm * .4) * .1, 0);
      pushClip(BT.boss1_core, phase, time, B.x, B.y, B.z, s, f);
      for (let i = 0; i < B.nparts; i++) {
        const p = B.parts[i]; if (!p.alive) continue;
        aimQ(Pl.x - p.x, Pl.y - p.y, -p.z);
        pushClip(BT.boss1_emitter, 'idle', tm + i, p.x, p.y, p.z, 1.45, p.flash > 0 ? 1 : 0);
      }
    } else {
      eulerQ(sin(tm * .5) * .02, sin(B.t * .4) * .1, 0);
      pushClip(BT.boss2_core, phase, time, B.x, B.y, B.z, s, f);
      const gunClip = B.state === 'dying' ? 'p2' : phase;
      for (let i = 0; i < 2; i++) {
        const p = B.parts[i]; if (!p.alive) continue;
        aimQ((Pl.x - p.x) * .6, (Pl.y - p.y) * .6, -p.z);
        pushClip(i ? BT.boss2_gunR : BT.boss2_gunL, gunClip, tm + i * .2, p.x, p.y, p.z, s, p.flash > 0 ? 1 : 0);
      }
    }
  }
  function pivotPush(b, ox, oy, oz, px, py, pz, k, base, frame, lod) {
    const qx = Q.x, qy = Q.y, qz = Q.z, qw = Q.w, cx = qy * pz - qz * py + qw * px, cy = qz * px - qx * pz + qw * py, cz = qx * py - qy * px + qw * pz;
    const rx = px + 2 * (qy * cz - qz * cy), ry = py + 2 * (qz * cx - qx * cz), rz = pz + 2 * (qx * cy - qy * cx);
    b.push(ox + k * (px - rx), oy + k * (py - ry), oz + k * (pz - rz), qx, qy, qz, qw, k, base, frame, 0, lod);
  }
  // Cockpit: drawn first so it hides what is behind it from the GPU.
  function drawCockpit(tm) {
    const swx = -Pl.bank * .012 + (S.shake ? shX * .004 : 0), swy = -Pl.pitch * .008 - Pl.recoil * .004 - Pl.kick * .012 + (S.shake ? shY * .004 : 0), swz = Pl.recoil * .006;
    BT.ck_shell.push(swx, swy, swz, 0, 0, 0, 1, 1, 0, 0, 0, LOW ? 1 : 0);
    const HK = .6;
    eulerQ(-Pl.pitch * .16 - Pl.recoil * .025, 0, -Pl.bank * .2);
    const sc = Pl.firing ? BT.ck_stick.def.clips.fire : BT.ck_stick.def.clips.idle;
    pivotPush(BT.ck_stick, .275 - ckTall * .07 + swx, -.018 + ckTall * .075 + swy, -.222 + swz, 0, -.5, -.48, HK, sc.base, clipFrame(sc, tm), 0);
    eulerQ(Pl.heat * .1, 0, 0);
    const tc = BT.ck_throttle.def.clips.idle;
    pivotPush(BT.ck_throttle, .075 + ckTall * .14 + swx, -.04 + ckTall * .075 + swy, -.222 + swz, -.62, -.42, -.53, HK, tc.base, clipFrame(tc, tm), 0);
    eulerQ(1.05, 0, 0);
    const g = BT.ck_gauge_hull.def.clips.sweep, g2 = BT.ck_gauge_heat.def.clips.sweep;
    BT.ck_gauge_hull.push(-.44 + swx, -.247 + swy, -.86, Q.x, Q.y, Q.z, Q.w, 1.02, g.base, clamp(R.hull / max(R.maxHull, 1), 0, 1) * (g.frames - .001), 0, 0);
    BT.ck_gauge_heat.push(.44 + swx, -.247 + swy, -.86, Q.x, Q.y, Q.z, Q.w, 1.02, g2.base, clamp(Pl.heat, 0, 1) * (g2.frames - .001), 0, 0);
    const ll = LOW ? 2 : 0;
    for (let i = 0; i < 6; i++) { const bb = i < R.hull ? BT.ck_led_g : BT.ck_led_off; bb.push(-.27 + i * .026 + swx, -.291 + swy, -.85, Q.x, Q.y, Q.z, Q.w, 1, 0, 0, 0, ll); }
    for (let i = 0; i < 3; i++) { const bb = i < R.shield ? BT.ck_led_c : BT.ck_led_off; bb.push(.14 + i * .026 + swx, -.291 + swy, -.85, Q.x, Q.y, Q.z, Q.w, 1, 0, 0, 0, ll); }
    if (R.bombs > 0) BT.ck_led_a.push(.235 + swx, -.291 + swy, -.85, Q.x, Q.y, Q.z, Q.w, 1, 0, 0, 0, ll);
    if (R.hull <= 1 && tm % .7 < .35) BT.ck_led_r.push(-.3 + swx, -.291 + swy, -.85, Q.x, Q.y, Q.z, Q.w, 1, 0, 0, 0, ll);
  }
  // Flat overlay in screen units: x from -aspect to aspect, y from -1 to 1.
  function hudMark(b, ndcX, ndcY, size, rot) {
    const a = rot * .5;
    b.push(ndcX * hudCamera.right, ndcY, 0, 0, 0, sin(a), cos(a), size, 0, 0, 0, 0);
  }
  function drawOverlay(tm) {
    const asp = hudCamera.right, px = 2 / max(innerHeight, 1);
    if (!Pl.alive) return;
    if (aim.lock) {
      const g = aim.lock, r = g.def ? g.def.r * g.def.s * ES : g.r * B.s;
      project(g.x, g.y, g.z);
      const rad = clamp(r * 1.14 / max(P.w, 1) / tanV, 15 * px, .3);
      hudMark(BT.hud_lock, P.x, P.y, rad, 0);
      if (aim.hasLead) {
        project(aim.lx, aim.ly, aim.lz);
        hudMark(BT.hud_lead, P.x, P.y, 10 * px, tm * 2.2);
      }
    }
    if (S.hitT > 0) hudMark(BT.hud_hit, Pl.rx, Pl.ry, (20 + (1 - S.hitT / .14) * 5) * px, 0);
    if (S.killT > 0) hudMark(BT.hud_kill, Pl.rx, Pl.ry, (23 + (1 - S.killT / .3) * 7) * px, 0);
    // arrows to the nearest threats outside the view
    let shown = 0;
    for (let pass = 0; pass < 2 && shown < 5; pass++) {
      for (let i = 0; i < en.n && shown < 5; i++) {
        const e = en.a[i];
        if (e.dead || e.z > -6 || e.z < (pass ? -420 : -190) || (!pass && e.def.rock !== undefined)) continue;
        project(e.x, e.y, e.z);
        if (abs(P.x) < .96 && abs(P.y) < .94) continue;
        if (pass && -e.z < 190 && e.def.rock === undefined) continue;
        const sx = P.x * asp, sy = P.y, ang = atan2(sy, sx), ex = cos(ang), ey = sin(ang);
        const k = min((asp - .09) / max(abs(ex), .001), .9 / max(abs(ey), .001));
        hudMark(BT.hud_arrow, ex * k / asp, ey * k, 13 * px, ang);
        shown++;
      }
    }
  }
  let shX = 0, shY = 0, roll = 0;
  function render(dt) {
    for (let i = 0; i < allBatches.length; i++) allBatches[i].begin();
    trisLeft = TRI_BUDGET;
    const playing = S.mode === 'play' || S.mode === 'paused';
    const e = U.uEye.value;
    if (playing) {
      if (dt > 0) { shX = S.shake ? (random() - .5) * S.shake * S.shake * 2.4 : 0; shY = S.shake ? (random() - .5) * S.shake * S.shake * 2.4 : 0; }
      roll += (-Pl.bank * .24 - roll) * min(1, dt * 8);
      camera.position.set(Pl.x + shX, Pl.y + shY, Pl.recoil * .12);
      camera.rotation.set(Pl.pitch * .06 + Pl.recoil * .0045 + Pl.kick * .02, -Pl.bank * .05, roll);
      camera.updateMatrixWorld();
      e.copy(camera.position);
      drawCockpit(S.clock);
      drawBackdrop(dt, S.mode === 'play');
      drawWorld();
      drawScenery(dt, S.mode === 'play');
      drawOverlay(S.clock);
    } else {
      const a = S.clock * .25;
      camera.position.set(sin(a) * 15, 3.2 + sin(a * .7) * 1.2, cos(a) * 15);
      camera.rotation.set(0, 0, 0);
      camera.lookAt(0, -.2, 0);
      if (innerWidth > innerHeight) { const off = S.mode === 'menu' ? -3.2 : 0; camera.position.x += cos(a) * off; camera.position.z -= sin(a) * off; }
      camera.updateMatrixWorld();
      e.copy(camera.position);
      drawBackdrop(dt, false);
      eulerQ(.06, 0, sin(S.clock * .4) * .05);
      const c = BT.player.def.clips.idle;
      BT.player.push(0, 0, 0, Q.x, Q.y, Q.z, Q.w, 1, c.base, clipFrame(c, S.clock), 0, 0);
    }
    for (let i = 0; i < allBatches.length; i++) allBatches[i].end();
    camera.matrixWorldInverse.copy(camera.matrixWorld).invert();
    renderer.info.reset();
    renderer.clear();
    if (playing) {
      // Cockpit first into a near depth slice: every world pixel behind it is rejected by depth, a large saving on phones.
      gl.depthRange(0, .05);
      if (ckTall) { renderer.setScissorTest(true); renderer.setScissor(0, 0, innerWidth, innerHeight * ckScissor); }
      renderer.render(ckScene, ckCamera);
      if (ckTall) renderer.setScissorTest(false);
      gl.depthRange(.05, 1);
      renderer.render(scene, camera);
      gl.depthRange(0, 1);
      renderer.render(hudScene, hudCamera);
    } else renderer.render(scene, camera);
  }

  // ---------- frame loop and automatic quality ----------
  let pr = 1, lastW = 0, lastH = 0, fitTimer = 0;
  function fit() {
    const w = innerWidth || 800, h = innerHeight || 600, asp = w / h;
    const halfH = asp < .8 ? Math.atan(tan(20.5 * PI / 180) / max(asp, .4)) : asp < 1.2 ? Math.atan(tan(27 * PI / 180) / asp) : 31 * PI / 180;
    const fov = clamp(halfH * 2 * 180 / PI, 56, 104);
    tanV = tan(fov * PI / 360); tanH = tanV * asp;
    lastW = w; lastH = h;
    if (renderer) { renderer.setPixelRatio(pr); renderer.setSize(w, h, false); StarU.uPx.value = max(1, pr * .8); }
    if (camera) {
      // Portrait: the cockpit keeps its true width, sits at the bottom edge, and its canopy bars are scissored away.
      const tall = asp < .8, ckTanV = tall ? .56 / asp : tan(min(fov, 80) * PI / 360);
      camera.fov = fov; ckCamera.fov = 2 * Math.atan(ckTanV) * 180 / PI;
      for (const c of [camera, ckCamera]) { c.aspect = asp; c.updateProjectionMatrix(); }
      ckShift = tall ? 1 - .6 / ckTanV : 0; ckCamera.projectionMatrix.elements[9] = ckShift;
      ckCamera.projectionMatrixInverse.copy(ckCamera.projectionMatrix).invert();
      ckTall = tall ? 1 : 0; ckScissor = tall ? .25 : 1;
      SX = tall ? .66 : 1; XR = 30 * SX; ES = tall ? 1.24 : 1; ENGAGE = tall ? 235 : 330; CONVERGE = tall ? 210 : 300;
      bgK = tall ? .62 : 1; bgS = tall ? .52 : 1; bgY = tall ? 210 : 0;
      if (planetMesh) applyBackdropFrame();
      hudCamera.left = -asp; hudCamera.right = asp; hudCamera.top = 1; hudCamera.bottom = -1; hudCamera.updateProjectionMatrix();
    }
  }
  // Mobile browsers fire resize while the toolbar moves: only real size changes reallocate, and they are debounced.
  const onResize = () => { clearTimeout(fitTimer); fitTimer = setTimeout(() => { if (innerWidth !== lastW || innerHeight !== lastH) fit(); }, 160); };
  addEventListener('resize', onResize);
  addEventListener('orientationchange', () => setTimeout(fit, 160));

  const G = { S, R, Pl, B, en, eb, pb, pu, fx, Save, god: false, bot: false, botAim: { x: 0, y: 0 }, frames: null, n: 0, peak: { calls: 0, tris: 0 }, lockPR: false, aim, gov: null, shots: 0, hits: 0, aimErr() { camera.updateMatrixWorld(); project(aim.x, aim.y, aim.z); return hypot(P.x - Pl.rx, P.y - Pl.ry); } };
  function botInput() {
    let best = null, bd = 1e12;
    for (let i = 0; i < en.n; i++) { const e = en.a[i]; if (e.dead || e.z > -14) continue; const q = e.z * e.z + (e.x - Pl.x) ** 2 * 12; if (q < bd) { bd = q; best = e; } }
    if (B.active && B.state === 'fight') { let o = B; for (let j = 0; j < B.nparts; j++) if (B.parts[j].alive) { o = B.parts[j]; break; } best = o; }
    if (best) { project(best.x, best.y, best.z); if (P.w > 1) { G.botAim.x = clamp(P.x, -.95, .95); G.botAim.y = clamp(P.y, -.9, .9); } }
    if (eb.n > 90 && R.bombs > 0) useNova();
  }
  // Governor: cheap levers first (LOD, effect layers), then render scale. It reacts to short windows, before a stutter builds.
  const Gov = { level: 0, sum: 0, n: 0, bad: 0, good: 0, cool: 0, slow: 0 };
  G.gov = Gov;
  function applyGov() {
    const lv = Gov.level;
    lodBias = lv >= 1 ? 1.8 : 1; fxLoad = lv >= 2 ? .5 : 1;
    const scale = lv <= 2 ? 1 : max(.5, 1 - (lv - 2) * .14);
    const want = clamp(PR_START * scale, PR_MIN, PR_MAX);
    if (abs(want - pr) > .02) { pr = want; fit(); }
  }
  function govern(ms, real) {
    if (DEBUG && G.lockPR) return;
    if (ms > 90) return; // tab switch or a stall outside the game: says nothing about GPU load
    Gov.sum += ms; Gov.n++; if (ms > 22) Gov.slow++;
    Gov.cool = max(0, Gov.cool - real);
    if (Gov.n < 24) return;
    const avg = Gov.sum / Gov.n, slow = Gov.slow;
    Gov.sum = Gov.n = Gov.slow = 0;
    if (avg > 17.9 || slow >= 3) { Gov.good = 0; if (Gov.cool <= 0 && Gov.level < 7) { Gov.level++; Gov.cool = .7; applyGov(); } }
    else if (avg < 16.9 && slow === 0) { if (++Gov.good >= 24 && Gov.level > 0) { Gov.good = 0; Gov.level--; Gov.cool = 3; applyGov(); } }
    else Gov.good = 0;
  }
  let lastTs = 0;
  function frame(now) {
    requestAnimationFrame(frame);
    if (!lastTs) lastTs = now;
    const rawMs = now - lastTs; lastTs = now;
    const cpu0 = DEBUG ? performance.now() : 0;
    const real = min(.05, rawMs / 1000);
    S.clock += real;
    if (S.mode === 'play') {
      let dt = real;
      if (S.slow > 0) { S.slow -= real; dt *= .35; }
      step(dt); drawHud(real);
    }
    const cpu1 = DEBUG ? performance.now() : 0;
    render(S.mode === 'paused' ? 0 : real);
    if (DEBUG && G.frames && performance.now() - cpu0 > 25 && G.cpuSpikes.length < 30) G.cpuSpikes.push([round(now), round(cpu1 - cpu0), round(performance.now() - cpu1), R.sector, B.active ? B.state : S.waveState, fx.n, en.n]);
    if (DEBUG && G.frames && G.n < G.frames.length) {
      G.cpu[G.n] = performance.now() - cpu0;
      if (rawMs > 33.4 && G.slow.length < 200) G.slow.push([round(now), round(rawMs), +G.cpu[G.n].toFixed(1), R.sector, R.wave, B.active ? B.state : '', fx.n, eb.n, Gov.level]);
      G.frames[G.n++] = rawMs;
      const inf = renderer.info.render;
      if (inf.calls > G.peak.calls) G.peak.calls = inf.calls;
      if (inf.triangles > G.peak.tris) { G.peak.tris = inf.triangles; G.peakBy = allBatches.map(b => [b.name, b.cnt.reduce((q, c, l) => q + c * (b.tris[l] || 0), 0), b.cnt.join('/')]).filter(x => x[1] > 1500).sort((x, y) => y[1] - x[1]).slice(0, 14); }
    }
    if (S.mode === 'play') govern(rawMs, real);
  }

  window.__smokeStart = () => startRun(false);
  if (DEBUG) {
    window.__game = Object.assign(G, {
      tier: TIER,
      info: () => ({ calls: renderer.info.render.calls, tris: renderer.info.render.triangles, geos: renderer.info.memory.geometries, tex: renderer.info.memory.textures, pr }),
      startPerf(n) { G.frames = new Float32Array(n || 12000); G.cpu = new Float32Array(n || 12000); G.slow = []; G.cpuSpikes = []; G.n = 0; G.peak.calls = 0; G.peak.tris = 0; },
      jump(sector, wave) { clearField(); R.sector = sector; R.wave = wave; S.waveState = 'break'; S.waveT = .1; applySector(sector - 1, true); hudReset(); },
      boom(size) { explosion(rnd(-10, 10), rnd(-5, 5), -70, size); },
      over() { Pl.alive = false; S.deadT = .01; },
      hurtBoss(f) { if (B.active && B.state === 'fight') bossDamage(B.maxHp * f, null); }
    });
  }

  boot().catch(err => {
    console.error(err);
    $('bar').style.display = 'none'; $('loadTxt').textContent = ''; $('loadErr').style.display = 'block'; $('loadErr').textContent = t('l_err');
  });
})();
