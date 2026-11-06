import React, { useState, useEffect, useContext, useRef } from 'react';
import { useAuth, getJson } from '../auth';
import { LanguageContext } from '../App';
import { UserAvatar } from './UserAvatar';
import type { LanguageContextType } from '../types';

const DATABASE_URL = 'https://r4ezka-default-rtdb.europe-west1.firebasedatabase.app';

interface AccountModalProps {
    open: boolean;
    onClose: () => void;
}

interface AccountStats {
    favorites: number | null;
    watched: number | null;
    subscriptions: number | null;
}

type Tab = 'favorites' | 'history' | 'account';

const countEntries = (value: any): number =>
    value && typeof value === 'object' ? Object.keys(value).length : 0;

// --- Миниатюры постеров (как в приложении: пережим + кэш) ---
const thumbCache = new Map<string, string>();
const thumbQueue: (() => Promise<void>)[] = [];
let thumbActive = 0;
const THUMB_PARALLEL = 3;

function pumpThumbs() {
    while (thumbActive < THUMB_PARALLEL && thumbQueue.length) {
        thumbActive++;
        const job = thumbQueue.shift()!;
        job().finally(() => { thumbActive--; pumpThumbs(); });
    }
}

async function thumbFetch(src: string): Promise<string> {
    if (thumbCache.has(src)) return thumbCache.get(src)!;
    try {
        if (!('createImageBitmap' in window)) return src;
        const blob = await (await fetch(src)).blob();
        const bmp = await createImageBitmap(blob, { resizeWidth: 256 });
        const canvas = document.createElement('canvas');
        canvas.width = bmp.width;
        canvas.height = bmp.height;
        const ctx = canvas.getContext('2d');
        if (ctx) ctx.drawImage(bmp, 0, 0);
        bmp.close();
        const dataUrl = canvas.toDataURL('image/jpeg', 0.75);
        thumbCache.set(src, dataUrl);
        return dataUrl;
    } catch (e) {
        return src;
    }
}

function loadThumb(src: string): Promise<string> {
    return new Promise(resolve => {
        thumbQueue.push(() => thumbFetch(src).then(resolve, () => resolve(src)));
        pumpThumbs();
    });
}

const Thumb = ({ src, alt }: { src: string; alt?: string }) => {
    const [res, setRes] = useState<string | null>(null);
    const boxRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const el = boxRef.current;
        if (!el) return;
        let live = true;
        let started = false;
        let timer = 0;
        const start = () => {
            if (started || !live) return;
            started = true;
            loadThumb(src).then(r => { if (live) setRes(r); });
        };
        const schedule = () => {
            if (timer) return;
            // Небольшая задержка, чтобы не грузить посреди резкого скролла.
            timer = window.setTimeout(() => { timer = 0; start(); }, 150);
        };
        if ('IntersectionObserver' in window) {
            const io = new IntersectionObserver(
                entries => {
                    entries.forEach(entry => {
                        if (entry.isIntersecting) {
                            schedule();
                            io.disconnect();
                        }
                    });
                },
                { rootMargin: '200px 0px' }
            );
            io.observe(el);
            return () => { io.disconnect(); window.clearTimeout(timer); live = false; };
        }
        schedule();
        return () => { window.clearTimeout(timer); live = false; };
    }, [src]);

    return (
        <div ref={boxRef} className="absolute inset-0 bg-white/5">
            {!res && <div className="absolute inset-0 animate-pulse bg-white/5" />}
            {res && (
                <img
                    src={res}
                    alt={alt || ''}
                    loading="lazy"
                    decoding="async"
                    className="absolute inset-0 w-full h-full object-cover group-hover:opacity-90 transition-opacity"
                    onError={(e) => { e.currentTarget.style.display = 'none'; }}
                />
            )}
        </div>
    );
};

