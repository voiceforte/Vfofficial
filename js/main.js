// ════════════════════════════════════════════
// VOICE FORTE™ — SHARED SITE BEHAVIOR
// ════════════════════════════════════════════

// Scroll reveal
document.addEventListener('DOMContentLoaded', () => {
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(e => { if (e.isIntersecting) e.target.classList.add('visible'); });
  }, { threshold: 0.1 });
  document.querySelectorAll('.reveal').forEach(el => observer.observe(el));

  // Nav scroll effect
  const nav = document.querySelector('nav');
  if (nav) {
    window.addEventListener('scroll', () => {
      nav.style.background = window.scrollY > 60
        ? 'rgba(8,15,26,0.96)'
        : 'rgba(11,24,41,0.82)';
    });
  }

  // Insights filter (only present on insights.html)
  const filterBtns = document.querySelectorAll('.filter-btn');
  const insightCards = document.querySelectorAll('.insight-card');
  filterBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      filterBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      const filter = btn.dataset.filter;
      insightCards.forEach(card => {
        if (filter === 'all' || card.dataset.category === filter) {
          card.style.display = '';
        } else {
          card.style.display = 'none';
        }
      });
    });
  });

  // Contact form handler (Formspree) — present on index.html and contact.html
  const form = document.getElementById('contact-form');
  if (form) {
    form.addEventListener('submit', handleContactSubmit);
  }
});

// Mobile nav
function openMobileNav() { document.getElementById('mobile-nav').classList.add('open'); }
function closeMobileNav() { document.getElementById('mobile-nav').classList.remove('open'); }

// Formspree async handler — delivers to contact@voiceforte.com
async function handleContactSubmit(e) {
  e.preventDefault();
  const form = e.target;
  const btn  = document.getElementById('submit-btn');
  const ok   = document.getElementById('form-success');

  const originalText = btn.textContent;
  btn.textContent = 'Sending…';
  btn.disabled = true;
  btn.style.opacity = '0.7';

  try {
    const res = await fetch(form.action, {
      method: 'POST',
      body: new FormData(form),
      headers: { Accept: 'application/json' }
    });

    if (res.ok) {
      form.reset();
      btn.style.display = 'none';
      if (ok) ok.style.display = 'block';
    } else {
      btn.textContent = 'Error — Try Again';
      btn.disabled = false;
      btn.style.opacity = '1';
      btn.style.background = 'rgba(255,80,80,0.15)';
      btn.style.color = '#ff6b6b';
    }
  } catch {
    btn.textContent = 'Network Error — Try Again';
    btn.disabled = false;
    btn.style.opacity = '1';
  }
}
