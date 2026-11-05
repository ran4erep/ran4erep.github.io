// ============================================================
// Cradle of Death — PDF-читалка с переворотом страниц
//   • PDF.js рендерит страницы в canvas
//   • Десктоп: разворот из двух страниц
//   • Мобильные: одна страница
//   • Переворот — на CSS 3D (без внешних библиотек)
// ============================================================

import { getDocument, GlobalWorkerOptions } from './libs/pdfjs/pdf.min.mjs';
GlobalWorkerOptions.workerSrc = new URL('./libs/pdfjs/pdf.worker.min.mjs', import.meta.url).href;

const BOOK_PATH = 'Cradle_of_Death.pdf';
const BOOKMARK_KEY = 'cod_bookmark';
const DOUBLE_BP = 880;      // ширина окна, ниже которой — одна страница
const CACHE_MAX = 10;       // сколько отрисованных страниц держим в памяти

const els = {
    app: document.getElementById('app'),
    stage: document.getElementById('stage'),
    book: document.getElementById('book'),
    topbar: document.getElementById('topbar'),
    prevBtn: document.getElementById('prevBtn'),
    nextBtn: document.getElementById('nextBtn'),
    pageInfo: document.getElementById('pageInfo'),
    jump: document.getElementById('jump'),
    fsBtn: document.getElementById('fsBtn'),
    loader: document.getElementById('loader'),
    loadMsg: document.getElementById('loadMsg'),
    pbarFill: document.getElementById('pbarFill'),
    hint: document.getElementById('hint'),
};

const state = {
    doc: null,
    numPages: 0,
    aspect: 0.7071,          // w/h, уточняется после открытия PDF
    mode: 'double',
    spreads: [],
    spread: 0,
    page: 0,
    busy: false,
    pending: null,
    pw: 0,
    ph: 0,
};

const cache = new Map();     // индекс страницы -> canvas

/* ================= Разметка книги ================= */

function buildSlots() {
    els.book.innerHTML =
        '<div class="slot left"></div>' +
        '<div class="slot right"></div>' +
        '<div class="slot single"></div>';
    els.slots = {
        left: els.book.querySelector('.slot.left'),
        right: els.book.querySelector('.slot.right'),
        single: els.book.querySelector('.slot.single'),
    };
}

/* ================= Размеры ================= */

function screenMode() {
    return window.innerWidth < DOUBLE_BP ? 'single' : 'double';
}

function fit() {
    const w = window.innerWidth;
    const topH = els.topbar ? els.topbar.offsetHeight : 0;
    const h = window.innerHeight - topH;
    const ar = state.aspect;
    const m = 40;
    let pw, ph;
    if (state.mode === 'double') {
        pw = Math.min((w - m - 14) / 2, (h - m) * ar);
        ph = pw / ar;
    } else {
        pw = Math.min(w - 28, (h - m) * ar);
        ph = pw / ar;
    }
    pw = Math.max(120, pw);
    ph = Math.max(160, ph);
    state.pw = pw;
    state.ph = ph;
    els.book.style.setProperty('--pw', pw + 'px');
    els.book.style.setProperty('--ph', ph + 'px');
    els.book.className = 'book ' + state.mode;
}

/* ================= Рендер страниц ================= */

function makeBlank() {
    const d = document.createElement('div');
    d.className = 'blank';
    return d;
}

async function getCanvas(idx) {
    if (cache.has(idx)) return cache.get(idx);
    const page = await state.doc.getPage(idx + 1);
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const scale = Math.min(3, Math.max(0.5, (state.pw * dpr) / page.viewport.width));
    const vp = page.getViewport({ scale });
    const canvas = document.createElement('canvas');
    canvas.width = Math.max(1, Math.round(vp.width));
    canvas.height = Math.max(1, Math.round(vp.height));
    const ctx = canvas.getContext('2d');
    await page.render({ canvasContext: ctx, viewport: vp }).promise;
    canvas.className = 'page-canvas';
    cache.set(idx, canvas);
    while (cache.size > CACHE_MAX) {
        const k = cache.keys().next().value;
        cache.delete(k);
    }
    return canvas;
}

function faceCanvasSync(face, idx) {
    if (idx == null) { face.appendChild(makeBlank()); return; }
    const c = cache.get(idx);
    if (c) { face.appendChild(c); return; }
    const ph = document.createElement('div');
    ph.className = 'paper-ph';
    face.appendChild(ph);
    getCanvas(idx).then(canvas => {
        if (face.contains(ph)) { face.removeChild(ph); face.appendChild(canvas); }
    }).catch(err => console.error(err));
}

