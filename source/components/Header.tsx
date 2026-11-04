
import React, { useState, useEffect, useContext } from 'react';
import { LanguageContext } from '../App';
import { useAuth } from '../auth';
import { UserAvatar } from './UserAvatar';
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
    const { user, openLogin, openAccount } = useAuth();
    const time = useClock();

    return (
        <header className="relative mb-8 md:mb-12">
            {/* Верхняя строка: блок входа, часы и выбор языка — над заголовком, у правого края */}
            <div className="flex items-center justify-end gap-2 z-10 pb-4">
                {user ? (
                    <button
                        onClick={openAccount}
                        className="flex items-center gap-2 pl-1.5 pr-3 py-1 bg-black/20 border border-white/10 rounded-full transition-all hover:bg-white/10 active:scale-95"
                        aria-label={t('auth_account')}
                    >
                        <UserAvatar avatar={user.avatar} className="w-7 h-7" ring="border border-violet-500/40" />
                        <span className="text-sm font-medium text-gray-100 break-words max-w-[55vw]">{user.username}</span>
                    </button>
                ) : (
                    <button
                        onClick={openLogin}
                        className="px-3 py-1.5 bg-violet-600/90 hover:bg-violet-500 text-white text-sm font-medium rounded-full border border-violet-400/30 transition-all active:scale-95"
                    >
                        {t('auth_login_submit')}
                    </button>
                )}
                <div className="hidden sm:block px-3 py-1 bg-black/20 border border-white/10 rounded-full text-sm">
                    {time}
                </div>
                <div className="flex gap-1 bg-black/20 border border-white/10 rounded-full p-1">
                    <button onClick={() => setLang('ru')} title="Русский" className={`px-2 py-1 rounded-full flex items-center transition-all ${lang === 'ru' ? 'bg-violet-500 text-white' : 'text-gray-400 hover:bg-white/10'} active:scale-95`}>
                        <img src="flags/ru.svg" alt="RU" className="w-[18px] h-[12px] rounded-[2px] shadow-sm" />
                    </button>
                    <button onClick={() => setLang('en')} title="English" className={`px-2 py-1 rounded-full flex items-center transition-all ${lang === 'en' ? 'bg-violet-500 text-white' : 'text-gray-400 hover:bg-white/10'} active:scale-95`}>
                        <img src="flags/us.svg" alt="US" className="w-[18px] h-[12px] rounded-[2px] shadow-sm" />
                    </button>
                </div>
            </div>

            <div className="text-center">
                <h1 className="text-3xl sm:text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-violet-500 via-pink-500 to-violet-500 animate-gradient-pulse bg-[size:200%_auto]">
                    ran4erep's HUB
                </h1>
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
