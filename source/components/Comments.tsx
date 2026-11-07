import React, { useState, useEffect, useContext, useRef } from 'react';
import { push, onChildAdded, onValue, ref } from "https://www.gstatic.com/firebasejs/11.3.1/firebase-database.js";
import { LanguageContext } from '../App';
import { useAuth } from '../auth';
import { chatDatabase } from '../firebaseChat';
import { UserAvatar } from './UserAvatar';
import type { LanguageContextType } from '../types';

const MAX_LEN = 300;

const escapeHtml = (unsafe: string) => unsafe
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");

const formatTimestamp = (timestamp: number) => {
    const date = new Date(timestamp);
    const kievDate = new Date(date.toLocaleString('en-US', { timeZone: 'Europe/Kiev' }));
    const time = kievDate.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false });
    const dateStr = kievDate.toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit', year: 'numeric' });
    return { time, dateStr };
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

interface Comment {
    key: string;
    nickname: string;
    message: string;
    timestamp: number;
    avatar?: string | null;
    image?: string;
}

interface CommentsModalProps {
    projectKey: string;
    title: string;
    onClose: () => void;
}

const MessageItem: React.FC<{ msg: Comment }> = ({ msg }) => {
    const { time, dateStr } = formatTimestamp(msg.timestamp);

    const createMarkup = (text: string) => {
        const urlRegex = /(https?:\/\/(?:www\.)?(?:youtube\.com|yt\.be|ran4erep\.github\.io)[^\s<>[\]"']+)/gi;
        const escapedText = escapeHtml(text);
        const newText = escapedText.replace(urlRegex, (url) => `<a href="${url}" target="_blank" rel="noopener noreferrer" class="text-violet-400 hover:underline">${url}</a>`);
        return { __html: newText };
    };

    return (
        <div className="message bg-white/5 p-2 rounded-md text-sm">
            <div className="flex items-center gap-2 flex-wrap">
                <UserAvatar avatar={msg.avatar || null} className="w-7 h-7" ring="border border-violet-500/30" />
                {msg.nickname.toLowerCase() === 'ran4erep' && (
                    <img src="/icons/crown.svg" alt="crown" className="w-4 h-4 shrink-0" />
                )}
                <span className="nickname text-violet-400 font-bold">{escapeHtml(msg.nickname)}</span>
                <span className="time text-gray-400 text-xs">
                    <span className="time-box bg-black/20 border border-white/10 px-1.5 py-0.5 rounded">{time}</span>{' '}
                    <span className="date-box bg-violet-500/10 border border-violet-500/20 px-1.5 py-0.5 rounded">{dateStr}</span>
                </span>
            </div>
            {msg.message && <p className="text text-gray-200 mt-1 break-words" dangerouslySetInnerHTML={createMarkup(msg.message)}></p>}
            {msg.image && <img src={msg.image} className="message-image max-w-full md:max-w-xs rounded-md mt-2" alt="Uploaded content" />}
        </div>
    );
};

export const CommentsModal: React.FC<CommentsModalProps> = ({ projectKey, title, onClose }) => {
    const { t } = useContext(LanguageContext) as LanguageContextType;
    const { user, openLogin } = useAuth();
    const commentsRef = ref(chatDatabase, `comments/${projectKey}`);

    const [messages, setMessages] = useState<Comment[]>([]);
    const [text, setText] = useState('');
    const [busy, setBusy] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);
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

    const resizeImage = (file: File): Promise<string> => {
        return new Promise((resolve) => {
            const reader = new FileReader();
            reader.onload = (e) => {
                const img = new Image();
                img.onload = () => {
                    const canvas = document.createElement('canvas');
                    const ctx = canvas.getContext('2d');
                    if (!ctx) return;
                    const maxWidth = 350;
                    let { width, height } = img;
                    if (width > maxWidth) {
                        height = (maxWidth * height) / width;
                        width = maxWidth;
                    }
                    canvas.width = width;
                    canvas.height = height;
                    ctx.drawImage(img, 0, 0, width, height);
                    resolve(canvas.toDataURL('image/jpeg', 0.8));
                };
                img.src = e.target?.result as string;
            };
            reader.readAsDataURL(file);
        });
    };

    const buildPayload = (extra: Record<string, unknown>) => {
        const payload: Record<string, unknown> = {
            nickname: user!.username,
            timestamp: Date.now(),
            ...extra,
        };
        if (user!.avatar) payload.avatar = user!.avatar;
        return payload;
    };

    const send = async () => {
        if (!user) { openLogin(); return; }
        const trimmed = text.trim();
        if (!trimmed) { alert(t('chat_error_message')); return; }
        if (trimmed.length > MAX_LEN) { alert(t('chat_error_too_long')); return; }

        const urlRegex = /(?:https?:\/\/)?(?!(?:(?:www\.)?youtube\.com|(?:www\.)?yt\.be|(?:www\.)?ran4erep\.github\.io))[a-zA-Z0-9-]+(?:\.[a-zA-Z0-9-]+)+(?:\/[^\s<>[\]"']*)?/i;
        if (urlRegex.test(trimmed)) {
            alert(t('chat_error_forbidden_links'));
            return;
        }

        setBusy(true);
        try {
            await push(commentsRef, buildPayload({ message: trimmed }));
            setText('');
        } catch (e: any) {
            console.error(e);
            alert(`${t('chat_error_send')} (${e?.code || e?.message || ''})`);
        } finally {
            setBusy(false);
        }
    };

    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!user) { openLogin(); return; }
        const file = e.target.files?.[0];
        if (!file) return;
        setBusy(true);
        try {
            const imageData = await resizeImage(file);
            await push(commentsRef, buildPayload({ message: '', image: imageData }));
            if (fileInputRef.current) fileInputRef.current.value = '';
        } catch (err: any) {
            console.error(err);
            alert(`${t('chat_error_send')} (${err?.code || err?.message || ''})`);
        } finally {
            setBusy(false);
        }
    };

    return (
        <>
        <div className="fixed inset-0 z-[300] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/15" onClick={onClose} />
            <div className="relative w-full sm:max-w-lg max-h-[90vh] sm:max-h-[80vh] bg-slate-900/70 backdrop-blur-lg border border-slate-700 rounded-xl shadow-2xl z-[300] flex flex-col">
                <div className="chat-header p-4 border-b border-slate-700 flex justify-between items-center">
                    <h3 className="text-white font-semibold truncate">{title}</h3>
                    <button onClick={onClose} className="text-slate-400 hover:text-white text-2xl transition-transform active:scale-90">&times;</button>
                </div>

                <div ref={listRef} className="chat-messages flex-grow overflow-y-auto p-4 flex flex-col-reverse gap-4 custom-scrollbar overscroll-contain">
                    {messages.length === 0 && (
                        <div className="text-center text-slate-500 text-sm py-8">
                            {t('comments_empty')}
                        </div>
                    )}
                    {[...messages].reverse().map((m, index) => <MessageItem key={m.key || index} msg={m} />)}
                </div>

                <div className="chat-input p-4 border-t border-slate-700 grid grid-cols-[1fr_auto_auto] gap-2 items-center relative">
                    <div className="relative col-span-1">
                        <input
                            type="text"
                            placeholder={t('comments_placeholder')}
                            value={text}
                            disabled={!user}
                            onChange={e => setText(e.target.value)}
                            onKeyPress={e => e.key === 'Enter' && user && !busy && send()}
                            className="w-full bg-slate-800 border border-slate-600 rounded-md pl-3 pr-16 py-2 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-violet-500 disabled:opacity-40 disabled:cursor-not-allowed"
                        />
                        <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-slate-400">{text.length}/{MAX_LEN}</span>
                    </div>
                    <input type="file" accept="image/*" className="hidden" ref={fileInputRef} onChange={handleImageUpload} />
                    <button
                        onClick={() => fileInputRef.current?.click()}
                        disabled={!user || busy}
                        className="w-10 h-10 bg-slate-700 hover:bg-slate-600 disabled:opacity-40 disabled:cursor-not-allowed rounded-md flex items-center justify-center group relative transition-transform active:scale-90"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>
                        <span className="tooltip">{t('upload_image_tooltip')}</span>
                    </button>
                    <button
                        onClick={send}
                        disabled={!user || busy}
                        className="w-10 h-10 bg-violet-600 hover:bg-violet-500 disabled:opacity-40 disabled:cursor-not-allowed rounded-md flex items-center justify-center group relative transition-transform active:scale-90"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>
                        <span className="tooltip">{t('send_message_tooltip')}</span>
                    </button>
                    {!user && (
                        <button
                            type="button"
                            onClick={openLogin}
                            className="absolute inset-0 z-10 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm rounded-b-xl text-violet-300 hover:text-violet-200 font-medium text-sm transition-colors"
                        >
                            {t('comments_login_to_write')}
                        </button>
                    )}
                </div>
            </div>
        </div>
        <style>{`
            .tooltip {
                position: absolute;
                bottom: 125%;
                left: 50%;
                transform: translateX(-50%);
                background-color: #1f2937;
                color: white;
                padding: 4px 8px;
                border-radius: 4px;
                font-size: 12px;
                white-space: nowrap;
                opacity: 0;
                visibility: hidden;
                transition: opacity 0.2s, visibility 0.2s;
                pointer-events: none;
            }
            @media (hover: hover) {
                .group:hover .tooltip {
                    opacity: 1;
                    visibility: visible;
                }
            }
        `}</style>
        </>
    );
};
