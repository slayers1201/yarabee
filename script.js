/* ==========================================
   MALU MALU — script.js v5 (With Typing & Idle FX)
   Intro: 26s · Full lyric sync · Cinematic
   ========================================== */

const INTRO_DUR = 3;

/* ─── ELEMENTS ─────────────────────────── */
const audio  = document.getElementById('bgMusic');
const btnP   = document.getElementById('btnPlay');
const svgPl  = document.getElementById('svgPlay');
const svgPa  = document.getElementById('svgPause');
const mbEq   = document.getElementById('mbEq');
const iBeat  = document.getElementById('iBeat');
const mbTime = document.getElementById('mbTime');
const mbFill = document.getElementById('mbFill');
const mbTrack= document.getElementById('mbTrack');
const progBar= document.getElementById('progressBar');
const iCd    = document.getElementById('iCd');
const cdProg = document.getElementById('cdProg');
const cdLabel= document.getElementById('cdLabel');

let playing  = false;
let autoScroll = true;
let scrollLock = false;
let scrollTimer;

/* ─── TYPING EFFECT SETUP ──────────────── */
// Memecah teks jadi per huruf tanpa merusak tag HTML di dalamnya (kayak <em>)
function makeTyping(element) {
  const nodes = Array.from(element.childNodes);
  element.innerHTML = '';
  let charIndex = 0;
  const typingSpeed = 0.04; // Makin kecil makin cepet ngetiknya

  function process(node, parent) {
    if (node.nodeType === 3) { // Text node
      const text = node.nodeValue;
      for (let i = 0; i < text.length; i++) {
        const char = text[i];
        if (char === ' ') {
          parent.appendChild(document.createTextNode(' '));
        } else {
          const span = document.createElement('span');
          span.className = 'char';
          span.style.setProperty('--cd', `${charIndex * typingSpeed}s`);
          span.textContent = char;
          parent.appendChild(span);
          charIndex++;
        }
      }
    } else if (node.nodeType === 1) { // Element node
      const clone = node.cloneNode(false);
      parent.appendChild(clone);
      Array.from(node.childNodes).forEach(child => process(child, clone));
    }
  }
  nodes.forEach(n => process(n, element));
}

document.querySelectorAll('.lw, .pill').forEach(el => makeTyping(el));

/* ─── PLAY STATE ─────────────────────── */
function setPlay(v) {
  playing = v;
  svgPl.style.display = v ? 'none'  : 'block';
  svgPa.style.display = v ? 'block' : 'none';
  mbEq.classList.toggle('paused', !v);
  iBeat.classList.toggle('paused', !v);
}

btnP.addEventListener('click', toggle);
document.addEventListener('keydown', e => {
  if (e.code === 'Space') { e.preventDefault(); toggle(); }
  if (e.code === 'ArrowRight') seek(5);
  if (e.code === 'ArrowLeft')  seek(-5);
});

function toggle() {
  if (playing) { audio.pause(); setPlay(false); }
  else audio.play().then(() => setPlay(true)).catch(() => {});
}
function seek(d) { audio.currentTime = Math.max(0, Math.min(audio.duration || 0, audio.currentTime + d)); }

['click','touchstart'].forEach(ev => {
  document.addEventListener(ev, () => {
    if (!playing && audio.readyState >= 1)
      audio.play().then(() => setPlay(true)).catch(() => {});
  }, { once: true });
});

/* ─── SEEK TRACK ───────────────────────── */
mbTrack.addEventListener('click', e => {
  if (!audio.duration) return;
  const r = mbTrack.getBoundingClientRect();
  audio.currentTime = ((e.clientX - r.left) / r.width) * audio.duration;
});

const fmt = s => `${Math.floor(s/60)}:${String(Math.floor(s%60)).padStart(2,'0')}`;

const timedEls = [...document.querySelectorAll('[data-t]')]
  .map(el => ({ el, t: parseFloat(el.dataset.t) }))
  .sort((a, b) => a.t - b.t);

const allScenes    = [...document.querySelectorAll('.scene')];
const lyricScenes  = [...document.querySelectorAll('.scene[data-time]')]
  .filter(s => parseFloat(s.dataset.time) > 0)
  .map(s => ({ sc: s, t: parseFloat(s.dataset.time) }))
  .sort((a, b) => a.t - b.t);

