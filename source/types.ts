
export type Language = 'ru' | 'en';

export interface LanguageContextType {
    lang: Language;
    setLang: React.Dispatch<React.SetStateAction<Language>>;
    t: (key: string) => string;
}

export interface Project {
    titleKey: string;
    descriptionKey: string;
    link: string;
    linkTypeKey: 'btn_go' | 'btn_watch' | 'btn_github' | 'btn_play' | 'btn_download_apk' | 'btn_read' | 'btn_open';
    tech?: string;
    image?: string;
    secondaryLink?: string;
    secondaryLinkTypeKey?: 'btn_play';
}

export interface NavLink {
    href: string;
    labelKey: string;
}

export interface SocialLink {
    href: string;
    label: string;
    icon: string;
    tooltipKey: string;
}

export interface Recommendation {
    url: string;
    favicon: string;
    name: string;
    descriptionKey: string;
}

export interface RecommendationCategory {
    titleKey: string;
    icon: 'controller' | 'tools' | 'joystick' | 'film';
    links: Recommendation[];
    tech: string;
}

export interface Track {
    artist: string;
    title: string;
    path: string;
}

export interface ChatMessage {
    nickname: string;
    message: string;
    timestamp: number;
    image?: string;
}