import React, { useEffect, useRef, useImperativeHandle, forwardRef } from 'react';

export interface FireworksHandle {
  trigger: () => void;
}

interface FireworksCanvasProps {
  className?: string;
}

interface Spark {
  x: number;
  y: number;
  alpha: number;
  size: number;
  color: string;
}

interface Rocket {
  x: number;
  y: number;
  startX: number;
  targetY: number;
  vx: number;
  vy: number;
  color: string;
  size: number;
  trail: { x: number; y: number }[];
  hue: number;
}

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  alpha: number;
  decay: number;
  color: string;
  size: number;
  friction: number;
  gravity: number;
  flicker: boolean;
  history: { x: number; y: number }[];
}

const COLOR_PALETTES = [
  ['#FF3B30', '#FF9500', '#FFCC00', '#FFD60A', '#FFFFFF'], // Fire & Gold
  ['#AF52DE', '#FF2D55', '#5856D6', '#E056FD', '#F472B6'], // Electric Violet & Pink
  ['#007AFF', '#5AC8FA', '#34C759', '#30D158', '#67E8F9'], // Neon Cyan & Emerald
  ['#FF007F', '#7928CA', '#00DFD8', '#FF0080', '#FDE047'], // Synthwave Cyberpunk
  ['#F97316', '#EF4444', '#EC4899', '#FBBF24', '#FEF08A'], // Sunset Burst
  ['#38BDF8', '#818CF8', '#C084FC', '#F43F5E', '#FFFFFF'], // Rainbow Glitz
];

