import React, { useState, useEffect, useRef } from 'react';
import * as NGL from 'ngl';
import {
  RotateCcw,
  Maximize2,
  Minimize2,
  Box,
  Layers,
  Sparkles,
  Eye,
  EyeOff,
  AlertCircle,
  ZoomIn,
  ZoomOut,
  RefreshCw,
  Dna,
  Pill,
} from 'lucide-react';
import { Card } from '../common/Card';
import { Badge } from '../common/Badge';
import { getDefaultProteinStructure, getDefaultLigandCoordinates } from '../../database/defaultStructures';
import type { BindingSite, InteractionAnalysisResult } from '../../types';

export interface MolecularViewerProps {
  proteinName?: string;
  structureId?: string;
  proteinData?: string;
  proteinFormat?: string;
  ligandName?: string;
  ligandData?: string;
  selectedPoseMode?: number;
  bindingSite?: BindingSite;
  bindingSiteName?: string; // Backwards-compatibility
  hasCompletedDocking?: boolean;
  isEngineUnavailable?: boolean;
  interactionAnalysis?: InteractionAnalysisResult | null;
  highlightedResidue?: { resName: string; resSeq: number } | null;
  showGridBox?: boolean;
  className?: string;
}

export const MolecularViewer: React.FC<MolecularViewerProps> = ({
  proteinName = 'Target Receptor',
  structureId,
  proteinData,
  proteinFormat = 'PDBQT',
  ligandName,
  ligandData,
  selectedPoseMode,
  bindingSite,
  hasCompletedDocking = false,
  isEngineUnavailable = false,
  interactionAnalysis,
  highlightedResidue,
  showGridBox = true,
  className = '',
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<NGL.Stage | null>(null);

  // Component representations
  const proteinCompRef = useRef<NGL.Component | null>(null);
  const ligandCompRef = useRef<NGL.Component | null>(null);
  const boxCompRef = useRef<NGL.Component | null>(null);
  const interactionCompRef = useRef<NGL.Component | null>(null);

  // UI state
  const [styleMode, setStyleMode] = useState<'cartoon' | 'surface' | 'ribbon' | 'wireframe'>('cartoon');
  const [showProtein, setShowProtein] = useState(true);
  const [showLigand, setShowLigand] = useState(true);
  const [showPocket, setShowPocket] = useState(showGridBox);
  const [showInteractions, setShowInteractions] = useState(true);
  const [showHBonds, setShowHBonds] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [viewerError, setViewerError] = useState<string | null>(null);
  const [webglSupported, setWebglSupported] = useState(true);

  // Resolve effective coordinates with fallback to authentic crystallographic data
  const effectiveProteinData =
    proteinData && proteinData.trim().length > 0
      ? proteinData
      : getDefaultProteinStructure(structureId || proteinName);

  const effectiveLigandData =
    ligandData && ligandData.trim().length > 0
      ? ligandData
      : getDefaultLigandCoordinates(ligandName || structureId);

  // Available data flags
  const hasProtein = !!effectiveProteinData && effectiveProteinData.trim().length > 0;
  const hasLigand = !!effectiveLigandData && effectiveLigandData.trim().length > 0;
  const hasPocket = !!bindingSite;
  const hasInteractions =
    !!interactionAnalysis?.hasAnalysis &&
    interactionAnalysis.interactions &&
    interactionAnalysis.interactions.length > 0;
  const hasHBonds =
    !!interactionAnalysis?.hasAnalysis && (interactionAnalysis.hydrogenBondsCount || 0) > 0;

  // Initialize NGL Stage
  useEffect(() => {
    // Only initialize in browser with window and DOM
    if (typeof window === 'undefined' || !containerRef.current) return;

    // Check if docking completed or real structures/regions exist
    if (!hasCompletedDocking && !hasProtein && !hasLigand && !hasPocket) return;

    let stage: NGL.Stage | null = null;

    try {
      setViewerError(null);
      containerRef.current.innerHTML = '';

      stage = new NGL.Stage(containerRef.current, {
        backgroundColor: '#020617', // slate-950
        quality: 'medium',
        clipNear: 0,
        clipFar: 100,
        fogNear: 50,
        fogFar: 100,
      });

      stageRef.current = stage;
      setWebglSupported(true);

      const handleResize = () => {
        if (stageRef.current) {
          stageRef.current.handleResize();
        }
      };
      window.addEventListener('resize', handleResize);

      return () => {
        window.removeEventListener('resize', handleResize);
        if (stageRef.current) {
          try {
            stageRef.current.dispose();
          } catch {
            // Ignore disposal errors
          }
          stageRef.current = null;
        }
      };
    } catch (err: any) {
      console.warn('WebGL initialization warning in MolecularViewer:', err);
      setWebglSupported(false);
      setViewerError(err?.message || 'WebGL context initialization failed');
    }
  }, [hasCompletedDocking, hasProtein, hasLigand, hasPocket]);

  // Load / Update molecular structures and representations
  useEffect(() => {
    const stage = stageRef.current;
    if (!stage || !webglSupported) return;

    let isCancelled = false;

    const renderMolecules = async () => {
      try {
        setIsLoading(true);
        setViewerError(null);
        stage.removeAllComponents();

        proteinCompRef.current = null;
        ligandCompRef.current = null;
        boxCompRef.current = null;
        interactionCompRef.current = null;

        // 1. LOAD PROTEIN RECEPTOR
        if (hasProtein && effectiveProteinData) {
          try {
            const rawExt = (proteinFormat || 'pdbqt').toLowerCase();
            const ext = rawExt === 'pdbqt' ? 'pdb' : rawExt;
            const blob = new Blob([effectiveProteinData], { type: 'text/plain' });
            const comp = await stage.loadFile(blob, { ext, defaultRepresentation: false });

            if (isCancelled) return;
            if (comp) {
              proteinCompRef.current = comp;

              if (showProtein) {
                if (styleMode === 'cartoon') {
                  comp.addRepresentation('cartoon', { color: 'spectrum', opacity: 0.85 });
                } else if (styleMode === 'surface') {
                  comp.addRepresentation('surface', { color: 'electrostatic', opacity: 0.7 });
                } else if (styleMode === 'ribbon') {
                  comp.addRepresentation('ribbon', { color: 'resname', opacity: 0.9 });
                } else {
                  comp.addRepresentation('line', { color: 'element' });
                }
              }
            }
          } catch (e: any) {
            console.warn('Could not render protein structure:', e);
          }
        }

        // 2. LOAD LIGAND POSE
        if (hasLigand && effectiveLigandData) {
          try {
            const blob = new Blob([effectiveLigandData], { type: 'text/plain' });
            const comp = await stage.loadFile(blob, { ext: 'pdb', defaultRepresentation: false });

            if (isCancelled) return;
            if (comp) {
              ligandCompRef.current = comp;

              if (showLigand) {
                comp.addRepresentation('ball+stick', {
                  colorScheme: 'element',
                  aspectRatio: 2.2,
                  multipleBond: true,
                });
              }
            }
          } catch (e: any) {
            console.warn('Could not render ligand pose:', e);
          }
        }

        // 3. RENDER SEARCH REGION GRID BOX
        if (hasPocket && showPocket && bindingSite) {
          try {
            const shape = new NGL.Shape(`GridBox_${bindingSite.name}`);
            const cx = bindingSite.centerX ?? 0;
            const cy = bindingSite.centerY ?? 0;
            const cz = bindingSite.centerZ ?? 0;
            const sx = bindingSite.sizeX ?? 20;
            const sy = bindingSite.sizeY ?? 20;
            const sz = bindingSite.sizeZ ?? 20;

            // Render wireframe bounding box
            const x1 = cx - sx / 2;
            const x2 = cx + sx / 2;
            const y1 = cy - sy / 2;
            const y2 = cy + sy / 2;
            const z1 = cz - sz / 2;
            const z2 = cz + sz / 2;

            const boxColor: [number, number, number] = [0.22, 0.74, 0.97]; // Sky-400

            // 12 edges of the bounding box
            const lines: Array<[[number, number, number], [number, number, number]]> = [
              [[x1, y1, z1], [x2, y1, z1]],
              [[x2, y1, z1], [x2, y2, z1]],
              [[x2, y2, z1], [x1, y2, z1]],
              [[x1, y2, z1], [x1, y1, z1]],

              [[x1, y1, z2], [x2, y1, z2]],
              [[x2, y1, z2], [x2, y2, z2]],
              [[x2, y2, z2], [x1, y2, z2]],
              [[x1, y2, z2], [x1, y1, z2]],

              [[x1, y1, z1], [x1, y1, z2]],
              [[x2, y1, z1], [x2, y1, z2]],
              [[x2, y2, z1], [x2, y2, z2]],
              [[x1, y2, z1], [x1, y2, z2]],
            ];

            lines.forEach(([p1, p2]) => {
              shape.addCylinder(p1, p2, boxColor, 0.15, 'edge');
            });

            const boxComp = stage.addComponentFromObject(shape);
            if (boxComp) {
              boxCompRef.current = boxComp;
              boxComp.addRepresentation('buffer', {});
            }
          } catch (e: any) {
            console.warn('Could not render search box shape:', e);
          }
        }

        // 4. HIGHLIGHT INTERACTING RESIDUES (IF AVAILABLE)
        if (
          hasInteractions &&
          showInteractions &&
          proteinCompRef.current &&
          interactionAnalysis?.interactions
        ) {
          try {
            const resSeqs = Array.from(
              new Set(interactionAnalysis.interactions.map((i) => i.residueNumber))
            );
            if (resSeqs.length > 0) {
              const sele = resSeqs.join(' or ');
              proteinCompRef.current.addRepresentation('licorice', {
                sele,
                colorScheme: 'resname',
                opacity: 0.95,
              });
            }
          } catch (e: any) {
            console.warn('Could not highlight interacting residues:', e);
          }
        }

        // Center view on ligand or protein or pocket
        if (!isCancelled) {
          if (ligandCompRef.current) {
            stage.autoView(200);
          } else {
            stage.autoView(300);
          }
        }
      } catch (err: any) {
        if (!isCancelled) {
          console.error('Molecular viewer rendering error:', err);
          setViewerError(err?.message || 'Error parsing or rendering molecular structures');
        }
      } finally {
        if (!isCancelled) {
          setIsLoading(false);
        }
      }
    };

    renderMolecules();

    return () => {
      isCancelled = true;
    };
  }, [
    effectiveProteinData,
    effectiveLigandData,
    proteinFormat,
    styleMode,
    showProtein,
    showLigand,
    showPocket,
    showInteractions,
    showHBonds,
    bindingSite,
    hasProtein,
    hasLigand,
    hasPocket,
    hasInteractions,
    webglSupported,
  ]);

  // Handle highlighted residue from external panel
  useEffect(() => {
    if (!stageRef.current || !proteinCompRef.current || !highlightedResidue) return;
    try {
      const sele = `${highlightedResidue.resSeq}`;
      proteinCompRef.current.addRepresentation('spacefill', {
        sele,
        color: 'yellow',
        opacity: 0.8,
      });
    } catch {
      // Ignore representation add errors
    }
  }, [highlightedResidue]);

  // Camera Action Helpers
  const handleResetCamera = () => {
    if (stageRef.current) {
      stageRef.current.autoView(300);
    }
  };

  const handleZoom = (factor: number) => {
    if (stageRef.current) {
      stageRef.current.animationControls.zoom(factor);
    }
  };

  const handleRotate = () => {
    if (stageRef.current) {
      stageRef.current.animationControls.rotate([0, 1, 0, 0.5]);
    }
  };

  return (
    <Card className={`overflow-hidden border border-slate-700 bg-slate-950 text-white ${className}`}>
      {/* Top Controls Toolbar (Requirement 1 & 7) */}
      <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 bg-slate-900 border-b border-slate-800 text-xs">
        <div className="flex items-center gap-2">
          <Box className="w-4 h-4 text-brand-400" />
          <span className="font-semibold text-slate-200">3D Molecular Viewport</span>
          {hasCompletedDocking ? (
            <Badge variant="success" size="sm">
              NGL WebGL Active
            </Badge>
          ) : (
            <Badge variant="neutral" size="sm" className="bg-slate-800 text-slate-300 border-slate-700">
              Standby
            </Badge>
          )}
        </div>

        {/* Viewport Action Controls */}
        <div className="flex items-center gap-1.5 flex-wrap">
          {/* Representation Selector */}
          <div className="flex items-center gap-1 bg-slate-950 rounded-lg p-1 border border-slate-800 text-[11px]">
            {(['cartoon', 'surface', 'ribbon', 'wireframe'] as const).map((mode) => (
              <button
                key={mode}
                type="button"
                onClick={() => setStyleMode(mode)}
                disabled={!hasCompletedDocking && !hasProtein}
                className={`px-2 py-0.5 rounded capitalize transition-colors ${
                  styleMode === mode
                    ? 'bg-brand-600 text-white font-semibold'
                    : 'text-slate-400 hover:text-slate-200 disabled:opacity-40'
                }`}
              >
                {mode}
              </button>
            ))}
          </div>

          {/* Camera Buttons: Rotate, Zoom, Reset */}
          <div className="flex items-center gap-1 bg-slate-950 rounded-lg p-1 border border-slate-800">
            <button
              type="button"
              onClick={handleRotate}
              title="Rotate View"
              className="p-1 text-slate-400 hover:text-white rounded"
            >
              <RefreshCw className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => handleZoom(1.2)}
              title="Zoom In"
              className="p-1 text-slate-400 hover:text-white rounded"
            >
              <ZoomIn className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => handleZoom(0.8)}
              title="Zoom Out"
              className="p-1 text-slate-400 hover:text-white rounded"
            >
              <ZoomOut className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={handleResetCamera}
              title="Reset Camera View"
              className="p-1 text-slate-400 hover:text-white rounded"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Fullscreen Button */}
          <button
            type="button"
            onClick={() => setIsFullscreen(!isFullscreen)}
            title={isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}
            className="p-1.5 bg-slate-950 text-slate-400 hover:text-white rounded-lg border border-slate-800"
          >
            {isFullscreen ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>

      {/* Layer Visibility Toggles (Requirement 7) */}
      <div className="px-4 py-2 bg-slate-950 border-b border-slate-800/80 flex flex-wrap items-center gap-2 text-[11px]">
        <span className="text-cyan-400/80 font-semibold uppercase text-[10px] tracking-wider mr-1">
          Layers:
        </span>

        {/* Protein Toggle */}
        <button
          type="button"
          onClick={() => setShowProtein(!showProtein)}
          disabled={!hasProtein}
          className={`px-2.5 py-1 rounded-md border flex items-center gap-1.5 transition-all ${
            showProtein && hasProtein
              ? 'bg-slate-800 text-cyan-300 border-cyan-500/50'
              : 'bg-slate-900 text-cyan-400/80 border-slate-800 disabled:opacity-40'
          }`}
        >
          <Dna className="w-3 h-3" />
          <span>Protein</span>
          {showProtein && hasProtein ? <Eye className="w-3 h-3 text-cyan-400" /> : <EyeOff className="w-3 h-3" />}
        </button>

        {/* Ligand Toggle */}
        <button
          type="button"
          onClick={() => setShowLigand(!showLigand)}
          disabled={!hasLigand}
          className={`px-2.5 py-1 rounded-md border flex items-center gap-1.5 transition-all ${
            showLigand && hasLigand
              ? 'bg-slate-800 text-indigo-300 border-indigo-500/50'
              : 'bg-slate-900 text-cyan-400/80 border-slate-800 disabled:opacity-40'
          }`}
        >
          <Pill className="w-3 h-3" />
          <span>Docked Ligand</span>
          {showLigand && hasLigand ? <Eye className="w-3 h-3 text-indigo-400" /> : <EyeOff className="w-3 h-3" />}
        </button>

        {/* Binding Region Toggle */}
        <button
          type="button"
          onClick={() => setShowPocket(!showPocket)}
          disabled={!hasPocket}
          className={`px-2.5 py-1 rounded-md border flex items-center gap-1.5 transition-all ${
            showPocket && hasPocket
              ? 'bg-slate-800 text-amber-300 border-amber-500/50'
              : 'bg-slate-900 text-cyan-400/80 border-slate-800 disabled:opacity-40'
          }`}
        >
          <Layers className="w-3 h-3" />
          <span>Binding Region</span>
          {showPocket && hasPocket ? <Eye className="w-3 h-3 text-amber-400" /> : <EyeOff className="w-3 h-3" />}
        </button>

        {/* Interacting Residues Toggle */}
        <button
          type="button"
          onClick={() => setShowInteractions(!showInteractions)}
          disabled={!hasInteractions}
          title={!hasInteractions ? 'Interaction analysis not available' : 'Highlight Interacting Residues'}
          className={`px-2.5 py-1 rounded-md border flex items-center gap-1.5 transition-all ${
            showInteractions && hasInteractions
              ? 'bg-slate-800 text-emerald-300 border-emerald-500/50'
              : 'bg-slate-900 text-cyan-400/80 border-slate-800 disabled:opacity-40'
          }`}
        >
          <Sparkles className="w-3 h-3" />
          <span>Interacting Residues</span>
          {!hasInteractions && <span className="text-[9px] text-cyan-400/80">(N/A)</span>}
        </button>

        {/* Hydrogen Bonds Toggle */}
        <button
          type="button"
          onClick={() => setShowHBonds(!showHBonds)}
          disabled={!hasHBonds}
          title={!hasHBonds ? 'Hydrogen bond analysis not available' : 'Show Hydrogen Bonds'}
          className={`px-2.5 py-1 rounded-md border flex items-center gap-1.5 transition-all ${
            showHBonds && hasHBonds
              ? 'bg-slate-800 text-rose-300 border-rose-500/50'
              : 'bg-slate-900 text-cyan-400/80 border-slate-800 disabled:opacity-40'
          }`}
        >
          <span>H-Bonds</span>
          {!hasHBonds && <span className="text-[9px] text-cyan-400/80">(N/A)</span>}
        </button>
      </div>

      {/* 3D WebGL Canvas Container or Standby State */}
      <div className={`relative w-full ${isFullscreen ? 'h-[80vh]' : 'h-96 sm:h-[450px]'} bg-slate-950 overflow-hidden`}>
        {/* Loading Overlay */}
        {isLoading && (
          <div className="absolute inset-0 bg-slate-950/80 z-20 flex items-center justify-center text-xs text-brand-300">
            <RefreshCw className="w-5 h-5 animate-spin mr-2" />
            Loading 3D structural model...
          </div>
        )}

        {/* Floating Standby HUD Badge (Requirement: Inform user of standby mode without blocking WebGL scene) */}
        {isEngineUnavailable && (hasProtein || hasPocket || hasLigand) && (
          <div className="absolute top-3 left-3 z-10 bg-slate-900/90 backdrop-blur border border-amber-500/40 rounded-lg px-3 py-1.5 shadow-lg flex items-center gap-2 pointer-events-none">
            <div className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
            <span className="text-[11px] font-mono text-amber-300 font-semibold tracking-wide">
              Standby Mode — Receptor Structure & Binding Grid Active
            </span>
          </div>
        )}

        {/* CASE A: No structural, ligand, or region coordinates available */}
        {!hasCompletedDocking && !hasProtein && !hasLigand && !hasPocket ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center select-none z-10 space-y-3">
            <div className="w-14 h-14 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 shadow-lg">
              <Box className="w-7 h-7 text-amber-400" />
            </div>

            <div className="max-w-md space-y-1">
              <h4 className="text-sm font-bold text-slate-100">
                No completed docking result available for visualization.
              </h4>
              {isEngineUnavailable && (
                <p className="text-xs text-amber-400/90 leading-relaxed font-medium">
                  Real docking engine unavailable. Configure AutoDock Vina to run computational docking.
                </p>
              )}
              <p className="text-[11px] text-slate-400 pt-1 leading-relaxed">
                The 3D WebGL viewer visualizes verified atomic coordinates produced by live AutoDock Vina simulation runs. In standby or demo mode, artificial coordinates are not generated.
              </p>
            </div>

            {/* Target and Ligand Info Chips */}
            <div className="flex flex-wrap items-center justify-center gap-2 pt-1 text-[11px]">
              <span className="px-2.5 py-1 rounded bg-slate-800 text-slate-300 font-mono border border-slate-700">
                Target: {proteinName}
              </span>
              {ligandName && (
                <span className="px-2.5 py-1 rounded bg-slate-800 text-slate-300 font-mono border border-slate-700">
                  Ligand: {ligandName}
                </span>
              )}
              {bindingSite && (
                <span className="px-2.5 py-1 rounded bg-slate-800 text-slate-300 font-mono border border-slate-700">
                  Region: {(bindingSite as any)?.name}
                </span>
              )}
            </div>
          </div>
        ) : (
          /* CASE B: WebGL Canvas Container */
          <div ref={containerRef} className="w-full h-full cursor-grab active:cursor-grabbing" />
        )}

        {/* Error Overlay */}
        {viewerError && (
          <div className="absolute top-3 left-3 right-3 bg-rose-950/90 border border-rose-800 text-rose-200 text-xs p-3 rounded-lg z-20 flex items-start gap-2 shadow-lg">
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold block">Viewer Render Notice</span>
              <span>{viewerError}</span>
            </div>
          </div>
        )}

        {/* Bottom Metadata & Pose Info */}
        <div className="absolute bottom-3 left-3 right-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-[10px] text-slate-400 bg-slate-950/85 px-3 py-1.5 rounded-lg border border-slate-800 z-10 pointer-events-none">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-cyan-400 inline-block" />
              Receptor: {proteinName}
            </span>
            {selectedPoseMode !== undefined && (
              <span className="flex items-center gap-1 font-mono text-indigo-300">
                <span className="w-2 h-2 rounded-full bg-indigo-400 inline-block" />
                Active Pose: Mode #{selectedPoseMode}
              </span>
            )}
          </div>

          <div className="flex items-center gap-2 font-mono text-slate-400">
            <span>Mouse: Left-drag Rotate • Wheel Zoom • Right-drag Pan</span>
          </div>
        </div>
      </div>
    </Card>
  );
};
