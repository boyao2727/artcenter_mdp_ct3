/* THE SAME WATER · Transform
 * Global p5.js sketch. Paste this whole file into the p5 Web Editor.
 * A symbolic, mass-conserving particle world, not a climate forecast.
 * H = warm brush, C = cool brush, Space = pause.
 */
const WATER_COUNT = 720;
const PAPER = [246, 243, 236];
const ICE = [67, 139, 143], LIQUID = [130, 113, 176], VAPOR = [214, 132, 109];
let agents = [], grid = new Map(), trail, world;
let thermalSlider, lightSlider, tool = 'warm', paused = false;
let controls, phaseLabel, tempValue, lightValue, help, warmButton, coolButton, pauseButton;
let clock = 0, lastCounts = [0,0,0], hudTimer = 0;

function setup() {
  pixelDensity(1);
  createCanvas(windowWidth, windowHeight);
  textFont('Georgia');
  buildControls();
  fitWorld();
  seedWorld();
}

function fitWorld() {
  const small = width < 700;
  world = {cx:width*.5, cy:height*(small ? .60 : .55), rx:width*(small ? .45 : .425), ry:Math.max(85,height*(small ? .265 : .34))};
  if(trail) trail.remove();
  trail = createGraphics(width,height);
  trail.pixelDensity(1); trail.clear();
}

function seedWorld() {
  randomSeed(1441); noiseSeed(71); clock = 0;
  agents = [];
  for(let i=0;i<WATER_COUNT;i++) {
    const homeGroup = i%7;
    const h = homeFor(i,homeGroup);
    const a = random(TWO_PI), r = sqrt(random())*.83;
    const heat = Number(thermalSlider.value)/100;
    agents.push({id:i,g:homeGroup,x:world.cx+cos(a)*r*world.rx,y:world.cy+sin(a)*r*world.ry,vx:random(-.7,.7),vy:random(-.7,.7),t:heat+random(-.10,.10),stress:0,size:random(2.0,3.6),hx:h.x,hy:h.y,px:0,py:0});
  }
  trail.clear(); updateCounts();
}

function homeFor(id,g) {
  const ga=g*TWO_PI/7+.3;
  const gx=world.cx+cos(ga)*world.rx*.50, gy=world.cy+sin(ga)*world.ry*.46;
  const j=floor(id/7), ring=floor((sqrt(12*j+9)-3)/6)+1;
  const q=j*.61803398875*TWO_PI;
  const scale=min(world.rx,world.ry)*.022;
  return {x:gx+cos(q)*sqrt(j)*scale, y:gy+sin(q)*sqrt(j)*scale};
}

