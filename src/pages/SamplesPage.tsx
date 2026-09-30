import React, { useEffect, useState } from 'react';
import {
  Package,
  Search,
  Plus,
  MapPin,
} from 'lucide-react';
import { PageHeader } from '../components/common/PageHeader';
import { Card, CardHeader, CardContent } from '../components/common/Card';
import { Button } from '../components/common/Button';
import { Badge, type BadgeVariant } from '../components/common/Badge';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import { EmptyState } from '../components/common/EmptyState';
import { sampleRepository } from '../database/repositories/sampleRepository';
import { formatShortDate, formatStatusLabel } from '../utils/formatters';
import type { Sample, CustodyStatus, SamplePhysicalState } from '../types';

export const SamplesPage: React.FC = () => {
  const [samples, setSamples] = useState<Sample[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [custodyFilter, setCustodyFilter] = useState<string>('ALL');

  useEffect(() => {
    const fetchSamples = async () => {
      try {
        const data = await sampleRepository.getAll();
        setSamples(data);
      } catch (err) {
        console.error('Failed to load samples', err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchSamples();
  }, []);

  const getCustodyVariant = (status: CustodyStatus): BadgeVariant => {
    switch (status) {
      case 'FIELD_CUSTODY':
        return 'primary';
      case 'TRANSIT_TO_LAB':
        return 'warning';
      case 'SECURED_EVIDENCE_LOCKER':
        return 'success';
      case 'PROCESSED':
        return 'neutral';
      default:
        return 'default';
    }
  };

  const getPhysicalStateBadge = (state: SamplePhysicalState) => {
    return (
      <span className="font-mono text-[11px] bg-navy-800/60 text-cyan-200 px-2 py-0.5 rounded border border-cyan-500/30">
        {state}
      </span>
    );
  };

  const filteredSamples = samples.filter((s) => {
    const matchesCustody = custodyFilter === 'ALL' || s.custodyStatus === custodyFilter;
    const matchesQuery =
      s.sampleNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.packagingType.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCustody && matchesQuery;
  });

  if (isLoading) {
    return <LoadingSpinner label="Loading physical sample inventory..." className="h-80" />;
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Sample Intake & Inventory"
        subtitle="Forensic physical substance specimens cataloged in field operations"
        badge={
          <Badge variant="neutral" size="md">
            {filteredSamples.length} Samples
          </Badge>
        }
        actions={
          <Button
            variant="primary"
            onClick={() => {
              alert('Stage 2 Feature: Full guided sample logging and barcode wizard will be implemented in Stage 2.');
            }}
            leftIcon={<Plus className="w-4 h-4" />}
          >
            Register Sample
          </Button>
        }
      />

      {/* Filter and Search Bar */}
      <div className="bg-navy-900/40 backdrop-blur-md p-4 rounded-xl border border-cyan-500/30 shadow-subtle flex flex-col sm:flex-row gap-3 items-center justify-between">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search sample #, description..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-navy-950/60 border border-cyan-500/30 rounded-lg text-xs sm:text-sm text-cyan-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:bg-navy-900/40 backdrop-blur-md"
          />
        </div>

        <div className="flex items-center gap-2 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0">
          {['ALL', 'FIELD_CUSTODY', 'TRANSIT_TO_LAB', 'SECURED_EVIDENCE_LOCKER', 'PROCESSED'].map((st) => (
            <button
              key={st}
              onClick={() => setCustodyFilter(st)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors ${
                custodyFilter === st
                  ? 'bg-slate-900 text-white'
                  : 'bg-navy-800/60 text-cyan-300 hover:bg-slate-200'
              }`}
            >
              {st === 'ALL' ? 'All Custody' : formatStatusLabel(st)}
            </button>
          ))}
        </div>
      </div>

      {filteredSamples.length === 0 ? (
        <EmptyState
          icon={Package}
          title="No Samples Recorded"
          description="No forensic samples match your filter or search query."
          actionLabel="Clear Filters"
          onAction={() => {
            setCustodyFilter('ALL');
            setSearchQuery('');
          }}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredSamples.map((sample) => (
            <Card key={sample.id} className="hover:shadow-md transition-shadow">
              <CardHeader className="py-3.5">
                <div className="flex items-center justify-between w-full">
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-sm text-brand-600">
                      {sample.sampleNumber}
                    </span>
                  </div>
                  <Badge variant={getCustodyVariant(sample.custodyStatus)} size="sm">
                    {formatStatusLabel(sample.custodyStatus)}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-3 pt-4 text-xs">
                <div>
                  <span className="text-[10px] uppercase font-semibold text-slate-400 block mb-0.5">
                    Physical Appearance & State
                  </span>
                  <div className="flex items-center gap-2 mb-1">
                    {getPhysicalStateBadge(sample.physicalState)}
                    <span className="font-semibold text-cyan-100">
                      Approx. {sample.estimatedQuantity} {sample.unit}
                    </span>
                  </div>
                  <p className="text-cyan-300 leading-relaxed bg-navy-950/60 p-2 rounded border border-slate-100">
                    {sample.description}
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-2 pt-1 border-t border-slate-100">
                  <div>
                    <span className="text-[10px] uppercase text-slate-400 block">Packaging</span>
                    <span className="text-cyan-200 font-medium truncate block">
                      {sample.packagingType}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] uppercase text-slate-400 block">Collection Date</span>
                    <span className="text-cyan-200">{formatShortDate(sample.collectedAt)}</span>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 text-cyan-400/80 text-[11px]">
                  <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <span className="truncate">{sample.collectionLocation}</span>
                </div>

                {sample.notes && (
                  <p className="text-[11px] text-cyan-400/80 italic">
                    Note: {sample.notes}
                  </p>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};
