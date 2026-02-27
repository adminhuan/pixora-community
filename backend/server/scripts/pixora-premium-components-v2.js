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
  bg: '#050B16',
  panel: '#0F172A',
  panel2: '#111827',
  text: '#E2E8F0',
  muted: '#94A3B8',
  blue: '#2563EB',
  cyan: '#06B6D4',
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
        'body{margin:0;min-height:100vh;background:#050B16;display:flex;align-items:center;justify-content:center;padding:24px;font-family:Inter,Noto Sans SC,system-ui,sans-serif;}'
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
        'body{margin:0;min-height:100vh;background:#050B16;font-family:Inter,Noto Sans SC,system-ui,sans-serif;color:#E2E8F0;padding:16px;}'
    }
  ]
});

const components = [];

const buttonPresets = [
  ['Nexus Beam Action Button', '立即创建', COLORS.blue, COLORS.cyan],
  ['Nexus Pulse Deploy Button', '一键发布', '#1D4ED8', '#0891B2'],
  ['Nexus Core Save Button', '保存草稿', '#0EA5E9', '#06B6D4'],
  ['Nexus Growth Trigger Button', '启动增长', '#2563EB', '#0EA5E9'],
  ['Nexus Shield Guard Button', '安全扫描', '#0F766E', '#10B981'],
  ['Nexus Radar Alert Button', '检查风险', '#EA580C', '#EF4444'],
  ['Nexus Studio Export Button', '导出海报', '#0284C7', '#22D3EE'],
  ['Nexus Pro Upgrade Button', '升级专业版', '#0369A1', '#0EA5E9'],
  ['Nexus Team Invite Button', '邀请成员', '#2563EB', '#38BDF8'],
  ['Nexus Publish Queue Button', '提交审核', '#0E7490', '#06B6D4']
];

buttonPresets.forEach(([title, label, c1, c2]) => {
  components.push(
    makeCss({
      title,
      description: '科技感渐变主按钮，适合主操作区与 CTA 区域。',
      category: 'buttons',
      tags: ['button', 'premium', 'cta', 'dark'],
      html: `<button class="nx-btn"><span>${label}</span><i></i></button>`,
      css: `body{min-height:100vh;display:flex;align-items:center;justify-content:center;background:${COLORS.bg};font-family:Inter,Noto Sans SC,system-ui,sans-serif}.nx-btn{position:relative;height:48px;padding:0 28px;border:none;border-radius:14px;cursor:pointer;background:linear-gradient(135deg,${c1},${c2});color:#fff;font-size:14px;font-weight:600;letter-spacing:.01em;box-shadow:0 14px 34px rgba(2,6,23,.55);overflow:hidden;transition:transform .24s ease,box-shadow .24s ease}.nx-btn i{position:absolute;inset:-1px;border-radius:14px;border:1px solid rgba(255,255,255,.22);pointer-events:none}.nx-btn::before{content:'';position:absolute;left:-65%;top:0;width:55%;height:100%;background:linear-gradient(90deg,transparent,rgba(255,255,255,.3),transparent);transform:skewX(-18deg);transition:left .55s ease}.nx-btn:hover{transform:translateY(-2px);box-shadow:0 18px 42px rgba(2,6,23,.62)}.nx-btn:hover::before{left:120%}.nx-btn:active{transform:translateY(0)}.nx-btn span{position:relative;z-index:1}`
    })
  );
});

