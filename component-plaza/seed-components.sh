#!/bin/bash
# Batch create components for Component Plaza

API="https://pixora.vip/api/v1"
TOKEN=$(curl -s -X POST "$API/auth/login" -H "Content-Type: application/json" -d '{"identifier":"admin","password":"Admin123456"}' | python3 -c "import sys,json; print(json.load(sys.stdin)['data']['accessToken'])")

create() {
  curl -s -X POST "$API/snippets" \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer $TOKEN" \
    -d "$1" | python3 -c "import sys,json; d=json.load(sys.stdin); print(d.get('data',{}).get('title','ERROR'), '→', 'OK' if d.get('success') else d.get('error',{}).get('message','FAIL'))" 2>/dev/null
}

echo "=== Seeding Components ==="

# ——— BUTTONS ———

create '{
  "title": "Glow Pulse Button",
  "type": "component",
  "category": "buttons",
  "framework": "css",
  "tags": ["button", "glow", "animation"],
  "files": [
    {"filename": "index.html", "content": "<button class=\"glow-btn\">Hover Me</button>"},
    {"filename": "style.css", "content": ".glow-btn {\n  position: relative;\n  padding: 14px 36px;\n  font-size: 15px;\n  font-weight: 600;\n  color: #fff;\n  background: #2563EB;\n  border: none;\n  border-radius: 10px;\n  cursor: pointer;\n  overflow: hidden;\n  transition: all 0.3s ease;\n}\n.glow-btn::before {\n  content: \"\";\n  position: absolute;\n  top: -2px; left: -2px; right: -2px; bottom: -2px;\n  background: linear-gradient(45deg, #3B82F6, #06B6D4, #3B82F6);\n  border-radius: 12px;\n  z-index: -1;\n  opacity: 0;\n  transition: opacity 0.3s;\n  filter: blur(8px);\n}\n.glow-btn:hover::before {\n  opacity: 1;\n  animation: glow-rotate 2s linear infinite;\n}\n.glow-btn:hover {\n  transform: translateY(-2px);\n  box-shadow: 0 8px 25px rgba(37, 99, 235, 0.4);\n}\n@keyframes glow-rotate {\n  to { filter: blur(8px) hue-rotate(360deg); }\n}"}
  ]
}'

create '{
  "title": "Liquid Fill Button",
  "type": "component",
  "category": "buttons",
  "framework": "css",
  "tags": ["button", "liquid", "hover"],
  "files": [
    {"filename": "index.html", "content": "<button class=\"liquid-btn\"><span>Get Started</span></button>"},
    {"filename": "style.css", "content": ".liquid-btn {\n  position: relative;\n  padding: 14px 40px;\n  font-size: 15px;\n  font-weight: 600;\n  color: #3B82F6;\n  background: transparent;\n  border: 2px solid #3B82F6;\n  border-radius: 8px;\n  cursor: pointer;\n  overflow: hidden;\n  transition: color 0.4s ease;\n}\n.liquid-btn span {\n  position: relative;\n  z-index: 1;\n}\n.liquid-btn::before {\n  content: \"\";\n  position: absolute;\n  bottom: -100%;\n  left: 0;\n  width: 100%;\n  height: 100%;\n  background: #3B82F6;\n  transition: bottom 0.4s ease;\n  border-radius: 0;\n}\n.liquid-btn:hover::before {\n  bottom: 0;\n}\n.liquid-btn:hover {\n  color: #fff;\n}"}
  ]
}'

create '{
  "title": "Neon Border Button",
  "type": "component",
  "category": "buttons",
  "framework": "css",
  "tags": ["button", "neon", "border"],
  "files": [
    {"filename": "index.html", "content": "<button class=\"neon-btn\">Neon Click</button>"},
    {"filename": "style.css", "content": ".neon-btn {\n  padding: 12px 32px;\n  font-size: 14px;\n  font-weight: 600;\n  letter-spacing: 0.5px;\n  color: #22D3EE;\n  background: transparent;\n  border: 1px solid #22D3EE;\n  border-radius: 6px;\n  cursor: pointer;\n  transition: all 0.25s ease;\n  text-transform: uppercase;\n}\n.neon-btn:hover {\n  color: #fff;\n  background: rgba(34, 211, 238, 0.1);\n  box-shadow: 0 0 12px rgba(34, 211, 238, 0.4), 0 0 40px rgba(34, 211, 238, 0.15), inset 0 0 12px rgba(34, 211, 238, 0.1);\n  text-shadow: 0 0 8px rgba(34, 211, 238, 0.6);\n}\n.neon-btn:active {\n  transform: scale(0.97);\n}"}
  ]
}'

create '{
  "title": "Magnetic 3D Button",
  "type": "component",
  "category": "buttons",
  "framework": "css",
  "tags": ["button", "3d", "press"],
  "files": [
    {"filename": "index.html", "content": "<button class=\"mag-btn\">Press Me</button>"},
    {"filename": "style.css", "content": ".mag-btn {\n  padding: 14px 36px;\n  font-size: 15px;\n  font-weight: 700;\n  color: #fff;\n  background: linear-gradient(180deg, #3B82F6, #2563EB);\n  border: none;\n  border-radius: 10px;\n  cursor: pointer;\n  box-shadow: 0 6px 0 #1D4ED8, 0 8px 16px rgba(37, 99, 235, 0.35);\n  transition: all 0.1s ease;\n  transform: translateY(0);\n}\n.mag-btn:hover {\n  box-shadow: 0 4px 0 #1D4ED8, 0 6px 12px rgba(37, 99, 235, 0.35);\n  transform: translateY(2px);\n}\n.mag-btn:active {\n  box-shadow: 0 1px 0 #1D4ED8, 0 2px 4px rgba(37, 99, 235, 0.3);\n  transform: translateY(5px);\n}"}
  ]
}'

create '{
  "title": "Shimmer Slide Button",
  "type": "component",
  "category": "buttons",
  "framework": "css",
  "tags": ["button", "shimmer", "slide"],
  "files": [
    {"filename": "index.html", "content": "<button class=\"shimmer-btn\">Explore Now</button>"},
    {"filename": "style.css", "content": ".shimmer-btn {\n  position: relative;\n  padding: 14px 40px;\n  font-size: 15px;\n  font-weight: 600;\n  color: #fff;\n  background: linear-gradient(135deg, #1E40AF, #3B82F6);\n  border: none;\n  border-radius: 8px;\n  cursor: pointer;\n  overflow: hidden;\n}\n.shimmer-btn::after {\n  content: \"\";\n  position: absolute;\n  top: 0;\n  left: -100%;\n  width: 60%;\n  height: 100%;\n  background: linear-gradient(90deg, transparent, rgba(255,255,255,0.25), transparent);\n  transition: none;\n  animation: shimmer-slide 2.5s ease-in-out infinite;\n}\n@keyframes shimmer-slide {\n  0% { left: -100%; }\n  50%, 100% { left: 120%; }\n}\n.shimmer-btn:hover {\n  transform: translateY(-1px);\n  box-shadow: 0 6px 20px rgba(59, 130, 246, 0.4);\n}"}
  ]
}'

