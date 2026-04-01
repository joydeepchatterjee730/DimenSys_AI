export interface Dimension {
  id: string;
  name: string;
  icon: string;
  enabled: boolean;
  description: string;
}

export interface DimensionResult {
  dimensionId: string;
  dimensionName: string;
  label: string;
  confidence: number;
  explanation: string;
  executionTime: number;
  rawData?: Record<string, unknown>;
  status: 'pending' | 'processing' | 'complete' | 'error';
  /** Backend dimension error message when the dimension failed server-side */
  error?: string | null;
}

export interface LogEntry {
  id: string;
  timestamp: Date;
  level: 'info' | 'warn' | 'error' | 'debug';
  message: string;
  stage?: string;
}

export interface PipelineStage {
  id: string;
  name: string;
  status: 'idle' | 'processing' | 'complete' | 'error';
  duration?: number;
}

export interface AnalysisRun {
  id: string;
  input: string;
  timestamp: Date;
  dimensions: DimensionResult[];
  agentResponse: string;
  finalOutput: string;
  totalDuration: number;
}

export interface AppConfig {
  configFile: string;
  parallelExecution: boolean;
  debugMode: boolean;
  model: string;
  fusionStrategy: string;
  enabledDimensions: string[];
}
