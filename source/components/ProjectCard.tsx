
import React, { useContext } from 'react';
import type { Project, LanguageContextType } from '../types';
import { LanguageContext } from '../App';
import { languageIcons } from '../constants';

interface ProjectCardProps {
    project: Project;
}

export const ProjectCard: React.FC<ProjectCardProps> = ({ project }) => {
    const { t } = useContext(LanguageContext) as LanguageContextType;
    const iconClass = project.tech ? languageIcons[project.tech.toLowerCase()] || 'devicon-devicon-plain' : '';

    return (
        <div className="relative group bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-lg p-6 flex flex-col transition-all duration-300 hover:border-violet-500 hover:-translate-y-1 overflow-hidden h-full">
            <div className="flex flex-col flex-grow">
                {project.image && <img src={project.image} alt={t(project.titleKey)} className="rounded-md mb-4 w-full h-40 object-cover" />}
                <h3 className="text-xl font-bold text-gray-100 mb-2">{t(project.titleKey)}</h3>
                <p className="text-gray-400 text-sm flex-grow mb-4">{t(project.descriptionKey)}</p>
                <div className="mt-auto flex flex-col gap-2">
                    <a href={project.link} target="_blank" rel="noopener noreferrer" className="inline-block bg-violet-600 text-white text-center font-semibold px-4 py-2 rounded-md transition-all duration-200 hover:bg-violet-500 active:bg-violet-700 active:scale-[0.98]">
                        {t(project.linkTypeKey)}
                    </a>
                    {project.secondaryLink && project.secondaryLinkTypeKey && (
                         <a href={project.secondaryLink} target="_blank" rel="noopener noreferrer" className="inline-block bg-gray-600 text-white text-center font-semibold px-4 py-2 rounded-md transition-all duration-200 hover:bg-gray-500 active:bg-gray-700 active:scale-[0.98]">
                            {t(project.secondaryLinkTypeKey)}
                         </a>
                    )}
                </div>
            </div>
            {project.tech && (
                <i className={`${iconClass} absolute -bottom-8 -right-8 text-[160px] text-white/5 group-hover:text-white/10 transition-all duration-300 group-hover:scale-110 group-hover:-rotate-6 -z-10`}></i>
            )}
        </div>
    );
};