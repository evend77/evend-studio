// src/components/RoueFortune.tsx
import React, { useState, useRef, useEffect } from 'react';

interface RoueFortuneProps {
  codes: string[];
  onWin: (code: string) => void;
  onClose: () => void;
  sponsorName?: string;
}

// ── TYPE POUR LES PARTICULES DE CONFETTIS ──────────────────────────────
interface Particule {
  x: number;
  y: number;
  color: string;
  size: number;
  speed: number;
  rotation: number;
}

function RoueFortune({ codes, onWin, onClose, sponsorName = 'e-Vend Studio' }: RoueFortuneProps) {
  const [spinning, setSpinning] = useState(false);
  const [resultat, setResultat] = useState<string | null>(null);
  const [angle, setAngle] = useState(0);
  const [showConfetti, setShowConfetti] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const segments = codes.length > 0 ? codes : ['PROMO10', 'PROMO20', 'GRATUIT', '5%', '15%', 'CADEAN'];
  
  const colors = [
    '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7', '#DDA0DD',
    '#FF9F43', '#00D2D3', '#F368E0', '#F8A5C2', '#74B9FF', '#55EFC4',
    '#FD79A8', '#FDCB6E', '#E17055', '#00CEC9', '#6C5CE7', '#FD79A8'
  ];

  // ── DESSINER LA ROUE ──────────────────────────────────────────────
  const dessinerRoue = (ctx: CanvasRenderingContext2D, angleActuel: number) => {
    const width = 400;
    const height = 400;
    const centerX = width / 2;
    const centerY = height / 2;
    const radius = Math.min(width, height) / 2 - 30;

    ctx.clearRect(0, 0, width, height);

    const nbSegments = segments.length;
    const angleParSegment = (2 * Math.PI) / nbSegments;

    ctx.shadowColor = 'rgba(0,0,0,0.3)';
    ctx.shadowBlur = 20;
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 10;

    segments.forEach((segment, i) => {
      const startAngle = angleActuel + i * angleParSegment;
      const endAngle = startAngle + angleParSegment;

      const grad = ctx.createRadialGradient(centerX, centerY, 10, centerX, centerY, radius);
      const color = colors[i % colors.length];
      grad.addColorStop(0, lightenColor(color, 40));
      grad.addColorStop(1, color);

      ctx.beginPath();
      ctx.moveTo(centerX, centerY);
      ctx.arc(centerX, centerY, radius, startAngle, endAngle);
      ctx.closePath();

      ctx.fillStyle = grad;
      ctx.fill();
      ctx.shadowBlur = 0;
      
      ctx.strokeStyle = 'rgba(255,255,255,0.4)';
      ctx.lineWidth = 2;
      ctx.stroke();

      // Effet de brillance
      const highlightAngle = startAngle + angleParSegment / 3;
      ctx.save();
      ctx.translate(centerX, centerY);
      ctx.rotate(highlightAngle);
      ctx.beginPath();
      ctx.arc(0, 0, radius * 0.6, -0.2, 0.2);
      ctx.fillStyle = 'rgba(255,255,255,0.15)';
      ctx.fill();
      ctx.restore();

      // Texte
      ctx.save();
      ctx.translate(centerX, centerY);
      ctx.rotate(startAngle + angleParSegment / 2);
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillStyle = '#fff';
      ctx.font = 'bold 16px "Inter", sans-serif';
      ctx.shadowColor = 'rgba(0,0,0,0.5)';
      ctx.shadowBlur = 8;
      ctx.fillText(segment, radius / 1.7, 0);
      ctx.restore();
    });

    // Cercle central
    ctx.shadowBlur = 30;
    ctx.shadowColor = 'rgba(0,0,0,0.3)';
    
    const gradCenter = ctx.createRadialGradient(centerX, centerY - 10, 5, centerX, centerY, 45);
    gradCenter.addColorStop(0, '#FFD700');
    gradCenter.addColorStop(0.7, '#FFA500');
    gradCenter.addColorStop(1, '#FF8C00');
    ctx.beginPath();
    ctx.arc(centerX, centerY, 45, 0, 2 * Math.PI);
    ctx.fillStyle = gradCenter;
    ctx.fill();
    ctx.shadowBlur = 0;
    ctx.strokeStyle = 'rgba(255,255,255,0.5)';
    ctx.lineWidth = 3;
    ctx.stroke();

    const gradInner = ctx.createRadialGradient(centerX - 5, centerY - 10, 5, centerX, centerY, 30);
    gradInner.addColorStop(0, '#FFF8DC');
    gradInner.addColorStop(0.5, '#FFD700');
    gradInner.addColorStop(1, '#FFA500');
    ctx.beginPath();
    ctx.arc(centerX, centerY, 30, 0, 2 * Math.PI);
    ctx.fillStyle = gradInner;
    ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,0.6)';
    ctx.lineWidth = 2;
    ctx.stroke();

    ctx.shadowBlur = 0;
    ctx.font = '28px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = '#FFD700';
    ctx.fillText('⭐', centerX, centerY + 2);

    // Flèche
    ctx.shadowBlur = 20;
    ctx.shadowColor = 'rgba(0,0,0,0.4)';
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 5;
    
    const arrowX = centerX;
    const arrowY = 15;
    
    ctx.beginPath();
    ctx.moveTo(arrowX, arrowY - 15);
    ctx.lineTo(arrowX - 25, arrowY + 15);
    ctx.lineTo(arrowX + 25, arrowY + 15);
    ctx.closePath();
    const gradArrow = ctx.createLinearGradient(arrowX, arrowY - 15, arrowX, arrowY + 15);
    gradArrow.addColorStop(0, '#FF4444');
    gradArrow.addColorStop(0.5, '#FF6B6B');
    gradArrow.addColorStop(1, '#CC0000');
    ctx.fillStyle = gradArrow;
    ctx.fill();
    ctx.shadowBlur = 0;
    ctx.strokeStyle = '#FFF';
    ctx.lineWidth = 2;
    ctx.stroke();

    ctx.shadowBlur = 15;
    ctx.shadowColor = 'rgba(0,0,0,0.3)';
    ctx.beginPath();
    ctx.arc(arrowX, arrowY + 15, 8, 0, 2 * Math.PI);
    ctx.fillStyle = '#FF4444';
    ctx.fill();
    ctx.shadowBlur = 0;
    ctx.strokeStyle = '#FFF';
    ctx.lineWidth = 2;
    ctx.stroke();

    ctx.shadowBlur = 0;
    ctx.shadowColor = 'transparent';
  };

  // ── UTILITAIRE COULEUR ────────────────────────────────────────────
  function lightenColor(hex: string, percent: number) {
    const num = parseInt(hex.replace('#', ''), 16);
    const amt = Math.round(2.55 * percent);
    const R = Math.min(255, (num >> 16) + amt);
    const G = Math.min(255, (num >> 8 & 0x00FF) + amt);
    const B = Math.min(255, (num & 0x0000FF) + amt);
    return `#${(1 << 24 | R << 16 | G << 8 | B).toString(16).slice(1)}`;
  }

  // ── TOURNER LA ROUE ────────────────────────────────────────────────
  const tourner = () => {
    if (spinning) return;
    setSpinning(true);
    setResultat(null);
    setShowConfetti(false);

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const tours = 5 + Math.random() * 4;
    const angleFinal = angle + tours * 2 * Math.PI + Math.random() * 2 * Math.PI;
    setAngle(angleFinal);

    let currentAngle = angle;
    const duree = 5000;
    const debut = Date.now();

    const animer = () => {
      const elapsed = Date.now() - debut;
      const progress = Math.min(elapsed / duree, 1);
      const easing = 1 - Math.pow(1 - progress, 4);
      const angleActuel = angle + (angleFinal - angle) * easing;

      dessinerRoue(ctx, angleActuel);

      if (progress < 1) {
        requestAnimationFrame(animer);
      } else {
        const nbSegments = segments.length;
        const angleParSegment = (2 * Math.PI) / nbSegments;
        const normalise = angleActuel % (2 * Math.PI);
        const index = Math.floor(((2 * Math.PI - normalise) / (2 * Math.PI)) * nbSegments) % nbSegments;
        const gagne = segments[index];
        setResultat(gagne);
        setSpinning(false);
        setShowConfetti(true);
        onWin(gagne);
        
        setTimeout(() => setShowConfetti(false), 4000);
      }
    };

    animer();
  };

  // ── CONFETTIS ─────────────────────────────────────────────────────
  const Confettis = () => {
    const [particules, setParticules] = useState<Particule[]>([]);

    useEffect(() => {
      if (!showConfetti) return;
      const colors = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7', '#FF9F43', '#F368E0', '#FFD700'];
      const newParticules: Particule[] = [];
      for (let i = 0; i < 80; i++) {
        newParticules.push({
          x: Math.random() * 400,
          y: Math.random() * 200 - 100,
          color: colors[Math.floor(Math.random() * colors.length)],
          size: 5 + Math.random() * 8,
          speed: 2 + Math.random() * 4,
          rotation: Math.random() * 360,
        });
      }
      setParticules(newParticules);

      let frame = 0;
      const interval = setInterval(() => {
        frame++;
        setParticules(prev => prev.map(p => ({
          ...p,
          y: p.y + p.speed,
          x: p.x + Math.sin(frame / 20 + p.size) * 1.5,
          rotation: p.rotation + 5,
        })));
        if (frame > 120) clearInterval(interval);
      }, 16);

      return () => clearInterval(interval);
    }, [showConfetti]);

    return (
      <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', pointerEvents: 'none', overflow: 'hidden' }}>
        {particules.map((p, i) => (
          <div
            key={i}
            style={{
              position: 'absolute',
              left: `${p.x}px`,
              top: `${p.y}px`,
              width: `${p.size}px`,
              height: `${p.size * 0.6}px`,
              background: p.color,
              transform: `rotate(${p.rotation}deg)`,
              borderRadius: '2px',
              opacity: 1,
              animation: 'confettiFall 3s ease-out forwards',
            }}
          />
        ))}
        <style>{`
          @keyframes confettiFall {
            0% { opacity: 1; transform: translateY(0) rotate(0deg); }
            100% { opacity: 0; transform: translateY(400px) rotate(720deg); }
          }
        `}</style>
      </div>
    );
  };

  // ── INIT ───────────────────────────────────────────────────────────
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    dessinerRoue(ctx, angle);
  }, []);

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(0,0,0,0.75)',
      backdropFilter: 'blur(10px)',
      zIndex: 99999,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '20px',
    }}>
      <div style={{
        background: 'linear-gradient(145deg, #1a1a2e, #16213e)',
        borderRadius: '28px',
        padding: '40px 48px 32px',
        maxWidth: '600px',
        width: '100%',
        textAlign: 'center',
        position: 'relative',
        boxShadow: '0 30px 80px rgba(0,0,0,0.6)',
        border: '1px solid rgba(255,255,255,0.08)',
      }}>
        <button
          onClick={onClose}
          style={{
            position: 'absolute',
            top: '14px',
            right: '18px',
            background: 'rgba(255,255,255,0.08)',
            border: 'none',
            fontSize: '20px',
            cursor: 'pointer',
            color: 'rgba(255,255,255,0.5)',
            width: '40px',
            height: '40px',
            borderRadius: '50%',
            transition: 'all 0.2s',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = 'rgba(255,255,255,0.15)';
            e.currentTarget.style.color = '#fff';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'rgba(255,255,255,0.08)';
            e.currentTarget.style.color = 'rgba(255,255,255,0.5)';
          }}
        >
          ✕
        </button>

        <div style={{ marginBottom: '20px' }}>
          <h2 style={{
            fontSize: '28px',
            fontWeight: 800,
            margin: 0,
            background: 'linear-gradient(135deg, #FFD700, #FFA500)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            letterSpacing: '1px',
          }}>
            🎡 Roue de la fortune
          </h2>
          <p style={{
            fontSize: '14px',
            color: 'rgba(255,255,255,0.5)',
            margin: '4px 0 0',
          }}>
            Tournez pour gagner un code promo exclusif !
          </p>
        </div>

        <div style={{ position: 'relative', display: 'inline-block' }}>
          <canvas
            ref={canvasRef}
            width="400"
            height="400"
            style={{
              width: '400px',
              height: '400px',
              margin: '0 auto',
              display: 'block',
              borderRadius: '50%',
              boxShadow: '0 0 60px rgba(255,215,0,0.15), inset 0 0 60px rgba(0,0,0,0.3)',
            }}
          />
          {showConfetti && <Confettis />}
        </div>

        <button
          onClick={tourner}
          disabled={spinning}
          style={{
            marginTop: '24px',
            padding: '14px 44px',
            background: spinning 
              ? 'linear-gradient(135deg, #555, #333)' 
              : 'linear-gradient(135deg, #FFD700, #FF8C00)',
            border: 'none',
            borderRadius: '50px',
            color: spinning ? '#999' : '#000',
            fontSize: '18px',
            fontWeight: 700,
            cursor: spinning ? 'wait' : 'pointer',
            opacity: spinning ? 0.5 : 1,
            transition: 'all 0.3s',
            boxShadow: spinning ? 'none' : '0 4px 20px rgba(255,215,0,0.3)',
            letterSpacing: '1px',
          }}
          onMouseEnter={(e) => {
            if (!spinning) {
              e.currentTarget.style.transform = 'scale(1.05)';
              e.currentTarget.style.boxShadow = '0 6px 30px rgba(255,215,0,0.4)';
            }
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'scale(1)';
            e.currentTarget.style.boxShadow = spinning ? 'none' : '0 4px 20px rgba(255,215,0,0.3)';
          }}
        >
          {spinning ? '⏳ Tourne...' : '🎡 Tourner la roue'}
        </button>

        {resultat && (
          <div style={{
            marginTop: '16px',
            padding: '12px 20px',
            borderRadius: '12px',
            border: '1px solid rgba(255,215,0,0.3)',
            background: 'rgba(255,215,0,0.08)',
            animation: 'resultPop 0.5s cubic-bezier(0.34, 1.56, 0.64, 1)',
          }}>
            <p style={{ fontSize: '14px', color: 'rgba(255,255,255,0.8)', margin: 0 }}>
              🎉 Félicitations ! Vous avez gagné :
            </p>
            <p style={{
              fontSize: '28px',
              fontWeight: 800,
              margin: '4px 0 0',
              background: 'linear-gradient(135deg, #FFD700, #FFA500)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              letterSpacing: '2px',
            }}>
              {resultat}
            </p>
          </div>
        )}

        <div style={{
          display: 'flex',
          justifyContent: 'center',
          gap: '24px',
          marginTop: '16px',
          fontSize: '12px',
          color: 'rgba(255,255,255,0.3)',
        }}>
          <span>🎯 1 participation par visiteur</span>
          <span>⭐ {sponsorName}</span>
        </div>

        <style>{`
          @keyframes resultPop {
            0% { opacity: 0; transform: scale(0.8); }
            100% { opacity: 1; transform: scale(1); }
          }
        `}</style>
      </div>
    </div>
  );
}

export default RoueFortune;