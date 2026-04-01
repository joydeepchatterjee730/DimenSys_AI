/**
 * DimenSys FastAPI backend client.
 */

const API_BASE = (import.meta.env.VITE_API_URL as string | undefined)?.replace(/\/$/, '') ?? 'http://localhost:8000';

export interface AnalyzeApiRequest {
  text: string;
  config?: {
    dimensions: string[];
    parallel: boolean;
  };
  model?: string;
  /** When true, backend may include debug timings and raw dimension snapshots. */
  debug?: boolean;
}

export interface AnalyzeDimension {
  name: string;
  label: string;
  confidence: number;
  explanation: string;
  time: number;
  error?: string | null;
}

export interface AnalyzeAgent {
  input: string;
  response: string;
}

export interface AnalyzeApiResponse {
  request_id: string;
  dimensions: AnalyzeDimension[];
  agent: AnalyzeAgent;
  final_output: string;
  total_time: number;
  adjustments?: string[];
  cached?: boolean;
  debug?: Record<string, unknown> | null;
}

export async function analyzeApi(body: AnalyzeApiRequest): Promise<AnalyzeApiResponse> {
  const res = await fetch(`${API_BASE}/analyze`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      text: body.text,
      config: body.config,
      model: body.model,
      debug: body.debug
    }),
  });

  const text = await res.text();
  if (!res.ok) {
    let detail = text || `Request failed (${res.status})`;
    try {
      const j = JSON.parse(text) as { detail?: unknown };
      if (typeof j.detail === 'string') detail = j.detail;
      else if (Array.isArray(j.detail)) detail = JSON.stringify(j.detail);
    } catch {
      /* use raw text */
    }
    throw new Error(detail);
  }

  try {
    return JSON.parse(text) as AnalyzeApiResponse;
  } catch {
    throw new Error('Invalid JSON from server');
  }
}

export function getApiBaseUrl(): string {
  return API_BASE;
}
