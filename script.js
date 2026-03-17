// ─── CUSTOM CURSOR ───────────────────────────────────────
const cursor = document.getElementById('cursor');
const ring = document.getElementById('cursor-ring');
let mx=0,my=0,rx=0,ry=0;
document.addEventListener('mousemove',e=>{
  mx=e.clientX; my=e.clientY;
  cursor.style.left=mx+'px'; cursor.style.top=my+'px';
});
function animRing(){
  rx+=(mx-rx)*0.12; ry+=(my-ry)*0.12;
  ring.style.left=rx+'px'; ring.style.top=ry+'px';
  requestAnimationFrame(animRing);
}
animRing();
document.querySelectorAll('a,button,.project-card').forEach(el=>{
  el.addEventListener('mouseenter',()=>{cursor.style.transform='translate(-50%,-50%) scale(2.5)';ring.style.transform='translate(-50%,-50%) scale(1.5)';ring.style.opacity='0.3';});
  el.addEventListener('mouseleave',()=>{cursor.style.transform='translate(-50%,-50%) scale(1)';ring.style.transform='translate(-50%,-50%) scale(1)';ring.style.opacity='1';});
});

// ─── ANTIGRAVITY BACKGROUND CANVAS ───────────────────────
const bgCanvas = document.getElementById('antigravity-canvas');
const bgCtx = bgCanvas.getContext('2d');
let bgW, bgH;
function resizeBg(){bgW=bgCanvas.width=window.innerWidth;bgH=bgCanvas.height=window.innerHeight;}
resizeBg();
window.addEventListener('resize',resizeBg);

const NUM_PARTICLES = 120;
const REPEL_RADIUS = 160;
const REPEL_STRENGTH = 6;

class BGParticle {
  constructor(){this.reset(true);}
  reset(init=false){
    this.x=Math.random()*bgW;
    this.y=Math.random()*bgH;
    this.ox=this.x; this.oy=this.y;
    this.vx=0; this.vy=0;
    this.size=Math.random()*1.8+0.3;
    this.alpha=Math.random()*0.35+0.05;
    this.speed=Math.random()*0.3+0.1;
    this.angle=Math.random()*Math.PI*2;
  }
  update(mouseX,mouseY){
    // Drift
    this.angle+=0.003;
    this.ox+=Math.cos(this.angle)*this.speed*0.15;
    this.oy+=Math.sin(this.angle)*this.speed*0.15;
    if(this.ox<0)this.ox=bgW; if(this.ox>bgW)this.ox=0;
    if(this.oy<0)this.oy=bgH; if(this.oy>bgH)this.oy=0;

    // Antigravity repulsion
    const dx=this.x-mouseX, dy=this.y-mouseY;
    const dist=Math.sqrt(dx*dx+dy*dy);
    if(dist<REPEL_RADIUS&&dist>0){
      const force=(REPEL_RADIUS-dist)/REPEL_RADIUS;
      this.vx+=((dx/dist)*force*REPEL_STRENGTH);
      this.vy+=((dy/dist)*force*REPEL_STRENGTH);
    }
    // Return to origin
    this.vx+=(this.ox-this.x)*0.04;
    this.vy+=(this.oy-this.y)*0.04;
    // Damping
    this.vx*=0.82; this.vy*=0.82;
    this.x+=this.vx; this.y+=this.vy;
  }
  draw(ctx){
    ctx.beginPath();
    ctx.arc(this.x,this.y,this.size,0,Math.PI*2);
    ctx.fillStyle=`rgba(126,184,154,${this.alpha})`;
    ctx.fill();
  }
}

const bgParticles = Array.from({length:NUM_PARTICLES},()=>new BGParticle());
let bgMouseX=bgW/2, bgMouseY=bgH/2;
document.addEventListener('mousemove',e=>{bgMouseX=e.clientX;bgMouseY=e.clientY;});

function animBg(){
  bgCtx.clearRect(0,0,bgW,bgH);
  // Draw connections
  for(let i=0;i<bgParticles.length;i++){
    for(let j=i+1;j<bgParticles.length;j++){
      const p1=bgParticles[i],p2=bgParticles[j];
      const dx=p1.x-p2.x,dy=p1.y-p2.y;
      const d=Math.sqrt(dx*dx+dy*dy);
      if(d<90){
        bgCtx.beginPath();
        bgCtx.moveTo(p1.x,p1.y);
        bgCtx.lineTo(p2.x,p2.y);
        bgCtx.strokeStyle=`rgba(126,184,154,${0.06*(1-d/90)})`;
        bgCtx.lineWidth=0.5;
        bgCtx.stroke();
      }
    }
  }
  bgParticles.forEach(p=>{p.update(bgMouseX,bgMouseY);p.draw(bgCtx);});
  requestAnimationFrame(animBg);
}
animBg();