let lastScene = null;

/* ─── IDLE PARTICLES SETUP ─────────────── */
const idlePool = document.getElementById('idleParticles');
const idleEmojis = ['🎵', '🎶', '🫧', '💭', '✨'];
let lastIdleSpawn = 0;

function spawnIdleParticle() {
  if (!idlePool) return;
  const pt = document.createElement('div');
  pt.className = 'idle-pt';
  pt.textContent = idleEmojis[Math.floor(Math.random() * idleEmojis.length)];
  pt.style.left = `${10 + Math.random() * 80}%`;
  pt.style.bottom = `${5 + Math.random() * 20}%`;
  idlePool.appendChild(pt);
  setTimeout(() => pt.remove(), 4800);
}

/* ─── MAIN TIME UPDATE ──────────────────── */
audio.addEventListener('timeupdate', () => {
  const now = audio.currentTime;
  const dur = audio.duration || 1;
  const pct = now / dur * 100;

  progBar.style.width = pct + '%';
  mbFill.style.width  = pct + '%';
  mbTime.textContent  = fmt(now);

  if (now < INTRO_DUR) {
    iCd.classList.add('show');
    cdProg.style.width = (now / INTRO_DUR * 100) + '%';
    const rem = Math.ceil(INTRO_DUR - now);
    if (rem > 3) {
      cdLabel.textContent = rem > 1 ? `🎵 ${rem}...` : `🌸 let's go!`;
    } else {
      cdLabel.textContent = `🌸 let's go!`;
    }
  } else {
    iCd.classList.remove('show');
  }

  let isAnyActive = false; // Deteksi apa ada teks yg lagi nyala

  timedEls.forEach(({ el, t }) => {
    if (now >= t && !el.classList.contains('vis')) {
      el.classList.add('vis');
      burstAt(el);
    }
    const active = now >= t && now < t + 4.5;
    if (active) isAnyActive = true;
    
    const wasAct = el.classList.contains('act');
    if (active !== wasAct) {
      el.classList.toggle('act', active);
      if (active) beatPulse();
    }
  });

  // JEDA ANIMATION: Kalau musik nyala & gaada vokal/lirik aktif -> keluarin partikel melayang
  if (playing && !isAnyActive && now > 0) {
    if (now - lastIdleSpawn > 0.8) {
      spawnIdleParticle();
      lastIdleSpawn = now;
    }
  }

  lyricScenes.forEach(({ sc, t }) => {
    if (now >= t - 2) sc.classList.add('vis');
  });
  
  const outro = document.querySelector('.s-outro');
  if (dur && now >= dur - 25) outro?.classList.add('vis');

  if (autoScroll && !scrollLock) {
    let tgt = null;
    for (let i = lyricScenes.length - 1; i >= 0; i--) {
      if (now >= lyricScenes[i].t - 1) { tgt = lyricScenes[i].sc; break; }
    }
    if (tgt && tgt !== lastScene) {
      lastScene = tgt;
      tgt.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }
});

/* ─── BEAT PULSE ────────────────────────── */
function beatPulse() {
  document.body.style.transition = 'background .08s';
  document.body.style.background = 'rgba(244,114,182,.015)';
  setTimeout(() => document.body.style.background = '', 80);
}

/* ─── EMOJI BURST ───────────────────────── */
const burstPool = document.getElementById('emojiBurst');
const burstEmojis = ['🌸','💗','✨','💜','🌷','💫','🥺','🫶','❤️','💝','⭐','🎀'];

function burstAt(el) {
  if (!el.getBoundingClientRect) return;
  const r  = el.getBoundingClientRect();
  const cx = r.left + r.width / 2;
  const cy = r.top  + r.height / 2;
  const n  = 6;
  for (let i = 0; i < n; i++) {
    const span = document.createElement('span');
    span.className = 'be';
    const angle = (Math.PI * 2 / n) * i + Math.random() * .6;
    const dist  = 50 + Math.random() * 90;
    span.style.cssText = `
      left:${cx}px;top:${cy}px;
      --tx:${Math.cos(angle) * dist}px;
      --ty:${Math.sin(angle) * dist}px;
      --rot:${Math.random()*380}deg;
    `;
    span.textContent = burstEmojis[Math.floor(Math.random()*burstEmojis.length)];
    burstPool.appendChild(span);
    setTimeout(() => span.remove(), 950);
  }
}

/* ─── NAV DOTS ──────────────────────────── */
const navDotsEl = document.getElementById('navDots');
allScenes.forEach((sc, i) => {
  const d = document.createElement('div');
  d.className = 'nd';
  d.addEventListener('click', () => {
    scrollLock = true;
    sc.scrollIntoView({ behavior: 'smooth', block: 'center' });
    const t = parseFloat(sc.dataset.time);
    if (!isNaN(t) && t > 0) audio.currentTime = t;
    setTimeout(() => { scrollLock = false; }, 3000);
  });
  navDotsEl.appendChild(d);
});

function updateDots() {
  const mid = window.scrollY + window.innerHeight * .5;
  let act = 0;
  allScenes.forEach((sc, i) => {
    if (sc.getBoundingClientRect().top + window.scrollY <= mid) act = i;
  });
  document.querySelectorAll('.nd').forEach((d, i) => d.classList.toggle('act', i === act));
}
updateDots();

window.addEventListener('scroll', () => {
  scrollLock = true;
  clearTimeout(scrollTimer);
  scrollTimer = setTimeout(() => { scrollLock = false; }, 4000);
  updateDots();
}, { passive: true });

/* ─── INTERSECTION OBSERVER ─────────────── */
const revObs = new IntersectionObserver(entries => {
  entries.forEach(e => {
    if (!e.isIntersecting) return;
    e.target.classList.add('vis');
    const now = audio.currentTime;
    e.target.querySelectorAll('[data-t]').forEach(el => {
      if (now >= parseFloat(el.dataset.t)) el.classList.add('vis');
    });
  });
}, { threshold: .12 });

document.querySelectorAll('.s-lyric,.s-outro').forEach(s => revObs.observe(s));
document.getElementById('sc0')?.classList.add('vis');

/* ─── 3D TILT ───────────────────────────── */
document.querySelectorAll('.tilt3d').forEach(card => {
  const glow = card.querySelector('.pc-glow');
  card.addEventListener('mousemove', e => {
    const r  = card.getBoundingClientRect();
    const dx = (e.clientX - r.left - r.width  / 2) / (r.width  / 2);
    const dy = (e.clientY - r.top  - r.height / 2) / (r.height / 2);
    card.style.transform = `perspective(900px) rotateY(${dx*20}deg) rotateX(${-dy*20}deg) scale3d(1.05,1.05,1.05)`;
    if (glow) glow.style.background = `radial-gradient(ellipse at ${50+dx*30}% ${50+dy*30}%,rgba(244,114,182,.45),transparent 70%)`;
  });
  card.addEventListener('mouseleave', () => {
    card.style.transform = '';
    if (glow) glow.style.background = '';
  });
});

if (typeof DeviceOrientationEvent !== 'undefined') {
  window.addEventListener('deviceorientation', e => {
    document.querySelectorAll('.tilt3d').forEach(c => {
      c.style.transform = `perspective(900px) rotateY(${(e.gamma||0)/3}deg) rotateX(${-(e.beta-45||0)/3}deg)`;
    });
  });
}

document.querySelectorAll('.pc-frame img').forEach(img => {
  img.addEventListener('error', () => img.style.display = 'none');
  if (img.complete && !img.naturalWidth) img.style.display = 'none';
});

document.querySelectorAll('.photo-card').forEach(card => {
  const wrap = card.querySelector('.pc-sparkles');
  if (!wrap) return;
  card.addEventListener('mouseenter', () => {
    for (let i = 0; i < 10; i++) {
      const sp = document.createElement('div');
      const angle = Math.random() * 360;
      const dist  = 60 + Math.random() * 110;
      const size  = 3 + Math.random() * 7;
      sp.style.cssText = `
        position:absolute;width:${size}px;height:${size}px;border-radius:50%;
        background:${Math.random()>.5?'#f472b6':'#a855f7'};
        left:50%;top:50%;
        box-shadow:0 0 8px 2px rgba(244,114,182,.5);
        transform:translate(-50%,-50%);
        animation:spkOut .9s cubic-bezier(.22,.6,.36,1) forwards;
        --ax:${Math.cos(angle*Math.PI/180)*dist}px;
        --ay:${Math.sin(angle*Math.PI/180)*dist}px;
        pointer-events:none;
      `;
      wrap.appendChild(sp);
      setTimeout(() => sp.remove(), 950);
    }
  });
});

(function () {
  const canvas = document.getElementById('bgCanvas');
  const ctx    = canvas.getContext('2d');
  let W, H;
  const orbs = [
    { x:.15, y:.15, rx:.55, ry:.35, hue:275, vx:.00035, vy:.00025, rot:0, vr:.0004 },
    { x:.85, y:.70, rx:.48, ry:.3,  hue:320, vx:-.0003, vy:.0003,  rot:.5,vr:-.0005 },
    { x:.5,  y:.95, rx:.42, ry:.28, hue:250, vx:.0003,  vy:-.00028,rot:1, vr:.0003 },
    { x:.08, y:.75, rx:.32, ry:.22, hue:300, vx:.0004,  vy:-.0002, rot:2, vr:.0004 },
    { x:.92, y:.2,  rx:.3,  ry:.2,  hue:200, vx:-.0002, vy:.0003,  rot:.3,vr:-.0003 },
  ];

  function resize() { W = canvas.width = window.innerWidth; H = canvas.height = window.innerHeight; }

  function draw() {
    ctx.clearRect(0, 0, W, H);
    orbs.forEach(o => {
      const ox = o.x * W, oy = o.y * H;
      const rx = o.rx * Math.min(W,H), ry = o.ry * Math.min(W,H);
      ctx.save();
      ctx.translate(ox, oy);
      ctx.rotate(o.rot);
      const g = ctx.createRadialGradient(0,0,0,0,0,rx);
      g.addColorStop(0, `hsla(${o.hue},80%,55%,.18)`);
      g.addColorStop(.5,`hsla(${o.hue+20},70%,50%,.08)`);
      g.addColorStop(1, `hsla(${o.hue},80%,55%,0)`);
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.ellipse(0, 0, rx, ry, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
      o.x += o.vx; o.y += o.vy; o.rot += o.vr;
      if (o.x < 0 || o.x > 1) o.vx *= -1;
      if (o.y < 0 || o.y > 1) o.vy *= -1;
    });
    requestAnimationFrame(draw);
  }

  window.addEventListener('resize', resize);
  resize(); draw();
})();

(function () {
  const wrap = document.getElementById('lightRays');
  const n = window.innerWidth < 768 ? 8 : 16;
  for (let i = 0; i < n; i++) {
    const ray = document.createElement('div');
    ray.className = 'ray';
    const angle = -60 + Math.random() * 120;
    const height = 60 + Math.random() * 60;
    const left   = 5  + Math.random() * 90;
    ray.style.cssText = `
      left:${left}%;top:0;
      height:${height}vh;
      --ra:${angle}deg;
      width:${1+Math.random()*3}px;
      opacity:${.3+Math.random()*.7};
      animation-duration:${5+Math.random()*8}s;
      animation-delay:-${Math.random()*10}s;
    `;
    wrap.appendChild(ray);
  }
})();

(function () {
  const wrap = document.getElementById('particleLayer');
  const clrs = [
    'rgba(244,114,182,.7)','rgba(168,85,247,.6)',
    'rgba(251,113,133,.5)','rgba(233,213,255,.45)',
    'rgba(255,182,215,.55)','rgba(192,132,252,.5)',
  ];
  const n = window.innerWidth < 768 ? 18 : 40;
  for (let i = 0; i < n; i++) {
    const p = document.createElement('div');
    p.className = 'pt';
    const sz = 2 + Math.random() * 10;
    p.style.cssText = `
      left:${Math.random()*100}%;
      width:${sz}px;height:${sz}px;
      background:${clrs[Math.floor(Math.random()*clrs.length)]};
      filter:blur(${Math.random()>.5?0:1}px);
      box-shadow:0 0 ${sz*2}px ${clrs[Math.floor(Math.random()*clrs.length)]};
      animation-duration:${8+Math.random()*16}s;
      animation-delay:-${Math.random()*22}s;
    `;
    wrap.appendChild(p);
  }
})();

(function () {
  const wrap = document.getElementById('emojiRain');
  const emos = ['🌸','💗','✨','💜','🌷','🥺','💫','🫶','💝','🌺','⭐','🎀','💖','😍','🌹','💞','🩷','🪷'];
  const n = window.innerWidth < 768 ? 14 : 30;
  for (let i = 0; i < n; i++) {
    const e = document.createElement('div');
    e.className = 'er';
    e.textContent = emos[Math.floor(Math.random()*emos.length)];
    e.style.cssText = `
      left:${Math.random()*100}%;
      font-size:${12+Math.random()*18}px;
      animation-duration:${12+Math.random()*22}s;
      animation-delay:-${Math.random()*28}s;
    `;
    wrap.appendChild(e);
  }
})();

document.head.insertAdjacentHTML('beforeend', `<style>
@keyframes spkOut{
  0%  {opacity:1;transform:translate(-50%,-50%) scale(1.2)}
  100%{opacity:0;transform:translate(calc(-50% + var(--ax)),calc(-50% + var(--ay))) scale(.1)}
}
</style>`);

document.addEventListener('mousemove', e => {
  const dx = (e.clientX/window.innerWidth  - .5) * 2;
  const dy = (e.clientY/window.innerHeight - .5) * 2;
  const t  = document.querySelector('.i-title-wrap');
  if (t) t.style.transform = `translate(${dx*8}px,${dy*6}px)`;
  const o = document.getElementById('orbit');
  if (o) o.style.transform = `translate(${-dx*12}px,${-dy*8}px)`;
});
// Bikin container untuk animasinya
const flyingContainer = document.createElement('div');
flyingContainer.id = 'flying-container';
document.body.appendChild(flyingContainer);

// Masukin URL foto/icon yang mau diterbangin di sini
const images = [
    'https://cdn-icons-png.flaticon.com/512/3264/3264301.png', // Contoh Icon Nada
    'https://cdn-icons-png.flaticon.com/512/833/833472.png'    // Contoh Icon Bintang/Hati
];

let isJeda = false;
let jedaInterval;

// Fungsi untuk mulai animasi terbang
function startFlyingAnimation() {
    if (isJeda) return;
    isJeda = true;
    
    jedaInterval = setInterval(() => {
        const item = document.createElement('div');
        item.classList.add('flying-item');
        
        // Posisi random di layar (horizontal)
        item.style.left = Math.random() * 90 + 'vw';
        
        // Gambar random dari array images
        const randomImg = images[Math.floor(Math.random() * images.length)];
        item.style.backgroundImage = `url(${randomImg})`;
        
        // Ukuran random (30px - 70px) biar lebih dinamis
        const size = Math.random() * 40 + 30; 
        item.style.width = size + 'px';
        item.style.height = size + 'px';
        
        // Kecepatan terbang random (4 - 7 detik)
        const duration = Math.random() * 3 + 4; 
        item.style.animationDuration = duration + 's';
        
        flyingContainer.appendChild(item);
        
        // Hapus elemen kalau udah selesai terbang biar web ga berat
        setTimeout(() => {
            item.remove();
        }, duration * 1000);
        
    }, 400); // Munculin item tiap 0.4 detik
}

// Fungsi untuk berhentiin animasi saat lirik mulai lagi
function stopFlyingAnimation() {
    isJeda = false;
    clearInterval(jedaInterval);
}

// CONTOH PENGGUNAAN PADA AUDIO LU:
// Misal lu punya element audio, masukin logic ini di event 'timeupdate'
// audio.addEventListener('timeupdate', () => {
//     const currentTime = audio.currentTime;
//     
//     // Tentukan detik ke berapa aja jeda instrumental terjadi
//     // Contoh: Jeda ada di detik 45 s/d 55, dan 120 s/d 135
//     if ((currentTime >= 45 && currentTime <= 55) || (currentTime >= 120 && currentTime <= 135)) {
//         startFlyingAnimation();
//     } else {
//         stopFlyingAnimation();
//     }
// });