# ——— CARDS ———

create '{
  "title": "Glass Morphism Card",
  "type": "component",
  "category": "cards",
  "framework": "css",
  "tags": ["card", "glass", "blur"],
  "files": [
    {"filename": "index.html", "content": "<div class=\"glass-card\">\n  <div class=\"glass-icon\">&#9670;</div>\n  <h3 class=\"glass-title\">Premium Plan</h3>\n  <p class=\"glass-desc\">Access all features with unlimited usage and priority support.</p>\n  <div class=\"glass-price\">$29<span>/mo</span></div>\n</div>"},
    {"filename": "style.css", "content": "body { background: linear-gradient(135deg, #0F172A, #1E293B); display: flex; justify-content: center; align-items: center; min-height: 100vh; font-family: system-ui, sans-serif; }\n.glass-card {\n  width: 280px;\n  padding: 32px;\n  background: rgba(255, 255, 255, 0.06);\n  backdrop-filter: blur(16px);\n  border: 1px solid rgba(255, 255, 255, 0.1);\n  border-radius: 16px;\n  text-align: center;\n  color: #e2e8f0;\n  transition: transform 0.3s, border-color 0.3s;\n}\n.glass-card:hover {\n  transform: translateY(-4px);\n  border-color: rgba(59, 130, 246, 0.4);\n}\n.glass-icon {\n  font-size: 32px;\n  color: #3B82F6;\n  margin-bottom: 12px;\n}\n.glass-title {\n  font-size: 20px;\n  font-weight: 700;\n  margin-bottom: 8px;\n}\n.glass-desc {\n  font-size: 14px;\n  color: #94a3b8;\n  line-height: 1.5;\n  margin-bottom: 20px;\n}\n.glass-price {\n  font-size: 36px;\n  font-weight: 800;\n  color: #3B82F6;\n}\n.glass-price span {\n  font-size: 14px;\n  font-weight: 400;\n  color: #64748b;\n}"}
  ]
}'

create '{
  "title": "Hover Tilt Card",
  "type": "component",
  "category": "cards",
  "framework": "css",
  "tags": ["card", "tilt", "hover", "3d"],
  "files": [
    {"filename": "index.html", "content": "<div class=\"tilt-card\">\n  <div class=\"tilt-header\">01</div>\n  <h3 class=\"tilt-title\">Design System</h3>\n  <p class=\"tilt-text\">Build consistent interfaces with reusable tokens and components.</p>\n  <div class=\"tilt-footer\">Learn more &rarr;</div>\n</div>"},
    {"filename": "style.css", "content": "body { background: #0B1120; display: flex; justify-content: center; align-items: center; min-height: 100vh; font-family: system-ui, sans-serif; }\n.tilt-card {\n  width: 300px;\n  padding: 28px;\n  background: #111827;\n  border: 1px solid rgba(255,255,255,0.06);\n  border-radius: 14px;\n  color: #e2e8f0;\n  transition: transform 0.4s cubic-bezier(0.25,0.8,0.25,1), box-shadow 0.4s;\n  cursor: pointer;\n}\n.tilt-card:hover {\n  transform: perspective(800px) rotateY(-5deg) rotateX(3deg) translateY(-6px);\n  box-shadow: 12px 16px 40px rgba(0,0,0,0.4);\n}\n.tilt-header {\n  font-size: 48px;\n  font-weight: 900;\n  color: rgba(59,130,246,0.2);\n  line-height: 1;\n  margin-bottom: 12px;\n}\n.tilt-title {\n  font-size: 18px;\n  font-weight: 700;\n  margin-bottom: 8px;\n}\n.tilt-text {\n  font-size: 14px;\n  color: #94a3b8;\n  line-height: 1.5;\n  margin-bottom: 16px;\n}\n.tilt-footer {\n  font-size: 13px;\n  color: #3B82F6;\n  font-weight: 500;\n}"}
  ]
}'

create '{
  "title": "Gradient Border Card",
  "type": "component",
  "category": "cards",
  "framework": "css",
  "tags": ["card", "gradient", "border"],
  "files": [
    {"filename": "index.html", "content": "<div class=\"gbc-wrap\">\n  <div class=\"gbc-card\">\n    <h3>Analytics</h3>\n    <p class=\"gbc-num\">12,847</p>\n    <p class=\"gbc-label\">Total visitors this month</p>\n    <div class=\"gbc-bar\"><div class=\"gbc-fill\"></div></div>\n  </div>\n</div>"},
    {"filename": "style.css", "content": "body { background: #0B1120; display: flex; justify-content: center; align-items: center; min-height: 100vh; font-family: system-ui, sans-serif; }\n.gbc-wrap {\n  padding: 2px;\n  border-radius: 14px;\n  background: linear-gradient(135deg, #3B82F6, #06B6D4, #3B82F6);\n  background-size: 200% 200%;\n  animation: gbc-move 3s ease infinite;\n}\n@keyframes gbc-move {\n  0%, 100% { background-position: 0% 50%; }\n  50% { background-position: 100% 50%; }\n}\n.gbc-card {\n  background: #111827;\n  border-radius: 12px;\n  padding: 24px;\n  color: #e2e8f0;\n  width: 260px;\n}\n.gbc-card h3 {\n  font-size: 13px;\n  text-transform: uppercase;\n  letter-spacing: 0.05em;\n  color: #64748b;\n  margin-bottom: 8px;\n}\n.gbc-num {\n  font-size: 32px;\n  font-weight: 800;\n  margin-bottom: 4px;\n}\n.gbc-label {\n  font-size: 13px;\n  color: #94a3b8;\n  margin-bottom: 16px;\n}\n.gbc-bar {\n  height: 6px;\n  background: rgba(255,255,255,0.06);\n  border-radius: 3px;\n  overflow: hidden;\n}\n.gbc-fill {\n  width: 72%;\n  height: 100%;\n  background: linear-gradient(90deg, #3B82F6, #06B6D4);\n  border-radius: 3px;\n}"}
  ]
}'

