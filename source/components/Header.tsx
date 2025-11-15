
import React, { useState, useEffect, useContext } from 'react';
import { LanguageContext } from '../App';
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
    const { lang, setLang } = useContext(LanguageContext) as LanguageContextType;
    const time = useClock();

    return (
        <header className="relative flex items-center justify-between mb-8 md:mb-12 h-10">
            <div className="absolute inset-x-0 text-center">
                 <h1 className="text-3xl sm:text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-violet-500 via-pink-500 to-violet-500 animate-gradient-pulse bg-[size:200%_auto]">
                    ran4erep's HUB
                </h1>
            </div>

            <div className="flex items-center gap-2 ml-auto z-10">
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