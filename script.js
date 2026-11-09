/* Up Rénovation 33 · accueil
   Pas de prix affiché : une toiture se chiffre sur photos ou sur place.
   Envoi des formulaires à brancher (Web3Forms) une fois le site validé. */

/* Bordeaux au centre, communes jusqu'à 100 km. Distances à vol d'oiseau × 1,25 (route), arrondies.
   Le client travaille surtout sur Bordeaux et jusqu'à 100 km (demande du 09/11/2026). */
const HOME = { n: 'Bordeaux', lat: 44.8378, lon: -0.5792 };
const TOWNS = [
  { n: 'Mérignac', lat: 44.8386, lon: -0.6436, dx: -12, a: 'end' },
  { n: 'Libourne', lat: 44.9150, lon: -0.2436, major: 1 },
  { n: 'Saint-Émilion', lat: 44.8939, lon: -0.1553, dy: 20 },
  { n: 'Créon', lat: 44.7747, lon: -0.3478 },
  { n: 'Cadillac', lat: 44.6372, lon: -0.3183 },
  { n: 'Blaye', lat: 45.1278, lon: -0.6622, major: 1 },
  { n: 'Castelnau-de-Médoc', lat: 45.0300, lon: -0.7981, dx: -12, a: 'end' },
  { n: 'Pauillac', lat: 45.1989, lon: -0.7486, dx: -12, a: 'end' },
  { n: 'Lesparre-Médoc', lat: 45.3072, lon: -0.9378, dx: -12, a: 'end' },
  { n: 'Andernos-les-Bains', lat: 44.7453, lon: -1.1036, dx: -12, a: 'end' },
  { n: 'Arcachon', lat: 44.6586, lon: -1.1689, major: 1, dx: -12, a: 'end' },
  { n: 'Belin-Béliet', lat: 44.5003, lon: -0.7883 },
  { n: 'Langon', lat: 44.5531, lon: -0.2494, major: 1 },
  { n: 'Bazas', lat: 44.4317, lon: -0.2128 },
  { n: 'La Réole', lat: 44.5833, lon: -0.0333 },
  { n: 'Sainte-Foy-la-Grande', lat: 44.8378, lon: 0.2167, dx: 0, a: 'middle', dy: -14 },
];
const km = t => {
  const r = Math.PI / 180, dLat = (t.lat - HOME.lat) * r, dLon = (t.lon - HOME.lon) * r;
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(HOME.lat * r) * Math.cos(t.lat * r) * Math.sin(dLon / 2) ** 2;
  return Math.max(5, Math.round(6371 * 2 * Math.asin(Math.sqrt(a)) * 1.25));
};
TOWNS.forEach(t => { t.km = km(t); t.z = t.km < 15 ? 'near' : t.km <= 50 ? 'mid' : 'far'; });

const $ = (s, el = document) => el.querySelector(s);
const $$ = (s, el = document) => [...el.querySelectorAll(s)];

/* ---------- Apparitions ---------- */
const io = new IntersectionObserver(es => es.forEach(e => {
  if (e.isIntersecting) { e.target.classList.add('is-in'); io.unobserve(e.target); }
}), { rootMargin: '0px 0px -8% 0px' });
$$('.reveal').forEach(el => io.observe(el));

/* ---------- Navigation : claire sur la photo, verre blanc ensuite ---------- */
const nav = $('#nav'), hero = $('#hero');
function onScroll() {
  const onPhoto = hero.getBoundingClientRect().bottom > 60;
  nav.classList.toggle('on-photo', onPhoto);
  nav.classList.toggle('is-scrolled', !onPhoto);
}
const callbar = $('.callbar'), devisSec = $('#devis');
function onCallbar() {
  const r = devisSec.getBoundingClientRect();
  const surDevis = r.top < innerHeight && r.bottom > 0;
  callbar.classList.toggle('is-on', hero.getBoundingClientRect().bottom < 80 && !surDevis);
}
addEventListener('scroll', onCallbar, { passive: true });
addEventListener('scroll', onScroll, { passive: true });
addEventListener('resize', onScroll);
onScroll();