create '{
  "title": "Profile Hover Card",
  "type": "component",
  "category": "cards",
  "framework": "css",
  "tags": ["card", "profile", "hover"],
  "files": [
    {"filename": "index.html", "content": "<div class=\"pf-card\">\n  <div class=\"pf-avatar\">JD</div>\n  <h3 class=\"pf-name\">Jane Doe</h3>\n  <p class=\"pf-role\">Senior Developer</p>\n  <div class=\"pf-stats\">\n    <div><strong>142</strong><span>Posts</span></div>\n    <div><strong>8.2k</strong><span>Followers</span></div>\n    <div><strong>291</strong><span>Following</span></div>\n  </div>\n  <button class=\"pf-follow\">Follow</button>\n</div>"},
    {"filename": "style.css", "content": "body { background: #0B1120; display: flex; justify-content: center; align-items: center; min-height: 100vh; font-family: system-ui, sans-serif; }\n.pf-card {\n  width: 260px;\n  text-align: center;\n  padding: 28px;\n  background: #111827;\n  border: 1px solid rgba(255,255,255,0.06);\n  border-radius: 16px;\n  color: #e2e8f0;\n  transition: transform 0.3s;\n}\n.pf-card:hover { transform: translateY(-4px); }\n.pf-avatar {\n  width: 64px;\n  height: 64px;\n  margin: 0 auto 12px;\n  background: linear-gradient(135deg, #2563EB, #3B82F6);\n  border-radius: 50%;\n  display: flex;\n  align-items: center;\n  justify-content: center;\n  font-weight: 700;\n  font-size: 20px;\n  color: #fff;\n}\n.pf-name { font-size: 17px; font-weight: 700; margin-bottom: 2px; }\n.pf-role { font-size: 13px; color: #64748b; margin-bottom: 16px; }\n.pf-stats {\n  display: flex;\n  justify-content: space-around;\n  margin-bottom: 16px;\n  padding: 12px 0;\n  border-top: 1px solid rgba(255,255,255,0.06);\n  border-bottom: 1px solid rgba(255,255,255,0.06);\n}\n.pf-stats div { text-align: center; }\n.pf-stats strong { display: block; font-size: 15px; color: #f1f5f9; }\n.pf-stats span { font-size: 11px; color: #64748b; }\n.pf-follow {\n  width: 100%;\n  padding: 9px;\n  background: #3B82F6;\n  color: #fff;\n  border: none;\n  border-radius: 8px;\n  font-size: 13px;\n  font-weight: 600;\n  cursor: pointer;\n  transition: background 0.2s;\n}\n.pf-follow:hover { background: #2563EB; }"}
  ]
}'

# ——— LOADERS ———

create '{
  "title": "Orbit Spinner",
  "type": "component",
  "category": "loaders",
  "framework": "css",
  "tags": ["loader", "spinner", "orbit"],
  "files": [
    {"filename": "index.html", "content": "<div class=\"orbit\">\n  <div class=\"orbit-ring\"></div>\n  <div class=\"orbit-ring\"></div>\n  <div class=\"orbit-ring\"></div>\n  <div class=\"orbit-dot\"></div>\n</div>"},
    {"filename": "style.css", "content": "body { background: #0B1120; display: flex; justify-content: center; align-items: center; min-height: 100vh; }\n.orbit {\n  position: relative;\n  width: 60px;\n  height: 60px;\n}\n.orbit-ring {\n  position: absolute;\n  inset: 0;\n  border: 2px solid transparent;\n  border-top-color: #3B82F6;\n  border-radius: 50%;\n  animation: orbit-spin 1.2s cubic-bezier(0.5, 0, 0.5, 1) infinite;\n}\n.orbit-ring:nth-child(2) {\n  animation-delay: -0.15s;\n  border-top-color: #60A5FA;\n}\n.orbit-ring:nth-child(3) {\n  animation-delay: -0.3s;\n  border-top-color: #93C5FD;\n}\n.orbit-dot {\n  position: absolute;\n  top: 50%;\n  left: 50%;\n  width: 8px;\n  height: 8px;\n  margin: -4px 0 0 -4px;\n  background: #3B82F6;\n  border-radius: 50%;\n  animation: orbit-pulse 1.2s ease-in-out infinite;\n}\n@keyframes orbit-spin { to { transform: rotate(360deg); } }\n@keyframes orbit-pulse { 0%, 100% { transform: scale(1); opacity: 1; } 50% { transform: scale(0.6); opacity: 0.5; } }"}
  ]
}'

create '{
  "title": "Bouncing Dots",
  "type": "component",
  "category": "loaders",
  "framework": "css",
  "tags": ["loader", "dots", "bounce"],
  "files": [
    {"filename": "index.html", "content": "<div class=\"bounce-dots\">\n  <div class=\"bdot\"></div>\n  <div class=\"bdot\"></div>\n  <div class=\"bdot\"></div>\n</div>"},
    {"filename": "style.css", "content": "body { background: #0B1120; display: flex; justify-content: center; align-items: center; min-height: 100vh; }\n.bounce-dots {\n  display: flex;\n  gap: 8px;\n}\n.bdot {\n  width: 12px;\n  height: 12px;\n  border-radius: 50%;\n  background: #3B82F6;\n  animation: bdot-bounce 0.6s ease-in-out infinite alternate;\n}\n.bdot:nth-child(2) { animation-delay: 0.2s; background: #60A5FA; }\n.bdot:nth-child(3) { animation-delay: 0.4s; background: #93C5FD; }\n@keyframes bdot-bounce {\n  from { transform: translateY(0); }\n  to { transform: translateY(-16px); }\n}"}
  ]
}'

create '{
  "title": "Wave Progress Bar",
  "type": "component",
  "category": "loaders",
  "framework": "css",
  "tags": ["loader", "progress", "wave"],
  "files": [
    {"filename": "index.html", "content": "<div class=\"wave-bar\">\n  <div class=\"wave-track\">\n    <div class=\"wave-fill\"></div>\n  </div>\n  <p class=\"wave-text\">Loading...</p>\n</div>"},
    {"filename": "style.css", "content": "body { background: #0B1120; display: flex; justify-content: center; align-items: center; min-height: 100vh; font-family: system-ui, sans-serif; }\n.wave-bar { width: 240px; text-align: center; }\n.wave-track {\n  height: 6px;\n  background: rgba(255,255,255,0.06);\n  border-radius: 3px;\n  overflow: hidden;\n  margin-bottom: 10px;\n}\n.wave-fill {\n  height: 100%;\n  width: 40%;\n  background: linear-gradient(90deg, #3B82F6, #06B6D4);\n  border-radius: 3px;\n  animation: wave-move 1.5s ease-in-out infinite;\n}\n@keyframes wave-move {\n  0% { transform: translateX(-100%); }\n  100% { transform: translateX(350%); }\n}\n.wave-text { font-size: 12px; color: #64748b; }"}
  ]
}'

