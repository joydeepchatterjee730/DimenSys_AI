import { motion } from 'framer-motion';
import { PipelineStage } from '@/lib/types';
import { CheckCircle2, Loader2, Circle, AlertCircle, ArrowRight } from 'lucide-react';

interface Props {
  stages: PipelineStage[];
  parallelExecution?: boolean;
  /** Server-reported pipeline time (preferred over summing stage durations) */
  wallTimeSeconds?: number | null;
}

const stageIcons: Record<string, React.ReactNode> = {
  idle: <Circle className="w-5 h-5 text-muted-foreground/40" />,
  processing: <Loader2 className="w-5 h-5 text-primary animate-spin" />,
  complete: <CheckCircle2 className="w-5 h-5 text-success" />,
  error: <AlertCircle className="w-5 h-5 text-destructive" />,
};

const stageEmojis: Record<string, string> = {
  input: '📥',
  dimensions: '🧩',
  agent: '🧠',
  fusion: '🔀',
  output: '📤',
};

export function PipelineVisualizer({ stages, parallelExecution, wallTimeSeconds }: Props) {
  const anyProcessing = stages.some(s => s.status === 'processing');
  const allComplete = stages.every(s => s.status === 'complete');

  const getDynamicStatusText = () => {
    const processingStage = stages.find(s => s.status === 'processing');
    if (processingStage) {
      switch (processingStage.id) {
        case 'dimensions':
          return parallelExecution ? 'Analyzing dimensions in parallel...' : 'Analyzing dimensions...';
        case 'agent':
          return 'Synthesizing insights...';
        case 'fusion':
          return 'Generating final response...';
        default:
          return 'Processing...';
      }
    }
    return null;
  };

  const dynamicStatusText = getDynamicStatusText();

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
          <span>Pipeline Flow</span>
          {dynamicStatusText && (
            <motion.span
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-[10px] text-primary font-normal normal-case tracking-normal flex items-center gap-1"
            >
              <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
              {dynamicStatusText}
            </motion.span>
          )}
          {anyProcessing && !dynamicStatusText && (
            <motion.span
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-[10px] text-primary font-normal normal-case tracking-normal flex items-center gap-1"
            >
              <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
              Processing{parallelExecution ? ' (parallel)' : ''}...
            </motion.span>
          )}
          {allComplete && (
            <motion.span
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-[10px] text-success font-normal normal-case tracking-normal"
            >
              ✓ Complete
            </motion.span>
          )}
        </h3>
        {allComplete && (
          <span className="text-[10px] font-mono text-muted-foreground">
            Total:{' '}
            {(wallTimeSeconds != null && wallTimeSeconds > 0
              ? wallTimeSeconds
              : stages.reduce((sum, s) => sum + (s.duration || 0), 0)
            ).toFixed(2)}
            s
          </span>
        )}
      </div>

      {/* Visual Pipeline */}
      <div className="relative flex items-stretch gap-0 overflow-x-auto pb-1">
        {stages.map((stage, i) => {
          const isActive = stage.status === 'processing';
          const isDone = stage.status === 'complete';
          const isError = stage.status === 'error';

          return (
            <div key={stage.id} className="flex items-center flex-1 min-w-0">
              <motion.div
                initial={false}
                animate={{
                  scale: isActive ? 1.02 : 1,
                }}
                transition={{ type: 'spring', stiffness: 300 }}
                className={`relative flex-1 flex flex-col items-center gap-2 px-3 py-3 rounded-xl border transition-all duration-300
                  ${isActive
                    ? 'bg-primary/8 border-primary/30 shadow-[0_0_20px_hsl(var(--primary)/0.1)]'
                    : isDone
                    ? 'bg-success/5 border-success/20'
                    : isError
                    ? 'bg-destructive/5 border-destructive/20'
                    : 'bg-muted/30 border-transparent'
                  }`}
              >
                {/* Pulse ring on active */}
                {isActive && (
                  <motion.div
                    className="absolute inset-0 rounded-xl border-2 border-primary/20"
                    initial={{ opacity: 0.5 }}
                    animate={{ opacity: [0.5, 0, 0.5] }}
                    transition={{ duration: 2, repeat: Infinity }}
                  />
                )}

                <div className="flex items-center gap-1.5">
                  <span className="text-base">{stageEmojis[stage.id] || '⚙️'}</span>
                  {stageIcons[stage.status]}
                </div>
                <span className={`text-[11px] font-medium text-center leading-tight ${
                  isActive ? 'text-primary' : isDone ? 'text-success' : 'text-muted-foreground'
                }`}>
                  {stage.name}
                </span>
                {stage.duration != null && (
                  <span className="text-[9px] font-mono text-muted-foreground/70">{stage.duration.toFixed(1)}s</span>
                )}
              </motion.div>

              {i < stages.length - 1 && (
                <div className="flex items-center px-1 shrink-0">
                  <motion.div
                    initial={false}
                    animate={{
                      opacity: stages[i + 1].status !== 'idle' ? 1 : 0.2,
                      scale: stages[i + 1].status === 'processing' ? 1.2 : 1,
                    }}
                    transition={{ duration: 0.3 }}
                  >
                    <ArrowRight className={`w-4 h-4 ${
                      stages[i + 1].status !== 'idle' ? 'text-primary' : 'text-muted-foreground/30'
                    }`} />
                  </motion.div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Parallel indicator for dimensions stage */}
      {parallelExecution && stages.find(s => s.id === 'dimensions')?.status === 'processing' && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          className="flex items-center gap-2 px-3 py-2 rounded-lg bg-primary/5 border border-primary/10"
        >
          <div className="flex gap-1">
            {[0, 1, 2, 3].map(i => (
              <motion.div
                key={i}
                className="w-1.5 h-4 rounded-full bg-primary/40"
                animate={{ scaleY: [0.4, 1, 0.4] }}
                transition={{ duration: 0.8, delay: i * 0.15, repeat: Infinity }}
              />
            ))}
          </div>
          <span className="text-[10px] text-primary">Processing dimensions in parallel...</span>
        </motion.div>
      )}
    </div>
  );
}
