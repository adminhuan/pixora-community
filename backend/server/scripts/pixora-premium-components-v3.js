const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

const toSlug = (value) =>
  String(value)
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9\u4e00-\u9fa5\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');

const COLORS = {
  bg: '#040B14',
  panel: '#0F172A',
  panel2: '#111827',
  text: '#E2E8F0',
  muted: '#94A3B8',
  blue: '#1D4ED8',
  cyan: '#06B6D4',
  teal: '#0D9488',
  emerald: '#10B981',
  amber: '#F59E0B',
  red: '#EF4444',
  border: 'rgba(148,163,184,.24)'
};

const makeCss = ({ title, description, category, tags, html, css }) => ({
  title,
  description,
  category,
  framework: 'css',
  tags,
  files: [
    { filename: 'index.html', language: 'html', content: html },
    { filename: 'style.css', language: 'css', content: css }
  ]
});

const makeTailwind = ({ title, description, category, tags, html, css }) => ({
  title,
  description,
  category,
  framework: 'tailwind',
  tags,
  files: [
    { filename: 'index.html', language: 'html', content: html },
    {
      filename: 'style.css',
      language: 'css',
      content:
        css ||
        'body{margin:0;min-height:100vh;background:#040B14;display:flex;align-items:center;justify-content:center;padding:24px;font-family:Inter,Noto Sans SC,system-ui,sans-serif;}'
    }
  ]
});

const makeReact = ({ title, description, category, tags, jsx, css }) => ({
  title,
  description,
  category,
  framework: 'react',
  tags,
  files: [
    { filename: 'index.html', language: 'html', content: '<div id="root"></div>' },
    { filename: 'app.jsx', language: 'javascript', content: jsx },
    {
      filename: 'style.css',
      language: 'css',
      content:
        css ||
        'body{margin:0;min-height:100vh;background:#040B14;color:#E2E8F0;font-family:Inter,Noto Sans SC,system-ui,sans-serif;padding:16px;}'
    }
  ]
});

const components = [];

const buttonSet = [
  ['Helix Prime Action Button', '发布作品', COLORS.blue, COLORS.cyan],
  ['Helix Ocean Action Button', '生成海报', '#0EA5E9', '#06B6D4'],
  ['Helix Guard Action Button', '开启防护', '#0F766E', '#10B981'],
  ['Helix Alert Action Button', '处理风险', '#EA580C', '#EF4444'],
  ['Helix Launch Action Button', '立即启动', '#1D4ED8', '#0EA5E9'],
  ['Helix Team Action Button', '邀请成员', '#0369A1', '#14B8A6']
];

buttonSet.forEach(([title, label, c1, c2]) => {
  components.push(
    makeCss({
      title,
      description: '高质感渐变按钮，适配主操作位。',
      category: 'buttons',
      tags: ['button', 'cta', 'premium', 'dark'],
      html: `<button class="hx-btn"><span>${label}</span></button>`,
      css: `body{min-height:100vh;display:grid;place-items:center;background:${COLORS.bg};font-family:Inter,Noto Sans SC,system-ui,sans-serif}.hx-btn{height:48px;padding:0 28px;border:none;border-radius:14px;background:linear-gradient(135deg,${c1},${c2});color:#fff;font-size:14px;font-weight:600;cursor:pointer;box-shadow:0 16px 40px rgba(2,6,23,.62);position:relative;overflow:hidden;transition:transform .22s ease,box-shadow .22s ease}.hx-btn::before{content:'';position:absolute;left:-60%;top:0;width:55%;height:100%;background:linear-gradient(90deg,transparent,rgba(255,255,255,.34),transparent);transform:skewX(-16deg);transition:left .5s ease}.hx-btn:hover{transform:translateY(-2px);box-shadow:0 20px 44px rgba(2,6,23,.66)}.hx-btn:hover::before{left:120%}.hx-btn:active{transform:translateY(0)}.hx-btn span{position:relative;z-index:1}`
    })
  );
});