function paintSlot(slot, idx) {
    slot.textContent = '';
    if (idx == null) { slot.appendChild(makeBlank()); return; }
    const c = cache.get(idx);
    if (c) { slot.appendChild(c); return; }
    const ph = document.createElement('div');
    ph.className = 'paper-ph';
    slot.appendChild(ph);
    getCanvas(idx).then(canvas => {
        if (slot.contains(ph)) { slot.removeChild(ph); slot.appendChild(canvas); }
    }).catch(err => console.error(err));
}

function preload(idxs) {
    const valid = idxs.filter(i => i != null && i >= 0 && i < state.numPages);
    if (!valid.length) return Promise.resolve();
    return Promise.all(valid.map(getCanvas)).catch(err => console.error(err));
}

/* ================= Разворо ты ================= */

function buildSpreads(n) {
    const s = [];
    if (n >= 1) s.push({ l: null, r: 0 });   // передняя обложка одна
    let i = 1;
    while (i < n) {
        s.push({ l: i, r: (i + 1 < n) ? i + 1 : null });
        i += 2;
    }
    return s;
}

function spreadContaining(page) {
    return state.spreads.findIndex(s => s.l === page || s.r === page);
}

/* ================= Переворот ================= */

function buildFlip({ hinge, frontIdx, backIdx }) {
    const layer = document.createElement('div');
    layer.className = 'flip ' + (hinge === 'left' ? 'fwd' : 'bwd');
    const front = document.createElement('div');
    front.className = 'face front';
    const back = document.createElement('div');
    back.className = 'face back';
    faceCanvasSync(front, frontIdx);
    faceCanvasSync(back, backIdx);
    const curl = document.createElement('div');
    curl.className = 'curl';
    layer.append(curl, front, back);
    return layer;
}

function animateFlip(layer, onDone) {
    let done = false;
    const finish = () => {
        if (done) return;
        done = true;
        layer.removeEventListener('animationend', handler);
        onDone();
    };
    const handler = (e) => {
        if (e.target === layer) finish();
    };
    layer.addEventListener('animationend', handler);
    setTimeout(finish, 900);
    requestAnimationFrame(() => requestAnimationFrame(() => layer.classList.add('go')));
}

async function goToSpread(target, dir) {
    if (state.busy || target === state.spread) return;
    if (target < 0 || target >= state.spreads.length) return;
    state.busy = true;

    const cur = state.spreads[state.spread];
    const tgt = state.spreads[target];
    const idxs = [cur.l, cur.r, tgt.l, tgt.r];
    try { await preload(idxs); } catch (e) { console.error(e); }

    let layer;
    if (dir === 'fwd') {
        paintSlot(els.slots.left, cur.l);
        paintSlot(els.slots.right, tgt.r);
        layer = buildFlip({ hinge: 'left', frontIdx: cur.r, backIdx: tgt.l });
        layer.style.left = (state.pw + 6) + 'px';
    } else {
        paintSlot(els.slots.left, tgt.l);
        paintSlot(els.slots.right, cur.r);
        layer = buildFlip({ hinge: 'right', frontIdx: cur.l, backIdx: tgt.r });
        layer.style.left = '0px';
    }

    els.book.appendChild(layer);
    animateFlip(layer, () => {
        layer.remove();
        paintSlot(els.slots.left, tgt.l);
        paintSlot(els.slots.right, tgt.r);
        state.spread = target;
        afterNav();
    });
}

async function goToPage(target, dir) {
    if (state.busy || target === state.page) return;
    if (target < 0 || target >= state.numPages) return;
    state.busy = true;

    const idxs = [state.page, target, dir === 'fwd' ? state.page + 1 : state.page - 1];
    try { await preload(idxs); } catch (e) { console.error(e); }

    const hinge = dir === 'fwd' ? 'left' : 'right';
    paintSlot(els.slots.single, target);
    const layer = buildFlip({ hinge, frontIdx: state.page, backIdx: target });
    layer.style.left = '0px';
    els.book.appendChild(layer);
    animateFlip(layer, () => {
        layer.remove();
        paintSlot(els.slots.single, target);
        state.page = target;
        afterNav();
    });
}

