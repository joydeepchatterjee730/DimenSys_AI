import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, ChevronUp, Brain, FileCode2, Loader2 } from 'lucide-react';

interface Props {
  /** Full prompt string sent to / built for the agent (shown in monospace) */
  agentInputText: string;
  agentResponse: string;
  visible: boolean;
  /** True while the agent stage is still “thinking” before response text is shown */
  loading?: boolean;
}

export function AgentProcessingPanel({ agentInputText, agentResponse, visible, loading }: Props) {
  const [showPrompt, setShowPrompt] = useState(false);

  if (!visible) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="space-y-3"
    >
      <div className="flex items-center gap-2">
        <Brain className="w-4 h-4 text-accent" />
        <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Agent Processing</h2>
        {loading && (
          <span className="flex items-center gap-1 text-[10px] text-primary bg-primary/10 px-2 py-1 rounded-md font-medium">
            <Loader2 className="w-3 h-3 animate-spin" />
            Synthesizing insights…
          </span>
        )}
      </div>

      <div className="rounded-xl border border-border bg-card card-elevated overflow-hidden">
        <button
          type="button"
          onClick={() => setShowPrompt(!showPrompt)}
          className="w-full flex items-center justify-between px-4 py-3 border-b border-border bg-muted/20 hover:bg-muted/40 transition-colors text-left"
        >
          <div className="flex items-center gap-2">
            <FileCode2 className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
            <span className="text-xs font-medium">Agent prompt</span>
            <span className="text-[10px] text-muted-foreground/60 font-normal">• Technical details</span>
          </div>
          {showPrompt ? <ChevronUp className="w-3.5 h-3.5 text-muted-foreground shrink-0" /> : <ChevronDown className="w-3.5 h-3.5 text-muted-foreground shrink-0" />}
        </button>

        <AnimatePresence>
          {showPrompt && agentInputText && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden border-b border-border"
            >
              <pre className="text-[11px] font-mono bg-muted/10 p-4 overflow-x-auto text-muted-foreground max-h-72 scrollbar-thin leading-relaxed">
                {agentInputText}
              </pre>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="p-4">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-6 h-6 rounded-md gradient-bg flex items-center justify-center">
              <Brain className="w-3 h-3 text-primary-foreground" />
            </div>
            <span className="text-xs font-semibold text-foreground">Synthesized analysis</span>
          </div>
          {loading && !agentResponse ? (
            <div className="flex flex-col items-center gap-3 py-8 justify-center text-muted-foreground">
              <div className="relative">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
                <div className="absolute inset-0 w-8 h-8 rounded-full border-2 border-primary/20 animate-ping" />
              </div>
              <div className="text-center">
                <span className="text-sm font-medium">Processing with AI model</span>
                <p className="text-[10px] text-muted-foreground/60 mt-1">Generating comprehensive analysis</p>
              </div>
            </div>
          ) : (
            <div className="space-y-2 text-sm leading-relaxed">
              {agentResponse.split('\n').map((line, i) => {
                if (line.startsWith('**') && line.endsWith('**')) {
                  return <h4 key={i} className="font-semibold text-foreground mt-2 text-xs uppercase tracking-wide">{line.replace(/\*\*/g, '')}</h4>;
                }
                if (line.startsWith('- ')) {
                  return <p key={i} className="text-muted-foreground text-xs pl-3 border-l-2 border-accent/30 py-0.5">{line.slice(2)}</p>;
                }
                if (line.match(/^\d+\./)) {
                  return <p key={i} className="text-muted-foreground text-xs pl-3">{line}</p>;
                }
                if (line.trim() === '') return <div key={i} className="h-1" />;
                return <p key={i} className="text-muted-foreground text-xs">{line.replace(/\*\*(.*?)\*\*/g, '$1')}</p>;
              })}
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}
