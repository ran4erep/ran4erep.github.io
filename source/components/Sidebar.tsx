
import React, { useContext, useEffect, useState } from 'react';
import { LanguageContext } from '../App';
import { navLinks, socialLinks } from '../constants';
import type { LanguageContextType } from '../types';
import { MusicPlayer } from './MusicPlayer';

interface SidebarProps {
    isOpen: boolean;
    setIsOpen: (isOpen: boolean) => void;
    isAppOpen?: boolean;
    onCloseApp?: () => void;
}

const NavLink: React.FC<{ id: string; label: string; onClick: () => void; }> = ({ id, label, onClick }) => {
    const handleClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
        e.preventDefault();
        onClick();
    };

    return (
        <a href={`#${id}`} onClick={handleClick} className="block text-gray-400 hover:text-white hover:bg-white/5 px-3 py-2 rounded-md transition-colors duration-200">
            {label}
        </a>
    );
};

export const Sidebar: React.FC<SidebarProps> = ({ isOpen, setIsOpen, isAppOpen, onCloseApp }) => {
    const { t } = useContext(LanguageContext) as LanguageContextType;
    const [currentYear, setCurrentYear] = useState(new Date().getFullYear());

    useEffect(() => {
        setCurrentYear(new Date().getFullYear());
    }, []);

    const handleNavLinkClick = (id: string) => {
        if (window.innerWidth <= 768) {
            setIsOpen(false);
        }
        if (isAppOpen && onCloseApp) {
            onCloseApp();
        }
        setTimeout(() => {
            document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
        }, 80);
    };
    
    return (
        <aside className={`fixed top-0 left-0 h-full bg-[#101218e6] backdrop-blur-lg border-r border-white/10 z-40 transition-transform duration-300 ease-in-out w-[85%] sm:w-[60%] md:w-[22%] ${isOpen ? 'translate-x-0' : '-translate-x-full'}`}>
            <div className="flex flex-col h-full p-4 overflow-y-auto">
                <div className="text-center mb-4">
                     <img src="https://ran4erep.github.io/logo.png" alt="Avatar" className="w-16 h-16 rounded-full mx-auto mb-2 border-2 border-violet-500"/>
                </div>

                <MusicPlayer />

                <nav className="my-4 flex-grow">
                    {isAppOpen && (
                        <button onClick={onCloseApp} className="w-full text-left mb-2 flex items-center gap-2 px-3 py-2 rounded-md bg-violet-600 hover:bg-violet-500 text-white font-semibold transition-colors duration-200">
                            <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
                            {t('nav_home')}
                        </button>
                    )}
                    {navLinks.map(link => (
                        <NavLink key={link.href} id={link.href.substring(1)} label={t(link.labelKey)} onClick={() => handleNavLinkClick(link.href.substring(1))} />
                    ))}
                </nav>
                
                <div className="mt-auto">
                    <div className="flex justify-center gap-4 my-4">
                        {socialLinks.map(link => (
                            <a key={link.href} href={link.href} target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-white transition-transform duration-200 hover:scale-110 relative group">
                                <img src={link.icon} alt={link.label} className={`w-6 h-6 rounded-sm ${link.label === 'GitHub' ? 'filter invert' : ''}`} />
                                <span className="sidebar-tooltip">{t(link.tooltipKey)}</span>
                            </a>
                        ))}
                    </div>
                    <div className="text-center text-xs text-gray-500">
                        &#169; by ran4erep, 2023-{currentYear}
                    </div>
                </div>
            </div>
            <style>{`
                .sidebar-tooltip {
                    position: absolute;
                    bottom: 100%;
                    left: 50%;
                    transform: translateX(-50%);
                    margin-bottom: 8px;
                    white-space: nowrap;
                    background-color: #1f2937;
                    color: white;
                    font-size: 12px;
                    padding: 4px 8px;
                    border-radius: 6px;
                    opacity: 0;
                    visibility: hidden;
                    transition: opacity 0.2s, visibility 0.2s;
                    pointer-events: none;
                }
                @media (hover: hover) {
                    .group:hover .sidebar-tooltip {
                        opacity: 1;
                        visibility: visible;
                    }
                }
            `}</style>
        </aside>
    );
};