create '{
  "title": "DNA Helix Loader",
  "type": "component",
  "category": "loaders",
  "framework": "css",
  "tags": ["loader", "dna", "helix"],
  "files": [
    {"filename": "index.html", "content": "<div class=\"dna\">\n  <div class=\"dna-pair\"><span></span><span></span></div>\n  <div class=\"dna-pair\"><span></span><span></span></div>\n  <div class=\"dna-pair\"><span></span><span></span></div>\n  <div class=\"dna-pair\"><span></span><span></span></div>\n  <div class=\"dna-pair\"><span></span><span></span></div>\n</div>"},
    {"filename": "style.css", "content": "body { background: #0B1120; display: flex; justify-content: center; align-items: center; min-height: 100vh; }\n.dna {\n  display: flex;\n  gap: 6px;\n  align-items: center;\n  height: 40px;\n}\n.dna-pair {\n  display: flex;\n  flex-direction: column;\n  gap: 4px;\n  animation: dna-wave 1s ease-in-out infinite;\n}\n.dna-pair:nth-child(2) { animation-delay: 0.1s; }\n.dna-pair:nth-child(3) { animation-delay: 0.2s; }\n.dna-pair:nth-child(4) { animation-delay: 0.3s; }\n.dna-pair:nth-child(5) { animation-delay: 0.4s; }\n.dna-pair span {\n  width: 8px;\n  height: 8px;\n  border-radius: 50%;\n  background: #3B82F6;\n}\n.dna-pair span:last-child { background: #06B6D4; }\n@keyframes dna-wave {\n  0%, 100% { transform: scaleY(1); }\n  50% { transform: scaleY(0.3); }\n}"}
  ]
}'

# ——— INPUTS ———

create '{
  "title": "Floating Label Input",
  "type": "component",
  "category": "inputs",
  "framework": "css",
  "tags": ["input", "label", "float"],
  "files": [
    {"filename": "index.html", "content": "<div class=\"fl-group\">\n  <input type=\"text\" class=\"fl-input\" id=\"fl1\" placeholder=\" \" />\n  <label for=\"fl1\" class=\"fl-label\">Email Address</label>\n  <div class=\"fl-line\"></div>\n</div>"},
    {"filename": "style.css", "content": "body { background: #0B1120; display: flex; justify-content: center; align-items: center; min-height: 100vh; font-family: system-ui, sans-serif; }\n.fl-group {\n  position: relative;\n  width: 280px;\n}\n.fl-input {\n  width: 100%;\n  padding: 16px 14px 8px;\n  background: rgba(255,255,255,0.04);\n  border: 1px solid rgba(255,255,255,0.1);\n  border-radius: 8px;\n  color: #e2e8f0;\n  font-size: 15px;\n  outline: none;\n  transition: border-color 0.2s;\n}\n.fl-input:focus { border-color: #3B82F6; }\n.fl-label {\n  position: absolute;\n  left: 14px;\n  top: 50%;\n  transform: translateY(-50%);\n  font-size: 14px;\n  color: #64748b;\n  pointer-events: none;\n  transition: all 0.2s ease;\n}\n.fl-input:focus + .fl-label,\n.fl-input:not(:placeholder-shown) + .fl-label {\n  top: 8px;\n  transform: translateY(0);\n  font-size: 11px;\n  color: #3B82F6;\n}\n.fl-line {\n  position: absolute;\n  bottom: 0;\n  left: 50%;\n  width: 0;\n  height: 2px;\n  background: #3B82F6;\n  border-radius: 0 0 8px 8px;\n  transition: all 0.3s;\n}\n.fl-input:focus ~ .fl-line {\n  left: 0;\n  width: 100%;\n}"}
  ]
}'

create '{
  "title": "Search Box with Icon",
  "type": "component",
  "category": "inputs",
  "framework": "css",
  "tags": ["input", "search", "icon"],
  "files": [
    {"filename": "index.html", "content": "<div class=\"sb-wrap\">\n  <svg class=\"sb-icon\" xmlns=\"http://www.w3.org/2000/svg\" width=\"16\" height=\"16\" viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\"><circle cx=\"11\" cy=\"11\" r=\"8\"/><path d=\"m21 21-4.3-4.3\"/></svg>\n  <input class=\"sb-input\" type=\"text\" placeholder=\"Search components...\" />\n  <kbd class=\"sb-kbd\">/</kbd>\n</div>"},
    {"filename": "style.css", "content": "body { background: #0B1120; display: flex; justify-content: center; align-items: center; min-height: 100vh; font-family: system-ui, sans-serif; }\n.sb-wrap {\n  display: flex;\n  align-items: center;\n  gap: 8px;\n  width: 320px;\n  padding: 0 14px;\n  height: 42px;\n  background: rgba(255,255,255,0.04);\n  border: 1px solid rgba(255,255,255,0.08);\n  border-radius: 10px;\n  transition: all 0.2s;\n}\n.sb-wrap:focus-within {\n  border-color: #3B82F6;\n  box-shadow: 0 0 0 3px rgba(59,130,246,0.15);\n}\n.sb-icon { color: #475569; flex-shrink: 0; }\n.sb-input {\n  flex: 1;\n  border: none;\n  background: transparent;\n  color: #e2e8f0;\n  font-size: 14px;\n  outline: none;\n}\n.sb-input::placeholder { color: #475569; }\n.sb-kbd {\n  padding: 2px 8px;\n  background: rgba(255,255,255,0.06);\n  border: 1px solid rgba(255,255,255,0.1);\n  border-radius: 4px;\n  font-size: 12px;\n  color: #64748b;\n  font-family: monospace;\n}"}
  ]
}'

