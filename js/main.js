/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   EGA110 Study Site — main.js
   Navigation, modes, glossary, panels
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */

// ── SECTION NAVIGATION ──────────────────────
const NAV_ITEM_SEL = '[data-section]';

function showSection(id, e) {
  if (e) e.preventDefault();
  document.querySelectorAll('.section').forEach(s => s.classList.remove('active'));
  document.querySelectorAll(NAV_ITEM_SEL).forEach(t => t.classList.remove('active'));
  const section = document.getElementById(id);
  if (section) { section.classList.add('active'); window.scrollTo({ top: 0, behavior: 'smooth' }); }
  const tab = document.querySelector(`[data-section="${id}"]`);
  if (tab) tab.classList.add('active');
  history.pushState({ section: id }, '', `#${id}`);
}

window.addEventListener('popstate', e => {
  const id = (e.state && e.state.section) || location.hash.slice(1) || 'home';
  const el = document.getElementById(id);
  if (el) {
    document.querySelectorAll('.section').forEach(s => s.classList.remove('active'));
    document.querySelectorAll(NAV_ITEM_SEL).forEach(t => t.classList.remove('active'));
    el.classList.add('active');
    const tab = document.querySelector(`[data-section="${id}"]`);
    if (tab) tab.classList.add('active');
  }
});

// ── LEARN / REVISE MODE ──────────────────────
function setMode(mode, silent) {
  document.querySelectorAll('.mode-btn').forEach(b => b.classList.remove('active'));
  const btn = document.querySelector(`.mode-btn[data-mode="${mode}"]`);
  if (btn) btn.classList.add('active');
  if (mode === 'revise') {
    document.body.classList.add('revise-mode');
  } else {
    document.body.classList.remove('revise-mode');
  }
  localStorage.setItem('ega110-mode', mode);
  if (silent) return;

  // Border flash
  document.querySelector('.mode-flash')?.remove();
  const flash = document.createElement('div');
  flash.className = `mode-flash ${mode}`;
  document.body.appendChild(flash);
  setTimeout(() => flash.remove(), 900);

  // Toast
  document.querySelector('.mode-toast')?.remove();
  const label = mode === 'learn' ? '📖  Learn mode' : '⚡  Revise mode';
  const toast = document.createElement('div');
  toast.className = `mode-toast ${mode}`;
  toast.textContent = label;
  document.body.appendChild(toast);
  setTimeout(() => {
    toast.classList.add('fade-out');
    setTimeout(() => toast.remove(), 350);
  }, 1800);
}

// ── GLOSSARY SEARCH ──────────────────────────
function initGlossarySearch(inputId, countId, noResultsId) {
  const input = document.getElementById(inputId);
  const countEl = document.getElementById(countId);
  const noResultsEl = document.getElementById(noResultsId);
  if (!input) return;

  input.addEventListener('input', () => {
    const q = input.value.toLowerCase().trim();
    let visible = 0;
    document.querySelectorAll('.term-item').forEach(item => {
      const show = !q || item.dataset.name.includes(q) || item.dataset.def.includes(q);
      item.classList.toggle('hidden', !show);
      if (show) {
        visible++;
        const nameEl = item.querySelector('.term-name');
        const defEl = item.querySelector('.term-def');
        if (q) {
          nameEl.innerHTML = highlight(nameEl.textContent, q);
          defEl.innerHTML = highlight(defEl.textContent, q);
          item.classList.add('match');
        } else {
          nameEl.innerHTML = nameEl.textContent;
          defEl.innerHTML = defEl.textContent;
          item.classList.remove('match');
        }
      }
    });
    document.querySelectorAll('.glossary-section').forEach(sec => {
      const vis = sec.querySelectorAll('.term-item:not(.hidden)').length;
      sec.classList.toggle('hidden', q && vis === 0);
      if (q && vis > 0) sec.classList.remove('collapsed');
    });
    if (countEl) countEl.textContent = q ? `${visible} term${visible !== 1 ? 's' : ''} found` : '';
    if (noResultsEl) noResultsEl.style.display = (q && visible === 0) ? 'block' : 'none';
  });
}