const cardPresets = [
  ['Nexus Revenue Crystal Card', '本月营收', '¥ 632,400', '+21.4%', COLORS.emerald],
  ['Nexus Users Crystal Card', '活跃用户', '18,972', '+16.8%', COLORS.blue],
  ['Nexus Session Crystal Card', '平均会话', '08m 24s', '+9.7%', COLORS.cyan],
  ['Nexus Retention Crystal Card', '7日留存', '68.2%', '+3.1%', COLORS.blue],
  ['Nexus Conversion Crystal Card', '转化率', '9.36%', '+2.8%', COLORS.emerald],
  ['Nexus Stability Crystal Card', '服务稳定性', '99.99%', '+0.3%', COLORS.emerald],
  ['Nexus Search Crystal Card', '搜索访问', '296,300', '+19.2%', COLORS.cyan],
  ['Nexus Deploy Crystal Card', '发布成功率', '98.1%', '+1.2%', COLORS.blue],
  ['Nexus Queue Crystal Card', '审核队列', '42', '-18.6%', COLORS.amber],
  ['Nexus Security Crystal Card', '风险告警', '9', '-44.8%', COLORS.red]
];

cardPresets.forEach(([title, label, value, trend, accent]) => {
  components.push(
    makeCss({
      title,
      description: '高级玻璃态数据卡片，适配仪表盘和运营总览。',
      category: 'cards',
      tags: ['card', 'dashboard', 'glass', 'metric'],
      html: `<article class="nx-card"><header><p>${label}</p><span></span></header><h3>${value}</h3><small>${trend} 较上周</small><div class="bar"><i></i></div></article>`,
      css: `body{min-height:100vh;display:flex;align-items:center;justify-content:center;background:${COLORS.bg};font-family:Inter,Noto Sans SC,system-ui,sans-serif}.nx-card{width:292px;padding:22px;border-radius:16px;background:linear-gradient(180deg,rgba(15,23,42,.94),rgba(17,24,39,.96));border:1px solid ${COLORS.border};color:${COLORS.text};position:relative;overflow:hidden;box-shadow:0 16px 42px rgba(2,6,23,.6)}.nx-card::after{content:'';position:absolute;right:-54px;top:-66px;width:170px;height:170px;background:radial-gradient(circle,${accent}42,transparent 64%)}.nx-card header{display:flex;align-items:center;justify-content:space-between}.nx-card p{margin:0;font-size:12px;letter-spacing:.04em;text-transform:uppercase;color:${COLORS.muted}}.nx-card span{width:8px;height:8px;border-radius:999px;background:${accent};box-shadow:0 0 0 4px ${accent}30}.nx-card h3{margin:12px 0 6px;font-size:34px;line-height:1.15;color:#F8FAFC}.nx-card small{font-size:13px;color:${accent}}.bar{margin-top:14px;height:6px;background:rgba(148,163,184,.2);border-radius:999px;overflow:hidden}.bar i{display:block;width:74%;height:100%;background:linear-gradient(90deg,${accent},${COLORS.cyan});border-radius:999px}`
    })
  );
});

const navbarPresets = [
  ['Nexus Studio Pro Navbar', 'Pixora Studio', ['组件', '模板', '案例', '文档'], '发布组件'],
  ['Nexus Workspace Navbar', 'Pixora Workspace', ['概览', '项目', '消息', '设置'], '创建项目'],
  ['Nexus Team Navbar', 'Pixora Team', ['团队', '权限', '审计', '状态'], '邀请成员'],
  ['Nexus Market Navbar', 'Pixora Market', ['精选', '热门', '趋势', '帮助'], '提交作品']
];

navbarPresets.forEach(([title, brand, links, action]) => {
  components.push(
    makeTailwind({
      title,
      description: '浮层式科技风导航栏，适配社区和 SaaS 顶部导航。',
      category: 'navbars',
      tags: ['navbar', 'header', 'glass', 'tailwind'],
      html: `<header class="w-[min(980px,95vw)] h-16 rounded-2xl border border-slate-500/30 bg-slate-900/70 px-4 backdrop-blur-xl shadow-2xl shadow-slate-950/50 flex items-center justify-between text-slate-100"><strong class="tracking-wide">${brand}</strong><nav class="hidden md:flex items-center gap-4 text-sm text-slate-300">${links.map((item) => `<a class="hover:text-slate-100 transition-colors" href="#">${item}</a>`).join('')}</nav><button class="h-10 px-4 rounded-xl bg-gradient-to-r from-sky-600 to-cyan-500 text-white text-sm font-medium shadow-lg shadow-cyan-900/40">${action}</button></header>`
    })
  );
});

