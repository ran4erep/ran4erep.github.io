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

    const [curPass, setCurPass] = useState('');
    const [newPass, setNewPass] = useState('');
    const [confirmPass, setConfirmPass] = useState('');
    const [passBusy, setPassBusy] = useState(false);
    const [avatarBusy, setAvatarBusy] = useState(false);
    const [status, setStatus] = useState<{ kind: 'ok' | 'err'; text: string } | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (!open || !user) {
            setStats({ favorites: null, watched: null, subscriptions: null });
            setStatus(null);
            setCurPass(''); setNewPass(''); setConfirmPass('');
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

    if (!open || !user) return null;

    const registeredAt = typeof user.registeredAt === 'number'
        ? new Intl.DateTimeFormat('ru-RU', {
            day: '2-digit',
            month: 'long',
            year: 'numeric',
            timeZone: 'Europe/Kiev',
          }).format(new Date(user.registeredAt))
        : null;

    const handleAvatarFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        e.target.value = '';
        if (!file) return;
        setAvatarBusy(true);
        setStatus(null);
        try {
            const dataUrl = await resizeImage(file);
            await setAvatar(dataUrl);
            setStatus({ kind: 'ok', text: t('auth_avatar_changed') });
        } catch {
            setStatus({ kind: 'err', text: t('auth_err_failed') });
        } finally {
            setAvatarBusy(false);
        }
    };

    const handlePasswordSubmit = async () => {
        setStatus(null);
        if (!curPass || !newPass || !confirmPass) {
            setStatus({ kind: 'err', text: t('auth_err_fill') });
            return;
        }
        if (newPass !== confirmPass) {
            setStatus({ kind: 'err', text: t('auth_err_password_mismatch') });
            return;
        }
        setPassBusy(true);
        try {
            await changePassword(curPass, newPass);
            setCurPass(''); setNewPass(''); setConfirmPass('');
            setStatus({ kind: 'ok', text: t('auth_password_changed') });
        } catch (err: any) {
            const code = err?.message;
            const text = code === 'wrongPassword' ? t('auth_err_wrong_password')
                : code === 'auth_err_password_short' ? t('auth_err_password_short')
                : t('auth_err_failed');
            setStatus({ kind: 'err', text });
        } finally {
            setPassBusy(false);
        }
    };

    const inputCls = "w-full bg-slate-800 border border-slate-600 rounded-md px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-violet-500";

    const StatItem = ({ icon, value, label }: { icon: React.ReactNode; value: number | null; label: string }) => (
        <div className="flex flex-col items-center gap-1.5 text-center">
            <span className="text-violet-400">{icon}</span>
            <span className="text-xl font-bold text-white">{value === null ? '…' : value}</span>
            <span className="text-xs text-slate-400 leading-tight">{label}</span>
        </div>
    );

    return (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/15" onClick={onClose} />
            <div className="relative w-full max-w-sm max-h-[92vh] overflow-y-auto custom-scrollbar bg-slate-900/70 backdrop-blur-lg border border-slate-700 rounded-xl shadow-2xl p-5 space-y-3">
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

                {/* Карточка профиля — как в приложении */}
                <div className="flex items-center gap-4 bg-white/5 border border-white/10 rounded-2xl p-4">
                    <UserAvatar avatar={user.avatar} className="w-14 h-14" ring="border border-violet-500/40" />
                    <div className="min-w-0">
                        <div className="text-lg font-bold text-white break-words leading-snug">{user.username}</div>
                        {registeredAt && (
                            <div className="text-sm text-slate-400 leading-relaxed">
                                <div>{t('auth_registered_at')}:</div>
                                <div className="text-white font-medium">{registeredAt}</div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Смена аватара */}
                <div className="bg-white/5 border border-white/10 rounded-2xl p-4 space-y-2">
                    <div className="text-sm font-medium text-slate-300">{t('auth_change_avatar')}</div>
                    <div className="flex items-center gap-3">
                        <UserAvatar avatar={user.avatar} className="w-12 h-12" ring="border border-violet-500/40" />
                        <button
                            type="button"
                            disabled={avatarBusy}
                            onClick={() => fileInputRef.current?.click()}
                            className="px-3 py-2 text-sm bg-violet-600 hover:bg-violet-500 disabled:opacity-50 text-white font-medium rounded-lg transition-colors"
                        >
                            {avatarBusy ? t('auth_avatar_uploading') : t('auth_change_avatar')}
                        </button>
                        <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarFile} />
                    </div>
                </div>

                {/* Смена пароля */}
                <div className="bg-white/5 border border-white/10 rounded-2xl p-4 space-y-2">
                    <div className="text-sm font-medium text-slate-300">{t('auth_change_password')}</div>
                    <input type="password" value={curPass} onChange={e => setCurPass(e.target.value)} placeholder={t('auth_current_password')} className={inputCls} autoComplete="current-password" />
                    <input type="password" value={newPass} onChange={e => setNewPass(e.target.value)} placeholder={t('auth_new_password')} className={inputCls} autoComplete="new-password" />
                    <input type="password" value={confirmPass} onChange={e => setConfirmPass(e.target.value)} placeholder={t('auth_confirm_password')} className={inputCls} autoComplete="new-password" />
                    <button
                        type="button"
                        disabled={passBusy}
                        onClick={handlePasswordSubmit}
                        className="w-full px-3 py-2 text-sm bg-violet-600 hover:bg-violet-500 disabled:opacity-50 text-white font-medium rounded-lg transition-colors"
                    >
                        {passBusy ? '…' : t('auth_save')}
                    </button>
                </div>

                {/* Статистика аккаунта — как в приложении */}
                <div className="flex justify-around items-center gap-2 bg-white/5 border border-white/10 rounded-2xl p-4">
                    <StatItem
                        icon={<svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="currentColor"><path d="M17 3H7c-1.1 0-2 .9-2 2v16l7-5 7 5V5c0-1.1-.9-2-2-2z" /></svg>}
                        value={stats.favorites}
                        label={t('auth_stat_favorites')}
                    />
                    <StatItem
                        icon={<svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="currentColor"><path d="M13 3c-4.97 0-9 4.03-9 9H1l3.89 3.89.07.14L9 12H6c0-3.87 3.13-7 7-7s7 3.13 7 7-3.13 7-7 7c-1.93 0-3.68-.79-4.94-2.06l-1.42 1.42C8.27 19.99 10.51 21 13 21c4.97 0 9-4.03 9-9s-4.03-9-9-9zm-1 5v5l4.28 2.54.72-1.21-3.5-2.08V8H12z" /></svg>}
                        value={stats.watched}
                        label={t('auth_stat_watched')}
                    />
                    <StatItem
                        icon={<svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="currentColor"><path d="M20 8H4V6h16v2zm-2-6H6v2h12V2zm4 10v8c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2v-8c0-1.1.9-2 2-2h16c1.1 0 2 .9 2 2zm-6 4 6-3.27v6.53L16 16z" /></svg>}
                        value={stats.subscriptions}
                        label={t('auth_stat_subscriptions')}
                    />
                </div>

                {status && (
                    <div className={`text-sm text-center rounded-lg px-3 py-2 ${status.kind === 'ok' ? 'bg-emerald-500/15 text-emerald-300' : 'bg-red-500/15 text-red-300'}`}>
                        {status.text}
                    </div>
                )}

                <button
                    type="button"
                    onClick={logout}
                    className="w-full bg-red-500/80 hover:bg-red-500 text-white font-medium rounded-lg py-2.5 transition-all active:scale-[0.98]"
                >
                    {t('auth_logout')}
                </button>
            </div>
        </div>
    );
};
