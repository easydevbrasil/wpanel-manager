import { RotateCcw, Smartphone, Tablet, Monitor } from 'lucide-react';
import { useScreenOrientation } from '@/hooks/useScreenOrientation';

interface RotateScreenOverlayProps {
  isVisible: boolean;
}

export function RotateScreenOverlay({ isVisible }: RotateScreenOverlayProps) {
  const { deviceInfo } = useScreenOrientation();

  if (!isVisible) return null;

  // Choose appropriate icon based on device
  const DeviceIcon = deviceInfo.isMobile ? Smartphone : 
                    deviceInfo.isTablet ? Tablet : Monitor;

  const deviceName = deviceInfo.isMobile ? 'celular' :
                    deviceInfo.isTablet ? 'tablet' : 'dispositivo';

  return (
    <div className="fixed inset-0 z-[99999] bg-gradient-to-br from-indigo-700 via-purple-700 to-blue-800 flex items-center justify-center p-4 select-none touch-none">
      <div className="text-center text-white max-w-sm mx-auto">
        {/* Compact animated device icon */}
        <div className="relative mb-6">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-white/20 backdrop-blur-sm border border-white/30 shadow-2xl">
            <DeviceIcon className="w-10 h-10 text-white" />
          </div>
          
          {/* Rotation indicator - more prominent */}
          <div className="absolute -top-1 -right-1 w-8 h-8 bg-yellow-400 rounded-full flex items-center justify-center animate-spin-slow shadow-lg">
            <RotateCcw className="w-4 h-4 text-yellow-900" />
          </div>
        </div>

        {/* Compact main message */}
        <h1 className="text-2xl font-bold mb-3 animate-fade-in">
          🔄 Rotacione para Continuar
        </h1>
        
        <p className="text-base text-white/90 mb-4 leading-snug">
          O <span className="font-bold text-yellow-300">wPanel</span> requer modo{' '}
          <span className="font-bold text-green-300">paisagem</span>
        </p>

        {/* Simplified instructions */}
        <div className="space-y-2 text-white/80 text-sm mb-6">
          <div className="flex items-center gap-3 justify-center">
            <span className="text-2xl">📱</span>
            <span>Gire seu {deviceName} para o lado</span>
          </div>
          
          {deviceInfo.isMobile && (
            <div className="flex items-center gap-3 justify-center">
              <span className="text-lg">⚙️</span>
              <span className="text-xs">Ative a rotação automática se necessário</span>
            </div>
          )}
        </div>

        {/* Pulsing continue indicator */}
        <div className="animate-pulse">
          <div className="w-16 h-16 mx-auto rounded-full bg-green-500/20 border-2 border-green-400 flex items-center justify-center">
            <div className="w-8 h-8 rounded-full bg-green-400 flex items-center justify-center">
              <span className="text-green-900 font-bold text-sm">↻</span>
            </div>
          </div>
          <p className="text-xs text-green-300 mt-2">Automático após rotação</p>
        </div>

        {/* Install PWA hint for supported devices */}
        {(deviceInfo.isMobile || deviceInfo.isTablet) && (
          <div className="mt-6 p-3 bg-blue-600/30 rounded-lg border border-blue-400/30">
            <p className="text-xs text-blue-200">
              💡 <strong>Dica:</strong> Instale como app para melhor experiência!
            </p>
          </div>
        )}
      </div>

      {/* Subtle background pattern */}
      <div className="absolute inset-0 opacity-5 pointer-events-none">
        <div className="absolute inset-0" style={{
          backgroundImage: `repeating-linear-gradient(
            45deg,
            transparent,
            transparent 35px,
            rgba(255,255,255,0.1) 35px,
            rgba(255,255,255,0.1) 70px
          )`,
        }} />
      </div>

      {/* Lock indicator - show this is mandatory */}
      <div className="absolute top-4 right-4 w-8 h-8 bg-red-500 rounded-full flex items-center justify-center shadow-lg animate-pulse">
        <span className="text-white text-sm font-bold">🔒</span>
      </div>
    </div>
  );
}