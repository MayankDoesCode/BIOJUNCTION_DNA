import React, { useEffect, useRef } from 'react';

/**
 * Lightweight 2D Canvas Fallback
 * Rendered when WebGL is unavailable or fails to initialize.
 * Ensures the hero always presents an elegant scientific molecular visualization.
 */
export const MolecularFallbackCanvas: React.FC<{ className?: string }> = ({ className = '' }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let width = (canvas.width = canvas.parentElement?.clientWidth || 600);
    let height = (canvas.height = canvas.parentElement?.clientHeight || 500);

    const handleResize = () => {
      if (!canvas || !canvas.parentElement) return;
      width = canvas.width = canvas.parentElement.clientWidth;
      height = canvas.height = canvas.parentElement.clientHeight;
    };
    window.addEventListener('resize', handleResize);

    // Procedural nodes representing abstract molecular interaction
    interface Node {
      x: number;
      y: number;
      vx: number;
      vy: number;
      radius: number;
      color: string;
      cluster: 'protein' | 'ligand' | 'ambient';
    }

    const nodes: Node[] = [];
    const nodeCount = 45;

    // Protein cluster (left/center)
    for (let i = 0; i < 24; i++) {
      const angle = (i / 24) * Math.PI * 2;
      const dist = 60 + Math.sin(i * 1.5) * 35;
      nodes.push({
        x: width * 0.45 + Math.cos(angle) * dist,
        y: height * 0.5 + Math.sin(angle) * dist,
        vx: (Math.random() - 0.5) * 0.2,
        vy: (Math.random() - 0.5) * 0.2,
        radius: 4 + Math.random() * 5,
        color: '#38bdf8', // Cyan protein nodes
        cluster: 'protein',
      });
    }

    // Ligand cluster (approaching pocket)
    for (let i = 0; i < 8; i++) {
      nodes.push({
        x: width * 0.68 + (i % 3) * 22 + (Math.random() - 0.5) * 10,
        y: height * 0.42 + Math.floor(i / 3) * 22 + (Math.random() - 0.5) * 10,
        vx: (Math.random() - 0.5) * 0.3,
        vy: (Math.random() - 0.5) * 0.3,
        radius: 3.5 + Math.random() * 3,
        color: '#fbbf24', // Amber ligand nodes
        cluster: 'ligand',
      });
    }

    // Ambient floating particles
    for (let i = 0; i < nodeCount - 32; i++) {
      nodes.push({
        x: Math.random() * width,
        y: Math.random() * height,
        vx: (Math.random() - 0.5) * 0.15,
        vy: (Math.random() - 0.5) * 0.15,
        radius: 1.5 + Math.random() * 2,
        color: '#60a5fa',
        cluster: 'ambient',
      });
    }

    let t = 0;
    const render = () => {
      t += 0.01;
      ctx.clearRect(0, 0, width, height);

      // Subtle background grid
      ctx.strokeStyle = 'rgba(56, 189, 248, 0.04)';
      ctx.lineWidth = 1;
      const gridSize = 40;
      for (let x = 0; x < width; x += gridSize) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, height);
        ctx.stroke();
      }
      for (let y = 0; y < height; y += gridSize) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
        ctx.stroke();
      }

      // Draw connections
      for (let i = 0; i < nodes.length; i++) {
        for (let j = i + 1; j < nodes.length; j++) {
          const dx = nodes[i].x - nodes[j].x;
          const dy = nodes[i].y - nodes[j].y;
          const dist = Math.sqrt(dx * dx + dy * dy);

          const maxDist =
            nodes[i].cluster === nodes[j].cluster
              ? nodes[i].cluster === 'ligand'
                ? 45
                : 70
              : 85;

          if (dist < maxDist) {
            ctx.beginPath();
            ctx.moveTo(nodes[i].x, nodes[i].y);
            ctx.lineTo(nodes[j].x, nodes[j].y);

            if (nodes[i].cluster === 'ligand' && nodes[j].cluster === 'ligand') {
              ctx.strokeStyle = `rgba(251, 191, 36, ${0.4 * (1 - dist / maxDist)})`;
              ctx.lineWidth = 1.5;
            } else if (nodes[i].cluster === 'protein' && nodes[j].cluster === 'protein') {
              ctx.strokeStyle = `rgba(56, 189, 248, ${0.25 * (1 - dist / maxDist)})`;
              ctx.lineWidth = 1.2;
            } else {
              // Cross-interaction dashed vector
              ctx.setLineDash([3, 3]);
              ctx.strokeStyle = `rgba(244, 114, 182, ${0.45 * (1 - dist / maxDist)})`;
              ctx.lineWidth = 1;
            }

            ctx.stroke();
            ctx.setLineDash([]);
          }
        }
      }

      // Draw nodes
      for (const node of nodes) {
        node.x += node.vx;
        node.y += node.vy;

        // Soft bounce boundaries
        if (node.x < 20 || node.x > width - 20) node.vx *= -1;
        if (node.y < 20 || node.y > height - 20) node.vy *= -1;

        // Node glow
        const radGlow = ctx.createRadialGradient(
          node.x,
          node.y,
          0,
          node.x,
          node.y,
          node.radius * 3
        );
        radGlow.addColorStop(0, node.color);
        radGlow.addColorStop(1, 'transparent');

        ctx.fillStyle = radGlow;
        ctx.beginPath();
        ctx.arc(node.x, node.y, node.radius * 2.5, 0, Math.PI * 2);
        ctx.fill();

        // Node core
        ctx.fillStyle = node.color;
        ctx.beginPath();
        ctx.arc(node.x, node.y, node.radius, 0, Math.PI * 2);
        ctx.fill();
      }

      // Subtle binding pocket highlight zone
      const pocketX = width * 0.54 + Math.sin(t) * 4;
      const pocketY = height * 0.48 + Math.cos(t) * 4;
      const pocketGrad = ctx.createRadialGradient(pocketX, pocketY, 10, pocketX, pocketY, 90);
      pocketGrad.addColorStop(0, 'rgba(56, 189, 248, 0.12)');
      pocketGrad.addColorStop(0.6, 'rgba(251, 191, 36, 0.05)');
      pocketGrad.addColorStop(1, 'transparent');
      ctx.fillStyle = pocketGrad;
      ctx.beginPath();
      ctx.arc(pocketX, pocketY, 90, 0, Math.PI * 2);
      ctx.fill();

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  return (
    <div className={`relative w-full h-full min-h-[380px] overflow-hidden ${className}`}>
      <canvas ref={canvasRef} className="w-full h-full block" />
      <div className="absolute bottom-3 left-4 text-[10px] font-mono text-cyan-400/60 uppercase tracking-widest pointer-events-none">
        Fallback Simulation Canvas • High-Performance 2D Engine
      </div>
    </div>
  );
};
