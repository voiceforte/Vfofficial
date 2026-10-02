// Public-site loader: applies CMS text, logo, hero images, team and insights from Firestore.
import { configured, db } from './firebase-config.js';
import { doc, getDoc, getDocs, collection, query, orderBy } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

const esc = s => String(s ?? '').replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const safeUrl = u => /^https?:\/\//i.test(u) ? u : '#';
const page = (location.pathname.split('/').pop() || 'index').replace('.html', '') || 'index';

async function run() {
  const [t, logo, hero] = await Promise.all(
    [`text_${page}`, 'img_logo', `img_hero_${page}`].map(id => getDoc(doc(db, 'cms', id)).catch(() => null)));

  const f = t && t.exists() ? t.data().fields || {} : {};
  document.querySelectorAll('[data-cms]').forEach(e => { const v = f[e.dataset.cms]; if (v) e.innerHTML = v; });

  if (logo && logo.exists()) {
    const a = document.querySelector('.nav-logo');
    if (a) a.insertAdjacentHTML('afterbegin', `<img src="${logo.data().src}" alt="Voice Forte" style="height:36px;margin-right:.7rem;vertical-align:middle">`);
  }
  if (hero && hero.exists()) {
    const h = document.querySelector('.hero-bg');
    if (h) h.style.background = `linear-gradient(rgba(11,24,41,.72),rgba(11,24,41,.88)),url(${hero.data().src}) center/cover no-repeat`;
  }

  const grid = document.getElementById('team-grid');
  if (grid) {
    const s = await getDocs(query(collection(db, 'team'), orderBy('order'))).catch(() => null);
    if (s && !s.empty) {
      grid.innerHTML = s.docs.map(d => { const m = d.data(); return `<div class="team-card">${m.photo ? `<img src="${m.photo}" alt="${esc(m.name)}">` : `<div class="team-ph">${esc((m.name || '?')[0])}</div>`}<h3>${esc(m.name)}</h3><p class="team-role">${esc(m.title)}</p><p>${esc(m.bio)}</p></div>`; }).join('');
      document.getElementById('team').hidden = false;
    }
  }

  const ig = document.querySelector('.insights-grid');
  if (ig) {
    const s = await getDocs(query(collection(db, 'insights'), orderBy('date', 'desc'))).catch(() => null);
    if (s && !s.empty) {
      ig.innerHTML = s.docs.map(d => { const m = d.data(); return `<div class="insight-card" data-category="${esc(m.category)}"><p class="insight-tag">${esc(m.category)}</p><h3>${esc(m.title)}</h3><p>${esc(m.summary)}</p><a href="${esc(safeUrl(m.url))}" class="read-link" target="_blank" rel="noopener">Read on LinkedIn →</a></div>`; }).join('');
      const names = { crisis: 'Crisis Communication', internal: 'Internal Communications', government: 'Government & Public Affairs', media: 'Media Relations' };
      ig.querySelectorAll('.insight-tag').forEach(p => { p.textContent = names[p.textContent] || p.textContent; });
    }
  }
}
if (configured) run().catch(e => console.warn('CMS load skipped:', e));
