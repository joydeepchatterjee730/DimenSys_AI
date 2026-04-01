import { AnalysisRun } from '@/lib/types';
import { Clock } from 'lucide-react';

interface Props {
  history: AnalysisRun[];
  onSelect: (run: AnalysisRun) => void;
}

export function HistoryPanel({ history, onSelect }: Props) {
  return (
    <div className="max-w-3xl mx-auto space-y-3">
      <h2 className="text-lg font-semibold flex items-center gap-2">
        <Clock className="w-5 h-5 text-primary" />
        Analysis History
      </h2>
      {history.length === 0 ? (
        <p className="text-muted-foreground text-sm py-12 text-center">No past analyses yet.</p>
      ) : (
        <div className="space-y-2">
          {history.map(run => (
            <button
              key={run.id}
              onClick={() => onSelect(run)}
              className="w-full text-left p-4 rounded-xl border border-border bg-card card-elevated card-hover"
            >
              <p className="text-sm font-medium line-clamp-1 mb-1">{run.input}</p>
              <div className="flex items-center gap-3 text-xs text-muted-foreground">
                <span>{run.timestamp.toLocaleDateString()}</span>
                <span>{run.timestamp.toLocaleTimeString()}</span>
                <span className="font-mono">{run.totalDuration.toFixed(1)}s</span>
              </div>
              <p className="text-xs text-muted-foreground mt-2 line-clamp-2">{run.finalOutput}</p>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
