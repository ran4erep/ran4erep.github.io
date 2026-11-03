import { execSync } from 'child_process';
import { readFileSync, writeFileSync, existsSync, statSync, readdirSync } from 'fs';
import { join, relative, sep } from 'path';

const root = process.argv[2] || '.';

/**
 * Получает список всех путей дерева репозитория прямо из git
 * (git ls-tree), не читая содержимое файлов с диска.
 * Это позволяет генерировать pages.json, даже если часть папок
 * не материализована в рабочей копии (sparse-checkout).
 */
function getPathsFromGit() {
    try {
        const out = execSync('git ls-tree -r --name-only HEAD', {
            cwd: root,
            encoding: 'utf8',
            stdio: ['ignore', 'pipe', 'ignore'],
        });
        return out.split('\n').map((s) => s.trim()).filter(Boolean);
    } catch {
        return null;
    }
}

const EXCLUDE_DIRS = new Set([
    '.git',
    'source',
    'node_modules',
    'assets',
    'fonts',
    'icons',
    'gallery',
    'music',
    'libs',
    'libraries',
    'src',
    'dist',
    'build',
]);

const EXCLUDE_SUBSTR = ['codemirror'];

function isExcludedPath(path) {
    const parts = path.split('/');
    const name = parts[0];
    if (name.startsWith('.')) return true;
    if (EXCLUDE_DIRS.has(name)) return true;
    return EXCLUDE_SUBSTR.some((s) => path.includes(s));
}

/** Fallback: сканирование файловой системы (если git недоступен). */
function walk(dir) {
    const found = [];
    let children = [];
    try {
        children = readdirSync(dir);
    } catch {
        return found;
    }
    for (const name of children) {
        const full = join(dir, name);
        let st;
        try {
            st = statSync(full);
        } catch {
            continue;
        }
        if (st.isDirectory()) {
            found.push(...walk(full));
        } else if (name === 'index.html') {
            found.push(full);
        }
    }
    return found;
}

function readTitle(path) {
    try {
        if (!existsSync(path)) return null;
        const html = readFileSync(path, 'utf8');
        const m = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
        return m ? m[1].trim() : null;
    } catch {
        return null;
    }
}

/** Читает старый pages.json, чтобы сохранить title, если файл не скачан. */
function loadOldTitles() {
    try {
        const raw = readFileSync(join(root, 'pages.json'), 'utf8');
        const data = JSON.parse(raw);
        if (Array.isArray(data)) {
            const map = new Map();
            for (const p of data) {
                if (p && typeof p.path === 'string' && typeof p.title === 'string') {
                    map.set(p.path, p.title);
                }
            }
            return map;
        }
    } catch {}
    return new Map();
}

function prettyNameFromPath(path) {
    const dir = path.slice(0, -'index.html'.length).replace(/\/+$/, '');
    const base = dir.split('/').pop() || dir;
    return base
        .replace(/[-_]+/g, ' ')
        .replace(/\b\w/g, (c) => c.toUpperCase());
}

// 1. Собираем список всех index.html
let htmlPaths = [];
const gitPaths = getPathsFromGit();
if (gitPaths) {
    htmlPaths = gitPaths.filter((p) => p.endsWith('/index.html') && !isExcludedPath(p));
} else {
    htmlPaths = walk(root)
        .map((f) => relative(root, f).split(sep).join('/'))
        .filter((p) => !isExcludedPath(p));
}

// 2. Title: локальный файл → старый pages.json → имя папки
const oldTitles = loadOldTitles();

const pages = htmlPaths
    .map((r) => {
        const path = '/' + r.slice(0, -'index.html'.length);
        const title = readTitle(join(root, r)) ?? oldTitles.get(path) ?? prettyNameFromPath(r);
        return { path, title };
    })
    .filter((p) => p.path !== '/')
    .sort((a, b) => a.path.localeCompare(b.path));

writeFileSync(join(root, 'pages.json'), JSON.stringify(pages, null, 2) + '\n');
console.log(`Generated pages.json with ${pages.length} pages`);
