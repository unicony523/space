"use client";

import React from "react";

interface GameControlsProps {
  onMoveLeft: (pressed: boolean) => void;
  onMoveRight: (pressed: boolean) => void;
  onFire: () => void;
  autoShoot: boolean;
  onToggleAutoShoot: () => void;
  soundEnabled: boolean;
  onToggleSound: () => void;
  onPause: () => void;
  onRestart: () => void;
  onHome: () => void;
  isPaused: boolean;
}

export const GameControls: React.FC<GameControlsProps> = ({
  onMoveLeft,
  onMoveRight,
  onFire,
  autoShoot,
  onToggleAutoShoot,
  soundEnabled,
  onToggleSound,
  onPause,
  onRestart,
  onHome,
  isPaused,
}) => {
  return (
    <div className="w-full max-w-[480px] mx-auto mt-3 flex flex-col gap-3 px-2">
      {/* 상단 액션 버튼 바 */}
      <div className="grid grid-cols-4 gap-2 text-[10px]">
        <button
          onClick={onPause}
          className="bg-zinc-800 hover:bg-zinc-700 active:scale-95 text-amber-300 py-2.5 px-1 border-2 border-amber-400 font-pixel transition-transform"
        >
          {isPaused ? "▶ RESUME" : "⏸ PAUSE"}
        </button>

        <button
          onClick={onRestart}
          className="bg-zinc-800 hover:bg-zinc-700 active:scale-95 text-cyan-300 py-2.5 px-1 border-2 border-cyan-400 font-pixel transition-transform"
        >
          🔄 RETRY
        </button>

        <button
          onClick={onHome}
          className="bg-zinc-800 hover:bg-zinc-700 active:scale-95 text-rose-300 py-2.5 px-1 border-2 border-rose-400 font-pixel transition-transform"
        >
          🏠 HOME
        </button>

        <button
          onClick={onToggleSound}
          className="bg-zinc-800 hover:bg-zinc-700 active:scale-95 text-green-300 py-2.5 px-1 border-2 border-green-400 font-pixel transition-transform"
        >
          {soundEnabled ? "🔊 ON" : "🔇 OFF"}
        </button>
      </div>

      {/* 모바일 및 터치용 게임패드 (하단) */}
      <div className="flex items-center justify-between gap-4 bg-zinc-900/90 p-3 rounded-lg border-2 border-zinc-700">
        {/* 방향키 */}
        <div className="flex gap-2">
          <button
            onPointerDown={() => onMoveLeft(true)}
            onPointerUp={() => onMoveLeft(false)}
            onPointerLeave={() => onMoveLeft(false)}
            className="w-14 h-14 bg-zinc-800 active:bg-zinc-600 rounded-md border-b-4 border-zinc-950 flex items-center justify-center text-xl font-bold select-none text-white active:translate-y-1"
          >
            ◀
          </button>
          <button
            onPointerDown={() => onMoveRight(true)}
            onPointerUp={() => onMoveRight(false)}
            onPointerLeave={() => onMoveRight(false)}
            className="w-14 h-14 bg-zinc-800 active:bg-zinc-600 rounded-md border-b-4 border-zinc-950 flex items-center justify-center text-xl font-bold select-none text-white active:translate-y-1"
          >
            ▶
          </button>
        </div>

        {/* 자동사격 토글 & 수동 발사 */}
        <div className="flex items-center gap-2">
          <button
            onClick={onToggleAutoShoot}
            className={`px-3 py-2 text-[9px] border-2 font-pixel rounded transition-colors ${
              autoShoot
                ? "bg-green-600 border-green-300 text-white shadow-[0_0_8px_#22c55e]"
                : "bg-zinc-800 border-zinc-600 text-zinc-400"
            }`}
          >
            AUTO FIRE<br />[{autoShoot ? "ON" : "OFF"}]
          </button>

          <button
            onPointerDown={onFire}
            className="w-16 h-14 bg-red-600 hover:bg-red-500 active:bg-red-700 text-white rounded-md border-b-4 border-red-950 flex flex-col items-center justify-center text-[10px] font-pixel active:translate-y-1 shadow-[0_0_12px_rgba(239,68,68,0.5)]"
          >
            <span>FIRE</span>
            <span className="text-[7px] text-red-200 mt-0.5">SPACE</span>
          </button>
        </div>
      </div>
    </div>
  );
};
