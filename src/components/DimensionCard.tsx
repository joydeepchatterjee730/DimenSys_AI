import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { DimensionResult } from '@/lib/types';
import { ChevronDown, ChevronUp, Loader2, Clock, TrendingUp } from 'lucide-react';

interface Props {
  result: DimensionResult;
  index: number;
}

const dimensionIcons: Record<string, string> = {
  'Sentiment': '💭',
  'Intent': '🎯',
  'Risk Assessment': '⚠️',
  'Semantic Analysis': '🔗',
  'Complexity': '🧩',
  'Temporal': '⏰',
};

function getConfidenceColor(confidence: number): string {
  if (confidence >= 0.9) return 'from-green-500 to-emerald-400';
  if (confidence >= 0.7) return 'from-blue-500 to-cyan-400';
  if (confidence >= 0.5) return 'from-yellow-500 to-amber-400';
  return 'from-red-500 to-orange-400';
}

export function DimensionCard({ result, index }: Props) {
  const [expanded, setExpanded] = useState(false);
  const isProcessing = result.status === 'processing';
  const icon = dimensionIcons[result.dimensionName] || '🔮';

  return (
    <motion.div
      initial={{ opacity: 0, y: 16, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ delay: index * 0.08, duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] }}
      className={`group rounded-xl border bg-card overflow-hidden transition-all duration-300
        ${isProcessing
          ? 'border-primary/20 shadow-[0_0_20px_hsl(var(--primary)/0.06)]'
          : 'border-border card-elevated card-hover'
        }`}
    >
      {/* Top accent bar */}
      <div className="h-0.5 w-full">
        {isProcessing ? (
          <div className="h-full w-full shimmer bg-primary/20" />
        ) : (
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: '100%' }}
            transition={{ duration: 0.6, delay: index * 0.08 + 0.3 }}
            className="h-full gradient-bg"
          />
        )}
      </div>

      <div className="p-4">
        {/* Header */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-2.5">
            <span className="text-xl">{icon}</span>
            <div>
              <h3 className="font-semibold text-sm">{result.dimensionName}</h3>
              {!isProcessing && (
                <div className="flex items-center gap-1.5 mt-0.5">
                  <Clock className="w-3 h-3 text-muted-foreground/50" />
                  <span className="text-[10px] font-mono text-muted-foreground">{(result.executionTime * 1000).toFixed(0)}ms</span>
                </div>
              )}
            </div>
          </div>
          {isProcessing && (
            <div className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-primary/10">
              <Loader2 className="w-3 h-3 text-primary animate-spin" />
              <span className="text-[10px] text-primary font-medium">Analyzing...</span>
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
            {/* Output Label */}
            <div className="mb-3">
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold gradient-bg text-primary-foreground shadow-sm">
                {result.label}
              </span>
            </div>

            {/* Confidence Bar */}
            <div className="mb-3">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[10px] text-muted-foreground uppercase tracking-wider flex items-center gap-1">
                  <TrendingUp className="w-3 h-3" />
                  Confidence
                </span>
                <span className="text-xs font-mono font-bold">{(result.confidence * 100).toFixed(0)}%</span>
              </div>
              <div className="h-2 bg-muted/50 rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${result.confidence * 100}%` }}
                  transition={{ duration: 1.2, ease: [0.25, 0.46, 0.45, 0.94], delay: 0.2 }}
                  className={`h-full rounded-full bg-gradient-to-r ${getConfidenceColor(result.confidence)}`}
                />
              </div>
            </div>

            {/* Explanation */}
            <p className="text-xs text-muted-foreground leading-relaxed">{result.explanation}</p>

            {/* Raw Data Toggle */}
            <button
              onClick={() => setExpanded(!expanded)}
              className="mt-3 flex items-center gap-1.5 text-[10px] text-primary hover:text-primary/80 transition-colors font-semibold uppercase tracking-wider group/btn"
            >
              {expanded ? <ChevronUp className="w-3 h-3 transition-transform" /> : <ChevronDown className="w-3 h-3 transition-transform group-hover/btn:translate-y-0.5" />}
              {expanded ? 'Hide' : 'View'} Raw Data
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
