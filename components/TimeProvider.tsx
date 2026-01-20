"use client";

import React, { createContext, useContext, useState, useEffect, useRef, ReactNode, useCallback } from 'react';

export interface TimeContextType {
  currentTime: Date;
  speed: number;
  isPaused: boolean;
  setSpeed: (speed: number) => void;
  setTime: (time: Date) => void;
  togglePause: () => void;
  resetTime: () => void;
}

const TimeContext = createContext<TimeContextType | undefined>(undefined);

export const useTime = () => {
  const context = useContext(TimeContext);
  if (!context) {
    throw new Error('useTime must be used within a TimeProvider');
  }
  return context;
};

interface TimeProviderProps {
  children: ReactNode;
  initialSpeed?: number;
}

export const TimeProvider: React.FC<TimeProviderProps> = ({ children, initialSpeed = 1 }) => {
  const [currentTime, setCurrentTime] = useState<Date>(new Date());
  const [speed, setSpeed] = useState<number>(initialSpeed);
  const [isPaused, setIsPaused] = useState<boolean>(false);
  
  // Track the last real timestamp to calculate true elapsed time
  const lastRealTimeRef = useRef<number>(Date.now());

  useEffect(() => {
    // Sync ref when effect starts/re-runs to avoid time jumps from re-renders or speed changes
    lastRealTimeRef.current = Date.now();

    const timer = setInterval(() => {
      const now = Date.now();
      const realDelta = now - lastRealTimeRef.current;
      lastRealTimeRef.current = now;

      if (!isPaused) {
        // Apply speed multiplier to the real time elapsed
        const simulatedDelta = realDelta * speed;
        setCurrentTime((prev) => new Date(prev.getTime() + simulatedDelta));
      }
    }, 100); // 10Hz update frequency for smoothness

    return () => clearInterval(timer);
  }, [speed, isPaused]);

  const togglePause = useCallback(() => {
    setIsPaused((prev) => !prev);
  }, []);

  const resetTime = useCallback(() => {
    const now = new Date();
    setCurrentTime(now);
    lastRealTimeRef.current = now.getTime();
    setSpeed(1);
    setIsPaused(false);
  }, []);

  const handleSetTime = useCallback((time: Date) => {
    setCurrentTime(time);
    lastRealTimeRef.current = Date.now(); // Reset delta tracking
  }, []);

  return (
    <TimeContext.Provider value={{
      currentTime,
      speed,
      isPaused,
      setSpeed,
      setTime: handleSetTime,
      togglePause,
      resetTime
    }}>
      {children}
    </TimeContext.Provider>
  );
};
