
import React, { useState, useRef, useEffect, useContext } from 'react';
import type { Track, LanguageContextType } from '../types';
import { LanguageContext } from '../App';

export const MusicPlayer: React.FC = () => {
    const { t } = useContext(LanguageContext) as LanguageContextType;
    const [playlist, setPlaylist] = useState<Track[]>([]);
    const [currentTrackIndex, setCurrentTrackIndex] = useState(0);
    const [isPlaying, setIsPlaying] = useState(false);
    const [currentTime, setCurrentTime] = useState(0);
    const [duration, setDuration] = useState(0);

    const audioRef = useRef<HTMLAudioElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const audioContextRef = useRef<AudioContext | null>(null);
    const analyserRef = useRef<AnalyserNode | null>(null);
    const sourceRef = useRef<MediaElementAudioSourceNode | null>(null);
    const visualizerAnimationRef = useRef<number | null>(null);
    const glowRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        fetch('/music/playlist.json')
            .then(res => res.json())
            .then(data => {
                if (data.tracks && data.tracks.length > 0) {
                    setPlaylist(data.tracks);
                }
            })
            .catch(err => console.error("Failed to load playlist:", err));
    }, []);

    const setupAudioContext = () => {
        if (!audioRef.current || audioContextRef.current) return;
        try {
            const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
            const analyser = audioContext.createAnalyser();
            analyser.fftSize = 128;

            const source = audioContext.createMediaElementSource(audioRef.current);
            source.connect(analyser);
            analyser.connect(audioContext.destination);

            audioContextRef.current = audioContext;
            analyserRef.current = analyser;
            sourceRef.current = source;
        } catch(e) {
            console.error("Failed to initialize AudioContext:", e);
        }
    };
    
    const animateVisualizer = () => {
        if (!analyserRef.current || !canvasRef.current || !glowRef.current) {
            visualizerAnimationRef.current = requestAnimationFrame(animateVisualizer);
            return;
        }
        
        const analyser = analyserRef.current;
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        const glow = glowRef.current;
        
        const bufferLength = analyser.frequencyBinCount;
        const dataArray = new Uint8Array(bufferLength);
        analyser.getByteFrequencyData(dataArray);

        if (ctx) {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            const barWidth = (canvas.width / bufferLength) * 1.5;
            for (let i = 0; i < bufferLength; i++) {
                const barHeight = (dataArray[i] / 255) * canvas.height;
                ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
                ctx.fillRect(i * barWidth, canvas.height - barHeight, barWidth - 1, barHeight);
            }
        }
        
        const getAverage = (start: number, end: number) => {
            const values = dataArray.slice(start, end);
            return values.reduce((a, b) => a + b, 0) / values.length / 255;
        };
        const bass = getAverage(0, 4);
        const mid = getAverage(4, 8);
        const treble = getAverage(8, 16);
        const colors = [[255, 0, 255], [0, 255, 255], [148, 0, 211], [255, 105, 180]];
        const interpolate = (c1: number[], c2: number[], f: number) => c1.map((c, i) => Math.round(c + (c2[i] - c) * f));
        const color1 = interpolate(colors[0], colors[1], bass);
        const color2 = interpolate(colors[2], colors[3], treble);
        glow.style.background = `radial-gradient(circle at ${mid * 100}% ${treble * 100}%, rgba(${color1.join(',')}, ${bass * 0.8}), rgba(${color2.join(',')}, ${treble * 0.8}))`;


        visualizerAnimationRef.current = requestAnimationFrame(animateVisualizer);
    };

    const togglePlay = () => {
        if (!audioRef.current || playlist.length === 0) return;
        if (!audioContextRef.current) {
            setupAudioContext();
        }
        if (audioContextRef.current?.state === 'suspended') {
            audioContextRef.current.resume();
        }
        setIsPlaying(!isPlaying);
    };

    useEffect(() => {
        if (isPlaying) {
            visualizerAnimationRef.current = requestAnimationFrame(animateVisualizer);
        } else {
            if (visualizerAnimationRef.current) {
                cancelAnimationFrame(visualizerAnimationRef.current);
            }
        }
        return () => {
            if (visualizerAnimationRef.current) {
                cancelAnimationFrame(visualizerAnimationRef.current);
            }
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isPlaying]);

    const changeTrack = (direction: number) => {
        if (playlist.length === 0) return;
        const newIndex = (currentTrackIndex + direction + playlist.length) % playlist.length;
        setCurrentTrackIndex(newIndex);
    };
    
    useEffect(() => {
        const audio = audioRef.current;
        if (!audio || playlist.length === 0) return;

        let isCancelled = false;

        const managePlayback = async () => {
            const newSrc = playlist[currentTrackIndex].path;
            if (!audio.src.endsWith(newSrc)) {
                audio.src = newSrc;
            }

            if (isPlaying) {
                try {
                    await audio.play();
                    if (isCancelled) {
                        audio.pause();
                    }
                } catch (error) {
                    const errorMessage = error instanceof Error ? error.message : String(error);
                    if (!errorMessage.includes('aborted')) {
                         console.error("Audio play error:", error);
                    }
                    if (!isCancelled) {
                        setIsPlaying(false);
                    }
                }
            } else {
                audio.pause();
            }
        };

        managePlayback();

        return () => {
            isCancelled = true;
        };
    }, [isPlaying, currentTrackIndex, playlist]);

    const formatTime = (time: number) => {
        const minutes = Math.floor(time / 60);
        const seconds = Math.floor(time % 60);
        return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
    };

    const onTimeUpdate = () => {
        if (audioRef.current) {
            setCurrentTime(audioRef.current.currentTime);
            setDuration(audioRef.current.duration || 0);
        }
    };
    
    const onTrackEnd = () => changeTrack(1);

    const handleProgressClick = (e: React.MouseEvent<HTMLDivElement>) => {
        if (!audioRef.current || !duration) return;
        const rect = e.currentTarget.getBoundingClientRect();
        const clickX = e.clientX - rect.left;
        audioRef.current.currentTime = (clickX / rect.width) * duration;
    };
    
    const currentTrack = playlist[currentTrackIndex];

    return (
        <div className="bg-[#1a1a1a] rounded-[15px] p-4 relative overflow-hidden">
            <audio ref={audioRef} onTimeUpdate={onTimeUpdate} onEnded={onTrackEnd} crossOrigin="anonymous" />

            <div className="visualizer-container absolute inset-0 pointer-events-none z-0">
                <div ref={glowRef} className="visualizer-glow absolute inset-0 mix-blend-screen opacity-90 transition-all duration-100"></div>
                <canvas ref={canvasRef} id="stripes" className="absolute inset-0 w-full h-full"></canvas>
            </div>
            
            <div className="relative z-10">
                <div className="current-track text-white mb-2 text-sm text-center truncate">
                    {currentTrack ? `${currentTrack.artist} - ${currentTrack.title}` : 'Нет воспроизведения'}
                </div>
                
                <div className="player-info mb-2">
                    <div className="progress-bar w-full h-1 bg-white/20 rounded-full cursor-pointer" onClick={handleProgressClick}>
                        <div className="progress h-full bg-violet-500 rounded-full" style={{ width: `${(currentTime / duration) * 100}%` }}></div>
                    </div>
                    <div className="track-time flex justify-between text-xs text-gray-300 px-1">
                        <span>{formatTime(currentTime)}</span>
                        <span>{formatTime(duration)}</span>
                    </div>
                </div>

                <div className="player-controls flex justify-center items-center gap-4">
                    <button onClick={() => changeTrack(-1)} className="control-btn text-gray-300 hover:text-white group relative transition-transform active:scale-90">
                        <svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor"><path d="M6 6h2v12H6zm3.5 6l8.5 6V6z"/></svg>
                        <span className="tooltip">{t('prev_track_tooltip')}</span>
                    </button>
                    <button onClick={togglePlay} className="control-btn text-violet-400 hover:text-violet-300 w-10 h-10 flex items-center justify-center bg-violet-500/20 rounded-full group relative transition-transform active:scale-90">
                        {isPlaying ? (
                            <svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/></svg>
                        ) : (
                            <svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>
                        )}
                        <span className="tooltip">{t(isPlaying ? 'pause_tooltip' : 'play_tooltip')}</span>
                    </button>
                    <button onClick={() => changeTrack(1)} className="control-btn text-gray-300 hover:text-white group relative transition-transform active:scale-90">
                        <svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor"><path d="M6 18l8.5-6L6 6v12zM16 6v12h2V6h-2z"/></svg>
                        <span className="tooltip">{t('next_track_tooltip')}</span>
                    </button>
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
                .group:hover .tooltip {
                    opacity: 1;
                    visibility: visible;
                }
            `}</style>
        </div>
    );
};