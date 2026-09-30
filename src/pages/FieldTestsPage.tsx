import React, { useEffect, useState } from 'react';
import {
  FlaskConical,
  Search,
  Plus,
  Thermometer,
  Camera,
  Eye,
} from 'lucide-react';
import { PageHeader } from '../components/common/PageHeader';
import { Card, CardHeader, CardContent } from '../components/common/Card';
import { Button } from '../components/common/Button';
import { Badge, type BadgeVariant } from '../components/common/Badge';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import { EmptyState } from '../components/common/EmptyState';
import { fieldTestRepository } from '../database/repositories/fieldTestRepository';
import { formatDate } from '../utils/formatters';
import type { FieldTest, TestResultOutcome } from '../types';

export const FieldTestsPage: React.FC = () => {
  const [tests, setTests] = useState<FieldTest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filterOutcome, setFilterOutcome] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTest, setSelectedTest] = useState<FieldTest | null>(null);

  useEffect(() => {
    const fetchTests = async () => {
      try {
        const data = await fieldTestRepository.getAll();
        setTests(data);
      } catch (err) {
        console.error('Failed to load field tests', err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchTests();
  }, []);

  const filteredTests = tests.filter((t) => {
    const matchesFilter = filterOutcome === 'ALL' || t.resultStatus === filterOutcome;
    const matchesQuery =
      t.testNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.kitType.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (t.presumptiveCategory && t.presumptiveCategory.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesFilter && matchesQuery;
  });

  const getOutcomeVariant = (outcome: TestResultOutcome): BadgeVariant => {
    switch (outcome) {
      case 'PRESUMPTIVE_POSITIVE':
        return 'warning';
      case 'PRESUMPTIVE_NEGATIVE':
        return 'success';
      case 'INCONCLUSIVE':
      case 'INVALID':
        return 'danger';
      default:
        return 'neutral';
    }
  };

  if (isLoading) {
    return <LoadingSpinner label="Loading field testing records..." className="h-80" />;
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Presumptive Field Tests"
        subtitle="Catalog and review preliminary chemical and immunoassay field drug screenings"
        badge={
          <Badge variant="neutral" size="md">
            {filteredTests.length} Tests
          </Badge>
        }
        actions={
          <Button
            variant="primary"
            onClick={() => {
              alert('Stage 2 Feature: Full guided test recording workflow will be activated in Stage 2.');
            }}
            leftIcon={<Plus className="w-4 h-4" />}
          >
            New Field Test
          </Button>
        }
      />

      {/* Advisory Banner */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 flex items-start gap-3 text-xs text-blue-900">
        <FlaskConical className="w-5 h-5 text-brand-600 shrink-0 mt-0.5" />
        <div className="leading-relaxed">
          <span className="font-semibold block text-cyan-50 mb-0.5">
            Presumptive Testing Protocol Notice
          </span>
          Field reagent ampoules and lateral flow strips provide rapid presumptive indicators only. Always record ambient temperature, expiration lots, and photographic evidence. Never inhale or taste unknown substances.
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-navy-900/40 backdrop-blur-md p-4 rounded-xl border border-cyan-500/30 shadow-subtle flex flex-col sm:flex-row gap-3 items-center justify-between">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search kit type or test number..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-navy-950/60 border border-cyan-500/30 rounded-lg text-xs sm:text-sm text-cyan-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:bg-navy-900/40 backdrop-blur-md"
          />
        </div>

        <div className="flex items-center gap-2 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0">
          {[
            { id: 'ALL', label: 'All Results' },
            { id: 'PRESUMPTIVE_POSITIVE', label: 'Presumptive Positive' },
            { id: 'PRESUMPTIVE_NEGATIVE', label: 'Presumptive Negative' },
            { id: 'INCONCLUSIVE', label: 'Inconclusive' },
          ].map((item) => (
            <button
              key={item.id}
              onClick={() => setFilterOutcome(item.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors ${
                filterOutcome === item.id
                  ? 'bg-slate-900 text-white'
                  : 'bg-navy-800/60 text-cyan-300 hover:bg-slate-200'
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>

      {/* Tests Grid */}
      {filteredTests.length === 0 ? (
        <EmptyState
          icon={FlaskConical}
          title="No Field Tests Found"
          description="No presumptive tests match the current filter or search criteria."
          actionLabel="Clear Filters"
          onAction={() => {
            setFilterOutcome('ALL');
            setSearchQuery('');
          }}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredTests.map((test) => (
            <Card key={test.id} className="hover:shadow-md transition-shadow">
              <CardHeader className="py-3.5">
                <div className="flex items-center justify-between w-full">
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-sm text-cyan-50">
                      {test.testNumber}
                    </span>
                    {test.photoAttached && (
                      <span className="p-1 rounded bg-navy-800/60 text-cyan-400/80" title="Photo Attached">
                        <Camera className="w-3.5 h-3.5" />
                      </span>
                    )}
                  </div>
                  <Badge variant={getOutcomeVariant(test.resultStatus)} size="sm">
                    {test.resultStatus === 'PRESUMPTIVE_POSITIVE'
                      ? 'Presumptive Positive'
                      : test.resultStatus.replace('_', ' ')}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-3 pt-4">
                <div>
                  <span className="text-[11px] font-semibold uppercase text-slate-400 block">
                    Kit / Methodology
                  </span>
                  <span className="text-sm font-medium text-cyan-100">{test.kitType}</span>
                </div>

                {test.presumptiveCategory && (
                  <div className="bg-navy-950/60 p-2.5 rounded-lg border border-slate-100">
                    <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 block">
                      Presumptive Substance Group
                    </span>
                    <span className="text-xs font-semibold text-cyan-50 mt-0.5 block">
                      {test.presumptiveCategory}
                    </span>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-2 text-xs pt-1">
                  <div>
                    <span className="text-[10px] uppercase text-slate-400 block">Conducted By</span>
                    <span className="text-cyan-200 font-medium">{test.performedBy}</span>
                  </div>
                  <div>
                    <span className="text-[10px] uppercase text-slate-400 block">Timestamp</span>
                    <span className="text-cyan-200">{formatDate(test.timestamp)}</span>
                  </div>
                </div>

                {test.temperatureCelsius !== undefined && (
                  <div className="flex items-center gap-1.5 text-xs text-cyan-400/80">
                    <Thermometer className="w-3.5 h-3.5 text-slate-400" />
                    <span>Ambient Temp: {test.temperatureCelsius}°C</span>
                    {test.confidenceRating && (
                      <span className="ml-auto text-[11px] text-slate-400">
                        Confidence: <strong className="text-cyan-200">{test.confidenceRating}</strong>
                      </span>
                    )}
                  </div>
                )}

                {test.notes && (
                  <p className="text-xs text-cyan-300 bg-navy-950/60/70 p-2 rounded border border-slate-100 italic">
                    "{test.notes}"
                  </p>
                )}

                <div className="pt-2 flex justify-end">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setSelectedTest(test)}
                    leftIcon={<Eye className="w-3.5 h-3.5" />}
                    className="text-xs"
                  >
                    View Test Details
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Selected Test Detail Modal */}
      {selectedTest && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-navy-900/40 backdrop-blur-md rounded-xl shadow-2xl border border-cyan-500/30 max-w-lg w-full p-6 animate-in fade-in duration-150">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <span className="font-mono text-xs text-brand-600 font-bold">
                  {selectedTest.testNumber}
                </span>
                <h3 className="text-base font-bold text-cyan-50">Field Test Record</h3>
              </div>
              <Badge variant={getOutcomeVariant(selectedTest.resultStatus)}>
                {selectedTest.resultStatus}
              </Badge>
            </div>

            <div className="py-4 space-y-3 text-xs">
              <div className="p-3 bg-navy-950/60 rounded-lg space-y-1.5">
                <div className="flex justify-between">
                  <span className="text-cyan-400/80">Methodology:</span>
                  <span className="font-medium text-cyan-100">{selectedTest.kitType}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-cyan-400/80">Presumptive Category:</span>
                  <span className="font-medium text-cyan-100">{selectedTest.presumptiveCategory || 'N/A'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-cyan-400/80">Confidence Rating:</span>
                  <span className="font-medium text-cyan-100">{selectedTest.confidenceRating || 'Standard'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-cyan-400/80">Field Operator:</span>
                  <span className="font-medium text-cyan-100">{selectedTest.performedBy}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-cyan-400/80">Logged Time:</span>
                  <span className="font-medium text-cyan-100">{formatDate(selectedTest.timestamp)}</span>
                </div>
              </div>

              {selectedTest.notes && (
                <div>
                  <span className="text-cyan-400/80 font-semibold block mb-1">Field Observation Notes</span>
                  <p className="bg-navy-950/60 p-2.5 rounded border border-slate-100 text-cyan-200">
                    {selectedTest.notes}
                  </p>
                </div>
              )}
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
              <Button variant="secondary" size="sm" onClick={() => setSelectedTest(null)}>
                Close
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
