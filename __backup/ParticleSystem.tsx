import React, { useEffect, useMemo, useRef, useState } from 'react';
import './ParticleSystem.css';

interface ParticleConfig {
  count?: number;
  speed?: number;
  size?: { min: number; max: number; };
  colors?: string[];
  density?: number;
  interactive?: boolean;
  glow?: boolean;
  connections?: boolean;
}

interface ParticleSystemProps {
  config?: ParticleConfig;
  className?: string;
  paused?: boolean;
}

class Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  baseSize: number;
  color: string;
  alpha: number;
  life: number;
  maxLife: number;
  glowIntensity: number;
  pulsePhase: number;
  interactive: boolean;

  constructor(canvas: HTMLCanvasElement, config: Required<ParticleConfig>) {
    this.x = Math.random() * canvas.width;
    this.y = Math.random() * canvas.height;
    this.vx = (Math.random() - 0.5) * config.speed;
    this.vy = -Math.random() * config.speed - 0.5;
    this.baseSize = Math.random() * (config.size.max - config.size.min) + config.size.min;
    this.size = this.baseSize;
    this.color = config.colors[Math.floor(Math.random() * config.colors.length)];
    this.alpha = 0;
    this.life = 0;
    this.maxLife = Math.random() * 200 + 100;
    this.glowIntensity = Math.random() * 0.5 + 0.5;
    this.pulsePhase = Math.random() * Math.PI * 2;
    this.interactive = !!config.interactive;
  }

  update(canvas: HTMLCanvasElement, mousePos: { x: number; y: number } | null, config: Required<ParticleConfig>) {
    // Lifecycle fade-in/out
    this.life++;
    if (this.life < 20) this.alpha = Math.min(1, this.alpha + 0.05);
    else if (this.life > this.maxLife - 20) this.alpha = Math.max(0, this.alpha - 0.05);

    // Movement
    this.x += this.vx + Math.sin(this.y * 0.01 + this.pulsePhase) * 0.3;
    this.y += this.vy;

    // Mouse interaction
    if (this.interactive && mousePos) {
      const dx = mousePos.x - this.x;
      const dy = mousePos.y - this.y;
      const dist = Math.hypot(dx, dy);
      if (dist > 0 && dist < 100) {
        const force = (100 - dist) / 100;
        this.vx -= (dx / dist) * force * 0.5;
        this.vy -= (dy / dist) * force * 0.5;
      }
    }

    // Wrap around edges
    const w = canvas.width;
    const h = canvas.height;
    if (this.x < -this.size) this.x = w + this.size;
    if (this.x > w + this.size) this.x = -this.size;
    if (this.y < -this.size) this.y = h + this.size;
    if (this.y > h + this.size) this.y = -this.size;

    // Reset if fully faded
    if (this.alpha <= 0 && this.life > this.maxLife) {
      this.reset(canvas, config);
    }

    // Pulse size stably around baseSize
    this.pulsePhase += 0.02;
    this.size = this.baseSize * (1 + Math.sin(this.pulsePhase) * 0.2);

    // Damping
    this.vx *= 0.999;
    this.vy *= 0.999;
  }

  reset(canvas: HTMLCanvasElement, config: Required<ParticleConfig>) {
    this.x = Math.random() * canvas.width;
    this.y = canvas.height + this.baseSize;
    this.vx = (Math.random() - 0.5) * config.speed;
    this.vy = -Math.random() * config.speed - 0.5;
    this.life = 0;
    this.maxLife = Math.random() * 200 + 100;
    this.alpha = 0;
    this.color = config.colors[Math.floor(Math.random() * config.colors.length)];
  }

  draw(ctx: CanvasRenderingContext2D, config: Required<ParticleConfig>) {
    ctx.save();
    ctx.globalAlpha = this.alpha * 0.8;

    // Glow effect
    if (config.glow) {
      const gradient = ctx.createRadialGradient(this.x, this.y, 0, this.x, this.y, this.size * 3 * this.glowIntensity);
      gradient.addColorStop(0, this.color + '40');
      gradient.addColorStop(0.5, this.color + '20');
      gradient.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.size * 3 * this.glowIntensity, 0, Math.PI * 2);
      ctx.fill();
    }

    // Core particle
    ctx.globalAlpha = this.alpha;
    ctx.fillStyle = this.color;
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }
}

