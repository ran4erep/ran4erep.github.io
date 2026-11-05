// ============================================================
// Cradle of Death — PDF-читалка
//   • Desktop: разворот из двух страниц с переворотом (CSS 3D)
//   • Мобильные: вертикальная прокрутка, ширина = ширине экрана
//   • PDF кэшируется через Cache API (второй заход без сети)
//   • Загрузчик ждёт рендера первых страниц
// ============================================================

import { getDocument, GlobalWorkerOptions } from './libs/pdfjs/pdf.min.mjs';
GlobalWorkerOptions.workerSrc = new URL('./libs/pdfjs/pdf.worker.min.mjs', import.meta.url).href;

const BOOK_PATH = 'Cradle_of_Death.pdf';
const BOOKMARK_KEY = 'cod_bookmark';
const DOUBLE_BP = 880;      // ширина окна, ниже которой — мобильный режим
const CACHE_MAX = 16;       // сколько отрисованных страниц держим в памяти (LRU)
const CACHE_NAME = 'cod-book-v1';

const els = {
    app: document.getElementById('app'),
    stage: document.getElementById('stage'),
    book: document.getElementById('book'),
    mobileReader: document.getElementById('mobileReader'),
    loader: document.getElementById('loader'),
    loadMsg: document.getElementById('loadMsg'),
    pbarFill: document.getElementById('pbarFill'),
};

