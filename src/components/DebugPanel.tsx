import { LogEntry } from '@/lib/types';
import { motion } from 'framer-motion';
import { X, Terminal } from 'lucide-react';

interface Props {
  logs: LogEntry[];
  visible: boolean;
  onClose: () => void;
}

const levelColors: Record<string, string> = {
  info: 'text-info',
  warn: 'text-warning',
  error: 'text-destructive',
  debug: 'text-muted-foreground',
};

export function DebugPanel({ logs, visible, onClose }: Props) {
  if (!visible) return null;

  return (
    <motion.aside
      initial={{ width: 0, opacity: 0 }}
      animate={{ width: 320, opacity: 1 }}
      exit={{ width: 0, opacity: 0 }}
      className="border-l border-border bg-card shrink-0 flex flex-col h-full overflow-hidden"
    >
      <div className="flex items-center justify-between px-4 h-12 border-b border-border">
        <div className="flex items-center gap-2">
          <Terminal className="w-4 h-4 text-primary" />
          <span className="text-sm font-semibold">Debug Console</span>
        </div>
        <button onClick={onClose} className="p-1 hover:bg-muted rounded transition-colors">
          <X className="w-4 h-4 text-muted-foreground" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto scrollbar-thin p-3 space-y-1 font-mono text-[11px]">
        {logs.length === 0 ? (
          <p className="text-muted-foreground text-center py-8">No logs yet. Run an analysis to see debug output.</p>
        ) : (
          logs.map(log => (
            <motion.div
              key={log.id}
              initial={{ opacity: 0, x: 8 }}
              animate={{ opacity: 1, x: 0 }}
              className="flex gap-2 py-1 px-2 rounded hover:bg-muted/50"
            >
              <span className="text-muted-foreground/50 shrink-0">
                {log.timestamp.toLocaleTimeString('en', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' })}
              </span>
              <span className={`shrink-0 uppercase w-10 ${levelColors[log.level]}`}>{log.level}</span>
              <span className="text-foreground/80">{log.message}</span>
            </motion.div>
          ))
        )}
      </div>
    </motion.aside>
  );
}
