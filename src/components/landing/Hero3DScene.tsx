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

export const Hero3DScene: React.FC<{ className?: string }> = ({ className = '' }) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [webGLSupported, setWebGLSupported] = useState<boolean>(true);

  useEffect(() => {
    // Check WebGL availability
    if (!checkWebGLSupport()) {
      setWebGLSupported(false);
      return;
    }

    // Check reduced motion preference
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    let isReducedMotion = mediaQuery.matches;
    const motionListener = (e: MediaQueryListEvent) => {
      isReducedMotion = e.matches;
    };
    mediaQuery.addEventListener('change', motionListener);

    const container = containerRef.current;
    if (!container) return;

    let width = container.clientWidth || 600;
    let height = container.clientHeight || 580;

    // 1. Scene, Camera, Renderer
    const scene = new THREE.Scene();

    const camera = new THREE.PerspectiveCamera(42, width / height, 0.1, 100);
    camera.position.set(0, 0, 16);

    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({
        antialias: true,
        alpha: true,
        powerPreference: 'high-performance',
      });
      renderer.setSize(width, height);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      renderer.toneMapping = THREE.ACESFilmicToneMapping;
      renderer.toneMappingExposure = 1.1;
      container.appendChild(renderer.domElement);
    } catch (e) {
      setWebGLSupported(false);
      return;
    }

    // 2. Lighting System
    const ambientLight = new THREE.AmbientLight(0xdbeafe, 0.9);
    scene.add(ambientLight);

    const keyLight = new THREE.DirectionalLight(0x38bdf8, 2.2);
    keyLight.position.set(8, 12, 10);
    scene.add(keyLight);

    const fillLight = new THREE.DirectionalLight(0x818cf8, 1.4);
    fillLight.position.set(-10, -6, -4);
    scene.add(fillLight);

    const pocketGlow = new THREE.PointLight(0xfbbf24, 2.5, 12);
    pocketGlow.position.set(1.2, 0.2, 1.5);
    scene.add(pocketGlow);

    // 3. Materials
    const proteinNodeMaterial = new THREE.MeshStandardMaterial({
      color: 0x0284c7,
      roughness: 0.3,
      metalness: 0.15,
      emissive: 0x0369a1,
      emissiveIntensity: 0.25,
    });

    const proteinBondMaterial = new THREE.MeshStandardMaterial({
      color: 0x38bdf8,
      roughness: 0.4,
      metalness: 0.1,
      transparent: true,
      opacity: 0.7,
    });

    const ligandNodeMaterial = new THREE.MeshStandardMaterial({
      color: 0xf59e0b,
      roughness: 0.2,
      metalness: 0.3,
      emissive: 0xd97706,
      emissiveIntensity: 0.35,
    });

    const ligandBondMaterial = new THREE.MeshStandardMaterial({
      color: 0xfbbf24,
      roughness: 0.3,
      metalness: 0.2,
    });

    // 4. Group Hierarchy
    const worldGroup = new THREE.Group();
    scene.add(worldGroup);

    const proteinGroup = new THREE.Group();
    worldGroup.add(proteinGroup);

    const ligandGroup = new THREE.Group();
    worldGroup.add(ligandGroup);

    // 5. Procedural Abstract Protein Structure
    // Organic curved arrangement of nodes creating an envelope around a central pocket
    const proteinAtomCount = 38;
    const sphereGeo = new THREE.SphereGeometry(0.32, 16, 16);
    const cylinderGeo = new THREE.CylinderGeometry(0.08, 0.08, 1, 8);

    const proteinPoints: THREE.Vector3[] = [];
    for (let i = 0; i < proteinAtomCount; i++) {
      const u = i / proteinAtomCount;
      const angle = u * Math.PI * 4;
      const radius = 2.8 + Math.sin(u * Math.PI * 3) * 1.2;
      const y = (u - 0.5) * 6.5 + Math.cos(angle * 0.7) * 0.8;
      const x = Math.cos(angle) * radius - 1.2; // Offset left of center
      const z = Math.sin(angle) * (radius * 0.85);

      const pt = new THREE.Vector3(x, y, z);
      proteinPoints.push(pt);

      const atomMesh = new THREE.Mesh(sphereGeo, proteinNodeMaterial);
      atomMesh.position.copy(pt);
      const scaleVariation = 0.8 + Math.sin(i * 1.3) * 0.35;
      atomMesh.scale.setScalar(scaleVariation);
      proteinGroup.add(atomMesh);
    }

    // Connect sequential protein nodes with bonds
    for (let i = 0; i < proteinPoints.length - 1; i++) {
      const p1 = proteinPoints[i];
      const p2 = proteinPoints[i + 1];
      const dist = p1.distanceTo(p2);
      if (dist < 3.2) {
        const bond = new THREE.Mesh(cylinderGeo, proteinBondMaterial);
        bond.position.copy(p1).lerp(p2, 0.5);
        bond.scale.set(1, dist, 1);
        bond.quaternion.setFromUnitVectors(
          new THREE.Vector3(0, 1, 0),
          p2.clone().sub(p1).normalize()
        );
        proteinGroup.add(bond);
      }
    }

    // Subtle translucent pocket sphere indicating binding site envelope
    const pocketEnvelopeGeo = new THREE.SphereGeometry(1.6, 24, 24);
    const pocketEnvelopeMat = new THREE.MeshBasicMaterial({
      color: 0x38bdf8,
      transparent: true,
      opacity: 0.07,
      wireframe: true,
    });
    const pocketMesh = new THREE.Mesh(pocketEnvelopeGeo, pocketEnvelopeMat);
    pocketMesh.position.set(0.8, 0.2, 0.6);
    proteinGroup.add(pocketMesh);

    // 6. Procedural Abstract Ligand Molecule
    const ligandPoints: THREE.Vector3[] = [
      new THREE.Vector3(0, 0, 0),
      new THREE.Vector3(0.7, 0.4, 0.2),
      new THREE.Vector3(-0.6, 0.5, -0.3),
      new THREE.Vector3(0.9, -0.6, 0.1),
      new THREE.Vector3(-0.4, -0.7, 0.4),
      new THREE.Vector3(1.5, 0.2, -0.2),
      new THREE.Vector3(-1.2, 0.1, 0.1),
      new THREE.Vector3(0.2, 1.2, -0.1),
    ];

    const ligandAtomGeo = new THREE.SphereGeometry(0.24, 16, 16);
    ligandPoints.forEach((pt) => {
      const atom = new THREE.Mesh(ligandAtomGeo, ligandNodeMaterial);
      atom.position.copy(pt);
      ligandGroup.add(atom);
    });

    // Ligand bonds
    const ligandBonds = [
      [0, 1],
      [0, 2],
      [0, 3],
      [0, 4],
      [1, 5],
      [2, 6],
      [1, 7],
    ];
    ligandBonds.forEach(([i, j]) => {
      const p1 = ligandPoints[i];
      const p2 = ligandPoints[j];
      const dist = p1.distanceTo(p2);
      const bond = new THREE.Mesh(cylinderGeo, ligandBondMaterial);
      bond.position.copy(p1).lerp(p2, 0.5);
      bond.scale.set(0.8, dist, 0.8);
      bond.quaternion.setFromUnitVectors(
        new THREE.Vector3(0, 1, 0),
        p2.clone().sub(p1).normalize()
      );
      ligandGroup.add(bond);
    });

    // Position ligand floating near the pocket entrance
    ligandGroup.position.set(2.4, 0.8, 2.0);

    // 7. Interaction Vectors (Subtle dashed line from ligand to pocket)
    const lineMat = new THREE.LineDashedMaterial({
      color: 0xf472b6,
      dashSize: 0.2,
      gapSize: 0.15,
      transparent: true,
      opacity: 0.65,
    });
    const lineGeo = new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(0.8, 0.2, 0.6), // pocket
      new THREE.Vector3(2.4, 0.8, 2.0), // ligand
    ]);
    const interactionLine = new THREE.Line(lineGeo, lineMat);
    interactionLine.computeLineDistances();
    worldGroup.add(interactionLine);

    // 8. Ambient Floating Dust Particles (260 points)
    const particleCount = 260;
    const particleGeo = new THREE.BufferGeometry();
    const particlePositions = new Float32Array(particleCount * 3);
    for (let i = 0; i < particleCount * 3; i += 3) {
      particlePositions[i] = (Math.random() - 0.5) * 22;
      particlePositions[i + 1] = (Math.random() - 0.5) * 18;
      particlePositions[i + 2] = (Math.random() - 0.5) * 14;
    }
    particleGeo.setAttribute('position', new THREE.BufferAttribute(particlePositions, 3));
    const particleMat = new THREE.PointsMaterial({
      color: 0x38bdf8,
      size: 0.08,
      transparent: true,
      opacity: 0.45,
    });
    const particles = new THREE.Points(particleGeo, particleMat);
    scene.add(particles);

    // 9. Mouse and Scroll Interaction State
    let mouseX = 0;
    let mouseY = 0;
    let targetX = 0;
    let targetY = 0;
    let scrollProgress = 0;

    const onMouseMove = (e: MouseEvent) => {
      const rect = container.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      const y = -(((e.clientY - rect.top) / rect.height) * 2 - 1);
      targetX = x * 0.4;
      targetY = y * 0.3;
    };
    window.addEventListener('mousemove', onMouseMove);

    const onScroll = () => {
      const scrollY = window.scrollY || window.pageYOffset;
      const maxScroll = Math.max(window.innerHeight, 1);
      scrollProgress = Math.min(scrollY / maxScroll, 1.5);
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

    // 10. Animation Loop
    let animationFrameId: number;
    let clock = new THREE.Clock();

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);

      const elapsedTime = clock.getElapsedTime();

      // Mouse Parallax Lerping
      mouseX += (targetX - mouseX) * 0.05;
      mouseY += (targetY - mouseY) * 0.05;

      if (!isReducedMotion) {
        // Slow calm rotation for protein
        proteinGroup.rotation.y = elapsedTime * 0.08 + mouseX * 0.6;
        proteinGroup.rotation.x = Math.sin(elapsedTime * 0.05) * 0.06 + mouseY * 0.5;

        // Slow organic floating for ligand around pocket
        const orbitSpeed = elapsedTime * 0.22;
        const orbitRadiusX = 2.2 + Math.cos(orbitSpeed * 0.7) * 0.3;
        const orbitRadiusY = 0.8 + Math.sin(orbitSpeed * 0.9) * 0.25;
        const orbitRadiusZ = 1.8 + Math.sin(orbitSpeed * 0.5) * 0.35;

        ligandGroup.position.set(
          orbitRadiusX + mouseX * 0.2,
          orbitRadiusY + mouseY * 0.2,
          orbitRadiusZ
        );
        ligandGroup.rotation.y = elapsedTime * 0.15;
        ligandGroup.rotation.z = Math.sin(elapsedTime * 0.2) * 0.2;

        // Pulse interaction vector line
        const positions = (interactionLine.geometry.attributes.position as THREE.BufferAttribute)
          .array as Float32Array;
        positions[3] = ligandGroup.position.x;
        positions[4] = ligandGroup.position.y;
        positions[5] = ligandGroup.position.z;
        interactionLine.geometry.attributes.position.needsUpdate = true;
        interactionLine.computeLineDistances();

        // Very slow drifting particles
        particles.rotation.y = elapsedTime * 0.02;
        particles.rotation.x = Math.sin(elapsedTime * 0.015) * 0.02;
      }

      // Scroll-Linked Transition
      worldGroup.position.y = -scrollProgress * 2.2;
      worldGroup.position.z = -scrollProgress * 1.5;
      worldGroup.rotation.y = scrollProgress * 0.6;

      renderer.render(scene, camera);
    };

    animate();

    // Cleanup
    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onResize);
      mediaQuery.removeEventListener('change', motionListener);

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
    <div className={`relative w-full h-full min-h-[480px] lg:min-h-[580px] select-none ${className}`}>
      {/* Three.js Canvas Container */}
      <div ref={containerRef} className="w-full h-full absolute inset-0 cursor-grab active:cursor-grabbing" />

      {/* Floating Conceptual Labels (Section 11) */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {/* Protein Label */}
        <div className="absolute top-[28%] left-[8%] md:left-[12%] animate-fade-in">
          <div className="flex items-center gap-2 px-2.5 py-1 rounded-full bg-slate-900/80 backdrop-blur-md border border-cyan-500/30 text-[10px] font-mono font-bold text-cyan-300 shadow-lg">
            <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
            <span>PROTEIN: STRUCTURE</span>
          </div>
          <div className="w-10 h-px bg-gradient-to-r from-cyan-500/40 to-transparent ml-4 mt-0.5" />
        </div>

        {/* Binding Region Label */}
        <div className="absolute top-[48%] left-[45%] md:left-[48%] animate-fade-in delay-100">
          <div className="flex items-center gap-2 px-2.5 py-1 rounded-full bg-slate-900/80 backdrop-blur-md border border-amber-500/30 text-[10px] font-mono font-bold text-amber-300 shadow-lg">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
            <span>BINDING REGION</span>
          </div>
        </div>

        {/* Ligand Label */}
        <div className="absolute top-[34%] right-[8%] md:right-[14%] animate-fade-in delay-200">
          <div className="flex items-center gap-2 px-2.5 py-1 rounded-full bg-slate-900/80 backdrop-blur-md border border-emerald-500/30 text-[10px] font-mono font-bold text-emerald-300 shadow-lg">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            <span>LIGAND: CANDIDATE</span>
          </div>
          <div className="w-10 h-px bg-gradient-to-l from-emerald-500/40 to-transparent ml-auto mr-4 mt-0.5" />
        </div>

        {/* Bottom Computational Analysis Banner */}
        <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between text-[10px] font-mono text-cyan-400/60 uppercase tracking-widest px-3 py-1.5 rounded-xl bg-slate-950/60 backdrop-blur border border-cyan-500/10">
          <span className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
            COMPUTATIONAL ANALYSIS • 3D MOTION INTERFACE
          </span>
          <span className="text-slate-400 hidden sm:inline">
            ILLUSTRATIVE MOLECULAR VISUALIZATION
          </span>
        </div>
      </div>
    </div>
  );
};
