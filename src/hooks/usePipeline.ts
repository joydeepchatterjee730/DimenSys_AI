import { useState, useCallback, useRef } from 'react';
import { DimensionResult, PipelineStage, LogEntry, AppConfig } from '@/lib/types';
import { generateMockResults, generateMockAgentResponse, generateMockFinalOutput, generateMockLogs } from '@/lib/mock-data';

export type PipelineStatus = 'idle' | 'running' | 'complete' | 'error';

export function usePipeline(config: AppConfig) {
  const [status, setStatus] = useState<PipelineStatus>('idle');
  const [stages, setStages] = useState<PipelineStage[]>([
    { id: 'input', name: 'Input Processing', status: 'idle' },
    { id: 'dimensions', name: 'Dimension Analysis', status: 'idle' },
    { id: 'agent', name: 'Agent Reasoning', status: 'idle' },
    { id: 'fusion', name: 'Fusion', status: 'idle' },
    { id: 'output', name: 'Final Output', status: 'idle' },
  ]);
  const [dimensionResults, setDimensionResults] = useState<DimensionResult[]>([]);
  const [agentResponse, setAgentResponse] = useState('');
  const [agentInput, setAgentInput] = useState<Record<string, unknown>>({});
  const [finalOutput, setFinalOutput] = useState('');
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [currentInput, setCurrentInput] = useState('');
  const abortRef = useRef(false);

  const updateStage = (id: string, update: Partial<PipelineStage>) => {
    setStages(prev => prev.map(s => s.id === id ? { ...s, ...update } : s));
  };

  const delay = (ms: number) => new Promise(r => setTimeout(r, ms));

  const addLog = (level: LogEntry['level'], message: string, stage: string) => {
    setLogs(prev => [...prev, {
      id: `${Date.now()}-${Math.random()}`,
      timestamp: new Date(),
      level,
      message,
      stage,
    }]);
  };

  const runAnalysis = useCallback(async (input: string) => {
    abortRef.current = false;
    setStatus('running');
    setCurrentInput(input);
    setDimensionResults([]);
    setAgentResponse('');
    setAgentInput({});
    setFinalOutput('');
    setLogs([]);
    setStages(prev => prev.map(s => ({ ...s, status: 'idle' as const, duration: undefined })));

    try {
      // Stage 1: Input Processing
      updateStage('input', { status: 'processing' });
      addLog('info', 'Pipeline initialized', 'init');
      addLog('info', `Config loaded: ${config.configFile}`, 'init');
      await delay(600);
      if (abortRef.current) return;
      addLog('info', 'Input tokenized and preprocessed', 'input');
      updateStage('input', { status: 'complete', duration: 0.6 });

      // Stage 2: Dimensions (simulate parallel or sequential)
      updateStage('dimensions', { status: 'processing' });
      const mockResults = generateMockResults(input);
      
      if (config.parallelExecution) {
        addLog('info', 'Parallel execution enabled — spawning dimension workers', 'dimensions');
        const pendingResults = mockResults.map(r => ({ ...r, status: 'processing' as const }));
        setDimensionResults(pendingResults);

        // Simulate parallel: all start at once, complete at different times
        mockResults.forEach(r => addLog('debug', `${r.dimensionName} analysis started`, 'dimensions'));

        const completionOrder = [...mockResults].sort(() => Math.random() - 0.5);
        for (let i = 0; i < completionOrder.length; i++) {
          await delay(300 + Math.random() * 600);
          if (abortRef.current) return;
          const completing = completionOrder[i];
          setDimensionResults(prev =>
            prev.map(r => r.dimensionId === completing.dimensionId ? { ...completing, status: 'complete' as const } : r)
          );
          addLog('info', `${completing.dimensionName} complete (${(completing.executionTime * 1000).toFixed(0)}ms)`, 'dimensions');
        }
      } else {
        addLog('info', 'Sequential execution — processing dimensions one by one', 'dimensions');
        for (let i = 0; i < mockResults.length; i++) {
          setDimensionResults(prev => [...prev, { ...mockResults[i], status: 'processing' as const }]);
          addLog('debug', `${mockResults[i].dimensionName} analysis started`, 'dimensions');
          await delay(500 + Math.random() * 700);
          if (abortRef.current) return;
          setDimensionResults(prev =>
            prev.map((r, idx) => idx === i ? { ...mockResults[i], status: 'complete' as const } : r)
          );
          addLog('info', `${mockResults[i].dimensionName} complete (${(mockResults[i].executionTime * 1000).toFixed(0)}ms)`, 'dimensions');
        }
      }
      updateStage('dimensions', { status: 'complete', duration: 2.1 });
      addLog('info', 'All dimensions processed', 'dimensions');

      // Stage 3: Agent Reasoning
      updateStage('agent', { status: 'processing' });
      addLog('info', 'Constructing agent input from dimension results', 'agent');
      
      // Build structured agent input
      const structuredInput = {
        model: config.model,
        fusion_strategy: config.fusionStrategy,
        dimensions: mockResults.map(r => ({
          name: r.dimensionId,
          label: r.label,
          confidence: r.confidence,
          explanation: r.explanation,
          time: r.executionTime,
          raw: r.rawData,
        })),
        prompt: input,
        config: {
          parallel: config.parallelExecution,
          debug: config.debugMode,
        },
      };
      setAgentInput(structuredInput);
      addLog('debug', `Agent input constructed (${JSON.stringify(structuredInput).length} bytes)`, 'agent');
      
      await delay(1200);
      if (abortRef.current) return;
      setAgentResponse(generateMockAgentResponse());
      addLog('info', 'Agent reasoning complete', 'agent');
      updateStage('agent', { status: 'complete', duration: 1.2 });

      // Stage 4: Fusion
      updateStage('fusion', { status: 'processing' });
      addLog('info', `Applying ${config.fusionStrategy} fusion strategy`, 'fusion');
      await delay(800);
      if (abortRef.current) return;
      addLog('info', 'Fusion complete — synthesizing final output', 'fusion');
      updateStage('fusion', { status: 'complete', duration: 0.8 });

      // Stage 5: Output
      updateStage('output', { status: 'processing' });
      await delay(500);
      if (abortRef.current) return;
      setFinalOutput(generateMockFinalOutput());
      const totalTime = (0.6 + 2.1 + 1.2 + 0.8 + 0.5);
      addLog('info', `Pipeline complete — total: ${totalTime.toFixed(1)}s`, 'complete');
      updateStage('output', { status: 'complete', duration: 0.5 });

      setStatus('complete');
    } catch {
      setStatus('error');
      addLog('error', 'Pipeline failed with unexpected error', 'error');
    }
  }, [config]);

  const reset = useCallback(() => {
    abortRef.current = true;
    setStatus('idle');
    setCurrentInput('');
    setStages(prev => prev.map(s => ({ ...s, status: 'idle' as const, duration: undefined })));
    setDimensionResults([]);
    setAgentResponse('');
    setAgentInput({});
    setFinalOutput('');
    setLogs([]);
  }, []);

  return { status, stages, dimensionResults, agentResponse, agentInput, finalOutput, logs, currentInput, runAnalysis, reset };
}
