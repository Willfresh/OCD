(function(){
'use strict';
var $=function(s){return document.querySelector(s)};
var $$=function(s){return Array.prototype.slice.call(document.querySelectorAll(s))};
var clamp=function(v,a,b){return Math.max(a,Math.min(b,v))};
var RM=window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/* ---------- Intro motion design ---------- */
var intro=$('#intro');
if(RM){
if(intro)intro.parentNode.removeChild(intro);
document.body.classList.add('ready');
}else if(intro){
var introDone=false;
var killIntro=function(){
  if(introDone)return;introDone=true;
  intro.classList.add('done');
  document.body.classList.add('ready');
  setTimeout(function(){if(intro.parentNode)intro.parentNode.removeChild(intro);},800);
};
setTimeout(killIntro,1650);
intro.addEventListener('click',killIntro);
}

/* ---------- Header ---------- */
var header=$('#site-header');
var onScrollHdr=function(){header.classList.toggle('scrolled',window.scrollY>30);};
window.addEventListener('scroll',onScrollHdr,{passive:true});onScrollHdr();

/* ---------- Thème clair (défaut) / sombre ---------- */
var themeBtn=$('#theme-toggle');
var themeMeta=document.querySelector('meta[name="theme-color"]');
function currentTheme(){return document.documentElement.getAttribute('data-theme')==='dark'?'dark':'light';}
function syncThemeChrome(){
if(themeMeta)themeMeta.setAttribute('content',currentTheme()==='dark'?'#0A0908':'#FFF9F1');
if(themeBtn)themeBtn.setAttribute('aria-label',currentTheme()==='dark'?'Activer le thème clair':'Activer le thème sombre');
}
syncThemeChrome();
if(themeBtn){
themeBtn.addEventListener('click',function(){
  var next=currentTheme()==='dark'?'light':'dark';
  document.documentElement.setAttribute('data-theme',next);
  try{localStorage.setItem('ocd-theme',next);}catch(_){}
  syncThemeChrome();
  document.dispatchEvent(new CustomEvent('ocd-theme'));
});
}

/* ---------- WhatsApp : numéro géré depuis l'espace régie (admin.html) ---------- */
try{
var waOv=localStorage.getItem('ocd-wa');
if(waOv&&/^\d{8,15}$/.test(waOv)){
  $$('a[href^="https://wa.me/"]').forEach(function(a){a.setAttribute('href','https://wa.me/'+waOv);});
}
}catch(_){}

/* ---------- Révélations au scroll ---------- */
var io=('IntersectionObserver' in window)?new IntersectionObserver(function(es){
es.forEach(function(e){if(e.isIntersecting){e.target.classList.add('in');io.unobserve(e.target);}});
},{threshold:.12,rootMargin:'0px 0px -36px'}):null;
$$('.reveal').forEach(function(el){
if(io)io.observe(el);else el.classList.add('in');
});

/* ---------- Parallaxe hero ---------- */
var heroInner=$('.hero-inner');
if(heroInner&&!RM){
var ticking=false;
window.addEventListener('scroll',function(){
  if(ticking)return;ticking=true;
  requestAnimationFrame(function(){
    var y=window.scrollY,h=window.innerHeight;
    if(y<h*1.2){
      heroInner.style.transform='translateY('+(y*0.13).toFixed(1)+'px)';
      heroInner.style.opacity=String(Math.max(0,1-y/(h*0.85)));
    }
    ticking=false;
  });
},{passive:true});
}

/* ================= GLOBE 3D — l'Afrique qui se bat ================= */
var canvas=$('#hero-canvas');
if(canvas&&canvas.getContext){
var ctx=canvas.getContext('2d');
var hero=canvas.parentElement;
var W=0,H=0,DPR=1,CX=0,CY=0,R=0;

function resize(){
  DPR=clamp(window.devicePixelRatio||1,1,window.innerWidth<700?1.5:2);
  var r=hero.getBoundingClientRect();
  W=r.width;H=r.height;
  canvas.width=Math.round(W*DPR);canvas.height=Math.round(H*DPR);
  ctx.setTransform(DPR,0,0,DPR,0,0);
  var desk=W>=900;
  CX=desk?W*0.71:W*0.5;
  CY=desk?H*0.5:H*0.35;
  R=desk?Math.min(W*0.26,H*0.36):Math.min(W*0.42,H*0.27);
}

/* Contour simplifié de l'Afrique et de Madagascar (longitude, latitude) */
var AFRICA=[[9.6,37.3],[11,33.2],[15.2,32.4],[20.1,32.9],[25,31.6],[29,31],[34.2,31.2],[34.5,28],[35.8,23.9],[37.2,21.1],[38.5,18],[39.8,14.9],[43.2,11.5],[44.3,10.4],[48,11.2],[51.2,11.8],[51.1,10.4],[45.5,2.5],[41.6,-1.7],[40.1,-3],[39.5,-7],[39.2,-11.5],[36.5,-17.8],[35.4,-23.9],[32.6,-28.6],[28.5,-32.5],[25,-34],[20,-34.8],[18.4,-34.2],[17.9,-32.7],[16.5,-28.6],[14.5,-22.9],[11.8,-18],[13,-12.5],[12.2,-6.1],[9.3,-1.9],[8.7,0.5],[9.3,3.9],[8.5,4.6],[5.9,4.3],[3.4,6.3],[1.8,6.1],[-2,5],[-5,5.2],[-8,4.4],[-13.2,9.5],[-16.8,12.4],[-17.5,14.7],[-16.5,19.6],[-14.5,22.5],[-13,26],[-9.7,31.4],[-6.8,34.1],[-5.9,35.8]];
var MADA=[[44.5,-25.2],[47.2,-25],[50.2,-16],[49.4,-12.3],[46.9,-15.3],[44,-21.5]];
function inPoly(lon,lat,poly){
  var ins=false,i,j,xi,yi,xj,yj;
  for(i=0,j=poly.length-1;i<poly.length;j=i++){
    xi=poly[i][0];yi=poly[i][1];xj=poly[j][0];yj=poly[j][1];
    if(((yi>lat)!==(yj>lat))&&(lon<(xj-xi)*(lat-yi)/(yj-yi)+xi))ins=!ins;
  }
  return ins;
}

/* Points sur la sphère (spirale de Fibonacci) */
var N=window.innerWidth<700?850:1500;
var pts=[];
var GA=Math.PI*(3-Math.sqrt(5));
for(var i=0;i<N;i++){
  var y=1-(i/(N-1))*2;
  var rr=Math.sqrt(Math.max(0,1-y*y));
  var th=GA*i;
  var x=Math.cos(th)*rr,z=Math.sin(th)*rr;
  var lat=Math.asin(y)*180/Math.PI;
  var lon=Math.atan2(z,x)*180/Math.PI;
  pts.push({x:x,y:y,z:z,a:(inPoly(lon,lat,AFRICA)||inPoly(lon,lat,MADA))?1:0,tw:Math.random()*6.283,lat:lat});
}

function ll2v(lat,lon){
  var la=lat*Math.PI/180,lo=lon*Math.PI/180;
  return{x:Math.cos(la)*Math.cos(lo),y:Math.sin(la),z:Math.cos(la)*Math.sin(lo)};
}
var LOME=ll2v(6.17,1.22); /* Lomé, Togo */
var DESTS=[[48.85,2.35],[40.71,-74],[25.2,55.27],[-26.2,28.05],[-23.55,-46.63],[51.5,-0.12]].map(function(d){return ll2v(d[0],d[1])});
function slerp(a,b,t){
  var dot=clamp(a.x*b.x+a.y*b.y+a.z*b.z,-1,1);
  var om=Math.acos(dot),so=Math.sin(om);
  if(so<1e-6)return{x:a.x,y:a.y,z:a.z};
  var k1=Math.sin((1-t)*om)/so,k2=Math.sin(t*om)/so;
  return{x:a.x*k1+b.x*k2,y:a.y*k1+b.y*k2,z:a.z*k1+b.z*k2};
}
/* Arcs de diffusion : Lomé vers le monde */
var ARCS=DESTS.map(function(d,i){
  var segs=[],j;
  for(j=0;j<=34;j++){
    var t=j/34,p=slerp(LOME,d,t),lift=1+0.22*Math.sin(Math.PI*t);
    segs.push({x:p.x*lift,y:p.y*lift,z:p.z*lift});
  }
  return{segs:segs,t0:i*0.55,speed:0.13+((i*37)%10)/220};
});

/* Sprites lumineux pré-rendus (perf) — palette adaptée au thème */
function sprite(stops,size){
  var c=document.createElement('canvas');c.width=c.height=size;
  var g=c.getContext('2d');
  var gr=g.createRadialGradient(size/2,size/2,0,size/2,size/2,size/2);
  stops.forEach(function(s){gr.addColorStop(s[0],s[1])});
  g.fillStyle=gr;g.fillRect(0,0,size,size);
  return c;
}
var PALETTES={
  light:{
    dim:[[0,'rgba(148,98,54,.55)'],[0.4,'rgba(148,98,54,.2)'],[1,'rgba(148,98,54,0)']],
    hot:[[0,'rgba(255,205,150,1)'],[0.28,'rgba(235,85,5,.95)'],[0.62,'rgba(210,70,2,.34)'],[1,'rgba(210,70,2,0)']],
    arc:'220,72,2',ring:'214,72,0',mark:'185,72,4',emLo:.07,emHi:.22
  },
  dark:{
    dim:[[0,'rgba(255,175,120,.9)'],[0.4,'rgba(190,125,75,.32)'],[1,'rgba(120,80,50,0)']],
    hot:[[0,'rgba(255,218,170,1)'],[0.28,'rgba(252,120,30,.9)'],[0.62,'rgba(250,80,5,.32)'],[1,'rgba(250,80,5,0)']],
    arc:'252,100,25',ring:'250,73,0',mark:'253,150,60',emLo:.16,emHi:.46
  }
};
var CUR=PALETTES.dark,spDim,spHot;
function applyPalette(){
  CUR=(document.documentElement.getAttribute('data-theme')==='dark')?PALETTES.dark:PALETTES.light;
  spDim=sprite(CUR.dim,32);
  spHot=sprite(CUR.hot,64);
}
applyPalette();
document.addEventListener('ocd-theme',function(){applyPalette();needRedraw=true;});

/* État */
var rotY=-1.27,rotX=0.30,vy=0,vx=0,dragging=false,px=0,py=0,lastMoveT=0;
var AUTO=RM?0:0.075;
var elapsed=0,lastT=0,visible=true,needRedraw=true;
var rings=[],ringT=1.2,embers=[];

function initEmbers(){
  var n=(RM||W<700)?16:34;
  embers=[];
  for(var k=0;k<n;k++)embers.push({x:Math.random()*W,y:Math.random()*H,s:.7+Math.random()*1.7,v:9+Math.random()*26,sw:Math.random()*6.28,ph:Math.random()*6.28});
}

function project(p){
  var cy=Math.cos(rotY),sy=Math.sin(rotY);
  var x=p.x*cy+p.z*sy;
  var z1=-p.x*sy+p.z*cy;
  var cx=Math.cos(rotX),sx=Math.sin(rotX);
  var y=p.y*cx-z1*sx;
  var z=p.y*sx+z1*cx;
  var k=3/(3-z);
  return{sx:CX+x*R*k,sy:CY-y*R*k,z:z,k:k};
}

function draw(){
  ctx.clearRect(0,0,W,H);
  var i,j,p,q,a,b,depth,s,al;

  /* Ondes de diffusion */
  for(i=0;i<rings.length;i++){
    var rg=rings[i];
    var e=1-Math.pow(1-Math.min(rg.t,1),2);
    ctx.strokeStyle='rgba('+CUR.ring+','+(0.30*Math.pow(1-Math.min(rg.t,1),1.7)).toFixed(3)+')';
    ctx.lineWidth=1.4;
    ctx.beginPath();ctx.arc(CX,CY,R*(0.5+1.85*e),0,6.2832);ctx.stroke();
  }

  /* Particules du globe (hors Afrique) */
  for(i=0;i<pts.length;i++){
    p=pts[i];if(p.a)continue;
    q=project(p);
    depth=(q.z+1)/2;
    s=(1.5+1.4*depth)*q.k;
    ctx.globalAlpha=(0.10+0.55*depth*depth)*(0.72+0.28*Math.sin(elapsed*1.6+p.tw));
    ctx.drawImage(spDim,q.sx-s,q.sy-s,s*2,s*2);
  }

  ctx.globalCompositeOperation='lighter';

  /* Arcs Lomé → monde */
  for(i=0;i<ARCS.length;i++){
    var arc=ARCS[i];
    var tt=(elapsed*arc.speed+arc.t0)%1;
    var idx=tt*(arc.segs.length-1);
    ctx.lineWidth=1.1;
    for(j=0;j<arc.segs.length-1;j++){
      a=project(arc.segs[j]);b=project(arc.segs[j+1]);
      if(a.z<-0.9&&b.z<-0.9)continue;
      depth=((a.z+b.z)/2+1)/2;
      var df=Math.exp(-Math.pow((j-idx)/4,2));
      al=(0.05+0.45*df)*(0.2+0.8*depth);
      if(al<0.02)continue;
      ctx.strokeStyle='rgba('+CUR.arc+','+al.toFixed(3)+')';
      ctx.beginPath();ctx.moveTo(a.sx,a.sy);ctx.lineTo(b.sx,b.sy);ctx.stroke();
    }
    var hq=project(arc.segs[Math.round(idx)]);
    if(hq.z>-0.5){
      s=5.5*hq.k;
      ctx.globalAlpha=0.85;
      ctx.drawImage(spHot,hq.sx-s,hq.sy-s,s*2,s*2);
    }
  }

  /* Afrique : vague d'énergie montante (le continent qui se bat) */
  var wave=(elapsed*0.42)%1;
  for(i=0;i<pts.length;i++){
    p=pts[i];if(!p.a)continue;
    q=project(p);
    depth=(q.z+1)/2;
    var ph=(p.lat+35)/72;
    var dph=wave-ph;
    var pulse=Math.exp(-(dph*dph)/0.016);
    s=(1.3+2.1*depth+2.3*pulse)*q.k;
    ctx.globalAlpha=Math.min(1,(0.22+0.78*Math.pow(depth,1.5))*(0.6+0.4*pulse));
    ctx.drawImage(spHot,q.sx-s,q.sy-s,s*2,s*2);
  }

  /* Marqueur Lomé */
  var lq=project(LOME);
  if(lq.z>-0.15){
    s=(4.5+1.6*Math.sin(elapsed*3.6))*lq.k;
    ctx.globalAlpha=0.95;
    ctx.drawImage(spHot,lq.sx-s,lq.sy-s,s*2,s*2);
    ctx.strokeStyle='rgba('+CUR.mark+',.85)';
    ctx.lineWidth=1.3;
    ctx.beginPath();ctx.arc(lq.sx,lq.sy,(9+2.5*Math.sin(elapsed*3.6))*lq.k,0,6.2832);ctx.stroke();
  }

  /* Braises flottantes */
  for(i=0;i<embers.length;i++){
    var em=embers[i];
    ctx.globalAlpha=CUR.emLo+(CUR.emHi-CUR.emLo)*(0.5+0.5*Math.sin(elapsed*2.2+em.ph));
    s=em.s*2.6;
    ctx.drawImage(spHot,em.x-s,em.y-s,s*2,s*2);
  }

  ctx.globalCompositeOperation='source-over';
  ctx.globalAlpha=1;
}

function frame(t){
  requestAnimationFrame(frame);
  if(!lastT)lastT=t;
  var dt=(t-lastT)/1000;lastT=t;
  if(dt>0.05)dt=0.05;
  if(!visible||document.hidden)return;

  if(RM){
    if(needRedraw){draw();needRedraw=false;}
    return;
  }
  elapsed+=dt;
  if(!dragging){
    rotY+=(AUTO+vy)*dt;
    rotX+=vx*dt;
    vy*=Math.exp(-2.4*dt);
    vx*=Math.exp(-2.4*dt);
  }
  rotX=clamp(rotX,-1.15,1.15);

  ringT-=dt;
  if(ringT<=0){rings.push({t:0});ringT=2.5;}
  for(var i=rings.length-1;i>=0;i--){
    rings[i].t+=dt/3.1;
    if(rings[i].t>=1)rings.splice(i,1);
  }
  for(i=0;i<embers.length;i++){
    var em=embers[i];
    em.y-=em.v*dt;
    em.x+=Math.sin(elapsed*0.7+em.sw)*10*dt;
    if(em.y<-14){em.y=H+14;em.x=Math.random()*W;}
    if(em.x<-14)em.x=W+10;
    if(em.x>W+14)em.x=-10;
  }
  draw();
}

/* Rotation interactive (souris + tactile) */
canvas.addEventListener('pointerdown',function(e){
  dragging=true;px=e.clientX;py=e.clientY;lastMoveT=performance.now();vy=0;vx=0;
  canvas.classList.add('grabbing');
  try{canvas.setPointerCapture(e.pointerId);}catch(_){}
});
canvas.addEventListener('pointermove',function(e){
  if(!dragging)return;
  var dx=e.clientX-px,dy=e.clientY-py;
  px=e.clientX;py=e.clientY;
  var now=performance.now();
  var mdt=Math.max((now-lastMoveT)/1000,0.008);lastMoveT=now;
  rotY+=dx*0.0048;
  rotX+=dy*0.0034;
  vy=clamp(vy*0.55+(dx*0.0048/mdt)*0.45,-6,6);
  vx=clamp(vx*0.55+(dy*0.0034/mdt)*0.45,-4,4);
  needRedraw=true;
});
var endDrag=function(){dragging=false;canvas.classList.remove('grabbing');};
canvas.addEventListener('pointerup',endDrag);
canvas.addEventListener('pointercancel',endDrag);

if('IntersectionObserver' in window){
  new IntersectionObserver(function(es){visible=es[0].isIntersecting;},{threshold:0}).observe(canvas);
}
window.addEventListener('resize',function(){resize();initEmbers();needRedraw=true;});
resize();initEmbers();
requestAnimationFrame(frame);
}

})();
