import React, { useState } from 'react';
import {
  RotateCcw,
  Save,
} from 'lucide-react';
import { PageHeader } from '../components/common/PageHeader';
import { Card, CardHeader, CardTitle, CardContent } from '../components/common/Card';
import { Button } from '../components/common/Button';
import { Badge } from '../components/common/Badge';
import { db } from '../database/db';
import { initializeDatabase } from '../database/initDb';
import { useToast } from '../hooks/useToast';
import { useAuth } from '../hooks/useAuth';

export const SettingsPage: React.FC = () => {
  const { showToast } = useToast();
  const { user } = useAuth();
  const [isResetting, setIsResetting] = useState(false);
  const currentUser = user || {
    fullName: 'System Administrator',
    badgeNumber: 'ADM-001',
    agency: 'State Forensic Oversight',
    role: 'ADMIN',
  };

  const handleResetDatabase = async () => {
    if (
      !window.confirm(
        'Are you sure you want to reset the local IndexedDB? This will restore initial demonstration seed records.'
      )
    ) {
      return;
    }

    setIsResetting(true);
    try {
      await db.delete();
      await initializeDatabase();
      showToast('Local database reset and re-seeded with demo records', 'success');
      setTimeout(() => {
        window.location.reload();
      }, 1000);
    } catch (err) {
      console.error('Failed to reset database', err);
      showToast('Error resetting local database', 'error');
    } finally {
      setIsResetting(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <PageHeader
        title="Terminal Settings & Security"
        subtitle="Configure field hardware profiles, local offline store, and forensic protocols"
      />

      {/* Terminal Profile */}
      <Card>
        <CardHeader>
          <CardTitle>Field Terminal Configuration</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-[11px] font-semibold uppercase text-cyan-400/80 mb-1">
                Device Terminal ID
              </label>
              <input
                type="text"
                disabled
                value="TER-FIELD-4091A"
                className="w-full px-3 py-2 bg-navy-800/60 border border-cyan-500/30 rounded-lg text-cyan-200 font-mono"
              />
            </div>
            <div>
              <label className="block text-[11px] font-semibold uppercase text-cyan-400/80 mb-1">
                Field Jurisdiction Unit
              </label>
              <input
                type="text"
                disabled
                value={currentUser.agency}
                className="w-full px-3 py-2 bg-navy-800/60 border border-cyan-500/30 rounded-lg text-cyan-200"
              />
            </div>
          </div>

          <div className="pt-2">
            <span className="font-semibold text-cyan-200 block mb-1">
              Active Security Profile
            </span>
            <div className="p-3 bg-navy-950/60 rounded-lg border border-cyan-500/30 flex items-center justify-between">
              <div>
                <span className="font-semibold text-cyan-50">{currentUser.fullName}</span>
                <span className="text-cyan-400/80 ml-2 font-mono">({currentUser.badgeNumber})</span>
              </div>
              <Badge variant="primary">{currentUser.role}</Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Database Maintenance & Reset */}
      <Card>
        <CardHeader>
          <CardTitle>Local Storage & Demo Seed Data</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-xs">
          <p className="text-cyan-300 leading-relaxed">
            The Digital Companion uses IndexedDB (via Dexie.js) for resilient offline field operations. In this Stage 1 environment, you can re-seed the demonstration dataset if you wish to reset mock cases, samples, and tests to initial values.
          </p>

          <div className="p-4 bg-navy-950/60 border border-cyan-500/30 rounded-lg flex items-center justify-between flex-wrap gap-3">
            <div>
              <span className="font-semibold text-cyan-100 block">Reset Demonstration Data</span>
              <span className="text-cyan-400/80 text-[11px]">
                Purges local IndexedDB tables and re-seeds default authorized test scenarios.
              </span>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={handleResetDatabase}
              isLoading={isResetting}
              leftIcon={<RotateCcw className="w-3.5 h-3.5" />}
              className="text-xs text-rose-700 border-rose-300 hover:bg-rose-50"
            >
              Reset to Demo Records
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Future Backend Target */}
      <Card>
        <CardHeader>
          <CardTitle>Central Sync Endpoint (FastAPI Target)</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-xs">
          <p className="text-cyan-300">
            Configure the upstream REST / WebSocket gateway address for cloud ingestion.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="sm:col-span-2">
              <label className="block text-[11px] font-semibold uppercase text-cyan-400/80 mb-1">
                API Base URL
              </label>
              <input
                type="text"
                defaultValue="http://localhost:8000/api/v1"
                className="w-full px-3 py-2 bg-navy-950/60 border border-cyan-400/40 rounded-lg text-cyan-100 font-mono focus:bg-navy-900/40 backdrop-blur-md focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
            </div>
            <div className="flex items-end">
              <Button
                variant="primary"
                size="md"
                onClick={() => showToast('API configuration saved locally', 'success')}
                leftIcon={<Save className="w-4 h-4" />}
                className="w-full"
              >
                Save URL
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
