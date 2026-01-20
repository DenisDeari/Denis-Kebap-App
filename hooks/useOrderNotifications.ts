"use client";

import { useCallback, useRef } from "react";

export function useOrderNotifications() {
  const audioContextRef = useRef<AudioContext | null>(null);
  const lastPendingCountRef = useRef<number>(0);
  const isFirstLoad = useRef(true);

  const playNotificationSound = useCallback(() => {
    try {
      if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext || 
          (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
      }
      
      const ctx = audioContextRef.current;
      const oscillator = ctx.createOscillator();
      const gainNode = ctx.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(ctx.destination);
      
      // Angenehmer Notification-Ton (Dreiklang aufwärts)
      oscillator.frequency.setValueAtTime(880, ctx.currentTime); // A5
      oscillator.frequency.setValueAtTime(1108.73, ctx.currentTime + 0.1); // C#6
      oscillator.frequency.setValueAtTime(1318.51, ctx.currentTime + 0.2); // E6
      
      oscillator.type = 'sine';
      gainNode.gain.setValueAtTime(0.3, ctx.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.5);
      
      oscillator.start(ctx.currentTime);
      oscillator.stop(ctx.currentTime + 0.5);
    } catch (err) {
      console.log('Audio konnte nicht abgespielt werden:', err);
    }
  }, []);

  const checkForNewOrders = useCallback((pendingCount: number) => {
    // Ton bei neuer Bestellung (nicht beim ersten Laden)
    if (!isFirstLoad.current && pendingCount > lastPendingCountRef.current) {
      playNotificationSound();
    }
    
    isFirstLoad.current = false;
    lastPendingCountRef.current = pendingCount;
  }, [playNotificationSound]);

  return { checkForNewOrders, playNotificationSound };
}
