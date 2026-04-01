import { Brain, LayoutDashboard, Clock, Settings, RotateCcw, ChevronLeft, ChevronRight } from 'lucide-react';
import { AppConfig, Dimension } from '@/lib/types';
import { MODELS, FUSION_STRATEGIES, DEFAULT_CONFIG, DEFAULT_DIMENSIONS } from '@/lib/mock-data';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { useState } from 'react';

interface Props {
  config: AppConfig;
  onConfigChange: (config: AppConfig) => void;
  dimensions: Dimension[];
  onDimensionsChange: (dims: Dimension[]) => void;
  activeNav: string;
  onNavChange: (nav: string) => void;
}

const NAV_ITEMS = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'history', label: 'History', icon: Clock },
  { id: 'settings', label: 'Settings', icon: Settings },
];

export function ConfigSidebar({ config, onConfigChange, dimensions, onDimensionsChange, activeNav, onNavChange }: Props) {
  const [collapsed, setCollapsed] = useState(false);

  const update = (partial: Partial<AppConfig>) => onConfigChange({ ...config, ...partial });

  const toggleDimension = (id: string) => {
    const updated = dimensions.map(d => d.id === id ? { ...d, enabled: !d.enabled } : d);
    onDimensionsChange(updated);
    update({ enabledDimensions: updated.filter(d => d.enabled).map(d => d.id) });
  };

  return (
    <aside className={`relative flex flex-col border-r border-border bg-card transition-all duration-300 ${collapsed ? 'w-16' : 'w-72'} shrink-0`}>
      {/* Logo */}
      <div className="flex items-center gap-3 px-4 h-16 border-b border-border">
        <div className="w-8 h-8 rounded-lg gradient-bg flex items-center justify-center shrink-0">
          <Brain className="w-4 h-4 text-primary-foreground" />
        </div>
        {!collapsed && <span className="font-bold text-lg gradient-text">DimenSys AI</span>}
      </div>

      {/* Collapse toggle */}
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="absolute -right-3 top-20 z-10 w-6 h-6 rounded-full bg-card border border-border flex items-center justify-center hover:bg-muted transition-colors"
      >
        {collapsed ? <ChevronRight className="w-3 h-3" /> : <ChevronLeft className="w-3 h-3" />}
      </button>

      <div className="flex-1 overflow-y-auto scrollbar-thin">
        {/* Navigation */}
        <nav className="p-2 space-y-1">
          {NAV_ITEMS.map(item => (
            <Tooltip key={item.id} delayDuration={collapsed ? 100 : 1000}>
              <TooltipTrigger asChild>
                <button
                  onClick={() => onNavChange(item.id)}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all
                    ${activeNav === item.id
                      ? 'bg-primary/10 text-primary font-medium'
                      : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                    }`}
                >
                  <item.icon className="w-4 h-4 shrink-0" />
                  {!collapsed && <span>{item.label}</span>}
                </button>
              </TooltipTrigger>
              {collapsed && <TooltipContent side="right">{item.label}</TooltipContent>}
            </Tooltip>
          ))}
        </nav>

        {!collapsed && (
          <div className="px-4 pb-4 space-y-5">
            <div className="h-px bg-border" />

            {/* Config File */}
            <div className="space-y-2">
              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Config File</label>
              <Select value={config.configFile} onValueChange={v => update({ configFile: v })}>
                <SelectTrigger className="h-9 text-sm"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="default.yaml">default.yaml</SelectItem>
                  <SelectItem value="production.yaml">production.yaml</SelectItem>
                  <SelectItem value="debug.yaml">debug.yaml</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Toggles */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-sm">Parallel Execution</label>
                <Switch checked={config.parallelExecution} onCheckedChange={v => update({ parallelExecution: v })} />
              </div>
              <div className="flex items-center justify-between">
                <label className="text-sm">Debug Mode</label>
                <Switch checked={config.debugMode} onCheckedChange={v => update({ debugMode: v })} />
              </div>
            </div>

            {/* Model */}
            <div className="space-y-2">
              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Model</label>
              <Select value={config.model} onValueChange={v => update({ model: v })}>
                <SelectTrigger className="h-9 text-sm"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {MODELS.map(m => <SelectItem key={m} value={m}>{m.split('/')[1]}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>

            {/* Fusion Strategy */}
            <div className="space-y-2">
              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Fusion Strategy</label>
              <Select value={config.fusionStrategy} onValueChange={v => update({ fusionStrategy: v })}>
                <SelectTrigger className="h-9 text-sm"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {FUSION_STRATEGIES.map(f => <SelectItem key={f} value={f}>{f}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>

            {/* Dimensions */}
            <div className="space-y-2">
              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Dimensions</label>
              <div className="space-y-2">
                {dimensions.map(dim => (
                  <Tooltip key={dim.id} delayDuration={300}>
                    <TooltipTrigger asChild>
                      <div className="flex items-center justify-between py-1">
                        <span className="text-sm flex items-center gap-2">
                          <span>{dim.icon}</span>
                          {dim.name}
                        </span>
                        <Switch checked={dim.enabled} onCheckedChange={() => toggleDimension(dim.id)} />
                      </div>
                    </TooltipTrigger>
                    <TooltipContent side="right" className="max-w-xs">{dim.description}</TooltipContent>
                  </Tooltip>
                ))}
              </div>
            </div>

            {/* Reset */}
            <Button
              variant="outline"
              size="sm"
              className="w-full"
              onClick={() => {
                onConfigChange(DEFAULT_CONFIG);
                onDimensionsChange(DEFAULT_DIMENSIONS);
              }}
            >
              <RotateCcw className="w-3.5 h-3.5 mr-2" />
              Reset to Default
            </Button>
          </div>
        )}
      </div>
    </aside>
  );
}
