import { motion } from 'framer-motion';
import { Copy, RefreshCw, Download, FileText, FileJson, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

interface Props {
  finalOutput: string;
  onRegenerate: () => void;
}

export function FinalOutputPanel({ finalOutput, onRegenerate }: Props) {
  const copyToClipboard = () => {
    navigator.clipboard.writeText(finalOutput);
    toast.success('Copied to clipboard');
  };

  const exportAs = (format: 'json' | 'text') => {
    const content = format === 'json'
      ? JSON.stringify({ finalOutput, exportedAt: new Date().toISOString() }, null, 2)
      : finalOutput;
    const mime = format === 'json' ? 'application/json' : 'text/plain';
    const ext = format === 'json' ? 'json' : 'txt';
    const blob = new Blob([content], { type: mime });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `dimensys-output.${ext}`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success(`Exported as ${format.toUpperCase()}`);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
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
        {/* Header with gradient */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-primary/10" style={{ background: 'var(--gradient-subtle)' }}>
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-md gradient-bg flex items-center justify-center">
              <FileText className="w-3 h-3 text-primary-foreground" />
            </div>
            <h3 className="text-sm font-bold gradient-text">Synthesized Response</h3>
          </div>
          <div className="flex gap-1">
            <Button variant="ghost" size="sm" className="h-7 text-xs gap-1" onClick={copyToClipboard}>
              <Copy className="w-3 h-3" /> Copy
            </Button>
            <Button variant="ghost" size="sm" className="h-7 text-xs gap-1" onClick={onRegenerate}>
              <RefreshCw className="w-3 h-3" /> Regenerate
            </Button>
            <Button variant="ghost" size="sm" className="h-7 text-xs gap-1" onClick={() => exportAs('json')}>
              <FileJson className="w-3 h-3" /> JSON
            </Button>
            <Button variant="ghost" size="sm" className="h-7 text-xs gap-1" onClick={() => exportAs('text')}>
              <Download className="w-3 h-3" /> Text
            </Button>
          </div>
        </div>

        {/* Content */}
        <div className="p-5 space-y-2.5">
          {finalOutput.split('\n').map((line, i) => {
            if (line.startsWith('**') && line.endsWith('**')) {
              return <h4 key={i} className="font-semibold text-foreground mt-3">{line.replace(/\*\*/g, '')}</h4>;
            }
            if (line.startsWith('- ')) {
              return (
                <motion.p
                  key={i}
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className="text-sm text-muted-foreground pl-4 border-l-2 border-primary/20 py-0.5"
                >
                  {line.slice(2)}
                </motion.p>
              );
            }
            if (line.trim() === '') return <div key={i} className="h-1.5" />;
            return <p key={i} className="text-sm text-foreground/80 leading-relaxed">{line.replace(/\*\*(.*?)\*\*/g, '$1')}</p>;
          })}
        </div>
      </div>
    </motion.div>
  );
}
