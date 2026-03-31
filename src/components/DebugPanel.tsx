import { LogEntry, PipelineStage, DimensionResult } from '@/lib/types';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Terminal, Activity, AlertTriangle, Clock, Layers } from 'lucide-react';
import { useState } from 'react';

interface Props {
  logs: LogEntry[];
  stages: PipelineStage[];
  dimensionResults: DimensionResult[];
  visible: boolean;
  onClose: () => void;
}

const levelColors: Record<string, string> = {
  info: 'text-info',
  warn: 'text-warning',
  error: 'text-destructive',
  debug: 'text-muted-foreground',
};

const levelDots: Record<string, string> = {
  info: 'bg-info',
  warn: 'bg-warning',
  error: 'bg-destructive',
  debug: 'bg-muted-foreground/50',
};

type Tab = 'logs' | 'timeline' | 'api';

export function DebugPanel({ logs, stages, dimensionResults, visible, onClose }: Props) {
  const [activeTab, setActiveTab] = useState<Tab>('logs');

  if (!visible) return null;

  const tabs: { id: Tab; label: string; icon: React.ReactNode }[] = [
    { id: 'logs', label: 'Logs', icon: <Terminal className="w-3 h-3" /> },
    { id: 'timeline', label: 'Timeline', icon: <Clock className="w-3 h-3" /> },
    { id: 'api', label: 'API Status', icon: <Activity className="w-3 h-3" /> },
  ];

  const errors = logs.filter(l => l.level === 'error');

  return (
    <motion.aside
      initial={{ width: 0, opacity: 0 }}
      animate={{ width: 340, opacity: 1 }}
      exit={{ width: 0, opacity: 0 }}
      transition={{ duration: 0.2 }}
      className="border-l border-border bg-card shrink-0 flex flex-col h-full overflow-hidden"
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 h-12 border-b border-border shrink-0">
        <div className="flex items-center gap-2">
          <Terminal className="w-4 h-4 text-primary" />
          <span className="text-sm font-semibold">Debug Console</span>
          {errors.length > 0 && (
            <span className="flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-medium bg-destructive/10 text-destructive">
              <AlertTriangle className="w-2.5 h-2.5" /> {errors.length}
            </span>
          )}
        </div>
        <button onClick={onClose} className="p-1 hover:bg-muted rounded transition-colors">
          <X className="w-4 h-4 text-muted-foreground" />
        </button>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-border shrink-0">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex-1 flex items-center justify-center gap-1.5 px-2 py-2.5 text-[10px] font-medium uppercase tracking-wider transition-colors
              ${activeTab === tab.id ? 'text-primary border-b-2 border-primary bg-primary/5' : 'text-muted-foreground hover:text-foreground'}`}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto scrollbar-thin">
        <AnimatePresence mode="wait">
          {activeTab === 'logs' && (
            <motion.div
              key="logs"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="p-3 space-y-0.5 font-mono text-[11px]"
            >
              {logs.length === 0 ? (
                <p className="text-muted-foreground text-center py-8 text-xs font-sans">
                  No logs yet. Run an analysis to see debug output.
                </p>
              ) : (
                logs.map(log => (
                  <motion.div
                    key={log.id}
                    initial={{ opacity: 0, x: 8 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="flex gap-2 py-1 px-2 rounded hover:bg-muted/50 items-start"
                  >
                    <span className={`w-1.5 h-1.5 rounded-full mt-1.5 shrink-0 ${levelDots[log.level]}`} />
                    <span className="text-muted-foreground/40 shrink-0">
                      {log.timestamp.toLocaleTimeString('en', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                    </span>
                    <span className={`shrink-0 uppercase w-10 ${levelColors[log.level]}`}>{log.level}</span>
                    <span className="text-foreground/80">{log.message}</span>
                  </motion.div>
                ))
              )}
            </motion.div>
          )}

          {activeTab === 'timeline' && (
            <motion.div
              key="timeline"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="p-4 space-y-3"
            >
              <h4 className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Execution Order</h4>
              {stages.map((stage, i) => (
                <div key={stage.id} className="flex items-center gap-3">
                  <div className="flex flex-col items-center">
                    <div className={`w-3 h-3 rounded-full border-2 ${
                      stage.status === 'complete' ? 'border-success bg-success/20' :
                      stage.status === 'processing' ? 'border-primary bg-primary/20' :
                      'border-muted-foreground/30 bg-muted'
                    }`} />
                    {i < stages.length - 1 && (
                      <div className={`w-px h-6 ${stage.status === 'complete' ? 'bg-success/30' : 'bg-border'}`} />
                    )}
                  </div>
                  <div className="flex-1 flex items-center justify-between">
                    <span className="text-xs font-medium">{stage.name}</span>
                    {stage.duration != null && (
                      <span className="text-[10px] font-mono text-muted-foreground">{stage.duration.toFixed(1)}s</span>
                    )}
                  </div>
                </div>
              ))}

              {dimensionResults.length > 0 && (
                <>
                  <h4 className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mt-4 flex items-center gap-1.5">
                    <Layers className="w-3 h-3" />
                    Dimension Execution
                  </h4>
                  {dimensionResults.map(dim => (
                    <div key={dim.dimensionId} className="flex items-center justify-between px-2 py-1.5 rounded-lg bg-muted/30">
                      <span className="text-xs">{dim.dimensionName}</span>
                      <div className="flex items-center gap-2">
                        <div className="w-16 h-1.5 bg-muted rounded-full overflow-hidden">
                          <div
                            className="h-full gradient-bg rounded-full transition-all"
                            style={{ width: `${(dim.executionTime / 3) * 100}%` }}
                          />
                        </div>
                        <span className="text-[10px] font-mono text-muted-foreground w-10 text-right">{(dim.executionTime * 1000).toFixed(0)}ms</span>
                      </div>
                    </div>
                  ))}
                </>
              )}
            </motion.div>
          )}

          {activeTab === 'api' && (
            <motion.div
              key="api"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="p-4 space-y-3"
            >
              <h4 className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">API Calls</h4>
              {stages.filter(s => s.status !== 'idle').map(stage => (
                <div key={stage.id} className="flex items-center justify-between p-2.5 rounded-lg border border-border bg-muted/20">
                  <div className="flex items-center gap-2">
                    <span className={`w-2 h-2 rounded-full ${
                      stage.status === 'complete' ? 'bg-success' :
                      stage.status === 'processing' ? 'bg-primary animate-pulse' :
                      stage.status === 'error' ? 'bg-destructive' : 'bg-muted-foreground/30'
                    }`} />
                    <span className="text-xs font-medium">{stage.name}</span>
                  </div>
                  <span className={`text-[10px] font-mono ${
                    stage.status === 'complete' ? 'text-success' :
                    stage.status === 'processing' ? 'text-primary' :
                    stage.status === 'error' ? 'text-destructive' : 'text-muted-foreground'
                  }`}>
                    {stage.status === 'complete' ? '200 OK' :
                     stage.status === 'processing' ? 'pending...' :
                     stage.status === 'error' ? '500 ERR' : '—'}
                  </span>
                </div>
              ))}
              {stages.every(s => s.status === 'idle') && (
                <p className="text-muted-foreground text-center py-8 text-xs">No API calls yet.</p>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.aside>
  );
}
