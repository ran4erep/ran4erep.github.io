
import React, { useState, useContext } from 'react';
import { useAuth, AUTH_ERR } from '../auth';
import { LanguageContext } from '../App';
import type { LanguageContextType } from '../types';

const ERROR_KEYS: Record<string, string> = {
    [AUTH_ERR.FILL]: 'auth_err_fill',
    [AUTH_ERR.NOT_FOUND]: 'auth_err_not_found',
    [AUTH_ERR.WRONG_PASSWORD]: 'auth_err_wrong_password',
    [AUTH_ERR.NETWORK]: 'auth_err_network',
    [AUTH_ERR.CORRUPTED]: 'auth_err_corrupted',
    [AUTH_ERR.EXISTS]: 'auth_err_exists',
};

type Mode = 'login' | 'register';

export const LoginModal: React.FC = () => {
    const { loginOpen, closeLogin, login, register } = useAuth();
    const { t } = useContext(LanguageContext) as LanguageContextType;
    const [mode, setMode] = useState<Mode>('login');
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [errorKey, setErrorKey] = useState<string | null>(null);
    const [submitting, setSubmitting] = useState(false);

    if (!loginOpen) return null;

    const switchMode = (m: Mode) => {
        setMode(m);
        setErrorKey(null);
        setPassword('');
    };

    const handleSubmit = async (e?: React.FormEvent) => {
        e?.preventDefault();
        if (submitting) return;
        setSubmitting(true);
        setErrorKey(null);
        try {
            if (mode === 'register') {
                await register(username, password);
            } else {
                await login(username, password);
            }
            setUsername('');
            setPassword('');
        } catch (err) {
            const code = err && typeof err.message === 'string' ? err.message : AUTH_ERR.NETWORK;
            setErrorKey(ERROR_KEYS[code] ?? 'auth_err_network');
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => !submitting && closeLogin()} />
            <form
                onSubmit={handleSubmit}
                className="relative w-full max-w-sm bg-slate-900/70 backdrop-blur-lg border border-slate-700 rounded-xl shadow-2xl p-6"
            >
                <div className="flex items-center justify-between mb-5">
                    <h3 className="text-lg font-semibold text-white">{t(mode === 'login' ? 'auth_login_title' : 'auth_register_title')}</h3>
                    <button
                        type="button"
                        onClick={() => !submitting && closeLogin()}
                        className="text-slate-400 hover:text-white text-2xl leading-none transition-transform active:scale-90"
                        aria-label={t('close_tooltip')}
                    >
                        &times;
                    </button>
                </div>

                <div className="space-y-3">
                    <input
                        type="text"
                        value={username}
                        onChange={e => { setUsername(e.target.value); setErrorKey(null); }}
                        placeholder={t('auth_username_placeholder')}
                        autoComplete="username"
                        maxLength={50}
                        disabled={submitting}
                        className="w-full bg-slate-800 border border-slate-600 rounded-lg px-3.5 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-violet-500 disabled:opacity-60"
                    />
                    <input
                        type="password"
                        value={password}
                        onChange={e => { setPassword(e.target.value); setErrorKey(null); }}
                        placeholder={t('auth_password_placeholder')}
                        autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                        disabled={submitting}
                        className="w-full bg-slate-800 border border-slate-600 rounded-lg px-3.5 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-violet-500 disabled:opacity-60"
                    />
                </div>

                {errorKey && (
                    <p className="mt-3 text-sm text-red-400">{t(errorKey)}</p>
                )}

                <button
                    type="submit"
                    disabled={submitting}
                    className="mt-5 w-full bg-violet-600 hover:bg-violet-500 disabled:opacity-60 text-white font-medium rounded-lg py-2.5 transition-all active:scale-[0.98]"
                >
                    {submitting ? '…' : t(mode === 'login' ? 'auth_login_submit' : 'auth_register_submit')}
                </button>

                {mode === 'login' ? (
                    <button
                        type="button"
                        onClick={() => switchMode('register')}
                        disabled={submitting}
                        className="mt-4 w-full text-sm text-violet-400 hover:text-violet-300 transition-colors"
                    >
                        {t('auth_no_account_register')}
                    </button>
                ) : (
                    <button
                        type="button"
                        onClick={() => switchMode('login')}
                        disabled={submitting}
                        className="mt-4 w-full text-sm text-violet-400 hover:text-violet-300 transition-colors"
                    >
                        {t('auth_have_account_login')}
                    </button>
                )}
            </form>
        </div>
    );
};
