
import React, { useState, useEffect, useRef } from 'react';

const BrandBanner: React.FC = () => {
  const [scrollPos, setScrollPos] = useState(0);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [isPaused, setIsPaused] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const bannerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleScroll = () => {
      const pos = window.scrollY;
      setScrollPos(Math.min(pos / 350, 1.2));
    };
    
    const handleMouseMove = (e: MouseEvent) => {
      if (bannerRef.current) {
        const rect = bannerRef.current.getBoundingClientRect();
        setMousePos({
          x: e.clientX - rect.left,
          y: e.clientY - rect.top,
        });
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    window.addEventListener('mousemove', handleMouseMove);
    return () => {
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('mousemove', handleMouseMove);
    };
  }, []);

  // Milky Way / Galaxy Canvas logic
  useEffect(() => {
    if (!canvasRef.current || isPaused) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    const particles: any[] = [];
    const bgStars: any[] = [];
    const nebulae: any[] = [];
    
    const particleCount = 65; 
    const bgStarCount = 400; 
    const nebulaCount = 6;

    const init = () => {
      particles.length = 0;
      bgStars.length = 0;
      nebulae.length = 0;

      // Milky Way nebulae - subtle color washes covering the whole banner
      for (let i = 0; i < nebulaCount; i++) {
        nebulae.push({
          x: Math.random() * canvas.width,
          y: Math.random() * canvas.height,
          radius: Math.random() * 600 + 400,
          color: i % 2 === 0 ? 'rgba(59, 130, 246, 0.06)' : 'rgba(147, 51, 234, 0.06)'
        });
      }

      // Small planetary stars - very dim, transparent, smooth natural movement
      for (let i = 0; i < bgStarCount; i++) {
        bgStars.push({
          x: Math.random() * canvas.width,
          y: Math.random() * canvas.height,
          size: Math.random() * 1.5 + 0.1,
          alpha: Math.random() * 0.25, 
          twinkle: Math.random() * 0.006 + 0.002,
          dir: Math.random() > 0.5 ? 1 : -1,
          driftX: (Math.random() - 0.5) * 0.07, // Slow physical drift
          driftY: (Math.random() - 0.5) * 0.07
        });
      }

      // Interactive particles - Star shaped
      for (let i = 0; i < particleCount; i++) {
        particles.push({
          x: Math.random() * canvas.width,
          y: Math.random() * canvas.height,
          size: Math.random() * 2 + 1,
          speedX: (Math.random() - 0.5) * 0.15,
          speedY: (Math.random() - 0.5) * 0.15,
          color: Math.random() > 0.8 ? '#e9d5ff' : '#bae6fd',
          friction: 0.98,
          pulse: Math.random() * 0.1,
          pulseDir: 1
        });
      }
    };

    const drawStarShape = (ctx: CanvasRenderingContext2D, x: number, y: number, size: number, color: string, alpha: number) => {
      ctx.save();
      ctx.translate(x, y);
      ctx.globalAlpha = alpha;
      ctx.fillStyle = color;
      ctx.shadowBlur = size * 6;
      ctx.shadowColor = color;
      
      // 4-pointed diamond star shape
      ctx.beginPath();
      ctx.moveTo(0, -size * 3);
      ctx.lineTo(size * 0.8, -size * 0.8);
      ctx.lineTo(size * 3, 0);
      ctx.lineTo(size * 0.8, size * 0.8);
      ctx.lineTo(0, size * 3);
      ctx.lineTo(-size * 0.8, size * 0.8);
      ctx.lineTo(-size * 3, 0);
      ctx.lineTo(-size * 0.8, -size * 0.8);
      ctx.closePath();
      ctx.fill();
      
      // Add a small inner glow
      ctx.fillStyle = 'white';
      ctx.beginPath();
      ctx.arc(0, 0, size * 0.4, 0, Math.PI * 2);
      ctx.fill();

      ctx.restore();
    };

    const draw = () => {
      // Trail effect
      ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Draw nebulae
      nebulae.forEach(n => {
        const grad = ctx.createRadialGradient(n.x, n.y, 0, n.x, n.y, n.radius);
        grad.addColorStop(0, n.color);
        grad.addColorStop(1, 'transparent');
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
      });

      // Background planetary stars
      bgStars.forEach(s => {
        s.alpha += s.twinkle * s.dir;
        if (s.alpha > 0.4 || s.alpha < 0.05) s.dir *= -1;
        
        s.x += s.driftX;
        s.y += s.driftY;
        
        if (s.x < 0) s.x = canvas.width;
        if (s.x > canvas.width) s.x = 0;
        if (s.y < 0) s.y = canvas.height;
        if (s.y > canvas.height) s.y = 0;

        ctx.globalAlpha = s.alpha;
        ctx.fillStyle = 'white';
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.size, 0, Math.PI * 2);
        ctx.fill();
      });

      // Interactive particles - Avoidance behavior and Shine
      ctx.globalAlpha = 1;
      particles.forEach(p => {
        const dx = mousePos.x - p.x;
        const dy = mousePos.y - p.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        // Repel from cursor (avoidance behavior)
        if (dist < 280) {
          const force = (280 - dist) / 280;
          p.speedX -= dx * 0.0006 * force; // Push AWAY
          p.speedY -= dy * 0.0006 * force;
          
          // Smooth orbital path
          const angle = Math.atan2(dy, dx);
          p.speedX += Math.cos(angle + Math.PI / 2) * force * 0.4;
          p.speedY += Math.sin(angle + Math.PI / 2) * force * 0.4;
        }

        p.x += p.speedX;
        p.y += p.speedY;
        p.speedX *= p.friction;
        p.speedY *= p.friction;

        // Visual pulse shine
        p.pulse += 0.01 * p.pulseDir;
        if (p.pulse > 0.5 || p.pulse < 0.1) p.pulseDir *= -1;

        // Wrap around boundaries
        if (p.x < -30) p.x = canvas.width + 30;
        if (p.x > canvas.width + 30) p.x = -30;
        if (p.y < -30) p.y = canvas.height + 30;
        if (p.y > canvas.height + 30) p.y = -30;

        drawStarShape(ctx, p.x, p.y, p.size, p.color, 0.5 + p.pulse);
      });

      animationFrameId = requestAnimationFrame(draw);
    };

    const resize = () => {
      if (!bannerRef.current) return;
      canvas.width = bannerRef.current.offsetWidth;
      canvas.height = bannerRef.current.offsetHeight;
      init();
    };

    resize();
    window.addEventListener('resize', resize);
    draw();

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', resize);
    };
  }, [mousePos, isPaused]);

  const p1 = Math.min(scrollPos / 0.2, 1);
  const p2 = Math.max(0, Math.min((scrollPos - 0.05) / 0.3, 1));
  const p3 = Math.max(0, (scrollPos - 0.45));

  const infScale = (1.5 + p3 * 6);

  return (
    <div ref={bannerRef} className="relative h-[95vh] bg-black overflow-hidden flex flex-col items-center justify-center">
      <canvas ref={canvasRef} className="absolute inset-0 pointer-events-none" />
      
      <div className="relative z-10 w-full flex flex-col items-center" style={{ transform: `scale(${infScale})` }}>
        <div className="relative w-[520px] h-[260px] flex items-center justify-center translate-y-[-10px]">
          {/* Refined 'dx' - Larger size and adjusted stroke */}
          <svg viewBox="0 0 100 50" className="absolute w-full h-full fill-none transition-all duration-300" style={{ opacity: 1 - p1 }}>
            {/* 'd': Larger loop, stem refined and shorter as requested */}
            <path d="M 26 25 C 16 8 0 8 0 25 C 0 42 16 42 26 25 M 26 14 L 26 35" stroke="white" strokeWidth="3.2" strokeLinecap="round" />
            {/* 'x': Scaled up and centered */}
            <path d="M 40 14 L 62 36 M 62 14 L 40 36" stroke="white" strokeWidth="3.2" strokeLinecap="round" />
          </svg>

          {/* Infinity Symbol - Target State */}
          <svg viewBox="0 0 100 50" className="absolute w-full h-full fill-none transition-opacity duration-400" style={{ opacity: p2, stroke: '#3b82f6', strokeWidth: 3 }}>
            <path d="M 50 25 C 35 10 10 10 10 25 C 10 40 35 40 50 25 C 65 10 90 10 90 25 C 90 40 65 40 50 25" strokeLinecap="round" />
          </svg>
        </div>
      </div>

      <div 
        className="absolute bottom-8 z-20 text-center transition-all duration-700"
        style={{ opacity: Math.max(0, 1 - scrollPos * 2.8), transform: `translateY(${scrollPos * 30}px)` }}
      >
        <h2 className="text-3xl md:text-5xl font-light text-white tracking-[0.7em] uppercase drop-shadow-[0_0_20px_rgba(255,255,255,0.4)]">
          The Limits <span className="text-blue-500 font-bold">Do Not Exist</span>
        </h2>
      </div>

      <div className="absolute right-10 bottom-10 z-50">
        <button 
          onClick={() => setIsPaused(!isPaused)} 
          className="px-8 py-2.5 rounded-full bg-white/5 text-white text-[10px] font-black hover:bg-white/15 transition-all backdrop-blur-3xl border border-white/20 tracking-[0.3em] uppercase active:scale-95 shadow-2xl"
        >
          {isPaused ? 'Resume Motion' : 'Pause Motion'}
        </button>
      </div>
      
      <div 
        className="absolute bottom-6 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 text-blue-500/30 transition-opacity duration-300"
        style={{ opacity: scrollPos > 0.05 ? 0 : 1 }}
      >
        <div className="w-[1px] h-10 bg-gradient-to-b from-blue-500/50 to-transparent"></div>
        <span className="text-[9px] uppercase tracking-[0.4em] font-medium">Scroll down</span>
      </div>
    </div>
  );
};

export default BrandBanner;
