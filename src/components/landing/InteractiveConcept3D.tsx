import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { MolecularFallbackCanvas } from './MolecularFallbackCanvas';

function checkWebGLSupport(): boolean {
  try {
    const canvas = document.createElement('canvas');
    return !!(
      window.WebGLRenderingContext &&
      (canvas.getContext('webgl') || canvas.getContext('experimental-webgl'))
    );
  } catch (e) {
    return false;
  }
}

export const InteractiveConcept3D: React.FC<{ className?: string }> = ({ className = '' }) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [webGLSupported, setWebGLSupported] = useState<boolean>(true);
  const [dockingStep, setDockingStep] = useState<number>(0.65); // 0 = detached, 1 = fully docked

  useEffect(() => {
    if (!checkWebGLSupport()) {
      setWebGLSupported(false);
      return;
    }

    const container = containerRef.current;
    if (!container) return;

    let width = container.clientWidth || 600;
    let height = container.clientHeight || 450;

    // 1. Scene, Camera, Renderer
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(38, width / height, 0.1, 100);
    camera.position.set(0, 0, 14);

    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({
        antialias: true,
        alpha: true,
        powerPreference: 'high-performance',
      });
      renderer.setSize(width, height);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      container.appendChild(renderer.domElement);
    } catch (e) {
      setWebGLSupported(false);
      return;
    }

    // 2. Lights
    const ambientLight = new THREE.AmbientLight(0xe0f2fe, 0.85);
    scene.add(ambientLight);

    const dirLight = new THREE.DirectionalLight(0x38bdf8, 2.0);
    dirLight.position.set(6, 8, 10);
    scene.add(dirLight);

    const pocketLight = new THREE.PointLight(0xf59e0b, 1.8, 10);
    pocketLight.position.set(0, 0, 1);
    scene.add(pocketLight);

    // 3. Groups
    const mainGroup = new THREE.Group();
    scene.add(mainGroup);

    // Abstract Receptor Cavity (Target pocket)
    const cavityMat = new THREE.MeshStandardMaterial({
      color: 0x0369a1,
      roughness: 0.35,
      metalness: 0.2,
      wireframe: false,
    });

    const sphereGeo = new THREE.SphereGeometry(0.35, 16, 16);
    const cavityGroup = new THREE.Group();
    mainGroup.add(cavityGroup);

    // Construct a horseshoe-like binding pocket with procedural atoms
    const pocketAtoms = 22;
    for (let i = 0; i < pocketAtoms; i++) {
      const theta = (i / pocketAtoms) * Math.PI * 1.5 - 0.75 * Math.PI;
      const r = 2.2 + Math.sin(i * 1.2) * 0.4;
      const x = Math.cos(theta) * r;
      const y = Math.sin(theta) * r;
      const z = (Math.random() - 0.5) * 1.4;

      const mesh = new THREE.Mesh(sphereGeo, cavityMat);
      mesh.position.set(x - 0.8, y, z);
      cavityGroup.add(mesh);
    }

    // Translucent target envelope
    const envelopeGeo = new THREE.TorusGeometry(2.0, 0.5, 12, 32);
    const envelopeMat = new THREE.MeshBasicMaterial({
      color: 0x38bdf8,
      transparent: true,
      opacity: 0.08,
      wireframe: true,
    });
    const envelopeMesh = new THREE.Mesh(envelopeGeo, envelopeMat);
    envelopeMesh.position.set(-0.8, 0, 0);
    cavityGroup.add(envelopeMesh);

    // Abstract Candidate Ligand
    const ligandMat = new THREE.MeshStandardMaterial({
      color: 0xf59e0b,
      roughness: 0.25,
      metalness: 0.35,
      emissive: 0xd97706,
      emissiveIntensity: 0.2,
    });
    const ligandGeo = new THREE.SphereGeometry(0.26, 16, 16);
    const ligandGroup = new THREE.Group();
    mainGroup.add(ligandGroup);

    const ligandOffsets = [
      new THREE.Vector3(0, 0, 0),
      new THREE.Vector3(0.5, 0.4, 0.1),
      new THREE.Vector3(-0.4, 0.5, -0.2),
      new THREE.Vector3(0.6, -0.5, 0.2),
      new THREE.Vector3(-0.3, -0.6, 0.1),
      new THREE.Vector3(1.1, 0.1, -0.1),
    ];
    ligandOffsets.forEach((pos) => {
      const atom = new THREE.Mesh(ligandGeo, ligandMat);
      atom.position.copy(pos);
      ligandGroup.add(atom);
    });

    // Interaction Ray lines
    const lineMat = new THREE.LineDashedMaterial({
      color: 0x22d3ee,
      dashSize: 0.15,
      gapSize: 0.1,
      transparent: true,
      opacity: 0.8,
    });
    const lineGeo = new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(-0.8, 0, 0),
      new THREE.Vector3(2.5, 0, 0),
    ]);
    const interactionLine = new THREE.Line(lineGeo, lineMat);
    interactionLine.computeLineDistances();
    mainGroup.add(interactionLine);

    // Initial position based on dockingStep
    let currentStep = dockingStep;
    const updateLigandPosition = (step: number) => {
      // Step: 0 = detached at x=4.0, 1 = docked at x=-0.6
      const targetX = 4.0 - step * 4.6;
      const targetY = (1 - step) * 1.5;
      const targetZ = (1 - step) * 1.2;
      ligandGroup.position.set(targetX, targetY, targetZ);

      // Update interaction line
      const positions = (interactionLine.geometry.attributes.position as THREE.BufferAttribute)
        .array as Float32Array;
      positions[0] = -0.8;
      positions[1] = 0;
      positions[2] = 0;
      positions[3] = targetX;
      positions[4] = targetY;
      positions[5] = targetZ;
      interactionLine.geometry.attributes.position.needsUpdate = true;
      interactionLine.computeLineDistances();
    };

    updateLigandPosition(currentStep);

    // Scroll interaction: adjust docking position based on scroll within container
    const onScroll = () => {
      if (!container) return;
      const rect = container.getBoundingClientRect();
      const windowH = window.innerHeight;
      // When container is in view (from entering viewport to leaving)
      const progress = Math.min(Math.max((windowH - rect.top) / (windowH + rect.height), 0), 1);
      currentStep = progress;
      setDockingStep(progress);
      updateLigandPosition(progress);
    };
    window.addEventListener('scroll', onScroll, { passive: true });

    const onResize = () => {
      if (!container) return;
      width = container.clientWidth;
      height = container.clientHeight;
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      renderer.setSize(width, height);
    };
    window.addEventListener('resize', onResize);

    // Animation Loop
    let animId: number;
    let clock = new THREE.Clock();

    const animate = () => {
      animId = requestAnimationFrame(animate);
      const time = clock.getElapsedTime();

      // Subtle organic breathing
      cavityGroup.rotation.y = Math.sin(time * 0.15) * 0.12;
      cavityGroup.rotation.x = Math.cos(time * 0.1) * 0.08;

      ligandGroup.rotation.y = time * 0.2;
      ligandGroup.rotation.z = Math.sin(time * 0.25) * 0.15;

      renderer.render(scene, camera);
    };

    animate();

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onResize);
      renderer.dispose();
      if (renderer.domElement && container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
      scene.clear();
    };
  }, []);

  if (!webGLSupported) {
    return <MolecularFallbackCanvas className={className} />;
  }

  return (
    <div className={`relative w-full h-[420px] md:h-[480px] rounded-3xl bg-slate-950/70 border border-cyan-500/20 overflow-hidden shadow-2xl ${className}`}>
      {/* 3D Canvas */}
      <div ref={containerRef} className="w-full h-full" />

      {/* Floating HUD Annotations */}
      <div className="absolute top-4 left-4 flex flex-col gap-1.5 pointer-events-none">
        <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-slate-900/80 backdrop-blur border border-cyan-500/30 text-xs font-mono font-bold text-cyan-300">
          <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
          <span>SIMULATED RECEPTOR POCKET</span>
        </div>
        <span className="text-[10px] font-mono text-slate-400 pl-3">
          Surface Electrostatic Envelope (Illustrative)
        </span>
      </div>

      <div className="absolute top-4 right-4 flex flex-col items-end gap-1.5 pointer-events-none">
        <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-slate-900/80 backdrop-blur border border-amber-500/30 text-xs font-mono font-bold text-amber-300">
          <span className="w-2 h-2 rounded-full bg-amber-400" />
          <span>LIGAND TRAJECTORY</span>
        </div>
        <span className="text-[10px] font-mono text-slate-400 pr-3">
          Proximity: {(dockingStep * 100).toFixed(0)}%
        </span>
      </div>

      {/* Interactive Proximity Control Slider at bottom */}
      <div className="absolute bottom-4 left-4 right-4 flex flex-col sm:flex-row items-center justify-between gap-3 px-4 py-3 rounded-2xl bg-slate-900/90 backdrop-blur border border-cyan-500/20 text-xs font-mono">
        <div className="flex items-center gap-2 text-slate-300">
          <span className="text-cyan-400 font-bold">Concept Demo:</span>
          <span>Scroll page or drag slider to simulate docking approach:</span>
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto">
          <span className="text-[11px] text-slate-400">Detached</span>
          <input
            type="range"
            min="0"
            max="1"
            step="0.01"
            value={dockingStep}
            onChange={(e) => setDockingStep(parseFloat(e.target.value))}
            className="w-32 accent-cyan-400 cursor-pointer"
          />
          <span className="text-[11px] text-emerald-400 font-bold">Docked</span>
        </div>
      </div>
    </div>
  );
};
