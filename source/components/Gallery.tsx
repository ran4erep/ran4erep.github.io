
import React, { useState, useEffect, useCallback, useRef } from 'react';

// Кандидаты-расширения для имени файла: покрывает и старый json
// (jpg/png), и новый (webp), и любой рассинхрон деплоя.
const resolveCandidates = (name: string): string[] => {
    const ext = (name.match(/\.([a-z0-9]+)$/i) || [])[1]?.toLowerCase();
    const base = ext ? name.slice(0, name.length - ext.length - 1) : name;
    const exts = ['webp', 'jpg', 'jpeg', 'png', 'gif'];
    const out: string[] = [];
    for (const e of exts) out.push(`${base}.${e}`);
    if (ext && !out.includes(name)) out.unshift(name);
    if (!ext) out.unshift(name);
    return out;
};

const ImageViewer: React.FC<{ name: string | null; onNext: (e: React.MouseEvent) => void; onPrev: (e: React.MouseEvent) => void; onClose: (e: React.MouseEvent) => void; }> = ({ name, onNext, onPrev, onClose }) => {
    const [idx, setIdx] = useState(0);
    if (!name) return null;
    const cands = resolveCandidates(name);

    return (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center" onClick={onClose}>
            {/* Image container that stops backdrop click propagation */}
            <div className="relative flex items-center justify-center w-full h-full" onClick={e => e.stopPropagation()}>
                {idx < cands.length ? (
                    <img
                        src={`gallery/${cands[idx]}`}
                        alt="Gallery view"
                        className="block max-w-[90vw] max-h-[90vh] w-auto h-auto rounded-lg shadow-2xl object-contain"
                        onError={() => setIdx(i => i + 1)}
                    />
                ) : (
                    <div className="text-slate-500 text-sm">—</div>
                )}
            </div>

            {/* Buttons positioned relative to the viewport */}
            <button onClick={onClose} className="absolute top-5 right-5 w-10 h-10 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center text-white text-2xl transition-transform hover:scale-110 active:scale-95 z-[51]">
                &times;
            </button>
            <button onClick={onPrev} className="absolute left-5 top-1/2 -translate-y-1/2 w-12 h-12 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center text-white text-2xl transition-transform hover:scale-110 active:scale-95 z-[51]">
                &#8249;
            </button>
            <button onClick={onNext} className="absolute right-5 top-1/2 -translate-y-1/2 w-12 h-12 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center text-white text-2xl transition-transform hover:scale-110 active:scale-95 z-[51]">
                &#8250;
            </button>
        </div>
    );
};

export const Gallery: React.FC = () => {
    const [images, setImages] = useState<string[]>([]);
    const [viewerImageIndex, setViewerImageIndex] = useState<number | null>(null);
    const carouselRef = useRef<HTMLDivElement>(null);

    // Пробует доступные расширения на лету (webp → jpg → png → gif).
    const ImageBox: React.FC<{ name: string; className: string }> = ({ name, className }) => {
        const [idx, setIdx] = useState(0);
        const cands = resolveCandidates(name);
        if (idx >= cands.length) return <div className={`${className} bg-slate-800 flex items-center justify-center text-slate-600 text-xs`}>—</div>;
        return (
            <img
                src={`gallery/${cands[idx]}`}
                alt={name}
                loading="lazy"
                className={className}
                onError={() => setIdx(i => i + 1)}
            />
        );
    };

    useEffect(() => {
        fetch('/gallery/gallery.json')
            .then(res => res.json())
            .then(data => setImages(data))
            .catch(err => console.error("Failed to load gallery:", err));
    }, []);

    const handleOpenViewer = (index: number) => setViewerImageIndex(index);
    const handleCloseViewer = () => setViewerImageIndex(null);

    const handleNext = useCallback((e: React.MouseEvent) => {
        e.stopPropagation();
        if (viewerImageIndex !== null) {
            setViewerImageIndex((prevIndex) => (prevIndex! + 1) % images.length);
        }
    }, [viewerImageIndex, images.length]);

    const handlePrev = useCallback((e: React.MouseEvent) => {
        e.stopPropagation();
        if (viewerImageIndex !== null) {
            setViewerImageIndex((prevIndex) => (prevIndex! - 1 + images.length) % images.length);
        }
    }, [viewerImageIndex, images.length]);
    
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (viewerImageIndex !== null) {
                if (e.key === 'ArrowRight') {
                    e.preventDefault();
                    setViewerImageIndex((prevIndex) => (prevIndex! + 1) % images.length);
                }
                if (e.key === 'ArrowLeft') {
                    e.preventDefault();
                    setViewerImageIndex((prevIndex) => (prevIndex! - 1 + images.length) % images.length);
                }
                if (e.key === 'Escape') handleCloseViewer();
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [viewerImageIndex, images.length]);

    const scroll = (direction: 'left' | 'right') => {
        if (carouselRef.current) {
            const scrollAmount = carouselRef.current.clientWidth * 0.8;
            carouselRef.current.scrollBy({
                left: direction === 'left' ? -scrollAmount : scrollAmount,
                behavior: 'smooth',
            });
        }
    };

    return (
        <div className="relative group">
            <div
                ref={carouselRef}
                className="flex overflow-x-auto space-x-4 pb-4 scroll-smooth scrollbar-hide"
            >
                {images.map((imageName, index) => (
                    <div 
                        key={index} 
                        className="flex-none w-60 h-36 bg-slate-800 rounded-lg overflow-hidden cursor-pointer group/item" 
                        onClick={() => handleOpenViewer(index)}
                    >
                        <ImageBox name={imageName} className="w-full h-full object-cover group-hover/item:scale-105 transition-transform duration-300" />
                    </div>
                ))}
            </div>
            
            <button onClick={() => scroll('left')} className="absolute left-2 top-1/2 -translate-y-1/2 w-10 h-10 bg-black/40 hover:bg-black/60 rounded-full flex items-center justify-center text-white text-2xl opacity-0 group-hover:opacity-100 transition-all duration-300 z-10 active:scale-90">&#8249;</button>
            <button onClick={() => scroll('right')} className="absolute right-2 top-1/2 -translate-y-1/2 w-10 h-10 bg-black/40 hover:bg-black/60 rounded-full flex items-center justify-center text-white text-2xl opacity-0 group-hover:opacity-100 transition-all duration-300 z-10 active:scale-90">&#8250;</button>

            <ImageViewer
                name={viewerImageIndex !== null ? images[viewerImageIndex] : null}
                onNext={handleNext}
                onPrev={handlePrev}
                onClose={(e) => { e.stopPropagation(); handleCloseViewer(); }}
            />
            <style>{`
                .scrollbar-hide::-webkit-scrollbar {
                    display: none;
                }
                .scrollbar-hide {
                    -ms-overflow-style: none;
                    scrollbar-width: none;
                }
            `}</style>
        </div>
    );
};