const formPresets = [
  ['Nexus Login Aurora Form', '欢迎回来', '继续管理你的社区资产'],
  ['Nexus Register Aurora Form', '创建账户', '加入 Pixora 高质量创作社区'],
  ['Nexus Ticket Aurora Form', '提交支持请求', '技术团队将在 24 小时内处理'],
  ['Nexus Contact Aurora Form', '商务咨询', '留下你的需求信息']
];

formPresets.forEach(([title, heading, sub]) => {
  components.push(
    makeTailwind({
      title,
      description: '高质感认证与业务表单，适配登录、注册、工单场景。',
      category: 'forms',
      tags: ['form', 'auth', 'business', 'tailwind'],
      html: `<form class="w-[360px] rounded-2xl border border-slate-500/30 bg-slate-900/80 p-5 shadow-2xl shadow-slate-950/60 text-slate-100"><h3 class="text-2xl font-semibold">${heading}</h3><p class="mt-2 text-sm text-slate-400">${sub}</p><label class="mt-4 block text-xs text-slate-400">邮箱地址<input class="mt-1 h-11 w-full rounded-xl border border-slate-500/30 bg-slate-950/60 px-3 text-sm text-slate-100 outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20" placeholder="name@pixora.vip"/></label><label class="mt-3 block text-xs text-slate-400">密码<input type="password" class="mt-1 h-11 w-full rounded-xl border border-slate-500/30 bg-slate-950/60 px-3 text-sm text-slate-100 outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20" placeholder="请输入密码"/></label><label class="mt-3 block text-xs text-slate-400">说明<textarea class="mt-1 min-h-24 w-full rounded-xl border border-slate-500/30 bg-slate-950/60 px-3 py-2 text-sm text-slate-100 outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20" placeholder="补充详细信息"></textarea></label><button type="button" class="mt-4 h-11 w-full rounded-xl bg-gradient-to-r from-sky-600 to-cyan-500 text-sm font-medium text-white shadow-lg shadow-cyan-900/40">提交</button></form>`
    })
  );
});

const loaderPresets = [
  ['Nexus Orbit Pulse Loader', COLORS.blue],
  ['Nexus Aurora Ring Loader', COLORS.cyan],
  ['Nexus Grid Flux Loader', COLORS.emerald],
  ['Nexus Beam Sync Loader', '#0EA5E9'],
  ['Nexus Core Spin Loader', '#06B6D4'],
  ['Nexus Stream Ring Loader', '#22C55E']
];

loaderPresets.forEach(([title, accent]) => {
  components.push(
    makeCss({
      title,
      description: '高质感加载动画，适配页面占位和异步请求反馈。',
      category: 'loaders',
      tags: ['loader', 'animation', 'css'],
      html: '<div class="nx-loader"><span></span><span></span><span></span></div>',
      css: `body{margin:0;display:grid;place-items:center;min-height:100vh;background:${COLORS.bg}}.nx-loader{position:relative;width:76px;height:76px}.nx-loader span{position:absolute;inset:0;border:2px solid transparent;border-top-color:${accent};border-right-color:${accent}88;border-radius:50%;animation:spin 1.2s linear infinite}.nx-loader span:nth-child(2){inset:10px;animation-duration:.9s;opacity:.75}.nx-loader span:nth-child(3){inset:20px;animation-duration:.6s;opacity:.55}@keyframes spin{to{transform:rotate(360deg)}}`
    })
  );
});

