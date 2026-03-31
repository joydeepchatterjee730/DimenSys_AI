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
  const [finalOutput, setFinalOutput] = useState('');
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const abortRef = useRef(false);

  const updateStage = (id: string, update: Partial<PipelineStage>) => {
    setStages(prev => prev.map(s => s.id === id ? { ...s, ...update } : s));
  };

  const delay = (ms: number) => new Promise(r => setTimeout(r, ms));

  const runAnalysis = useCallback(async (input: string) => {
    abortRef.current = false;
    setStatus('running');
    setDimensionResults([]);
    setAgentResponse('');
    setFinalOutput('');
    setLogs([]);
    setStages(prev => prev.map(s => ({ ...s, status: 'idle' as const })));

    try {
      // Stage 1: Input
      updateStage('input', { status: 'processing' });
      await delay(600);
      if (abortRef.current) return;
      updateStage('input', { status: 'complete', duration: 0.6 });

      // Stage 2: Dimensions (simulate parallel)
      updateStage('dimensions', { status: 'processing' });
      const mockResults = generateMockResults(input);
      const pendingResults = mockResults.map(r => ({ ...r, status: 'processing' as const }));
      setDimensionResults(pendingResults);

      for (let i = 0; i < mockResults.length; i++) {
        await delay(400 + Math.random() * 800);
        if (abortRef.current) return;
        setDimensionResults(prev =>
          prev.map((r, idx) => idx === i ? { ...mockResults[i], status: 'complete' as const } : r)
        );
      }
      updateStage('dimensions', { status: 'complete', duration: 2.1 });

      // Stage 3: Agent
      updateStage('agent', { status: 'processing' });
      await delay(1200);
      if (abortRef.current) return;
      setAgentResponse(generateMockAgentResponse());
      updateStage('agent', { status: 'complete', duration: 1.2 });

      // Stage 4: Fusion
      updateStage('fusion', { status: 'processing' });
      await delay(800);
      if (abortRef.current) return;
      updateStage('fusion', { status: 'complete', duration: 0.8 });

      // Stage 5: Output
      updateStage('output', { status: 'processing' });
      await delay(500);
      if (abortRef.current) return;
      setFinalOutput(generateMockFinalOutput());
      updateStage('output', { status: 'complete', duration: 0.5 });

      setLogs(generateMockLogs());
      setStatus('complete');
    } catch {
      setStatus('error');
    }
  }, [config]);

  const reset = useCallback(() => {
    abortRef.current = true;
    setStatus('idle');
    setStages(prev => prev.map(s => ({ ...s, status: 'idle' as const })));
    setDimensionResults([]);
    setAgentResponse('');
    setFinalOutput('');
    setLogs([]);
  }, []);

  return { status, stages, dimensionResults, agentResponse, finalOutput, logs, runAnalysis, reset };
}
