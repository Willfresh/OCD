(function(){
'use strict';
var $=function(s){return document.querySelector(s)};
var $$=function(s){return Array.prototype.slice.call(document.querySelectorAll(s))};

/* ================= Thème (partagé avec le site) ================= */
var themeBtn=$('#theme-toggle');
var themeMeta=document.querySelector('meta[name="theme-color"]');
function currentTheme(){return document.documentElement.getAttribute('data-theme')==='dark'?'dark':'light';}
function syncThemeChrome(){
if(themeMeta)themeMeta.setAttribute('content',currentTheme()==='dark'?'#0A0908':'#FFF9F1');
if(themeBtn)themeBtn.setAttribute('aria-label',currentTheme()==='dark'?'Activer le thème clair':'Activer le thème sombre');
}
if(themeBtn){
themeBtn.addEventListener('click',function(){
  var next=currentTheme()==='dark'?'light':'dark';
  document.documentElement.setAttribute('data-theme',next);
  try{localStorage.setItem('ocd-theme',next);}catch(_){}
  syncThemeChrome();
});
syncThemeChrome();
}

/* ================= Constantes ================= */
var YEAR=2026,MONTH=11,DAYS_IN_MONTH=31;
var CODE='OCD2026';
var DEFAULT_WA='4917658443070';
var SLOT_TIMES=['08:00 – 09:30','09:30 – 11:00','11:00 – 12:30','12:30 – 14:00','14:00 – 15:30','15:30 – 17:00','17:00 – 18:30','18:30 – 20:00'];
var PACKAGES={
'live-express':{name:'Live Express',amount:15000,dur:'1h30'},
'live-plus':{name:'Live Plus',amount:20000,dur:'1h30 + annonce'},
'demi-journee':{name:'Demi-journée',amount:40000,dur:'4h'},
'journee':{name:'Journée',amount:70000,dur:'8h'},
'promo-bovann':{name:'Promo Bovann',amount:60000,dur:'Vidéo + live'},
'pass-mensuel':{name:'Pass Mensuel',amount:100000,dur:'8 lives / mois'}
};
var PK_ORDER=['live-express','live-plus','demi-journee','journee','promo-bovann','pass-mensuel'];
var STATUS={confirmee:'Confirmée',attente:'En attente',annulee:'Annulée'};
var MODE_LABELS={presentiel:'Live en présentiel',distance:'Live à distance'};

/* Icônes */
var I_WA='<svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor"><path d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91c0 1.75.46 3.45 1.32 4.95L2 22l5.25-1.38a9.9 9.9 0 0 0 4.79 1.22h.01c5.46 0 9.9-4.45 9.9-9.91 0-2.65-1.03-5.14-2.9-7.01A9.82 9.82 0 0 0 12.04 2zm5.8 14.06c-.24.68-1.4 1.3-1.93 1.35-.53.05-1.02.24-3.44-.72-2.92-1.15-4.76-4.2-4.9-4.4-.15-.2-1.17-1.56-1.17-2.97 0-1.41.73-2.1 1-2.39.26-.29.57-.36.76-.36.19 0 .38 0 .55.01.18.01.41-.07.64.49.24.56.8 1.95.87 2.09.07.15.12.32.02.51-.1.2-.15.32-.29.49-.15.17-.31.39-.44.52-.15.15-.3.31-.13.61.17.29.75 1.24 1.61 2.01 1.11.99 2.04 1.3 2.33 1.44.29.15.46.12.63-.07.17-.2.73-.85.92-1.14.19-.29.39-.24.65-.15.27.1 1.66.78 1.94.92.29.15.48.22.55.34.07.12.07.7-.17 1.38z"/></svg>';
var I_EYE='<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>';
var I_TRASH='<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>';
var I_CAL='<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>';
var I_CARD='<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="1" y="4" width="22" height="16" rx="2"/><line x1="1" y1="10" x2="23" y2="10"/></svg>';
var I_CLOCK='<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>';
var I_ZAP='<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>';

/* ================= Jeu de démonstration ================= */
function fmtNum(n){return String(Math.round(+n||0)).replace(/\B(?=(\d{3})+(?!\d))/g,' ');}
function mk(ref,dISO,slot,pkg,name,phone,product,mode,status,payLabel,created){
var p=PACKAGES[pkg];
return{ref:ref,created:created,name:name,phone:phone,email:'',product:product,msg:'',
mode:mode,modeLabel:MODE_LABELS[mode],date:+dISO.split('-')[2],dateISO:dISO,slot:slot,
pkg:pkg,pkgName:p.name,dur:p.dur,price:fmtNum(p.amount)+' FCFA',amount:p.amount,
payMethod:payLabel.indexOf('Carte')===0?'card':'momo',payLabel:payLabel,status:status,demo:true};
}
var SEED=[
mk('OCD-AK3F9M','2026-12-01','08:00 – 09:30','live-express','Awa Kodjo','+228 90 12 34 56','Savons artisanaux « Néva »','presentiel','confirmee','Mobile Money — T-Money','2026-10-28T10:12:00.000Z'),
mk('OCD-BW7H2Q','2026-12-01','17:00 – 18:30','live-plus','Kossi Mensah','+228 91 45 78 20','Pagnés wax « Abiana »','presentiel','confirmee','Mobile Money — Flooz','2026-10-29T16:40:00.000Z'),
mk('OCD-CJ8N4T','2026-12-02','11:00 – 12:30','demi-journee','Mariam Diallo','+223 76 55 21 09','Mèches & tresses « Élégance »','distance','confirmee','Carte bancaire','2026-10-30T09:05:00.000Z'),
mk('OCD-DL2P6V','2026-12-03','09:30 – 11:00','live-express','Yao Amégan','+228 90 03 87 45','Restaurant « Chez Maman Awa »','presentiel','confirmee','Mobile Money — T-Money','2026-10-31T14:22:00.000Z'),
mk('OCD-EM4R8X','2026-12-04','14:00 – 15:30','promo-bovann','Grâce Abalo','+228 92 16 50 33','Cosmétiques « Karité Bio »','presentiel','confirmee','Carte bancaire','2026-11-01T11:48:00.000Z'),
mk('OCD-FN6T2Z','2026-12-05','08:00 – 09:30','live-plus','Ibrahim Sow','+221 77 812 44 06','Baskets « Lomé Street »','distance','attente','Mobile Money — Flooz','2026-11-02T18:31:00.000Z'),
mk('OCD-GP8V4B','2026-12-07','12:30 – 14:00','live-express','Nadège Aholou','+228 90 77 41 12','Jus naturels « Togo Fresh »','presentiel','confirmee','Mobile Money — T-Money','2026-11-03T08:55:00.000Z'),
mk('OCD-HQ2W6D','2026-12-08','15:30 – 17:00','journee','Sylvie Kouassi','+225 07 45 89 63','Robes wax « Adjoa Style »','distance','confirmee','Carte bancaire','2026-11-04T13:17:00.000Z'),
mk('OCD-JR4X8F','2026-12-09','09:30 – 11:00','live-express','Farid Bello','+228 91 30 28 74','Téléphones & accessoires « Digital Lomé »','presentiel','confirmee','Mobile Money — T-Money','2026-11-04T19:02:00.000Z'),
mk('OCD-KT6Z2H','2026-12-10','11:00 – 12:30','pass-mensuel','Chantal Adjoua','+228 90 55 67 21','Pâtisserie « Douceur de Lomé »','presentiel','confirmee','Carte bancaire','2026-11-05T10:26:00.000Z'),
mk('OCD-LV8B4J','2026-12-11','17:00 – 18:30','live-plus','Kwame Mensah','+233 24 555 09 18','Agence de voyages « Afrika Tours »','distance','annulee','Mobile Money — Flooz','2026-11-05T17:44:00.000Z'),
mk('OCD-MX2D6N','2026-12-16','08:00 – 09:30','live-express','Rachidatou Sanni','+229 96 44 21 87','Beurre de karité « Karimetou »','presentiel','confirmee','Mobile Money — T-Money','2026-11-06T09:38:00.000Z'),
mk('OCD-NZ4F8P','2026-12-15','14:00 – 15:30','demi-journee','Éric Tchana','+237 6 99 45 12 30','Vêtements enfants « Petits Boss »','distance','confirmee','Carte bancaire','2026-11-06T15:11:00.000Z'),
mk('OCD-PA6H2R','2026-12-18','12:30 – 14:00','journee','Fatou Ndiaye','+221 78 234 56 90','Bijoux fantaisie « Perle d\'Or »','presentiel','attente','Mobile Money — Flooz','2026-11-07T12:09:00.000Z')
];

/* ================= Données (localStorage partagé avec le site) ================= */
function loadList(){
var list=[];
try{var raw=localStorage.getItem('ocd-bookings');if(raw){var p=JSON.parse(raw);if(Array.isArray(p))list=p;}}catch(_){}
var seeded=false;
try{seeded=localStorage.getItem('ocd-seeded')==='1';}catch(_){}
if(!seeded){
  var real=list.filter(function(b){return b&&!b.demo;});
  list=SEED.concat(real);
  try{localStorage.setItem('ocd-bookings',JSON.stringify(list));localStorage.setItem('ocd-seeded','1');}catch(_){}
}
return list;
}
function saveList(list){try{localStorage.setItem('ocd-bookings',JSON.stringify(list));}catch(_){}}
function loadDays(){
var d={full:[12,19,24],near:[5,26],closed:[25]};
try{var raw=localStorage.getItem('ocd-cal');if(raw){var o=JSON.parse(raw);
if(o){if(Array.isArray(o.full))d.full=o.full;if(Array.isArray(o.near))d.near=o.near;if(Array.isArray(o.closed))d.closed=o.closed;}
}}catch(_){}
return d;
}
function saveDays(d){try{localStorage.setItem('ocd-cal',JSON.stringify(d));}catch(_){}}

/* ================= Utilitaires ================= */
function esc(s){return String(s==null?'':s).replace(/[&<>"']/g,function(c){return{'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c];});}
function fmt(n){return fmtNum(n)+' FCFA';}
function digits(p){return String(p||'').replace(/[^\d]/g,'');}
function cap(s){return s.charAt(0).toUpperCase()+s.slice(1);}
function pad2(n){return (n<10?'0':'')+n;}
function isoOf(d){return YEAR+'-12-'+pad2(d);}
function dateLabel(iso){var p=String(iso).split('-');return new Date(+p[0],+p[1]-1,+p[2]).toLocaleDateString('fr-FR',{weekday:'long',day:'numeric',month:'long'});}
function shortDate(iso){var p=String(iso).split('-');return cap(new Date(+p[0],+p[1]-1,+p[2]).toLocaleDateString('fr-FR',{weekday:'short',day:'numeric',month:'short'}));}
function todayISO(){var t=new Date();return t.getFullYear()+'-'+pad2(t.getMonth()+1)+'-'+pad2(t.getDate());}
function statusPill(st){return '<span class="pill-st st-'+esc(st)+'">'+(STATUS[st]||esc(st))+'</span>';}
function newTag(b){return b.demo?'':'<span class="tag-new">Nouvelle</span>';}
function active(b){return b.status!=='annulee';}
function byCreatedDesc(a,b){return String(a.created||'')<String(b.created||'')?1:-1;}
function waHref(b){
var num=digits(b.phone)||DEFAULT_WA;
var msg='Bonjour '+b.name+' ! Ici la régie OCD Live, au sujet de votre réservation '+b.ref+' ('+b.pkgName+' du '+dateLabel(b.dateISO)+', '+b.slot+').';
return 'https://wa.me/'+num+'?text='+encodeURIComponent(msg);
}
function updateBadge(){
var n=loadList().filter(function(b){return !b.demo&&active(b);}).length;
var el=$('#nav-badge');
if(el){el.hidden=!n;el.textContent=n;}
}

/* ================= État ================= */
var curView='overview',selectedDay=null,searchQ='',statusF='',DAYS=loadDays();

/* ================= Connexion (simulée) ================= */
var loginView=$('#adm-login'),app=$('#adm-app'),codeInput=$('#adm-code'),loginForm=$('#login-form');
function enterApp(){
loginView.style.display='none';
app.hidden=false;
switchView('overview');
}
function exitApp(){
try{sessionStorage.removeItem('ocd-admin');}catch(_){}
app.hidden=true;
loginView.style.display='grid';
if(codeInput){codeInput.value='';codeInput.focus();}
}
if(loginForm){
loginForm.addEventListener('submit',function(e){
  e.preventDefault();
  if(codeInput.value.trim().toUpperCase()===CODE){
    try{sessionStorage.setItem('ocd-admin','1');}catch(_){}
    enterApp();
  }else{
    var f=codeInput.closest('.field');
    if(f){f.classList.add('err');var p=f.querySelector('.ferr');if(p)p.textContent='Code incorrect — réessayez.';}
    loginForm.classList.remove('shake');void loginForm.offsetWidth;loginForm.classList.add('shake');
    codeInput.select();
  }
});
codeInput.addEventListener('input',function(){
  var f=codeInput.closest('.field');if(f)f.classList.remove('err');
});
}
var authed=false;
try{authed=sessionStorage.getItem('ocd-admin')==='1';}catch(_){}
if(authed)enterApp();

/* ================= Navigation ================= */
function render(v){
if(v==='overview')renderOverview();
else if(v==='bookings')renderBookings();
else if(v==='slots'){renderCal();renderDayPanel();}
else if(v==='settings')renderSettings();
updateBadge();
}
function switchView(v){
curView=v;
$$('.adm-nav-btn').forEach(function(b){b.classList.toggle('on',b.getAttribute('data-view')===v);});
$$('.adm-view').forEach(function(s){s.classList.toggle('on',s.getAttribute('data-view')===v);});
render(v);
window.scrollTo(0,0);
}
$$('.adm-nav-btn').forEach(function(b){
b.addEventListener('click',function(){switchView(b.getAttribute('data-view'));});
});
$$('[data-goto]').forEach(function(b){
b.addEventListener('click',function(){switchView(b.getAttribute('data-goto'));});
});
var btnRefresh=$('#btn-refresh');
if(btnRefresh)btnRefresh.addEventListener('click',function(){render(curView);});
var btnLogout=$('#btn-logout');
if(btnLogout)btnLogout.addEventListener('click',exitApp);

/* ================= Vue d'ensemble ================= */
function stats(list){
var s={tot:list.length,conf:0,wait:0,canc:0,rev:0};
list.forEach(function(b){
if(b.status==='confirmee'){s.conf++;s.rev+=(+b.amount||0);}
else if(b.status==='attente')s.wait++;else s.canc++;
});
return s;
}
function occupancyOf(list){
var m={};
list.forEach(function(b){if(active(b)&&b.dateISO)m[b.dateISO]=(m[b.dateISO]||0)+1;});
return m;
}
function statCard(icon,lbl,num,small,sub){
return '<article class="stat-card"><p class="stat-lbl">'+icon+esc(lbl)+'</p>'
+'<p class="stat-num">'+num+(small?' <small>'+small+'</small>':'')+'</p>'
+'<p class="stat-sub">'+sub+'</p></article>';
}
function renderOverview(){
var list=loadList(),st=stats(list),occ=occupancyOf(list);
var open=0,d,dow;
for(d=1;d<=DAYS_IN_MONTH;d++){dow=new Date(YEAR,MONTH,d).getDay();if(dow!==0&&DAYS.closed.indexOf(d)<0)open++;}
var capacity=open*SLOT_TIMES.length,occupTotal=0;
Object.keys(occ).forEach(function(k){occupTotal+=occ[k];});
var pct=capacity?Math.round(occupTotal/capacity*100):0;
var next=null;
list.forEach(function(b){
if(!active(b)||!b.dateISO||b.dateISO<todayISO())return;
if(!next||b.dateISO<next.dateISO||(b.dateISO===next.dateISO&&SLOT_TIMES.indexOf(b.slot)<SLOT_TIMES.indexOf(next.slot)))next=b;
});
$('#stat-grid').innerHTML=
statCard(I_CAL,'Réservations',st.tot,'',st.conf+' confirmée'+(st.conf>1?'s':'')+' · '+st.wait+' en attente · '+st.canc+' annulée'+(st.canc>1?'s':''))
+statCard(I_CARD,'Recettes confirmées',fmtNum(st.rev),'FCFA','Mobile Money + carte bancaire, sur paiements confirmés')
+statCard(I_CLOCK,'Taux d\'occupation',pct,'%',occupTotal+' créneaux réservés sur '+capacity+' ouverts')
+statCard(I_ZAP,'Prochain live',next?esc(shortDate(next.dateISO)):'—','',next?esc(next.slot)+' · '+esc(next.name):'Aucun live planifié');

/* Réservations par package */
var counts={};PK_ORDER.forEach(function(p){counts[p]=0;});
list.forEach(function(b){if(active(b)&&counts[b.pkg]!=null)counts[b.pkg]++;});
var max=Math.max.apply(null,PK_ORDER.map(function(p){return counts[p];}).concat([1]));
$('#chart-pkg').innerHTML=PK_ORDER.map(function(p){
return '<div class="bar-row"><span class="bar-lbl">'+esc(PACKAGES[p].name)+'</span>'
+'<span class="bar-track"><span class="bar-fill" style="width:'+(counts[p]/max*100)+'%"></span></span>'
+'<span class="bar-val">'+counts[p]+'</span></div>';
}).join('');

/* Remplissage par jour */
var maxC=1;
for(d=1;d<=DAYS_IN_MONTH;d++)maxC=Math.max(maxC,occ[isoOf(d)]||0);
var html='';
for(d=1;d<=DAYS_IN_MONTH;d++){
var iso=isoOf(d),dow2=new Date(YEAR,MONTH,d).getDay(),c=occ[iso]||0;
var cls=dow2===0||DAYS.closed.indexOf(d)>-1?'closed':(DAYS.full.indexOf(d)>-1?'full':(c===0?'zero':''));
html+='<button type="button" class="col-col '+cls+'" data-day="'+d+'"'+(dow2===0?' disabled':'')
+' title="'+esc(cap(dateLabel(iso)))+' — '+c+' réservation'+(c>1?'s':'')+'" aria-label="Ouvrir le '+esc(cap(dateLabel(iso)))+' dans la gestion des créneaux">'
+'<span class="col-bar" style="height:'+Math.max(5,c/maxC*100)+'%"></span></button>';
}
$('#chart-days').innerHTML=html;

/* Dernières réservations */
var recent=list.slice().sort(byCreatedDesc).slice(0,5);
$('#recent-list').innerHTML=recent.length?recent.map(function(b){
return '<div class="recent-item"><span class="recent-ref">'+esc(b.ref)+newTag(b)+'</span>'
+'<span class="recent-main"><b>'+esc(b.name)+'</b><small>'+esc(b.product)+' · '+esc(cap(dateLabel(b.dateISO)))+', '+esc(b.slot)+'</small></span>'
+'<span class="recent-amount">'+fmt(b.amount)+'</span>'+statusPill(b.status)+'</div>';
}).join(''):'<p class="empty-state">Aucune réservation pour le moment.</p>';
}
$('#chart-days').addEventListener('click',function(e){
var b=e.target.closest?e.target.closest('.col-col'):null;
if(!b||b.disabled)return;
selectedDay=+b.getAttribute('data-day');
switchView('slots');
});

/* ================= Réservations ================= */
function rowOf(b){
return '<tr>'
+'<td class="bk-ref" data-label="Réf.">'+esc(b.ref)+newTag(b)+'</td>'
+'<td class="bk-client" data-label="Client"><b>'+esc(b.name)+'</b><small>'+esc(b.phone)+'</small></td>'
+'<td data-label="Produit">'+esc(b.product)+'</td>'
+'<td data-label="Date">'+esc(cap(dateLabel(b.dateISO)))+'</td>'
+'<td data-label="Créneau">'+esc(b.slot)+'</td>'
+'<td data-label="Package">'+esc(b.pkgName)+'</td>'
+'<td class="bk-amt" data-label="Montant">'+fmt(b.amount)+'</td>'
+'<td data-label="Statut"><select class="st-sel" data-act="status" data-ref="'+esc(b.ref)+'" aria-label="Statut de la réservation '+esc(b.ref)+'">'
+'<option value="confirmee"'+(b.status==='confirmee'?' selected':'')+'>Confirmée</option>'
+'<option value="attente"'+(b.status==='attente'?' selected':'')+'>En attente</option>'
+'<option value="annulee"'+(b.status==='annulee'?' selected':'')+'>Annulée</option>'
+'</select></td>'
+'<td data-label="Actions"><div class="bk-row-act">'
+'<button type="button" class="icon-btn" data-act="view" data-ref="'+esc(b.ref)+'" title="Voir le détail" aria-label="Détail de la réservation '+esc(b.ref)+'">'+I_EYE+'</button>'
+'<a class="icon-btn" href="'+waHref(b)+'" target="_blank" rel="noopener" title="Contacter sur WhatsApp" aria-label="Contacter '+esc(b.name)+' sur WhatsApp">'+I_WA+'</a>'
+'<button type="button" class="icon-btn danger" data-act="del" data-ref="'+esc(b.ref)+'" title="Supprimer" aria-label="Supprimer la réservation '+esc(b.ref)+'">'+I_TRASH+'</button>'
+'</div></td></tr>';
}
function filteredList(list){
return list.filter(function(b){
if(statusF&&b.status!==statusF)return false;
if(searchQ){
var hay=(b.name+' '+b.product+' '+b.ref+' '+(b.phone||'')).toLowerCase();
if(hay.indexOf(searchQ.toLowerCase())<0)return false;
}
return true;
}).sort(byCreatedDesc);
}
function renderBookings(){
var list=loadList(),shown=filteredList(list);
$('#bk-body').innerHTML=shown.length?shown.map(rowOf).join('')
:'<tr><td colspan="9"><p class="empty-state">Aucune réservation ne correspond à la recherche.</p></td></tr>';
var rev=0;shown.forEach(function(b){if(b.status==='confirmee')rev+=(+b.amount||0);});
$('#bk-count').textContent=shown.length+' affichée'+(shown.length>1?'s':'')+' sur '+list.length+' · recettes confirmées affichées : '+fmt(rev);
}
$('#bk-search').addEventListener('input',function(){searchQ=this.value.trim();renderBookings();});
$('#bk-status').addEventListener('change',function(){statusF=this.value;renderBookings();});

/* Actions du tableau (délégation) */
var armedRef=null,armedTimer=null;
function disarm(){armedRef=null;var b=$('#bk-body .icon-btn.arm');if(b){b.classList.remove('arm');b.title='Supprimer';}}
$('#bk-body').addEventListener('change',function(e){
var sel=e.target;
if(!sel.classList||!sel.classList.contains('st-sel'))return;
var ref=sel.getAttribute('data-ref'),list=loadList(),i;
for(i=0;i<list.length;i++)if(list[i].ref===ref){list[i].status=sel.value;break;}
saveList(list);
updateBadge();
renderBookings();
});
$('#bk-body').addEventListener('click',function(e){
var btn=e.target.closest?e.target.closest('[data-act]'):null;
if(!btn)return;
var act=btn.getAttribute('data-act'),ref=btn.getAttribute('data-ref');
if(act==='view'){openDetail(ref);return;}
if(act==='del'){
if(armedRef===ref){
clearTimeout(armedTimer);disarm();
var list=loadList().filter(function(b){return b.ref!==ref;});
saveList(list);
renderBookings();updateBadge();
}else{
disarm();
armedRef=ref;
btn.classList.add('arm');
btn.title='Cliquer à nouveau pour confirmer la suppression';
clearTimeout(armedTimer);
armedTimer=setTimeout(disarm,3200);
}
}
});

/* Exports */
function download(name,mime,content){
var blob=new Blob([content],{type:mime});
var a=document.createElement('a');
a.href=URL.createObjectURL(blob);a.download=name;
document.body.appendChild(a);a.click();
setTimeout(function(){URL.revokeObjectURL(a.href);if(a.parentNode)a.parentNode.removeChild(a);},400);
}
function csvCell(v){return '"'+String(v==null?'':v).replace(/"/g,'""')+'"';}
$('#bk-export-csv').addEventListener('click',function(){
var rows=[['Référence','Enregistrée le','Nom','Téléphone','E-mail','Produit','Mode','Date','Créneau','Package','Montant (FCFA)','Paiement','Statut']];
filteredList(loadList()).forEach(function(b){
rows.push([b.ref,b.created,b.name,b.phone,b.email,b.product,b.modeLabel,b.dateISO,b.slot,b.pkgName,b.amount,b.payLabel,STATUS[b.status]||b.status]);
});
var csv='\uFEFF'+rows.map(function(r){return r.map(csvCell).join(';');}).join('\r\n');
download('ocd-reservations.csv','text/csv;charset=utf-8',csv);
});
$('#bk-export-json').addEventListener('click',function(){
download('ocd-reservations.json','application/json',JSON.stringify(filteredList(loadList()),null,2));
});

/* ================= Créneaux & calendrier ================= */
function dayState(d,dow){
if(dow===0)return 'sunday';
if(DAYS.closed.indexOf(d)>-1)return 'closed';
if(DAYS.full.indexOf(d)>-1)return 'full';
if(DAYS.near.indexOf(d)>-1)return 'near';
return 'open';
}
function renderCal(){
var occ=occupancyOf(loadList());
var html=['L','M','M','J','V','S','D'].map(function(x){return '<span class="adm-dow">'+x+'</span>';}).join('');
var lead=(new Date(YEAR,MONTH,1).getDay()+6)%7,i,d;
for(i=0;i<lead;i++)html+='<span class="adm-day off"></span>';
for(d=1;d<=DAYS_IN_MONTH;d++){
var dow=new Date(YEAR,MONTH,d).getDay(),c=occ[isoOf(d)]||0,state=dayState(d,dow);
var cls='adm-day'+(state==='closed'||state==='sunday'?' closed':'')+(state==='full'?' full':'')+(state==='near'?' near':'')+(selectedDay===d?' sel':'');
html+='<button type="button" class="'+cls+'" data-day="'+d+'"'+(dow===0?' disabled title="Fermé le dimanche"':'')
+' aria-label="'+esc(cap(dateLabel(isoOf(d))))+' — '+c+' créneau'+(c>1?'x':'')+' réservé'+(c>1?'s':'')+'">'
+'<span class="d-top"><span class="d-num">'+d+'</span><span class="d-occ">'+(state==='closed'||state==='sunday'?'Fermé':c+'/8')+'</span></span>'
+'<span class="d-bar"><i style="width:'+(state==='closed'||state==='sunday'?0:Math.min(100,c/8*100))+'%"></i></span></button>';
}
$('#adm-cal').innerHTML=html;
}
function renderDayPanel(){
var panel=$('#day-panel');
if(!selectedDay){panel.hidden=true;return;}
panel.hidden=false;
var d=selectedDay,iso=isoOf(d),dow=new Date(YEAR,MONTH,d).getDay(),state=dayState(d,dow);
$('#day-title').textContent=cap(dateLabel(iso));
var stateTxt;
if(state==='sunday')stateTxt='Dimanche — l\'antenne est fermée tous les dimanches.';
else if(state==='closed')stateTxt='<b>Fermé</b> — le jour apparaît barré sur le calendrier public.';
else if(state==='full')stateTxt='<b>Complet</b> — le jour apparaît comme complet sur le calendrier public.';
else if(state==='near')stateTxt='<b>Presque complet</b> — le jour est encadré en orange sur le calendrier public.';
else stateTxt='<b>Disponible</b> — jour d\'ouverture normal.';
$('#day-state').innerHTML='État actuel : '+stateTxt+' Ces états s\'appliquent au calendrier public de <code>reservation.html</code> (sur ce navigateur).';
var list=loadList();
$('#day-slots').innerHTML=SLOT_TIMES.map(function(t){
var b=null,i;
for(i=0;i<list.length;i++)if(active(list[i])&&list[i].dateISO===iso&&list[i].slot===t){b=list[i];break;}
return '<div class="day-slot'+(b?' busy':'')+'">'
+'<span class="ds-t">'+esc(t)+'</span>'
+'<span class="ds-c">'+(b?esc(b.name)+' — '+esc(b.product):'Libre')+'</span>'
+(b?'<span class="ds-tag">Réservé · '+esc(b.ref)+'</span>':'')
+'</div>';
}).join('');
}
$('#adm-cal').addEventListener('click',function(e){
var b=e.target.closest?e.target.closest('.adm-day'):null;
if(!b||b.disabled)return;
selectedDay=+b.getAttribute('data-day');
renderCal();renderDayPanel();
});
function setDayState(target){
if(!selectedDay)return;
var d=selectedDay;
if(new Date(YEAR,MONTH,d).getDay()===0)return;
function rm(arr){var i;while((i=arr.indexOf(d))>-1)arr.splice(i,1);}
rm(DAYS.full);rm(DAYS.near);rm(DAYS.closed);
if(target==='full')DAYS.full.push(d);
else if(target==='near')DAYS.near.push(d);
else if(target==='closed')DAYS.closed.push(d);
saveDays(DAYS);
renderCal();renderDayPanel();
}
$('#day-full').addEventListener('click',function(){setDayState('full');});
$('#day-near').addEventListener('click',function(){setDayState('near');});
$('#day-open').addEventListener('click',function(){setDayState('open');});
$('#day-close').addEventListener('click',function(){setDayState('closed');});

/* ================= Paramètres ================= */
function waDisplay(){
var cur=null;
try{cur=localStorage.getItem('ocd-wa');}catch(_){}
if(!cur)return '+49 176 584 43070';
return '+'+cur;
}
function renderSettings(){
$('#set-wa').value=waDisplay();
$('#set-saved').hidden=true;
}
function flashSaved(msg,isErr){
var el=$('#set-saved');
el.textContent=msg;
el.classList.toggle('err',!!isErr);
el.hidden=false;
setTimeout(function(){el.hidden=true;},2400);
}
$('#set-save').addEventListener('click',function(){
var raw=digits($('#set-wa').value);
if(!raw){try{localStorage.removeItem('ocd-wa');}catch(_){}$('#set-wa').value='+49 176 584 43070';flashSaved('Réinitialisé — numéro par défaut rétabli.');return;}
if(raw.length<8||raw.length>15){flashSaved('Numéro invalide : 8 à 15 chiffres.',true);return;}
try{localStorage.setItem('ocd-wa',raw);}catch(_){}
$('#set-wa').value='+'+raw;
flashSaved('Enregistré ! Appliqué sur ce navigateur.');
});
$('#set-reset').addEventListener('click',function(){
try{localStorage.removeItem('ocd-wa');}catch(_){}
$('#set-wa').value='+49 176 584 43070';
flashSaved('Réinitialisé — numéro par défaut rétabli.');
});
function armButton(btn,fn){
var on=false;
btn.addEventListener('click',function(){
if(on){on=false;btn.classList.remove('arm');btn.textContent=btn.getAttribute('data-label');fn();return;}
on=true;btn.classList.add('arm');btn.textContent='Confirmer ?';
setTimeout(function(){if(on){on=false;btn.classList.remove('arm');btn.textContent=btn.getAttribute('data-label');}},3200);
});
}
var bReset=$('#data-reset'),bClear=$('#data-clear');
bReset.setAttribute('data-label',bReset.textContent);
bClear.setAttribute('data-label',bClear.textContent);
armButton(bReset,function(){
saveList(SEED);
try{localStorage.setItem('ocd-seeded','1');}catch(_){}
render(curView);
});
armButton(bClear,function(){
saveList([]);
render(curView);
});

/* ================= Modal détail ================= */
var modal=$('#adm-modal');
function amRow(k,v){return '<div class="am-row"><span>'+k+'</span><b>'+v+'</b></div>';}
function openDetail(ref){
var list=loadList(),b=null,i;
for(i=0;i<list.length;i++)if(list[i].ref===ref){b=list[i];break;}
if(!b)return;
$('#adm-modal-body').innerHTML=
'<p class="am-ref">'+esc(b.ref)+newTag(b)+'</p>'
+'<h3 class="am-title">'+esc(b.name)+'</h3>'
+'<p class="am-sub">'+esc(b.product)+'</p>'
+'<div class="am-rows">'
+amRow('Téléphone',esc(b.phone)||'—')
+amRow('E-mail',esc(b.email)||'—')
+amRow('Mode',esc(b.modeLabel)||'—')
+amRow('Date',esc(cap(dateLabel(b.dateISO))))
+amRow('Créneau',esc(b.slot))
+amRow('Package',esc(b.pkgName)+(b.dur?' ('+esc(b.dur)+')':''))
+amRow('Paiement',esc(b.payLabel)||'—')
+amRow('Montant',fmt(b.amount))
+amRow('Statut',statusPill(b.status))
+amRow('Enregistrée le',b.created?new Date(b.created).toLocaleString('fr-FR'):'—')
+'</div>'
+(b.msg?'<p class="am-note">Message du client : « '+esc(b.msg)+' »</p>':'')
+'<div class="am-actions"><a class="btn btn-primary" href="'+waHref(b)+'" target="_blank" rel="noopener">'+I_WA+' Contacter sur WhatsApp</a></div>';
modal.classList.add('open');
modal.setAttribute('aria-hidden','false');
}
function closeModal(){
modal.classList.remove('open');
modal.setAttribute('aria-hidden','true');
}
$$('#adm-modal [data-close]').forEach(function(el){el.addEventListener('click',closeModal);});
document.addEventListener('keydown',function(e){if(e.key==='Escape')closeModal();});

/* ================= Synchronisation entre onglets ================= */
window.addEventListener('storage',function(e){
if(!e||e.key==='ocd-bookings'||e.key==='ocd-cal'){
DAYS=loadDays();
render(curView);
}
});

/* ================= Init ================= */
loadList(); /* amorce le jeu de démonstration */
updateBadge();
})();