function highlight(text, q) {
  const re = new RegExp(`(${q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
  return text.replace(re, '<mark>$1</mark>');
}

// ── GLOSSARY FILTER BUTTONS ──────────────────
function initGlossaryFilters(filterSelector) {
  document.querySelectorAll(filterSelector).forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll(filterSelector).forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      const filter = btn.dataset.gfilter;
      const input = document.querySelector('.search-input');
      if (input) { input.value = ''; }
      const countEl = document.getElementById('search-results-count');
      if (countEl) countEl.textContent = '';
      const noResultsEl = document.getElementById('no-results');
      if (noResultsEl) noResultsEl.style.display = 'none';

      document.querySelectorAll('.glossary-section').forEach(sec => {
        const show = filter === 'all' || sec.dataset.topic === filter;
        sec.classList.toggle('hidden', !show);
        if (show) sec.classList.remove('collapsed');
      });
      document.querySelectorAll('.term-item').forEach(item => {
        item.classList.remove('hidden', 'match');
        const n = item.querySelector('.term-name');
        const d = item.querySelector('.term-def');
        if (n) n.innerHTML = n.textContent;
        if (d) d.innerHTML = d.textContent;
      });
    });
  });
}

// ── GLOSSARY SECTION TOGGLE ──────────────────
function toggleGlossarySection(header) {
  const sec = header.parentElement;
  sec.classList.toggle('collapsed');
  const arrow = header.querySelector('.g-arrow');
  if (arrow) arrow.style.transform = sec.classList.contains('collapsed') ? 'rotate(-90deg)' : '';
}

// ── BUILD GLOSSARY FROM DATA ─────────────────
function buildGlossary(containerId) {
  const container = document.getElementById(containerId);
  if (!container || typeof glossaryData === 'undefined') return;

  const colorMap = {
    t1:'#f7a84a', t2:'#6aabf7', t3:'#7af76a', t4:'#c06af7', t5:'#4af7c0'
  };

  Object.entries(glossaryData).forEach(([key, topic]) => {
    const color = colorMap[key] || '#7c6af7';
    const sec = document.createElement('div');
    sec.className = 'glossary-section';
    sec.dataset.topic = key;
    sec.innerHTML = `
      <div class="glossary-header" onclick="toggleGlossarySection(this)">
        <div style="display:flex;align-items:center;gap:10px;">
          <div style="width:9px;height:9px;border-radius:50%;background:${color};flex-shrink:0"></div>
          <span style="font-weight:700;font-size:14px">${topic.name}</span>
          <span style="font-family:'JetBrains Mono',monospace;font-size:10px;color:var(--muted)">(${topic.terms.length} terms)</span>
        </div>
        <span class="g-arrow" style="color:var(--muted);transition:transform 0.2s">▾</span>
      </div>
      <div class="glossary-grid">
        ${topic.terms.map(([name,def]) => `
          <div class="term-item" data-name="${name.toLowerCase()}" data-def="${def.toLowerCase()}">
            <div class="term-name" style="color:${color}">${name}</div>
            <div class="term-def">${def}</div>
          </div>`).join('')}
      </div>`;
    container.appendChild(sec);
  });
}

// ── KEYBOARD SHORTCUTS ───────────────────────
const TOPIC_IDS = ['home','t1','t2','t3','t4','t5','formulas','glossary','traps'];

document.addEventListener('keydown', e => {
  if (document.activeElement.tagName === 'INPUT') return;

  if (e.key === '/') {
    e.preventDefault();
    showSection('glossary');
    setTimeout(() => { const inp = document.querySelector('.search-input'); if (inp) inp.focus(); }, 150);
  }

  if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') {
    const active = document.querySelector('.section.active');
    if (!active) return;
    const idx = TOPIC_IDS.indexOf(active.id);
    if (idx === -1) return;
    const next = e.key === 'ArrowRight' ? TOPIC_IDS[idx + 1] : TOPIC_IDS[idx - 1];
    if (next) showSection(next);
  }

  if (e.key === 'Escape') {
    const inp = document.querySelector('.search-input');
    if (inp && document.activeElement === inp) { inp.value = ''; inp.dispatchEvent(new Event('input')); inp.blur(); }
  }
});

// ── SECTION ACCENT STRIPS ────────────────────
function buildAccentStrips() {
  TOPIC_IDS.filter(id => /^t\d+$/.test(id)).forEach(id => {
    const section = document.getElementById(id);
    if (!section) return;
    const strip = document.createElement('div');
    strip.className = 'section-accent';
    section.insertBefore(strip, section.firstChild);
  });
}

// ── PREV / NEXT NAV ──────────────────────────
function buildTopicNav() {
  const topics = TOPIC_IDS.filter(id => /^t\d+$/.test(id));
  topics.forEach((id, i) => {
    const section = document.getElementById(id);
    if (!section) return;
    const container = section.querySelector('.container');
    if (!container) return;

    const prev = topics[i - 1];
    const next = topics[i + 1];
    const labels = {
      t1:'Data & Errors', t2:'Statistical Analysis', t3:'Gravimetric Analysis',
      t4:'Spectroscopy', t5:'Titrations'
    };

    const nav = document.createElement('div');
    nav.className = 'topic-nav';
    nav.innerHTML = `
      <button class="topic-nav-btn${prev ? '' : ' disabled'}" onclick="${prev ? `showSection('${prev}')` : ''}">
        ← ${prev ? labels[prev] : 'Start'}
      </button>
      <span style="font-family:'JetBrains Mono',monospace;font-size:10px;color:var(--dim)">${i+1} / ${topics.length}</span>
      <button class="topic-nav-btn${next ? '' : ' disabled'}" onclick="${next ? `showSection('${next}')` : ''}">
        ${next ? labels[next] : 'End'} →
      </button>`;
    container.appendChild(nav);
  });
}

// ── INIT ─────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  const savedMode = localStorage.getItem('ega110-mode') || 'learn';
  setMode(savedMode, true);

  const hash = location.hash.slice(1);
  if (hash && document.getElementById(hash)) showSection(hash);

  buildGlossary('glossary-container');
  initGlossarySearch('glossary-search-input', 'search-results-count', 'no-results');
  initGlossaryFilters('[data-gfilter]');
  buildTopicNav();
  buildAccentStrips();
});