create '{
  "title": "OTP Code Input",
  "type": "component",
  "category": "inputs",
  "framework": "css",
  "tags": ["input", "otp", "verification"],
  "files": [
    {"filename": "index.html", "content": "<div class=\"otp-group\">\n  <p class=\"otp-title\">Enter verification code</p>\n  <div class=\"otp-boxes\">\n    <input class=\"otp-box\" type=\"text\" maxlength=\"1\" />\n    <input class=\"otp-box\" type=\"text\" maxlength=\"1\" />\n    <input class=\"otp-box\" type=\"text\" maxlength=\"1\" />\n    <span class=\"otp-sep\">-</span>\n    <input class=\"otp-box\" type=\"text\" maxlength=\"1\" />\n    <input class=\"otp-box\" type=\"text\" maxlength=\"1\" />\n    <input class=\"otp-box\" type=\"text\" maxlength=\"1\" />\n  </div>\n</div>"},
    {"filename": "style.css", "content": "body { background: #0B1120; display: flex; justify-content: center; align-items: center; min-height: 100vh; font-family: system-ui, sans-serif; }\n.otp-group { text-align: center; }\n.otp-title { color: #94a3b8; font-size: 14px; margin-bottom: 16px; }\n.otp-boxes { display: flex; gap: 8px; align-items: center; }\n.otp-box {\n  width: 48px;\n  height: 56px;\n  text-align: center;\n  font-size: 22px;\n  font-weight: 700;\n  color: #f1f5f9;\n  background: rgba(255,255,255,0.04);\n  border: 2px solid rgba(255,255,255,0.08);\n  border-radius: 10px;\n  outline: none;\n  caret-color: #3B82F6;\n  transition: border-color 0.2s;\n}\n.otp-box:focus {\n  border-color: #3B82F6;\n  box-shadow: 0 0 0 3px rgba(59,130,246,0.15);\n}\n.otp-sep { color: #475569; font-size: 20px; margin: 0 4px; }"},
    {"filename": "script.js", "content": "document.querySelectorAll('.otp-box').forEach((box, i, all) => {\n  box.addEventListener('input', () => {\n    if (box.value && i < all.length - 1) all[i + 1].focus();\n  });\n  box.addEventListener('keydown', (e) => {\n    if (e.key === 'Backspace' && !box.value && i > 0) all[i - 1].focus();\n  });\n});"}
  ]
}'

# ——— TOGGLES ———

create '{
  "title": "iOS Style Toggle",
  "type": "component",
  "category": "toggles",
  "framework": "css",
  "tags": ["toggle", "switch", "ios"],
  "files": [
    {"filename": "index.html", "content": "<label class=\"toggle\">\n  <input type=\"checkbox\" class=\"toggle-input\" />\n  <div class=\"toggle-track\">\n    <div class=\"toggle-thumb\"></div>\n  </div>\n  <span class=\"toggle-label\">Dark Mode</span>\n</label>"},
    {"filename": "style.css", "content": "body { background: #0B1120; display: flex; justify-content: center; align-items: center; min-height: 100vh; font-family: system-ui, sans-serif; }\n.toggle {\n  display: flex;\n  align-items: center;\n  gap: 12px;\n  cursor: pointer;\n}\n.toggle-input { display: none; }\n.toggle-track {\n  position: relative;\n  width: 48px;\n  height: 28px;\n  background: #334155;\n  border-radius: 14px;\n  transition: background 0.25s;\n}\n.toggle-thumb {\n  position: absolute;\n  top: 3px;\n  left: 3px;\n  width: 22px;\n  height: 22px;\n  background: #fff;\n  border-radius: 50%;\n  transition: transform 0.25s cubic-bezier(0.4, 0, 0.2, 1);\n  box-shadow: 0 1px 3px rgba(0,0,0,0.3);\n}\n.toggle-input:checked + .toggle-track {\n  background: #3B82F6;\n}\n.toggle-input:checked + .toggle-track .toggle-thumb {\n  transform: translateX(20px);\n}\n.toggle-label {\n  font-size: 14px;\n  color: #e2e8f0;\n}"}
  ]
}'

create '{
  "title": "Pill Toggle Group",
  "type": "component",
  "category": "toggles",
  "framework": "css",
  "tags": ["toggle", "pill", "group"],
  "files": [
    {"filename": "index.html", "content": "<div class=\"pill-group\">\n  <input type=\"radio\" name=\"pill\" id=\"p1\" checked />\n  <label for=\"p1\" class=\"pill-opt\">Monthly</label>\n  <input type=\"radio\" name=\"pill\" id=\"p2\" />\n  <label for=\"p2\" class=\"pill-opt\">Yearly</label>\n  <div class=\"pill-bg\"></div>\n</div>"},
    {"filename": "style.css", "content": "body { background: #0B1120; display: flex; justify-content: center; align-items: center; min-height: 100vh; font-family: system-ui, sans-serif; }\n.pill-group {\n  position: relative;\n  display: flex;\n  padding: 4px;\n  background: rgba(255,255,255,0.04);\n  border: 1px solid rgba(255,255,255,0.08);\n  border-radius: 10px;\n}\n.pill-group input { display: none; }\n.pill-opt {\n  position: relative;\n  z-index: 1;\n  padding: 8px 28px;\n  font-size: 14px;\n  font-weight: 500;\n  color: #94a3b8;\n  cursor: pointer;\n  transition: color 0.25s;\n  border-radius: 8px;\n}\ninput:checked + .pill-opt {\n  color: #fff;\n}\n.pill-bg {\n  position: absolute;\n  top: 4px;\n  left: 4px;\n  width: calc(50% - 4px);\n  height: calc(100% - 8px);\n  background: #3B82F6;\n  border-radius: 8px;\n  transition: transform 0.25s cubic-bezier(0.4, 0, 0.2, 1);\n}\n#p2:checked ~ .pill-bg {\n  transform: translateX(100%);\n}"}
  ]
}'

# ——— FORMS ———

