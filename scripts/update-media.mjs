#!/usr/bin/env node
// ============================================================
// update-media.mjs
// Ищет новые картинки в gallery/ и новую музыку в music/ и
// дописывает их в gallery/gallery.json и music/playlist.json.
// Новые картинки (jpg/png/webp) оптимизируются в WebP
// (макс. 1920px по длинной стороне, quality 85) через ImageMagick
// (magick/convert), если он доступен. Оригинал удаляется.
// Скрипт идемпотентен: обрабатывает только новые файлы.
// ============================================================

import { readFileSync, writeFileSync, readdirSync, existsSync, rmSync } from 'node:fs';
import { execFileSync } from 'node:child_process';

const GALLERY_DIR = 'gallery';
const MUSIC_DIR = 'music';
const GALLERY_JSON = 'gallery/gallery.json';
const PLAYLIST_JSON = 'music/playlist.json';
const MAX_DIM = 1280;
const WEBP_QUALITY = '85';

const IMG_EXT = /\.(jpe?g|png|webp|gif)$/i;
const AUDIO_EXT = /\.(mp3|ogg|m4a|flac|wav|opus)$/i;
const OPT_EXT = /\.(jpe?g|png|webp)$/i;

function humanize(s) {
    return String(s)
        .replace(/[-_]+/g, ' ')
        .replace(/\b\w/g, c => c.toUpperCase())
        .trim();
}

function splitArtistTitle(filename) {
    const base = filename.replace(/\.[^.]+$/, '');
    const parts = base.split('-');
    if (parts.length >= 2 && parts[0].length > 0) {
        return { artist: humanize(parts[0]), title: humanize(parts.slice(1).join('-')) };
    }
    return { artist: 'Unknown', title: humanize(base) };
}

function optimizeImage(src, target) {
    const args = [src, '-auto-orient', '-strip', '-resize', `${MAX_DIM}x${MAX_DIM}>`, '-quality', WEBP_QUALITY, '-define', 'webp:lossless=false', target];
    try {
        execFileSync('magick', args, { stdio: 'ignore' });
        return true;
    } catch (e) {
        try {
            execFileSync('convert', args, { stdio: 'ignore' });
            return true;
        } catch (e) {
            return false;
        }
    }
}

function readJson(file, fallback) {
    try {
        return JSON.parse(readFileSync(file, 'utf8'));
    } catch (e) {
        return fallback;
    }
}

function main() {
    let galleryChanged = 0;
    let musicChanged = 0;
    const force = process.argv.includes('--all');

    // --- Галерея ---
    const gallery = readJson(GALLERY_JSON, []);
    const gallerySet = new Set(Array.isArray(gallery) ? gallery.map(x => String(x)) : []);
    const galleryFiles = readdirSync(GALLERY_DIR)
        .filter(f => IMG_EXT.test(f))
        .sort();

    const processed = new Map(); // оригинал -> итоговое имя
    for (const file of galleryFiles) {
        let final = file;
        const isNew = !gallerySet.has(file);
        if (OPT_EXT.test(file) && (force || isNew)) {
            const base = file.replace(/\.[^.]+$/, '');
            const target = base + '.webp';
            if (!existsSync(target) && optimizeImage(`${GALLERY_DIR}/${file}`, `${GALLERY_DIR}/${target}`)) {
                rmSync(`${GALLERY_DIR}/${file}`);
                final = target;
            }
        }
        processed.set(file, final);
    }

    const out = [];
    for (const entry of gallery) {
        const orig = String(entry);
        const mapped = processed.get(orig);
        out.push(mapped !== undefined ? mapped : orig);
    }
    for (const file of galleryFiles) {
        const final = processed.get(file);
        if (final && final !== file && !out.includes(final)) out.push(final);
    }
    galleryChanged = out.length - gallery.length;
    if (galleryChanged !== 0 || force) {
        writeFileSync(GALLERY_JSON, JSON.stringify(out, null, 2) + '\n');
    }

    // --- Музыка ---
    const playlist = readJson(PLAYLIST_JSON, { tracks: [] });
    if (!Array.isArray(playlist.tracks)) playlist.tracks = [];
    const knownPaths = new Set(playlist.tracks.map(t => String(t.path)));
    const musicFiles = readdirSync(MUSIC_DIR)
        .filter(f => AUDIO_EXT.test(f))
        .sort();

    for (const file of musicFiles) {
        const rel = `${MUSIC_DIR}/${file}`;
        if (knownPaths.has(rel)) continue;
        const { artist, title } = splitArtistTitle(file);
        playlist.tracks.push({ title, artist, path: rel });
        knownPaths.add(rel);
        musicChanged++;
    }
    if (musicChanged > 0) {
        writeFileSync(PLAYLIST_JSON, JSON.stringify(playlist, null, 2) + '\n');
    }

    console.log(`update-media: gallery +${galleryChanged}, music +${musicChanged}`);
}

main();