const resizeImage = (file: File, maxSize = 256): Promise<string> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => {
            const img = new Image();
            img.onload = () => {
                const canvas = document.createElement('canvas');
                const ctx = canvas.getContext('2d');
                if (!ctx) { reject(new Error('noctx')); return; }
                let { width, height } = img;
                if (width > maxSize) {
                    height = Math.round((maxSize * height) / width);
                    width = maxSize;
                }
                canvas.width = width;
                canvas.height = height;
                ctx.drawImage(img, 0, 0, width, height);
                resolve(canvas.toDataURL('image/jpeg', 0.8));
            };
            img.onerror = () => reject(new Error('img'));
            img.src = e.target?.result as string;
        };
        reader.onerror = () => reject(new Error('read'));
        reader.readAsDataURL(file);
    });
};

export const AccountModal: React.FC<AccountModalProps> = ({ open, onClose }) => {
    const { user, logout, changePassword, setAvatar } = useAuth();
    const { t } = useContext(LanguageContext) as LanguageContextType;
    const [stats, setStats] = useState<AccountStats>({ favorites: null, watched: null, subscriptions: null });
    const [favoritesList, setFavoritesList] = useState<any[] | null>(null);
    const [historyList, setHistoryList] = useState<any[] | null>(null);
    const [devices, setDevices] = useState<string[] | null>(null);
    const [favLimit, setFavLimit] = useState(12);
    const [histLimit, setHistLimit] = useState(12);
    const cardScrollRef = useRef<HTMLDivElement>(null);
    const tabScrollRef = useRef<HTMLDivElement>(null);

    const [tab, setTab] = useState<Tab>('history');
    const [newPass, setNewPass] = useState('');
    const [confirmPass, setConfirmPass] = useState('');
    const [showPass, setShowPass] = useState({ a: false, b: false });
    const [passBusy, setPassBusy] = useState(false);
    const [avatarBusy, setAvatarBusy] = useState(false);
    const [toast, setToast] = useState<{ kind: 'ok' | 'err'; text: string } | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const toastTimer = useRef<number>(0);

    useEffect(() => {
        if (!open || !user) {
            setStats({ favorites: null, watched: null, subscriptions: null });
            setFavoritesList(null);
            setHistoryList(null);
            setDevices(null);
            setFavLimit(12);
            setHistLimit(12);
            setToast(null);
            setNewPass(''); setConfirmPass('');
            setTab('history');
            return;
        }

        let cancelled = false;

        const loadStats = async () => {
            const keys = [{ path: 'favorites', field: 'favorites' as const },
                          { path: 'history', field: 'watched' as const },
                          { path: 'subscriptions', field: 'subscriptions' as const }];

            const read = async (leaf: string): Promise<number | null> => {
                const candidates = [
                    `${DATABASE_URL}/users/${user.key}/private/${leaf}.json`,
                    user.legacyKey ? `${DATABASE_URL}/users/${user.legacyKey}/${leaf}.json` : null,
                ].filter(Boolean) as string[];

                let foundEmpty = false;
                for (const url of candidates) {
                    try {
                        const value = await getJson(url);
                        if (value !== null) return countEntries(value);
                        foundEmpty = true;
                    } catch {
                        // пробуем следующий источник
                    }
                }
                return foundEmpty ? 0 : null;
            };

            // Чтение полного объекта ветки (для карточек избранного/истории).
            const readValue = async (leaf: string): Promise<any | null> => {
                const candidates = [
                    `${DATABASE_URL}/users/${user.key}/private/${leaf}.json`,
                    user.legacyKey ? `${DATABASE_URL}/users/${user.legacyKey}/${leaf}.json` : null,
                ].filter(Boolean) as string[];
                let foundEmpty = false;
                for (const url of candidates) {
                    try {
                        const value = await getJson(url);
                        if (value !== null) return value;
                        foundEmpty = true;
                    } catch { }
                }
                return foundEmpty ? {} : null;
            };

            const toItems = (value: any): any[] => {
                if (!value || typeof value !== 'object') return [];
                return Object.values(value).sort((a: any, b: any) => (b?.timestamp || 0) - (a?.timestamp || 0));
            };

            // История агрегируется по фильму/сериалу (как в приложении):
            // одна карточка на itemId, без дублей по сериям/эпизодам.
            const aggregateHistory = (value: any): any[] => {
                const map = new Map<string, any>();
                for (const it of toItems(value)) {
                    const key = it.itemId || it.url || it.title || String(it.timestamp);
                    const prev = map.get(key);
                    if (!prev || (it.timestamp || 0) > (prev.timestamp || 0)) map.set(key, it);
                }
                return Array.from(map.values())
                    .sort((a: any, b: any) => (b?.timestamp || 0) - (a?.timestamp || 0));
            };

            const [favValue, histValue, settingsValue] = await Promise.all([
                readValue('favorites'), readValue('history'), readValue('settings'),
            ]);

            // Устройства: уникальные deviceId из токенов в valueках + firstDeviceId.
            const deviceIds = new Set<string>();
            const DEVICE_RE = /deviceId=([^()]*)\(/g;
            const scan = (raw: string) => {
                if (typeof raw !== 'string') return;
                let m;
                DEVICE_RE.lastIndex = 0;
                while ((m = DEVICE_RE.exec(raw)) !== null) {
                    if (m[1].trim()) deviceIds.add(m[1].trim());
                }
            };
            if (settingsValue && typeof settingsValue === 'object') {
                Object.values(settingsValue).forEach((v: any) => scan(String(v)));
            }

            const entries = await Promise.all(keys.map(k => read(k.path).then(n => [k.field, n] as const)));
            if (!cancelled) {
                setStats({
                    favorites: entries[0][1],
                    watched: entries[1][1],
                    subscriptions: entries[2][1],
                });
                setFavoritesList(toItems(favValue));
                setHistoryList(aggregateHistory(histValue));
                setDevices(Array.from(deviceIds));
            }
        };

        loadStats();
        return () => { cancelled = true; };
    }, [open, user]);

    // Автоскрытие тоста.
    useEffect(() => {
        if (toast) {
            window.clearTimeout(toastTimer.current);
            toastTimer.current = window.setTimeout(() => setToast(null), 2600);
        }
        return () => window.clearTimeout(toastTimer.current);
    }, [toast]);

    if (!open || !user) return null;

    const showToast = (kind: 'ok' | 'err', text: string) => setToast({ kind, text });

    const handleAvatarClick = () => {
        if (!avatarBusy) fileInputRef.current?.click();
    };

    const handleAvatarFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        e.target.value = '';
        if (!file) return;
        setAvatarBusy(true);
        try {
            const dataUrl = await resizeImage(file);
            await setAvatar(dataUrl);
            showToast('ok', t('auth_avatar_changed'));
        } catch {
            showToast('err', t('auth_err_failed'));
        } finally {
            setAvatarBusy(false);
        }
    };

    const handlePasswordSubmit = async () => {
        if (passBusy) return;
        setToast(null);
        if (!newPass || !confirmPass) {
            showToast('err', t('auth_err_fill'));
            return;
        }
        if (newPass !== confirmPass) {
            showToast('err', t('auth_err_password_mismatch'));
            return;
        }
        setPassBusy(true);
        try {
            await changePassword(newPass);
            setNewPass(''); setConfirmPass('');
            showToast('ok', t('auth_password_changed'));
        } catch (err: any) {
            const code = err?.message;
            const text = code === 'auth_err_password_short' ? t('auth_err_password_short')
                : t('auth_err_failed');
            showToast('err', text);
        } finally {
            setPassBusy(false);
        }
    };

    const registeredAt = typeof user.registeredAt === 'number'
        ? new Intl.DateTimeFormat('ru-RU', {
            day: '2-digit',
            month: 'long',
            year: 'numeric',
            timeZone: 'Europe/Kiev',
          }).format(new Date(user.registeredAt))
        : null;

    const inputCls = "w-full bg-slate-800 border border-slate-600 rounded-lg px-3.5 py-2.5 pr-11 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-violet-500";

    // «Системный» серый глаз (в отличие от белого в окне входа).
    const EyeButton = ({ shown, onToggle, aria }: { shown: boolean; onToggle: () => void; aria: string }) => (
        <button
            type="button"
            onClick={onToggle}
            aria-label={aria}
            className="absolute right-1 top-1/2 -translate-y-1/2 p-1 z-10 text-slate-500 hover:text-slate-300 transition-colors"
        >
            {shown ? (
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                    <line x1="1" y1="1" x2="23" y2="23" />
                </svg>
            ) : (
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                    <circle cx="12" cy="12" r="3" />
                </svg>
            )}
        </button>
    );

    const tabs: { id: Tab; label: string }[] = [
        { id: 'history', label: t('auth_tab_history') },
        { id: 'favorites', label: t('auth_tab_favorites') },
        { id: 'account', label: t('auth_tab_account') },
    ];

    // Карточка фильма/сериала — как в приложении (постер, название, рейтинг).
    const MovieCard = ({ item, footnote, progress }: { item: any; footnote?: string; progress?: number | null }) => (
        <a
            href={item.url || '#'}
            target="_blank"
            rel="noopener noreferrer"
            className="group block rounded-xl overflow-hidden bg-white/5 border border-white/10 hover:border-violet-500/60 transition-colors"
            style={{ contentVisibility: 'auto', containIntrinsicSize: 'auto 260px' }}
        >
            <div className="relative aspect-[2/3] w-full bg-white/5">
                {item.imageUrl ? (
                    <Thumb src={item.imageUrl} alt={item.title || ''} />
                ) : null}
                {item.rating ? (
                    <span className="absolute top-1.5 left-1.5 px-1.5 py-0.5 text-[11px] font-semibold bg-black/70 text-amber-300 rounded-md">
                        {item.rating}
                    </span>
                ) : null}
                {progress != null && (
                    <span className="absolute bottom-0 left-0 right-0 h-1 bg-black/40">
                        <span className="block h-full bg-violet-500" style={{ width: `${Math.max(0, Math.min(100, progress))}%` }} />
                    </span>
                )}
            </div>
            <div className="p-2">
                <div
                    className="text-[13px] font-medium text-gray-100 leading-tight"
                    style={{ display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}
                >
                    {item.title || '—'}
                </div>
                {footnote && <div className="text-[11px] text-slate-400 mt-0.5 truncate">{footnote}</div>}
            </div>
        </a>
    );

    const EmptyState = ({ text }: { text: string }) => (
        <div className="rounded-2xl bg-white/5 border border-white/10 p-6 text-center text-sm text-slate-400">
            {text}
        </div>
    );

    // Прогресс просмотра для карточки истории (0–100).
    const historyProgress = (it: any): number | null => {
        if (typeof it.progress === 'number') return it.progress;
        const pm = Number(it.progressMs);
        const dm = Number(it.durationMs);
        if (dm > 0 && Number.isFinite(pm) && Number.isFinite(dm)) return (pm / dm) * 100;
        if (it.isFullyWatched) return 100;
        return null;
    };

    const historyFootnote = (it: any): string | undefined => {
        if (it.subtitle) return String(it.subtitle);
        if (it.season != null) {
            return `Сезон ${it.season}${it.episode != null ? ' • Серия ' + it.episode : ''}`;
        }
        return undefined;
    };

    // Инкрементальная подгрузка: при приближении к низу списка добавляем
    // следующую порцию, чтобы не держать в DOM все карточки разом.
    const handleScrollLoad = (e: React.UIEvent<HTMLDivElement>) => {
        const el = e.currentTarget;
        if (el.scrollTop + el.clientHeight < el.scrollHeight - 600) return;
        if (tab === 'favorites' && favoritesList) {
            setFavLimit(l => Math.min(favoritesList.length, l + 30));
        }
        if (tab === 'history' && historyList) {
            setHistLimit(l => Math.min(historyList.length, l + 30));
        }
    };

    return (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-3 md:p-8">
            <div className="absolute inset-0 bg-black/15" onClick={onClose} />
            <div
                ref={cardScrollRef}
                onScroll={handleScrollLoad}
                className="relative w-full max-w-sm md:w-[85vw] md:h-[85vh] md:max-w-none max-h-[96dvh] md:max-h-none overflow-y-auto md:overflow-hidden custom-scrollbar bg-slate-900/85 border border-slate-700 rounded-xl shadow-2xl p-5 md:p-6 space-y-4 flex flex-col"
            >
                <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold text-white">{t('auth_account')}</h3>
                    <button
                        type="button"
                        onClick={onClose}
                        className="text-slate-400 hover:text-white text-2xl leading-none transition-transform active:scale-90"
                        aria-label={t('close_tooltip')}
                    >
                        &times;
                    </button>
                </div>

                <div className="md:flex md:gap-4 space-y-4 md:space-y-0 flex-1 min-h-0">
                    {/* Колонка информации */}
                    <div className="md:w-80 shrink-0">
                        <div className="rounded-2xl bg-white/5 border border-white/10 p-4 flex flex-col items-center gap-4 text-center">
                            <button
                                type="button"
                                onClick={handleAvatarClick}
                                disabled={avatarBusy}
                                className="relative shrink-0 group rounded-full transition-shadow hover:shadow-[0_0_0_3px_rgba(139,92,246,0.55)]"
                            >
                                <UserAvatar avatar={user.avatar} className="w-16 h-16" ring="border border-violet-500/40" />
                                {/* Бейдж-карандаш — как в приложении r4ezka:
                                    тёмный кружок, чёрная обводка, иконка Edit. */}
                                <span className="absolute -bottom-1 -right-1 w-[22px] h-[22px] rounded-full bg-[#1E1E24] border border-black flex items-center justify-center">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z" />
                                    </svg>
                                </span>
                            </button>
                            <div className="min-w-0">
                                <div className="text-lg font-bold text-white break-words leading-snug">{user.username}</div>
                                {registeredAt && (
                                    <div className="text-sm text-slate-400 leading-relaxed">
                                        <div>{t('auth_registered_at')}:</div>
                                        <div className="text-white font-medium">{registeredAt}</div>
                                    </div>
                                )}
                                {avatarBusy && <div className="text-xs text-slate-400 mt-1">{t('auth_avatar_uploading')}</div>}
                            </div>
                        </div>
                        {/* Статистика — под информацией аккаунта (и на ПК, и на телефоне) */}
                        <div className="mt-3 rounded-2xl bg-white/5 border border-white/10 p-4 flex justify-around items-center gap-2">
                            <div className="flex flex-col items-center gap-1.5 text-center">
                                <span className="text-violet-400">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="currentColor"><path d="M17 3H7c-1.1 0-2 .9-2 2v16l7-5 7 5V5c0-1.1-.9-2-2-2z" /></svg>
                                </span>
                                <span className="text-xl font-bold text-white">{stats.favorites === null ? '…' : stats.favorites}</span>
                                <span className="text-xs text-slate-400 leading-tight whitespace-nowrap">{t('auth_stat_favorites')}</span>
                            </div>
                            <div className="flex flex-col items-center gap-1.5 text-center">
                                <span className="text-violet-400">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="currentColor"><path d="M13 3c-4.97 0-9 4.03-9 9H1l3.89 3.89.07.14L9 12H6c0-3.87 3.13-7 7-7s7 3.13 7 7-3.13 7-7 7c-1.93 0-3.68-.79-4.94-2.06l-1.42 1.42C8.27 19.99 10.51 21 13 21c4.97 0 9-4.03 9-9s-4.03-9-9-9zm-1 5v5l4.28 2.54.72-1.21-3.5-2.08V8H12z" /></svg>
                                </span>
                                <span className="text-xl font-bold text-white">{stats.watched === null ? '…' : stats.watched}</span>
                                <span className="text-xs text-slate-400 leading-tight whitespace-nowrap">{t('auth_stat_watched')}</span>
                            </div>
                            <div className="flex flex-col items-center gap-1.5 text-center">
                                <span className="text-violet-400">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="currentColor"><path d="M20 8H4V6h16v2zm-2-6H6v2h12V2zm4 10v8c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2v-8c0-1.1.9-2 2-2h16c1.1 0 2 .9 2 2zm-6 4 6-3.27v6.53L16 16z" /></svg>
                                </span>
                                <span className="text-xl font-bold text-white">{stats.subscriptions === null ? '…' : stats.subscriptions}</span>
                                <span className="text-xs text-slate-400 leading-tight whitespace-nowrap">{t('auth_stat_subscriptions')}</span>
                            </div>
                        </div>
                        <button
                            type="button"
                            onClick={logout}
                            className="mt-3 w-full bg-red-500/80 hover:bg-red-500 text-white font-medium rounded-lg py-2.5 transition-all active:scale-[0.98]"
                        >
                            {t('auth_logout')}
                        </button>
                        <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarFile} />
                    </div>

                    {/* Колонка вкладок */}
                    <div className="flex-1 min-w-0 flex flex-col">
                        <div className="flex gap-1.5 mb-3 bg-white/5 border border-white/10 rounded-xl p-1">
                            {tabs.map(tb => (
                                <button
                                    key={tb.id}
                                    type="button"
                                    onClick={() => setTab(tb.id)}
                                    className={`flex-1 px-2 py-1.5 rounded-lg text-sm font-medium transition-colors ${tab === tb.id ? 'bg-violet-600 text-white' : 'text-slate-400 hover:text-white hover:bg-white/5'}`}
                                >
                                    {tb.label}
                                </button>
                            ))}
                        </div>

                        <div
                            ref={tabScrollRef}
                            onScroll={handleScrollLoad}
                            className="md:flex-1 md:min-h-0 md:overflow-y-auto custom-scrollbar pr-1 space-y-3 [transform:translateZ(0)]"
                            style={{ overscrollBehavior: 'contain', contain: 'layout paint' }}
                        >
                            {tab === 'favorites' && (
                                favoritesList === null ? (
                                    <EmptyState text="…" />
                                ) : favoritesList.length === 0 ? (
                                    <EmptyState text={t('auth_no_favorites')} />
                                ) : (
                                    <div className="rounded-2xl bg-white/5 border border-white/10 p-3">
                                        <div className="grid gap-3 [grid-template-columns:repeat(auto-fill,minmax(150px,1fr))]">
                                            {favoritesList.slice(0, favLimit).map(it => (
                                                <MovieCard key={it.id || it.url || it.title} item={it} />
                                            ))}
                                        </div>
                                    </div>
                                )
                            )}

                            {tab === 'history' && (
                                historyList === null ? (
                                    <EmptyState text="…" />
                                ) : historyList.length === 0 ? (
                                    <EmptyState text={t('auth_no_history')} />
                                ) : (
                                    <div className="rounded-2xl bg-white/5 border border-white/10 p-3">
                                        <div className="grid gap-3 [grid-template-columns:repeat(auto-fill,minmax(150px,1fr))]">
                                            {historyList.slice(0, histLimit).map(it => (
                                                <MovieCard
                                                    key={it.itemId || it.url || it.title}
                                                    item={it}
                                                    footnote={historyFootnote(it)}
                                                    progress={historyProgress(it)}
                                                />
                                            ))}
                                        </div>
                                    </div>
                                )
                            )}

                            {tab === 'account' && (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 w-full">
                                    {/* Смена пароля */}
                                    <div className="rounded-2xl bg-white/5 border border-white/10 p-4 space-y-2">
                                        <div className="text-sm font-medium text-slate-300">{t('auth_change_password')}</div>
                                        <div className="relative">
                                            <input
                                                type={showPass.a ? 'text' : 'password'}
                                                value={newPass}
                                                onChange={e => setNewPass(e.target.value)}
                                                placeholder={t('auth_new_password')}
                                                className={inputCls}
                                                autoComplete="new-password"
                                            />
                                            <EyeButton
                                                shown={showPass.a}
                                                onToggle={() => setShowPass(s => ({ ...s, a: !s.a }))}
                                                aria={t(showPass.a ? 'auth_hide_password' : 'auth_show_password')}
                                            />
                                        </div>
                                        <div className="relative">
                                            <input
                                                type={showPass.b ? 'text' : 'password'}
                                                value={confirmPass}
                                                onChange={e => setConfirmPass(e.target.value)}
                                                placeholder={t('auth_confirm_password')}
                                                className={inputCls}
                                                autoComplete="new-password"
                                            />
                                            <EyeButton
                                                shown={showPass.b}
                                                onToggle={() => setShowPass(s => ({ ...s, b: !s.b }))}
                                                aria={t(showPass.b ? 'auth_hide_password' : 'auth_show_password')}
                                            />
                                        </div>
                                        <button
                                            type="button"
                                            disabled={passBusy}
                                            onClick={handlePasswordSubmit}
                                            className="w-full min-h-[44px] bg-violet-600 hover:bg-violet-500 disabled:opacity-60 text-white font-medium rounded-lg py-2.5 transition-all active:scale-[0.98] inline-flex items-center justify-center"
                                        >
                                            {passBusy ? (
                                                <span className="inline-flex items-center gap-1.5">
                                                    {[0, 1, 2].map(i => (
                                                        <span
                                                            key={i}
                                                            className="w-1.5 h-1.5 rounded-full bg-white animate-bounce"
                                                            style={{ animationDelay: `${i * 0.15}s` }}
                                                        />
                                                    ))}
                                                </span>
                                            ) : t('auth_save')}
                                        </button>
                                    </div>

                                    {/* Список устройств */}
                                    <div className="rounded-2xl bg-white/5 border border-white/10 p-4 space-y-2 self-start">
                                        <div className="text-sm font-medium text-slate-300">{t('auth_devices')}</div>
                                        {devices === null ? (
                                            <div className="text-sm text-slate-400">…</div>
                                        ) : devices.length === 0 ? (
                                            <div className="text-sm text-slate-400">{t('auth_no_devices')}</div>
                                        ) : (
                                            <ul className="space-y-1.5 max-h-[200px] overflow-y-auto custom-scrollbar pr-1">
                                                {devices.map(id => (
                                                    <li key={id} className="flex items-center gap-2 text-sm text-gray-200">
                                                        <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-violet-400 shrink-0">
                                                            <rect x="2" y="3" width="20" height="14" rx="2" ry="2" />
                                                            <line x1="8" y1="21" x2="16" y2="21" />
                                                            <line x1="12" y1="17" x2="12" y2="21" />
                                                        </svg>
                                                        <span className="truncate font-mono text-[12px]">{id}</span>
                                                    </li>
                                                ))}
                                            </ul>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Тосты сверху */}
                {toast && (
                    <div className={`absolute top-3 left-1/2 -translate-x-1/2 px-4 py-2 rounded-lg text-sm font-medium shadow-2xl z-10 ${toast.kind === 'ok' ? 'bg-emerald-600 text-white' : 'bg-red-600 text-white'}`}>
                        {toast.text}
                    </div>
                )}
            </div>
            <style>{`
                input[type="password"]::-ms-reveal,
                input[type="password"]::-ms-clear {
                    display: none;
                }
                input[type="password"]::-webkit-credentials-auto-fill-button {
                    visibility: hidden;
                    pointer-events: none;
                }
            `}</style>
        </div>
    );
};
