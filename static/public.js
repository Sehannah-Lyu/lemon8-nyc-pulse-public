const app=document.querySelector('#app');
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const safeUrl=s=>{try{const u=new URL(String(s||''));return ['http:','https:'].includes(u.protocol)?u.href:''}catch{return''}};
const safeImageUrl=s=>{const value=String(s||'');if(/^\/?static\/uploads\/[A-Za-z0-9._-]+\.(?:png|jpe?g|webp)$/i.test(value))return value;try{const u=new URL(value);return u.protocol==='https:'?u.href:''}catch{return''}};
const verticalTagTones={'Beauty':'beauty','Fashion':'fashion','Food':'food','Things to do':'play'};
const tagChip=tag=>`<span class="label-chip ${verticalTagTones[tag]?`is-${verticalTagTones[tag]}`:'is-neutral'}">${esc(tag)}</span>`;
const fmt=s=>new Intl.DateTimeFormat('zh-CN',{month:'short',day:'numeric',weekday:'short',hour:'2-digit',minute:'2-digit',timeZone:'America/New_York'}).format(new Date(s));
const fmtDay=s=>new Intl.DateTimeFormat('zh-CN',{month:'short',day:'numeric',timeZone:'America/New_York'}).format(new Date(`${s}T12:00:00-04:00`));
const reportDate=s=>new Intl.DateTimeFormat('zh-CN',{month:'numeric',day:'numeric',timeZone:'UTC'}).format(new Date(`${s}T12:00:00Z`));
function reportSectionTitle(label,weekStart,offset){const start=new Date(`${weekStart}T12:00:00Z`),end=new Date(start);start.setUTCDate(start.getUTCDate()+offset);end.setUTCDate(end.getUTCDate()+6);return `${label}｜${reportDate(start.toISOString().slice(0,10))}-${reportDate(end.toISOString().slice(0,10))}`}
async function liveApi(path,options={}){options.headers={...(options.headers||{}),'Content-Type':'application/json'};const r=await fetch(path,options);const d=await r.json();if(!r.ok)throw new Error(d.error||'请求失败');return d}
function nav(){document.querySelectorAll('[data-route]').forEach(x=>x.classList.toggle('active',x.dataset.route===location.pathname))}
function momentRange(item){return item.date_start===item.date_end?fmtDay(item.date_start):`${fmtDay(item.date_start)} - ${fmtDay(item.date_end)}`}
function momentTimeNote(item){return {confirmed:'档期已由官方确认',fixed:'年度固定节点，日期相对稳定',estimated:'基于历年周期预估，具体日期待官方发布'}[item.status]||'时间信息待进一步核验'}
function momentUrgency(item){const days=Number(item.days_until);if(item.is_current)return '进行中';if(days===0)return '今天';if(days>0&&days<=7)return `${days} 天后`;if(days>7)return `${days} 天后`;return '已开始'}
function momentImportance(item){return item.importance_tier==='high'?`<span class="moment-importance is-high" title="${esc([item.importance_reason,item.importance_evidence].filter(Boolean).join(' · '))}">🚩 高重要性</span>`:''}
function renderMomentItem(item){const source=safeUrl(item.source_url),high=item.importance_tier==='high';return `<div class="moment-node ${high?'is-high':''} ${item.is_current?'is-current':''}"><details class="moment-item"><summary><span class="moment-date">${esc(momentRange(item))}</span><strong>${esc(item.title)}</strong><span class="moment-badge">${esc(momentUrgency(item))}</span>${momentImportance(item)}<span class="moment-time-note">${esc(momentTimeNote(item))}</span></summary><div class="moment-body"><div class="moment-tags">${(item.verticals||[]).map(tagChip).join('')}</div><p>${esc(item.summary||'')}</p>${high&&item.importance_reason?`<p class="moment-importance-note">${esc(item.importance_reason)}</p>`:''}${source?`<a class="source" href="${esc(source)}" target="_blank" rel="noopener">查看来源 →</a>`:''}</div></details></div>`}
async function loadMomentCalendar(){const panel=document.querySelector('#moment-calendar-list'),meta=document.querySelector('#moment-calendar-meta');if(!panel)return;try{const d=await api('/api/' + 'admin/moment-calendar?days=60'),items=d.items||[];if(meta)meta.textContent=`${esc(d.window.start)} 至 ${esc(d.window.end)} · ${items.length} 个节点`;panel.innerHTML=items.length?items.map(renderMomentItem).join(''):'<div class="empty">未来两个月暂无已维护的大事件节点。</div>'}catch(e){panel.innerHTML=`<div class="empty">日历载入失败：${esc(e.message)}</div>`}}
function momentCalendarAside(){return `<aside class="moment-calendar" aria-label="纽约大事件时间轴"><div class="moment-calendar-card"><div class="moment-calendar-head"><span class="eyebrow">NYC MOMENTS</span><h2>未来两个月</h2><p id="moment-calendar-meta">正在载入大事件时间轴</p><div class="moment-legend" aria-label="重要性图例"><span>🚩 高重要性节点</span></div></div><div id="moment-calendar-list" class="moment-list"><div class="empty">正在载入…</div></div></div></aside>`}
function businessOperationsAdvice(item){const lines=String(item.operating_insight||item._business_operations_advice||'').split('\n').map(x=>x.trim()).filter(Boolean);return lines.length?`<aside class="business-operations-advice"><strong>IG 可能出现的相关内容</strong><ul>${lines.slice(0,2).map(line=>`<li>${esc(line)}</li>`).join('')}</ul><small>AI 生成，仅供参考</small></aside>`:''}
function eventImportanceBadge(e){return e.importance_tier==='high'?'<span class="importance-chip is-high">🚩 高重要性</span>':''}
function eventCard(e){const children=e.children||[],image=safeImageUrl(e.image_url),imageSource=safeUrl(e.image_source_url),imageLabel={source_reference:'活动官网图片',similar_reference:'相关活动图片'}[e.image_origin]||'';return `<article class="event ${image?'has-image':''}">${image?`<img class="event-image" src="${esc(image)}" alt="${esc(e.title)}" loading="lazy" referrerpolicy="no-referrer" onerror="this.remove()">`:''}<div class="event-labels">${e.tags.map(tagChip).join('')}${eventImportanceBadge(e)}</div>${imageLabel?`<div class="image-credit">${imageSource?`<a href="${esc(imageSource)}" target="_blank" rel="noopener noreferrer">${esc(imageLabel)} ↗</a>`:esc(imageLabel)}</div>`:''}<h3>${esc(e.title)}</h3><div class="meta">${fmt(e.start_at)} · ${esc(e.venue||e.borough||'地点见来源')}</div><p class="summary">${esc(e.summary||'来源未提供更多事实说明。')}</p>${businessOperationsAdvice(e)}${children.length?`<details class="public-child-list"><summary>查看 ${children.length} 个具体活动</summary>${children.map(c=>`<div><b>${esc(c.title)}</b><span>${fmt(c.start_at)} · ${esc(c.venue||'地点见来源')}</span>${c.url?`<a href="${esc(c.url)}" target="_blank" rel="noopener">详情 ↗</a>`:''}</div>`).join('')}</details>`:''}${e.url?`<a class="source" href="${esc(e.url)}" target="_blank" rel="noopener">查看原始来源 →</a>`:''}</article>`}
function trendEvidenceList(articles=[]){return articles.length?`<details class="trend-evidence"><summary><span>核验依据</span><b>${articles.length} 篇原文 · 点击展开</b></summary><div class="trend-evidence-list">${articles.map(article=>{const url=safeUrl(article.url);return `<article><span class="evidence-source">${esc(article.source_name)}</span>${url?`<a href="${esc(url)}" target="_blank" rel="noopener noreferrer">${esc(article.title)}</a>`:`<span>${esc(article.title)}</span>`}</article>`}).join('')}</div></details>`:''}
function trendTitle(t){return t.title_en?`${esc(t.title_en)}<br><span lang="zh-CN">${esc(t.title)}</span>`:esc(t.title)}
function trendCard(t){const label={beauty:'Beauty',fashion:'Fashion',food:'Food',things_to_do:'Things to do'}[t.vertical]||'Beauty';return `<article class="event trend"><div class="event-labels">${tagChip(label)}</div><h3>${trendTitle(t)}</h3><p class="summary">${esc(t.summary||'')}</p>${businessOperationsAdvice(t)}${trendEvidenceList(t.articles||[])}</article>`}
function section(title,list,hint){return `<section><div class="weekline"><h2>${title}</h2><div class="rule"></div></div>${list.length?`<div class="grid">${list.map(eventCard).join('')}</div>`:`<div class="empty">${hint}</div>`}</section>`}
const reportVerticals=[['all','全部'],['beauty','Beauty'],['fashion','Fashion'],['food','Food'],['play','Things to do']];
const reportImportanceTiers=[['all','全部重要性'],['high','🚩 高重要性']];
const reportSectionFilters=new Map();
let activeReportVertical='all',activeReportImportance='all';
function reportEventVerticals(event){const tags=event.tags||[];return tags.map(tag=>({'Beauty':'beauty','Fashion':'fashion','Food':'food','Things to do':'play'}[tag])).filter(Boolean)}
function reportFilterButton(group,key,label,count,active,handler){return `<button type="button" class="${active?'active':''}" aria-pressed="${active}" onclick="${handler}">${label}<span>${count}</span></button>`}
function reportFilterControls(){const list=[...reportSectionFilters.values()].flatMap(item=>item.list),verticals=`<div class="report-filter-group" role="group" aria-label="按活动品类筛选">${reportVerticals.map(([key,label])=>reportFilterButton('vertical',key,label,key==='all'?list.length:list.filter(event=>reportEventVerticals(event).includes(key)).length,key===activeReportVertical,`setReportVertical('${key}')`)).join('')}</div>`,importance=`<div class="report-filter-group" role="group" aria-label="按活动重要性筛选">${reportImportanceTiers.map(([key,label])=>reportFilterButton('importance',key,label,key==='all'?list.length:list.filter(event=>event.importance_tier===key).length,key===activeReportImportance,`setReportImportance('${key}')`)).join('')}</div>`;return `<div class="report-filter" aria-label="筛选活动">${verticals}${importance}</div>`}
function renderReportSection(id){const item=reportSectionFilters.get(id);if(!item)return;const {list,hint,title}=item,visible=list.filter(event=>(activeReportVertical==='all'||reportEventVerticals(event).includes(activeReportVertical))&&(activeReportImportance==='all'||event.importance_tier===activeReportImportance)),target=document.querySelector(`#${id}`);if(!target)return;target.innerHTML=`<div class="weekline"><h2>${title}</h2><div class="rule"></div></div>${visible.length?`<div class="grid">${visible.map(eventCard).join('')}</div>`:`<div class="empty">${list.length?'当前筛选条件下暂无活动。':hint}</div>`}`}
function publicSection(id,title,list,hint){reportSectionFilters.set(id,{title,list,hint});return `<section id="${id}"></section>`}
function renderReportSections(){const controls=document.querySelector('#report-filter-controls');if(controls)controls.innerHTML=reportFilterControls();reportSectionFilters.forEach((_,id)=>renderReportSection(id))}
window.setReportVertical=value=>{activeReportVertical=reportVerticals.some(([key])=>key===value)?value:'all';renderReportSections()};
window.setReportImportance=value=>{activeReportImportance=reportImportanceTiers.some(([key])=>key===value)?value:'all';renderReportSections()};
function trendSection(list=[]){return `<section><div class="weekline"><div><h2>Trend</h2><small class="trend-rule">汇总近30日社媒信号，经模型核验精选</small></div><div class="rule"></div></div>${list.length?`<div class="grid">${list.map(trendCard).join('')}</div>`:'<div class="empty">本周暂无已发布的 Trend。</div>'}</section>`}
function selectionStandards(){return `<section class="selection-standards" aria-labelledby="selection-standards-title"><div class="selection-standards-head"><span class="eyebrow">EDITORIAL STANDARD</span><h2 id="selection-standards-title">筛选标准</h2><p>本报信源覆盖 Beauty、Fashion、Food、Things to do 等垂类，主要包括品牌与主办方官方渠道、纽约当地权威媒体、各垂类头部媒体、城市文化机构及当地活动聚合平台。每周一的周报覆盖本周一至下周日间共两周的精选活动。筛选维度包括：垂类相关性、活动在地影响力、社区内容可结合程度等。通过模型综合打分和人工进一步确认，最终推出每周的纽约精选活动周报。</p></div></section>`}
async function latest(id=''){app.classList.remove('admin-main');app.classList.add('report-main');const d=await api(id?`/api/report?id=${encodeURIComponent(id)}`:'/api/reports/latest');if(!d.id){app.innerHTML=`<div class="report-layout"><div class="report-primary"><div class="eyebrow">WEEKLY SIGNALS</div><h1>纽约这周，值得核验的城市信号</h1><div class="empty">尚无已发布周报。请进入审核后台回放样例、审核候选并发布。</div></div>${momentCalendarAside()}</div>`;await loadMomentCalendar();return}activeReportVertical='all';activeReportImportance='all';reportSectionFilters.clear();app.innerHTML=`<div class="report-layout"><div class="report-primary"><div class="eyebrow">WEEKLY SIGNALS · ${esc(d.week_start)}</div><h1>${esc(d.title)}</h1><p class="lead">${esc(d.intro)}</p>${selectionStandards()}<div id="report-filter-controls" class="report-filter-controls"></div>${publicSection('report-this-week',reportSectionTitle('This Week',d.week_start,0),d.this_week,'本周暂无已发布活动。')}${publicSection('report-upcoming',reportSectionTitle('Upcoming',d.week_start,7),d.upcoming,'接下来暂无已发布活动。')}${trendSection(d.trends||d.beauty_trends||[])}</div>${momentCalendarAside()}</div>`;renderReportSections();await loadMomentCalendar()}
async function archive(){app.classList.remove('admin-main','report-main');const rows=await api('/api/reports/archive');app.innerHTML=`<div class="eyebrow">ARCHIVE</div><h1>往期周报</h1><p class="lead">按周归档已发布版本，不展示草稿或候选。</p>${rows.length?rows.map(r=>`<a class="archive-row" href="?report=${r.id}" data-report="${r.id}"><strong>${esc(r.title)}</strong><span>${esc(r.week_start)}</span></a>`).join(''):'<div class="empty">暂无归档。</div>'}`;document.querySelectorAll('[data-report]').forEach(a=>a.onclick=e=>{e.preventDefault();history.pushState({},'',`?report=${a.dataset.report}`);latest(a.dataset.report)})}