create '{
  "title": "Login Form Card",
  "type": "component",
  "category": "forms",
  "framework": "css",
  "tags": ["form", "login", "auth"],
  "files": [
    {"filename": "index.html", "content": "<div class=\"lf-card\">\n  <h2 class=\"lf-title\">Welcome back</h2>\n  <p class=\"lf-sub\">Sign in to your account</p>\n  <form class=\"lf-form\">\n    <div class=\"lf-field\">\n      <label>Email</label>\n      <input type=\"email\" placeholder=\"you@example.com\" />\n    </div>\n    <div class=\"lf-field\">\n      <label>Password</label>\n      <input type=\"password\" placeholder=\"Enter password\" />\n    </div>\n    <button type=\"button\" class=\"lf-btn\">Sign In</button>\n    <p class=\"lf-link\">Don'\''t have an account? <a href=\"#\">Sign up</a></p>\n  </form>\n</div>"},
    {"filename": "style.css", "content": "body { background: #0B1120; display: flex; justify-content: center; align-items: center; min-height: 100vh; font-family: system-ui, sans-serif; }\n.lf-card {\n  width: 340px;\n  padding: 32px;\n  background: #111827;\n  border: 1px solid rgba(255,255,255,0.06);\n  border-radius: 16px;\n  color: #e2e8f0;\n}\n.lf-title { font-size: 22px; font-weight: 700; margin-bottom: 4px; }\n.lf-sub { font-size: 14px; color: #64748b; margin-bottom: 24px; }\n.lf-form { display: flex; flex-direction: column; gap: 16px; }\n.lf-field label { display: block; font-size: 13px; color: #94a3b8; margin-bottom: 6px; font-weight: 500; }\n.lf-field input {\n  width: 100%;\n  padding: 10px 14px;\n  background: rgba(255,255,255,0.04);\n  border: 1px solid rgba(255,255,255,0.08);\n  border-radius: 8px;\n  color: #e2e8f0;\n  font-size: 14px;\n  outline: none;\n  transition: border-color 0.2s;\n  box-sizing: border-box;\n}\n.lf-field input:focus { border-color: #3B82F6; }\n.lf-field input::placeholder { color: #475569; }\n.lf-btn {\n  width: 100%;\n  padding: 11px;\n  background: #3B82F6;\n  color: #fff;\n  border: none;\n  border-radius: 8px;\n  font-size: 14px;\n  font-weight: 600;\n  cursor: pointer;\n  transition: background 0.2s;\n}\n.lf-btn:hover { background: #2563EB; }\n.lf-link { text-align: center; font-size: 13px; color: #64748b; }\n.lf-link a { color: #3B82F6; }"}
  ]
}'

# ——— ALERTS ———

create '{
  "title": "Toast Notifications",
  "type": "component",
  "category": "alerts",
  "framework": "css",
  "tags": ["alert", "toast", "notification"],
  "files": [
    {"filename": "index.html", "content": "<div class=\"toast-stack\">\n  <div class=\"toast toast--success\">\n    <div class=\"toast-icon\">&#10003;</div>\n    <div class=\"toast-body\">\n      <strong>Success</strong>\n      <p>Your changes have been saved.</p>\n    </div>\n    <button class=\"toast-close\">&times;</button>\n  </div>\n  <div class=\"toast toast--error\">\n    <div class=\"toast-icon\">!</div>\n    <div class=\"toast-body\">\n      <strong>Error</strong>\n      <p>Failed to upload the file.</p>\n    </div>\n    <button class=\"toast-close\">&times;</button>\n  </div>\n  <div class=\"toast toast--info\">\n    <div class=\"toast-icon\">i</div>\n    <div class=\"toast-body\">\n      <strong>Info</strong>\n      <p>A new version is available.</p>\n    </div>\n    <button class=\"toast-close\">&times;</button>\n  </div>\n</div>"},
    {"filename": "style.css", "content": "body { background: #0B1120; display: flex; justify-content: center; align-items: center; min-height: 100vh; font-family: system-ui, sans-serif; }\n.toast-stack { display: flex; flex-direction: column; gap: 10px; width: 340px; }\n.toast {\n  display: flex;\n  align-items: flex-start;\n  gap: 12px;\n  padding: 14px 16px;\n  border-radius: 10px;\n  border-left: 4px solid;\n  background: #111827;\n  color: #e2e8f0;\n  animation: toast-in 0.3s ease;\n}\n@keyframes toast-in { from { opacity: 0; transform: translateX(20px); } }\n.toast--success { border-color: #22C55E; }\n.toast--error { border-color: #EF4444; }\n.toast--info { border-color: #3B82F6; }\n.toast-icon {\n  width: 24px;\n  height: 24px;\n  border-radius: 50%;\n  display: flex;\n  align-items: center;\n  justify-content: center;\n  font-size: 13px;\n  font-weight: 700;\n  flex-shrink: 0;\n}\n.toast--success .toast-icon { background: rgba(34,197,94,0.15); color: #22C55E; }\n.toast--error .toast-icon { background: rgba(239,68,68,0.15); color: #EF4444; }\n.toast--info .toast-icon { background: rgba(59,130,246,0.15); color: #3B82F6; }\n.toast-body { flex: 1; }\n.toast-body strong { font-size: 14px; display: block; margin-bottom: 2px; }\n.toast-body p { font-size: 13px; color: #94a3b8; margin: 0; }\n.toast-close {\n  background: none;\n  border: none;\n  color: #475569;\n  font-size: 18px;\n  cursor: pointer;\n  padding: 0;\n  line-height: 1;\n}\n.toast-close:hover { color: #e2e8f0; }"}
  ]
}'

# ——— NAVBARS ———

create '{
  "title": "Minimal Navbar",
  "type": "component",
  "category": "navbars",
  "framework": "css",
  "tags": ["navbar", "header", "navigation"],
  "files": [
    {"filename": "index.html", "content": "<nav class=\"mnav\">\n  <div class=\"mnav-inner\">\n    <a class=\"mnav-brand\" href=\"#\">Acme</a>\n    <div class=\"mnav-links\">\n      <a href=\"#\" class=\"mnav-link active\">Home</a>\n      <a href=\"#\" class=\"mnav-link\">Products</a>\n      <a href=\"#\" class=\"mnav-link\">Pricing</a>\n      <a href=\"#\" class=\"mnav-link\">Blog</a>\n    </div>\n    <button class=\"mnav-cta\">Get Started</button>\n  </div>\n</nav>"},
    {"filename": "style.css", "content": "body { margin: 0; background: #0B1120; font-family: system-ui, sans-serif; }\n.mnav {\n  position: sticky;\n  top: 0;\n  background: rgba(11,17,32,0.85);\n  backdrop-filter: blur(12px);\n  border-bottom: 1px solid rgba(255,255,255,0.06);\n}\n.mnav-inner {\n  display: flex;\n  align-items: center;\n  padding: 0 32px;\n  height: 56px;\n  gap: 24px;\n}\n.mnav-brand {\n  font-size: 17px;\n  font-weight: 800;\n  color: #f1f5f9;\n  text-decoration: none;\n  letter-spacing: -0.02em;\n}\n.mnav-links {\n  display: flex;\n  gap: 4px;\n  margin-left: 16px;\n}\n.mnav-link {\n  padding: 6px 14px;\n  border-radius: 6px;\n  font-size: 14px;\n  color: #94a3b8;\n  text-decoration: none;\n  transition: color 0.15s, background 0.15s;\n}\n.mnav-link:hover, .mnav-link.active {\n  color: #f1f5f9;\n  background: rgba(255,255,255,0.06);\n}\n.mnav-cta {\n  margin-left: auto;\n  padding: 7px 18px;\n  background: #3B82F6;\n  color: #fff;\n  border: none;\n  border-radius: 7px;\n  font-size: 13px;\n  font-weight: 600;\n  cursor: pointer;\n  transition: background 0.2s;\n}\n.mnav-cta:hover { background: #2563EB; }"}
  ]
}'