const modalPresets = [
  ['Nexus Confirm Glass Modal', '确认操作', '该操作会直接影响线上数据，请再次确认。', COLORS.blue],
  ['Nexus Delete Glass Modal', '删除提醒', '删除后内容无法恢复，建议先执行备份。', COLORS.red],
  ['Nexus Publish Glass Modal', '发布确认', '提交后将进入审核队列并通知管理员。', COLORS.cyan],
  ['Nexus Risk Glass Modal', '风险提示', '系统检测到权限冲突，请校验操作账号。', COLORS.amber]
];

modalPresets.forEach(([title, heading, desc, accent]) => {
  components.push(
    makeTailwind({
      title,
      description: '玻璃态确认弹窗，适配高风险操作提示与发布流程。',
      category: 'modals',
      tags: ['modal', 'dialog', 'glass', 'tailwind'],
      html: `<div class="w-[380px] rounded-2xl border border-slate-500/30 bg-slate-900/80 p-5 shadow-2xl shadow-slate-950/60 text-slate-100"><h3 class="text-xl font-semibold">${heading}</h3><p class="mt-2 text-sm text-slate-400">${desc}</p><div class="mt-5 flex gap-3"><button class="h-10 flex-1 rounded-xl border border-slate-500/30 text-sm text-slate-300">取消</button><button class="h-10 flex-1 rounded-xl text-sm text-white" style="background:${accent}">确认</button></div></div>`
    })
  );
});

const footerPresets = [
  ['Nexus Product Footer', 'Pixora UI', ['文档中心', '更新日志', '开源协议', '服务状态']],
  ['Nexus Community Footer', 'Pixora Community', ['论坛', '问答', '组件广场', '开发者平台']],
  ['Nexus Enterprise Footer', 'Pixora Enterprise', ['私有部署', '安全白皮书', 'SLA', '售前支持']]
];

footerPresets.forEach(([title, brand, links]) => {
  components.push(
    makeTailwind({
      title,
      description: '专业产品页脚，适配官网与控制台底部信息区。',
      category: 'footers',
      tags: ['footer', 'layout', 'tailwind'],
      html: `<footer class="w-[min(980px,95vw)] rounded-2xl border border-slate-500/30 bg-slate-900/70 p-6 text-slate-100"><div class="flex flex-col gap-4 md:flex-row md:items-center md:justify-between"><strong class="text-base">${brand}</strong><nav class="flex flex-wrap gap-3 text-sm text-slate-300">${links.map((item) => `<a href="#" class="hover:text-slate-100 transition-colors">${item}</a>`).join('')}</nav></div><p class="mt-4 text-xs text-slate-500">© 2026 Pixora. All rights reserved.</p></footer>`
    })
  );
});

const inputPresets = [
  ['Nexus Command Search Input', '搜索组件、标签、作者', '/'],
  ['Nexus Global Search Input', '全站搜索内容', 'K'],
  ['Nexus Filter Search Input', '输入筛选关键词', 'F'],
  ['Nexus Docs Search Input', '搜索文档与示例', 'D']
];

inputPresets.forEach(([title, placeholder, key]) => {
  components.push(
    makeTailwind({
      title,
      description: '命令面板风格搜索输入，适配导航和资源中心。',
      category: 'inputs',
      tags: ['input', 'search', 'command', 'tailwind'],
      html: `<label class="w-[420px] h-12 rounded-2xl border border-slate-500/30 bg-slate-900/80 px-3 flex items-center gap-2 text-slate-400 shadow-xl shadow-slate-950/50"><svg viewBox="0 0 24 24" class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="7"></circle><path d="M20 20l-4-4"></path></svg><input placeholder="${placeholder}" class="flex-1 bg-transparent text-sm text-slate-100 outline-none placeholder:text-slate-500"/><kbd class="h-6 min-w-6 rounded-md border border-slate-500/30 bg-slate-800 px-2 text-xs text-slate-400">${key}</kbd></label>`
    })
  );
});

