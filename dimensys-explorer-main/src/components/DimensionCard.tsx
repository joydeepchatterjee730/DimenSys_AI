import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { DimensionResult } from '@/lib/types';
import { ChevronDown, ChevronUp, Loader2, Clock, TrendingUp, AlertTriangle, Info } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

interface Props {
  result: DimensionResult;
  index: number;
  /** When true, cards animate in together (parallel UX) */
  appearTogether?: boolean;
}

const dimensionIcons: Record<string, string> = {
  sentiment: '💭',
  intent: '🎯',
  risk: '⚠️',
  semantic: '🔗',
  sentimentanalysis: '💭',
  complexity: '🧩',
  temporal: '⏰',
};

function getConfidenceColor(confidence: number): string {
  const c = Math.min(1, Math.max(0, confidence));
  if (c >= 0.8) return 'from-emerald-500 to-green-400';
  if (c >= 0.6) return 'from-blue-500 to-cyan-400';
  if (c >= 0.4) return 'from-amber-500 to-yellow-400';
  return 'from-red-500 to-orange-400';
}

function getConfidenceLabel(confidence: number): string {
  const c = Math.min(1, Math.max(0, confidence));
  if (c >= 0.8) return 'High';
  if (c >= 0.6) return 'Moderate';
  if (c >= 0.4) return 'Low';
  return 'Very Low';
}

function getConfidenceTooltip(confidence: number): string {
  const c = Math.min(1, Math.max(0, confidence));
  if (c >= 0.8) return 'Strong signal detected';
  if (c >= 0.6) return 'Some uncertainty';
  if (c >= 0.4) return 'Weak signal, interpret cautiously';
  return 'Very weak signal, high uncertainty';
}

