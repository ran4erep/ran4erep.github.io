import React, { useState, useEffect, useRef, useContext } from 'react';
import { push, onChildAdded, query, limitToLast } from "https://www.gstatic.com/firebasejs/11.3.1/firebase-database.js";
import { LanguageContext } from '../App';
import { useAuth } from '../auth';
import { messagesRef } from '../firebaseChat';
import { UserAvatar } from './UserAvatar';
import type { ChatMessage, LanguageContextType } from '../types';

const MAX_MESSAGE_LENGTH = 300;

const escapeHtml = (unsafe: string) => {
    return unsafe
         .replace(/&/g, "&amp;")
         .replace(/</g, "&lt;")
         .replace(/>/g, "&gt;")
         .replace(/"/g, "&quot;")
         .replace(/'/g, "&#039;");
};


const MessageItem: React.FC<{ msg: ChatMessage }> = ({ msg }) => {
    const formatTimestamp = (timestamp: number) => {
        const date = new Date(timestamp);
        const kievDate = new Date(date.toLocaleString('en-US', { timeZone: 'Europe/Kiev' }));
        const time = kievDate.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false });
        const dateStr = kievDate.toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit', year: 'numeric' });
        return { time, dateStr };
    };

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
                <UserAvatar avatar={msg.avatar} className="w-7 h-7" ring="border border-violet-500/30" />
                {msg.nickname.toLowerCase() === 'ran4erep' && (
                    <img src="/icons/crown.svg" alt="crown" className="w-4 h-4 shrink-0" />
                )}
                <span className="nickname text-violet-400 font-bold">{escapeHtml(msg.nickname)}</span>
                <span className="time text-gray-400 text-xs">
                    <span className="time-box bg-black/20 border border-white/10 px-1.5 py-0.5 rounded">{time}</span> <span className="date-box bg-violet-500/10 border border-violet-500/20 px-1.5 py-0.5 rounded">{dateStr}</span>
                </span>
            </div>
            {msg.message && <p className="text text-gray-200 mt-1 break-words" dangerouslySetInnerHTML={createMarkup(msg.message)}></p>}
            {msg.image && <img src={msg.image} className="message-image max-w-full md:max-w-xs rounded-md mt-2" alt="Uploaded content" />}
        </div>
    );
}

interface ChatProps {
    isSidebarOpen: boolean;
}

