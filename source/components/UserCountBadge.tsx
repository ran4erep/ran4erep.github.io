import React, { useContext, useEffect, useState } from 'react';
import { LanguageContext } from '../App';
import type { LanguageContextType } from '../types';

interface UserCountBadgeProps {
    className?: string;
}

// Бейдж количества зарегистрированных пользователей (users-count.json).
export const UserCountBadge: React.FC<UserCountBadgeProps> = ({ className }) => {
    const { lang } = useContext(LanguageContext) as LanguageContextType;
    const [count, setCount] = useState<number | null>(null);

    useEffect(() => {
        fetch('/users-count.json')
            .then(r => (r.ok ? r.json() : null))
            .then(d => {
                if (d && typeof d.count === 'number') setCount(d.count);
            })
            .catch(() => {});
    }, []);

    if (count === null) return null;

    return (
        <div className={`text-xs text-gray-500 whitespace-nowrap inline-flex items-center gap-1 ${className || ''}`}>
            <svg
                width="14" height="14" viewBox="0 0 24 24"
                fill="none" stroke="currentColor" strokeWidth="2"
                strokeLinecap="round" strokeLinejoin="round"
                className="shrink-0"
                aria-hidden="true"
            >
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                <circle cx="9" cy="7" r="4" />
                <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                <path d="M16 3.13a4 4 0 0 1 0 7.75" />
            </svg>
            {count} {lang === 'en' ? 'users' : 'пользователей'}
        </div>
    );
};
