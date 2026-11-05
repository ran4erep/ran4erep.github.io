// ============================================================
// r4Boy: объединение библиотек ромов (локальная + r4gb.pages.dev).
// Перехватывает запросы к "roms/index.json" и подмешивает удалённый
// индекс: сначала ромы с pages.dev, затем локальные (без дубликатов).
// Подключён ДО основного бандла эмулятора.
// ============================================================

(function () {
    'use strict';
    if (!window.fetch) return;

    var origFetch = window.fetch.bind(window);
    var REMOTE = 'https://r4gb.pages.dev';

    function isRomIndex(url) {
        if (typeof url !== 'string') return false;
        return url.indexOf('roms/index.json') !== -1;
    }

    function toRemoteUrl(p) {
        p = String(p).replace(/^\.+\//, '').replace(/^\//, '');
        // На pages.dev содержимое папки roms/ лежит прямо в корне:
        // снимаем префикс "roms/" (и для index.json, и для самих ромов).
        p = p.replace(/^roms\//, '');
        return REMOTE + '/' + p;
    }

    function loadJson(fn) {
        return fn().then(function (res) {
            if (!res.ok) return null;
            return res.json();
        }).catch(function () { return null; });
    }

    window.fetch = function (input, init) {
        var url = typeof input === 'string' ? input : (input && input.url || '');
        if (!isRomIndex(url)) {
            return origFetch(input, init);
        }

        // Локальный индекс — тем же запросом, что и раньше.
        var localP = loadJson(function () { return origFetch(input, init); });

        // Удалённый индекс.
        var remoteUrl = toRemoteUrl(url);
        var remoteP = loadJson(function () {
            return origFetch(remoteUrl, { cache: 'no-cache' });
        });

        return Promise.all([localP, remoteP]).then(function (results) {
            var local = Array.isArray(results[0]) ? results[0] : [];
            var remote = Array.isArray(results[1]) ? results[1] : [];

            // Удалённые записи: превращаем относительные URL в абсолютные.
            remote = remote.map(function (it) {
                var copy = Object.assign({}, it);
                if (copy.url && !/^https?:|^data:/i.test(copy.url)) {
                    copy.url = toRemoteUrl(copy.url);
                }
                if (copy.coverUrl && !/^https?:|^data:/i.test(copy.coverUrl)) {
                    copy.coverUrl = toRemoteUrl(copy.coverUrl);
                }
                return copy;
            });

            // Слияние: сначала pages.dev, потом локальные (без дубликатов).
            var seen = {};
            var out = [];
            [remote, local].forEach(function (list) {
                list.forEach(function (it) {
                    var key = it.filename || it.id || '';
                    if (!seen[key]) { seen[key] = 1; out.push(it); }
                });
            });

            return new Response(JSON.stringify(out), {
                status: 200,
                headers: { 'Content-Type': 'application/json' }
            });
        });
    };
})();
