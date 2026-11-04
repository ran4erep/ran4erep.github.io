import React from 'react';

interface UserAvatarProps {
    avatar?: string | null;
    /** Классы размера, например "w-8 h-8" */
    className?: string;
    /** Стиль рамки вокруг аватара */
    ring?: string;
}

/** Круглый аватар пользователя. Если аватара нет — заглушка: человечек (голова и плечи) на фиолетовом фоне. */
export const UserAvatar: React.FC<UserAvatarProps> = ({ avatar, className = 'w-8 h-8', ring = '' }) => {
    if (avatar) {
        return (
            <img
                src={avatar}
                alt=""
                className={`rounded-full object-cover shrink-0 ${ring} ${className}`}
            />
        );
    }
    return (
        <span className={`rounded-full bg-violet-500/40 flex items-center justify-center shrink-0 ${ring} ${className}`}>
            <svg
                xmlns="http://www.w3.org/2000/svg"
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="text-gray-200"
            >
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                <circle cx="12" cy="7" r="4"></circle>
            </svg>
        </span>
    );
};
