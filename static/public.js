function newStoreCard(store,report={}){
  const url=safeUrl(store.url),related=[...(report.this_week||[]),...(report.upcoming||[])].filter(e=>e.new_store?.store_id===store.id);
  const kind={new:ui('新开门店','New opening'),flagship:ui('旗舰店','Flagship'),first_store:ui('首店','First location'),relocation:ui('迁址升级','Relocated and upgraded')}[store.opening_kind]||ui('新店','New opening');
  return `<article class="event new-store-card"><div class="event-labels">${tagChip(store.vertical)}${tagChip(kind)}</div><h3>${esc(store.name)}</h3><div class="meta">${ui('开业：','Opening: ')}${esc(store.opening_date)} · ${esc(store.address)}</div><p class="summary">${esc(store.summary)}</p><p><strong>${ui('探店看点','What to look for')}</strong> ${esc(store.visit_reason)}</p>${related.length?`<div class="new-store-activities"><strong>${ui('新店活动','Opening events')}</strong>${related.map(e=>`<p>${esc(e.title)} · ${fmt(e.start_at)}${safeUrl(e.url)?` · <a href="${esc(safeUrl(e.url))}" target="_blank" rel="noopener noreferrer">${ui('参与详情','Event details')} ↗</a>`:''}</p>`).join('')}</div>`:''}${newStoreEvidence(store)}${url?`<a class="source" href="${esc(url)}" target="_blank" rel="noopener noreferrer">${ui('门店详情','Store details')} ↗</a>`:''}</article>`;
}
function newStoreEvidence(store){
  const byUrl=new Map();
  for(const evidence of store.evidence||[]){
    const group=byUrl.get(evidence.url)||{source_name:evidence.source_name,url:evidence.url,quotes:[]};
    group.quotes.push(evidence.quote);byUrl.set(evidence.url,group);
  }
  return trendEvidenceList([...byUrl.values()].map(group=>({
    ...group,title:group.quotes.length===1?group.quotes[0]:ui(`门店信息与开业安排（${group.quotes.length} 处已核验摘录）`,`Store details and opening plans (${group.quotes.length} verified excerpts)`),
  })));
}
function newStoreSection(report={}){
  const stores=report.new_stores||[];
  return stores.length?`<section class="new-stores-report"><div class="weekline"><div><h2>${ui('纽约新店','NYC new openings')}</h2><small class="trend-rule">${ui('重点垂类新店 · 值得参与的门店活动','Notable openings in key categories · Store events worth attending')}</small></div><div class="rule"></div></div><div class="grid">${stores.map(store=>newStoreCard(store,report)).join('')}</div></section>`:'';
}
const app=document.querySelector('#app');
let publicTranslations=globalThis.__NYC_PULSE_TRANSLATIONS__||{};
const publicLanguageStorage=(()=>{try{return window.parent?.localStorage||globalThis.localStorage}catch{return globalThis.localStorage}})();
let publicLanguage=globalThis.__NYC_PULSE_INITIAL_LANGUAGE__==='en'||publicLanguageStorage?.getItem('nyc-pulse-language')==='en'?'en':'zh';
const ui=(zh,en)=>publicLanguage==='en'?en:zh;
const localizePublicData=value=>{if(publicLanguage!=='en')return value;if(typeof value==='string')return publicTranslations[value]||value;if(Array.isArray(value))return value.map(localizePublicData);if(value&&typeof value==='object')return Object.fromEntries(Object.entries(value).map(([key,item])=>[key,localizePublicData(item)]));return value};
let publicTranslationsRequest;
async function ensurePublicTranslations(){if(Object.keys(publicTranslations).length)return publicTranslations;if(!publicTranslationsRequest)publicTranslationsRequest=fetch('/static/public-translations.json',{cache:'no-store'}).then(response=>response.ok?response.json():{}).catch(()=>({}));publicTranslations=await publicTranslationsRequest;return publicTranslations}
function applyPublicLanguageChrome(){if(document.documentElement)document.documentElement.lang=publicLanguage==='en'?'en-US':'zh-CN';document.querySelectorAll('[data-label-zh]').forEach(node=>{node.textContent=publicLanguage==='en'?node.dataset.labelEn:node.dataset.labelZh});const toggle=document.querySelector('#language-toggle');if(toggle){const target=publicLanguage==='en'?'zh':'en';toggle.dataset.target=target;toggle.textContent=target==='en'?'EN':'中文';toggle.setAttribute('aria-label',target==='en'?'Switch to English':'切换至中文');toggle.title=target==='en'?'Switch to English':'切换至中文'}}
window.setPublicLanguage=value=>{publicLanguage=value==='en'?'en':'zh';publicLanguageStorage?.setItem('nyc-pulse-language',publicLanguage);try{window.parent.postMessage({type:'nyc-pulse-language',language:publicLanguage},'*')}catch{}applyPublicLanguageChrome();route()};
window.togglePublicLanguage=()=>setPublicLanguage(publicLanguage==='en'?'zh':'en');
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const safeUrl=s=>{try{const u=new URL(String(s||''));return ['http:','https:'].includes(u.protocol)?u.href:''}catch{return''}};
const safeImageUrl=s=>{const value=String(s||'');if(/^\/?static\/uploads\/[A-Za-z0-9._-]+\.(?:png|jpe?g|webp)$/i.test(value))return value;try{const u=new URL(value);return u.protocol==='https:'?u.href:''}catch{return''}};
const verticalTagTones={'Beauty':'beauty','Fashion':'fashion','Food':'food','Things to do':'play'};
const tagChip=tag=>`<span class="label-chip ${verticalTagTones[tag]?`is-${verticalTagTones[tag]}`:'is-neutral'}">${esc(tag)}</span>`;
const fmt=s=>new Intl.DateTimeFormat(publicLanguage==='en'?'en-US':'zh-CN',{month:'short',day:'numeric',weekday:'short',hour:'2-digit',minute:'2-digit',timeZone:'America/New_York'}).format(new Date(s));
const fmtDay=s=>new Intl.DateTimeFormat(publicLanguage==='en'?'en-US':'zh-CN',{month:'short',day:'numeric',timeZone:'America/New_York'}).format(new Date(`${s}T12:00:00-04:00`));
const reportDate=s=>new Intl.DateTimeFormat(publicLanguage==='en'?'en-US':'zh-CN',{month:'numeric',day:'numeric',timeZone:'UTC'}).format(new Date(`${s}T12:00:00Z`));
function reportSectionTitle(label,weekStart,offset){const start=new Date(`${weekStart}T12:00:00Z`);start.setUTCDate(start.getUTCDate()+offset);const end=new Date(start);end.setUTCDate(end.getUTCDate()+6);return `${label}${ui('｜',' | ')}${reportDate(start.toISOString().slice(0,10))}-${reportDate(end.toISOString().slice(0,10))}`}
async function liveApi(path,options={}){await ensurePublicTranslations();options.headers={...(options.headers||{}),'Content-Type':'application/json'};const r=await fetch(path,options);const d=await r.json();if(!r.ok)throw new Error(d.error||ui('请求失败','Request failed'));return localizePublicData(d)}
function nav(){applyPublicLanguageChrome();document.querySelectorAll('[data-route]').forEach(x=>{x.classList.toggle('active',x.dataset.route===location.pathname);if(x.dataset.route==='/admin')x.hidden=location.pathname!=='/admin'})}
function momentRange(item){return item.date_start===item.date_end?fmtDay(item.date_start):`${fmtDay(item.date_start)} - ${fmtDay(item.date_end)}`}
function momentUrgency(item){const days=Number(item.days_until);if(item.is_current)return ui('进行中','In progress');if(days===0)return ui('今天','Today');if(days>0)return ui(`${days} 天后`,`In ${days} days`);return ui('已开始','Started')}
function renderMomentItem(item){const source=safeUrl(item.source_url),high=item.importance_tier==='high',summaryZh=item.summary_zh||item.importance_reason,flag=high?'🚩 ':'';return `<div class="moment-node ${item.is_current?'is-current':''}"><details class="moment-item"><summary><span class="moment-date">${esc(momentRange(item))}</span><strong>${flag}${esc(item.title)}</strong><span class="moment-badge">${esc(momentUrgency(item))}</span></summary><div class="moment-body"><div class="moment-tags">${(item.verticals||[]).map(tagChip).join('')}</div><p class="moment-summary-en">${esc(item.summary||'')}</p>${publicLanguage==='zh'&&summaryZh?`<p class="moment-summary-zh">${esc(summaryZh)}</p>`:''}${source?`<a class="source" href="${esc(source)}" target="_blank" rel="noopener">${ui('查看来源','View source')} →</a>`:''}</div></details></div>`}
async function loadMomentCalendar(){const panel=document.querySelector('#moment-calendar-list'),meta=document.querySelector('#moment-calendar-meta');if(!panel)return;try{const d=await api('/api/' + 'admin/moment-calendar?days=60'),items=d.items||[];if(meta)meta.textContent=ui(`${esc(d.window.start)} 至 ${esc(d.window.end)} · ${items.length} 个节点`,`${esc(d.window.start)} to ${esc(d.window.end)} · ${items.length} moments`);panel.innerHTML=items.length?items.map(renderMomentItem).join(''):`<div class="empty">${ui('未来两个月暂无已维护的大事件节点。','No major maintained moments in the next two months.')}</div>`}catch(e){panel.innerHTML=`<div class="empty">${ui('日历载入失败：','Calendar failed to load: ')}${esc(e.message)}</div>`}}
function momentCalendarAside(){return `<aside class="moment-calendar" aria-label="${ui('纽约大事件时间轴','New York major moments timeline')}"><div class="moment-calendar-card"><div class="moment-calendar-head"><span class="eyebrow">NYC MOMENTS</span><h2>${ui('未来两个月','Next two months')}</h2><p id="moment-calendar-meta">${ui('正在载入大事件时间轴','Loading major moments')}</p><div class="moment-legend" aria-label="${ui('重要性图例','Importance legend')}"><span>🚩 ${ui('重要节点','Major moment')}</span></div></div><div id="moment-calendar-list" class="moment-list"><div class="empty">${ui('正在载入…','Loading...')}</div></div><p class="moment-calendar-note">${ui('日期已公布或具稳定年度周期的活动直接列示；尚未公布本年度档期的活动，暂按上一年度同期安排作为参考。','Events with announced dates or stable annual timing are listed directly. When this year’s dates are not yet available, last year’s timing is shown as a reference.')}</p></div></aside>`}
function eventImportanceBadge(e){return (e.new_store?.store_name?`<span class="label-chip is-neutral">${ui('纽约新店','NYC new opening')} · ${esc(e.new_store.store_name)}</span>`:'')+(e.importance_tier==='high'?`<span class="importance-chip is-high">🚩 ${ui('重要','Important')}</span>`:'')}
function eventTitle(e){return esc(e.title)}
function businessOperationsAdvice(card,options={}){const publicIdeas=String(card.community_inspiration||''),draftIdeas=options?.preview===true?String(card._business_operations_advice||card.operating_insight||''):'';const ideas=(publicIdeas||draftIdeas).split(/\r?\n/).map(line=>line.trim()).filter(Boolean),publicView=Boolean(publicIdeas);return ideas.length?`<aside class="business-operations-advice"><strong>${ui('社区内容灵感','Community content ideas')}</strong><ul>${ideas.map(idea=>`<li>${esc(idea)}</li>`).join('')}</ul><small>${publicView?ui('AI 辅助生成，仅供参考。','AI-assisted. For reference only.'):ui('AI 生成，仅供编辑参考。','AI-generated. For editorial reference only.')}</small></aside>`:''}
function eventCard(e,options={}){const children=e.children||[],image=safeImageUrl(e.image_url),url=safeUrl(e.url),manual=image&&e.image_origin==='manual_upload',imageTag=image?`<img class="event-image" src="${esc(image)}" alt="${esc(e.title)}" loading="lazy" referrerpolicy="no-referrer" onerror="this.remove()">`:'',imageHtml=imageTag?(url?`<a class="event-image-link" href="${esc(url)}" target="_blank" rel="noopener noreferrer">${imageTag}</a>`:imageTag):'',eventTime=e.content_type==='new_store_activity'?fmtDay(String(e.start_at).slice(0,10)):fmt(e.start_at);return `<article class="event ${image?'has-image':''}${manual?' is-manual-upload':''}">${imageHtml}<h3>${eventTitle(e)}</h3><div class="event-labels">${e.tags.map(tagChip).join('')}${eventImportanceBadge(e)}</div><div class="meta">${eventTime} · ${esc(e.venue||e.borough||ui('地点见来源','See source for location'))}</div><p class="summary">${esc(e.summary||ui('来源未提供更多事实说明。','The source provides no additional factual details.'))}</p>${businessOperationsAdvice(e,options)}${children.length?`<details class="public-child-list"><summary>${ui(`查看 ${children.length} 个具体活动`,`View ${children.length} specific events`)}</summary>${children.map(c=>`<div><b>${eventTitle(c)}</b><span>${fmt(c.start_at)} · ${esc(c.venue||ui('地点见来源','See source for location'))}</span>${c.url?`<a href="${esc(c.url)}" target="_blank" rel="noopener">${ui('详情','Details')} ↗</a>`:''}</div>`).join('')}</details>`:''}${url?`<a class="source" href="${esc(url)}" target="_blank" rel="noopener">${ui('查看来源','View source')}</a>`:''}</article>`}
function trendEvidenceList(articles=[]){return articles.length?`<details class="trend-evidence"><summary><span>${ui('核验依据','Evidence')}</span><b>${ui(`${articles.length} 篇原文 · 点击展开`,`${articles.length} source articles · Expand`)}</b></summary><div class="trend-evidence-list">${articles.map(article=>{const url=safeUrl(article.url);return `<article><span class="evidence-source">${esc(article.source_name)}</span>${url?`<a href="${esc(url)}" target="_blank" rel="noopener noreferrer">${esc(article.title)}</a>`:`<span>${esc(article.title)}</span>`}</article>`}).join('')}</div></details>`:''}
function trendTitle(t){return publicLanguage==='en'?esc(t.title_en||t.title):(t.title_en?`${esc(t.title_en)}<br><span lang="zh-CN">${esc(t.title)}</span>`:esc(t.title))}
function trendCard(t,options={}){const label={beauty:'Beauty',fashion:'Fashion',food:'Food',things_to_do:'Things to do'}[t.vertical]||'Beauty';return `<article class="event trend"><div class="event-labels">${tagChip(label)}</div><h3>${trendTitle(t)}</h3><p class="summary">${esc(t.summary||'')}</p>${businessOperationsAdvice(t,options)}${trendEvidenceList(t.articles||[])}</article>`}
function section(title,list,hint){return `<section><div class="weekline"><h2>${title}</h2><div class="rule"></div></div>${list.length?`<div class="grid">${list.map(eventCard).join('')}</div>`:`<div class="empty">${hint}</div>`}</section>`}
const reportVerticals=()=>[['all',ui('全部','All')],['beauty','Beauty'],['fashion','Fashion'],['food','Food'],['play','Things to do'],['new_store',ui('纽约新店','NYC new openings')]];
const reportImportanceTiers=()=>[['all',ui('全部','All')],['high',`🚩 ${ui('重要','Important')}`]];
const reportSectionFilters=new Map();
let activeReportVertical='all',activeReportImportance='all';
function reportEventVerticals(event){const tags=event.tags||[],verticals=tags.map(tag=>({'Beauty':'beauty','Fashion':'fashion','Food':'food','Things to do':'play'}[tag])).filter(Boolean);if(event.content_type==='new_store_activity')verticals.push('new_store');return verticals}
function reportFilterButton(group,key,label,count,active,handler){return `<button type="button" class="${active?'active':''}" aria-pressed="${active}" onclick="${handler}">${label}<span>${count}</span></button>`}
function reportFilterControls(){const list=[...reportSectionFilters.values()].flatMap(item=>item.list),verticals=`<div class="report-filter-group" role="group" aria-label="${ui('按活动品类筛选','Filter by category')}">${reportVerticals().map(([key,label])=>reportFilterButton('vertical',key,label,key==='all'?list.length:list.filter(event=>reportEventVerticals(event).includes(key)).length,key===activeReportVertical,`setReportVertical('${key}')`)).join('')}</div>`,importance=`<div class="report-filter-group" role="group" aria-label="${ui('按活动重要性筛选','Filter by importance')}">${reportImportanceTiers().map(([key,label])=>reportFilterButton('importance',key,label,key==='all'?list.length:list.filter(event=>event.importance_tier===key).length,key===activeReportImportance,`setReportImportance('${key}')`)).join('')}</div>`;return `<div class="report-filter" aria-label="${ui('筛选活动','Filter events')}">${verticals}${importance}</div>`}
function renderReportSection(id){const item=reportSectionFilters.get(id);if(!item)return;const {list,hint,title}=item,visible=list.filter(event=>(activeReportVertical==='all'||reportEventVerticals(event).includes(activeReportVertical))&&(activeReportImportance==='all'||event.importance_tier===activeReportImportance)),target=document.querySelector(`#${id}`);if(!target)return;target.innerHTML=`<div class="weekline"><h2>${title}</h2><div class="rule"></div></div>${visible.length?`<div class="grid">${visible.map(eventCard).join('')}</div>`:`<div class="empty">${list.length?ui('当前筛选条件下暂无活动。','No events match the current filters.'):hint}</div>`}`}
function publicSection(id,title,list,hint){reportSectionFilters.set(id,{title,list,hint});return `<section id="${id}"></section>`}
function renderReportSections(){const controls=document.querySelector('#report-filter-controls');if(controls)controls.innerHTML=reportFilterControls();reportSectionFilters.forEach((_,id)=>renderReportSection(id))}
window.setReportVertical=value=>{activeReportVertical=reportVerticals().some(([key])=>key===value)?value:'all';renderReportSections()};
window.setReportImportance=value=>{activeReportImportance=reportImportanceTiers().some(([key])=>key===value)?value:'all';renderReportSections()};
function trendSection(list=[],options={}){return `<section><div class="weekline"><div><h2>Trend</h2><small class="trend-rule">${ui('汇总近30日社媒信号，经模型核验精选','Selected from the past 30 days of media signals after model-assisted verification')}</small></div><div class="rule"></div></div>${list.length?`<div class="grid">${list.map(trend=>trendCard(trend,options)).join('')}</div>`:`<div class="empty">${ui('本周暂无已发布的 Trend。','No published trends this week.')}</div>`}</section>`}
function selectionStandards(){return `<section class="selection-standards" aria-labelledby="selection-standards-title"><div class="selection-standards-head"><span class="eyebrow">EDITORIAL STANDARD</span><h2 id="selection-standards-title">${ui('筛选标准','Selection criteria')}</h2><p>${ui('本报关注纽约 Beauty、Fashion、Food 等重点垂类的新店与线下活动。信源包括品牌与主办方官方渠道、纽约当地权威媒体、垂类媒体及城市文化机构。新店结合外部关注依据和探店价值筛选；门店活动核验具体体验、举办时间与参与方式。每期覆盖本周一至下周日间共两周，保留具有明确城市重要性的 Things to do 内容。经原文核验、模型建议与人工确认后发布。','NYC Pulse covers new openings and in-person events across key New York categories, including Beauty, Fashion, and Food. Sources include official brand and organizer channels, authoritative local New York media, specialist publications, and city cultural institutions. New openings are selected using external attention signals and in-person visit value; store events are verified for the specific experience, timing, and participation details. Each edition covers two weeks, from the current Monday through the following Sunday, and retains Things to do items with clear citywide significance. Everything is published only after source verification, model-assisted review, and human confirmation.')}</p></div></section>`}
function reportEyebrow(report){const edition=Number(report.edition);return `WEEKLY SIGNALS · ${esc(report.week_start)}${Number.isInteger(edition)&&edition>=0?` · No.${String(edition).padStart(3,'0')}`:''}`}
async function latest(id=''){app.classList.remove('admin-main');app.classList.add('report-main');const d=await api(id?`/api/report?id=${encodeURIComponent(id)}`:'/api/reports/latest');if(!d.id){app.innerHTML=`<div class="report-layout"><div class="report-primary"><div class="eyebrow">${reportEyebrow(d)}</div><h1>${ui('纽约这周，值得核验的城市信号','Verified city signals from New York this week')}</h1><div class="empty">${ui('尚无已发布周报。请进入审核后台回放样例、审核候选并发布。','No report has been published yet. Open the admin workspace to review candidates and publish an edition.')}</div></div>${momentCalendarAside()}</div>`;await loadMomentCalendar();return}activeReportVertical='all';activeReportImportance='all';reportSectionFilters.clear();app.innerHTML=`<div class="report-layout"><div class="report-primary"><div class="eyebrow">${reportEyebrow(d)}</div><h1 class="report-title">${esc(d.title)}</h1><p class="lead">${esc(d.intro)}</p>${selectionStandards()}${typeof newStoreSection==='function'?newStoreSection(d):''}<div id="report-filter-controls" class="report-filter-controls"></div>${publicSection('report-this-week',reportSectionTitle('This Week',d.week_start,0),d.this_week,ui('本周暂无已发布活动。','No published events this week.'))}${publicSection('report-upcoming',reportSectionTitle('Upcoming',d.week_start,7),d.upcoming,ui('接下来暂无已发布活动。','No upcoming published events.'))}${trendSection(d.trends||d.beauty_trends||[])}</div>${momentCalendarAside()}</div>`;renderReportSections();await loadMomentCalendar()}
async function archive(){app.classList.remove('admin-main','report-main');const rows=await api('/api/reports/archive');app.innerHTML=`<div class="eyebrow">ARCHIVE</div><h1>${ui('往期周报','Past editions')}</h1><p class="lead">${ui('按周归档已发布版本，不展示草稿或候选。','Published editions are archived by week. Drafts and candidates are not shown.')}</p>${rows.length?rows.map(r=>`<a class="archive-row" href="?report=${r.id}" data-report="${r.id}"><strong>${esc(r.title)}</strong><span>${esc(r.week_start)}</span></a>`).join(''):`<div class="empty">${ui('暂无归档。','No archived editions yet.')}</div>`}`;document.querySelectorAll('[data-report]').forEach(a=>a.onclick=e=>{e.preventDefault();history.pushState({},'',`?report=${a.dataset.report}`);latest(a.dataset.report)})}

