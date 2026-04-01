import type { DimensionResult } from '@/lib/types';

/** Sentiment labels that indicate fear / anxiety (case-insensitive match). */
const FEAR_LIKE = /^(fear|concern|anxiety|anxious|distress|negative|worried|stress)$/i;

function labelFor(dimensions: DimensionResult[], id: string): string | undefined {
  const r = dimensions.find(d => d.dimensionId === id && !d.error);
  return r?.label?.trim();
}

/**
 * Show safety banner when risk is high and sentiment suggests fear/anxiety.
 */
export function shouldShowHighRiskFearWarning(dimensions: DimensionResult[]): boolean {
  const risk = labelFor(dimensions, 'risk')?.toLowerCase();
  const sentiment = labelFor(dimensions, 'sentiment');
  if (risk !== 'high') return false;
  if (!sentiment) return false;
  return FEAR_LIKE.test(sentiment.trim()) || /\b(fear|anxious|anxiety|scared|worr)/i.test(sentiment);
}
