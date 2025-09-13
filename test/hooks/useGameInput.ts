import { useState, useEffect, useCallback, useRef } from 'react';

type Direction = 'ArrowUp' | 'ArrowDown' | 'ArrowLeft' | 'ArrowRight' | 'w' | 'a' | 's' | 'd';

const isMoveKey = (key: string): key is Direction => {
  return ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'w', 'a', 's', 'd'].includes(key);
};

export const useGameInput = () => {
  const [direction, setDirection] = useState<Direction | null>(null);
  const pressedKeysRef = useRef<Record<string, boolean>>({});

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (isMoveKey(e.key) && !pressedKeysRef.current[e.key]) {
      e.preventDefault();
      pressedKeysRef.current[e.key] = true;
      setDirection(e.key);
    }
  }, []);

  const handleKeyUp = useCallback((e: KeyboardEvent) => {
    if (isMoveKey(e.key)) {
      e.preventDefault();
      pressedKeysRef.current[e.key] = false;
    }
  }, []);


  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [handleKeyDown, handleKeyUp]);
  
  // This effect resets the direction immediately after it has been set.
  // This ensures the parent component only sees the direction for a single render,
  // preventing movement loops.
  useEffect(() => {
    if (direction) {
      setDirection(null);
    }
  }, [direction]);

  return direction;
};
