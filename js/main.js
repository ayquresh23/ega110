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
  markVisited(id);
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

  // Exact-match pin container — inserted once, before #glossary-container
  const glContainer = document.getElementById('glossary-container');
  const pinnedWrap = document.createElement('div');
  pinnedWrap.id = 'glossary-pinned';
  pinnedWrap.style.display = 'none';
  glContainer.parentNode.insertBefore(pinnedWrap, glContainer);

  input.addEventListener('input', () => {
    const q = input.value.toLowerCase().trim();

    // Restore previously-pinned originals before each run
    document.querySelectorAll('.term-item[data-pinned]').forEach(item => {
      item.classList.remove('hidden');
      delete item.dataset.pinned;
    });
    pinnedWrap.innerHTML = '';
    pinnedWrap.style.display = 'none';

    let visible = 0;
    const exactItems = [];

    document.querySelectorAll('.term-item').forEach(item => {
      const nameMatch = item.dataset.name.includes(q);
      const defMatch = item.dataset.def.includes(q);
      const show = !q || nameMatch || defMatch;
      item.classList.toggle('hidden', !show);
      if (show) {
        visible++;
        const nameEl = item.querySelector('.term-name');
        const defEl = item.querySelector('.term-def');
        if (q) {
          nameEl.innerHTML = highlight(nameEl.textContent, q);
          defEl.innerHTML = highlight(defEl.textContent, q);
          item.classList.add('match');
          if (item.dataset.name === q) exactItems.push(item);
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

    // Pin exact title matches to the top
    if (q && exactItems.length > 0) {
      const label = document.createElement('div');
      label.style.cssText = "font-family:'JetBrains Mono',monospace;font-size:10px;text-transform:uppercase;letter-spacing:0.8px;color:var(--muted);margin-bottom:6px";
      label.textContent = 'Exact match';
      const grid = document.createElement('div');
      grid.style.cssText = 'display:grid;grid-template-columns:repeat(auto-fill,minmax(310px,1fr));gap:1px;background:var(--border);border-radius:var(--radius);overflow:hidden;margin-bottom:20px';
      exactItems.forEach(item => {
        const clone = item.cloneNode(true);
        clone.style.borderLeftColor = 'var(--gold)';
        grid.appendChild(clone);
        item.dataset.pinned = '1';
        item.classList.add('hidden');
      });
      pinnedWrap.appendChild(label);
      pinnedWrap.appendChild(grid);
      pinnedWrap.style.display = 'block';
    }

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

// ── FLASHCARD SESSION ─────────────────────────
let _fcDeck = [], _fcFiltered = [], _fcIndex = 0, _fcTopic = 'all';

function _fcColor(key) {
  return {t1:'#f7a84a',t2:'#6aabf7',t3:'#7af76a',t4:'#c06af7',t5:'#4af7c0',
          t6:'#c06af7',t7:'#f76c8a',t8:'#f7d54a',t9:'#f76aa3',t89:'#f7e24a',t10:'#f76af7'}[key] || '#7c6af7';
}

function buildFcDeck() {
  if (typeof glossaryData === 'undefined') return;
  _fcDeck = [];
  Object.entries(glossaryData).forEach(([key, topic]) => {
    topic.terms.forEach(([name, def]) => _fcDeck.push({name, def, label:topic.name, color:_fcColor(key), key}));
  });
  const container = document.getElementById('fc-topic-btns');
  if (container) {
    container.innerHTML = '';
    container.appendChild(_fcBtn('All','all'));
    Object.entries(glossaryData).forEach(([key, topic]) => {
      const b = _fcBtn(key.toUpperCase(), key);
      b.title = topic.name;
      container.appendChild(b);
    });
  }
  applyFcFilters();
}

function _fcBtn(label, key) {
  const btn = document.createElement('button');
  btn.className = 'fc-filter-btn' + (key === 'all' ? ' active' : '');
  btn.textContent = label;
  btn.onclick = () => {
    document.querySelectorAll('#fc-topic-btns .fc-filter-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    _fcTopic = key;
    applyFcFilters();
  };
  return btn;
}

function applyFcFilters() {
  const qty = document.getElementById('fc-qty-select')?.value || 'all';
  let deck = _fcTopic === 'all' ? [..._fcDeck] : _fcDeck.filter(c => c.key === _fcTopic);
  for (let i = deck.length-1; i>0; i--) { const j = Math.floor(Math.random()*(i+1)); [deck[i],deck[j]]=[deck[j],deck[i]]; }
  _fcFiltered = qty === 'all' ? deck : deck.slice(0, parseInt(qty));
  _fcIndex = 0;
  _showFcCard();
}

function _showFcCard() {
  const c = _fcFiltered[_fcIndex];
  if (!c) return;
  const $ = id => document.getElementById(id);
  $('fc-card-inner')?.classList.remove('flipped');
  if ($('fc-topic-label')) { $('fc-topic-label').textContent = c.label; $('fc-topic-label').style.color = c.color; }
  if ($('fc-term-text')) $('fc-term-text').textContent = c.name;
  if ($('fc-back-term')) { $('fc-back-term').textContent = c.name; $('fc-back-term').style.color = c.color; }
  if ($('fc-def-text')) $('fc-def-text').textContent = c.def;
  if ($('fc-pos')) $('fc-pos').textContent = _fcIndex + 1;
  if ($('fc-total')) $('fc-total').textContent = _fcFiltered.length;
  if ($('fc-progress-bar')) $('fc-progress-bar').style.width = ((_fcIndex+1)/_fcFiltered.length*100)+'%';
  if ($('fc-prev')) $('fc-prev').disabled = _fcIndex === 0;
  if ($('fc-next')) $('fc-next').disabled = _fcIndex === _fcFiltered.length-1;
}

function fcFlip() { document.getElementById('fc-card-inner')?.classList.toggle('flipped'); }
function fcNext() { if (_fcIndex < _fcFiltered.length-1) { _fcIndex++; _showFcCard(); } }
function fcPrev() { if (_fcIndex > 0) { _fcIndex--; _showFcCard(); } }

function enterFlashcards() {
  document.getElementById('fc-session').style.display = 'block';
  document.getElementById('fc-list-view').style.display = 'none';
  buildFcDeck();
}
function exitFlashcards() {
  document.getElementById('fc-session').style.display = 'none';
  document.getElementById('fc-list-view').style.display = 'block';
}

// ── REVEAL ANSWERS (practice problems) ───────
function toggleReveal(btn) {
  const card = btn.closest('.problem-card');
  const ans = card.querySelector('.problem-answer');
  const showing = ans.classList.contains('visible');
  ans.classList.toggle('visible', !showing);
  btn.textContent = showing ? 'Show answer' : 'Hide answer';
  btn.classList.toggle('revealed', !showing);
}


// ── PROGRESS TRACKING ────────────────────────
function markVisited(id) {
  if (!/^t[1-5]$/.test(id)) return;
  localStorage.setItem(`ega110-visited-${id}`, '1');
  updateProgress();
}

function updateProgress() {
  const topics = ['t1','t2','t3','t4','t5'];
  const done = topics.filter(id => localStorage.getItem(`ega110-visited-${id}`)).length;
  // mark visited cards on home page
  topics.forEach(id => {
    if (!localStorage.getItem(`ega110-visited-${id}`)) return;
    document.querySelectorAll('.topic-card').forEach(card => {
      if ((card.getAttribute('onclick')||'').includes(`'${id}'`)) card.classList.add('visited');
    });
  });
  // update progress bar
  const fill = document.querySelector('.progress-fill');
  if (fill) fill.style.width = `${(done/topics.length)*100}%`;
  const label = document.querySelector('.progress-label');
  if (label) label.textContent = `${done} of ${topics.length} topics visited`;
}

// ── KEYBOARD SHORTCUTS ───────────────────────
const TOPIC_IDS = ['home','t1','t2','t3','t4','t5','revision','problems','formulas','glossary','traps'];

document.addEventListener('keydown', e => {
  if (document.activeElement.tagName === 'INPUT') return;

  // Flashcard shortcuts take priority when session is active
  const fcActive = document.getElementById('fc-session')?.style.display !== 'none';
  if (fcActive) {
    if (e.key === ' ' || e.key === 'Enter') { e.preventDefault(); fcFlip(); return; }
    if (e.key === 'ArrowRight') { e.preventDefault(); fcNext(); return; }
    if (e.key === 'ArrowLeft') { e.preventDefault(); fcPrev(); return; }
    if (e.key === 'Escape') { exitFlashcards(); return; }
    return;
  }

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
  updateProgress();
});
