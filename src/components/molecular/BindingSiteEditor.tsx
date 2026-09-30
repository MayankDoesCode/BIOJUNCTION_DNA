import React from 'react';
import { Crosshair, AlertCircle, Info } from 'lucide-react';
import type { BindingSite } from '../../types';

interface BindingSiteEditorProps {
  value: BindingSite;
  onChange: (value: BindingSite) => void;
  errors?: Record<string, string>;
  disabled?: boolean;
}

export const BindingSiteEditor: React.FC<BindingSiteEditorProps> = ({
  value,
  onChange,
  errors = {},
  disabled = false,
}) => {
  const handleCoordChange = (field: keyof BindingSite, rawVal: string) => {
    const num = parseFloat(rawVal);
    onChange({
      ...value,
      [field]: isNaN(num) ? 0 : num,
    });
  };

  const applyPreset = (preset: {
    name: string;
    description: string;
    centerX: number;
    centerY: number;
    centerZ: number;
    sizeX: number;
    sizeY: number;
    sizeZ: number;
  }) => {
    onChange({
      ...value,
      ...preset,
    });
  };

  return (
    <div className="space-y-4">
      {/* Site Name & Description */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-cyan-300 mb-1">
            Binding Site Identifier *
          </label>
          <input
            type="text"
            value={value.name}
            onChange={(e) => onChange({ ...value, name: e.target.value })}
            disabled={disabled}
            placeholder="e.g., Primary Catalytic Cavity (Cys145-His41)"
            className={`w-full px-3.5 py-2.5 bg-navy-950/60 border rounded-lg text-sm text-cyan-100 placeholder-slate-400 focus:bg-navy-900/40 backdrop-blur-md focus:outline-none focus:ring-2 focus:ring-brand-500 transition-all ${
              errors.name ? 'border-rose-400 ring-1 ring-rose-400' : 'border-cyan-400/40'
            }`}
          />
          {errors.name && (
            <span className="text-[11px] text-rose-600 mt-1 flex items-center gap-1">
              <AlertCircle className="w-3 h-3 shrink-0" />
              {errors.name}
            </span>
          )}
        </div>

        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-cyan-300 mb-1">
            Site Description / Target Notes
          </label>
          <input
            type="text"
            value={value.description || ''}
            onChange={(e) => onChange({ ...value, description: e.target.value })}
            disabled={disabled}
            placeholder="e.g., S1/S2 subsites containing catalytic dyad residues"
            className="w-full px-3.5 py-2.5 bg-navy-950/60 border border-cyan-400/40 rounded-lg text-sm text-cyan-100 placeholder-slate-400 focus:bg-navy-900/40 backdrop-blur-md focus:outline-none focus:ring-2 focus:ring-brand-500 transition-all"
          />
        </div>
      </div>

      {/* Grid Box Search Region Parameters */}
      <div className="p-4 bg-navy-950/60 rounded-xl border border-cyan-500/30 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Crosshair className="w-4 h-4 text-brand-600" />
            <h4 className="text-xs font-bold uppercase tracking-wider text-cyan-200">
              Grid Search Volume (Ångströms)
            </h4>
          </div>

          {/* Quick Presets */}
          {!disabled && (
            <div className="flex items-center gap-2 text-xs">
              <span className="text-[11px] text-slate-400 font-medium">Presets:</span>
              <button
                type="button"
                onClick={() =>
                  applyPreset({
                    name: 'SARS-CoV-2 Mpro Active Site',
                    description: 'Catalytic dyad Cys145 and His41 pocket centered on crystallographic inhibitor',
                    centerX: -10.5,
                    centerY: 12.3,
                    centerZ: 68.8,
                    sizeX: 22.0,
                    sizeY: 22.0,
                    sizeZ: 22.0,
                  })
                }
                className="text-[11px] text-brand-600 hover:text-brand-800 font-medium underline"
              >
                6LU7 Mpro Pocket
              </button>
              <span>•</span>
              <button
                type="button"
                onClick={() =>
                  applyPreset({
                    name: 'HIV-1 Protease Active Cavity',
                    description: 'Asp25/Asp25 catalytic aspartates at the homodimer interface',
                    centerX: 16.0,
                    centerY: 25.0,
                    centerZ: 4.0,
                    sizeX: 20.0,
                    sizeY: 20.0,
                    sizeZ: 20.0,
                  })
                }
                className="text-[11px] text-brand-600 hover:text-brand-800 font-medium underline"
              >
                1HSG Protease Pocket
              </button>
            </div>
          )}
        </div>

        {/* Center Coordinates X, Y, Z */}
        <div>
          <span className="block text-[11px] font-semibold uppercase text-cyan-400/80 mb-1.5">
            Search Center Coordinates (X, Y, Z in Å)
          </span>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="text-[10px] text-slate-400 block mb-0.5">Center X</label>
              <input
                type="number"
                step="0.1"
                value={value.centerX}
                onChange={(e) => handleCoordChange('centerX', e.target.value)}
                disabled={disabled}
                className="w-full px-3 py-2 bg-navy-900/40 backdrop-blur-md border border-cyan-400/40 rounded-lg text-xs font-mono text-cyan-100 focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
            </div>
            <div>
              <label className="text-[10px] text-slate-400 block mb-0.5">Center Y</label>
              <input
                type="number"
                step="0.1"
                value={value.centerY}
                onChange={(e) => handleCoordChange('centerY', e.target.value)}
                disabled={disabled}
                className="w-full px-3 py-2 bg-navy-900/40 backdrop-blur-md border border-cyan-400/40 rounded-lg text-xs font-mono text-cyan-100 focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
            </div>
            <div>
              <label className="text-[10px] text-slate-400 block mb-0.5">Center Z</label>
              <input
                type="number"
                step="0.1"
                value={value.centerZ}
                onChange={(e) => handleCoordChange('centerZ', e.target.value)}
                disabled={disabled}
                className="w-full px-3 py-2 bg-navy-900/40 backdrop-blur-md border border-cyan-400/40 rounded-lg text-xs font-mono text-cyan-100 focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
            </div>
          </div>
        </div>

        {/* Grid Box Dimensions Size X, Y, Z */}
        <div>
          <span className="block text-[11px] font-semibold uppercase text-cyan-400/80 mb-1.5">
            Box Dimensions (Size X, Y, Z in Å)
          </span>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="text-[10px] text-slate-400 block mb-0.5">Size X (Å)</label>
              <input
                type="number"
                step="1"
                min="5"
                max="60"
                value={value.sizeX}
                onChange={(e) => handleCoordChange('sizeX', e.target.value)}
                disabled={disabled}
                className="w-full px-3 py-2 bg-navy-900/40 backdrop-blur-md border border-cyan-400/40 rounded-lg text-xs font-mono text-cyan-100 focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
            </div>
            <div>
              <label className="text-[10px] text-slate-400 block mb-0.5">Size Y (Å)</label>
              <input
                type="number"
                step="1"
                min="5"
                max="60"
                value={value.sizeY}
                onChange={(e) => handleCoordChange('sizeY', e.target.value)}
                disabled={disabled}
                className="w-full px-3 py-2 bg-navy-900/40 backdrop-blur-md border border-cyan-400/40 rounded-lg text-xs font-mono text-cyan-100 focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
            </div>
            <div>
              <label className="text-[10px] text-slate-400 block mb-0.5">Size Z (Å)</label>
              <input
                type="number"
                step="1"
                min="5"
                max="60"
                value={value.sizeZ}
                onChange={(e) => handleCoordChange('sizeZ', e.target.value)}
                disabled={disabled}
                className="w-full px-3 py-2 bg-navy-900/40 backdrop-blur-md border border-cyan-400/40 rounded-lg text-xs font-mono text-cyan-100 focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
            </div>
          </div>
          {errors.dimensions && (
            <span className="text-[11px] text-rose-600 mt-1.5 block">{errors.dimensions}</span>
          )}
        </div>
      </div>

      {/* Scientific Validation Disclaimer */}
      <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg flex items-start gap-2.5 text-xs text-amber-900">
        <Info className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
        <span className="leading-relaxed">
          <strong>Computational Boundary Notice:</strong> The entered search volume defines the numerical space explored by the docking algorithm. Specifying coordinates does not automatically establish that this region is a biologically validated binding pocket. Confirmatory crystallographic or mutagenic evidence is required.
        </span>
      </div>
    </div>
  );
};
