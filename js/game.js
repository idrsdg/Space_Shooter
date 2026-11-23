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
      bomb: 'NOVA', sector: 'SEKTÖR', wave: 'DALGA', warning: 'UYARI', cleared: 'SEKTÖR TEMİZ', max: 'TAM', hHull: 'Gövde', hShield: 'Kalkan', hGun: 'Top', hRkt: 'Roket',
      u_hull: 'Gövde', ud_hull: 'Başlangıçta +1 gövde', u_cannon: 'Top', ud_cannon: 'Daha güçlü topla başla', u_rocket: 'Roket', ud_rocket: 'Roketlerle başla',
      u_magnet: 'Mıknatıs', ud_magnet: 'Hurda ve kapsülleri uzaktan çek', u_bomb: 'Nova Deposu', ud_bomb: 'Başlangıçta +1 Nova',
      p_w: 'TOP +1', p_r: 'ROKET +1', p_s: 'KALKAN', p_h: 'ONARIM', p_b: 'NOVA +1', p_o: 'AŞIRI GÜÇ', boss0: 'KOR PENÇE', boss1: 'GİRDAP ÇEKİRDEĞİ', boss2: 'SESSİZ TAHT',
      l_get: 'Modeller indiriliyor', l_tex: 'Dokular açılıyor', l_mesh: 'Gemiler hazırlanıyor', l_gpu: 'Grafik kartına yükleniyor', l_err: 'Oyun dosyaları yüklenemedi. Sayfayı yenile.', l_gl: 'Bu cihazda WebGL2 açık değil, oyun çalışamıyor.',
      help: ['<b>Klavye:</b> Yön tuşları veya WASD ile uç, Boşluk ile ateş et, X ile Nova, P ile duraklat, M ile ses.', '<b>Fare:</b> Nişangâh imleci izler, gemi de o yöne kayar. Sol tuş ateş, sağ tuş Nova.', '<b>Dokunmatik:</b> Parmağını sürükle, gemi kendi ateş eder ve yakındaki hedefe kilitlenir. Nova sağ altta.', '<b>Tehlike:</b> Her şey derinden üzerine gelir. Mermilerden ve kayalardan yana kayarak kaç.', '<b>Zincir:</b> Art arda vurdukça skor çarpanı 8 katına çıkar, hasar alınca sıfırlanır.', '<b>Hurda:</b> Hangarda kalıcı geliştirmelere harca. İlerlemen her dalgada kaydedilir.']
    },
    en: {
      tag: 'Take the cockpit, stop the fleet, win the sectors back', allGames: 'All games', play: 'New Game', cont: 'Continue', hangar: 'Hangar', how: 'How?', back: 'Back',
      soundOn: 'Sound: On', soundOff: 'Sound: Off', best: 'Best', scrap: 'Scrap', paused: 'Paused', resume: 'Resume', restart: 'Restart',
      quit: 'Main Menu (saved)', over: 'Ship Down', again: 'Play Again', menu: 'Main Menu', reached: 'Sector reached', scrapGot: 'Scrap collected', newBest: 'New record!',
      bomb: 'NOVA', sector: 'SECTOR', wave: 'WAVE', warning: 'WARNING', cleared: 'SECTOR CLEAR', max: 'MAX', hHull: 'Hull', hShield: 'Shield', hGun: 'Cannon', hRkt: 'Rocket',
      u_hull: 'Hull', ud_hull: '+1 hull at start', u_cannon: 'Cannon', ud_cannon: 'Start with a stronger cannon', u_rocket: 'Rockets', ud_rocket: 'Start with rockets',
      u_magnet: 'Magnet', ud_magnet: 'Pull scrap and capsules from afar', u_bomb: 'Nova Rack', ud_bomb: '+1 Nova at start',
      p_w: 'CANNON +1', p_r: 'ROCKET +1', p_s: 'SHIELD', p_h: 'REPAIR', p_b: 'NOVA +1', p_o: 'OVERDRIVE', boss0: 'EMBER CLAW', boss1: 'VORTEX CORE', boss2: 'SILENT THRONE',
      l_get: 'Downloading models', l_tex: 'Unpacking textures', l_mesh: 'Preparing ships', l_gpu: 'Uploading to the graphics card', l_err: 'Game files could not be loaded. Refresh the page.', l_gl: 'WebGL2 is not available on this device, so the game cannot run.',
      help: ['<b>Keyboard:</b> Arrows or WASD to fly, Space to fire, X for Nova, P to pause, M for sound.', '<b>Mouse:</b> The reticle follows the cursor and the ship slides that way. Left button fires, right button launches Nova.', '<b>Touch:</b> Drag to fly. The ship fires on its own and locks onto nearby targets. Nova is bottom right.', '<b>Danger:</b> Everything comes at you out of the depth. Slide aside to dodge shots and rocks.', '<b>Chain:</b> Keep hitting to raise the score multiplier up to 8x. Taking damage resets it.', '<b>Scrap:</b> Spend it on permanent Hangar upgrades. Your run is saved every wave.']
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
      shot() { if (gate('shot', .08)) tone(1150, 320, .07, 'square', .03); },
      rocket() { if (gate('rocket', .12)) { burst(.22, .1, 2600, 500, 'bandpass'); tone(170, 420, .18, 'sawtooth', .025); } },
      hit() { if (gate('hit', .06)) tone(520, 240, .04, 'triangle', .05); },
      armor() { if (gate('armor', .08)) tone(1500, 900, .05, 'square', .025); },
      small() { if (gate('small', .05)) { burst(.24, .26, 2200, 180); tone(190, 45, .18, 'triangle', .14); } },
      big() { if (gate('big', .1)) { burst(.6, .46, 1400, 60); tone(110, 28, .5, 'sine', .34); } },
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
  const rk = new Pool(30, { x: 0, y: 0, z: 0, vx: 0, vy: 0, vz: 0, t: 0, rt: 0, tg: null, v: 0 });
  const eb = new Pool(420, { x: 0, y: 0, z: 0, vx: 0, vy: 0, vz: 0, kind: 0, r: 1, t: 0 });
  const en = new Pool(64, { type: '', def: null, x: 0, y: 0, z: 0, vx: 0, vy: 0, vz: 0, hp: 0, maxHp: 0, t: 0, path: 0, a: 0, b: 0, c: 0, d: 0, e: 0, fireT: 0, flash: 0, rx: 0, ry: 0, rz: 0, sx: 0, sy: 0, sz: 0, shield: 0, st: 0, vr: 0, phase: 0, px: 0, py: 0, bank: 0 });
  const sq = new Pool(150, { t: 0, type: '', x: 0, y: 0, path: 0, a: 0, b: 0, c: 0, d: 0, e: 0 });
  const pu = new Pool(80, { x: 0, y: 0, z: 0, vx: 0, vy: 0, vz: 0, kind: '', t: 0, scrap: false });
  const fx = new Pool(110, { m: 0, x: 0, y: 0, z: 0, vx: 0, vy: 0, vz: 0, t: 0, life: 1, s: 1, qx: 0, qy: 0, qz: 0, qw: 1 });
  const bm = new Pool(8, { owner: null, ox: 0, oy: 0, oz: 0, tx: 0, ty: 0, tvx: 0, tvy: 0, t: 0, warn: .7, life: 1, w: 1, part: -1 });

  // ---------- state ----------
  const XR = 30, YR = 17, SPAWN_Z = -560, PL_R = 2.7;
  const S = { mode: 'load', clock: 0, shake: 0, slow: 0, waveState: 'idle', waveT: 0, deadT: 0, gain: 0, novaT: -1, nx: 0, ny: 0, nz: 0, nvx: 0, nvy: 0, nvz: 0, sector: 0, flow: 0 };
  const R = { score: 0, sector: 1, wave: 1, hull: 3, maxHull: 3, shield: 0, wpn: 1, rkt: 0, bombs: 2, chain: 0, combo: 1, comboT: 0, overT: 0, pity: 0 };
  const Pl = { x: 0, y: 0, vx: 0, vy: 0, rx: 0, ry: 0, bank: 0, pitch: 0, inv: 0, fireT: 0, rktT: 0, recoil: 0, muzzle: 0, alive: true, novaCd: 0, rktSide: 1, tg: null, firing: false, heat: 0 };
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
    { sun: [.55, .62, .56], sunC: [1.04, .93, .78], amb: [.34, .36, .52], fog: [.07, .07, .2], planet: 0, ring: 'ring0', station: 0, pPos: [-260, 120, -880], pS: 215, sPos: [330, -120, -760], sS: 2.6 },
    { sun: [-.5, .7, .5], sunC: [.86, 1.0, .94], amb: [.26, .42, .44], fog: [.03, .13, .15], planet: 1, ring: null, station: 1, pPos: [300, -110, -900], pS: 250, sPos: [-340, 90, -740], sS: 2.8 },
    { sun: [.32, .8, .5], sunC: [1.05, .84, .68], amb: [.46, .26, .36], fog: [.16, .05, .1], planet: 2, ring: null, station: 2, pPos: [-310, -100, -860], pS: 200, sPos: [300, 140, -700], sS: 2.4 },
    { sun: [-.6, .55, .58], sunC: [.92, .96, 1.05], amb: [.33, .37, .48], fog: [.07, .09, .15], planet: 3, ring: 'ring3', station: 3, pPos: [260, 130, -900], pS: 235, sPos: [-310, -120, -720], sS: 2.6 }
  ];

  // ---------- renderer ----------
  const VS = `
    precision highp float; precision highp int; precision highp sampler2D;
    attribute float aPart; attribute vec2 aUv; attribute vec4 aN; attribute vec4 aC; attribute vec4 iAnim;
    uniform sampler2D uAnim; uniform float uBones; uniform float uQ; uniform int uAW;
    varying vec3 vN; varying vec3 vC; varying vec3 vP; varying vec2 vUv; varying float vAo; varying float vFlash; varying float vFogK; flat varying int vMat;
    vec4 tx(int i) { return texelFetch(uAnim, ivec2(i % uAW, i / uAW), 0); }
    vec3 qrot(vec4 q, vec3 v) { return v + 2.0 * cross(q.xyz, cross(q.xyz, v) + q.w * v); }
    void main() {
      int mat = int(floor(aN.w * 127.0 + .5));
      vec3 p = position * uQ, n = aN.xyz;
      if (uBones > .5) {
        int bn = int(uBones + .5), b = int(aPart + .5), f0 = int(iAnim.y);
        float ft = iAnim.y - float(f0);
        int i0 = int(iAnim.x + .5) + (f0 * bn + b) * 2, i1 = i0 + bn * 2;
        vec4 a0 = tx(i0), a1 = tx(i1), q0 = tx(i0 + 1), q1 = tx(i1 + 1);
        vec4 tr = mix(a0, a1, ft);
        vec4 q = normalize(mix(q0, q1, ft));
        if (mat == 3) { p.z *= tr.w; p.xy *= .7 + .3 * tr.w; } else p *= tr.w;
        p = qrot(q, p) + tr.xyz;
        n = qrot(q, n);
      }
      vec4 wp = modelMatrix * instanceMatrix * vec4(p, 1.0);
      vN = normalize(mat3(modelMatrix) * mat3(instanceMatrix) * n);
      vP = wp.xyz; vUv = aUv * 32.0; vC = aC.rgb; vAo = aC.a; vFlash = iAnim.z; vFogK = 1. - iAnim.w; vMat = mat;
      gl_Position = projectionMatrix * viewMatrix * wp;
    }`;
  const FS = `
    precision highp float; precision highp int;
    uniform sampler2D uDetail; uniform vec3 uSun, uSunC, uAmb, uFog, uEye; uniform float uFogN, uFogF, uClip;
    varying vec3 vN; varying vec3 vC; varying vec3 vP; varying vec2 vUv; varying float vAo; varying float vFlash; varying float vFogK; flat varying int vMat;
    void main() {
      #ifdef CK_CLIP
      if (vP.y > uClip) discard;
      #endif
      vec3 col = vC;
      if (vMat < 3 || vMat == 4) {
        vec3 d = texture2D(uDetail, vUv).rgb;
        vec3 N = normalize(vN), V = normalize(uEye - vP);
        if (vMat == 4) { col *= .86 + d.r * .14; }
        else {
          float dif = max(dot(N, uSun), 0.), hemi = .5 + .5 * N.y;
          float det = vMat == 1 ? (.55 + d.g * .75) : (vMat == 0 ? d.r * (.9 + d.b * .16) : 1.);
          vec3 H = normalize(uSun + V);
          float sp = pow(max(dot(N, H), 0.), vMat == 2 ? 70. : vMat == 0 ? 26. : 8.) * (vMat == 2 ? .62 : vMat == 0 ? .3 * d.b + .08 : .03);
          float rim = pow(1. - max(dot(N, V), 0.), 3.) * (vMat == 2 ? .34 : .12);
          col = col * det * (uAmb * (.55 + .45 * hemi) * (.35 + .65 * vAo) + uSunC * dif * (.45 + .55 * vAo)) + (uSunC * sp + uAmb * rim) * vAo;
        }
      }
      if (vMat == 3) { float nv = abs(dot(normalize(vN), normalize(uEye - vP))); col *= .56 + .44 * nv; }
      if (vFlash > .001) col = mix(col, vec3(1., .88, .66), vFlash * .42);
      float dist = length(vP - uEye), fg = clamp((dist - uFogN) / (uFogF - uFogN), 0., 1.);
      col = mix(col, uFog, fg * fg * vFogK);
      gl_FragColor = vec4(min(col, vec3(1.)), 1.);
    }`;
  const SKY_VS = `varying vec3 vD; void main() { vD = position; vec4 p = projectionMatrix * mat4(mat3(viewMatrix)) * vec4(position, 1.); gl_Position = p.xyww; }`;
  const SKY_FS = `precision highp float; uniform sampler2D uA, uB; uniform float uMix, uYaw; varying vec3 vD;
    void main() { vec3 d = normalize(vD); float s = sin(uYaw), c = cos(uYaw); d = vec3(c * d.x - s * d.z, d.y, s * d.x + c * d.z);
      vec2 uv = vec2(atan(d.x, -d.z) / 6.2831853 + .5, asin(clamp(d.y, -1., 1.)) / 3.1415927 + .5);
      vec3 col = texture2D(uA, uv).rgb; if (uMix < .999) col = mix(texture2D(uB, uv).rgb, col, uMix); gl_FragColor = vec4(col, 1.); }`;
  const PLANET_VS = `varying vec3 vO; varying vec3 vN; uniform float uSpin; void main() { vO = position; float s = sin(uSpin), c = cos(uSpin); vO = vec3(c * position.x - s * position.z, position.y, s * position.x + c * position.z); vN = normalize(mat3(modelMatrix) * position); gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.); }`;
  const PLANET_FS = `precision highp float; uniform sampler2D uMap; uniform vec3 uSun; varying vec3 vO; varying vec3 vN;
    void main() { vec3 d = normalize(vO); vec2 uv = vec2(atan(d.x, -d.z) / 6.2831853 + .5, asin(clamp(d.y, -1., 1.)) / 3.1415927 + .5);
      float l = dot(normalize(vN), uSun); float lit = smoothstep(-.18, .55, l); vec3 col = texture2D(uMap, uv).rgb * (.03 + .97 * lit); gl_FragColor = vec4(col, 1.); }`;

  const coarse = matchMedia('(pointer: coarse)').matches || 'ontouchstart' in window;
  const smallScreen = min(screen.width || 1000, screen.height || 1000) < 720;
  const TIER = (coarse && smallScreen) || /[?&]tier=phone(&|$)/.test(location.search) ? 'phone' : 'desktop';
  const TRI_BUDGET = TIER === 'phone' ? 150000 : 420000;
  const PR_MAX = TIER === 'phone' ? min(devicePixelRatio || 1, 1.75) : min(devicePixelRatio || 1, 2);
  const PR_MIN = TIER === 'phone' ? .85 : 1;
  let renderer = null, scene = null, ckScene = null, camera = null, ckCamera = null, gl2ok = true;
  const U = {
    uAnim: { value: null }, uDetail: { value: null }, uSun: { value: new THREE.Vector3(.5, .6, .6).normalize() }, uSunC: { value: new THREE.Vector3(1, 1, 1) }, uAmb: { value: new THREE.Vector3(.3, .3, .4) },
    uFog: { value: new THREE.Vector3() }, uEye: { value: new THREE.Vector3() }, uFogN: { value: 260 }, uFogF: { value: 620 }, uAW: { value: 1024 }
  };
  const UCK = { uAnim: U.uAnim, uDetail: U.uDetail, uSun: { value: new THREE.Vector3(.2, .85, .5).normalize() }, uSunC: { value: new THREE.Vector3(.86, .88, .95) }, uAmb: { value: new THREE.Vector3(.44, .47, .6) },
    uFog: { value: new THREE.Vector3() }, uEye: { value: new THREE.Vector3() }, uFogN: { value: 90 }, uFogF: { value: 100 }, uAW: U.uAW };

  const UClip = { value: 99 };
  const CAPS = { rock: 16, bolt: 280, pick_scrap: 40, pick: 8, boom: 26, debris: 22, shock: 16, default: 18 };
  const LOD0_CAP = { bolt: 5, rock: 4, pick: 3, boom: 3, debris: 3, shock: 3, default: 3 };
  const prefixKey = (n, tbl) => { for (const k in tbl) if (n.startsWith(k)) return tbl[k]; return tbl.default; };

  let manifest = null;
  const BT = {}; // name -> batch
  const allBatches = [];
  let trisLeft = 0;

  function Batch(name, def, bins, isCk) {
    this.name = name; this.r = def.r; this.def = def; this.ck = isCk;
    const cap = name === 'dust' ? 150 : name.startsWith('bolt') ? (name === 'bolt_muzzle' ? 8 : name === 'bolt_p' || name === 'bolt_h' ? 180 : 130) : prefixKey(name, CAPS) || CAPS.default;
    this.cap = cap; this.l0cap = prefixKey(name, LOD0_CAP);
    if (name === 'dust') this.l0cap = 3;
    if (name.startsWith('ck_led')) this.l0cap = 10;
    this.noFog = /^(station|ring)/.test(name) ? 1 : 0;
    this.tris = def.lod.map(l => l.ic / 3);
    const mat = new THREE.ShaderMaterial({ vertexShader: VS, fragmentShader: FS, side: THREE.FrontSide,
      defines: name.startsWith('ck_') ? { CK_CLIP: 1 } : {},
      uniforms: Object.assign({}, isCk ? UCK : U, { uBones: { value: def.parts }, uQ: { value: def.q }, uClip: UClip }) });
    this.meshes = []; this.cnt = [0, 0, 0]; this.m = []; this.an = []; this.mesh0 = null;
    def.lod.forEach((l, i) => {
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
      const lc = i === 0 ? min(cap, max(this.l0cap, 1)) : cap;
      const im = new THREE.InstancedMesh(g, mat, lc);
      im.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
      const an = new THREE.InstancedBufferAttribute(new Float32Array(lc * 4), 4); an.setUsage(THREE.DynamicDrawUsage);
      g.setAttribute('iAnim', an);
      im.frustumCulled = false; im.count = 0; im.visible = false;
      (isCk ? ckScene : scene).add(im);
      this.meshes.push(im); this.m.push(im.instanceMatrix.array); this.an.push(an.array);
    });
    this.lcap = this.meshes.map(q => q.instanceMatrix.count);
    allBatches.push(this);
  }
  Batch.prototype.begin = function () { this.cnt[0] = this.cnt[1] = this.cnt[2] = 0; };
  Batch.prototype.end = function () {
    for (let i = 0; i < this.meshes.length; i++) {
      const im = this.meshes[i], c = this.cnt[i];
      im.count = c; im.visible = c > 0;
      if (c > 0) {
        const a = im.instanceMatrix, b = im.geometry.attributes.iAnim;
        a.updateRange.offset = 0; a.updateRange.count = c * 16; a.needsUpdate = true;
        b.updateRange.offset = 0; b.updateRange.count = c * 4; b.needsUpdate = true;
      }
    }
  };
  // Chooses an LOD from on-screen size, then respects per-model and global triangle budgets.
  Batch.prototype.push = function (x, y, z, qx, qy, qz, qw, s, base, frame, flash, forceLod) {
    let l;
    if (forceLod !== undefined) l = forceLod;
    else {
      const dx = x - U.uEye.value.x, dy = y - U.uEye.value.y, dz = z - U.uEye.value.z;
      const d2 = dx * dx + dy * dy + dz * dz, rr = this.r * s;
      l = rr * rr > d2 * LOD_A ? 0 : rr * rr > d2 * LOD_B ? 1 : 2;
      while (l < 2 && (this.cnt[l] >= this.lcap[l] || this.tris[l] > trisLeft)) l++;
    }
    if (this.cnt[l] >= this.lcap[l]) { if (l < 2 && forceLod === undefined) l = 2; if (this.cnt[l] >= this.lcap[l]) return; }
    trisLeft -= this.tris[l];
    const i = this.cnt[l]++, m = this.m[l], o = i * 16;
    const x2 = qx + qx, y2 = qy + qy, z2 = qz + qz, xx = qx * x2, xy = qx * y2, xz = qx * z2, yy = qy * y2, yz = qy * z2, zz = qz * z2, wx = qw * x2, wy = qw * y2, wz = qw * z2;
    m[o] = (1 - (yy + zz)) * s; m[o + 1] = (xy + wz) * s; m[o + 2] = (xz - wy) * s; m[o + 3] = 0;
    m[o + 4] = (xy - wz) * s; m[o + 5] = (1 - (xx + zz)) * s; m[o + 6] = (yz + wx) * s; m[o + 7] = 0;
    m[o + 8] = (xz + wy) * s; m[o + 9] = (yz - wx) * s; m[o + 10] = (1 - (xx + yy)) * s; m[o + 11] = 0;
    m[o + 12] = x; m[o + 13] = y; m[o + 14] = z; m[o + 15] = 1;
    const an = this.an[l], p = i * 4;
    an[p] = base; an[p + 1] = frame; an[p + 2] = flash; an[p + 3] = this.noFog;
  };
  const LOD_A = TIER === 'phone' ? .017 : .0075, LOD_B = TIER === 'phone' ? .0016 : .0007;

  // scratch quaternion
  const Q = { x: 0, y: 0, z: 0, w: 1 };
  function eulerQ(px, py, pz) { // pitch(x) yaw(y) roll(z)
    const cx = cos(px / 2), sx = sin(px / 2), cy = cos(py / 2), sy = sin(py / 2), cz = cos(pz / 2), sz = sin(pz / 2);
    Q.x = sx * cy * cz + cx * sy * sz; Q.y = cx * sy * cz - sx * cy * sz; Q.z = cx * cy * sz + sx * sy * cz; Q.w = cx * cy * cz - sx * sy * sz;
  }
  // rotation taking +Z to (dx, dy, dz)
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
  const setBar = (v, label) => { $('barIn').style.transform = 'scaleX(' + clamp(v, 0, 1) + ')'; $('loadTxt').textContent = t(label) + '  ' + round(v * 100) + '%'; };
  const tickFrame = () => new Promise(r => requestAnimationFrame(() => r()));
  async function fetchBin(url, onBytes) {
    const res = await fetch(url);
    if (!res.ok) throw new Error(url);
    if (!res.body || !res.body.getReader) { const b = await res.arrayBuffer(); onBytes(b.byteLength); return b; }
    const len = +res.headers.get('content-length') || 0, enc = res.headers.get('content-encoding');
    const rd = res.body.getReader();
    const chunks = []; let got = 0;
    for (;;) {
      const { done, value } = await rd.read(); if (done) break;
      chunks.push(value); got += value.length; onBytes(value.length);
    }
    void len; void enc;
    const out = new Uint8Array(got); let o = 0;
    for (const c of chunks) { out.set(c, o); o += c.length; }
    return out.buffer;
  }
  function loadImage(url) {
    return new Promise((res, rej) => { const i = new Image(); i.onload = () => { (i.decode ? i.decode().catch(() => {}) : Promise.resolve()).then(() => res(i)); }; i.onerror = () => rej(new Error(url)); i.src = url; });
  }
  function texFrom(img, opt) {
    const tx = new THREE.Texture(img);
    tx.wrapS = opt && opt.repeat ? THREE.RepeatWrapping : THREE.ClampToEdgeWrapping; tx.wrapT = tx.wrapS;
    tx.minFilter = opt && opt.mip ? THREE.LinearMipmapLinearFilter : THREE.LinearFilter; tx.magFilter = THREE.LinearFilter;
    tx.generateMipmaps = !!(opt && opt.mip); tx.anisotropy = opt && opt.aniso || 1; tx.flipY = true; tx.needsUpdate = true;
    return tx;
  }
  let skyMesh, planetMesh, ringBatchNames = [], skyTex = [], planetTex = [];
  const SkyU = { uA: { value: null }, uB: { value: null }, uMix: { value: 1 }, uYaw: { value: 0 } };
  const PlanetU = { uMap: { value: null }, uSun: U.uSun, uSpin: { value: 0 } };

  async function boot() {
    applyLang();
    setBar(0, 'l_get');
    const cv = $('c');
    try {
      renderer = new THREE.WebGLRenderer({ canvas: cv, antialias: TIER !== 'phone', alpha: false, depth: true, stencil: false, powerPreference: 'high-performance', preserveDrawingBuffer: DEBUG });
    } catch (e) { gl2ok = false; }
    if (!gl2ok || !renderer.capabilities.isWebGL2) { $('bar').style.display = 'none'; $('loadTxt').textContent = ''; $('loadErr').style.display = 'block'; $('loadErr').textContent = t('l_gl'); return; }
    renderer.autoClear = false; renderer.info.autoReset = false; renderer.setClearColor(0x05070f, 1);
    renderer.outputEncoding = THREE.LinearEncoding;
    scene = new THREE.Scene(); ckScene = new THREE.Scene();
    camera = new THREE.PerspectiveCamera(62, 1, .6, 3200); ckCamera = new THREE.PerspectiveCamera(62, 1, .02, 6);
    scene.matrixAutoUpdate = false; ckScene.matrixAutoUpdate = false;
    fit();

    manifest = await (await fetch('assets/manifest.json')).json();
    const F = manifest.files;
    const skyName = i => 'assets/tex/sky' + i + (TIER === 'phone' ? '_lo' : '') + '.jpg';
    const IMG_EST = TIER === 'phone' ? 620000 : 1400000;
    const total = F.hi.bytes + F.base.bytes + F.anim.bytes + IMG_EST;
    let got = 0;
    const on = n => { got += n; setBar(min(.72, got / total * .72), 'l_get'); };
    const [hi, base, anim] = await Promise.all([fetchBin('assets/' + F.hi.file, on), fetchBin('assets/' + F.base.file, on), fetchBin('assets/' + F.anim.file, on)]);

    setBar(.74, 'l_tex');
    const urls = ['assets/tex/detail.jpg']; for (let i = 0; i < 4; i++) urls.push(skyName(i)); for (let i = 0; i < 4; i++) urls.push('assets/tex/planet' + i + '.jpg');
    const imgs = [];
    for (let i = 0; i < urls.length; i++) { imgs.push(await loadImage(urls[i])); setBar(.74 + .08 * (i + 1) / urls.length, 'l_tex'); }
    U.uDetail.value = texFrom(imgs[0], { repeat: true, mip: true, aniso: min(4, renderer.capabilities.getMaxAnisotropy()) });
    for (let i = 0; i < 4; i++) skyTex.push(texFrom(imgs[1 + i], {}));
    for (let i = 0; i < 4; i++) planetTex.push(texFrom(imgs[5 + i], {}));
    const animTex = new THREE.DataTexture(new Float32Array(anim), F.anim.w, F.anim.h, THREE.RGBAFormat, THREE.FloatType);
    animTex.minFilter = animTex.magFilter = THREE.NearestFilter; animTex.generateMipmaps = false; animTex.flipY = false; animTex.needsUpdate = true;
    U.uAnim.value = animTex; U.uAW.value = F.anim.w;

    setBar(.83, 'l_mesh');
    const bins = { hi, base };
    const names = Object.keys(manifest.models);
    for (let i = 0; i < names.length; i++) {
      const n = names[i];
      if (n === 'sky' || /^planet\d/.test(n)) continue;
      BT[n] = new Batch(n, manifest.models[n], bins, n.startsWith('ck_') || n === 'reticle' || n === 'bracket');
      if (i % 12 === 0) { setBar(.83 + .05 * i / names.length, 'l_mesh'); await tickFrame(); }
    }
    // sky and planet bodies use their own tiny shaders
    const geoOf = name => { const d = manifest.models[name], l = d.lod[TIER === 'phone' ? 1 : 0], g = new THREE.BufferGeometry(), buf = bins[l.bin];
      const pos = new Float32Array(l.vc * 3), src = new Int16Array(buf, l.vo, l.vc * 6);
      for (let k = 0; k < l.vc; k++) { pos[k * 3] = src[k * 6] / 32767 * d.q; pos[k * 3 + 1] = src[k * 6 + 1] / 32767 * d.q; pos[k * 3 + 2] = src[k * 6 + 2] / 32767 * d.q; }
      g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
      g.setIndex(new THREE.BufferAttribute(l.bits === 16 ? new Uint16Array(buf, l.io, l.ic) : new Uint32Array(buf, l.io, l.ic), 1));
      return g; };
    skyMesh = new THREE.Mesh(geoOf('sky'), new THREE.ShaderMaterial({ vertexShader: SKY_VS, fragmentShader: SKY_FS, uniforms: SkyU, side: THREE.BackSide, depthWrite: false, depthTest: true }));
    skyMesh.frustumCulled = false; skyMesh.renderOrder = 10; scene.add(skyMesh);
    planetMesh = new THREE.Mesh(geoOf('planet0'), new THREE.ShaderMaterial({ vertexShader: PLANET_VS, fragmentShader: PLANET_FS, uniforms: PlanetU }));
    planetMesh.frustumCulled = false; scene.add(planetMesh);
    applySector(0, true);

    // compile every shader and upload every buffer and texture now, so no first-use hitch can occur in play
    setBar(.89, 'l_gpu');
    await tickFrame();
    for (const tx of [U.uDetail.value, animTex, ...skyTex, ...planetTex]) { renderer.initTexture(tx); }
    setBar(.92, 'l_gpu'); await tickFrame();
    for (const b of allBatches) for (let i = 0; i < b.meshes.length; i++) { const im = b.meshes[i]; im.count = 1; im.visible = true; b.m[i].fill(0); }
    skyMesh.visible = true; planetMesh.visible = true;
    renderer.compile(scene, camera); renderer.compile(ckScene, ckCamera);
    setBar(.95, 'l_gpu'); await tickFrame();
    const rt = new THREE.WebGLRenderTarget(8, 8);
    renderer.setRenderTarget(rt);
    for (let idx = 0; idx < allBatches.length; idx += 6) {
      for (const b of allBatches) for (const im of b.meshes) im.visible = false;
      for (let j = idx; j < idx + 6 && j < allBatches.length; j++) for (const im of allBatches[j].meshes) im.visible = true;
      renderer.clear(); renderer.render(scene, camera); renderer.render(ckScene, ckCamera);
      setBar(.95 + .05 * idx / allBatches.length, 'l_gpu');
      renderer.setRenderTarget(null); await tickFrame(); renderer.setRenderTarget(rt);
    }
    renderer.setRenderTarget(null); rt.dispose();
    for (const b of allBatches) { b.begin(); b.end(); }
    FX_NAME.forEach((n, i) => { fxBatch[i] = BT[n]; });
    renderer.info.reset();
    setBar(1, 'l_gpu');
    $('load').style.display = 'none';
    setMode('menu');
    window.__ready = true;
    requestAnimationFrame(frame);
  }

  function applySector(i, instant) {
    const s = SECTORS[i % 4];
    S.sector = i % 4;
    U.uSun.value.set(s.sun[0], s.sun[1], s.sun[2]).normalize();
    U.uSunC.value.set(s.sunC[0], s.sunC[1], s.sunC[2]); U.uAmb.value.set(s.amb[0], s.amb[1], s.amb[2]);
    U.uFog.value.set(s.fog[0], s.fog[1], s.fog[2]);
    SkyU.uB.value = instant ? skyTex[i % 4] : SkyU.uA.value;
    SkyU.uA.value = skyTex[i % 4]; SkyU.uMix.value = instant ? 1 : 0;
    PlanetU.uMap.value = planetTex[s.planet];
    planetMesh.position.set(s.pPos[0], s.pPos[1], s.pPos[2]); planetMesh.scale.setScalar(s.pS); planetMesh.updateMatrixWorld(true);
  }

  // ---------- spawning ----------
  function spawnEnemy(type, x, y, z, path, a, b, c, d, e2) {
    const e = en.get(); if (!e) return null;
    const df = ET[type];
    e.type = type; e.def = df; e.x = x; e.y = y; e.z = z; e.vx = 0; e.vy = 0; e.vz = df.v * (1 + (R.sector - 1) * .05);
    e.hp = e.maxHp = ceil(df.hp * hpMul()); e.t = 0; e.path = path; e.a = a || 0; e.b = b || 0; e.c = c || 0; e.d = d || 0; e.e = e2 || 0;
    e.fireT = df.fire ? rnd(.7, 1.1) * df.fire * fireMul() : 0; e.flash = 0; e.rx = rnd(0, TAU); e.ry = rnd(0, TAU); e.rz = rnd(0, TAU);
    e.sx = rnd(-1.5, 1.5); e.sy = rnd(-1.5, 1.5); e.sz = rnd(-1, 1); e.shield = df.shield ? ceil(df.shield * hpMul()) : 0; e.st = 0;
    e.vr = floor(random() * 3); e.phase = random() * 4; e.px = x; e.py = y; e.bank = 0;
    return e;
  }
  function Qs(at, type, x, y, path, a, b, c, d, e) {
    const s = sq.get(); if (!s) return;
    s.t = at; s.type = type; s.x = x; s.y = y; s.path = path; s.a = a || 0; s.b = b || 0; s.c = c || 0; s.d = d || 0; s.e = e || 0;
  }
  // paths: 0 straight, 1 weave, 2 come in and hold, 3 side arc, 5 homing rocket
  function patternDart(at, L) {
    const n = 4 + min(6, floor(L / 3)), v = floor(random() * 4);
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

  // ---------- effects ----------
  const FX = { s: 0, m: 1, l: 2, hit: 3, debris: 4, shock: 5 };
  const FX_NAME = ['boom_s', 'boom_m', 'boom_l', 'boom_hit', 'debris', 'shock'];
  const fxBatch = [];
  function addFx(kind, x, y, z, s, vx, vy, vz) {
    const f = fx.get(); if (!f) return;
    const c = fxBatch[kind].def.clips.play;
    f.m = kind; f.x = x; f.y = y; f.z = z; f.s = s; f.t = 0; f.life = c.frames / c.fps; f.vx = vx || 0; f.vy = vy || 0; f.vz = vz || 0;
    eulerQ(rnd(0, TAU), rnd(0, TAU), rnd(0, TAU)); f.qx = Q.x; f.qy = Q.y; f.qz = Q.z; f.qw = Q.w;
  }
  function explosion(x, y, z, size, vz) {
    const v = vz === undefined ? 30 : vz;
    if (size <= 1) { addFx(FX.s, x, y, z, 1.25, 0, 0, v); addFx(FX.debris, x, y, z, .42, 0, 0, v); }
    else if (size === 2) { addFx(FX.m, x, y, z, 1.2, 0, 0, v); addFx(FX.debris, x, y, z, .68, 0, 0, v); addFx(FX.shock, x, y, z, 2.2, 0, 0, v); }
    else if (size === 3) { addFx(FX.l, x, y, z, 1.05, 0, 0, v * .6); addFx(FX.debris, x, y, z, 1, 0, 0, v * .6); addFx(FX.shock, x, y, z, 4.2, 0, 0, v * .6); }
    else { addFx(FX.l, x, y, z, 1.8, 0, 0, v * .4); addFx(FX.m, x + rnd(-8, 8), y + rnd(-6, 6), z, 1.7, 0, 0, v * .4); addFx(FX.debris, x, y, z, 1.7, 0, 0, v * .4); addFx(FX.shock, x, y, z, 7.5, 0, 0, v * .4); }
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
    B.r = [24, 21, 25][ty]; B.maxHp = B.hp = round([260, 340, 420][ty] * lvl); B.nparts = ty === 1 ? 3 : 2;
    for (let i = 0; i < 3; i++) { const p = B.parts[i], on = i < B.nparts; p.alive = on; p.max = p.hp = round((ty === 1 ? 46 : 56) * lvl); p.flash = 0; p.r = ty === 1 ? 8 : 11.5; p.x = 0; p.y = 0; p.z = -700; p.ang = 0; }
    showMsg('warning', 'boss' + ty, 2.6, true); Snd.play('warn');
    $('hBossName').textContent = t('boss' + ty); $('hBoss').style.display = 'block'; hudBoss = -1;
  }
  function bossDamage(dmg, part) {
    if (!B.active || B.state !== 'fight') return;
    if (part) {
      part.hp -= dmg; part.flash = .09;
      if (part.hp <= 0 && part.alive) {
        part.alive = false; explosion(part.x, part.y, part.z, 3, 8); addShake(.4); Snd.play('big'); addScore(600); chainUp();
        dropPickup(random() < .5 ? 'w' : 's', part.x, part.y, part.z); dropScrap(6, part.x, part.y, part.z);
      } else Snd.play('hit');
      return;
    }
    B.hp -= dmg; B.flash = .08; Snd.play('hit');
    const ratio = B.hp / B.maxHp, ph = ratio > .66 ? 0 : ratio > .33 ? 1 : 2;
    if (ph !== B.phase) { B.phase = ph; B.atk = -1; B.sub = 0; B.subT = .9; explosion(B.x + rnd(-14, 14), B.y + rnd(-9, 9), B.z + 16, 3, 8); addShake(.45); Snd.play('big'); clearEnemyShots(); }
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
      B.x = sin(B.t * (.44 + B.phase * .08)) * 15; B.y = 3 + sin(B.t * .9) * 5; B.z = B.baseZ + sin(B.t * .6) * 10;
      B.subT -= dt;
      let guard = 0;
      while (B.subT <= 0 && guard++ < 4 && Pl.alive) {
        if (B.sub <= 0) { const list = BOSS_PLAN[B.type][B.phase]; B.atk = (B.atk + 1) % list.length; B.cur = BOSS_ATK[list[B.atk]]; B.sub = B.cur.n; B.subI = 0; }
        B.cur.f(B.subI); B.subI++; B.sub--;
        B.subT += B.sub > 0 ? B.cur.gap : B.cur.rest * max(.6, 1 - (R.sector - 1) * .05) * (B.phase === 2 ? .8 : 1);
      }
    } else if (B.state === 'dying') {
      B.dieT += dt; B.boomT -= dt; B.z -= 5 * dt; B.y -= 3 * dt;
      if (B.boomT <= 0) { B.boomT = .17; explosion(B.x + rnd(-26, 26), B.y + rnd(-18, 18), B.z + rnd(4, 24), floor(rnd(2, 4)), 6); addShake(.14); Snd.play('big'); }
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
    pb.clear(); rk.clear(); eb.clear(); en.clear(); sq.clear(); pu.clear(); fx.clear(); bm.clear();
    B.active = false; B.dead = true; S.novaT = -1; $('hBoss').style.display = 'none';
  }
  function startRun(resume) {
    clearField();
    const u = Save.up;
    R.maxHull = 3 + u.hull; R.hull = R.maxHull; R.shield = 0; R.wpn = 1 + u.cannon; R.rkt = u.rocket; R.bombs = 2 + u.bomb; R.score = 0; R.sector = 1; R.wave = 1; S.gain = 0;
    R.chain = 0; R.combo = 1; R.comboT = 0; R.overT = 0; R.pity = 6;
    if (resume && Save.run) { const r = Save.run; R.score = r.score; R.sector = r.sector; R.wave = r.wave; R.maxHull = r.maxHull; R.hull = r.hull; R.shield = r.shield; R.wpn = r.wpn; R.rkt = r.rkt; R.bombs = r.bombs; S.gain = r.gain; }
    else Save.run = null;
    Object.assign(Pl, { x: 0, y: 0, vx: 0, vy: 0, rx: 0, ry: 0, bank: 0, pitch: 0, inv: 1.4, fireT: 0, rktT: .6, recoil: 0, muzzle: 0, alive: true, novaCd: 0, tg: null, heat: 0 });
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

  // ---------- player ----------
  let tanV = .6, tanH = 1, ckKx = 1, ckKy = 1, ckOff = 0, ckShift = 0, ckTall = 0;
  function pShot(ox, oy, spread, dmg, heavy) {
    const b = pb.get(); if (!b) return;
    const px = Pl.x + ox, py = Pl.y - 1.1 + oy;
    let dx = aim.x + spread, dy = aim.y, dz = -1;
    const l = sqrt(dx * dx + dy * dy + dz * dz), sp = 680;
    b.x = px; b.y = py; b.z = -3; b.vx = dx / l * sp; b.vy = dy / l * sp; b.vz = dz / l * sp; b.dmg = dmg; b.heavy = heavy; b.t = 0;
  }
  const aim = { x: 0, y: 0 };
  function firePlayer() {
    switch (R.wpn) {
      case 1: pShot(0, 0, 0, 1, false); break;
      case 2: pShot(-1.5, 0, 0, 1, false); pShot(1.5, 0, 0, 1, false); break;
      case 3: pShot(0, 0, 0, 1, true); pShot(-2.2, -.2, 0, 1, false); pShot(2.2, -.2, 0, 1, false); break;
      case 4: pShot(-1, 0, 0, 1, true); pShot(1, 0, 0, 1, true); pShot(-3, -.3, -.012, 1, false); pShot(3, -.3, .012, 1, false); break;
      case 5: pShot(0, 0, 0, 2, true); pShot(-1.7, 0, -.006, 1, false); pShot(1.7, 0, .006, 1, false); pShot(-3.6, -.3, -.022, 1, false); pShot(3.6, -.3, .022, 1, false); break;
      default: pShot(-.9, 0, 0, 2, true); pShot(.9, 0, 0, 2, true); pShot(-2.5, -.15, -.008, 1, true); pShot(2.5, -.15, .008, 1, true); pShot(-4.1, -.3, -.026, 1, false); pShot(4.1, -.3, .026, 1, false); break;
    }
    Pl.recoil = min(1, Pl.recoil + .4); Pl.muzzle = .055; Snd.play('shot');
  }
  function launchRocket(side) {
    const r = rk.get(); if (!r) return;
    r.x = Pl.x + side * 4; r.y = Pl.y - 2; r.z = -2; r.vx = side * 46; r.vy = -14; r.vz = -120; r.t = 0; r.rt = 0; r.tg = null;
    Snd.play('rocket');
  }
  function useNova() {
    if (S.mode !== 'play' || !Pl.alive || R.bombs <= 0 || Pl.novaCd > 0 || S.novaT >= 0) return;
    R.bombs--; Pl.novaCd = 1; S.novaT = 0; S.nx = Pl.x; S.ny = Pl.y - 2; S.nz = -4;
    const l = sqrt(aim.x * aim.x + aim.y * aim.y + 1); S.nvx = aim.x / l * 300; S.nvy = aim.y / l * 300; S.nvz = -1 / l * 300;
    Snd.play('rocket');
  }
  function detonateNova() {
    addShake(.9); Snd.play('nova'); clearEnemyShots();
    for (let i = 0; i < bm.n; i++) if (bm.a[i].part < 0 || !B.active) bm.a[i].dead = true;
    for (let i = 0; i < en.n; i++) { const e = en.a[i]; if (!e.dead && e.z > -360) { e.shield = 0; hitEnemy(e, 24 + R.sector * 6); } }
    if (B.active && B.state === 'fight') {
      for (let i = 0; i < B.nparts; i++) if (B.parts[i].alive) bossDamage(34 + R.sector * 6, B.parts[i]);
      bossDamage(48 + R.sector * 10, null);
    }
    explosion(S.nx, S.ny, S.nz, 4, 0);
    addFx(FX.shock, S.nx, S.ny, S.nz, 16, 0, 0, 0);
  }
  let hurtT = 0;
  function hurtPlayer() {
    if (Pl.inv > 0 || !Pl.alive) return;
    R.chain = 0; R.combo = 1; R.comboT = 0; hurtT = .34;
    if (R.shield > 0) { R.shield--; Pl.inv = .85; addShake(.3); Snd.play('shieldHit'); return; }
    R.hull--; Pl.inv = 1.7; addShake(.65); Snd.play('hurt');
    if (R.hull <= 0 && !(DEBUG && G.god)) {
      Pl.alive = false; explosion(Pl.x, Pl.y, -9, 4, 0); addShake(1); S.slow = 1.1; S.deadT = 1.9; Snd.play('huge');
    } else if (R.hull <= 0) R.hull = R.maxHull;
  }
  function nearestTarget(x, y, z, aimBias) {
    let best = null, bd = 1e12;
    for (let i = 0; i < en.n; i++) {
      const e = en.a[i]; if (e.dead || e.z > -8 || e.z < -470) continue;
      let q;
      if (aimBias) { const d = -e.z, sx = (e.x - x) / d - aim.x, sy = (e.y - y) / d - aim.y; q = (sx * sx + sy * sy) * (e.def.rock !== undefined ? 1.8 : 1) + d * .000002; }
      else { const dx = e.x - x, dy = e.y - y, dz = e.z - z; q = (dx * dx + dy * dy + dz * dz) * (e.def.rock !== undefined ? 2.4 : 1); }
      if (q < bd) { bd = q; best = e; }
    }
    if (B.active && B.state === 'fight') {
      for (let j = -1; j < B.nparts; j++) {
        const o = j < 0 ? B : B.parts[j]; if (j >= 0 && !o.alive) continue;
        let q;
        if (aimBias) { const d = -o.z, sx = (o.x - x) / d - aim.x, sy = (o.y - y) / d - aim.y; q = sx * sx + sy * sy; }
        else { const dx = o.x - x, dy = o.y - y, dz = o.z - z; q = dx * dx + dy * dy + dz * dz; }
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
    let wantRx = Pl.rx, wantRy = Pl.ry;
    if (DEBUG && G.bot) { botInput(dt); wantRx = G.botAim.x; wantRy = G.botAim.y; const tx = G.botMove.x, ty = G.botMove.y, r = min(1, dt * 7); Pl.vx += (clamp((tx - Pl.x) * 8, -78, 78) - Pl.vx) * r; Pl.vy += (clamp((ty - Pl.y) * 8, -60, 60) - Pl.vy) * r; Pl.x += Pl.vx * dt; Pl.y += Pl.vy * dt; }
    else if (ptr.touchId !== null || ptr.dx || ptr.dy) {
      const k = .24 * 390 / min(innerWidth, 900);
      Pl.x += ptr.dx * k; Pl.y -= ptr.dy * k; ptr.dx = 0; ptr.dy = 0; Pl.vx = Pl.vy = 0;
      wantRx = Pl.x / XR * .4; wantRy = Pl.y / YR * .4;
    } else if (ptr.mouse && !ax && !ay) {
      wantRx = ptr.nx; wantRy = ptr.ny;
      const tx = ptr.nx * XR, ty = ptr.ny * YR, r = min(1, dt * 12);
      Pl.vx += (clamp((tx - Pl.x) * 7, -76, 76) - Pl.vx) * r; Pl.vy += (clamp((ty - Pl.y) * 7, -58, 58) - Pl.vy) * r; Pl.x += Pl.vx * dt; Pl.y += Pl.vy * dt;
    } else {
      const r = min(1, dt * ((ax || ay) ? 11 : 8));
      Pl.vx += (ax * 62 - Pl.vx) * r; Pl.vy += (ay * 48 - Pl.vy) * r; Pl.x += Pl.vx * dt; Pl.y += Pl.vy * dt;
      wantRx = Pl.x / XR * .42 + ax * .16; wantRy = Pl.y / YR * .42 + ay * .16;
    }
    Pl.x = clamp(Pl.x, -XR, XR); Pl.y = clamp(Pl.y, -YR, YR);
    Pl.rx += (wantRx - Pl.rx) * min(1, dt * 16); Pl.ry += (wantRy - Pl.ry) * min(1, dt * 16);
    const bx = clamp((Pl.x - ox) / max(dt, .001) / 70, -1, 1), by = clamp((Pl.y - oy) / max(dt, .001) / 56, -1, 1);
    Pl.bank += (bx - Pl.bank) * min(1, dt * 7); Pl.pitch += (by - Pl.pitch) * min(1, dt * 7);
    Pl.inv = max(0, Pl.inv - dt); Pl.recoil = max(0, Pl.recoil - dt * 7); Pl.muzzle = max(0, Pl.muzzle - dt); Pl.novaCd = max(0, Pl.novaCd - dt);
    R.overT = max(0, R.overT - dt);
    if (R.comboT > 0) { R.comboT -= dt; if (R.comboT <= 0) { R.chain = 0; R.combo = 1; } }
    // aim ray with assist: the reticle is pulled to the target it already covers
    let ax2 = Pl.rx * tanH, ay2 = Pl.ry * tanV;
    aim.x = ax2; aim.y = ay2;
    const tg = nearestTarget(Pl.x, Pl.y, 0, true);
    Pl.tg = null;
    if (tg) {
      const d = -tg.z, sx = (tg.x - Pl.x) / d, sy = (tg.y - Pl.y) / d, ex = sx - ax2, ey = sy - ay2, reach = ptr.mouse ? .1 : .3;
      if (ex * ex + ey * ey < reach * reach) { aim.x = sx; aim.y = sy; Pl.tg = tg; }
    }
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
    e.hp -= dmg; e.flash = .09;
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
        if (!segHit(ox, oy, oz, mx, my, mz, e.x, e.y, e.z, e.def.r * (.9 + -e.z * .0012))) continue;
        used = true;
        addFx(FX.hit, e.x + (b.x - e.x) * .4, e.y + (b.y - e.y) * .4, e.z + e.def.r * .6, 1 + -e.z * .004, 0, 0, e.vz * .5);
        if (e.shield > 0) { e.shield -= b.dmg; e.flash = .05; Snd.play('armor'); if (e.shield <= 0) { explosion(e.x, e.y, e.z + 8, 1); Snd.play('small'); } }
        else hitEnemy(e, b.dmg);
        break;
      }
      if (!used && B.active && B.state === 'fight') {
        for (let p = 0; p < B.nparts; p++) {
          const q = B.parts[p]; if (!q.alive) continue;
          if (segHit(ox, oy, oz, mx, my, mz, q.x, q.y, q.z, q.r * B.s)) { used = true; addFx(FX.hit, b.x, b.y, b.z, 1.6, 0, 0, 0); bossDamage(b.dmg, q); break; }
        }
        if (!used && segHit(ox, oy, oz, mx, my, mz, B.x, B.y, B.z, B.r * B.s)) { used = true; addFx(FX.hit, b.x, b.y, b.z, 1.6, 0, 0, 0); bossDamage(b.dmg, null); }
      }
      if (used) b.dead = true;
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
  function updEnemies(dt) {
    for (let i = 0; i < sq.n; i++) { const s = sq.a[i]; s.t -= dt; if (s.t <= 0) { s.dead = true; spawnEnemy(s.type, s.x, s.y, SPAWN_Z, s.path, s.a, s.b, s.c, s.d, s.e); } }
    sq.sweep();
    for (let i = 0; i < en.n; i++) {
      const e = en.a[i]; if (e.dead) continue;
      e.t += dt; e.flash = max(0, e.flash - dt); e.px = e.x; e.py = e.y;
      switch (e.path) {
        case 0: e.x += (e.vx + e.a) * dt; e.y += (e.vy + e.b) * dt; e.z += e.vz * dt; break;
        case 1: e.z += e.vz * dt; e.x = e.a + sin(e.t * e.b) * e.c; e.y = e.d + cos(e.t * e.b * .7) * e.c * .45; break;
        case 2:
          if (e.t < e.d) { e.z += (e.a - e.z) * min(1, dt * 1.5); e.x = e.b + sin(e.t * .85) * e.c; e.y = e.e + cos(e.t * .7) * e.c * .4; }
          else { e.z += e.vz * 1.7 * dt; e.x += (Pl.x - e.x) * min(1, dt * .35); e.y += (Pl.y - e.y) * min(1, dt * .35); }
          break;
        case 3: {
          const u = e.t * e.b;
          e.x = -e.a * 64 + e.a * 128 * u; e.y = e.d + sin(u * PI) * e.c; e.z = SPAWN_Z * .32 + sin(u * PI) * 60 - 34 - (1 - u) * 110 + u * 118;
          if (u > 1.02) e.dead = true;
          break;
        }
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
      else { const vx = (e.x - e.px) / max(dt, .001); e.bank += (clamp(-vx / 62, -.75, .75) - e.bank) * min(1, dt * 6); }
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
    for (let i = 0; i < pb.n; i++) { const b = pb.a[i]; b.t += dt; b.x += b.vx * dt; b.y += b.vy * dt; b.z += b.vz * dt; if (b.z < -600) b.dead = true; }
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
    pb.sweep(); rk.sweep(); eb.sweep(); en.sweep(); pu.sweep(); fx.sweep(); bm.sweep();
    S.shake = max(0, S.shake - dt * 2.5);
    if (!Pl.alive) { S.deadT -= dt; if (S.deadT <= 0) gameOver(); }
  }

  // ---------- hud (DOM only touched when a value changes) ----------
  let hudScore = -1, hudCombo = -1, hudWave = '', hudBoss = -1, hudNova = -1, hudPips = '', hurtShown = 0;
  function hudReset() { hudScore = hudCombo = hudBoss = hudNova = -1; hudWave = ''; hudPips = ''; }
  function pipRow(el, n, on, cls) { let h = ''; for (let i = 0; i < n; i++) h += '<i class="pip' + (i < on ? ' ' + cls : '') + '"></i>'; el.innerHTML = h; }
  function drawHud(dt) {
    if (R.score !== hudScore) { hudScore = R.score; $('hScore').textContent = R.score.toLocaleString(lang); }
    if (R.combo !== hudCombo) { hudCombo = R.combo; $('hCombo').textContent = R.combo > 1 ? '×' + R.combo : ''; }
    const w = R.sector + '/' + R.wave + lang + (B.active ? 'b' : '');
    if (w !== hudWave) { hudWave = w; $('hWave').textContent = t('sector') + ' ' + R.sector + (B.active ? '' : '  ·  ' + t('wave') + ' ' + min(R.wave, 5) + '/5'); }
    if (B.active) { const v = round(B.hp / B.maxHp * 200); if (v !== hudBoss) { hudBoss = v; $('hBossIn').style.transform = 'scaleX(' + v / 200 + ')'; } }
    if (R.bombs !== hudNova) { hudNova = R.bombs; $('novaN').textContent = R.bombs; $('btnNova').classList.toggle('empty', R.bombs <= 0); }
    const pips = R.hull + '|' + R.maxHull + '|' + R.shield + '|' + R.wpn + '|' + R.rkt;
    if (pips !== hudPips) { hudPips = pips; pipRow($('hHull'), R.maxHull, R.hull, 'h'); pipRow($('hShield'), 3, R.shield, 's'); pipRow($('hGun'), 6, R.wpn, 'w'); pipRow($('hRkt'), 3, R.rkt, 'r'); }
    if (msgLife > 0) { msgT += dt; if (msgT > msgLife) { msgLife = 0; $('hMsg').style.opacity = 0; } else if (msgT > msgLife - .35) $('hMsg').style.opacity = (msgLife - msgT) / .35; }
    if (pickT > 0) { pickT -= dt; if (pickT <= 0) $('hPick').style.opacity = 0; else if (pickT < .3) $('hPick').style.opacity = pickT / .3; }
    if (hurtT > 0 || hurtShown) { hurtT = max(0, hurtT - dt); const v = round(hurtT / .34 * 20) / 20; if (v !== hurtShown) { hurtShown = v; $('hurt').style.opacity = v * .75; } }
  }

  // ---------- render ----------
  const DUST_N = 110;
  const dust = new Float32Array(DUST_N * 3);
  for (let i = 0; i < DUST_N; i++) { dust[i * 3] = rnd(-130, 130); dust[i * 3 + 1] = rnd(-90, 90); dust[i * 3 + 2] = rnd(-420, 0); }
  const LED = { };
  const PICK_MODEL = { w: 'pick_w', r: 'pick_r', s: 'pick_s', h: 'pick_h', b: 'pick_b', o: 'pick_o', scrap: 'pick_scrap' };
  const EB_MODEL = ['bolt_e0', 'bolt_e1', 'bolt_e2', 'bolt_e3', 'bolt_e4'];
  const ROCK_NAMES = { rockS: ['rockS0', 'rockS1', 'rockS2'], rockM: ['rockM0', 'rockM1', 'rockM2'], rockL: ['rockL0', 'rockL1', 'rockL2'] };

  function drawBackdrop(dt, moving) {
    const s = SECTORS[S.sector];
    if (SkyU.uMix.value < 1) SkyU.uMix.value = min(1, SkyU.uMix.value + dt / 2.2);
    PlanetU.uSpin.value += dt * .012;
    const st = BT['station' + s.station];
    eulerQ(.25, S.clock * .05, S.clock * .035);
    st.push(s.sPos[0], s.sPos[1], s.sPos[2], Q.x, Q.y, Q.z, Q.w, s.sS, 0, 0, 0, 1);
    if (s.ring) { const r = BT[s.ring]; eulerQ(.42, .2, -.3); r.push(s.pPos[0], s.pPos[1], s.pPos[2], Q.x, Q.y, Q.z, Q.w, s.pS, 0, 0, 0, 0); }
    const b = BT.dust, sp = moving ? 150 : 34, e = U.uEye.value;
    for (let i = 0; i < DUST_N; i++) {
      let z = dust[i * 3 + 2] + sp * dt;
      if (z > 6) { z = -420; dust[i * 3] = e.x + rnd(-130, 130); dust[i * 3 + 1] = e.y + rnd(-90, 90); }
      dust[i * 3 + 2] = z;
      const ls = 1.2 + sp * .03;
      const near = (dust[i * 3] - e.x) ** 2 + (dust[i * 3 + 1] - e.y) ** 2 + z * z < 900;
      b.push(dust[i * 3], dust[i * 3 + 1], z, 0, 0, 0, 1, ls, 0, 0, 0, near ? (b.cnt[0] < b.lcap[0] ? 0 : 1) : 2);
    }
  }
  function drawWorld() {
    const tm = S.clock;
    for (let i = 0; i < en.n; i++) {
      const e = en.a[i]; if (e.dead) continue;
      const d = e.def, fade = min(1, e.t * 3 + .15), s = d.s * fade * (d.rock !== undefined ? 1.25 : 1.42);
      if (d.rock !== undefined) {
        eulerQ(e.rx, e.ry, e.rz);
        BT[ROCK_NAMES[e.type][e.vr]].push(e.x, e.y, e.z, Q.x, Q.y, Q.z, Q.w, s, 0, 0, e.flash > 0 ? 1 : 0);
      } else if (e.path === 5) {
        const dx = e.vx, dy = e.vy, dz = e.c || 1; aimQ(dx, dy, dz);
        pushClip(BT.srocket, 'idle', tm + e.phase, e.x, e.y, e.z, s, e.flash > 0 ? 1 : 0);
      } else {
        const dx = Pl.x - e.x, dy = Pl.y - e.y, dz = -e.z, yaw = atan2(dx, max(dz, 30)), pit = -atan2(dy, max(dz, 30));
        if (e.type === 'mine') eulerQ(e.rx, e.ry, e.rz); else eulerQ(pit * .6, yaw * .6, e.bank);
        pushClip(BT[d.m], 'idle', tm + e.phase, e.x, e.y, e.z, s, e.flash > 0 ? 1 : 0);
      }
    }
    if (B.active) drawBoss(tm);
    for (let i = 0; i < pb.n; i++) {
      const b = pb.a[i]; if (b.dead) continue;
      aimQ(b.vx, b.vy, b.vz);
      (b.heavy ? BT.bolt_h : BT.bolt_p).push(b.x, b.y, b.z, Q.x, Q.y, Q.z, Q.w, 1.25, 0, 0, 0);
    }
    for (let i = 0; i < eb.n; i++) {
      const b = eb.a[i]; if (b.dead) continue;
      if (b.kind === 0 || b.kind === 3) aimQ(b.vx, b.vy, b.vz); else eulerQ(b.t * 3, b.t * 4, 0);
      BT[EB_MODEL[b.kind]].push(b.x, b.y, b.z, Q.x, Q.y, Q.z, Q.w, 1.3 * clamp(-b.z / 40, .22, 1), 0, 0, 0);
    }
    if (Pl.alive && Pl.muzzle > 0) { eulerQ(0, 0, tm * 37); const ms = .55 + Pl.muzzle * 7; BT.bolt_muzzle.push(Pl.x - 1.9, Pl.y - 1.5, -5, Q.x, Q.y, Q.z, Q.w, ms, 0, 0, 0, 0); BT.bolt_muzzle.push(Pl.x + 1.9, Pl.y - 1.5, -5, Q.x, Q.y, Q.z, Q.w, ms, 0, 0, 0, 0); }
    for (let i = 0; i < rk.n; i++) { const r = rk.a[i]; if (r.dead) continue; aimQ(r.vx, r.vy, r.vz); pushClip(BT.rocket, 'idle', tm + i * .1, r.x, r.y, r.z, 1, 0); }
    if (S.novaT >= 0) { aimQ(S.nvx, S.nvy, S.nvz); pushClip(BT.nova, 'idle', tm, S.nx, S.ny, S.nz, 1.3, 0); }
    for (let i = 0; i < pu.n; i++) {
      const p = pu.a[i]; if (p.dead) continue;
      eulerQ(.3, p.t, 0);
      pushClip(BT[PICK_MODEL[p.kind]], 'idle', p.t, p.x, p.y, p.z, p.scrap ? 1.5 : 1.9, 0);
    }
    for (let i = 0; i < fx.n; i++) {
      const f = fx.a[i]; if (f.dead) continue;
      const b = fxBatch[f.m], c = b.def.clips.play;
      b.push(f.x, f.y, f.z, f.qx, f.qy, f.qz, f.qw, f.s, c.base, min(f.t * c.fps, c.frames - .001), 0);
    }
    for (let i = 0; i < bm.n; i++) {
      const b = bm.a[i]; if (b.dead) continue;
      const dx = b.tx - b.ox, dy = b.ty - b.oy, dz = 8 - b.oz, l = sqrt(dx * dx + dy * dy + dz * dz);
      aimQ(dx, dy, dz);
      const on = b.t >= b.warn, w = on ? b.w * (.9 + sin(b.t * 44) * .1) : .1 + b.t / b.warn * .16, bb = on ? BT.beam : BT.beam_warn;
      pushBeam(bb, (b.ox + b.tx) / 2, (b.oy + b.ty) / 2, (b.oz + 8) / 2, w, l);
    }
  }
  function pushBeam(bb, x, y, z, w, l) {
    // non-uniform matrix: thin across, long along the aim axis
    if (bb.cnt[0] >= bb.lcap[0]) return;
    bb.push(x, y, z, Q.x, Q.y, Q.z, Q.w, 1, 0, 0, 0, 0);
    const i = bb.cnt[0] - 1, m = bb.m[0], o = i * 16;
    for (let k = 0; k < 3; k++) { m[o + k] *= w; m[o + 4 + k] *= w; m[o + 8 + k] *= l; }
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
        const dx = Pl.x - p.x, dy = Pl.y - p.y, dz = -p.z; aimQ(dx, dy, dz);
        pushClip(BT.boss1_emitter, 'idle', tm + i, p.x, p.y, p.z, 1.45, p.flash > 0 ? 1 : 0);
      }
    } else {
      eulerQ(sin(tm * .5) * .02, sin(B.t * .4) * .1, 0);
      pushClip(BT.boss2_core, phase, time, B.x, B.y, B.z, s, f);
      const gunClip = B.state === 'dying' ? 'p2' : phase;
      for (let i = 0; i < 2; i++) {
        const p = B.parts[i]; if (!p.alive) continue;
        const dx = Pl.x - p.x, dy = Pl.y - p.y, dz = -p.z; aimQ(dx * .6, dy * .6, dz);
        pushClip(i ? BT.boss2_gunR : BT.boss2_gunL, gunClip, tm + i * .2, p.x, p.y, p.z, s, p.flash > 0 ? 1 : 0);
      }
    }
  }
  // Places a rigged control so that it rotates by Q around its own base point.
  function pivotPush(b, ox, oy, oz, px, py, pz, k, base, frame, lod) {
    const qx = Q.x, qy = Q.y, qz = Q.z, qw = Q.w, cx = qy * pz - qz * py + qw * px, cy = qz * px - qx * pz + qw * py, cz = qx * py - qy * px + qw * pz;
    const rx = px + 2 * (qy * cz - qz * cy), ry = py + 2 * (qz * cx - qx * cz), rz = pz + 2 * (qx * cy - qy * cx);
    b.push(ox + k * (px - rx), oy + k * (py - ry), oz + k * (pz - rz), qx, qy, qz, qw, k, base, frame, 0, lod);
  }
  // Cockpit is drawn in its own pass in camera space.
  function drawCockpit(tm) {
    const sway = 1;
    const cq = 1;
    void sway; void cq;
    Q.x = 0; Q.y = 0; Q.z = 0; Q.w = 1;
    const lod = TIER === 'phone' ? 1 : 0;
    const swx = -Pl.bank * .012, swy = -Pl.pitch * .008 - Pl.recoil * .003;
    BT.ck_shell.push(swx, swy, 0, 0, 0, 0, 1, 1, 0, 0, 0, lod);
    const HK = .6;
    eulerQ(-Pl.pitch * .16, 0, -Pl.bank * .2);
    const sc = Pl.firing ? BT.ck_stick.def.clips.fire : BT.ck_stick.def.clips.idle;
    pivotPush(BT.ck_stick, .275 - ckTall * .07 + swx, -.018 + ckTall * .075 + swy, -.222, 0, -.5, -.48, HK, sc.base, clipFrame(sc, tm), lod);
    eulerQ(Pl.heat * .1, 0, 0);
    const tc = BT.ck_throttle.def.clips.idle;
    pivotPush(BT.ck_throttle, .075 + ckTall * .14 + swx, -.04 + ckTall * .075 + swy, -.222, -.62, -.42, -.53, HK, tc.base, clipFrame(tc, tm), lod);
    eulerQ(1.05, 0, 0);
    const g = BT.ck_gauge_hull.def.clips.sweep, g2 = BT.ck_gauge_heat.def.clips.sweep;
    BT.ck_gauge_hull.push(-.44 + swx, -.222 + swy, -.86, Q.x, Q.y, Q.z, Q.w, 1.3, g.base, clamp(R.hull / max(R.maxHull, 1), 0, 1) * (g.frames - .001), 0, lod);
    BT.ck_gauge_heat.push(.44 + swx, -.222 + swy, -.86, Q.x, Q.y, Q.z, Q.w, 1.3, g2.base, clamp(Pl.heat, 0, 1) * (g2.frames - .001), 0, lod);
    for (let i = 0; i < 6; i++) {
      const bb = i < R.hull ? BT.ck_led_g : BT.ck_led_off;
      bb.push(-.27 + i * .026 + swx, -.291 + swy, -.85, Q.x, Q.y, Q.z, Q.w, 1, 0, 0, 0, 0);
    }
    for (let i = 0; i < 3; i++) { const bb = i < R.shield ? BT.ck_led_c : BT.ck_led_off; bb.push(.14 + i * .026 + swx, -.291 + swy, -.85, Q.x, Q.y, Q.z, Q.w, 1, 0, 0, 0, 0); }
    if (R.bombs > 0) BT.ck_led_a.push(.235 + swx, -.291 + swy, -.85, Q.x, Q.y, Q.z, Q.w, 1, 0, 0, 0, 0);
    if (R.hull <= 1 && tm % .7 < .35) BT.ck_led_r.push(-.3 + swx, -.291 + swy, -.85, Q.x, Q.y, Q.z, Q.w, 1, 0, 0, 0, 0);
    // reticle on the aim ray
    const dep = .86;
    Q.x = 0; Q.y = 0; Q.z = 0; Q.w = 1;
    BT.reticle.push(aim.x * dep * ckKx, (aim.y * ckKy + ckOff) * dep, -dep, 0, 0, 0, 1, Pl.tg ? .03 : .036, 0, 0, 0, 0);
    if (Pl.tg) {
      const g3 = Pl.tg, d = -g3.z, sx = (g3.x - Pl.x) / max(d, 1), sy = (g3.y - Pl.y) / max(d, 1), rr = (g3.def ? g3.def.r * g3.def.s : g3.r * B.s) / max(d, 1) * dep * 1.1;
      eulerQ(0, 0, tm * .9);
      BT.bracket.push(sx * dep * ckKx, (sy * ckKy + ckOff) * dep, -dep, Q.x, Q.y, Q.z, Q.w, clamp(rr, .03, .11), 0, 0, 0, 0);
    }
  }
  let shX = 0, shY = 0, roll = 0;
  function render(dt) {
    for (let i = 0; i < allBatches.length; i++) allBatches[i].begin();
    trisLeft = TRI_BUDGET;
    const playing = S.mode === 'play' || S.mode === 'paused';
    const e = U.uEye.value;
    if (playing) {
      shX = S.shake ? (random() - .5) * S.shake * 1.5 : 0; shY = S.shake ? (random() - .5) * S.shake * 1.5 : 0;
      roll += (-Pl.bank * .26 - roll) * min(1, dt * 8);
      camera.position.set(Pl.x + shX, Pl.y + shY, 0);
      camera.rotation.set(Pl.pitch * .1 + Pl.ry * .05, -Pl.rx * .07, roll);
      camera.updateMatrixWorld();
      e.copy(camera.position);
      trisLeft -= TIER === 'phone' ? 22000 : 34000; // cockpit is always drawn
      drawBackdrop(dt, S.mode === 'play');
      drawWorld();
      drawCockpit(S.clock);
    } else {
      // Menu and hangar: our own ship in orbit
      const a = S.clock * .25;
      camera.position.set(sin(a) * 15, 3.2 + sin(a * .7) * 1.2, cos(a) * 15);
      camera.rotation.set(0, 0, 0);
      camera.lookAt(0, -.2, 0);
      if (innerWidth > innerHeight) { const off = (S.mode === 'menu' ? -3.2 : 0); camera.position.x += cos(a) * off; camera.position.z -= sin(a) * off; }
      camera.updateMatrixWorld();
      e.copy(camera.position);
      drawBackdrop(dt, false);
      eulerQ(.06, 0, sin(S.clock * .4) * .05);
      const c = BT.player.def.clips.idle;
      BT.player.push(0, 0, 0, Q.x, Q.y, Q.z, Q.w, 1, c.base, clipFrame(c, S.clock), 0, 0);
    }
    for (let i = 0; i < allBatches.length; i++) allBatches[i].end();
    skyMesh.position.copy(camera.position);
    skyMesh.scale.setScalar(2000); skyMesh.updateMatrixWorld(true);
    renderer.info.reset();
    renderer.clear();
    renderer.render(scene, camera);
    if (playing) { renderer.clearDepth(); renderer.render(ckScene, ckCamera); }
  }

  // ---------- frame loop, adaptive resolution ----------
  let pr = PR_MAX, prT = 0, prN = 0, prSum = 0, lastTs = 0;
  function fit() {
    const w = innerWidth || 800, h = innerHeight || 600, asp = w / h;
    const halfH = (asp < 1.2 ? Math.atan(tan(27 * PI / 180) / max(asp, .4)) : 31 * PI / 180);
    const fov = clamp(halfH * 2 * 180 / PI, 56, 104);
    tanV = tan(fov * PI / 360); tanH = tanV * asp;
    if (renderer) { renderer.setPixelRatio(pr); renderer.setSize(w, h, false); }
    if (camera) {
      // Portrait: the cockpit keeps its true width and its dashboard is shifted to the bottom edge; the canopy bars above are clipped.
      const tall = asp < .8, ckTanV = tall ? .56 / asp : tan(min(fov, 80) * PI / 360), ckTanH = ckTanV * asp;
      camera.fov = fov; ckCamera.fov = 2 * Math.atan(ckTanV) * 180 / PI;
      for (const c of [camera, ckCamera]) { c.aspect = asp; c.updateProjectionMatrix(); }
      ckShift = tall ? 1 - .6 / ckTanV : 0; ckCamera.projectionMatrix.elements[9] = ckShift;
      ckCamera.projectionMatrixInverse.copy(ckCamera.projectionMatrix).invert();
      ckKx = ckTanH / tanH; ckKy = ckTanV / tanV; ckOff = ckShift * ckTanV; ckTall = tall ? 1 : 0; UClip.value = tall ? .25 : 99;
    }
  }
  addEventListener('resize', fit);
  addEventListener('orientationchange', () => setTimeout(fit, 120));

  const G = { S, R, Pl, B, en, eb, pb, pu, fx, Save, god: false, bot: false, botAim: { x: 0, y: 0 }, botMove: { x: 0, y: 0 }, frames: null, n: 0, peak: { calls: 0, tris: 0 }, lockPR: false };
  function botInput() {
    let best = null, bd = 1e12;
    for (let i = 0; i < en.n; i++) { const e = en.a[i]; if (e.dead || e.z > -14) continue; const q = e.z * e.z + (e.x - Pl.x) ** 2 * 12; if (q < bd) { bd = q; best = e; } }
    if (B.active && B.state === 'fight') { let o = B; for (let j = 0; j < B.nparts; j++) if (B.parts[j].alive) { o = B.parts[j]; break; } best = o; }
    if (best) { const d = max(-best.z, 8); G.botAim.x = clamp((best.x - Pl.x) / d / tanH, -1, 1); G.botAim.y = clamp((best.y - Pl.y) / d / tanV, -1, 1); }
    let mx = best ? clamp(best.x * .55, -XR, XR) : 0, my = best ? clamp(best.y * .55, -YR, YR) : 0;
    for (let i = 0; i < eb.n; i++) { const b = eb.a[i]; if (b.z < -70) continue; const dx = Pl.x - b.x, dy = Pl.y - b.y, q = dx * dx + dy * dy; if (q < 100) { mx += dx / (q + 1) * 34; my += dy / (q + 1) * 34; } }
    G.botMove.x = clamp(mx, -XR, XR); G.botMove.y = clamp(my, -YR, YR);
    if (eb.n > 90 && R.bombs > 0) useNova();
  }
  function frame(now) {
    requestAnimationFrame(frame);
    if (!lastTs) lastTs = now;
    const rawMs = now - lastTs; lastTs = now;
    const cpu0 = DEBUG ? performance.now() : 0;
    let real = min(.05, rawMs / 1000);
    S.clock += real;
    if (S.mode === 'play') {
      let dt = real;
      if (S.slow > 0) { S.slow -= real; dt *= .35; }
      step(dt); drawHud(real);
    }
    render(S.mode === 'paused' ? 0 : real);
    if (DEBUG && G.frames && G.n < G.frames.length) {
      G.cpu[G.n] = performance.now() - cpu0;
      if (rawMs > 33.4 && G.slow.length < 200) G.slow.push([round(now), round(rawMs), +G.cpu[G.n].toFixed(1), R.sector, R.wave, B.active ? B.state : '', fx.n, eb.n]);
      G.frames[G.n++] = rawMs;
      const inf = renderer.info.render;
      if (inf.calls > G.peak.calls) G.peak.calls = inf.calls;
      if (inf.triangles > G.peak.tris) G.peak.tris = inf.triangles;
    }
    if (!(DEBUG && G.lockPR)) {
      prSum += rawMs; prN++; prT += real;
      if (prT > 3.5) {
        const avg = prSum / prN;
        let np = pr;
        if (avg > 20) np = max(PR_MIN, pr - .2); else if (avg < 13 && pr < PR_MAX) np = min(PR_MAX, pr + .1);
        if (abs(np - pr) > .01) { pr = np; fit(); }
        prT = 0; prN = 0; prSum = 0;
      }
    }
  }

  window.__smokeStart = () => startRun(false);
  if (DEBUG) {
    window.__game = Object.assign(G, {
      tier: TIER,
      info: () => ({ calls: renderer.info.render.calls, tris: renderer.info.render.triangles, geos: renderer.info.memory.geometries, tex: renderer.info.memory.textures, pr }),
      startPerf(n) { G.frames = new Float32Array(n || 12000); G.cpu = new Float32Array(n || 12000); G.slow = []; G.n = 0; G.peak.calls = 0; G.peak.tris = 0; },
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
