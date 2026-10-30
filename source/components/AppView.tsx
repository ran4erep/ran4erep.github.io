
import React, { useEffect, useRef } from 'react';

interface AppViewProps {
    path: string;
    title: string;
}

export const AppView: React.FC<AppViewProps> = ({ path, title }) => {
    const iframeRef = useRef<HTMLIFrameElement>(null);

    useEffect(() => {
        const iframe = iframeRef.current;
        if (!iframe) return;

        const applyDefaultTextColor = () => {
            if (!iframe.contentDocument) return;
            try {
                const doc = iframe.contentDocument;
                const body = doc.body;
                if (!body) return;
                const color = window.getComputedStyle(body).color;
                if (color === 'rgb(0, 0, 0)' || color === '#000000' || color === 'black') {
                    const style = doc.createElement('style');
                    style.textContent = 'html { color-scheme: dark; } body { color: #f3f4f6; }';
                    doc.head.appendChild(style);
                }
            } catch {}
        };

        iframe.addEventListener('load', applyDefaultTextColor);
        if (iframe.contentDocument?.readyState === 'complete') {
            applyDefaultTextColor();
        }
        return () => iframe.removeEventListener('load', applyDefaultTextColor);
    }, [path]);

    return (
        <div className="h-screen">
            <iframe ref={iframeRef} src={path} title={title} className="w-full h-full border-0 block" />
        </div>
    );
};