/* Les deux raccourcis de l'ouverture présélectionnent le besoin */
$$('[data-go]').forEach(a => a.addEventListener('click', () => {
  const r = $(`input[name="besoin"][value="${a.dataset.go}"]`);
  if (r) r.checked = true;
  setTimeout(() => $('input[name="tel"]').focus({ preventScroll: true }), 700);
}));

/* ---------- Métiers : l'aperçu prend la photo de la ligne survolée ou atteinte au clavier ---------- */
(function apercu() {
  const img = $('.tprev img');
  if (!img) return;
  const lignes = $$('.tlist a');
  let voulu = img.getAttribute('src'), minuteur;
  const montrer = a => {
    lignes.forEach(l => l.classList.toggle('is-on', l === a));
    const src = a.dataset.img;
    if (!src || src === voulu) return;
    voulu = src;
    clearTimeout(minuteur);
    img.classList.add('is-out');
    minuteur = setTimeout(() => {
      const pret = () => img.classList.remove('is-out');
      img.onload = pret; img.src = src;
      if (img.complete) pret();
    }, 180);
  };
  lignes.forEach(a => {
    a.addEventListener('pointerenter', () => montrer(a));
    a.addEventListener('focus', () => montrer(a));
    // Précharge les six photos pour que l'aperçu change sans attendre
    if (a.dataset.img) new Image().src = a.dataset.img;
  });
  montrer(lignes[0]);
})();

/* ---------- Avant / après : le curseur (accessible au clavier) déplace la coupure ---------- */
$$('.ba-slider').forEach(box => {
  const r = $('input', box);
  r.addEventListener('input', () => box.style.setProperty('--pos', r.value + '%'));
});

/* ---------- Demande : seul le téléphone est obligatoire ----------
   Envoi par Web3Forms (FormData, sans preflight CORS), clé dans config.js.
   Les photos ne passent pas par Web3Forms (offre gratuite) : on propose le SMS. */
const form = $('#ask'), err = $('#ask-err'), telIn = $('input[name="tel"]');
const btn = $('button[type="submit"]', form);
telIn.addEventListener('input', () => { err.textContent = ''; telIn.removeAttribute('aria-invalid'); });
function fini(d) {
  const prenom = (d.get('prenom') || '').trim();
  $('#done-txt').textContent = `${prenom ? 'Merci ' + prenom + ', nous' : 'Nous'} vous rappelons au ${telIn.value.trim()}. Vous pouvez aussi nous envoyer des photos du toit par SMS au 06 78 44 61 09.`;
  $('#ask-form').hidden = true; $('#ask-done').hidden = false;
}
form.addEventListener('submit', async e => {
  e.preventDefault();
  if (telIn.value.replace(/\D/g, '').length < 10) {
    err.textContent = 'Indiquez un numéro à 10 chiffres pour que nous puissions vous rappeler.';
    telIn.setAttribute('aria-invalid', 'true'); telIn.focus(); return;
  }
  const d = new FormData(form);
  const cle = (window.UPR || {}).WEB3FORMS_KEY || '';
  if (!cle || cle.startsWith('REMPLACER')) {
    err.textContent = 'Le formulaire n’est pas encore actif. Appelez-nous au 06 78 44 61 09.'; return;
  }
  const envoi = new FormData();
  envoi.append('access_key', cle);
  envoi.append('subject', `Demande de rappel · ${d.get('besoin') || 'Devis'} · Up Rénovation 33`);
  envoi.append('from_name', 'Site Up Rénovation 33');
  envoi.append('Besoin', d.get('besoin') || 'Non précisé');
  envoi.append('Prénom', d.get('prenom') || '');
  envoi.append('Téléphone', d.get('tel'));
  envoi.append('Commune', d.get('commune') || '');
  envoi.append('botcheck', '');
  if (window.UPR_SUIVI) window.UPR_SUIVI.provenance(envoi);
  btn.disabled = true; btn.textContent = 'Envoi…';
  try {
    const r = await fetch('https://api.web3forms.com/submit', { method: 'POST', headers: { Accept: 'application/json' }, body: envoi });
    const j = await r.json();
    if (!j.success) throw new Error(j.message);
    window.dataLayer = window.dataLayer || [];
    window.dataLayer.push({ event: 'generate_lead', form: 'accueil', prestation: d.get('besoin') || '' });
    if (window.UPR_SUIVI) window.UPR_SUIVI.devis();
    fini(d);
  } catch (_) {
    btn.disabled = false; btn.textContent = 'Être rappelé';
    err.textContent = 'L’envoi n’a pas abouti. Appelez-nous directement au 06 78 44 61 09.';
  }
});

