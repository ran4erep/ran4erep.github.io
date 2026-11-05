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
        <div className={`text-xs text-gray-500 whitespace-nowrap ${className || ''}`}>
            👥 {count} {lang === 'en' ? 'users' : 'пользователей'}
        </div>
    );
};