export const ParticleSystem: React.FC<ParticleSystemProps> = ({ config = {}, className = '', paused = false }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const particlesRef = useRef<Particle[]>([]);
  const animationRef = useRef<number>();
  const mousePos = useRef<{ x: number; y: number } | null>(null);
  const [isVisible, setIsVisible] = useState(true);
  const [performanceMode, setPerformanceMode] = useState<'high' | 'medium' | 'low'>('high');

  const effectiveConfig: Required<ParticleConfig> = useMemo(() => ({
    count: 50,
    speed: 1,
    size: { min: 1, max: 3 },
    colors: ['#6366f1', '#818cf8', '#10b981', '#f59e0b'],
    density: 1,
    interactive: true,
    glow: true,
    connections: false,
    ...config,
  }), [config]);

  // Adjust particle count based on network hint
  useEffect(() => {
    const connection = (navigator as any).connection;
    if (connection) {
      if (connection.saveData || ['slow-2g', '2g'].includes(connection.effectiveType)) setPerformanceMode('low');
      else if (connection.effectiveType === '3g') setPerformanceMode('medium');
    }
  }, []);

  // Visibility / reduce-motion
  useEffect(() => {
    const onVis = () => setIsVisible(!document.hidden);
    document.addEventListener('visibilitychange', onVis);

    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    if (mq.matches) setIsVisible(false);

    return () => {
      document.removeEventListener('visibilitychange', onVis);
    };
  }, []);

  // Mouse tracking (only if interactive)
  useEffect(() => {
    if (!effectiveConfig.interactive) return;
    const onMove = (e: MouseEvent) => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const rect = canvas.getBoundingClientRect();
      mousePos.current = { x: e.clientX - rect.left, y: e.clientY - rect.top };
    };
    const onLeave = () => (mousePos.current = null);

    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseleave', onLeave);
    return () => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseleave', onLeave);
    };
  }, [effectiveConfig.interactive]);

  // Main animation loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !isVisible || paused) return;

    const ctx = canvas.getContext('2d', { alpha: true });
    if (!ctx) return;

    const setSize = () => {
      const dpr = Math.max(1, Math.min(2, window.devicePixelRatio || 1));
      const rect = canvas.getBoundingClientRect();
      canvas.width = Math.floor(rect.width * dpr);
      canvas.height = Math.floor(rect.height * dpr);
      canvas.style.width = rect.width + 'px';
      canvas.style.height = rect.height + 'px';
      // Reset then scale
      // @ts-ignore
      if (typeof (ctx as any).resetTransform === 'function') (ctx as any).resetTransform();
      else ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.scale(dpr, dpr);
    };

    setSize();
    const onResize = () => {
      cancelAnimationFrame((animationRef.current as number) || 0);
      setSize();
      start(); // restart animation with new size
    };
    window.addEventListener('resize', onResize);

    // Init particles according to perf mode
    const desiredCount = performanceMode === 'low'
      ? Math.floor(effectiveConfig.count * 0.3)
      : performanceMode === 'medium'
      ? Math.floor(effectiveConfig.count * 0.6)
      : effectiveConfig.count;

    const ensureCount = () => {
      while (particlesRef.current.length < desiredCount) {
        particlesRef.current.push(new Particle(canvas, effectiveConfig));
      }
      while (particlesRef.current.length > desiredCount) {
        particlesRef.current.pop();
      }
    };
    ensureCount();

    const drawConnections = () => {
      if (!effectiveConfig.connections) return;
      ctx.strokeStyle = 'rgba(99, 102, 241, 0.1)';
      ctx.lineWidth = 0.5;
      for (let i = 0; i < particlesRef.current.length; i++) {
        for (let j = i + 1; j < particlesRef.current.length; j++) {
          const p1 = particlesRef.current[i];
          const p2 = particlesRef.current[j];
          const dx = p1.x - p2.x;
          const dy = p1.y - p2.y;
          const dist = Math.hypot(dx, dy);
          if (dist < 100) {
            ctx.globalAlpha = (1 - dist / 100) * 0.5 * p1.alpha * p2.alpha;
            ctx.beginPath();
            ctx.moveTo(p1.x, p1.y);
            ctx.lineTo(p2.x, p2.y);
            ctx.stroke();
          }
        }
      }
      ctx.globalAlpha = 1;
    };

    const step = () => {
      const rect = canvas.getBoundingClientRect();
      ctx.clearRect(0, 0, rect.width, rect.height);
      for (const p of particlesRef.current) {
        p.update(canvas, mousePos.current, effectiveConfig);
        p.draw(ctx, effectiveConfig);
      }
      drawConnections();
      animationRef.current = requestAnimationFrame(step);
    };

    const start = () => {
      ensureCount();
      step();
    };

    start();

    return () => {
      window.removeEventListener('resize', onResize);
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
    };
  }, [isVisible, paused, performanceMode, effectiveConfig]);

  return (
    <canvas
      ref={canvasRef}
      className={`particle-system ${className}`}
      aria-hidden="true"
      style={{
        position: 'absolute',
        inset: 0,
        width: '100%',
        height: '100%',
        pointerEvents: 'none'
      }}
    />
  );
};