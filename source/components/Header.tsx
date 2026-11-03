
import React, { useState, useEffect, useContext } from 'react';
import { LanguageContext } from '../App';
import { useAuth } from '../auth';
import type { LanguageContextType } from '../types';

const useClock = () => {
    const [time, setTime] = useState('--:--');

    useEffect(() => {
        let timerId: number;

        const updateClock = () => {
            const now = new Date();
            const options: Intl.DateTimeFormatOptions = {
                timeZone: 'Europe/Kiev',
                hour: '2-digit',
                minute: '2-digit',
                hour12: false,
            };
            setTime(new Intl.DateTimeFormat('ru-RU', options).format(now));

            // Schedule the next update at the start of the next minute
            const seconds = now.getSeconds();
            const milliseconds = now.getMilliseconds();
            const delay = (60 - seconds) * 1000 - milliseconds;
            
            timerId = window.setTimeout(updateClock, delay > 0 ? delay : 60000);
        };

        updateClock(); // Initial call

        return () => clearTimeout(timerId);
    }, []);

    return time;
};


export const Header: React.FC = () => {
    const { lang, setLang, t } = useContext(LanguageContext) as LanguageContextType;
    const { user, openLogin, logout } = useAuth();
    const [menuOpen, setMenuOpen] = useState(false);
    const time = useClock();

    const handleLogout = () => {
        setMenuOpen(false);
        logout();
    };

    return (
        <header className="relative flex items-center justify-between mb-8 md:mb-12 h-10">
            <div className="absolute inset-x-0 text-center">
                 <h1 className="text-3xl sm:text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-violet-500 via-pink-500 to-violet-500 animate-gradient-pulse bg-[size:200%_auto]">
                    ran4erep's HUB
                </h1>
            </div>

            <div className="flex items-center gap-2 ml-auto z-10">
                {user ? (
                    <div className="relative">
                        <button
                            onClick={() => setMenuOpen(open => !open)}
                            className="flex items-center gap-2 pl-1.5 pr-2.5 py-1 bg-black/20 border border-white/10 rounded-full transition-all hover:bg-white/10 active:scale-95"
                            aria-label={t('auth_account')}
                        >
                            {user.avatar ? (
                                <img src={user.avatar} alt="" className="w-8 h-8 rounded-full object-cover border border-violet-500/40" />
                            ) : (
                                <span className="w-8 h-8 rounded-full bg-violet-500/40 flex items-center justify-center">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-gray-200">
                                        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                                        <circle cx="12" cy="7" r="4"></circle>
                                    </svg>
                                </span>
                            )}
                            <span className="hidden md:inline max-w-[110px] truncate text-sm font-medium text-gray-100">{user.username}</span>
                            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-gray-400">
                                <polyline points="6 9 12 15 18 9"></polyline>
                            </svg>
                        </button>
                        {menuOpen && (
                            <>
                                <div className="fixed inset-0 z-40" onClick={() => setMenuOpen(false)} />
                                <div className="absolute right-0 mt-2 z-50 min-w-[160px] bg-slate-900/95 backdrop-blur-lg border border-white/10 rounded-xl shadow-2xl overflow-hidden">
                                    <button
                                        onClick={handleLogout}
                                        className="w-full text-left px-4 py-2.5 text-sm text-red-300 hover:bg-white/5 transition-colors"
                                    >
                                        {t('auth_logout')}
                                    </button>
                                </div>
                            </>
                        )}
                    </div>
                ) : (
                    <button
                        onClick={openLogin}
                        className="flex items-center gap-2 px-3 py-1.5 bg-violet-600/90 hover:bg-violet-500 text-white text-sm font-medium rounded-full border border-violet-400/30 transition-all active:scale-95"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                            <circle cx="12" cy="7" r="4"></circle>
                        </svg>
                        <span className="hidden sm:inline">{t('auth_login_submit')}</span>
                    </button>
                )}
                <div className="hidden sm:block px-3 py-1 bg-black/20 border border-white/10 rounded-full text-sm">
                    {time}
                </div>
                <div className="flex gap-1 bg-black/20 border border-white/10 rounded-full p-1">
                    <button onClick={() => setLang('ru')} className={`px-2 py-0.5 rounded-full text-sm transition-all ${lang === 'ru' ? 'bg-violet-500 text-white' : 'text-gray-400 hover:bg-white/10'} active:scale-95`}>
                        🇷🇺
                    </button>
                    <button onClick={() => setLang('en')} className={`px-2 py-0.5 rounded-full text-sm transition-all ${lang === 'en' ? 'bg-violet-500 text-white' : 'text-gray-400 hover:bg-white/10'} active:scale-95`}>
                        🇺🇸
                    </button>
                </div>
            </div>
             <style>{`
                @keyframes gradient-pulse {
                    0% { background-position: 0% 50%; }
                    5% { background-position: 100% 50%; }
                    10% { background-position: 0% 50%; }
                    100% { background-position: 0% 50%; }
                }
                .animate-gradient-pulse {
                    animation: gradient-pulse 10s linear infinite;
                }
            `}</style>
        </header>
    );
};