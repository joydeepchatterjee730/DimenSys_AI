import type { DimensionResult } from '@/lib/types';

export interface KeyInsights {
  emotion: string;
  intent: string;
  risk: string;
  topic: string;
}

function pick(dimensions: DimensionResult[], id: string, fallback: string): string {
  const r = dimensions.find(d => d.dimensionId === id);
  if (!r || r.error) return fallback;
  const v = r.label?.trim();
  return v || fallback;
}

export function extractKeyInsights(dimensions: DimensionResult[]): KeyInsights {
  return {
    emotion: pick(dimensions, 'sentiment', '—'),
    intent: pick(dimensions, 'intent', '—'),
    risk: pick(dimensions, 'risk', '—'),
    topic: pick(dimensions, 'semantic', '—'),
  };
}