const patternPresets = [
  ['Nexus SaaS Hero Pattern', '构建你的高质量组件工作流', '连接设计、开发与发布的完整链路'],
  ['Nexus Studio Hero Pattern', '让组件创作更高效', '覆盖草稿、预览、发布与数据统计'],
  ['Nexus Community Hero Pattern', '社区内容与组件同频增长', '论坛、问答、组件广场统一管理']
];

patternPresets.forEach(([title, heading, sub]) => {
  components.push(
    makeTailwind({
      title,
      description: '科技感首页 Hero 模块，适配落地页和产品首页。',
      category: 'patterns',
      tags: ['hero', 'landing', 'pattern', 'tailwind'],
      html: `<section class="w-[min(980px,95vw)] rounded-3xl border border-slate-500/30 bg-gradient-to-br from-slate-900 via-slate-900 to-sky-950 p-8 text-slate-100 shadow-2xl shadow-slate-950/60"><p class="inline-flex rounded-full border border-sky-500/30 bg-sky-500/10 px-3 py-1 text-xs text-sky-300">Pixora Design System</p><h1 class="mt-4 text-3xl md:text-4xl font-semibold leading-tight">${heading}</h1><p class="mt-3 max-w-2xl text-slate-300">${sub}</p><div class="mt-6 flex flex-wrap gap-3"><button class="h-11 px-5 rounded-xl bg-gradient-to-r from-sky-600 to-cyan-500 text-sm font-medium text-white">立即开始</button><button class="h-11 px-5 rounded-xl border border-slate-500/30 text-sm text-slate-200">查看文档</button></div></section>`
    })
  );
});

