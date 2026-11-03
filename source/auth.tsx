
import React, { createContext, useContext, useState, useCallback, useMemo } from 'react';
import type { AuthUser, AuthContextType } from './types';

const DATABASE_URL = 'https://r4ezka-default-rtdb.europe-west1.firebasedatabase.app';
const SESSION_KEY = 'r4ezka_session';

// Internal error codes. The UI maps them to translated messages.
export const AUTH_ERR = {
    FILL: 'fill',
    NOT_FOUND: 'notFound',
    WRONG_PASSWORD: 'wrongPassword',
    NETWORK: 'network',
    CORRUPTED: 'corrupted',
} as const;

/**
 * SHA-256 (lowercase hex) via WebCrypto.
 * Requires a secure context (https or localhost) — true on GitHub Pages and vite dev.
 */
async function sha256Hex(input: string): Promise<string> {
    if (typeof crypto === 'undefined' || !crypto.subtle) {
        throw new Error(AUTH_ERR.NETWORK);
    }
    const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(input));
    return Array.from(new Uint8Array(digest))
        .map(b => b.toString(16).padStart(2, '0'))
        .join('');
}

function normalizeLogin(username: string): string {
    return username.trim().toLowerCase();
}

/** Legacy public key (same as the old app): SHA-256(trimmed lowercased username). */
export function generateUserKey(username: string): Promise<string> {
    return sha256Hex(normalizeLogin(username));
}

/**
 * New secret capability key: SHA-256(login + ":" + password).
 * Only the account owner can compute it, so knowing the login alone is useless.
 */
export function generateSecretKey(username: string, password: string): Promise<string> {
    return sha256Hex(`${normalizeLogin(username)}:${password}`);
}

/** Same hash scheme as the R4ezka app: SHA-256(salt + ":" + password). */
export function hashPassword(password: string, salt: string): Promise<string> {
    return sha256Hex(`${salt}:${password}`);
}

/** Constant-time string comparison to avoid trivial timing side channels. */
function constantTimeEqual(a: string, b: string): boolean {
    if (a.length !== b.length) return false;
    let diff = 0;
    for (let i = 0; i < a.length; i++) {
        diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
    }
    return diff === 0;
}

async function getJson(url: string): Promise<any> {
    let res: Response;
    try {
        res = await fetch(url, { cache: 'no-store' });
    } catch {
        throw new Error(AUTH_ERR.NETWORK);
    }
    if (!res.ok) {
        throw new Error(AUTH_ERR.NETWORK);
    }
    const text = (await res.text()).trim();
    if (text === '' || text === 'null') return null;
    try {
        return JSON.parse(text);
    } catch {
        throw new Error(AUTH_ERR.NETWORK);
    }
}

/**
 * Only allow avatar sources that cannot execute script: https(s) images or
 * inline data: URIs of raster image types. Everything else renders a placeholder.
 */