// ─── STACK CANVAS (antigravity word cloud) ────────────────
const sc = document.getElementById('stack-canvas');
const sctx = sc.getContext('2d');
const stackSection = document.getElementById('stack');

function resizeSC(){
  const rect=sc.parentElement.getBoundingClientRect();
  sc.width=rect.width; sc.height=rect.height;
}
resizeSC();
window.addEventListener('resize',resizeSC);

const stackItems = [
  {label:'Python',size:22,color:'#7eb89a'},
  {label:'JavaScript',size:20,color:'#a0c4b0'},
  {label:'React',size:22,color:'#7eb89a'},
  {label:'Next.js',size:20,color:'#a0c4b0'},
  {label:'FastAPI',size:18,color:'#6aab8a'},
  {label:'PostgreSQL',size:17,color:'#8ab8a0'},
  {label:'MySQL',size:16,color:'#7a9a8a'},
  {label:'Docker',size:16,color:'#6a9a7a'},
  {label:'GitHub',size:15,color:'#8aa090'},
  {label:'Vercel',size:15,color:'#7a9080'},
  {label:'Render',size:14,color:'#6a8070'},
  {label:'Hugging Face',size:16,color:'#8aaa94'},
  {label:'Google Colab',size:14,color:'#7a9884'},
];

class WordParticle {
  constructor(item, i, total){
    this.label = item.label;
    this.fontSize = item.size;
    this.color = item.color;
    this.vx=0; this.vy=0;
    this.place(i, total);
  }
  place(i, total){
    const cols = 4;
    const col = i % cols;
    const row = Math.floor(i / cols);
    const cw = sc.width/cols;
    const ch = sc.height / Math.ceil(total/cols);
    this.ox = cw*col + cw/2 + (Math.random()-0.5)*30;
    this.oy = ch*row + ch/2 + (Math.random()-0.5)*20 + 20;
    this.x = this.ox; this.y = this.oy;
  }
  update(mx, my){
    const rect = sc.getBoundingClientRect();
    const lx = mx - rect.left, ly = my - rect.top;
    const dx=this.x-lx, dy=this.y-ly;
    const dist=Math.sqrt(dx*dx+dy*dy);
    if(dist<100&&dist>0){
      const f=(100-dist)/100;
      this.vx+=(dx/dist)*f*9;
      this.vy+=(dy/dist)*f*9;
    }
    this.vx+=(this.ox-this.x)*0.06;
    this.vy+=(this.oy-this.y)*0.06;
    this.vx*=0.78; this.vy*=0.78;
    this.x+=this.vx; this.y+=this.vy;
  }
  draw(ctx){
    ctx.font=`500 ${this.fontSize}px 'JetBrains Mono', monospace`;
    ctx.fillStyle=this.color;
    ctx.globalAlpha=0.85;
    ctx.textAlign='center';
    ctx.textBaseline='middle';
    ctx.fillText(this.label, this.x, this.y);
    ctx.globalAlpha=1;
  }
}

let wordParticles = stackItems.map((item,i)=>new WordParticle(item,i,stackItems.length));
let sMX=9999,sMY=9999;
sc.addEventListener('mousemove',e=>{sMX=e.clientX;sMY=e.clientY;});
sc.addEventListener('mouseleave',()=>{sMX=9999;sMY=9999;});

function animStack(){
  sctx.clearRect(0,0,sc.width,sc.height);
  wordParticles.forEach(p=>{p.update(sMX,sMY);p.draw(sctx);});
  requestAnimationFrame(animStack);
}
animStack();

// ─── SCROLL REVEAL ────────────────────────────────────────
const reveals = document.querySelectorAll('.reveal');
const hackItems = document.querySelectorAll('.hack-item');
const io = new IntersectionObserver(entries=>{
  entries.forEach(e=>{if(e.isIntersecting){e.target.classList.add('visible');}});
},{threshold:0.15});
reveals.forEach(el=>io.observe(el));
hackItems.forEach(el=>io.observe(el));
