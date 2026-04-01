import { useState, useCallback, useRef } from 'react';
import { DimensionResult, PipelineStage, LogEntry, AppConfig, Dimension } from '@/lib/types';
import { analyzeApi, type AnalyzeApiResponse } from '@/lib/api';

export type PipelineStatus = 'idle' | 'running' | 'complete' | 'error';

const BACKEND_DIMENSION_IDS = new Set(['sentiment', 'intent', 'risk', 'semantic']);

function delay(ms: number): Promise<void> {
  return new Promise(r => setTimeout(r, ms));
}

function displayNameFor(id: string, dimensions: Dimension[]): string {
  return dimensions.find(d => d.id === id)?.name ?? id.charAt(0).toUpperCase() + id.slice(1);
}

function orderDimensionsForUi(
  results: DimensionResult[],
  preferredOrder: string[],
): DimensionResult[] {
  const idx = (id: string) => {
    const i = preferredOrder.indexOf(id);
    return i === -1 ? 999 : i;
  };
  return [...results].sort((a, b) => idx(a.dimensionId) - idx(b.dimensionId));
}

function clamp01(n: number): number {
  if (Number.isNaN(n) || !Number.isFinite(n)) return 0;
  return Math.min(1, Math.max(0, n));
}

function mapResponseToResults(
  data: AnalyzeApiResponse,
  preferredOrder: string[],
  dimensions: Dimension[],
): DimensionResult[] {
  const mapped: DimensionResult[] = data.dimensions.map(d => {
    const hasErr = Boolean(d.error);
    const conf = hasErr ? 0 : clamp01(typeof d.confidence === 'number' ? d.confidence : Number(d.confidence));
    return {
      dimensionId: d.name || 'unknown',
      dimensionName: displayNameFor(d.name || 'unknown', dimensions),
      label: hasErr ? 'processing_failed' : (d.label || 'unknown'),
      confidence: conf,
      explanation: hasErr ? (d.explanation || 'This dimension encountered an error during processing.') : (d.explanation || 'No explanation provided.'),
      executionTime: Math.max(0, Number(d.time) || 0),
      rawData: { ...d },
      status: hasErr ? 'error' : 'complete',
      error: d.error ?? null,
    };
  });
  return orderDimensionsForUi(mapped, preferredOrder);
}

function initialStages(): PipelineStage[] {
  return [
    { id: 'input', name: 'Input', status: 'idle' },
    { id: 'dimensions', name: 'Dimensions', status: 'idle' },
    { id: 'agent', name: 'Agent', status: 'idle' },
    { id: 'fusion', name: 'Fusion', status: 'idle' },
    { id: 'output', name: 'Output', status: 'idle' },
  ];
}

