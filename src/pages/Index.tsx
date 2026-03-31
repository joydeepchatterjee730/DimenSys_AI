import { useState, useCallback } from 'react';
import { Send, Eraser, Bug, Moon, Sun, Zap } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { ConfigSidebar } from '@/components/ConfigSidebar';
import { PipelineVisualizer } from '@/components/PipelineVisualizer';
import { DimensionCard } from '@/components/DimensionCard';
import { AgentProcessingPanel } from '@/components/AgentProcessingPanel';
import { FinalOutputPanel } from '@/components/FinalOutputPanel';
import { DebugPanel } from '@/components/DebugPanel';
import { HistoryPanel } from '@/components/HistoryPanel';
import { EmptyState } from '@/components/EmptyState';
import { useTheme } from '@/hooks/useTheme';
import { usePipeline } from '@/hooks/usePipeline';
import { AppConfig, Dimension } from '@/lib/types';
import { DEFAULT_CONFIG, DEFAULT_DIMENSIONS, MOCK_HISTORY } from '@/lib/mock-data';

const Index = () => {
  const { isDark, toggle: toggleTheme } = useTheme();
  const [config, setConfig] = useState<AppConfig>(DEFAULT_CONFIG);
  const [dimensions, setDimensions] = useState<Dimension[]>(DEFAULT_DIMENSIONS);
  const [activeNav, setActiveNav] = useState('dashboard');
  const [input, setInput] = useState('');
  const [debugVisible, setDebugVisible] = useState(false);

  const pipeline = usePipeline(config);

  const handleRun = useCallback(() => {
    if (!input.trim()) return;
    pipeline.runAnalysis(input.trim());
  }, [input, pipeline]);

  const handleClear = () => {
    setInput('');
    pipeline.reset();
  };

  // Auto-show debug panel when debug mode is enabled
  const showDebug = debugVisible || config.debugMode;

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <ConfigSidebar
        config={config}
        onConfigChange={setConfig}
        dimensions={dimensions}
        onDimensionsChange={setDimensions}
        activeNav={activeNav}
        onNavChange={setActiveNav}
      />

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top Bar */}
        <header className="flex items-center justify-between px-6 h-14 border-b border-border bg-card/50 shrink-0">
          <div className="flex items-center gap-3">
            <h1 className="text-sm font-semibold">
              {activeNav === 'dashboard' ? 'Analysis Dashboard' : activeNav === 'history' ? 'History' : 'Settings'}
            </h1>
            <AnimatePresence>
              {pipeline.status === 'running' && (
                <motion.span
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -8 }}
                  className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-primary/10 text-xs text-primary font-medium"
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
                  Processing pipeline...
                </motion.span>
              )}
              {pipeline.status === 'complete' && (
                <motion.span
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0 }}
                  className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-success/10 text-xs text-success font-medium"
                >
                  ✓ Analysis complete
                </motion.span>
              )}
            </AnimatePresence>
          </div>
          <div className="flex items-center gap-1">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant={showDebug ? 'default' : 'ghost'}
                  size="sm"
                  className={`h-8 w-8 p-0 ${showDebug ? 'gradient-bg border-0' : ''}`}
                  onClick={() => setDebugVisible(!debugVisible)}
                >
                  <Bug className={`w-4 h-4 ${showDebug ? 'text-primary-foreground' : ''}`} />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Toggle Debug Panel</TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={toggleTheme}>
                  {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
                </Button>
              </TooltipTrigger>
              <TooltipContent>Toggle Theme</TooltipContent>
            </Tooltip>
          </div>
        </header>

        <div className="flex flex-1 min-h-0">
          {/* Center Content */}
          <div className="flex-1 overflow-y-auto scrollbar-thin">
            {activeNav === 'history' ? (
              <div className="p-6">
                <HistoryPanel history={MOCK_HISTORY} onSelect={(run) => { setInput(run.input); setActiveNav('dashboard'); }} />
              </div>
            ) : activeNav === 'settings' ? (
              <div className="p-6 max-w-2xl mx-auto">
                <h2 className="text-lg font-semibold mb-4">Settings</h2>
                <p className="text-sm text-muted-foreground">Configure your DimenSys AI instance. All settings are applied in real-time.</p>
              </div>
            ) : (
              <div className="p-6 max-w-4xl mx-auto space-y-6">
                {/* Input Section */}
                <div className="space-y-3">
                  <div className="relative">
                    <Textarea
                      value={input}
                      onChange={e => setInput(e.target.value)}
                      placeholder="Describe what you want analyzed..."
                      className="min-h-[110px] resize-none text-sm bg-card border-border focus-visible:ring-primary/30 pr-4"
                      onKeyDown={e => {
                        if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) handleRun();
                      }}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="text-[10px] text-muted-foreground font-mono">⌘+Enter to run</span>
                      {config.parallelExecution && (
                        <span className="flex items-center gap-1 text-[10px] text-primary/60">
                          <Zap className="w-3 h-3" /> Parallel mode
                        </span>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleClear}
                        disabled={pipeline.status === 'running'}
                        className="h-9"
                      >
                        <Eraser className="w-3.5 h-3.5 mr-1.5" /> Clear
                      </Button>
                      <Button
                        size="sm"
                        onClick={handleRun}
                        disabled={!input.trim() || pipeline.status === 'running'}
                        className="h-9 gradient-bg border-0 text-primary-foreground hover:opacity-90 px-5 font-semibold"
                      >
                        {pipeline.status === 'running' ? (
                          <>
                            <motion.div
                              animate={{ rotate: 360 }}
                              transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                              className="mr-2"
                            >
                              <Zap className="w-3.5 h-3.5" />
                            </motion.div>
                            Analyzing...
                          </>
                        ) : (
                          <>
                            <Send className="w-3.5 h-3.5 mr-2" />
                            Analyze with DimenSys
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                </div>

                {/* Empty State */}
                {pipeline.status === 'idle' && <EmptyState />}

                {/* Results Section */}
                {pipeline.status !== 'idle' && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="space-y-8"
                  >
                    {/* Pipeline Visualization */}
                    <div className="rounded-xl border border-border bg-card card-elevated p-4">
                      <PipelineVisualizer stages={pipeline.stages} parallelExecution={config.parallelExecution} />
                    </div>

                    {/* Dimension Analysis Section */}
                    {pipeline.dimensionResults.length > 0 && (
                      <motion.div
                        initial={{ opacity: 0, y: 12 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="space-y-3"
                      >
                        <div className="flex items-center gap-2">
                          <span className="text-base">🧩</span>
                          <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Dimension Analysis</h2>
                          <span className="text-[10px] text-muted-foreground/60 font-mono">
                            {pipeline.dimensionResults.filter(r => r.status === 'complete').length}/{pipeline.dimensionResults.length} complete
                          </span>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          {pipeline.dimensionResults.map((result, i) => (
                            <DimensionCard key={result.dimensionId} result={result} index={i} />
                          ))}
                        </div>
                      </motion.div>
                    )}

                    {/* Agent Processing Section */}
                    <AgentProcessingPanel
                      agentInput={pipeline.agentInput}
                      agentResponse={pipeline.agentResponse}
                      visible={!!pipeline.agentResponse}
                    />

                    {/* Final Output Section */}
                    {pipeline.finalOutput && (
                      <FinalOutputPanel
                        finalOutput={pipeline.finalOutput}
                        onRegenerate={() => pipeline.runAnalysis(input)}
                      />
                    )}
                  </motion.div>
                )}
              </div>
            )}
          </div>

          {/* Debug Panel */}
          <DebugPanel
            logs={pipeline.logs}
            stages={pipeline.stages}
            dimensionResults={pipeline.dimensionResults}
            visible={showDebug}
            onClose={() => { setDebugVisible(false); }}
          />
        </div>
      </main>
    </div>
  );
};

export default Index;
