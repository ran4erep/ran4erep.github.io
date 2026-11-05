
import React, { useRef, useEffect, useState } from 'react';

export const SnowEffect: React.FC = () => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [isSnowing, setIsSnowing] = useState(() => {
        const saved = localStorage.getItem('isSnowing');
        return saved !== 'false';
    });
    
    useEffect(() => {
        const handleToggle = () => {
            setIsSnowing(prev => {
                const newState = !prev;
                localStorage.setItem('isSnowing', String(newState));
                return newState;
            });
        };
        window.addEventListener('toggleSnow', handleToggle);
        return () => window.removeEventListener('toggleSnow', handleToggle);
    }, []);

    useEffect(() => {
        if (!isSnowing) return;
        
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;
        
        let animationFrameId: number;
        
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;

        const snowflakeCount = 200;
        const snowflakes = Array.from({ length: snowflakeCount }, () => ({
            x: Math.random() * canvas.width,
            y: Math.random() * canvas.height,
            radius: Math.random() * 3 + 1,
            speed: Math.random() * 1 + 0.5,
            drift: Math.random() * 2 - 1
        }));

        const draw = () => {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
            ctx.beginPath();
            snowflakes.forEach(flake => {
                ctx.moveTo(flake.x, flake.y);
                ctx.arc(flake.x, flake.y, flake.radius, 0, Math.PI * 2, true);
            });
            ctx.fill();
            
            snowflakes.forEach(flake => {
                flake.y += flake.speed;
                flake.x += flake.drift;
                if (flake.y > canvas.height) {
                    flake.y = 0;
                    flake.x = Math.random() * canvas.width;
                }
                if (flake.x > canvas.width) flake.x = 0;
                if (flake.x < 0) flake.x = canvas.width;
            });
            
            animationFrameId = requestAnimationFrame(draw);
        };
        
        draw();
        
        const handleResize = () => {
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
        };
        window.addEventListener('resize', handleResize);
        
        return () => {
            cancelAnimationFrame(animationFrameId);
            window.removeEventListener('resize', handleResize);
        };
    }, [isSnowing]);

    if (!isSnowing) return null;

    return <canvas ref={canvasRef} className="fixed top-0 left-0 w-full h-full pointer-events-none z-30 opacity-70" />;
};