const state = {
    doc: null,
    numPages: 0,
    aspect: 0.7071,
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
const mobReady = new Set();  // какие мобильные страницы уже отрисованы
let mobIO = null;

/* ================= PDF: загрузка с кэшем ================= */

async function loadPdfData(onProgress) {
    // Сначала пробуем кэш — второй заход открывается без сети.
    if ('caches' in window) {
        try {
            const c = await caches.open(CACHE_NAME);
            const hit = await c.match(BOOK_PATH);
            if (hit) return await hit.arrayBuffer();
        } catch (e) {
            console.warn('pdf cache read failed', e);
        }
    }
    // Нет в кэше — качаем с прогрессом и сохраняем в кэш.
    const resp = await fetch(BOOK_PATH);
    if (!resp.ok) throw new Error('HTTP ' + resp.status);
    const total = parseInt(resp.headers.get('content-length') || '0', 10) || 0;
    const reader = resp.body.getReader();
    const chunks = [];
    let loaded = 0;
    for (;;) {
        const { done, value } = await reader.read();
        if (done) break;
        chunks.push(value);
        loaded += value.length;
        if (onProgress && total) onProgress(Math.round(loaded / total * 100));
    }
    const data = new Uint8Array(loaded);
    let off = 0;
    for (const ch of chunks) { data.set(ch, off); off += ch.length; }
    if ('caches' in window) {
        try {
            const c = await caches.open(CACHE_NAME);
            await c.put(BOOK_PATH, new Response(data, { headers: { 'Content-Type': 'application/pdf' } }));
        } catch (e) {
            console.warn('pdf cache write failed', e);
        }
    }
    return data.buffer;
}

/* ================= Размеры ================= */

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

function screenMode() {
    return window.innerWidth < DOUBLE_BP ? 'single' : 'double';
}

function fit() {
    const w = window.innerWidth;
    const h = window.innerHeight;
    const ar = state.aspect;
    if (state.mode === 'double') {
        // Книга на всю высоту окна: вертикальные отступы убраны полностью,
        // горизонтальные минимальные (чтобы разворот влезал по ширине).
        state.pw = Math.min((w - 16) / 2, h * ar);
        state.ph = state.pw / ar;
        state.pw = Math.max(120, state.pw);
        state.ph = Math.max(160, state.ph);
        els.book.style.setProperty('--pw', state.pw + 'px');
        els.book.style.setProperty('--ph', state.ph + 'px');
        els.book.className = 'book double';
        els.app.classList.remove('single');
    } else {
        // Мобильный режим: ширина страницы = ширина экрана.
        state.pw = w;
        state.ph = state.pw / ar;
        els.app.classList.add('single');
    }
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
    const vpBase = page.getViewport({ scale: 1 });
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const scale = Math.min(3, Math.max(0.5, (state.pw * dpr) / vpBase.width));
    const vp = page.getViewport({ scale });
    const canvas = document.createElement('canvas');
    canvas.width = Math.max(1, Math.round(vp.width));
    canvas.height = Math.max(1, Math.round(vp.height));
    canvas.className = 'page-canvas';
    canvas.dataset.page = String(idx);
    const ctx = canvas.getContext('2d');
    await page.render({ canvasContext: ctx, viewport: vp }).promise;
    cache.set(idx, canvas);
    while (cache.size > CACHE_MAX) {
        const k = cache.keys().next().value;
        cache.delete(k);
    }
    return canvas;
}

async function ensureCanvas(idx) {
    if (idx == null) return;
    await getCanvas(idx);
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

/* ================= Разворо ты (desktop) ================= */

function buildSpreads(n) {
    const s = [];
    for (let i = 0; i < n; i += 2) {
        s.push({ l: i, r: (i + 1 < n) ? i + 1 : null });
    }
    return s;
}

function spreadContaining(page) {
    return state.spreads.findIndex(s => s.l === page || s.r === page);
}

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
    const nextSpread = state.spreads[target + dir];
    const idxs = [cur.l, cur.r, tgt.l, tgt.r];
    if (nextSpread) idxs.push(nextSpread.l, nextSpread.r);
    try { await preload(idxs); } catch (e) { console.error(e); }

    let layer;
    if (dir === 'fwd') {
        paintSlot(els.slots.left, cur.l);
        paintSlot(els.slots.right, tgt.r);
        layer = buildFlip({ hinge: 'left', frontIdx: cur.r, backIdx: tgt.l });
        layer.style.left = state.pw + 'px';
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

function afterNav() {
    state.busy = false;
    saveMark();
    prefetchNear();
    const d = state.pending;
    state.pending = null;
    if (d) setTimeout(() => nav(d), 20);
}

function goSpreadInstant(target) {
    if (state.busy || target === state.spread) return;
    target = Math.max(0, Math.min(state.spreads.length - 1, target));
    state.spread = target;
    const s = state.spreads[target];
    paintSlot(els.slots.left, s.l);
    paintSlot(els.slots.right, s.r);
    saveMark();
    prefetchNear();
}

/* ================= Мобильный режим (скролл) ================= */

function buildMobile() {
    const r = els.mobileReader;
    r.textContent = '';
    r.style.setProperty('--ar', state.aspect);
    for (let i = 0; i < state.numPages; i++) {
        const slot = document.createElement('div');
        slot.className = 'm-page';
        slot.dataset.i = String(i);
        const ph = document.createElement('div');
        ph.className = 'paper-ph';
        slot.appendChild(ph);
        r.appendChild(slot);
    }
    if (mobIO) mobIO.disconnect();
    mobIO = new IntersectionObserver(entries => {
        for (const en of entries) {
            if (en.isIntersecting) {
                const i = parseInt(en.target.dataset.i, 10);
                loadMobPage(i);
                mobIO.unobserve(en.target);
            }
        }
    }, { root: r, rootMargin: '600px 0px', threshold: 0 });
    Array.from(r.children).forEach(slot => mobIO.observe(slot));
}

async function loadMobPage(i) {
    if (mobReady.has(i)) return;
    mobReady.add(i);
    const slot = els.mobileReader.querySelector(`[data-i="${i}"]`);
    if (!slot) return;
    try {
        const cv = await getCanvas(i);
        const ph = slot.querySelector('.paper-ph');
        if (ph) slot.replaceChild(cv, ph);
        else slot.appendChild(cv);
    } catch (e) {
        console.error(e);
    }
}

function scrollToPage(i) {
    const slot = els.mobileReader.querySelector(`[data-i="${i}"]`);
    if (slot) slot.scrollIntoView({ behavior: 'auto' });
}

function scrollToStep(dir) {
    const top = els.mobileReader.scrollTop;
    const slots = els.mobileReader.children;
    let cur = 0;
    for (let i = 0; i < slots.length; i++) {
        if (slots[i].offsetTop + slots[i].offsetHeight > top) { cur = i; break; }
    }
    const np = Math.max(0, Math.min(state.numPages - 1, cur + dir));
    state.page = np;
    scrollToPage(np);
    saveMark();
}

function visibleMobilePage() {
    const top = els.mobileReader.scrollTop;
    const slots = els.mobileReader.children;
    for (let i = 0; i < slots.length; i++) {
        if (slots[i].offsetTop + slots[i].offsetHeight > top) return i;
    }
    return 0;
}

function restoreMobile() {
    const saved = localStorage.getItem(BOOKMARK_KEY + '_s');
    if (saved != null && !Number.isNaN(parseFloat(saved))) {
        els.mobileReader.scrollTop = parseFloat(saved);
    } else if (state.page > 0) {
        setTimeout(() => scrollToPage(state.page), 30);
    }
}

/* ================= Закладка ================= */

function saveMark() {
    try {
        if (state.mode === 'double') {
            localStorage.setItem(BOOKMARK_KEY + '_d', String(state.spread));
        } else {
            localStorage.setItem(BOOKMARK_KEY + '_s', String(els.mobileReader.scrollTop || 0));
        }
    } catch (e) { /* ignore */ }
}

function loadMark(kind) {
    try {
        const v = localStorage.getItem(BOOKMARK_KEY + '_' + kind);
        return v != null ? parseInt(v, 10) : null;
    } catch (e) {
        return null;
    }
}

/* ================= Навигация ================= */

function nav(dir) {
    if (state.mode === 'single') {
        scrollToStep(dir);
        return;
    }
    if (state.busy) { state.pending = dir; return; }
    const t = state.spread + dir;
    if (t < 0 || t >= state.spreads.length) return;
    goToSpread(t, dir < 0 ? 'bwd' : 'fwd');
}

function goStart() {
    if (state.mode === 'single') { state.page = 0; scrollToPage(0); saveMark(); return; }
    goSpreadInstant(0);
}

function goEnd() {
    if (state.mode === 'single') {
        state.page = state.numPages - 1;
        scrollToPage(state.page);
        saveMark();
        return;
    }
    goSpreadInstant(state.spreads.length - 1);
}

/* ================= Предзагрузка ================= */

function prefetchNear() {
    if (state.mode === 'single') {
        // мобильным занимается IntersectionObserver (грузит сильно заранее)
        const base = visibleMobilePage();
        [base + 1, base + 2, base + 3].forEach(i => {
            if (i < state.numPages) loadMobPage(i);
        });
        return;
    }
    const s = state.spreads[state.spread];
    const idxs = [s.l, s.r];
    const nxt = state.spreads[state.spread + 1];
    const nxt2 = state.spreads[state.spread + 2];
    const prv = state.spreads[state.spread - 1];
    if (nxt) idxs.push(nxt.l, nxt.r);
    if (nxt2) idxs.push(nxt2.l, nxt2.r);
    if (prv) idxs.push(prv.l, prv.r);
    preload(idxs);
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
        default:
            handled = false;
    }
    if (handled) e.preventDefault();
}

function onResize() {
    const nm = screenMode();
    if (nm !== state.mode) {
        if (nm === 'double') {
            const cur = state.mode === 'single' ? visibleMobilePage() : (state.page || 0);
            state.mode = 'double';
            state.spreads = buildSpreads(state.numPages);
            state.spread = Math.max(0, spreadContaining(cur));
            cache.clear();
            fit();
            const s = state.spreads[state.spread];
            paintSlot(els.slots.left, s.l);
            paintSlot(els.slots.right, s.r);
            prefetchNear();
        } else {
            const spread = state.spreads[state.spread];
            const cur = spread ? spread.l : 0;
            state.mode = 'single';
            state.page = cur;
            cache.clear();
            fit();
            buildMobile();
            setTimeout(() => scrollToPage(cur), 40);
            showLoader(false);
            prefetchNear();
        }
    } else {
        cache.clear();
        fit();
        if (state.mode === 'double') {
            const s = state.spreads[state.spread];
            paintSlot(els.slots.left, s.l);
            paintSlot(els.slots.right, s.r);
        } else {
            // при изменении ширины перерисовываем видимые
            const cur = visibleMobilePage();
            buildMobile();
            setTimeout(() => scrollToPage(cur), 40);
        }
    }
}

function debounce(fn, ms) {
    let t;
    return (...args) => {
        clearTimeout(t);
        t = setTimeout(() => fn(...args), ms);
    };
}

function bindEvents() {
    window.addEventListener('keydown', onKey);
    window.addEventListener('resize', debounce(onResize, 160));

    // Тапы/свайпы — только в книжном (desktop) режиме.
    let down = null;
    els.stage.addEventListener('pointerdown', e => {
        if (state.mode !== 'double') return;
        down = { x: e.clientX, y: e.clientY, t: Date.now() };
    });
    els.stage.addEventListener('pointerup', e => {
        if (state.mode !== 'double' || !down) return;
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

    // Сохранение позиции при прокрутке на мобильном.
    let scrollTimer;
    els.mobileReader.addEventListener('scroll', () => {
        if (state.mode !== 'single') return;
        clearTimeout(scrollTimer);
        scrollTimer = setTimeout(() => {
            saveMark();
            prefetchNear();
        }, 150);
    });
}

/* ================= Загрузчик ================= */

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
    // Скрываем книгу, пока она не готова, — чтобы не светился шов-сгиб.
    els.book.style.opacity = '0';
    els.mobileReader.style.opacity = '0';

    try {
        fit();

        const data = await loadPdfData(pct => {
            setProgress(pct);
            if (pct < 100) loaderMessage('Загрузка книги… ' + pct + '%');
        });
        loaderMessage('Открытие книги…');

        state.doc = await getDocument({ data }).promise;
        state.numPages = state.doc.numPages;
        const p0 = await state.doc.getPage(1);
        const vp0 = p0.getViewport({ scale: 1 });
        state.aspect = vp0.width / vp0.height;

        state.mode = screenMode();

        if (state.mode === 'double') {
            state.spreads = buildSpreads(state.numPages);
            fit();
            const saved = loadMark('d');
            state.spread = saved != null
                ? Math.max(0, Math.min(state.spreads.length - 1, saved))
                : 0;
            const sp = state.spreads[state.spread];
            // Ждём рендер текущих страниц, чтобы не показывать пустоту.
            await Promise.all([ensureCanvas(sp.l), ensureCanvas(sp.r)]);
            paintSlot(els.slots.left, sp.l);
            paintSlot(els.slots.right, sp.r);
        } else {
            fit();
            buildMobile();
            // Ждём первую страницу и сразу показываем.
            await ensureCanvas(0);
            loadMobPage(0);
            restoreMobile();
        }

        showLoader(false);
        if (state.mode === 'single') els.mobileReader.style.opacity = '1';
        else els.book.style.opacity = '1';
        prefetchNear();
    } catch (err) {
        console.error(err);
        loaderMessage('Не удалось открыть книгу: ' + err.message);
        setProgress(0);
        const spin = els.loader.querySelector('.spinner');
        if (spin) spin.style.display = 'none';
    }
}

init();