let publicSnapshot;
async function staticSnapshot(){
  if(!publicSnapshot){
    publicSnapshot=fetch('static/public-data.json',{cache:'no-store'}).then(async response=>{
      if(!response.ok)throw new Error('公开周报数据载入失败');
      return response.json();
    });
  }
  return publicSnapshot;
}
async function api(path){
  const data=await staticSnapshot();
  const url=new URL(path,location.origin);
  if(url.pathname==='/api/reports/latest')return data.latest;
  if(url.pathname==='/api/reports/archive')return data.archive;
  if(url.pathname==='/api/report'){
    const report=data.reports.find(item=>item.id===url.searchParams.get('id'));
    if(report)return report;
  }
  if(url.pathname==='/api/'+'admin/moment-calendar')return data.moments;
  throw new Error('该静态页面不提供此接口');
}
async function route(){
  nav();
  try{
    const params=new URLSearchParams(location.search);
    if(params.has('archive'))await archive();
    else await latest(params.get('report')||'');
  }catch(error){
    app.innerHTML=`<div class="empty">载入失败：${esc(error.message)}</div>`;
  }
}
function nav(){
  const archiveMode=new URLSearchParams(location.search).has('archive');
  document.querySelectorAll('[data-route]').forEach(node=>{
    node.classList.toggle(
      'active',
      node.dataset.route==='/'?!archiveMode:node.dataset.route==='/archive'&&archiveMode
    );
  });
}
window.onpopstate=route;route();
