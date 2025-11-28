/* Apertura busta + effetto "glitter" dorati */
const stage = document.querySelector('.stage');
const envelope = document.getElementById('envelope');
const sealButton = document.getElementById('seal');
const sealWax = sealButton.querySelector('.wax');
const card = document.getElementById('card');
const canvas = document.getElementById('glitters');
const ctx = canvas.getContext && canvas.getContext('2d');
let animationFrameId;
let isCardClickable = false;

function resizeCanvas(){
  if(!ctx) return;
  canvas.width = window.innerWidth * devicePixelRatio;
  canvas.height = window.innerHeight * devicePixelRatio;
  canvas.style.width = window.innerWidth + 'px';
  canvas.style.height = window.innerHeight + 'px';
  ctx.setTransform(devicePixelRatio,0,0,devicePixelRatio,0,0);
}
window.addEventListener('resize', resizeCanvas);
resizeCanvas();

function openEnvelope(){
  if (envelope.classList.contains('open')) return;
  envelope.classList.remove('closed');
  envelope.classList.add('open');
  stage.classList.add('card-open');
  card.setAttribute('aria-hidden', 'false');
  startGlitters();
  isCardClickable = true;
  sealButton.classList.remove('pulsing');
}

function closeEnvelope(){
  if (!envelope.classList.contains('open')) return;
  isCardClickable = false;
  stage.classList.remove('card-open');
  stopGlitters();
  envelope.classList.remove('open');
  envelope.classList.add('closed');
  card.setAttribute('aria-hidden', 'true');
  setTimeout(()=> ctx && ctx.clearRect(0,0,canvas.width,canvas.height), 800);
}

sealButton.addEventListener('click', (e)=>{
  e.stopPropagation();
  sealButton.classList.add('pulsing');
  setTimeout(()=> openEnvelope(), 280);
});

envelope.addEventListener('keydown', (e)=>{
  if(e.key === 'Enter' || e.key === ' '){
    e.preventDefault();
    sealButton.click();
  } else if(e.key === 'Escape'){
    closeEnvelope();
  }
});

card.addEventListener('click', (event)=>{
  if (!isCardClickable) return;
  if (event.target.closest('.btn')) return;
  closeEnvelope();
});

function startGlitters(){
  if(!ctx) return;
  stopGlitters();
  const glitters = [];
  const W = canvas.width / devicePixelRatio;
  const H = canvas.height / devicePixelRatio;

  for (let i=0;i<700;i++){
    glitters.push({
      x: Math.random()*W,
      y: Math.random()*H,
      r: Math.random()*3 + 0.6,
      dy: Math.random()*0.8 + 0.2,
      dx: (Math.random()-0.5)*0.4,
      alpha: Math.random()*0.7 + 0.2
    });
  }

  function animate(){
    ctx.clearRect(0,0,W,H);
    glitters.forEach(g=>{
      ctx.beginPath();
      ctx.arc(g.x, g.y, g.r, 0, Math.PI*2);
      ctx.fillStyle = 'rgba(255,215,0,'+g.alpha+')'; // glitter dorati
      ctx.shadowBlur = g.r * 3;
      ctx.shadowColor = 'rgba(255,215,0,'+ (g.alpha*0.8) +')';
      ctx.fill();

      g.y += g.dy;
      g.x += g.dx;
      if (g.y > H + 10) g.y = -10;
      if (g.x > W + 10) g.x = -10;
      if (g.x < -10) g.x = W + 10;
    });
    animationFrameId = requestAnimationFrame(animate);
  }
  animate();
}

function stopGlitters(){
  if(animationFrameId) cancelAnimationFrame(animationFrameId);
  animationFrameId = null;
}

document.addEventListener('keydown', (e)=>{
  if (e.key === 'Escape'){
    closeEnvelope();
  }
});

setTimeout(()=> sealButton.classList.add('pulsing'), 700);
