import { RotateCcw, Smartphone, Tablet, Monitor } from 'lucide-react';
import { Button } from '@/components/ui/button';
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
    <div className="fixed inset-0 z-[9999] bg-gradient-to-br from-indigo-600 via-purple-600 to-blue-700 flex items-center justify-center p-6">
      <div className="text-center text-white max-w-md mx-auto">
        {/* Animated Device Icon */}
        <div className="relative mb-8">
          <div className="inline-flex items-center justify-center w-32 h-32 rounded-full bg-white/20 backdrop-blur-sm border border-white/30">
            <DeviceIcon className="w-16 h-16 text-white animate-pulse" />
          </div>
          
          {/* Rotation Indicator */}
          <div className="absolute -top-2 -right-2 w-12 h-12 bg-white/30 rounded-full flex items-center justify-center animate-spin-slow">
            <RotateCcw className="w-6 h-6 text-white" />
          </div>
          
          {/* Curved Arrow Animation */}
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
            <div className="w-40 h-40 border-2 border-dashed border-white/40 rounded-full animate-spin-slower relative">
              <div className="absolute -top-2 left-1/2 transform -translate-x-1/2">
                <div className="w-0 h-0 border-l-4 border-r-4 border-b-8 border-l-transparent border-r-transparent border-b-white/60"></div>
              </div>
            </div>
          </div>
        </div>

        {/* Main Message */}
        <h1 className="text-3xl font-bold mb-4 animate-fade-in">
          Rotacione seu {deviceName}
        </h1>
        
        <p className="text-lg text-white/90 mb-6 leading-relaxed">
          Para uma melhor experiência, utilize o{' '}
          <span className="font-semibold text-yellow-300">wPanel</span> em modo{' '}
          <span className="font-semibold">paisagem</span> (horizontal).
        </p>

        {/* Instructions */}
        <div className="space-y-4 text-white/80">
          <div className="flex items-center gap-3 justify-center">
            <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center text-sm font-bold flex-shrink-0">1</div>
            <span className="text-left">Gire seu {deviceName} para o lado (modo paisagem)</span>
          </div>
          
          <div className="flex items-center gap-3 justify-center">
            <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center text-sm font-bold flex-shrink-0">2</div>
            <span className="text-left">A tela se ajustará automaticamente</span>
          </div>

          {deviceInfo.isMobile && (
            <div className="flex items-center gap-3 justify-center">
              <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center text-sm font-bold flex-shrink-0">💡</div>
              <span className="text-left text-sm">Você pode precisar desbloquear a rotação da tela</span>
            </div>
          )}
        </div>

        {/* Device-specific Tips */}
        <div className="mt-6 p-4 bg-white/10 rounded-lg backdrop-blur-sm border border-white/20">
          <h3 className="font-semibold mb-2 text-yellow-300">
            {deviceInfo.isMobile && '📱 Dica para Celular'}
            {deviceInfo.isTablet && '📱 Dica para Tablet'}
            {deviceInfo.isDesktop && '💻 Tela Pequena Detectada'}
          </h3>
          <p className="text-sm text-white/80">
            {deviceInfo.isMobile && 'Certifique-se de que a rotação automática está ativada nas configurações do seu celular.'}
            {deviceInfo.isTablet && 'Para uma experiência otimizada, use seu tablet na horizontal com apoio.'}
            {deviceInfo.isDesktop && 'Esta tela é muito pequena para a interface completa. Considere usar em modo paisagem ou uma tela maior.'}
          </p>
        </div>

        {/* Skip Button (for debugging or special cases) */}
        <div className="mt-8">
          <Button 
            variant="outline" 
            className="bg-white/10 border-white/30 text-white hover:bg-white/20 backdrop-blur-sm text-sm"
            onClick={() => {
              // Add a temporary override for development/testing
              if (window.confirm('⚠️ Esta ação não é recomendada e pode resultar em uma experiência ruim.\n\nO wPanel foi projetado para telas maiores.\n\nContinuar mesmo assim?')) {
                document.body.classList.add('force-landscape');
              }
            }}
          >
            🚫 Continuar assim mesmo (não recomendado)
          </Button>
        </div>
      </div>

      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-10 pointer-events-none">
        <div className="absolute inset-0" style={{
          backgroundImage: `radial-gradient(circle at 25% 25%, white 2px, transparent 2px),
                           radial-gradient(circle at 75% 75%, white 2px, transparent 2px)`,
          backgroundSize: '50px 50px'
        }} />
      </div>
    </div>
  );
}