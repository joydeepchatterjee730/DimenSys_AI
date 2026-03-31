import { motion } from 'framer-motion';
import { Brain, Sparkles, ArrowDown } from 'lucide-react';

export function EmptyState() {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: 0.2 }}
      className="flex flex-col items-center justify-center py-20 px-4"
    >
      <div className="relative mb-6">
        <div className="w-20 h-20 rounded-2xl gradient-bg flex items-center justify-center shadow-lg" style={{ boxShadow: '0 0 40px hsl(var(--primary) / 0.2)' }}>
          <Brain className="w-10 h-10 text-primary-foreground" />
        </div>
        <motion.div
          className="absolute -top-1 -right-1 w-6 h-6 rounded-full gradient-bg flex items-center justify-center"
          animate={{ scale: [1, 1.2, 1] }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          <Sparkles className="w-3 h-3 text-primary-foreground" />
        </motion.div>
      </div>

      <h3 className="text-lg font-bold mb-2 gradient-text">Multi-Dimensional AI Analysis</h3>
      <p className="text-sm text-muted-foreground text-center max-w-md mb-6 leading-relaxed">
        Enter a prompt to see how DimenSys AI breaks it into multiple dimensions, 
        processes each one independently, and fuses them into a single intelligent response.
      </p>

      <div className="flex flex-col items-center gap-2 text-xs text-muted-foreground/60">
        <ArrowDown className="w-4 h-4 animate-bounce" />
        <span>Type your query above to begin</span>
      </div>

      {/* Visual flow hint */}
      <div className="mt-10 flex items-center gap-3 text-[10px] text-muted-foreground/40 font-medium uppercase tracking-widest">
        {['Input', 'Dimensions', 'Agent', 'Fusion', 'Output'].map((step, i) => (
          <div key={step} className="flex items-center gap-3">
            <span>{step}</span>
            {i < 4 && <span>→</span>}
          </div>
        ))}
      </div>
    </motion.div>
  );
}