const cardSet = [
  ['Helix Revenue Glass Card', '本月营收', '¥ 926,800', '+24.3%', COLORS.emerald],
  ['Helix Users Glass Card', '活跃用户', '26,704', '+19.7%', COLORS.blue],
  ['Helix Growth Glass Card', '增长率', '13.4%', '+4.2%', COLORS.cyan],
  ['Helix Retention Glass Card', '留存率', '72.1%', '+3.9%', COLORS.teal],
  ['Helix Session Glass Card', '平均停留', '10m 32s', '+15.3%', COLORS.cyan],
  ['Helix Search Glass Card', '搜索访问', '402,590', '+22.0%', COLORS.blue],
  ['Helix Stability Glass Card', '服务稳定性', '99.99%', '+0.2%', COLORS.emerald],
  ['Helix Security Glass Card', '风险告警', '6', '-58.8%', COLORS.red],
  ['Helix Queue Glass Card', '审核队列', '21', '-35.2%', COLORS.amber],
  ['Helix Publish Glass Card', '发布通过率', '98.9%', '+1.7%', COLORS.emerald]
];

cardSet.forEach(([title, label, value, trend, accent]) => {
  components.push(
    makeCss({
      title,
      description: '玻璃态数据卡片，适配后台总览页。',
      category: 'cards',
      tags: ['card', 'dashboard', 'glass', 'metric'],
      html: `<article class="hx-card"><header><p>${label}</p><span></span></header><h3>${value}</h3><small>${trend} 较上周</small><div class="track"><i></i></div></article>`,
      css: `body{min-height:100vh;display:grid;place-items:center;background:${COLORS.bg};font-family:Inter,Noto Sans SC,system-ui,sans-serif}.hx-card{width:298px;padding:22px;border-radius:16px;background:linear-gradient(180deg,rgba(15,23,42,.95),rgba(17,24,39,.95));border:1px solid ${COLORS.border};color:${COLORS.text};position:relative;overflow:hidden;box-shadow:0 16px 40px rgba(2,6,23,.62)}.hx-card::after{content:'';position:absolute;right:-56px;top:-70px;width:180px;height:180px;background:radial-gradient(circle,${accent}40,transparent 64%)}.hx-card header{display:flex;align-items:center;justify-content:space-between}.hx-card p{margin:0;color:${COLORS.muted};font-size:12px;letter-spacing:.04em;text-transform:uppercase}.hx-card span{width:8px;height:8px;border-radius:999px;background:${accent};box-shadow:0 0 0 4px ${accent}2a}.hx-card h3{margin:12px 0 6px;font-size:34px;line-height:1.1;color:#F8FAFC}.hx-card small{font-size:13px;color:${accent}}.track{margin-top:14px;height:6px;border-radius:999px;background:rgba(148,163,184,.2);overflow:hidden}.track i{display:block;width:72%;height:100%;background:linear-gradient(90deg,${accent},${COLORS.cyan});border-radius:999px}`
    })
  );
});

const heroSet = [
  ['Helix SaaS Hero Pattern', '一个界面，打通论坛与组件资产管理', '从创作、发布到运营分析全链路在线协同。'],
  ['Helix Community Hero Pattern', '社区内容与组件生态同步增长', '围绕内容质量、互动效率与数据增长打造统一体验。'],
  ['Helix Product Hero Pattern', '让产品迭代速度快于需求变化', '覆盖需求收集、研发协作、发布上线与监控反馈。'],
  ['Helix Security Hero Pattern', '安全能力内置在每个关键操作', '认证、审计、告警与风控策略统一接入。'],
  ['Helix Growth Hero Pattern', '让每次发布都可量化评估', '将访问、收藏、评论、转化统一纳入看板。']
];

