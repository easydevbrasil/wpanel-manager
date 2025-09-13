import { useState, useEffect } from 'react';
import { useWebSocket, type WebSocketStatus } from '@/hooks/use-websocket';
import { Zap, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { TunnelAnimation } from './TunnelAnimation';

const statusConfig = {
  connecting: {
    color: 'bg-yellow-500',
    textColor: 'text-yellow-500',
    label: 'Conectando...',
    animate: true
  },
  connected: {
    color: 'bg-green-500',
    textColor: 'text-green-500',
    label: 'Conectado',
    animate: false
  },
  disconnected: {
    color: 'bg-red-500',
    textColor: 'text-red-500',
    label: 'Desconectado',
    animate: false
  },
  error: {
    color: 'bg-red-600',
    textColor: 'text-red-600',
    label: 'Erro de conexão',
    animate: false
  }
};

function formatDuration(startTime: Date): string {
  const now = new Date();
  const diff = Math.floor((now.getTime() - startTime.getTime()) / 1000);
  
  if (diff < 60) return `${diff}s`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ${diff % 60}s`;
  return `${Math.floor(diff / 3600)}h ${Math.floor((diff % 3600) / 60)}m`;
}

function truncateText(text: string, maxLength: number = 30): string {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength) + '...';
}

export function WebSocketIndicator() {
  const [showDetails, setShowDetails] = useState(false);
  const [connectionTime, setConnectionTime] = useState<string>('');
  const { status, connect, lastMessage, connectedAt, isConnected, isTransmitting } = useWebSocket();
  const config = statusConfig[status];

  // Update connection time every second
  useEffect(() => {
    if (!connectedAt || !isConnected) {
      setConnectionTime('');
      return;
    }

    const interval = setInterval(() => {
      setConnectionTime(formatDuration(connectedAt));
    }, 1000);

    return () => clearInterval(interval);
  }, [connectedAt, isConnected]);

  const toggleDetails = () => {
    setShowDetails(!showDetails);
  };

  return (
    <div className="fixed bottom-4 right-4 z-50">
      {/* Details Panel */}
      {showDetails && (
        <div className="mb-2 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 p-4 w-80">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-foreground">Detalhes WebSocket</h3>
            <button
              onClick={toggleDetails}
              className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          
          <div className="space-y-2 text-sm">
            <div className="flex justify-between items-center">
              <span className="text-gray-600 dark:text-gray-400 flex-shrink-0">Status:</span>
              <span className={cn("font-medium text-right", config.textColor)}>{config.label}</span>
            </div>
            
            <div className="flex justify-between items-center">
              <span className="text-gray-600 dark:text-gray-400 flex-shrink-0">Conectado:</span>
              <span className="font-medium text-right">{isConnected ? 'Sim' : 'Não'}</span>
            </div>
            
            {connectionTime && (
              <div className="flex justify-between items-center">
                <span className="text-gray-600 dark:text-gray-400 flex-shrink-0">Tempo:</span>
                <span className="font-medium text-right">{connectionTime}</span>
              </div>
            )}
            
            <div className="flex justify-between items-start gap-2">
              <span className="text-gray-600 dark:text-gray-400 flex-shrink-0">URL:</span>
              <span className="font-mono text-xs text-right break-all">
                {truncateText(`${window.location.protocol === "https:" ? "wss:" : "ws:"}//${window.location.host}/ws`, 25)}
              </span>
            </div>

            {/* Tunnel Animation */}
            {isConnected && (
              <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-600">
                <div className="text-gray-600 dark:text-gray-400 mb-2 text-center">Transmissão de Dados</div>
                <TunnelAnimation isActive={isTransmitting} className="h-8 w-full" />
                <div className="text-xs text-center mt-1 text-gray-500 dark:text-gray-400">
                  {isTransmitting ? 'Enviando dados...' : 'Aguardando...'}
                </div>
              </div>
            )}
            
            {lastMessage && (
              <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-600">
                <div className="text-gray-600 dark:text-gray-400 mb-2">Última mensagem:</div>
                <div className="font-mono text-xs bg-gray-100 dark:bg-gray-700 p-2 rounded space-y-1">
                  <div className="flex justify-between">
                    <strong>Tipo:</strong> 
                    <span className="text-right">{truncateText(lastMessage.type, 15)}</span>
                  </div>
                  <div className="flex justify-between">
                    <strong>Hora:</strong> 
                    <span className="text-right">{new Date(lastMessage.timestamp).toLocaleTimeString()}</span>
                  </div>
                  {lastMessage.data && (
                    <div>
                      <strong>Dados:</strong>
                      <div className="mt-1 p-1 bg-gray-200 dark:bg-gray-600 rounded text-xs break-all">
                        {truncateText(JSON.stringify(lastMessage.data), 80)}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
            
            {(status === 'disconnected' || status === 'error') && (
              <button
                onClick={() => connect()}
                className="w-full mt-3 text-xs bg-blue-500 hover:bg-blue-600 text-white px-3 py-2 rounded transition-colors"
              >
                Reconectar
              </button>
            )}
          </div>
        </div>
      )}

      {/* Main Indicator */}
      <button
        onClick={toggleDetails}
        className={cn(
          "w-12 h-12 rounded-full shadow-lg border-2 border-white dark:border-gray-800 hover:scale-110 transition-all duration-200",
          config.color,
          config.animate && "animate-pulse"
        )}
      >
        {/* Bolt Icon */}
        <Zap className="w-6 h-6 text-white mx-auto" />
      </button>
    </div>
  );
}