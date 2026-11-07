import React, { useState, useEffect, useContext, useRef } from 'react';
import { onChildAdded, push, onValue, ref } from "https://www.gstatic.com/firebasejs/11.3.1/firebase-database.js";
import { LanguageContext } from '../App';
import { useAuth } from '../auth';
import { chatDatabase } from '../firebaseChat';
import { UserAvatar } from './UserAvatar';
import type { LanguageContextType } from '../types';

interface Comment {
    key: string;
    nickname: string;
    message: string;
    timestamp: number;
    avatar?: string | null;
}

const MAX_LEN = 300;

const escapeHtml = (unsafe: string) => unsafe
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");

const formatTs = (ts: number) => {
    const d = new Date(ts);
    const now = new Date();
    const sameDay = d.toDateString() === now.toDateString();
    const time = d.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
    if (sameDay) return time;
    const date = d.toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit' });
    return `${date} ${time}`;
};

/** Счётчик комментариев для проекта. */
export function useCommentsCount(projectKey: string): number {
    const [count, setCount] = useState(0);
    const commentsRef = ref(chatDatabase, `comments/${projectKey}`);
    useEffect(() => {
        const un = onValue(commentsRef, snap => {
            setCount(snap.exists() ? Object.keys(snap.val()).length : 0);
        });
        return () => un();
    }, [commentsRef]);
    return count;
}

/** Глобальная модалка комментариев (поверх сайта). */
interface CommentsModalProps {
    projectKey: string;
    title: string;
    onClose: () => void;
}

export const CommentsModal: React.FC<CommentsModalProps> = ({ projectKey, title, onClose }) => {
    const { t } = useContext(LanguageContext) as LanguageContextType;
    const { user, openLogin } = useAuth();
    const commentsRef = ref(chatDatabase, `comments/${projectKey}`);

    const [messages, setMessages] = useState<Comment[]>([]);
    const [text, setText] = useState('');
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const listRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const un = onChildAdded(commentsRef, snap => {
            const v = snap.val();
            if (!v || !v.nickname) return;
            setMessages(prev => prev.some(m => m.key === snap.key)
                ? prev
                : [...prev, { key: snap.key as string, ...v }]);
        });
        return () => un();
    }, [commentsRef]);

    useEffect(() => {
        if (listRef.current) {
            listRef.current.scrollTop = listRef.current.scrollHeight;
        }
    }, [messages]);

    const send = async () => {
        if (!user) { openLogin(); return; }
        const msg = text.trim();
        if (!msg) return;
        setBusy(true);
        setError(null);
        try {
            // Правила RTDB требуют, чтобы avatar был строкой или отсутствовал.
            // null отправлять нельзя — иначе сервер отклонит запись.
            const payload: Record<string, unknown> = {
                nickname: user.username,
                message: msg,
                timestamp: Date.now(),
            };
            if (user.avatar) payload.avatar = user.avatar;
            await push(commentsRef, payload);
            setText('');
        } catch (e: any) {
            console.error('comment send failed', e);
            setError(e?.code || e?.message || 'Ошибка отправки');
        } finally {
            setBusy(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[220] flex items-end sm:items-center justify-center p-0 sm:p-4">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
            <div className="relative w-full sm:max-w-lg max-h-[90vh] sm:max-h-[80vh] bg-slate-900/90 backdrop-blur-lg border border-slate-700 rounded-t-2xl sm:rounded-2xl shadow-2xl flex flex-col">
                {/* Шапка */}
                <div className="flex items-center justify-between p-4 border-b border-slate-700">
                    <h3 className="text-white font-semibold truncate">{title}</h3>
                    <button
                        onClick={onClose}
                        className="text-slate-400 hover:text-white text-2xl leading-none transition-transform active:scale-90"
                        aria-label={t('close_tooltip')}
                    >
                        &times;
                    </button>
                </div>

                {/* Список */}
                <div ref={listRef} className="flex-grow overflow-y-auto p-4 space-y-3 custom-scrollbar overscroll-contain">
                    {messages.length === 0 && (
                        <div className="text-center text-slate-500 text-sm py-8">
                            {t('comments_empty')}
                        </div>
                    )}
                    {messages.map(m => (
                        <div key={m.key} className="bg-white/5 p-3 rounded-lg">
                            <div className="flex items-center gap-2 mb-1 flex-wrap">
                                <UserAvatar avatar={m.avatar || null} className="w-6 h-6" />
                                <span className="text-violet-400 font-bold text-sm">{escapeHtml(m.nickname)}</span>
                                <span className="text-gray-500 text-xs ml-auto">{formatTs(m.timestamp)}</span>
                            </div>
                            <p className="text-gray-200 text-sm break-words">{escapeHtml(m.message)}</p>
                        </div>
                    ))}
                </div>

                {/* Ввод */}
                <div className="p-3 border-t border-slate-700">
                    {error && (
                        <div className="mb-2 text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-md px-3 py-2">
                            {error}
                        </div>
                    )}
                    {user ? (
                        <div className="flex items-center gap-2">
                            <input
                                type="text"
                                value={text}
                                onChange={e => setText(e.target.value)}
                                onKeyPress={e => e.key === 'Enter' && !busy && send()}
                                placeholder={t('comments_placeholder')}
                                maxLength={MAX_LEN}
                                className="flex-1 bg-slate-800 border border-slate-600 rounded-md px-3 py-2 text-white text-sm placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-violet-500"
                            />
                            <button
                                onClick={send}
                                disabled={busy || !text.trim()}
                                className="shrink-0 px-3 py-2 bg-violet-600 hover:bg-violet-500 disabled:opacity-40 text-white text-sm font-medium rounded-md transition-colors"
                            >
                                {t('comments_send')}
                            </button>
                        </div>
                    ) : (
                        <button
                            onClick={openLogin}
                            className="w-full py-2.5 bg-violet-600/90 hover:bg-violet-500 text-white text-sm font-medium rounded-lg transition-colors"
                        >
                            {t('comments_login_to_write')}
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};
