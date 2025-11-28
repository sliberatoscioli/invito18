const stage = document.querySelector('.stage'); 
const envelope = document.getElementById('envelope');
const sealButton = document.getElementById('seal');
const card = document.getElementById('card');
const canvas = document.getElementById('glitters');
const ctx = canvas.getContext('2d');
let animationFrameId;
let isCardClickable = false;

window.addEventListener('resize', () => {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
});

// Apertura busta
sealButton.addEventListener('click', () => {
  if (envelope.classList.contains('closed')) {
    isCardClickable = false;
    envelope.classList.remove('closed');
    envelope.classList.add('open');

    startGlitters();
    card.setAttribute('aria-hidden', 'false');

    setTimeout(() => stage.classList.add('card-open'), 500);
    setTimeout(() => isCardClickable = true, 2000);
  }
});

// Chiusura Card
card.addEventListener('click', (event) => {
  if (!isCardClickable) return;
  if (event.target.classList.contains('btn') || event.target.closest('.btn')) return;
  if (stage.classList.contains('card-open')) closeEnvelope();
});

function closeEnvelope() {
  isCardClickable = false;
  stage.classList.remove('card-open');
  stopGlitters();
  setTimeout(() => {
    envelope.classList.remove('open');
    envelope.classList.add('closed');
    card.setAttribute('aria-hidden', 'true');
  }, 500);
  setTimeout(() => ctx.clearRect(0, 0, canvas.width, canvas.height), 1000);
}

// NEVE ARGENTO UNIFORME
function startGlitters() {
  stopGlitters();
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;

  const glitters = [];
  const canvasW = canvas.width;
  const canvasH = canvas.height;

  for (let i = 0; i < 400; i++) { // più fiocchi
    glitters.push({
      x: Math.random() * canvasW,
      y: Math.random() * canvasH,
      radius: Math.random() * 4 + 1,
      dy: Math.random() * 1 + 0.5,
      dx: (Math.random() - 0.5) * 0.5,
      color: `rgba(192,192,192,${Math.random()*0.8 + 0.2})`
    });
  }

  function animate() {
    ctx.clearRect(0, 0, canvasW, canvasH);
    glitters.forEach(g => {
      ctx.beginPath();
      ctx.arc(g.x, g.y, g.radius, 0, Math.PI*2);
      ctx.fillStyle = g.color;
      ctx.shadowBlur = 10;
      ctx.shadowColor = g.color;
      ctx.fill();

      g.y += g.dy;
      g.x += g.dx;

      if (g.y > canvasH) g.y = -g.radius;
      if (g.x > canvasW) g.x = 0;
      if (g.x < 0) g.x = canvasW;
    });

    animationFrameId = requestAnimationFrame(animate);
  }

  animate();
}

function stopGlitters() {
  if (animationFrameId) cancelAnimationFrame(animationFrameId);
}