heroSet.forEach(([title, heading, sub]) => {
  components.push(
    makeTailwind({
      title,
      description: '科技感 Hero 展示区，适配首页与活动页。',
      category: 'patterns',
      tags: ['hero', 'landing', 'tailwind', 'showcase'],
      html: `<section class="w-[min(980px,95vw)] rounded-3xl border border-slate-500/30 bg-gradient-to-br from-slate-950 via-slate-900 to-cyan-950 p-8 text-slate-100 shadow-2xl shadow-slate-950/70"><p class="inline-flex rounded-full border border-cyan-500/30 bg-cyan-500/10 px-3 py-1 text-xs text-cyan-300">Pixora Suite</p><h1 class="mt-4 text-3xl md:text-4xl font-semibold leading-tight">${heading}</h1><p class="mt-3 max-w-2xl text-slate-300">${sub}</p><div class="mt-6 flex flex-wrap gap-3"><button class="h-11 px-5 rounded-xl bg-gradient-to-r from-sky-600 to-cyan-500 text-sm font-medium text-white">立即体验</button><button class="h-11 px-5 rounded-xl border border-slate-500/30 text-sm text-slate-200">查看文档</button></div></section>`
    })
  );
});

const navSet = [
  ['Helix Studio Floating Navbar', 'Pixora Studio', ['组件库', '模板', '文档', '案例'], '发布组件'],
  ['Helix Console Floating Navbar', 'Pixora Console', ['总览', '告警', '任务', '设置'], '创建项目'],
  ['Helix Community Floating Navbar', 'Pixora Community', ['论坛', '问答', '教程', '动态'], '发帖'],
  ['Helix Market Floating Navbar', 'Pixora Market', ['精选', '热门', '趋势', '分类'], '提交作品']
];

navSet.forEach(([title, brand, links, action]) => {
  components.push(
    makeTailwind({
      title,
      description: '高质感浮层导航栏，适配内容社区与后台。',
      category: 'navbars',
      tags: ['navbar', 'header', 'glass', 'tailwind'],
      html: `<header class="w-[min(980px,95vw)] h-16 rounded-2xl border border-slate-500/30 bg-slate-900/70 px-4 backdrop-blur-xl shadow-2xl shadow-slate-950/55 flex items-center justify-between text-slate-100"><strong class="tracking-wide">${brand}</strong><nav class="hidden md:flex items-center gap-4 text-sm text-slate-300">${links.map((item) => `<a class="hover:text-slate-100 transition-colors" href="#">${item}</a>`).join('')}</nav><button class="h-10 px-4 rounded-xl bg-gradient-to-r from-sky-600 to-cyan-500 text-white text-sm font-medium">${action}</button></header>`
    })
  );
});

const modalSet = [
  ['Helix Confirm Glass Modal', '确认发布', '提交后将进入审核队列并通知管理员。', COLORS.blue],
  ['Helix Delete Glass Modal', '确认删除', '删除后不可恢复，建议先执行备份。', COLORS.red],
  ['Helix Risk Glass Modal', '风险提醒', '检测到权限冲突，请确认操作人身份。', COLORS.amber],
  ['Helix Upgrade Glass Modal', '升级提示', '开通专业版以获得更高配额与协作能力。', COLORS.cyan]
];

modalSet.forEach(([title, heading, desc, accent]) => {
  components.push(
    makeTailwind({
      title,
      description: '玻璃态业务弹窗，适配确认和告警场景。',
      category: 'modals',
      tags: ['modal', 'dialog', 'tailwind', 'glass'],
      html: `<div class="w-[390px] rounded-2xl border border-slate-500/30 bg-slate-900/80 p-5 shadow-2xl shadow-slate-950/65 text-slate-100"><h3 class="text-xl font-semibold">${heading}</h3><p class="mt-2 text-sm text-slate-400">${desc}</p><div class="mt-5 flex gap-3"><button class="h-10 flex-1 rounded-xl border border-slate-500/30 text-sm text-slate-300">取消</button><button class="h-10 flex-1 rounded-xl text-sm text-white" style="background:${accent}">确认</button></div></div>`
    })
  );
});

