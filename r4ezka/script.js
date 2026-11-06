// ============================================================
// R4ezka — главная страница приложения
//  • скриншоты из images/screenshots/*.jpg
//  • скачивание — всегда свежий APK из последнего релиза GitHub
//  • чейнджлог — релизы с GitHub (REST API)
// ============================================================

(function () {
    'use strict';

    const REPO = 'ran4erep/R4ezka';
    const API = `https://api.github.com/repos/${REPO}/releases`;

    /* ---------- Скриншоты ---------- */
    const shotsContainer = document.getElementById('shots');
    const shotNames = ['1.jpg', '2.jpg', '3.jpg', '4.jpg', '5.jpg'];
    shotNames.forEach(name => {
        const a = document.createElement('a');
        a.className = 'shot';
        a.href = `images/screenshots/${name}`;
        a.addEventListener('click', e => {
            e.preventDefault();
            openViewer(a.href, name);
        });
        const img = document.createElement('img');
        img.src = `images/screenshots/${name}`;
        img.alt = `Скриншот ${name}`;
        img.loading = 'lazy';
        a.appendChild(img);
        shotsContainer.appendChild(a);
    });

    /* ---------- Просмотр ---------- */
    const viewer = document.getElementById('viewer');
    const viewerImg = document.getElementById('viewerImg');

    function openViewer(src, alt) {
        viewerImg.src = src;
        viewerImg.alt = alt || '';
        viewer.hidden = false;
        document.body.style.overflow = 'hidden';
    }

    function closeViewer() {
        viewer.hidden = true;
        viewerImg.src = '';
        document.body.style.overflow = '';
    }

    document.getElementById('viewerClose').addEventListener('click', closeViewer);
    viewer.addEventListener('click', e => { if (e.target === viewer) closeViewer(); });

    /* ---------- Простой markdown для тела релиза ---------- */
    function md(text) {
        let t = String(text || '');
        t = t.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
        // ссылки
        t = t.replace(/\[([^\]]+)\]\((https?:[^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>');
        // заголовки
        t = t.replace(/^###+\s*(.+)$/gm, '<h3>$1</h3>');
        // код-строки
        t = t.replace(/`([^`]+)`/g, '<code>$1</code>');
        // списки
        const lines = t.split('\n');
        const out = [];
        let inList = false;
        for (const line of lines) {
            const m = line.match(/^\s*[-*]\s+(.*)$/);
            if (m) {
                if (!inList) { out.push('<ul>'); inList = true; }
                out.push(`<li>${m[1]}</li>`);
            } else {
                if (inList) { out.push('</ul>'); inList = false; }
                if (line.trim()) out.push(`<p>${line}</p>`);
            }
        }
        if (inList) out.push('</ul>');
        return out.join('');
    }

    /* ---------- Релизы ---------- */
    const changelog = document.getElementById('changelog');
    const downloadBtn = document.getElementById('downloadBtn');
    const downloadLabel = document.getElementById('downloadLabel');

    function setDownload(url, version) {
        downloadBtn.href = url;
        downloadLabel.textContent = 'Скачать APK' + (version ? ' · ' + version : '');
        downloadBtn.setAttribute('download', 'r4ezka.apk');
    }

    async function loadReleases() {
        try {
            const res = await fetch(`${API}?per_page=10`, { headers: { Accept: 'application/vnd.github+json' } });
            if (!res.ok) throw new Error('HTTP ' + res.status);
            const releases = await res.json();
            if (!Array.isArray(releases) || releases.length === 0) throw new Error('empty');

            // Самая свежая версия → кнопка скачивания
            const latest = releases[0];
            const asset = (latest.assets || []).find(a => /\.apk$/i.test(a.name));
            if (asset) setDownload(asset.browser_download_url, latest.tag_name);
            else setDownload(`https://github.com/${REPO}/releases/latest`, latest.tag_name);

            // Чейнджлог
            changelog.textContent = '';
            releases.forEach(rel => {
                const div = document.createElement('div');
                div.className = 'release';

                const head = document.createElement('div');
                head.className = 'release-head';

                const title = document.createElement('div');
                title.className = 'release-title';
                title.textContent = rel.name || rel.tag_name;

                const date = document.createElement('div');
                date.className = 'release-date';
                date.textContent = rel.published_at
                    ? new Date(rel.published_at).toLocaleDateString('ru-RU', { day: '2-digit', month: 'long', year: 'numeric' })
                    : '';

                head.appendChild(title);
                head.appendChild(date);

                const body = document.createElement('div');
                body.className = 'release-body';
                body.innerHTML = md(rel.body);

                div.appendChild(head);
                div.appendChild(body);
                changelog.appendChild(div);
            });
        } catch (e) {
            downloadLabel.textContent = 'Скачать APK';
            downloadBtn.href = `https://github.com/${REPO}/releases/latest`;
            changelog.innerHTML = '<div class="placeholder">Не удалось загрузить чейнджлог.</div>';
        }
    }

    loadReleases();
})();
