
import React, { useState, useEffect, useCallback, useRef } from 'react';

const ImageViewer: React.FC<{ imageUrl: string | null; onNext: (e: React.MouseEvent) => void; onPrev: (e: React.MouseEvent) => void; onClose: (e: React.MouseEvent) => void; }> = ({ imageUrl, onNext, onPrev, onClose }) => {
    if (!imageUrl) return null;

    return (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center" onClick={onClose}>
            {/* Image container that stops backdrop click propagation */}
            <div className="relative flex items-center justify-center w-full h-full" onClick={e => e.stopPropagation()}>
                <img src={imageUrl} alt="Gallery view" className="block max-w-[90vw] max-h-[90vh] w-auto h-auto rounded-lg shadow-2xl object-contain" />
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
                        <img 
                            src={`gallery/${imageName}`}
                            alt={imageName}
                            className="w-full h-full object-cover group-hover/item:scale-105 transition-transform duration-300"
                            loading="lazy"
                        />
                    </div>
                ))}
            </div>
            
            <button onClick={() => scroll('left')} className="absolute left-2 top-1/2 -translate-y-1/2 w-10 h-10 bg-black/40 hover:bg-black/60 rounded-full flex items-center justify-center text-white text-2xl opacity-0 group-hover:opacity-100 transition-all duration-300 z-10 active:scale-90">&#8249;</button>
            <button onClick={() => scroll('right')} className="absolute right-2 top-1/2 -translate-y-1/2 w-10 h-10 bg-black/40 hover:bg-black/60 rounded-full flex items-center justify-center text-white text-2xl opacity-0 group-hover:opacity-100 transition-all duration-300 z-10 active:scale-90">&#8250;</button>

            <ImageViewer
                imageUrl={viewerImageIndex !== null ? `gallery/${images[viewerImageIndex]}` : null}
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