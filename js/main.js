document.getElementById('year').textContent = new Date().getFullYear();

/* ---------- Keep academic history distinct from work experience ---------- */
const educationTimeline = document.getElementById('educationTimeline');
const educationItem = Array.from(document.querySelectorAll('#experience .timeline-item'))
  .find(item => item.querySelector('h3')?.textContent.includes('BS Computer Engineering'));
if (educationTimeline && educationItem) educationTimeline.appendChild(educationItem);

/* ---------- Nav scroll state + mobile menu ---------- */
const nav = document.getElementById('nav');
window.addEventListener('scroll', () => {
  nav.classList.toggle('scrolled', window.scrollY > 20);
}, { passive:true });

const burger = document.getElementById('navBurger');
const navLinks = document.querySelector('.nav-links');
burger?.addEventListener('click', () => {
  const open = navLinks.style.display === 'flex';
  navLinks.style.display = open ? 'none' : 'flex';
  navLinks.style.cssText += open ? '' : `
    position:fixed; top:64px; left:0; right:0; flex-direction:column;
    background:rgba(6,10,22,0.97); padding:1.5rem; gap:1.2rem; border-bottom:1px solid var(--border);
  `;
});

/* ---------- Scroll reveal ---------- */
const revealItems = document.querySelectorAll('.reveal');
const revealObserver = new IntersectionObserver((entries) => {
  entries.forEach(e => {
    if (e.isIntersecting) {
      e.target.classList.add('in-view');
      revealObserver.unobserve(e.target);
    }
  });
}, { threshold: 0.15 });
revealItems.forEach(el => revealObserver.observe(el));

/* ---------- Ambient particle-network background ---------- */
(function particleNetwork(){
  const canvas = document.getElementById('net-bg');
  const ctx = canvas.getContext('2d');
  let w, h, particles;
  const pointer = { x: -1000, y: -1000 };
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function resize(){
    w = canvas.width = window.innerWidth;
    h = canvas.height = window.innerHeight;
  }
  function makeParticles(){
    const count = Math.min(70, Math.floor((w * h) / 22000));
    particles = Array.from({ length: count }, () => ({
      x: Math.random() * w,
      y: Math.random() * h,
      vx: (Math.random() - 0.5) * 0.25,
      vy: (Math.random() - 0.5) * 0.25,
      r: Math.random() * 1.6 + 0.6
    }));
  }
  function drawAtmosphere(time){
    ctx.fillStyle = '#060a16';
    ctx.fillRect(0, 0, w, h);
    const glows = [
      { x:w * (.18 + Math.sin(time * .00011) * .05), y:h * (.1 + Math.cos(time * .00013) * .05), r:Math.max(w,h) * .58, color:'79,141,255' },
      { x:w * (.88 + Math.cos(time * .00009) * .04), y:h * (.2 + Math.sin(time * .00012) * .06), r:Math.max(w,h) * .46, color:'52,230,214' }
    ];
    glows.forEach(g => {
      const gradient = ctx.createRadialGradient(g.x, g.y, 0, g.x, g.y, g.r);
      gradient.addColorStop(0, `rgba(${g.color},0.10)`);
      gradient.addColorStop(.5, `rgba(${g.color},0.035)`);
      gradient.addColorStop(1, 'rgba(6,10,22,0)');
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, w, h);
    });
  }
  function step(time = 0){
    drawAtmosphere(time);
    for (const p of particles){
      p.x += p.vx; p.y += p.vy;
      if (p.x < 0 || p.x > w) p.vx *= -1;
      if (p.y < 0 || p.y > h) p.vy *= -1;
      const dx = p.x - pointer.x, dy = p.y - pointer.y;
      const distance = Math.hypot(dx, dy);
      if (distance < 150 && distance > 0) {
        p.x += (dx / distance) * 0.75;
        p.y += (dy / distance) * 0.75;
      }
    }
    for (let i = 0; i < particles.length; i++){
      const a = particles[i];
      ctx.beginPath();
      ctx.arc(a.x, a.y, a.r, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(125,178,255,0.55)';
      ctx.fill();
      for (let j = i + 1; j < particles.length; j++){
        const b = particles[j];
        const dx = a.x - b.x, dy = a.y - b.y;
        const dist = Math.sqrt(dx*dx + dy*dy);
        if (dist < 140){
          ctx.beginPath();
          ctx.moveTo(a.x, a.y);
          ctx.lineTo(b.x, b.y);
          ctx.strokeStyle = `rgba(79,141,255,${0.14 * (1 - dist / 140)})`;
          ctx.lineWidth = 1;
          ctx.stroke();
        }
      }
    }
    if (!prefersReducedMotion) requestAnimationFrame(step);
  }

  resize();
  makeParticles();
  step();
  window.addEventListener('resize', () => { resize(); makeParticles(); });
  window.addEventListener('pointermove', event => {
    pointer.x = event.clientX;
    pointer.y = event.clientY;
  }, { passive:true });
})();