const reactPresets = [
  [
    'Nexus React KPI Matrix',
    'cards',
    `const rows=[{label:'活跃用户',value:'18,972',trend:'+16%'},{label:'发布组件',value:'612',trend:'+24%'},{label:'审核通过率',value:'96.2%',trend:'+1.8%'},{label:'收藏总量',value:'93,410',trend:'+20%'}];
const App=()=>(
  <section style={{maxWidth:860,margin:'0 auto',display:'grid',gridTemplateColumns:'repeat(2,minmax(0,1fr))',gap:12}}>
    {rows.map((item)=>(
      <article key={item.label} style={{border:'1px solid rgba(148,163,184,.24)',borderRadius:14,padding:16,background:'linear-gradient(180deg,rgba(15,23,42,.94),rgba(17,24,39,.96))',boxShadow:'0 12px 30px rgba(2,6,23,.45)'}}>
        <p style={{margin:0,fontSize:12,color:'#94A3B8'}}>{item.label}</p>
        <h3 style={{margin:'9px 0 6px',fontSize:30,color:'#F8FAFC'}}>{item.value}</h3>
        <small style={{color:'#10B981'}}>{item.trend} vs 上周</small>
      </article>
    ))}
  </section>
);
ReactDOM.createRoot(document.getElementById('root')).render(<App/>);`
  ],
  [
    'Nexus React Segment Console',
    'other',
    `const tabs=['概览','组件','审核','告警','设置'];
const App=()=>{
  const [active,setActive]=React.useState('概览');
  return <section style={{maxWidth:760,margin:'0 auto'}}>
    <div style={{display:'flex',gap:8,flexWrap:'wrap'}}>
      {tabs.map((tab)=>{
        const on=tab===active;
        return <button key={tab} onClick={()=>setActive(tab)} style={{height:38,padding:'0 14px',borderRadius:10,border:on?'1px solid #2563EB':'1px solid rgba(148,163,184,.28)',background:on?'rgba(37,99,235,.2)':'#0F172A',color:on?'#DBEAFE':'#CBD5E1',cursor:'pointer'}}>{tab}</button>;
      })}
    </div>
    <article style={{marginTop:12,border:'1px solid rgba(148,163,184,.24)',borderRadius:14,padding:16,background:'#111827'}}>
      <h3 style={{margin:'0 0 6px',color:'#F8FAFC'}}>{active} 面板</h3>
      <p style={{margin:0,color:'#94A3B8',fontSize:13}}>当前面板可接入真实业务数据并联动图表组件。</p>
    </article>
  </section>;
};
ReactDOM.createRoot(document.getElementById('root')).render(<App/>);`
  ],
  [
    'Nexus React Notification Stack',
    'alerts',
    `const rows=[
  {level:'系统通知',time:'刚刚',text:'你的组件已通过审核'},
  {level:'互动提醒',time:'8 分钟前',text:'有用户回复了你的帖子'},
  {level:'运维公告',time:'26 分钟前',text:'今晚 23:30 进行例行升级'}
];
const App=()=>(
  <section style={{maxWidth:620,margin:'0 auto'}}>
    {rows.map((row)=>(
      <article key={row.level+row.time} style={{marginBottom:10,border:'1px solid rgba(148,163,184,.24)',borderRadius:12,padding:12,background:'rgba(15,23,42,.92)'}}>
        <div style={{display:'flex',justifyContent:'space-between',fontSize:12,color:'#94A3B8'}}>
          <strong style={{fontSize:14,color:'#F8FAFC'}}>{row.level}</strong>
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
    'Nexus React Publish Stepper',
    'other',
    `const steps=['填写信息','上传源码','预览检查','提交审核','发布完成'];
const App=()=>{
  const [index,setIndex]=React.useState(1);
  return <section style={{maxWidth:880,margin:'0 auto'}}>
    <div style={{display:'grid',gridTemplateColumns:'repeat(5,minmax(0,1fr))',gap:8}}>
      {steps.map((step,i)=>{
        const on=i<=index;
        return <button key={step} onClick={()=>setIndex(i)} style={{height:44,borderRadius:10,padding:'0 8px',border:on?'1px solid #2563EB':'1px solid rgba(148,163,184,.26)',background:on?'rgba(37,99,235,.2)':'#111827',color:on?'#DBEAFE':'#CBD5E1',cursor:'pointer',fontSize:12}}>{i+1}. {step}</button>;
      })}
    </div>
  </section>;
};
ReactDOM.createRoot(document.getElementById('root')).render(<App/>);`
  ],
  [
    'Nexus React Team Activity Feed',
    'other',
    `const logs=[
  {name:'产品经理',action:'更新了发布策略',time:'2 分钟前'},
  {name:'设计师',action:'新增 3 个按钮组件',time:'18 分钟前'},
  {name:'后端',action:'修复私信限流逻辑',time:'31 分钟前'}
];
const App=()=>(
  <section style={{maxWidth:640,margin:'0 auto',border:'1px solid rgba(148,163,184,.24)',borderRadius:14,padding:14,background:'#0F172A'}}>
    <h3 style={{margin:'0 0 10px',color:'#F8FAFC'}}>团队动态</h3>
    {logs.map((log)=>(
      <article key={log.name+log.time} style={{padding:'10px 0',borderTop:'1px solid rgba(148,163,184,.16)'}}>
        <p style={{margin:0,fontSize:13,color:'#CBD5E1'}}><strong style={{color:'#F8FAFC'}}>{log.name}</strong> {log.action}</p>
        <small style={{color:'#94A3B8'}}>{log.time}</small>
      </article>
    ))}
  </section>
);
ReactDOM.createRoot(document.getElementById('root')).render(<App/>);`
  ],
  [
    'Nexus React Toggle Cluster',
    'toggles',
    `const items=['消息推送','审核提醒','安全告警','周报通知'];
const App=()=>{
  const [state,setState]=React.useState({0:true,1:true,2:false,3:true});
  const toggle=(i)=>setState((prev)=>({...prev,[i]:!prev[i]}));
  return <section style={{maxWidth:520,margin:'0 auto',border:'1px solid rgba(148,163,184,.24)',borderRadius:14,padding:14,background:'#111827'}}>
    <h3 style={{margin:'0 0 12px',color:'#F8FAFC'}}>通知设置</h3>
    {items.map((item,index)=>{
      const on=state[index];
      return <label key={item} style={{display:'flex',justifyContent:'space-between',alignItems:'center',padding:'8px 0',borderTop:index? '1px solid rgba(148,163,184,.16)' : 'none'}}>
        <span style={{fontSize:13,color:'#CBD5E1'}}>{item}</span>
        <button onClick={()=>toggle(index)} style={{width:44,height:24,border:'none',borderRadius:999,background:on?'#06B6D4':'#334155',padding:2,cursor:'pointer'}}>
          <i style={{display:'block',width:20,height:20,borderRadius:999,background:'#fff',transform:on?'translateX(20px)':'translateX(0)',transition:'transform .2s'}}></i>
        </button>
      </label>;
    })}
  </section>;
};
ReactDOM.createRoot(document.getElementById('root')).render(<App/>);`
  ],
  [
    'Nexus React Command Palette Panel',
    'other',
    `const rows=['创建组件','导出代码','打开审核队列','查看消息中心','进入系统设置'];
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
  ]
];

