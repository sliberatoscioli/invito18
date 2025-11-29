const stage = document.querySelector('.stage');
const envelope = document.getElementById('envelope');
const sealButton = document.getElementById('seal');
const card = document.getElementById('card');
const cardCanvas = document.getElementById('card-glitters');
const ctxCard = cardCanvas && cardCanvas.getContext ? cardCanvas.getContext('2d') : null;
const caption = document.querySelector('.envelope-caption');

let animationFrameId = null;
let isCardClickable = false;

// memorizza gli stili originali per ripristinarli al close
const _orig = {
  position: null,
  left: null,
  top: null,
  transform: null,
  width: null,
  transition: null
};

/* -------------------- Canvas resizing -------------------- */
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

/* -------------------- Apertura / Chiusura busta (fixed strategy) -------------------- */
function makeCardFixedCentered(){
  if(!card) return;
  // salva originali solo la prima volta
  if(_orig.position === null){
    const cs = window.getComputedStyle(card);
    _orig.position = card.style.position || '';
    _orig.left = card.style.left || '';
    _orig.top = card.style.top || '';
    _orig.transform = card.style.transform || '';
    _orig.width = card.style.width || '';
    _orig.transition = card.style.transition || '';
    // anche le proprietà calcolate utili per ripristino
    _orig.computedWidth = cs.width;
  }

  // Imposta fixed rispetto alla viewport: immune da ancestor transforms
  card.style.position = 'fixed';
  card.style.left = '50%';
  card.style.top = '50%';
  card.style.transform = 'translate3d(-50%,-50%,0) scale(1)';
  // Mantieni larghezza coerente ma basata su viewport (evita overflow)
  card.style.width = 'min(90vw, 700px)';
  card.style.transition = 'transform .6s cubic-bezier(.2,.9,.3,1), opacity .6s';
  // assicurati che sia sopra tutto
  card.style.zIndex = 9999;
}

function restoreCardOriginalPosition(){
  if(!card) return;
  // ripristina gli stili salvati
  card.style.position = _orig.position;
  card.style.left = _orig.left;
  card.style.top = _orig.top;
  card.style.transform = _orig.transform;
  card.style.width = _orig.width;
  card.style.transition = _orig.transition;
  card.style.zIndex = ''; // rimuovi override
}

function openEnvelope(){
  if (envelope.classList.contains('open')) return;
  envelope.classList.remove('closed');
  envelope.classList.add('open');
  stage.classList.add('card-open');
  card.setAttribute('aria-hidden', 'false');

  // prepara trasformazioni performanti
  card.style.willChange = 'transform, width';

  // timeout breve per transizioni flap ecc.
  setTimeout(() => {
    // rendi fixed e centrato (risolve decentramento su mobile)
    makeCardFixedCentered();

    // ridimensiona canvas e avvia glitter
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

  // ripristina la posizione originaria (absolute + left:50% top:50% come CSS)
  restoreCardOriginalPosition();

  // pulizia leggermente ritardata
  setTimeout(()=> {
    if(ctxCard) ctxCard.clearRect(0,0,cardCanvas.width,cardCanvas.height);
  }, 400);

  if(caption) caption.style.opacity = '1';
}

/* -------------------- Interazioni (invariate) -------------------- */
/* Interazione con il sigillo */
sealButton.addEventListener('click', (e)=>{
  e.stopPropagation();
  sealButton.classList.add('pulsing');
  setTimeout(()=> openEnvelope(), 280);
});

/* Aprire la busta toccando qualsiasi punto della busta (eccetto sigillo) */
envelope.addEventListener('pointerdown', (e) => {
  if (envelope.classList.contains('open')) return;
  if (e.target.closest && e.target.closest('#seal')) return;
  sealButton.classList.add('pulsing');
  setTimeout(() => {
    if (!envelope.classList.contains('open')) openEnvelope();
  }, 200);
});

/* accessibilità: Enter / Space apre; Escape chiude */
envelope.addEventListener('keydown', (e)=>{
  if(e.key === 'Enter' || e.key === ' '){
    e.preventDefault();
    sealButton.classList.add('pulsing');
    setTimeout(()=> openEnvelope(), 280);
  } else if(e.key === 'Escape'){ closeEnvelope(); }
});

/* click sul biglietto chiude tutto (se non su btn) */
card.addEventListener('click', (event)=>{
  if (!isCardClickable) return;
  if (event.target.closest('.btn')) return;
  closeEnvelope();
});

/* ESC globale per chiudere */
document.addEventListener('keydown', (e)=>{ if(e.key==='Escape'){closeEnvelope();} });

/* avvia pulsazione sigillo all'inizio */
setTimeout(()=> sealButton.classList.add('pulsing'), 700);

/* -------------------- Glitter sul biglietto (invariato) -------------------- */
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

/* -------------------- ResizeObserver e event listeners aggiuntivi -------------------- */
// Se la card o layout cambia dinamicamente, osserva resize della card
if (window.ResizeObserver && card) {
  const ro = new ResizeObserver(()=> {
    // aggiorna canvas e, se la card è fixed, aggiorna le dimensioni
    resizeCardCanvas();
    if (envelope.classList.contains('open')) {
      // se fixed, ricalcola larghezza in base a viewport (per sicurezza)
      card.style.width = 'min(90vw, 700px)';
    }
  });
  ro.observe(card);
}

// ricalcola posizione e canvas se cambia orientamento o dimensione (utile su mobile)
function onViewportChange(){
  resizeCardCanvas();
  if(envelope.classList.contains('open')){
    // assicurarsi che la card fixed rimanga centrata (posizioni fixed usano left/top 50% quindi non serve)
    card.style.width = 'min(90vw, 700px)';
  }
}
window.addEventListener('orientationchange', onViewportChange);
window.addEventListener('resize', onViewportChange);
