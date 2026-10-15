"use client";

import React, { useEffect, useRef } from "react";
import { soundManager } from "@/lib/audio";

export interface GameStats {
  score: number;
  enemiesRemaining: number;
  timeElapsed: number;
  shotsFired: number;
  shotsHit: number;
}

interface PixelCanvasProps {
  playerName: string;
  isPaused: boolean;
  isPlaying: boolean;
  phase: string;
  onGameOver: (stats: GameStats, victory: boolean) => void;
  onStatsUpdate: (stats: GameStats) => void;
  onLivesUpdate: (lives: number) => void;
  autoShoot: boolean;
  controlDirection: number; // -1: left, 1: right, 0: none
  manualShootTrigger: number;
  onRestart: () => void;
}

// 픽셀 도트 매트릭스 (1: 주 색상, 2: 보조 색상, 3: 하이라이트/불꽃)
const PLAYER_SPRITE = [
  [0,0,0,1,1,0,0,0],
  [0,0,1,3,3,1,0,0],
  [0,0,1,1,1,1,0,0],
  [0,1,1,2,2,1,1,0],
  [1,1,2,2,2,2,1,1],
  [1,1,1,1,1,1,1,1],
  [1,0,1,0,0,1,0,1],
  [0,0,3,3,3,3,0,0],
];

// 적 1 (정찰기 - 초록)
const ENEMY_SCOUT = [
  [0,1,0,0,0,0,1,0],
  [0,0,1,0,0,1,0,0],
  [0,1,1,1,1,1,1,0],
  [1,1,0,1,1,0,1,1],
  [1,1,1,1,1,1,1,1],
  [0,1,0,1,1,0,1,0],
  [1,0,1,0,0,1,0,1],
  [0,1,0,0,0,0,1,0]
];

// 적 2 (공격기 - 마젠타/보라)
const ENEMY_FIGHTER = [
  [0,0,0,1,1,0,0,0],
  [0,1,1,1,1,1,1,0],
  [1,1,2,1,1,2,1,1],
  [1,1,1,1,1,1,1,1],
  [1,0,1,1,1,1,0,1],
  [0,0,1,0,0,1,0,0],
  [0,1,0,1,1,0,1,0],
  [1,0,0,0,0,0,0,1]
];

// 적 3 (중형 보스 - 노랑/주황)
const ENEMY_CRUISER = [
  [0,0,1,1,1,1,0,0],
  [0,1,3,1,1,3,1,0],
  [1,1,1,1,1,1,1,1],
  [1,2,1,2,2,1,2,1],
  [1,1,1,1,1,1,1,1],
  [0,1,1,0,0,1,1,0],
  [1,1,0,0,0,0,1,1],
  [0,1,0,0,0,0,1,0]
];

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  color: string;
  size: number;
  alpha: number;
  life: number;
}

interface FloatingText {
  x: number;
  y: number;
  text: string;
  color: string;
  alpha: number;
}

