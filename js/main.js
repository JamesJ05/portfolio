document.getElementById('year').textContent = new Date().getFullYear();

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
  function step(){
    ctx.clearRect(0, 0, w, h);
    for (const p of particles){
      p.x += p.vx; p.y += p.vy;
      if (p.x < 0 || p.x > w) p.vx *= -1;
      if (p.y < 0 || p.y > h) p.vy *= -1;
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
})();
