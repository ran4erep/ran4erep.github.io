
import React, { useContext } from 'react';
import type { RecommendationCategory, LanguageContextType } from '../types';
import { LanguageContext } from '../App';
import { languageIcons } from '../constants';

interface RecommendationCardProps {
    category: RecommendationCategory;
}

const iconMap: { [key: string]: string } = {
    controller: '🎮',
    tools: '🔧',
    joystick: '🕹️',
    film: '🎬'
};


export const RecommendationCard: React.FC<RecommendationCardProps> = ({ category }) => {
    const { t } = useContext(LanguageContext) as LanguageContextType;
    const iconClass = languageIcons[category.tech.toLowerCase()] || 'devicon-devicon-plain';

    return (
        <div className="relative group bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-lg p-6 flex flex-col transition-all duration-300 hover:border-violet-500 hover:-translate-y-1 overflow-hidden">
            <h3 className="text-xl font-bold text-violet-400 mb-4 flex items-center gap-2">
                <span>{iconMap[category.icon]}</span>
                {t(category.titleKey)}
            </h3>
            <div className="flex-grow overflow-y-auto pr-2 -mr-2 space-y-2 max-h-[250px] custom-scrollbar">
                {category.links.map(link => (
                    <a key={link.url} href={link.url} target="_blank" rel="noopener noreferrer" className="block p-3 bg-white/5 rounded-md hover:bg-white/10 transition-colors duration-200">
                        <div className="flex items-center gap-3">
                            <img src={link.favicon} alt="" className="w-4 h-4 rounded-sm flex-shrink-0" onError={(e) => e.currentTarget.style.display = 'none'} />
                            <div className="flex-grow">
                                <p className="font-semibold text-gray-200">{link.name}</p>
                                <p className="text-xs text-gray-400 mt-1">{t(link.descriptionKey)}</p>
                            </div>
                        </div>
                    </a>
                ))}
            </div>
             <i className={`${iconClass} absolute -bottom-8 -right-8 text-[160px] text-white/5 group-hover:text-white/10 transition-all duration-300 group-hover:scale-110 group-hover:-rotate-6 -z-10`}></i>
        </div>
    );
};