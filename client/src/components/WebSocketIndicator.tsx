import { useWebSocket, type WebSocketStatus } from '@/hooks/use-websocket';
import { Wifi, WifiOff, AlertCircle, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

const statusConfig = {
  connecting: {
    icon: Loader2,
    color: 'bg-yellow-500',
    textColor: 'text-yellow-500',
    label: 'Conectando...',
    animate: true
  },
  connected: {
    icon: Wifi,
    color: 'bg-green-500',
    textColor: 'text-green-500',
    label: 'Conectado',
    animate: false
  },
  disconnected: {
    icon: WifiOff,
    color: 'bg-red-500',
    textColor: 'text-red-500',
    label: 'Desconectado',
    animate: false
  },
  error: {
    icon: AlertCircle,
    color: 'bg-red-600',
    textColor: 'text-red-600',
    label: 'Erro de conexão',
    animate: false
  }
};

export function WebSocketIndicator() {
  const { status, connect, disconnect, isConnected } = useWebSocket();
  const config = statusConfig[status];
  const IconComponent = config.icon;

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <div className="flex items-center gap-2 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 px-3 py-2">
        {/* Status Indicator */}
        <div className="relative">
          <div 
            className={cn(
              "w-3 h-3 rounded-full",
              config.color
            )}
          />
          {status === 'connected' && (
            <div className={cn(
              "absolute inset-0 w-3 h-3 rounded-full animate-ping",
              config.color,
              "opacity-75"
            )} />
          )}
        </div>

        {/* Icon */}
        <IconComponent 
          className={cn(
            "w-4 h-4",
            config.textColor,
            config.animate && "animate-spin"
          )} 
        />

        {/* Status Text */}
        <span className={cn(
          "text-xs font-medium",
          config.textColor
        )}>
          {config.label}
        </span>

        {/* Action Button */}
        {(status === 'disconnected' || status === 'error') && (
          <button
            onClick={() => connect()}
            className="ml-2 text-xs bg-blue-500 hover:bg-blue-600 text-white px-2 py-1 rounded transition-colors"
          >
            Reconectar
          </button>
        )}

        {status === 'connected' && (
          <button
            onClick={() => disconnect()}
            className="ml-2 text-xs bg-gray-500 hover:bg-gray-600 text-white px-2 py-1 rounded transition-colors"
          >
            Desconectar
          </button>
        )}
      </div>
    </div>
  );
}