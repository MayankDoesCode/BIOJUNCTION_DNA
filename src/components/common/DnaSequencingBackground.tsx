import React, { useEffect, useRef } from 'react';

interface DnaSequencingBackgroundProps {
  className?: string;
  intensity?: 'subtle' | 'vibrant';
}

export const DnaSequencingBackground: React.FC<DnaSequencingBackgroundProps> = ({
  className = '',
  intensity = 'subtle',
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const mouseRef = useRef<{ x: number; y: number; targetX: number; targetY: number }>({
    x: 0,
    y: 0,
    targetX: 0,
    targetY: 0,
  });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    // Nucleotide base letters
    const BASES = ['A', 'T', 'C', 'G'];
    // Palette colors
    const COLOR_MAROON = '#3f0d12';
    const COLOR_CRIMSON = '#a71d31';
    const COLOR_GOLD = '#d5bf86';
    const COLOR_TAUPE = '#8d775f';

    // Base particle class for falling/sequencing nucleotides
    interface NucleotideParticle {
      x: number;
      y: number;
      base: string;
      speed: number;
      opacity: number;
      size: number;
      lane: number;
    }

    const numLanes = Math.max(12, Math.floor(width / 90));
    const laneWidth = width / numLanes;
    const particles: NucleotideParticle[] = [];

    // Initialize random sequencing particles across lanes
    for (let i = 0; i < 45; i++) {
      const lane = Math.floor(Math.random() * numLanes);
      particles.push({
        lane,
        x: lane * laneWidth + laneWidth / 2 + (Math.random() - 0.5) * 20,
        y: Math.random() * height,
        base: BASES[Math.floor(Math.random() * BASES.length)],
        speed: 0.6 + Math.random() * 1.2,
        opacity: 0.15 + Math.random() * 0.45,
        size: 11 + Math.random() * 5,
      });
    }

    // Resize handler
    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };

    // Mouse tracking for gentle 3D parallax
    const handleMouseMove = (e: MouseEvent) => {
      mouseRef.current.targetX = (e.clientX / width - 0.5) * 2;
      mouseRef.current.targetY = (e.clientY / height - 0.5) * 2;
    };

    window.addEventListener('resize', handleResize);
    window.addEventListener('mousemove', handleMouseMove);

    let time = 0;

    const render = () => {
      time += 0.015;

      // Smooth mouse interpolation
      mouseRef.current.x += (mouseRef.current.targetX - mouseRef.current.x) * 0.05;
      mouseRef.current.y += (mouseRef.current.targetY - mouseRef.current.y) * 0.05;

      ctx.clearRect(0, 0, width, height);

      // -------------------------------------------------------------
      // 1. Sanger Sequencing Chromatogram Waves (Background Layer)
      // -------------------------------------------------------------
      const traceY = height * 0.85;
      const waveAmplitude = 18;

      ctx.save();
      ctx.lineWidth = 1.2;
      ctx.globalAlpha = intensity === 'vibrant' ? 0.28 : 0.15;

      // Lane A (Crimson)
      ctx.beginPath();
      ctx.strokeStyle = COLOR_CRIMSON;
      for (let x = 0; x < width; x += 15) {
        const peak = Math.sin(x * 0.02 + time * 1.5) * Math.cos(x * 0.01 + time);
        const y = traceY + peak * waveAmplitude * 1.6;
        if (x === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();

      // Lane T (Gold)
      ctx.beginPath();
      ctx.strokeStyle = COLOR_GOLD;
      for (let x = 0; x < width; x += 15) {
        const peak = Math.cos(x * 0.025 + time * 1.2) * Math.sin(x * 0.008 + time * 0.7);
        const y = traceY + 12 + peak * waveAmplitude * 1.4;
        if (x === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();

      // Lane C (Maroon)
      ctx.beginPath();
      ctx.strokeStyle = COLOR_MAROON;
      for (let x = 0; x < width; x += 15) {
        const peak = Math.sin(x * 0.018 - time * 0.9) * Math.cos(x * 0.022);
        const y = traceY - 10 + peak * waveAmplitude * 1.3;
        if (x === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();

      // Lane G (Taupe)
      ctx.beginPath();
      ctx.strokeStyle = COLOR_TAUPE;
      for (let x = 0; x < width; x += 15) {
        const peak = Math.cos(x * 0.03 + time) * Math.sin(x * 0.015 - time);
        const y = traceY + 4 + peak * waveAmplitude;
        if (x === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();
      ctx.restore();

      // -------------------------------------------------------------
      // 2. Vertical Sequencing Lanes & Falling Nucleotide Stream
      // -------------------------------------------------------------
      ctx.save();
      ctx.font = 'bold 12px "Courier New", monospace';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';

      // Draw faint lane guide lines
      ctx.strokeStyle = COLOR_GOLD;
      ctx.lineWidth = 0.5;
      ctx.setLineDash([2, 8]);
      for (let l = 1; l < numLanes; l++) {
        const lx = l * laneWidth;
        ctx.globalAlpha = 0.08;
        ctx.beginPath();
        ctx.moveTo(lx, 0);
        ctx.lineTo(lx, height);
        ctx.stroke();
      }
      ctx.setLineDash([]);

      // Update & draw nucleotide particles
      particles.forEach((p) => {
        p.y += p.speed;
        if (p.y > height + 20) {
          p.y = -20;
          p.lane = Math.floor(Math.random() * numLanes);
          p.x = p.lane * laneWidth + laneWidth / 2 + (Math.random() - 0.5) * 15;
          p.base = BASES[Math.floor(Math.random() * BASES.length)];
          p.opacity = 0.15 + Math.random() * 0.45;
        }

        // Color mapped to base type
        let color = COLOR_MAROON;
        if (p.base === 'A') color = COLOR_CRIMSON;
        if (p.base === 'T') color = COLOR_GOLD;
        if (p.base === 'C') color = COLOR_MAROON;
        if (p.base === 'G') color = COLOR_TAUPE;

        ctx.fillStyle = color;
        ctx.globalAlpha = p.opacity * (intensity === 'vibrant' ? 0.7 : 0.4);
        ctx.font = `600 ${p.size}px "Courier New", monospace`;
        ctx.fillText(p.base, p.x, p.y);

        // Subtle nucleotide base connection rung indicator
        if (Math.random() > 0.6) {
          ctx.strokeStyle = color;
          ctx.lineWidth = 0.5;
          ctx.globalAlpha = 0.12;
          ctx.beginPath();
          ctx.moveTo(p.x - 8, p.y);
          ctx.lineTo(p.x + 8, p.y);
          ctx.stroke();
        }
      });
      ctx.restore();

      // -------------------------------------------------------------
      // 3. 3D Rotating DNA Double Helix Ribbon (Right/Center ambient)
      // -------------------------------------------------------------
      ctx.save();
      const helixCenterX = width * 0.72 + mouseRef.current.x * 50;
      const helixRadius = Math.min(130, width * 0.12);
      const helixStep = 32;
      const totalNodes = Math.floor(height / helixStep) + 2;

      for (let i = -1; i < totalNodes; i++) {
        const y = i * helixStep;
        // Phase angle calculation with continuous rotation and vertical twist
        const angle = time * 1.8 + i * 0.28 + mouseRef.current.y * 0.8;

        const x1 = helixCenterX + Math.cos(angle) * helixRadius;
        const z1 = Math.sin(angle); // Depth factor [-1, 1]

        const x2 = helixCenterX + Math.cos(angle + Math.PI) * helixRadius;
        const z2 = Math.sin(angle + Math.PI);

        // Perspective scale & depth shading
        const scale1 = (z1 + 2) / 3;
        const scale2 = (z2 + 2) / 3;

        // Base pair hydrogen bonding rung connecting strand 1 and strand 2
        ctx.beginPath();
        ctx.moveTo(x1, y);
        ctx.lineTo(x2, y);
        ctx.strokeStyle = COLOR_GOLD;
        ctx.lineWidth = 1.4;
        ctx.globalAlpha = (z1 > 0 ? 0.35 : 0.18) * (intensity === 'vibrant' ? 1 : 0.6);
        ctx.setLineDash([3, 4]);
        ctx.stroke();
        ctx.setLineDash([]);

        // Complementary Base Labels on the Helix rungs (A-T / G-C)
        if (i % 2 === 0) {
          const midX = (x1 + x2) / 2;
          const basePairStr = i % 4 === 0 ? 'A = T' : 'G ≡ C';
          ctx.fillStyle = COLOR_MAROON;
          ctx.font = 'bold 9px monospace';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.globalAlpha = 0.35;
          ctx.fillText(basePairStr, midX, y);
        }

        // Node 1 on Strand Alpha (Crimson)
        ctx.beginPath();
        ctx.arc(x1, y, 4 * scale1, 0, Math.PI * 2);
        ctx.fillStyle = z1 > 0 ? COLOR_CRIMSON : COLOR_TAUPE;
        ctx.globalAlpha = (z1 + 1.2) / 2.2 * 0.55;
        ctx.fill();

        // Node 2 on Strand Beta (Maroon / Gold)
        ctx.beginPath();
        ctx.arc(x2, y, 4 * scale2, 0, Math.PI * 2);
        ctx.fillStyle = z2 > 0 ? COLOR_MAROON : COLOR_GOLD;
        ctx.globalAlpha = (z2 + 1.2) / 2.2 * 0.55;
        ctx.fill();
      }

      ctx.restore();

      // -------------------------------------------------------------
      // 4. Horizontal Sequencing Scanner Line (Sanger Optical Beam)
      // -------------------------------------------------------------
      ctx.save();
      const scanY = ((time * 65) % (height + 200)) - 100;
      const grad = ctx.createLinearGradient(0, scanY - 30, 0, scanY + 30);
      grad.addColorStop(0, 'rgba(167, 29, 49, 0)');
      grad.addColorStop(0.5, 'rgba(213, 191, 134, 0.22)');
      grad.addColorStop(1, 'rgba(167, 29, 49, 0)');

      ctx.fillStyle = grad;
      ctx.fillRect(0, scanY - 25, width, 50);

      // Fine laser thread
      ctx.strokeStyle = COLOR_GOLD;
      ctx.lineWidth = 1;
      ctx.globalAlpha = 0.45;
      ctx.beginPath();
      ctx.moveTo(0, scanY);
      ctx.lineTo(width, scanY);
      ctx.stroke();

      // Laser readout badge on left margin
      ctx.fillStyle = COLOR_MAROON;
      ctx.font = 'bold 9px monospace';
      ctx.globalAlpha = 0.5;
      ctx.fillText(`SEQ_SCAN // READ_HEAD_01 [POS: ${Math.floor(scanY)} bp]`, 18, scanY - 6);

      ctx.restore();

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('mousemove', handleMouseMove);
      cancelAnimationFrame(animationFrameId);
    };
  }, [intensity]);

  return (
    <canvas
      ref={canvasRef}
      className={`fixed inset-0 pointer-events-none z-0 ${className}`}
      style={{ display: 'block' }}
    />
  );
};
