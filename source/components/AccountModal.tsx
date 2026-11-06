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

            const entries = await Promise.all(keys.map(k => read(k.path).then(n => [k.field, n] as const)));
            if (!cancelled) {
                setStats({
                    favorites: entries[0][1],
                    watched: entries[1][1],
                    subscriptions: entries[2][1],
                });
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

    return (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 md:p-8">
            <div className="absolute inset-0 bg-black/15" onClick={onClose} />
            <div className="relative w-full max-w-sm md:w-[85vw] md:h-[85vh] md:max-w-none max-h-[92vh] md:max-h-none overflow-y-auto md:overflow-hidden custom-scrollbar bg-slate-900/70 backdrop-blur-lg border border-slate-700 rounded-xl shadow-2xl p-5 md:p-6 space-y-4 flex flex-col">
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

                        <div className="md:flex-1 md:min-h-0 md:overflow-y-auto custom-scrollbar pr-1 space-y-3">
                            {tab === 'favorites' && (
                                <div className="rounded-2xl bg-white/5 border border-white/10 p-5 text-center text-sm text-slate-400">
                                    {t('auth_coming_soon')}
                                </div>
                            )}

                            {tab === 'history' && (
                                <div className="rounded-2xl bg-white/5 border border-white/10 p-5 text-center text-sm text-slate-400">
                                    {t('auth_coming_soon')}
                                </div>
                            )}

                            {tab === 'account' && (
                                <div className="w-full md:w-1/2 mx-auto space-y-3">
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

                                    <button
                                        type="button"
                                        onClick={logout}
                                        className="w-full bg-red-500/80 hover:bg-red-500 text-white font-medium rounded-lg py-2.5 transition-all active:scale-[0.98]"
                                    >
                                        {t('auth_logout')}
                                    </button>
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