export function DimensionCard({ result, index, appearTogether }: Props) {
  const [expanded, setExpanded] = useState(false);
  const isProcessing = result.status === 'processing';
  const isError = Boolean(result.error) || result.status === 'error';
  const icon =
    dimensionIcons[result.dimensionId] ||
    dimensionIcons[result.dimensionName.toLowerCase().replace(/\s+/g, '')] ||
    '🔮';

  const animDelay = appearTogether ? 0 : index * 0.06;
  const conf = Math.min(1, Math.max(0, Number.isFinite(result.confidence) ? result.confidence : 0));
  const pct = (conf * 100).toFixed(1);

  return (
    <motion.div
      initial={{ opacity: 0, y: 16, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ delay: animDelay, duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] }}
      className={`group rounded-xl border bg-card overflow-hidden transition-all duration-300
        ${isProcessing ? 'border-primary/20 shadow-[0_0_20px_hsl(var(--primary)/0.06)]' : ''}
        ${isError && !isProcessing ? 'border-destructive/30 bg-destructive/[0.03]' : ''}
        ${!isProcessing && !isError ? 'border-border card-elevated card-hover' : ''}
        `}
    >
      <div className="h-0.5 w-full">
        {isProcessing ? (
          <div className="h-full w-full shimmer bg-primary/20" />
        ) : (
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: '100%' }}
            transition={{ duration: 0.6, delay: animDelay + 0.2 }}
            className={`h-full ${isError ? 'bg-destructive/60' : 'gradient-bg'}`}
          />
        )}
      </div>

      <div className="p-4">
        <div className="flex items-start justify-between mb-3 gap-2">
          <div className="flex items-center gap-2.5 min-w-0">
            <span className="text-xl shrink-0">{icon}</span>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="font-semibold text-sm">{result.dimensionName}</h3>
                {isError && !isProcessing && (
                  <Badge variant="destructive" className="text-[10px] gap-1 font-medium">
                    <AlertTriangle className="w-3 h-3" />
                    Error
                  </Badge>
                )}
              </div>
              {!isProcessing && (
                <div className="flex items-center gap-1.5 mt-0.5">
                  <Clock className="w-3 h-3 text-muted-foreground/50" />
                  <span className="text-[10px] font-mono text-muted-foreground">
                    {(result.executionTime * 1000).toFixed(0)}ms
                  </span>
                </div>
              )}
            </div>
          </div>
          {isProcessing && (
            <div className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-primary/10 shrink-0">
              <Loader2 className="w-3 h-3 text-primary animate-spin" />
              <span className="text-[10px] text-primary font-medium">Processing dimension…</span>
            </div>
          )}
        </div>

        {isProcessing ? (
          <div className="space-y-3 animate-pulse">
            <div className="h-6 rounded-md bg-muted/60 shimmer w-1/2" />
            <div className="space-y-1.5">
              <div className="h-1.5 rounded-full bg-muted/60 shimmer" />
              <div className="flex justify-between">
                <div className="h-3 rounded bg-muted/60 shimmer w-16" />
                <div className="h-3 rounded bg-muted/60 shimmer w-8" />
              </div>
            </div>
            <div className="space-y-1.5">
              <div className="h-3 rounded bg-muted/60 shimmer" />
              <div className="h-3 rounded bg-muted/60 shimmer w-4/5" />
            </div>
          </div>
        ) : (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3 }}
          >
            <div className="mb-3 flex flex-wrap gap-2 items-center">
              <span
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold shadow-sm
                  ${isError ? 'bg-destructive/15 text-destructive border border-destructive/20' : 'gradient-bg text-primary-foreground'}`}
              >
                {result.label}
              </span>
            </div>

            {!isError && (
              <div className="mb-3 space-y-2">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-[10px] text-muted-foreground uppercase tracking-wider flex items-center gap-1">
                    <TrendingUp className="w-3 h-3" />
                    Confidence
                  </span>
                  <div className="flex items-center gap-2">
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-mono font-bold tabular-nums">{pct}%</span>
                          <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded-md bg-gradient-to-r ${getConfidenceColor(conf)} text-white cursor-help`}>
                            {getConfidenceLabel(conf)}
                          </span>
                        </div>
                      </TooltipTrigger>
                      <TooltipContent className="text-xs">
                        <div className="flex items-center gap-1">
                          <Info className="w-3 h-3" />
                          {getConfidenceTooltip(conf)}
                        </div>
                      </TooltipContent>
                    </Tooltip>
                  </div>
                </div>
                <div className="h-2 bg-muted/50 rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${conf * 100}%` }}
                    transition={{ duration: 1.2, ease: [0.25, 0.46, 0.45, 0.94], delay: 0.15 }}
                    className={`h-full rounded-full bg-gradient-to-r ${getConfidenceColor(conf)}`}
                  />
                </div>
              </div>
            )}

            <p className="text-xs text-muted-foreground leading-relaxed whitespace-pre-wrap">
              {result.explanation}
            </p>
            {isError && result.error && (
              <div className="mt-3 p-3 bg-destructive/5 border border-destructive/20 rounded-lg">
                <div className="flex items-start gap-2">
                  <AlertTriangle className="w-4 h-4 text-destructive mt-0.5 shrink-0" />
                  <div>
                    <p className="text-[11px] font-semibold text-destructive mb-1">Processing Error</p>
                    <p className="text-[10px] font-mono text-destructive/90 leading-relaxed">
                      {result.error}
                    </p>
                  </div>
                </div>
              </div>
            )}

            <button
              type="button"
              onClick={() => setExpanded(!expanded)}
              className="mt-3 flex items-center gap-1.5 text-[10px] text-primary hover:text-primary/80 transition-colors font-semibold uppercase tracking-wider group/btn"
            >
              {expanded ? (
                <ChevronUp className="w-3 h-3 transition-transform" />
              ) : (
                <ChevronDown className="w-3 h-3 transition-transform group-hover/btn:translate-y-0.5" />
              )}
              {expanded ? 'Hide' : 'View'} raw JSON
            </button>

            <AnimatePresence>
              {expanded && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="overflow-hidden"
                >
                  <pre className="mt-2 text-[10px] font-mono bg-muted/30 rounded-lg p-3 overflow-x-auto text-muted-foreground border border-border/50">
                    {JSON.stringify(result.rawData, null, 2)}
                  </pre>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        )}
      </div>
    </motion.div>
  );
}