const formSet = [
  ['Helix Login Pro Form', '欢迎回来', '继续管理你的论坛与组件资产'],
  ['Helix Register Pro Form', '创建账户', '加入 Pixora 创作者社区'],
  ['Helix Ticket Pro Form', '提交工单', '技术团队将在 24 小时内响应'],
  ['Helix Contact Pro Form', '商务咨询', '填写需求，获取部署建议']
];

formSet.forEach(([title, heading, sub]) => {
  components.push(
    makeTailwind({
      title,
      description: '高质感业务表单，适配认证和联系场景。',
      category: 'forms',
      tags: ['form', 'auth', 'tailwind', 'business'],
      html: `<form class="w-[360px] rounded-2xl border border-slate-500/30 bg-slate-900/80 p-5 text-slate-100 shadow-2xl shadow-slate-950/60"><h3 class="text-2xl font-semibold">${heading}</h3><p class="mt-2 text-sm text-slate-400">${sub}</p><label class="mt-4 block text-xs text-slate-400">邮箱地址<input class="mt-1 h-11 w-full rounded-xl border border-slate-500/30 bg-slate-950/60 px-3 text-sm text-slate-100 outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20" placeholder="name@pixora.vip"/></label><label class="mt-3 block text-xs text-slate-400">密码<input type="password" class="mt-1 h-11 w-full rounded-xl border border-slate-500/30 bg-slate-950/60 px-3 text-sm text-slate-100 outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20" placeholder="请输入密码"/></label><button type="button" class="mt-4 h-11 w-full rounded-xl bg-gradient-to-r from-sky-600 to-cyan-500 text-sm font-medium text-white">提交</button></form>`
    })
  );
});

const loaderSet = [
  ['Helix Orbit Pulse Loader', COLORS.blue],
  ['Helix Aurora Ring Loader', COLORS.cyan],
  ['Helix Flux Spin Loader', COLORS.emerald],
  ['Helix Stream Loop Loader', COLORS.teal]
];

loaderSet.forEach(([title, accent]) => {
  components.push(
    makeCss({
      title,
      description: '科技风加载动画，适配异步请求和页面占位。',
      category: 'loaders',
      tags: ['loader', 'animation', 'css', 'dark'],
      html: '<div class="hx-loader"><span></span><span></span><span></span></div>',
      css: `body{margin:0;min-height:100vh;display:grid;place-items:center;background:${COLORS.bg}}.hx-loader{position:relative;width:78px;height:78px}.hx-loader span{position:absolute;inset:0;border:2px solid transparent;border-top-color:${accent};border-right-color:${accent}88;border-radius:50%;animation:spin 1.2s linear infinite}.hx-loader span:nth-child(2){inset:10px;animation-duration:.9s;opacity:.76}.hx-loader span:nth-child(3){inset:20px;animation-duration:.62s;opacity:.58}@keyframes spin{to{transform:rotate(360deg)}}`
    })
  );
});

const inputSet = [
  ['Helix Command Search Input', '搜索组件、标签、作者', '/'],
  ['Helix Global Search Input', '全站搜索内容', 'K'],
  ['Helix Docs Search Input', '搜索文档与示例', 'D']
];

inputSet.forEach(([title, placeholder, key]) => {
  components.push(
    makeTailwind({
      title,
      description: '命令式搜索输入框，适配导航和资源库。',
      category: 'inputs',
      tags: ['input', 'search', 'command', 'tailwind'],
      html: `<label class="w-[420px] h-12 rounded-2xl border border-slate-500/30 bg-slate-900/80 px-3 flex items-center gap-2 text-slate-400 shadow-xl shadow-slate-950/50"><svg viewBox="0 0 24 24" class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="7"></circle><path d="M20 20l-4-4"></path></svg><input class="flex-1 bg-transparent outline-none text-sm text-slate-100 placeholder:text-slate-500" placeholder="${placeholder}"/><kbd class="h-6 min-w-6 rounded-md border border-slate-500/30 bg-slate-800 px-2 text-xs text-slate-400">${key}</kbd></label>`
    })
  );
});

