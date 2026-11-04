
import React, { useEffect, useRef } from 'react';

interface AppViewProps {
    path: string;
    title: string;
}

// Фон тела страницы не задан (прозрачный/дефолтный) — страница не оформлена.
// Если фон задан явно (любой цвет), страница уже имеет свой дизайн, и текст
// перекрашивать нельзя.
const isDefaultBackground = (bg: string): boolean => {
    return !bg || bg === 'transparent' || bg === 'rgba(0, 0, 0, 0)';
};

export const AppView: React.FC<AppViewProps> = ({ path, title }) => {
    const iframeRef = useRef<HTMLIFrameElement>(null);

    useEffect(() => {
        const iframe = iframeRef.current;
        if (!iframe) return;

        const applyFixes = () => {
            if (!iframe.contentDocument) return;
            try {
                const doc = iframe.contentDocument;
                const body = doc.body;
                if (!body) return;
                const computed = window.getComputedStyle(body);
                const color = computed.color;
                const isUnsetTextColor = color === 'rgb(0, 0, 0)' || color === '#000000' || color === 'black';
                if (isUnsetTextColor && isDefaultBackground(computed.backgroundColor)) {
                    const style = doc.createElement('style');
                    style.textContent = 'body { color: #f3f4f6; }';
                    doc.head.appendChild(style);
                }

                // Переносим кастомный курсор с родительской страницы в iframe,
                // чтобы он работал и внутри открытых приложений.
                const parentCursor = window.getComputedStyle(document.body).cursor;
                if (parentCursor && parentCursor !== 'auto') {
                    const cursorStyle = doc.createElement('style');
                    cursorStyle.textContent =
                        `html, body, * { cursor: ${parentCursor} !important; }`;
                    doc.head.appendChild(cursorStyle);
                }
            } catch {}
        };

        iframe.addEventListener('load', applyFixes);
        if (iframe.contentDocument?.readyState === 'complete') {
            applyFixes();
        }
        return () => iframe.removeEventListener('load', applyFixes);
    }, [path]);

    return (
        <div className="h-screen overflow-hidden" style={{ height: '100dvh' }}>
            <iframe ref={iframeRef} src={path} title={title} className="w-full h-full border-0 block" />
        </div>
    );
};
