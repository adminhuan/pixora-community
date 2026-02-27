// Batch seed components into Component Plaza
const API = 'https://pixora.vip/api/v1';

async function login() {
  const res = await fetch(`${API}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ identifier: 'admin', password: 'Admin123456' }),
  });
  const data = await res.json();
  return data.data.accessToken;
}

async function create(token, component) {
  const res = await fetch(`${API}/snippets`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(component),
  });
  const data = await res.json();
  if (data.success) {
    console.log(`  OK: ${component.title}`);
  } else {
    console.log(`  FAIL: ${component.title} → ${data.error?.message || 'unknown'}`);
  }
}

const COMPONENTS = [
  // ——— BUTTONS ———
  {
    title: 'Glow Pulse Button',
    type: 'component',
    category: 'buttons',
    framework: 'css',
    tags: ['button', 'glow', 'animation'],
    files: [
      { filename: 'index.html', content: '<button class="glow-btn">Hover Me</button>' },
      {
        filename: 'style.css',
        content: `.glow-btn {
  position: relative;
  padding: 14px 36px;
  font-size: 15px;
  font-weight: 600;
  color: #fff;
  background: #2563EB;
  border: none;
  border-radius: 10px;
  cursor: pointer;
  overflow: hidden;
  transition: all 0.3s ease;
}
.glow-btn::before {
  content: "";
  position: absolute;
  top: -2px; left: -2px; right: -2px; bottom: -2px;
  background: linear-gradient(45deg, #3B82F6, #06B6D4, #3B82F6);
  border-radius: 12px;
  z-index: -1;
  opacity: 0;
  transition: opacity 0.3s;
  filter: blur(8px);
}
.glow-btn:hover::before {
  opacity: 1;
  animation: glow-rotate 2s linear infinite;
}
.glow-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 25px rgba(37, 99, 235, 0.4);
}
@keyframes glow-rotate {
  to { filter: blur(8px) hue-rotate(360deg); }
}`,
      },
    ],
  },
  {
    title: 'Liquid Fill Button',
    type: 'component',
    category: 'buttons',
    framework: 'css',
    tags: ['button', 'liquid', 'hover'],
    files: [
      { filename: 'index.html', content: '<button class="liquid-btn"><span>Get Started</span></button>' },
      {
        filename: 'style.css',
        content: `.liquid-btn {
  position: relative;
  padding: 14px 40px;
  font-size: 15px;
  font-weight: 600;
  color: #3B82F6;
  background: transparent;
  border: 2px solid #3B82F6;
  border-radius: 8px;
  cursor: pointer;
  overflow: hidden;
  transition: color 0.4s ease;
}
.liquid-btn span { position: relative; z-index: 1; }
.liquid-btn::before {
  content: "";
  position: absolute;
  bottom: -100%;
  left: 0;
  width: 100%;
  height: 100%;
  background: #3B82F6;
  transition: bottom 0.4s ease;
}
.liquid-btn:hover::before { bottom: 0; }
.liquid-btn:hover { color: #fff; }`,
      },
    ],
  },
  {
    title: 'Neon Border Button',
    type: 'component',
    category: 'buttons',
    framework: 'css',
    tags: ['button', 'neon', 'border'],
    files: [
      { filename: 'index.html', content: '<button class="neon-btn">Neon Click</button>' },
      {
        filename: 'style.css',
        content: `.neon-btn {
  padding: 12px 32px;
  font-size: 14px;
  font-weight: 600;
  letter-spacing: 0.5px;
  color: #22D3EE;
  background: transparent;
  border: 1px solid #22D3EE;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.25s ease;
  text-transform: uppercase;
}
.neon-btn:hover {
  color: #fff;
  background: rgba(34, 211, 238, 0.1);
  box-shadow: 0 0 12px rgba(34, 211, 238, 0.4), 0 0 40px rgba(34, 211, 238, 0.15), inset 0 0 12px rgba(34, 211, 238, 0.1);
  text-shadow: 0 0 8px rgba(34, 211, 238, 0.6);
}
.neon-btn:active { transform: scale(0.97); }`,
      },
    ],
  },
  {
    title: 'Magnetic 3D Button',
    type: 'component',
    category: 'buttons',
    framework: 'css',
    tags: ['button', '3d', 'press'],
    files: [
      { filename: 'index.html', content: '<button class="mag-btn">Press Me</button>' },
      {
        filename: 'style.css',
        content: `.mag-btn {
  padding: 14px 36px;
  font-size: 15px;
  font-weight: 700;
  color: #fff;
  background: linear-gradient(180deg, #3B82F6, #2563EB);
  border: none;
  border-radius: 10px;
  cursor: pointer;
  box-shadow: 0 6px 0 #1D4ED8, 0 8px 16px rgba(37, 99, 235, 0.35);
  transition: all 0.1s ease;
}
.mag-btn:hover {
  box-shadow: 0 4px 0 #1D4ED8, 0 6px 12px rgba(37, 99, 235, 0.35);
  transform: translateY(2px);
}
.mag-btn:active {
  box-shadow: 0 1px 0 #1D4ED8, 0 2px 4px rgba(37, 99, 235, 0.3);
  transform: translateY(5px);
}`,
      },
    ],
  },
  {
    title: 'Shimmer Slide Button',
    type: 'component',
    category: 'buttons',
    framework: 'css',
    tags: ['button', 'shimmer', 'slide'],
    files: [
      { filename: 'index.html', content: '<button class="shimmer-btn">Explore Now</button>' },
      {
        filename: 'style.css',
        content: `.shimmer-btn {
  position: relative;
  padding: 14px 40px;
  font-size: 15px;
  font-weight: 600;
  color: #fff;
  background: linear-gradient(135deg, #1E40AF, #3B82F6);
  border: none;
  border-radius: 8px;
  cursor: pointer;
  overflow: hidden;
}
.shimmer-btn::after {
  content: "";
  position: absolute;
  top: 0; left: -100%;
  width: 60%; height: 100%;
  background: linear-gradient(90deg, transparent, rgba(255,255,255,0.25), transparent);
  animation: shimmer-slide 2.5s ease-in-out infinite;
}
@keyframes shimmer-slide {
  0% { left: -100%; }
  50%, 100% { left: 120%; }
}
.shimmer-btn:hover {
  transform: translateY(-1px);
  box-shadow: 0 6px 20px rgba(59, 130, 246, 0.4);
}`,
      },
    ],
  },

  // ——— CARDS ———
  {
    title: 'Glass Morphism Card',
    type: 'component',
    category: 'cards',
    framework: 'css',
    tags: ['card', 'glass', 'blur'],
    files: [
      {
        filename: 'index.html',
        content: `<div class="glass-card">
  <div class="glass-icon">&#9670;</div>
  <h3 class="glass-title">Premium Plan</h3>
  <p class="glass-desc">Access all features with unlimited usage and priority support.</p>
  <div class="glass-price">$29<span>/mo</span></div>
</div>`,
      },
      {
        filename: 'style.css',
        content: `body { background: linear-gradient(135deg, #0F172A, #1E293B); display: flex; justify-content: center; align-items: center; min-height: 100vh; font-family: system-ui, sans-serif; }
.glass-card {
  width: 280px; padding: 32px;
  background: rgba(255, 255, 255, 0.06);
  backdrop-filter: blur(16px);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 16px;
  text-align: center; color: #e2e8f0;
  transition: transform 0.3s, border-color 0.3s;
}
.glass-card:hover { transform: translateY(-4px); border-color: rgba(59, 130, 246, 0.4); }
.glass-icon { font-size: 32px; color: #3B82F6; margin-bottom: 12px; }
.glass-title { font-size: 20px; font-weight: 700; margin-bottom: 8px; }
.glass-desc { font-size: 14px; color: #94a3b8; line-height: 1.5; margin-bottom: 20px; }
.glass-price { font-size: 36px; font-weight: 800; color: #3B82F6; }
.glass-price span { font-size: 14px; font-weight: 400; color: #64748b; }`,
      },
    ],
  },
  {
    title: 'Hover Tilt Card',
    type: 'component',
    category: 'cards',
    framework: 'css',
    tags: ['card', 'tilt', 'hover', '3d'],
    files: [
      {
        filename: 'index.html',
        content: `<div class="tilt-card">
  <div class="tilt-header">01</div>
  <h3 class="tilt-title">Design System</h3>
  <p class="tilt-text">Build consistent interfaces with reusable tokens and components.</p>
  <div class="tilt-footer">Learn more &rarr;</div>
</div>`,
      },
      {
        filename: 'style.css',
        content: `body { background: #0B1120; display: flex; justify-content: center; align-items: center; min-height: 100vh; font-family: system-ui, sans-serif; }
.tilt-card {
  width: 300px; padding: 28px;
  background: #111827;
  border: 1px solid rgba(255,255,255,0.06);
  border-radius: 14px; color: #e2e8f0;
  transition: transform 0.4s cubic-bezier(0.25,0.8,0.25,1), box-shadow 0.4s;
  cursor: pointer;
}
.tilt-card:hover {
  transform: perspective(800px) rotateY(-5deg) rotateX(3deg) translateY(-6px);
  box-shadow: 12px 16px 40px rgba(0,0,0,0.4);
}
.tilt-header { font-size: 48px; font-weight: 900; color: rgba(59,130,246,0.2); line-height: 1; margin-bottom: 12px; }
.tilt-title { font-size: 18px; font-weight: 700; margin-bottom: 8px; }
.tilt-text { font-size: 14px; color: #94a3b8; line-height: 1.5; margin-bottom: 16px; }
.tilt-footer { font-size: 13px; color: #3B82F6; font-weight: 500; }`,
      },
    ],
  },
  {
    title: 'Gradient Border Card',
    type: 'component',
    category: 'cards',
    framework: 'css',
    tags: ['card', 'gradient', 'border'],
    files: [
      {
        filename: 'index.html',
        content: `<div class="gbc-wrap">
  <div class="gbc-card">
    <h3>Analytics</h3>
    <p class="gbc-num">12,847</p>
    <p class="gbc-label">Total visitors this month</p>
    <div class="gbc-bar"><div class="gbc-fill"></div></div>
  </div>
</div>`,
      },
      {
        filename: 'style.css',
        content: `body { background: #0B1120; display: flex; justify-content: center; align-items: center; min-height: 100vh; font-family: system-ui, sans-serif; }
.gbc-wrap {
  padding: 2px; border-radius: 14px;
  background: linear-gradient(135deg, #3B82F6, #06B6D4, #3B82F6);
  background-size: 200% 200%;
  animation: gbc-move 3s ease infinite;
}
@keyframes gbc-move { 0%, 100% { background-position: 0% 50%; } 50% { background-position: 100% 50%; } }
.gbc-card { background: #111827; border-radius: 12px; padding: 24px; color: #e2e8f0; width: 260px; }
.gbc-card h3 { font-size: 13px; text-transform: uppercase; letter-spacing: 0.05em; color: #64748b; margin-bottom: 8px; }
.gbc-num { font-size: 32px; font-weight: 800; margin-bottom: 4px; }
.gbc-label { font-size: 13px; color: #94a3b8; margin-bottom: 16px; }
.gbc-bar { height: 6px; background: rgba(255,255,255,0.06); border-radius: 3px; overflow: hidden; }
.gbc-fill { width: 72%; height: 100%; background: linear-gradient(90deg, #3B82F6, #06B6D4); border-radius: 3px; }`,
      },
    ],
  },
  {
    title: 'Profile Hover Card',
    type: 'component',
    category: 'cards',
    framework: 'css',
    tags: ['card', 'profile', 'hover'],
    files: [
      {
        filename: 'index.html',
        content: `<div class="pf-card">
  <div class="pf-avatar">JD</div>
  <h3 class="pf-name">Jane Doe</h3>
  <p class="pf-role">Senior Developer</p>
  <div class="pf-stats">
    <div><strong>142</strong><span>Posts</span></div>
    <div><strong>8.2k</strong><span>Followers</span></div>
    <div><strong>291</strong><span>Following</span></div>
  </div>
  <button class="pf-follow">Follow</button>
</div>`,
      },
      {
        filename: 'style.css',
        content: `body { background: #0B1120; display: flex; justify-content: center; align-items: center; min-height: 100vh; font-family: system-ui, sans-serif; }
.pf-card { width: 260px; text-align: center; padding: 28px; background: #111827; border: 1px solid rgba(255,255,255,0.06); border-radius: 16px; color: #e2e8f0; transition: transform 0.3s; }
.pf-card:hover { transform: translateY(-4px); }
.pf-avatar { width: 64px; height: 64px; margin: 0 auto 12px; background: linear-gradient(135deg, #2563EB, #3B82F6); border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: 700; font-size: 20px; color: #fff; }
.pf-name { font-size: 17px; font-weight: 700; margin-bottom: 2px; }
.pf-role { font-size: 13px; color: #64748b; margin-bottom: 16px; }
.pf-stats { display: flex; justify-content: space-around; margin-bottom: 16px; padding: 12px 0; border-top: 1px solid rgba(255,255,255,0.06); border-bottom: 1px solid rgba(255,255,255,0.06); }
.pf-stats div { text-align: center; }
.pf-stats strong { display: block; font-size: 15px; color: #f1f5f9; }
.pf-stats span { font-size: 11px; color: #64748b; }
.pf-follow { width: 100%; padding: 9px; background: #3B82F6; color: #fff; border: none; border-radius: 8px; font-size: 13px; font-weight: 600; cursor: pointer; transition: background 0.2s; }
.pf-follow:hover { background: #2563EB; }`,
      },
    ],
  },

  // ——— LOADERS ———
  {
    title: 'Orbit Spinner',
    type: 'component',
    category: 'loaders',
    framework: 'css',
    tags: ['loader', 'spinner', 'orbit'],
    files: [
      {
        filename: 'index.html',
        content: `<div class="orbit">
  <div class="orbit-ring"></div>
  <div class="orbit-ring"></div>
  <div class="orbit-ring"></div>
  <div class="orbit-dot"></div>
</div>`,
      },
      {
        filename: 'style.css',
        content: `body { background: #0B1120; display: flex; justify-content: center; align-items: center; min-height: 100vh; }
.orbit { position: relative; width: 60px; height: 60px; }
.orbit-ring { position: absolute; inset: 0; border: 2px solid transparent; border-top-color: #3B82F6; border-radius: 50%; animation: orbit-spin 1.2s cubic-bezier(0.5, 0, 0.5, 1) infinite; }
.orbit-ring:nth-child(2) { animation-delay: -0.15s; border-top-color: #60A5FA; }
.orbit-ring:nth-child(3) { animation-delay: -0.3s; border-top-color: #93C5FD; }
.orbit-dot { position: absolute; top: 50%; left: 50%; width: 8px; height: 8px; margin: -4px 0 0 -4px; background: #3B82F6; border-radius: 50%; animation: orbit-pulse 1.2s ease-in-out infinite; }
@keyframes orbit-spin { to { transform: rotate(360deg); } }
@keyframes orbit-pulse { 0%, 100% { transform: scale(1); opacity: 1; } 50% { transform: scale(0.6); opacity: 0.5; } }`,
      },
    ],
  },
  {
    title: 'Bouncing Dots',
    type: 'component',
    category: 'loaders',
    framework: 'css',
    tags: ['loader', 'dots', 'bounce'],
    files: [
      {
        filename: 'index.html',
        content: `<div class="bounce-dots">
  <div class="bdot"></div>
  <div class="bdot"></div>
  <div class="bdot"></div>
</div>`,
      },
      {
        filename: 'style.css',
        content: `body { background: #0B1120; display: flex; justify-content: center; align-items: center; min-height: 100vh; }
.bounce-dots { display: flex; gap: 8px; }
.bdot { width: 12px; height: 12px; border-radius: 50%; background: #3B82F6; animation: bdot-bounce 0.6s ease-in-out infinite alternate; }
.bdot:nth-child(2) { animation-delay: 0.2s; background: #60A5FA; }
.bdot:nth-child(3) { animation-delay: 0.4s; background: #93C5FD; }
@keyframes bdot-bounce { from { transform: translateY(0); } to { transform: translateY(-16px); } }`,
      },
    ],
  },
  {
    title: 'Wave Progress Bar',
    type: 'component',
    category: 'loaders',
    framework: 'css',
    tags: ['loader', 'progress', 'wave'],
    files: [
      {
        filename: 'index.html',
        content: `<div class="wave-bar">
  <div class="wave-track"><div class="wave-fill"></div></div>
  <p class="wave-text">Loading...</p>
</div>`,
      },
      {
        filename: 'style.css',
        content: `body { background: #0B1120; display: flex; justify-content: center; align-items: center; min-height: 100vh; font-family: system-ui, sans-serif; }
.wave-bar { width: 240px; text-align: center; }
.wave-track { height: 6px; background: rgba(255,255,255,0.06); border-radius: 3px; overflow: hidden; margin-bottom: 10px; }
.wave-fill { height: 100%; width: 40%; background: linear-gradient(90deg, #3B82F6, #06B6D4); border-radius: 3px; animation: wave-move 1.5s ease-in-out infinite; }
@keyframes wave-move { 0% { transform: translateX(-100%); } 100% { transform: translateX(350%); } }
.wave-text { font-size: 12px; color: #64748b; }`,
      },
    ],
  },
  {
    title: 'DNA Helix Loader',
    type: 'component',
    category: 'loaders',
    framework: 'css',
    tags: ['loader', 'dna', 'helix'],
    files: [
      {
        filename: 'index.html',
        content: `<div class="dna">
  <div class="dna-pair"><span></span><span></span></div>
  <div class="dna-pair"><span></span><span></span></div>
  <div class="dna-pair"><span></span><span></span></div>
  <div class="dna-pair"><span></span><span></span></div>
  <div class="dna-pair"><span></span><span></span></div>
</div>`,
      },
      {
        filename: 'style.css',
        content: `body { background: #0B1120; display: flex; justify-content: center; align-items: center; min-height: 100vh; }
.dna { display: flex; gap: 6px; align-items: center; height: 40px; }
.dna-pair { display: flex; flex-direction: column; gap: 4px; animation: dna-wave 1s ease-in-out infinite; }
.dna-pair:nth-child(2) { animation-delay: 0.1s; }
.dna-pair:nth-child(3) { animation-delay: 0.2s; }
.dna-pair:nth-child(4) { animation-delay: 0.3s; }
.dna-pair:nth-child(5) { animation-delay: 0.4s; }
.dna-pair span { width: 8px; height: 8px; border-radius: 50%; background: #3B82F6; }
.dna-pair span:last-child { background: #06B6D4; }
@keyframes dna-wave { 0%, 100% { transform: scaleY(1); } 50% { transform: scaleY(0.3); } }`,
      },
    ],
  },

  // ——— INPUTS ———
  {
    title: 'Floating Label Input',
    type: 'component',
    category: 'inputs',
    framework: 'css',
    tags: ['input', 'label', 'float'],
    files: [
      {
        filename: 'index.html',
        content: `<div class="fl-group">
  <input type="text" class="fl-input" id="fl1" placeholder=" " />
  <label for="fl1" class="fl-label">Email Address</label>
  <div class="fl-line"></div>
</div>`,
      },
      {
        filename: 'style.css',
        content: `body { background: #0B1120; display: flex; justify-content: center; align-items: center; min-height: 100vh; font-family: system-ui, sans-serif; }
.fl-group { position: relative; width: 280px; }
.fl-input { width: 100%; padding: 16px 14px 8px; background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.1); border-radius: 8px; color: #e2e8f0; font-size: 15px; outline: none; transition: border-color 0.2s; box-sizing: border-box; }
.fl-input:focus { border-color: #3B82F6; }
.fl-label { position: absolute; left: 14px; top: 50%; transform: translateY(-50%); font-size: 14px; color: #64748b; pointer-events: none; transition: all 0.2s ease; }
.fl-input:focus + .fl-label, .fl-input:not(:placeholder-shown) + .fl-label { top: 8px; transform: translateY(0); font-size: 11px; color: #3B82F6; }
.fl-line { position: absolute; bottom: 0; left: 50%; width: 0; height: 2px; background: #3B82F6; border-radius: 0 0 8px 8px; transition: all 0.3s; }
.fl-input:focus ~ .fl-line { left: 0; width: 100%; }`,
      },
    ],
  },
  {
    title: 'Search Box with Shortcut',
    type: 'component',
    category: 'inputs',
    framework: 'css',
    tags: ['input', 'search', 'icon'],
    files: [
      {
        filename: 'index.html',
        content: `<div class="sb-wrap">
  <svg class="sb-icon" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>
  <input class="sb-input" type="text" placeholder="Search components..." />
  <kbd class="sb-kbd">/</kbd>
</div>`,
      },
      {
        filename: 'style.css',
        content: `body { background: #0B1120; display: flex; justify-content: center; align-items: center; min-height: 100vh; font-family: system-ui, sans-serif; }
.sb-wrap { display: flex; align-items: center; gap: 8px; width: 320px; padding: 0 14px; height: 42px; background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.08); border-radius: 10px; transition: all 0.2s; }
.sb-wrap:focus-within { border-color: #3B82F6; box-shadow: 0 0 0 3px rgba(59,130,246,0.15); }
.sb-icon { color: #475569; flex-shrink: 0; }
.sb-input { flex: 1; border: none; background: transparent; color: #e2e8f0; font-size: 14px; outline: none; }
.sb-input::placeholder { color: #475569; }
.sb-kbd { padding: 2px 8px; background: rgba(255,255,255,0.06); border: 1px solid rgba(255,255,255,0.1); border-radius: 4px; font-size: 12px; color: #64748b; font-family: monospace; }`,
      },
    ],
  },
  {
    title: 'OTP Code Input',
    type: 'component',
    category: 'inputs',
    framework: 'css',
    tags: ['input', 'otp', 'verification'],
    files: [
      {
        filename: 'index.html',
        content: `<div class="otp-group">
  <p class="otp-title">Enter verification code</p>
  <div class="otp-boxes">
    <input class="otp-box" type="text" maxlength="1" />
    <input class="otp-box" type="text" maxlength="1" />
    <input class="otp-box" type="text" maxlength="1" />
    <span class="otp-sep">-</span>
    <input class="otp-box" type="text" maxlength="1" />
    <input class="otp-box" type="text" maxlength="1" />
    <input class="otp-box" type="text" maxlength="1" />
  </div>
</div>`,
      },
      {
        filename: 'style.css',
        content: `body { background: #0B1120; display: flex; justify-content: center; align-items: center; min-height: 100vh; font-family: system-ui, sans-serif; }
.otp-group { text-align: center; }
.otp-title { color: #94a3b8; font-size: 14px; margin-bottom: 16px; }
.otp-boxes { display: flex; gap: 8px; align-items: center; }
.otp-box { width: 48px; height: 56px; text-align: center; font-size: 22px; font-weight: 700; color: #f1f5f9; background: rgba(255,255,255,0.04); border: 2px solid rgba(255,255,255,0.08); border-radius: 10px; outline: none; caret-color: #3B82F6; transition: border-color 0.2s; }
.otp-box:focus { border-color: #3B82F6; box-shadow: 0 0 0 3px rgba(59,130,246,0.15); }
.otp-sep { color: #475569; font-size: 20px; margin: 0 4px; }`,
      },
      {
        filename: 'script.js',
        content: `document.querySelectorAll('.otp-box').forEach((box, i, all) => {
  box.addEventListener('input', () => { if (box.value && i < all.length - 1) all[i + 1].focus(); });
  box.addEventListener('keydown', (e) => { if (e.key === 'Backspace' && !box.value && i > 0) all[i - 1].focus(); });
});`,
      },
    ],
  },

  // ——— TOGGLES ———
  {
    title: 'iOS Style Toggle',
    type: 'component',
    category: 'toggles',
    framework: 'css',
    tags: ['toggle', 'switch', 'ios'],
    files: [
      {
        filename: 'index.html',
        content: `<label class="toggle">
  <input type="checkbox" class="toggle-input" />
  <div class="toggle-track"><div class="toggle-thumb"></div></div>
  <span class="toggle-label">Dark Mode</span>
</label>`,
      },
      {
        filename: 'style.css',
        content: `body { background: #0B1120; display: flex; justify-content: center; align-items: center; min-height: 100vh; font-family: system-ui, sans-serif; }
.toggle { display: flex; align-items: center; gap: 12px; cursor: pointer; }
.toggle-input { display: none; }
.toggle-track { position: relative; width: 48px; height: 28px; background: #334155; border-radius: 14px; transition: background 0.25s; }
.toggle-thumb { position: absolute; top: 3px; left: 3px; width: 22px; height: 22px; background: #fff; border-radius: 50%; transition: transform 0.25s cubic-bezier(0.4, 0, 0.2, 1); box-shadow: 0 1px 3px rgba(0,0,0,0.3); }
.toggle-input:checked + .toggle-track { background: #3B82F6; }
.toggle-input:checked + .toggle-track .toggle-thumb { transform: translateX(20px); }
.toggle-label { font-size: 14px; color: #e2e8f0; }`,
      },
    ],
  },
  {
    title: 'Pill Toggle Group',
    type: 'component',
    category: 'toggles',
    framework: 'css',
    tags: ['toggle', 'pill', 'group'],
    files: [
      {
        filename: 'index.html',
        content: `<div class="pill-group">
  <input type="radio" name="pill" id="p1" checked />
  <label for="p1" class="pill-opt">Monthly</label>
  <input type="radio" name="pill" id="p2" />
  <label for="p2" class="pill-opt">Yearly</label>
  <div class="pill-bg"></div>
</div>`,
      },
      {
        filename: 'style.css',
        content: `body { background: #0B1120; display: flex; justify-content: center; align-items: center; min-height: 100vh; font-family: system-ui, sans-serif; }
.pill-group { position: relative; display: flex; padding: 4px; background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.08); border-radius: 10px; }
.pill-group input { display: none; }
.pill-opt { position: relative; z-index: 1; padding: 8px 28px; font-size: 14px; font-weight: 500; color: #94a3b8; cursor: pointer; transition: color 0.25s; border-radius: 8px; }
input:checked + .pill-opt { color: #fff; }
.pill-bg { position: absolute; top: 4px; left: 4px; width: calc(50% - 4px); height: calc(100% - 8px); background: #3B82F6; border-radius: 8px; transition: transform 0.25s cubic-bezier(0.4, 0, 0.2, 1); }
#p2:checked ~ .pill-bg { transform: translateX(100%); }`,
      },
    ],
  },

  // ——— FORMS ———
  {
    title: 'Login Form Card',
    type: 'component',
    category: 'forms',
    framework: 'css',
    tags: ['form', 'login', 'auth'],
    files: [
      {
        filename: 'index.html',
        content: `<div class="lf-card">
  <h2 class="lf-title">Welcome back</h2>
  <p class="lf-sub">Sign in to your account</p>
  <form class="lf-form">
    <div class="lf-field"><label>Email</label><input type="email" placeholder="you@example.com" /></div>
    <div class="lf-field"><label>Password</label><input type="password" placeholder="Enter password" /></div>
    <button type="button" class="lf-btn">Sign In</button>
    <p class="lf-link">Don't have an account? <a href="#">Sign up</a></p>
  </form>
</div>`,
      },
      {
        filename: 'style.css',
        content: `body { background: #0B1120; display: flex; justify-content: center; align-items: center; min-height: 100vh; font-family: system-ui, sans-serif; }
.lf-card { width: 340px; padding: 32px; background: #111827; border: 1px solid rgba(255,255,255,0.06); border-radius: 16px; color: #e2e8f0; }
.lf-title { font-size: 22px; font-weight: 700; margin-bottom: 4px; }
.lf-sub { font-size: 14px; color: #64748b; margin-bottom: 24px; }
.lf-form { display: flex; flex-direction: column; gap: 16px; }
.lf-field label { display: block; font-size: 13px; color: #94a3b8; margin-bottom: 6px; font-weight: 500; }
.lf-field input { width: 100%; padding: 10px 14px; background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.08); border-radius: 8px; color: #e2e8f0; font-size: 14px; outline: none; transition: border-color 0.2s; box-sizing: border-box; }
.lf-field input:focus { border-color: #3B82F6; }
.lf-field input::placeholder { color: #475569; }
.lf-btn { width: 100%; padding: 11px; background: #3B82F6; color: #fff; border: none; border-radius: 8px; font-size: 14px; font-weight: 600; cursor: pointer; transition: background 0.2s; }
.lf-btn:hover { background: #2563EB; }
.lf-link { text-align: center; font-size: 13px; color: #64748b; }
.lf-link a { color: #3B82F6; text-decoration: none; }`,
      },
    ],
  },

  // ——— ALERTS ———
  {
    title: 'Toast Notifications',
    type: 'component',
    category: 'alerts',
    framework: 'css',
    tags: ['alert', 'toast', 'notification'],
    files: [
      {
        filename: 'index.html',
        content: `<div class="toast-stack">
  <div class="toast toast--success"><div class="toast-icon">&#10003;</div><div class="toast-body"><strong>Success</strong><p>Your changes have been saved.</p></div><button class="toast-close">&times;</button></div>
  <div class="toast toast--error"><div class="toast-icon">!</div><div class="toast-body"><strong>Error</strong><p>Failed to upload the file.</p></div><button class="toast-close">&times;</button></div>
  <div class="toast toast--info"><div class="toast-icon">i</div><div class="toast-body"><strong>Info</strong><p>A new version is available.</p></div><button class="toast-close">&times;</button></div>
</div>`,
      },
      {
        filename: 'style.css',
        content: `body { background: #0B1120; display: flex; justify-content: center; align-items: center; min-height: 100vh; font-family: system-ui, sans-serif; }
.toast-stack { display: flex; flex-direction: column; gap: 10px; width: 340px; }
.toast { display: flex; align-items: flex-start; gap: 12px; padding: 14px 16px; border-radius: 10px; border-left: 4px solid; background: #111827; color: #e2e8f0; animation: toast-in 0.3s ease; }
@keyframes toast-in { from { opacity: 0; transform: translateX(20px); } }
.toast--success { border-color: #22C55E; }
.toast--error { border-color: #EF4444; }
.toast--info { border-color: #3B82F6; }
.toast-icon { width: 24px; height: 24px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 13px; font-weight: 700; flex-shrink: 0; }
.toast--success .toast-icon { background: rgba(34,197,94,0.15); color: #22C55E; }
.toast--error .toast-icon { background: rgba(239,68,68,0.15); color: #EF4444; }
.toast--info .toast-icon { background: rgba(59,130,246,0.15); color: #3B82F6; }
.toast-body { flex: 1; }
.toast-body strong { font-size: 14px; display: block; margin-bottom: 2px; }
.toast-body p { font-size: 13px; color: #94a3b8; margin: 0; }
.toast-close { background: none; border: none; color: #475569; font-size: 18px; cursor: pointer; padding: 0; line-height: 1; }
.toast-close:hover { color: #e2e8f0; }`,
      },
    ],
  },

  // ——— NAVBARS ———
  {
    title: 'Minimal Navbar',
    type: 'component',
    category: 'navbars',
    framework: 'css',
    tags: ['navbar', 'header', 'navigation'],
    files: [
      {
        filename: 'index.html',
        content: `<nav class="mnav"><div class="mnav-inner">
  <a class="mnav-brand" href="#">Acme</a>
  <div class="mnav-links"><a href="#" class="mnav-link active">Home</a><a href="#" class="mnav-link">Products</a><a href="#" class="mnav-link">Pricing</a><a href="#" class="mnav-link">Blog</a></div>
  <button class="mnav-cta">Get Started</button>
</div></nav>`,
      },
      {
        filename: 'style.css',
        content: `body { margin: 0; background: #0B1120; font-family: system-ui, sans-serif; }
.mnav { position: sticky; top: 0; background: rgba(11,17,32,0.85); backdrop-filter: blur(12px); border-bottom: 1px solid rgba(255,255,255,0.06); }
.mnav-inner { display: flex; align-items: center; padding: 0 32px; height: 56px; gap: 24px; }
.mnav-brand { font-size: 17px; font-weight: 800; color: #f1f5f9; text-decoration: none; letter-spacing: -0.02em; }
.mnav-links { display: flex; gap: 4px; margin-left: 16px; }
.mnav-link { padding: 6px 14px; border-radius: 6px; font-size: 14px; color: #94a3b8; text-decoration: none; transition: color 0.15s, background 0.15s; }
.mnav-link:hover, .mnav-link.active { color: #f1f5f9; background: rgba(255,255,255,0.06); }
.mnav-cta { margin-left: auto; padding: 7px 18px; background: #3B82F6; color: #fff; border: none; border-radius: 7px; font-size: 13px; font-weight: 600; cursor: pointer; transition: background 0.2s; }
.mnav-cta:hover { background: #2563EB; }`,
      },
    ],
  },

  // ——— CHECKBOXES ———
  {
    title: 'Morphing Checkbox',
    type: 'component',
    category: 'checkboxes',
    framework: 'css',
    tags: ['checkbox', 'animation', 'check'],
    files: [
      {
        filename: 'index.html',
        content: `<label class="morph-cb"><input type="checkbox" /><div class="morph-box"><svg viewBox="0 0 24 24" class="morph-check"><polyline points="20 6 9 17 4 12" /></svg></div><span>Remember me</span></label>
<label class="morph-cb"><input type="checkbox" checked /><div class="morph-box"><svg viewBox="0 0 24 24" class="morph-check"><polyline points="20 6 9 17 4 12" /></svg></div><span>Accept terms</span></label>`,
      },
      {
        filename: 'style.css',
        content: `body { background: #0B1120; display: flex; flex-direction: column; gap: 16px; justify-content: center; align-items: center; min-height: 100vh; font-family: system-ui, sans-serif; }
.morph-cb { display: flex; align-items: center; gap: 10px; cursor: pointer; color: #e2e8f0; font-size: 14px; }
.morph-cb input { display: none; }
.morph-box { width: 22px; height: 22px; border: 2px solid rgba(255,255,255,0.15); border-radius: 6px; display: flex; align-items: center; justify-content: center; transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1); background: transparent; }
.morph-check { width: 14px; height: 14px; fill: none; stroke: #fff; stroke-width: 3; stroke-linecap: round; stroke-linejoin: round; stroke-dasharray: 30; stroke-dashoffset: 30; transition: stroke-dashoffset 0.25s ease 0.1s; }
input:checked + .morph-box { background: #3B82F6; border-color: #3B82F6; transform: scale(1.1); }
input:checked + .morph-box .morph-check { stroke-dashoffset: 0; }
.morph-cb:hover .morph-box { border-color: #3B82F6; }`,
      },
    ],
  },

  // ——— MORE BUTTONS ———
  {
    title: 'Split Icon Button',
    type: 'component',
    category: 'buttons',
    framework: 'css',
    tags: ['button', 'icon', 'split'],
    files: [
      {
        filename: 'index.html',
        content: `<button class="split-btn">
  <span class="split-text">Download</span>
  <span class="split-icon"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg></span>
</button>`,
      },
      {
        filename: 'style.css',
        content: `body { background: #0B1120; display: flex; justify-content: center; align-items: center; min-height: 100vh; }
.split-btn { display: inline-flex; align-items: stretch; background: #111827; border: 1px solid rgba(255,255,255,0.08); border-radius: 10px; overflow: hidden; cursor: pointer; color: #e2e8f0; font-size: 14px; font-weight: 500; transition: border-color 0.2s; padding: 0; }
.split-btn:hover { border-color: #3B82F6; }
.split-text { padding: 10px 20px; }
.split-icon { display: flex; align-items: center; justify-content: center; padding: 10px 14px; background: rgba(59,130,246,0.1); border-left: 1px solid rgba(255,255,255,0.08); color: #3B82F6; transition: background 0.2s; }
.split-btn:hover .split-icon { background: rgba(59,130,246,0.2); }`,
      },
    ],
  },
  {
    title: 'Chip Selector',
    type: 'component',
    category: 'buttons',
    framework: 'css',
    tags: ['chip', 'tag', 'selector'],
    files: [
      {
        filename: 'index.html',
        content: `<div class="chip-group">
  <button class="chip active">All</button>
  <button class="chip">Design</button>
  <button class="chip">Frontend</button>
  <button class="chip">Backend</button>
  <button class="chip">DevOps</button>
  <button class="chip">Mobile</button>
</div>`,
      },
      {
        filename: 'style.css',
        content: `body { background: #0B1120; display: flex; justify-content: center; align-items: center; min-height: 100vh; font-family: system-ui, sans-serif; }
.chip-group { display: flex; flex-wrap: wrap; gap: 8px; }
.chip { padding: 7px 18px; border-radius: 20px; border: 1px solid rgba(255,255,255,0.08); background: rgba(255,255,255,0.03); color: #94a3b8; font-size: 13px; font-weight: 500; cursor: pointer; transition: all 0.2s; }
.chip:hover { color: #e2e8f0; border-color: rgba(255,255,255,0.15); }
.chip.active { background: rgba(59,130,246,0.15); border-color: rgba(59,130,246,0.3); color: #60A5FA; }`,
      },
      {
        filename: 'script.js',
        content: `document.querySelectorAll('.chip').forEach(c => {
  c.addEventListener('click', () => {
    document.querySelectorAll('.chip').forEach(x => x.classList.remove('active'));
    c.classList.add('active');
  });
});`,
      },
    ],
  },

  // ——— MODALS ———
  {
    title: 'Confirm Dialog',
    type: 'component',
    category: 'modals',
    framework: 'css',
    tags: ['modal', 'dialog', 'confirm'],
    files: [
      {
        filename: 'index.html',
        content: `<div class="dlg-overlay"><div class="dlg-card">
  <div class="dlg-icon">!</div>
  <h3 class="dlg-title">Delete Item?</h3>
  <p class="dlg-text">This action cannot be undone. Are you sure you want to permanently delete this item?</p>
  <div class="dlg-actions"><button class="dlg-btn dlg-btn--cancel">Cancel</button><button class="dlg-btn dlg-btn--danger">Delete</button></div>
</div></div>`,
      },
      {
        filename: 'style.css',
        content: `body { margin: 0; background: #0B1120; font-family: system-ui, sans-serif; }
.dlg-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.6); backdrop-filter: blur(4px); display: flex; align-items: center; justify-content: center; }
.dlg-card { width: 360px; padding: 28px; background: #111827; border: 1px solid rgba(255,255,255,0.06); border-radius: 16px; text-align: center; color: #e2e8f0; animation: dlg-pop 0.2s ease; }
@keyframes dlg-pop { from { transform: scale(0.95); opacity: 0; } }
.dlg-icon { width: 48px; height: 48px; margin: 0 auto 16px; background: rgba(239,68,68,0.1); border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 22px; font-weight: 700; color: #EF4444; }
.dlg-title { font-size: 18px; font-weight: 700; margin-bottom: 8px; }
.dlg-text { font-size: 14px; color: #94a3b8; line-height: 1.5; margin-bottom: 24px; }
.dlg-actions { display: flex; gap: 10px; }
.dlg-btn { flex: 1; padding: 10px; border: none; border-radius: 8px; font-size: 14px; font-weight: 600; cursor: pointer; transition: background 0.2s; }
.dlg-btn--cancel { background: rgba(255,255,255,0.06); color: #e2e8f0; }
.dlg-btn--cancel:hover { background: rgba(255,255,255,0.1); }
.dlg-btn--danger { background: #EF4444; color: #fff; }
.dlg-btn--danger:hover { background: #DC2626; }`,
      },
    ],
  },

  // ——— FOOTERS ———
  {
    title: 'Simple Footer',
    type: 'component',
    category: 'footers',
    framework: 'css',
    tags: ['footer', 'layout', 'links'],
    files: [
      {
        filename: 'index.html',
        content: `<footer class="sf"><div class="sf-inner">
  <div class="sf-brand"><strong>Acme Inc</strong><p>Building tools for the modern web.</p></div>
  <div class="sf-col"><h4>Product</h4><a href="#">Features</a><a href="#">Pricing</a><a href="#">Changelog</a></div>
  <div class="sf-col"><h4>Company</h4><a href="#">About</a><a href="#">Blog</a><a href="#">Careers</a></div>
  <div class="sf-col"><h4>Legal</h4><a href="#">Privacy</a><a href="#">Terms</a></div>
</div><div class="sf-bottom">&copy; 2026 Acme Inc. All rights reserved.</div></footer>`,
      },
      {
        filename: 'style.css',
        content: `body { margin: 0; background: #0B1120; font-family: system-ui, sans-serif; display: flex; flex-direction: column; min-height: 100vh; }
.sf { margin-top: auto; border-top: 1px solid rgba(255,255,255,0.06); background: #0B1120; color: #e2e8f0; }
.sf-inner { display: grid; grid-template-columns: 2fr 1fr 1fr 1fr; gap: 32px; padding: 40px; }
.sf-brand strong { font-size: 16px; display: block; margin-bottom: 6px; }
.sf-brand p { font-size: 13px; color: #64748b; margin: 0; }
.sf-col { display: flex; flex-direction: column; gap: 6px; }
.sf-col h4 { font-size: 13px; font-weight: 600; color: #94a3b8; margin: 0 0 4px; }
.sf-col a { font-size: 13px; color: #64748b; text-decoration: none; transition: color 0.15s; }
.sf-col a:hover { color: #e2e8f0; }
.sf-bottom { text-align: center; padding: 16px; border-top: 1px solid rgba(255,255,255,0.04); font-size: 12px; color: #475569; }`,
      },
    ],
  },

  // ——— Feature Grid ———
  {
    title: 'Feature Grid Card',
    type: 'component',
    category: 'cards',
    framework: 'css',
    tags: ['card', 'feature', 'grid'],
    files: [
      {
        filename: 'index.html',
        content: `<div class="feat-grid">
  <div class="feat-card"><div class="feat-ic">&#9889;</div><h4>Lightning Fast</h4><p>Optimized for speed with sub-second load times.</p></div>
  <div class="feat-card"><div class="feat-ic">&#9881;</div><h4>Easy Setup</h4><p>Get started in minutes with zero configuration.</p></div>
  <div class="feat-card"><div class="feat-ic">&#9733;</div><h4>Best Quality</h4><p>Production-grade components with full test coverage.</p></div>
</div>`,
      },
      {
        filename: 'style.css',
        content: `body { background: #0B1120; display: flex; justify-content: center; align-items: center; min-height: 100vh; font-family: system-ui, sans-serif; padding: 20px; }
.feat-grid { display: grid; grid-template-columns: repeat(3, 200px); gap: 16px; }
.feat-card { padding: 24px; background: #111827; border: 1px solid rgba(255,255,255,0.06); border-radius: 12px; color: #e2e8f0; transition: all 0.3s; }
.feat-card:hover { border-color: rgba(59,130,246,0.3); transform: translateY(-3px); }
.feat-ic { width: 40px; height: 40px; display: flex; align-items: center; justify-content: center; background: rgba(59,130,246,0.1); border-radius: 10px; font-size: 18px; margin-bottom: 12px; }
.feat-card h4 { font-size: 15px; font-weight: 600; margin-bottom: 6px; }
.feat-card p { font-size: 13px; color: #94a3b8; line-height: 1.5; margin: 0; }`,
      },
    ],
  },
];

async function main() {
  console.log('=== Seeding Components ===\n');
  const token = await login();
  console.log('Logged in as admin\n');

  for (const comp of COMPONENTS) {
    await create(token, comp);
  }

  console.log(`\nDone! Created ${COMPONENTS.length} components.`);
}

main().catch(console.error);
