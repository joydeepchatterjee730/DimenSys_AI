import { motion } from 'framer-motion';
import { Lightbulb, Heart, Target, ShieldAlert, Compass } from 'lucide-react';
import type { KeyInsights } from '@/lib/insights';

interface Props {
  insights: KeyInsights;
}

const items: { key: keyof KeyInsights; label: string; icon: typeof Heart }[] = [
  { key: 'emotion', label: 'User emotion', icon: Heart },
  { key: 'intent', label: 'Intent', icon: Target },
  { key: 'risk', label: 'Risk level', icon: ShieldAlert },
  { key: 'topic', label: 'Topic', icon: Compass },
];

export function KeyInsightsPanel({ insights }: Props) {
  return (
    <motion.section
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="space-y-3"
    >
      <div className="flex items-center gap-2">
        <Lightbulb className="w-4 h-4 text-amber-500" />
        <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Key Insights</h2>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {items.map(({ key, label, icon: Icon }, i) => (
          <motion.div
            key={key}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 * i, duration: 0.35 }}
            className="rounded-xl border border-border/80 bg-card/80 card-elevated p-4 flex gap-3 transition-all duration-300"
          >
            <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
              <Icon className="w-4 h-4 text-primary" />
            </div>
            <div className="min-w-0">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-0.5">{label}</p>
              <p className="text-sm font-semibold text-foreground">{insights[key]}</p>
            </div>
          </motion.div>
        ))}
      </div>
    </motion.section>
  );
}