function buildControls() {
  const style = document.createElement('style');
  style.textContent = `
  *{box-sizing:border-box} .water-ui{font:12px Arial,sans-serif;color:#57564f;position:absolute;inset:0;pointer-events:none}
  .water-top{position:absolute;left:4.4%;right:4.4%;top:28px;display:flex;align-items:flex-start;justify-content:space-between;gap:24px}
  .water-title{font:italic 30px Georgia,serif;letter-spacing:-1px;color:#373b35;margin-bottom:7px}.water-eyebrow{font-size:10px;letter-spacing:2px;text-transform:uppercase}
  .water-controls{display:flex;gap:25px;pointer-events:auto}.water-range{width:150px}.water-label{display:flex;justify-content:space-between;margin-bottom:8px;font-size:11px}.water-range input{width:100%;height:3px;accent-color:#77688f;cursor:pointer}
  .water-bottom{position:absolute;bottom:28px;left:4.4%;right:4.4%;display:flex;align-items:flex-end;justify-content:space-between;gap:16px}
  .water-tools{display:flex;gap:4px;pointer-events:auto;margin-bottom:10px}.water-tools button,.water-pause{font:11px Arial,sans-serif;border:1px solid #d7d5c9;border-radius:20px;background:#f6f3ec;color:#5b5c52;padding:8px 14px;cursor:pointer;pointer-events:auto}.water-tools button[aria-pressed=true]{background:#e8e1e5;border-color:#c9bccb;color:#48404e}.water-tools button:focus-visible,.water-pause:focus-visible,input:focus-visible{outline:2px solid #77688f;outline-offset:4px}
  .water-help{font-size:11px;line-height:1.5}.water-counts{display:flex;gap:20px;justify-content:flex-end;margin-bottom:10px;font-size:11px}.water-key{display:inline-block;width:5px;height:5px;border-radius:50%;margin-right:5px}.water-total{font-size:10px;letter-spacing:1px;text-align:right;text-transform:uppercase}.water-pause{position:absolute;right:4.4%;top:96px;padding:6px 12px}
  @media(max-width:699px){.water-top{top:22px;display:block}.water-title{font-size:27px}.water-controls{margin-top:22px;gap:20px}.water-range{width:calc(50% - 10px)}.water-bottom{bottom:22px;display:block}.water-counts{justify-content:flex-start;gap:16px;margin-top:16px}.water-total{text-align:left}.water-pause{top:28px}.water-help{font-size:10px}}
  @media(max-height:520px) and (min-width:700px){.water-top{top:18px}.water-bottom{bottom:16px}.water-title{font-size:25px}.water-pause{top:72px}}
  `;
  document.head.appendChild(style);
  controls=document.createElement('div');controls.className='water-ui';
  controls.innerHTML=`<div class="water-top"><div><div class="water-title">The same water.</div><div class="water-eyebrow">A closed world / Transform</div></div><div class="water-controls"><label class="water-range"><span class="water-label">Temperature <output id="thermal-value">48</output></span><input id="thermal" aria-label="Temperature" type="range" min="0" max="100" value="48"></label><label class="water-range"><span class="water-label">Sunlight <output id="sun-value">45</output></span><input id="sun" aria-label="Sunlight" type="range" min="0" max="100" value="45"></label></div></div><button class="water-pause" aria-label="Pause world">Pause</button><div class="water-bottom"><div><div class="water-tools"><button id="warm" aria-pressed="true">Warm · H</button><button id="cool" aria-pressed="false">Cool · C</button></div><div class="water-help">Hold inside the world to warm a small area.</div></div><div><div class="water-counts" aria-live="off"></div><div class="water-total">720 water units · total stays the same</div></div></div>`;
  document.body.appendChild(controls);
  thermalSlider=controls.querySelector('#thermal');lightSlider=controls.querySelector('#sun');
  tempValue=controls.querySelector('#thermal-value');lightValue=controls.querySelector('#sun-value');
  phaseLabel=controls.querySelector('.water-counts');help=controls.querySelector('.water-help');
  warmButton=controls.querySelector('#warm');coolButton=controls.querySelector('#cool');pauseButton=controls.querySelector('.water-pause');
  warmButton.onclick=()=>selectTool('warm');coolButton.onclick=()=>selectTool('cool');pauseButton.onclick=()=>togglePause();
  thermalSlider.oninput=()=>tempValue.textContent=thermalSlider.value;lightSlider.oninput=()=>lightValue.textContent=lightSlider.value;
}

function selectTool(v){tool=v;warmButton.setAttribute('aria-pressed',v==='warm');coolButton.setAttribute('aria-pressed',v==='cool');help.textContent=`Hold inside the world to ${v} a small area.`;}
function togglePause(){paused=!paused;pauseButton.textContent=paused?'Resume':'Pause';pauseButton.setAttribute('aria-label',paused?'Resume world':'Pause world');}
function windowResized(){resizeCanvas(windowWidth,windowHeight);fitWorld();agents.forEach(a=>{const h=homeFor(a.id,a.g);a.hx=h.x;a.hy=h.y;a.x=constrain(a.x,world.cx-world.rx*.9,world.cx+world.rx*.9);a.y=constrain(a.y,world.cy-world.ry*.9,world.cy+world.ry*.9);});}
function keyPressed(){if(document.activeElement?.tagName==='INPUT')return;if(key==='h'||key==='H')selectTool('warm');if(key==='c'||key==='C')selectTool('cool');if(key===' '){togglePause();return false;}}

