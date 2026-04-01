import { motion } from 'framer-motion';
import { Copy, RefreshCw, Download, FileText, Eye } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

interface Props {
  agentResponse: string;
  finalOutput: string;
  onRegenerate: () => void;
}

function MarkdownLite({ text }: { text: string }) {
  const lines = text.split('\n');
  return (
    <div className="space-y-2 text-sm leading-relaxed">
      {lines.map((line, i) => {
        if (line.startsWith('**') && line.endsWith('**')) {
          return <h4 key={i} className="font-semibold text-foreground mt-3">{line.replace(/\*\*/g, '')}</h4>;
        }
        if (line.startsWith('- ')) {
          return <p key={i} className="text-muted-foreground pl-4 border-l-2 border-primary/20">{line.slice(2)}</p>;
        }
        if (line.match(/^\d+\./)) {
          return <p key={i} className="text-muted-foreground pl-4">{line}</p>;
        }
        if (line.trim() === '') return <div key={i} className="h-1" />;
        return <p key={i} className="text-muted-foreground">{line.replace(/\*\*(.*?)\*\*/g, '$1')}</p>;
      })}
    </div>
  );
}

export function OutputPanel({ agentResponse, finalOutput, onRegenerate }: Props) {
  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('Copied to clipboard');
  };

  const exportJSON = () => {
    const data = { agentResponse, finalOutput, exportedAt: new Date().toISOString() };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'dimensys-output.json';
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Exported as JSON');
  };

  return (
    <div className="space-y-4">
      {/* Agent Response */}
      {agentResponse && (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-xl border border-border bg-card card-elevated overflow-hidden"
        >
          <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-muted/30">
            <div className="flex items-center gap-2">
              <Eye className="w-4 h-4 text-accent" />
              <h3 className="text-sm font-semibold">Agent Reasoning</h3>
            </div>
            <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={() => copyToClipboard(agentResponse)}>
              <Copy className="w-3 h-3 mr-1" /> Copy
            </Button>
          </div>
          <div className="p-4">
            <MarkdownLite text={agentResponse} />
          </div>
        </motion.div>
      )}

      {/* Final Output */}
      {finalOutput && (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="rounded-xl border-2 border-primary/20 bg-card card-elevated overflow-hidden"
          style={{ boxShadow: '0 0 30px hsl(var(--primary) / 0.06)' }}
        >
          <div className="flex items-center justify-between px-4 py-3 border-b border-primary/10" style={{ background: 'var(--gradient-subtle)' }}>
            <div className="flex items-center gap-2">
              <FileText className="w-4 h-4 text-primary" />
              <h3 className="text-sm font-semibold gradient-text">Final Output</h3>
            </div>
            <div className="flex gap-1">
              <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={() => copyToClipboard(finalOutput)}>
                <Copy className="w-3 h-3 mr-1" /> Copy
              </Button>
              <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={onRegenerate}>
                <RefreshCw className="w-3 h-3 mr-1" /> Regenerate
              </Button>
              <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={exportJSON}>
                <Download className="w-3 h-3 mr-1" /> Export
              </Button>
            </div>
          </div>
          <div className="p-5">
            <MarkdownLite text={finalOutput} />
          </div>
        </motion.div>
      )}
    </div>
  );
}
