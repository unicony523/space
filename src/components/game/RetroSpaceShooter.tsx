"use client";

import React, { useState, useEffect } from "react";
import { PixelCanvas, GameStats } from "./PixelCanvas";
import { GameControls } from "./GameControls";
import { soundManager } from "@/lib/audio";

type GamePhase = "NAME_INPUT" | "COUNTDOWN" | "PLAYING" | "PAUSED" | "GAMEOVER" | "VICTORY";

export const RetroSpaceShooter: React.FC = () => {
  const [phase, setPhase] = useState<GamePhase>("NAME_INPUT");
  const [playerName, setPlayerName] = useState<string>("");
  const [countdown, setCountdown] = useState<number>(3);
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);
  const [autoShoot, setAutoShoot] = useState<boolean>(true);
  const [controlDirection, setControlDirection] = useState<number>(0);
  const [manualShootTrigger, setManualShootTrigger] = useState<number>(0);
  const [showHowToPlay, setShowHowToPlay] = useState<boolean>(false);

  // 게임 HUD 상태
  const [lives, setLives] = useState<number>(3);
  const [stats, setStats] = useState<GameStats>({
    score: 0,
    enemiesRemaining: 20,
    timeElapsed: 0,
    shotsFired: 0,
    shotsHit: 0,
  });

  // 카운트다운 타이머 효과
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (phase === "COUNTDOWN") {
      soundManager.playBeep(false);
      timer = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            clearInterval(timer);
            soundManager.playBeep(true);
            setPhase("PLAYING");
            return 3;
          }
          soundManager.playBeep(false);
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [phase]);

  // 게임 시작 (카운트다운으로 진입)
  const handleStartGame = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!playerName.trim()) return;
    setCountdown(3);
    setLives(3);
    setStats({
      score: 0,
      enemiesRemaining: 20,
      timeElapsed: 0,
      shotsFired: 0,
      shotsHit: 0,
    });
    setPhase("COUNTDOWN");
  };

  // 재시작
  const handleRestart = () => {
    setCountdown(3);
    setLives(3);
    setStats({
      score: 0,
      enemiesRemaining: 20,
      timeElapsed: 0,
      shotsFired: 0,
      shotsHit: 0,
    });
    setPhase("COUNTDOWN");
  };

  // 처음으로
  const handleHome = () => {
    setPhase("NAME_INPUT");
  };

  // 일시정지 토글
  const handleTogglePause = () => {
    if (phase === "PLAYING") {
      setPhase("PAUSED");
    } else if (phase === "PAUSED") {
      setPhase("PLAYING");
    }
  };

  // 사운드 토글
  const handleToggleSound = () => {
    const nextVal = !soundEnabled;
    setSoundEnabled(nextVal);
    soundManager.enabled = nextVal;
  };

  // 게임 종료 콜백
  const handleGameOver = (finalStats: GameStats, victory: boolean) => {
    setStats(finalStats);
    setPhase(victory ? "VICTORY" : "GAMEOVER");
  };

  // 명중률 계산
  const accuracy = stats.shotsFired > 0 ? Math.round((stats.shotsHit / stats.shotsFired) * 100) : 0;

  return (
    <div
      className="flex flex-col items-center justify-center w-full min-h-screen p-4 select-none"
      style={{ backgroundColor: "#060714", color: "#ffffff" }}
    >
      {/* 1단계: 사용자 스케치 기반 레트로 시작 화면 (전체 화면 적용 및 중앙 정렬) */}
      {phase === "NAME_INPUT" && (
        <div
          id="start-screen"
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            width: "100vw",
            height: "100vh",
            backgroundImage: "url('/space_stars_bg.png')",
            backgroundSize: "cover",
            backgroundPosition: "center",
            backgroundRepeat: "no-repeat",
            margin: 0,
            overflow: "hidden",
            zIndex: 10,
          }}
        >
          {/* 중앙 UI 컨테이너 (사용자 지정: Flexbox 중앙 정렬 + 반투명 어두운 배경 + 둥근 모서리) */}
          <div
            style={{
              position: "absolute",
              top: "50%",
              left: "50%",
              transform: "translate(-50%, -50%)",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              width: "90%",
              maxWidth: "420px",
              padding: "32px 28px",
              background: "rgba(0, 0, 0, 0.65)",
              borderRadius: "16px",
              border: "3px solid #38bdf8",
              boxShadow: "0 0 35px rgba(56, 189, 248, 0.5), inset 0 0 15px rgba(0, 0, 0, 0.8)",
              backdropFilter: "blur(4px)",
              zIndex: 20,
              gap: "24px",
            }}
          >
            {/* 1. 타이틀: SPACE PRO */}
            <div className="text-center">
              <h1
                className="text-4xl sm:text-5xl font-black title-space-pro drop-shadow-2xl select-none uppercase tracking-widest leading-tight"
                style={{ color: "#FFFFFF" }}
              >
                SPACE PRO
              </h1>
              <p
                className="text-[10px] sm:text-xs font-pixel mt-3 tracking-widest glowing-pixel-text"
                style={{ color: "#E0F2FE" }}
              >
                ★ GALAXY DEFENDER 1984 ★
              </p>
            </div>

            {/* 입력 및 버튼 전체 폼 */}
            <form
              onSubmit={handleStartGame}
              className="w-full flex flex-col items-center"
              style={{ gap: "20px" }}
            >
              {/* 2. PLAYER NAME : [ 입력칸 ] */}
              <div
                className="w-full flex flex-col sm:flex-row items-center justify-between gap-3 px-4 py-3 rounded-lg border-2 border-cyan-400"
                style={{ background: "rgba(0, 0, 0, 0.75)" }}
              >
                <span
                  className="font-pixel text-xs font-bold whitespace-nowrap glowing-pixel-text"
                  style={{ color: "#FFFFFF" }}
                >
                  PLAYER NAME :
                </span>
                <input
                  type="text"
                  maxLength={10}
                  value={playerName}
                  onChange={(e) => setPlayerName(e.target.value)}
                  placeholder="PILOT"
                  autoFocus
                  style={{ color: "#FFFFFF", background: "#0c0d24" }}
                  className="w-full sm:w-40 px-3 py-2 font-pixel text-center text-xs sm:text-sm border-2 border-cyan-400 rounded focus:outline-none focus:border-yellow-400 focus:shadow-[0_0_12px_#38bdf8] uppercase tracking-wider transition-all"
                />
              </div>

              {/* 3. HOW TO PLAY 조작법 버튼 */}
              <button
                type="button"
                onClick={() => setShowHowToPlay(true)}
                style={{
                  color: "#FFFFFF",
                  background: "rgba(30, 41, 59, 0.9)",
                  borderRadius: "8px",
                }}
                className="w-full py-3.5 hover:bg-[#334155] active:scale-95 font-pixel text-xs sm:text-sm border-2 border-cyan-400 shadow-[0_4px_0_#0284c7] transition-all cursor-pointer flex items-center justify-center gap-2 glowing-pixel-text"
                title="조작 방법 확인"
              >
                <span>🕹</span>
                <span>HOW TO PLAY</span>
              </button>

              {/* 4. START 시작 버튼 */}
              <button
                type="submit"
                disabled={!playerName.trim()}
                style={{
                  borderRadius: "8px",
                }}
                className="w-full py-4 bg-gradient-to-r from-amber-400 via-yellow-400 to-amber-500 hover:from-yellow-300 hover:to-amber-400 active:scale-95 disabled:opacity-40 disabled:pointer-events-none text-black font-pixel text-base sm:text-lg border-4 border-white pixel-btn-start font-black tracking-widest cursor-pointer"
              >
                ★ START ★
              </button>
            </form>
          </div>

          {/* 조작 방법 모달 팝업 */}
          {showHowToPlay && (
            <div className="absolute inset-0 bg-black/90 backdrop-blur-sm z-30 flex flex-col items-center justify-center p-4">
              <div className="w-full max-w-[320px] bg-zinc-950 border-4 border-cyan-400 p-5 rounded-lg pixel-box text-left font-pixel text-[10px] space-y-3 shadow-2xl">
                <h3 className="text-amber-400 text-center text-xs neon-text-yellow border-b-2 border-zinc-800 pb-2">
                  🕹 MISSION CONTROLS
                </h3>
                <div className="space-y-2 text-zinc-300">
                  <p>
                    <span className="text-cyan-400 font-bold">← / → :</span> 좌우 비행기 이동
                  </p>
                  <p>
                    <span className="text-cyan-400 font-bold">A / D :</span> 대체 방향키
                  </p>
                  <p>
                    <span className="text-cyan-400 font-bold">SPACE :</span> 미사일 수동 발사
                  </p>
                  <p>
                    <span className="text-cyan-400 font-bold">TOUCH :</span> 화면 터치 드래그로 조종
                  </p>
                  <p>
                    <span className="text-green-400 font-bold">AUTO FIRE :</span> 자동 연사 토글
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setShowHowToPlay(false)}
                  className="w-full mt-3 py-2.5 bg-cyan-600 hover:bg-cyan-500 text-white font-pixel text-xs border-2 border-white active:scale-95 transition-all cursor-pointer"
                >
                  ✓ 닫기 (CLOSE)
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* 2단계 ~ 4단계: 게임 화면 컨테이너 */}
      {phase !== "NAME_INPUT" && (
        <div className="w-full max-w-[500px] flex flex-col items-center">
          {/* 상단 HUD 표시줄 */}
          <div className="w-full bg-zinc-900 border-2 border-zinc-700 px-3 py-2 rounded-t-lg flex items-center justify-between text-[9px] text-zinc-300 mb-2 shadow-md">
            <div>
              <span className="text-zinc-500">PILOT:</span>{" "}
              <span className="text-cyan-400 font-bold">{playerName}</span>
            </div>
            <div>
              <span className="text-zinc-500">SCORE:</span>{" "}
              <span className="text-amber-400 font-bold">{stats.score}</span>
            </div>
            <div>
              <span className="text-zinc-500">TARGET:</span>{" "}
              <span className="text-rose-400 font-bold">{stats.enemiesRemaining}</span>
            </div>
            <div>
              <span className="text-zinc-500">TIME:</span>{" "}
              <span className="text-emerald-400 font-bold">{stats.timeElapsed}s</span>
            </div>
            <div className="flex gap-1 text-red-500">
              {Array.from({ length: 3 }).map((_, i) => (
                <span key={i} className={i < lives ? "opacity-100" : "opacity-20"}>
                  ♥
                </span>
              ))}
            </div>
          </div>

          {/* 캔버스 및 오버레이 영역 */}
          <div className="relative w-full">
            <PixelCanvas
              playerName={playerName}
              isPlaying={phase === "PLAYING"}
              isPaused={phase === "PAUSED"}
              phase={phase}
              onGameOver={handleGameOver}
              onStatsUpdate={setStats}
              onLivesUpdate={setLives}
              autoShoot={autoShoot}
              controlDirection={controlDirection}
              manualShootTrigger={manualShootTrigger}
              onRestart={handleRestart}
            />

            {/* [카운트다운 오버레이] */}
            {phase === "COUNTDOWN" && (
              <div className="absolute inset-0 bg-black/70 backdrop-blur-[2px] flex flex-col items-center justify-center z-30">
                <p className="text-[10px] text-cyan-400 mb-3 tracking-widest animate-pulse">
                  GET READY PILOT {playerName}!
                </p>
                <div className="text-6xl font-pixel text-amber-400 neon-text-yellow animate-bounce">
                  {countdown}
                </div>
              </div>
            )}

            {/* [일시정지 팝업 모달] */}
            {phase === "PAUSED" && (
              <div className="absolute inset-0 bg-black/85 backdrop-blur-sm flex flex-col items-center justify-center z-30 p-6">
                <div className="p-6 bg-zinc-900 border-4 border-amber-400 rounded-lg pixel-box text-center max-w-[320px] w-full">
                  <h3 className="text-xl font-bold text-amber-400 neon-text-yellow mb-4">
                    GAME PAUSED
                  </h3>
                  <div className="flex flex-col gap-3 text-[10px]">
                    <button
                      onClick={handleTogglePause}
                      className="py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-pixel border-2 border-white active:scale-95 transition-transform"
                    >
                      ▶ CONTINUE
                    </button>
                    <button
                      onClick={handleRestart}
                      className="py-3 bg-cyan-600 hover:bg-cyan-500 text-white font-pixel border-2 border-white active:scale-95 transition-transform"
                    >
                      🔄 RESTART
                    </button>
                    <button
                      onClick={handleHome}
                      className="py-3 bg-rose-600 hover:bg-rose-500 text-white font-pixel border-2 border-white active:scale-95 transition-transform"
                    >
                      🏠 MAIN MENU
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* 하단 컨트롤 패널 */}
          <GameControls
            onMoveLeft={(pressed) => setControlDirection(pressed ? -1 : 0)}
            onMoveRight={(pressed) => setControlDirection(pressed ? 1 : 0)}
            onFire={() => setManualShootTrigger((prev) => prev + 1)}
            autoShoot={autoShoot}
            onToggleAutoShoot={() => setAutoShoot((prev) => !prev)}
            soundEnabled={soundEnabled}
            onToggleSound={handleToggleSound}
            onPause={handleTogglePause}
            onRestart={handleRestart}
            onHome={handleHome}
            isPaused={phase === "PAUSED"}
          />
        </div>
      )}
    </div>
  );
};
