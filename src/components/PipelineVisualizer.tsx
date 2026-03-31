import { motion } from 'framer-motion';
import { PipelineStage } from '@/lib/types';
import { CheckCircle2, Loader2, Circle, AlertCircle } from 'lucide-react';

interface Props {
  stages: PipelineStage[];
}

const stageIcons = {
  idle: <Circle className="w-4 h-4 text-muted-foreground" />,
  processing: <Loader2 className="w-4 h-4 text-primary animate-spin" />,
  complete: <CheckCircle2 className="w-4 h-4 text-success" />,
  error: <AlertCircle className="w-4 h-4 text-destructive" />,
};

export function PipelineVisualizer({ stages }: Props) {
  return (
    <div className="flex items-center gap-1 overflow-x-auto py-3 px-1">
      {stages.map((stage, i) => (
        <div key={stage.id} className="flex items-center">
          <motion.div
            initial={false}
            animate={{
              scale: stage.status === 'processing' ? 1.05 : 1,
              opacity: stage.status === 'idle' ? 0.5 : 1,
            }}
            className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium transition-colors whitespace-nowrap
              ${stage.status === 'processing' ? 'bg-primary/10 text-primary border border-primary/20' :
                stage.status === 'complete' ? 'bg-success/10 text-success border border-success/20' :
                stage.status === 'error' ? 'bg-destructive/10 text-destructive border border-destructive/20' :
                'bg-muted text-muted-foreground border border-transparent'}`}
          >
            {stageIcons[stage.status]}
            <span>{stage.name}</span>
            {stage.duration && <span className="text-[10px] opacity-70">{stage.duration.toFixed(1)}s</span>}
          </motion.div>
          {i < stages.length - 1 && (
            <div className={`w-6 h-px mx-1 transition-colors ${
              stages[i + 1].status !== 'idle' ? 'bg-primary/40' : 'bg-border'
            }`} />
          )}
        </div>
      ))}
    </div>
  );
}
