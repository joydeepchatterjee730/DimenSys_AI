import { type ReactNode } from 'react';
import { motion } from 'framer-motion';
import { Copy, RefreshCw, Download, FileText, FileJson, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

interface Props {
  finalOutput: string;
  onRegenerate: () => void;
  /** Full API response for exports */
  exportPayload?: Record<string, unknown> | null;
  /** Subtle highlight for demo keywords */
  highlightKeywords?: boolean;
}

const KEYWORD_RE = /\b(risk|recommend|important)\b/gi;

function renderLineWithHighlights(line: string, highlight: boolean): ReactNode {
  if (!highlight) return line;
  const nodes: ReactNode[] = [];
  let last = 0;
  const re = /\b(risk|recommend|important)\b/gi;
  let m: RegExpExecArray | null;
  let k = 0;
  while ((m = re.exec(line)) !== null) {
    if (m.index > last) nodes.push(line.slice(last, m.index));
    nodes.push(
      <mark
        key={`kw-${k++}`}
        className="bg-primary/15 text-foreground font-medium px-0.5 rounded-sm not-italic"
      >
        {m[0]}
      </mark>,
    );
    last = m.index + m[0].length;
  }
  if (last < line.length) nodes.push(line.slice(last));
  return nodes.length ? <>{nodes}</> : line;
}

function buildNormalizedExport(payload: Record<string, unknown>): Record<string, unknown> {
  return {
    request_id: payload.request_id,
    total_time: payload.total_time,
    dimensions: payload.dimensions,
    agent: payload.agent,
    final_output: payload.final_output,
    adjustments: payload.adjustments ?? [],
    cached: payload.cached ?? false,
  };
}

export function FinalOutputPanel({
  finalOutput,
  onRegenerate,
  exportPayload,
  highlightKeywords = true,
}: Props) {
  const copyToClipboard = () => {
    navigator.clipboard.writeText(finalOutput);
    toast.success('Copied to clipboard');
  };

  const exportAsJson = () => {
    const content = exportPayload
      ? JSON.stringify(buildNormalizedExport(exportPayload), null, 2)
      : JSON.stringify({ final_output: finalOutput, exportedAt: new Date().toISOString() }, null, 2);
    const blob = new Blob([content], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `dimensys-analysis-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Exported full response as JSON');
  };

  const exportAsText = () => {
    let body = finalOutput;
    if (exportPayload) {
      const rid = exportPayload.request_id;
      const tt = exportPayload.total_time;
      const parts: string[] = ['=== DimenSys AI export ==='];
      if (typeof rid === 'string') parts.push(`request_id: ${rid}`);
      if (typeof tt === 'number') parts.push(`total_time: ${tt}s`);
      const adj = exportPayload.adjustments;
      if (Array.isArray(adj) && adj.length > 0) {
        parts.push(`adjustments: ${adj.join(', ')}`);
      }
      if (exportPayload.cached === true) {
        parts.push('cached: true');
      }
      parts.push('', '--- final_output ---', '');
      body = `${parts.join('\n')}${finalOutput}`;
    }
    const blob = new Blob([body], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `dimensys-output-${Date.now()}.txt`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Exported as text');
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45 }}
      className="space-y-3"
    >
      <div className="flex items-center gap-2">
        <Sparkles className="w-4 h-4 text-primary" />
        <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Final Output</h2>
      </div>

      <div
        className="rounded-xl border-2 border-primary/20 bg-card overflow-hidden"
        style={{ boxShadow: '0 0 40px hsl(var(--primary) / 0.06), 0 0 80px hsl(var(--primary) / 0.03)' }}
      >
        <div className="flex items-center justify-between px-4 py-3 border-b border-primary/10 gap-2 flex-wrap" style={{ background: 'var(--gradient-subtle)' }}>
          <div className="flex items-center gap-2 min-w-0">
            <div className="w-6 h-6 rounded-md gradient-bg flex items-center justify-center shrink-0">
              <FileText className="w-3 h-3 text-primary-foreground" />
            </div>
            <h3 className="text-sm font-bold gradient-text">Comprehensive analysis</h3>
          </div>
          <div className="flex flex-wrap gap-1 justify-end">
            <Button variant="ghost" size="sm" className="h-7 text-xs gap-1 hover:bg-muted/80" onClick={copyToClipboard}>
              <Copy className="w-3 h-3" /> Copy
            </Button>
            <Button variant="ghost" size="sm" className="h-7 text-xs gap-1 hover:bg-muted/80" onClick={onRegenerate}>
              <RefreshCw className="w-3 h-3" /> Regenerate
            </Button>
            <Button variant="ghost" size="sm" className="h-7 text-xs gap-1 hover:bg-muted/80" onClick={exportAsJson}>
              <FileJson className="w-3 h-3" /> Export JSON
            </Button>
            <Button variant="ghost" size="sm" className="h-7 text-xs gap-1 hover:bg-muted/80" onClick={exportAsText}>
              <Download className="w-3 h-3" /> Export text
            </Button>
          </div>
        </div>

        <div className="p-5 space-y-3">
          {finalOutput.split('\n').map((line, i) => {
            if (line.startsWith('**') && line.endsWith('**')) {
              return (
                <h4 key={i} className="font-semibold text-foreground mt-4 text-sm border-l-3 border-primary/30 pl-3">
                  {line.replace(/\*\*/g, '')}
                </h4>
              );
            }
            if (line.startsWith('- ') || line.startsWith('* ')) {
              const inner = line.replace(/^\*\s/, '').replace(/^-\s/, '');
              return (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: Math.min(i * 0.025, 0.5) }}
                  className="flex gap-3 text-sm leading-relaxed"
                >
                  <span className="text-primary/60 mt-1">•</span>
                  <span className="text-foreground/90 flex-1">
                    {renderLineWithHighlights(inner, highlightKeywords)}
                  </span>
                </motion.div>
              );
            }
            if (line.trim() === '') return <div key={i} className="h-3" />;
            const stripped = line.replace(/\*\*(.*?)\*\*/g, '$1');
            return (
              <p key={i} className="text-sm text-foreground/80 leading-relaxed whitespace-pre-wrap">
                {renderLineWithHighlights(stripped, highlightKeywords)}
              </p>
            );
          })}
        </div>
      </div>
    </motion.div>
  );
}
