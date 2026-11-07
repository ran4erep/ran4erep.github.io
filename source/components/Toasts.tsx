import React, { useState, useCallback } from 'react';

interface Toast {
    id: number;
    text: string;
    kind: 'info' | 'error';
}

/** Простые всплывающие уведомления (тосты) — вместо alert(). */
export function useToasts() {
    const [list, setList] = useState<Toast[]>([]);

    const notify = useCallback((text: string, kind: 'info' | 'error' = 'info') => {
        const id = Date.now() + Math.random();
        setList(prev => [...prev, { id, text, kind }]);
        setTimeout(() => {
            setList(prev => prev.filter(t => t.id !== id));
        }, 3200);
    }, []);

    const toasts = list.length > 0 ? (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[400] w-[min(92vw,420px)] space-y-2 pointer-events-none">
            {list.map(t => (
                <div
                    key={t.id}
                    className={(
                        'px-4 py-2.5 rounded-lg text-sm font-medium shadow-2xl text-white border text-center ' +
                        (t.kind === 'error'
                            ? 'bg-red-600/95 border-red-500/50'
                            : 'bg-slate-800/95 border-white/10')
                    )}
                >
                    {t.text}
                </div>
            ))}
        </div>
    ) : null;

    return { notify, toasts };
}
