

import React, { useState, useEffect, createContext, useCallback, useMemo } from 'react';
import { Sidebar } from './components/Sidebar';
import { Header } from './components/Header';
import { ProjectCard } from './components/ProjectCard';
import { RecommendationCard } from './components/RecommendationCard';
import { Gallery } from './components/Gallery';
import { Chat } from './components/Chat';
import { FloatingButtons } from './components/FloatingButtons';
import { translations, projects, recommendations } from './constants';
import { AppView } from './components/AppView';
import { LoginModal } from './components/LoginModal';
import { AccountModal } from './components/AccountModal';
import { AuthProvider, useAuth } from './auth';
import { CommentsModal } from './components/Comments';
import type { Language, LanguageContextType, SitePage } from './types';

export const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

const AuthModals: React.FC = () => {
    const { accountOpen, closeAccount } = useAuth();
    return (
        <>
            <LoginModal />
            <AccountModal open={accountOpen} onClose={closeAccount} />
        </>
    );
};

const App: React.FC = () => {
    const [lang, setLang] = useState<Language>(() => {
        const savedLang = localStorage.getItem('language');
        return (savedLang === 'en' || savedLang === 'ru') ? savedLang : 'ru';
    });
    // Комментарии: глобальная модалка поверх сайта.
    const [commentsProject, setCommentsProject] = useState<{ key: string; title: string } | null>(null);
    const [pages, setPages] = useState<SitePage[]>([]);
    const [openPath, setOpenPath] = useState<string | null>(() => {
        const params = new URLSearchParams(window.location.search);
        const app = params.get('app');
        if (!app) return null;
        // Сохраняем путь как есть (без ведущих слэшей): хвостовой слэш
        // важен — для каталогов он нужен, а для файлов (например,
        // /projects/misc/wiki/gwg.html) добавить его нельзя, иначе GitHub
        // Pages отдаст 404.
        return '/' + app.replace(/^\/+/, '');
    });
    const [isSidebarOpen, setSidebarOpen] = useState(() => {
        // Check user agent for mobile keywords. This is more reliable than just touch detection,
        // as it correctly identifies devices like Windows convertibles as desktops.
        const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
        return !isMobile;
    });
    // Пункты навигации, которые приложения (например, вики) присылают через мост.
    const [appNavItems, setAppNavItems] = useState<{ label: string; path: string }[]>([]);

    useEffect(() => {
        const onMessage = (e: MessageEvent) => {
            if (e.origin !== window.location.origin) return;
            const data = e.data;
            if (data && data.type === 'app-nav' && Array.isArray(data.items)) {
                setAppNavItems(
                    data.items.filter((it: any) => it && typeof it.label === 'string' && typeof it.path === 'string')
                );
            }
        };
        window.addEventListener('message', onMessage);
        return () => window.removeEventListener('message', onMessage);
    }, []);

    // При смене/закрытии приложения старые пункты моста сбрасываем.
    useEffect(() => {
        setAppNavItems([]);
    }, [openPath]);

    useEffect(() => {
        localStorage.setItem('language', lang);
    }, [lang]);

    useEffect(() => {
        if (openPath) {
            const rootEl = document.getElementById('root');
            if (rootEl) {
                rootEl.scrollTo({ top: 0 });
            } else {
                window.scrollTo(0, 0);
            }
        }
    }, [openPath]);

    useEffect(() => {
        fetch('/pages.json')
            .then(res => {
                if (!res.ok) throw new Error('pages manifest not found');
                return res.json();
            })
            .then((data: SitePage[]) => setPages(Array.isArray(data) ? data : []))
            .catch(() => setPages([]));
    }, []);

    useEffect(() => {
        const faviconFrames = [
            'favicon.ico',
            'favicon1.ico',
            'favicon2.ico',
            'favicon3.ico',
            'favicon4.ico'
        ];
        let currentFrame = 0;
        const faviconLink = document.querySelector("link[rel*='icon']") as HTMLLinkElement;

        if (faviconLink) {
            const intervalId = setInterval(() => {
                currentFrame = (currentFrame + 1) % faviconFrames.length;
                faviconLink.href = faviconFrames[currentFrame];
            }, 300);

            return () => clearInterval(intervalId);
        }
    }, []);

    const openApp = useCallback((path: string) => {
        setOpenPath(path);
        const clean = path.replace(/^\/+/, '');
        const url = new URL(window.location.href);
        if (clean) {
            url.search = '?app=' + encodeURIComponent(clean).replace(/%2F/g, '/');
        } else {
            url.search = '';
        }
        window.history.pushState({}, '', url.toString());
    }, []);

    // Обработчик кликов по пунктам моста. Внешние ссылки (http/https)
    // открываются в новой вкладке. Пункты вида "cod_book:page=N" не
    // открывают приложение, а передают команду внутрь книги (iframe).
    const handleOpenApp = useCallback((path: string) => {
        if (/^https?:/i.test(path)) {
            window.open(path, '_blank', 'noopener');
            return;
        }
        const m = path.match(/^cod_book:page=(\d+)$/);
        if (m) {
            const frame = document.querySelector('#root main iframe') as HTMLIFrameElement | null;
            if (frame && frame.contentWindow) {
                frame.contentWindow.postMessage(
                    { type: 'book-goto', page: parseInt(m[1], 10) },
                    window.location.origin
                );
            }
            return;
        }
        openApp(path);
    }, [openApp]);

    const closeApp = useCallback(() => {
        setOpenPath(null);
        const url = new URL(window.location.href);
        url.search = '';
        window.history.pushState({}, '', url.toString());
    }, []);

    useEffect(() => {
        const onPopState = () => {
            const params = new URLSearchParams(window.location.search);
            const app = params.get('app');
            if (app) {
                setOpenPath('/' + app.replace(/^\/+/, ''));
            } else {
                setOpenPath(null);
            }
        };
        window.addEventListener('popstate', onPopState);
        return () => window.removeEventListener('popstate', onPopState);
    }, []);

    const t = useCallback((key: string) => {
        const entry = translations[key];
        if (entry) {
            return entry[lang];
        }
        return key;
    }, [lang]);

    const languageContextValue = useMemo(() => ({ lang, setLang, t }), [lang, setLang, t]);

    const renderSection = (id: string, titleKey: string, children: React.ReactNode) => (
        <section id={id} className="mb-16 scroll-mt-20">
            <h2 className="text-3xl font-bold mb-8 text-gray-100 border-b-2 border-violet-500 pb-2 inline-block">
                {t(titleKey)}
            </h2>
            {children}
        </section>
    );

    return (
        <LanguageContext.Provider value={languageContextValue}>
            <AuthProvider>
            {/* Layer 1: Background Image */}
            <div 
                className="fixed inset-0 w-full h-full bg-cover bg-center bg-no-repeat"
                style={{ backgroundImage: "url('bg.webp')" }}
            ></div>
            {/* Layer 2: Dark Overlay */}
            <div className="fixed inset-0 w-full h-full bg-[#0f1116] opacity-90"></div>
            
            {/* Layer 3: Content */}
            <div className="relative min-h-screen text-gray-200">
                <style>{`
                    .project-grid {
                        /* Фиксированный размер колонки: при скрытии бокового
                           меню (больше места) добавляются новые колонки того же
                           размера, а сами карточки не растягиваются. */
                        display: grid;
                        /* auto-fit: пустые треки схлопываются, justify-content
                           центрирует реальные карточки в ряду. */
                        grid-template-columns: repeat(auto-fit, minmax(240px, 280px));
                        justify-content: center;
                        gap: 1.5rem;
                    }
                    .project-card {
                        /* Высота определяется содержимым; ряд выравнивается
                           по самой высокой карточке (CSS Grid stretch). */
                        height: auto;
                    }
                    @media (max-width: 640px) {
                        /* На телефонах одна карточка в ряду — растягиваем
                           на всю ширину экрана. */
                        .project-grid {
                            grid-template-columns: minmax(0, 1fr);
                        }
                    }
                `}</style>
                 <button onClick={() => setSidebarOpen(!isSidebarOpen)} className="fixed top-4 left-4 p-2 rounded-xl bg-slate-900/70 backdrop-blur-lg border border-slate-700 shadow-2xl hover:bg-slate-800/70 transition-all z-50 active:scale-95" aria-label="Toggle sidebar">
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none">
                        <g stroke="#000" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round">
                            <line x1="3" y1="12" x2="21" y2="12"></line>
                            <line x1="3" y1="6" x2="21" y2="6"></line>
                            <line x1="3" y1="18" x2="21" y2="18"></line>
                        </g>
                        <g stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <line x1="3" y1="12" x2="21" y2="12"></line>
                            <line x1="3" y1="6" x2="21" y2="6"></line>
                            <line x1="3" y1="18" x2="21" y2="18"></line>
                        </g>
                    </svg>
                </button>
                <div className="flex">
                    <Sidebar isOpen={isSidebarOpen} setIsOpen={setSidebarOpen} isAppOpen={!!openPath} onCloseApp={closeApp} openPath={openPath} appNavItems={appNavItems} onOpenApp={handleOpenApp} />
                    <main className={`flex-1 min-w-0 transition-all duration-300 ease-in-out ${isSidebarOpen ? 'md:ml-[45%] lg:ml-[22%]' : 'ml-0'} w-full md:w-auto`}>
                        {openPath ? (
                            <AppView path={openPath} title={pages.find(p => p.path === openPath)?.title || openPath} />
                        ) : (
                            <div className="px-4 sm:px-8 pt-3 sm:pt-5 pb-4 sm:pb-8">
                                <Header sidebarOpen={isSidebarOpen} />

                                {renderSection('gallery', 'nav_gallery', <Gallery />)}
                                
                                {renderSection('ai-projects', 'nav_ai_projects', (
                                    <div className="project-grid">
                                        {projects.ai.map(p => <ProjectCard key={p.titleKey} project={p} pages={pages} onOpenApp={openApp} onOpenComments={(key, title) => setCommentsProject({ key, title })} />)}
                                    </div>
                                ))}

                                {renderSection('info', 'nav_misc', (
                                    <div className="project-grid">
                                        {projects.misc.map(p => <ProjectCard key={p.titleKey} project={p} pages={pages} onOpenApp={openApp} onOpenComments={(key, title) => setCommentsProject({ key, title })} />)}
                                    </div>
                                ))}

                                {renderSection('games', 'nav_games', (
                                    <div className="project-grid">
                                        {projects.games.map(p => <ProjectCard key={p.titleKey} project={p} pages={pages} onOpenApp={openApp} onOpenComments={(key, title) => setCommentsProject({ key, title })} />)}
                                    </div>
                                ))}

                                {renderSection('tools', 'nav_tools', (
                                    <div className="project-grid">
                                        {projects.tools.map(p => <ProjectCard key={p.titleKey} project={p} pages={pages} onOpenApp={openApp} onOpenComments={(key, title) => setCommentsProject({ key, title })} />)}
                                    </div>
                                ))}

                                {renderSection('recommendations', 'nav_recommendations', (
                                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                                        {recommendations.map(r => <RecommendationCard key={r.titleKey} category={r} />)}
                                    </div>
                                ))}
                            </div>
                        )}
                    </main>
                </div>
                <Chat isSidebarOpen={isSidebarOpen} isCommentsOpen={!!commentsProject} />
                <FloatingButtons />
                <AuthModals />
                {commentsProject && (
                    <CommentsModal
                        projectKey={commentsProject.key}
                        title={commentsProject.title}
                        onClose={() => setCommentsProject(null)}
                    />
                )}
            </div>
            </AuthProvider>
        </LanguageContext.Provider>
    );
};

export default App;