reactPresets.forEach(([title, category, jsx]) => {
  components.push(
    makeReact({
      title,
      description: 'React 交互组件，适配控制台和内容平台的高频场景。',
      category,
      tags: ['react', 'interactive', 'dashboard'],
      jsx
    })
  );
});

const bentoPresets = [
  ['Nexus Data Bento Matrix', 'patterns'],
  ['Nexus Growth Bento Matrix', 'patterns'],
  ['Nexus Security Bento Matrix', 'patterns']
];

bentoPresets.forEach(([title, category]) => {
  components.push(
    makeTailwind({
      title,
      description: 'Bento 风格的数据总览模块，适配后台首页。',
      category,
      tags: ['bento', 'dashboard', 'layout', 'tailwind'],
      html: '<section class="grid w-[min(980px,95vw)] grid-cols-12 gap-3 text-slate-100"><article class="col-span-12 md:col-span-7 rounded-2xl border border-slate-500/30 bg-slate-900/80 p-5"><p class="text-sm text-slate-400">流量趋势</p><div class="mt-4 h-28 rounded-xl bg-gradient-to-r from-sky-500/30 via-cyan-400/20 to-emerald-400/20"></div></article><article class="col-span-12 md:col-span-5 rounded-2xl border border-slate-500/30 bg-slate-900/80 p-5"><p class="text-sm text-slate-400">本日发布</p><h3 class="mt-2 text-3xl text-sky-300">126</h3></article><article class="col-span-12 md:col-span-4 rounded-2xl border border-slate-500/30 bg-slate-900/80 p-5"><p class="text-sm text-slate-400">审核通过</p><h3 class="mt-2 text-3xl text-emerald-300">98.2%</h3></article><article class="col-span-12 md:col-span-4 rounded-2xl border border-slate-500/30 bg-slate-900/80 p-5"><p class="text-sm text-slate-400">错误告警</p><h3 class="mt-2 text-3xl text-amber-300">4</h3></article><article class="col-span-12 md:col-span-4 rounded-2xl border border-slate-500/30 bg-slate-900/80 p-5"><p class="text-sm text-slate-400">任务队列</p><h3 class="mt-2 text-3xl text-cyan-300">32</h3></article></section>'
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
    const statBase = 280 - index;
    const viewBase = 4200 - index * 17;

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
          isFeatured: index < 24,
          isRecommended: index % 2 === 0,
          likeCount: statBase,
          viewCount: viewBase,
          favoriteCount: 92 - (index % 24),
          forkCount: 28 - (index % 10),
          commentCount: 16 - (index % 6)
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
        likeCount: statBase,
        viewCount: viewBase,
        favoriteCount: 92 - (index % 24),
        forkCount: 28 - (index % 10),
        commentCount: 16 - (index % 6),
        isRecommended: index % 2 === 0,
        isFeatured: index < 24,
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
