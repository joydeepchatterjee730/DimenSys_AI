import { Dimension, DimensionResult, LogEntry, AnalysisRun, AppConfig } from './types';

export const DEFAULT_DIMENSIONS: Dimension[] = [
  { id: 'sentiment', name: 'Sentiment', icon: '💭', enabled: true, description: 'Analyzes emotional tone and polarity of the input' },
  { id: 'intent', name: 'Intent', icon: '🎯', enabled: true, description: 'Identifies the purpose or goal behind the query' },
  { id: 'risk', name: 'Risk', icon: '⚠️', enabled: true, description: 'Evaluates potential risks or concerns in the content' },
  { id: 'semantic', name: 'Semantic', icon: '🔗', enabled: true, description: 'Extracts deep meaning and contextual relationships' },
  { id: 'complexity', name: 'Complexity', icon: '🧩', enabled: false, description: 'Measures structural and conceptual complexity' },
  { id: 'temporal', name: 'Temporal', icon: '⏰', enabled: false, description: 'Identifies time-related references and urgency' },
];

export const MODELS = [
  'nvidia/llama-3.1-nemotron-70b',
  'nvidia/llama-3.1-nemotron-8b',
  'nvidia/mistral-nemo-12b',
  'nvidia/gemma-2-27b',
];

export const FUSION_STRATEGIES = [
  'Weighted Average',
  'Attention-Based',
  'Hierarchical',
  'Ensemble Voting',
];

export const DEFAULT_CONFIG: AppConfig = {
  configFile: 'default.yaml',
  parallelExecution: true,
  debugMode: false,
  model: MODELS[0],
  fusionStrategy: FUSION_STRATEGIES[0],
  enabledDimensions: ['sentiment', 'intent', 'risk', 'semantic'],
};

export function generateMockResults(input: string): DimensionResult[] {
  return [
    {
      dimensionId: 'sentiment',
      dimensionName: 'Sentiment',
      label: 'Concerned / Cautious',
      confidence: 0.87,
      explanation: 'The input expresses cautious concern with undertones of seeking reassurance. The language patterns suggest moderate anxiety balanced with analytical curiosity.',
      executionTime: 1.24,
      rawData: { polarity: -0.23, subjectivity: 0.67, emotions: { concern: 0.4, curiosity: 0.35, neutral: 0.25 } },
      status: 'complete',
    },
    {
      dimensionId: 'intent',
      dimensionName: 'Intent',
      label: 'Analysis Request',
      confidence: 0.94,
      explanation: 'The user is seeking a detailed analytical breakdown. The query structure indicates a desire for comprehensive evaluation rather than a simple answer.',
      executionTime: 0.89,
      rawData: { primary: 'analysis', secondary: 'evaluation', confidence_breakdown: { analysis: 0.94, question: 0.04, command: 0.02 } },
      status: 'complete',
    },
    {
      dimensionId: 'risk',
      dimensionName: 'Risk Assessment',
      label: 'Low Risk',
      confidence: 0.91,
      explanation: 'No significant risk factors detected. The content is informational in nature with no harmful intent or sensitive data exposure.',
      executionTime: 1.56,
      rawData: { risk_score: 0.08, categories: { harmful: 0.01, sensitive: 0.05, bias: 0.02 } },
      status: 'complete',
    },
    {
      dimensionId: 'semantic',
      dimensionName: 'Semantic Analysis',
      label: 'Multi-domain Context',
      confidence: 0.82,
      explanation: 'The input spans multiple knowledge domains, requiring cross-referencing between technical and conceptual frameworks. Key entities and relationships have been mapped.',
      executionTime: 2.1,
      rawData: { entities: ['AI', 'reasoning', 'analysis'], domains: ['technology', 'cognition'], depth: 3 },
      status: 'complete',
    },
  ];
}

export function generateMockAgentResponse(): string {
  return `Based on the multi-dimensional analysis, I've synthesized the following understanding:

**Key Findings:**
1. The query demonstrates analytical intent with moderate emotional concern
2. No risk factors detected — safe to provide comprehensive analysis
3. The semantic structure suggests cross-domain knowledge is needed

**Reasoning Chain:**
- Sentiment dimension indicates the user wants reassurance alongside information
- Intent classification strongly suggests an analysis request (94% confidence)
- Risk assessment confirms safe processing parameters
- Semantic analysis reveals multi-domain context requiring integrated response

**Fusion Notes:**
All dimensions converge on providing a thorough, explanatory response that addresses both the analytical and emotional aspects of the query.`;
}

