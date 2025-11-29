const stage = document.querySelector('.stage');
const envelope = document.getElementById('envelope');
const sealButton = document.getElementById('seal');
const card = document.getElementById('card');
const canvas = document.getElementById('glitters');
const ctx = canvas.getContext && canvas.getContext('2d');
const caption = document.querySelector('.envelope-caption');
let animationFrameId;
let isCardClickable = false;

function resizeCanvas(){
  if(!ctx) return;
  const vw = window.innerWidth;
  const vh = window.innerHeight;
  canvas.width = vw * devicePixelRatio;
  canvas.height = vh * devicePixelRatio;
  canvas.style.width = vw + 'px';
  canvas.style.height = vh + 'px';
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

  // opzionale: forzare anche via JS (fallback)
  if(caption) caption.style.opacity = '0';
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

  // fallback JS per mostrare la didascalia
  if(caption) caption.style.opacity = '1';
}

/* --- Interazione con il sigillo (resta invariata) --- */
sealButton.addEventListener('click', (e)=>{
  e.stopPropagation(); // evita che il click sul sigillo "scavalchi" l'handler della busta
  sealButton.classList.add('pulsing');
  setTimeout(()=> openEnvelope(), 280);
});

/* --- Aprire la busta toccando qualsiasi punto della busta --- */
/* uso pointerdown per rispondere immediatamente al tocco/mousedown; 
   se il target è il sigillo, viene ignorato (così il sigillo gestisce l'animazione) */
envelope.addEventListener('pointerdown', (e) => {
  // se già aperta non fare nulla
  if (envelope.classList.contains('open')) return;

  // se il pointer è stato sul sigillo (o un suo discendente), ignora: lasciamo il sigillo gestire l'azione
  if (e.target.closest && e.target.closest('#seal')) return;

  // effetto visivo rapido (come se si schiacciasse il sigillo)
  sealButton.classList.add('pulsing');

  // piccolo ritardo per permettere la pulsazione; mantiene esperienza simile al click sul sigillo
  setTimeout(() => {
    // ricontrollo: se l'utente ha già aperto nel frattempo, non facciamo doppio
    if (!envelope.classList.contains('open')) openEnvelope();
  }, 200);
});

/* --- accessibilità: lascia il comportamento da tastiera (Enter / Space) sul container envelope --- */
envelope.addEventListener('keydown', (e)=>{
  // Manteniamo la stessa UX: Enter / Space attivano l'apertura
  if(e.key === 'Enter' || e.key === ' '){
    e.preventDefault();
    // simula la pressione del sigillo per avere lo stesso feedback visivo
    sealButton.classList.add('pulsing');
    setTimeout(()=> openEnvelope(), 280);
  }
  else if(e.key === 'Escape'){ closeEnvelope(); }
});

/* click sul biglietto chiude tutto (resta identico) */
card.addEventListener('click', (event)=>{
  if (!isCardClickable) return;
  if (event.target.closest('.btn')) return;
  closeEnvelope();
});

/* --- Glitter (resta tutto come prima) --- */
function startGlitters(){
  if(!ctx) return;
  stopGlitters();
  const glitters = [];
  const W = canvas.width / devicePixelRatio;
  const H = canvas.height / devicePixelRatio;

  for (let i=0;i<900;i++){ // più glitter
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
      ctx.fillStyle = 'rgba(255,215,0,'+g.alpha+')'; // dorati
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

/* chiusura con ESC */
document.addEventListener('keydown', (e)=>{ if(e.key==='Escape'){closeEnvelope();} });

/* avvia pulsazione sigillo all'inizio */
setTimeout(()=> sealButton.classList.add('pulsing'), 700);