export function safeAvatar(value: string | null | undefined): string | null {
    if (!value) return null;
    if (/^https?:\/\//i.test(value)) return value;
    if (/^data:image\/(?:png|jpe?g|webp|gif|bmp);base64,/i.test(value)) return value;
    return null;
}

interface ParsedSession {
    username: string;
    key: string;
    legacyKey?: string;
    avatar?: string | null;
    registeredAt?: number;
}

function loadSession(): AuthUser | null {
    try {
        const raw = localStorage.getItem(SESSION_KEY);
        if (!raw) return null;
        const parsed = JSON.parse(raw);
        if (
            parsed &&
            typeof parsed.username === 'string' &&
            typeof parsed.key === 'string' &&
            /^[0-9a-f]{64}$/.test(parsed.key)
        ) {
            return {
                username: parsed.username,
                key: parsed.key,
                legacyKey: typeof parsed.legacyKey === 'string' && /^[0-9a-f]{64}$/.test(parsed.legacyKey) ? parsed.legacyKey : undefined,
                avatar: safeAvatar(parsed.avatar),
                registeredAt: typeof parsed.registeredAt === 'number' ? parsed.registeredAt : undefined,
            };
        }
        return null;
    } catch {
        return null;
    }
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [user, setUser] = useState<AuthUser | null>(loadSession);
    const [loginOpen, setLoginOpen] = useState(false);

    const openLogin = useCallback(() => setLoginOpen(true), []);
    const closeLogin = useCallback(() => setLoginOpen(false), []);

    const login = useCallback(async (username: string, password: string): Promise<void> => {
        const cleanName = username.trim();
        if (!cleanName || !password) {
            throw new Error(AUTH_ERR.FILL);
        }

        const legacyKey = await generateUserKey(cleanName);
        const secretKey = await generateSecretKey(cleanName, password);

        // 1. Try the new (secret) scheme first — fast path for migrated users.
        let profile: any = null;
        try {
            profile = await getJson(`${DATABASE_URL}/users/${secretKey}/private/profile.json`);
        } catch (e) {
            throw e;
        }
        if (profile && typeof profile === 'object') {
            const storedHash = profile.passwordHash;
            const storedSalt = profile.salt;
            const realUsername = typeof profile.username === 'string' && profile.username.trim() ? profile.username : cleanName;
            if (
                typeof storedHash !== 'string' || storedHash.length !== 64 ||
                typeof storedSalt !== 'string' || storedSalt.length !== 32
            ) {
                throw new Error(AUTH_ERR.CORRUPTED);
            }
            const computedHash = await hashPassword(password, storedSalt);
            if (!constantTimeEqual(computedHash, storedHash)) {
                throw new Error(AUTH_ERR.WRONG_PASSWORD);
            }

            let avatar: string | null = null;
            try {
                avatar = safeAvatar(await getJson(`${DATABASE_URL}/users/${secretKey}/private/avatar.json`));
            } catch {
                // Avatar is optional.
            }

            const session: ParsedSession = {
                username: realUsername,
                key: secretKey,
                avatar,
                registeredAt: typeof profile.registeredAt === 'number' ? profile.registeredAt : undefined,
            };
            try {
                localStorage.setItem(SESSION_KEY, JSON.stringify(session));
            } catch {
                // ignore
            }
            setUser(session);
            setLoginOpen(false);
            return;
        }

        // 2. Fallback: legacy scheme (users that have not migrated yet).
        let legacyProfile: any = null;
        try {
            legacyProfile = await getJson(`${DATABASE_URL}/users/${legacyKey}/profile.json`);
        } catch (e) {
            throw e;
        }
        if (!legacyProfile || typeof legacyProfile !== 'object') {
            throw new Error(AUTH_ERR.NOT_FOUND);
        }

        const storedHash = legacyProfile.passwordHash;
        const storedSalt = legacyProfile.salt;
        const realUsername = typeof legacyProfile.username === 'string' && legacyProfile.username.trim() ? legacyProfile.username : cleanName;
        if (
            typeof storedHash !== 'string' || storedHash.length !== 64 ||
            typeof storedSalt !== 'string' || storedSalt.length !== 32
        ) {
            throw new Error(AUTH_ERR.CORRUPTED);
        }
        const computedHash = await hashPassword(password, storedSalt);
        if (!constantTimeEqual(computedHash, storedHash)) {
            throw new Error(AUTH_ERR.WRONG_PASSWORD);
        }

        let avatar: string | null = null;
        try {
            avatar = safeAvatar(await getJson(`${DATABASE_URL}/users/${legacyKey}/avatar.json`));
        } catch {
            // Avatar is optional.
        }

        const session: ParsedSession = {
            username: realUsername,
            key: secretKey,
            legacyKey,
            avatar,
            registeredAt: typeof legacyProfile.registeredAt === 'number' ? legacyProfile.registeredAt : undefined,
        };
        try {
            localStorage.setItem(SESSION_KEY, JSON.stringify(session));
        } catch {
            // ignore
        }
        setUser(session);
        setLoginOpen(false);
    }, []);

    const logout = useCallback(() => {
        setUser(null);
        try {
            localStorage.removeItem(SESSION_KEY);
        } catch {
            // ignore
        }
    }, []);

    const value = useMemo(
        () => ({ user, loginOpen, openLogin, closeLogin, login, logout }),
        [user, loginOpen, openLogin, closeLogin, login, logout]
    );

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export function useAuth(): AuthContextType {
    const ctx = useContext(AuthContext);
    if (!ctx) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return ctx;
}
