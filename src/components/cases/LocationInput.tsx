import React from 'react';
import { MapPin, Navigation, Compass } from 'lucide-react';
import type { CaseLocation } from '../../types';

interface LocationInputProps {
  value: CaseLocation;
  onChange: (value: CaseLocation) => void;
  disabled?: boolean;
  error?: string;
}

export const LocationInput: React.FC<LocationInputProps> = ({
  value,
  onChange,
  disabled = false,
  error,
}) => {
  const handleAddressChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange({
      ...value,
      address: e.target.value,
    });
  };

  const handleLatitudeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value === '' ? undefined : parseFloat(e.target.value);
    onChange({
      ...value,
      latitude: isNaN(val as number) ? undefined : val,
    });
  };

  const handleLongitudeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value === '' ? undefined : parseFloat(e.target.value);
    onChange({
      ...value,
      longitude: isNaN(val as number) ? undefined : val,
    });
  };

  // Safe manual simulation button that does NOT trigger browser navigator.geolocation prompt
  const handleSimulateFieldFix = () => {
    // Dallas / North Texas forensic checkpoint demo coordinates
    onChange({
      ...value,
      latitude: 32.7767,
      longitude: -96.797,
      address: value.address || 'Mile Marker 142, Northbound I-35 Corridor',
    });
  };

  return (
    <div className="space-y-3">
      {/* Address / Location Name */}
      <div>
        <label className="block text-xs font-semibold uppercase tracking-wider text-cyan-300 mb-1">
          Scene / Incident Address or Checkpoint *
        </label>
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
            <MapPin className="w-4 h-4" />
          </div>
          <input
            type="text"
            value={value.address || ''}
            onChange={handleAddressChange}
            disabled={disabled}
            placeholder="e.g. Checkpoint North, Dock 4 Terminal Logistics, or Mile Marker 142"
            className={`w-full pl-9 pr-3.5 py-2.5 bg-navy-950/60 border rounded-lg text-sm text-cyan-50 placeholder-slate-400 focus:bg-navy-900/40 backdrop-blur-md focus:outline-none focus:ring-2 focus:ring-brand-500 transition-all ${
              error ? 'border-rose-300 ring-1 ring-rose-300' : 'border-cyan-400/40'
            }`}
          />
        </div>
        {error && <span className="text-[11px] text-rose-600 mt-1 block">{error}</span>}
      </div>

      {/* GPS Coordinates (Manual Fields) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
        <div>
          <label className="block text-[11px] font-semibold uppercase tracking-wider text-cyan-400/80 mb-1">
            Latitude (Decimal Degrees)
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
              <Compass className="w-3.5 h-3.5" />
            </div>
            <input
              type="number"
              step="0.0001"
              min="-90"
              max="90"
              value={value.latitude !== undefined ? value.latitude : ''}
              onChange={handleLatitudeChange}
              disabled={disabled}
              placeholder="e.g. 32.7767"
              className="w-full pl-9 pr-3.5 py-2 bg-navy-950/60 border border-cyan-400/40 rounded-lg text-xs font-mono text-cyan-50 placeholder-slate-400 focus:bg-navy-900/40 backdrop-blur-md focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>
        </div>

        <div>
          <label className="block text-[11px] font-semibold uppercase tracking-wider text-cyan-400/80 mb-1">
            Longitude (Decimal Degrees)
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
              <Compass className="w-3.5 h-3.5" />
            </div>
            <input
              type="number"
              step="0.0001"
              min="-180"
              max="180"
              value={value.longitude !== undefined ? value.longitude : ''}
              onChange={handleLongitudeChange}
              disabled={disabled}
              placeholder="e.g. -96.7970"
              className="w-full pl-9 pr-3.5 py-2 bg-navy-950/60 border border-cyan-400/40 rounded-lg text-xs font-mono text-cyan-50 placeholder-slate-400 focus:bg-navy-900/40 backdrop-blur-md focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>
        </div>
      </div>

      {/* Manual Entry Notice & Testing Convenience */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-2.5 rounded-lg bg-navy-950/60 border border-cyan-500/30 text-[11px] text-cyan-400/80">
        <div className="flex items-center gap-1.5">
          <Navigation className="w-3.5 h-3.5 text-slate-400 shrink-0" />
          <span>Manual entry mode enabled. Browser tracking is disabled by default for operational security.</span>
        </div>
        {!disabled && (
          <button
            type="button"
            onClick={handleSimulateFieldFix}
            className="text-brand-600 hover:text-brand-700 font-semibold shrink-0 underline text-[11px]"
          >
            Insert Demo GPS Coordinates
          </button>
        )}
      </div>
    </div>
  );
};