function draw() {
  const dt=min(deltaTime/1000,.034);
  if(!paused){clock+=dt;stepWorld(dt);}
  background(...PAPER);
  image(trail,0,0);
  drawWorldBoundary();
  drawConnections(); drawBodies(); drawBrush();
  hudTimer+=dt;if(hudTimer>.25){updateCounts();hudTimer=0;}
}

function rebuildGrid(){grid.clear();for(const a of agents){const k=floor(a.x/32)+','+floor(a.y/32);if(!grid.has(k))grid.set(k,[]);grid.get(k).push(a);}}
function neighbors(a){let out=[];const ix=floor(a.x/32),iy=floor(a.y/32);for(let x=-1;x<=1;x++)for(let y=-1;y<=1;y++){const bucket=grid.get((ix+x)+','+(iy+y));if(bucket)out.push(...bucket);}return out;}

function stepWorld(dt) {
  rebuildGrid();
  const step=dt*60, ambient=constrain(Number(thermalSlider.value)/100+(Number(lightSlider.value)/100-.45)*.14,0,1);
  const sun=Number(lightSlider.value)/100;
  const inside=pow((mouseX-world.cx)/world.rx,2)+pow((mouseY-world.cy)/world.ry,2)<1;
  const pressing=mouseIsPressed&&inside&&!document.activeElement?.matches('input');
  trail.noStroke();trail.fill(...PAPER,22*step);trail.rect(0,0,width,height);
  for(const a of agents) {
    a.px=a.x;a.py=a.y;
    const tau=ambient>a.t?6:15;
    a.t+=(ambient-a.t)*(1-exp(-dt/tau));
    if(pressing){const d=dist(a.x,a.y,mouseX,mouseY),r=min(world.rx,world.ry)*.35;if(d<r)a.t=constrain(a.t+(tool==='warm'?1:-1)*dt*.38*pow(1-d/r,1.3),0,1);}
    // The vapor threshold breaks the group; residual agitation fades slowly.
    if(a.t>.72)a.stress+=(1-a.stress)*dt*.9;
    else a.stress*=exp(-dt/21);
    const solid=1-smoother(.22,.38,a.t), gas=smoother(.64,.80,a.t), fluid=max(0,1-solid-gas);
    let fx=0,fy=0;
    // Frozen individuals find persistent homes and connect into a lattice.
    fx+=(a.hx-a.x)*.0055*solid/(1+a.stress*1.8);fy+=(a.hy-a.y)*.0055*solid/(1+a.stress*1.8);
    // Liquid groups follow moving centers and align with nearby individuals.
    const ga=a.g*TWO_PI/7+.3+sin(clock*.09)*.22;
    const gx=world.cx+cos(ga)*world.rx*.5,gy=world.cy+sin(ga)*world.ry*.46;
    const dx=gx-a.x,dy=gy-a.y;
    fx+=(dx*.0012-dy*.0028)*fluid;fy+=(dy*.0012+dx*.0028)*fluid;
    let count=0,avx=0,avy=0;
    for(const b of neighbors(a)){if(a===b)continue;const sx=a.x-b.x,sy=a.y-b.y,d2=sx*sx+sy*sy;if(d2<700){count++;avx+=b.vx;avy+=b.vy;}if(d2<90&&d2>0.01){fx+=sx/d2*.26;fy+=sy/d2*.26;}}
    if(count){fx+=(avx/count-a.vx)*.045*fluid;fy+=(avy/count-a.vy)*.045*fluid;}
    const angle=noise(a.x*.0035,a.y*.0035,clock*.065+a.id*.001)*TWO_PI*3;
    const gasAngle=noise(a.id*.731+32,clock*.22,12.6)*TWO_PI*6;
    fx+=cos(angle)*(.012*fluid+.015*a.stress)+cos(gasAngle)*(.092*gas+.020*a.stress);
    fy+=sin(angle)*(.012*fluid+.015*a.stress)+sin(gasAngle)*(.092*gas+.020*a.stress);
    // Vapor spreads away from the centers of liquid groups.
    if(gas>.01){const d=max(25,sqrt(dx*dx+dy*dy));fx-=dx/d*.055*gas;fy-=dy/d*.055*gas;}
    const rx=(a.x-world.cx)/world.rx,ry=(a.y-world.cy)/world.ry;
    const edge=sqrt(rx*rx+ry*ry);
    if(edge>.88){fx-=rx*(edge-.88)*.75;fy-=ry*(edge-.88)*.75;}
    a.vx=(a.vx+fx*step)*pow(.94+gas*.047,step);a.vy=(a.vy+fy*step)*pow(.94+gas*.047,step);
    const limit=.25+fluid*1.45+gas*2.0+a.stress*.3+sun*.15;
    const speed=sqrt(a.vx*a.vx+a.vy*a.vy);if(speed>limit){a.vx*=limit/speed;a.vy*=limit/speed;}
    a.x+=a.vx*step;a.y+=a.vy*step;
    const e=sqrt(pow((a.x-world.cx)/world.rx,2)+pow((a.y-world.cy)/world.ry,2));
    if(e>.985){a.x=world.cx+(a.x-world.cx)*.985/e;a.y=world.cy+(a.y-world.cy)*.985/e;a.vx*=-.4;a.vy*=-.4;}
    const c=phaseColor(a.t);
    trail.stroke(c[0],c[1],c[2],(25+fluid*22+gas*10)*step);trail.strokeWeight(a.size*.65);trail.line(a.px,a.py,a.x,a.y);
  }
}

