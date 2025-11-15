

import React, { useState, useEffect, createContext, useCallback, useMemo } from 'react';
import { Sidebar } from './components/Sidebar';
import { Header } from './components/Header';
import { ProjectCard } from './components/ProjectCard';
import { RecommendationCard } from './components/RecommendationCard';
import { Gallery } from './components/Gallery';
import { Chat } from './components/Chat';
import { FloatingButtons } from './components/FloatingButtons';
import { translations, projects, recommendations } from './constants';
import type { Language, LanguageContextType } from './types';

export const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

const App: React.FC = () => {
    const [lang, setLang] = useState<Language>(() => {
        const savedLang = localStorage.getItem('language');
        return (savedLang === 'en' || savedLang === 'ru') ? savedLang : 'ru';
    });
    const [isSidebarOpen, setSidebarOpen] = useState(() => {
        // Check user agent for mobile keywords. This is more reliable than just touch detection,
        // as it correctly identifies devices like Windows convertibles as desktops.
        const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
        return !isMobile;
    });

    useEffect(() => {
        localStorage.setItem('language', lang);
    }, [lang]);

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
            {/* Layer 1: Background Image */}
            <div 
                className="fixed inset-0 w-full h-full bg-cover bg-center bg-no-repeat"
                style={{ backgroundImage: "url('bg.webp')" }}
            ></div>
            {/* Layer 2: Dark Overlay */}
            <div className="fixed inset-0 w-full h-full bg-[#0f1116] opacity-90"></div>
            
            {/* Layer 3: Content */}
            <div className="relative min-h-screen text-gray-200">
                 <button onClick={() => setSidebarOpen(!isSidebarOpen)} className="fixed top-4 left-4 p-2 rounded-md bg-white/5 hover:bg-white/10 transition-transform z-50 active:scale-95" aria-label="Toggle sidebar">
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <line x1="3" y1="12" x2="21" y2="12"></line>
                        <line x1="3" y1="6" x2="21" y2="6"></line>
                        <line x1="3" y1="18" x2="21" y2="18"></line>
                    </svg>
                </button>
                <div className="flex">
                    <Sidebar isOpen={isSidebarOpen} setIsOpen={setSidebarOpen} />
                    <main className={`flex-1 min-w-0 transition-all duration-300 ease-in-out ${isSidebarOpen ? 'md:ml-[22%]' : 'ml-0'} w-full md:w-auto`}>
                        <div className="p-4 sm:p-8">
                            <Header />

                            {renderSection('gallery', 'nav_gallery', <Gallery />)}
                            
                            {renderSection('ai-projects', 'nav_ai_projects', (
                                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                                    {projects.ai.map(p => <ProjectCard key={p.titleKey} project={p} />)}
                                </div>
                            ))}

                            {renderSection('info', 'nav_misc', (
                                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                                    {projects.misc.map(p => <ProjectCard key={p.titleKey} project={p} />)}
                                </div>
                            ))}

                            {renderSection('games', 'nav_games', (
                                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                                    {projects.games.map(p => <ProjectCard key={p.titleKey} project={p} />)}
                                </div>
                            ))}

                            {renderSection('tools', 'nav_tools', (
                                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                                    {projects.tools.map(p => <ProjectCard key={p.titleKey} project={p} />)}
                                </div>
                            ))}

                            {renderSection('recommendations', 'nav_recommendations', (
                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                                    {recommendations.map(r => <RecommendationCard key={r.titleKey} category={r} />)}
                                </div>
                            ))}
                        </div>
                    </main>
                </div>
                <Chat isSidebarOpen={isSidebarOpen} />
                <FloatingButtons />
            </div>
        </LanguageContext.Provider>
    );
};

export default App;