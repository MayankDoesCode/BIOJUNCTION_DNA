/**
 * Netlify Function: AutoDock Vina Docking Execution Endpoint
 * Endpoint: /.netlify/functions/docking
 * Clean URL: /api/docking
 */

import type { Config } from '@netlify/functions';
import { vinaBackend } from '../../server/vinaBackend';

export default async (req: Request) => {
  // CORS Preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      },
    });
  }

  if (req.method !== 'POST') {
    return new Response(
      JSON.stringify({
        success: false,
        errorCode: 'METHOD_NOT_ALLOWED',
        message: 'Only POST requests are accepted.',
      }),
      {
        status: 405,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      }
    );
  }

  try {
    let payload: any;
    try {
      payload = await req.json();
    } catch {
      return new Response(
        JSON.stringify({
          success: false,
          errorCode: 'INVALID_INPUT',
          message: 'Malformed JSON in request body.',
        }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
        }
      );
    }

    // Server-side scientific parameter validation
    const validation = vinaBackend.validatePayload(payload);
    if (!validation.isValid || !validation.validated) {
      return new Response(
        JSON.stringify({
          success: false,
          errorCode: 'INVALID_INPUT',
          message: validation.error || 'Invalid scientific docking parameters provided.',
        }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
        }
      );
    }

    // Execute real AutoDock Vina simulation
    const result = await vinaBackend.executeDocking(validation.validated);

    const httpStatus = result.success ? 200 : result.errorCode === 'ENGINE_UNAVAILABLE' ? 503 : 400;

    return new Response(JSON.stringify(result), {
      status: httpStatus,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Cache-Control': 'no-cache, no-store',
      },
    });
  } catch (err: any) {
    return new Response(
      JSON.stringify({
        success: false,
        errorCode: 'EXECUTION_FAILED',
        message: err.message || 'Internal server error during docking execution.',
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      }
    );
  }
};

export const config: Config = {
  path: ['/api/docking', '/.netlify/functions/docking'],
};
