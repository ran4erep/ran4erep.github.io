
import React, { useState, useEffect, useContext } from 'react';
import { useAuth, getJson } from '../auth';
import { LanguageContext } from '../App';
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

export const AccountModal: React.FC<AccountModalProps> = ({ open, onClose }) => {
    const { user, logout } = useAuth();
    const { t } = useContext(LanguageContext) as LanguageContextType;
    const [stats, setStats] = useState<AccountStats>({ favorites: null, watched: null, subscriptions: null });

    useEffect(() => {
        if (!open || !user) {
            setStats({ favorites: null, watched: null, subscriptions: null });
            return;
        }

        let cancelled = false;

        const loadStats = async () => {
            const keys = [{ path: 'favorites', field: 'favorites' as const },
                          { path: 'history', field: 'watched' as const },
                          { path: 'subscriptions', field: 'subscriptions' as const }];

            // Сначала секретный путь (как при входе), затем legacy — если данные ещё не мигрировали.
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
                // Узел существует, но пуст — значит значений ноль.
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

    const StatItem = ({ icon, value, label }: { icon: React.ReactNode; value: number | null; label: string }) => (
        <div className="flex flex-col items-center gap-1.5 text-center">
            <span className="text-violet-400">{icon}</span>
            <span className="text-xl font-bold text-white">{value === null ? '…' : value}</span>
            <span className="text-xs text-slate-400 leading-tight">{label}</span>
        </div>
    );

    return (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
            <div className="absolute inset-0" onClick={onClose} />
            <div className="relative w-full max-w-sm bg-slate-900/70 backdrop-blur-lg border border-slate-700 rounded-xl shadow-2xl p-5 space-y-3">
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
                    {user.avatar ? (
                        <img src={user.avatar} alt="" className="w-14 h-14 rounded-full object-cover border border-violet-500/40 shrink-0" />
                    ) : (
                        <span className="w-14 h-14 rounded-full bg-violet-500/40 flex items-center justify-center shrink-0">
                            <svg xmlns="http://www.w3.org/2000/svg" width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-gray-200">
                                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                                <circle cx="12" cy="7" r="4"></circle>
                            </svg>
                        </span>
                    )}
                    <div className="min-w-0">
                        <div className="text-lg font-bold text-white break-words leading-snug">{user.username}</div>
                        {registeredAt && (
                            <div className="text-sm text-slate-400">{t('auth_registered_at')}: {registeredAt}</div>
                        )}
                    </div>
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