let publicSnapshot;
let staticTranslationsRequest;
async function staticSnapshot(){
  if(!publicSnapshot){
    publicSnapshot=fetch('static/public-data.json',{cache:'no-store'}).then(async response=>{
      if(!response.ok)throw new Error('公开周报数据载入失败');
      return response.json();
    });
  }
  return publicSnapshot;
}
async function staticTranslations(){
  if(Object.keys(publicTranslations).length)return publicTranslations;
  if(!staticTranslationsRequest){
    staticTranslationsRequest=fetch('static/public-translations.json',{cache:'no-store'})
      .then(async response=>response.ok?response.json():{});
  }
  publicTranslations=await staticTranslationsRequest;
  return publicTranslations;
}
async function api(path){
  const [data]=await Promise.all([staticSnapshot(),staticTranslations()]);
  const url=new URL(path,location.origin);
  if(url.pathname==='/api/reports/latest')return localizePublicData(data.latest);
  if(url.pathname==='/api/reports/archive')return localizePublicData(data.archive);
  if(url.pathname==='/api/report'){
    const report=data.reports.find(item=>item.id===url.searchParams.get('id'));
    if(report)return localizePublicData(report);
  }
  if(url.pathname==='/api/'+'admin/moment-calendar')return localizePublicData(data.moments);
  throw new Error(ui('该静态页面不提供此接口','This static page does not provide this endpoint'));
}
async function route(){
  nav();
  try{
    const params=new URLSearchParams(location.search);
    if(params.has('archive'))await archive();
    else await latest(params.get('report')||'');
  }catch(error){
    app.innerHTML=`<div class="empty">${ui('载入失败：','Failed to load: ')}${esc(error.message)}</div>`;
  }
}
function nav(){
  applyPublicLanguageChrome();
  const archiveMode=new URLSearchParams(location.search).has('archive');
  document.querySelectorAll('[data-route]').forEach(node=>{
    node.classList.toggle(
      'active',
      node.dataset.route==='/'?!archiveMode:node.dataset.route==='/archive'&&archiveMode
    );
  });
}
window.onpopstate=route;route();