function afterNav() {
    state.busy = false;
    saveMark();
    updateUI();
    prefetchNear();
    const d = state.pending;
    state.pending = null;
    if (d) setTimeout(() => nav(d), 20);
}

/* ================= Навигация ================= */

function nav(dir) {
    if (state.busy) { state.pending = dir; return; }
    if (state.mode === 'double') {
        const t = state.spread + dir;
        if (t < 0 || t >= state.spreads.length) return;
        goToSpread(t, dir < 0 ? 'bwd' : 'fwd');
    } else {
        const t = state.page + dir;
        if (t < 0 || t >= state.numPages) return;
        goToPage(t, dir < 0 ? 'bwd' : 'fwd');
    }
}

function goStart() {
    if (state.mode === 'double') goSpreadInstant(0);
    else goPageInstant(0);
}

function goEnd() {
    if (state.mode === 'double') goSpreadInstant(state.spreads.length - 1);
    else goPageInstant(state.numPages - 1);
}

function goSpreadInstant(target) {
    if (state.busy || target === state.spread) return;
    target = Math.max(0, Math.min(state.spreads.length - 1, target));
    state.spread = target;
    const s = state.spreads[target];
    paintSlot(els.slots.left, s.l);
    paintSlot(els.slots.right, s.r);
    saveMark();
    updateUI();
    prefetchNear();
}

function goPageInstant(target) {
    if (state.busy) return;
    target = Math.max(0, Math.min(state.numPages - 1, target));
    state.page = target;
    paintSlot(els.slots.single, target);
    saveMark();
    updateUI();
    prefetchNear();
}

/* ================= UI ================= */

function populateJump() {
    els.jump.textContent = '';
    for (let i = 0; i < state.numPages; i++) {
        const opt = document.createElement('option');
        opt.value = i;
        opt.textContent = 'Стр. ' + (i + 1);
        els.jump.appendChild(opt);
    }
}

function updateUI() {
    const n = state.numPages;
    if (state.mode === 'double') {
        const s = state.spreads[state.spread];
        const parts = [];
        if (s.l != null) parts.push(s.l + 1);
        if (s.r != null) parts.push(s.r + 1);
        els.pageInfo.textContent = parts.length ? 'стр. ' + parts.join('–') : '—';
        els.prevBtn.disabled = state.spread <= 0;
        els.nextBtn.disabled = state.spread >= state.spreads.length - 1;
        if (s.l != null) els.jump.value = String(s.l);
        else if (s.r != null) els.jump.value = String(s.r);
    } else {
        els.pageInfo.textContent = 'стр. ' + (state.page + 1) + ' / ' + n;
        els.prevBtn.disabled = state.page <= 0;
        els.nextBtn.disabled = state.page >= n - 1;
        els.jump.value = String(state.page);
    }
}

function prefetchNear() {
    if (state.mode === 'double') {
        const s = state.spreads[state.spread];
        const idxs = [s.l, s.r];
        const nxt = state.spreads[state.spread + 1];
        const prv = state.spreads[state.spread - 1];
        if (nxt) idxs.push(nxt.l, nxt.r);
        if (prv) idxs.push(prv.l, prv.r);
        preload(idxs);
    } else {
        preload([state.page - 1, state.page, state.page + 1]);
    }
}

/* ================= Закладка ================= */

function saveMark() {
    try {
        localStorage.setItem(BOOKMARK_KEY + '_' + state.mode,
            JSON.stringify({ s: state.spread, p: state.page }));
    } catch (e) { /* ignore */ }
}

function loadMark() {
    try {
        const raw = localStorage.getItem(BOOKMARK_KEY + '_' + state.mode);
        return raw ? JSON.parse(raw) : null;
    } catch (e) {
        return null;
    }
}

/* ================= События ================= */

function onKey(e) {
    let handled = true;
    switch (e.key) {
        case 'ArrowRight':
        case 'PageDown': nav(1); break;
        case 'ArrowLeft':
        case 'PageUp': nav(-1); break;
        case ' ':
            e.preventDefault();
            nav(e.shiftKey ? -1 : 1);
            break;
        case 'Home': goStart(); break;
        case 'End': goEnd(); break;
        case 'f':
        case 'F':
            toggleFs();
            break;
        default:
            handled = false;
    }
    if (handled) e.preventDefault();
}

function toggleFs() {
    if (!document.fullscreenEnabled) return;
    if (document.fullscreenElement) {
        document.exitFullscreen().catch(() => {});
    } else {
        els.app.requestFullscreen().catch(() => {});
    }
}

