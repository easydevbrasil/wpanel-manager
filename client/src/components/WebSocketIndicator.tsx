import { useState } from 'react';
import { useWebSocket, type WebSocketStatus } from '@/hooks/use-websocket';
import { Zap, X } from 'lucide-react';
import { cn } from '@/lib/utils';

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

export function WebSocketIndicator() {
  const [showDetails, setShowDetails] = useState(false);
  const { status, connect, lastMessage, isConnected } = useWebSocket();
  const config = statusConfig[status];

  const toggleDetails = () => {
    setShowDetails(!showDetails);
  };

  return (
    <div className="fixed bottom-4 right-4 z-50">
      {/* Details Panel */}
      {showDetails && (
        <div className="mb-2 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 p-4 w-80">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-gray-900 dark:text-white">Detalhes WebSocket</h3>
            <button
              onClick={toggleDetails}
              className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600 dark:text-gray-400">Status:</span>
              <span className={cn("font-medium", config.textColor)}>{config.label}</span>
            </div>
            
            <div className="flex justify-between">
              <span className="text-gray-600 dark:text-gray-400">Conectado:</span>
              <span className="font-medium">{isConnected ? 'Sim' : 'Não'}</span>
            </div>
            
            <div className="flex justify-between">
              <span className="text-gray-600 dark:text-gray-400">URL:</span>
              <span className="font-mono text-xs">
                {window.location.protocol === "https:" ? "wss:" : "ws:"}//{window.location.host}/ws
              </span>
            </div>
            
            {lastMessage && (
              <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-600">
                <div className="text-gray-600 dark:text-gray-400 mb-1">Última mensagem:</div>
                <div className="font-mono text-xs bg-gray-100 dark:bg-gray-700 p-2 rounded">
                  <div><strong>Tipo:</strong> {lastMessage.type}</div>
                  <div><strong>Hora:</strong> {new Date(lastMessage.timestamp).toLocaleTimeString()}</div>
                  {lastMessage.data && (
                    <div><strong>Dados:</strong> {JSON.stringify(lastMessage.data, null, 2).substring(0, 100)}...</div>
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
        className="flex items-center gap-2 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 p-2 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
      >
        {/* Status Indicator Dot */}
        <div className="relative">
          <div 
            className={cn(
              "w-2 h-2 rounded-full",
              config.color
            )}
          />
          {status === 'connected' && (
            <div className={cn(
              "absolute inset-0 w-2 h-2 rounded-full animate-ping",
              config.color,
              "opacity-75"
            )} />
          )}
        </div>

        {/* Bolt Icon */}
        <Zap 
          className={cn(
            "w-4 h-4",
            config.textColor,
            config.animate && "animate-pulse"
          )} 
        />
      </button>
    </div>
  );
}