create '{
  "title": "Morphing Checkbox",
  "type": "component",
  "category": "checkboxes",
  "framework": "css",
  "tags": ["checkbox", "animation", "check"],
  "files": [
    {"filename": "index.html", "content": "<label class=\"morph-cb\">\n  <input type=\"checkbox\" />\n  <div class=\"morph-box\">\n    <svg viewBox=\"0 0 24 24\" class=\"morph-check\"><polyline points=\"20 6 9 17 4 12\" /></svg>\n  </div>\n  <span>Remember me</span>\n</label>\n<label class=\"morph-cb\">\n  <input type=\"checkbox\" checked />\n  <div class=\"morph-box\">\n    <svg viewBox=\"0 0 24 24\" class=\"morph-check\"><polyline points=\"20 6 9 17 4 12\" /></svg>\n  </div>\n  <span>Accept terms</span>\n</label>"},
    {"filename": "style.css", "content": "body { background: #0B1120; display: flex; flex-direction: column; gap: 16px; justify-content: center; align-items: center; min-height: 100vh; font-family: system-ui, sans-serif; }\n.morph-cb {\n  display: flex;\n  align-items: center;\n  gap: 10px;\n  cursor: pointer;\n  color: #e2e8f0;\n  font-size: 14px;\n}\n.morph-cb input { display: none; }\n.morph-box {\n  width: 22px;\n  height: 22px;\n  border: 2px solid rgba(255,255,255,0.15);\n  border-radius: 6px;\n  display: flex;\n  align-items: center;\n  justify-content: center;\n  transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);\n  background: transparent;\n}\n.morph-check {\n  width: 14px;\n  height: 14px;\n  fill: none;\n  stroke: #fff;\n  stroke-width: 3;\n  stroke-linecap: round;\n  stroke-linejoin: round;\n  stroke-dasharray: 30;\n  stroke-dashoffset: 30;\n  transition: stroke-dashoffset 0.25s ease 0.1s;\n}\ninput:checked + .morph-box {\n  background: #3B82F6;\n  border-color: #3B82F6;\n  transform: scale(1.1);\n}\ninput:checked + .morph-box .morph-check {\n  stroke-dashoffset: 0;\n}\n.morph-cb:hover .morph-box {\n  border-color: #3B82F6;\n}"}
  ]
}'

# ——— MORE BUTTONS ———

create '{
  "title": "Split Icon Button",
  "type": "component",
  "category": "buttons",
  "framework": "css",
  "tags": ["button", "icon", "split"],
  "files": [
    {"filename": "index.html", "content": "<button class=\"split-btn\">\n  <span class=\"split-text\">Download</span>\n  <span class=\"split-icon\">\n    <svg width=\"16\" height=\"16\" viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\"><path d=\"M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4\"/><polyline points=\"7 10 12 15 17 10\"/><line x1=\"12\" y1=\"15\" x2=\"12\" y2=\"3\"/></svg>\n  </span>\n</button>"},
    {"filename": "style.css", "content": ".split-btn {\n  display: inline-flex;\n  align-items: stretch;\n  background: #111827;\n  border: 1px solid rgba(255,255,255,0.08);\n  border-radius: 10px;\n  overflow: hidden;\n  cursor: pointer;\n  color: #e2e8f0;\n  font-size: 14px;\n  font-weight: 500;\n  transition: border-color 0.2s;\n  padding: 0;\n}\n.split-btn:hover { border-color: #3B82F6; }\n.split-text { padding: 10px 20px; }\n.split-icon {\n  display: flex;\n  align-items: center;\n  justify-content: center;\n  padding: 10px 14px;\n  background: rgba(59,130,246,0.1);\n  border-left: 1px solid rgba(255,255,255,0.08);\n  color: #3B82F6;\n  transition: background 0.2s;\n}\n.split-btn:hover .split-icon {\n  background: rgba(59,130,246,0.2);\n}"}
  ]
}'

create '{
  "title": "Chip Selector",
  "type": "component",
  "category": "buttons",
  "framework": "css",
  "tags": ["chip", "tag", "selector"],
  "files": [
    {"filename": "index.html", "content": "<div class=\"chip-group\">\n  <button class=\"chip active\">All</button>\n  <button class=\"chip\">Design</button>\n  <button class=\"chip\">Frontend</button>\n  <button class=\"chip\">Backend</button>\n  <button class=\"chip\">DevOps</button>\n  <button class=\"chip\">Mobile</button>\n</div>"},
    {"filename": "style.css", "content": "body { background: #0B1120; display: flex; justify-content: center; align-items: center; min-height: 100vh; font-family: system-ui, sans-serif; }\n.chip-group { display: flex; flex-wrap: wrap; gap: 8px; }\n.chip {\n  padding: 7px 18px;\n  border-radius: 20px;\n  border: 1px solid rgba(255,255,255,0.08);\n  background: rgba(255,255,255,0.03);\n  color: #94a3b8;\n  font-size: 13px;\n  font-weight: 500;\n  cursor: pointer;\n  transition: all 0.2s;\n}\n.chip:hover { color: #e2e8f0; border-color: rgba(255,255,255,0.15); }\n.chip.active {\n  background: rgba(59,130,246,0.15);\n  border-color: rgba(59,130,246,0.3);\n  color: #60A5FA;\n}"},
    {"filename": "script.js", "content": "document.querySelectorAll('.chip').forEach(c => {\n  c.addEventListener('click', () => {\n    document.querySelectorAll('.chip').forEach(x => x.classList.remove('active'));\n    c.classList.add('active');\n  });\n});"}
  ]
}'

# ——— MORE CARDS ———

