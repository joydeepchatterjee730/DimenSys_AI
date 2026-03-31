import { useState } from 'react';
import { motion } from 'framer-motion';
import { DimensionResult } from '@/lib/types';
import { ChevronDown, ChevronUp, Loader2 } from 'lucide-react';

interface Props {
  result: DimensionResult;
  index: number;
}

export function DimensionCard({ result, index }: Props) {
  const [expanded, setExpanded] = useState(false);
  const isProcessing = result.status === 'processing';

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1, duration: 0.3 }}
      className="rounded-xl border border-border bg-card card-elevated card-hover overflow-hidden"
    >
      <div className="p-4">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-2">
            <span className="text-lg">{result.dimensionName === 'Sentiment' ? '💭' : result.dimensionName === 'Intent' ? '🎯' : result.dimensionName === 'Risk Assessment' ? '⚠️' : '🔗'}</span>
            <h3 className="font-semibold text-sm">{result.dimensionName}</h3>
          </div>
          {isProcessing ? (
            <Loader2 className="w-4 h-4 text-primary animate-spin" />
          ) : (
            <span className="text-[10px] font-mono text-muted-foreground">{result.executionTime.toFixed(2)}s</span>
          )}
        </div>

        {isProcessing ? (
          <div className="space-y-2">
            <div className="h-4 rounded bg-muted shimmer" />
            <div className="h-3 rounded bg-muted shimmer w-2/3" />
          </div>
        ) : (
          <>
            <div className="mb-3">
              <span className="inline-block px-2.5 py-1 rounded-md text-xs font-medium gradient-bg text-primary-foreground">
                {result.label}
              </span>
            </div>

            {/* Confidence Bar */}
            <div className="mb-3">
              <div className="flex items-center justify-between mb-1">
                <span className="text-[10px] text-muted-foreground uppercase tracking-wider">Confidence</span>
                <span className="text-xs font-mono font-medium">{(result.confidence * 100).toFixed(0)}%</span>
              </div>
              <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${result.confidence * 100}%` }}
                  transition={{ duration: 1, ease: 'easeOut', delay: 0.3 }}
                  className="h-full rounded-full gradient-bg"
                />
              </div>
            </div>

            <p className="text-xs text-muted-foreground leading-relaxed line-clamp-2">{result.explanation}</p>

            {/* Expand Raw Data */}
            <button
              onClick={() => setExpanded(!expanded)}
              className="mt-3 flex items-center gap-1 text-[10px] text-primary hover:text-primary/80 transition-colors font-medium uppercase tracking-wider"
            >
              {expanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
              {expanded ? 'Hide' : 'View'} Raw Data
            </button>

            {expanded && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                className="mt-2 overflow-hidden"
              >
                <pre className="text-[10px] font-mono bg-muted/50 rounded-lg p-3 overflow-x-auto text-muted-foreground">
                  {JSON.stringify(result.rawData, null, 2)}
                </pre>
              </motion.div>
            )}
          </>
        )}
      </div>
    </motion.div>
  );
}