function smoother(lo,hi,x){const t=constrain((x-lo)/(hi-lo),0,1);return t*t*(3-2*t);}
function phaseColor(t){let a,b,f;if(t<.48){a=ICE;b=LIQUID;f=smoother(.22,.45,t);}else{a=LIQUID;b=VAPOR;f=smoother(.57,.78,t);}return a.map((v,i)=>lerp(v,b[i],f));}
function drawWorldBoundary(){noFill();stroke(191,191,172,85);strokeWeight(.8);ellipse(world.cx,world.cy,world.rx*2,world.ry*2);noStroke();fill(139,143,125,100);textFont('Arial');textSize(9);textAlign(CENTER);text('ONE WORLD · NO WATER ENTERS OR LEAVES',world.cx,world.cy-world.ry-12);}
function drawConnections(){strokeWeight(.65);for(const a of agents){if(a.t>.38)continue;const strength=1-smoother(.24,.38,a.t);stroke(...ICE,37*strength);let used=0;for(const b of neighbors(a)){if(b.id<=a.id||b.t>.38)continue;const d=dist(a.x,a.y,b.x,b.y);if(d<25&&d>3){line(a.x,a.y,b.x,b.y);if(++used===3)break;}}}}
function drawBodies(){noStroke();for(const a of agents){const c=phaseColor(a.t),v=sqrt(a.vx*a.vx+a.vy*a.vy);fill(...c,15);ellipse(a.x,a.y,a.size*4.0,a.size*4.0);push();translate(a.x,a.y);rotate(atan2(a.vy,a.vx));fill(...c,105);ellipse(0,0,a.size*1.7+v*1.5,a.size*1.6);fill(...c,170);ellipse(-a.size*.25,0,a.size*.68,a.size*.68);pop();}}
function drawBrush(){const e=pow((mouseX-world.cx)/world.rx,2)+pow((mouseY-world.cy)/world.ry,2);if(e>1||mouseX<=0||mouseY<=0)return;const r=min(world.rx,world.ry)*.35,c=tool==='warm'?VAPOR:ICE;noFill();stroke(...c,mouseIsPressed?120:50);strokeWeight(.8);ellipse(mouseX,mouseY,r*2,r*2);if(mouseIsPressed){noStroke();fill(...c,8);ellipse(mouseX,mouseY,r*2,r*2);}noStroke();}
function updateCounts(){const counts=[0,0,0];for(const a of agents)counts[a.t<.30?0:a.t>.72?2:1]++;lastCounts=counts;const labels=['Solid','Liquid','Vapor'],colors=[ICE,LIQUID,VAPOR];phaseLabel.innerHTML=counts.map((n,i)=>`<span><i class="water-key" style="background:rgb(${colors[i]})"></i>${labels[i]} ${n}</span>`).join('');}
