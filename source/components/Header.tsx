import React, { useContext } from 'react';
import { LanguageContext } from '../App';
import { useAuth } from '../auth';
import { UserAvatar } from './UserAvatar';
import type { LanguageContextType } from '../types';

export const Header: React.FC = () => {
    const { lang, setLang, t } = useContext(LanguageContext) as LanguageContextType;
    const { user, openLogin, openAccount } = useAuth();

    // Поиск по проектам: ищем среди карточек (у них есть h3 — название,
    // и p — описание), плавно прокручиваем к лучшей и мигаем ей.
    const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
        const q = e.target.value.trim().toLowerCase();

        document.querySelectorAll('.hub-flash').forEach(el => el.classList.remove('hub-flash'));
        if (!q) return;

        const cards = Array.from(document.querySelectorAll('#root main .group'))
            .filter(el => el.querySelector('h3') && el.querySelector('p'));

        let best: Element | null = null;
        let bestScore = 0;
        cards.forEach(card => {
            const title = ((card.querySelector('h3')?.textContent || '')).toLowerCase();
            const desc = ((card.querySelector('p')?.textContent || '')).toLowerCase();
            let score = 0;
            if (title.includes(q)) score += 10;
            if (desc.includes(q)) score += 5;
            if (score > bestScore) { bestScore = score; best = card; }
        });

        if (!best) return;
        best.scrollIntoView({ behavior: 'smooth', block: 'center' });
        best.classList.add('hub-flash');
        setTimeout(() => best?.classList.remove('hub-flash'), 2600);
    };

    return (
        <header className="relative mb-6 md:mb-10">
            {/* Верхняя строка: слева поиск, справа язык рядом с входом */}
            <div className="flex items-center justify-between gap-2 z-10 pb-3">
                <div className="relative w-full max-w-[220px] sm:max-w-[280px] min-w-0 ml-11 md:ml-0">
                    <svg
                        className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 pointer-events-none"
                        viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
                        strokeLinecap="round" strokeLinejoin="round"
                    >
                        <circle cx="11" cy="11" r="8" />
                        <line x1="21" y1="21" x2="16.65" y2="16.65" />
                    </svg>
                    <input
                        type="text"
                        placeholder={lang === 'en' ? 'Search projects…' : 'Поиск проектов…'}
                        aria-label={lang === 'en' ? 'Search projects' : 'Поиск проектов'}
                        onInput={handleSearch}
                        className="h-9 w-full bg-black/20 border border-white/10 rounded-full pl-9 pr-4 text-sm text-gray-100 placeholder-gray-500 outline-none transition-colors hover:bg-white/5 focus:border-violet-500/70"
                    />
                </div>

                <div className="flex items-center gap-2 shrink-0">
                    <div className="flex gap-1 h-[30px] items-center bg-black/20 border border-white/10 rounded-full p-1">
                        <button onClick={() => setLang('ru')} title="Русский" className={`px-2 h-6 rounded-full flex items-center transition-all ${lang === 'ru' ? 'bg-violet-500 text-white' : 'text-gray-400 hover:bg-white/10'} active:scale-95`}>
                            <img src="/flags/ru.svg" alt="RU" className="w-[18px] h-[12px] rounded-[2px] shadow-sm" />
                        </button>
                        <button onClick={() => setLang('en')} title="English" className={`px-2 h-6 rounded-full flex items-center transition-all ${lang === 'en' ? 'bg-violet-500 text-white' : 'text-gray-400 hover:bg-white/10'} active:scale-95`}>
                            <img src="/flags/us.svg" alt="US" className="w-[18px] h-[12px] rounded-[2px] shadow-sm" />
                        </button>
                    </div>

                    {user ? (
                        <button
                            onClick={openAccount}
                            className="flex items-center gap-2 pl-1.5 pr-3 h-[30px] bg-black/20 border border-white/10 rounded-full transition-all hover:bg-white/10 active:scale-95"
                            aria-label={t('auth_account')}
                        >
                            <UserAvatar avatar={user.avatar} className="w-6 h-6" ring="border border-violet-500/40" />
                            <span className="text-sm font-medium text-gray-100 break-words max-w-[55vw]">{user.username}</span>
                        </button>
                    ) : (
                        <button
                            onClick={openLogin}
                            className="px-3 h-[30px] inline-flex items-center gap-1.5 bg-violet-600/90 hover:bg-violet-500 text-white text-sm font-medium rounded-full border border-violet-400/30 transition-all active:scale-95"
                            aria-label={t('auth_login_submit')}
                        >
                            <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"/><polyline points="10 17 15 12 10 7"/><line x1="15" y1="12" x2="3" y2="12"/></svg>
                            {t('auth_login_submit')}
                        </button>
                    )}
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
                @keyframes hubFlash {
                    0% { box-shadow: 0 0 0 0 rgba(139, 92, 246, 0); }
                    35% { box-shadow: 0 0 0 4px rgba(139, 92, 246, 0.85); }
                    100% { box-shadow: 0 0 0 0 rgba(139, 92, 246, 0); }
                }
                .hub-flash {
                    animation: hubFlash 1.2s ease-out 2;
                    border-radius: 10px;
                }
            `}</style>
        </header>
    );
};