components.push(
  makeTailwind({
    title: 'Helix Notification Toggle Panel',
    description: '通知开关组件，适配设置中心。',
    category: 'toggles',
    tags: ['toggle', 'settings', 'tailwind'],
    html: '<section class="w-[420px] rounded-2xl border border-slate-500/30 bg-slate-900/80 p-4 text-slate-100"><h3 class="text-base font-medium">通知设置</h3><div class="mt-3 space-y-2"><label class="flex items-center justify-between rounded-xl border border-slate-500/20 bg-slate-950/40 px-3 py-2 text-sm"><span>私信提醒</span><button class="h-6 w-11 rounded-full bg-cyan-500/70 p-1"><span class="block h-4 w-4 translate-x-5 rounded-full bg-white"></span></button></label><label class="flex items-center justify-between rounded-xl border border-slate-500/20 bg-slate-950/40 px-3 py-2 text-sm"><span>评论提醒</span><button class="h-6 w-11 rounded-full bg-slate-600 p-1"><span class="block h-4 w-4 rounded-full bg-white"></span></button></label><label class="flex items-center justify-between rounded-xl border border-slate-500/20 bg-slate-950/40 px-3 py-2 text-sm"><span>安全告警</span><button class="h-6 w-11 rounded-full bg-cyan-500/70 p-1"><span class="block h-4 w-4 translate-x-5 rounded-full bg-white"></span></button></label></div></section>'
  })
);

