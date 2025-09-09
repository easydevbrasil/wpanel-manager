import { useState, useEffect, useRef } from 'react';

export interface SystemStats {
  cpu: {
    usage: number;
    threshold: {
      warning: boolean;
      danger: boolean;
    };
  };
  memory: {
    usage: number;
    used: number;
    total: number;
    threshold: {
      warning: boolean;
      danger: boolean;
    };
  };
  disk: {
    usage: number;
    used: number;
    total: number;
    threshold: {
      warning: boolean;
      danger: boolean;
    };
  };
  timestamp: string;
}

export interface AlertState {
  cpu: { warning: boolean; danger: boolean };
  memory: { warning: boolean; danger: boolean };
  disk: { warning: boolean; danger: boolean };
}

export function useSystemMonitoring(intervalMs: number = 5000) {
  const [stats, setStats] = useState<SystemStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [previousAlerts, setPreviousAlerts] = useState<AlertState>({
    cpu: { warning: false, danger: false },
    memory: { warning: false, danger: false },
    disk: { warning: false, danger: false }
  });
  const [newAlerts, setNewAlerts] = useState<{
    type: 'cpu' | 'memory' | 'disk';
    level: 'warning' | 'danger';
    usage: number;
  }[]>([]);
  
  const intervalRef = useRef<NodeJS.Timeout>();

  const fetchStats = async () => {
    try {
      const response = await fetch('/api/system/stats');
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data: SystemStats = await response.json();
      
      // Check for new alerts
      const currentAlerts: AlertState = {
        cpu: { 
          warning: data.cpu.threshold.warning, 
          danger: data.cpu.threshold.danger 
        },
        memory: { 
          warning: data.memory.threshold.warning, 
          danger: data.memory.threshold.danger 
        },
        disk: { 
          warning: data.disk.threshold.warning, 
          danger: data.disk.threshold.danger 
        }
      };

      // Detect new alerts (only trigger if wasn't alerting before)
      const alerts: typeof newAlerts = [];
      
      // CPU alerts
      if (currentAlerts.cpu.danger && !previousAlerts.cpu.danger) {
        alerts.push({ type: 'cpu', level: 'danger', usage: data.cpu.usage });
      } else if (currentAlerts.cpu.warning && !previousAlerts.cpu.warning && !currentAlerts.cpu.danger) {
        alerts.push({ type: 'cpu', level: 'warning', usage: data.cpu.usage });
      }
      
      // Memory alerts
      if (currentAlerts.memory.danger && !previousAlerts.memory.danger) {
        alerts.push({ type: 'memory', level: 'danger', usage: data.memory.usage });
      } else if (currentAlerts.memory.warning && !previousAlerts.memory.warning && !currentAlerts.memory.danger) {
        alerts.push({ type: 'memory', level: 'warning', usage: data.memory.usage });
      }
      
      // Disk alerts
      if (currentAlerts.disk.danger && !previousAlerts.disk.danger) {
        alerts.push({ type: 'disk', level: 'danger', usage: data.disk.usage });
      } else if (currentAlerts.disk.warning && !previousAlerts.disk.warning && !currentAlerts.disk.danger) {
        alerts.push({ type: 'disk', level: 'warning', usage: data.disk.usage });
      }

      if (alerts.length > 0) {
        setNewAlerts(alerts);
      }

      setPreviousAlerts(currentAlerts);
      setStats(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch system stats');
      console.error('Error fetching system stats:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const clearAlerts = () => {
    setNewAlerts([]);
  };

  useEffect(() => {
    // Initial fetch
    fetchStats();
    
    // Set up interval
    intervalRef.current = setInterval(fetchStats, intervalMs);
    
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [intervalMs]);

  return {
    stats,
    isLoading,
    error,
    newAlerts,
    clearAlerts,
    refetch: fetchStats
  };
}