export function generateMockFinalOutput(): string {
  return `The analysis of your input reveals a multi-layered query that combines analytical curiosity with practical concern. Here's the synthesized response:

Your question touches on the intersection of AI reasoning and system transparency. The DimenSys approach breaks down complex inputs into orthogonal dimensions — each capturing a different facet of meaning — before reunifying them into a coherent response.

**What this means for your use case:**
- The system identified your primary intent as seeking analysis (94% confidence)
- Emotional undertones suggest you value thoroughness and transparency
- No risk factors were detected, allowing for an unrestricted response
- The semantic richness of your query enabled deeper contextual understanding

This multi-dimensional approach ensures that no single aspect of your input is overlooked, resulting in a more nuanced and comprehensive response than traditional single-pass processing.`;
}

export function generateMockLogs(): LogEntry[] {
  const now = new Date();
  return [
    { id: '1', timestamp: new Date(now.getTime() - 5000), level: 'info', message: 'Pipeline initialized', stage: 'init' },
    { id: '2', timestamp: new Date(now.getTime() - 4800), level: 'info', message: 'Config loaded: default.yaml', stage: 'init' },
    { id: '3', timestamp: new Date(now.getTime() - 4500), level: 'info', message: 'Parallel execution enabled — spawning dimension workers', stage: 'dimensions' },
    { id: '4', timestamp: new Date(now.getTime() - 4200), level: 'debug', message: 'Sentiment analysis started', stage: 'dimensions' },
    { id: '5', timestamp: new Date(now.getTime() - 4200), level: 'debug', message: 'Intent classification started', stage: 'dimensions' },
    { id: '6', timestamp: new Date(now.getTime() - 4200), level: 'debug', message: 'Risk assessment started', stage: 'dimensions' },
    { id: '7', timestamp: new Date(now.getTime() - 4200), level: 'debug', message: 'Semantic analysis started', stage: 'dimensions' },
    { id: '8', timestamp: new Date(now.getTime() - 3300), level: 'info', message: 'Intent classification complete (0.89s)', stage: 'dimensions' },
    { id: '9', timestamp: new Date(now.getTime() - 2960), level: 'info', message: 'Sentiment analysis complete (1.24s)', stage: 'dimensions' },
    { id: '10', timestamp: new Date(now.getTime() - 2640), level: 'info', message: 'Risk assessment complete (1.56s)', stage: 'dimensions' },
    { id: '11', timestamp: new Date(now.getTime() - 2100), level: 'info', message: 'Semantic analysis complete (2.1s)', stage: 'dimensions' },
    { id: '12', timestamp: new Date(now.getTime() - 2000), level: 'info', message: 'All dimensions processed — starting fusion', stage: 'fusion' },
    { id: '13', timestamp: new Date(now.getTime() - 1500), level: 'info', message: 'Weighted Average fusion complete', stage: 'fusion' },
    { id: '14', timestamp: new Date(now.getTime() - 1400), level: 'info', message: 'Agent reasoning started', stage: 'agent' },
    { id: '15', timestamp: new Date(now.getTime() - 500), level: 'info', message: 'Agent response generated', stage: 'agent' },
    { id: '16', timestamp: new Date(now.getTime()), level: 'info', message: 'Pipeline complete — total: 5.0s', stage: 'complete' },
  ];
}

export const MOCK_HISTORY: AnalysisRun[] = [
  {
    id: '1',
    input: 'Analyze the potential impact of quantum computing on current encryption standards',
    timestamp: new Date(Date.now() - 3600000),
    dimensions: [],
    agentResponse: '',
    finalOutput: 'Quantum computing poses significant risks to RSA and ECC encryption...',
    totalDuration: 4.8,
  },
  {
    id: '2',
    input: 'What are the ethical implications of autonomous decision-making in healthcare AI?',
    timestamp: new Date(Date.now() - 7200000),
    dimensions: [],
    agentResponse: '',
    finalOutput: 'The ethical landscape of healthcare AI involves multiple stakeholders...',
    totalDuration: 5.2,
  },
  {
    id: '3',
    input: 'Evaluate the market readiness of fusion energy technology',
    timestamp: new Date(Date.now() - 86400000),
    dimensions: [],
    agentResponse: '',
    finalOutput: 'Fusion energy technology has reached several milestones...',
    totalDuration: 3.9,
  },
];