create '{
  "title": "Feature Grid Card",
  "type": "component",
  "category": "cards",
  "framework": "css",
  "tags": ["card", "feature", "grid"],
  "files": [
    {"filename": "index.html", "content": "<div class=\"feat-grid\">\n  <div class=\"feat-card\">\n    <div class=\"feat-ic\">&#9889;</div>\n    <h4>Lightning Fast</h4>\n    <p>Optimized for speed with sub-second load times.</p>\n  </div>\n  <div class=\"feat-card\">\n    <div class=\"feat-ic\">&#9881;</div>\n    <h4>Easy Setup</h4>\n    <p>Get started in minutes with zero configuration.</p>\n  </div>\n  <div class=\"feat-card\">\n    <div class=\"feat-ic\">&#9733;</div>\n    <h4>Best Quality</h4>\n    <p>Production-grade components with full test coverage.</p>\n  </div>\n</div>"},
    {"filename": "style.css", "content": "body { background: #0B1120; display: flex; justify-content: center; align-items: center; min-height: 100vh; font-family: system-ui, sans-serif; padding: 20px; }\n.feat-grid { display: grid; grid-template-columns: repeat(3, 200px); gap: 16px; }\n.feat-card {\n  padding: 24px;\n  background: #111827;\n  border: 1px solid rgba(255,255,255,0.06);\n  border-radius: 12px;\n  color: #e2e8f0;\n  transition: all 0.3s;\n}\n.feat-card:hover {\n  border-color: rgba(59,130,246,0.3);\n  transform: translateY(-3px);\n}\n.feat-ic {\n  width: 40px;\n  height: 40px;\n  display: flex;\n  align-items: center;\n  justify-content: center;\n  background: rgba(59,130,246,0.1);\n  border-radius: 10px;\n  font-size: 18px;\n  margin-bottom: 12px;\n}\n.feat-card h4 { font-size: 15px; font-weight: 600; margin-bottom: 6px; }\n.feat-card p { font-size: 13px; color: #94a3b8; line-height: 1.5; margin: 0; }"}
  ]
}'

# ——— MODALS ———

create '{
  "title": "Confirm Dialog",
  "type": "component",
  "category": "modals",
  "framework": "css",
  "tags": ["modal", "dialog", "confirm"],
  "files": [
    {"filename": "index.html", "content": "<div class=\"dlg-overlay\">\n  <div class=\"dlg-card\">\n    <div class=\"dlg-icon\">!</div>\n    <h3 class=\"dlg-title\">Delete Item?</h3>\n    <p class=\"dlg-text\">This action cannot be undone. Are you sure you want to permanently delete this item?</p>\n    <div class=\"dlg-actions\">\n      <button class=\"dlg-btn dlg-btn--cancel\">Cancel</button>\n      <button class=\"dlg-btn dlg-btn--danger\">Delete</button>\n    </div>\n  </div>\n</div>"},
    {"filename": "style.css", "content": "body { margin: 0; background: #0B1120; font-family: system-ui, sans-serif; }\n.dlg-overlay {\n  position: fixed;\n  inset: 0;\n  background: rgba(0,0,0,0.6);\n  backdrop-filter: blur(4px);\n  display: flex;\n  align-items: center;\n  justify-content: center;\n}\n.dlg-card {\n  width: 360px;\n  padding: 28px;\n  background: #111827;\n  border: 1px solid rgba(255,255,255,0.06);\n  border-radius: 16px;\n  text-align: center;\n  color: #e2e8f0;\n  animation: dlg-pop 0.2s ease;\n}\n@keyframes dlg-pop {\n  from { transform: scale(0.95); opacity: 0; }\n}\n.dlg-icon {\n  width: 48px;\n  height: 48px;\n  margin: 0 auto 16px;\n  background: rgba(239,68,68,0.1);\n  border-radius: 50%;\n  display: flex;\n  align-items: center;\n  justify-content: center;\n  font-size: 22px;\n  font-weight: 700;\n  color: #EF4444;\n}\n.dlg-title { font-size: 18px; font-weight: 700; margin-bottom: 8px; }\n.dlg-text { font-size: 14px; color: #94a3b8; line-height: 1.5; margin-bottom: 24px; }\n.dlg-actions { display: flex; gap: 10px; }\n.dlg-btn {\n  flex: 1;\n  padding: 10px;\n  border: none;\n  border-radius: 8px;\n  font-size: 14px;\n  font-weight: 600;\n  cursor: pointer;\n  transition: background 0.2s;\n}\n.dlg-btn--cancel {\n  background: rgba(255,255,255,0.06);\n  color: #e2e8f0;\n}\n.dlg-btn--cancel:hover { background: rgba(255,255,255,0.1); }\n.dlg-btn--danger { background: #EF4444; color: #fff; }\n.dlg-btn--danger:hover { background: #DC2626; }"}
  ]
}'

# ——— FOOTERS ———

create '{
  "title": "Simple Footer",
  "type": "component",
  "category": "footers",
  "framework": "css",
  "tags": ["footer", "layout", "links"],
  "files": [
    {"filename": "index.html", "content": "<footer class=\"sf\">\n  <div class=\"sf-inner\">\n    <div class=\"sf-brand\">\n      <strong>Acme Inc</strong>\n      <p>Building tools for the modern web.</p>\n    </div>\n    <div class=\"sf-col\">\n      <h4>Product</h4>\n      <a href=\"#\">Features</a>\n      <a href=\"#\">Pricing</a>\n      <a href=\"#\">Changelog</a>\n    </div>\n    <div class=\"sf-col\">\n      <h4>Company</h4>\n      <a href=\"#\">About</a>\n      <a href=\"#\">Blog</a>\n      <a href=\"#\">Careers</a>\n    </div>\n    <div class=\"sf-col\">\n      <h4>Legal</h4>\n      <a href=\"#\">Privacy</a>\n      <a href=\"#\">Terms</a>\n    </div>\n  </div>\n  <div class=\"sf-bottom\">\n    &copy; 2026 Acme Inc. All rights reserved.\n  </div>\n</footer>"},
    {"filename": "style.css", "content": "body { margin: 0; background: #0B1120; font-family: system-ui, sans-serif; display: flex; flex-direction: column; min-height: 100vh; }\n.sf {\n  margin-top: auto;\n  border-top: 1px solid rgba(255,255,255,0.06);\n  background: #0B1120;\n  color: #e2e8f0;\n}\n.sf-inner {\n  display: grid;\n  grid-template-columns: 2fr 1fr 1fr 1fr;\n  gap: 32px;\n  padding: 40px;\n}\n.sf-brand strong { font-size: 16px; display: block; margin-bottom: 6px; }\n.sf-brand p { font-size: 13px; color: #64748b; margin: 0; }\n.sf-col { display: flex; flex-direction: column; gap: 6px; }\n.sf-col h4 { font-size: 13px; font-weight: 600; color: #94a3b8; margin: 0 0 4px; }\n.sf-col a { font-size: 13px; color: #64748b; text-decoration: none; transition: color 0.15s; }\n.sf-col a:hover { color: #e2e8f0; }\n.sf-bottom {\n  text-align: center;\n  padding: 16px;\n  border-top: 1px solid rgba(255,255,255,0.04);\n  font-size: 12px;\n  color: #475569;\n}"}
  ]
}'

echo ""
echo "=== Done! ==="
