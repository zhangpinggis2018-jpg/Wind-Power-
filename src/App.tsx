/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useRef, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Wind, Shield, Target, Trophy, XCircle, Languages, Info } from 'lucide-react';
import { 
  Point, Rocket, Interceptor, Explosion, Battery, Turbine, 
  GameState, LANGUAGES, ResearchShip 
} from './types';

const CANVAS_WIDTH = 800;
const CANVAS_HEIGHT = 600;
const ROCKET_SPEED_MIN = 0.2;
const ROCKET_SPEED_MAX = 0.8;
const INTERCEPTOR_SPEED = 5;
const EXPLOSION_MAX_RADIUS = 35;
const EXPLOSION_GROWTH = 1.5;
const WIN_SCORE = 1000;

export default function App() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [gameState, setGameState] = useState<GameState>('START');
  const [score, setScore] = useState(0);
  const [lang, setLang] = useState<'en' | 'zh'>('zh');
  const [showInstructions, setShowInstructions] = useState(false);
  const starsRef = useRef<{x: number, y: number, size: number}[]>([]);

  // Initialize stars
  if (starsRef.current.length === 0) {
    for (let i = 0; i < 150; i++) {
      starsRef.current.push({
        x: Math.random() * CANVAS_WIDTH,
        y: Math.random() * 500, // Only in the sky
        size: Math.random() * 1.5
      });
    }
  }

  // Game Entities
  const rocketsRef = useRef<Rocket[]>([]);
  const interceptorsRef = useRef<Interceptor[]>([]);
  const explosionsRef = useRef<Explosion[]>([]);
  const batteriesRef = useRef<Battery[]>([
    { id: 'b1', pos: { x: 120, y: 575 }, missiles: 25, maxMissiles: 25, destroyed: false, health: 2 },
    { id: 'b2', pos: { x: 320, y: 560 }, missiles: 25, maxMissiles: 25, destroyed: false, health: 2 },
    { id: 'b3', pos: { x: 520, y: 580 }, missiles: 25, maxMissiles: 25, destroyed: false, health: 2 },
    { id: 'b4', pos: { x: 720, y: 565 }, missiles: 25, maxMissiles: 25, destroyed: false, health: 2 },
  ]);
  const researchShipRef = useRef<ResearchShip>({
    id: 'ship1',
    pos: { x: 500, y: 505 },
    destroyed: false
  });
  const turbinesRef = useRef<Turbine[]>([
    { id: 't1', pos: { x: 150, y: 480 }, destroyed: false, health: 2 },
    { id: 't2', pos: { x: 280, y: 510 }, destroyed: false, health: 2 },
    { id: 't3', pos: { x: 400, y: 490 }, destroyed: false, health: 2 },
    { id: 't4', pos: { x: 550, y: 520 }, destroyed: false, health: 2 },
    { id: 't5', pos: { x: 680, y: 485 }, destroyed: false, health: 2 },
    { id: 't6', pos: { x: 350, y: 530 }, destroyed: false, health: 2 },
    { id: 't7', pos: { x: 100, y: 520 }, destroyed: false, health: 2 },
    { id: 't8', pos: { x: 220, y: 495 }, destroyed: false, health: 2 },
    { id: 't9', pos: { x: 480, y: 480 }, destroyed: false, health: 2 },
    { id: 't10', pos: { x: 620, y: 510 }, destroyed: false, health: 2 },
  ]);

  const lastTimeRef = useRef<number>(0);
  const spawnTimerRef = useRef<number>(0);
  const shipDirectionRef = useRef<number>(1); // 1 for right, -1 for left

  const t = LANGUAGES[lang];

  const resetGame = useCallback(() => {
    setScore(0);
    setGameState('PLAYING');
    rocketsRef.current = [];
    interceptorsRef.current = [];
    explosionsRef.current = [];
    batteriesRef.current = [
      { id: 'b1', pos: { x: 120, y: 575 }, missiles: 25, maxMissiles: 25, destroyed: false, health: 2 },
      { id: 'b2', pos: { x: 320, y: 560 }, missiles: 25, maxMissiles: 25, destroyed: false, health: 2 },
      { id: 'b3', pos: { x: 520, y: 580 }, missiles: 25, maxMissiles: 25, destroyed: false, health: 2 },
      { id: 'b4', pos: { x: 720, y: 565 }, missiles: 25, maxMissiles: 25, destroyed: false, health: 2 },
    ];
    researchShipRef.current = {
      id: 'ship1',
      pos: { x: 500, y: 455 },
      destroyed: false
    };
    turbinesRef.current = [
      { id: 't1', pos: { x: 150, y: 480 }, destroyed: false, health: 2 },
      { id: 't2', pos: { x: 280, y: 510 }, destroyed: false, health: 2 },
      { id: 't3', pos: { x: 400, y: 490 }, destroyed: false, health: 2 },
      { id: 't4', pos: { x: 550, y: 520 }, destroyed: false, health: 2 },
      { id: 't5', pos: { x: 680, y: 485 }, destroyed: false, health: 2 },
      { id: 't6', pos: { x: 350, y: 530 }, destroyed: false, health: 2 },
      { id: 't7', pos: { x: 100, y: 520 }, destroyed: false, health: 2 },
      { id: 't8', pos: { x: 220, y: 495 }, destroyed: false, health: 2 },
      { id: 't9', pos: { x: 480, y: 480 }, destroyed: false, health: 2 },
      { id: 't10', pos: { x: 620, y: 510 }, destroyed: false, health: 2 },
    ];
    spawnTimerRef.current = 0;
    shipDirectionRef.current = 1;
  }, []);

  const spawnRocket = useCallback(() => {
    const startX = Math.random() * CANVAS_WIDTH;
    const targets = [
      ...batteriesRef.current.filter(b => !b.destroyed), 
      ...turbinesRef.current.filter(t => !t.destroyed)
    ];
    // Research ship is no longer a target
    
    if (targets.length === 0) return;

    const targetEntity = targets[Math.floor(Math.random() * targets.length)];
    const targetPos = { ...targetEntity.pos };

    const rocket: Rocket = {
      id: Math.random().toString(36).substr(2, 9),
      pos: { x: startX, y: 0 },
      start: { x: startX, y: 0 },
      target: targetPos,
      speed: ROCKET_SPEED_MIN + Math.random() * (ROCKET_SPEED_MAX - ROCKET_SPEED_MIN),
      progress: 0,
      destroyed: false
    };
    rocketsRef.current.push(rocket);
  }, []);

  const fireInterceptor = useCallback((targetX: number, targetY: number) => {
    if (gameState !== 'PLAYING') return;

    // Find closest available battery
    let bestBattery: Battery | null = null;
    let minDist = Infinity;

    batteriesRef.current.forEach(b => {
      if (!b.destroyed && b.missiles > 0) {
        const dist = Math.abs(b.pos.x - targetX);
        if (dist < minDist) {
          minDist = dist;
          bestBattery = b;
        }
      }
    });

    if (bestBattery) {
      const battery = bestBattery as Battery;
      battery.missiles -= 1;
      
      // Launch position offset
      const launchPos = { ...battery.pos };
      
      const interceptor: Interceptor = {
        id: Math.random().toString(36).substr(2, 9),
        pos: { ...launchPos },
        start: { ...launchPos },
        target: { x: targetX, y: targetY },
        speed: INTERCEPTOR_SPEED,
        progress: 0,
        exploded: false
      };
      interceptorsRef.current.push(interceptor);
    }
  }, [gameState]);

  const update = useCallback((time: number) => {
    if (gameState !== 'PLAYING') return;

    const deltaTime = time - lastTimeRef.current;
    lastTimeRef.current = time;

    // Move Research Ship
    const ship = researchShipRef.current;
    if (ship && !ship.destroyed) {
      const shipSpeed = 0.25; // 2x slower than 0.5
      ship.pos.x += shipDirectionRef.current * shipSpeed;
      
      // Boundary check
      if (ship.pos.x > 700) {
        shipDirectionRef.current = -1;
      } else if (ship.pos.x < 100) {
        shipDirectionRef.current = 1;
      }

      // Vertical "Patrol" within wind farm - bobbing with waves
      ship.pos.y = 455 + Math.sin(Date.now() / 1500) * 5;
    }

    // Spawn rockets
    spawnTimerRef.current += deltaTime;
    const spawnRate = Math.max(500, 2000 - (score / 100) * 100); // Faster spawns as score increases
    if (spawnTimerRef.current > spawnRate) {
      spawnRocket();
      spawnTimerRef.current = 0;
    }

    // Update Rockets
    rocketsRef.current.forEach(r => {
      const dx = r.target.x - r.start.x;
      const dy = r.target.y - r.start.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      r.progress += r.speed / dist;
      r.pos.x = r.start.x + dx * r.progress;
      r.pos.y = r.start.y + dy * r.progress;

      if (r.progress >= 1) {
        r.destroyed = true;
        // Hit target
        const hitBattery = batteriesRef.current.find(b => b.pos.x === r.target.x && b.pos.y === r.target.y);
        if (hitBattery) {
          hitBattery.health -= 1;
          if (hitBattery.health <= 0) {
            hitBattery.destroyed = true;
          }
        }
        
        const hitTurbine = turbinesRef.current.find(t => t.pos.x === r.target.x && t.pos.y === r.target.y);
        if (hitTurbine) {
          hitTurbine.health -= 1;
          if (hitTurbine.health <= 0) {
            hitTurbine.destroyed = true;
          }
        }

        // Create impact explosion
        explosionsRef.current.push({
          id: Math.random().toString(36).substr(2, 9),
          pos: { ...r.target },
          radius: 0,
          maxRadius: EXPLOSION_MAX_RADIUS,
          growthRate: EXPLOSION_GROWTH,
          finished: false
        });
      }
    });
    rocketsRef.current = rocketsRef.current.filter(r => !r.destroyed);

    // Update Interceptors
    interceptorsRef.current.forEach(i => {
      const dx = i.target.x - i.start.x;
      const dy = i.target.y - i.start.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      i.progress += i.speed / dist;
      i.pos.x = i.start.x + dx * i.progress;
      i.pos.y = i.start.y + dy * i.progress;

      if (i.progress >= 1) {
        i.exploded = true;
        explosionsRef.current.push({
          id: Math.random().toString(36).substr(2, 9),
          pos: { ...i.target },
          radius: 0,
          maxRadius: EXPLOSION_MAX_RADIUS,
          growthRate: EXPLOSION_GROWTH,
          finished: false
        });
      }
    });
    interceptorsRef.current = interceptorsRef.current.filter(i => !i.exploded);

    // Update Explosions
    explosionsRef.current.forEach(e => {
      e.radius += e.growthRate;
      if (e.radius >= e.maxRadius) {
        e.finished = true;
      }

      // Check collision with rockets
      rocketsRef.current.forEach(r => {
        const dx = r.pos.x - e.pos.x;
        const dy = r.pos.y - e.pos.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < e.radius) {
          r.destroyed = true;
          setScore(prev => prev + 20);
        }
      });
    });
    explosionsRef.current = explosionsRef.current.filter(e => !e.finished);

    // Check Win/Loss
    if (score >= WIN_SCORE) {
      setGameState('WON');
    } else if (
      batteriesRef.current.every(b => b.destroyed) && 
      turbinesRef.current.every(t => t.destroyed)
    ) {
      setGameState('LOST');
    }

    // Render
    render();
    requestAnimationFrame(update);
  }, [gameState, score, spawnRocket]);

  const render = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear (Starry Sky Background)
    const skyGradient = ctx.createLinearGradient(0, 0, 0, 450);
    skyGradient.addColorStop(0, '#020617'); // slate-950
    skyGradient.addColorStop(1, '#1e1b4b'); // indigo-950
    ctx.fillStyle = skyGradient;
    ctx.fillRect(0, 0, CANVAS_WIDTH, 450);

    // Draw Stars
    ctx.fillStyle = '#ffffff';
    starsRef.current.forEach(star => {
      const opacity = 0.5 + Math.sin(Date.now() * 0.001 + star.x) * 0.5;
      ctx.globalAlpha = opacity;
      ctx.beginPath();
      ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2);
      ctx.fill();
    });
    ctx.globalAlpha = 1.0;

    // 2. Draw Sea Area (Seabed, Water Body, Surface)
    const seaTop = 450;
    const seaBottom = 550;

    // --- Seabed (海底) ---
    const seabedGradient = ctx.createLinearGradient(0, seaTop, 0, seaBottom);
    seabedGradient.addColorStop(0, '#0a1a1a'); // Very dark teal
    seabedGradient.addColorStop(1, '#050f0f'); // Almost black at the very bottom
    ctx.fillStyle = seabedGradient;
    ctx.fillRect(0, seaTop, CANVAS_WIDTH, seaBottom - seaTop);

    // Seabed texture (sand/rocks)
    ctx.fillStyle = 'rgba(255, 255, 255, 0.02)';
    for (let i = 0; i < 50; i++) {
      const rx = (Math.sin(i * 999) * 0.5 + 0.5) * CANVAS_WIDTH;
      const ry = seaBottom - (Math.cos(i * 888) * 0.5 + 0.5) * 20;
      ctx.beginPath();
      ctx.ellipse(rx, ry, 5, 2, 0, 0, Math.PI * 2);
      ctx.fill();
    }

    // --- Water Body (水体) ---
    // Semi-transparent blue overlay with depth gradient
    const waterGradient = ctx.createLinearGradient(0, seaTop, 0, seaBottom);
    waterGradient.addColorStop(0, 'rgba(20, 100, 120, 0.4)'); // Surface water
    waterGradient.addColorStop(1, 'rgba(10, 40, 60, 0.7)');   // Deep water
    ctx.fillStyle = waterGradient;
    ctx.fillRect(0, seaTop, CANVAS_WIDTH, seaBottom - seaTop);

    // Underwater Light Rays (Caustics)
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    for (let i = 0; i < 5; i++) {
      const rayX = ((Date.now() / 5000 + i / 5) % 1) * CANVAS_WIDTH * 1.5 - CANVAS_WIDTH * 0.25;
      const rayWidth = 40 + Math.sin(Date.now() / 1000 + i) * 20;
      const rayGrad = ctx.createLinearGradient(rayX, seaTop, rayX + 50, seaBottom);
      rayGrad.addColorStop(0, 'rgba(255, 255, 255, 0.05)');
      rayGrad.addColorStop(1, 'rgba(255, 255, 255, 0)');
      ctx.fillStyle = rayGrad;
      ctx.beginPath();
      ctx.moveTo(rayX, seaTop);
      ctx.lineTo(rayX + rayWidth, seaTop);
      ctx.lineTo(rayX + rayWidth - 100, seaBottom);
      ctx.lineTo(rayX - 100, seaBottom);
      ctx.fill();
    }
    ctx.restore();

    // Suspended Particles (Marine Snow)
    ctx.fillStyle = 'rgba(255, 255, 255, 0.15)';
    for (let i = 0; i < 30; i++) {
      const px = (Math.sin(i * 123.45 + Date.now() / 3000) * 0.5 + 0.5) * CANVAS_WIDTH;
      const py = seaTop + (Math.cos(i * 678.90 + Date.now() / 5000) * 0.5 + 0.5) * (seaBottom - seaTop);
      ctx.beginPath();
      ctx.arc(px, py, 0.5, 0, Math.PI * 2);
      ctx.fill();
    }

    // --- Water Surface (水面) ---
    const time = Date.now() / 1000;
    for (let i = 0; i < 4; i++) {
      const yBase = seaTop + 5 + i * 8;
      const speed = 0.8 + i * 0.3;
      const amplitude = 1.5 + i * 0.4;
      const frequency = 0.03 + i * 0.005;
      
      ctx.beginPath();
      ctx.strokeStyle = `rgba(255, 255, 255, ${0.15 + i * 0.05})`;
      ctx.lineWidth = 1;
      
      for (let x = 0; x <= CANVAS_WIDTH; x += 10) {
        const waveY = Math.sin(x * frequency + time * speed) * amplitude;
        if (x === 0) ctx.moveTo(x, yBase + waveY);
        else ctx.lineTo(x, yBase + waveY);
      }
      ctx.stroke();
    }

    // Surface Reflection/Glint
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
    for (let i = 0; i < 10; i++) {
      const gx = (Math.sin(i * 777 + time) * 0.5 + 0.5) * CANVAS_WIDTH;
      const gy = seaTop + Math.cos(time * 2 + i) * 2;
      ctx.beginPath();
      ctx.ellipse(gx, gy, 15, 1, 0, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();

    // Draw Land (Coastline)
    // Draw Land (Coastline - Sandy Beach)
    const landGradient = ctx.createLinearGradient(0, 550, 0, CANVAS_HEIGHT);
    landGradient.addColorStop(0, '#f2d2a9'); // Light sand
    landGradient.addColorStop(1, '#c2a378'); // Deeper sand
    ctx.fillStyle = landGradient;
    ctx.beginPath();
    ctx.moveTo(0, 550);
    ctx.lineTo(CANVAS_WIDTH, 550);
    ctx.lineTo(CANVAS_WIDTH, CANVAS_HEIGHT);
    ctx.lineTo(0, CANVAS_HEIGHT);
    ctx.fill();

    // Wet sand effect near the water
    ctx.fillStyle = 'rgba(0, 0, 0, 0.1)';
    ctx.fillRect(0, 550, CANVAS_WIDTH, 15);
    
    // Subtle sand texture/dots
    ctx.fillStyle = 'rgba(0, 0, 0, 0.05)';
    for (let i = 0; i < 100; i++) {
      const sx = (Math.sin(i * 456.78) * 0.5 + 0.5) * CANVAS_WIDTH;
      const sy = 550 + (Math.cos(i * 123.45) * 0.5 + 0.5) * 50;
      ctx.beginPath();
      ctx.arc(sx, sy, 0.8, 0, Math.PI * 2);
      ctx.fill();
    }

    // Draw Underwater Sea Cables (海缆)
    ctx.save();
    // Use ALL turbines so the cable layout remains static even if some are destroyed
    const allTurbines = [...turbinesRef.current].sort((a, b) => a.pos.x - b.pos.x);
    const activeBatteries = batteriesRef.current.filter(b => !b.destroyed);
    const timeSec = Date.now() / 1000;

    // 1. Connect Turbines in a sorted chain (Static layout)
    for (let i = 0; i < allTurbines.length - 1; i++) {
      const t1 = allTurbines[i];
      const t2 = allTurbines[i+1];
      
      const midX = (t1.pos.x + t2.pos.x) / 2;
      const midY = Math.max(t1.pos.y, t2.pos.y) + 5; 

      // Thinner Cable Shadow
      ctx.beginPath();
      ctx.strokeStyle = 'rgba(0, 5, 10, 0.2)';
      ctx.lineWidth = 2;
      ctx.moveTo(t1.pos.x, t1.pos.y);
      ctx.quadraticCurveTo(midX, midY + 1, t2.pos.x, t2.pos.y);
      ctx.stroke();

      // Thinner Main Cable
      ctx.beginPath();
      ctx.strokeStyle = '#0a2a2a'; // Darker, more submerged look
      ctx.lineWidth = 1;
      ctx.moveTo(t1.pos.x, t1.pos.y);
      ctx.quadraticCurveTo(midX, midY, t2.pos.x, t2.pos.y);
      ctx.stroke();
      
      // Power Pulse - only if both turbines are active
      if (!t1.destroyed && !t2.destroyed) {
        ctx.save();
        ctx.setLineDash([1, 40]);
        ctx.lineDashOffset = -timeSec * 40;
        ctx.strokeStyle = 'rgba(34, 211, 238, 0.3)';
        ctx.lineWidth = 1;
        ctx.stroke();
        ctx.restore();
      }
    }

    // 2. Connect end-turbines to Batteries (Static layout)
    if (allTurbines.length > 0) {
      const endTurbines = [allTurbines[0], allTurbines[allTurbines.length - 1]];
      
      endTurbines.forEach(t => {
        // Find nearest battery (even if destroyed, to keep cable static)
        let nearestB = null;
        let minDist = Infinity;
        batteriesRef.current.forEach(b => {
          const d = Math.sqrt((t.pos.x - b.pos.x)**2 + (t.pos.y - b.pos.y)**2);
          if (d < minDist) {
            minDist = d;
            nearestB = b;
          }
        });
        
        if (nearestB) {
          const midX = (t.pos.x + nearestB.pos.x) / 2;
          const midY = Math.max(t.pos.y, nearestB.pos.y) + 8;

          // Thinner Cable Shadow
          ctx.beginPath();
          ctx.strokeStyle = 'rgba(0, 5, 10, 0.15)';
          ctx.lineWidth = 2;
          ctx.moveTo(t.pos.x, t.pos.y);
          ctx.quadraticCurveTo(midX, midY + 1, nearestB.pos.x, nearestB.pos.y);
          ctx.stroke();

          // Thinner Main Cable
          ctx.beginPath();
          ctx.strokeStyle = '#0a2a2a';
          ctx.lineWidth = 1;
          ctx.moveTo(t.pos.x, t.pos.y);
          ctx.quadraticCurveTo(midX, midY, nearestB.pos.x, nearestB.pos.y);
          ctx.stroke();
          
          // Power Pulse towards battery - only if both are active
          if (!t.destroyed && !nearestB.destroyed) {
            ctx.save();
            ctx.setLineDash([2, 50]);
            ctx.lineDashOffset = -timeSec * 50;
            ctx.strokeStyle = 'rgba(34, 211, 238, 0.2)';
            ctx.lineWidth = 1;
            ctx.stroke();
            ctx.restore();
          }
        }
      });
    }
    ctx.restore();

    // Draw Sea Entities (Turbines and Ship) for correct depth sorting
    const seaEntities = [
      ...turbinesRef.current.map(t => ({ type: 'turbine', data: t, y: t.pos.y })),
      { type: 'ship', data: researchShipRef.current, y: researchShipRef.current.pos.y }
    ].sort((a, b) => a.y - b.y);

    seaEntities.forEach(entity => {
      if (entity.type === 'turbine') {
        const t = entity.data as Turbine;
        if (t.destroyed) {
          ctx.fillStyle = '#1a1a1a';
          ctx.fillRect(t.pos.x - 12, t.pos.y - 2, 24, 4);
        } else {
          const seaLevel = 450;
          
          // 1. Submerged Tower (海底到水面)
          ctx.strokeStyle = 'rgba(200, 200, 200, 0.4)'; // Dimmer/bluer underwater
          ctx.lineWidth = 3;
          ctx.beginPath();
          ctx.moveTo(t.pos.x, t.pos.y);
          ctx.lineTo(t.pos.x, seaLevel);
          ctx.stroke();

          // 2. Surface Ripples (水面波纹)
          const rippleScale = 0.5 + Math.sin(Date.now() / 400 + t.pos.x) * 0.2;
          ctx.strokeStyle = `rgba(255, 255, 255, ${0.3 + rippleScale * 0.2})`;
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.ellipse(t.pos.x, seaLevel, 15 * rippleScale, 4 * rippleScale, 0, 0, Math.PI * 2);
          ctx.stroke();

          // 3. Above-water Tower (水面以上)
          ctx.strokeStyle = '#ffffff';
          ctx.lineWidth = 2.5;
          ctx.beginPath();
          ctx.moveTo(t.pos.x, seaLevel);
          ctx.lineTo(t.pos.x, t.pos.y - 70); // Taller tower
          ctx.stroke();

          // 4. Blades (风机叶片)
          const angle = Date.now() / 600 + (parseInt(t.id.substring(1)) * 0.5);
          const hubY = t.pos.y - 70;
          ctx.strokeStyle = '#eee';
          ctx.lineWidth = 2;
          for (let i = 0; i < 3; i++) {
            const bladeAngle = angle + (i * Math.PI * 2) / 3;
            ctx.beginPath();
            ctx.moveTo(t.pos.x, hubY);
            ctx.lineTo(
              t.pos.x + Math.cos(bladeAngle) * 20,
              hubY + Math.sin(bladeAngle) * 20
            );
            ctx.stroke();
          }

          // Hub
          ctx.fillStyle = '#fff';
          ctx.beginPath();
          ctx.arc(t.pos.x, hubY, 3, 0, Math.PI * 2);
          ctx.fill();

          // Health Bar
          const healthWidth = 20;
          const currentWidth = (t.health / 2) * healthWidth;
          ctx.fillStyle = 'rgba(0,0,0,0.5)';
          ctx.fillRect(t.pos.x - 10, t.pos.y + 5, healthWidth, 3);
          ctx.fillStyle = t.health > 1 ? '#0f0' : '#f00';
          ctx.fillRect(t.pos.x - 10, t.pos.y + 5, currentWidth, 3);
        }
      } else {
        const ship = entity.data as ResearchShip;
        if (ship.destroyed) {
          ctx.fillStyle = '#333';
          ctx.fillRect(ship.pos.x - 30, ship.pos.y - 5, 60, 10);
        } else {
          // Draw Ocean Research Vessel (海洋调查船)
          ctx.save();
          ctx.translate(ship.pos.x, ship.pos.y);
          if (shipDirectionRef.current === -1) {
            ctx.scale(-1, 1);
          }
          
          // Submerged Hull (海底部分)
          ctx.fillStyle = '#1e293b'; // slate-800
          ctx.beginPath();
          ctx.moveTo(-45, 0);
          ctx.lineTo(35, 0);
          ctx.lineTo(30, 10);
          ctx.lineTo(-40, 10);
          ctx.closePath();
          ctx.fill();

          // Above-water Hull (White and Orange)
          ctx.fillStyle = '#fff'; 
          ctx.beginPath();
          ctx.moveTo(-45, 0);
          ctx.lineTo(35, 0);
          ctx.lineTo(50, -18);
          ctx.lineTo(-45, -18);
          ctx.closePath();
          ctx.fill();
          
          // Orange stripe
          ctx.fillStyle = '#f97316'; // orange-500
          ctx.fillRect(-45, -8, 90, 4);
          
          // Superstructure (Scientific/Research look)
          ctx.fillStyle = '#eee';
          ctx.fillRect(-25, -35, 40, 17);
          
          // Bridge windows
          ctx.fillStyle = '#0ea5e9';
          ctx.fillRect(5, -32, 8, 5);
          
          // Radar/Antenna
          ctx.strokeStyle = '#666';
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.moveTo(-10, -35);
          ctx.lineTo(-10, -45);
          ctx.stroke();
          ctx.beginPath();
          ctx.arc(-10, -48, 4, 0, Math.PI, true);
          ctx.stroke();
          
          // Crane/Scientific Equipment at the back
          ctx.strokeStyle = '#f97316';
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.moveTo(-35, -18);
          ctx.lineTo(-50, -40);
          ctx.stroke();

          // Flag (海洋调查)
          ctx.strokeStyle = '#333';
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.moveTo(0, -35);
          ctx.lineTo(0, -60);
          ctx.stroke();
          
          ctx.fillStyle = '#f00'; // Red flag
          ctx.beginPath();
          ctx.moveTo(0, -60);
          ctx.lineTo(30, -52);
          ctx.lineTo(0, -45);
          ctx.fill();
          
          // Flag Text
          ctx.fillStyle = '#fff';
          ctx.font = 'bold 8px sans-serif';
          ctx.textAlign = 'left';
          ctx.fillText('海洋调查', 2, -50);

          // Multibeam Echosounder Effect (多波束测深)
          ctx.save();
          ctx.globalCompositeOperation = 'lighter';
          const beamCount = 7;
          const fanAngle = Math.PI / 3; // 60 degrees
          const beamLength = 40;
          
          for (let i = 0; i < beamCount; i++) {
            const angle = (Math.PI / 2) - (fanAngle / 2) + (fanAngle * (i / (beamCount - 1)));
            const targetX = Math.cos(angle) * beamLength;
            const targetY = Math.sin(angle) * beamLength;
            
            // Beam Line
            ctx.strokeStyle = 'rgba(0, 255, 255, 0.2)';
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(0, 0);
            ctx.lineTo(targetX, targetY);
            ctx.stroke();
            
            // Echo Pulse
            const pulseProgress = (Date.now() / 1000 + i * 0.2) % 1;
            const pulseX = targetX * pulseProgress;
            const pulseY = targetY * pulseProgress;
            
            ctx.fillStyle = `rgba(0, 255, 255, ${1 - pulseProgress})`;
            ctx.beginPath();
            ctx.arc(pulseX, pulseY, 1.5, 0, Math.PI * 2);
            ctx.fill();
            
            // Seafloor hit point
            if (pulseProgress > 0.9) {
              ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
              ctx.beginPath();
              ctx.arc(targetX, targetY, 2, 0, Math.PI * 2);
              ctx.fill();
            }
          }
          ctx.restore();

          // Water Reflection
          ctx.save();
          ctx.translate(ship.pos.x, ship.pos.y);
          ctx.scale(1, -0.3);
          ctx.globalAlpha = 0.2;
          // Simple hull reflection
          ctx.fillStyle = '#fff';
          ctx.fillRect(-45, 0, 90, 18);
          ctx.restore();

          // Ship Wake/Ripples (Foamy)
          const shipRipple = 0.5 + Math.sin(Date.now() / 400) * 0.3;
          ctx.strokeStyle = `rgba(255, 255, 255, ${0.5 - shipRipple * 0.1})`;
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.ellipse(ship.pos.x, ship.pos.y, 65 * shipRipple, 18 * shipRipple, 0, 0, Math.PI * 2);
          ctx.stroke();
          
          // Extra foam trail
          ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
          ctx.beginPath();
          ctx.arc(ship.pos.x - 50 * shipDirectionRef.current, ship.pos.y + 5, 4, 0, Math.PI * 2);
          ctx.arc(ship.pos.x - 70 * shipDirectionRef.current, ship.pos.y - 3, 3, 0, Math.PI * 2);
          ctx.fill();
          
          ctx.restore();
        }
      }
    });

    // Draw Batteries
    [...batteriesRef.current].sort((a, b) => a.pos.y - b.pos.y).forEach(b => {
      if (b.destroyed) {
        ctx.fillStyle = '#444';
        ctx.beginPath();
        ctx.arc(b.pos.x, b.pos.y, 15, Math.PI, 0);
        ctx.fill();
      } else {
        // Battery Shadow
        ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
        ctx.beginPath();
        ctx.ellipse(b.pos.x, b.pos.y + 2, 22, 6, 0, 0, Math.PI * 2);
        ctx.fill();

        // Camouflage Pattern for Land Battery (Desert/Sand Camo)
        ctx.save();
        ctx.beginPath();
        ctx.arc(b.pos.x, b.pos.y, 20, Math.PI, 0);
        ctx.clip();
        
        // Base Sand
        ctx.fillStyle = '#d2b48c'; // Tan
        ctx.fillRect(b.pos.x - 20, b.pos.y - 20, 40, 20);
        
        // Camo Spots
        ctx.fillStyle = '#c2a378'; // Darker Sand
        ctx.beginPath(); ctx.arc(b.pos.x - 5, b.pos.y - 10, 8, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = '#e6b980'; // Lighter Sand
        ctx.beginPath(); ctx.arc(b.pos.x + 10, b.pos.y - 5, 10, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = '#8b7355'; // Brownish
        ctx.beginPath(); ctx.arc(b.pos.x - 12, b.pos.y - 15, 6, 0, Math.PI * 2); ctx.fill();
        
        ctx.restore();
        
        ctx.strokeStyle = '#666';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.arc(b.pos.x, b.pos.y, 20, Math.PI, 0);
        ctx.stroke();
        
        // Turret Head
        ctx.fillStyle = '#d2b48c';
        ctx.fillRect(b.pos.x - 5, b.pos.y - 25, 10, 10);
        
        // Missile count display
        ctx.fillStyle = '#0f0';
        ctx.font = '10px monospace';
        ctx.textAlign = 'center';
        ctx.fillText(b.missiles.toString(), b.pos.x, b.pos.y + 15);

        // Health Bar
        const healthWidth = 30;
        const currentWidth = (b.health / 2) * healthWidth;
        ctx.fillStyle = 'rgba(0,0,0,0.5)';
        ctx.fillRect(b.pos.x - 15, b.pos.y + 20, healthWidth, 3);
        ctx.fillStyle = b.health > 1 ? '#0f0' : '#f00';
        ctx.fillRect(b.pos.x - 15, b.pos.y + 20, currentWidth, 3);
      }
    });

    // Draw Rockets (Missile Style)
    rocketsRef.current.forEach(r => {
      // Smoke Trail
      const dx = r.pos.x - r.start.x;
      const dy = r.pos.y - r.start.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      
      ctx.save();
      // Draw smoke puffs along the path
      // We only draw the last 100 pixels of trail as "smoke" to keep it clean
      const trailLength = Math.min(dist, 150);
      const startDist = dist - trailLength;
      
      for (let d = startDist; d < dist; d += 6) {
        const ratio = d / dist;
        const px = r.start.x + dx * ratio;
        const py = r.start.y + dy * ratio;
        
        // Smoke gets larger and more transparent further from the missile
        const age = (dist - d) / trailLength; // 0 at missile, 1 at end of trail
        const size = 1 + age * 6;
        const opacity = (1 - age) * 0.4;
        
        ctx.fillStyle = `rgba(200, 200, 200, ${opacity})`;
        ctx.beginPath();
        ctx.arc(px + (Math.sin(d) * 2), py + (Math.cos(d) * 2), size, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();
      
      // Missile Body
      const angle = Math.atan2(r.target.y - r.start.y, r.target.x - r.start.x);
      ctx.save();
      ctx.translate(r.pos.x, r.pos.y);
      ctx.rotate(angle);
      
      // Body
      ctx.fillStyle = '#ccc';
      ctx.fillRect(-6, -2, 8, 4);
      // Nose
      ctx.fillStyle = '#f44';
      ctx.beginPath();
      ctx.moveTo(2, -2);
      ctx.lineTo(6, 0);
      ctx.lineTo(2, 2);
      ctx.fill();
      // Fins
      ctx.fillStyle = '#888';
      ctx.fillRect(-6, -4, 2, 8);
      
      // Engine Glow
      ctx.fillStyle = '#ff0';
      ctx.beginPath();
      ctx.arc(-7, 0, 2, 0, Math.PI * 2);
      ctx.fill();
      
      ctx.restore();
    });

    // Draw Interceptors (Dongfeng Style)
    interceptorsRef.current.forEach(i => {
      // Smoke Trail
      const dx = i.pos.x - i.start.x;
      const dy = i.pos.y - i.start.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      
      ctx.save();
      const trailLength = Math.min(dist, 100);
      const startDist = dist - trailLength;
      
      for (let d = startDist; d < dist; d += 5) {
        const ratio = d / dist;
        const px = i.start.x + dx * ratio;
        const py = i.start.y + dy * ratio;
        
        const age = (dist - d) / trailLength;
        const size = 1 + age * 4;
        const opacity = (1 - age) * 0.5;
        
        ctx.fillStyle = `rgba(255, 255, 255, ${opacity})`;
        ctx.beginPath();
        ctx.arc(px + (Math.sin(d * 2) * 1.5), py + (Math.cos(d * 2) * 1.5), size, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();

      // Missile Body
      const angle = Math.atan2(i.target.y - i.start.y, i.target.x - i.start.x);
      ctx.save();
      ctx.translate(i.pos.x, i.pos.y);
      ctx.rotate(angle);
      
      // DF Missile Body (Longer and white)
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(-10, -2.5, 14, 5);
      
      // Nose (Red)
      ctx.fillStyle = '#ff0000';
      ctx.beginPath();
      ctx.moveTo(4, -2.5);
      ctx.lineTo(10, 0);
      ctx.lineTo(4, 2.5);
      ctx.fill();
      
      // Fins (Dark Green)
      ctx.fillStyle = '#004400';
      ctx.beginPath();
      ctx.moveTo(-10, -2.5);
      ctx.lineTo(-14, -6);
      ctx.lineTo(-6, -2.5);
      ctx.fill();
      ctx.beginPath();
      ctx.moveTo(-10, 2.5);
      ctx.lineTo(-14, 6);
      ctx.lineTo(-6, 2.5);
      ctx.fill();
      
      // Engine Glow
      ctx.fillStyle = '#ffaa00';
      ctx.beginPath();
      ctx.arc(-11, 0, 3, 0, Math.PI * 2);
      ctx.fill();
      
      ctx.restore();

      // Target marker
      ctx.strokeStyle = '#fff';
      ctx.beginPath();
      ctx.moveTo(i.target.x - 3, i.target.y - 3);
      ctx.lineTo(i.target.x + 3, i.target.y + 3);
      ctx.moveTo(i.target.x + 3, i.target.y - 3);
      ctx.lineTo(i.target.x - 3, i.target.y + 3);
      ctx.stroke();
    });

    // Draw Explosions
    explosionsRef.current.forEach(e => {
      const alpha = 1 - e.radius / e.maxRadius;
      ctx.fillStyle = `rgba(255, 200, 50, ${alpha})`;
      ctx.beginPath();
      ctx.arc(e.pos.x, e.pos.y, e.radius, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = `rgba(255, 100, 0, ${alpha})`;
      ctx.stroke();
    });

  }, []);

  useEffect(() => {
    if (gameState === 'PLAYING') {
      lastTimeRef.current = performance.now();
      const animId = requestAnimationFrame(update);
      return () => cancelAnimationFrame(animId);
    }
  }, [gameState, update]);

  const handleCanvasClick = (e: React.MouseEvent | React.TouchEvent) => {
    if (gameState !== 'PLAYING') return;
    
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    let clientX, clientY;

    if ('touches' in e) {
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else {
      clientX = e.clientX;
      clientY = e.clientY;
    }

    const x = (clientX - rect.left) * (CANVAS_WIDTH / rect.width);
    const y = (clientY - rect.top) * (CANVAS_HEIGHT / rect.height);

    // Don't fire too low
    if (y < 450) {
      fireInterceptor(x, y);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col items-center justify-center p-4 font-sans">
      {/* Header */}
      <div className="w-full max-w-4xl flex justify-between items-center mb-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-emerald-500/20 rounded-lg">
            <Wind className="w-6 h-6 text-emerald-400" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight">{t.title}</h1>
        </div>
        
        <div className="flex items-center gap-4">
          <div className="flex flex-col items-end">
            <span className="text-xs uppercase tracking-widest text-slate-500 font-semibold">{t.score}</span>
            <span className="text-2xl font-mono text-emerald-400">{score.toString().padStart(4, '0')}</span>
          </div>
          
          <button 
            onClick={() => setLang(l => l === 'en' ? 'zh' : 'en')}
            className="p-2 hover:bg-slate-800 rounded-full transition-colors"
          >
            <Languages className="w-5 h-5" />
          </button>
          
          <button 
            onClick={() => setShowInstructions(!showInstructions)}
            className="p-2 hover:bg-slate-800 rounded-full transition-colors"
          >
            <Info className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Game Container */}
      <div className="relative group">
        <canvas
          ref={canvasRef}
          width={CANVAS_WIDTH}
          height={CANVAS_HEIGHT}
          onMouseDown={handleCanvasClick}
          onTouchStart={handleCanvasClick}
          className="rounded-2xl shadow-2xl border border-slate-800 cursor-crosshair w-full max-w-[800px] aspect-[4/3] bg-slate-900"
        />

        {/* Overlays */}
        <AnimatePresence>
          {gameState === 'START' && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 flex flex-col items-center justify-center bg-slate-950/80 rounded-2xl backdrop-blur-sm"
            >
              <motion.div
                initial={{ scale: 0.9, y: 20 }}
                animate={{ scale: 1, y: 0 }}
                className="text-center p-8"
              >
                <Wind className="w-16 h-16 text-emerald-400 mx-auto mb-6 animate-pulse" />
                <h2 className="text-4xl font-bold mb-4">{t.title}</h2>
                <p className="text-slate-400 mb-8 max-w-md">{t.instructions}</p>
                <button 
                  onClick={resetGame}
                  className="px-8 py-4 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-xl transition-all transform hover:scale-105 active:scale-95 flex items-center gap-2 mx-auto"
                >
                  <Shield className="w-5 h-5" />
                  {t.start}
                </button>
              </motion.div>
            </motion.div>
          )}

          {(gameState === 'WON' || gameState === 'LOST') && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 flex flex-col items-center justify-center bg-slate-950/90 rounded-2xl backdrop-blur-md"
            >
              <motion.div
                initial={{ scale: 0.8 }}
                animate={{ scale: 1 }}
                className="text-center"
              >
                {gameState === 'WON' ? (
                  <>
                    <Trophy className="w-20 h-20 text-yellow-400 mx-auto mb-6" />
                    <h2 className="text-5xl font-bold text-yellow-400 mb-2">{t.win}</h2>
                  </>
                ) : (
                  <>
                    <XCircle className="w-20 h-20 text-red-500 mx-auto mb-6" />
                    <h2 className="text-5xl font-bold text-red-500 mb-2">{t.loss}</h2>
                  </>
                )}
                <div className="text-2xl font-mono mb-8 text-slate-300">
                  {t.score}: {score}
                </div>
                <button 
                  onClick={resetGame}
                  className="px-8 py-4 bg-slate-100 hover:bg-white text-slate-950 font-bold rounded-xl transition-all transform hover:scale-105 active:scale-95"
                >
                  {t.restart}
                </button>
              </motion.div>
            </motion.div>
          )}

          {showInstructions && (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="absolute top-4 right-4 w-64 p-4 bg-slate-900/90 border border-slate-700 rounded-xl backdrop-blur-md text-sm z-50"
            >
              <div className="flex justify-between items-center mb-2">
                <h3 className="font-bold flex items-center gap-2">
                  <Target className="w-4 h-4 text-emerald-400" />
                  How to Play
                </h3>
                <button onClick={() => setShowInstructions(false)} className="text-slate-500 hover:text-white">×</button>
              </div>
              <ul className="space-y-2 text-slate-400">
                <li>• Click anywhere to fire interceptors.</li>
                <li>• Protect the turbines and batteries.</li>
                <li>• Reach 1000 points to win.</li>
                <li>• Game over if all batteries are destroyed.</li>
              </ul>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Footer Stats */}
      <div className="w-full max-w-4xl mt-6 grid grid-cols-3 gap-4">
        {batteriesRef.current.map((b, idx) => (
          <div key={b.id} className={`p-4 rounded-xl border transition-all ${b.destroyed ? 'bg-red-500/10 border-red-500/20' : 'bg-slate-900 border-slate-800'}`}>
            <div className="flex justify-between items-center mb-2">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                {lang === 'en' ? `Battery ${idx + 1}` : `炮台 ${idx + 1}`}
              </span>
              {b.destroyed ? (
                <XCircle className="w-4 h-4 text-red-500" />
              ) : (
                <Shield className="w-4 h-4 text-emerald-500" />
              )}
            </div>
            <div className="flex items-end gap-2">
              <span className={`text-2xl font-mono ${b.missiles < 5 ? 'text-red-400 animate-pulse' : 'text-slate-100'}`}>
                {b.missiles}
              </span>
              <span className="text-xs text-slate-600 mb-1">/ {b.maxMissiles}</span>
            </div>
            <div className="mt-2 h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
              <motion.div 
                className={`h-full ${b.destroyed ? 'bg-slate-700' : 'bg-emerald-500'}`}
                initial={{ width: '100%' }}
                animate={{ width: `${(b.missiles / b.maxMissiles) * 100}%` }}
              />
            </div>
          </div>
        ))}
      </div>
      
      <p className="mt-8 text-slate-600 text-xs uppercase tracking-[0.2em]">
        © 2026 Wind Power Defense • Built with React & Canvas
      </p>
    </div>
  );
}
