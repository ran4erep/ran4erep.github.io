import React, { useContext, useEffect, useRef, useState } from 'react';
import { LanguageContext } from '../App';
import { useAuth } from '../auth';
import { UserAvatar } from './UserAvatar';
import { UserCountBadge } from './UserCountBadge';
import type { LanguageContextType } from '../types';

interface HeaderProps {
    sidebarOpen?: boolean;
}

interface SearchResult {
    card: Element;
    title: string;
    score: number;
}

export const Header: React.FC<HeaderProps> = ({ sidebarOpen = true }) => {
    const { lang, setLang, t } = useContext(LanguageContext) as LanguageContextType;
    const { user, openLogin, openAccount } = useAuth();

    const [query, setQuery] = useState('');
    const [results, setResults] = useState<SearchResult[]>([]);
    const [open, setOpen] = useState(false);
    const wrapRef = useRef<HTMLDivElement>(null);

    // Сбор релевантных карточек по названию/описанию.
    const collectMatches = (q: string): SearchResult[] => {
        const cards = Array.from(document.querySelectorAll('#root main .group'))
            .filter(el => el.querySelector('h3') && el.querySelector('p'));

        const out: SearchResult[] = [];
        cards.forEach(card => {
            const titleRaw = (card.querySelector('h3')?.textContent || '').trim();
            const desc = (card.querySelector('p')?.textContent || '').toLowerCase();
            const title = titleRaw.toLowerCase();
            let score = 0;
            if (title.includes(q)) score += 10;
            if (desc.includes(q)) score += 5;
            if (score > 0) out.push({ card, title: titleRaw, score });
        });
        out.sort((a, b) => b.score - a.score);
        return out.slice(0, 7);
    };

    // Плавная прокрутка к карточке (по центру) + подсветка.
    const goToCard = (card: Element) => {
        try {
            card.scrollIntoView({ behavior: 'smooth', block: 'center' });
        } catch (e) {
            card.scrollIntoView(true);
        }
        // Если карточка всё ещё вне видимой области — докручиваем плавно
        // через реальный скролл-контейнер.
        requestAnimationFrame(() => {
            let node = card.parentElement;
            let scroller: Element | null = null;
            while (node && node !== document.documentElement) {
                const cs = window.getComputedStyle(node);
                if (/(auto|scroll|overlay)/i.test(cs.overflowY) && node.scrollHeight > node.clientHeight) {
                    scroller = node;
                    break;
                }
                node = node.parentElement;
            }
            if (!scroller) scroller = document.getElementById('root') || document.scrollingElement;
            const cRect = card.getBoundingClientRect();
            const sRect = scroller.getBoundingClientRect();
            if (cRect.top < sRect.top + 8 || cRect.bottom > sRect.bottom - 8) {
                const top = scroller.scrollTop + cRect.top - sRect.top
                    - scroller.clientHeight / 2 + cRect.height / 2;
                const clamped = Math.max(0, Math.min(top, scroller.scrollHeight - scroller.clientHeight));
                try {
                    scroller.scrollTo({ top: clamped, behavior: 'smooth' });
                } catch (e) {
                    scroller.scrollTop = clamped;
                }
            }
        });

        document.querySelectorAll('.hub-flash').forEach(el => el.classList.remove('hub-flash'));
        card.classList.add('hub-flash');
        setTimeout(() => card.classList.remove('hub-flash'), 2600);
        setOpen(false);
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        setQuery(value);
        const q = value.trim().toLowerCase();
        if (!q) {
            setResults([]);
            setOpen(false);
            return;
        }
        setResults(collectMatches(q));
        setOpen(true);
    };

    // Кнопка-лупа / Enter: бросаем к лучшему совпадению.
    const runSearch = () => {
        const q = query.trim().toLowerCase();
        if (!q) return;
        const found = collectMatches(q);
        setResults(found);
        setOpen(found.length > 0);
        if (found.length) goToCard(found[0].card);
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            runSearch();
        } else if (e.key === 'Escape') {
            setOpen(false);
        }
    };

    // Закрытие дропдауна при клике вне.
    useEffect(() => {
        const onDocClick = (e: MouseEvent) => {
            if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) {
                setOpen(false);
            }
        };
        document.addEventListener('mousedown', onDocClick);
        return () => document.removeEventListener('mousedown', onDocClick);
    }, []);

    return (
        <header className="relative mb-6 md:mb-10">
            {/* Верхняя строка: слева поиск, справа язык рядом с входом */}
            <div className="flex items-center justify-between gap-2 z-10 pb-3">
                <div
                    ref={wrapRef}
                    className={`relative w-full max-w-[240px] sm:max-w-[300px] min-w-0 ${sidebarOpen ? '' : 'ml-14'}`}
                >
                    <div className="flex items-center gap-1 bg-black/20 border border-white/10 rounded-full pl-4 pr-1 h-9 transition-colors hover:bg-white/5 focus-within:border-violet-500/70">
                        <input
                            type="text"
                            value={query}
                            placeholder={lang === 'en' ? 'Search projects…' : 'Поиск проектов…'}
                            aria-label={lang === 'en' ? 'Search projects' : 'Поиск проектов'}
                            onChange={handleChange}
                            onKeyDown={handleKeyDown}
                            className="w-full min-w-0 bg-transparent outline-none text-sm text-gray-100 placeholder-gray-500"
                        />
                        <button
                            onClick={runSearch}
                            aria-label={lang === 'en' ? 'Search' : 'Найти'}
                            className="shrink-0 w-7 h-7 rounded-full flex items-center justify-center text-gray-400 hover:text-white hover:bg-white/10 active:scale-95 transition"
                        >
                            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <circle cx="11" cy="11" r="8" />
                                <line x1="21" y1="21" x2="16.65" y2="16.65" />
                            </svg>
                        </button>
                    </div>

                    {open && results.length > 0 && (
                        <ul className="absolute top-full mt-2 left-0 right-0 bg-[#121722]/95 backdrop-blur-lg border border-white/10 rounded-xl shadow-2xl z-40 max-h-[60vh] overflow-y-auto p-1">
                            {results.map(r => (
                                <li key={r.title}>
                                    <button
                                        onMouseDown={(e) => { e.preventDefault(); goToCard(r.card); }}
                                        className="w-full text-left px-3 py-2 rounded-lg text-sm text-gray-300 hover:bg-white/5 hover:text-white transition truncate"
                                    >
                                        {r.title}
                                    </button>
                                </li>
                            ))}
                        </ul>
                    )}
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

                    <div className="flex flex-col items-end gap-1 shrink-0">
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
                        <UserCountBadge />
                    </div>
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