const reactSet = [
  [
    'Helix React KPI Matrix',
    'cards',
    `const rows=[{label:'活跃用户',value:'26,704',trend:'+19%'},{label:'发布组件',value:'1,028',trend:'+27%'},{label:'审核通过率',value:'97.1%',trend:'+1.9%'},{label:'收藏总量',value:'136,420',trend:'+23%'}];
const App=()=>(
  <section style={{maxWidth:900,margin:'0 auto',display:'grid',gridTemplateColumns:'repeat(2,minmax(0,1fr))',gap:12}}>
    {rows.map((item)=>(
      <article key={item.label} style={{border:'1px solid rgba(148,163,184,.24)',borderRadius:14,padding:16,background:'linear-gradient(180deg,rgba(15,23,42,.95),rgba(17,24,39,.95))',boxShadow:'0 12px 32px rgba(2,6,23,.5)'}}>
        <p style={{margin:0,fontSize:12,color:'#94A3B8'}}>{item.label}</p>
        <h3 style={{margin:'8px 0 6px',fontSize:30,color:'#F8FAFC'}}>{item.value}</h3>
        <small style={{color:'#10B981'}}>{item.trend} vs 上周</small>
      </article>
    ))}
  </section>
);
ReactDOM.createRoot(document.getElementById('root')).render(<App/>);`
  ],
  [
    'Helix React Segment Board',
    'other',
    `const tabs=['概览','论坛','组件','告警','设置'];
const App=()=>{
  const [active,setActive]=React.useState('概览');
  return <section style={{maxWidth:760,margin:'0 auto'}}>
    <div style={{display:'flex',gap:8,flexWrap:'wrap'}}>
      {tabs.map((tab)=>{
        const on=tab===active;
        return <button key={tab} onClick={()=>setActive(tab)} style={{height:38,padding:'0 14px',borderRadius:10,border:on?'1px solid #1D4ED8':'1px solid rgba(148,163,184,.28)',background:on?'rgba(29,78,216,.22)':'#0F172A',color:on?'#DBEAFE':'#CBD5E1',cursor:'pointer'}}>{tab}</button>;
      })}
    </div>
    <article style={{marginTop:12,border:'1px solid rgba(148,163,184,.24)',borderRadius:14,padding:16,background:'#111827'}}>
      <h3 style={{margin:'0 0 6px',color:'#F8FAFC'}}>{active} 面板</h3>
      <p style={{margin:0,fontSize:13,color:'#94A3B8'}}>当前面板可接入真实业务数据联动。</p>
    </article>
  </section>;
};
ReactDOM.createRoot(document.getElementById('root')).render(<App/>);`
  ],
  [
    'Helix React Timeline Activity',
    'other',
    `const logs=[{time:'09:20',text:'发布了组件 Helix Button Suite'},{time:'10:05',text:'后台通过了审核任务'},{time:'11:12',text:'论坛新增 26 条互动评论'},{time:'11:48',text:'触发安全策略更新'}];
const App=()=>(
  <section style={{maxWidth:620,margin:'0 auto',border:'1px solid rgba(148,163,184,.24)',borderRadius:14,padding:14,background:'#0F172A'}}>
    <h3 style={{margin:'0 0 12px',color:'#F8FAFC'}}>活动时间线</h3>
    {logs.map((log,index)=>(
      <article key={log.time+log.text} style={{display:'flex',gap:10,padding:'10px 0',borderTop:index?'1px solid rgba(148,163,184,.16)':'none'}}>
        <div style={{marginTop:2,width:8,height:8,borderRadius:999,background:'#06B6D4',boxShadow:'0 0 0 4px rgba(6,182,212,.2)'}}></div>
        <div>
          <small style={{color:'#94A3B8'}}>{log.time}</small>
          <p style={{margin:'4px 0 0',fontSize:13,color:'#CBD5E1'}}>{log.text}</p>
        </div>
      </article>
    ))}
  </section>
);
ReactDOM.createRoot(document.getElementById('root')).render(<App/>);`
  ],
  [
    'Helix React Command Panel',
    'other',
    `const rows=['创建组件','发布帖子','打开审核队列','查看风险日志','进入系统设置'];
const App=()=>{
  const [q,setQ]=React.useState('');
  const list=rows.filter((item)=>item.includes(q));
  return <section style={{maxWidth:560,margin:'0 auto',border:'1px solid rgba(148,163,184,.24)',borderRadius:14,overflow:'hidden',background:'#0F172A'}}>
    <input value={q} onChange={(e)=>setQ(e.target.value)} placeholder='输入命令关键字' style={{width:'100%',height:44,padding:'0 12px',border:'none',outline:'none',background:'#111827',color:'#E2E8F0'}} />
    <div style={{padding:8}}>
      {list.map((item)=>(
        <button key={item} style={{display:'block',width:'100%',textAlign:'left',height:36,border:'none',background:'transparent',color:'#CBD5E1',borderRadius:8,padding:'0 10px',cursor:'pointer'}}>{item}</button>
      ))}
    </div>
  </section>;
};
ReactDOM.createRoot(document.getElementById('root')).render(<App/>);`
  ],
  [
    'Helix React Message List',
    'alerts',
    `const rows=[{name:'系统通知',time:'刚刚',text:'你发布的组件已进入精选区'},{name:'互动消息',time:'7 分钟前',text:'有用户回复了你的帖子'},{name:'安全提醒',time:'21 分钟前',text:'检测到新设备登录，请确认'}];
const App=()=>(
  <section style={{maxWidth:620,margin:'0 auto'}}>
    {rows.map((row)=>(
      <article key={row.name+row.time} style={{marginBottom:10,border:'1px solid rgba(148,163,184,.24)',borderRadius:12,padding:12,background:'rgba(15,23,42,.92)'}}>
        <div style={{display:'flex',justifyContent:'space-between',fontSize:12,color:'#94A3B8'}}>
          <strong style={{fontSize:14,color:'#F8FAFC'}}>{row.name}</strong>
          <span>{row.time}</span>
        </div>
        <p style={{margin:'8px 0 0',fontSize:13,color:'#CBD5E1'}}>{row.text}</p>
      </article>
    ))}
  </section>
);
ReactDOM.createRoot(document.getElementById('root')).render(<App/>);`
  ],
  [
    'Helix React Workflow Stepper',
    'other',
    `const steps=['填写信息','上传源码','预览检查','提交审核','发布完成'];
const App=()=>{
  const [index,setIndex]=React.useState(2);
  return <section style={{maxWidth:880,margin:'0 auto'}}>
    <div style={{display:'grid',gridTemplateColumns:'repeat(5,minmax(0,1fr))',gap:8}}>
      {steps.map((step,i)=>{
        const on=i<=index;
        return <button key={step} onClick={()=>setIndex(i)} style={{height:44,borderRadius:10,padding:'0 8px',border:on?'1px solid #1D4ED8':'1px solid rgba(148,163,184,.26)',background:on?'rgba(29,78,216,.2)':'#111827',color:on?'#DBEAFE':'#CBD5E1',cursor:'pointer',fontSize:12}}>{i+1}. {step}</button>;
      })}
    </div>
  </section>;
};
ReactDOM.createRoot(document.getElementById('root')).render(<App/>);`
  ],
  [
    'Helix React Team Feed',
    'other',
    `const logs=[{name:'产品经理',action:'更新了社区发布策略',time:'3 分钟前'},{name:'设计师',action:'新增 5 个高阶组件',time:'17 分钟前'},{name:'后端',action:'修复消息限流策略',time:'34 分钟前'}];
const App=()=>(
  <section style={{maxWidth:640,margin:'0 auto',border:'1px solid rgba(148,163,184,.24)',borderRadius:14,padding:14,background:'#0F172A'}}>
    <h3 style={{margin:'0 0 10px',color:'#F8FAFC'}}>团队动态</h3>
    {logs.map((log,index)=>(
      <article key={log.name+log.time} style={{padding:'10px 0',borderTop:index?'1px solid rgba(148,163,184,.16)':'none'}}>
        <p style={{margin:0,fontSize:13,color:'#CBD5E1'}}><strong style={{color:'#F8FAFC'}}>{log.name}</strong> {log.action}</p>
        <small style={{color:'#94A3B8'}}>{log.time}</small>
      </article>
    ))}
  </section>
);
ReactDOM.createRoot(document.getElementById('root')).render(<App/>);`
  ],
  [
    'Helix React Toggle Settings',
    'toggles',
    `const items=['私信提醒','评论提醒','审核提醒','系统告警'];
const App=()=>{
  const [state,setState]=React.useState({0:true,1:true,2:false,3:true});
  const toggle=(i)=>setState((prev)=>({...prev,[i]:!prev[i]}));
  return <section style={{maxWidth:520,margin:'0 auto',border:'1px solid rgba(148,163,184,.24)',borderRadius:14,padding:14,background:'#111827'}}>
    <h3 style={{margin:'0 0 12px',color:'#F8FAFC'}}>通知设置</h3>
    {items.map((item,index)=>{
      const on=state[index];
      return <label key={item} style={{display:'flex',justifyContent:'space-between',alignItems:'center',padding:'8px 0',borderTop:index?'1px solid rgba(148,163,184,.16)':'none'}}>
        <span style={{fontSize:13,color:'#CBD5E1'}}>{item}</span>
        <button onClick={()=>toggle(index)} style={{width:44,height:24,border:'none',borderRadius:999,background:on?'#06B6D4':'#334155',padding:2,cursor:'pointer'}}>
          <i style={{display:'block',width:20,height:20,borderRadius:999,background:'#fff',transform:on?'translateX(20px)':'translateX(0)',transition:'transform .2s'}}></i>
        </button>
      </label>;
    })}
  </section>;
};
ReactDOM.createRoot(document.getElementById('root')).render(<App/>);`
  ]
];

