
import React, { useState, useEffect, useContext } from 'react';
import { LanguageContext } from '../App';
import type { LanguageContextType } from '../types';

export const FloatingButtons: React.FC = () => {
    const { t } = useContext(LanguageContext) as LanguageContextType;
    const [isVisible, setIsVisible] = useState(false);
    
    const toggleVisibility = () => {
        if (window.pageYOffset > 300) {
            setIsVisible(true);
        } else {
            setIsVisible(false);
        }
    };
    
    const scrollToTop = () => {
        window.scrollTo({
            top: 0,
            behavior: 'smooth'
        });
    };
    
    useEffect(() => {
        window.addEventListener('scroll', toggleVisibility);
        return () => window.removeEventListener('scroll', toggleVisibility);
    }, []);

    return (
        <div className="fixed bottom-24 right-5 z-50 flex flex-col gap-3">
            {isVisible && (
                <button onClick={scrollToTop} id="new-scroll-top" className="group w-14 h-14 bg-violet-600 hover:bg-violet-500 text-white rounded-full flex items-center justify-center shadow-lg transition-transform hover:scale-110 active:scale-95">
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m18 15-6-6-6 6"/></svg>
                    <span className="tooltip-left">{t('ontop_tooltip')}</span>
                </button>
            )}
             <style>{`
                .tooltip-left {
                    position: absolute;
                    right: 110%;
                    top: 50%;
                    transform: translateY(-50%);
                    background-color: #1f2937;
                    color: white;
                    padding: 4px 8px;
                    border-radius: 4px;
                    font-size: 12px;
                    white-space: nowrap;
                    opacity: 0;
                    visibility: hidden;
                    transition: opacity 0.2s, visibility 0.2s;
                    pointer-events: none;
                }
                .group:hover .tooltip-left {
                    opacity: 1;
                    visibility: visible;
                }
            `}</style>
        </div>
    );
};