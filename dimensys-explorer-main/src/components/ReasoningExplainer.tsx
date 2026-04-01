import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, ChevronUp, Microscope } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { DimensionResult } from '@/lib/types';

interface Props {
  dimensionResults: DimensionResult[];
  agentInputText: string;
}

export function ReasoningExplainer({ dimensionResults, agentInputText }: Props) {
  const [open, setOpen] = useState(false);

  return (
    <div className="rounded-xl border border-dashed border-border bg-muted/20 overflow-hidden">
      <Button
        type="button"
        variant="ghost"
        className="w-full h-auto py-3 px-4 rounded-none justify-between hover:bg-muted/40"
        onClick={() => setOpen(!open)}
      >
        <span className="flex items-center gap-2 text-sm font-medium">
          <Microscope className="w-4 h-4 text-primary" />
          Show Reasoning
        </span>
        {open ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
      </Button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="overflow-hidden border-t border-border/60"
          >
            <div className="p-4 space-y-5 text-sm">
              <div>
                <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">Dimension outputs</h4>
                <ul className="space-y-2 text-muted-foreground">
                  {dimensionResults.map(d => (
                    <li key={d.dimensionId} className="border-l-2 border-primary/25 pl-3">
                      <span className="font-medium text-foreground">{d.dimensionName}</span>
                      {d.error ? (
                        <span className="text-destructive text-xs block">Error: {d.error}</span>
                      ) : (
                        <>
                          <span className="text-foreground"> — {d.label}</span>
                          <p className="text-xs mt-0.5 opacity-90">{d.explanation}</p>
                        </>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">Agent prompt (sent to model)</h4>
                <pre className="text-[11px] font-mono bg-muted/40 rounded-lg p-3 overflow-x-auto max-h-80 scrollbar-thin whitespace-pre-wrap border border-border/50">
                  {agentInputText || '(No prompt captured.)'}
                </pre>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
