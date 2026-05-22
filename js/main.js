/* ============================================================
   PANCHO — main.js
   Landing page: nav mobile, scroll fade-up, KPI orbital
   ============================================================ */

document.addEventListener('DOMContentLoaded', () => {

  // ── Nav mobile toggle ──
  const toggle = document.getElementById('nav-toggle');
  const menu   = document.getElementById('nav-menu');
  if (toggle && menu) {
    toggle.addEventListener('click', () => menu.classList.toggle('open'));
    menu.querySelectorAll('a').forEach(a =>
      a.addEventListener('click', () => menu.classList.remove('open'))
    );
  }

  // ── Scroll fade-up ──
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(e => { if (e.isIntersecting) e.target.classList.add('visible'); });
  }, { threshold: 0.12 });
  document.querySelectorAll('.fade-up').forEach(el => observer.observe(el));

  // ── KPI orbital — ciclo de métricas en el centro ──
  const kpis = [
    { num: '98%',  label: 'PRECISIÓN'  },
    { num: '10×',  label: 'MÁS RÁPIDO' },
    { num: '−80%', label: 'TIEMPO OP.' },
  ];
  let current   = 0;
  const numEl   = document.getElementById('kpi-num');
  const labelEl = document.getElementById('kpi-label');

  if (numEl && labelEl) {
    function updateKPI(idx) {
      const k = kpis[idx];
      numEl.style.opacity = labelEl.style.opacity = '0';
      numEl.style.transition = labelEl.style.transition = 'opacity .2s';
      setTimeout(() => {
        numEl.textContent   = k.num;
        labelEl.textContent = k.label;
        numEl.style.opacity = labelEl.style.opacity = '1';
        numEl.classList.remove('kpi-pop');
        void numEl.offsetWidth; // fuerza reflow
        numEl.classList.add('kpi-pop');
      }, 220);
    }
    setInterval(() => {
      current = (current + 1) % kpis.length;
      updateKPI(current);
    }, 3000);
  }

});
