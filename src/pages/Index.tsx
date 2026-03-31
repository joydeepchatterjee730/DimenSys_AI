import { useState, useCallback } from 'react';
import { Send, Eraser, Bug, Moon, Sun } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { ConfigSidebar } from '@/components/ConfigSidebar';
import { PipelineVisualizer } from '@/components/PipelineVisualizer';
import { DimensionCard } from '@/components/DimensionCard';
import { OutputPanel } from '@/components/OutputPanel';
import { DebugPanel } from '@/components/DebugPanel';
import { HistoryPanel } from '@/components/HistoryPanel';
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
          <div className="flex items-center gap-2">
            <h1 className="text-sm font-semibold">
              {activeNav === 'dashboard' ? 'Analysis Dashboard' : activeNav === 'history' ? 'History' : 'Settings'}
            </h1>
            {pipeline.status === 'running' && (
              <span className="flex items-center gap-1.5 text-xs text-primary">
                <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
                Processing...
              </span>
            )}
          </div>
          <div className="flex items-center gap-1">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={() => setDebugVisible(!debugVisible)}>
                  <Bug className="w-4 h-4" />
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
                  <Textarea
                    value={input}
                    onChange={e => setInput(e.target.value)}
                    placeholder="Describe what you want analyzed..."
                    className="min-h-[100px] resize-none text-sm bg-card border-border focus-visible:ring-primary/30"
                    onKeyDown={e => {
                      if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) handleRun();
                    }}
                  />
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">⌘+Enter to run</span>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" onClick={handleClear} disabled={pipeline.status === 'running'}>
                        <Eraser className="w-3.5 h-3.5 mr-1.5" /> Clear
                      </Button>
                      <Button size="sm" onClick={handleRun} disabled={!input.trim() || pipeline.status === 'running'} className="gradient-bg border-0 text-primary-foreground hover:opacity-90">
                        <Send className="w-3.5 h-3.5 mr-1.5" /> Run Analysis
                      </Button>
                    </div>
                  </div>
                </div>

                {/* Pipeline Visualization */}
                {pipeline.status !== 'idle' && (
                  <div className="rounded-xl border border-border bg-card card-elevated p-3">
                    <PipelineVisualizer stages={pipeline.stages} />
                  </div>
                )}

                {/* Dimension Cards */}
                {pipeline.dimensionResults.length > 0 && (
                  <div>
                    <h2 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-3">Dimension Analysis</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {pipeline.dimensionResults.map((result, i) => (
                        <DimensionCard key={result.dimensionId} result={result} index={i} />
                      ))}
                    </div>
                  </div>
                )}

                {/* Output Panels */}
                {(pipeline.agentResponse || pipeline.finalOutput) && (
                  <OutputPanel
                    agentResponse={pipeline.agentResponse}
                    finalOutput={pipeline.finalOutput}
                    onRegenerate={() => pipeline.runAnalysis(input)}
                  />
                )}
              </div>
            )}
          </div>

          {/* Debug Panel */}
          <DebugPanel logs={pipeline.logs} visible={debugVisible} onClose={() => setDebugVisible(false)} />
        </div>
      </main>
    </div>
  );
};

export default Index;
