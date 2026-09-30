/**
 * Netlify Function: AutoDock Vina Engine Health & Status
 * Endpoint: /.netlify/functions/docking-status
 * Clean URL: /api/docking-status
 */

import type { Config } from '@netlify/functions';
import { vinaBackend } from '../../server/vinaBackend';

export default async (req: Request) => {
  // Allow GET and OPTIONS (for CORS)
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
      },
    });
  }

  try {
    const status = vinaBackend.getStatus();

    return new Response(JSON.stringify(status), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Cache-Control': 'no-cache, no-store',
      },
    });
  } catch (err: any) {
    return new Response(
      JSON.stringify({
        available: false,
        engine: 'AutoDock Vina',
        error: 'ENGINE_UNAVAILABLE',
        message: err.message || 'Error checking engine status',
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      }
    );
  }
};

export const config: Config = {
  path: ['/api/docking-status', '/.netlify/functions/docking-status'],
};
