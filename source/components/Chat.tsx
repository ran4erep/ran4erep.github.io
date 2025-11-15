import React, { useState, useEffect, useRef, useContext } from 'react';
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.3.1/firebase-app.js";
import { getDatabase, ref, push, onChildAdded, query, limitToLast } from "https://www.gstatic.com/firebasejs/11.3.1/firebase-database.js";
import { LanguageContext } from '../App';
import type { ChatMessage, LanguageContextType } from '../types';

const firebaseConfig = {
    apiKey: "AIzaSyAg9N0m22cVx_C4xz8JNLWEEEritOqML_Q",
    authDomain: "ran4erep-chat.firebaseapp.com",
    projectId: "ran4erep-chat",
    databaseURL: "https://ran4erep-chat-default-rtdb.europe-west1.firebasedatabase.app",
    storageBucket: "ran4erep-chat.appspot.com",
    messagingSenderId: "480010047491",
    appId: "1:480010047491:web:4bdfae90bccf9cd806fe36"
};

const app = initializeApp(firebaseConfig);
const database = getDatabase(app);
const messagesRef = ref(database, 'messages');

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
            <div>
                <span className="nickname text-violet-400 font-bold mr-2">{msg.nickname.toLowerCase() === 'ran4erep' ? '👑' : '👤'} {escapeHtml(msg.nickname)}</span>
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
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [nickname, setNickname] = useState('');
    const [message, setMessage] = useState('');
    const [isNicknameSet, setIsNicknameSet] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        const savedNickname = localStorage.getItem('chatNickname');
        if (savedNickname) {
            setNickname(savedNickname);
            setIsNicknameSet(true);
        }
    }, []);

    useEffect(() => {
        const recentMessagesQuery = query(messagesRef, limitToLast(50));
        const unsubscribe = onChildAdded(recentMessagesQuery, (snapshot) => {
            setMessages(prev => [...prev, snapshot.val() as ChatMessage]);
        });
        return () => unsubscribe();
    }, []);

    useEffect(() => {
        if (isOpen) {
            // The timeout ensures that the scroll happens after the modal's render and animation,
            // reliably scrolling to the latest message.
            const timerId = setTimeout(() => {
                messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
            }, 100);
            return () => clearTimeout(timerId);
        }
    }, [messages, isOpen]);

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
        const trimmedMessage = message.trim();
        const trimmedNickname = nickname.trim();
        if (!trimmedNickname) { alert(t('chat_error_nickname')); return; }
        if (!trimmedMessage) { alert(t('chat_error_message')); return; }
        if (trimmedMessage.length > MAX_MESSAGE_LENGTH) { alert(t('chat_error_too_long')); return; }

        const urlRegex = /(?:https?:\/\/)?(?!(?:(?:www\.)?youtube\.com|(?:www\.)?yt\.be|(?:www\.)?ran4erep\.github\.io))[a-zA-Z0-9-]+(?:\.[a-zA-Z0-9-]+)+(?:\/[^\s<>[\]"']*)?/i;
        if(urlRegex.test(trimmedMessage)) {
             alert(t('chat_error_forbidden_links'));
             return;
        }

        if (!isNicknameSet) {
            localStorage.setItem('chatNickname', trimmedNickname);
            setIsNicknameSet(true);
        }

        try {
            await push(messagesRef, { nickname: trimmedNickname, message: trimmedMessage, timestamp: Date.now() });
            setMessage('');
        } catch (error) {
            console.error(error);
            alert(t('chat_error_send'));
        }
    };
    
    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        const trimmedNickname = nickname.trim();
        if (!file || !trimmedNickname) {
            if(!trimmedNickname) alert(t('chat_error_nickname'));
            return;
        }

        if (!isNicknameSet) {
            localStorage.setItem('chatNickname', trimmedNickname);
            setIsNicknameSet(true);
        }
        
        const imageData = await resizeImage(file);
        try {
            await push(messagesRef, { nickname: trimmedNickname, message: '', image: imageData, timestamp: Date.now() });
            if (fileInputRef.current) fileInputRef.current.value = "";
        } catch (error) {
             console.error(error);
             alert(t('chat_error_send'));
        }
    };
    
    const modalClasses = `
        chat-modal fixed top-1/2 -translate-y-1/2 h-[80vh] 
        bg-slate-900/70 backdrop-blur-lg border border-slate-700 
        rounded-xl shadow-2xl z-[150] flex flex-col transition-all duration-300
        ${isSidebarOpen 
            ? 'w-[95vw] md:w-[calc(95%_-_22vw)] left-1/2 md:left-[calc(22%_+(100%_-_22%)/2)] -translate-x-1/2' 
            : 'w-[95vw] left-1/2 -translate-x-1/2'
        }
    `;

    return (
        <>
            <button onClick={() => setIsOpen(!isOpen)} id="new-chat-button" className="group fixed bottom-5 right-5 w-14 h-14 bg-violet-600 hover:bg-violet-500 text-white rounded-full flex items-center justify-center shadow-lg transition-transform hover:scale-110 active:scale-95 z-[100]">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg>
                <span className="tooltip">{t('chat_tooltip')}</span>
            </button>
            {isOpen && (
                <div className={modalClasses}>
                    <div className="chat-header p-4 border-b border-slate-700 flex justify-between items-center">
                        <h3 className="text-white font-semibold">{t('chat_title')}</h3>
                        <button onClick={() => setIsOpen(false)} className="text-slate-400 hover:text-white text-2xl transition-transform active:scale-90">&times;</button>
                    </div>
                    <div className="chat-messages flex-grow overflow-y-auto p-4 space-y-4 custom-scrollbar overscroll-contain">
                        {messages.map((msg, index) => <MessageItem key={index} msg={msg} />)}
                        <div ref={messagesEndRef} />
                    </div>
                    <div className="chat-input p-4 border-t border-slate-700 grid grid-cols-[1fr_auto_auto] gap-2 items-center relative">
                        <input type="text" id="nickname" placeholder={t('chat_nickname_placeholder')} value={nickname} onChange={e => setNickname(e.target.value)} disabled={isNicknameSet} maxLength={20} className="col-span-3 mb-2 bg-slate-800 border border-slate-600 rounded-md px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-violet-500" />
                        <div className="relative col-span-1">
                          <input type="text" id="message" placeholder={t('chat_message_placeholder')} value={message} onChange={e => setMessage(e.target.value)} onKeyPress={e => e.key === 'Enter' && sendMessage()} className="w-full bg-slate-800 border border-slate-600 rounded-md pl-3 pr-12 py-2 text-white focus:outline-none focus:ring-2 focus:ring-violet-500" />
                          <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-slate-400">{message.length}/{MAX_MESSAGE_LENGTH}</span>
                        </div>
                        <input type="file" id="image-upload" accept="image/*" className="hidden" ref={fileInputRef} onChange={handleImageUpload} />
                        <button onClick={() => fileInputRef.current?.click()} className="image-upload-btn w-10 h-10 bg-slate-700 hover:bg-slate-600 rounded-md flex items-center justify-center group relative transition-transform active:scale-90">
                            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>
                            <span className="tooltip">{t('upload_image_tooltip')}</span>
                        </button>
                        <button onClick={sendMessage} className="w-10 h-10 bg-violet-600 hover:bg-violet-500 rounded-md flex items-center justify-center group relative transition-transform active:scale-90">
                             <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>
                             <span className="tooltip">{t('send_message_tooltip')}</span>
                        </button>
                    </div>
                </div>
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
                .group:hover .tooltip {
                    opacity: 1;
                    visibility: visible;
                }
            `}</style>
        </>
    );
};