export const Chat: React.FC<ChatProps> = ({ isSidebarOpen }) => {
    const { t } = useContext(LanguageContext) as LanguageContextType;
    const { user, openLogin } = useAuth();
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [message, setMessage] = useState('');
    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        const recentMessagesQuery = query(messagesRef, limitToLast(50));
        const unsubscribe = onChildAdded(recentMessagesQuery, (snapshot) => {
            setMessages(prev => [...prev, snapshot.val() as ChatMessage]);
        });
        return () => unsubscribe();
    }, []);

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
    }

    const sendMessage = async () => {
        if (!user) return;
        const trimmedMessage = message.trim();
        if (!trimmedMessage) { alert(t('chat_error_message')); return; }
        if (trimmedMessage.length > MAX_MESSAGE_LENGTH) { alert(t('chat_error_too_long')); return; }

        const urlRegex = /(?:https?:\/\/)?(?!(?:(?:www\.)?youtube\.com|(?:www\.)?yt\.be|(?:www\.)?ran4erep\.github\.io))[a-zA-Z0-9-]+(?:\.[a-zA-Z0-9-]+)+(?:\/[^\s<>[\]"']*)?/i;
        if(urlRegex.test(trimmedMessage)) {
             alert(t('chat_error_forbidden_links'));
             return;
        }

        try {
            await push(messagesRef, { nickname: user.username, message: trimmedMessage, timestamp: Date.now(), avatar: user.avatar || null });
            setMessage('');
        } catch (error: any) {
            console.error(error);
            alert(`${t('chat_error_send')} (${error?.code || error?.message || ''})`);
        }
    };
    
    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!user) return;
        const file = e.target.files?.[0];
        if (!file) return;
        
        const imageData = await resizeImage(file);
        try {
            await push(messagesRef, { nickname: user.username, message: '', image: imageData, timestamp: Date.now(), avatar: user.avatar || null });
            if (fileInputRef.current) fileInputRef.current.value = "";
        } catch (error: any) {
             console.error(error);
             alert(`${t('chat_error_send')} (${error?.code || error?.message || ''})`);
        }
    };
    
    const modalClasses = `
        chat-modal fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[95vw] h-[80vh]
        md:top-auto md:left-auto md:translate-x-0 md:translate-y-0 md:bottom-24 md:right-5 md:w-[30vw] md:h-[50vh]
        bg-slate-900/70 backdrop-blur-lg border border-slate-700 
        rounded-xl shadow-2xl z-[150] flex flex-col transition-all duration-300
    `;

    return (
        <>
            <button onClick={() => setIsOpen(!isOpen)} id="new-chat-button" className="group fixed bottom-5 right-5 w-14 h-14 bg-violet-600 hover:bg-violet-500 text-white rounded-full flex items-center justify-center shadow-lg transition-transform hover:scale-110 active:scale-95 z-[100]">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg>
                <span className="tooltip">{t('chat_tooltip')}</span>
            </button>
            {isOpen && (
                <>
                <div className="fixed inset-0 bg-black/15 z-[140] pointer-events-none" />
                <div className={modalClasses}>
                    <div className="chat-header p-4 border-b border-slate-700 flex justify-between items-center">
                        <h3 className="text-white font-semibold">{t('chat_title')}</h3>
                        <button onClick={() => setIsOpen(false)} className="text-slate-400 hover:text-white text-2xl transition-transform active:scale-90">&times;</button>
                    </div>
                    <div className="chat-messages flex-grow overflow-y-auto p-4 flex flex-col-reverse gap-4 custom-scrollbar overscroll-contain">
                        {messages.map((msg, index) => <MessageItem key={index} msg={msg} />)}
                    </div>
                    <div className="chat-input p-4 border-t border-slate-700 grid grid-cols-[1fr_auto_auto] gap-2 items-center relative">
                        <div className="relative col-span-1">
                          <input type="text" id="message" placeholder={t('chat_message_placeholder')} value={message} disabled={!user} onChange={e => setMessage(e.target.value)} onKeyPress={e => e.key === 'Enter' && user && sendMessage()} className="w-full bg-slate-800 border border-slate-600 rounded-md pl-3 pr-12 py-2 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-violet-500 disabled:opacity-40 disabled:cursor-not-allowed" />
                          <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-slate-400">{message.length}/{MAX_MESSAGE_LENGTH}</span>
                        </div>
                        <input type="file" id="image-upload" accept="image/*" className="hidden" ref={fileInputRef} onChange={handleImageUpload} />
                        <button onClick={() => fileInputRef.current?.click()} disabled={!user} className="image-upload-btn w-10 h-10 bg-slate-700 hover:bg-slate-600 disabled:opacity-40 disabled:cursor-not-allowed rounded-md flex items-center justify-center group relative transition-transform active:scale-90">
                            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>
                            <span className="tooltip">{t('upload_image_tooltip')}</span>
                        </button>
                        <button onClick={sendMessage} disabled={!user} className="w-10 h-10 bg-violet-600 hover:bg-violet-500 disabled:opacity-40 disabled:cursor-not-allowed rounded-md flex items-center justify-center group relative transition-transform active:scale-90">
                             <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>
                             <span className="tooltip">{t('send_message_tooltip')}</span>
                        </button>
                        {!user && (
                            <button
                                type="button"
                                onClick={openLogin}
                                className="absolute inset-0 z-10 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm rounded-b-xl text-violet-300 hover:text-violet-200 font-medium text-sm transition-colors"
                            >
                                {t('chat_login_to_write')}
                            </button>
                        )}
                    </div>
                </div>
                </>
            )}
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