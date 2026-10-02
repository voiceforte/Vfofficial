import { configured, auth, db } from './firebase-config.js';
import { SCHEMA } from './cms-schema.js';
import { signInWithEmailAndPassword, signOut, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import { doc, getDoc, setDoc, deleteDoc, addDoc, getDocs, collection, query, orderBy } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

const $ = s => document.querySelector(s);
const esc = s => String(s ?? '').replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const msg = (t, ok = true) => { const m = $('#msg'); m.textContent = t; m.className = ok ? 'ok' : 'err'; m.style.display = 'block'; setTimeout(() => m.style.display = 'none', 4500); };

function compress(file, max, type) {
  return new Promise((res, rej) => {
    const i = new Image();
    i.onload = () => {
      const s = Math.min(1, max / Math.max(i.width, i.height)), c = document.createElement('canvas');
      c.width = Math.round(i.width * s); c.height = Math.round(i.height * s);
      c.getContext('2d').drawImage(i, 0, 0, c.width, c.height);
      const d = c.toDataURL(type, 0.82);
      d.length > 900000 ? rej(new Error('Image is too large, please use a smaller one')) : res(d);
    };
    i.onerror = () => rej(new Error('Could not read image'));
    i.src = URL.createObjectURL(file);
  });
}

if (!configured) { $('#cfg-warn').hidden = false; $('#login-form').hidden = true; }
else {
  onAuthStateChanged(auth, u => { $('#login').hidden = !!u; $('#app').hidden = !u; if (u) show('pages'); });
  $('#login-form').onsubmit = async e => { e.preventDefault(); try { await signInWithEmailAndPassword(auth, $('#em').value, $('#pw').value); } catch (err) { msg('Login failed: ' + err.code, false); } };
  $('#logout').onclick = () => signOut(auth);
}

const tabs = { pages: renderPages, images: renderImages, team: () => renderCrud('team'), insights: () => renderCrud('insights') };
function show(name) {
  document.querySelectorAll('.tab').forEach(t => t.hidden = t.id !== name);
  document.querySelectorAll('#tabs button').forEach(b => b.classList.toggle('on', b.dataset.tab === name));
  tabs[name]().catch(e => msg(e.message, false));
}
document.querySelectorAll('#tabs button').forEach(b => b.onclick = () => show(b.dataset.tab));

/* ---- Page text ---- */
async function renderPages() {
  const sel = $('#page-sel');
  if (!sel.options.length) { Object.entries(SCHEMA).forEach(([k, v]) => sel.add(new Option(v.title, k))); sel.onchange = renderPages; }
  const page = sel.value, snap = await getDoc(doc(db, 'cms', 'text_' + page)), saved = snap.exists() ? snap.data().fields || {} : {};
  $('#fields').innerHTML = SCHEMA[page].fields.map(f => `<div class="card"><label>${esc(f.tag)} · ${f.k}<textarea data-k="${f.k}" rows="${Math.min(7, Math.ceil(f.def.length / 80) + 1)}">${esc(saved[f.k] ?? f.def)}</textarea></label></div>`).join('');
}
$('#save-page').onclick = async () => {
  const page = $('#page-sel').value, defs = Object.fromEntries(SCHEMA[page].fields.map(f => [f.k, f.def])), fields = {};
  document.querySelectorAll('#fields textarea').forEach(t => { if (t.value.trim() !== defs[t.dataset.k]) fields[t.dataset.k] = t.value.trim(); });
  try { await setDoc(doc(db, 'cms', 'text_' + page), { fields }); msg('Saved'); } catch (e) { msg(e.message, false); }
};
$('#reset-page').onclick = async () => {
  if (!confirm('Reset this page to the original text?')) return;
  await deleteDoc(doc(db, 'cms', 'text_' + $('#page-sel').value)); msg('Reset'); renderPages();
};

/* ---- Logo & hero images ---- */
const slots = [['logo', 'Logo (PNG with transparent background works best)'], ...Object.entries(SCHEMA).map(([k, v]) => ['hero_' + k, v.title + ' page · header/hero background image'])];
async function renderImages() {
  const box = $('#slots'); box.innerHTML = '';
  for (const [id, label] of slots) {
    const s = await getDoc(doc(db, 'cms', 'img_' + id)), src = s.exists() ? s.data().src : '';
    const d = document.createElement('div'); d.className = 'card';
    d.innerHTML = `<b>${esc(label)}</b>${src ? `<img class="prev" src="${src}">` : '<p><i>Default (nothing uploaded)</i></p>'}<input type="file" accept="image/*"> ${src ? '<button class="ghost">Remove</button>' : ''}`;
    d.querySelector('input').onchange = async e => {
      try { await setDoc(doc(db, 'cms', 'img_' + id), { src: await compress(e.target.files[0], id === 'logo' ? 500 : 1800, id === 'logo' ? 'image/png' : 'image/jpeg') }); msg('Image saved'); renderImages(); } catch (err) { msg(err.message, false); }
    };
    const rm = d.querySelector('button'); if (rm) rm.onclick = async () => { await deleteDoc(doc(db, 'cms', 'img_' + id)); renderImages(); };
    box.appendChild(d);
  }
}

/* ---- Team & Insights ---- */
const CATS = [['crisis', 'Crisis Communication'], ['internal', 'Internal Communications'], ['government', 'Government & Public Affairs'], ['media', 'Media Relations']];
const CFG = {
  team: { fields: [['name', 'Name'], ['title', 'Title / role'], ['bio', 'Short bio', 'ta'], ['order', 'Display order (1 = first)', 'number']], photo: true, ord: ['order', 'asc'] },
  insights: { fields: [['title', 'Article title'], ['url', 'LinkedIn article URL'], ['summary', 'Short summary', 'ta'], ['category', 'Category', 'sel'], ['date', 'Date', 'date']], photo: false, ord: ['date', 'desc'] }
};
async function renderCrud(col) {
  const c = CFG[col], box = $('#' + col + '-box');
  const snap = await getDocs(query(collection(db, col), orderBy(...c.ord)));
  let edit = null;
  box.innerHTML = `<form class="card">${c.fields.map(([k, l, t]) => `<label>${l}${t === 'ta' ? `<textarea name="${k}" rows="3"></textarea>` : t === 'sel' ? `<select name="${k}">${CATS.map(x => `<option value="${x[0]}">${x[1]}</option>`).join('')}</select>` : `<input name="${k}" type="${t || 'text'}">`}</label>`).join('')}${c.photo ? '<label>Photo<input type="file" accept="image/*" name="_photo"></label>' : ''}<button>Save</button> <button type="button" class="ghost" id="clr">Clear form</button></form><div class="card" id="list"></div>`;
  const form = box.querySelector('form'), list = box.querySelector('#list');
  list.innerHTML = snap.empty ? '<i>Nothing added yet.</i>' : '';
  snap.docs.forEach(d => {
    const m = d.data(), r = document.createElement('div'); r.className = 'row';
    r.innerHTML = `<span>${m.photo ? `<img src="${m.photo}"> ` : ''}<b>${esc(m.name || m.title)}</b> <small>${esc(m.name ? m.title : m.date)}</small></span><span><button class="ghost e">Edit</button> <button class="ghost x">Delete</button></span>`;
    r.querySelector('.e').onclick = () => { edit = { id: d.id, photo: m.photo }; c.fields.forEach(([k]) => form.elements[k].value = m[k] ?? ''); scrollTo(0, 0); };
    r.querySelector('.x').onclick = async () => { if (confirm('Delete this entry?')) { await deleteDoc(doc(db, col, d.id)); renderCrud(col); } };
    list.appendChild(r);
  });
  box.querySelector('#clr').onclick = () => { form.reset(); edit = null; };
  form.onsubmit = async e => {
    e.preventDefault();
    const d = {}; c.fields.forEach(([k, , t]) => { d[k] = t === 'number' ? Number(form.elements[k].value || 0) : form.elements[k].value.trim(); });
    if (col === 'insights' && !d.date) d.date = new Date().toISOString().slice(0, 10);
    try {
      if (c.photo) { const f = form.elements['_photo'].files[0]; d.photo = f ? await compress(f, 600, 'image/jpeg') : (edit?.photo || ''); }
      edit ? await setDoc(doc(db, col, edit.id), d) : await addDoc(collection(db, col), d);
      msg('Saved'); renderCrud(col);
    } catch (err) { msg(err.message, false); }
  };
}
