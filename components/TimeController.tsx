"use client";

import React, { useState, useEffect } from 'react';
import { useTime } from './TimeProvider';

export default function TimeController() {
  const { currentTime, speed, isPaused, setSpeed, setTime, togglePause, resetTime } = useTime();
  const [mounted, setMounted] = useState(false);
  
  // Prevent hydration mismatch by only rendering after mount
  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  // Helper to format Date for datetime-local input (YYYY-MM-DDTHH:mm)
  const formatDateForInput = (date: Date) => {
    const pad = (n: number) => n.toString().padStart(2, '0');
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
  };

  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newDate = new Date(e.target.value);
    // Validate date before setting
    if (!isNaN(newDate.getTime())) {
      setTime(newDate);
    }
  };

  return (
    <div className="fixed bottom-4 right-4 z-[9999] p-4 bg-white/95 backdrop-blur shadow-2xl rounded-lg border border-gray-200 flex flex-col gap-3 w-80 font-sans transition-all duration-200 hover:opacity-100 opacity-90">
      <div className="flex justify-between items-center border-b pb-2">
        <h3 className="font-bold text-gray-800 text-sm">⏱ Time Controller</h3>
        <div className="text-[10px] uppercase tracking-wider font-bold bg-blue-100 text-blue-800 px-2 py-1 rounded">
          {speed > 1 ? 'Simulated' : 'Real-time'}
        </div>
      </div>

      {/* Clock Display */}
      <div className="flex flex-col items-center justify-center bg-gray-50 rounded border border-gray-100 py-2">
        <div className="text-3xl font-mono font-bold text-blue-600 tabular-nums">
          {currentTime.toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false })}
        </div>
        <div className="text-xs font-medium text-gray-500">
          {currentTime.toLocaleDateString([], { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
        </div>
      </div>

      {/* Speed Control */}
      <div className="flex flex-col gap-1">
        <div className="flex justify-between items-center">
            <label className="text-xs font-semibold text-gray-500">Speed</label>
            <span className="text-xs font-bold text-blue-600">{speed}x</span>
        </div>
        <input 
          type="range" 
          min="1" 
          max="3600" 
          step="1"
          value={speed} 
          onChange={(e) => setSpeed(Number(e.target.value))}
          className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
        />
        <div className="flex justify-between text-[10px] text-gray-400">
          <span>Real-time</span>
          <span>1h / sec</span>
        </div>
      </div>

      {/* Playback Controls */}
      <div className="grid grid-cols-2 gap-2">
        <button 
          onClick={togglePause}
          className={`px-3 py-2 rounded text-sm font-bold transition-colors flex items-center justify-center gap-2 ${
            isPaused 
              ? 'bg-green-100 text-green-700 hover:bg-green-200 border border-green-200' 
              : 'bg-yellow-100 text-yellow-700 hover:bg-yellow-200 border border-yellow-200'
          }`}
        >
          {isPaused ? 
            <><span>▶</span> Resume</> : 
            <><span>⏸</span> Pause</>
          }
        </button>
        <button 
          onClick={resetTime}
          className="px-3 py-2 rounded text-sm font-semibold bg-gray-100 text-gray-700 hover:bg-gray-200 border border-gray-200 transition-colors"
        >
          ↺ Reset
        </button>
      </div>

      {/* Manual Time Set */}
      <div className="pt-2 border-t mt-1">
        <label className="text-xs font-semibold text-gray-500 block mb-1">Jump to Date/Time</label>
        <input
          type="datetime-local"
          value={formatDateForInput(currentTime)}
          onChange={handleDateChange}
          // Pause on focus to make editing easier
          onFocus={() => { if (!isPaused) togglePause(); }}
          className="w-full px-2 py-1.5 text-xs font-mono border rounded bg-white focus:ring-2 focus:ring-blue-500 outline-none"
        />
      </div>
    </div>
  );
}
