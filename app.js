/* Static client: no wallet connection, no framework, no backend. */
(() => {
 'use strict';
 const config=window.POOL_CONFIG||{};
 const locales=window.POOL_LOCALES||{};
 const $=id=>document.getElementById(id);
 const state={lang:'en',pool:null,history:null,range:20,busy:false,paused:false,cooldownUntil:0};
 const tr=key=>(locales[state.lang]||locales.en||{})[key]||(locales.en||{})[key]||key;
 const storage={get(k){try{return localStorage.getItem(k)}catch{return null}},set(k,v){try{localStorage.setItem(k,v)}catch{}}};
 const number=v=>(typeof v==='number'||(typeof v==='string'&&v.trim()!==''))&&Number.isFinite(Number(v))&&Number(v)>=0?Number(v):null;
 const integer=v=>number(v)!==null&&Number.isSafeInteger(Number(v));
 const validPool=d=>!!d&&typeof d==='object'&&!Array.isArray(d)&&[d.live_stake,d.live_delegators,d.blocks_minted].some(v=>number(v)!==null);
 const validHistory=d=>Array.isArray(d)&&d.length<=30&&d.every(e=>e&&integer(e.epoch)&&integer(e.blocks));
 const nf=(v,options={})=>new Intl.NumberFormat(state.lang,options).format(v);
 const ada=v=>v===null?'—':nf(v/1e6,{notation:v>=1e12?'compact':'standard',maximumFractionDigits:2})+' ADA';
 const put=(id,value,title)=>{const el=$(id);if(el){el.textContent=value;el.title=title||''}};
 const timestamp=ts=>new Intl.DateTimeFormat(state.lang,{dateStyle:'short',timeStyle:'short'}).format(new Date(ts));
 const cacheKey=kind=>'isp-premium-v3:'+config.poolId+':'+kind;
 function readCache(kind,validate){
  try{
   const entry=JSON.parse(storage.get(cacheKey(kind))||'null');
   const age=Date.now()-entry?.time;
   if(entry&&Number.isFinite(entry.time)&&age>=0&&age<(config.cacheMs||300000)&&validate(entry.data))return {...entry,status:'cached'};
  }catch{}
  return null;
 }
 function saveCache(kind,entry){storage.set(cacheKey(kind),JSON.stringify({time:entry.time,data:entry.data}))}
 async function request(path,validate){
  const controller=new AbortController();const timer=setTimeout(()=>controller.abort(),config.timeoutMs||10000);
  try{
   const response=await fetch(config.apiBase+path,{headers:{project_id:config.apiKey},signal:controller.signal,credentials:'omit',cache:'no-store'});
   if(!response.ok)throw new Error('API HTTP '+response.status);
   const data=await response.json();if(!validate(data))throw new Error('Invalid API response');
   return {data,time:Date.now(),status:'fresh'};
  }finally{clearTimeout(timer)}
 }
 function showStatus(id,entry){
  const el=$(id);if(!el)return;
  if(!entry){el.textContent=tr(state.busy?'loading':'unavailable');el.dataset.state=state.busy?'loading':'error';return}
  const expired=Date.now()-entry.time>(config.cacheMs||300000);
  const key=entry.status==='fresh'&&!expired?'fresh':'cached';
  el.textContent=tr(key).replace('{time}',timestamp(entry.time))+(entry.failed?' · '+tr('unavailable'):'');
  el.dataset.state=entry.failed?'error':key;
 }
 function renderPool(){
  const p=state.pool?.data;
  const values=p?{
   liveStake:ada(number(p.live_stake)),delegators:integer(p.live_delegators)?nf(Number(p.live_delegators)):'—',
   lifetimeBlocks:integer(p.blocks_minted)?nf(Number(p.blocks_minted)):'—',
   saturation:number(p.live_saturation)!==null?nf(Number(p.live_saturation)*100,{maximumFractionDigits:2})+'%':'—',
   margin:number(p.margin_cost)!==null&&Number(p.margin_cost)<=1?nf(Number(p.margin_cost)*100,{maximumFractionDigits:2})+'%':'—',
   fixedCost:ada(number(p.fixed_cost)),pledge:ada(number(p.declared_pledge))
  }:{liveStake:'—',delegators:'—',lifetimeBlocks:'—',saturation:'—',margin:'—',fixedCost:'—',pledge:'—'};
  for(const [id,value] of Object.entries(values))put(id,value,value==='—'?tr('unknown'):'');
  if(p&&number(p.live_stake)!==null) $('liveStake').title=nf(Number(p.live_stake)/1e6,{maximumFractionDigits:6})+' ADA';
  showStatus('poolStatus',state.pool);
 }
 function renderHistory(){
  showStatus('historyStatus',state.history);
  const history=state.history?.data||[];
  const unique=[...new Map(history.map(e=>[Number(e.epoch),{epoch:Number(e.epoch),blocks:Number(e.blocks)}])).values()].sort((a,b)=>b.epoch-a.epoch);
  const displayed=unique.slice(0,state.range).reverse();
  $('chart').replaceChildren();$('tableBody').replaceChildren();
  if(!displayed.length){
   ['viewBlocks','viewEpochs','latestEpoch'].forEach(id=>put(id,'—'));
   const empty=document.createElement('div');empty.className='chart-empty';
   const p=document.createElement('p');p.textContent=tr('chart_empty');
   const a=document.createElement('a');a.href=config.explorer;a.target='_blank';a.rel='noopener noreferrer';a.className='text-link';a.textContent=tr('explore')+' ↗';
   empty.append(p,a);$('chart').append(empty);return;
  }
  put('viewBlocks',nf(displayed.reduce((sum,e)=>sum+e.blocks,0)));put('viewEpochs',nf(displayed.length));put('latestEpoch',nf(unique[0].epoch));
  const max=Math.max(...displayed.map(e=>e.blocks),1);
  const bars=document.createElement('div');bars.className='chart-bars';
  displayed.forEach((e,index)=>{
   const column=document.createElement('div');column.className='chart-column';column.tabIndex=0;column.setAttribute('role','img');
   const label=tr('epoch')+' '+nf(e.epoch)+': '+nf(e.blocks)+' '+tr('block_count');column.setAttribute('aria-label',label);
   const height=(e.blocks/max)*100;column.style.setProperty('--height',height+'%');
   const bar=document.createElement('div');bar.className='chart-bar';bar.setAttribute('aria-hidden','true');
   const tip=document.createElement('span');tip.className='chart-tip';tip.textContent=label;tip.setAttribute('aria-hidden','true');
   const axis=document.createElement('span');axis.className='chart-label';axis.textContent=displayed.length<=10||index%Math.ceil(displayed.length/10)===0||index===displayed.length-1?nf(e.epoch):'';axis.setAttribute('aria-hidden','true');
   column.append(bar,tip,axis);bars.append(column);
   const row=document.createElement('tr');for(const v of [e.epoch,e.blocks]){const td=document.createElement('td');td.textContent=nf(v);row.append(td)}$('tableBody').append(row);
  });$('chart').append(bars);
 }
 async function loadData(force=false){
  if(state.busy||(force&&Date.now()<state.cooldownUntil))return;
  if(!config.apiKey||!config.apiBase||!config.poolId){state.busy=false;renderPool();renderHistory();['poolStatus','historyStatus'].forEach(id=>put(id,tr('not_configured')));return}
  state.busy=true;$('refresh').disabled=true;$('refresh').setAttribute('aria-busy','true');
  if(!force){state.pool=readCache('pool',validPool);state.history=readCache('history',validHistory)}
  renderPool();renderHistory();
  const tasks=[['pool','/pools/'+config.poolId,validPool],['history','/pools/'+config.poolId+'/history?order=desc&count=30',validHistory]];
  await Promise.all(tasks.map(async([kind,path,validate])=>{
   if(!force&&state[kind])return;
   try{state[kind]=await request(path,validate);saveCache(kind,state[kind])}
   catch{if(state[kind])state[kind]={...state[kind],status:'cached',failed:true}}
  }));
  state.busy=false;state.cooldownUntil=Date.now()+10000;renderPool();renderHistory();
  $('refresh').removeAttribute('aria-busy');setTimeout(()=>{$('refresh').disabled=false},10000);
 }
 function setLanguage(lang,sync=true){
  state.lang=locales[lang]?lang:'en';document.documentElement.lang=state.lang;$('language').value=state.lang;
  document.querySelectorAll('[data-i18n]').forEach(el=>{el.textContent=tr(el.dataset.i18n)});
  document.querySelectorAll('[data-i18n-aria]').forEach(el=>el.setAttribute('aria-label',tr(el.dataset.i18nAria)));
  $('motion').setAttribute('aria-label',tr(state.paused?'resume':'motion'));
  $('qrDialog').querySelector('img').alt=tr('qr_alt');
  storage.set('isp-language',state.lang);
  if(sync){try{const url=new URL(location.href);if(state.lang==='en')url.searchParams.delete('lang');else url.searchParams.set('lang',state.lang);history.replaceState(null,'',url)}catch{}}
  renderPool();renderHistory();
 }
 const mobile=matchMedia('(max-width:850px)');
 function closeNav(){const nav=$('navigation');nav.classList.remove('open');$('menu').setAttribute('aria-expanded','false');nav.inert=mobile.matches}
 function toggleNav(){const open=$('menu').getAttribute('aria-expanded')!=='true';$('navigation').classList.toggle('open',open);$('navigation').inert=!open&&mobile.matches;$('menu').setAttribute('aria-expanded',String(open))}
 let toastTimer;
 function toast(message){clearTimeout(toastTimer);if($('qrDialog').open){$('dialogStatus').textContent=message;return}$('toast').textContent=message;$('toast').classList.add('visible');toastTimer=setTimeout(()=>$('toast').classList.remove('visible'),4500)}
 async function copyId(){
  try{if(!navigator.clipboard?.writeText)throw new Error('Clipboard unavailable');await navigator.clipboard.writeText(config.poolId);toast(tr('copied'))}
  catch{const range=document.createRange();range.selectNodeContents($('qrDialog').open?$('qrDialog').querySelector('code'):$('poolId'));const selection=getSelection();selection.removeAllRanges();selection.addRange(range);toast(tr('copy_fail'))}
 }
 let dialogOpener=null;
 function openQr(event){
  dialogOpener=event.currentTarget;$('dialogStatus').textContent='';
  if(typeof $('qrDialog').showModal!=='function'){window.open('./pool-qr.png','_blank','noopener');return}
  closeNav();$('qrDialog').showModal();document.body.classList.add('modal-open');$('closeQr').focus();
 }
 function init(){
  document.documentElement.classList.add('js');
  let lang;try{lang=new URLSearchParams(location.search).get('lang')}catch{}
  lang=lang||storage.get('isp-language')||(navigator.language||'en').split('-')[0];setLanguage(lang,false);
  $('year').textContent=new Date().getFullYear();closeNav();
  $('language').addEventListener('change',e=>{setLanguage(e.target.value);closeNav()});
  window.addEventListener('scroll',()=>{if(window.scrollY<$('pool').offsetTop-140)document.querySelectorAll('[data-section]').forEach(a=>a.removeAttribute('aria-current'))},{passive:true});
  $('menu').addEventListener('click',toggleNav);mobile.addEventListener('change',closeNav);
  document.querySelectorAll('#navigation a').forEach(a=>a.addEventListener('click',closeNav));
  document.addEventListener('click',e=>{if(!$('navigation').contains(e.target)&&!$('menu').contains(e.target))closeNav()});
  document.addEventListener('keydown',e=>{if(e.key==='Escape'&&$('menu').getAttribute('aria-expanded')==='true'){closeNav();$('menu').focus()}});
  document.querySelectorAll('[data-copy]').forEach(b=>b.addEventListener('click',copyId));
  document.querySelectorAll('[data-qr]').forEach(b=>b.addEventListener('click',openQr));
  $('closeQr').addEventListener('click',()=>$('qrDialog').close());
  $('qrDialog').addEventListener('keydown',e=>{
   if(e.key!=='Tab')return;
   const controls=[...$('qrDialog').querySelectorAll('button:not([disabled]),a[href]')];
   const first=controls[0],last=controls[controls.length-1];
   if(e.shiftKey&&document.activeElement===first){e.preventDefault();last.focus()}
   else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first.focus()}
  });
  $('qrDialog').addEventListener('close',()=>{document.body.classList.remove('modal-open');dialogOpener?.focus()});
  $('qrDialog').addEventListener('click',e=>{const b=$('qrDialog').getBoundingClientRect();if(e.clientX<b.left||e.clientX>b.right||e.clientY<b.top||e.clientY>b.bottom)$('qrDialog').close()});
  $('refresh').addEventListener('click',()=>loadData(true));
  document.querySelectorAll('[data-range]').forEach(b=>b.addEventListener('click',()=>{state.range=Number(b.dataset.range);document.querySelectorAll('[data-range]').forEach(el=>el.setAttribute('aria-pressed',String(el===b)));renderHistory()}));
  $('tableToggle').addEventListener('click',()=>{const open=$('dataTable').hidden;$('dataTable').hidden=!open;$('tableToggle').setAttribute('aria-expanded',String(open))});
  $('motion').addEventListener('click',()=>{state.paused=!state.paused;document.querySelector('.art-stage').classList.toggle('art-paused',state.paused);$('motion').setAttribute('aria-pressed',String(state.paused));$('motion').setAttribute('aria-label',tr(state.paused?'resume':'motion'))});
  if(typeof window.IntersectionObserver==='function'){
   const art=document.querySelector('.art-stage');new IntersectionObserver(entries=>art.classList.toggle('art-offscreen',!entries[0].isIntersecting)).observe(art);
   const observer=new IntersectionObserver(entries=>{entries.forEach(entry=>{if(entry.isIntersecting){document.querySelectorAll('[data-section]').forEach(a=>{if(a.dataset.section===entry.target.id)a.setAttribute('aria-current','location');else a.removeAttribute('aria-current')})}})},{rootMargin:'-20% 0px -60% 0px'});
   ['pool','performance','infrastructure','start'].forEach(id=>observer.observe($(id)));
  }
  loadData();
  setInterval(()=>{showStatus('poolStatus',state.pool);showStatus('historyStatus',state.history)},60000);
 }
 init();
})();