/* ---------- Carte ---------- */
(function map() {
  const svg = $('#map'), tip = $('#map-tip'), NS = 'http://www.w3.org/2000/svg';
  const lon0 = -1.17, lat0 = 45.31, kx = Math.cos(44.85 * Math.PI / 180), s = 585;
  const P = (lat, lon) => [160 + (lon - lon0) * kx * s, 110 + (lat0 - lat) * s];
  const el = (n, a, p = svg) => { const e = document.createElementNS(NS, n); for (const k in a) e.setAttribute(k, a[k]); p.appendChild(e); return e; };
  const [hx, hy] = P(HOME.lat, HOME.lon);
  const pxKm = s / 111;
  // Sur téléphone la carte est réduite de moitié : zone de toucher élargie pour rester au doigt
  const petit = matchMedia('(max-width: 734px)').matches;
  const hitR = petit ? 36 : 22;
  // Les noms y sont deux fois plus gros (CSS) : leurs décalages doublent aussi, sinon ils mordent sur les points
  const k2 = petit ? 2 : 1;
  [25, 50].forEach(d => {
    el('circle', { cx: hx, cy: hy, r: d * pxKm, class: 'ring' });
    el('text', { x: hx + 4, y: hy - d * pxKm - 5, 'font-size': 11, 'font-family': 'system-ui' }).textContent = `${d} km à vol d’oiseau`;
  });
  const color = { near: '#B5481F', mid: '#23272B', far: '#A1A1A6' };
  TOWNS.forEach(t => {
    const [x, y] = P(t.lat, t.lon);
    const g = el('g', { class: 'town' + (t.major ? ' is-major' : ''), tabindex: 0, role: 'button', 'aria-label': `${t.n}, environ ${t.km} kilomètres` });
    el('circle', { cx: x, cy: y, r: hitR, class: 'hit' }, g);
    el('circle', { cx: x, cy: y, r: t.major ? 7 : 5.5, fill: color[t.z], class: 'dot', stroke: '#fff', 'stroke-width': 2 }, g);
    el('text', { x: x + (t.dx ?? 12) * k2, y: y + (t.dy ?? 5) * k2, 'text-anchor': t.a || 'start' }, g).textContent = t.n;
    const show = () => {
      $$('.town.is-on', svg).forEach(n => n.classList.remove('is-on'));
      g.classList.add('is-on');
      const k = svg.getBoundingClientRect().width / 800;
      tip.style.left = x * k + 'px'; tip.style.top = y * k + 'px';
      tip.innerHTML = `<b>${t.n}</b><span>≈ ${t.km} km de Bordeaux</span>`;
      tip.hidden = false;
    };
    g.addEventListener('pointerenter', show);
    g.addEventListener('click', show);
    g.addEventListener('focus', show);
  });
  const h = el('g', { class: 'home' });
  el('circle', { cx: hx, cy: hy, r: 9, class: 'pulse' }, h);
  el('circle', { cx: hx, cy: hy, r: 6, fill: '#B5481F', stroke: '#fff', 'stroke-width': 2.5 }, h);
  el('text', { x: hx + 12 * k2, y: hy - 6 * k2 }, h).textContent = 'Bordeaux';
  svg.addEventListener('pointerleave', () => { tip.hidden = true; $$('.town.is-on', svg).forEach(n => n.classList.remove('is-on')); });
})();

