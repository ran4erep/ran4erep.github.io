#!/usr/bin/env node
// Подсчёт зарегистрированных пользователей r4ezka и запись в users-count.json.
// Использует сервис-аккаунт Firebase (обходит правила RTDB) + REST shallow=true.
// Никаких внешних зависимостей не требуется (Node 18+).

import { createSign } from 'node:crypto';
import { writeFileSync } from 'node:fs';

const DB_URL = process.env.FIREBASE_DATABASE_URL || 'https://r4ezka-default-rtdb.europe-west1.firebasedatabase.app';
const SERVICE_ACCOUNT_RAW = process.env.FIREBASE_SERVICE_ACCOUNT;
const OUT_FILE = 'users-count.json';

if (!SERVICE_ACCOUNT_RAW) {
    console.error('FIREBASE_SERVICE_ACCOUNT не задан');
    process.exit(1);
}

let sa;
try {
    sa = JSON.parse(SERVICE_ACCOUNT_RAW);
} catch (e) {
    console.error('FIREBASE_SERVICE_ACCOUNT: невалидный JSON');
    process.exit(1);
}

const b64url = (buf) => Buffer.from(buf).toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');

function makeJwt() {
    const now = Math.floor(Date.now() / 1000);
    const header = { alg: 'RS256', typ: 'JWT' };
    const payload = {
        iss: sa.client_email,
        scope: 'https://www.googleapis.com/auth/firebase.database',
        aud: 'https://oauth2.googleapis.com/token',
        iat: now,
        exp: now + 3600,
    };
    const input = b64url(JSON.stringify(header)) + '.' + b64url(JSON.stringify(payload));
    const sign = createSign('RSA-SHA256');
    sign.update(input);
    return input + '.' + b64url(sign.sign(sa.private_key));
}

async function getAccessToken() {
    const res = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
            grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
            assertion: makeJwt(),
        }),
    });
    if (!res.ok) throw new Error('OAuth token: HTTP ' + res.status + ' ' + await res.text());
    const data = await res.json();
    if (!data.access_token) throw new Error('OAuth token: нет access_token');
    return data.access_token;
}

async function main() {
    const token = await getAccessToken();
    const res = await fetch(`${DB_URL}/users.json?shallow=true`, {
        headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) {
        console.error('Чтение users: HTTP ' + res.status + ' ' + await res.text());
        process.exit(1);
    }
    const data = await res.json();
    const count = data && typeof data === 'object' ? Object.keys(data).length : 0;
    const out = { count, updatedAt: new Date().toISOString() };
    writeFileSync(OUT_FILE, JSON.stringify(out, null, 2) + '\n');
    console.log(`users-count.json обновлён: ${count}`);
}

main().catch((err) => { console.error(err); process.exit(1); });
