import { useState, useCallback, useMemo } from 'react';
import { Send, Eraser, Bug, Moon, Sun, Zap, ListX, ChevronDown } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
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
import { getApiBaseUrl } from '@/lib/api';
import { extractKeyInsights } from '@/lib/insights';
import { shouldShowHighRiskFearWarning } from '@/lib/safety';
import { KeyInsightsPanel } from '@/components/KeyInsightsPanel';
import { ReasoningExplainer } from '@/components/ReasoningExplainer';

const DEMO_PRESETS = [
  { id: 'finance', emoji: '💰', label: 'Finance', text: 'I want to invest but I am scared' },
  { id: 'mental', emoji: '🧠', label: 'Mental Health', text: 'I feel anxious about my future' },
  { id: 'education', emoji: '📚', label: 'Education', text: 'Explain artificial intelligence in simple terms' },
] as const;

const TEST_SCENARIOS = [
  { id: 'emotional', label: 'Emotional', text: 'I feel lost and anxious about my career' },
  { id: 'financial_risk', label: 'Financial risk', text: 'Should I invest all my savings into crypto?' },
  { id: 'neutral', label: 'Neutral', text: 'Explain how blockchain works' },
] as const;

const Index = () => {
  const { isDark, toggle: toggleTheme } = useTheme();
  const [config, setConfig] = useState<AppConfig>(DEFAULT_CONFIG);
  const [dimensions, setDimensions] = useState<Dimension[]>(DEFAULT_DIMENSIONS);
  const [activeNav, setActiveNav] = useState('dashboard');
  const [input, setInput] = useState('');
  const [debugVisible, setDebugVisible] = useState(false);

  const pipeline = usePipeline(config, dimensions);

  const handleRun = useCallback(() => {
    if (!input.trim()) return;
    pipeline.runAnalysis(input.trim());
  }, [input, pipeline]);

  const handleClear = () => {
    setInput('');
    pipeline.reset();
  };

  const showDebug = debugVisible || config.debugMode;

  const agentStageStatus = pipeline.stages.find(s => s.id === 'agent')?.status;
  const showAgentPanel = agentStageStatus === 'processing' || agentStageStatus === 'complete';
  const agentLoading = agentStageStatus === 'processing' && !pipeline.agentResponse;

  const exportPayload = useMemo((): Record<string, unknown> | null => {
    if (!pipeline.lastAnalysis) return null;
    return pipeline.lastAnalysis as unknown as Record<string, unknown>;
  }, [pipeline.lastAnalysis]);

  const keyInsights = useMemo(
    () => extractKeyInsights(pipeline.dimensionResults),
    [pipeline.dimensionResults],
  );

  const showSafetyBanner = useMemo(
    () => pipeline.status === 'complete' && shouldShowHighRiskFearWarning(pipeline.dimensionResults),
    [pipeline.status, pipeline.dimensionResults],
  );

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

      <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <header className="flex items-center justify-between px-6 h-14 border-b border-border bg-card/50 shrink-0">
          <div className="flex items-center gap-3">
            <div>
              <h1 className="text-sm font-semibold">
                {activeNav === 'dashboard' ? 'Analysis Dashboard' : activeNav === 'history' ? 'History' : 'Settings'}
              </h1>
              {activeNav === 'dashboard' && (
                <p className="text-[10px] text-muted-foreground/70">Multi-Dimensional AI Reasoning System</p>
              )}
            </div>
            <AnimatePresence>
              {pipeline.status === 'running' && (
                <motion.span
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -8 }}
                  className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-primary/10 text-xs text-primary font-medium"
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
                  Processing analysis…
                </motion.span>
              )}
              {pipeline.status === 'complete' && (
                <motion.span
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0 }}
                  className="flex items-center gap-2 flex-wrap"
                >
                  <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-success/10 text-xs text-success font-medium">
                    ✓ Analysis complete
                  </span>
                  {pipeline.totalTime != null && (
                    <span className="text-xs font-medium text-muted-foreground tabular-nums">
                      Processed in {pipeline.totalTime < 10 ? pipeline.totalTime.toFixed(2) : pipeline.totalTime.toFixed(1)}s
                    </span>
                  )}
                </motion.span>
              )}
              {pipeline.status === 'error' && (
                <motion.span
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-xs text-destructive font-medium"
                >
                  Analysis failed
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
              <TooltipContent>Debug information</TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={toggleTheme}>
                  {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
                </Button>
              </TooltipTrigger>
              <TooltipContent>Toggle theme</TooltipContent>
            </Tooltip>
          </div>
        </header>

        <div className="flex flex-1 min-h-0">
          <div className="flex-1 overflow-y-auto scrollbar-thin">
            {activeNav === 'history' ? (
              <div className="p-6">
                <HistoryPanel
                  history={MOCK_HISTORY}
                  onSelect={(run) => { setInput(run.input); setActiveNav('dashboard'); }}
                />
              </div>
            ) : activeNav === 'settings' ? (
              <div className="p-6 max-w-2xl mx-auto space-y-4">
                <h2 className="text-lg font-semibold mb-4">Settings</h2>
                <p className="text-sm text-muted-foreground">
                  Backend URL (Vite env):{' '}
                  <code tabIndex={0} className="text-xs bg-muted px-1.5 py-0.5 rounded">{getApiBaseUrl()}</code>
                </p>
                <p className="text-sm text-muted-foreground">
                  Override with <code className="text-xs bg-muted px-1 rounded">VITE_API_URL</code> in a{' '}
                  <code className="text-xs bg-muted px-1 rounded">.env</code> file (default{' '}
                  <code className="text-xs bg-muted px-1 rounded">http://localhost:8000</code>).
                </p>
              </div>
            ) : (
              <div className="p-6 max-w-4xl mx-auto space-y-6">
                <div className="space-y-3">
                  <div className="flex flex-wrap gap-2">
                    <span className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold w-full sm:w-auto sm:mr-2 py-1">
                      Demo presets
                    </span>
                    {DEMO_PRESETS.map(p => (
                      <Button
                        key={p.id}
                        type="button"
                        variant="outline"
                        size="sm"
                        className="h-8 text-xs gap-1.5 rounded-full border-dashed"
                        onClick={() => setInput(p.text)}
                        disabled={pipeline.status === 'running'}
                      >
                        <span aria-hidden>{p.emoji}</span>
                        {p.label}
                      </Button>
                    ))}
                  </div>
                  <Collapsible className="border border-border rounded-lg px-3 py-2 bg-muted/15">
                    <CollapsibleTrigger className="flex w-full items-center justify-between gap-2 text-left text-sm font-medium text-foreground hover:text-primary/90 py-1 [&[data-state=open]>svg]:rotate-180">
                      <span>Test scenarios</span>
                      <ChevronDown className="w-4 h-4 shrink-0 text-muted-foreground transition-transform duration-200" />
                    </CollapsibleTrigger>
                    <CollapsibleContent className="pt-3 pb-1">
                      <div className="flex flex-wrap gap-2">
                        {TEST_SCENARIOS.map(s => (
                          <Button
                            key={s.id}
                            type="button"
                            variant="secondary"
                            size="sm"
                            className="h-8 text-xs"
                            onClick={() => setInput(s.text)}
                            disabled={pipeline.status === 'running'}
                          >
                            {s.label}
                          </Button>
                        ))}
                      </div>
                    </CollapsibleContent>
                  </Collapsible>
                  <div className="relative">
                    <Textarea
                      value={input}
                      onChange={e => setInput(e.target.value)}
                      placeholder="Describe what you want analyzed…"
                      className="min-h-[110px] resize-none text-sm bg-card border-border focus-visible:ring-primary/30 pr-4"
                      onKeyDown={e => {
                        if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) handleRun();
                      }}
                    />
                  </div>
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <div className="flex items-center gap-3">
                      <span className="text-[10px] text-muted-foreground font-mono">⌘+Enter to run</span>
                      {config.parallelExecution && (
                        <span className="flex items-center gap-1 text-[10px] text-primary/60">
                          <Zap className="w-3 h-3" /> Parallel mode
                        </span>
                      )}
                      <span className="text-[10px] text-muted-foreground/70 hidden sm:inline">
                        API: {getApiBaseUrl()}
                      </span>
                    </div>
                    <div className="flex gap-2 flex-wrap">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => pipeline.clearResults()}
                        disabled={pipeline.status === 'running' || pipeline.status === 'idle'}
                        className="h-9"
                      >
                        <ListX className="w-3.5 h-3.5 mr-1.5" /> Clear results
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleClear}
                        disabled={pipeline.status === 'running'}
                        className="h-9"
                      >
                        <Eraser className="w-3.5 h-3.5 mr-1.5" /> Clear all
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
                            Analyzing…
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

                {pipeline.status === 'idle' && <EmptyState />}

                {pipeline.status !== 'idle' && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.35 }}
                    className="space-y-10"
                  >
                    {pipeline.errorMessage && (
                      <Alert variant="destructive">
                        <AlertTitle>Analysis failed</AlertTitle>
                        <AlertDescription className="text-sm mt-1">
                          {pipeline.errorMessage.includes('fetch') ? 'Could not connect to the analysis service.' : 'Analysis failed. Please try again.'}
                          <span className="block mt-2 text-xs opacity-90">
                            Check if the backend is running at {getApiBaseUrl()}.
                          </span>
                        </AlertDescription>
                      </Alert>
                    )}

                    <div className="rounded-xl border border-border bg-card card-elevated p-4 space-y-3">
                      <PipelineVisualizer
                        stages={pipeline.stages}
                        parallelExecution={config.parallelExecution}
                        wallTimeSeconds={pipeline.totalTime}
                      />
                      {pipeline.status === 'complete' && (pipeline.cached || pipeline.adjustments.length > 0) && (
                        <motion.div
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          className="flex flex-wrap items-center gap-2 text-xs"
                        >
                          {pipeline.cached && (
                            <Badge variant="secondary" className="font-normal">
                              Cached result
                            </Badge>
                          )}
                          {pipeline.adjustments.length > 0 && (
                            <span className="text-muted-foreground">
                              Adjusted for consistency
                            </span>
                          )}
                        </motion.div>
                      )}
                      {pipeline.status === 'complete' && pipeline.requestId && (
                        <motion.p
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          className="text-[10px] text-muted-foreground/80 font-mono flex flex-wrap gap-x-4 gap-y-1 pt-1"
                        >
                          <span title="Debug / demo correlation id">request_id: {pipeline.requestId}</span>
                          {pipeline.totalTime != null && (
                            <span className="tabular-nums">total_time: {pipeline.totalTime.toFixed(3)}s</span>
                          )}
                        </motion.p>
                      )}
                    </div>

                    {pipeline.dimensionResults.length > 0 && (
                      <motion.div
                        initial={{ opacity: 0, y: 12 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.35 }}
                        className="space-y-3"
                      >
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-base">🧩</span>
                          <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                            Dimension Analysis
                          </h2>
                          <span className="text-[10px] text-muted-foreground/60 font-mono">
                            {pipeline.dimensionResults.filter(r => r.status === 'complete' || r.status === 'error').length}
                            /
                            {pipeline.dimensionResults.length}
                            {' '}
                            resolved
                          </span>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          {pipeline.dimensionResults.map((result, i) => (
                            <DimensionCard
                              key={`${result.dimensionId}-${i}`}
                              result={result}
                              index={i}
                              appearTogether={config.parallelExecution}
                            />
                          ))}
                        </div>
                      </motion.div>
                    )}

                    <AgentProcessingPanel
                      agentInputText={pipeline.agentInputText}
                      agentResponse={pipeline.agentResponse}
                      visible={showAgentPanel}
                      loading={agentLoading}
                    />

                    {showSafetyBanner && (
                      <motion.div
                        initial={{ opacity: 0, y: 6 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.35 }}
                      >
                        <Alert className="border-amber-500/40 bg-amber-500/10 text-amber-950 dark:text-amber-100 dark:bg-amber-950/30">
                          <AlertTitle className="text-sm">Safety notice</AlertTitle>
                          <AlertDescription className="text-sm">
                            This situation may involve high risk. Consider seeking professional advice.
                          </AlertDescription>
                        </Alert>
                      </motion.div>
                    )}

                    {pipeline.finalOutput && pipeline.dimensionResults.length > 0 && (
                      <KeyInsightsPanel insights={keyInsights} />
                    )}

                    {pipeline.finalOutput && (
                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.08, duration: 0.4 }}
                        className="space-y-4"
                      >
                        <FinalOutputPanel
                          finalOutput={pipeline.finalOutput}
                          onRegenerate={() => {
                            if (input.trim()) pipeline.runAnalysis(input.trim());
                          }}
                          exportPayload={exportPayload}
                        />
                        <ReasoningExplainer
                          dimensionResults={pipeline.dimensionResults}
                          agentInputText={pipeline.agentInputText}
                        />
                      </motion.div>
                    )}
                    
                    {pipeline.finalOutput && (
                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.6, duration: 0.4 }}
                        className="text-center py-2"
                      >
                        <p className="text-[10px] text-muted-foreground/60 italic">
                          This response was generated using structured multi-dimensional analysis.
                        </p>
                      </motion.div>
                    )}
                  </motion.div>
                )}
              </div>
            )}
          </div>

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