function onResize() {
    const nm = screenMode();
    if (nm !== state.mode) {
        if (nm === 'double') {
            state.spread = Math.max(0, spreadContaining(state.page));
        } else {
            const s = state.spreads[state.spread];
            state.page = s && s.r != null ? s.r : (s ? s.l : 0);
            if (state.page == null) state.page = 0;
        }
        state.mode = nm;
    }
    cache.clear();
    fit();
    if (state.mode === 'double') {
        const s = state.spreads[state.spread];
        paintSlot(els.slots.left, s.l);
        paintSlot(els.slots.right, s.r);
    } else {
        paintSlot(els.slots.single, state.page);
    }
    updateUI();
}

function debounce(fn, ms) {
    let t;
    return (...args) => {
        clearTimeout(t);
        t = setTimeout(() => fn(...args), ms);
    };
}

function bindEvents() {
    els.prevBtn.addEventListener('click', () => nav(-1));
    els.nextBtn.addEventListener('click', () => nav(1));
    els.jump.addEventListener('change', () => {
        const p = parseInt(els.jump.value, 10);
        if (Number.isNaN(p)) return;
        if (state.mode === 'double') goSpreadInstant(spreadContaining(p));
        else goPageInstant(p);
    });
    els.fsBtn.addEventListener('click', toggleFs);
    window.addEventListener('keydown', onKey);
    window.addEventListener('resize', debounce(onResize, 160));

    let down = null;
    els.stage.addEventListener('pointerdown', e => {
        down = { x: e.clientX, y: e.clientY, t: Date.now() };
    });
    els.stage.addEventListener('pointerup', e => {
        if (!down) return;
        const dx = e.clientX - down.x;
        const dy = e.clientY - down.y;
        const dist = Math.hypot(dx, dy);
        const dt = Date.now() - down.t;
        down = null;
        if (dist > 45 && Math.abs(dx) > Math.abs(dy)) {
            nav(dx < 0 ? 1 : -1);
        } else if (dist < 20 || dt < 250) {
            const w = els.stage.clientWidth;
            if (e.clientX > w * 0.68) nav(1);
            else if (e.clientX < w * 0.32) nav(-1);
        }
    });
    els.stage.addEventListener('pointercancel', () => { down = null; });
}

/* ================= Загрузка ================= */

function showLoader(show) {
    els.loader.classList.toggle('hide', !show);
}

function setProgress(pct) {
    els.pbarFill.style.width = pct + '%';
}

function loaderMessage(text) {
    els.loadMsg.textContent = text;
}

/* ================= Инициализация ================= */

async function init() {
    buildSlots();
    bindEvents();
    showLoader(true);

    try {
        fit();

        const task = getDocument(BOOK_PATH);
        task.onProgress = ev => {
            const pct = ev.total ? Math.round((ev.loaded / ev.total) * 100) : 0;
            setProgress(pct);
            if (pct < 100) loaderMessage('Загрузка книги… ' + pct + '%');
        };

        state.doc = await task.promise;
        state.numPages = state.doc.numPages;
        const p0 = await state.doc.getPage(1);
        const vp0 = p0.getViewport({ scale: 1 });
        state.aspect = vp0.width / vp0.height;
        state.mode = screenMode();
        state.spreads = buildSpreads(state.numPages);
        populateJump();
        fit();

        const mark = loadMark();
        if (state.mode === 'double') {
            const s = mark && mark.s != null ? mark.s : 0;
            state.spread = Math.max(0, Math.min(state.spreads.length - 1, s));
            const sp = state.spreads[state.spread];
            paintSlot(els.slots.left, sp.l);
            paintSlot(els.slots.right, sp.r);
        } else {
            const p = mark && mark.p != null ? mark.p : 0;
            state.page = Math.max(0, Math.min(state.numPages - 1, p));
            paintSlot(els.slots.single, state.page);
        }

        updateUI();
        showLoader(false);
        prefetchNear();

        setTimeout(() => els.hint.classList.add('show'), 500);
        setTimeout(() => els.hint.classList.remove('show'), 7000);
    } catch (err) {
        console.error(err);
        loaderMessage('Не удалось открыть книгу: ' + err.message);
        setProgress(0);
        const spin = els.loader.querySelector('.spinner');
        if (spin) spin.style.display = 'none';
    }
}

init();
