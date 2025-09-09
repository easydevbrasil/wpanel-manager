import { useEffect, useState } from 'react';
import { useSystemMonitoring } from '@/hooks/useSystemMonitoring';
import { useToast } from '@/hooks/use-toast';
import { ToastSounds } from '@/utils/toast-sounds';
import { AlertTriangle, AlertCircle, Cpu, HardDrive, MemoryStick, X } from 'lucide-react';

interface SystemAlertsProps {
  /** Monitoring interval in milliseconds */
  interval?: number;
  /** Whether alerts are enabled */
  enabled?: boolean;
}

interface TopAlert {
  id: string;
  type: 'cpu' | 'memory' | 'disk';
  level: 'warning' | 'danger';
  usage: number;
  timestamp: number;
}

export function SystemAlerts({ interval = 5000, enabled = true }: SystemAlertsProps) {
  const { newAlerts, clearAlerts, stats } = useSystemMonitoring(interval);
  const { toast } = useToast();
  const [topAlerts, setTopAlerts] = useState<TopAlert[]>([]);

  // Auto-dismiss warning alerts after 10 seconds
  useEffect(() => {
    const timer = setInterval(() => {
      setTopAlerts(alerts => 
        alerts.filter(alert => 
          alert.level === 'danger' || (Date.now() - alert.timestamp) < 10000
        )
      );
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  // Check current stats and maintain top alerts - SHOW ONLY 1 MOST CRITICAL
  useEffect(() => {
    if (!stats) return;

    const currentAlerts: TopAlert[] = [];
    
    // Priority order: 1. Danger alerts, 2. Warning alerts
    // Check for danger alerts first (highest priority)
    if (stats.cpu.threshold.danger) {
      currentAlerts.push({
        id: 'cpu-danger',
        type: 'cpu',
        level: 'danger',
        usage: stats.cpu.usage,
        timestamp: Date.now()
      });
    } else if (stats.memory.threshold.danger) {
      currentAlerts.push({
        id: 'memory-danger',
        type: 'memory',
        level: 'danger',
        usage: stats.memory.usage,
        timestamp: Date.now()
      });
    } else if (stats.disk.threshold.danger) {
      currentAlerts.push({
        id: 'disk-danger',
        type: 'disk',
        level: 'danger',
        usage: stats.disk.usage,
        timestamp: Date.now()
      });
    }
    // If no danger alerts, check for warning alerts
    else if (stats.cpu.threshold.warning) {
      currentAlerts.push({
        id: 'cpu-warning',
        type: 'cpu',
        level: 'warning',
        usage: stats.cpu.usage,
        timestamp: Date.now()
      });
    } else if (stats.memory.threshold.warning) {
      currentAlerts.push({
        id: 'memory-warning',
        type: 'memory',
        level: 'warning',
        usage: stats.memory.usage,
        timestamp: Date.now()
      });
    } else if (stats.disk.threshold.warning) {
      currentAlerts.push({
        id: 'disk-warning',
        type: 'disk',
        level: 'warning',
        usage: stats.disk.usage,
        timestamp: Date.now()
      });
    }

    // Update only if there are new alerts or alerts have been resolved
    setTopAlerts(prev => {
      const prevIds = prev.map(a => a.id);
      const currentIds = currentAlerts.map(a => a.id);
      
      if (prevIds.length !== currentIds.length || !prevIds.every(id => currentIds.includes(id))) {
        return currentAlerts;
      }
      
      return prev;
    });
  }, [stats]);

  useEffect(() => {
    if (!enabled || newAlerts.length === 0) return;

    newAlerts.forEach((alert) => {
      const { type, level, usage } = alert;
      
      // Get appropriate icon and resource name
      const getResourceName = () => {
        switch (type) {
          case 'cpu': return 'CPU';
          case 'memory': return 'Memória';
          case 'disk': return 'Armazenamento';
          default: return 'Sistema';
        }
      };

      const isDanger = level === 'danger';
      const resourceName = getResourceName();
      
      // Play appropriate sound
      ToastSounds.playSound(isDanger ? 'monitoring-danger' : 'monitoring-warning');

      // Show toast notification as backup
      toast({
        title: isDanger ? '🚨 ALERTA CRÍTICO' : '⚠️ ALERTA DE SISTEMA',
        description: `${resourceName} em ${isDanger ? 'nível crítico' : 'alta utilização'} - Uso atual: ${usage.toFixed(1)}% ${isDanger ? '(≥90%)' : '(≥80%)'}`,
        variant: isDanger ? 'destructive' : 'default',
        duration: isDanger ? 0 : 6000, // Shorter duration since we have top alerts
        className: `${isDanger ? 'border-red-500 bg-red-50 dark:bg-red-950/50' : 'border-orange-500 bg-orange-50 dark:bg-orange-950/50'} shadow-lg`,
      });
    });

    // Clear alerts after processing
    clearAlerts();
  }, [newAlerts, clearAlerts, toast, enabled]);

  const getIcon = (type: string) => {
    switch (type) {
      case 'cpu': return Cpu;
      case 'memory': return MemoryStick;
      case 'disk': return HardDrive;
      default: return AlertTriangle;
    }
  };

  const getResourceName = (type: string) => {
    switch (type) {
      case 'cpu': return 'CPU';
      case 'memory': return 'Memória';
      case 'disk': return 'Armazenamento';
      default: return 'Sistema';
    }
  };

  const dismissAlert = (alertId: string) => {
    setTopAlerts(alerts => alerts.filter(alert => alert.id !== alertId));
  };

  if (topAlerts.length === 0) return null;

  return (
    <div className="fixed top-0 left-0 right-0 z-[9999] pointer-events-none">
      <div className="flex flex-col gap-1 p-4 pointer-events-auto">
        {topAlerts.map((alert) => {
          const Icon = getIcon(alert.type);
          const resourceName = getResourceName(alert.type);
          const isDanger = alert.level === 'danger';
          
          return (
            <div
              key={alert.id}
              className={`
                flex items-center gap-4 p-6 rounded-xl shadow-2xl border-4 mx-auto max-w-2xl w-full
                ${isDanger 
                  ? 'bg-red-600 border-red-300 text-white shadow-red-600/80' 
                  : 'bg-orange-500 border-orange-200 text-white shadow-orange-500/80'
                }
                animate-pulse transition-all duration-500 transform
              `}
              style={{
                boxShadow: isDanger 
                  ? '0 25px 50px -12px rgba(239, 68, 68, 0.8), 0 0 0 1px rgba(239, 68, 68, 0.5)' 
                  : '0 25px 50px -12px rgba(249, 115, 22, 0.8), 0 0 0 1px rgba(249, 115, 22, 0.5)'
              }}
            >
              <div className="flex items-center gap-4 flex-1">
                {isDanger ? (
                  <AlertCircle className="h-8 w-8 animate-bounce text-red-100" />
                ) : (
                  <AlertTriangle className="h-8 w-8 text-orange-100" />
                )}
                
                <Icon className="h-7 w-7 text-white" />
                
                <div className="flex-1">
                  <div className="font-bold text-lg text-white drop-shadow-lg">
                    {isDanger ? '🚨 ALERTA CRÍTICO' : '⚠️ ALERTA DE SISTEMA'}
                  </div>
                  <div className="text-base text-white font-semibold drop-shadow-md mt-1">
                    {resourceName}: {alert.usage.toFixed(1)}% {isDanger ? '(≥90%)' : '(≥80%)'}
                    {isDanger && ' - Ação imediata necessária!'}
                  </div>
                </div>
              </div>
              
              <button
                onClick={() => dismissAlert(alert.id)}
                className="p-2 hover:bg-white/30 rounded-lg transition-colors bg-black/30 border border-white/20"
                title="Dispensar alerta"
              >
                <X className="h-5 w-5 text-white" />
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default SystemAlerts;
