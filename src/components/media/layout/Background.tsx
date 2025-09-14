import React, { useEffect, useState, useRef } from 'react';
import './Background.css';

interface BackgroundProps {
  theme?: 'dark' | 'light' | 'pro';
  intensity?: number;
  particleCount?: number;
  className?: string;
}

type TimeOfDay = 'morning' | 'day' | 'evening' | 'night';

export const Background: React.FC<BackgroundProps> = ({
  theme = 'dark',
  intensity = 1,
  particleCount = 50,
  className = ''
}) => {
  const [reducedMotion, setReducedMotion] = useState(false);
  const [timeOfDay, setTimeOfDay] = useState<TimeOfDay>('day');
  const [isVisible, setIsVisible] = useState(true);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>();
  const dprRef = useRef<number>(1);

  // Check for reduced motion preference
  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    setReducedMotion(mq.matches);
    const onChange = (e: MediaQueryListEvent) => setReducedMotion(e.matches);
    mq.addEventListener?.('change', onChange);
    return () => mq.removeEventListener?.('change', onChange);
  }, []);

  // Pause when tab not visible (perf)
  useEffect(() => {
    const onVis = () => setIsVisible(!document.hidden);
    document.addEventListener('visibilitychange', onVis);
    return () => document.removeEventListener('visibilitychange', onVis);
  }, []);

  // Determine time of day for dynamic theming
  useEffect(() => {
    const updateTimeOfDay = () => {
      const hour = new Date().getHours();
      if (hour >= 5 && hour < 9) setTimeOfDay('morning');
      else if (hour >= 9 && hour < 17) setTimeOfDay('day');
      else if (hour >= 17 && hour < 21) setTimeOfDay('evening');
      else setTimeOfDay('night');
    };
    updateTimeOfDay();
    const interval = setInterval(updateTimeOfDay, 60_000);
    return () => clearInterval(interval);
  }, []);

  // Advanced particle system with canvas
  useEffect(() => {
    if (reducedMotion || !isVisible || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // DPR-aware sizing
    const resize = () => {
      const dpr = Math.max(1, Math.min(2, window.devicePixelRatio || 1));
      dprRef.current = dpr;
      const { innerWidth: w, innerHeight: h } = window;
      canvas.width = Math.floor(w * dpr);
      canvas.height = Math.floor(h * dpr);
      canvas.style.width = w + 'px';
      canvas.style.height = h + 'px';
      // Reset transform before scaling to avoid compounding
      // @ts-ignore older TS lib
      if (typeof (ctx as any).resetTransform === 'function') {
        (ctx as any).resetTransform();
      } else {
        ctx.setTransform(1, 0, 0, 1, 0, 0);
      }
      ctx.scale(dpr, dpr);
    };
    resize();
    const onResize = () => {
      // throttle via rAF
      cancelAnimationFrame((animationRef.current as number) || 0);
      resize();
      animate(); // restart to use new size
    };
    window.addEventListener('resize', onResize);

    // Particle class
    class Particle {
      x: number = 0;
      y: number = 0;
      size: number = 1;
      baseSize: number = 1;
      speedX: number = 0;
      speedY: number = 0;
      opacity: number = 0;
      color: string = '#ffffff';
      pulsePhase: number = 0;

      constructor() {
        this.baseSize = Math.random() * 3 + 1;
        this.reset(true);
        this.y = Math.random() * window.innerHeight;
        this.pulsePhase = Math.random() * Math.PI * 2;
      }

      reset(initial = false) {
        const w = window.innerWidth;
        const h = window.innerHeight;
        this.x = Math.random() * w;
        this.y = initial ? Math.random() * h : h + 10;
        this.size = this.baseSize;
        this.speedX = (Math.random() - 0.5) * 0.5;
        this.speedY = -Math.random() * 2 - 0.5;
        this.opacity = 0;

        // Color based on theme and time
        const palette =
          theme === 'pro'
            ? ['#ffd700', '#ffed4e', '#ffa500']
            : timeOfDay === 'morning'
            ? ['#fbbf24', '#f59e0b', '#f97316']
            : timeOfDay === 'evening'
            ? ['#8b5cf6', '#7c3aed', '#6d28d9']
            : timeOfDay === 'night'
            ? ['#6366f1', '#4f46e5', '#4338ca']
            : ['#818cf8', '#6366f1', '#10b981'];

        this.color = palette[Math.floor(Math.random() * palette.length)];
      }

      update() {
        this.y += this.speedY;
        this.x += this.speedX + Math.sin(this.y * 0.01) * 0.5;
        this.pulsePhase += 0.05;

        // Fade in/out bands
        const h = window.innerHeight;
        if (this.y > h - 100 || this.y < 100) {
          this.opacity = Math.max(0, this.opacity - 0.02);
        } else {
          this.opacity = Math.min(1, this.opacity + 0.02);
        }

        // Pulse size around baseSize (stable, not random per frame)
        this.size = this.baseSize * (1 + Math.sin(this.pulsePhase) * 0.25);

        // Reset particle when off screen and invisible
        if (this.y < -10 || this.opacity <= 0) this.reset();
      }

      draw() {
        // Glow
        ctx.save();
        ctx.globalAlpha = this.opacity * Math.min(1, Math.max(0, intensity)) * 0.6;
        const gradient = ctx.createRadialGradient(this.x, this.y, 0, this.x, this.y, this.size * 3);
        gradient.addColorStop(0, this.color);
        gradient.addColorStop(0.5, this.color + '40'); // #RRGGBBAA
        gradient.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size * 3, 0, Math.PI * 2);
        ctx.fill();

        // Core
        ctx.globalAlpha = this.opacity * Math.min(1, Math.max(0, intensity));
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }
    }

    // Create particles
    const particles: Particle[] = new Array(Math.max(0, Math.floor(particleCount)))
      .fill(0).map(() => new Particle());

    const animate = () => {
      const { innerWidth: w, innerHeight: h } = window;
      ctx.clearRect(0, 0, w, h);
      for (const p of particles) {
        p.update();
        p.draw();
      }
      animationRef.current = requestAnimationFrame(animate);
    };

    animate();

    // Cleanup
    return () => {
      window.removeEventListener('resize', onResize);
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
    };
  }, [theme, intensity, particleCount, reducedMotion, isVisible, timeOfDay]);

  return (
    <div className={`background-container ${className}`} data-theme={theme} data-time={timeOfDay}>
      {/* Animated Gradient Background */}
      <div
        className={`gradient-background ${reducedMotion ? 'reduced-motion' : ''}`}
        style={{ ['--intensity' as any]: String(intensity) } as React.CSSProperties}
      >
        <div className="gradient-layer gradient-primary" />
        <div className="gradient-layer gradient-secondary" />
        <div className="gradient-layer gradient-tertiary" />
      </div>

      {/* Glass Morphism Layers */}
      <div className="glass-layers" aria-hidden="true">
        <div className="glass-layer glass-layer-1" />
        <div className="glass-layer glass-layer-2" />
        <div className="glass-layer glass-layer-3" />
      </div>

      {/* Particle Canvas */}
      {!reducedMotion && (
        <canvas ref={canvasRef} className="particle-canvas" aria-hidden="true" />
      )}

      {/* Animated Orbs */}
      {!reducedMotion && (
        <div className="orb-container" aria-hidden="true">
          <div className="orb orb-1" />
          <div className="orb orb-2" />
          <div className="orb orb-3" />
          <div className="orb orb-4" />
        </div>
      )}

      {/* Noise Texture Overlay */}
      <div className="noise-overlay" aria-hidden="true" />

      {/* Grid Pattern */}
      <div className="grid-pattern" aria-hidden="true" />
    </div>
  );
};