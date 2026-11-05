// ============================================================
// Оверлей для главной страницы (без пересборки React-бандла).
// Правит DOM после отрисовки:
//   • убирает часы,
//   • выбор языка — слева, кнопка «Войти» — справа (+ иконка),
//   • блок ближе к верхней границе,
//   • строка поиска по проектам (название/описание) с плавным
//     скроллом к карточке и миганием.
// ============================================================

(function () {
    'use strict';

    var css = [
        '.hub-search {',
        '  appearance: none; -webkit-appearance: none;',
        '  background: #1b2130;',
        '  border: 1px solid #232a3a;',
        '  color: #e8e6e0;',
        '  height: 30px;',
        '  border-radius: 999px;',
        '  padding: 0 12px;',
        '  font-size: 13px;',
        '  font-family: inherit;',
        '  width: min(220px, 32vw);',
        '  min-width: 90px;',
        '  outline: none;',
        '  transition: border-color .15s, box-shadow .15s;',
        '}',
        '.hub-search::placeholder { color: #5b6270; }',
        '.hub-search:focus {',
        '  border-color: #8b5cf6;',
        '  box-shadow: 0 0 0 2px rgba(139, 92, 246, 0.25);',
        '}',
        '@media (max-width: 767px) {',
        '  .hub-search { margin-left: 44px; width: calc(100vw - 140px); max-width: 260px; }',
        '}',
        'main > div.p-4.sm\\:p-8 { padding-top: 6px !important; }',
        '@keyframes hubFlash {',
        '  0% { box-shadow: 0 0 0 0 rgba(139, 92, 246, 0); }',
        '  35% { box-shadow: 0 0 0 4px rgba(139, 92, 246, 0.85); }',
        '  100% { box-shadow: 0 0 0 0 rgba(139, 92, 246, 0); }',
        '}',
        '.hub-flash { animation: hubFlash 1.2s ease-out 2; border-radius: 10px; }'
    ].join('\n');

    function injectCss() {
        var style = document.createElement('style');
        style.textContent = css;
        document.head.appendChild(style);
    }

    function qsa(sel, root) {
        return Array.prototype.slice.call((root || document).querySelectorAll(sel));
    }

    function debounce(fn, ms) {
        var t;
        return function () {
            var args = arguments;
            clearTimeout(t);
            t = setTimeout(function () { fn.apply(null, args); }, ms);
        };
    }

    /* ---------------- Поиск по проектам ---------------- */

    function clearFlashes() {
        qsa('.hub-flash').forEach(function (el) { el.classList.remove('hub-flash'); });
    }

    function runSearch(query) {
        query = (query || '').trim().toLowerCase();
        clearFlashes();
        if (!query) return;

        var cards = qsa('#root main .group').filter(function (el) {
            return el.querySelector('h3') && el.querySelector('p');
        });

        var best = null;
        var bestScore = 0;
        cards.forEach(function (card) {
            var title = ((card.querySelector('h3').textContent || '')).toLowerCase();
            var desc = ((card.querySelector('p').textContent || '')).toLowerCase();
            var score = 0;
            if (title.indexOf(query) !== -1) score += 10;
            if (desc.indexOf(query) !== -1) score += 5;
            if (score > bestScore) { bestScore = score; best = card; }
        });

        if (!best) return;
        best.scrollIntoView({ behavior: 'smooth', block: 'center' });
        best.classList.add('hub-flash');
        setTimeout(function () { best.classList.remove('hub-flash'); }, 2600);
    }

    function makeSearchInput() {
        var input = document.createElement('input');
        input.type = 'text';
        input.className = 'hub-search';
        input.placeholder = 'Поиск проектов…';
        input.setAttribute('aria-label', 'Поиск проектов');
        input.addEventListener('input', debounce(function () { runSearch(input.value); }, 220));
        input.addEventListener('keydown', function (e) {
            if (e.key === 'Enter') { e.preventDefault(); runSearch(input.value); }
        });
        return input;
    }

    /* ---------------- Шапка ---------------- */

    function isClockDiv(el) {
        if (el.tagName !== 'DIV') return false;
        var text = (el.textContent || '').trim();
        if (!/^\d{1,2}:\d{2}$/.test(text)) return false;
        // часы — это блок с классом hidden + sm:flex (скрывается на мобильных)
        var cls = (el.className || '').split(/\s+/);
        if (cls.indexOf('hidden') !== -1) return true;
        // запасной вариант: пустой див только с текстом времени
        return el.children.length === 0;
    }

    function findHeaderContext() {
        var main = document.querySelector('#root main');
        if (!main) return null;
        var header = main.querySelector('header');
        if (!header) return null;
        var row = header.firstElementChild;
        if (!row || !row.classList.contains('flex')) return null;
        return { header: header, row: row };
    }

    function reconcileHeader() {
        var ctx = findHeaderContext();
        if (!ctx) return;
        var header = ctx.header;
        var row = ctx.row;

        // Блок ближе к верхней границе экрана.
        var wrap = header.parentElement;
        var main = document.querySelector('#root main');
        if (wrap && wrap !== main) wrap.style.paddingTop = '6px';

        // Убираем часы.
        Array.prototype.slice.call(row.children).forEach(function (child) {
            if (isClockDiv(child)) child.remove();
        });

        // Блок выбора языка (две кнопки с флагами RU/US).
        var langBlock = null;
        Array.prototype.slice.call(row.children).forEach(function (child) {
            if (!langBlock && child.tagName === 'DIV' &&
                child.querySelectorAll('img[alt="RU"], img[alt="US"]').length === 2) {
                langBlock = child;
            }
        });

        // Кнопка входа (или аккаунта).
        var btn = qsa('button', row).filter(function (b) {
            return b.getAttribute('aria-label') === 'auth_login_submit' ||
                /Войти|Sign in|Увійти/i.test(b.textContent || '');
        })[0] || null;

        // Строка поиска слева.
        var search = row.querySelector('.hub-search');
        if (!search) {
            search = makeSearchInput();
            row.insertBefore(search, row.firstChild);
        }

        // Порядок: [поиск, язык] слева, кнопка справа.
        if (langBlock) {
            row.insertBefore(langBlock, btn || null);
        }
        row.style.justifyContent = 'space-between';
        row.style.gap = '10px';

        // Иконка на кнопке входа (как в боковом меню).
        if (btn && !btn.querySelector('svg')) {
            var svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
            svg.setAttribute('viewBox', '0 0 24 24');
            svg.setAttribute('width', '18');
            svg.setAttribute('height', '18');
            svg.setAttribute('fill', 'none');
            svg.setAttribute('stroke', 'currentColor');
            svg.setAttribute('stroke-width', '2');
            svg.setAttribute('stroke-linecap', 'round');
            svg.setAttribute('stroke-linejoin', 'round');
            svg.innerHTML = '<path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"/>' +
                '<polyline points="10 17 15 12 10 7"/><line x1="15" y1="12" x2="3" y2="12"/>';
            btn.insertBefore(svg, btn.firstChild);
            btn.style.gap = '6px';
        }
    }

    /* ---------------- Наблюдение за DOM ---------------- */

    function startObserver() {
        var root = document.getElementById('root');
        if (!root) return;
        var scheduled = false;
        var mo = new MutationObserver(function () {
            if (scheduled) return;
            scheduled = true;
            requestAnimationFrame(function () {
                scheduled = false;
                try { reconcileHeader(); } catch (e) { /* ignore */ }
            });
        });
        mo.observe(root, { childList: true, subtree: true });
    }

    // Резервная проверка: применяем, даже если MutationObserver пропустил
    // первичную отрисовку (например, очень быстрый рендер).
    function startPolling() {
        var tries = 0;
        var timer = setInterval(function () {
            tries++;
            try { reconcileHeader(); } catch (e) { /* ignore */ }
            if (tries >= 60) clearInterval(timer); // ~30 секунд
        }, 500);
    }

    injectCss();
    startObserver();
    startPolling();
    try { reconcileHeader(); } catch (e) { /* ignore */ }
})();
