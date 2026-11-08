(function(){
'use strict';
var $=function(s){return document.querySelector(s)};
var $$=function(s){return Array.prototype.slice.call(document.querySelectorAll(s))};
var RM=window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/* ---------- Thème (partagé avec l'accueil) ---------- */
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

/* ---------- Données ---------- */
var MODES={
presentiel:{label:'Live en présentiel',sub:'À Lomé, Togo — face à la régie'},
distance:{label:'Live à distance',sub:"Depuis l'Afrique ou le monde, assistance à Lomé"}
};
var PACKAGES=[
{id:'live-express',name:'Live Express',dur:'1h30',price:'15 000 FCFA',items:['1h30 de live sur TikTok','Créneau au choix dans le calendrier','Fiche produit préparée pour la régie']},
{id:'live-plus',name:'Live Plus',dur:'1h30 + annonce',price:'20 000 FCFA',items:['1h30 de live sur TikTok','Annonce de votre live avant la diffusion','Mise en avant de votre compte']},
{id:'demi-journee',name:'Demi-journée',dur:'4h',price:'40 000 FCFA',items:['4h de live, créneaux enchaînés','Tarif dégressif par heure','Pause préparée avec la régie']},
{id:'journee',name:'Journée',dur:'8h',price:'70 000 FCFA',items:['8h de live sur la journée complète','Tarif dégressif par heure','Priorité sur les créneaux']},
{id:'promo-bovann',name:'Promo Bovann',dur:'Vidéo + live',price:'60 000 FCFA',items:['Bovann poste votre vidéo sur son compte','Annonce de votre live','Puis vous passez en direct']},
{id:'pass-mensuel',name:'Pass Mensuel',dur:'8 lives / mois',price:'100 000 FCFA',items:['Lives réguliers sur le mois','Dates au choix dans le calendrier','Accompagnement dédié']}
];
var SLOTS=[
{t:'08:00 – 09:30',s:'free',l:'Libre'},
{t:'09:30 – 11:00',s:'free',l:'Libre'},
{t:'11:00 – 12:30',s:'booked',l:'Réservé'},
{t:'12:30 – 14:00',s:'free',l:'Libre'},
{t:'14:00 – 15:30',s:'last',l:'Dernier créneau'},
{t:'15:30 – 17:00',s:'free',l:'Libre'},
{t:'17:00 – 18:30',s:'booked',l:'Réservé'},
{t:'18:30 – 20:00',s:'free',l:'Libre'}
];
var CAL={year:2026,month:11,full:[12,19,24],near:[5,26],closedDays:[25]};
/* Jours gérés depuis l'espace régie (admin.html) — priorité sur les valeurs par défaut */
try{
var ov=JSON.parse(localStorage.getItem('ocd-cal')||'null');
if(ov){
  if(Array.isArray(ov.full))CAL.full=ov.full;
  if(Array.isArray(ov.near))CAL.near=ov.near;
  if(Array.isArray(ov.closed))CAL.closedDays=ov.closed;
}
}catch(_){}
/* Numéro WhatsApp de la régie — modifiable depuis l'espace régie (admin.html) */
function waNumber(){
try{
var w=localStorage.getItem('ocd-wa');
if(w&&/^\d{8,15}$/.test(w))return w;
}catch(_){}
return '4917658443070';
}

var state={mode:null,date:null,slot:null,pkg:null,paid:false,ref:null};
var cur=1,TOTAL=6,sending=false,payMethod='momo';

var stepper=$('#stepper'),recapEl=$('#recap'),wizard=$('#wizard');
var btnPrev=$('#btn-prev'),btnNext=$('#btn-next'),wizNav=$('#wiz-nav');
var steps={};
$$('.rz-step').forEach(function(s){steps[s.getAttribute('data-step')]=s;});

/* ---------- Stepper ---------- */
function renderStepper(){
$$('.st').forEach(function(li){
  var n=+li.getAttribute('data-n');
  li.classList.toggle('cur',n===cur&&cur<=TOTAL);
  li.classList.toggle('done',n<cur||cur>TOTAL);
});
stepper.style.setProperty('--prog',(Math.min(cur-1,TOTAL-1)/(TOTAL-1)*100)+'%');
}
stepper.addEventListener('click',function(e){
var li=e.target.closest?e.target.closest('.st'):null;
if(!li||!li.classList.contains('done')||sending)return;
go(+li.getAttribute('data-n'));
});

/* ---------- Récap (chips) ---------- */
function cap(s){return s.charAt(0).toUpperCase()+s.slice(1);}
function dateLabel(d){return new Date(CAL.year,CAL.month,d).toLocaleDateString('fr-FR',{weekday:'long',day:'numeric',month:'long'});}
function chips(){
var out=[];
if(state.mode)out.push(MODES[state.mode].label);
if(state.date)out.push(cap(dateLabel(state.date)));
if(state.slot)out.push(state.slot);
if(state.pkg)out.push(state.pkg.name+' — '+state.pkg.price);
recapEl.innerHTML='';
out.forEach(function(t){
  var c=document.createElement('span');c.className='chip';
  var k=document.createElement('span');k.className='ck';
  c.appendChild(k);c.appendChild(document.createTextNode(t));
  recapEl.appendChild(c);
});
}

/* ---------- Navigation ---------- */
function lblFor(){return cur===TOTAL?(state.pkg?'Payer '+state.pkg.price:'Paiement'):'Continuer';}
function canContinue(){
if(sending)return false;
if(cur===1)return !!state.mode;
if(cur===2)return !!state.date;
if(cur===3)return !!state.slot;
if(cur===4)return !!state.pkg;
return true;
}
function renderNav(){
wizNav.hidden=cur>TOTAL;
btnPrev.hidden=(cur===1||cur>TOTAL);
btnNext.querySelector('.bt-lbl').textContent=lblFor();
btnNext.disabled=!canContinue();
}
function go(n,instant){
cur=n;
Object.keys(steps).forEach(function(k){steps[k].classList.toggle('on',+k===cur);});
renderStepper();chips();renderNav();
if(!instant){
  var y=stepper.getBoundingClientRect().top+window.scrollY-90;
  window.scrollTo({top:Math.max(0,y),behavior:RM?'auto':'smooth'});
}
}
btnNext.addEventListener('click',function(){
if(sending||btnNext.disabled)return;
if(cur===5&&!validateInfo())return;
if(cur===6&&!validatePay())return;
var paying=(cur===TOTAL);
sending=true;
btnNext.classList.add('sending');
btnNext.disabled=true;
btnNext.querySelector('.bt-lbl').textContent=paying?'Paiement en cours…':'Envoi en cours…';
setTimeout(function(){
  sending=false;
  btnNext.classList.remove('sending');
  if(paying){
    state.paid=true;state.ref=genRef();
    saveBooking();
    fillFinal();go(7);
  }else go(cur+1);
},paying?2100:600);
});
btnPrev.addEventListener('click',function(){if(cur>1&&!sending)go(cur-1);});

/* ---------- Étape 1 : mode ---------- */
$$('#mode-cards .mode-card').forEach(function(c){
c.addEventListener('click',function(){
  $$('#mode-cards .mode-card').forEach(function(x){x.classList.remove('sel');});
  c.classList.add('sel');
  state.mode=c.getAttribute('data-mode');
  renderNav();chips();
});
});

/* ---------- Étape 2 : calendrier ---------- */
function buildCal(){
var grid=$('#cal-grid');grid.innerHTML='';
['L','M','M','J','V','S','D'].forEach(function(d){
  var s=document.createElement('span');s.className='cal-dow';s.textContent=d;grid.appendChild(s);
});
var lead=(new Date(CAL.year,CAL.month,1).getDay()+6)%7;
var days=new Date(CAL.year,CAL.month+1,0).getDate();
var i,d;
for(i=0;i<lead;i++)grid.appendChild(document.createElement('span'));
for(d=1;d<=days;d++){
  var dow=new Date(CAL.year,CAL.month,d).getDay();
  var b=document.createElement('button');b.type='button';b.textContent=d;
  if(dow===0||CAL.closedDays.indexOf(d)>-1){b.className='cal-cell closed';b.disabled=true;b.title='Fermé';}
  else if(CAL.full.indexOf(d)>-1){b.className='cal-cell full';b.disabled=true;b.title='Complet';}
  else if(CAL.near.indexOf(d)>-1){b.className='cal-cell near';b.title='Presque complet';}
  else{b.className='cal-cell av';}
  if(d===1){b.classList.add('launch');if(!b.disabled)b.title='Lancement';}
  (function(btn,day){btn.addEventListener('click',function(){selectDay(btn,day);});})(b,d);
  grid.appendChild(b);
}
}
function selectDay(btn,d){
state.date=d;state.slot=null;
$$('#cal-grid .cal-cell.sel').forEach(function(c){c.classList.remove('sel');});
btn.classList.add('sel');
$('#slot-day').textContent='Créneaux du '+dateLabel(d)+' — heure de Lomé (GMT+0), convertie automatiquement dans votre fuseau.';
buildSlots();
renderNav();chips();
}

/* ---------- Étape 3 : créneaux ---------- */
function buildSlots(){
var el=$('#slots');el.innerHTML='';
SLOTS.forEach(function(sl){
  var b=document.createElement('button');b.type='button';b.className='slot '+sl.s;
  b.innerHTML=sl.t+'<small>'+sl.l+'</small>';
  if(sl.s==='booked'){b.disabled=true;}
  else{
    b.addEventListener('click',function(){
      $$('#slots .slot.sel').forEach(function(x){x.classList.remove('sel');});
      b.classList.add('sel');state.slot=sl.t;
      renderNav();chips();
    });
  }
  el.appendChild(b);
});
}

/* ---------- Étape 4 : packages ---------- */
function buildPk(){
var grid=$('#pk-grid');grid.innerHTML='';
PACKAGES.forEach(function(p){
  var b=document.createElement('button');b.type='button';b.className='pk';b.setAttribute('data-pk',p.id);
  b.innerHTML='<div class="pk-top"><strong>'+p.name+'</strong><span class="pk-dur">'+p.dur+'</span></div>'
    +'<div class="pk-price">'+p.price.replace(' FCFA','')+' <small>FCFA</small></div>'
    +'<ul>'+p.items.map(function(i){return '<li>'+i+'</li>';}).join('')+'</ul>';
  b.addEventListener('click',function(){
    $$('#pk-grid .pk.sel').forEach(function(x){x.classList.remove('sel');});
    b.classList.add('sel');state.pkg=p;
    renderNav();chips();renderSummary();
  });
  grid.appendChild(b);
});
}

/* ---------- Étape 5 : validation des champs ---------- */
function ferr(input,on,msg){
var f=input.closest('.field');
if(!f)return;
f.classList.toggle('err',!!on);
if(on&&msg){var p=f.querySelector('.ferr');if(p)p.textContent=msg;}
}
function validateInfo(){
var ok=true;
var name=$('#f-name'),phone=$('#f-phone'),email=$('#f-email'),prod=$('#f-product');
if(name.value.trim().length<2){ferr(name,true,'Indiquez votre nom (2 caractères minimum).');ok=false;}else ferr(name,false);
if(!/^\+?\d{8,15}$/.test(phone.value.replace(/[^\d+]/g,''))){ferr(phone,true,'Numéro invalide — ex. +228 90 12 34 56.');ok=false;}else ferr(phone,false);
if(email.value.trim()&&!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email.value.trim())){ferr(email,true,'Adresse e-mail invalide.');ok=false;}else ferr(email,false);
if(prod.value.trim().length<2){ferr(prod,true,'Indiquez le produit ou la marque à présenter.');ok=false;}else ferr(prod,false);
if(!ok){var first=$('.field.err input,.field.err textarea');if(first)first.focus();}
return ok;
}

/* ---------- Étape 6 : paiement ---------- */
$$('.pm').forEach(function(p){
p.addEventListener('click',function(){
  $$('.pm').forEach(function(x){x.classList.remove('sel');});
  p.classList.add('sel');
  payMethod=p.getAttribute('data-pm');
  $('#panel-momo').classList.toggle('on',payMethod==='momo');
  $('#panel-card').classList.toggle('on',payMethod==='card');
  $$('.pm-panel .field.err').forEach(function(f){f.classList.remove('err');});
});
});
$$('#momo-ops .pill').forEach(function(p){
p.addEventListener('click',function(){
  $$('#momo-ops .pill').forEach(function(x){x.classList.remove('sel');});
  p.classList.add('sel');
});
});
var fCard=$('#f-card'),fExp=$('#f-exp'),fCvc=$('#f-cvc');
fCard.addEventListener('input',function(){
var v=this.value.replace(/\D/g,'').slice(0,16);
this.value=v.replace(/(\d{4})(?=\d)/g,'$1 ');
});
fExp.addEventListener('input',function(){
var v=this.value.replace(/\D/g,'').slice(0,4);
this.value=v.length>2?v.slice(0,2)+'/'+v.slice(2):v;
});
fCvc.addEventListener('input',function(){this.value=this.value.replace(/\D/g,'').slice(0,3);});
function validatePay(){
var ok=true;
if(payMethod==='momo'){
  var m=$('#f-momo');
  if(!/^\+?\d{8,15}$/.test(m.value.replace(/[^\d+]/g,''))){ferr(m,true,'Numéro Mobile Money requis (ex. +228 90 12 34 56).');ok=false;}else ferr(m,false);
}else{
  var c=$('#f-card'),e=$('#f-exp'),v=$('#f-cvc'),n=$('#f-cname');
  if(c.value.replace(/\D/g,'').length!==16){ferr(c,true,'Numéro de carte invalide (16 chiffres).');ok=false;}else ferr(c,false);
  var em=e.value.match(/^(\d{2})\/(\d{2})$/);
  if(!em||+em[1]<1||+em[1]>12||+em[2]<26){ferr(e,true,'Expiration invalide (MM/AA, année ≥ 26).');ok=false;}else ferr(e,false);
  if(v.value.length!==3){ferr(v,true,'CVC invalide (3 chiffres).');ok=false;}else ferr(v,false);
  if(n.value.trim().length<2){ferr(n,true,'Nom sur la carte requis.');ok=false;}else ferr(n,false);
}
if(!ok){var first=$('.field.err input');if(first)first.focus();}
return ok;
}
function renderSummary(){
var rows=[
  ['Mode',state.mode?MODES[state.mode].label:'—'],
  ['Date',state.date?cap(dateLabel(state.date)):'—'],
  ['Créneau',state.slot||'—'],
  ['Package',state.pkg?state.pkg.name:'—'],
  ['Durée',state.pkg?state.pkg.dur:'—']
];
$('#sum-rows').innerHTML=rows.map(function(r){return '<div class="sum-row"><span>'+r[0]+'</span><b>'+r[1]+'</b></div>';}).join('');
$('#sum-total').textContent=state.pkg?state.pkg.price:'—';
}

/* ---------- Confirmation ---------- */
function genRef(){
var chars='ABCDEFGHJKLMNPQRSTUVWXYZ23456789',s='';
for(var i=0;i<6;i++)s+=chars.charAt(Math.floor(Math.random()*chars.length));
return 'OCD-'+s;
}
/* Enregistre la réservation pour l'espace régie (admin.html) */
function saveBooking(){
try{
  var list=JSON.parse(localStorage.getItem('ocd-bookings')||'[]');
  if(!Array.isArray(list))list=[];
  var op=$('#momo-ops .pill.sel');
  var two=function(n){return (n<10?'0':'')+n;};
  list.push({
    ref:state.ref,
    created:new Date().toISOString(),
    name:$('#f-name').value.trim(),
    phone:$('#f-phone').value.trim(),
    email:$('#f-email').value.trim(),
    product:$('#f-product').value.trim(),
    msg:$('#f-msg').value.trim(),
    mode:state.mode,modeLabel:MODES[state.mode].label,
    date:state.date,
    dateISO:CAL.year+'-'+two(CAL.month+1)+'-'+two(state.date),
    slot:state.slot,
    pkg:state.pkg.id,pkgName:state.pkg.name,dur:state.pkg.dur,
    price:state.pkg.price,amount:parseInt(state.pkg.price.replace(/[^\d]/g,''),10),
    payMethod:payMethod,
    payLabel:payMethod==='momo'?'Mobile Money — '+(op?op.textContent:''):'Carte bancaire',
    status:'confirmee',demo:false
  });
  localStorage.setItem('ocd-bookings',JSON.stringify(list));
}catch(_){}
}
function fillFinal(){
$('#final-ref').textContent=state.ref;
var op=$('#momo-ops .pill.sel');
var rows=[
  ['Client',$('#f-name').value.trim()],
  ['Produit',$('#f-product').value.trim()],
  ['Mode',MODES[state.mode].label],
  ['Date',cap(dateLabel(state.date))],
  ['Créneau',state.slot],
  ['Package',state.pkg.name+' ('+state.pkg.dur+')'],
  ['Paiement',payMethod==='momo'?'Mobile Money — '+(op?op.textContent:''):'Carte bancaire'],
  ['Montant',state.pkg.price]
];
$('#final-sum').innerHTML=rows.map(function(r){return '<div class="sum-row"><span>'+r[0]+'</span><b>'+r[1]+'</b></div>';}).join('');
var msg='Bonjour OCD Live ! Je viens de réserver mon créneau (réf. '+state.ref+') : '+state.pkg.name+' le '+dateLabel(state.date)+', '+state.slot+' ('+MODES[state.mode].label+').';
$('#final-wa').href='https://wa.me/'+waNumber()+'?text='+encodeURIComponent(msg);
}

/* ---------- Initialisation + pré-sélection via l'URL ---------- */
buildCal();buildSlots();buildPk();renderSummary();
var startAt=1;
try{
var q=new URLSearchParams(location.search);
var m=q.get('mode');
if(m==='presentiel'||m==='distance'){
  var card=$('.mode-card[data-mode="'+m+'"]');
  if(card)card.click();
  startAt=2;
}
var p=q.get('package');
if(p){
  var btn=$('#pk-grid .pk[data-pk="'+p+'"]');
  if(btn)btn.click();
}
}catch(_){}
go(startAt,true);
})();
