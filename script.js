// script.js — gestione envelope, sigillo, apertura e glitter sul biglietto
const stage = document.querySelector('.stage');
const envelope = document.getElementById('envelope');
const sealButton = document.getElementById('seal');
const card = document.getElementById('card');
const cardCanvas = document.getElementById('card-glitters');
const ctxCard = cardCanvas && cardCanvas.getContext ? cardCanvas.getContext('2d') : null;
const caption = document.querySelector('.envelope-caption');

let animationFrameId = null;
let isCardClickable = false;

// Ridimensiona il canvas del biglietto con devicePixelRatio per nitidezza
function resizeCardCanvas(){
  if(!ctxCard || !card) return;
  const rect = card.getBoundingClientRect();
  const w = Math.max(1, Math.floor(rect.width));
  const h = Math.max(1, Math.floor(rect.height));

  cardCanvas.style.width = w + 'px';
  cardCanvas.style.height = h + 'px';
  cardCanvas.width = w * devicePixelRatio;
  cardCanvas.height = h * devicePixelRatio;

  ctxCard.setTransform(devicePixelRatio, 0, 0, devicePixelRatio, 0, 0);
}

// chiama al resize della finestra
window.addEventListener('resize', resizeCardCanvas);
resizeCardCanvas();

function openEnvelope(){
  if (envelope.classList.contains('open')) return;
  envelope.classList.remove('closed');
  envelope.classList.add('open');
  stage.classList.add('card-open');
  card.setAttribute('aria-hidden', 'false');

  // la card potrebbe scalare: ridimensiona prima di avviare i glitter
  // small timeout per permettere la transizione di trasform (se presente)
  setTimeout(() => {
    resizeCardCanvas();
    startGlittersOnCard();
  }, 60);

  isCardClickable = true;
  sealButton.classList.remove('pulsing');
  if(caption) caption.style.opacity = '0';
}

function closeEnvelope(){
  if (!envelope.classList.contains('open')) return;
  isCardClickable = false;
  stage.classList.remove('card-open');

  stopGlittersOnCard();

  envelope.classList.remove('open');
  envelope.classList.add('closed');
  card.setAttribute('aria-hidden', 'true');

  // pulizia leggermente ritardata
  setTimeout(()=> {
    if(ctxCard) ctxCard.clearRect(0,0,cardCanvas.width,cardCanvas.height);
  }, 400);

  if(caption) caption.style.opacity = '1';
}

/* --- Interazione con il sigillo (resta invariata) --- */
sealButton.addEventListener('click', (e)=>{
  e.stopPropagation();
  sealButton.classList.add('pulsing');
  setTimeout(()=> openEnvelope(), 280);
});

/* --- Aprire la busta toccando qualsiasi punto della busta --- */
envelope.addEventListener('pointerdown', (e) => {
  if (envelope.classList.contains('open')) return;
  if (e.target.closest && e.target.closest('#seal')) return;
  sealButton.classList.add('pulsing');
  setTimeout(() => {
    if (!envelope.classList.contains('open')) openEnvelope();
  }, 200);
});

/* accessibilità: Enter / Space apre */
envelope.addEventListener('keydown', (e)=>{
  if(e.key === 'Enter' || e.key === ' '){
    e.preventDefault();
    sealButton.classList.add('pulsing');
    setTimeout(()=> openEnvelope(), 280);
  } else if(e.key === 'Escape'){ closeEnvelope(); }
});

/* click sul biglietto chiude tutto */
card.addEventListener('click', (event)=>{
  if (!isCardClickable) return;
  if (event.target.closest('.btn')) return;
  closeEnvelope();
});

/* --- Glitter sul biglietto --- */
function startGlittersOnCard(){
  if(!ctxCard) return;
  stopGlittersOnCard();

  const W = cardCanvas.width / devicePixelRatio;
  const H = cardCanvas.height / devicePixelRatio;
  const COUNT = Math.round(Math.max(120, (W*H)/9000)); // adattivo in base area
  const glitters = [];

  for (let i=0;i<COUNT;i++){
    glitters.push({
      x: Math.random()*W,
      y: Math.random()*H,
      r: Math.random()*2.4 + 0.6,
      dy: Math.random()*0.9 + 0.3,
      dx: (Math.random()-0.5)*0.6,
      alpha: Math.random()*0.75 + 0.2
    });
  }

  function animate(){
    ctxCard.clearRect(0,0,W,H);
    glitters.forEach(g=>{
      ctxCard.beginPath();
      ctxCard.arc(g.x, g.y, g.r, 0, Math.PI*2);
      ctxCard.fillStyle = 'rgba(255,215,0,'+g.alpha+')';
      ctxCard.shadowBlur = Math.max(0, g.r * 3);
      ctxCard.shadowColor = 'rgba(255,215,0,'+ (g.alpha*0.8) +')';
      ctxCard.fill();

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

function stopGlittersOnCard(){
  if(animationFrameId) cancelAnimationFrame(animationFrameId);
  animationFrameId = null;
  if(ctxCard){
    ctxCard.clearRect(0,0,cardCanvas.width,cardCanvas.height);
  }
}

/* ESC per chiudere */
document.addEventListener('keydown', (e)=>{ if(e.key==='Escape'){closeEnvelope();} });

/* avvia pulsazione sigillo all'inizio */
setTimeout(()=> sealButton.classList.add('pulsing'), 700);

// Se la card o layout cambia dinamicamente, opzione: osserva resize della card (Mutation/ResizeObserver)
if (window.ResizeObserver && card) {
  const ro = new ResizeObserver(()=> {
    // aggiorna canvas se visibile o anche quando chiuso (non heavy)
    resizeCardCanvas();
  });
  ro.observe(card);
}