reactSet.forEach(([title, category, jsx]) => {
  components.push(
    makeReact({
      title,
      description: 'React 交互组件，适配控制台和社区核心场景。',
      category,
      tags: ['react', 'interactive', 'dashboard', 'premium'],
      jsx
    })
  );
});

(async () => {
  const admin = await prisma.user.findFirst({
    where: { role: 'admin' },
    select: { id: true, username: true }
  });

  if (!admin) {
    throw new Error('未找到管理员账号');
  }

  await prisma.codeSnippet.updateMany({
    where: {
      type: 'component',
      visibility: 'public',
      authorId: admin.id,
      isFeatured: true
    },
    data: { isFeatured: false }
  });

  const tagCache = new Map();
  let created = 0;
  let skipped = 0;
  let updated = 0;

  for (let index = 0; index < components.length; index += 1) {
    const comp = components[index];
    const likeBase = 520 - index;
    const viewBase = 7600 - index * 23;

    const exists = await prisma.codeSnippet.findFirst({
      where: {
        title: comp.title,
        type: 'component',
        authorId: admin.id
      },
      select: { id: true }
    });

    if (exists) {
      await prisma.codeSnippet.update({
        where: { id: exists.id },
        data: {
          description: comp.description,
          category: comp.category,
          framework: comp.framework,
          isFeatured: index < 28,
          isRecommended: index % 2 === 0,
          likeCount: likeBase,
          viewCount: viewBase,
          favoriteCount: 130 - (index % 28),
          forkCount: 36 - (index % 12),
          commentCount: 20 - (index % 7)
        }
      });
      skipped += 1;
      updated += 1;
      continue;
    }

    const tagCreates = [];
    for (const tagName of comp.tags) {
      const slug = toSlug(tagName);
      let tagId = tagCache.get(slug);

      if (!tagId) {
        const tag = await prisma.tag.upsert({
          where: { slug },
          update: { name: tagName },
          create: { name: tagName, slug },
          select: { id: true }
        });
        tagId = tag.id;
        tagCache.set(slug, tagId);
      }

      tagCreates.push({ tag: { connect: { id: tagId } } });
    }

    await prisma.codeSnippet.create({
      data: {
        title: comp.title,
        description: comp.description,
        authorId: admin.id,
        visibility: 'public',
        type: 'component',
        category: comp.category,
        framework: comp.framework,
        likeCount: likeBase,
        viewCount: viewBase,
        favoriteCount: 130 - (index % 28),
        forkCount: 36 - (index % 12),
        commentCount: 20 - (index % 7),
        isRecommended: index % 2 === 0,
        isFeatured: index < 28,
        files: { create: comp.files },
        tags: { create: tagCreates }
      }
    });

    for (const tagName of comp.tags) {
      const slug = toSlug(tagName);
      await prisma.tag.update({
        where: { slug },
        data: { usageCount: { increment: 1 } }
      });
    }

    created += 1;
  }

  const total = await prisma.codeSnippet.count({
    where: { type: 'component', visibility: 'public' }
  });

  const featured = await prisma.codeSnippet.findMany({
    where: { type: 'component', visibility: 'public', isFeatured: true },
    select: { title: true, framework: true, likeCount: true, viewCount: true },
    orderBy: [{ likeCount: 'desc' }, { viewCount: 'desc' }],
    take: 12
  });

  const popular = await prisma.codeSnippet.findMany({
    where: { type: 'component', visibility: 'public' },
    select: { title: true, framework: true, likeCount: true, viewCount: true },
    orderBy: [{ likeCount: 'desc' }, { viewCount: 'desc' }],
    take: 12
  });

  console.log(
    JSON.stringify(
      {
        admin: admin.username,
        prepared: components.length,
        created,
        skipped,
        updated,
        total,
        featured,
        popular
      },
      null,
      2
    )
  );
})()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