export const PixelCanvas: React.FC<PixelCanvasProps> = ({
  isPaused,
  isPlaying,
  phase,
  onGameOver,
  onStatsUpdate,
  onLivesUpdate,
  autoShoot,
  controlDirection,
  manualShootTrigger,
  onRestart,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // 게임 내부 상태 Refs (리렌더링 병목 방지)
  const gameStateRef = useRef({
    player: {
      x: 240,
      y: 540,
      width: 40,
      height: 40,
      speed: 6,
      lives: 3,
      invulnerable: 0,
    },
    bullets: [] as { x: number; y: number; width: number; height: number; speed: number }[],
    enemyBullets: [] as { x: number; y: number; width: number; height: number; speedY: number }[],
    enemies: [] as {
      id: number;
      type: number; // 0, 1, 2
      x: number;
      y: number;
      width: number;
      height: number;
      hp: number;
      maxHp: number;
      speedX: number;
      speedY: number;
      points: number;
      lastShotTime: number;
    }[],
    particles: [] as Particle[],
    floatingTexts: [] as FloatingText[],
    stars: [] as { x: number; y: number; speed: number; size: number; color: string }[],
    score: 0,
    enemiesRemaining: 20,
    timeElapsed: 0,
    shotsFired: 0,
    shotsHit: 0,
    lastShotTime: 0,
    lastSpawnTime: 0,
    nextEnemyId: 1,
    spawnInterval: 1400,
    keys: {
      left: false,
      right: false,
      shoot: false,
    },
    touchX: null as number | null,
  });

  // 상태 리셋 (COUNTDOWN 시작 시마다 초기화)
  useEffect(() => {
    if (phase === "COUNTDOWN") {
      const st = gameStateRef.current;
      st.player.x = 240;
      st.player.y = 540;
      st.player.lives = 3;
      st.player.invulnerable = 0;
      st.bullets = [];
      st.enemyBullets = [];
      st.enemies = [];
      st.particles = [];
      st.floatingTexts = [];
      st.score = 0;
      st.enemiesRemaining = 20;
      st.timeElapsed = 0;
      st.shotsFired = 0;
      st.shotsHit = 0;
      st.lastShotTime = 0;
      st.lastSpawnTime = 0;
      st.nextEnemyId = 1;
      st.touchX = null;
      onLivesUpdate(3);
    }
  }, [phase]);

  // 키보드 이벤트 바인딩
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === "ArrowLeft" || e.code === "KeyA") {
        gameStateRef.current.keys.left = true;
      }
      if (e.code === "ArrowRight" || e.code === "KeyD") {
        gameStateRef.current.keys.right = true;
      }
      if (e.code === "Space") {
        e.preventDefault();
        gameStateRef.current.keys.shoot = true;
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.code === "ArrowLeft" || e.code === "KeyA") {
        gameStateRef.current.keys.left = false;
      }
      if (e.code === "ArrowRight" || e.code === "KeyD") {
        gameStateRef.current.keys.right = false;
      }
      if (e.code === "Space") {
        gameStateRef.current.keys.shoot = false;
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
    };
  }, []);

  // 수동 발사 트리거 감지
  const prevTriggerRef = useRef(manualShootTrigger);
  useEffect(() => {
    if (manualShootTrigger !== prevTriggerRef.current) {
      prevTriggerRef.current = manualShootTrigger;
      fireBullet();
    }
  }, [manualShootTrigger]);

  const fireBullet = () => {
    if (!isPlaying || isPaused) return;
    const p = gameStateRef.current.player;
    // 2발의 탄환 발사
    gameStateRef.current.bullets.push(
      { x: p.x + 8, y: p.y - 6, width: 4, height: 14, speed: 10 },
      { x: p.x + p.width - 12, y: p.y - 6, width: 4, height: 14, speed: 10 }
    );
    gameStateRef.current.shotsFired += 2;
    soundManager.playShoot();
  };

  // 배경 별빛 생성
  useEffect(() => {
    const stars = [];
    const colors = ["#ffffff", "#67e8f9", "#fef08a", "#cbd5e1"];
    for (let i = 0; i < 70; i++) {
      stars.push({
        x: Math.random() * 480,
        y: Math.random() * 640,
        speed: 0.5 + Math.random() * 2,
        size: Math.random() > 0.8 ? 3 : (Math.random() > 0.4 ? 2 : 1),
        color: colors[Math.floor(Math.random() * colors.length)],
      });
    }
    gameStateRef.current.stars = stars;
  }, []);

  // 폭발 파티클 생성 함수
  const createExplosion = (x: number, y: number, colorScheme: string[]) => {
    soundManager.playExplosion();
    for (let i = 0; i < 24; i++) {
      const angle = (Math.PI * 2 * i) / 24 + Math.random() * 0.4;
      const speed = 1.5 + Math.random() * 4;
      gameStateRef.current.particles.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        color: colorScheme[Math.floor(Math.random() * colorScheme.length)],
        size: 3 + Math.floor(Math.random() * 3),
        alpha: 1,
        life: 0.8 + Math.random() * 0.4,
      });
    }
  };

  // 체력 차감 및 피격 처리 함수
  const applyPlayerDamage = () => {
    const st = gameStateRef.current;
    if (st.player.invulnerable > 0) return;

    st.player.lives = Math.max(0, st.player.lives - 1);
    onLivesUpdate(st.player.lives);
    st.player.invulnerable = 2.0; // 2초 무적 시간

    createExplosion(
      st.player.x + st.player.width / 2,
      st.player.y + st.player.height / 2,
      ["#ef4444", "#f97316", "#ffffff"]
    );

    if (st.player.lives <= 0) {
      soundManager.playGameOver();
      onGameOver(
        {
          score: st.score,
          enemiesRemaining: st.enemiesRemaining,
          timeElapsed: Math.floor(st.timeElapsed),
          shotsFired: st.shotsFired,
          shotsHit: st.shotsHit,
        },
        false
      );
    }
  };

  // 게임 루프
  useEffect(() => {
    let animationId: number;
    let lastTime = performance.now();

    const loop = (currentTime: number) => {
      const dt = (currentTime - lastTime) / 1000;
      lastTime = currentTime;

      const canvas = canvasRef.current;
      if (!canvas) {
        animationId = requestAnimationFrame(loop);
        return;
      }
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      // 비활성화 상태에서는 기본 배경만 렌더링
      if (!isPlaying || isPaused) {
        drawScene(ctx, false);
        animationId = requestAnimationFrame(loop);
        return;
      }

      const st = gameStateRef.current;
      st.timeElapsed += dt;

      // 플레이어 이동 로직
      let moveDir = 0;
      if (st.keys.left || controlDirection < 0) moveDir -= 1;
      if (st.keys.right || controlDirection > 0) moveDir += 1;

      st.player.x += moveDir * st.player.speed;

      // 마우스/터치 드래그 위치 보정
      if (st.touchX !== null) {
        const targetX = st.touchX - st.player.width / 2;
        const diff = targetX - st.player.x;
        if (Math.abs(diff) > 2) {
          st.player.x += Math.sign(diff) * Math.min(Math.abs(diff), st.player.speed * 1.5);
        }
      }

      // 화면 경계 체크
      if (st.player.x < 10) st.player.x = 10;
      if (st.player.x > canvas.width - st.player.width - 10) {
        st.player.x = canvas.width - st.player.width - 10;
      }

      if (st.player.invulnerable > 0) {
        st.player.invulnerable -= dt;
      }

      // 자동 발사 및 키 발사
      if (autoShoot || st.keys.shoot) {
        if (currentTime - st.lastShotTime > 180) {
          fireBullet();
          st.lastShotTime = currentTime;
        }
      }

      // 별 배경 이동
      for (const star of st.stars) {
        star.y += star.speed;
        if (star.y > canvas.height) {
          star.y = 0;
          star.x = Math.random() * canvas.width;
        }
      }

      // 탄환 업데이트
      for (let i = st.bullets.length - 1; i >= 0; i--) {
        const b = st.bullets[i];
        b.y -= b.speed;
        if (b.y < -20) {
          st.bullets.splice(i, 1);
        }
      }

      // 적 스폰 로직 (목표 남아있는 경우만)
      if (st.enemiesRemaining > 0 && currentTime - st.lastSpawnTime > st.spawnInterval) {
        st.lastSpawnTime = currentTime;
        const rand = Math.random();
        let type = 0;
        let hp = 1;
        let points = 100;
        let width = 36;
        let height = 36;
        let speedY = 2 + Math.random() * 1.5;

        if (rand > 0.75) {
          type = 2; // 크루저
          hp = 3;
          points = 300;
          width = 44;
          height = 44;
          speedY = 1.2;
        } else if (rand > 0.4) {
          type = 1; // 파이터
          hp = 2;
          points = 200;
          width = 38;
          height = 38;
          speedY = 2.2;
        }

        const x = 20 + Math.random() * (canvas.width - width - 40);
        st.enemies.push({
          id: st.nextEnemyId++,
          type,
          x,
          y: -height,
          width,
          height,
          hp,
          maxHp: hp,
          speedX: (Math.random() - 0.5) * 1.5,
          speedY,
          points,
          lastShotTime: currentTime,
        });
      }

      // 적 탄환 발사 및 업데이트
      for (const e of st.enemies) {
        if (e.type >= 1 && currentTime - e.lastShotTime > (e.type === 2 ? 1500 : 2000)) {
          e.lastShotTime = currentTime;
          st.enemyBullets.push({
            x: e.x + e.width / 2 - 3,
            y: e.y + e.height,
            width: 6,
            height: 10,
            speedY: 4.5,
          });
        }
      }

      for (let i = st.enemyBullets.length - 1; i >= 0; i--) {
        const eb = st.enemyBullets[i];
        eb.y += eb.speedY;

        // 적 탄환 vs 플레이어 충돌
        const p = st.player;
        if (
          eb.x < p.x + p.width - 6 &&
          eb.x + eb.width > p.x + 6 &&
          eb.y < p.y + p.height - 6 &&
          eb.y + eb.height > p.y + 6
        ) {
          st.enemyBullets.splice(i, 1);
          applyPlayerDamage();
          continue;
        }

        if (eb.y > canvas.height + 20) {
          st.enemyBullets.splice(i, 1);
        }
      }

      // 적 업데이트 & 충돌 판정
      for (let ei = st.enemies.length - 1; ei >= 0; ei--) {
        const e = st.enemies[ei];
        e.y += e.speedY;
        e.x += e.speedX;

        // 좌우 벽 바운스
        if (e.x < 10 || e.x > canvas.width - e.width - 10) {
          e.speedX *= -1;
        }

        // 탄환과 충돌 판정
        let enemyDestroyed = false;
        for (let bi = st.bullets.length - 1; bi >= 0; bi--) {
          const b = st.bullets[bi];
          if (
            b.x < e.x + e.width &&
            b.x + b.width > e.x &&
            b.y < e.y + e.height &&
            b.y + b.height > e.y
          ) {
            // 명중
            st.bullets.splice(bi, 1);
            st.shotsHit += 1;
            e.hp -= 1;

            if (e.hp <= 0) {
              enemyDestroyed = true;
              st.score += e.points;
              st.enemiesRemaining = Math.max(0, st.enemiesRemaining - 1);
              
              // 폭발 색상
              const colors = e.type === 0 
                ? ["#4ade80", "#22c55e", "#bbf7d0", "#ffffff"]
                : e.type === 1 
                  ? ["#c084fc", "#a855f7", "#f472b6", "#ffffff"]
                  : ["#facc15", "#fb923c", "#ef4444", "#ffffff"];

              createExplosion(e.x + e.width / 2, e.y + e.height / 2, colors);

              // 획득 점수 플로팅 텍스트
              st.floatingTexts.push({
                x: e.x + e.width / 2,
                y: e.y,
                text: `+${e.points}`,
                color: "#facc15",
                alpha: 1,
              });

              break;
            } else {
              // 피격 이펙트 (약한 스파크)
              createExplosion(b.x, b.y, ["#ffffff", "#fef08a"]);
            }
          }
        }

        if (enemyDestroyed) {
          st.enemies.splice(ei, 1);

          // 게임 승리 조건 달성 체크
          if (st.enemiesRemaining <= 0) {
            soundManager.playVictory();
            onGameOver(
              {
                score: st.score,
                enemiesRemaining: 0,
                timeElapsed: Math.floor(st.timeElapsed),
                shotsFired: st.shotsFired,
                shotsHit: st.shotsHit,
              },
              true
            );
            return;
          }
          continue;
        }

        // 플레이어와 충돌 판정
        const p = st.player;
        if (
          p.x + 6 < e.x + e.width &&
          p.x + p.width - 6 > e.x &&
          p.y + 6 < e.y + e.height &&
          p.y + p.height - 6 > e.y
        ) {
          applyPlayerDamage();
        }

        // 화면 하단 벗어난 경우 (생명력 차감 또는 감점)
        if (e.y > canvas.height + 20) {
          st.enemies.splice(ei, 1);
        }
      }

      // 파티클 업데이트
      for (let pi = st.particles.length - 1; pi >= 0; pi--) {
        const pt = st.particles[pi];
        pt.x += pt.vx;
        pt.y += pt.vy;
        pt.alpha -= dt * 1.5;
        if (pt.alpha <= 0) {
          st.particles.splice(pi, 1);
        }
      }

      // 플로팅 텍스트 업데이트
      for (let fi = st.floatingTexts.length - 1; fi >= 0; fi--) {
        const ft = st.floatingTexts[fi];
        ft.y -= 30 * dt;
        ft.alpha -= dt * 1.2;
        if (ft.alpha <= 0) {
          st.floatingTexts.splice(fi, 1);
        }
      }

      // 부모 컴포넌트에 통계 전달
      onStatsUpdate({
        score: st.score,
        enemiesRemaining: st.enemiesRemaining,
        timeElapsed: Math.floor(st.timeElapsed),
        shotsFired: st.shotsFired,
        shotsHit: st.shotsHit,
      });

      // 최종 화면 드로잉
      drawScene(ctx, true);

      animationId = requestAnimationFrame(loop);
    };

    animationId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animationId);
  }, [isPlaying, isPaused, autoShoot, controlDirection]);

  // 픽셀 스프라이트 렌더러
  const drawPixelSprite = (
    ctx: CanvasRenderingContext2D,
    matrix: number[][],
    x: number,
    y: number,
    width: number,
    height: number,
    colorMap: Record<number, string>
  ) => {
    const rows = matrix.length;
    const cols = matrix[0].length;
    const pixelW = width / cols;
    const pixelH = height / rows;

    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const val = matrix[r][c];
        if (val > 0 && colorMap[val]) {
          ctx.fillStyle = colorMap[val];
          ctx.fillRect(
            Math.floor(x + c * pixelW),
            Math.floor(y + r * pixelH),
            Math.ceil(pixelW),
            Math.ceil(pixelH)
          );
        }
      }
    }
  };

  // 전체 장면 렌더링
  const drawScene = (ctx: CanvasRenderingContext2D, isSimulating: boolean) => {
    const canvas = ctx.canvas;
    const st = gameStateRef.current;

    // 1. 우주 배경 채우기
    ctx.fillStyle = "#050711";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // 2. 배경 별빛
    for (const star of st.stars) {
      ctx.fillStyle = star.color;
      ctx.fillRect(star.x, star.y, star.size, star.size);
    }

    // 3. 플레이어 탄환 (청록 네온 레이저)
    for (const b of st.bullets) {
      ctx.fillStyle = "#00ffff";
      ctx.fillRect(b.x, b.y, b.width, b.height);
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(b.x + 1, b.y + 2, b.width - 2, b.height - 4);
    }

    // 3-1. 적 탄환 (빨강/주황 네온 레이저)
    for (const eb of st.enemyBullets) {
      ctx.fillStyle = "#ef4444";
      ctx.fillRect(eb.x, eb.y, eb.width, eb.height);
      ctx.fillStyle = "#fef08a";
      ctx.fillRect(eb.x + 1, eb.y + 1, eb.width - 2, eb.height - 2);
    }

    // 4. 적 기체
    for (const e of st.enemies) {
      let matrix = ENEMY_SCOUT;
      let colorMap: Record<number, string> = { 1: "#22c55e", 2: "#15803d", 3: "#86efac" };

      if (e.type === 1) {
        matrix = ENEMY_FIGHTER;
        colorMap = { 1: "#c084fc", 2: "#7e22ce", 3: "#f472b6" };
      } else if (e.type === 2) {
        matrix = ENEMY_CRUISER;
        colorMap = { 1: "#facc15", 2: "#c2410c", 3: "#f97316" };
      }

      drawPixelSprite(ctx, matrix, e.x, e.y, e.width, e.height, colorMap);

      // 체력이 1 초과인 경우 미니 픽셀 HP 바 표시
      if (e.maxHp > 1) {
        const hpPercent = e.hp / e.maxHp;
        ctx.fillStyle = "#334155";
        ctx.fillRect(e.x, e.y - 6, e.width, 3);
        ctx.fillStyle = e.type === 2 ? "#eab308" : "#a855f7";
        ctx.fillRect(e.x, e.y - 6, e.width * hpPercent, 3);
      }
    }

    // 5. 플레이어 (무적 시 깜빡임)
    const p = st.player;
    if (st.player.invulnerable <= 0 || Math.floor(performance.now() / 100) % 2 === 0) {
      const playerColors: Record<number, string> = {
        1: "#38bdf8", // 사이언 블루
        2: "#1e40af", // 다크 블루
        3: Math.floor(performance.now() / 80) % 2 === 0 ? "#f97316" : "#facc15", // 부스터 불꽃
      };
      drawPixelSprite(ctx, PLAYER_SPRITE, p.x, p.y, p.width, p.height, playerColors);
    }

    // 6. 파티클 이펙트
    for (const pt of st.particles) {
      ctx.save();
      ctx.globalAlpha = Math.max(0, pt.alpha);
      ctx.fillStyle = pt.color;
      ctx.fillRect(pt.x, pt.y, pt.size, pt.size);
      ctx.restore();
    }

    // 7. 플로팅 텍스트
    for (const ft of st.floatingTexts) {
      ctx.save();
      ctx.globalAlpha = Math.max(0, ft.alpha);
      ctx.font = '10px "Press Start 2P", monospace';
      ctx.fillStyle = ft.color;
      ctx.textAlign = "center";
      ctx.fillText(ft.text, ft.x, ft.y);
      ctx.restore();
    }
  };

  // 터치/마우스 핸들링
  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const scaleX = 480 / rect.width;
    gameStateRef.current.touchX = (e.clientX - rect.left) * scaleX;
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (gameStateRef.current.touchX !== null) {
      const rect = e.currentTarget.getBoundingClientRect();
      const scaleX = 480 / rect.width;
      gameStateRef.current.touchX = (e.clientX - rect.left) * scaleX;
    }
  };

  const handlePointerUp = () => {
    gameStateRef.current.touchX = null;
  };

  const isGameOverOrVictory = phase === "GAMEOVER" || phase === "VICTORY";

  return (
    <div className="relative w-full max-w-[480px] aspect-[3/4] mx-auto overflow-hidden rounded-lg crt-overlay pixel-box border-4 border-slate-700 bg-black">
      <canvas
        ref={canvasRef}
        width={480}
        height={640}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        className="w-full h-full block cursor-crosshair touch-none image-pixelated"
      />

      {/* 캔버스 내 반투명 결과 오버레이 (Score 점수판 + 다시 시작 버튼) */}
      {isGameOverOrVictory && (
        <div className="absolute inset-0 bg-black/80 backdrop-blur-[2px] flex flex-col items-center justify-center p-6 z-30">
          <div
            className={`p-6 bg-zinc-950/95 border-4 rounded-xl pixel-box text-center max-w-[340px] w-full shadow-2xl ${
              phase === "VICTORY"
                ? "border-green-400 shadow-[0_0_24px_rgba(34,197,94,0.5)]"
                : "border-red-500 shadow-[0_0_24px_rgba(239,68,68,0.5)]"
            }`}
          >
            <div className="text-4xl mb-3 animate-bounce">
              {phase === "VICTORY" ? "🏆" : "💥"}
            </div>

            <h3
              className={`text-sm sm:text-base font-bold mb-3 tracking-wider ${
                phase === "VICTORY"
                  ? "text-green-400 neon-text-green"
                  : "text-red-500 neon-text-red"
              }`}
            >
              {phase === "VICTORY" ? "MISSION COMPLETE!" : "GAME OVER"}
            </h3>

            {/* 최종 SCORE 점수판 */}
            <div className="bg-zinc-900 border-2 border-zinc-700 p-3 rounded mb-5 text-left font-pixel text-[9px] space-y-2">
              <div className="flex justify-between items-center border-b border-zinc-800 pb-2">
                <span className="text-zinc-400">FINAL SCORE:</span>
                <span className="text-amber-300 text-xs font-bold neon-text-yellow">
                  {gameStateRef.current.score} PTS
                </span>
              </div>
              <div className="flex justify-between items-center text-zinc-400">
                <span>TIME:</span>
                <span className="text-cyan-400">{Math.floor(gameStateRef.current.timeElapsed)}s</span>
              </div>
              <div className="flex justify-between items-center text-zinc-400">
                <span>TARGET LEFT:</span>
                <span className="text-rose-400">{gameStateRef.current.enemiesRemaining}</span>
              </div>
            </div>

            {/* [다시 시작] 버튼 */}
            <button
              onClick={onRestart}
              className="w-full py-3.5 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-pixel text-xs border-2 border-white shadow-[0_0_12px_rgba(6,182,212,0.6)] active:scale-95 transition-all cursor-pointer"
            >
              🔄 다시 시작 (RETRY)
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
