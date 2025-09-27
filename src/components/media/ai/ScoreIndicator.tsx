import React, { useEffect, useMemo, useRef, useState, useId } from 'react';
import { motion, animate, useReducedMotion } from 'framer-motion';

interface ScoreIndicatorProps {
  score: number; // 0-100
  size?: 'small' | 'medium' | 'large' | 'xlarge';
  showLabel?: boolean;
  showPercentage?: boolean;
  animated?: boolean;
  pulseOnHigh?: boolean;
  variant?: 'circle' | 'arc' | 'bar' | 'hexagon' | 'quantum';
  colorScheme?: 'default' | 'gradient' | 'semantic' | 'neural';
  thickness?: number;
  duration?: number; // ms
  screenReaderLabel?: string;
}

const ScoreIndicator: React.FC<ScoreIndicatorProps> = ({
  score,
  size = 'medium',
  showLabel = true,
  showPercentage = true,
  animated = true,
  pulseOnHigh = true,
  variant = 'circle',
  colorScheme = 'gradient',
  thickness,
  duration = 1000,
  screenReaderLabel,
}) => {
  const prefersReducedMotion = useReducedMotion();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number | null>(null);

  // Clamp score for safety
  const clampedScore = Math.max(0, Math.min(100, Number.isFinite(score) ? score : 0));

  // Sizes
  const base = {
    small: { width: 40, height: 40, fontSize: 12, strokeWidth: thickness ?? 3 },
    medium: { width: 60, height: 60, fontSize: 16, strokeWidth: thickness ?? 4 },
    large: { width: 80, height: 80, fontSize: 20, strokeWidth: thickness ?? 5 },
    xlarge: { width: 120, height: 120, fontSize: 28, strokeWidth: thickness ?? 6 },
  } as const;
  const config = base[size];
  const radius = (Math.min(config.width, config.height) - config.strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;

  // Colors
  const getColor = (value: number): string => {
    switch (colorScheme) {
      case 'gradient': {
        if (value < 33) return `hsl(0, 100%, ${Math.min(90, 50 + value)}%)`;
        if (value < 66) return `hsl(${Math.min(120, value * 1.2)}, 100%, 50%)`;
        return `hsl(${120 + value * 0.4}, 100%, ${Math.min(90, 50 + (value - 66) * 0.5)}%)`;
      }
      case 'semantic':
        if (value < 30) return '#ff4444';
        if (value < 50) return '#ff8800';
        if (value < 70) return '#ffaa00';
        if (value < 90) return '#88dd00';
        return '#00ff00';
      case 'neural': {
        const r = Math.floor(138 + (value / 100) * (0 - 138));
        const g = Math.floor(43 + (value / 100) * (255 - 43));
        const b = Math.floor(226 + (value / 100) * (204 - 226));
        return `rgb(${r}, ${g}, ${b})`;
      }
      default:
        return `hsl(${value * 1.2}, 100%, 50%)`;
    }
  };

  const primaryColor = useMemo(() => getColor(clampedScore), [clampedScore, colorScheme]);
  const secondaryColor = useMemo(() => getColor(Math.min(100, clampedScore + 20)), [clampedScore, colorScheme]);

  // Number animation for the visible score
  const [displayScore, setDisplayScore] = useState<number>(animated && !prefersReducedMotion ? 0 : clampedScore);

  useEffect(() => {
    if (!animated || prefersReducedMotion) {
      setDisplayScore(clampedScore);
      return;
    }
    const controls = animate(displayScore, clampedScore, {
      duration: duration / 1000,
      ease: 'easeOut',
      onUpdate: (v) => setDisplayScore(Math.round(v)),
    });
    return () => controls.stop();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clampedScore, animated, duration, prefersReducedMotion]);

  // Canvas "quantum" variant
  useEffect(() => {
    if (variant !== 'quantum') return;
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;

    const loop = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const t = performance.now() / 1000;
      const particles = 50;

      for (let i = 0; i < particles; i++) {
        const ang = (i / particles) * Math.PI * 2;
        const rad = 20 + Math.sin(t + i) * 10;
        const x = canvas.width / 2 + Math.cos(ang) * rad;
        const y = canvas.height / 2 + Math.sin(ang) * rad;
        const s = 1 + Math.sin(t * 2 + i) * 0.5;
        const op = (clampedScore / 100) * (0.5 + Math.sin(t * 3 + i) * 0.5);
        ctx.beginPath();
        ctx.arc(x, y, s, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(138, 43, 226, ${Math.max(0, Math.min(1, op))})`;
        ctx.fill();
      }

      // Score text
      ctx.font = `bold ${config.fontSize}px monospace`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillStyle = primaryColor;
      ctx.fillText(`${displayScore}`, canvas.width / 2, canvas.height / 2);

      rafRef.current = requestAnimationFrame(loop);
    };

    rafRef.current = requestAnimationFrame(loop);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    };
  }, [variant, displayScore, clampedScore, primaryColor, config.fontSize]);

  // Stable IDs for SVG defs (SSR-safe)
  const gradId = useId();
  const arcGradId = useId();
  const hexGradId = useId();
  const glowId = useId();

  // Renderers
  const renderCircle = () => (
    <svg
      width={config.width}
      height={config.height}
      viewBox={`0 0 ${config.width} ${config.height}`}
      style={{ transform: 'rotate(-90deg)' }}
      role="img"
      aria-label={screenReaderLabel || `Score: ${clampedScore} out of 100`}
    >
      <defs>
        <linearGradient id={gradId} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor={primaryColor} />
          <stop offset="100%" stopColor={secondaryColor} />
        </linearGradient>
        <filter id={glowId}>
          <feGaussianBlur stdDeviation="3" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      <circle
        cx={config.width / 2}
        cy={config.height / 2}
        r={radius}
        fill="none"
        stroke="rgba(255, 255, 255, 0.1)"
        strokeWidth={config.strokeWidth}
      />

      <motion.circle
        cx={config.width / 2}
        cy={config.height / 2}
        r={radius}
        fill="none"
        stroke={`url(#${gradId})`}
        strokeWidth={config.strokeWidth}
        strokeLinecap="round"
        strokeDasharray={circumference}
        initial={false}
        animate={{ strokeDashoffset: circumference - (displayScore / 100) * circumference }}
        transition={{ duration: prefersReducedMotion ? 0 : duration / 1000, ease: 'easeOut' }}
        filter={clampedScore > 80 && pulseOnHigh ? `url(#${glowId})` : undefined}
      />

      {/* Decorative ring for very high scores */}
      {clampedScore > 90 && (
        <motion.circle
          cx={config.width / 2}
          cy={config.height / 2}
          r={radius + 8}
          fill="none"
          stroke={primaryColor}
          strokeWidth="1"
          strokeDasharray="2 4"
          initial={{ opacity: 0.3 }}
          animate={{ rotate: 360 }}
          transition={{ duration: 10, repeat: Infinity, ease: 'linear' }}
        />
      )}
    </svg>
  );

  const renderArc = () => {
    const startX = config.width * 0.1;
    const endX = config.width * 0.9;
    const y = config.height * 0.8;
    const d = `M ${startX} ${y} A ${radius} ${radius} 0 0 1 ${endX} ${y}`;
    const length = (circumference * 0.5); // half circle length approx for arc

    return (
      <svg
        width={config.width}
        height={config.height}
        viewBox={`0 0 ${config.width} ${config.height}`}
        role="img"
        aria-label={screenReaderLabel || `Score: ${clampedScore} out of 100`}
      >
        <defs>
          <linearGradient id={arcGradId} x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor={primaryColor} />
            <stop offset="100%" stopColor={secondaryColor} />
          </linearGradient>
        </defs>

        <path d={d} fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth={config.strokeWidth} />

        <motion.path
          d={d}
          fill="none"
          stroke={`url(#${arcGradId})`}
          strokeWidth={config.strokeWidth}
          strokeLinecap="round"
          strokeDasharray={length}
          initial={false}
          animate={{ strokeDashoffset: length - (displayScore / 100) * length }}
          transition={{ duration: prefersReducedMotion ? 0 : duration / 1000, ease: 'easeOut' }}
        />
      </svg>
    );
  };

  const renderBar = () => (
    <div style={{ width: config.width * 2, position: 'relative' }} aria-hidden>
      <div
        style={{
          height: config.strokeWidth * 2,
          background: 'rgba(255, 255, 255, 0.1)',
          borderRadius: config.strokeWidth,
          overflow: 'hidden',
        }}
      >
        <motion.div
          style={{
            height: '100%',
            background: `linear-gradient(90deg, ${primaryColor}, ${secondaryColor})`,
            borderRadius: config.strokeWidth,
            boxShadow: clampedScore > 80 && pulseOnHigh ? `0 0 20px ${primaryColor}` : 'none',
          }}
          initial={false}
          animate={{ width: `${displayScore}%` }}
          transition={{ duration: prefersReducedMotion ? 0 : duration / 1000, ease: 'easeOut' }}
        />
      </div>
      {showPercentage && (
        <div
          style={{
            marginTop: 6,
            fontSize: config.fontSize * 0.8,
            color: 'rgba(255,255,255,0.8)',
            textAlign: 'right',
            fontFamily: 'monospace',
          }}
        >
          {displayScore}%
        </div>
      )}
    </div>
  );

  const renderHexagon = () => {
    const hexPoints = (r: number, cx: number, cy: number) => {
      const pts: string[] = [];
      for (let i = 0; i < 6; i++) {
        const a = (Math.PI / 3) * i - Math.PI / 2;
        pts.push(`${cx + r * Math.cos(a)},${cy + r * Math.sin(a)}`);
      }
      return pts.join(' ');
    };

    return (
      <svg
        width={config.width}
        height={config.height}
        viewBox={`0 0 ${config.width} ${config.height}`}
        role="img"
        aria-label={screenReaderLabel || `Score: ${clampedScore} out of 100`}
      >
        <defs>
          <linearGradient id={hexGradId} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={primaryColor} />
            <stop offset="100%" stopColor={secondaryColor} />
          </linearGradient>
        </defs>

        <polygon
          points={hexPoints(radius, config.width / 2, config.height / 2)}
          fill="none"
          stroke="rgba(255,255,255,0.1)"
          strokeWidth={config.strokeWidth}
        />

        <motion.polygon
          points={hexPoints((radius * displayScore) / 100, config.width / 2, config.height / 2)}
          fill={`url(#${hexGradId})`}
          fillOpacity={0.3}
          stroke={`url(#${hexGradId})`}
          strokeWidth={config.strokeWidth}
          initial={false}
          animate={{ opacity: 1 }}
          transition={{ duration: prefersReducedMotion ? 0 : duration / 1000, ease: 'easeOut' }}
        />
      </svg>
    );
  };

  const renderQuantum = () => (
    <div style={{ position: 'relative', width: config.width, height: config.height }}>
      <canvas ref={canvasRef} width={config.width} height={config.height} style={{ position: 'absolute', inset: 0 }} />
    </div>
  );

  // Label text
  const labelText =
    clampedScore >= 90 ? 'EXCELLENT' :
    clampedScore >= 70 ? 'GOOD' :
    clampedScore >= 50 ? 'MODERATE' :
    clampedScore >= 30 ? 'LOW' : 'POOR';

  return (
    <div
      style={{
        display: 'inline-flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 8,
        position: 'relative',
      }}
      role="meter"
      aria-label={screenReaderLabel || 'Score indicator'}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={clampedScore}
      aria-valuetext={`${clampedScore} out of 100`}
    >
      <div style={{ position: 'relative' }}>
        {variant === 'circle' && renderCircle()}
        {variant === 'arc' && renderArc()}
        {variant === 'bar' && renderBar()}
        {variant === 'hexagon' && renderHexagon()}
        {variant === 'quantum' && renderQuantum()}

        {/* Center value for non-canvas, non-bar variants */}
        {variant !== 'quantum' && variant !== 'bar' && showPercentage && (
          <div
            style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              fontSize: config.fontSize,
              fontWeight: 700,
              color: primaryColor,
              textShadow: `0 0 10px ${primaryColor}80`,
              fontFamily: 'monospace',
              pointerEvents: 'none',
            }}
            aria-hidden
          >
            {displayScore}
            <span style={{ fontSize: config.fontSize * 0.6 }}>%</span>
          </div>
        )}
      </div>

      {showLabel && (
        <div
          style={{
            fontSize: config.fontSize * 0.7,
            color: 'rgba(255,255,255,0.7)',
            textTransform: 'uppercase',
            letterSpacing: 0.5,
            fontWeight: 600,
          }}
        >
          {labelText}
        </div>
      )}

      {/* Subtle outer ripple for top scores */}
      {clampedScore > 95 && (
        <div style={{ position: 'absolute', inset: -10, pointerEvents: 'none' }}>
          {[0, 1, 2].map((i) => (
            <motion.div
              key={i}
              style={{
                position: 'absolute',
                top: '50%',
                left: '50%',
                width: config.width + 20,
                height: config.height + 20,
                border: `1px solid ${primaryColor}`,
                borderRadius: variant === 'circle' ? '50%' : 8,
                translateX: '-50%',
                translateY: '-50%',
              }}
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1.5, opacity: [0, 0.5, 0] }}
              transition={{
                duration: prefersReducedMotion ? 0 : 2,
                delay: i * 0.3,
                repeat: Infinity,
                ease: 'easeOut',
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default ScoreIndicator;