export const FireworksCanvas = forwardRef<FireworksHandle, FireworksCanvasProps>(
  ({ className = '' }, ref) => {
    const canvasRef = useRef<HTMLCanvasElement | null>(null);
    const rocketsRef = useRef<Rocket[]>([]);
    const particlesRef = useRef<Particle[]>([]);
    const sparksRef = useRef<Spark[]>([]);
    const animFrameRef = useRef<number | null>(null);
    const isRunningRef = useRef<boolean>(false);
    const launchTimeoutsRef = useRef<number[]>([]);
    const dimensionsRef = useRef<{ width: number; height: number; dpr: number }>({
      width: typeof window !== 'undefined' ? window.innerWidth : 800,
      height: typeof window !== 'undefined' ? window.innerHeight : 600,
      dpr: typeof window !== 'undefined' ? Math.min(window.devicePixelRatio || 1, 2) : 1,
    });

    // Keep particle count bounded so rapid clicks never cause frame drops
    const MAX_PARTICLES = 360;

    const startAnimationLoop = () => {
      if (isRunningRef.current) return;
      isRunningRef.current = true;

      const render = () => {
        const canvas = canvasRef.current;
        if (!canvas) {
          isRunningRef.current = false;
          return;
        }

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          isRunningRef.current = false;
          return;
        }

        const { width, height, dpr } = dimensionsRef.current;

        // Clear transparent buffer
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        ctx.save();
        ctx.scale(dpr, dpr);

        // 1. UPDATE & DRAW ROCKET SPARKS / EMBERS
        for (let i = sparksRef.current.length - 1; i >= 0; i--) {
          const sp = sparksRef.current[i];
          sp.alpha -= 0.04;
          sp.y += 0.5; // slow drift
          if (sp.alpha <= 0) {
            sparksRef.current.splice(i, 1);
            continue;
          }
          ctx.beginPath();
          ctx.arc(sp.x, sp.y, sp.size, 0, Math.PI * 2);
          ctx.fillStyle = sp.color;
          ctx.globalAlpha = sp.alpha;
          ctx.fill();
        }

        // 2. UPDATE & DRAW ROCKETS
        for (let i = rocketsRef.current.length - 1; i >= 0; i--) {
          const r = rocketsRef.current[i];

          // Save trail
          r.trail.push({ x: r.x, y: r.y });
          if (r.trail.length > 8) r.trail.shift();

          // Spawn sparkling ember under rocket
          if (Math.random() < 0.7 && sparksRef.current.length < 100) {
            sparksRef.current.push({
              x: r.x + (Math.random() - 0.5) * 4,
              y: r.y + 4 + Math.random() * 6,
              alpha: 0.9,
              size: 1 + Math.random() * 1.5,
              color: Math.random() < 0.5 ? '#FFD700' : '#FFA500',
            });
          }

          // Move
          r.x += r.vx;
          r.y += r.vy;
          r.vy += 0.09; // gravity deceleration

          // Draw Rocket Trail
          if (r.trail.length > 1) {
            ctx.beginPath();
            ctx.moveTo(r.trail[0].x, r.trail[0].y);
            for (let t = 1; t < r.trail.length; t++) {
              ctx.lineTo(r.trail[t].x, r.trail[t].y);
            }
            ctx.strokeStyle = `hsl(${r.hue}, 100%, 70%)`;
            ctx.globalAlpha = 0.7;
            ctx.lineWidth = r.size * 0.8;
            ctx.stroke();
          }

          // Draw Rocket Head
          ctx.beginPath();
          ctx.arc(r.x, r.y, r.size, 0, Math.PI * 2);
          ctx.fillStyle = '#FFFFFF';
          ctx.globalAlpha = 1;
          ctx.shadowColor = r.color;
          ctx.shadowBlur = 10;
          ctx.fill();
          ctx.shadowBlur = 0;

          // Explode when apex reached or target height passed
          if (r.y <= r.targetY || r.vy >= -0.3) {
            explodeRocket(r.x, r.y, r.color);
            rocketsRef.current.splice(i, 1);
          }
        }

        // 3. UPDATE & DRAW PARTICLES
        for (let i = particlesRef.current.length - 1; i >= 0; i--) {
          const p = particlesRef.current[i];

          p.history.push({ x: p.x, y: p.y });
          if (p.history.length > 4) p.history.shift();

          p.vx *= p.friction;
          p.vy *= p.friction;
          p.vy += p.gravity;
          p.x += p.vx;
          p.y += p.vy;
          p.alpha -= p.decay;

          if (p.alpha <= 0 || p.y > height + 20) {
            particlesRef.current.splice(i, 1);
            continue;
          }

          const currentAlpha = p.flicker && Math.random() < 0.25 ? p.alpha * 0.35 : p.alpha;

          // Draw trailing line
          if (p.history.length > 1) {
            ctx.beginPath();
            ctx.moveTo(p.history[0].x, p.history[0].y);
            for (let h = 1; h < p.history.length; h++) {
              ctx.lineTo(p.history[h].x, p.history[h].y);
            }
            ctx.strokeStyle = p.color;
            ctx.globalAlpha = currentAlpha * 0.5;
            ctx.lineWidth = p.size * 0.7;
            ctx.stroke();
          }

          // Draw particle head
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
          ctx.fillStyle = p.color;
          ctx.globalAlpha = currentAlpha;
          ctx.fill();
        }

        ctx.restore();

        // Continue animation loop if items are active
        if (
          rocketsRef.current.length > 0 ||
          particlesRef.current.length > 0 ||
          sparksRef.current.length > 0
        ) {
          animFrameRef.current = requestAnimationFrame(render);
        } else {
          // Clean final frame and sleep to save 100% CPU/GPU
          ctx.clearRect(0, 0, canvas.width, canvas.height);
          isRunningRef.current = false;
        }
      };

      animFrameRef.current = requestAnimationFrame(render);
    };

    const explodeRocket = (x: number, y: number, baseColor: string) => {
      const palette = COLOR_PALETTES[Math.floor(Math.random() * COLOR_PALETTES.length)];
      const particleCount = 40 + Math.floor(Math.random() * 25);
      const isWillowType = Math.random() < 0.35; // cascading weeping willow effect

      // Flash central burst spark
      sparksRef.current.push({
        x,
        y,
        alpha: 1,
        size: 5,
        color: '#FFFFFF',
      });

      for (let i = 0; i < particleCount; i++) {
        if (particlesRef.current.length >= MAX_PARTICLES) break;

        const angle = Math.random() * Math.PI * 2;
        const speed = isWillowType
          ? 1.2 + Math.random() * 4.2
          : 1.5 + Math.random() * 6.5;

        const color =
          Math.random() < 0.15
            ? '#FFFFFF'
            : palette[Math.floor(Math.random() * palette.length)] || baseColor;

        particlesRef.current.push({
          x,
          y,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed,
          alpha: 1,
          decay: isWillowType ? 0.009 + Math.random() * 0.012 : 0.014 + Math.random() * 0.018,
          color,
          size: 1.5 + Math.random() * 2.2,
          friction: isWillowType ? 0.96 : 0.94 + Math.random() * 0.03,
          gravity: isWillowType ? 0.12 + Math.random() * 0.06 : 0.08 + Math.random() * 0.05,
          flicker: Math.random() > 0.35,
          history: [],
        });
      }
    };

    const launchBurst = () => {
      const { width, height } = dimensionsRef.current;

      // Spawn 2 to 4 rockets staggered over 400ms for realistic multi-stage fireworks
      const rocketCount = 2 + Math.floor(Math.random() * 3);

      for (let r = 0; r < rocketCount; r++) {
        const delay = r * (110 + Math.random() * 110);

        const timer = window.setTimeout(() => {
          const startX = width * 0.15 + Math.random() * (width * 0.7);
          const targetX = startX + (Math.random() - 0.5) * (width * 0.35);
          const targetY = height * 0.12 + Math.random() * (height * 0.35);

          const distanceY = targetY - height;
          const duration = 28 + Math.random() * 14;
          const vy = distanceY / duration;
          const vx = (targetX - startX) / duration;

          const hue = Math.floor(Math.random() * 360);

          rocketsRef.current.push({
            x: startX,
            y: height,
            startX,
            targetY,
            vx,
            vy,
            color: `hsl(${hue}, 100%, 65%)`,
            hue,
            size: 2.5,
            trail: [],
          });

          startAnimationLoop();
        }, delay);

        launchTimeoutsRef.current.push(timer);
      }
    };

    useImperativeHandle(ref, () => ({
      trigger: () => {
        launchBurst();
      },
    }));

    // Handle canvas sizing & cleanup
    useEffect(() => {
      const updateSize = () => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const dpr = Math.min(window.devicePixelRatio || 1, 2);
        const width = window.innerWidth;
        const height = window.innerHeight;

        dimensionsRef.current = { width, height, dpr };

        canvas.width = width * dpr;
        canvas.height = height * dpr;
      };

      updateSize();
      window.addEventListener('resize', updateSize);

      return () => {
        window.removeEventListener('resize', updateSize);
        if (animFrameRef.current) {
          cancelAnimationFrame(animFrameRef.current);
        }
        launchTimeoutsRef.current.forEach((t) => clearTimeout(t));
        launchTimeoutsRef.current = [];
        particlesRef.current = [];
        rocketsRef.current = [];
        sparksRef.current = [];
        isRunningRef.current = false;
      };
    }, []);

    return (
      <canvas
        ref={canvasRef}
        className={`fixed inset-0 pointer-events-none z-50 w-full h-full ${className}`}
        aria-hidden="true"
      />
    );
  }
);

FireworksCanvas.displayName = 'FireworksCanvas';
