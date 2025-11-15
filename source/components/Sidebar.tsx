
import React, { useContext, useEffect, useState } from 'react';
import { LanguageContext } from '../App';
import { navLinks, socialLinks } from '../constants';
import type { LanguageContextType } from '../types';
import { MusicPlayer } from './MusicPlayer';

interface SidebarProps {
    isOpen: boolean;
    setIsOpen: (isOpen: boolean) => void;
}

const NavLink: React.FC<{ href: string; label: string; onClick: () => void; }> = ({ href, label, onClick }) => {
    const scrollToSection = (e: React.MouseEvent<HTMLAnchorElement>) => {
        e.preventDefault();
        const targetId = href.substring(1);
        const targetElement = document.getElementById(targetId);
        if (targetElement) {
            targetElement.scrollIntoView({ behavior: 'smooth' });
        }
        onClick();
    };

    return (
        <a href={href} onClick={scrollToSection} className="block text-gray-400 hover:text-white hover:bg-white/5 px-3 py-2 rounded-md transition-colors duration-200">
            {label}
        </a>
    );
};

export const Sidebar: React.FC<SidebarProps> = ({ isOpen, setIsOpen }) => {
    const { t } = useContext(LanguageContext) as LanguageContextType;
    const [currentYear, setCurrentYear] = useState(new Date().getFullYear());

    useEffect(() => {
        setCurrentYear(new Date().getFullYear());
    }, []);

    const handleNavLinkClick = () => {
        if (window.innerWidth <= 768) {
            setIsOpen(false);
        }
    };
    
    return (
        <aside className={`fixed top-0 left-0 h-full bg-[#101218e6] backdrop-blur-lg border-r border-white/10 z-40 transition-transform duration-300 ease-in-out w-[85%] sm:w-[60%] md:w-[22%] ${isOpen ? 'translate-x-0' : '-translate-x-full'}`}>
            <div className="flex flex-col h-full p-4 overflow-y-auto">
                <div className="text-center mb-4">
                     <img src="https://ran4erep.github.io/logo.png" alt="Avatar" className="w-16 h-16 rounded-full mx-auto mb-2 border-2 border-violet-500"/>
                </div>

                <MusicPlayer />

                <nav className="my-4 flex-grow">
                    {navLinks.map(link => (
                        <NavLink key={link.href} href={link.href} label={t(link.labelKey)} onClick={handleNavLinkClick} />
                    ))}
                </nav>
                
                <div className="mt-auto">
                    <div className="flex justify-center gap-4 my-4">
                        {socialLinks.map(link => (
                            <a key={link.href} href={link.href} target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-white transition-transform duration-200 hover:scale-110 relative group">
                                <img src={link.icon} alt={link.label} className={`w-6 h-6 rounded-sm ${link.label === 'GitHub' ? 'filter invert' : ''}`} />
                                <span className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 whitespace-nowrap bg-gray-800 text-white text-xs px-2 py-1 rounded-md opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">{t(link.tooltipKey)}</span>
                            </a>
                        ))}
                    </div>
                    <div className="text-center text-xs text-gray-500">
                        &#169; by ran4erep, 2023-{currentYear}
                    </div>
                </div>
            </div>
        </aside>
    );
};
