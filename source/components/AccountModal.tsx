
import React, { useState, useContext } from 'react';
import { useAuth } from '../auth';
import { LanguageContext } from '../App';
import type { LanguageContextType } from '../types';

interface AccountModalProps {
    open: boolean;
    onClose: () => void;
}

export const AccountModal: React.FC<AccountModalProps> = ({ open, onClose }) => {
    const { user, logout } = useAuth();
    const { t } = useContext(LanguageContext) as LanguageContextType;

    if (!open || !user) return null;

    const registeredAt = typeof user.registeredAt === 'number'
        ? new Intl.DateTimeFormat('ru-RU', {
            day: '2-digit',
            month: 'long',
            year: 'numeric',
            timeZone: 'Europe/Kiev',
          }).format(new Date(user.registeredAt))
        : null;

    return (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
            <div className="relative w-full max-w-sm bg-slate-900/70 backdrop-blur-lg border border-slate-700 rounded-xl shadow-2xl p-6">
                <div className="flex items-center justify-between mb-5">
                    <h3 className="text-lg font-semibold text-white">{t('auth_account')}</h3>
                    <button
                        type="button"
                        onClick={onClose}
                        className="text-slate-400 hover:text-white text-2xl leading-none transition-transform active:scale-90"
                        aria-label={t('close_tooltip')}
                    >
                        &times;
                    </button>
                </div>

                <div className="flex flex-col items-center gap-3">
                    {user.avatar ? (
                        <img src={user.avatar} alt="" className="w-20 h-20 rounded-full object-cover border-2 border-violet-500/40" />
                    ) : (
                        <span className="w-20 h-20 rounded-full bg-violet-500/40 flex items-center justify-center">
                            <svg xmlns="http://www.w3.org/2000/svg" width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-gray-200">
                                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                                <circle cx="12" cy="7" r="4"></circle>
                            </svg>
                        </span>
                    )}
                    <div className="text-xl font-semibold text-white break-all text-center">{user.username}</div>
                    {registeredAt && (
                        <div className="text-sm text-slate-400">{t('auth_registered_at')}: {registeredAt}</div>
                    )}
                </div>

                <button
                    type="button"
                    onClick={logout}
                    className="mt-6 w-full bg-red-500/80 hover:bg-red-500 text-white font-medium rounded-lg py-2.5 transition-all active:scale-[0.98]"
                >
                    {t('auth_logout')}
                </button>
            </div>
        </div>
    );
};
