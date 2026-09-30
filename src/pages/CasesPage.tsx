import React, { useEffect, useState, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Plus,
  Search,
  Filter,
  Briefcase,
  Calendar,
  User,
  Eye,
  Edit2,
  Archive,
  ArrowUpDown,
  RotateCcw,
  AlertTriangle,
  Clock,
  Layers,
  ChevronDown,
} from 'lucide-react';
import { PageHeader } from '../components/common/PageHeader';
import { Card } from '../components/common/Card';
import { Button } from '../components/common/Button';
import { Badge, type BadgeVariant } from '../components/common/Badge';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import { EmptyState } from '../components/common/EmptyState';
import { caseRepository } from '../database/repositories/caseRepository';
import { auditService } from '../services/auditService';
import { authService } from '../services/authService';
import { formatShortDate, formatStatusLabel } from '../utils/formatters';
import { getStatusBadgeVariant } from '../utils/caseWorkflow';
import { useAuth } from '../hooks/useAuth';
import { useToast } from '../hooks/useToast';
import type {
  Case,
  CasePriority,
  CaseSortField,
  CaseSortOption,
} from '../types';

export const CasesPage: React.FC = () => {
  const navigate = useNavigate();
  const { user, hasPermission } = useAuth();
  const { showToast } = useToast();

  const [cases, setCases] = useState<Case[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  // Filters State
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [priorityFilter, setPriorityFilter] = useState<string>('ALL');
  const [officerFilter, setOfficerFilter] = useState<string>('ALL');
  const [showArchived, setShowArchived] = useState(false);

  // Sort State
  const [sortOption, setSortOption] = useState<CaseSortOption>({
    field: 'createdAt',
    direction: 'desc',
  });

  // Archive Confirmation Modal State
  const [caseToArchive, setCaseToArchive] = useState<Case | null>(null);
  const [isArchiving, setIsArchiving] = useState(false);

  // Available Officers from system
  const availableOfficers = useMemo(() => authService.getAvailableDemoUsers(), []);

  const canCreate = hasPermission('CASE_CREATE');
  const canEdit = hasPermission('CASE_EDIT');
  const canDelete = hasPermission('CASE_DELETE');

  const fetchCases = useCallback(async () => {
    setIsLoading(true);
    setLoadError(null);
    try {
      const data = await caseRepository.getAll(showArchived);
      setCases(data);
    } catch (err) {
      console.error('Failed to load cases from offline database', err);
      setLoadError('Unable to access local database. Offline storage may need reinitialization.');
      showToast('Error reading case repository', 'error');
    } finally {
      setIsLoading(false);
    }
  }, [showArchived, showToast]);

  useEffect(() => {
    fetchCases();
  }, [fetchCases]);

  // Combined Search, Filter, and Sort
  const processedCases = useMemo(() => {
    let result = cases;

    // Filter by Archive state
    if (!showArchived) {
      result = result.filter((c) => !c.isArchived);
    }

    // Filter by Status
    if (statusFilter !== 'ALL') {
      result = result.filter((c) => c.status === statusFilter);
    }

    // Filter by Priority
    if (priorityFilter !== 'ALL') {
      result = result.filter((c) => c.priority === priorityFilter);
    }

    // Filter by Assigned Officer
    if (officerFilter !== 'ALL') {
      result = result.filter(
        (c) =>
          c.assignedOfficer === officerFilter ||
          c.leadOfficerName === officerFilter
      );
    }

    // Search Query (caseNumber, title, description, assignedOfficer)
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter((c) => {
        const matchNumber = c.caseNumber.toLowerCase().includes(q);
        const matchTitle = c.title.toLowerCase().includes(q);
        const matchDesc = (c.description || '').toLowerCase().includes(q);
        const matchOfficer = (c.assignedOfficer || c.leadOfficerName || '').toLowerCase().includes(q);
        const matchAddress = typeof c.location === 'object'
          ? (c.location.address || '').toLowerCase().includes(q)
          : (c.location || '').toLowerCase().includes(q);

        return matchNumber || matchTitle || matchDesc || matchOfficer || matchAddress;
      });
    }

    // Sort using repository helper
    return caseRepository.sortCases(result, sortOption);
  }, [cases, showArchived, statusFilter, priorityFilter, officerFilter, searchQuery, sortOption]);

  const handleSortToggle = (field: CaseSortField) => {
    setSortOption((prev) => {
      if (prev.field === field) {
        return {
          field,
          direction: prev.direction === 'asc' ? 'desc' : 'asc',
        };
      }
      return {
        field,
        direction: field === 'caseNumber' || field === 'title' ? 'asc' : 'desc',
      };
    });
  };

  const clearAllFilters = () => {
    setSearchQuery('');
    setStatusFilter('ALL');
    setPriorityFilter('ALL');
    setOfficerFilter('ALL');
    setShowArchived(false);
  };

  const hasActiveFilters =
    searchQuery.trim() !== '' ||
    statusFilter !== 'ALL' ||
    priorityFilter !== 'ALL' ||
    officerFilter !== 'ALL' ||
    showArchived;

  const handleArchiveConfirm = async () => {
    if (!caseToArchive) return;
    setIsArchiving(true);
    try {
      await caseRepository.archiveCase(caseToArchive.id);

      await auditService.record(
        'CASE_ARCHIVED',
        'Case',
        caseToArchive.id,
        `Case ${caseToArchive.caseNumber} archived by ${user?.fullName || 'Authorized Operator'}. Chain of custody records preserved.`
      );

      showToast(`Case ${caseToArchive.caseNumber} moved to archive`, 'success');
      setCaseToArchive(null);
      await fetchCases();
    } catch (err) {
      console.error('Failed to archive case', err);
      showToast('Error archiving case in local database', 'error');
    } finally {
      setIsArchiving(false);
    }
  };

  const getPriorityVariant = (priority: CasePriority): BadgeVariant => {
    switch (priority) {
      case 'CRITICAL':
        return 'danger';
      case 'HIGH':
        return 'warning';
      case 'MEDIUM':
        return 'primary';
      case 'LOW':
        return 'neutral';
      default:
        return 'default';
    }
  };

  if (isLoading) {
    return <LoadingSpinner label="Querying offline case repository..." className="h-80" />;
  }

  if (loadError) {
    return (
      <div className="p-8 text-center bg-rose-50 border border-rose-200 rounded-xl space-y-3">
        <AlertTriangle className="w-8 h-8 text-rose-600 mx-auto" />
        <h3 className="text-base font-bold text-rose-900">Database Access Failure</h3>
        <p className="text-xs text-rose-700 max-w-md mx-auto">{loadError}</p>
        <Button variant="secondary" size="sm" onClick={() => fetchCases()}>
          Retry Access
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Page Header */}
      <PageHeader
        title="Field Case Management"
        subtitle="Forensic custody ledger and presumptive drug test incident management"
        badge={
          <Badge variant="neutral" size="md">
            {processedCases.length} {processedCases.length === 1 ? 'Record' : 'Records'}
          </Badge>
        }
        actions={
          canCreate ? (
            <Button
              variant="primary"
              onClick={() => navigate('/cases/new')}
              leftIcon={<Plus className="w-4 h-4" />}
            >
              Open New Case
            </Button>
          ) : undefined
        }
      />

      {/* SEARCH & FILTER CONTROLS */}
      <Card className="p-4 space-y-4">
        {/* Row 1: Search Bar & Officer Selector */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-center">
          {/* Search Input */}
          <div className="relative md:col-span-6">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search by case #, title, description, or officer..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-navy-950/60 border border-cyan-500/30 rounded-lg text-xs sm:text-sm text-cyan-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:bg-navy-900/40 backdrop-blur-md transition-all"
            />
          </div>

          {/* Assigned Officer Dropdown */}
          <div className="md:col-span-3">
            <div className="relative">
              <User className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
              <select
                value={officerFilter}
                onChange={(e) => setOfficerFilter(e.target.value)}
                className="w-full pl-8 pr-7 py-2 bg-navy-950/60 border border-cyan-500/30 rounded-lg text-xs text-cyan-200 focus:bg-navy-900/40 backdrop-blur-md focus:outline-none focus:ring-2 focus:ring-brand-500 appearance-none"
              >
                <option value="ALL">All Assigned Officers</option>
                {availableOfficers.map((u) => (
                  <option key={u.id} value={u.fullName}>
                    {u.fullName} ({u.role.replace('_', ' ')})
                  </option>
                ))}
              </select>
              <ChevronDown className="w-3.5 h-3.5 absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
            </div>
          </div>

          {/* Priority Dropdown */}
          <div className="md:col-span-3">
            <select
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
              className="w-full px-3 py-2 bg-navy-950/60 border border-cyan-500/30 rounded-lg text-xs text-cyan-200 focus:bg-navy-900/40 backdrop-blur-md focus:outline-none focus:ring-2 focus:ring-brand-500"
            >
              <option value="ALL">All Priorities</option>
              <option value="LOW">Low Priority</option>
              <option value="MEDIUM">Medium Priority</option>
              <option value="HIGH">High Priority</option>
              <option value="CRITICAL">Critical Priority</option>
            </select>
          </div>
        </div>

        {/* Row 2: Status Chips & Clear Filters */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2 border-t border-slate-100">
          {/* Status Buttons */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 text-xs">
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mr-1 flex items-center gap-1 shrink-0">
              <Filter className="w-3 h-3" /> Status:
            </span>
            {[
              { id: 'ALL', label: 'All' },
              { id: 'DRAFT', label: 'Draft' },
              { id: 'OPEN', label: 'Open' },
              { id: 'IN_PROGRESS', label: 'In Progress' },
              { id: 'SAMPLE_COLLECTED', label: 'Sample Collected' },
              { id: 'TEST_COMPLETED', label: 'Test Completed' },
              { id: 'UNDER_REVIEW', label: 'Under Review' },
              { id: 'CLOSED', label: 'Closed' },
              { id: 'CANCELLED', label: 'Cancelled' },
            ].map((st) => (
              <button
                key={st.id}
                type="button"
                onClick={() => setStatusFilter(st.id)}
                className={`px-2.5 py-1 rounded-md text-xs font-medium whitespace-nowrap transition-colors ${
                  statusFilter === st.id
                    ? 'bg-slate-900 text-white shadow-xs'
                    : 'bg-navy-800/60 text-cyan-300 hover:bg-slate-200'
                }`}
              >
                {st.label}
              </button>
            ))}
          </div>

          {/* Additional Toggles & Reset */}
          <div className="flex items-center gap-3 shrink-0 self-end sm:self-center">
            {canDelete && (
              <label className="flex items-center gap-1.5 text-xs text-cyan-300 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={showArchived}
                  onChange={(e) => setShowArchived(e.target.checked)}
                  className="rounded text-brand-600 focus:ring-brand-500 w-3.5 h-3.5"
                />
                <span>Include Archived</span>
              </label>
            )}

            {hasActiveFilters && (
              <button
                type="button"
                onClick={clearAllFilters}
                className="text-xs text-brand-600 hover:text-brand-800 font-semibold flex items-center gap-1 transition-colors"
              >
                <RotateCcw className="w-3 h-3" />
                Clear Filters
              </button>
            )}
          </div>
        </div>
      </Card>

      {/* CASE LIST CONTENT */}
      {processedCases.length === 0 ? (
        <EmptyState
          icon={Briefcase}
          title={
            hasActiveFilters
              ? 'No Cases Match Active Filters'
              : cases.length === 0
              ? 'No Cases Have Been Created Yet'
              : 'No Cases Found'
          }
          description={
            hasActiveFilters
              ? 'Adjust your query, status, or officer filter to locate required case files.'
              : 'Get started by creating your first field incident case for presumptive drug screening.'
          }
          actionLabel={hasActiveFilters ? 'Clear All Filters' : canCreate ? 'Open New Case' : undefined}
          onAction={
            hasActiveFilters
              ? clearAllFilters
              : canCreate
              ? () => navigate('/cases/new')
              : undefined
          }
        />
      ) : (
        <>
          {/* DESKTOP / TABLET DATA TABLE */}
          <div className="hidden md:block">
            <Card className="overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-cyan-500/30 bg-navy-950/60/80 text-[11px] font-semibold text-cyan-400/80 uppercase tracking-wider select-none">
                      {/* Case Number */}
                      <th
                        className="py-3 px-4 cursor-pointer hover:bg-navy-800/60 transition-colors"
                        onClick={() => handleSortToggle('caseNumber')}
                      >
                        <div className="flex items-center gap-1.5">
                          <span>Case Number</span>
                          <ArrowUpDown className="w-3 h-3 text-slate-400" />
                        </div>
                      </th>

                      {/* Title */}
                      <th
                        className="py-3 px-4 cursor-pointer hover:bg-navy-800/60 transition-colors"
                        onClick={() => handleSortToggle('title')}
                      >
                        <div className="flex items-center gap-1.5">
                          <span>Title</span>
                          <ArrowUpDown className="w-3 h-3 text-slate-400" />
                        </div>
                      </th>

                      {/* Status */}
                      <th
                        className="py-3 px-4 cursor-pointer hover:bg-navy-800/60 transition-colors"
                        onClick={() => handleSortToggle('status')}
                      >
                        <div className="flex items-center gap-1.5">
                          <span>Status</span>
                          <ArrowUpDown className="w-3 h-3 text-slate-400" />
                        </div>
                      </th>

                      {/* Priority */}
                      <th
                        className="py-3 px-4 cursor-pointer hover:bg-navy-800/60 transition-colors"
                        onClick={() => handleSortToggle('priority')}
                      >
                        <div className="flex items-center gap-1.5">
                          <span>Priority</span>
                          <ArrowUpDown className="w-3 h-3 text-slate-400" />
                        </div>
                      </th>

                      {/* Assigned Officer */}
                      <th className="py-3 px-4">Assigned Officer</th>

                      {/* Created Date */}
                      <th
                        className="py-3 px-4 cursor-pointer hover:bg-navy-800/60 transition-colors"
                        onClick={() => handleSortToggle('createdAt')}
                      >
                        <div className="flex items-center gap-1.5">
                          <span>Created Date</span>
                          <ArrowUpDown className="w-3 h-3 text-slate-400" />
                        </div>
                      </th>

                      {/* Updated Date */}
                      <th
                        className="py-3 px-4 cursor-pointer hover:bg-navy-800/60 transition-colors"
                        onClick={() => handleSortToggle('updatedAt')}
                      >
                        <div className="flex items-center gap-1.5">
                          <span>Updated Date</span>
                          <ArrowUpDown className="w-3 h-3 text-slate-400" />
                        </div>
                      </th>

                      {/* Actions */}
                      <th className="py-3 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-xs">
                    {processedCases.map((c) => (
                      <tr
                        key={c.id}
                        className={`hover:bg-navy-950/60/80 transition-colors ${
                          c.isArchived ? 'bg-navy-950/60/50 opacity-60' : ''
                        }`}
                      >
                        {/* Case Number */}
                        <td className="py-3.5 px-4 font-mono font-bold text-cyan-50">
                          <button
                            onClick={() => navigate(`/cases/${c.id}`)}
                            className="hover:text-brand-600 hover:underline flex items-center gap-1"
                          >
                            {c.caseNumber}
                            {c.isArchived && (
                              <span className="text-[10px] text-amber-600 bg-amber-50 px-1 py-0.5 rounded font-sans font-normal">
                                Archived
                              </span>
                            )}
                          </button>
                        </td>

                        {/* Title */}
                        <td className="py-3.5 px-4 max-w-xs">
                          <div className="font-semibold text-cyan-100 truncate" title={c.title}>
                            {c.title}
                          </div>
                          {c.description && (
                            <div className="text-[11px] text-slate-400 truncate mt-0.5">
                              {c.description}
                            </div>
                          )}
                        </td>

                        {/* Status */}
                        <td className="py-3.5 px-4">
                          <Badge variant={getStatusBadgeVariant(c.status)} size="sm">
                            {formatStatusLabel(c.status)}
                          </Badge>
                        </td>

                        {/* Priority */}
                        <td className="py-3.5 px-4">
                          <Badge variant={getPriorityVariant(c.priority)} size="sm">
                            {c.priority}
                          </Badge>
                        </td>

                        {/* Assigned Officer */}
                        <td className="py-3.5 px-4 text-cyan-200">
                          <div className="flex items-center gap-1.5">
                            <User className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                            <span className="truncate">{c.assignedOfficer || c.leadOfficerName || 'Unassigned'}</span>
                          </div>
                        </td>

                        {/* Created Date */}
                        <td className="py-3.5 px-4 text-cyan-400/80 whitespace-nowrap">
                          {formatShortDate(c.createdAt)}
                        </td>

                        {/* Updated Date */}
                        <td className="py-3.5 px-4 text-cyan-400/80 whitespace-nowrap">
                          {formatShortDate(c.updatedAt)}
                        </td>

                        {/* Actions */}
                        <td className="py-3.5 px-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <Button
                              variant="secondary"
                              size="sm"
                              onClick={() => navigate(`/cases/${c.id}`)}
                              title="Inspect case details"
                              className="px-2 py-1 text-xs"
                              leftIcon={<Eye className="w-3.5 h-3.5" />}
                            >
                              View
                            </Button>

                            {canEdit && !c.isArchived && (
                              <Button
                                variant="secondary"
                                size="sm"
                                onClick={() => navigate(`/cases/${c.id}/edit`)}
                                title="Edit case metadata"
                                className="px-2 py-1 text-xs text-cyan-200"
                                leftIcon={<Edit2 className="w-3.5 h-3.5" />}
                              >
                                Edit
                              </Button>
                            )}

                            {canDelete && !c.isArchived && (
                              <button
                                onClick={() => setCaseToArchive(c)}
                                title="Archive case file"
                                className="p-1.5 text-slate-400 hover:text-amber-600 rounded hover:bg-navy-800/60 transition-colors"
                              >
                                <Archive className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          </div>

          {/* MOBILE / TABLET RESPONSIVE CARDS */}
          <div className="md:hidden space-y-3">
            {processedCases.map((c) => (
              <Card
                key={c.id}
                className={`p-4 space-y-3 transition-colors ${
                  c.isArchived ? 'bg-navy-950/60/70 border-dashed border-cyan-400/40' : ''
                }`}
              >
                {/* Header: Case # and Badges */}
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <span className="font-mono text-xs font-bold text-cyan-50 block">
                      {c.caseNumber}
                    </span>
                    <h4 className="text-sm font-bold text-cyan-100 mt-0.5 line-clamp-1">
                      {c.title}
                    </h4>
                  </div>
                  <div className="flex flex-col items-end gap-1 shrink-0">
                    <Badge variant={getStatusBadgeVariant(c.status)} size="sm">
                      {formatStatusLabel(c.status)}
                    </Badge>
                    <Badge variant={getPriorityVariant(c.priority)} size="sm">
                      {c.priority}
                    </Badge>
                  </div>
                </div>

                {/* Details */}
                <div className="grid grid-cols-2 gap-2 text-xs text-cyan-300 bg-navy-950/60 p-2.5 rounded-lg border border-slate-100">
                  <div className="flex items-center gap-1.5 truncate">
                    <User className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span className="truncate">{c.assignedOfficer || c.leadOfficerName || 'Unassigned'}</span>
                  </div>
                  <div className="flex items-center gap-1.5 justify-end">
                    <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span>{formatShortDate(c.createdAt)}</span>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                  <div className="text-[11px] text-slate-400 flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    <span>Updated {formatShortDate(c.updatedAt)}</span>
                  </div>

                  <div className="flex items-center gap-2">
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => navigate(`/cases/${c.id}`)}
                      leftIcon={<Eye className="w-3.5 h-3.5" />}
                    >
                      View
                    </Button>
                    {canEdit && !c.isArchived && (
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => navigate(`/cases/${c.id}/edit`)}
                        leftIcon={<Edit2 className="w-3.5 h-3.5" />}
                      >
                        Edit
                      </Button>
                    )}
                    {canDelete && !c.isArchived && (
                      <button
                        onClick={() => setCaseToArchive(c)}
                        className="p-2 text-slate-400 hover:text-amber-600 rounded bg-navy-950/60 hover:bg-navy-800/60 transition-colors"
                      >
                        <Archive className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </>
      )}

      {/* ARCHIVE CONFIRMATION MODAL */}
      {caseToArchive && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-navy-900/40 backdrop-blur-md rounded-xl shadow-2xl border border-cyan-500/30 max-w-md w-full p-6 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center shrink-0">
                <Archive className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-cyan-50">Archive Case Record</h3>
                <p className="text-xs text-cyan-400/80 font-mono">{caseToArchive.caseNumber}</p>
              </div>
            </div>

            <p className="text-xs text-cyan-300 leading-relaxed">
              Are you sure you want to archive <strong>{caseToArchive.caseNumber}</strong> (&quot;{caseToArchive.title}&quot;)?
              To maintain strict chain-of-custody compliance, the case file and its audit log will remain intact in local storage and will only be hidden from active operational views.
            </p>

            <div className="p-3 bg-navy-950/60 rounded-lg border border-cyan-500/30 text-[11px] text-cyan-400/80 flex items-center gap-2">
              <Layers className="w-4 h-4 text-slate-400 shrink-0" />
              <span>Related sample metadata, test logs, and chain stamps will be preserved safely.</span>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setCaseToArchive(null)}
                disabled={isArchiving}
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={handleArchiveConfirm}
                isLoading={isArchiving}
                className="bg-amber-600 hover:bg-amber-700 text-white"
              >
                Archive Case File
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