export function usePipeline(config: AppConfig, dimensions: Dimension[]) {
  const [status, setStatus] = useState<PipelineStatus>('idle');
  const [stages, setStages] = useState<PipelineStage[]>(initialStages);
  const [dimensionResults, setDimensionResults] = useState<DimensionResult[]>([]);
  const [agentResponse, setAgentResponse] = useState('');
  const [agentInputText, setAgentInputText] = useState('');
  const [finalOutput, setFinalOutput] = useState('');
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [currentInput, setCurrentInput] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [requestId, setRequestId] = useState<string | null>(null);
  const [totalTime, setTotalTime] = useState<number | null>(null);
  const [lastAnalysis, setLastAnalysis] = useState<AnalyzeApiResponse | null>(null);
  const [cached, setCached] = useState(false);
  const [adjustments, setAdjustments] = useState<string[]>([]);
  const abortRef = useRef(false);
  const runIdRef = useRef(0);

  const updateStage = (id: string, update: Partial<PipelineStage>) => {
    setStages(prev => prev.map(s => (s.id === id ? { ...s, ...update } : s)));
  };

  const addLog = (level: LogEntry['level'], message: string, stage: string) => {
    setLogs(prev => [
      ...prev,
      {
        id: `${Date.now()}-${Math.random()}`,
        timestamp: new Date(),
        level,
        message,
        stage,
      },
    ]);
  };

  const resolvedBackendDimensions = useCallback((): string[] => {
    const enabled = config.enabledDimensions.filter(id => BACKEND_DIMENSION_IDS.has(id));
    if (enabled.length > 0) return enabled;
    return Array.from(BACKEND_DIMENSION_IDS);
  }, [config.enabledDimensions]);

  const runAnalysis = useCallback(
    async (input: string) => {
      const myRun = ++runIdRef.current;
      abortRef.current = false;
      setStatus('running');
      setCurrentInput(input);
      setErrorMessage(null);
      setRequestId(null);
      setTotalTime(null);
      setLastAnalysis(null);
      setCached(false);
      setAdjustments([]);
      setAgentResponse('');
      setAgentInputText('');
      setFinalOutput('');
      setLogs([]);
      setStages(initialStages());

      const backendDims = resolvedBackendDimensions();
      const preferredOrder = backendDims;

      const fail = (msg: string) => {
        if (runIdRef.current !== myRun || abortRef.current) return;
        setStatus('error');
        setErrorMessage(msg);
        addLog('error', msg, 'error');
        updateStage('dimensions', { status: 'error' });
        setDimensionResults([]);
      };

      try {
        updateStage('input', { status: 'processing' });
        addLog('info', 'Received input; preparing request', 'input');
        await delay(260);
        if (runIdRef.current !== myRun || abortRef.current) return;
        updateStage('input', { status: 'complete', duration: 0.26 });

        updateStage('dimensions', { status: 'processing' });
        const placeholders: DimensionResult[] = backendDims.map(id => ({
          dimensionId: id,
          dimensionName: displayNameFor(id, dimensions),
          label: 'processing',
          confidence: 0,
          explanation: '',
          executionTime: 0,
          status: 'processing',
        }));
        setDimensionResults(placeholders);

        addLog(
          'info',
          `POST /analyze (dimensions=${backendDims.join(', ')}, parallel=${config.parallelExecution})`,
          'dimensions',
        );

        const data = await analyzeApi({
          text: input,
          config: {
            dimensions: backendDims,
            parallel: config.parallelExecution,
          },
          model: config.model,
          debug: config.debugMode,
        });

        if (runIdRef.current !== myRun || abortRef.current) return;

        setCached(Boolean(data.cached));
        setAdjustments(Array.isArray(data.adjustments) ? data.adjustments : []);

        const dimErrs = data.dimensions.filter(d => d.error).map(d => d.error);
        // Essential telemetry only
        if (dimErrs.length > 0) {
          console.warn('[DimenSys errors]', { request_id: data.request_id, errors: dimErrs });
        }

        const mapped = mapResponseToResults(data, preferredOrder, dimensions);
        const dimsWall = mapped.reduce((s, r) => s + r.executionTime, 0);

        updateStage('dimensions', { status: 'complete', duration: Math.max(dimsWall, 0.05) });
        addLog('info', `Dimensions complete (${mapped.length})`, 'dimensions');

        // Ensure proper stage sequence: dimensions complete before agent starts
        if (config.parallelExecution) {
          setDimensionResults(mapped.map(r => ({ ...r, status: 'processing' as const })));
          await delay(90);
          if (runIdRef.current !== myRun || abortRef.current) return;
          setDimensionResults(mapped);
        } else {
          setDimensionResults([]);
          for (let i = 0; i < mapped.length; i++) {
            if (runIdRef.current !== myRun || abortRef.current) return;
            await delay(180);
            if (runIdRef.current !== myRun || abortRef.current) return;
            setDimensionResults(mapped.slice(0, i + 1));
          }
          if (runIdRef.current !== myRun || abortRef.current) return;
          setDimensionResults(mapped);
        }
        
        // Small delay to ensure dimensions are visually complete before agent
        await delay(100);
        if (runIdRef.current !== myRun || abortRef.current) return;

        setRequestId(data.request_id);
        setTotalTime(data.total_time);
        addLog('info', `request_id=${data.request_id} total_time=${data.total_time.toFixed(2)}s`, 'meta');

        updateStage('agent', { status: 'processing' });
        addLog('info', 'Agent reasoning…', 'agent');
        await delay(420);
        if (runIdRef.current !== myRun || abortRef.current) return;
        setAgentInputText(data.agent.input);
        setAgentResponse(data.agent.response);
        updateStage('agent', { status: 'complete', duration: 0.42 });

        updateStage('fusion', { status: 'processing' });
        addLog('info', 'Fusion…', 'fusion');
        await delay(380);
        if (runIdRef.current !== myRun || abortRef.current) return;
        updateStage('fusion', { status: 'complete', duration: 0.38 });

        updateStage('output', { status: 'processing' });
        await delay(220);
        if (runIdRef.current !== myRun || abortRef.current) return;
        setFinalOutput(data.final_output);
        setLastAnalysis(data);
        updateStage('output', { status: 'complete', duration: 0.22 });
        addLog('info', 'Pipeline complete', 'output');

        setStatus('complete');
      } catch (e: unknown) {
        const msg = e instanceof Error ? e.message : 'Unknown error';
        fail(msg);
      }
    },
    [config.parallelExecution, config.debugMode, resolvedBackendDimensions, dimensions],
  );

  const reset = useCallback(() => {
    abortRef.current = true;
    setStatus('idle');
    setCurrentInput('');
    setStages(initialStages());
    setDimensionResults([]);
    setAgentResponse('');
    setAgentInputText('');
    setFinalOutput('');
    setLogs([]);
    setErrorMessage(null);
    setRequestId(null);
    setTotalTime(null);
    setLastAnalysis(null);
    setCached(false);
    setAdjustments([]);
  }, []);

  const clearResults = useCallback(() => {
    abortRef.current = true;
    setStatus('idle');
    setStages(initialStages());
    setDimensionResults([]);
    setAgentResponse('');
    setAgentInputText('');
    setFinalOutput('');
    setLogs([]);
    setErrorMessage(null);
    setRequestId(null);
    setTotalTime(null);
    setLastAnalysis(null);
    setCached(false);
    setAdjustments([]);
  }, []);

  return {
    status,
    stages,
    dimensionResults,
    agentResponse,
    agentInputText,
    finalOutput,
    logs,
    currentInput,
    errorMessage,
    requestId,
    totalTime,
    lastAnalysis,
    cached,
    adjustments,
    runAnalysis,
    reset,
    clearResults,
  };
}
