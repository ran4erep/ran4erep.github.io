import { readdirSync, statSync, readFileSync, writeFileSync } from 'fs';
import { join, relative, sep } from 'path';

const root = process.argv[2] || '.';

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
    'build'
]);

const EXCLUDE_SUBSTR = ['codemirror'];

function isExcludedDir(name, fullPath) {
    if (name.startsWith('.')) return true;
    if (EXCLUDE_DIRS.has(name)) return true;
    return EXCLUDE_SUBSTR.some(s => fullPath.includes(s));
}

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
            if (isExcludedDir(name, full)) continue;
            found.push(...walk(full));
        } else if (name === 'index.html') {
            found.push(full);
        }
    }
    return found;
}

const rel = (f) => relative(root, f).split(sep).join('/');

const pages = walk(root)
    .map((f) => {
        const r = rel(f);
        const path = '/' + r.slice(0, -'index.html'.length);
        let title = '';
        try {
            const html = readFileSync(f, 'utf8');
            const m = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
            if (m) title = m[1].trim();
        } catch {}
        return { path, title };
    })
    .filter((p) => p.path !== '/')
    .sort((a, b) => a.path.localeCompare(b.path));

writeFileSync(join(root, 'pages.json'), JSON.stringify(pages, null, 2) + '\n');
console.log(`Generated pages.json with ${pages.length} pages`);
