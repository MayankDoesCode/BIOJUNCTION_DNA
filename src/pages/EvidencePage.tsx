import React, { useEffect, useState } from 'react';
import {
  Shield,
  Search,
  Lock,
  MapPin,
  Clock,
  ShieldCheck,
} from 'lucide-react';
import { PageHeader } from '../components/common/PageHeader';
import { Card, CardHeader, CardContent } from '../components/common/Card';
import { Badge } from '../components/common/Badge';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import { EmptyState } from '../components/common/EmptyState';
import { evidenceRepository } from '../database/repositories/evidenceRepository';
import { formatDate } from '../utils/formatters';
import type { Evidence } from '../types';

export const EvidencePage: React.FC = () => {
  const [evidenceList, setEvidenceList] = useState<Evidence[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    const fetchEvidence = async () => {
      try {
        const data = await evidenceRepository.getAll();
        setEvidenceList(data);
      } catch (err) {
        console.error('Failed to load evidence', err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchEvidence();
  }, []);

  const filteredEvidence = evidenceList.filter(
    (e) =>
      e.evidenceTag.toLowerCase().includes(searchQuery.toLowerCase()) ||
      e.barcode.toLowerCase().includes(searchQuery.toLowerCase()) ||
      e.sealNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      e.storageLocation.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (isLoading) {
    return <LoadingSpinner label="Verifying chain of custody vaults..." className="h-80" />;
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Evidence & Chain of Custody"
        subtitle="Forensic evidence security, tamper-evident seals, and unbroken transfer verification"
        badge={
          <Badge variant="neutral" size="md">
            {filteredEvidence.length} Items Logged
          </Badge>
        }
      />

      {/* Security Banner */}
      <div className="bg-slate-900 text-slate-300 p-4 rounded-xl border border-slate-800 flex items-start gap-3 text-xs">
        <ShieldCheck className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
        <div className="leading-relaxed">
          <span className="font-semibold text-white block mb-0.5">
            Tamper-Evident Custody Verification
          </span>
          All evidence items cataloged in this repository have cryptographic timestamps and tamper seal references. Any physical bag transfer must be preceded by seal integrity inspection and dual-signature entry.
        </div>
      </div>

      {/* Search Bar */}
      <div className="bg-navy-900/40 backdrop-blur-md p-4 rounded-xl border border-cyan-500/30 shadow-subtle flex flex-col sm:flex-row gap-3 items-center justify-between">
        <div className="relative w-full sm:w-96">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search by Evidence Tag, Barcode, Seal #..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-navy-950/60 border border-cyan-500/30 rounded-lg text-xs sm:text-sm text-cyan-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:bg-navy-900/40 backdrop-blur-md"
          />
        </div>
      </div>

      {filteredEvidence.length === 0 ? (
        <EmptyState
          icon={Shield}
          title="No Evidence Records Found"
          description="No evidence tags match your search query."
          actionLabel="Clear Search"
          onAction={() => setSearchQuery('')}
        />
      ) : (
        <div className="space-y-4">
          {filteredEvidence.map((evi) => (
            <Card key={evi.id} className="overflow-hidden">
              <CardHeader className="bg-navy-950/60/70 py-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 w-full">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-brand-50 text-brand-700 flex items-center justify-center font-bold">
                      <Lock className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="font-mono text-sm font-bold text-cyan-50">
                        {evi.evidenceTag}
                      </span>
                      <span className="text-xs text-slate-400 ml-2 font-mono">
                        Barcode: {evi.barcode}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={evi.sealed ? 'success' : 'danger'} size="sm" dot>
                      {evi.sealed ? `Sealed (${evi.sealNumber})` : 'Unsealed'}
                    </Badge>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4 pt-4 text-xs">
                <div className="flex flex-wrap items-center gap-4 text-cyan-300 bg-navy-950/60 p-2.5 rounded-lg border border-slate-100">
                  <div className="flex items-center gap-1.5">
                    <MapPin className="w-4 h-4 text-slate-400" />
                    <span>Location: <strong className="text-cyan-100">{evi.storageLocation}</strong></span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Clock className="w-4 h-4 text-slate-400" />
                    <span>Created: {formatDate(evi.createdAt)}</span>
                  </div>
                </div>

                <div>
                  <h4 className="font-semibold text-cyan-100 uppercase tracking-wider text-[10px] mb-2">
                    Chain of Custody History ({evi.chainOfCustody.length} Transfer Events)
                  </h4>
                  <div className="border border-cyan-500/30 rounded-lg divide-y divide-slate-100 overflow-hidden">
                    {evi.chainOfCustody.map((entry, idx) => (
                      <div key={idx} className="p-3 bg-navy-900/40 backdrop-blur-md hover:bg-navy-950/60/50 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <div>
                          <div className="font-semibold text-cyan-100">{entry.action}</div>
                          <div className="text-[11px] text-cyan-400/80 mt-0.5">
                            Handled by: <span className="font-medium text-cyan-200">{entry.performedBy}</span>
                            {entry.destinationLocation && ` → ${entry.destinationLocation}`}
                          </div>
                          {entry.notes && (
                            <div className="text-[11px] text-cyan-400/80 italic mt-0.5">
                              "{entry.notes}"
                            </div>
                          )}
                        </div>
                        <div className="text-[11px] font-mono text-slate-400 shrink-0">
                          {formatDate(entry.timestamp)}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};
