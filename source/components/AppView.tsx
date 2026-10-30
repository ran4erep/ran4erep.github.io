
import React, { useContext } from 'react';
import { LanguageContext } from '../App';
import type { LanguageContextType } from '../types';

interface AppViewProps {
    path: string;
    title: string;
    onClose: () => void;
}

export const AppView: React.FC<AppViewProps> = ({ path, title, onClose }) => {
    const { t } = useContext(LanguageContext) as LanguageContextType;

    return (
        <div className="h-[calc(100dvh-4rem)] rounded-lg overflow-hidden flex flex-col border border-slate-700 bg-[#0f1116]">
            <div className="flex items-center justify-between gap-4 px-4 py-3 bg-slate-900 border-b border-slate-700">
                <span className="text-gray-100 font-semibold truncate">{title}</span>
                <button onClick={onClose} className="flex-shrink-0 inline-flex items-center gap-2 px-3 py-1.5 rounded-md bg-white/5 hover:bg-white/10 text-gray-300 hover:text-white text-sm transition-colors">
                    <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/></svg>
                    {t('btn_back')}
                </button>
            </div>
            <iframe src={path} title={title} className="flex-1 w-full border-0" />
        </div>
    );
};
