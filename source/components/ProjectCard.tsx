
import React, { useContext, useRef, useState } from 'react';
import type { Project, LanguageContextType, SitePage } from '../types';
import { LanguageContext } from '../App';
import { languageIcons } from '../constants';
import { useCommentsCount } from './Comments';

interface ProjectCardProps {
    project: Project;
    pages?: SitePage[];
    onOpenApp?: (path: string) => void;
    onOpenComments?: (projectKey: string, title: string) => void;
}

export const ProjectCard: React.FC<ProjectCardProps> = ({ project, pages, onOpenApp, onOpenComments }) => {
    const { t } = useContext(LanguageContext) as LanguageContextType;
    const iconClass = project.tech ? languageIcons[project.tech.toLowerCase()] || 'devicon-devicon-plain' : '';
    const cardRef = useRef<HTMLDivElement>(null);
    const [tilt, setTilt] = useState({ x: 0, y: 0 });
    const commentCount = useCommentsCount(project.titleKey);

    // Лёгкий 3D-наклон карточки от положения курсора (работает на мыши).
    const handleMouseMove = (e: React.MouseEvent) => {
        const el = cardRef.current;
        if (!el) return;
        const rect = el.getBoundingClientRect();
        const px = (e.clientX - rect.left) / rect.width - 0.5;
        const py = (e.clientY - rect.top) / rect.height - 0.5;
        setTilt({ x: -py * 10, y: px * 10 });
    };

    const resetTilt = () => setTilt({ x: 0, y: 0 });

    const pageForLink = (link?: string) => {
        if (!link || !pages || /^https?:/i.test(link)) return undefined;
        const norm = link.endsWith('/') ? link : link + '/';
        return pages.find(p => p.path === norm);
    };

    return (
        <div className="flex flex-col gap-2 h-full">
            <div
                ref={cardRef}
                onMouseMove={handleMouseMove}
                onMouseLeave={resetTilt}
                className="project-card relative isolate group bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-lg p-6 flex flex-col transition-colors duration-300 hover:border-violet-500 overflow-hidden flex-1"
                style={{
                    transform: `perspective(800px) rotateX(${tilt.x}deg) rotateY(${tilt.y}deg)`,
                    transition: 'transform 120ms ease-out',
                }}
            >
                <div className="relative z-0 flex flex-col flex-grow">
                    {project.image && <img src={project.image} alt={t(project.titleKey)} className="rounded-md mb-4 w-full object-cover aspect-[16/9]" />}
                    <h3 className="text-xl font-bold text-gray-100 mb-2">{t(project.titleKey)}</h3>
                    <p className="text-gray-400 text-sm flex-grow mb-4">{t(project.descriptionKey)}</p>
                    <div className="mt-auto flex flex-col gap-2">
                        {pageForLink(project.link) ? (
                            <button onClick={() => onOpenApp?.(pageForLink(project.link)!.path)} className="inline-block bg-violet-600 text-white text-center font-semibold px-4 py-2 rounded-md transition-all duration-200 hover:bg-violet-500 active:bg-violet-700 active:scale-[0.98]">
                                {t(project.linkTypeKey)}
                            </button>
                        ) : (
                            <a href={project.link} target="_blank" rel="noopener noreferrer" className="inline-block bg-violet-600 text-white text-center font-semibold px-4 py-2 rounded-md transition-all duration-200 hover:bg-violet-500 active:bg-violet-700 active:scale-[0.98]">
                                {t(project.linkTypeKey)}
                            </a>
                        )}
                        {project.secondaryLink && project.secondaryLinkTypeKey && (
                            pageForLink(project.secondaryLink) ? (
                                <button onClick={() => onOpenApp?.(pageForLink(project.secondaryLink)!.path)} className="inline-block bg-gray-600 text-white text-center font-semibold px-4 py-2 rounded-md transition-all duration-200 hover:bg-gray-500 active:bg-gray-700 active:scale-[0.98]">
                                    {t(project.secondaryLinkTypeKey)}
                                </button>
                            ) : (
                                <a href={project.secondaryLink} target="_blank" rel="noopener noreferrer" className="inline-block bg-gray-600 text-white text-center font-semibold px-4 py-2 rounded-md transition-all duration-200 hover:bg-gray-500 active:bg-gray-700 active:scale-[0.98]">
                                    {t(project.secondaryLinkTypeKey)}
                                </a>
                            )
                        )}
                    </div>
                </div>
                {project.tech && (
                    <i className={`${iconClass} absolute -bottom-6 -right-6 text-[160px] text-violet-500/10 group-hover:text-violet-400/25 transition-all duration-300 group-hover:scale-110 group-hover:-rotate-6 -z-10`}></i>
                )}
            </div>

            {/* Кнопка комментариев — ПОД карточкой */}
            <button
                type="button"
                onClick={() => onOpenComments?.(project.titleKey, t(project.titleKey))}
                className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-slate-800/50 hover:bg-slate-800 border border-slate-700 text-gray-300 hover:text-white text-sm font-medium transition-colors"
            >
                <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                </svg>
                {t('comments_button')} <span className="text-violet-400 font-semibold">({commentCount})</span>
            </button>
        </div>
    );
};